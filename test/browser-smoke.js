/* Browser-Smoke-Test: die fertige Extension in echten Browsern.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node test/browser-smoke.js chromium    Playwright-Chromium (steht für Chrome, Edge, Brave)
 *   node test/browser-smoke.js firefox     Firefox über Selenium und geckodriver
 *
 * Voraussetzungen:
 *   bash tools/fetch-fixtures.sh            echte Entscheidseiten und Site-CSS nach test/fixtures/
 *   cd test && npm install playwright@1.56.1 && npx playwright install chromium     (Chromium)
 *   cd test && npm install selenium-webdriver                                        (Firefox; Firefox
 *                                           und geckodriver holt Selenium selbst, falls sie fehlen)
 *   openssl im Pfad                         Zertifikat für den lokalen HTTPS-Server
 *
 * Warum nicht die Live-Seiten: search.bger.ch steht hinter einem Bot-Schutz
 * (Imperva), der Headless-Browsern statt des Entscheids eine Captcha-Seite
 * liefert. Deshalb liefert ein lokaler Server die Fixtures unter ihren ECHTEN
 * Hostnamen aus; der Browser wird angewiesen, search.bger.ch und
 * relevancy.bger.ch auf 127.0.0.1 aufzulösen (Chromium: --host-resolver-rules,
 * Firefox: network.dns.localDomains). Die Extension sieht so genau die URLs
 * ihres Manifests. Deterministisch, offline, keine Last auf bger.ch. Einzig
 * bvger.weblaw.ch (React-App, nicht lokal nachstellbar) wird live geladen und
 * bei Nichterreichbarkeit mit Hinweis übersprungen.
 *
 * Geprüft wird, was jsdom nicht kann: Injektion über das Manifest auf der
 * echten URL, Site-CSS-Kaskade, gebündelte Schriften (web_accessible_resources),
 * Speichern über Neuladen, Pop-up-Seite mit Live-Sync (storage.onChanged
 * zwischen zwei echten Kontexten), Zurücksetzen, http-Seite, Druckansicht
 * (Chromium). Screenshots liegen danach in test/smoke/<browser>/ (in der
 * CI als Artefakt "smoke-<os>-<browser>") – anschauen, nicht nur zählen.
 *
 * Hinter einem Proxy (HTTPS_PROXY gesetzt) wird er übernommen; die lokal
 * ausgelieferten Hosts gehen daran vorbei.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const https = require('https');
const { execFileSync } = require('child_process');

const WURZEL = path.join(__dirname, '..');
const EXT = path.join(WURZEL, 'extension');
const FIXTURES = path.join(__dirname, 'fixtures');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));

const BROWSER = process.argv[2];
if (BROWSER !== 'chromium' && BROWSER !== 'firefox') {
  console.error('Aufruf: node test/browser-smoke.js chromium|firefox');
  process.exit(2);
}
const BILDER = path.join(__dirname, 'smoke', BROWSER);

/* Lokale Ports: die Match-Muster des Manifests nennen keinen Port und passen
   deshalb auf jeden – so braucht der Server keine privilegierten Ports 443/80. */
const PORT_HTTPS = 8443;
const PORT_HTTP = 8080;
const LOKALE_HOSTS = ['search.bger.ch', 'relevancy.bger.ch'];
const SEITEN = {
  bge: 'https://search.bger.ch:' + PORT_HTTPS + '/ext/eurospider/live/de/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F152-IV-1%3Ade&lang=de&type=show_document',
  relevancy: 'http://relevancy.bger.ch:' + PORT_HTTP + '/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F152-IV-1%3Ade&lang=de&type=show_document',
  bvger: 'https://bvger.weblaw.ch/cache?guiLanguage=de&id=8cf30437-5df2-4a0f-885e-d44a19472144'
};
// Fest gewählte interne Firefox-UUID, damit moz-extension://<uuid>/popup.html bekannt ist.
const FIREFOX_UUID = '7f4d8a3e-2b1c-4e5f-9a6b-0c1d2e3f4a5b';
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy || '';

let bestanden = 0, fehlgeschlagen = 0;
const warnungen = [];
function pruefe(name, bedingung, detail) {
  if (bedingung) { bestanden++; console.log('  ✅ ' + name); }
  else { fehlgeschlagen++; console.log('  ❌ ' + name + (detail ? ' – ' + detail : '')); }
}
function schlaf(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ================================================================== */
/* LOKALER SERVER: Fixtures unter den echten Hostnamen                  */
/* ================================================================== */

const HOSTS = {
  'search.bger.ch':    { html: 'bger_test.html',      css: 'clir',      absolut: 'https://search.bger.ch/' },
  'relevancy.bger.ch': { html: 'bger_relevancy.html', css: 'relevancy', absolut: 'http://relevancy.bger.ch/' }
};

function zertifikat() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bger-smoke-'));
  const key = path.join(dir, 'key.pem'), cert = path.join(dir, 'cert.pem');
  // Windows-Runner: openssl liegt bei Git for Windows, nicht immer im Pfad.
  const kandidaten = ['openssl',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe', 'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
    'C:\\Program Files\\OpenSSL\\bin\\openssl.exe', 'C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe'];
  let letzter = null;
  for (const bin of kandidaten) {
    try {
      execFileSync(bin, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert,
        '-days', '3650', '-subj', '/CN=bger-reader-smoke'], { stdio: 'pipe' });
      return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
    } catch (e) { letzter = e; }
  }
  throw new Error('openssl nicht gefunden (nötig für den lokalen HTTPS-Server): ' + letzter.message);
}

function antworte(req, res) {
  const host = String(req.headers.host || '').split(':')[0];
  const s = HOSTS[host];
  const pfad = (req.url || '/').split('?')[0];
  if (!s) { res.writeHead(404); res.end(); return; }
  if (/\/index\.php$/.test(pfad)) {
    // Die Seiten sind ISO-8859-1 (wie der Live-Server sie ausliefert): als latin1
    // lesen und schreiben, damit kein Byte verändert wird. Absolute Verweise auf
    // den eigenen Host relativ machen (behalten so den lokalen Port); fremde
    // Skripte (jQuery-CDN) entfernen – die Seite braucht sie hier nicht.
    const html = fs.readFileSync(path.join(FIXTURES, s.html), 'latin1')
      .split(s.absolut).join('/')
      .replace(/<script[^>]*\ssrc="https?:\/\/[^"]*"[^>]*><\/script>/gi, '');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=iso-8859-1' });
    res.end(Buffer.from(html, 'latin1'));
    return;
  }
  const css = /\/css\/([a-z_]+\.css)$/.exec(pfad);
  if (css) {
    const datei = path.join(FIXTURES, 'css', s.css, css[1]);
    if (fs.existsSync(datei)) {
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(fs.readFileSync(datei));
      return;
    }
  }
  res.writeHead(404); res.end();
}

async function serverStarten() {
  const sicher = https.createServer(zertifikat(), antworte);
  const offen = http.createServer(antworte);
  await new Promise(function (r) { sicher.listen(PORT_HTTPS, '127.0.0.1', r); });
  await new Promise(function (r) { offen.listen(PORT_HTTP, '127.0.0.1', r); });
  return { schliessen: function () { sicher.close(); offen.close(); } };
}

/* ================================================================== */
/* BROWSER-ADAPTER: gleiche Schnittstelle für Playwright und Selenium   */
/* ================================================================== */
/* seite.js(quelle, arg): führt eine Funktion (als Quelltext) in der Seite
   aus, Promises werden abgewartet, Rückgabe als JSON-Wert. Alle Prüfungen
   laufen so über denselben Code in beiden Browsern. */

async function chromiumStarten() {
  const { chromium } = require('playwright');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',           // neue Headless-Variante mit Extension-Unterstützung
    executablePath: process.env.BGER_CHROMIUM || undefined,
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,       // selbstsigniertes Zertifikat des lokalen Servers
    args: [
      '--disable-extensions-except=' + EXT,
      '--load-extension=' + EXT,
      '--host-resolver-rules=' + LOKALE_HOSTS.map(function (h) { return 'MAP ' + h + ' 127.0.0.1'; }).join(', ')
    ],
    proxy: PROXY ? { server: PROXY, bypass: LOKALE_HOSTS.join(',') } : undefined
  });
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 20000 });
  const basis = 'chrome-extension://' + new URL(worker.url()).host;

  function seite(page) {
    return {
      oeffne: function (url) { return page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); },
      js: function (quelle, arg) {
        return page.evaluate(new Function('arg', 'return (' + quelle + ')(arg);'), arg === undefined ? null : arg);
      },
      screenshot: function (datei) { return page.screenshot({ path: datei }); },
      groesse: function (b, h) { return page.setViewportSize({ width: b, height: h }); },
      druck: function (an) { return page.emulateMedia({ media: an ? 'print' : null }); },
      schliessen: function () { return page.close(); }
    };
  }
  return {
    name: 'Chromium (Playwright)',
    kannDruck: true,
    hauptseite: seite(await context.newPage()),
    popupSeite: async function () {
      const page = await context.newPage();
      await page.goto(basis + '/popup.html', { waitUntil: 'domcontentloaded' });
      return seite(page);
    },
    schliessen: function () { return context.close(); }
  };
}

async function firefoxStarten() {
  const { Builder } = require('selenium-webdriver');
  const firefox = require('selenium-webdriver/firefox');
  // Chrome-Kontext (privilegiertes Firefox-Skript) nur zum Öffnen der Pop-up-Seite
  // in einem Tab – WebDriver darf moz-extension:// sonst nicht ansteuern (Firefox 138+).
  process.env.MOZ_REMOTE_ALLOW_SYSTEM_ACCESS = '1';
  const options = new firefox.Options().addArguments('-headless');
  options.setPageLoadStrategy('eager'); // DOMContentLoaded genügt, fremde Ressourcen nicht abwarten
  options.setAcceptInsecureCerts(true);
  const uuids = {}; uuids[MANIFEST.browser_specific_settings.gecko.id] = FIREFOX_UUID;
  options.setPreference('extensions.webextensions.uuids', JSON.stringify(uuids));
  options.setPreference('network.dns.localDomains', LOKALE_HOSTS.join(','));
  if (PROXY) {
    const u = new URL(PROXY);
    options.setPreference('network.proxy.type', 1);
    options.setPreference('network.proxy.http', u.hostname);
    options.setPreference('network.proxy.http_port', Number(u.port));
    options.setPreference('network.proxy.ssl', u.hostname);
    options.setPreference('network.proxy.ssl_port', Number(u.port));
    options.setPreference('network.proxy.no_proxies_on', LOKALE_HOSTS.concat(['localhost', '127.0.0.1']).join(','));
  } else {
    options.setPreference('network.proxy.type', 0);
  }
  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
  await driver.manage().setTimeouts({ script: 60000, pageLoad: 60000 });
  await driver.manage().window().setRect({ width: 1280, height: 900 });
  await driver.installAddon(EXT, true); // temporär, unsigniert – wie „Load Temporary Add-on"
  const basis = 'moz-extension://' + FIREFOX_UUID;
  const hauptHandle = await driver.getWindowHandle();

  function seite(handle) {
    async function hin() { await driver.switchTo().window(handle); }
    return {
      oeffne: async function (url) { await hin(); await driver.get(url); },
      js: async function (quelle, arg) {
        await hin();
        const r = await driver.executeAsyncScript(
          'const fertig = arguments[arguments.length - 1]; const arg = arguments[0];' +
          'Promise.resolve().then(function () { return (' + quelle + ')(arg); })' +
          '.then(function (w) { fertig(w === undefined ? null : w); }, function (e) { fertig({ __fehler: String(e) }); });',
          arg === undefined ? null : arg);
        if (r && r.__fehler) throw new Error('Seiten-Skript: ' + r.__fehler);
        return r;
      },
      screenshot: async function (datei) { await hin(); fs.writeFileSync(datei, Buffer.from(await driver.takeScreenshot(), 'base64')); },
      groesse: async function (b, h) { await hin(); await driver.manage().window().setRect({ width: b, height: h }); },
      druck: async function () { /* nicht steuerbar über WebDriver */ },
      schliessen: async function () { await hin(); await driver.close(); await driver.switchTo().window(hauptHandle); }
    };
  }
  return {
    name: 'Firefox (Selenium)',
    kannDruck: false,
    hauptseite: seite(hauptHandle),
    popupSeite: async function () {
      const vorher = await driver.getAllWindowHandles();
      try {
        await driver.setContext(firefox.Context.CHROME);
        await driver.executeScript(
          'gBrowser.selectedTab = gBrowser.addTab(arguments[0], { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });',
          basis + '/popup.html');
      } catch (e) {
        warnungen.push('Pop-up-Seite in Firefox nicht zu öffnen (' + e.message.slice(0, 80) + ')');
        await driver.setContext(firefox.Context.CONTENT);
        return null;
      }
      await driver.setContext(firefox.Context.CONTENT);
      const handle = (await driver.getAllWindowHandles()).filter(function (h) { return vorher.indexOf(h) === -1; })[0];
      return handle ? seite(handle) : null;
    },
    schliessen: function () { return driver.quit(); }
  };
}

/* ================================================================== */
/* PRÜFUNGEN (laufen in beiden Browsern identisch)                      */
/* ================================================================== */

/* Seiten-Funktionen als Quelltext (siehe seite.js). */
const Q = {
  host: `function () { const h = document.getElementById('bkl-panel-host'); return !!(h && h.shadowRoot); }`,
  status: `function () {
    const s = document.getElementById('bkl-panel-host').shadowRoot;
    const html = document.documentElement, absatz = document.querySelector('div.paraatf');
    return {
      paraatf: document.querySelectorAll('div.paraatf').length,
      aktiv: html.classList.contains('bkl-aktiv'),
      folds: document.querySelectorAll('.bkl-fold').length,
      panelOffen: !s.getElementById('bkl-panel').hidden,
      font: html.style.getPropertyValue('--bkl-font'),
      size: html.style.getPropertyValue('--bkl-size'),
      absatzSize: absatz ? getComputedStyle(absatz).fontSize : null,
      htmlBg: getComputedStyle(html).backgroundColor,
      ua: navigator.userAgent
    };
  }`,
  panelKlick: `function (id) { document.getElementById('bkl-panel-host').shadowRoot.getElementById(id).click(); }`,
  panelWert: `function (a) {
    const el = document.getElementById('bkl-panel-host').shadowRoot.getElementById(a.id);
    el.value = a.wert; el.dispatchEvent(new Event(a.ereignis, { bubbles: true }));
  }`,
  foldZustand: `function () {
    const f = document.querySelector('.bkl-fold'); if (!f) return null;
    return { inhalt: getComputedStyle(f.querySelector('.bkl-fold-content')).display,
             knopf: getComputedStyle(f.querySelector('.bkl-toggle')).display };
  }`,
  foldKlick: `function () { document.querySelector('.bkl-fold .bkl-toggle').click(); }`,
  // Fokus wegnehmen: nach dem synthetischen Klick läge er auf dem Schliessen-Knopf,
  // dessen Tooltip sonst im Screenshot erscheint.
  fokusWeg: `function () { const s = document.getElementById('bkl-panel-host').shadowRoot; if (s.activeElement) s.activeElement.blur(); }`,
  schrift: `function (familie) {
    return document.fonts.load('16px "' + familie + '"').then(function (faces) {
      return { anzahl: faces.length, geladen: faces.every(function (f) { return f.status === 'loaded'; }) };
    });
  }`,
  gespeichert: `function () {
    const html = document.documentElement;
    return html.classList.contains('bkl-aktiv') &&
      /Atkinson/.test(html.style.getPropertyValue('--bkl-font')) &&
      html.style.getPropertyValue('--bkl-bg') === '#2b1518' &&
      document.querySelectorAll('.bkl-fold').length > 0;
  }`,
  zustandKurz: `function () { const html = document.documentElement; return { aktiv: html.classList.contains('bkl-aktiv'),
    font: html.style.getPropertyValue('--bkl-font').slice(0, 12), bg: html.style.getPropertyValue('--bkl-bg'), folds: document.querySelectorAll('.bkl-fold').length }; }`,
  popupStatus: `function () { return {
    farbe: document.getElementById('bkl-farbe').value, aktiv: document.getElementById('bkl-aktiv').checked,
    groesse: document.getElementById('bkl-groesse').value, elemente: document.querySelectorAll('input, select, button').length }; }`,
  popupWert: `function (a) { const el = document.getElementById(a.id); el.value = a.wert; el.dispatchEvent(new Event(a.ereignis, { bubbles: true })); }`,
  popupKlick: `function (id) { document.getElementById(id).click(); }`,
  size30: `function () { return document.documentElement.style.getPropertyValue('--bkl-size') === '30px'; }`,
  zurueckgesetzt: `function () { return !document.documentElement.classList.contains('bkl-aktiv') && document.querySelectorAll('.bkl-fold').length === 0; }`,
  // Die App liefert den Entscheid in Etappen; erst der vollständige Text zählt.
  bvgerText: `function () { const b = document.querySelector('.bkl-text'); return !!b && b.querySelectorAll('p').length > 100; }`,
  bvgerStatus: `function () { const b = document.querySelector('.bkl-text'); return {
    text: !!b, p: b ? b.querySelectorAll('p').length : 0, folds: document.querySelectorAll('.bkl-fold').length }; }`
};

async function warteBis(seite, quelle, arg, ms) {
  const ende = Date.now() + ms;
  for (;;) {
    let wert = false;
    try { wert = await seite.js(quelle, arg); } catch (e) { /* Seite lädt noch */ }
    if (wert) return true;
    if (Date.now() > ende) return false;
    await schlaf(250);
  }
}

// Panel öffnen und Lesemodus einschalten, falls er aus ist (Häkchen ist ein Umschalter).
async function einschalten(seite) {
  const st = await seite.js(Q.status);
  if (!st.panelOffen) await seite.js(Q.panelKlick, 'bkl-button');
  if (!st.aktiv) await seite.js(Q.panelKlick, 'bkl-aktiv');
  await schlaf(300);
  return seite.js(Q.status);
}

(async function () {
  ['bger_test.html', 'bger_relevancy.html'].forEach(function (f) {
    if (!fs.existsSync(path.join(FIXTURES, f))) {
      console.error('Fixture fehlt: test/fixtures/' + f + ' – zuerst: bash tools/fetch-fixtures.sh');
      process.exit(2);
    }
  });
  if (!fs.existsSync(path.join(FIXTURES, 'css', 'clir', 'master.css'))) {
    warnungen.push('Site-CSS fehlt (bash tools/fetch-fixtures.sh) – Seiten erscheinen ungestylt');
  }
  fs.rmSync(BILDER, { recursive: true, force: true });
  fs.mkdirSync(BILDER, { recursive: true });

  const server = await serverStarten();
  const b = BROWSER === 'chromium' ? await chromiumStarten() : await firefoxStarten();
  const s = b.hauptseite;
  try {
    console.log('\n[1] search.bger.ch – BGE 152 IV 1 (lokal ausgeliefert) – ' + b.name);
    await s.oeffne(SEITEN.bge);
    pruefe('Content-Skript läuft (Panel-Host mit Shadow DOM)', await warteBis(s, Q.host, null, 15000));
    let st = await s.js(Q.status);
    console.log('  Browser: ' + st.ua);
    pruefe('Entscheidabsätze da, Lesemodus anfangs aus, keine Folds',
      st.paraatf > 20 && !st.aktiv && st.folds === 0, JSON.stringify(st));
    st = await einschalten(s);
    pruefe('Panel offen, Lesemodus an, Klammern eingeklappt, Absätze 18px trotz Site-CSS',
      st.panelOffen && st.aktiv && st.folds > 0 && st.absatzSize === '18px', JSON.stringify(st));
    const zu = await s.js(Q.foldZustand);
    await s.js(Q.foldKlick);
    const auf = await s.js(Q.foldZustand);
    pruefe('Klammer: Inhalt verborgen, Klick auf den Pfeil zeigt ihn',
      !!zu && zu.inhalt === 'none' && !!auf && auf.inhalt === 'inline', JSON.stringify([zu, auf]));
    await s.js(Q.fokusWeg);
    await s.screenshot(path.join(BILDER, 'bge-hell.png'));

    console.log('\n[2] Schriftart und Farbschema');
    await s.js(Q.panelWert, { id: 'bkl-art', wert: 'atkinson', ereignis: 'change' });
    await s.js(Q.panelWert, { id: 'bkl-farbe', wert: 'nacht', ereignis: 'change' });
    const schrift = await s.js(Q.schrift, 'Atkinson Hyperlegible Next');
    st = await s.js(Q.status);
    pruefe('Atkinson Hyperlegible aus dem Paket geladen (web_accessible_resources)',
      schrift.anzahl > 0 && schrift.geladen, JSON.stringify(schrift));
    pruefe('Nacht: <html> #2b1518, Schriftstapel beginnt mit Atkinson',
      st.htmlBg === 'rgb(43, 21, 24)' && /^"Atkinson/.test(st.font), JSON.stringify(st));
    await s.js(Q.fokusWeg);
    await s.screenshot(path.join(BILDER, 'bge-nacht-atkinson.png'));

    console.log('\n[3] Speichern über Neuladen');
    await s.oeffne(SEITEN.bge);
    const gespeichert = await warteBis(s, Q.gespeichert, null, 15000);
    pruefe('nach Neuladen: Lesemodus an, Atkinson, Nacht, Klammern eingeklappt', gespeichert,
      JSON.stringify(await s.js(Q.zustandKurz)));

    console.log('\n[4] Pop-up-Seite und Live-Sync mit der Entscheidseite');
    const popup = await b.popupSeite();
    if (!popup) {
      console.log('  ⚠️  Pop-up-Seite nicht automatisierbar, übersprungen.');
    } else {
      const geladen = await warteBis(popup, `function () { return document.getElementById('bkl-farbe').value === 'nacht'; }`, null, 10000);
      const ps = await popup.js(Q.popupStatus);
      pruefe('Pop-up zeigt den gespeicherten Stand (Nacht, aktiv, alle Bedienelemente)',
        geladen && ps.aktiv && ps.groesse === '18' && ps.elemente >= 18, JSON.stringify(ps));
      await popup.js(Q.popupWert, { id: 'bkl-groesse', wert: '30', ereignis: 'input' });
      pruefe('Regler im Pop-up: Entscheidseite folgt live (30px)', await warteBis(s, Q.size30, null, 10000));
      await popup.groesse(660, 860);
      await popup.screenshot(path.join(BILDER, 'popup.png'));
      await popup.js(Q.popupKlick, 'bkl-reset');
      pruefe('Zurücksetzen im Pop-up: Seite Lesemodus aus, Folds weg', await warteBis(s, Q.zurueckgesetzt, null, 10000));
      await popup.schliessen();
    }

    console.log('\n[5] relevancy.bger.ch (http, lokal ausgeliefert)');
    await s.oeffne(SEITEN.relevancy);
    pruefe('Content-Skript läuft auf der http-Seite', await warteBis(s, Q.host, null, 15000));
    st = await einschalten(s);
    pruefe('relevancy: Lesemodus an, Klammern eingeklappt', st.aktiv && st.folds > 0, JSON.stringify(st));
    await s.js(Q.fokusWeg);
    await s.screenshot(path.join(BILDER, 'relevancy.png'));

    if (b.kannDruck) {
      console.log('\n[6] Druckansicht');
      await s.druck(true);
      const druck = await s.js(Q.foldZustand);
      pruefe('Druck: Klammerinhalt sichtbar, Pfeil ausgeblendet',
        !!druck && druck.inhalt === 'inline' && druck.knopf === 'none', JSON.stringify(druck));
      await s.druck(false);
    }

    console.log('\n[7] bvger.weblaw.ch (live, React-App – informativ)');
    let bv = null;
    try {
      await s.oeffne(SEITEN.bvger);
      if (await warteBis(s, Q.bvgerText, null, 60000)) {
        await einschalten(s);
        await warteBis(s, `function () { return document.querySelectorAll('.bkl-fold').length > 0; }`, null, 10000);
        bv = await s.js(Q.bvgerStatus);
        await s.screenshot(path.join(BILDER, 'bvger.png'));
      }
    } catch (e) { bv = null; }
    // Nur ein Hinweis, kein Fehlschlag: eine Live-Seite kann sich ändern oder
    // nicht erreichbar sein, das darf kein Release blockieren. Der Fall selbst
    // ist mit der API-Antwort als Fixture in test-runner.js Block [3] und [8] geprüft.
    if (bv && bv.text && bv.p > 50 && bv.folds > 0) console.log('  ✅ bvger: Textblock erkannt, Klammern eingeklappt (' + bv.p + ' Absätze, ' + bv.folds + ' Folds)');
    else warnungen.push('bvger.weblaw.ch: Live-Prüfung ohne Ergebnis (' + (bv ? JSON.stringify(bv) : 'nicht erreichbar oder Entscheid nicht geladen') + ') – Screenshot bvger.png ansehen');
  } finally {
    try { await b.schliessen(); } catch (e) { /* Browser ist schon weg */ }
    server.schliessen();
  }

  console.log('\nScreenshots: ' + BILDER);
  fs.readdirSync(BILDER).forEach(function (f) { console.log('  ' + f); });
  if (warnungen.length) {
    console.log('\nHinweise:');
    warnungen.forEach(function (w) { console.log('  ⚠️  ' + w); });
  }
  console.log('\n========================================');
  console.log(bestanden + ' bestanden, ' + fehlgeschlagen + ' fehlgeschlagen');
  process.exit(fehlgeschlagen ? 1 : 0);
})().catch(function (e) {
  console.error('\n❌ Smoke-Test abgebrochen: ' + (e && e.stack || e));
  process.exit(1);
});

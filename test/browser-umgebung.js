/* Gemeinsame Browser-Umgebung für test/browser-smoke.js und tools/screenshots.js.
 *
 * Zwei Bausteine:
 * 1. Ein lokaler Server liefert die Fixtures (echte Entscheidseiten aus
 *    test/fixtures/) unter ihren ECHTEN Hostnamen aus. Der Browser wird
 *    angewiesen, search.bger.ch und relevancy.bger.ch auf 127.0.0.1
 *    aufzulösen (Chromium/Edge: --host-resolver-rules, Firefox:
 *    network.dns.localDomains). Die Extension sieht so genau die URLs ihres
 *    Manifests. Warum nicht live: search.bger.ch steht hinter einem Bot-Schutz
 *    (Imperva), der Headless-Browsern statt des Entscheids eine Captcha-Seite
 *    liefert. Lokal ist deterministisch, offline und schont bger.ch.
 * 2. Ein einheitlicher Adapter: Chromium und Edge über Playwright, Firefox
 *    über Selenium/geckodriver. seite.js(quelle, arg) führt eine Funktion
 *    (als Quelltext) in der Seite aus – Prüfungen und Screenshots laufen so
 *    über denselben Code in allen Browsern.
 *
 * Voraussetzungen: bash tools/fetch-fixtures.sh (Seiten und Site-CSS),
 *   cd test && npm install playwright@1.56.1 && npx playwright install chromium   (Chromium)
 *   cd test && npm install playwright@1.56.1     (Edge: nutzt das installierte Microsoft Edge)
 *   cd test && npm install selenium-webdriver    (Firefox; Firefox und geckodriver holt
 *                                                 Selenium selbst, falls sie fehlen)
 *   openssl im Pfad (Zertifikat für den lokalen HTTPS-Server).
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
const BROWSER_NAMEN = ['chromium', 'firefox', 'edge'];

/* Lokale Ports: die Match-Muster des Manifests nennen keinen Port und passen
   deshalb auf jeden – so braucht der Server keine privilegierten Ports 443/80. */
const PORT_HTTPS = Number(process.env.BGER_PORT_HTTPS) || 8443; // anpassbar, falls belegt
const PORT_HTTP = Number(process.env.BGER_PORT_HTTP) || 8080;
const LOKALE_HOSTS = ['search.bger.ch', 'relevancy.bger.ch'];
/* Beispiel-Entscheid für Smoke-Test und Screenshots: BGE 116 Ia 359, das
   Frauenstimmrecht-Urteil zu Appenzell Innerrhoden von 1990 – ein historischer
   Entscheid, der zeigt, wofür das Werkzeug da ist. (Die jsdom-Suite prüft
   dieselbe Seite; der Server wählt die Datei nach highlight_docid.) */
const SEITEN = {
  bge: 'https://search.bger.ch:' + PORT_HTTPS + '/ext/eurospider/live/de/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F116-IA-359%3Ade&lang=de&type=show_document',
  relevancy: 'http://relevancy.bger.ch:' + PORT_HTTP + '/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F116-IA-359%3Ade&lang=de&type=show_document',
  // BGE 145 I 207 mit französischer Regeste (Pfad live/fr): eine französischsprachige Seite
  bgeFr: 'https://search.bger.ch:' + PORT_HTTPS + '/ext/eurospider/live/fr/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F145-I-207%3Afr&lang=fr&type=show_document',
  bvger: 'https://bvger.weblaw.ch/cache?guiLanguage=de&id=8cf30437-5df2-4a0f-885e-d44a19472144'
};
const ENTSCHEID_NAME = 'BGE 116 Ia 359 (Frauenstimmrecht Appenzell Innerrhoden, 27. November 1990)';
// Fest gewählte interne Firefox-UUID, damit moz-extension://<uuid>/popup.html bekannt ist.
const FIREFOX_UUID = '7f4d8a3e-2b1c-4e5f-9a6b-0c1d2e3f4a5b';
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy || '';
const BREITE = 1280, HOEHE = 800; // Store-Format (Chrome Web Store: genau 1280 x 800)
const HOCH = 2000; // Prüfbilder: ein bis zwei Bildschirmseiten Entscheidtext (STARTPROMPT Regel 10)

function schlaf(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ================================================================== */
/* LOKALER SERVER                                                       */
/* ================================================================== */

const HOSTS = {
  'search.bger.ch':    { css: 'clir',      absolut: 'https://search.bger.ch/',
                         html: { '116-IA-359:de': 'bger_frauenstimmrecht.html', '145-I-207:fr': 'bger_heiratsstrafe_fr.html' } },
  'relevancy.bger.ch': { css: 'relevancy', absolut: 'http://relevancy.bger.ch/',
                         html: { '116-IA-359:de': 'bger_frauenstimmrecht_relevancy.html' } }
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
    // Entscheid und Regeste-Sprache nach highlight_docid (atf://116-IA-359:de) wählen
    const docid = decodeURIComponent((/highlight_docid=([^&]*)/.exec(req.url || '') || [])[1] || '');
    const nummer = (/atf:\/\/([0-9A-Za-z-]+:[a-z]{2})/.exec(docid) || [])[1];
    const datei = s.html[nummer];
    if (!datei) { res.writeHead(404); res.end('unbekannter Entscheid: ' + docid); return; }
    // Die Seiten sind ISO-8859-1 (wie der Live-Server sie ausliefert): als latin1
    // lesen und schreiben, damit kein Byte verändert wird. Absolute Verweise auf
    // den eigenen Host relativ machen (behalten so den lokalen Port). Fremde
    // Ressourcen (jQuery-CDN) auf den lokalen Server umlenken, wo sie 404
    // ergeben – die Seite braucht sie hier nicht, und der Test bleibt offline.
    const html = fs.readFileSync(path.join(FIXTURES, datei), 'latin1')
      .split(s.absolut).join('/')
      .replace(/\ssrc="https?:\/\/[^"]*"/gi, ' src="/extern-nicht-geladen"');
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

function fixturesPruefen(warnungen) {
  ['bger_frauenstimmrecht.html', 'bger_frauenstimmrecht_relevancy.html', 'bger_heiratsstrafe_fr.html'].forEach(function (f) {
    if (!fs.existsSync(path.join(FIXTURES, f))) {
      console.error('Fixture fehlt: test/fixtures/' + f + ' – zuerst: bash tools/fetch-fixtures.sh');
      process.exit(2);
    }
  });
  if (!fs.existsSync(path.join(FIXTURES, 'css', 'clir', 'master.css'))) {
    warnungen.push('Site-CSS fehlt (bash tools/fetch-fixtures.sh) – Seiten erscheinen ungestylt');
  }
}

async function serverStarten() {
  const sicher = https.createServer(zertifikat(), antworte);
  const offen = http.createServer(antworte);
  await new Promise(function (r) { sicher.listen(PORT_HTTPS, '127.0.0.1', r); });
  await new Promise(function (r) { offen.listen(PORT_HTTP, '127.0.0.1', r); });
  return { schliessen: function () { sicher.close(); offen.close(); } };
}

/* ================================================================== */
/* BROWSER-ADAPTER                                                      */
/* ================================================================== */

/* Chromium (Playwright-Build) und Edge (installiertes Microsoft Edge). Die
   Extension kommt über --load-extension; Chrome und Edge ab 137 ignorieren
   das in Markenbuilds, dann lädt sie der Fallback über das DevTools-Protokoll
   (Extensions.loadUnpacked, braucht --enable-unsafe-extension-debugging). */
async function playwrightStarten(kanal, anzeigename) {
  const { chromium } = require('playwright');
  const perCdp = !!process.env.BGER_EXTENSION_PER_CDP; // zum Testen des Fallbacks
  const args = [
    '--enable-unsafe-extension-debugging',
    '--host-resolver-rules=' + LOKALE_HOSTS.map(function (h) { return 'MAP ' + h + ' 127.0.0.1'; }).join(', ')
  ];
  if (!perCdp) args.unshift('--disable-extensions-except=' + EXT, '--load-extension=' + EXT);
  const context = await chromium.launchPersistentContext('', {
    channel: kanal,
    executablePath: kanal === 'chromium' ? (process.env.BGER_CHROMIUM || undefined) : undefined,
    viewport: { width: BREITE, height: HOEHE },
    ignoreHTTPSErrors: true,       // selbstsigniertes Zertifikat des lokalen Servers
    ignoreDefaultArgs: ['--disable-extensions'], // Playwright schaltet Extensions sonst ab
    args: args,
    proxy: PROXY ? { server: PROXY, bypass: LOKALE_HOSTS.join(',') } : undefined
  });
  const worker = await extensionLaden(context);
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
    name: anzeigename,
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

async function extensionLaden(context) {
  let [worker] = context.serviceWorkers();
  if (worker) return worker;
  try { return await context.waitForEvent('serviceworker', { timeout: 5000 }); } catch (e) { /* Fallback */ }
  const browser = context.browser();
  const cdp = browser ? await browser.newBrowserCDPSession()
    : await context.newCDPSession(context.pages()[0] || await context.newPage());
  await cdp.send('Extensions.loadUnpacked', { path: EXT });
  return context.waitForEvent('serviceworker', { timeout: 20000 });
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
  await driver.installAddon(EXT, true); // temporär, unsigniert – wie „Load Temporary Add-on"
  const basis = 'moz-extension://' + FIREFOX_UUID;
  const hauptHandle = await driver.getWindowHandle();

  function seite(handle) {
    async function hin() { await driver.switchTo().window(handle); }
    async function js(quelle, arg) {
      await hin();
      const r = await driver.executeAsyncScript(
        'const fertig = arguments[arguments.length - 1]; const arg = arguments[0];' +
        'Promise.resolve().then(function () { return (' + quelle + ')(arg); })' +
        '.then(function (w) { fertig(w === undefined ? null : w); }, function (e) { fertig({ __fehler: String(e) }); });',
        arg === undefined ? null : arg);
      if (r && r.__fehler) throw new Error('Seiten-Skript: ' + r.__fehler);
      return r;
    }
    return {
      oeffne: async function (url) { await hin(); await driver.get(url); },
      js: js,
      screenshot: async function (datei) { await hin(); fs.writeFileSync(datei, Buffer.from(await driver.takeScreenshot(), 'base64')); },
      // Fenstergrösse so setzen, dass der sichtbare Bereich (innerWidth/innerHeight)
      // genau b x h ist – Fensterrahmen herausrechnen.
      groesse: async function (b, h) {
        await hin();
        await driver.manage().window().setRect({ width: b, height: h });
        const innen = await js('function () { return [window.innerWidth, window.innerHeight]; }');
        if (innen[0] !== b || innen[1] !== h) {
          await driver.manage().window().setRect({ width: b + (b - innen[0]), height: h + (h - innen[1]) });
        }
      },
      druck: async function () { /* nicht steuerbar über WebDriver */ },
      schliessen: async function () { await hin(); await driver.close(); await driver.switchTo().window(hauptHandle); }
    };
  }
  const haupt = seite(hauptHandle);
  await haupt.groesse(BREITE, HOEHE);
  return {
    name: 'Firefox (Selenium)',
    kannDruck: false,
    hauptseite: haupt,
    popupSeite: async function () {
      const vorher = await driver.getAllWindowHandles();
      try {
        await driver.setContext(firefox.Context.CHROME);
        await driver.executeScript(
          'gBrowser.selectedTab = gBrowser.addTab(arguments[0], { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });',
          basis + '/popup.html');
      } catch (e) {
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

function browserStarten(name) {
  if (name === 'chromium') return playwrightStarten('chromium', 'Chromium (Playwright)');
  if (name === 'edge') return playwrightStarten('msedge', 'Microsoft Edge (Playwright)');
  if (name === 'firefox') return firefoxStarten();
  throw new Error('Unbekannter Browser: ' + name + ' (erlaubt: ' + BROWSER_NAMEN.join(', ') + ')');
}

/* ================================================================== */
/* GEMEINSAME SEITEN-FUNKTIONEN (Quelltext, siehe seite.js)             */
/* ================================================================== */

const Q = {
  // bereit = Einstellungen geladen und Bedienung angeschlossen (data-bereit, content.js START)
  bereit: `function () { const h = document.getElementById('bkl-panel-host'); return !!(h && h.shadowRoot && h.hasAttribute('data-bereit')); }`,
  status: `function () {
    const s = document.getElementById('bkl-panel-host').shadowRoot;
    const html = document.documentElement, absatz = document.querySelector('div.paraatf');
    return {
      paraatf: document.querySelectorAll('div.paraatf').length,
      aktiv: html.classList.contains('bkl-aktiv'),
      folds: document.querySelectorAll('.bkl-fold').length,
      panelOffen: !s.getElementById('bkl-panel').hidden,
      detailsOffen: !s.getElementById('bkl-details').hidden,
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
  panelHaekchen: `function (a) {
    const el = document.getElementById('bkl-panel-host').shadowRoot.getElementById(a.id);
    if (el.checked !== a.an) el.click();
  }`,
  // Fokus wegnehmen: nach einem synthetischen Klick läge er auf einem Bedienelement,
  // dessen Tooltip sonst nach 3 s im Screenshot erscheint.
  fokusWeg: `function () { const s = document.getElementById('bkl-panel-host').shadowRoot; if (s.activeElement) s.activeElement.blur(); }`,
  // Zu den Erwägungen scrollen (STARTPROMPT Regel 10): Bilder zeigen Fliesstext
  // mit Klammern, nicht nur Urteilskopf und Regeste. bger.ch clir: #erwaegungen
  // (alle Sprachen); bvger: der Absatz „Droit :" / „Erwägungen :" / „Diritto :";
  // sonst der Anfang des Entscheids.
  zumText: `function () {
    let z = document.getElementById('erwaegungen');
    if (!z) {
      const seg = document.getElementById('customContentSegment');
      if (seg) z = Array.prototype.find.call(seg.querySelectorAll('p'), function (p) {
        return /^(Droit|Erwägungen|Diritto|Considérants?) ?:?$/.test(p.textContent.trim());
      }) || null;
    }
    if (!z) z = document.querySelector('div.eit') || document.getElementById('customContentSegment') || document.body;
    window.scrollTo(0, window.scrollY + z.getBoundingClientRect().top - 12);
  }`,
  // Zum Anfang des Entscheids (Urteilskopf) scrollen – nur für Szenen, die ihn zeigen sollen.
  zumKopf: `function () {
    const z = document.querySelector('div.eit') || document.getElementById('customContentSegment') || document.body;
    window.scrollTo(0, window.scrollY + z.getBoundingClientRect().top - 12);
  }`
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

module.exports = {
  WURZEL: WURZEL, EXT: EXT, FIXTURES: FIXTURES, SEITEN: SEITEN, ENTSCHEID_NAME: ENTSCHEID_NAME, BROWSER_NAMEN: BROWSER_NAMEN,
  BREITE: BREITE, HOEHE: HOEHE, HOCH: HOCH, Q: Q,
  schlaf: schlaf, fixturesPruefen: fixturesPruefen, serverStarten: serverStarten,
  browserStarten: browserStarten, warteBis: warteBis, einschalten: einschalten
};

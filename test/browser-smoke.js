/* Browser-Smoke-Test: die fertige Extension in echten Browsern.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node test/browser-smoke.js chromium    Playwright-Chromium (steht auch für Chrome und Brave)
 *   node test/browser-smoke.js edge        installiertes Microsoft Edge
 *   node test/browser-smoke.js firefox     Firefox über Selenium und geckodriver
 * Voraussetzungen und Aufbau (lokaler Server, Adapter): test/browser-umgebung.js.
 *
 * Geprüft wird, was jsdom nicht kann: Injektion über das Manifest auf der
 * echten URL, Sprache des Panels im echten Skript-Kontext (Firefox-Sandbox),
 * Site-CSS-Kaskade, gebündelte Schriften (web_accessible_resources),
 * Speichern über Neuladen, Pop-up-Seite mit Live-Sync (storage.onChanged
 * zwischen zwei echten Kontexten), mittiger Dialog per Nachricht an den Tab,
 * Zurücksetzen, http-Seite, Druckansicht (Chromium/Edge) und ein echtes PDF
 * (druck.pdf, alle Browser). bvger.weblaw.ch (React-App, nicht lokal nachstellbar) wird
 * live geladen und ist nur ein Hinweis. Screenshots liegen danach in
 * test/smoke/<browser>/ (in der CI als Artefakt "smoke-<os>-<browser>"),
 * 1280 x 2000 und zu den Erwägungen gescrollt, damit ein grosser Abschnitt
 * Entscheidtext zu sehen ist (STARTPROMPT Regel 10).
 * Schöne Bilder für Store und Doku macht tools/screenshots.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const U = require('./browser-umgebung.js');

const BROWSER = process.argv[2];
if (U.BROWSER_NAMEN.indexOf(BROWSER) === -1) {
  console.error('Aufruf: node test/browser-smoke.js ' + U.BROWSER_NAMEN.join('|'));
  process.exit(2);
}
const BILDER = path.join(__dirname, 'smoke', BROWSER);
const Q = U.Q;

let bestanden = 0, fehlgeschlagen = 0;
const warnungen = [];
function pruefe(name, bedingung, detail) {
  if (bedingung) { bestanden++; console.log('  ✅ ' + name); }
  else { fehlgeschlagen++; console.log('  ❌ ' + name + (detail ? ' – ' + detail : '')); }
}

/* Seiten-Funktionen nur für diesen Test (die gemeinsamen stehen in U.Q). */
const T = {
  foldZustand: `function () {
    const f = document.querySelector('.bkl-fold'); if (!f) return null;
    return { inhalt: getComputedStyle(f.querySelector('.bkl-fold-content')).display,
             knopf: getComputedStyle(f.querySelector('.bkl-toggle')).display };
  }`,
  foldKlick: `function () { document.querySelector('.bkl-fold .bkl-toggle').click(); }`,
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
  popupBereit: `function () { return document.body.hasAttribute('data-bereit') && document.getElementById('bkl-farbe').value === 'nacht'; }`,
  popupStatus: `function () { return {
    farbe: document.getElementById('bkl-farbe').value, aktiv: document.getElementById('bkl-aktiv').checked,
    groesse: document.getElementById('bkl-groesse').value, elemente: document.querySelectorAll('input, select, button').length }; }`,
  popupWert: `function (a) { const el = document.getElementById(a.id); el.value = a.wert; el.dispatchEvent(new Event(a.ereignis, { bubbles: true })); }`,
  popupKlick: `function (id) { document.getElementById(id).click(); }`,
  size30: `function () { return document.documentElement.style.getPropertyValue('--bkl-size') === '30px'; }`,
  zurueckgesetzt: `function () { return !document.documentElement.classList.contains('bkl-aktiv') && document.querySelectorAll('.bkl-fold').length === 0; }`,
  // Aus der Pop-up-Seite (Extension-Kontext) dieselbe Nachricht an alle Tabs
  // schicken, die background.js beim Icon-Klick an den aktiven Tab schickt;
  // liefert, wie viele Tabs mit { ok: true } geantwortet haben (der Entscheid).
  // chrome.* mit Callbacks gibt es in beiden Browsern; tabs.query ohne Recht
  // „tabs" liefert nur IDs, mehr braucht es nicht.
  dialogSenden: `function () {
    function frage(id) {
      return new Promise(function (r) {
        try {
          chrome.tabs.sendMessage(id, { typ: 'bger-reader-einstellungen' }, function (antwort) {
            if (chrome.runtime.lastError) { r(null); return; }
            r(antwort || null);
          });
        } catch (e) { r(null); }
      });
    }
    return new Promise(function (fertig) {
      chrome.tabs.query({}, function (tabs) {
        Promise.all(tabs.map(function (t) { return frage(t.id); })).then(function (antworten) {
          fertig(antworten.filter(function (a) { return a && a.ok === true; }).length);
        });
      });
    });
  }`,
  // Druck: Farben, Breite und Panel im Druckmedium (emulateMedia)
  druckStatus: `function () {
    const host = document.getElementById('bkl-panel-host');
    const middle = document.querySelector('div.eit .middle');
    return { text: getComputedStyle(document.body).color, absatz: getComputedStyle(document.querySelector('div.paraatf')).color,
             hintergrund: getComputedStyle(document.documentElement).backgroundColor,
             middle: middle ? getComputedStyle(middle).width : null, float: middle ? getComputedStyle(middle).float : null,
             host: getComputedStyle(host).display, folds: document.querySelectorAll('.bkl-fold').length };
  }`,
  // Die App liefert den Entscheid in Etappen; erst der vollständige Text zählt.
  bvgerText: `function () { const b = document.querySelector('.bkl-text'); return !!b && b.querySelectorAll('p').length > 100; }`,
  bvgerStatus: `function () { const b = document.querySelector('.bkl-text'); return {
    text: !!b, p: b ? b.querySelectorAll('p').length : 0, folds: document.querySelectorAll('.bkl-fold').length,
    host: !!document.getElementById('bkl-panel-host'), segment: !!document.getElementById('customContentSegment'),
    url: location.href.slice(0, 60) }; }`,
  foldsDa: `function () { return document.querySelectorAll('.bkl-fold').length > 0; }`
};

(async function () {
  U.fixturesPruefen(warnungen);
  fs.rmSync(BILDER, { recursive: true, force: true });
  fs.mkdirSync(BILDER, { recursive: true });

  const server = await U.serverStarten();
  const b = await U.browserStarten(BROWSER);
  const s = b.hauptseite;
  try {
    console.log('\n[1] search.bger.ch – ' + U.ENTSCHEID_NAME + ' (lokal ausgeliefert) – ' + b.name);
    await s.oeffne(U.SEITEN.bge);
    await s.groesse(U.BREITE, U.HOCH); // Prüfbilder hoch: ein bis zwei Bildschirmseiten Text
    pruefe('Content-Skript läuft (Panel-Host mit Shadow DOM, Einstellungen geladen)', await U.warteBis(s, Q.bereit, null, 15000));
    let st = await s.js(Q.status);
    console.log('  Browser: ' + st.ua);
    // Sprache im echten Skript-Kontext: in Firefox ist globalThis des Content-
    // Skripts nicht window; über window.BGerReaderSprachen blieb das Panel
    // deutsch, obwohl die Sprachwahl „Italiano" zeigte (0.10.0).
    const beschriftung = await s.js(Q.panelBeschriftung, 'bkl-aktiv');
    pruefe('Panel übersetzt (Standard Italienisch: „attivare", Flagge IT) – sprachen.js im Kontext des Content-Skripts gefunden',
      beschriftung.text === 'attivare' && beschriftung.sprache === 'it' && beschriftung.wahl === 'it', JSON.stringify(beschriftung));
    pruefe('Entscheidabsätze da, Lesemodus anfangs aus, keine Folds',
      st.paraatf > 20 && !st.aktiv && st.folds === 0, JSON.stringify(st));
    st = await U.einschalten(s);
    pruefe('Panel offen, Lesemodus an, Klammern eingeklappt, Absätze 18px trotz Site-CSS',
      st.panelOffen && st.aktiv && st.folds > 0 && st.absatzSize === '18px', JSON.stringify(st));
    const zu = await s.js(T.foldZustand);
    await s.js(T.foldKlick);
    const auf = await s.js(T.foldZustand);
    pruefe('Klammer: Inhalt verborgen, Klick auf den Pfeil zeigt ihn',
      !!zu && zu.inhalt === 'none' && !!auf && auf.inhalt === 'inline', JSON.stringify([zu, auf]));
    await s.js(Q.zumText);
    await s.js(Q.fokusWeg);
    await s.screenshot(path.join(BILDER, 'bge-hell.png'));

    console.log('\n[2] Schriftart und Farbschema');
    await s.js(Q.panelWert, { id: 'bkl-art', wert: 'atkinson', ereignis: 'change' });
    await s.js(Q.panelWert, { id: 'bkl-farbe', wert: 'nacht', ereignis: 'change' });
    const schrift = await s.js(T.schrift, 'Atkinson Hyperlegible Next');
    st = await s.js(Q.status);
    pruefe('Atkinson Hyperlegible aus dem Paket geladen (web_accessible_resources)',
      schrift.anzahl > 0 && schrift.geladen, JSON.stringify(schrift));
    pruefe('Nacht: <html> #2b1518, Schriftstapel beginnt mit Atkinson',
      st.htmlBg === 'rgb(43, 21, 24)' && /^"Atkinson/.test(st.font), JSON.stringify(st));
    await s.js(Q.zumText);
    await s.js(Q.fokusWeg);
    await s.screenshot(path.join(BILDER, 'bge-nacht-atkinson.png'));

    console.log('\n[3] Speichern über Neuladen');
    await s.oeffne(U.SEITEN.bge);
    const gespeichert = await U.warteBis(s, T.gespeichert, null, 15000);
    pruefe('nach Neuladen: Lesemodus an, Atkinson, Nacht, Klammern eingeklappt', gespeichert,
      JSON.stringify(await s.js(T.zustandKurz)));

    console.log('\n[4] Pop-up-Seite und Live-Sync mit der Entscheidseite');
    const popup = await b.popupSeite();
    if (!popup) {
      warnungen.push('Pop-up-Seite in diesem Browser nicht automatisierbar, übersprungen');
    } else {
      const geladen = await U.warteBis(popup, T.popupBereit, null, 10000);
      const ps = await popup.js(T.popupStatus);
      pruefe('Pop-up zeigt den gespeicherten Stand (Nacht, aktiv, alle Bedienelemente)',
        geladen && ps.aktiv && ps.groesse === '18' && ps.elemente >= 18, JSON.stringify(ps));
      await popup.js(T.popupWert, { id: 'bkl-groesse', wert: '30', ereignis: 'input' });
      pruefe('Regler im Pop-up: Entscheidseite folgt live (30px)', await U.warteBis(s, T.size30, null, 10000));
      await popup.groesse(700, 860);
      await popup.screenshot(path.join(BILDER, 'popup.png'));
      await popup.js(T.popupKlick, 'bkl-reset');
      pruefe('Zurücksetzen im Pop-up: Seite Lesemodus aus, Folds weg', await U.warteBis(s, T.zurueckgesetzt, null, 10000));
      // Icon-Klick: dieselbe Nachricht wie aus background.js, hier aus der
      // Pop-up-Seite an alle Tabs – genau ein Tab (der Entscheid) antwortet
      // und zeigt das Panel als mittigen Dialog; die zweite Nachricht schliesst ihn.
      await U.einschalten(s);
      await s.js(Q.panelKlick, 'bkl-schliessen');
      const antworten = await popup.js(T.dialogSenden);
      await U.schlaf(300);
      st = await s.js(Q.status);
      const dialogOffen = antworten === 1 && st.panelOffen && st.mittig;
      await s.js(Q.zumText);
      await s.js(Q.fokusWeg);
      await s.screenshot(path.join(BILDER, 'dialog-mittig.png'));
      const antworten2 = await popup.js(T.dialogSenden);
      await U.schlaf(300);
      st = await s.js(Q.status);
      pruefe('Nachricht an den Tab (Icon-Klick): mittiger Dialog offen, zweite Nachricht schliesst ihn',
        dialogOffen && antworten2 === 1 && !st.panelOffen && !st.mittig, JSON.stringify({ antworten: antworten, antworten2: antworten2, st: st }));
      await popup.schliessen();
    }

    console.log('\n[5] relevancy.bger.ch (http, lokal ausgeliefert)');
    await s.oeffne(U.SEITEN.relevancy);
    pruefe('Content-Skript läuft auf der http-Seite', await U.warteBis(s, Q.bereit, null, 15000));
    st = await U.einschalten(s);
    pruefe('relevancy: Lesemodus an, Klammern eingeklappt', st.aktiv && st.folds > 0, JSON.stringify(st));
    await s.js(Q.zumText);
    await s.js(Q.fokusWeg);
    await s.screenshot(path.join(BILDER, 'relevancy.png'));

    console.log('\n[6] Druck');
    // Bildschirm: Schema Nacht, Breite 1400 px (Widescreen), OpenDyslexic – die
    // Werte, mit denen das PDF der Autorin blass, verkleinert und rechts
    // abgeschnitten war (0.10.0). Im Druck: schwarz auf weiss, Papierbreite,
    // Klammern wie am Bildschirm (eingeklappt bleibt eingeklappt), Panel weg.
    await s.js(Q.panelWert, { id: 'bkl-farbe', wert: 'nacht', ereignis: 'change' });
    await s.js(Q.panelWert, { id: 'bkl-spalte', wert: '1400', ereignis: 'input' });
    await s.js(Q.panelWert, { id: 'bkl-art', wert: 'opendyslexic', ereignis: 'change' });
    if (b.kannDruck) {
      await s.druck(true);
      const druck = await s.js(T.foldZustand);
      const ds = await s.js(T.druckStatus);
      pruefe('Druckmedium: Klammern wie am Bildschirm (eingeklappt, Pfeil sichtbar), Text schwarz auf weiss statt Nacht, .middle ohne 1400px und ohne float, Panel-Host ausgeblendet',
        !!druck && druck.inhalt === 'none' && druck.knopf !== 'none' && ds.text === 'rgb(0, 0, 0)' && ds.absatz === 'rgb(0, 0, 0)' &&
        ds.hintergrund === 'rgb(255, 255, 255)' && ds.middle !== '1400px' && ds.float === 'none' && ds.host === 'none' && ds.folds > 0,
        JSON.stringify([druck, ds]));
      await s.druck(false);
    }
    if (s.pdf) {
      // Echtes PDF wie „Als PDF sichern" – liegt als druck.pdf bei den Bildern
      // (in der CI im Artefakt) zum Ansehen; hier nur, dass es entsteht.
      try {
        await s.pdf(path.join(BILDER, 'druck.pdf'));
        pruefe('Druck als PDF erzeugt (druck.pdf, zum Ansehen)', fs.statSync(path.join(BILDER, 'druck.pdf')).size > 10000);
      } catch (e) {
        warnungen.push('PDF-Druck in diesem Browser nicht steuerbar: ' + String(e && e.message || e).slice(0, 120));
      }
    }

    console.log('\n[7] bvger.weblaw.ch (live, React-App – informativ)');
    let bv = null, grund = '';
    try {
      await s.oeffne(U.SEITEN.bvger);
      if (await U.warteBis(s, T.bvgerText, null, 60000)) {
        await U.einschalten(s);
        await U.warteBis(s, T.foldsDa, null, 10000);
      } else {
        grund = 'Entscheid nicht vollständig geladen';
      }
      bv = await s.js(T.bvgerStatus);
      await s.js(Q.zumText);
      await s.js(Q.fokusWeg);
      await s.screenshot(path.join(BILDER, 'bvger.png'));
    } catch (e) { grund = 'Fehler: ' + String(e && e.message || e).slice(0, 120); }
    // Nur ein Hinweis, kein Fehlschlag: eine Live-Seite kann sich ändern oder
    // nicht erreichbar sein, das darf kein Release blockieren. Der Fall selbst
    // ist mit der API-Antwort als Fixture in test-runner.js Block [3] und [8] geprüft.
    if (bv && bv.text && bv.p > 50 && bv.folds > 0) console.log('  ✅ bvger: Textblock erkannt, Klammern eingeklappt (' + bv.p + ' Absätze, ' + bv.folds + ' Folds)');
    else warnungen.push('bvger.weblaw.ch: Live-Prüfung ohne Ergebnis – ' + grund + (bv ? ' ' + JSON.stringify(bv) : '') + ' – Screenshot bvger.png ansehen');
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

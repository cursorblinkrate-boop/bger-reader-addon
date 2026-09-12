/* Tests für bger-reader.user.js – Kernlogik gegen echte und synthetische Seiten.
 * Aufruf: node test-runner.js
 *
 * Voraussetzungen: npm install jsdom
 * Optionale echte Fixtures (verifizieren gegen Produktionsseiten):
 *   curl -s "https://search.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F152-IV-1%3Ade&lang=de&type=show_document" -o /tmp/bger_test.html
 *   curl -s "https://search.bger.ch/ext/eurospider/live/de/php/aza/http/index.php?highlight_docid=aza%3A%2F%2F14-07-2026-2C_729-2025&lang=de&type=show_document" -o /tmp/bger_aza.html
 *   curl -s "http://relevancy.bger.ch/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F116-IA-359%3Ade&lang=de&type=show_document" -o /tmp/bger_relevancy.html
 */
'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');

const SCRIPT = fs.readFileSync(
  process.argv[2] || require('path').join(__dirname, '..', 'bger-reader.user.js'),
  'utf8'
);

let bestanden = 0, fehlgeschlagen = 0;
function pruefe(name, bedingung, detail) {
  if (bedingung) { bestanden++; console.log('  ✅ ' + name); }
  else { fehlgeschlagen++; console.log('  ❌ ' + name + (detail ? ' – ' + detail : '')); }
}

function domMitScript(html, url) {
  const dom = new JSDOM(html, { url: url || 'https://search.bger.ch/test', runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.eval(SCRIPT);
  return dom;
}

/* ---------- 1. Heuristik: Einzelfälle ---------- */
console.log('\n[1] Literatur-Heuristik (Einzelfälle)');

const HEURISTIK_FAELLE = [
  // [Text, erwartet als Literatur]
  ['in: Kramer, Das Recht, N. 12 ff.; BGE 135 II 45', true],
  ['vgl. MEIER/BRUNNER, Strafrecht, 2. Aufl. 2020, S. 123 ff.; KELLER, in: GS Bänziger, 2019, S. 45', true],
  ['ATF 143 IV 27 consid. 2.5; JEANNERET/GAUTIER, in: Commentaire romand, 2019, n° 12 ad art. 298b CPP', true],
  ['BGE 123 II 45', false],                                   // zu kurz (< 40)
  ['Beschwerdeführer, vertreten durch Rechtsanwalt Mustermann', false], // keine Signale
  ['29. März 2021', false],                                   // Jahreszahl/Datum
  ['6B_94/2024', false],                                      // Aktenzeichen
  ['Art. 298b al. 1 CPP', false],                             // Gesetzesartikel
  ['wegen versuchter ehebrecherischer Beziehung', false],     // reiner Inhalt
  ['Rz. 45', false]                                           // Signal ja, aber zu kurz
];

{
  const dom = domMitScript('<!doctype html><html><body><div class="eit"><div class="paraatf">Test</div></div></body></html>');
  const R = dom.window.BGerReader;
  HEURISTIK_FAELLE.forEach(function (fall) {
    const ergebnis = R.istWahrscheinlichLiteratur(fall[0], 40);
    pruefe('istWahrscheinlichLiteratur("' + fall[0].slice(0, 40) + '") === ' + fall[1], ergebnis === fall[1], 'war ' + ergebnis);
  });
}

/* ---------- 2. Klammer-Stack: verschachtelt & unbalanciert ---------- */
console.log('\n[2] Klammer-Stack');
{
  const dom = domMitScript('<!doctype html><html><body></body></html>');
  const R = dom.window.BGerReader;

  const einfach = R.klammernFinden('a (b) c');
  pruefe('eine Klammer gefunden', einfach.length === 1);
  pruefe('Position korrekt', einfach[0].start === 2 && einfach[0].end === 5);
  pruefe('Tiefe 0 (Top-Level)', einfach[0].tiefe === 0);

  const verschachtelt = R.klammernFinden('(ausser (innen) noch mehr)');
  pruefe('zwei Klammern gefunden', verschachtelt.length === 2);
  const innen = verschachtelt.find(function (k) { return k.inhalt === 'innen'; });
  pruefe('innere Klammer Tiefe 1', innen && innen.tiefe === 1);

  const unbalanciert = R.klammernFinden('offen (ohne Ende');
  pruefe('unbalancierte Klammer wird ignoriert', unbalanciert.length === 0);

  const schliessend = R.klammernFinden('zu früh) drin (ok)');
  const ok = schliessend.find(function (k) { return k.inhalt === 'ok'; });
  pruefe('verwaiste schliessende Klammer wird übersprungen', !!ok && schliessend.length === 1);
}

/* ---------- 3. Synthetischer Entscheidabsatz mit Links in der Klammer ---------- */
console.log('\n[3] Einklappen über Links/Inline-Elemente hinweg (synthetisch)');

const SYNTHESE = `<!doctype html><html><body><div class="eit">
  <div class="paraatf" id="p1">2.4 Quoi qu'il en soit (ATF <a href="#x">143 IV 27</a> consid. 2.5; JEANNERET/GAUTIER, in: Commentaire romand, 2<sup>e</sup> éd. 2019, n° 12 ad art. 298b CPP).</div>
  <div class="paraatf" id="p2">1. Der Beschwerdeführer (geboren am 29. März 2001) wendet sich gegen das Urteil.</div>
  <div class="paraatf" id="p3">3.1 Weiter gilt (vgl. MEIER, in: ZStrR 2020, S. 45 ff. (Ausnahme vom Grundsatz)) das Folgende.</div>
</div></body></html>`;

{
  const dom = domMitScript(SYNTHESE);
  const doc = dom.window.document;
  const R = dom.window.BGerReader;

  const vorherText = doc.getElementById('p1').textContent;
  const vorherLinks = doc.querySelectorAll('#p1 a').length;

  const anzahl = R.blockVerarbeiten(doc.getElementById('p1'), 'literatur', 40);
  pruefe('eine Klammer in p1 eingeklappt', anzahl === 1, 'war ' + anzahl);

  const fold = doc.querySelector('#p1 .bkl-fold');
  pruefe('Fold-Span vorhanden', !!fold);
  const knopf = fold && fold.querySelector('.bkl-toggle');
  pruefe('Pfeil ist ein <button>', !!knopf);
  pruefe('aria-expanded="false" (geschlossen)', knopf && knopf.getAttribute('aria-expanded') === 'false');
  pruefe('Inhalt versteckt (display none via Klasse)', !fold.classList.contains('bkl-offen'));

  const linksImFold = fold ? fold.querySelectorAll('a').length : 0;
  pruefe('Link innerhalb der Klammer erhalten', linksImFold === vorherLinks, linksImFold + '/' + vorherLinks);
  // Der Pfeil-Button fügt selbst ein Zeichen hinzu – für den Vergleich entfernen.
  const textOhnePfeile = doc.getElementById('p1').textContent.replace(/[▸▾]/g, '');
  pruefe('Text identisch nach dem Einklappen', textOhnePfeile === vorherText,
    JSON.stringify(textOhnePfeile.slice(0, 60)) + ' vs ' + JSON.stringify(vorherText.slice(0, 60)));

  // Aufklappen per Klick
  knopf.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  pruefe('Klick öffnet (bkl-offen)', fold.classList.contains('bkl-offen'));
  pruefe('aria-expanded="true" nach Klick', knopf.getAttribute('aria-expanded') === 'true');
  pruefe('Pfeil zeigt ▾', knopf.textContent === '▾');

  // Rückbau: Original-DOM wiederhergestellt
  R.allesAufklappenUndEntfernen();
  pruefe('alle Wrapper entfernt', doc.querySelectorAll('.bkl-fold').length === 0);
  pruefe('Original-Text wiederhergestellt', doc.getElementById('p1').textContent === vorherText);
  pruefe('Original-Link wiederhergestellt', doc.querySelectorAll('#p1 a').length === vorherLinks);

  // Jahreszahl-Klammer in p2 darf NICHT eingeklappt werden (keine Signale)
  const anzahlP2 = R.blockVerarbeiten(doc.getElementById('p2'), 'literatur', 40);
  pruefe('Datum in p2 bleibt unangetastet', anzahlP2 === 0, 'war ' + anzahlP2);

  // Verschachtelte Klammer in p3: äussere hat Signale -> wird eingeklappt, innere bleibt im Inhalt
  const anzahlP3 = R.blockVerarbeiten(doc.getElementById('p3'), 'literatur', 40);
  pruefe('verschachtelte Klammer in p3 eingeklappt', anzahlP3 === 1, 'war ' + anzahlP3);
  const foldP3 = doc.querySelector('#p3 .bkl-fold');
  pruefe('verschachtelte innere Klammer im Inhalt erhalten',
    !!foldP3 && foldP3.textContent.indexOf('(Ausnahme vom Grundsatz)') !== -1);
}

/* ---------- 4. Komplettes Skript auf der ECHTEN heruntergeladenen Seite (clir/BGE) ---------- */
console.log('\n[4] Echte Entscheidseite (BGE 152 IV 1, clir)');

const ECHTE_SEITE = process.env.BGER_FIXTURE || '/tmp/bger_test.html';
if (fs.existsSync(ECHTE_SEITE)) {
  const html = fs.readFileSync(ECHTE_SEITE, 'utf8');
  const vorher = { links: (html.match(/<a /g) || []).length };

  const dom = domMitScript(html);
  const doc = dom.window.document;
  const R = dom.window.BGerReader;

  const bloecke = doc.querySelectorAll('div.paraatf');
  pruefe('Entscheidabsätze (div.paraatf) gefunden', bloecke.length > 10, bloecke.length + ' gefunden');

  const shadowHost = doc.getElementById('bkl-panel-host');
  pruefe('Panel-Host existiert', !!shadowHost);
  pruefe('Panel im Shadow DOM (Seiten-CSS kann es nicht zerstören)',
    !!shadowHost && !!shadowHost.shadowRoot);

  if (shadowHost && shadowHost.shadowRoot) {
    const panelFont = shadowHost.shadowRoot.querySelector('#bkl-panel');
    pruefe('Panel definiert eigene Schriftgrösse',
      !!panelFont && /font-size:\s*14px/.test(SCRIPT));
  }

  // Klammerverarbeitung im Literatur-Modus
  let gesamt = 0;
  bloecke.forEach(function (b) { gesamt += R.blockVerarbeiten(b, 'literatur', 80); });
  pruefe('Literaturklammern auf echter Seite gefunden', gesamt > 0, gesamt + ' gefunden');

  const folds = doc.querySelectorAll('.bkl-fold');
  pruefe('Fold-Elemente vorhanden', folds.length === gesamt, folds.length + '/' + gesamt);

  // Jeder Fold-Inhalt muss eine vollständige Klammer sein
  let klammernOk = true;
  folds.forEach(function (f) {
    const c = f.querySelector('.bkl-fold-content');
    if (!c) { klammernOk = false; return; }
    const t = c.textContent.trim();
    if (!t.startsWith('(') || !t.endsWith(')')) klammernOk = false;
  });
  pruefe('alle Fold-Inhalte sind vollständige Klammern', klammernOk);

  const linksNachher = doc.querySelectorAll('a').length;
  pruefe('kein Link ging verloren', linksNachher >= vorher.links, linksNachher + '/' + vorher.links);

  // Modus „alle": findet mindestens so viele wie der Literatur-Modus
  R.allesAufklappenUndEntfernen();
  let gesamtAlle = 0;
  bloecke.forEach(function (b) { gesamtAlle += R.blockVerarbeiten(b, 'alle', 80); });
  pruefe('Modus „alle" findet >= so viele wie Literatur-Modus', gesamtAlle >= gesamt,
    gesamtAlle + ' vs ' + gesamt);

  // Roundtrip auf echter Seite: Text identisch (Pfeil-Zeichen werden beim Entfernen mit entfernt)
  const textVorher = doc.querySelector('div.eit').textContent;
  R.allesAufklappenUndEntfernen();
  const textNachher = doc.querySelector('div.eit').textContent;
  pruefe('Roundtrip: Gesamttext nach Entfernen identisch', textVorher.replace(/[▸▾]/g, '') === textNachher);
} else {
  console.log('  ⚠️  Echte Seite nicht gefunden (siehe Kopfkommentar für curl-Befehle), Block übersprungen.');
}

/* ---------- 5. UI-Integration: Lesemodus einschalten via Panel ---------- */
console.log('\n[5] UI-Integration');
{
  const dom = domMitScript(SYNTHESE);
  const doc = dom.window.document;
  const host = doc.getElementById('bkl-panel-host');
  const shadow = host.shadowRoot;

  const aktiv = shadow.getElementById('bkl-aktiv');
  aktiv.checked = true;
  aktiv.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

  pruefe('Lesemodus-Klasse auf <html>', doc.documentElement.classList.contains('bkl-aktiv'));
  pruefe('CSS-Variablen gesetzt', doc.documentElement.style.getPropertyValue('--bkl-size') === '18px');
  pruefe('Klammern automatisch verarbeitet', doc.querySelectorAll('.bkl-fold').length > 0,
    doc.querySelectorAll('.bkl-fold').length + ' Folds');

  // Farbschema wechseln
  const farbe = shadow.getElementById('bkl-farbe');
  farbe.value = 'dunkel';
  farbe.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  pruefe('Dunkelschema-Variable gesetzt', doc.documentElement.style.getPropertyValue('--bkl-bg') === '#181818');

  // Reset
  shadow.getElementById('bkl-reset').dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  pruefe('Reset entfernt Lesemodus-Klasse', !doc.documentElement.classList.contains('bkl-aktiv'));
  pruefe('Reset entfernt alle Folds', doc.querySelectorAll('.bkl-fold').length === 0);
}

/* ---------- 6. Weitere Seitentypen: aza (Weitere Urteile ab 2000) & relevancy ---------- */
console.log('\n[6] aza- und relevancy-Seiten');

const AZA_FIXTURE = process.env.BGER_AZA_FIXTURE || '/tmp/bger_aza.html';
if (fs.existsSync(AZA_FIXTURE)) {
  const html = fs.readFileSync(AZA_FIXTURE, 'utf8');
  const dom = domMitScript(html, 'https://search.bger.ch/ext/eurospider/live/de/php/aza/http/index.php?type=show_document');
  const doc = dom.window.document;
  const R = dom.window.BGerReader;

  const bloecke = doc.querySelectorAll('div.para');
  pruefe('aza: Entscheidabsätze (div.para) gefunden', bloecke.length > 20, bloecke.length + ' gefunden');

  let anzahl = 0;
  bloecke.forEach(function (b) { anzahl += R.blockVerarbeiten(b, 'literatur', 80); });
  pruefe('aza: Klammerverarbeitung läuft', anzahl >= 0, anzahl + ' gefunden');

  const textVorher = doc.querySelector('div.eit').textContent;
  R.allesAufklappenUndEntfernen();
  pruefe('aza: Roundtrip stellt Original her', textVorher.replace(/[▸▾]/g, '') === doc.querySelector('div.eit').textContent);
} else {
  console.log('  ⚠️  aza-Fixture nicht gefunden, übersprungen.');
}

const RELEVANCY_FIXTURE = process.env.BGER_RELEVANCY_FIXTURE || '/tmp/bger_relevancy.html';
if (fs.existsSync(RELEVANCY_FIXTURE)) {
  const html = fs.readFileSync(RELEVANCY_FIXTURE, 'utf8');
  const dom = domMitScript(html, 'http://relevancy.bger.ch/php/clir/http/index.php?type=show_document');
  const doc = dom.window.document;

  const bloecke = doc.querySelectorAll('div.paraatf');
  pruefe('relevancy: Entscheidabsätze (div.paraatf) gefunden', bloecke.length > 20, bloecke.length + ' gefunden');
  pruefe('relevancy: Panel-Host existiert', !!doc.getElementById('bkl-panel-host'));
} else {
  console.log('  ⚠️  relevancy-Fixture nicht gefunden, übersprungen.');
}

/* ---------- 7. Spaltenbreite (Haarlinien) ---------- */
console.log('\n[7] Spaltenbreite');
{
  const html = fs.readFileSync(RELEVANCY_FIXTURE, 'utf8');
  const dom = domMitScript(html);
  const doc = dom.window.document;
  const host = doc.getElementById('bkl-panel-host');
  const shadow = host.shadowRoot;

  const aktiv = shadow.getElementById('bkl-aktiv');
  aktiv.checked = true;
  aktiv.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

  pruefe('Spaltenbreite-Standard 625px gesetzt',
    doc.documentElement.style.getPropertyValue('--bkl-spalte') === '625px');

  const spalte = shadow.getElementById('bkl-spalte');
  spalte.value = '900';
  spalte.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  pruefe('Spaltenbreite auf 900px änderbar',
    doc.documentElement.style.getPropertyValue('--bkl-spalte') === '900px');

  pruefe('Seiten-CSS enthält Spaltenbreite-Regel für div.eit .middle',
    /html\.bkl-aktiv div\.eit \.middle\s*\{[^}]*var\(--bkl-spalte\)/.test(dom.window.eval('document.getElementById("bkl-style").textContent')));
}

/* ---------- Ergebnis ---------- */
console.log('\n========================================');
console.log(bestanden + ' bestanden, ' + fehlgeschlagen + ' fehlgeschlagen');
process.exit(fehlgeschlagen ? 1 : 0);

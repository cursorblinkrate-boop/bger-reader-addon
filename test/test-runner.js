/* Tests für den BGer Reader – Kernlogik gegen echte und synthetische Seiten.
 * Aufruf: node test-runner.js [pfad-zum-skript]
 *
 * Standard: testet extension/content.js (Extension-Port); falls nicht vorhanden,
 * ../bger-reader.user.js (archiviertes Userscript). Beide Pfade werden unterstützt.
 *
 * Voraussetzungen: npm install jsdom
 * Echte Fixtures liegen in test/fixtures/ (bger_test.html, bger_aza.html,
 * bger_relevancy.html); Pfade per BGER_FIXTURE / BGER_AZA_FIXTURE /
 * BGER_RELEVANCY_FIXTURE ueberschreibbar.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const STANDARD_PFAD = fs.existsSync(path.join(__dirname, '..', 'extension', 'content.js'))
  ? path.join(__dirname, '..', 'extension', 'content.js')
  : path.join(__dirname, '..', 'bger-reader.user.js');

const SCRIPT = fs.readFileSync(process.argv[2] || STANDARD_PFAD, 'utf8');

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

/* ---------- 1. Einklapp-Regeln: Einzelfälle ---------- */
console.log('\n[1] Einklapp-Regeln (Einzelfälle)');

const EASY_FAELLE = [
  // [Klammerinhalt, erwartet eingeklappt]
  ['in: Kramer, Das Recht, N. 12 ff.; BGE 135 II 45', true],      // Literatur-Signal „in:"
  ['vgl. MEIER/BRUNNER, Strafrecht, 2. Aufl. 2020, S. 123 ff.; KELLER, in: GS Bänziger, 2019, S. 45', true], // „vgl."
  ['ATF 143 IV 27 consid. 2.5; JEANNERET/GAUTIER, in: Commentaire romand, 2019, n° 12 ad art. 298b CPP', true], // Rest nach Gesetz-Strip zu lang, „in:"/„Commentaire"
  ['BGE 123 II 45', false],                                   // zu kurz (< 30)
  ['Beschwerdeführer, vertreten durch Rechtsanwalt Mustermann', false], // 30–100, keine Ziffern, kein Signal
  ['29. März 2021', false],                                   // zu kurz
  ['6B_94/2024', false],                                      // zu kurz
  ['Art. 298b al. 1 CPP', false],                             // zu kurz
  ['wegen versuchter ehebrecherischer Beziehung', false],     // keine Ziffern, kein Signal
  ['Rz. 45', false],                                          // zu kurz (Regel 1 vor Literatur-Signal)
  ['Art. 8 BV, Art. 13 BV, Art. 29 BV', false],               // nur Gesetzesverweise (Regel 3)
  ['gemäss Art. 41 Abs. 1 OR und Art. 42 OR sowie Art. 8 BV in der hier massgeblichen Fassung', false], // Verweise + Füllwörter (Regel 3)
  ['dazu BGE 141 IV 234 E. 3.2 sowie Urteil 4A_12/2020 vom 5. Mai 2020', true], // „Urteil"
  ['reine Textklammer ohne eine einzige Ziffer, aber sehr lang: ' + 'Wort '.repeat(60), true], // > 100 Zeichen (Regel 5, neu bereits ab 100 statt 300)
  // Neue Fälle des Regelsatzes (v0.5.0):
  ['in Verbindung mit Art. 97 Abs. 2', false],                // nur Verweis + Füllwort (Regel 3)
  ['Art. 97 Abs. 2 und Art. 105 Abs. 3 BGG Umkehrschluss; vgl. BGE 135 V 412', true], // Rest zu lang für Regel 3, „vgl."
  ['nullum crimen sine lege', false],                         // Latinismus (und < 30)
  ['Gattungsschuld', false],                                  // inhaltliche Bemerkung (< 30)
  ['ne bis in idem, so BGE 141 IV 234 E. 3.2', false],        // Latinismus schlägt Ziffern-Regel (Regel 2 vor 6)
  ['BGE 141 IV 234 E. 3.2 und 6B_12/2020 vom 5. Mai', true]   // 30–100 Zeichen, >= 3 Ziffern, kein Signal (Regel 6)
];

{
  const dom = domMitScript('<!doctype html><html><body><div class="eit"><div class="paraatf">Test</div></div></body></html>');
  const R = dom.window.BGerReader;
  EASY_FAELLE.forEach(function (fall) {
    const ergebnis = R.sollEingeklapptWerden(fall[0]);
    pruefe('sollEingeklapptWerden("' + fall[0].slice(0, 40) + '") === ' + fall[1], ergebnis === fall[1], 'war ' + ergebnis);
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

  const anzahl = R.blockVerarbeiten(doc.getElementById('p1'));
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

  // Jahreszahl-Klammer in p2 darf NICHT eingeklappt werden (< 30 Zeichen)
  const anzahlP2 = R.blockVerarbeiten(doc.getElementById('p2'));
  pruefe('Datum in p2 bleibt unangetastet', anzahlP2 === 0, 'war ' + anzahlP2);

  // Verschachtelte Klammer in p3: äussere hat >= 3 Ziffern -> wird eingeklappt,
  // innere (< 30 Zeichen) bleibt im Inhalt
  const anzahlP3 = R.blockVerarbeiten(doc.getElementById('p3'));
  pruefe('verschachtelte Klammer in p3 eingeklappt', anzahlP3 === 1, 'war ' + anzahlP3);
  const foldP3 = doc.querySelector('#p3 .bkl-fold');
  pruefe('verschachtelte innere Klammer im Inhalt erhalten',
    !!foldP3 && foldP3.textContent.indexOf('(Ausnahme vom Grundsatz)') !== -1);
}

/* ---------- 3b. Seitenwechsel (pagebreak) mitten in Klammern ---------- */
console.log('\n[3b] Seitenwechsel in Klammern');

const PAGEBREAK_SEITE = `<!doctype html><html><body><div class="eit">
  <div class="paraatf" id="pb1">4.2 Die Sache wird ausführlich begründet (vgl. MEIER, in: Kommentar zum Strafrecht, 3. Aufl. 2021, S. 45 ff. <a name="page2"></a><div class="center pagebreak">BGE 148 V 366 S. 369</div>sowie KELLER, Strafrecht AT, 2020, S. 12; ferner BGE 145 IV 88 E. 2) und danach weiter ausgeführt.</div>
  <div class="paraatf" id="pb2">5. Eine Bemerkung (nur zwei Ziffern 42 enthalten <a name="page3"></a><div class="center pagebreak">BGE 148 V 366 S. 370</div>hier drin) im Text.</div>
</div></body></html>`;

{
  const dom = domMitScript(PAGEBREAK_SEITE);
  const doc = dom.window.document;
  const R = dom.window.BGerReader;

  // Textkarte überspringt Seitenwechsel: Balken-Text zählt weder zur Länge
  // noch zu den Ziffern einer Klammer.
  const karte = R.textKarteAufbauen(doc.getElementById('pb2'));
  pruefe('Textkarte ohne Seitenwechsel-Text', karte.gesamt.indexOf('BGE 148') === -1, karte.gesamt);

  // pb2: ohne die Balken-Ziffern (148, 366, 370 …) hat die Klammer nur
  // 2 Ziffern und kein Signal -> bleibt offen.
  const anzahlPb2 = R.blockVerarbeiten(doc.getElementById('pb2'));
  pruefe('Seitenwechsel-Ziffern verfälschen die Klassifikation nicht', anzahlPb2 === 0, 'war ' + anzahlPb2);

  // pb1: lange Literatur-Klammer mit Seitenwechsel mitten drin
  const block1 = doc.getElementById('pb1');
  const vorherText = block1.textContent;
  const pbOriginal = block1.querySelector('.pagebreak');
  const originalIndex = Array.prototype.indexOf.call(block1.childNodes, pbOriginal);

  const anzahlPb1 = R.blockVerarbeiten(block1);
  pruefe('Literatur-Klammer mit Seitenwechsel eingeklappt', anzahlPb1 === 1, 'war ' + anzahlPb1);

  const fold = block1.querySelector('.bkl-fold');
  const inhalt = fold && fold.querySelector('.bkl-fold-content');
  pruefe('Seitenwechsel nicht im versteckten Fold-Inhalt',
    !!inhalt && inhalt.querySelectorAll('.pagebreak').length === 0);
  pruefe('Seitenwechsel sichtbar ausserhalb des Folds im Absatz',
    !!block1.querySelector('.pagebreak') && !block1.querySelector('.pagebreak').closest('.bkl-fold'));
  pruefe('leerer page-Anker zusammen mit dem Balken verlagert',
    !!block1.querySelector('a[name="page2"]') && !block1.querySelector('a[name="page2"]').closest('.bkl-fold'));
  const t1 = inhalt ? inhalt.textContent.trim() : '';
  pruefe('Fold-Inhalt bleibt vollständige Klammer (( … ))', t1.startsWith('(') && t1.endsWith(')'));
  pruefe('Kommentar-Platzhalter im Fold-Inhalt hinterlassen',
    !!inhalt && Array.prototype.some.call(inhalt.childNodes, function (k) {
      return k.nodeType === 8 && k.nodeValue === 'bkl-pb';
    }));

  // Roundtrip: Text und Position des Seitenwechsels exakt wie vorher
  R.allesAufklappenUndEntfernen();
  pruefe('Roundtrip: Text identisch', block1.textContent === vorherText);
  const pbNachher = block1.querySelector('.pagebreak');
  pruefe('Roundtrip: Seitenwechsel wieder an Originalposition',
    !!pbNachher && Array.prototype.indexOf.call(block1.childNodes, pbNachher) === originalIndex &&
    pbNachher.previousSibling && pbNachher.previousSibling.tagName === 'A' &&
    pbNachher.previousSibling.getAttribute('name') === 'page2');
  pruefe('keine Platzhalter-Kommentare zurückgeblieben',
    !Array.prototype.some.call(block1.childNodes, function (k) {
      return k.nodeType === 8 && k.nodeValue === 'bkl-pb';
    }));
}


/* ---------- 4. Komplettes Skript auf der ECHTEN heruntergeladenen Seite ---------- */
console.log('\n[4] Echte Entscheidseite (BGE 152 IV 1)');

const ECHTE_SEITE = process.env.BGER_FIXTURE || path.join(__dirname, 'fixtures', 'bger_test.html');
if (fs.existsSync(ECHTE_SEITE)) {
  const html = fs.readFileSync(ECHTE_SEITE, 'utf8');
  const vorher = { links: (html.match(/<a /g) || []).length };

  const dom = domMitScript(html);
  const doc = dom.window.document;
  const R = dom.window.BGerReader;

  const bloecke = doc.querySelectorAll('div.paraatf');
  pruefe('Entscheidabsätze (div.paraatf) gefunden', bloecke.length > 10, bloecke.length + ' gefunden');

  // Originaltext vor jeder Verarbeitung sichern: Referenz für den Roundtrip
  // (eingeklappt sind Seitenwechsel absichtlich umplatziert – sichtbar vor dem
  // Fold –, erst der Rückbau muss die Originalreihenfolge exakt wiederherstellen).
  const textOriginal = doc.querySelector('div.eit').textContent;

  const shadowHost = doc.getElementById('bkl-panel-host');
  pruefe('Panel-Host existiert', !!shadowHost);
  pruefe('Panel im Shadow DOM (Seiten-CSS kann es nicht zerstören)',
    !!shadowHost && !!shadowHost.shadowRoot);

  if (shadowHost && shadowHost.shadowRoot) {
    const panelFont = shadowHost.shadowRoot.querySelector('#bkl-panel');
    pruefe('Panel definiert eigene Schriftgrösse',
      !!panelFont && /font-size:\s*14px/.test(SCRIPT));
  }

  // Klammerverarbeitung mit dem festen Regelsatz
  let gesamt = 0;
  bloecke.forEach(function (b) { gesamt += R.blockVerarbeiten(b); });
  pruefe('Klammern auf echter Seite gefunden (Regelsatz)', gesamt > 0, gesamt + ' gefunden');

  const folds = doc.querySelectorAll('.bkl-fold');
  pruefe('Fold-Elemente vorhanden', folds.length === gesamt, folds.length + '/' + gesamt);

  // Jeder Fold-Inhalt muss ausgeglichene Klammern haben und mit ( beginnen / enden
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

  // Zweitlauf nach Rückbau: identisches Ergebnis (idempotent)
  R.allesAufklappenUndEntfernen();
  let gesamtZwei = 0;
  bloecke.forEach(function (b) { gesamtZwei += R.blockVerarbeiten(b); });
  pruefe('Zweitlauf nach Rückbau findet gleich viele Klammern', gesamtZwei === gesamt,
    gesamtZwei + ' vs ' + gesamt);

  // Roundtrip auf echter Seite: nach dem Entfernen aller Wrapper muss der
  // Text wieder exakt dem Original entsprechen (Seitenwechsel inklusive).
  R.allesAufklappenUndEntfernen();
  const textNachher = doc.querySelector('div.eit').textContent;
  pruefe('Roundtrip: Gesamttext nach Entfernen identisch', textNachher === textOriginal,
    (function () {
      let i = 0;
      while (i < textOriginal.length && textOriginal[i] === textNachher[i]) i++;
      return 'erste Abweichung bei ' + i + ': ' +
        JSON.stringify(textOriginal.slice(i, i + 40)) + ' vs ' +
        JSON.stringify(textNachher.slice(i, i + 40));
    })());

  // Suchtreffer-Markierung der Site nachbauen (gelber Grund, verschachtelter
  // Link) und prüfen, dass der Highlight-Schutz sie adressiert. jsdom rechnet
  // keine Kaskade – CSS-Text-Match plus DOM-Struktur genügt hier.
  const ersterAbsatz = doc.querySelector('div.paraatf');
  const markierung = doc.createElement('span');
  markierung.className = 'exact_match';
  markierung.innerHTML = 'Trefferwort mit <a href="#treffer">Link</a> darin';
  ersterAbsatz.appendChild(markierung);
  const cssNachMarkierung = doc.getElementById('bkl-style').textContent;
  pruefe('Markierung mit verschachteltem Link im Entscheid-DOM',
    !!doc.querySelector('div.eit .exact_match a'));
  pruefe('Highlight-Schutz greift konzeptionell für Markierung und Link',
    /html\.bkl-aktiv div\.eit \.exact_match[,\s{][^}]*color:\s*#1a1a1a/.test(cssNachMarkierung) &&
    /html\.bkl-aktiv div\.eit \.exact_match a[,\s{][^}]*color:\s*#1a1a1a/.test(cssNachMarkierung));
} else {
  console.log('  ⚠️  Echte Seite nicht gefunden (curl zuerst ausführen), Block übersprungen.');
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

const AZA_FIXTURE = process.env.BGER_AZA_FIXTURE || path.join(__dirname, 'fixtures', 'bger_aza.html');
if (fs.existsSync(AZA_FIXTURE)) {
  const html = fs.readFileSync(AZA_FIXTURE, 'utf8');
  const dom = domMitScript(html, 'https://search.bger.ch/ext/eurospider/live/de/php/aza/http/index.php?type=show_document');
  const doc = dom.window.document;
  const R = dom.window.BGerReader;

  const bloecke = doc.querySelectorAll('div.para');
  pruefe('aza: Entscheidabsätze (div.para) gefunden', bloecke.length > 20, bloecke.length + ' gefunden');

  let anzahl = 0;
  bloecke.forEach(function (b) { anzahl += R.blockVerarbeiten(b); });
  pruefe('aza: Klammerverarbeitung läuft', anzahl >= 0, anzahl + ' gefunden');

  const textVorher = doc.querySelector('div.eit').textContent;
  R.allesAufklappenUndEntfernen();
  pruefe('aza: Roundtrip stellt Original her', textVorher.replace(/[▸▾]/g, '') === doc.querySelector('div.eit').textContent);
} else {
  console.log('  ⚠️  aza-Fixture nicht gefunden, übersprungen.');
}

const RELEVANCY_FIXTURE = process.env.BGER_RELEVANCY_FIXTURE || path.join(__dirname, 'fixtures', 'bger_relevancy.html');
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

  pruefe('Seiten-CSS enthält Spaltenbreite-Regel für div.eit .middle (nur unter bkl-breite)',
    /html\.bkl-aktiv\.bkl-breite div\.eit \.middle\s*\{[^}]*var\(--bkl-spalte\)/.test(dom.window.eval('document.getElementById("bkl-style").textContent')));
}

/* ---------- 8. Extension-Speicher (chrome.storage.local, asynchroner Pfad) ---------- */
console.log('\n[8] Extension-Speicher (chrome.storage.local)');
{
  // Mock der chrome-API: synchroner In-Memory-Speicher (bleibt offline, kein Netz).
  const dom = new JSDOM(
    '<!doctype html><html><body><div class="eit"><div class="paraatf">Test</div></div></body></html>',
    { url: 'https://search.bger.ch/test', runScripts: 'outside-only', pretendToBeVisual: true }
  );
  const SPEICHER_SCHLUESSEL = 'bger-reader-einstellungen-v2';
  const speicher = {};
  speicher[SPEICHER_SCHLUESSEL] = { schriftgroesse: 22, aktiv: true }; // vorgespeicherte Einstellung
  dom.window.chrome = {
    storage: {
      local: {
        get: function (key, cb) {
          const out = {};
          if (speicher[key]) out[key] = speicher[key];
          cb(out);
        },
        set: function (paket) {
          Object.keys(paket).forEach(function (k) { speicher[k] = paket[k]; });
        }
      }
    }
  };
  dom.window.eval(SCRIPT);

  const doc = dom.window.document;
  const nutztExtensionSpeicher = /chrome\.storage\.local/.test(SCRIPT);

  if (nutztExtensionSpeicher) {
    pruefe('gespeicherte Schriftgrösse 22px aus chrome.storage.local geladen (nicht Standard 18px)',
      doc.documentElement.style.getPropertyValue('--bkl-size') === '22px',
      'war ' + doc.documentElement.style.getPropertyValue('--bkl-size'));
    pruefe('Lesemodus aus chrome.storage.local geladen (aktiv)',
      doc.documentElement.classList.contains('bkl-aktiv'));

    // Änderung über das Panel muss in chrome.storage.local landen …
    const host = doc.getElementById('bkl-panel-host');
    const groesse = host.shadowRoot.getElementById('bkl-groesse');
    groesse.value = '25';
    groesse.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    pruefe('Panel-Änderung wird in chrome.storage.local gespeichert',
      speicher[SPEICHER_SCHLUESSEL] && speicher[SPEICHER_SCHLUESSEL].schriftgroesse === 25,
      JSON.stringify(speicher[SPEICHER_SCHLUESSEL]));

    // … und NICHT im localStorage der Seite (domain-übergreifend, kein Seiten-Zugriff).
    pruefe('localStorage der Seite bleibt unberührt',
      dom.window.localStorage.getItem(SPEICHER_SCHLUESSEL) === null);
  } else {
    // Archiviertes Userscript: nutzt localStorage, ignoriert die chrome-API.
    pruefe('Userscript-Pfad: localStorage-Fallback aktiv (chrome-API ignoriert)',
      doc.documentElement.style.getPropertyValue('--bkl-size') === '18px',
      'war ' + doc.documentElement.style.getPropertyValue('--bkl-size'));
  }
}

/* ---------- 9. Panel neu: Pink-Button, Öffnen/Schliessen, Details, CSS-Fixes ---------- */
console.log('\n[9] Panel neu (Pink-Button, Detail-Bereich) und Layout-/Farbschema-Fixes');
{
  const dom = domMitScript(SYNTHESE);
  const doc = dom.window.document;
  const shadow = doc.getElementById('bkl-panel-host').shadowRoot;

  // (a) Pink-Button statt minimiertem Balken, Panel initial geschlossen
  const knopf = shadow.getElementById('bkl-button');
  pruefe('Pink-Button #bkl-button existiert', !!knopf);
  pruefe('Pink-Button mit Inline-SVG (Lupe), kein externer Icon-Font',
    !!knopf && !!knopf.querySelector('svg'));
  pruefe('Pink-Button hat title und aria-label',
    !!knopf && !!knopf.getAttribute('title') && !!knopf.getAttribute('aria-label'));
  const panel = shadow.getElementById('bkl-panel');
  pruefe('Panel anfangs geschlossen (hidden)', !!panel && panel.hidden === true);
  pruefe('alter Minimieren-Mechanismus entfernt (kein #bkl-titel/#bkl-inhalt mehr)',
    !shadow.getElementById('bkl-titel') && !shadow.getElementById('bkl-inhalt'));

  // (b) Öffnen/Schliessen per Klick und Escape, Fokus-Management
  knopf.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  pruefe('Klick auf Pink-Button öffnet Panel', panel.hidden === false);
  pruefe('Pink-Button bei offenem Panel verborgen', knopf.hidden === true);
  pruefe('Fokus nach dem Öffnen im Panel',
    !!shadow.activeElement && panel.contains(shadow.activeElement),
    String(shadow.activeElement && shadow.activeElement.id));
  const schliessen = shadow.getElementById('bkl-schliessen');
  pruefe('Schliessen-Knopf (X) vorhanden, mit title und aria-label',
    !!schliessen && !!schliessen.getAttribute('title') && !!schliessen.getAttribute('aria-label'));
  schliessen.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  pruefe('Schliessen-Knopf schliesst Panel', panel.hidden === true && knopf.hidden === false);
  pruefe('Fokus zurück auf Pink-Button', shadow.activeElement === knopf);
  knopf.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  pruefe('Escape schliesst Panel', panel.hidden === true);
  pruefe('Fokus nach Escape zurück auf Pink-Button', shadow.activeElement === knopf);

  // (c) Detail-Bereich: initial eingeklappt, Toggle funktioniert
  const detailsToggle = shadow.getElementById('bkl-details-toggle');
  const details = shadow.getElementById('bkl-details');
  pruefe('Detail-Toggle ist ein echter <button>', !!detailsToggle && detailsToggle.tagName === 'BUTTON');
  pruefe('Detail-Bereich initial eingeklappt (aria-expanded="false", hidden)',
    !!details && details.hidden === true && detailsToggle.getAttribute('aria-expanded') === 'false');
  pruefe('Detail-Toggle verweist per aria-controls auf den Bereich',
    detailsToggle.getAttribute('aria-controls') === 'bkl-details');
  detailsToggle.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  pruefe('Detail-Toggle klappt aus (aria-expanded="true", sichtbar)',
    details.hidden === false && detailsToggle.getAttribute('aria-expanded') === 'true');
  detailsToggle.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  pruefe('Detail-Toggle klappt wieder ein',
    details.hidden === true && detailsToggle.getAttribute('aria-expanded') === 'false');

  // Alle Controls haben title-Tooltip und aria-label
  const kontrollenOhneTooltip = [];
  shadow.querySelectorAll('#bkl-panel input, #bkl-panel select, #bkl-panel button').forEach(function (el) {
    if (!el.getAttribute('title') || !el.getAttribute('aria-label')) kontrollenOhneTooltip.push(el.id);
  });
  pruefe('alle Panel-Controls mit title UND aria-label', kontrollenOhneTooltip.length === 0,
    kontrollenOhneTooltip.join(','));

  // (d) Link-Farben v0.5.1: EINE generelle Regel für alle Links im
  //     Entscheidcontainer (Site setzt div.eit-Links auf schwarz) +
  //     Highlight-Schutz für die gelben Suchbegriff-Markierungen.
  const cssText = doc.getElementById('bkl-style').textContent;
  pruefe('CSS: Boxen (div.eit .box) bekommen Schema-Hintergrund/Textfarbe',
    /html\.bkl-aktiv div\.eit \.box[^{]*\{[^}]*var\(--bkl-bg\)/.test(cssText) &&
    /html\.bkl-aktiv div\.eit \.box[^{]*\{[^}]*var\(--bkl-fg\)/.test(cssText));
  pruefe('CSS: Box-Inhalt (div.eit .box .content) eingefärbt',
    /html\.bkl-aktiv div\.eit \.box \.content\s*\{[^}]*var\(--bkl-bg\)/.test(cssText) ||
    /\.box,\s*html\.bkl-aktiv div\.eit \.box \.content\s*\{[^}]*var\(--bkl-bg\)/.test(cssText));
  pruefe('CSS: generelle Link-Regel für den ganzen Entscheidcontainer (div.eit a)',
    /html\.bkl-aktiv div\.eit a\s*\{[^}]*var\(--bkl-link\)/.test(cssText));
  pruefe('CSS: Highlight-Schutz für alle 5 Markierungsklassen (dunkler Text)',
    ['concept_match', 'exact_match', 'complete_match', 'inexact_match', 'incomplete_match']
      .every(function (k) {
        return new RegExp('html\\.bkl-aktiv div\\.eit \\.' + k + '[,\\s{][^}]*color:\\s*#1a1a1a').test(cssText);
      }));
  pruefe('CSS: Highlight-Schutz auch für Links in Markierungen (a-Varianten)',
    ['concept_match', 'exact_match', 'complete_match', 'inexact_match', 'incomplete_match']
      .every(function (k) {
        return new RegExp('html\\.bkl-aktiv div\\.eit \\.' + k + ' a[,\\s{][^}]*color:\\s*#1a1a1a').test(cssText);
      }));
  pruefe('CSS: Markierungs-Hintergrund der Site unangetastet (kein background im Schutz)',
    !/_match[,\s{][^}]*background/.test(cssText));
  pruefe('CSS: alte redundante Link-Regeln entfernt (paraatf/para/box)',
    !/html\.bkl-aktiv div\.paraatf a\s*[,{]/.test(cssText) &&
    !/html\.bkl-aktiv div\.para a\s*[,{]/.test(cssText) &&
    !/html\.bkl-aktiv div\.eit \.box a\s*[,{]/.test(cssText));

  // (e) Layout-Neutralität: bedingte Regeln statt Dauer-Breiten
  pruefe('CSS: max-width/margin-auto nur unter Klasse bkl-maxw',
    /html\.bkl-aktiv\.bkl-maxw div\.paraatf,\s*html\.bkl-aktiv\.bkl-maxw div\.para\s*\{[^}]*margin-left:\s*auto/.test(cssText));
  pruefe('CSS: Breiten-Überschreibungen nur unter Klasse bkl-breite',
    /html\.bkl-aktiv\.bkl-breite div\.eit \.middle\s*\{[^}]*var\(--bkl-spalte\)/.test(cssText));
  pruefe('CSS: Basisregel der Entscheidabsätze enthält kein margin/max-width',
    !/html\.bkl-aktiv div\.paraatf,\s*html\.bkl-aktiv div\.para\s*\{[^}]*(?:margin|max-width)/.test(cssText));

  // Verhalten: im Standard (625px, Zeilenlänge 0) keine Layout-Klassen auf <html>
  const aktiv2 = shadow.getElementById('bkl-aktiv');
  aktiv2.checked = true;
  aktiv2.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  pruefe('Standard: keine bkl-maxw-Klasse auf <html>', !doc.documentElement.classList.contains('bkl-maxw'));
  pruefe('Standard: keine bkl-breite-Klasse auf <html>', !doc.documentElement.classList.contains('bkl-breite'));

  const laenge = shadow.getElementById('bkl-laenge');
  laenge.value = '80';
  laenge.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  pruefe('Zeilenlänge 80 -> bkl-maxw-Klasse aktiv', doc.documentElement.classList.contains('bkl-maxw'));
  laenge.value = '0';
  laenge.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  pruefe('Zeilenlänge zurück auf 0 -> bkl-maxw-Klasse entfernt',
    !doc.documentElement.classList.contains('bkl-maxw'));

  const spalte2 = shadow.getElementById('bkl-spalte');
  spalte2.value = '900';
  spalte2.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  pruefe('Spaltenbreite 900 -> bkl-breite-Klasse aktiv', doc.documentElement.classList.contains('bkl-breite'));
  spalte2.value = '625';
  spalte2.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  pruefe('Spaltenbreite zurück auf 625 -> bkl-breite-Klasse entfernt',
    !doc.documentElement.classList.contains('bkl-breite'));
}

/* ---------- 10. Gebündelte Fonts: Dateien, Manifest, @font-face, Fallback ---------- */
console.log('\n[10] Gebündelte Fonts (WOFF2, Offline)');

const SKRIPT_PFAD = process.argv[2] || STANDARD_PFAD;
const IST_EXTENSION = /extension[\/\\]content\.js$/.test(SKRIPT_PFAD);

if (IST_EXTENSION) {
  const FONTS_DIR = path.join(__dirname, '..', 'extension', 'fonts');
  const ERWARTETE_WOFF2 = [
    'atkinson-hyperlegible-next-latin-400.woff2', 'atkinson-hyperlegible-next-latin-700.woff2',
    'eb-garamond-latin-400.woff2', 'eb-garamond-latin-700.woff2',
    'comic-neue-latin-400.woff2', 'comic-neue-latin-700.woff2',
    'opendyslexic-latin-400.woff2', 'opendyslexic-latin-700.woff2',
    'liberation-serif-latin-400.woff2', 'liberation-serif-latin-700.woff2',
    'liberation-sans-latin-400.woff2', 'liberation-sans-latin-700.woff2'
  ];

  // (a) Dateien vorhanden, je < 80 KB, gesamt < 300 KB
  const vorhanden = fs.existsSync(FONTS_DIR)
    ? fs.readdirSync(FONTS_DIR).filter(function (f) { return f.endsWith('.woff2'); })
    : [];
  pruefe('alle 12 WOFF2-Dateien vorhanden',
    ERWARTETE_WOFF2.every(function (f) { return vorhanden.indexOf(f) !== -1; }),
    'gefunden: ' + vorhanden.length);
  const LIMIT_EINZEL = 80 * 1024, LIMIT_GESAMT = 300 * 1024;
  let gesamtBytes = 0, zuGross = [];
  vorhanden.forEach(function (f) {
    const b = fs.statSync(path.join(FONTS_DIR, f)).size;
    gesamtBytes += b;
    if (b >= LIMIT_EINZEL) zuGross.push(f + ' (' + Math.round(b / 1024) + ' KB)');
  });
  pruefe('jede Font-Datei < 80 KB', zuGross.length === 0, zuGross.join(','));
  pruefe('Fonts gesamt < 300 KB', gesamtBytes < LIMIT_GESAMT, Math.round(gesamtBytes / 1024) + ' KB');

  // (b) manifest.json: web_accessible_resources mit den drei bger.ch-Patterns
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'extension', 'manifest.json'), 'utf8'));
  const war = (manifest.web_accessible_resources || [])[0] || {};
  pruefe('Manifest: web_accessible_resources für fonts/*.woff2',
    (war.resources || []).indexOf('fonts/*.woff2') !== -1,
    JSON.stringify(war.resources));
  const BGER_PATTERNS = ['https://search.bger.ch/*', 'https://relevancy.bger.ch/*', 'http://relevancy.bger.ch/*'];
  pruefe('Manifest: WAR-matches decken alle drei bger.ch-Patterns ab',
    BGER_PATTERNS.every(function (m) { return (war.matches || []).indexOf(m) !== -1; }),
    JSON.stringify(war.matches));

  // (c) @font-face: ohne chrome.runtime (jsdom) keine Regeln, aber kein Abbruch
  {
    const dom = domMitScript(SYNTHESE);
    const doc = dom.window.document;
    const stil = doc.getElementById('bkl-style');
    pruefe('jsdom ohne chrome.runtime: Skript läuft, Style-Element vorhanden', !!stil);
    pruefe('jsdom ohne chrome.runtime: keine @font-face-Regeln injiziert',
      !!stil && stil.textContent.indexOf('@font-face') === -1);

    const optionen = Array.prototype.map.call(
      doc.getElementById('bkl-panel-host').shadowRoot.getElementById('bkl-art').querySelectorAll('option'),
      function (o) { return o.value; });
    const ERWARTETE_WERTE = ['serif', 'sans', 'atkinson', 'garamond', 'opendyslexic', 'comicneue', 'liberation-serif', 'liberation-sans'];
    pruefe('Schriftart-Select enthält alle 8 Font-Optionen',
      ERWARTETE_WERTE.every(function (v) { return optionen.indexOf(v) !== -1; }),
      optionen.join(','));
  }

  // (c2) Mit Extension-API: @font-face-Regeln mit chrome.runtime.getURL + font-display: swap
  {
    const dom = new JSDOM(SYNTHESE, { url: 'https://search.bger.ch/test', runScripts: 'outside-only', pretendToBeVisual: true });
    dom.window.chrome = {
      runtime: { getURL: function (p) { return 'chrome-extension://testid/' + p; } },
      storage: { local: { get: function (k, cb) { cb({}); }, set: function () {} } }
    };
    dom.window.eval(SCRIPT);
    const css = dom.window.document.getElementById('bkl-style').textContent;
    const anzahlFaces = (css.match(/@font-face/g) || []).length;
    pruefe('12 @font-face-Regeln injiziert (6 Fonts x 2 Schnitte)', anzahlFaces === 12, anzahlFaces + ' gefunden');
    pruefe('@font-face nutzt chrome.runtime.getURL-URL',
      css.indexOf('chrome-extension://testid/fonts/atkinson-hyperlegible-next-latin-400.woff2') !== -1);
    pruefe('@font-face mit font-display: swap', /font-display:\s*swap/.test(css));
  }

  // (d) Unbekannter gespeicherter schriftart-Wert fällt auf Standard (serif) zurück
  {
    const dom = new JSDOM(SYNTHESE, { url: 'https://search.bger.ch/test', runScripts: 'outside-only', pretendToBeVisual: true });
    const SCHLUESSEL = 'bger-reader-einstellungen-v2';
    const speicher = {};
    speicher[SCHLUESSEL] = { schriftart: 'gibts-nicht-mehr-v0.1', aktiv: true };
    dom.window.chrome = {
      storage: {
        local: {
          get: function (key, cb) { const out = {}; if (speicher[key]) out[key] = speicher[key]; cb(out); },
          set: function () {}
        }
      }
    };
    dom.window.eval(SCRIPT);
    const doc = dom.window.document;
    const fontVar = doc.documentElement.style.getPropertyValue('--bkl-font');
    pruefe('unbekannter schriftart-Wert -> System-Serif-Fallback',
      /Georgia/.test(fontVar), JSON.stringify(fontVar));
    const selectWert = doc.getElementById('bkl-panel-host').shadowRoot.getElementById('bkl-art').value;
    pruefe('Select zeigt nach Fallback den Standardwert', selectWert === 'serif', selectWert);
  }

  // Neue Schriftart anwenden: Stack beginnt mit der Custom-Font
  {
    const dom = domMitScript(SYNTHESE);
    const doc = dom.window.document;
    const shadow = doc.getElementById('bkl-panel-host').shadowRoot;
    const art = shadow.getElementById('bkl-art');
    art.value = 'garamond';
    art.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    pruefe('EB Garamond: Stack beginnt mit Custom-Font, System-Fallback dahinter',
      /^"EB Garamond", Georgia/.test(doc.documentElement.style.getPropertyValue('--bkl-font')),
      doc.documentElement.style.getPropertyValue('--bkl-font'));
  }
} else {
  console.log('  ⚠️  Kein Extension-Skript getestet, Font-Block übersprungen.');
}

/* ---------- 11. v0.5.0: Schriftart-Reihenfolge, Farbschema Nacht, Panel-Umbau ---------- */
console.log('\n[11] v0.5.0: Dropdown-Reihenfolge, Nacht-Schema, Panel-Umbau');
{
  const dom = domMitScript(SYNTHESE);
  const doc = dom.window.document;
  const shadow = doc.getElementById('bkl-panel-host').shadowRoot;

  // (c) Schriftart-Dropdown: exakte Reihenfolge, Atkinson ohne Klammerzusatz
  const artOptionen = Array.prototype.slice.call(
    shadow.getElementById('bkl-art').querySelectorAll('option'));
  const werte = artOptionen.map(function (o) { return o.value; });
  const ERWARTETE_REIHENFOLGE = ['atkinson', 'opendyslexic', 'comicneue', 'garamond',
    'liberation-sans', 'liberation-serif', 'sans', 'serif'];
  pruefe('Schriftart-Dropdown in neuer Reihenfolge',
    werte.join(',') === ERWARTETE_REIHENFOLGE.join(','), werte.join(','));
  pruefe('Atkinson-Label ohne Klammerzusatz',
    artOptionen[0].textContent === 'Atkinson Hyperlegible', artOptionen[0].textContent);

  // (d) Farbschema „Nacht" als letzte Option, Variablen werden gesetzt
  const farbOptionen = Array.prototype.slice.call(
    shadow.getElementById('bkl-farbe').querySelectorAll('option'));
  pruefe('Nacht ist letzte Farbschema-Option',
    farbOptionen[farbOptionen.length - 1].value === 'nacht',
    farbOptionen.map(function (o) { return o.value; }).join(','));
  const farbe = shadow.getElementById('bkl-farbe');
  farbe.value = 'nacht';
  farbe.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  pruefe('Nacht-Schema: --bkl-bg ist #2b1518',
    doc.documentElement.style.getPropertyValue('--bkl-bg') === '#2b1518',
    doc.documentElement.style.getPropertyValue('--bkl-bg'));

  // (e) Panel: genau eine Klammern-Checkbox, im Bereich Allgemein;
  //     die Buttons „Alle Klammern auf" / „Alle zu" sind entfernt,
  //     Zurücksetzen und Zähler bleiben im Detail-Bereich.
  pruefe('genau eine Klammern-Checkbox im Panel',
    shadow.querySelectorAll('#bkl-klammern').length === 1);
  pruefe('Klammern-Checkbox im Bereich Allgemein',
    !!shadow.querySelector('#bkl-allgemein #bkl-klammern'));
  pruefe('Buttons bkl-alle-auf / bkl-alle-zu entfernt',
    !shadow.getElementById('bkl-alle-auf') && !shadow.getElementById('bkl-alle-zu'));
  pruefe('Zurücksetzen bleibt im Detail-Bereich',
    !!shadow.querySelector('#bkl-details #bkl-reset'));
  pruefe('Zähler-Hinweis bleibt im Detail-Bereich',
    !!shadow.querySelector('#bkl-details #bkl-zaehler'));
}

/* ---------- Ergebnis ---------- */
console.log('\n========================================');
console.log(bestanden + ' bestanden, ' + fehlgeschlagen + ' fehlgeschlagen');
process.exit(fehlgeschlagen ? 1 : 0);

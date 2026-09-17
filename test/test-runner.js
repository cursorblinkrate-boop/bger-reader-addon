/* Tests für den bger reader – Kernlogik gegen echte und synthetische Seiten.
 * Aufruf: node test-runner.js [pfad-zum-skript]
 *
 * Getestet wird ausschliesslich extension/content.js (das Produkt) samt
 * background.js und popup.html/.js/.css. Bewusst kompakt: ein Test pro
 * Sachverhalt, Fehlschläge nennen die betroffenen Fälle im Detailtext.
 *
 * Voraussetzungen: npm install jsdom
 * Echte Fixtures liegen in test/fixtures/ (bger_test.html, bger_aza.html,
 * bger_relevancy.html); Pfade per BGER_FIXTURE / BGER_AZA_FIXTURE /
 * BGER_RELEVANCY_FIXTURE ueberschreibbar. Ohne Fixtures werden die
 * Blöcke [4] und [6] übersprungen.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WURZEL = path.join(__dirname, '..');
const EXT = path.join(WURZEL, 'extension');
const STANDARD_PFAD = path.join(EXT, 'content.js');

// Kein Fallback auf archiv/bger-reader.user.js (siehe archiv/README.md).
if (!process.argv[2] && !fs.existsSync(STANDARD_PFAD)) {
  console.error('FEHLER: extension/content.js nicht gefunden: ' + STANDARD_PFAD);
  process.exit(2);
}

const SCRIPT = fs.readFileSync(process.argv[2] || STANDARD_PFAD, 'utf8');
const SCHLUESSEL = 'bger-reader-einstellungen-v2';

let bestanden = 0, fehlgeschlagen = 0;
function pruefe(name, bedingung, detail) {
  if (bedingung) { bestanden++; console.log('  ✅ ' + name); }
  else { fehlgeschlagen++; console.log('  ❌ ' + name + (detail ? ' – ' + detail : '')); }
}

/* Fixture lesen und wie ein Browser dekodieren: bger.ch liefert Latin-1;
 * erst streng als UTF-8, bei ungueltigen Bytes als windows-1252. */
function dekodiere(buf) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
  catch (e) { return new TextDecoder('windows-1252').decode(buf); }
}
function ladeSeite(pfad) { return dekodiere(fs.readFileSync(pfad)); }

function domMitScript(html, url) {
  const dom = new JSDOM(html, { url: url || 'https://search.bger.ch/test', runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.eval(SCRIPT);
  return dom;
}

/* jsdom mit gemockter chrome-API (synchroner In-Memory-Speicher, bleibt offline). */
function domMitChrome(html, speicher, extras) {
  const dom = new JSDOM(html, { url: 'https://search.bger.ch/test', runScripts: 'outside-only', pretendToBeVisual: true });
  const listener = [];
  const gesetzt = [];
  dom.window.chrome = {
    storage: {
      local: {
        get: function (key, cb) { const out = {}; if (speicher[key]) out[key] = speicher[key]; cb(out); },
        set: function (paket, cb) {
          Object.keys(paket).forEach(function (k) { speicher[k] = JSON.parse(JSON.stringify(paket[k])); gesetzt.push(k); });
          if (cb) cb();
        }
      },
      onChanged: { addListener: function (fn) { listener.push(fn); } }
    },
    runtime: Object.assign({ lastError: null }, extras || {})
  };
  dom.window.eval(SCRIPT);
  return { dom: dom, doc: dom.window.document, listener: listener, gesetzt: gesetzt,
    shadow: dom.window.document.getElementById('bkl-panel-host').shadowRoot };
}

function ereignis(dom, el, typ) {
  el.dispatchEvent(new dom.window.Event(typ, { bubbles: true }));
}
function klick(dom, el) {
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
}

const SYNTHESE = `<!doctype html><html><body><div class="eit"><div class="middle">
  <div class="paraatf" id="p1">2.4 Quoi qu'il en soit (ATF <a href="#x">143 IV 27</a> consid. 2.5; JEANNERET/GAUTIER, in: Commentaire romand, 2<sup>e</sup> éd. 2019, n° 12 ad art. 298b CPP).</div>
  <div class="paraatf" id="p2">1. Der Beschwerdeführer (geboren am 29. März 2001) wendet sich gegen das Urteil.</div>
  <div class="paraatf" id="p3">3.1 Weiter gilt (vgl. MEIER, in: ZStrR 2020, S. 45 ff. (Ausnahme vom Grundsatz)) das Folgende.</div>
</div></div></body></html>`;

/* ---------- 1. Einklapp-Regeln ---------- */
console.log('\n[1] Einklapp-Regeln');

// Politik (Vorgabe der Autorin): Fundstellen einklappen – Rechtsprechung
// (auch kurz) und Literatur. Alles andere ist Entscheidtext und bleibt offen.
// [Kategorie, soll eingeklappt werden, Klammerinhalt]
//   R = Rechtsprechung, B = Literatur (beide -> true)
//   G = Gesetz, I = interner Verweis, T = Entscheidtext, L = Latinismus (alle -> false)
const KORPUS = [
  // === R: Rechtsprechung -> einklappen, auch kurz ===
  ['R', true,  'BGE 123 II 328'],
  ['R', true,  'BGE 135 II 45 E. 3.2 S. 47'],
  ['R', true,  'ATF 143 IV 27 consid. 2.5'],
  ['R', true,  'DTF 120 Ia 1 consid. 3'],
  ['R', true,  'BGE 147 IV 73 E. 4.1.2; Urteil 6B_123/2020 vom 1. März 2021 E. 2.3'],
  ['R', true,  'Urteil 6B_94/2024 vom 3. Juli 2024'],
  ['R', true,  '6B_94/2024'],
  ['R', true,  'Urteile 1C_45/2019 und 1C_46/2019 vom 12. Mai 2020, je E. 2'],
  ['R', true,  'arrêt 6B_1234/2019 du 5 mars 2020 consid. 1.2'],
  ['R', true,  'vgl. BGE 141 IV 234 E. 3.2; ne bis in idem'],
  ['R', true,  'Art. 97 Abs. 2 BGG; vgl. BGE 135 V 412'],
  ['R', true,  'ne bis in idem, so BGE 141 IV 234 E. 3.2'],
  ['R', true,  'Pra 2019 Nr. 12'],
  ['R', true,  'BVGE 2019 I 1 E. 4'],
  ['R', true,  'Urteil des BVGer A-1234/2019 vom 3. Mai 2020'],
  ['R', true,  'EGMR-Urteil Huber gegen Schweiz vom 23. Oktober 1990, Nr. 12794/87'],
  ['R', true,  'was das Bundesgericht in BGE 135 II 45 ausdrücklich offengelassen hat'],
  ['R', true,  'zum Ganzen BGE 146 IV 88 E. 1.3.1 mit Hinweisen'],
  ['R', true,  'Urteil 6B_220/2011'],                                 // aus 6F_7/2012 (aza)
  ['R', true,  'arrêts 6B_390/2018 précité consid. 5.1; 6B_910/2013 du 20 janvier 2014'],

  // === G: Gesetzesverweise -> offen ===
  ['G', false, 'Art. 12 Abs. 3 StGB'],
  ['G', false, 'Art. 8 BV'],
  ['G', false, 'Art. 8 BV, Art. 13 BV, Art. 29 BV'],
  ['G', false, 'Art. 12 StGB; Art. 5 StPO; Art. 97 BGG; Art. 3 StPO; Art. 6 SchKG'],
  ['G', false, 'Art. 5 Abs. 1 und Art. 9 BV sowie Art. 6 Ziff. 1 EMRK'],
  ['G', false, 'Art. 319 Abs. 1 lit. a StPO i.V.m. Art. 310 StPO'],
  ['G', false, 'Art. 260ter Ziff. 1 StGB'],
  ['G', false, 'Art. 41 ff. OR'],
  ['G', false, 'art. 12 al. 2 let. b CP'],
  ['G', false, 'art. 12 cpv. 2 lett. b CP'],
  ['G', false, 'Art. 8 Abs. 1 SchKG und Art. 17 SchKG'],
  ['G', false, 'Art. 2 Abs. 2 ZGB in der bis zum 31. Dezember 2022 geltenden Fassung'],
  ['G', false, 'aArt. 12 Abs. 1 StGB in der bis Ende 2006 geltenden Fassung'],
  ['G', false, 'Bundesgesetz vom 16. Dezember 2005 über die Ausländerinnen und Ausländer, SR 142.20'],
  ['G', false, 'Art. 28 Abs. 2 des Bundesgesetzes über den Datenschutz, SR 235.1'],
  ['G', false, 'Art. 12 StGB in der Fassung gemäss Ziff. I des Bundesgesetzes vom 13. Dezember 2002, AS 2006 3459'],
  ['G', false, 'Art. 6 Ziff. 1 EMRK, Art. 14 Abs. 1 UNO-Pakt II, Art. 29 Abs. 2 BV'],
  ['G', false, 'vgl. Art. 12 StGB'],
  ['G', false, 'Art. 97 Abs. 1 BGG und Art. 105 Abs. 2 BGG, dazu Art. 42 Abs. 2 BGG'],
  ['G', false, 'gemäss Art. 41 Abs. 1 OR und Art. 42 OR sowie Art. 8 BV in der hier massgeblichen Fassung'],
  ['G', false, 'in Verbindung mit Art. 97 Abs. 2'],
  ['G', false, 'Art. 74 Abs. 2 lit. a BGG in Verbindung mit Art. 75 Abs. 1 BGG'],
  ['G', false, 'Art. 105 Abs. 1 und 2 BGG; Art. 97 Abs. 1 BGG'],
  ['G', false, '§ 823 BGB'],
  ['G', false, 'Art. 8 BV e contrario'],
  ['G', false, 'Art. 12 Abs. 1 lit. a und b StPO analog'],

  // === I: interne Verweise auf den eigenen Entscheid -> offen ===
  ['I', false, 'vgl. dazu die Ausführungen in E. 4.2 hiernach'],
  ['I', false, 'vgl. E. 3.2 des angefochtenen Entscheids'],
  ['I', false, 'dazu eingehend E. 5.4.1 nachfolgend'],
  ['I', false, 'vgl. bereits vorne E. 2.1 sowie hinten E. 6'],
  ['I', false, 'E. 3.2'],
  ['I', false, 'oben E. 2'],
  ['I', false, 'consid. 4.1 supra'],

  // === T: Entscheidtext, Beträge, Mengen, Daten, Bemerkungen -> offen ===
  ['T', false, 'wobei die Vorinstanz verbindlich von einem Deliktsbetrag von rund 250 000 Franken ausgegangen ist'],
  ['T', false, 'Fr. 20\'000.--'],
  ['T', false, 'rund CHF 200\'000'],
  ['T', false, '300 Kilogramm Heroingemisch'],
  ['T', false, 'die Beschwerdeführerin macht insoweit zu Recht geltend, dass die Vorinstanz den Sachverhalt unvollständig festgestellt hat'],
  ['T', false, 'was die Vorinstanz in ihrem Entscheid vom 12. Januar 2021 zutreffend erwogen hat'],
  ['T', false, 'geboren am 29. März 2001'],
  ['T', false, '29. März 2021'],
  ['T', false, 'zum Ganzen sogleich, insbesondere zur Frage der Verjährung'],
  ['T', false, 'im Folgenden: die Beschwerdegegnerin 2'],
  ['T', false, 'nachfolgend: Versicherung'],
  ['T', false, 'recte: Beschwerdegegner'],
  ['T', false, 'Hervorhebungen und Kürzungen jeweils nur hier, im Original anders'],
  ['T', false, 'Hervorhebung nur hier'],
  ['T', false, 'sic'],
  ['T', false, 'Beschwerdeführer, vertreten durch Rechtsanwalt Mustermann'],
  ['T', false, 'wegen versuchter ehebrecherischer Beziehung'],
  ['T', false, 'sogenannte mittelbare Täterschaft'],
  ['T', false, 'unbestritten und aktenkundig'],
  ['T', false, 'reine Textklammer ohne eine einzige Ziffer, aber sehr lang: ' + 'Wort '.repeat(60)],
  ['T', false, 'Rz. 45'],
  ['T', false, 'S. 12 des angefochtenen Urteils'],
  ['T', false, 'act. 12'],
  ['T', false, 'Urk. 5 S. 3'],
  // Eigenes Aktenzeichen im Rubrum (BGE 152 IV 1): nichts nachzuschlagen
  ['T', false, 'dossier 6B_399/2024'],
  ['T', false, 'Verfahren 6B_1/2020'],
  ['T', false, 'ci-après: le recourant'],
  ['T', false, 'cf. consid. 4.4 non publié'],

  // === L: Latinismen und Fachbegriffe -> offen (ohne Liste) ===
  ['L', false, 'in casu war die Frist bereits abgelaufen'],
  ['L', false, 'ne bis in idem'],
  ['L', false, 'nullum crimen sine lege'],
  ['L', false, 'in dubio pro reo'],
  ['L', false, 'dolus eventualis'],
  ['L', false, 'dolus eventualis, vom Vorsatz umfasst'],
  ['L', false, 'culpa in contrahendo'],
  ['L', false, 'res iudicata'],
  ['L', false, 'iura novit curia'],
  ['L', false, 'actio libera in causa, ein seit langem anerkanntes Rechtsinstitut'],
  ['L', false, 'venire contra factum proprium, vgl. dazu sogleich'],
  ['L', false, 'pacta sunt servanda'],
  ['L', false, 'reformatio in peius'],
  ['L', false, 'nemo tenetur se ipsum accusare'],
  ['L', false, 'condicio sine qua non'],
  ['L', false, 'Gattungsschuld'],
  ['L', false, 'error in persona vel obiecto'],
  ['L', false, 'lex mitior'],

  // === B: Literatur -> einklappen ===
  ['B', true,  'vgl. STRATENWERTH/WOHLERS, Handkommentar, 4. Aufl. 2022, N. 12 zu Art. 111 StGB'],
  ['B', true,  'in: Basler Kommentar, Strafrecht I, 4. Aufl. 2019, N. 25 zu Art. 12 StGB'],
  ['B', true,  'NIGGLI/WIPRÄCHTIGER, Basler Kommentar, 4. Aufl. 2019, Art. 12 N. 44'],
  ['B', true,  'cf. DUPONT/MARTIN, Commentaire romand, 2e éd. 2021, n. 12 ad art. 41 CO'],
  ['B', true,  'SCHMID/JOSITSCH, Handbuch des schweizerischen Strafprozessrechts, 3. Aufl. 2017, Rz. 1234'],
  ['B', true,  'HURTADO POZO, Droit pénal, partie générale, 2008, n. 1234 ss'],
  ['B', true,  'TRECHSEL/PIETH, Praxiskommentar, 4. Aufl. 2021, N. 8 zu Art. 111 StGB'],
  ['B', true,  'in: Kramer, Das Recht, N. 12 ff.'],
  ['B', true,  'vgl. MEIER/BRUNNER, Strafrecht, 2. Aufl. 2020, S. 123 ff.; KELLER, in: GS Bänziger, 2019, S. 45'],
  ['B', true,  'JEANNERET/GAUTIER, in: Commentaire romand, 2019, n° 12 ad art. 298b CPP'],
  ['B', true,  'vgl. MEIER, in: ZStrR 2020, S. 45 ff.'],
  ['B', true,  'Niggli/Wiprächtiger, BSK StGB, 4. Aufl. 2019, N. 5 zu Art. 47'],
  ['B', true,  'a.a.O., N. 12'],
  ['B', true,  'op. cit., p. 45'],
  ['B', true,  'MÜLLER, AJP 2019, S. 1234 ff.'],
  ['B', true,  'Art. 12 StGB; STRATENWERTH, AT I, 4. Aufl. 2011, § 9 N. 12'],
  ['B', true,  'DONATSCH, Strafrecht III, 11. Aufl. 2018, S. 12'],
  ['B', true,  'BSK StPO-Schmid, Art. 10 N. 3'],
  ['B', true,  'Kommentar zur ZPO, Hrsg. Sutter-Somm/Hasenböhler/Leuenberger, 3. Aufl. 2016, N. 12 zu Art. 55'],
  // Online-Quelle mit Abrufdatum (BGE 152 IV 1)
  ['B', true,  'cf. Le Petit Robert en ligne, consulté le 28 juillet 2025'],
  ['B', true,  'Duden online, abgerufen am 3. Mai 2024'],
];

{
  const dom = domMitScript('<!doctype html><html><body></body></html>');
  const R = dom.window.BGerReader;
  // Ein Test pro Kategorie; Fehlschläge nennen jeden abweichenden Fall mit Begründung.
  const KATEGORIEN = { R: 'Rechtsprechung einklappen', B: 'Literatur einklappen', G: 'Gesetzesverweise offen',
    I: 'interne Verweise offen', T: 'Entscheidtext offen', L: 'Latinismen offen' };
  Object.keys(KATEGORIEN).forEach(function (kat) {
    const faelle = KORPUS.filter(function (f) { return f[0] === kat; });
    const fehler = faelle.filter(function (f) { return R.sollEingeklapptWerden(f[2]) !== f[1]; })
      .map(function (f) { return '"' + f[2].slice(0, 40) + '" (' + R.begruendung(f[2]) + ')'; });
    pruefe('[' + kat + '] ' + KATEGORIEN[kat] + ' (' + faelle.length + ' Fälle)', fehler.length === 0, fehler.join('; '));
  });
  pruefe('begruendung() erklärt die Entscheidung',
    R.begruendung('BGE 123 II 328') === 'Rechtsprechung' &&
    /^Literatur \(\d+ Punkte/.test(R.begruendung('MÜLLER, AJP 2019, S. 1234 ff.')) &&
    R.begruendung('Art. 8 BV') === 'offen');
  pruefe('geschützte Leerzeichen der Website ändern nichts',
    R.sollEingeklapptWerden('BGE 135 II 45') === true &&
    R.sollEingeklapptWerden('Art. 12 Abs. 3 StGB') === false);
  pruefe('Fixture-Dekodierung: Latin-1 und UTF-8 ergeben "précité"',
    dekodiere(Buffer.from([0x70, 0x72, 0xE9, 0x63, 0x69, 0x74, 0xE9])) === 'précité' &&
    dekodiere(Buffer.from('précité', 'utf8')) === 'précité');

  // Klammer-Stack: verschachtelt und unbalanciert
  const einfach = R.klammernFinden('a (b) c');
  pruefe('Klammer-Stack: Position und Tiefe',
    einfach.length === 1 && einfach[0].start === 2 && einfach[0].end === 5 && einfach[0].tiefe === 0);
  const verschachtelt = R.klammernFinden('(ausser (innen) noch mehr)');
  pruefe('Klammer-Stack: verschachtelte Klammer mit Tiefe 1',
    verschachtelt.length === 2 && verschachtelt.some(function (k) { return k.inhalt === 'innen' && k.tiefe === 1; }));
  pruefe('Klammer-Stack: unbalancierte und verwaiste Klammern werden übersprungen',
    R.klammernFinden('offen (ohne Ende').length === 0 &&
    R.klammernFinden('zu früh) drin (ok)').length === 1);
}

/* ---------- 2. Einklappen im DOM (synthetisch, Links, Seitenwechsel) ---------- */
console.log('\n[2] Einklappen im DOM');
{
  const dom = domMitScript(SYNTHESE);
  const doc = dom.window.document;
  const R = dom.window.BGerReader;
  const p1 = doc.getElementById('p1');
  const vorherText = p1.textContent;
  const vorherLinks = doc.querySelectorAll('#p1 a').length;

  pruefe('Fundstellen-Klammer in p1 eingeklappt', R.blockVerarbeiten(p1) === 1);
  const fold = doc.querySelector('#p1 .bkl-fold');
  const knopf = fold && fold.querySelector('.bkl-toggle');
  pruefe('Disclosure-Pattern: <button> mit aria-expanded="false", Inhalt verborgen',
    !!knopf && knopf.getAttribute('aria-expanded') === 'false' && !fold.classList.contains('bkl-offen'));
  pruefe('Link und Text innerhalb der Klammer erhalten',
    fold.querySelectorAll('a').length === vorherLinks && p1.textContent.replace(/[▸▾]/g, '') === vorherText);
  klick(dom, knopf);
  pruefe('Klick öffnet (bkl-offen, aria-expanded="true", Pfeil ▾)',
    fold.classList.contains('bkl-offen') && knopf.getAttribute('aria-expanded') === 'true' && knopf.textContent === '▾');
  R.allesAufklappenUndEntfernen();
  pruefe('Rückbau stellt Original-DOM her',
    doc.querySelectorAll('.bkl-fold').length === 0 && p1.textContent === vorherText &&
    doc.querySelectorAll('#p1 a').length === vorherLinks);
  pruefe('Datum in p2 bleibt offen', R.blockVerarbeiten(doc.getElementById('p2')) === 0);
  const anzahlP3 = R.blockVerarbeiten(doc.getElementById('p3'));
  pruefe('verschachtelte Klammer in p3: äussere eingeklappt, innere im Inhalt erhalten',
    anzahlP3 === 1 && doc.querySelector('#p3 .bkl-fold').textContent.indexOf('(Ausnahme vom Grundsatz)') !== -1);
}
{
  const PAGEBREAK_SEITE = `<!doctype html><html><body><div class="eit">
  <div class="paraatf" id="pb1">4.2 Die Sache wird ausführlich begründet (vgl. MEIER, in: Kommentar zum Strafrecht, 3. Aufl. 2021, S. 45 ff. <a name="page2"></a><div class="center pagebreak">BGE 148 V 366 S. 369</div>sowie KELLER, Strafrecht AT, 2020, S. 12; ferner BGE 145 IV 88 E. 2) und danach weiter ausgeführt.</div>
  <div class="paraatf" id="pb2">5. Eine Bemerkung (nur zwei Ziffern 42 enthalten <a name="page3"></a><div class="center pagebreak">BGE 148 V 366 S. 370</div>hier drin) im Text.</div>
</div></body></html>`;
  const dom = domMitScript(PAGEBREAK_SEITE);
  const doc = dom.window.document;
  const R = dom.window.BGerReader;
  pruefe('Seitenwechsel-Balken zählt weder zu Text noch Ziffern der Klammer',
    R.textKarteAufbauen(doc.getElementById('pb2')).gesamt.indexOf('BGE 148') === -1 &&
    R.blockVerarbeiten(doc.getElementById('pb2')) === 0);
  const block1 = doc.getElementById('pb1');
  const vorherText = block1.textContent;
  const originalIndex = Array.prototype.indexOf.call(block1.childNodes, block1.querySelector('.pagebreak'));
  pruefe('Literatur-Klammer mit Seitenwechsel eingeklappt', R.blockVerarbeiten(block1) === 1);
  const inhalt = block1.querySelector('.bkl-fold .bkl-fold-content');
  pruefe('Seitenwechsel samt page-Anker bleibt sichtbar ausserhalb des Folds, Inhalt bleibt ( … )',
    !!inhalt && inhalt.querySelectorAll('.pagebreak').length === 0 &&
    !block1.querySelector('.pagebreak').closest('.bkl-fold') &&
    !block1.querySelector('a[name="page2"]').closest('.bkl-fold') &&
    /^\(.*\)$/.test(inhalt.textContent.trim()));
  R.allesAufklappenUndEntfernen();
  const pbNachher = block1.querySelector('.pagebreak');
  pruefe('Roundtrip: Text identisch, Seitenwechsel an Originalposition, keine Platzhalter',
    block1.textContent === vorherText &&
    Array.prototype.indexOf.call(block1.childNodes, pbNachher) === originalIndex &&
    !Array.prototype.some.call(block1.childNodes, function (k) { return k.nodeType === 8; }));
}

/* ---------- 3. Echte Entscheidseiten (Fixtures) ---------- */
console.log('\n[3] Echte Entscheidseiten');
const ECHTE_SEITE = process.env.BGER_FIXTURE || path.join(__dirname, 'fixtures', 'bger_test.html');
if (fs.existsSync(ECHTE_SEITE)) {
  const html = ladeSeite(ECHTE_SEITE);
  const linksVorher = (html.match(/<a /g) || []).length;
  const dom = domMitScript(html);
  const doc = dom.window.document;
  const R = dom.window.BGerReader;
  const bloecke = doc.querySelectorAll('div.paraatf');
  const textOriginal = doc.querySelector('div.eit').textContent;
  pruefe('BGE 152 IV 1: Entscheidabsätze und Panel-Host im Shadow DOM',
    bloecke.length > 10 && !!doc.getElementById('bkl-panel-host').shadowRoot);
  let gesamt = 0;
  bloecke.forEach(function (b) { gesamt += R.blockVerarbeiten(b); });
  const folds = doc.querySelectorAll('.bkl-fold');
  pruefe('Klammern gefunden, jeder Fold-Inhalt eine vollständige Klammer', gesamt > 0 && folds.length === gesamt &&
    Array.prototype.every.call(folds, function (f) {
      const c = f.querySelector('.bkl-fold-content'); return c && /^\(.*\)$/s.test(c.textContent.trim());
    }), gesamt + ' Folds');
  pruefe('kein Link ging verloren', doc.querySelectorAll('a').length >= linksVorher);
  R.allesAufklappenUndEntfernen();
  let gesamtZwei = 0;
  bloecke.forEach(function (b) { gesamtZwei += R.blockVerarbeiten(b); });
  R.allesAufklappenUndEntfernen();
  pruefe('idempotent und Roundtrip: Zweitlauf gleich, Gesamttext identisch',
    gesamtZwei === gesamt && doc.querySelector('div.eit').textContent === textOriginal);
} else {
  console.log('  ⚠️  bger_test.html nicht gefunden (tools/fetch-fixtures.sh), übersprungen.');
}
const AZA_FIXTURE = process.env.BGER_AZA_FIXTURE || path.join(__dirname, 'fixtures', 'bger_aza.html');
if (fs.existsSync(AZA_FIXTURE)) {
  const dom = domMitScript(ladeSeite(AZA_FIXTURE), 'https://search.bger.ch/ext/eurospider/live/de/php/aza/http/index.php?type=show_document');
  const doc = dom.window.document;
  const R = dom.window.BGerReader;
  const bloecke = doc.querySelectorAll('div.para');
  const textVorher = doc.querySelector('div.eit').textContent;
  bloecke.forEach(function (b) { R.blockVerarbeiten(b); });
  R.allesAufklappenUndEntfernen();
  pruefe('aza (6F_7/2012): div.para verarbeitet, Roundtrip identisch',
    bloecke.length > 20 && doc.querySelector('div.eit').textContent === textVorher);
} else {
  console.log('  ⚠️  bger_aza.html nicht gefunden, übersprungen.');
}
const RELEVANCY_FIXTURE = process.env.BGER_RELEVANCY_FIXTURE || path.join(__dirname, 'fixtures', 'bger_relevancy.html');
if (fs.existsSync(RELEVANCY_FIXTURE)) {
  const dom = domMitScript(ladeSeite(RELEVANCY_FIXTURE), 'http://relevancy.bger.ch/php/clir/http/index.php?type=show_document');
  const doc = dom.window.document;
  const shadow = doc.getElementById('bkl-panel-host').shadowRoot;
  ereignis(dom, Object.assign(shadow.getElementById('bkl-aktiv'), { checked: true }), 'change');
  const spalte = shadow.getElementById('bkl-spalte');
  spalte.value = '900';
  ereignis(dom, spalte, 'input');
  pruefe('relevancy: Absätze gefunden, Textbreite 900 wirkt (bkl-breite, --bkl-spalte)',
    doc.querySelectorAll('div.paraatf').length > 20 &&
    doc.documentElement.classList.contains('bkl-breite') &&
    doc.documentElement.style.getPropertyValue('--bkl-spalte') === '900px');
} else {
  console.log('  ⚠️  bger_relevancy.html nicht gefunden, übersprungen.');
}

/* ---------- 4. Panel: Bedienung, Stile, Layout-Neutralität ---------- */
console.log('\n[4] Panel und Stile');
{
  const dom = domMitScript(SYNTHESE);
  const doc = dom.window.document;
  const html = doc.documentElement;
  const shadow = doc.getElementById('bkl-panel-host').shadowRoot;
  const cssText = doc.getElementById('bkl-style').textContent;
  const panelCss = shadow.querySelector('style').textContent;
  const knopf = shadow.getElementById('bkl-button');
  const panel = shadow.getElementById('bkl-panel');
  const schliessen = shadow.getElementById('bkl-schliessen');
  function wert(id) { return shadow.getElementById(id); }
  function label(id) { const l = shadow.querySelector('label[for="' + id + '"]'); return l ? l.textContent.trim() : null; }

  // Öffnen/Schliessen, Fokus, Detail-Bereich
  pruefe('Pink-Button vorhanden, Panel anfangs geschlossen', !!knopf && !!knopf.querySelector('svg') && panel.hidden === true);
  klick(dom, knopf);
  pruefe('Klick öffnet Panel, Fokus im Panel, Pink-Button verborgen',
    panel.hidden === false && knopf.hidden === true && panel.contains(shadow.activeElement));
  klick(dom, schliessen);
  pruefe('X schliesst, Fokus zurück auf Pink-Button', panel.hidden === true && shadow.activeElement === knopf);
  klick(dom, knopf);
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  pruefe('Escape schliesst Panel', panel.hidden === true);
  const toggle = wert('bkl-details-toggle');
  const details = wert('bkl-details');
  pruefe('Detail-Bereich „erweitert": echter Button, aria-controls, initial eingeklappt',
    toggle.tagName === 'BUTTON' && toggle.textContent.trim() === 'erweitert' &&
    toggle.getAttribute('aria-controls') === 'bkl-details' && details.hidden === true);
  klick(dom, toggle);
  pruefe('Detail-Toggle klappt aus (aria-expanded="true")',
    details.hidden === false && toggle.getAttribute('aria-expanded') === 'true');

  // Beschriftungen und Bedienelemente laut Skizze der Autorin (v0.7.0)
  pruefe('Kopfzeile „bger reader" mit pink gefülltem Marken-Icon, kein Zwischentitel',
    shadow.querySelector('#bkl-kopf h2').textContent.trim() === 'bger reader' &&
    /fill="#d63384"/.test(shadow.querySelector('#bkl-kopf h2 svg').outerHTML) &&
    !shadow.querySelector('.bkl-bereich-titel') && !shadow.getElementById('bkl-zaehler'));
  pruefe('Beschriftungen: einschalten / Hintergrund / einfach / Ausrichtung / Spalten / Absatzabstand',
    label('bkl-aktiv') === 'einschalten' && label('bkl-farbe') === 'Hintergrund' && label('bkl-klammern') === 'einfach' &&
    label('bkl-ausrichtung') === 'Ausrichtung' && label('bkl-spalten') === 'Spalten' && label('bkl-absatz') === 'Absatzabstand');
  pruefe('Schriftart-Dropdown: 9 Optionen in fester Reihenfolge, Hintergrund: Nacht zuletzt',
    Array.prototype.map.call(wert('bkl-art').options, function (o) { return o.value; }).join(',') ===
      'atkinson,luciole,opendyslexic,comicneue,garamond,liberation-sans,liberation-serif,sans,serif' &&
    Array.prototype.map.call(wert('bkl-farbe').options, function (o) { return o.value; }).join(',') === 'hell,sepia,dunkel,kontrast,nacht');
  const ohne = [];
  shadow.querySelectorAll('button, input, select').forEach(function (el) {
    if (!el.getAttribute('data-tooltip') || !el.getAttribute('aria-label') || el.hasAttribute('title')) ohne.push(el.id);
  });
  pruefe('alle Bedienelemente mit data-tooltip und aria-label, kein natives title', ohne.length === 0, ohne.join(','));
  const zeilenIcons = shadow.querySelectorAll('.bkl-zeile .bkl-icon svg');
  pruefe('15 Zeilen-Icons aus Colibre (gefüllte Pfade, eigene Farben)',
    zeilenIcons.length === 15 && Array.prototype.every.call(zeilenIcons, function (svg) {
      return /#3a3a38|#1e8bcd|#0063b1/i.test(svg.innerHTML) && !svg.getAttribute('stroke');
    }));
  pruefe('Pink: accent-color für Regler/Häkchen, Schliessen-Knopf #d63384',
    /accent-color:\s*#d63384/.test(panelCss) && /#bkl-schliessen\s*\{[^}]*background:\s*#d63384/.test(panelCss));
  pruefe('Dropdown-Vorschau: CSS-Regeln für alle Schriftarten und Hintergründe',
    ['atkinson', 'luciole', 'opendyslexic', 'comicneue', 'garamond', 'liberation-sans', 'liberation-serif', 'sans', 'serif']
      .every(function (k) { return panelCss.indexOf('#bkl-art option[value="' + k + '"]') !== -1; }) &&
    ['hell', 'sepia', 'dunkel', 'kontrast', 'nacht']
      .every(function (k) { return panelCss.indexOf('#bkl-farbe option[value="' + k + '"]') !== -1; }));
  pruefe('Zurücksetzen-Tooltip nennt die Standardwerte',
    /18/.test(wert('bkl-reset').getAttribute('data-tooltip')) && /625/.test(wert('bkl-reset').getAttribute('data-tooltip')));

  // Lesemodus, Stile, Farbschema
  ereignis(dom, Object.assign(wert('bkl-aktiv'), { checked: true }), 'change');
  pruefe('Lesemodus: Klasse bkl-aktiv, CSS-Variablen, Klammern verarbeitet',
    html.classList.contains('bkl-aktiv') && html.style.getPropertyValue('--bkl-size') === '18px' &&
    doc.querySelectorAll('.bkl-fold').length > 0);
  const groesse = wert('bkl-groesse');
  pruefe('Schriftgrösse: Regler 6–50, Anzeige ohne Einheit („18")',
    groesse.getAttribute('min') === '6' && groesse.getAttribute('max') === '50' && wert('bkl-groesse-w').textContent === '18');
  groesse.value = '40';
  ereignis(dom, groesse, 'input');
  pruefe('Schriftgrösse 40 -> Anzeige „40", --bkl-size 40px',
    wert('bkl-groesse-w').textContent === '40' && html.style.getPropertyValue('--bkl-size') === '40px');
  const farbe = wert('bkl-farbe');
  farbe.value = 'nacht';
  ereignis(dom, farbe, 'change');
  pruefe('Hintergrund Nacht: --bkl-bg #2b1518, Dropdown trägt data-wert',
    html.style.getPropertyValue('--bkl-bg') === '#2b1518' && farbe.getAttribute('data-wert') === 'nacht');
  const art = wert('bkl-art');
  art.value = 'garamond';
  ereignis(dom, art, 'change');
  pruefe('Schriftart Garamond: Stack beginnt mit der gebündelten Font, data-wert gesetzt',
    /^"EB Garamond", Georgia/.test(html.style.getPropertyValue('--bkl-font')) && art.getAttribute('data-wert') === 'garamond');

  // Layout-Neutralität: Breiten-/Ausrichtungs-/Abstands-/Spalten-Regeln nur bei Abweichung
  pruefe('Standard: keine Layout-Klassen (bkl-maxw/-breite/-ausrichtung/-absatz), kein Spalten-Container',
    !html.classList.contains('bkl-maxw') && !html.classList.contains('bkl-breite') &&
    !html.classList.contains('bkl-ausrichtung') && !html.classList.contains('bkl-absatz') &&
    !doc.querySelector('.bkl-spalten-container'));
  pruefe('CSS: Basisregel der Absätze ohne margin/max-width; Regeln nur unter den Klassen',
    !/html\.bkl-aktiv div\.paraatf,\s*html\.bkl-aktiv div\.para\s*\{[^}]*(?:margin|max-width|text-align)/.test(cssText) &&
    /html\.bkl-aktiv\.bkl-maxw div\.paraatf[^{]*\{[^}]*margin-left:\s*auto/.test(cssText) &&
    /html\.bkl-aktiv\.bkl-breite div\.eit \.middle\s*\{[^}]*var\(--bkl-spalte\)/.test(cssText) &&
    /html\.bkl-aktiv\.bkl-ausrichtung div\.paraatf[^{]*\{[^}]*text-align:\s*var\(--bkl-align\)/.test(cssText) &&
    /html\.bkl-aktiv\.bkl-absatz div\.paraatf[^{]*\{[^}]*margin-bottom:\s*var\(--bkl-absatz\)/.test(cssText) &&
    /html\.bkl-aktiv \.bkl-spalten-container\s*\{[^}]*column-count:\s*var\(--bkl-spalten\)/.test(cssText));
  const laenge = wert('bkl-laenge'); laenge.value = '80'; ereignis(dom, laenge, 'input');
  const spalte = wert('bkl-spalte'); spalte.value = '900'; ereignis(dom, spalte, 'input');
  pruefe('Zeilenlänge 80 / Textbreite 900 -> Klassen bkl-maxw und bkl-breite',
    html.classList.contains('bkl-maxw') && html.classList.contains('bkl-breite') &&
    html.style.getPropertyValue('--bkl-maxw') === '80ch');
  laenge.value = '0'; ereignis(dom, laenge, 'input');
  spalte.value = '625'; ereignis(dom, spalte, 'input');
  pruefe('zurück auf Standard -> Klassen entfernt', !html.classList.contains('bkl-maxw') && !html.classList.contains('bkl-breite'));
  const ausrichtung = wert('bkl-ausrichtung');
  ausrichtung.value = 'blocksatz'; ereignis(dom, ausrichtung, 'change');
  pruefe('Blocksatz -> bkl-ausrichtung, --bkl-align justify',
    html.classList.contains('bkl-ausrichtung') && html.style.getPropertyValue('--bkl-align') === 'justify');
  ausrichtung.value = 'links'; ereignis(dom, ausrichtung, 'change');
  const absatz = wert('bkl-absatz');
  absatz.value = '1.5'; ereignis(dom, absatz, 'input');
  pruefe('Absatzabstand 1.5 -> bkl-absatz, --bkl-absatz 1.5em, Anzeige 1.5 (0 = „aus")',
    html.classList.contains('bkl-absatz') && html.style.getPropertyValue('--bkl-absatz') === '1.5em' &&
    wert('bkl-absatz-w').textContent === '1.5');
  absatz.value = '0'; ereignis(dom, absatz, 'input');
  const spalten = wert('bkl-spalten');
  spalten.value = '2'; ereignis(dom, spalten, 'change');
  pruefe('2 Spalten -> gemeinsamer Elternknoten der Absätze (div.middle) erhält bkl-spalten-container, --bkl-spalten 2',
    doc.querySelector('div.middle').classList.contains('bkl-spalten-container') &&
    !doc.querySelector('div.paraatf.bkl-spalten-container') && html.style.getPropertyValue('--bkl-spalten') === '2');
  spalten.value = '1'; ereignis(dom, spalten, 'change');
  pruefe('1 Spalte / links / Absatzabstand 0 -> alles wieder neutral',
    !doc.querySelector('.bkl-spalten-container') && !html.classList.contains('bkl-ausrichtung') &&
    !html.classList.contains('bkl-absatz') && wert('bkl-absatz-w').textContent === 'aus');

  // Seitenrahmen-Theming und Highlight-Schutz (Reihenfolge der Regeln)
  const iEitLink = cssText.indexOf('html.bkl-aktiv div.eit a');
  const iSchutz = cssText.indexOf('html.bkl-aktiv div.eit .concept_match,');
  pruefe('CSS: <html>, body, Links, Boxen eingefärbt; Formulare geschützt; Highlight-Schutz nach den Link-Regeln',
    /html\.bkl-aktiv\s*\{[^}]*background-color:\s*var\(--bkl-bg\)\s*!important/.test(cssText) &&
    /html\.bkl-aktiv body\s*\{[^}]*var\(--bkl-fg\)/.test(cssText) &&
    /html\.bkl-aktiv body a\s*\{[^}]*var\(--bkl-link\)/.test(cssText) &&
    /html\.bkl-aktiv div\.eit \.box[^{]*\{[^}]*var\(--bkl-bg\)/.test(cssText) &&
    /button:not\(\.bkl-toggle\)\s*\{[^}]*#ffffff/.test(cssText) &&
    iEitLink !== -1 && iSchutz > iEitLink &&
    ['concept_match', 'exact_match', 'complete_match', 'inexact_match', 'incomplete_match'].every(function (k) {
      return new RegExp('html\\.bkl-aktiv div\\.eit \\.' + k + ' a[,\\s{][^}]*color:\\s*#1a1a1a').test(cssText);
    }) && !/_match[,\s{][^}]*background/.test(cssText));

  // Zurücksetzen
  klick(dom, wert('bkl-reset'));
  pruefe('Zurücksetzen: Lesemodus aus, Folds weg, Anzeige „18", Dropdowns auf Standard',
    !html.classList.contains('bkl-aktiv') && doc.querySelectorAll('.bkl-fold').length === 0 &&
    wert('bkl-groesse-w').textContent === '18' && art.value === 'serif' && farbe.value === 'hell');

  // Tooltips: erst nach 3 s (Timer abfangen), weg bei Verlassen/Escape
  const tip = shadow.getElementById('bkl-tooltip');
  const timeouts = [];
  const origSetTimeout = dom.window.setTimeout;
  dom.window.setTimeout = function (fn, ms) { timeouts.push({ fn: fn, ms: ms }); return origSetTimeout(fn, ms); };
  const aktiv = wert('bkl-aktiv');
  aktiv.dispatchEvent(new dom.window.MouseEvent('mouseenter'));
  const geplant = timeouts.filter(function (t) { return t.ms === 3000; });
  pruefe('Tooltip: nicht sofort, Timer 3000 ms geplant (TOOLTIP_VERZOEGERUNG in content.js und popup.js)',
    tip.hidden === true && geplant.length === 1 && /TOOLTIP_VERZOEGERUNG = 3000/.test(SCRIPT) &&
    /TOOLTIP_VERZOEGERUNG = 3000/.test(fs.readFileSync(path.join(EXT, 'popup.js'), 'utf8')));
  if (geplant.length) geplant[0].fn();
  pruefe('Tooltip nach Ablauf sichtbar mit data-tooltip-Text und aria-describedby',
    tip.hidden === false && tip.textContent === aktiv.getAttribute('data-tooltip') &&
    aktiv.getAttribute('aria-describedby') === 'bkl-tooltip');
  aktiv.dispatchEvent(new dom.window.MouseEvent('mouseleave'));
  pruefe('Tooltip weg beim Verlassen', tip.hidden === true && !aktiv.hasAttribute('aria-describedby'));
}

/* ---------- 5. Extension-Speicher, Bündelung, Aufwandstrennung, Live-Sync ---------- */
console.log('\n[5] Speicher und Live-Sync');
{
  const speicher = {};
  speicher[SCHLUESSEL] = { schriftgroesse: 22, aktiv: true, schriftart: 'gibts-nicht-mehr' };
  const t = domMitChrome(SYNTHESE, speicher);
  const html = t.doc.documentElement;
  pruefe('gespeicherte Werte aus chrome.storage.local geladen (22px, aktiv), unbekannte Schriftart -> Standard',
    html.style.getPropertyValue('--bkl-size') === '22px' && html.classList.contains('bkl-aktiv') &&
    /Georgia/.test(html.style.getPropertyValue('--bkl-font')) && t.shadow.getElementById('bkl-art').value === 'serif');
  pruefe('localStorage der Seite bleibt unberührt', t.dom.window.localStorage.getItem(SCHLUESSEL) === null);

  // Bündelung: Reglerzug = 1 Schreibvorgang (führende Kante), pagehide schreibt nach
  const groesse = t.shadow.getElementById('bkl-groesse');
  t.gesetzt.length = 0;
  for (let px = 12; px <= 30; px++) { groesse.value = String(px); ereignis(t.dom, groesse, 'input'); }
  pruefe('19 Reglerbewegungen -> 1 Schreibvorgang mit dem ersten Wert (führende Kante)',
    t.gesetzt.length === 1 && speicher[SCHLUESSEL].schriftgroesse === 12, t.gesetzt.length + ' Schreibvorgänge');
  t.dom.window.dispatchEvent(new t.dom.window.Event('pagehide'));
  t.dom.window.dispatchEvent(new t.dom.window.Event('pagehide'));
  pruefe('pagehide schreibt den letzten Wert genau einmal nach',
    t.gesetzt.length === 2 && speicher[SCHLUESSEL].schriftgroesse === 30);

  // Aufwandstrennung: Typografie baut Folds nicht neu auf, aktiv/klammern schon
  const foldVorher = t.doc.querySelector('.bkl-fold');
  const knopf = foldVorher.querySelector('.bkl-toggle');
  klick(t.dom, knopf);
  groesse.value = '20'; ereignis(t.dom, groesse, 'input');
  const farbe = t.shadow.getElementById('bkl-farbe');
  farbe.value = 'dunkel'; ereignis(t.dom, farbe, 'change');
  pruefe('Typografie/Farbe bauen Folds NICHT neu auf, aufgeklappte Stelle bleibt offen',
    t.doc.querySelector('.bkl-fold') === foldVorher && foldVorher.classList.contains('bkl-offen') &&
    html.style.getPropertyValue('--bkl-bg') === '#181818');
  const klammern = t.shadow.getElementById('bkl-klammern');
  klammern.checked = false; ereignis(t.dom, klammern, 'change');
  const ohneFolds = t.doc.querySelectorAll('.bkl-fold').length;
  klammern.checked = true; ereignis(t.dom, klammern, 'change');
  pruefe('Klammern-Schalter baut neu auf (aus: 0 Folds, ein: 2 Folds)',
    ohneFolds === 0 && t.doc.querySelectorAll('.bkl-fold').length === 2);

  // Live-Sync aus dem Pop-up: Eigen-Echo ignorieren, fremde Änderung anwenden, nicht erneut speichern
  pruefe('onChanged-Listener registriert', t.listener.length === 1);
  const foldJetzt = t.doc.querySelector('.bkl-fold');
  t.gesetzt.length = 0;
  t.listener[0]({ [SCHLUESSEL]: { newValue: JSON.parse(JSON.stringify(speicher[SCHLUESSEL])) } }, 'local');
  pruefe('Eigen-Echo baut nichts neu auf', t.doc.querySelector('.bkl-fold') === foldJetzt);
  t.listener[0]({ [SCHLUESSEL]: { newValue: Object.assign({}, speicher[SCHLUESSEL], { schriftgroesse: 24, spalten: 2 }) } }, 'local');
  pruefe('fremde Änderung: Stil sofort (24px, 2 Spalten), Panel synchron, Folds unberührt, kein Rückschreiben',
    html.style.getPropertyValue('--bkl-size') === '24px' && t.doc.querySelector('.bkl-spalten-container') &&
    t.shadow.getElementById('bkl-groesse').value === '24' && t.doc.querySelector('.bkl-fold') === foldJetzt &&
    t.gesetzt.length === 0);
  t.listener[0]({ [SCHLUESSEL]: { newValue: Object.assign({}, speicher[SCHLUESSEL], { klammern: false }) } }, 'local');
  const nachAus = t.doc.querySelectorAll('.bkl-fold').length;
  t.listener[0]({ [SCHLUESSEL]: { newValue: { aktiv: false } } }, 'session');
  pruefe('fremdes Ausschalten der Klammern entfernt Folds; andere Speicherbereiche werden ignoriert',
    nachAus === 0 && html.classList.contains('bkl-aktiv'));
}

/* ---------- 6. Paket: Fonts, Icons, Manifest, Version ---------- */
console.log('\n[6] Paket');
{
  const manifest = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
  const FONTS = ['atkinson-hyperlegible-next', 'luciole', 'eb-garamond', 'comic-neue', 'opendyslexic', 'liberation-serif', 'liberation-sans'];
  const fontDateien = [];
  FONTS.forEach(function (f) { [400, 700].forEach(function (w) { fontDateien.push(f + '-latin-' + w + '.woff2'); }); });
  let fontBytes = 0;
  const fehlend = fontDateien.filter(function (f) {
    const p = path.join(EXT, 'fonts', f);
    if (!fs.existsSync(p)) return true;
    fontBytes += fs.statSync(p).size;
    return false;
  });
  pruefe('14 WOFF2-Dateien vorhanden, gesamt < 400 KB', fehlend.length === 0 && fontBytes < 400 * 1024,
    fehlend.join(',') + ' ' + Math.round(fontBytes / 1024) + ' KB');
  const war = (manifest.web_accessible_resources || [])[0] || {};
  pruefe('Manifest: fonts/*.woff2 für alle drei bger.ch-Muster freigegeben, Icons 16/48/128 vorhanden',
    (war.resources || []).indexOf('fonts/*.woff2') !== -1 &&
    ['https://search.bger.ch/*', 'https://relevancy.bger.ch/*', 'http://relevancy.bger.ch/*']
      .every(function (m) { return (war.matches || []).indexOf(m) !== -1; }) &&
    ['16', '48', '128'].every(function (g) {
      return fs.existsSync(path.join(EXT, manifest.icons[g])) && fs.existsSync(path.join(EXT, manifest.action.default_icon[g]));
    }));
  const mitRuntime = domMitChrome(SYNTHESE, {}, { getURL: function (p) { return 'chrome-extension://testid/' + p; } });
  const css = mitRuntime.doc.getElementById('bkl-style').textContent;
  pruefe('@font-face: 14 Regeln über runtime.getURL mit font-display swap; ohne runtime (jsdom) keine',
    (css.match(/@font-face/g) || []).length === 14 &&
    css.indexOf('chrome-extension://testid/fonts/atkinson-hyperlegible-next-latin-400.woff2') !== -1 &&
    /font-display:\s*swap/.test(css) &&
    domMitScript(SYNTHESE).window.document.getElementById('bkl-style').textContent.indexOf('@font-face') === -1);

  // Version: Manifest ist die einzige Quelle, CHANGELOG folgt
  const changelog = fs.readFileSync(path.join(WURZEL, 'CHANGELOG.md'), 'utf8');
  const eintraege = (changelog.match(/^## (\d+\.\d+\.\d+)/gm) || []).map(function (e) { return e.replace('## ', ''); });
  pruefe('Version: gültiges SemVer, neuester CHANGELOG-Eintrag = Manifest, keine Duplikate, kein TODO',
    /^\d+\.\d+\.\d+$/.test(manifest.version) && eintraege[0] === manifest.version &&
    eintraege.length === new Set(eintraege).size && changelog.indexOf('TODO: Änderung hier beschreiben') === -1 &&
    !/@version|"version"\s*:/.test(SCRIPT),
    'Changelog: ' + eintraege[0] + ', Manifest: ' + manifest.version);
  function verzeichnisBytes(dir) {
    return fs.readdirSync(dir).reduce(function (summe, name) {
      const st = fs.statSync(path.join(dir, name));
      return summe + (st.isDirectory() ? verzeichnisBytes(path.join(dir, name)) : st.size);
    }, 0);
  }
  const kb = Math.ceil(verzeichnisBytes(EXT) / 1024);
  pruefe('extension/ bleibt unter 1023 KB (ungepackt)', kb < 1023, kb + ' KB');
}

/* ---------- 7. Pop-up-Fenster (Icon-Klick): background.js und popup.* ---------- */
console.log('\n[7] Pop-up-Fenster');
/* Asynchron (Promise-Ketten in background.js), beendet den Lauf selbst. */
(async function () {
  const bgQuelle = fs.readFileSync(path.join(EXT, 'background.js'), 'utf8');
  const popupHtml = fs.readFileSync(path.join(EXT, 'popup.html'), 'utf8');
  const popupJs = fs.readFileSync(path.join(EXT, 'popup.js'), 'utf8');
  const popupCss = fs.readFileSync(path.join(EXT, 'popup.css'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));

  pruefe('Manifest: action ohne default_popup, background als service_worker UND scripts, gecko >= 121',
    !!manifest.action.default_title && !manifest.action.default_popup &&
    manifest.background.service_worker === 'background.js' && (manifest.background.scripts || []).join(',') === 'background.js' &&
    parseInt(manifest.browser_specific_settings.gecko.strict_min_version, 10) >= 121);

  // background.js mit gemockter chrome-API
  {
    const dom = new JSDOM('<!doctype html><html><body></body></html>',
      { url: 'chrome-extension://test/background.html', runScripts: 'outside-only', pretendToBeVisual: true });
    const sitzung = {}, klickHandler = [], erstellt = [], aktualisiert = [];
    dom.window.chrome = {
      action: { onClicked: { addListener: function (fn) { klickHandler.push(fn); } } },
      windows: {
        getLastFocused: function (cb) { cb({ left: 100, top: 40, width: 1440, height: 900 }); },
        create: function (daten, cb) { erstellt.push(daten); cb({ id: 42 }); },
        update: function (id, daten, cb) { aktualisiert.push({ id: id, daten: daten }); cb({ id: id }); }
      },
      storage: {
        session: {
          get: function (key, cb) { const out = {}; if (sitzung[key]) out[key] = sitzung[key]; cb(out); },
          set: function (paket, cb) { Object.keys(paket).forEach(function (k) { sitzung[k] = paket[k]; }); if (cb) cb(); }
        },
        local: { get: function (key, cb) { cb({}); }, set: function (paket, cb) { if (cb) cb(); } }
      },
      runtime: { getURL: function (p) { return 'chrome-extension://test/' + p; }, lastError: null }
    };
    dom.window.eval(bgQuelle);
    const P = dom.window.BGerReaderPopup;
    pruefe('zentriert(): Mitte relativ zum Browser-Fenster, nie negativ',
      P.zentriert({ left: 0, top: 0, width: 1440, height: 900 }, 660, 860).left === 390 &&
      P.zentriert({ left: 0, top: 0, width: 400, height: 300 }, 660, 860).top === 0);
    klickHandler[0]();
    await new Promise(function (r) { setTimeout(r, 0); });
    await new Promise(function (r) { setTimeout(r, 0); });
    klickHandler[0]();
    await new Promise(function (r) { setTimeout(r, 0); });
    await new Promise(function (r) { setTimeout(r, 0); });
    pruefe('Icon-Klick öffnet popup.html mittig als eigenes Fenster; zweiter Klick fokussiert statt zu duplizieren',
      klickHandler.length === 1 && erstellt.length === 1 && /popup\.html$/.test(erstellt[0].url) &&
      erstellt[0].type === 'popup' && erstellt[0].left === 490 && erstellt[0].top === 60 &&
      sitzung['bger-reader-popup-fenster'] === 42 && aktualisiert.length === 1 && aktualisiert[0].daten.focused === true);
  }

  // popup.html spiegelt das Seiten-Panel
  {
    const pdoc = new JSDOM(popupHtml, { url: 'chrome-extension://test/popup.html' }).window.document;
    const panelIds = {};
    let m;
    const re = /id="(bkl-[a-z0-9-]+)"/g;
    while ((m = re.exec(SCRIPT))) panelIds[m[1]] = true;
    const KONTROLLEN = ['bkl-schliessen', 'bkl-details-toggle', 'bkl-aktiv', 'bkl-groesse', 'bkl-art', 'bkl-farbe',
      'bkl-spalte', 'bkl-klammern', 'bkl-staerke', 'bkl-zeilenabstand', 'bkl-absatz', 'bkl-buchstaben', 'bkl-worte',
      'bkl-laenge', 'bkl-silben', 'bkl-ausrichtung', 'bkl-spalten', 'bkl-reset'];
    const popupIds = Array.prototype.map.call(pdoc.querySelectorAll('input, select, button'), function (el) { return el.id; });
    pruefe('Pop-up enthält alle 18 Bedienelemente des Panels und keine fremden',
      KONTROLLEN.every(function (id) { return popupIds.indexOf(id) !== -1; }) &&
      popupIds.every(function (id) { return panelIds[id]; }),
      'fehlt: ' + KONTROLLEN.filter(function (id) { return popupIds.indexOf(id) === -1; }).join(',') +
      ' fremd: ' + popupIds.filter(function (id) { return !panelIds[id]; }).join(','));
    const ohne = [];
    pdoc.querySelectorAll('input, select, button').forEach(function (el) {
      if (!el.getAttribute('data-tooltip') || !el.getAttribute('aria-label') || el.hasAttribute('title')) ohne.push(el.id);
    });
    function plabel(id) { const l = pdoc.querySelector('label[for="' + id + '"]'); return l ? l.textContent.trim() : null; }
    pruefe('Pop-up: Beschriftungen, Regler 6–50, data-tooltip statt title, kein Zähler-Hinweis',
      pdoc.querySelector('h1').textContent.trim() === 'bger reader' && plabel('bkl-aktiv') === 'einschalten' &&
      plabel('bkl-farbe') === 'Hintergrund' && plabel('bkl-klammern') === 'einfach' &&
      pdoc.getElementById('bkl-details-toggle').textContent.trim() === 'erweitert' &&
      pdoc.getElementById('bkl-groesse').getAttribute('max') === '50' && ohne.length === 0 &&
      !pdoc.getElementById('bkl-zaehler') && !!pdoc.getElementById('bkl-tooltip'), ohne.join(','));
    // Rohstrings vergleichen (jsdom serialisiert <path/> zu <path></path>)
    const popupIcons = popupHtml.match(/<span class="bkl-icon">(<svg[\s\S]*?<\/svg>)<\/span>/g) || [];
    pruefe('Pop-up-Icons identisch zu content.js (15 Colibre-SVGs, Marken-Icon pink)',
      popupIcons.length === 15 && popupIcons.every(function (z) {
        return SCRIPT.indexOf(z.replace(/^<span class="bkl-icon">|<\/span>$/g, '')) !== -1;
      }) && /fill="#d63384"/.test(pdoc.querySelector('h1 svg').outerHTML));
    pruefe('Pop-up ohne Inline-Script (MV3-CSP), CSS grosszügiger als das Panel',
      !/<script(?![^>]*\bsrc=)[^>]*>/.test(popupHtml) && /<script src="popup\.js">/.test(popupHtml) &&
      /font-size:\s*16px/.test(popupCss) && /input\[type="checkbox"\]\s*\{[^}]*width:\s*22px/.test(popupCss));
    const fontUrls = [];
    popupCss.replace(/url\("(fonts\/[^"]+)"\)/g, function (m2, u) { fontUrls.push(u); return m2; });
    pruefe('Pop-up-CSS: pink, Vorschau-Regeln für alle Schriftarten/Hintergründe, 7 @font-face auf existierende Dateien',
      /accent-color:\s*#d63384/.test(popupCss) && /#bkl-schliessen\s*\{[^}]*background:\s*#d63384/.test(popupCss) &&
      ['atkinson', 'luciole', 'opendyslexic', 'comicneue', 'garamond', 'liberation-sans', 'liberation-serif', 'sans', 'serif']
        .every(function (k) { return popupCss.indexOf('#bkl-art option[value="' + k + '"]') !== -1; }) &&
      [['hell', '#ffffff', '#1a1a1a'], ['sepia', '#f4ecd8', '#3b2f20'], ['dunkel', '#181818', '#e8e8e8'],
       ['kontrast', '#000000', '#ffffff'], ['nacht', '#2b1518', '#f3e3e3']].every(function (t) {
        return new RegExp('#bkl-farbe\\[data-wert="' + t[0] + '"\\]\\s*\\{\\s*background:\\s*' + t[1] + ';\\s*color:\\s*' + t[2]).test(popupCss) &&
          new RegExp(t[0] + ":\\s*\\{ bg: '" + t[1] + "', fg: '" + t[2] + "'").test(SCRIPT);
      }) &&
      fontUrls.length === 7 && fontUrls.every(function (u) { return fs.existsSync(path.join(EXT, u)); }));
  }

  // popup.js: Schlüssel/Standards wie content.js, lädt, speichert, synchronisiert
  {
    pruefe('popup.js: gleicher Speicherschlüssel und gleiche Standardwerte wie content.js, kein Zähler mehr',
      popupJs.indexOf(SCHLUESSEL) !== -1 && /schriftgroesse:\s*18/.test(popupJs) && /spaltenbreite:\s*625/.test(popupJs) &&
      /zeilenabstand:\s*1\.6/.test(popupJs) && /ausrichtung:\s*'links'/.test(popupJs) && /spalten:\s*1\b/.test(popupJs) &&
      /absatzabstand:\s*0\b/.test(popupJs) && popupJs.indexOf('bger-reader-zaehler') === -1 &&
      SCRIPT.indexOf('bger-reader-zaehler') === -1);
    const dom = new JSDOM(popupHtml, { url: 'chrome-extension://test/popup.html', runScripts: 'outside-only', pretendToBeVisual: true });
    const speicher = {};
    speicher[SCHLUESSEL] = { schriftgroesse: 22, farbschema: 'dunkel', schriftart: 'garamond' };
    const listener = [];
    dom.window.chrome = {
      storage: {
        local: {
          get: function (key, cb) { const out = {}; if (speicher[key]) out[key] = speicher[key]; cb(out); },
          set: function (paket, cb) { Object.keys(paket).forEach(function (k) { speicher[k] = paket[k]; }); if (cb) cb(); }
        },
        onChanged: { addListener: function (fn) { listener.push(fn); } }
      },
      runtime: { lastError: null }
    };
    dom.window.eval(popupJs);
    const doc = dom.window.document;
    pruefe('Pop-up lädt gespeicherte Werte (22 ohne Einheit, dunkel, Garamond mit data-wert)',
      doc.getElementById('bkl-groesse').value === '22' && doc.getElementById('bkl-groesse-w').textContent === '22' &&
      doc.getElementById('bkl-farbe').getAttribute('data-wert') === 'dunkel' &&
      doc.getElementById('bkl-art').getAttribute('data-wert') === 'garamond');
    ereignis(dom, Object.assign(doc.getElementById('bkl-aktiv'), { checked: true }), 'change');
    const spalten = doc.getElementById('bkl-spalten');
    spalten.value = '2'; ereignis(dom, spalten, 'change');
    const absatz = doc.getElementById('bkl-absatz');
    absatz.value = '1.5'; ereignis(dom, absatz, 'input');
    pruefe('Pop-up speichert in denselben Speicher (aktiv, 2 Spalten, Absatzabstand 1.5)',
      speicher[SCHLUESSEL].aktiv === true && speicher[SCHLUESSEL].spalten === 2 &&
      speicher[SCHLUESSEL].absatzabstand === 1.5 && doc.getElementById('bkl-absatz-w').textContent === '1.5');
    listener[0]({ [SCHLUESSEL]: { newValue: { schriftgroesse: 26 } } }, 'local');
    pruefe('Änderung vom Seiten-Panel erscheint live im Fenster',
      doc.getElementById('bkl-groesse').value === '26' && doc.getElementById('bkl-groesse-w').textContent === '26');
  }

  console.log('\n========================================');
  console.log(bestanden + ' bestanden, ' + fehlgeschlagen + ' fehlgeschlagen');
  process.exit(fehlgeschlagen ? 1 : 0);
})().catch(function (e) {
  fehlgeschlagen++;
  console.log('  ❌ Block [7] abgebrochen: ' + e.message);
  console.log('\n========================================');
  console.log(bestanden + ' bestanden, ' + fehlgeschlagen + ' fehlgeschlagen');
  process.exit(1);
});

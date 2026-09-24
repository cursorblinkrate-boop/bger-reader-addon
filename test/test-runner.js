/* Tests für den bger reader – Kernlogik gegen echte und synthetische Seiten.
 * Aufruf: node test-runner.js [pfad-zum-skript]
 *
 * Getestet wird ausschliesslich extension/content.js (das Produkt) samt
 * sprachen.js (Texte in vier Sprachen), background.js und popup.html/.js/.css. Bewusst kompakt: ein Test pro
 * Sachverhalt, Fehlschläge nennen die betroffenen Fälle im Detailtext.
 *
 * Voraussetzungen: npm install jsdom
 * Echte Fixtures liegen in test/fixtures/ (bger_frauenstimmrecht.html, bger_aza.html,
 * bger_frauenstimmrecht_relevancy.html, bvger_test.json); Pfade per BGER_FIXTURE /
 * BGER_AZA_FIXTURE / BGER_RELEVANCY_FIXTURE / BVGER_FIXTURE ueberschreibbar.
 * Ohne Fixtures wird Block [3] übersprungen.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WURZEL = path.join(__dirname, '..');
const EXT = path.join(WURZEL, 'extension');
const STANDARD_PFAD = path.join(EXT, 'content.js');

// Kein Fallback auf das alte Userscript (Git-Tag userscript-2.1.0): geprüft wird nur das Produkt.
if (!process.argv[2] && !fs.existsSync(STANDARD_PFAD)) {
  console.error('FEHLER: extension/content.js nicht gefunden: ' + STANDARD_PFAD);
  process.exit(2);
}

const SCRIPT = fs.readFileSync(process.argv[2] || STANDARD_PFAD, 'utf8');
// Texte der Bedienoberfläche: das Manifest lädt sprachen.js vor content.js, popup.html vor popup.js.
const SPRACHEN_SRC = fs.readFileSync(path.join(EXT, 'sprachen.js'), 'utf8');
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
  dom.window.eval(SPRACHEN_SRC);
  dom.window.eval(SCRIPT);
  return dom;
}

/* bvger.weblaw.ch: React-Hülle mit Segment (Titel, Datum, Trenner, leerer
 * Block, Textblock) wie auf der echten Seite; der Entscheid wird wie in der
 * App per innerHTML in den Textblock gesetzt (die API liefert ihn als
 * komplettes HTML-Dokument). inhalt null = Entscheid noch nicht geladen. */
const BVGER_URL = 'https://bvger.weblaw.ch/cache?guiLanguage=de&id=8cf30437-5df2-4a0f-885e-d44a19472144';
function bvgerDom(inhalt, einstellungen) {
  const huelle = '<!doctype html><html lang="en"><head><title>LEv4</title></head><body><div id="root" role="main">' +
    '<div class="ui grid"><div class="column" style="width: 855px; max-width: 1150px;">' +
    '<div id="customContentSegment" class="ui segment" style="overflow-x: scroll;">' +
    '<div class="ui stretched grid"><h2 class="ui header">BVGer B-7296/2025</h2></div>' +
    '<div><span class="titleLabel">Entscheiddatum: 04.09.2026</span></div><div class="ui divider"></div>' +
    '<div style="margin: 50px;"></div><div id="bvger-text" style="margin: 50px;"></div>' +
    '</div></div></div></div></body></html>';
  const dom = new JSDOM(huelle, { url: BVGER_URL, runScripts: 'outside-only', pretendToBeVisual: true });
  if (inhalt !== null) dom.window.document.getElementById('bvger-text').innerHTML = inhalt;
  if (einstellungen) dom.window.localStorage.setItem(SCHLUESSEL, JSON.stringify(einstellungen));
  dom.window.eval(SPRACHEN_SRC);
  dom.window.eval(SCRIPT);
  return dom;
}

/* jsdom mit gemockter chrome-API (synchroner In-Memory-Speicher, bleibt offline).
 * verzoegert: get() antwortet erst, wenn der Test t.laden() aufruft (asynchroner
 * Ladevorgang wie im echten Browser). */
function domMitChrome(html, speicher, extras, verzoegert) {
  const dom = new JSDOM(html, { url: 'https://search.bger.ch/test', runScripts: 'outside-only', pretendToBeVisual: true });
  const listener = [];
  const nachrichten = []; // runtime.onMessage-Listener (Icon-Klick aus background.js)
  const gesetzt = [];
  const ausstehend = [];
  dom.window.chrome = {
    storage: {
      local: {
        get: function (key, cb) {
          const antwort = function () { const out = {}; if (speicher[key]) out[key] = speicher[key]; cb(out); };
          if (verzoegert) ausstehend.push(antwort); else antwort();
        },
        set: function (paket, cb) {
          Object.keys(paket).forEach(function (k) { speicher[k] = JSON.parse(JSON.stringify(paket[k])); gesetzt.push(k); });
          if (cb) cb();
        }
      },
      onChanged: { addListener: function (fn) { listener.push(fn); } }
    },
    runtime: Object.assign({ lastError: null, onMessage: { addListener: function (fn) { nachrichten.push(fn); } } }, extras || {})
  };
  dom.window.eval(SPRACHEN_SRC);
  dom.window.eval(SCRIPT);
  return { dom: dom, doc: dom.window.document, listener: listener, nachrichten: nachrichten, gesetzt: gesetzt,
    laden: function () { ausstehend.splice(0).forEach(function (f) { f(); }); },
    shadow: dom.window.document.getElementById('bkl-panel-host').shadowRoot };
}

function ereignis(dom, el, typ) {
  el.dispatchEvent(new dom.window.Event(typ, { bubbles: true }));
}
function klick(dom, el) {
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
}

const SYNTHESE = `<!doctype html><html><body><div class="eit"><div class="middle">
  <div class="paraatf" id="p1">2.4 Quoi qu'il en soit (ATF <a href="#x">145 I 207</a> consid. 2.5; DUPONT/MARTIN, in: Commentaire romand, 2<sup>e</sup> éd. 2019, n° 12 ad art. 41 CO).</div>
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
  ['R', true,  'ATF 145 I 207 consid. 2.5'],
  ['R', true,  'DTF 120 Ia 1 consid. 3'],
  ['R', true,  'BGE 148 V 366 E. 4.3.2; Urteil 6B_123/2020 vom 1. März 2021 E. 2.3'],
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
  ['R', true,  'arrêts 1C_385/2012 du 22 janvier 2014 consid. 5.1; 1C_63/2015 du 21 juin 2016'],
  // Bundesverwaltungsgericht nach Jahr/Nummer (bvger.weblaw.ch, B-7296/2025)
  ['R', true,  'cf. ATAF 2007/6 consid. 1'],
  ['R', true,  'vgl. BVGE 2014/1 E. 4.3; 2011/48 E. 4.5'],
  ['R', true,  'BVGE 2020 VII/4 E. 2.2 m.H.'],
  ['R', true,  'cf. arrêt du TAF B-7601/2025 du 12 mai 2026 consid. 1.2 et la réf. cit.'],

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
  // Eigenes Aktenzeichen im Rubrum (wie 1C_338/2018 in BGE 145 I 207): nichts nachzuschlagen
  ['T', false, 'dossier 1C_338/2018'],
  ['T', false, 'Verfahren 6B_1/2020'],
  ['T', false, 'ci-après: le recourant'],
  ['T', false, 'cf. consid. 1.5 non publié'],

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
  ['B', true,  'DUPONT/MARTIN, in: Commentaire romand, 2019, n° 12 ad art. 41 CO'],
  ['B', true,  'vgl. MEIER, in: ZStrR 2020, S. 45 ff.'],
  ['B', true,  'Niggli/Wiprächtiger, BSK StGB, 4. Aufl. 2019, N. 5 zu Art. 47'],
  ['B', true,  'a.a.O., N. 12'],
  ['B', true,  'op. cit., p. 45'],
  ['B', true,  'MÜLLER, AJP 2019, S. 1234 ff.'],
  ['B', true,  'Art. 12 StGB; STRATENWERTH, AT I, 4. Aufl. 2011, § 9 N. 12'],
  ['B', true,  'DONATSCH, Strafrecht III, 11. Aufl. 2018, S. 12'],
  ['B', true,  'BSK StPO-Schmid, Art. 10 N. 3'],
  ['B', true,  'Kommentar zur ZPO, Hrsg. Sutter-Somm/Hasenböhler/Leuenberger, 3. Aufl. 2016, N. 12 zu Art. 55'],
  // Online-Quelle mit Abrufdatum
  ['B', true,  'cf. Office fédéral de la statistique, www.bfs.admin.ch, consulté le 3 mai 2019'],
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
const ECHTE_SEITE = process.env.BGER_FIXTURE || path.join(__dirname, 'fixtures', 'bger_frauenstimmrecht.html');
if (fs.existsSync(ECHTE_SEITE)) {
  const html = ladeSeite(ECHTE_SEITE);
  const linksVorher = (html.match(/<a /g) || []).length;
  const dom = domMitScript(html);
  const doc = dom.window.document;
  const R = dom.window.BGerReader;
  const bloecke = doc.querySelectorAll('div.paraatf');
  const textOriginal = doc.querySelector('div.eit').textContent;
  pruefe('BGE 116 Ia 359: Entscheidabsätze und Panel-Host im Shadow DOM',
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
  console.log('  ⚠️  bger_frauenstimmrecht.html nicht gefunden (tools/fetch-fixtures.sh), übersprungen.');
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
const RELEVANCY_FIXTURE = process.env.BGER_RELEVANCY_FIXTURE || path.join(__dirname, 'fixtures', 'bger_frauenstimmrecht_relevancy.html');
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
  console.log('  ⚠️  bger_frauenstimmrecht_relevancy.html nicht gefunden, übersprungen.');
}
const BVGER_FIXTURE = process.env.BVGER_FIXTURE || path.join(__dirname, 'fixtures', 'bvger_test.json');
if (fs.existsSync(BVGER_FIXTURE)) {
  const dom = bvgerDom(JSON.parse(fs.readFileSync(BVGER_FIXTURE, 'utf8')).content);
  const doc = dom.window.document;
  const shadow = doc.getElementById('bkl-panel-host').shadowRoot;
  const block = doc.getElementById('bvger-text');
  const textVorher = block.textContent;
  ereignis(dom, Object.assign(shadow.getElementById('bkl-aktiv'), { checked: true }), 'change');
  const folds = doc.querySelectorAll('.bkl-fold');
  const ataf = Array.prototype.some.call(folds, function (f) { return /ATAF 2007\/6 consid\. 1/.test(f.textContent); });
  const ganz = Array.prototype.every.call(folds, function (f) {
    return /^\(.*\)$/s.test(f.querySelector('.bkl-fold-content').textContent.trim());
  });
  ereignis(dom, Object.assign(shadow.getElementById('bkl-aktiv'), { checked: false }), 'change');
  pruefe('bvger (B-7296/2025): <p> als Blöcke, bkl-text mit lang="fr", ATAF-Zitat eingeklappt, jeder Fold eine ganze Klammer, Roundtrip identisch',
    block.querySelectorAll('p').length > 100 && block.classList.contains('bkl-text') && block.lang === 'fr' &&
    folds.length > 10 && ataf && ganz && doc.querySelectorAll('.bkl-fold').length === 0 && block.textContent === textVorher,
    folds.length + ' Folds');
} else {
  console.log('  ⚠️  bvger_test.json nicht gefunden, übersprungen.');
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
  pruefe('Klick öffnet Panel oben rechts (nicht mittig), Fokus im Panel, Pink-Button verborgen',
    panel.hidden === false && !panel.classList.contains('bkl-mittig') && knopf.hidden === true && panel.contains(shadow.activeElement));
  klick(dom, schliessen);
  pruefe('X schliesst, Fokus zurück auf Pink-Button', panel.hidden === true && shadow.activeElement === knopf);
  klick(dom, knopf);
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  pruefe('Escape schliesst Panel', panel.hidden === true);
  const toggle = wert('bkl-details-toggle');
  const details = wert('bkl-details');
  pruefe('Detail-Bereich „erweitert" (beim Start auf Italienisch „avanzate"): echter Button, aria-controls, initial eingeklappt',
    toggle.tagName === 'BUTTON' && toggle.textContent.trim() === 'avanzate' &&
    toggle.getAttribute('aria-controls') === 'bkl-details' && details.hidden === true);
  klick(dom, toggle);
  pruefe('Detail-Toggle klappt aus (aria-expanded="true")',
    details.hidden === false && toggle.getAttribute('aria-expanded') === 'true');

  // Beschriftungen und Bedienelemente laut Skizze der Autorin (v0.7.0)
  pruefe('Kopfzeile „bger reader" mit pink gefülltem Marken-Icon, kein Zwischentitel',
    shadow.querySelector('#bkl-kopf h2').textContent.trim() === 'bger reader' &&
    /fill="#d63384"/.test(shadow.querySelector('#bkl-kopf h2 svg').outerHTML) &&
    !shadow.querySelector('.bkl-bereich-titel') && !shadow.getElementById('bkl-zaehler'));
  // Standardsprache Italienisch (Vorgabe der Autorin; bewusst keine Automatik nach
  // Browser- oder Seitensprache). Das Markup selbst ist deutsch: Skizze v0.7.0,
  // Kurzformen „Breite", „Zeilen", „Absatz" seit v0.10.0.
  pruefe('Start auf Italienisch: attivare / Sfondo / semplificare / avanzate, Sprachwahl im Kopf, Flagge IT von vier',
    label('bkl-aktiv') === 'attivare' && label('bkl-farbe') === 'Sfondo' && label('bkl-klammern') === 'semplificare' &&
    wert('bkl-sprache').value === 'it' && !!shadow.querySelector('#bkl-kopf #bkl-sprache') &&
    shadow.querySelector('.bkl-sprachwahl').getAttribute('data-sprache') === 'it' &&
    shadow.querySelectorAll('.bkl-sprachwahl .bkl-flagge svg').length === 4 &&
    doc.getElementById('bkl-panel-host').getAttribute('lang') === 'it');
  const sprache = wert('bkl-sprache');
  sprache.value = 'de'; ereignis(dom, sprache, 'change');
  pruefe('Deutsch: einschalten / Hintergrund / einfach / erweitert / Breite / Zeilen / Absatz / Ausrichtung / Spalten / Sprache, Flagge CH',
    label('bkl-aktiv') === 'einschalten' && label('bkl-farbe') === 'Hintergrund' && label('bkl-klammern') === 'einfach' &&
    toggle.textContent.trim() === 'erweitert' && label('bkl-spalte') === 'Breite' && label('bkl-zeilenabstand') === 'Zeilen' &&
    label('bkl-absatz') === 'Absatz' && label('bkl-ausrichtung') === 'Ausrichtung' && label('bkl-spalten') === 'Spalten' &&
    label('bkl-sprache') === 'Sprache' && shadow.querySelector('.bkl-sprachwahl').getAttribute('data-sprache') === 'de');
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
  pruefe('15 Zeilen-Icons aus Colibre (gefüllte Pfade, eigene Farben), kein Schalter „Oberfläche dunkel" mehr',
    zeilenIcons.length === 15 && !wert('bkl-dunkel') && Array.prototype.every.call(zeilenIcons, function (svg) {
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
    /18/.test(wert('bkl-reset').getAttribute('data-tooltip')) && /800/.test(wert('bkl-reset').getAttribute('data-tooltip')));

  // Lesemodus, Stile, Farbschema
  ereignis(dom, Object.assign(wert('bkl-aktiv'), { checked: true }), 'change');
  pruefe('Lesemodus: Klasse bkl-aktiv, CSS-Variablen, Klammern verarbeitet',
    html.classList.contains('bkl-aktiv') && html.style.getPropertyValue('--bkl-size') === '18px' &&
    doc.querySelectorAll('.bkl-fold').length > 0);
  const groesse = wert('bkl-groesse');
  pruefe('Schriftgrösse: Regler 6–50, Anzeige ohne Einheit („18"); Breite: Regler 400–4000 px (Widescreen), Schritt 25',
    groesse.getAttribute('min') === '6' && groesse.getAttribute('max') === '50' && wert('bkl-groesse-w').textContent === '18' &&
    wert('bkl-spalte').getAttribute('min') === '400' && wert('bkl-spalte').getAttribute('max') === '4000' && wert('bkl-spalte').getAttribute('step') === '25');
  groesse.value = '40';
  ereignis(dom, groesse, 'input');
  pruefe('Schriftgrösse 40 -> Anzeige „40", --bkl-size 40px',
    wert('bkl-groesse-w').textContent === '40' && html.style.getPropertyValue('--bkl-size') === '40px');
  const farbe = wert('bkl-farbe');
  farbe.value = 'nacht';
  ereignis(dom, farbe, 'change');
  pruefe('Hintergrund Nacht: --bkl-bg #2b1518, Dropdown trägt data-wert, Panel folgt dem Hintergrund nicht (kein data-schema am Host)',
    html.style.getPropertyValue('--bkl-bg') === '#2b1518' && farbe.getAttribute('data-wert') === 'nacht' &&
    !doc.getElementById('bkl-panel-host').hasAttribute('data-schema'));
  // Oberfläche immer dunkel (Entscheid der Autorin, 0.11.0): keine hellen Tokens,
  // kein Schalter, kein data-schema; nie nach dem System (kein
  // prefers-color-scheme/matchMedia) und nie nach der Browsersprache.
  const alleQuellen = SCRIPT + fs.readFileSync(path.join(EXT, 'popup.js'), 'utf8') + fs.readFileSync(path.join(EXT, 'popup.css'), 'utf8') +
    fs.readFileSync(path.join(EXT, 'popup.html'), 'utf8') + fs.readFileSync(path.join(EXT, 'sprachen.js'), 'utf8');
  pruefe('Oberfläche immer dunkel: Tokens fest in :host (#16141a, Neon-Rand #ff4fa3), color-scheme dark, kein heller Satz (#fff8fb), kein data-schema, keine Einstellung oberflaecheDunkel; nichts vom System (kein prefers-color-scheme, matchMedia, navigator.language)',
    /:host\s*\{[^}]*--ui-bg:\s*#16141a/.test(panelCss) && /:host\s*\{[^}]*--ui-rahmen:\s*#ff4fa3/.test(panelCss) &&
    /#bkl-panel\s*\{[^}]*color-scheme:\s*dark/.test(panelCss) && !/#fff8fb/.test(alleQuellen) && !/data-schema/.test(alleQuellen) &&
    !/oberflaecheDunkel:/.test(alleQuellen) && !/bkl-dunkel/.test(alleQuellen) &&
    !/\(prefers-color-scheme|matchMedia\s*\(|navigator\.language/.test(alleQuellen));
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
  pruefe('Zeilenlänge 80 / Breite 900 -> Klassen bkl-maxw und bkl-breite (Standard 800)',
    html.classList.contains('bkl-maxw') && html.classList.contains('bkl-breite') &&
    html.style.getPropertyValue('--bkl-maxw') === '80ch');
  laenge.value = '0'; ereignis(dom, laenge, 'input');
  spalte.value = '800'; ereignis(dom, spalte, 'input');
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

  // Drucken (auch „Als PDF sichern"): Papierfarben statt Schema, Papierbreite statt
  // Pixelbreite, Klammern wie am Bildschirm (kein Zwangs-Aufklappen mehr), Panel weg.
  const druck = (cssText.match(/@media print \{[\s\S]*$/) || [''])[0];
  pruefe('Druck-CSS: Text schwarz auf weiss, Links schwarz, .main/.middle ohne feste Breite (auch bvger-Spalte), Pfeil schlicht, kein Zwangs-Aufklappen; Panel-Host im Druck ausgeblendet',
    druck.length > 0 && /html\.bkl-aktiv,\s*html\.bkl-aktiv body,[^{]*\{[^}]*background-color:\s*#ffffff !important;\s*color:\s*#000000 !important/.test(druck) &&
    /html\.bkl-aktiv body a,\s*html\.bkl-aktiv div\.eit a \{ color: #000000 !important/.test(druck) &&
    /html\.bkl-aktiv div\.eit \.main,[^{]*\.bkl-text-spalte\s*\{[^}]*width:\s*auto !important/.test(druck) &&
    /html\.bkl-aktiv div\.eit \.middle\s*\{[^}]*float:\s*none !important;[^}]*width:\s*auto !important/.test(druck) &&
    /button\.bkl-toggle\s*\{[^}]*background:\s*none !important/.test(druck) &&
    !/span\.bkl-fold-content\s*\{\s*display:\s*inline !important/.test(cssText) && !/button\.bkl-toggle\s*\{\s*display:\s*none/.test(cssText) &&
    /@media print \{\s*:host \{ display: none !important; \}/.test(panelCss));

  // Sprache der Bedienoberfläche (sprachen.js): vier Wörterbücher mit denselben
  // Schlüsseln; Umschalten schreibt die Texte nach Element-ID in Beschriftungen,
  // Optionen, Tooltips, aria-label und Wertanzeige; Zurücksetzen behält die Sprache.
  const S = dom.window.BGerReaderSprachen;
  function schluessel(o, pfad) {
    return Object.keys(o).sort().reduce(function (liste, k) {
      const p = (pfad ? pfad + '.' : '') + k;
      return liste.concat(o[k] && typeof o[k] === 'object' ? schluessel(o[k], p) : [p]);
    }, []);
  }
  const deSchluessel = schluessel(S.TEXTE.de).join('|');
  const luecken = S.SPRACHEN.filter(function (k) { return schluessel(S.TEXTE[k]).join('|') !== deSchluessel; });
  pruefe('sprachen.js: de/en/fr/it mit identischen Schlüsseln, Sprachwahl im Kopf mit vier Optionen (Eigennamen, lang je Option)',
    S.SPRACHEN.join(',') === 'de,en,fr,it' && luecken.length === 0 && Object.keys(S.TEXTE.de.felder).length >= 20 &&
    Array.prototype.map.call(wert('bkl-sprache').options, function (o) { return o.value + ':' + o.lang + ':' + o.textContent; }).join(',') ===
      'de:de:Deutsch,en:en:English,fr:fr:Français,it:it:Italiano', 'Lücken: ' + luecken.join(','));
  sprache.value = 'fr'; ereignis(dom, sprache, 'change');
  ereignis(dom, Object.assign(wert('bkl-aktiv'), { checked: true }), 'change');
  const pfeilFr = doc.querySelector('.bkl-toggle').title;
  sprache.value = 'de'; ereignis(dom, sprache, 'change');
  const pfeilDe = doc.querySelector('.bkl-toggle').title;
  sprache.value = 'fr'; ereignis(dom, sprache, 'change');
  pruefe('Französisch: Beschriftungen, Knöpfe, Optionen, Tooltip, aria-label, Wertanzeige „désactivé", lang am Host, Pfeil-Titel (auch nachträglich)',
    label('bkl-aktiv') === 'activer' && label('bkl-farbe') === 'Arrière-plan' && label('bkl-klammern') === 'simplifier' &&
    toggle.textContent.trim() === 'avancé' && !!toggle.querySelector('svg') && wert('bkl-reset').textContent.trim() === 'Réinitialiser' &&
    wert('bkl-farbe').options[0].textContent === 'Blanc' && wert('bkl-spalten').options[1].textContent === '2 colonnes' &&
    /mode lecture/.test(wert('bkl-aktiv').getAttribute('data-tooltip')) && wert('bkl-groesse').getAttribute('aria-label') === 'Taille de police' &&
    wert('bkl-absatz-w').textContent === 'désactivé' && wert('bkl-laenge-w').textContent === 'désactivé' &&
    doc.getElementById('bkl-panel-host').getAttribute('lang') === 'fr' && panel.getAttribute('aria-label') === 'Paramètres bger reader' &&
    shadow.querySelector('.bkl-sprachwahl').getAttribute('data-sprache') === 'fr' &&
    pfeilFr === 'Afficher ou masquer la parenthèse' && pfeilDe === 'Klammerbemerkung ein-/ausklappen' &&
    doc.querySelector('.bkl-toggle').title === 'Afficher ou masquer la parenthèse');
  sprache.value = 'it'; ereignis(dom, sprache, 'change');
  klick(dom, wert('bkl-reset'));
  pruefe('Italienisch gespeichert; Zurücksetzen behält die Sprache (attivare) und stellt Breite 800 ein; unbekannter Code fällt auf Deutsch zurück',
    JSON.parse(dom.window.localStorage.getItem(SCHLUESSEL)).sprache === 'it' && sprache.value === 'it' && label('bkl-aktiv') === 'attivare' &&
    wert('bkl-spalte').value === '800' && wert('bkl-spalte-w').textContent === '800px' &&
    S.texte('xx') === S.TEXTE.de && !html.classList.contains('bkl-aktiv'));
  sprache.value = 'de'; ereignis(dom, sprache, 'change');

  // Firefox-Content-Skripte: der Skript-Kontext (globalThis, eine Sandbox) ist
  // nicht das Fenster der Seite. sprachen.js registriert sich an beiden,
  // content.js und popup.js lesen den nackten Bezeichner – über
  // window.BGerReaderSprachen blieb das Panel in Firefox deutsch (0.10.0).
  const vm = require('vm');
  const sandbox = vm.createContext({ window: {} });
  vm.runInContext(SPRACHEN_SRC, sandbox);
  const popupJsQuelle = fs.readFileSync(path.join(EXT, 'popup.js'), 'utf8');
  pruefe('sprachen.js in einer Sandbox mit fremdem window (Firefox-Content-Skript): am Skript-Kontext und am Fenster registriert; content.js und popup.js lesen den Bezeichner BGerReaderSprachen, nicht window',
    sandbox.BGerReaderSprachen && typeof sandbox.BGerReaderSprachen.uebersetze === 'function' &&
    sandbox.window.BGerReaderSprachen === sandbox.BGerReaderSprachen &&
    /\(typeof BGerReaderSprachen !== 'undefined' && BGerReaderSprachen\) \|\| window\.BGerReaderSprachen \|\|/.test(SCRIPT) &&
    /\(typeof BGerReaderSprachen !== 'undefined' && BGerReaderSprachen\) \|\| window\.BGerReaderSprachen \|\|/.test(popupJsQuelle));

  // Übersetzungstabelle SPRACHEN.md (tools/sprachen-tabelle.js): aus dem Code
  // erzeugt, zurückgeschrieben identisch; eine Korrektur in der Tabelle landet
  // im Code. Ob die Datei im Repo aktuell ist, prüft release.sh (pruefen).
  const ST = require(path.join(WURZEL, 'tools', 'sprachen-tabelle.js'));
  const texteJetzt = ST.texteLaden(SPRACHEN_SRC);
  const tabelle = ST.tabelleErzeugen(texteJetzt);
  const zurueck = ST.anwenden(texteJetzt, ST.tabelleLesen(tabelle));
  const korrigiert = ST.anwenden(texteJetzt, ST.tabelleLesen(tabelle.replace('| off |', '| switched off |')));
  const neuQuelle = ST.quelleMitBlock(SPRACHEN_SRC, ST.textBlock(korrigiert));
  let kaputt = null;
  try { ST.anwenden(texteJetzt, ST.tabelleLesen(tabelle.replace('| off |', '|  |'))); } catch (e) { kaputt = e.message; }
  // Sonderzeichen: senkrechter Strich und Backslash im Text überleben den Rundlauf (CodeQL: beide maskieren)
  const sonder = JSON.parse(JSON.stringify(texteJetzt));
  sonder.fr.allgemein.aus = 'a | b \\ c \\| d';
  const sonderZurueck = ST.anwenden(sonder, ST.tabelleLesen(ST.tabelleErzeugen(sonder)));
  pruefe('SPRACHEN.md: Tabelle mit allen Texten (>= 80) in vier Sprachen, Rundlauf Tabelle -> Code identisch (auch mit | und \\ im Text), Korrektur landet im Code (nur en), leere Zelle wird abgewiesen, Werkzeug schreibt ladbares sprachen.js',
    sonderZurueck.fr.allgemein.aus === 'a | b \\ c \\| d' && ST.texteLaden(ST.quelleMitBlock(SPRACHEN_SRC, ST.textBlock(sonder))).fr.allgemein.aus === 'a | b \\ c \\| d' &&
    ST.stellen(texteJetzt).length >= 80 && (tabelle.match(/^\| `/gm) || []).length === ST.stellen(texteJetzt).length &&
    JSON.stringify(zurueck) === JSON.stringify(texteJetzt) &&
    ST.texteLaden(neuQuelle).en.allgemein.aus === 'switched off' && ST.texteLaden(neuQuelle).de.allgemein.aus === 'aus' &&
    ST.texteLaden(neuQuelle).fr.felder['bkl-reset'].tip === texteJetzt.fr.felder['bkl-reset'].tip &&
    /leere Zelle/.test(kaputt || ''), kaputt);

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
  speicher[SCHLUESSEL] = { schriftgroesse: 22, aktiv: true, schriftart: 'gibts-nicht-mehr', oberflaecheDunkel: true };
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
  pruefe('pagehide schreibt den letzten Wert genau einmal nach; veralteter Schlüssel oberflaecheDunkel (0.10.0) wird nicht mitgeschrieben',
    t.gesetzt.length === 2 && speicher[SCHLUESSEL].schriftgroesse === 30 && !('oberflaecheDunkel' in speicher[SCHLUESSEL]));
  // Loslassen eines Reglers (change) und Auswahl/Häkchen (change) schreiben
  // sofort, auch innerhalb der Bündelung: Firefox verwirft den erst bei
  // pagehide nachgeholten Schreibvorgang (Browser-Smoke-Test), Chrome nicht.
  t.gesetzt.length = 0;
  groesse.value = '16'; ereignis(t.dom, groesse, 'input'); ereignis(t.dom, groesse, 'change');
  const farbeSofort = t.shadow.getElementById('bkl-farbe');
  farbeSofort.value = 'sepia'; ereignis(t.dom, farbeSofort, 'change');
  pruefe('Regler loslassen und Auswahl ändern schreiben sofort (2 Schreibvorgänge: 16px, sepia)',
    t.gesetzt.length === 2 && speicher[SCHLUESSEL].schriftgroesse === 16 && speicher[SCHLUESSEL].farbschema === 'sepia',
    t.gesetzt.length + ' Schreibvorgänge');

  // Bedienung vor dem Laden: ein Klick, bevor die Einstellungen aus dem Speicher
  // da sind, darf weder Standardwerte über die gespeicherten schreiben noch vom
  // nachträglichen Laden umgeworfen werden (Windows-Firefox: erster
  // Speicherzugriff über eine Sekunde, Browser-Smoke-Test).
  {
    const speicherV = {};
    speicherV[SCHLUESSEL] = { schriftgroesse: 26, aktiv: true, farbschema: 'sepia' };
    const v = domMitChrome(SYNTHESE, speicherV, null, true);
    const host = v.doc.getElementById('bkl-panel-host');
    const aktiv = v.shadow.getElementById('bkl-aktiv');
    aktiv.checked = false; ereignis(v.dom, aktiv, 'change');
    const vorher = { geschrieben: v.gesetzt.length, bereit: host.hasAttribute('data-bereit') };
    v.laden();
    const nachher = { size: v.doc.documentElement.style.getPropertyValue('--bkl-size'), aktiv: v.doc.documentElement.classList.contains('bkl-aktiv'),
      bereit: host.hasAttribute('data-bereit'), gespeichert: speicherV[SCHLUESSEL].schriftgroesse };
    aktiv.checked = false; ereignis(v.dom, aktiv, 'change');
    pruefe('vor dem Laden: Klick schreibt nichts, kein data-bereit; nach dem Laden: 26px, aktiv, data-bereit, Klick wirkt',
      vorher.geschrieben === 0 && !vorher.bereit && nachher.size === '26px' && nachher.aktiv && nachher.bereit && nachher.gespeichert === 26 &&
      v.gesetzt.length === 1 && !v.doc.documentElement.classList.contains('bkl-aktiv'),
      JSON.stringify({ vorher: vorher, nachher: nachher, danach: v.gesetzt.length }));
  }

  // Icon-Klick in der Symbolleiste: background.js schickt eine Nachricht, das
  // Panel öffnet sich als mittiger Dialog (Klasse bkl-mittig); zweiter Klick
  // schliesst ihn, Escape ebenso; fremde Nachrichten werden ignoriert.
  {
    const antworten = [];
    const panel = t.shadow.getElementById('bkl-panel');
    const pink = t.shadow.getElementById('bkl-button');
    const fremd = t.nachrichten[0]({ typ: 'etwas-anderes' }, {}, function (a) { antworten.push(a); });
    const ignoriert = panel.hidden === true && antworten.length === 0 && fremd === undefined;
    t.nachrichten[0]({ typ: 'bger-reader-einstellungen' }, {}, function (a) { antworten.push(a); });
    const offen = panel.hidden === false && panel.classList.contains('bkl-mittig') && pink.hidden === true &&
      antworten.length === 1 && antworten[0].ok === true && antworten[0].offen === true && panel.contains(t.shadow.activeElement);
    t.nachrichten[0]({ typ: 'bger-reader-einstellungen' }, {}, function (a) { antworten.push(a); });
    const zu = panel.hidden === true && !panel.classList.contains('bkl-mittig') && pink.hidden === false && antworten[1].offen === false;
    t.nachrichten[0]({ typ: 'bger-reader-einstellungen' }, {}, function () {});
    t.doc.dispatchEvent(new t.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    const escape = panel.hidden === true && !panel.classList.contains('bkl-mittig');
    klick(t.dom, pink);
    pruefe('Icon-Klick (Nachricht von background.js): mittiger Dialog auf/zu, Antwort { ok, offen }, Escape schliesst, fremde Nachricht ignoriert; Pink-Button öffnet danach wieder oben rechts',
      t.nachrichten.length === 1 && ignoriert && offen && zu && escape && panel.hidden === false && !panel.classList.contains('bkl-mittig'),
      JSON.stringify({ ignoriert: ignoriert, offen: offen, zu: zu, escape: escape, antworten: antworten }));
    t.shadow.getElementById('bkl-schliessen').click();
  }

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
  t.listener[0]({ [SCHLUESSEL]: { newValue: Object.assign({}, speicher[SCHLUESSEL], { schriftgroesse: 24, spalten: 2, sprache: 'en' }) } }, 'local');
  pruefe('fremde Änderung: Stil sofort (24px, 2 Spalten), Sprache Englisch (Beschriftung, Pfeil-Titel), Panel synchron, Folds unberührt, kein Rückschreiben',
    html.style.getPropertyValue('--bkl-size') === '24px' && t.doc.querySelector('.bkl-spalten-container') &&
    t.shadow.getElementById('bkl-groesse').value === '24' && t.doc.querySelector('.bkl-fold') === foldJetzt &&
    t.shadow.querySelector('label[for="bkl-aktiv"]').textContent === 'enable' && t.shadow.getElementById('bkl-sprache').value === 'en' &&
    t.doc.querySelector('.bkl-toggle').title === 'Show or hide parenthetical' && t.gesetzt.length === 0);
  // zeilenabstand 1.7: das Fremd-Paket darf keinem eigenen Schreibvorgang gleichen,
  // sonst gälte es als Echo (der Mock liefert keine Echos, die Signaturen bleiben).
  t.listener[0]({ [SCHLUESSEL]: { newValue: Object.assign({}, speicher[SCHLUESSEL], { klammern: false, zeilenabstand: 1.7 }) } }, 'local');
  const nachAus = t.doc.querySelectorAll('.bkl-fold').length;
  t.listener[0]({ [SCHLUESSEL]: { newValue: { aktiv: false } } }, 'session');
  pruefe('fremdes Ausschalten der Klammern entfernt Folds; andere Speicherbereiche werden ignoriert',
    nachAus === 0 && html.classList.contains('bkl-aktiv'));

  // Echo eines älteren EIGENEN Schreibens (Chrome meldet es asynchron) darf eine
  // jüngere Einstellung nicht zurückdrehen: Hintergrund schreibt sofort (führende
  // Kante), Schriftart fällt in die Bündelung, dann trifft das Echo des ersten ein.
  t.dom.window.dispatchEvent(new t.dom.window.Event('pagehide')); // ausstehende Bündelung leeren
  const echtesNow = t.dom.window.Date.now;
  t.dom.window.Date.now = function () { return echtesNow() + 10000; }; // Bündelungsfenster sicher vorbei
  const farbeSel = t.shadow.getElementById('bkl-farbe');
  farbeSel.value = 'sepia'; ereignis(t.dom, farbeSel, 'change');
  const echoPaket = JSON.parse(JSON.stringify(speicher[SCHLUESSEL]));
  const artSel = t.shadow.getElementById('bkl-art');
  artSel.value = 'atkinson'; ereignis(t.dom, artSel, 'change');
  t.listener[0]({ [SCHLUESSEL]: { newValue: echoPaket } }, 'local');
  t.dom.window.Date.now = echtesNow;
  pruefe('Echo eines älteren eigenen Schreibens dreht die jüngere Einstellung nicht zurück (Schriftart bleibt Atkinson)',
    echoPaket.farbschema === 'sepia' && echoPaket.schriftart !== 'atkinson' &&
    /Atkinson/.test(html.style.getPropertyValue('--bkl-font')) && artSel.value === 'atkinson');
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
  const MUSTER = ['https://search.bger.ch/*', 'https://relevancy.bger.ch/*', 'http://relevancy.bger.ch/*', 'https://bvger.weblaw.ch/*'];
  pruefe('Manifest: sprachen.js vor content.js, fonts/*.woff2 für alle vier Seiten-Muster (bger.ch, bvger.weblaw.ch), Beschreibung <= 132 Zeichen, Icons 16/48/128 vorhanden, einziges Recht storage (kein tabs, keine host_permissions)',
    manifest.content_scripts[0].js.join(',') === 'sprachen.js,content.js' && fs.existsSync(path.join(EXT, 'sprachen.js')) &&
    (manifest.permissions || []).join(',') === 'storage' && !manifest.host_permissions && !manifest.optional_permissions &&
    (war.resources || []).indexOf('fonts/*.woff2') !== -1 &&
    MUSTER.every(function (m) { return (war.matches || []).indexOf(m) !== -1 && manifest.content_scripts[0].matches.indexOf(m) !== -1; }) &&
    manifest.description.length <= 132 &&
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

  pruefe('Manifest: action ohne default_popup, background als service_worker UND scripts, Mindestversionen Chrome >= 121, Firefox >= 140, Firefox für Android >= 142 (data_collection_permissions)',
    !!manifest.action.default_title && !manifest.action.default_popup &&
    manifest.background.service_worker === 'background.js' && (manifest.background.scripts || []).join(',') === 'background.js' &&
    parseInt(manifest.minimum_chrome_version, 10) >= 121 &&
    parseInt(manifest.browser_specific_settings.gecko.strict_min_version, 10) >= 140 &&
    parseInt(manifest.browser_specific_settings.gecko_android.strict_min_version, 10) >= 142);

  // background.js mit gemockter chrome-API
  {
    const dom = new JSDOM('<!doctype html><html><body></body></html>',
      { url: 'chrome-extension://test/background.html', runScripts: 'outside-only', pretendToBeVisual: true });
    const sitzung = {}, klickHandler = [], erstellt = [], aktualisiert = [], gesendet = [];
    dom.window.chrome = {
      action: { onClicked: { addListener: function (fn) { klickHandler.push(fn); } } },
      // Tab 7 hat ein Content-Skript (Entscheidseite) und antwortet; Tab 8 nicht
      // (Chrome meldet das als runtime.lastError im Callback).
      tabs: {
        sendMessage: function (id, nachricht, cb) {
          gesendet.push({ id: id, nachricht: nachricht });
          if (id === 7) { cb({ ok: true, offen: true }); return; }
          dom.window.chrome.runtime.lastError = { message: 'Could not establish connection. Receiving end does not exist.' };
          cb(undefined);
          dom.window.chrome.runtime.lastError = null;
        }
      },
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
      P.zentriert({ left: 0, top: 0, width: 1440, height: 900 }, 700, 860).left === 370 &&
      P.zentriert({ left: 0, top: 0, width: 400, height: 300 }, 700, 860).top === 0);
    async function klicke(tab) {
      klickHandler[0](tab);
      for (let i = 0; i < 4; i++) await new Promise(function (r) { setTimeout(r, 0); });
    }
    await klicke({ id: 7 });
    const dialog = gesendet.length === 1 && gesendet[0].id === 7 && gesendet[0].nachricht.typ === P.NACHRICHT_DIALOG && erstellt.length === 0;
    await klicke({ id: 8 });
    await klicke({ id: 8 });
    await klicke(undefined);
    pruefe('Icon-Klick: Entscheidseite im Tab -> Nachricht an das Content-Skript (mittiger Dialog), kein Fenster; ohne Antwort -> popup.html mittig als eigenes Fenster; weitere Klicks fokussieren statt zu duplizieren (auch ohne Tab)',
      klickHandler.length === 1 && dialog && gesendet.length === 3 && erstellt.length === 1 && /popup\.html$/.test(erstellt[0].url) &&
      erstellt[0].type === 'popup' && erstellt[0].width === 700 && erstellt[0].left === 470 && erstellt[0].top === 10 && erstellt[0].height === 960 &&
      sitzung['bger-reader-popup-fenster'] === 42 && aktualisiert.length === 2 && aktualisiert[0].daten.focused === true &&
      P.NACHRICHT_DIALOG === 'bger-reader-einstellungen' && SCRIPT.indexOf("NACHRICHT_DIALOG = 'bger-reader-einstellungen'") !== -1,
      JSON.stringify({ gesendet: gesendet.length, erstellt: erstellt.length, aktualisiert: aktualisiert.length }));
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
      'bkl-laenge', 'bkl-silben', 'bkl-ausrichtung', 'bkl-spalten', 'bkl-reset', 'bkl-sprache'];
    const popupIds = Array.prototype.map.call(pdoc.querySelectorAll('input, select, button'), function (el) { return el.id; });
    pruefe('Pop-up enthält alle 19 Bedienelemente des Panels und keine fremden',
      KONTROLLEN.every(function (id) { return popupIds.indexOf(id) !== -1; }) &&
      popupIds.every(function (id) { return panelIds[id]; }),
      'fehlt: ' + KONTROLLEN.filter(function (id) { return popupIds.indexOf(id) === -1; }).join(',') +
      ' fremd: ' + popupIds.filter(function (id) { return !panelIds[id]; }).join(','));
    const ohne = [];
    pdoc.querySelectorAll('input, select, button').forEach(function (el) {
      if (!el.getAttribute('data-tooltip') || !el.getAttribute('aria-label') || el.hasAttribute('title')) ohne.push(el.id);
    });
    function plabel(id) { const l = pdoc.querySelector('label[for="' + id + '"]'); return l ? l.textContent.trim() : null; }
    pruefe('Pop-up: Beschriftungen, Regler 6–50 und Breite 400–4000, data-tooltip statt title, kein Zähler-Hinweis',
      pdoc.querySelector('h1').textContent.trim() === 'bger reader' && plabel('bkl-aktiv') === 'einschalten' &&
      plabel('bkl-farbe') === 'Hintergrund' && plabel('bkl-klammern') === 'einfach' && plabel('bkl-sprache') === 'Sprache' &&
      !!pdoc.querySelector('#bkl-kopf #bkl-sprache') && /<script src="sprachen\.js"><\/script>\s*<script src="popup\.js">/.test(popupHtml) &&
      pdoc.getElementById('bkl-details-toggle').textContent.trim() === 'erweitert' &&
      pdoc.getElementById('bkl-groesse').getAttribute('max') === '50' && pdoc.getElementById('bkl-spalte').getAttribute('max') === '4000' && ohne.length === 0 &&
      !pdoc.getElementById('bkl-zaehler') && !!pdoc.getElementById('bkl-tooltip'), ohne.join(','));
    // Rohstrings vergleichen (jsdom serialisiert <path/> zu <path></path>)
    const popupIcons = popupHtml.match(/<span class="bkl-icon">(<svg[\s\S]*?<\/svg>)<\/span>/g) || [];
    const popupFlaggen = popupHtml.match(/<span class="bkl-flagge"[^>]*>[\s\S]*?<\/span>/g) || [];
    pruefe('Pop-up-Icons identisch zu content.js (15 Colibre-SVGs, Marken-Icon pink, 4 Flaggen de/en/fr/it)',
      popupIcons.length === 15 && popupIcons.every(function (z) {
        return SCRIPT.indexOf(z.replace(/^<span class="bkl-icon">|<\/span>$/g, '')) !== -1;
      }) && /fill="#d63384"/.test(pdoc.querySelector('h1 svg').outerHTML) &&
      popupFlaggen.length === 4 && popupFlaggen.every(function (z) { return SCRIPT.indexOf(z) !== -1; }) &&
      popupFlaggen.map(function (z) { return (/data-flagge="(\w+)"/.exec(z) || [])[1]; }).join(',') === 'de,en,fr,it');
    pruefe('Pop-up ohne Inline-Script (MV3-CSP), CSS grosszügiger als das Panel (Schalter 46px statt 40px)',
      !/<script(?![^>]*\bsrc=)[^>]*>/.test(popupHtml) && /<script src="popup\.js">/.test(popupHtml) &&
      /font-size:\s*16px/.test(popupCss) && /input\[type="checkbox"\]\s*\{[^}]*width:\s*46px/.test(popupCss) &&
      /input\[type="checkbox"\]\s*\{[^}]*width:\s*40px/.test(SCRIPT));
    // Design-Tokens („Klar", nur dunkel): Pop-up-CSS (:root) muss dieselben
    // Werte tragen wie das Panel (:host) in content.js.
    function tokens(css, selektor) {
      const i = css.indexOf(selektor);
      const block = i === -1 ? '' : css.slice(i, css.indexOf('}', i));
      return (block.match(/--ui-[a-z0-9-]+:\s*[^;]+;/g) || []).map(function (z) { return z.replace(/\s+/g, ' '); });
    }
    const panelTokens = tokens(SCRIPT, ':host {');
    pruefe('Design-Tokens (18, dunkel) im Pop-up-CSS identisch zum Panel; Schrift Atkinson Hyperlegible Next, Herz-Regler, Neon-Rand #ff4fa3 und Violett als Token; Titel fett ohne Versalien, Beschriftungen normal',
      panelTokens.length === 18 && panelTokens.join('|') === tokens(popupCss, ':root {').join('|') &&
      /--ui-bg: #16141a/.test(panelTokens.join('|')) && /--ui-schrift: "Atkinson Hyperlegible Next"/.test(panelTokens.join('|')) &&
      /--ui-herz: url\("data:image\/svg\+xml/.test(panelTokens.join('|')) && /--ui-rahmen: #ff4fa3/.test(panelTokens.join('|')) &&
      /--ui-violett: #/.test(panelTokens.join('|')) && /\ncolor-scheme|color-scheme: dark/.test(popupCss) && !/color-scheme:\s*light/.test(popupCss + SCRIPT) &&
      /\n\s*h2\s*\{[^}]*font-weight:\s*700/.test(SCRIPT) && /\nh1\s*\{[^}]*font-weight:\s*700/.test(popupCss) &&
      !/text-transform:\s*uppercase/.test(SCRIPT) && !/text-transform:\s*uppercase/.test(popupCss) &&
      /\n\s*label\s*\{[^}]*font-weight:\s*400/.test(SCRIPT) && /\nlabel\s*\{[^}]*font-weight:\s*400/.test(popupCss),
      String(panelTokens.length));
    // Mittiger Dialog (Icon-Klick): dasselbe Panel mit den Massen des Pop-up-Fensters
    pruefe('Mittiger Dialog (bkl-mittig) im Panel-CSS: 700px breit wie POPUP_BREITE (nicht 660, Wunsch der Autorin), zentriert, Schrift 16px wie popup.css; Schalter 46x26, Regler 240px, Auswahllisten 240px wie im Pop-up',
      /#bkl-panel\.bkl-mittig\s*\{[^}]*top:\s*50%;[^}]*left:\s*50%;[^}]*transform:\s*translate\(-50%, -50%\);[^}]*width:\s*700px;[^}]*font-size:\s*16px/.test(SCRIPT) &&
      /POPUP_BREITE = 700;/.test(bgQuelle) && !/\b66\d\s*px/.test(SCRIPT + popupCss) &&
      /\.bkl-mittig input\[type="checkbox"\]\s*\{\s*width:\s*46px;\s*height:\s*26px/.test(SCRIPT) &&
      /input\[type="checkbox"\]\s*\{[^}]*width:\s*46px;\s*height:\s*26px/.test(popupCss) &&
      /\.bkl-mittig \.bkl-regler input\[type="range"\]\s*\{\s*width:\s*240px/.test(SCRIPT) && /\.bkl-regler input\[type="range"\]\s*\{\s*width:\s*240px/.test(popupCss) &&
      /\.bkl-mittig select\s*\{\s*width:\s*240px/.test(SCRIPT) && /\nselect\s*\{[^}]*width:\s*240px/.test(popupCss));
    const fontUrls = [];
    popupCss.replace(/url\("(fonts\/[^"]+)"\)/g, function (m2, u) { fontUrls.push(u); return m2; });
    pruefe('Pop-up-CSS: pink, Vorschau-Regeln für alle Schriftarten/Hintergründe, 8 @font-face auf existierende Dateien (Atkinson 400 und 700)',
      /accent-color:\s*#d63384/.test(popupCss) && /#bkl-schliessen\s*\{[^}]*background:\s*#d63384/.test(popupCss) &&
      ['atkinson', 'luciole', 'opendyslexic', 'comicneue', 'garamond', 'liberation-sans', 'liberation-serif', 'sans', 'serif']
        .every(function (k) { return popupCss.indexOf('#bkl-art option[value="' + k + '"]') !== -1; }) &&
      [['hell', '#ffffff', '#1a1a1a'], ['sepia', '#f4ecd8', '#3b2f20'], ['dunkel', '#181818', '#e8e8e8'],
       ['kontrast', '#000000', '#ffffff'], ['nacht', '#2b1518', '#f3e3e3']].every(function (t) {
        return new RegExp('#bkl-farbe\\[data-wert="' + t[0] + '"\\]\\s*\\{\\s*background:\\s*' + t[1] + ';\\s*color:\\s*' + t[2]).test(popupCss) &&
          new RegExp(t[0] + ":\\s*\\{ bg: '" + t[1] + "', fg: '" + t[2] + "'").test(SCRIPT);
      }) &&
      fontUrls.length === 8 && fontUrls.every(function (u) { return fs.existsSync(path.join(EXT, u)); }));
  }

  // popup.js: Schlüssel/Standards wie content.js, lädt, speichert, synchronisiert
  {
    pruefe('popup.js: gleicher Speicherschlüssel und gleiche Standardwerte wie content.js (ohne oberflaecheDunkel), kein Zähler mehr',
      popupJs.indexOf(SCHLUESSEL) !== -1 && /schriftgroesse:\s*18/.test(popupJs) && /spaltenbreite:\s*800/.test(popupJs) &&
      /sprache:\s*'it'/.test(popupJs) && /sprache:\s*'it'/.test(SCRIPT) &&
      !/oberflaecheDunkel:/.test(popupJs) && !/oberflaecheDunkel:/.test(SCRIPT) &&
      /zeilenabstand:\s*1\.6/.test(popupJs) && /ausrichtung:\s*'links'/.test(popupJs) && /spalten:\s*1\b/.test(popupJs) &&
      /absatzabstand:\s*0\b/.test(popupJs) && popupJs.indexOf('bger-reader-zaehler') === -1 &&
      SCRIPT.indexOf('bger-reader-zaehler') === -1);
    const dom = new JSDOM(popupHtml, { url: 'chrome-extension://test/popup.html', runScripts: 'outside-only', pretendToBeVisual: true });
    const speicher = {};
    speicher[SCHLUESSEL] = { schriftgroesse: 22, farbschema: 'dunkel', schriftart: 'garamond', oberflaecheDunkel: true };
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
    dom.window.eval(SPRACHEN_SRC);
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
    pruefe('Pop-up speichert in denselben Speicher (aktiv, 2 Spalten, Absatzabstand 1.5); veraltetes oberflaecheDunkel entfernt, kein data-schema',
      speicher[SCHLUESSEL].aktiv === true && speicher[SCHLUESSEL].spalten === 2 &&
      speicher[SCHLUESSEL].absatzabstand === 1.5 && doc.getElementById('bkl-absatz-w').textContent === '1.5' &&
      !('oberflaecheDunkel' in speicher[SCHLUESSEL]) && !doc.body.hasAttribute('data-schema'));
    listener[0]({ [SCHLUESSEL]: { newValue: { schriftgroesse: 26 } } }, 'local');
    pruefe('Änderung vom Seiten-Panel erscheint live im Fenster',
      doc.getElementById('bkl-groesse').value === '26' && doc.getElementById('bkl-groesse-w').textContent === '26');
    // Echo eines älteren eigenen Schreibens (asynchron) setzt den Regler nicht zurück
    const g = doc.getElementById('bkl-groesse');
    g.value = '20'; ereignis(dom, g, 'input');
    const echoPaket = JSON.parse(JSON.stringify(speicher[SCHLUESSEL]));
    g.value = '30'; ereignis(dom, g, 'input');
    listener[0]({ [SCHLUESSEL]: { newValue: echoPaket } }, 'local');
    pruefe('Pop-up: Echo eines älteren eigenen Schreibens setzt den Regler nicht zurück (bleibt 30)',
      echoPaket.schriftgroesse === 20 && g.value === '30' && doc.getElementById('bkl-groesse-w').textContent === '30');
    // Sprache im Pop-up: Start auf Italienisch (Standard); Umschalten auf Französisch schreibt
    // Beschriftungen, Fenstertitel, <html lang>, Bereiche und Flagge, gespeichert; Zurücksetzen behält sie
    const sprache = doc.getElementById('bkl-sprache');
    const startIt = doc.title === 'bger reader – Impostazioni' && doc.documentElement.lang === 'it' && sprache.value === 'it' &&
      doc.querySelector('.bkl-sprachwahl').getAttribute('data-sprache') === 'it';
    sprache.value = 'fr'; ereignis(dom, sprache, 'change');
    const uebersetzt = doc.querySelector('label[for="bkl-farbe"]').textContent === 'Arrière-plan' && doc.title === 'bger reader – Paramètres' &&
      doc.documentElement.lang === 'fr' && doc.querySelector('main').getAttribute('aria-label') === 'Paramètres bger reader' &&
      doc.getElementById('bkl-details').getAttribute('aria-label') === 'Paramètres avancés' && speicher[SCHLUESSEL].sprache === 'fr' &&
      doc.querySelector('.bkl-sprachwahl').getAttribute('data-sprache') === 'fr';
    klick(dom, doc.getElementById('bkl-reset'));
    pruefe('Pop-up: Start auf Italienisch; Französisch (Beschriftung, Fenstertitel, lang, Bereiche, Flagge, gespeichert); Zurücksetzen behält die Sprache, Breite 800',
      startIt && uebersetzt && speicher[SCHLUESSEL].sprache === 'fr' && speicher[SCHLUESSEL].aktiv === false && sprache.value === 'fr' &&
      doc.getElementById('bkl-reset').textContent.trim() === 'Réinitialiser' && doc.getElementById('bkl-spalte').value === '800');
  }

  /* ---------- 8. bvger.weblaw.ch: React-App, nachgeladener Entscheid ---------- */
  console.log('\n[8] bvger.weblaw.ch');
  /* Asynchron: der MutationObserver in content.js arbeitet gedrosselt (150 ms). */
  {
    const warte = function () { return new Promise(function (r) { setTimeout(r, 400); }); };
    // Absatz mit Markierungs-Chip der Site (Zitat ATAF 2007/6 mit Beschriftung „Zitierte BVGE" und Icons)
    const ABSAETZE = '<p id="b1"> 1.  Le Tribunal examine la recevabilité (cf. <span name="16180,16191" class="markedHtmlContentWrapper  markedOccurrence_wlclight8" style="white-space: nowrap;">ATAF 2007/6  <span class="wlclight8 "><i style="font-family: Poppins;">Zitierte BVGE</i><i aria-hidden="true" class="plus square icon"></i></span></span> consid. 1). </p>' +
      '<p id="b2"> 2.  La recourante a qualité pour recourir (cf. art. 48 al. 1 PA). </p>';
    const RUBRUM = '<title></title><table><tbody><tr><td><p> Cour II </p></td><td><p> Arrêt du 4 septembre 2026 </p><p> Pascal Richard (président du collège), </p></td></tr></tbody></table>';

    // Start mit leerer Hülle (Entscheid noch nicht geladen), Lesemodus gespeichert an
    const dom = bvgerDom(null, { aktiv: true });
    const doc = dom.window.document;
    const html = doc.documentElement;
    const R = dom.window.BGerReader;
    const cssText = doc.getElementById('bkl-style').textContent;
    const block = doc.getElementById('bvger-text');
    pruefe('Hülle ohne Entscheid: Lesemodus an, keine Blöcke/Folds; CSS: .bkl-text p in den Absatzregeln, Segment/Seitenleiste per ID, Markierungs-Schutz, Textbreite',
      html.classList.contains('bkl-aktiv') && doc.querySelectorAll('.bkl-fold').length === 0 && !block.classList.contains('bkl-text') &&
      /html\.bkl-aktiv \.bkl-text,\s*html\.bkl-aktiv \.bkl-text p,\s*html\.bkl-aktiv div\.paraatf/.test(cssText) &&
      ['bkl-maxw', 'bkl-ausrichtung', 'bkl-absatz'].every(function (k) { return cssText.indexOf('html.bkl-aktiv.' + k + ' .bkl-text p,') !== -1; }) &&
      /html\.bkl-aktiv #sideMenuCacheViewAccordionComputer[^{]*\{[^}]*var\(--bkl-bg\)/.test(cssText) &&
      /html\.bkl-aktiv \.markedHtmlContentWrapper\s*\{[^}]*#1a1a1a/.test(cssText) &&
      /html\.bkl-aktiv\.bkl-breite \.bkl-text-spalte\s*\{[^}]*var\(--bkl-spalte\)/.test(cssText));

    // Entscheid wird nachgeladen (wie React: innerHTML des Textblocks)
    block.innerHTML = RUBRUM + ABSAETZE;
    await warte();
    const fold = doc.querySelector('.bkl-fold');
    pruefe('nachgeladen: bkl-text + lang="fr", Spaltenrahmen bkl-text-spalte, Zitat mit Chip eingeklappt (Chip-Text nicht im Klammertext), Gesetzesverweis offen',
      block.classList.contains('bkl-text') && block.lang === 'fr' && doc.querySelector('.column').classList.contains('bkl-text-spalte') &&
      doc.querySelectorAll('.bkl-fold').length === 1 && !!fold && fold.closest('p').id === 'b1' &&
      !!fold.querySelector('.markedHtmlContentWrapper') && /^\(cf\. ATAF 2007\/6.*consid\. 1\)$/s.test(fold.querySelector('.bkl-fold-content').textContent.trim()) &&
      R.textKarteAufbauen(doc.getElementById('b1')).gesamt.indexOf('Zitierte BVGE') === -1);

    // Klappen ändert nur Klassen: der Observer baut nichts neu auf
    klick(dom, fold.querySelector('.bkl-toggle'));
    await warte();
    // App ersetzt den Inhalt (Markierung ein/aus, anderer Entscheid): Folds neu
    const foldVorher = doc.querySelector('.bkl-fold');
    block.innerHTML = ABSAETZE.replace('ATAF 2007/6', 'ATAF 2014/24') + '<p id="b3"> 3.  Weiter (vgl. BVGE 2014/1 E. 4.3; 2011/48 E. 4.5). </p>';
    await warte();
    pruefe('Aufklappen bleibt erhalten; ersetzter Inhalt -> Folds neu aufgebaut (2), lang bleibt',
      foldVorher === fold && fold.classList.contains('bkl-offen') &&
      doc.querySelectorAll('.bkl-fold').length === 2 && doc.querySelector('.bkl-fold') !== fold && block.lang === 'fr');

    // Navigation ohne Neuladen: Segment verschwindet (Dashboard) und kommt als neues Element zurück
    const segment = doc.getElementById('customContentSegment');
    const spalte = segment.parentElement;
    spalte.removeChild(segment);
    await warte();
    const ohneSegment = doc.querySelectorAll('.bkl-fold').length;
    const neu = doc.createElement('div');
    neu.id = 'customContentSegment';
    neu.className = 'ui segment';
    neu.innerHTML = '<div class="ui stretched grid"><h2 class="ui header">BVGer B-4321/2025</h2></div>' +
      '<div style="margin: 50px;"><p> Zwischenentscheidvom 4. September 2026 </p><p> 1. Das Gericht prüft (vgl. BVGE 2014/26 E. 5). </p><p> 2. Offen (Art. 48 VwVG). </p></div>';
    spalte.appendChild(neu);
    await warte();
    const neuerBlock = neu.querySelector('.bkl-text');
    const shadow = doc.getElementById('bkl-panel-host').shadowRoot;
    const spalten = shadow.getElementById('bkl-spalten'); spalten.value = '2'; ereignis(dom, spalten, 'change');
    const breite = shadow.getElementById('bkl-spalte'); breite.value = '900'; ereignis(dom, breite, 'input');
    pruefe('Navigation: Dashboard ohne Folds; neuer Entscheid als neues Element: bkl-text + lang="de", 1 Fold; 2 Spalten -> Textblock ist Spalten-Container, Textbreite 900 -> bkl-breite',
      ohneSegment === 0 && !!neuerBlock && neuerBlock.lang === 'de' && neu.querySelectorAll('.bkl-fold').length === 1 &&
      neuerBlock.classList.contains('bkl-spalten-container') && html.classList.contains('bkl-breite'));
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

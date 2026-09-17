/* Tests für den BGer Reader – Kernlogik gegen echte und synthetische Seiten.
 * Aufruf: node test-runner.js [pfad-zum-skript]
 *
 * Getestet wird ausschliesslich extension/content.js (das Produkt). Ein
 * abweichender Pfad laesst sich als Argument uebergeben; einen stillen Fallback
 * auf archiv/bger-reader.user.js gibt es bewusst nicht (siehe archiv/README.md).
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

const STANDARD_PFAD = path.join(__dirname, '..', 'extension', 'content.js');

// Kein Fallback auf archiv/bger-reader.user.js: ein stiller Rueckfall auf den
// eingefrorenen Userscript-Stand wuerde eine gruene Suite melden, obwohl gar
// nicht das ausgelieferte Skript getestet wurde.
if (!process.argv[2] && !fs.existsSync(STANDARD_PFAD)) {
  console.error('FEHLER: extension/content.js nicht gefunden.');
  console.error('Erwartet unter: ' + STANDARD_PFAD);
  console.error('Die Suite testet ausschliesslich das Extension-Skript.');
  process.exit(2);
}

const SCRIPT = fs.readFileSync(process.argv[2] || STANDARD_PFAD, 'utf8');

let bestanden = 0, fehlgeschlagen = 0;
function pruefe(name, bedingung, detail) {
  if (bedingung) { bestanden++; console.log('  ✅ ' + name); }
  else { fehlgeschlagen++; console.log('  ❌ ' + name + (detail ? ' – ' + detail : '')); }
}

/* Fixture lesen und wie ein Browser dekodieren. bger.ch liefert Latin-1;
 * search.bger.ch nennt die Kodierung nur im HTTP-Header, den curl nicht
 * mitspeichert, relevancy.bger.ch auch im HTML. Strategie: erst streng als
 * UTF-8, bei ungueltigen Bytes als windows-1252 (Obermenge von Latin-1). */
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

/* ---------- 1. Einklapp-Regeln: Einzelfälle ---------- */
console.log('\n[1] Einklapp-Regeln (Einzelfälle)');

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
  const dom = domMitScript('<!doctype html><html><body><div class="eit"><div class="paraatf">Test</div></div></body></html>');
  const R = dom.window.BGerReader;
  const proKat = {};
  KORPUS.forEach(function (fall) {
    const ergebnis = R.sollEingeklapptWerden(fall[2]);
    const gut = ergebnis === fall[1];
    proKat[fall[0]] = proKat[fall[0]] || { ok: 0, fehl: 0 };
    proKat[fall[0]][gut ? 'ok' : 'fehl']++;
    pruefe('[' + fall[0] + '] ' + (fall[1] ? 'einklappen' : 'offen') + ': "' + fall[2].slice(0, 48) + '"',
      gut, 'war ' + ergebnis + ' – ' + R.begruendung(fall[2]));
  });
  const zeilen = Object.keys(proKat).sort().map(function (k) {
    return k + ' ' + proKat[k].ok + '/' + (proKat[k].ok + proKat[k].fehl);
  });
  console.log('  Übersicht nach Kategorie: ' + zeilen.join('   '));

  // begruendung() liefert die Ursache, damit ein Fehlschlag sofort lesbar ist.
  pruefe('begruendung: Rechtsprechung', R.begruendung('BGE 123 II 328') === 'Rechtsprechung');
  pruefe('begruendung: Literatur mit Punktzahl', /^Literatur \(\d+ Punkte/.test(R.begruendung('MÜLLER, AJP 2019, S. 1234 ff.')),
    R.begruendung('MÜLLER, AJP 2019, S. 1234 ff.'));
  pruefe('begruendung: offen', R.begruendung('Art. 8 BV') === 'offen');
  // Normalisierung: geschützte Leerzeichen der Website dürfen nichts ändern.
  pruefe('geschütztes Leerzeichen in "BGE\u00A0135\u00A0II\u00A045" stört nicht',
    R.sollEingeklapptWerden('BGE\u00A0135\u00A0II\u00A045') === true);
  pruefe('geschütztes Leerzeichen in "Art.\u00A012\u00A0StGB" stört nicht',
    R.sollEingeklapptWerden('Art.\u00A012\u00A0Abs.\u00A03\u00A0StGB') === false);
}

/* ---------- 1b. Fixture-Dekodierung ---------- */
console.log('\n[1b] Fixture-Dekodierung');
{
  const latin1 = Buffer.from([0x70, 0x72, 0xE9, 0x63, 0x69, 0x74, 0xE9]);      // "précité" in Latin-1
  const utf8 = Buffer.from('précité', 'utf8');
  pruefe('Latin-1-Bytes werden zu "précité"', dekodiere(latin1) === 'précité', JSON.stringify(dekodiere(latin1)));
  pruefe('UTF-8-Bytes bleiben "précité"', dekodiere(utf8) === 'précité', JSON.stringify(dekodiere(utf8)));
  pruefe('kein Ersatzzeichen U+FFFD im Ergebnis', dekodiere(latin1).indexOf('\uFFFD') === -1);
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
  const html = ladeSeite(ECHTE_SEITE);
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
  const html = ladeSeite(AZA_FIXTURE);
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
  const html = ladeSeite(RELEVANCY_FIXTURE);
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
if (fs.existsSync(RELEVANCY_FIXTURE)) {
  const html = ladeSeite(RELEVANCY_FIXTURE);
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
} else {
  console.log('  ⚠️  relevancy-Fixture nicht gefunden, übersprungen.');
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

  // (b2) icons/: 16/48/128 px als echte PNGs vorhanden, Manifest-Eintrag zeigt auf existierende Dateien
  {
    const ICONS_DIR = path.join(__dirname, '..', 'extension', 'icons');
    const ERWARTETE_ICONS = ['icon16.png', 'icon48.png', 'icon128.png'];
    const iconsVorhanden = fs.existsSync(ICONS_DIR) ? fs.readdirSync(ICONS_DIR) : [];
    pruefe('alle 3 Icon-Dateien vorhanden (16/48/128 px)',
      ERWARTETE_ICONS.every(function (f) { return iconsVorhanden.indexOf(f) !== -1; }),
      'gefunden: ' + iconsVorhanden.join(','));
    const PNG_SIGNATUR = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
    const alleEchtePngs = ERWARTETE_ICONS.every(function (f) {
      const p = path.join(ICONS_DIR, f);
      return fs.existsSync(p) && fs.readFileSync(p).slice(0, 4).equals(PNG_SIGNATUR);
    });
    pruefe('Icon-Dateien sind valide PNGs', alleEchtePngs);
    const iconEintraege = manifest.icons || {};
    pruefe('Manifest: icons-Eintrag (16/48/128) zeigt auf existierende Dateien',
      ['16', '48', '128'].every(function (g) {
        const ziel = iconEintraege[g];
        return typeof ziel === 'string' && fs.existsSync(path.join(__dirname, '..', 'extension', ziel));
      }),
      JSON.stringify(iconEintraege));
  }

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

/* ---------- 12. v0.5.3: Seitenrahmen-Theming (body, Links, Formulare, hr) ---------- */
console.log('\n[12] Seitenrahmen-Theming');
{
  const dom = domMitScript(SYNTHESE);
  const cssText = dom.window.document.getElementById('bkl-style').textContent;

  pruefe('CSS: body-Regel färbt Seitengrund und Grundtext ein',
    /html\.bkl-aktiv body\s*\{[^}]*var\(--bkl-bg\)/.test(cssText) &&
    /html\.bkl-aktiv body\s*\{[^}]*var\(--bkl-fg\)/.test(cssText));
  pruefe('CSS: generelle Link-Regel für die ganze Seite (body a)',
    /html\.bkl-aktiv body a\s*\{[^}]*var\(--bkl-link\)/.test(cssText));
  pruefe('CSS: Formular-Schutz (input/select/textarea/button hell, Fold-Pfeile ausgenommen)',
    /html\.bkl-aktiv input,\s*html\.bkl-aktiv select,\s*html\.bkl-aktiv textarea,\s*html\.bkl-aktiv button:not\(\.bkl-toggle\)\s*\{[^}]*#ffffff/.test(cssText) &&
    /html\.bkl-aktiv input,\s*html\.bkl-aktiv select,\s*html\.bkl-aktiv textarea,\s*html\.bkl-aktiv button:not\(\.bkl-toggle\)\s*\{[^}]*#1a1a1a/.test(cssText));
  pruefe('CSS: Trennlinien (hr) ans Schema angepasst',
    /html\.bkl-aktiv hr\s*\{[^}]*var\(--bkl-border\)/.test(cssText));

  // Reihenfolge: Highlight-Schutz muss NACH den generellen Link-Regeln stehen
  // (und ist zusätzlich spezifischer) – sonst würden gelbe Markierungen
  // und ihre Links wieder schema-bunt statt dunkel.
  const iBodyLink = cssText.indexOf('html.bkl-aktiv body a');
  const iEitLink = cssText.indexOf('html.bkl-aktiv div.eit a');
  const iSchutz = cssText.indexOf('html.bkl-aktiv div.eit .concept_match,');
  pruefe('CSS: Highlight-Schutz steht nach den generellen Link-Regeln',
    iBodyLink !== -1 && iEitLink !== -1 && iSchutz !== -1 && iSchutz > iEitLink && iEitLink > iBodyLink,
    iBodyLink + ' < ' + iEitLink + ' < ' + iSchutz);
}

/* ---------- 13. Aufwandstrennung bei Bedienung (Regler-Performance) ---------- */
console.log('\n[13] Aufwandstrennung bei Bedienung');
{
  // Dokument mit einklappbaren Klammern, damit ein Neuaufbau messbar waere.
  let absaetze = '';
  for (let i = 0; i < 12; i++) {
    absaetze += '<div class="paraatf">Erwaegung ' + i + ': Dies gilt ohne Weiteres ' +
      '(vgl. STRATENWERTH/WOHLERS, Handkommentar, 4. Aufl. 2022, N. ' + i +
      ' zu Art. 111 StGB), was zutrifft.</div>';
  }
  const DOK = '<!doctype html><html><body><div class="eit"><div class="middle">' +
    absaetze + '</div></div></body></html>';

  const dom = new JSDOM(DOK, { url: 'https://search.bger.ch/test', runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.localStorage.setItem('bger-reader-einstellungen-v2',
    JSON.stringify({ aktiv: true, klammern: true }));
  dom.window.eval(SCRIPT);
  const doc = dom.window.document;
  const shadow = doc.getElementById('bkl-panel-host').shadowRoot;

  const foldsStart = doc.querySelectorAll('.bkl-fold').length;
  pruefe('Ausgangslage: Klammern sind eingeklappt', foldsStart === 12, foldsStart + ' Folds');

  // (a) Typografie-Aenderung darf die Folds NICHT neu aufbauen.
  // Nachweis ueber Objektidentitaet: derselbe DOM-Knoten wie vorher.
  const foldVorher = doc.querySelector('.bkl-fold');
  const groesse = shadow.getElementById('bkl-groesse');
  groesse.value = '26';
  groesse.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

  pruefe('Schriftgroesse wirkt sofort (CSS-Variable gesetzt)',
    doc.documentElement.style.getPropertyValue('--bkl-size') === '26px',
    doc.documentElement.style.getPropertyValue('--bkl-size'));
  pruefe('Wertanzeige neben dem Regler nachgefuehrt',
    shadow.getElementById('bkl-groesse-w').textContent === '26px',
    shadow.getElementById('bkl-groesse-w').textContent);
  pruefe('Typografie-Aenderung baut die Folds NICHT neu auf (identischer Knoten)',
    doc.querySelector('.bkl-fold') === foldVorher);

  // (b) Von Hand aufgeklappte Stelle muss beim Verstellen offen bleiben.
  const knopf = foldVorher.querySelector('.bkl-toggle');
  knopf.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  pruefe('Fold laesst sich von Hand aufklappen', foldVorher.classList.contains('bkl-offen'));

  groesse.value = '20';
  groesse.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const farbe = shadow.getElementById('bkl-farbe');
  farbe.value = 'dunkel';
  farbe.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

  pruefe('aufgeklappte Stelle bleibt nach Schrift-/Farbwechsel offen',
    foldVorher.classList.contains('bkl-offen') && foldVorher.isConnected);

  // (c) Klammern-Schalter muss weiterhin neu aufbauen.
  const klammern = shadow.getElementById('bkl-klammern');
  klammern.checked = false;
  klammern.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  pruefe('Klammern-Schalter aus: alle Folds entfernt',
    doc.querySelectorAll('.bkl-fold').length === 0);
  klammern.checked = true;
  klammern.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  pruefe('Klammern-Schalter ein: Folds wieder aufgebaut',
    doc.querySelectorAll('.bkl-fold').length === 12,
    doc.querySelectorAll('.bkl-fold').length + ' Folds');

  // (d) Lesemodus-Schalter baut ebenfalls neu auf.
  const aktiv = shadow.getElementById('bkl-aktiv');
  aktiv.checked = false;
  aktiv.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  pruefe('Lesemodus aus: Folds entfernt und Klasse weg',
    doc.querySelectorAll('.bkl-fold').length === 0 &&
    !doc.documentElement.classList.contains('bkl-aktiv'));
}

/* ---------- 14. Speicher-Buendelung (Throttle mit fuehrender Kante) ---------- */
console.log('\n[14] Speicher-Buendelung');
{
  const dom = new JSDOM(
    '<!doctype html><html><body><div class="eit"><div class="paraatf">Test</div></div></body></html>',
    { url: 'https://search.bger.ch/test', runScripts: 'outside-only', pretendToBeVisual: true }
  );
  const SCHLUESSEL = 'bger-reader-einstellungen-v2';
  const speicher = {};
  let schreibvorgaenge = 0;
  dom.window.chrome = {
    storage: {
      local: {
        get: function (key, cb) { cb({}); },
        set: function (paket) {
          schreibvorgaenge++;
          // Wie die echte API: Momentaufnahme ablegen, nicht die Referenz auf
          // das weiterlaufende Einstellungsobjekt (sonst misst der Test nur
          // den Endzustand).
          Object.keys(paket).forEach(function (k) {
            speicher[k] = JSON.parse(JSON.stringify(paket[k]));
          });
        }
      }
    }
  };
  dom.window.eval(SCRIPT);

  const shadow = dom.window.document.getElementById('bkl-panel-host').shadowRoot;
  const groesse = shadow.getElementById('bkl-groesse');

  schreibvorgaenge = 0;

  // Ein Reglerzug ueber den gesamten erlaubten Bereich (min=12, max=30):
  // 19 Ereignisse unmittelbar hintereinander, erster Wert 12, letzter 30.
  for (let px = 12; px <= 30; px++) {
    groesse.value = String(px);
    groesse.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  }

  pruefe('erster Wert wird sofort geschrieben (fuehrende Kante)',
    schreibvorgaenge >= 1 && speicher[SCHLUESSEL] && speicher[SCHLUESSEL].schriftgroesse === 12,
    JSON.stringify(speicher[SCHLUESSEL]));
  pruefe('19 Reglerbewegungen erzeugen genau 1 Schreibvorgang',
    schreibvorgaenge === 1, schreibvorgaenge + ' Schreibvorgaenge');

  // Seite wird verlassen: ausstehender Wert muss nachgeschrieben werden.
  dom.window.dispatchEvent(new dom.window.Event('pagehide'));
  pruefe('pagehide schreibt den ausstehenden Wert nach',
    schreibvorgaenge === 2, schreibvorgaenge + ' Schreibvorgaenge');
  pruefe('nachgeschrieben wird der ZULETZT eingestellte Wert (kein Datenverlust)',
    speicher[SCHLUESSEL].schriftgroesse === 30, JSON.stringify(speicher[SCHLUESSEL]));

  // Kein Schreibvorgang mehr offen -> weiteres pagehide darf nichts tun.
  dom.window.dispatchEvent(new dom.window.Event('pagehide'));
  pruefe('kein doppeltes Schreiben ohne ausstehende Aenderung',
    schreibvorgaenge === 2, schreibvorgaenge + ' Schreibvorgaenge');
}

/* ---------- 15. Versions-Konsistenz (eine Quelle der Wahrheit) ---------- */
console.log('\n[15] Versions-Konsistenz');
{
  const WURZEL = path.join(__dirname, '..');
  const manifestRoh = fs.readFileSync(path.join(WURZEL, 'extension', 'manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRoh);
  const SEMVER = /^\d+\.\d+\.\d+$/;

  pruefe('Manifest-Version ist gueltiges MAJOR.MINOR.PATCH',
    SEMVER.test(manifest.version), manifest.version);

  // Der Changelog muss die Manifest-Version als neuesten Eintrag fuehren.
  const changelogPfad = path.join(WURZEL, 'CHANGELOG.md');
  pruefe('CHANGELOG.md existiert', fs.existsSync(changelogPfad));
  if (fs.existsSync(changelogPfad)) {
    const changelog = fs.readFileSync(changelogPfad, 'utf8');
    const eintraege = changelog.match(/^## (\d+\.\d+\.\d+)/gm) || [];
    const neuester = eintraege.length ? eintraege[0].replace('## ', '') : null;
    pruefe('neuester CHANGELOG-Eintrag entspricht der Manifest-Version',
      neuester === manifest.version,
      'Changelog: ' + neuester + ', Manifest: ' + manifest.version);

    // Keine doppelten Eintraege – sonst ist unklar, welcher gilt.
    const nummern = eintraege.map(function (e) { return e.replace('## ', ''); });
    pruefe('keine doppelten Versionen im CHANGELOG',
      nummern.length === new Set(nummern).size, nummern.join(', '));

    pruefe('kein unausgefuellter TODO-Eintrag im CHANGELOG',
      changelog.indexOf('TODO: Änderung hier beschreiben') === -1);
  }

  // Im ausgelieferten Teil darf die Version NUR im Manifest stehen.
  const contentRoh = fs.readFileSync(path.join(WURZEL, 'extension', 'content.js'), 'utf8');
  pruefe('extension/content.js enthaelt keine eigene Versionsnummer',
    !/@version|"version"\s*:/.test(contentRoh));

  // Das Archiv fuehrt seine eigene Zaehlung und wird bewusst NICHT mitgezogen.
  const archivPfad = path.join(WURZEL, 'archiv', 'bger-reader.user.js');
  if (fs.existsSync(archivPfad)) {
    const archiv = fs.readFileSync(archivPfad, 'utf8');
    pruefe('archiviertes Userscript behaelt seine eingefrorene Version 2.1.0',
      /@version\s+2\.1\.0/.test(archiv));
  }

  // Die Werkzeuge muessen vorhanden und aufrufbar sein.
  pruefe('tools/version.js vorhanden',
    fs.existsSync(path.join(WURZEL, 'tools', 'version.js')));
  pruefe('tools/release.sh vorhanden',
    fs.existsSync(path.join(WURZEL, 'tools', 'release.sh')));

  // Das Paket muss unter der selbstgesetzten Grenze bleiben.
  const GRENZE_KB = 1023;
  const fontsDir = path.join(WURZEL, 'extension', 'fonts');
  function verzeichnisBytes(dir) {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).reduce(function (summe, name) {
      const voll = path.join(dir, name);
      const st = fs.statSync(voll);
      return summe + (st.isDirectory() ? verzeichnisBytes(voll) : st.size);
    }, 0);
  }
  const roheGroesseKb = Math.ceil(verzeichnisBytes(path.join(WURZEL, 'extension')) / 1024);
  pruefe('extension/ bleibt unter ' + GRENZE_KB + ' KB (ungepackt, ZIP ist kleiner)',
    roheGroesseKb < GRENZE_KB, roheGroesseKb + ' KB');
  void fontsDir;
}

/* ---------- Ergebnis ---------- */
console.log('\n========================================');
console.log(bestanden + ' bestanden, ' + fehlgeschlagen + ' fehlgeschlagen');
process.exit(fehlgeschlagen ? 1 : 0);

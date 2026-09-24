#!/usr/bin/env node
/* Übersetzungstabelle der Bedienoberfläche: SPRACHEN.md <-> extension/sprachen.js
 *
 * Die Texte in vier Sprachen stehen im Code (extension/sprachen.js, Objekt
 * TEXTE). Zum Prüfen und Korrigieren ohne Code gibt es die Tabelle SPRACHEN.md
 * im Repo-Wurzelverzeichnis: je Text eine Zeile mit Schlüssel, Deutsch,
 * English, Français, Italiano. Dieses Werkzeug erzeugt die Tabelle aus dem
 * Code und schreibt eine korrigierte Tabelle in den Code zurück – die
 * Tabelle ist damit die Stelle, an der die Autorin Übersetzungen korrigiert.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node tools/sprachen-tabelle.js              SPRACHEN.md aus sprachen.js erzeugen
 *   node tools/sprachen-tabelle.js uebernehmen  korrigierte SPRACHEN.md nach sprachen.js schreiben
 *   node tools/sprachen-tabelle.js pruefen      Tabelle und Code stimmen überein (release.sh)
 *
 * Regeln für die Tabelle: nur die vier Sprachspalten ändern; die Spalte
 * „Schlüssel" und die Zeilen selbst bleiben (kein Löschen, kein Hinzufügen –
 * neue Texte kommen über den Code). Ein senkrechter Strich im Text wird als
 * \| geschrieben. Leere Zellen sind ein Fehler. Schriftnamen und die Namen der
 * Sprachen in der Sprachwahl sind bewusst nicht in der Tabelle (unübersetzt).
 *
 * Beim Zurückschreiben wird der Block TEXTE in sprachen.js in fester Form neu
 * erzeugt; Kommentare und Funktionen davor und danach bleiben unverändert.
 * Die Test-Suite (Block [4]) prüft den Rundlauf Code -> Tabelle -> Code.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WURZEL = path.join(__dirname, '..');
const SPRACHEN_JS = path.join(WURZEL, 'extension', 'sprachen.js');
const TABELLE_MD = path.join(WURZEL, 'SPRACHEN.md');
const SPRACHEN = ['de', 'en', 'fr', 'it'];
const SPALTEN = { de: 'Deutsch', en: 'English', fr: 'Français', it: 'Italiano' };

/* Beschreibung je Bedienelement für die Überschriften (ohne eigenen label). */
const ELEMENTE = {
  'bkl-button':         'Pinker Knopf auf der Entscheidseite',
  'bkl-schliessen':     'Schliessen-Knopf (X)',
  'bkl-sprache':        'Sprachwahl',
  'bkl-aktiv':          'Lesemodus ein/aus',
  'bkl-groesse':        'Schriftgrösse',
  'bkl-art':            'Schriftart',
  'bkl-farbe':          'Hintergrund',
  'bkl-spalte':         'Breite',
  'bkl-klammern':       'Klammern einklappen',
  'bkl-details-toggle': 'Knopf für die erweiterten Einstellungen',
  'bkl-staerke':        'Schriftstärke',
  'bkl-zeilenabstand':  'Zeilenabstand',
  'bkl-absatz':         'Absatzabstand',
  'bkl-buchstaben':     'Buchstabenabstand',
  'bkl-worte':          'Wortabstand',
  'bkl-laenge':         'Zeilenlänge',
  'bkl-silben':         'Silbentrennung',
  'bkl-ausrichtung':    'Ausrichtung',
  'bkl-spalten':        'Spalten',
  'bkl-reset':          'Knopf „Zurücksetzen"'
};
const ALLGEMEIN = {
  fenstertitel: 'Titel des Einstellungsfensters',
  bereich:      'Name des Panels für Vorlesewerkzeuge',
  allgemein:    'Name des oberen Bereichs (Vorlesewerkzeuge)',
  erweitert:    'Name des Bereichs „erweitert" (Vorlesewerkzeuge)',
  aus:          'Wertanzeige, wenn eine Einstellung aus ist',
  klammer:      'Titel des Klammer-Pfeils im Entscheidtext'
};
const ARTEN = { label: 'Beschriftung', tip: 'Tooltip', aria: 'Vorlesetext' };

/* ---------- sprachen.js lesen ---------- */

function texteLaden(quelle) {
  const sandbox = vm.createContext({ window: {} });
  vm.runInContext(quelle, sandbox);
  if (!sandbox.BGerReaderSprachen) throw new Error('sprachen.js registriert BGerReaderSprachen nicht');
  return sandbox.BGerReaderSprachen.TEXTE;
}

/* Alle Textstellen in fester Reihenfolge (nach der deutschen Fassung):
   { schluessel, art, gruppe } – gruppe = Element-ID oder 'allgemein'. */
function stellen(TEXTE) {
  const liste = [];
  Object.keys(TEXTE.de.allgemein).forEach(function (k) {
    liste.push({ schluessel: 'allgemein.' + k, gruppe: 'allgemein', art: ALLGEMEIN[k] || k });
  });
  Object.keys(TEXTE.de.felder).forEach(function (id) {
    const f = TEXTE.de.felder[id];
    ['label', 'tip', 'aria'].forEach(function (art) {
      if (f[art] !== undefined) liste.push({ schluessel: id + '.' + art, gruppe: id, art: ARTEN[art] });
    });
    Object.keys(f.optionen || {}).forEach(function (wert) {
      liste.push({ schluessel: id + '.optionen.' + wert, gruppe: id, art: 'Option „' + wert + '"' });
    });
  });
  return liste;
}

function lies(TEXTE, sprache, schluessel) {
  const teile = schluessel.split('.');
  let o = TEXTE[sprache];
  if (teile[0] !== 'allgemein') o = o.felder;
  for (let i = 0; i < teile.length; i++) {
    if (o === undefined || o === null) return undefined;
    o = o[teile[i]];
  }
  return typeof o === 'string' ? o : undefined;
}

/* ---------- Tabelle schreiben ---------- */

function zelle(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function tabelleErzeugen(TEXTE) {
  const zeilen = [
    '# Übersetzungen der Bedienoberfläche',
    '',
    'Alle Texte des Panels, des mittigen Dialogs und des Einstellungsfensters in',
    'den vier Sprachen, erzeugt aus `extension/sprachen.js` mit',
    '`node tools/sprachen-tabelle.js`. Deutsch ist die Quelle (so steht es im',
    'Markup); die anderen drei Spalten sind zu prüfen und zu korrigieren.',
    '',
    '**So korrigieren:** nur die Spalten English, Français und Italiano (oder',
    'einen deutschen Text) ändern – direkt hier in der Datei. Die Spalte',
    '„Schlüssel" und die Zeilen bleiben, wie sie sind; ein senkrechter Strich im',
    'Text wird als `\\|` geschrieben. Danach schreibt',
    '`node tools/sprachen-tabelle.js uebernehmen` die Tabelle in den Code zurück',
    '(macht die nächste Session mit Claude); `bash tools/release.sh` prüft, dass',
    'Tabelle und Code übereinstimmen. Schriftnamen (Atkinson Hyperlegible …) und',
    'die Namen der Sprachen in der Sprachwahl werden nicht übersetzt und stehen',
    'deshalb nicht hier.',
    '',
    '| Art | Bedeutung | Text |',
    '|-----|-----------|------|',
    '| Beschriftung | Text neben dem Bedienelement (bei Knöpfen: der Knopftext) | kurz |',
    '| Tooltip | erscheint nach 3 Sekunden über dem Element | ein Satz |',
    '| Vorlesetext | was Vorlesewerkzeuge (Screenreader) sagen (`aria-label`) | kurz, ohne Abkürzungen |',
    '| Option | Eintrag einer Auswahlliste | so kurz wie möglich |',
    ''
  ];
  const kopf = '| Schlüssel | Art | ' + SPRACHEN.map(function (s) { return SPALTEN[s]; }).join(' | ') + ' |';
  const trenner = '|---|---|' + SPRACHEN.map(function () { return '---'; }).join('|') + '|';
  let gruppe = null;
  const liste = stellen(TEXTE);
  liste.forEach(function (st, i) {
    if (st.gruppe !== gruppe) {
      gruppe = st.gruppe;
      const titel = gruppe === 'allgemein' ? 'Allgemein'
        : (TEXTE.de.felder[gruppe].label ? '„' + TEXTE.de.felder[gruppe].label + '" – ' : '') + (ELEMENTE[gruppe] || gruppe);
      zeilen.push('## ' + titel + (gruppe === 'allgemein' ? '' : ' (`' + gruppe + '`)'), '', kopf, trenner);
    }
    zeilen.push('| `' + st.schluessel + '` | ' + st.art + ' | ' +
      SPRACHEN.map(function (s) { return zelle(lies(TEXTE, s, st.schluessel)); }).join(' | ') + ' |');
    // Leerzeile nach der letzten Zeile einer Gruppe (vor der nächsten Überschrift)
    const naechste = liste[i + 1];
    if (!naechste || naechste.gruppe !== gruppe) zeilen.push('');
  });
  return zeilen.join('\n');
}

/* ---------- Tabelle lesen ---------- */

function tabelleLesen(md) {
  const werte = {}; // schluessel -> { de, en, fr, it }
  md.split('\n').forEach(function (zeile, nr) {
    const m = /^\|\s*`([a-z0-9-]+(?:\.[A-Za-z0-9-]+)+)`\s*\|/.exec(zeile);
    if (!m) return;
    // Zellen trennen, \| bleibt Text
    const zellen = zeile.replace(/\\\|/g, '\u0000').split('|').map(function (z) { return z.replace(/\u0000/g, '|').trim(); });
    // zellen[0] ist leer (vor dem ersten |), [1] Schlüssel, [2] Art, [3..6] Sprachen
    if (zellen.length < 3 + SPRACHEN.length + 1) throw new Error('SPRACHEN.md Zeile ' + (nr + 1) + ': zu wenige Spalten');
    const eintrag = {};
    SPRACHEN.forEach(function (s, i) {
      const text = zellen[3 + i];
      if (!text) throw new Error('SPRACHEN.md Zeile ' + (nr + 1) + ': leere Zelle (' + SPALTEN[s] + ') für ' + m[1]);
      eintrag[s] = text;
    });
    if (werte[m[1]]) throw new Error('SPRACHEN.md: Schlüssel doppelt: ' + m[1]);
    werte[m[1]] = eintrag;
  });
  return werte;
}

/* Tabelle auf den Code anwenden: gleiche Schlüssel, Texte ersetzt. */
function anwenden(TEXTE, werte) {
  const neu = JSON.parse(JSON.stringify(TEXTE));
  const erwartet = stellen(TEXTE).map(function (st) { return st.schluessel; });
  const fehlend = erwartet.filter(function (k) { return !werte[k]; });
  const fremd = Object.keys(werte).filter(function (k) { return erwartet.indexOf(k) === -1; });
  if (fehlend.length || fremd.length) {
    throw new Error('SPRACHEN.md passt nicht zum Code – fehlend: ' + (fehlend.join(', ') || '–') + '; unbekannt: ' + (fremd.join(', ') || '–'));
  }
  erwartet.forEach(function (schluessel) {
    const teile = schluessel.split('.');
    SPRACHEN.forEach(function (s) {
      let o = neu[s];
      if (teile[0] !== 'allgemein') o = o.felder;
      for (let i = 0; i < teile.length - 1; i++) o = o[teile[i]];
      o[teile[teile.length - 1]] = werte[schluessel][s];
    });
  });
  return neu;
}

/* ---------- sprachen.js schreiben (Block TEXTE in fester Form) ---------- */

function js(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}
function schluesselJs(k) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : js(k);
}

function textBlock(TEXTE) {
  const aus = ['  const TEXTE = {'];
  SPRACHEN.forEach(function (s, si) {
    const t = TEXTE[s];
    aus.push('    ' + s + ': {', '      allgemein: {');
    const ak = Object.keys(t.allgemein);
    ak.forEach(function (k, i) {
      aus.push('        ' + k + ': ' + js(t.allgemein[k]) + (i < ak.length - 1 ? ',' : ''));
    });
    aus.push('      },', '      felder: {');
    const ids = Object.keys(t.felder);
    ids.forEach(function (id, i) {
      const f = t.felder[id];
      const kopf = ('        ' + js(id) + ':').padEnd(30) + '{ ';
      const teile = [];
      if (f.label !== undefined) teile.push('label: ' + js(f.label));
      if (f.tip !== undefined) teile.push('tip: ' + js(f.tip));
      if (f.aria !== undefined) teile.push('aria: ' + js(f.aria));
      const einzeilig = kopf + teile.join(', ');
      let zeilen;
      if (einzeilig.length <= 220) zeilen = [einzeilig];
      else zeilen = teile.map(function (teil, j) { return (j === 0 ? kopf : ' '.repeat(32)) + teil; }).map(function (z, j, arr) { return j < arr.length - 1 ? z + ',' : z; });
      if (f.optionen) {
        zeilen[zeilen.length - 1] += ',';
        zeilen.push(' '.repeat(32) + 'optionen: { ' + Object.keys(f.optionen).map(function (w) {
          return schluesselJs(w) + ': ' + js(f.optionen[w]);
        }).join(', ') + ' }');
      }
      zeilen[zeilen.length - 1] += ' }' + (i < ids.length - 1 ? ',' : '');
      aus.push.apply(aus, zeilen);
    });
    aus.push('      }', '    }' + (si < SPRACHEN.length - 1 ? ',' : ''));
    if (si < SPRACHEN.length - 1) aus.push('');
  });
  aus.push('  };');
  return aus.join('\n');
}

function quelleMitBlock(quelle, block) {
  const anfang = quelle.indexOf('  const TEXTE = {');
  const ende = quelle.indexOf('\n  };\n', anfang);
  if (anfang === -1 || ende === -1) throw new Error('Block TEXTE in sprachen.js nicht gefunden');
  return quelle.slice(0, anfang) + block + quelle.slice(ende + '\n  };'.length);
}

/* ---------- Befehle ---------- */

function erzeugen() {
  const TEXTE = texteLaden(fs.readFileSync(SPRACHEN_JS, 'utf8'));
  fs.writeFileSync(TABELLE_MD, tabelleErzeugen(TEXTE) + '\n', 'utf8');
  console.log('SPRACHEN.md erzeugt: ' + stellen(TEXTE).length + ' Texte in ' + SPRACHEN.length + ' Sprachen.');
}

function uebernehmen() {
  const quelle = fs.readFileSync(SPRACHEN_JS, 'utf8');
  const TEXTE = anwenden(texteLaden(quelle), tabelleLesen(fs.readFileSync(TABELLE_MD, 'utf8')));
  const neu = quelleMitBlock(quelle, textBlock(TEXTE));
  texteLaden(neu); // muss sich noch laden lassen
  fs.writeFileSync(SPRACHEN_JS, neu, 'utf8');
  // Tabelle in kanonischer Form neu schreiben (gleiche Texte, feste Form)
  fs.writeFileSync(TABELLE_MD, tabelleErzeugen(TEXTE) + '\n', 'utf8');
  console.log('sprachen.js aus SPRACHEN.md übernommen' + (neu === quelle ? ' (keine Änderung).' : '.'));
  console.log('Jetzt: node test/test-runner.js');
}

function pruefen() {
  const quelle = fs.readFileSync(SPRACHEN_JS, 'utf8');
  const TEXTE = texteLaden(quelle);
  if (!fs.existsSync(TABELLE_MD)) { console.error('SPRACHEN.md fehlt: node tools/sprachen-tabelle.js'); process.exit(1); }
  const tabelle = fs.readFileSync(TABELLE_MD, 'utf8');
  const ausTabelle = anwenden(TEXTE, tabelleLesen(tabelle));
  const codeStimmt = JSON.stringify(ausTabelle) === JSON.stringify(TEXTE);
  if (!codeStimmt) {
    console.error('SPRACHEN.md und sprachen.js unterscheiden sich. Korrigierte Tabelle übernehmen:');
    console.error('  node tools/sprachen-tabelle.js uebernehmen');
    process.exit(1);
  }
  console.log('SPRACHEN.md stimmt mit sprachen.js überein (' + stellen(TEXTE).length + ' Texte).');
}

module.exports = { texteLaden: texteLaden, stellen: stellen, tabelleErzeugen: tabelleErzeugen, tabelleLesen: tabelleLesen,
  anwenden: anwenden, textBlock: textBlock, quelleMitBlock: quelleMitBlock };

if (require.main === module) {
  const befehl = process.argv[2];
  try {
    if (!befehl) erzeugen();
    else if (befehl === 'uebernehmen') uebernehmen();
    else if (befehl === 'pruefen') pruefen();
    else { console.error('Aufruf: node tools/sprachen-tabelle.js [uebernehmen|pruefen]'); process.exit(2); }
  } catch (e) {
    console.error('FEHLER: ' + e.message);
    process.exit(1);
  }
}

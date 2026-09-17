#!/usr/bin/env node
/* Klammer-Report: zeigt für ECHTE Entscheidseiten jede Klammer und die
 * Entscheidung der Heuristik samt Begründung. Das ist das Werkzeug, mit dem
 * sich die Trefferquote an echtem Text prüfen lässt – nicht an konstruierten
 * Beispielen.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   bash tools/fetch-fixtures.sh          (einmalig, lädt die Seiten)
 *   node tools/klammern-report.js         (alle drei Fixtures)
 *   node tools/klammern-report.js pfad/zu/seite.html   (eine beliebige Seite)
 *   node tools/klammern-report.js --nur-eingeklappt    (kürzer)
 *
 * Lesart: Jede Zeile ist eine Klammer aus dem Original. Links steht, was die
 * Heuristik damit macht. Stimmt eine Zeile nicht, ist genau das der Fall,
 * der als Testfall in test/test-runner.js Block [1] gehört.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.join(__dirname, '..', 'test', 'node_modules', 'jsdom'));

const ROOT = path.join(__dirname, '..');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'extension', 'content.js'), 'utf8');

const args = process.argv.slice(2);
const nurEingeklappt = args.indexOf('--nur-eingeklappt') !== -1;
const dateien = args.filter(function (a) { return a.indexOf('--') !== 0; });
const STANDARD = ['bger_test.html', 'bger_aza.html', 'bger_relevancy.html']
  .map(function (n) { return path.join(ROOT, 'test', 'fixtures', n); });
const seiten = dateien.length ? dateien : STANDARD.filter(fs.existsSync);

if (!seiten.length) {
  console.error('Keine Fixtures gefunden. Zuerst: bash tools/fetch-fixtures.sh');
  process.exit(2);
}

let gesamt = { klammern: 0, eingeklappt: 0 };
const gruende = {};

seiten.forEach(function (datei) {
  // Wie ein Browser dekodieren: bger.ch liefert Latin-1. search.bger.ch nennt
  // die Kodierung nur im HTTP-Header (den curl nicht speichert), relevancy
  // auch im HTML. Daher: erst streng UTF-8, bei ungültigen Bytes windows-1252.
  const roh = fs.readFileSync(datei);
  let html;
  try { html = new TextDecoder('utf-8', { fatal: true }).decode(roh); }
  catch (e) { html = new TextDecoder('windows-1252').decode(roh); }
  const dom = new JSDOM(html, { url: 'https://search.bger.ch/x', runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.eval(SCRIPT);
  const R = dom.window.BGerReader;
  const doc = dom.window.document;
  const bloecke = doc.querySelectorAll('div.paraatf, div.para');

  console.log('\n==== ' + path.basename(datei) + '  (' + bloecke.length + ' Absätze) ====');
  console.log('ENTSCHEID    BEGRÜNDUNG                       KLAMMERINHALT');
  console.log('-'.repeat(110));

  let n = 0, ein = 0;
  bloecke.forEach(function (block) {
    const t = R.textKarteAufbauen(block);
    if (!t.gesamt) return;
    R.klammernFinden(t.gesamt).forEach(function (k) {
      if (k.tiefe !== 0) return;
      const soll = R.sollEingeklapptWerden(k.inhalt);
      const grund = R.begruendung(k.inhalt);
      const gk = grund.replace(/ \(.*$/, '');
      gruende[gk] = (gruende[gk] || 0) + 1;
      n++; if (soll) ein++;
      if (nurEingeklappt && !soll) return;
      const inhalt = k.inhalt.replace(/\s+/g, ' ').trim();
      console.log((soll ? 'EINGEKLAPPT' : 'offen      ') + '  ' + grund.padEnd(32).slice(0, 32) + ' ' +
        (inhalt.length > 64 ? inhalt.slice(0, 61) + '...' : inhalt));
    });
  });
  console.log('-'.repeat(110));
  console.log(n + ' Klammern, davon ' + ein + ' eingeklappt, ' + (n - ein) + ' offen');
  gesamt.klammern += n; gesamt.eingeklappt += ein;
});

console.log('\n==== Gesamt ====');
console.log(gesamt.klammern + ' Klammern, ' + gesamt.eingeklappt + ' eingeklappt, ' + (gesamt.klammern - gesamt.eingeklappt) + ' offen');
console.log('Begründungen:');
Object.keys(gruende).sort(function (a, b) { return gruende[b] - gruende[a]; }).forEach(function (g) {
  console.log('  ' + String(gruende[g]).padStart(4) + '  ' + g);
});

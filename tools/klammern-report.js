#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 Stephanie Blaettler

/* Klammer-Report: zeigt für ECHTE Entscheidseiten jede Klammer und die
 * Entscheidung der Heuristik samt Begründung. Das ist das Werkzeug, mit dem
 * sich die Trefferquote an echtem Text prüfen lässt – nicht an konstruierten
 * Beispielen.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   bash tools/fetch-fixtures.sh          (einmalig, lädt die Seiten)
 *   node tools/klammern-report.js         (alle Fixtures)
 *   node tools/klammern-report.js pfad/zu/seite.html   (eine beliebige Seite)
 *   node tools/klammern-report.js --nur-eingeklappt    (kürzer)
 *   node tools/klammern-report.js --baseline
 *       schreibt test/klammern-baseline.json: je Fixture die Entscheidung jeder
 *       Klammer oberster Ebene als Zeichenkette (E = eingeklappt, o = offen,
 *       Dokumentreihenfolge) samt Zählern. Block [3] der Suite vergleicht damit.
 *       Die Heuristik ist Handarbeit der Autorin: jede Abweichung ist entweder
 *       ein Fehler oder eine gewollte Änderung, die die Baseline im selben
 *       Commit neu schreibt – sonst wird die Suite rot.
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
const BASELINE = path.join(ROOT, 'test', 'klammern-baseline.json');
const STANDARD = ['bger_frauenstimmrecht.html', 'bger_aza.html', 'bger_frauenstimmrecht_relevancy.html', 'bger_heiratsstrafe_fr.html', 'bvger_test.json']
  .map(function (n) { return path.join(ROOT, 'test', 'fixtures', n); });

/* Eine Fixture-Datei durch die Heuristik schicken. Liefert die Zahl der
   Absätze und je Klammer oberster Ebene (Dokumentreihenfolge) die
   Entscheidung: { soll, grund, inhalt }. */
function analysiere(datei) {
  const istBvger = /\.json$/i.test(datei);
  let dom;
  if (istBvger) {
    // bvger.weblaw.ch: API-Antwort (JSON) mit dem Entscheid als HTML-Dokument
    // im Feld content – wie die App per innerHTML in den Textblock setzen.
    const json = JSON.parse(fs.readFileSync(datei, 'utf8'));
    dom = new JSDOM('<!doctype html><html><body><div id="root"><div id="customContentSegment"><div style="margin: 50px;"></div></div></div></body></html>',
      { url: 'https://bvger.weblaw.ch/cache', runScripts: 'outside-only', pretendToBeVisual: true });
    dom.window.document.querySelector('#customContentSegment div').innerHTML = json.content;
  } else {
    // Wie ein Browser dekodieren: bger.ch liefert Latin-1. search.bger.ch nennt
    // die Kodierung nur im HTTP-Header (den curl nicht speichert), relevancy
    // auch im HTML. Daher: erst streng UTF-8, bei ungültigen Bytes windows-1252.
    const roh = fs.readFileSync(datei);
    let html;
    try { html = new TextDecoder('utf-8', { fatal: true }).decode(roh); }
    catch (e) { html = new TextDecoder('windows-1252').decode(roh); }
    dom = new JSDOM(html, { url: 'https://search.bger.ch/x', runScripts: 'outside-only', pretendToBeVisual: true });
  }
  dom.window.eval(SCRIPT);
  const R = dom.window.BGerReader;
  const doc = dom.window.document;
  const bloecke = doc.querySelectorAll(istBvger ? '#customContentSegment p' : 'div.paraatf, div.para');

  const klammern = [];
  bloecke.forEach(function (block) {
    const t = R.textKarteAufbauen(block);
    if (!t.gesamt) return;
    R.klammernFinden(t.gesamt).forEach(function (k) {
      if (k.tiefe !== 0) return;
      klammern.push({
        soll: R.sollEingeklapptWerden(k.inhalt),
        grund: R.begruendung(k.inhalt),
        inhalt: k.inhalt.replace(/\s+/g, ' ').trim()
      });
    });
  });
  return { bloecke: bloecke.length, klammern: klammern };
}

/* Entscheidungen als Zeichenkette: E = eingeklappt, o = offen. */
function muster(klammern) {
  return klammern.map(function (k) { return k.soll ? 'E' : 'o'; }).join('');
}

function baselineSchreiben(dateien) {
  const alt = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {};
  const neu = {
    _hinweis: 'Entscheidung der Einklapp-Heuristik je Klammer oberster Ebene auf den echten Entscheidseiten (test/fixtures/), ' +
      'in Dokumentreihenfolge: E = eingeklappt, o = offen. Erzeugt mit: node tools/klammern-report.js --baseline. ' +
      'Block [3] der Suite vergleicht damit; eine gewollte Änderung der Heuristik schreibt die Baseline im selben Commit neu.'
  };
  Object.keys(alt).filter(function (k) { return k !== '_hinweis'; }).forEach(function (k) { neu[k] = alt[k]; });
  dateien.forEach(function (datei) {
    const a = analysiere(datei);
    neu[path.basename(datei)] = {
      klammern: a.klammern.length,
      eingeklappt: a.klammern.filter(function (k) { return k.soll; }).length,
      muster: muster(a.klammern)
    };
  });
  fs.writeFileSync(BASELINE, JSON.stringify(neu, null, 2) + '\n', 'utf8');
  return neu;
}

module.exports = { STANDARD: STANDARD, BASELINE: BASELINE, analysiere: analysiere, muster: muster, baselineSchreiben: baselineSchreiben };

function main() {
  const args = process.argv.slice(2);
  const nurEingeklappt = args.indexOf('--nur-eingeklappt') !== -1;
  const baseline = args.indexOf('--baseline') !== -1;
  const dateien = args.filter(function (a) { return a.indexOf('--') !== 0; });
  const seiten = dateien.length ? dateien : STANDARD.filter(fs.existsSync);

  if (!seiten.length) {
    console.error('Keine Fixtures gefunden. Zuerst: bash tools/fetch-fixtures.sh');
    process.exit(2);
  }

  if (baseline) {
    const b = baselineSchreiben(seiten);
    console.log('geschrieben: ' + path.relative(process.cwd(), BASELINE));
    Object.keys(b).filter(function (k) { return k !== '_hinweis'; }).forEach(function (k) {
      console.log('  ' + k.padEnd(40) + String(b[k].klammern).padStart(4) + ' Klammern, ' + String(b[k].eingeklappt).padStart(4) + ' eingeklappt');
    });
    return;
  }

  const gesamt = { klammern: 0, eingeklappt: 0 };
  const gruende = {};

  seiten.forEach(function (datei) {
    const a = analysiere(datei);
    console.log('\n==== ' + path.basename(datei) + '  (' + a.bloecke + ' Absätze) ====');
    console.log('ENTSCHEID    BEGRÜNDUNG                       KLAMMERINHALT');
    console.log('-'.repeat(110));

    let ein = 0;
    a.klammern.forEach(function (k) {
      const gk = k.grund.replace(/ \(.*$/, '');
      gruende[gk] = (gruende[gk] || 0) + 1;
      if (k.soll) ein++;
      if (nurEingeklappt && !k.soll) return;
      console.log((k.soll ? 'EINGEKLAPPT' : 'offen      ') + '  ' + k.grund.padEnd(32).slice(0, 32) + ' ' +
        (k.inhalt.length > 64 ? k.inhalt.slice(0, 61) + '...' : k.inhalt));
    });
    console.log('-'.repeat(110));
    console.log(a.klammern.length + ' Klammern, davon ' + ein + ' eingeklappt, ' + (a.klammern.length - ein) + ' offen');
    gesamt.klammern += a.klammern.length; gesamt.eingeklappt += ein;
  });

  console.log('\n==== Gesamt ====');
  console.log(gesamt.klammern + ' Klammern, ' + gesamt.eingeklappt + ' eingeklappt, ' + (gesamt.klammern - gesamt.eingeklappt) + ' offen');
  console.log('Begründungen:');
  Object.keys(gruende).sort(function (a, b) { return gruende[b] - gruende[a]; }).forEach(function (g) {
    console.log('  ' + String(gruende[g]).padStart(4) + '  ' + g);
  });
}

if (require.main === module) main();

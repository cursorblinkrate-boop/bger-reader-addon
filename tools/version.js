#!/usr/bin/env node
/* Versionsnummer der Extension anzeigen und ändern.
 *
 * extension/manifest.json ist die EINZIGE Stelle, an der die Version steht.
 * Dieses Werkzeug ist der einzige Weg, sie zu ändern – nie von Hand editieren.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node tools/version.js              aktuelle Version anzeigen
 *   node tools/version.js patch        0.5.6 -> 0.5.7   (Korrektur)
 *   node tools/version.js minor        0.5.6 -> 0.6.0   (neue Funktion)
 *   node tools/version.js major        0.5.6 -> 1.0.0   (Umbau)
 *   node tools/version.js 0.9.1        genau diese Version setzen
 *
 * Beim Ändern wird zusätzlich ein Eintrag oben in CHANGELOG.md eingefügt,
 * damit Manifest und Verlauf gar nicht erst auseinanderlaufen können.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(ROOT, 'extension', 'manifest.json');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function lies() {
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  if (!SEMVER.test(m.version)) {
    console.error('FEHLER: Version im Manifest ist kein gültiges MAJOR.MINOR.PATCH: ' + m.version);
    process.exit(2);
  }
  return m.version;
}

function erhoehe(version, stelle) {
  const t = version.match(SEMVER).slice(1).map(Number);
  if (stelle === 'major') return (t[0] + 1) + '.0.0';
  if (stelle === 'minor') return t[0] + '.' + (t[1] + 1) + '.0';
  return t[0] + '.' + t[1] + '.' + (t[2] + 1);
}

function heute() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function schreibeManifest(alt, neu) {
  const roh = fs.readFileSync(MANIFEST, 'utf8');
  // Gezielt die eine Zeile ersetzen, damit Formatierung und Reihenfolge
  // der übrigen Schlüssel unangetastet bleiben.
  const suche = '"version": "' + alt + '"';
  if (roh.indexOf(suche) === -1) {
    console.error('FEHLER: Versionszeile im Manifest nicht gefunden.');
    process.exit(2);
  }
  fs.writeFileSync(MANIFEST, roh.replace(suche, '"version": "' + neu + '"'), 'utf8');
}

function schreibeChangelog(neu) {
  const roh = fs.readFileSync(CHANGELOG, 'utf8');
  const marke = '---\n\n## ';
  const stelle = roh.indexOf(marke);
  if (stelle === -1) {
    console.error('WARNUNG: Einfügestelle in CHANGELOG.md nicht gefunden – Eintrag bitte von Hand ergänzen.');
    return false;
  }
  const eintrag = '---\n\n## ' + neu + ' — ' + heute() + '\n\n' +
    '- TODO: Änderung hier beschreiben (diese Zeile vor dem Push ersetzen).\n\n';
  fs.writeFileSync(CHANGELOG, roh.slice(0, stelle) + eintrag + roh.slice(stelle + '---\n\n'.length), 'utf8');
  return true;
}

const arg = process.argv[2];
const aktuell = lies();

if (!arg) {
  process.stdout.write(aktuell + '\n');
  process.exit(0);
}

let neu;
if (arg === 'patch' || arg === 'minor' || arg === 'major') {
  neu = erhoehe(aktuell, arg);
} else if (SEMVER.test(arg)) {
  neu = arg;
} else {
  console.error('FEHLER: unbekanntes Argument "' + arg + '".');
  console.error('Erlaubt: patch | minor | major | eine Version wie 0.9.1');
  process.exit(2);
}

if (neu === aktuell) {
  console.error('FEHLER: ' + neu + ' ist bereits die aktuelle Version.');
  process.exit(2);
}

schreibeManifest(aktuell, neu);
const cl = schreibeChangelog(neu);

console.log('Version: ' + aktuell + '  ->  ' + neu);
console.log('  geändert: extension/manifest.json');
if (cl) console.log('  ergänzt:  CHANGELOG.md (TODO-Zeile bitte ausfüllen)');
console.log('');
console.log('Nächste Schritte:');
console.log('  1. CHANGELOG.md: die TODO-Zeile durch die echte Änderung ersetzen');
console.log('  2. bash tools/release.sh           (baut dist/bger-reader-' + neu + '.zip)');
console.log('  3. git add -A && git commit && git push');

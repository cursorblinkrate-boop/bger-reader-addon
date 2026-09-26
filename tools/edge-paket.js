#!/usr/bin/env node
/* Baut das Paket für Microsoft Edge Add-ons aus dem fertigen Hauptpaket:
 *   dist/bger-reader-<version>.zip  ->  dist/bger-reader-<version>-edge.zip  (+ .sha256)
 *
 * Grund: Partner Center lehnt das Hauptpaket ab – „The background.scripts field
 * cannot be used with manifest version 3" (Upload der Autorin, 26.09.2026).
 * background.scripts ist der Firefox-Teil des Manifests (Event-Seite; Firefox
 * kennt keinen Service Worker für Erweiterungen), Chrome >= 121 duldet beide
 * Schlüssel nebeneinander. Das Edge-Paket ist deshalb das Hauptpaket ohne die
 * zwei Firefox-Schlüssel background.scripts und browser_specific_settings;
 * jede andere Datei bleibt byte-identisch. Kein Build-Schritt im Sinne der
 * Regeln: der Code wird nicht angefasst, das Manifest verliert zwei Einträge.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis; tools/release.sh ruft es nach dem
 * Hauptpaket auf, die CI im Release-Job mit dem Release-Anhang als Quelle):
 *   node tools/edge-paket.js                  Quelle dist/bger-reader-<version>.zip
 *   node tools/edge-paket.js --quelle <zip>   anderes Hauptpaket, z. B. das Release-ZIP;
 *                                             das Edge-Paket entsteht daneben
 * Braucht nur Node sowie zip und unzip (macOS, Linux, GitHub-Runner).
 * Reproduzierbar: gleiche Quelle, gleiche Bytes (Zeitstempel aus dem
 * Hauptpaket, feste Reihenfolge, zip -X ohne Betriebssystem-Extras, TZ=UTC).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

/* Die Firefox-Schlüssel auf oberster Ebene, die Edge nicht kennt. */
const FIREFOX_SCHLUESSEL = ['browser_specific_settings'];
const LIMIT_KB = 1023;

/* Manifest-Text des Hauptpakets -> Manifest-Text des Edge-Pakets. */
function edgeManifest(text) {
  const m = JSON.parse(text);
  if (!m.background || !m.background.service_worker) {
    throw new Error('Manifest ohne background.service_worker – Edge hätte kein Hintergrundskript');
  }
  delete m.background.scripts;
  FIREFOX_SCHLUESSEL.forEach(function (k) { delete m[k]; });
  return JSON.stringify(m, null, 2) + '\n';
}
module.exports = { edgeManifest: edgeManifest };

function abbruch(text) {
  console.error('ABBRUCH: ' + text);
  process.exit(1);
}
const UTC = Object.assign({}, process.env, { TZ: 'UTC' });
function lauf(befehl, args, opts) {
  const r = spawnSync(befehl, args, Object.assign({ stdio: ['pipe', 'inherit', 'inherit'], env: UTC }, opts || {}));
  if (r.error || r.status !== 0) abbruch(befehl + ' fehlgeschlagen' + (r.error ? ': ' + r.error.message : ' (Status ' + r.status + ')'));
}
function dateienUnter(dir, praefix) {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce(function (liste, e) {
    const rel = praefix ? praefix + '/' + e.name : e.name;
    return liste.concat(e.isDirectory() ? dateienUnter(path.join(dir, e.name), rel) : [rel]);
  }, []);
}

function main() {
  const wurzel = path.join(__dirname, '..');
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--quelle');
  const version = JSON.parse(fs.readFileSync(path.join(wurzel, 'extension', 'manifest.json'), 'utf8')).version;
  const quelle = i !== -1 && argv[i + 1]
    ? path.resolve(argv[i + 1])
    : path.join(wurzel, 'dist', 'bger-reader-' + version + '.zip');
  if (!fs.existsSync(quelle)) abbruch('Hauptpaket fehlt: ' + quelle + ' (erst bash tools/release.sh)');
  const ziel = quelle.replace(/\.zip$/, '') + '-edge.zip';

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bger-edge-'));
  try {
    lauf('unzip', ['-q', quelle, '-d', tmp]);                       // behält die Zeitstempel der Einträge
    const manifestPfad = path.join(tmp, 'manifest.json');
    if (!fs.existsSync(manifestPfad)) abbruch('kein manifest.json im Hauptpaket');
    const st = fs.statSync(manifestPfad);
    const vorher = fs.readFileSync(manifestPfad, 'utf8');
    const nachher = edgeManifest(vorher);
    // Kontrolle: ausser den entfernten Schlüsseln darf sich nichts ändern.
    const kontrolle = JSON.parse(vorher);
    delete kontrolle.background.scripts;
    FIREFOX_SCHLUESSEL.forEach(function (k) { delete kontrolle[k]; });
    if (JSON.stringify(kontrolle) !== JSON.stringify(JSON.parse(nachher))) abbruch('Edge-Manifest weicht über die zwei Schlüssel hinaus ab');
    fs.writeFileSync(manifestPfad, nachher, 'utf8');
    fs.utimesSync(manifestPfad, st.atime, st.mtime);                // gleicher Zeitstempel wie im Hauptpaket

    fs.rmSync(ziel, { force: true });
    const liste = dateienUnter(tmp, '').sort();
    lauf('zip', ['-X', '-D', '-q', ziel, '-@'], { cwd: tmp, input: liste.join('\n') + '\n' });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const bytes = fs.readFileSync(ziel);
  const summe = crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(ziel + '.sha256', summe + '  ' + path.basename(ziel) + '\n', 'utf8');
  const kb = Math.ceil(bytes.length / 1024);
  console.log('Datei:     ' + path.relative(process.cwd(), ziel));
  console.log('Grösse:    ' + kb + ' KB von ' + LIMIT_KB + ' KB erlaubt');
  console.log('Prüfsumme: ' + summe + '  (SHA-256)');
  if (kb > LIMIT_KB) {
    fs.rmSync(ziel, { force: true });
    abbruch('Edge-Paket grösser als ' + LIMIT_KB + ' KB');
  }
}

if (require.main === module) main();

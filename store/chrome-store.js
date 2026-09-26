#!/usr/bin/env node
/* Chrome Web Store über die Chrome Web Store API (v2): Release-ZIP hochladen,
 * zur Prüfung einreichen, Status abfragen.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node store/chrome-store.js paket [--version 1.0.0]
 *       lädt bger-reader-<version>.zip und .sha256 vom GitHub-Release, prüft
 *       die Prüfsumme – ohne Zugangsdaten, ohne Upload (Probe)
 *   node store/chrome-store.js hochladen [--version 1.0.0] [--einreichen] [--gestuft]
 *       wie „paket“, dann Upload auf das Element im Store; mit --einreichen
 *       anschliessend zur Prüfung einreichen
 *   node store/chrome-store.js einreichen [--gestuft]
 *       das zuletzt hochgeladene Paket zur Prüfung einreichen. Ohne --gestuft
 *       wird es nach der Freigabe sofort veröffentlicht; mit --gestuft bleibt
 *       es nach der Freigabe liegen, bis es im Dashboard veröffentlicht wird
 *   node store/chrome-store.js status
 *       veröffentlichte und eingereichte Version, Prüfstand, Verwarnungen
 *   node store/chrome-store.js zurueckziehen
 *       laufende Einreichung abbrechen
 *
 * Hochgeladen wird ausschliesslich das ZIP des GitHub-Releases (STARTPROMPT
 * Regel 8), nie ein lokales Paket: Version aus extension/manifest.json oder
 * --version, Prüfsumme gegen die .sha256-Datei des Releases.
 *
 * Zugangsdaten nur als Umgebungsvariablen (Claude Code Web: Environment ->
 * Secrets; lokal: export …), nie im Repo, werden nie ausgegeben:
 *   CHROME_CLIENT_ID, CHROME_CLIENT_SECRET   OAuth-Client (Google Cloud Console,
 *                                            Typ „Web application“, Redirect-URI
 *                                            https://developers.google.com/oauthplayground)
 *   CHROME_REFRESH_TOKEN                     aus dem OAuth Playground mit dem
 *                                            Scope https://www.googleapis.com/auth/chromewebstore
 *   CHROME_PUBLISHER_ID                      Dashboard -> Konto (Publisher ID)
 *   CHROME_EXTENSION_ID                      Kennung des Elements (32 Buchstaben)
 *
 * Grenze der API: Sie kennt kein „neues Element anlegen“ und keine Felder für
 * Store-Eintrag, Bilder oder Datenschutz-Angaben. Die Erstveröffentlichung
 * läuft deshalb im Dashboard (Ablauf: STORE-UPDATE.md); ab dann übernimmt
 * dieses Skript Updates und Statusabfragen. Dokumentation:
 * https://developer.chrome.com/docs/webstore/using-api
 *
 * Nur Node (>= 18, eingebautes fetch), keine Abhängigkeiten.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO = 'cursorblinkrate-boop/bger-reader-addon';
const API = 'https://chromewebstore.googleapis.com';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const MANIFEST = path.join(__dirname, '..', 'extension', 'manifest.json');

const argv = process.argv.slice(2);
const befehl = argv[0];
function option(name) {
  const i = argv.indexOf(name);
  return i === -1 ? null : (argv[i + 1] || true);
}

function abbruch(text) {
  console.error('ABBRUCH: ' + text);
  process.exit(1);
}

/* --- Release-ZIP von GitHub, Prüfsumme prüfen ------------------------------ */

async function paketLaden() {
  const version = option('--version') || JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).version;
  if (!/^\d+\.\d+\.\d+$/.test(version)) abbruch('keine gültige Version: ' + version);
  const datei = 'bger-reader-' + version + '.zip';
  const basis = 'https://github.com/' + REPO + '/releases/download/v' + version + '/';

  console.log('Release v' + version + ' von GitHub laden: ' + basis + datei);
  const [zip, sha] = await Promise.all([
    fetch(basis + datei), fetch(basis + datei + '.sha256')
  ]);
  if (!zip.ok) abbruch('Release-ZIP nicht gefunden (HTTP ' + zip.status + '). Gibt es das Release v' + version + '?');
  if (!sha.ok) abbruch('.sha256-Datei nicht gefunden (HTTP ' + sha.status + ')');
  const bytes = Buffer.from(await zip.arrayBuffer());
  const erwartet = (await sha.text()).trim().split(/\s+/)[0].toLowerCase();
  const ist = crypto.createHash('sha256').update(bytes).digest('hex');
  if (ist !== erwartet) abbruch('Prüfsumme stimmt nicht: Release sagt ' + erwartet + ', Datei hat ' + ist);
  console.log('  ' + bytes.length + ' Bytes, SHA-256 ' + ist + ' – stimmt mit dem Release überein');
  return { version: version, datei: datei, bytes: bytes };
}

/* --- Zugang ----------------------------------------------------------------- */

function umgebung() {
  const namen = ['CHROME_CLIENT_ID', 'CHROME_CLIENT_SECRET', 'CHROME_REFRESH_TOKEN', 'CHROME_PUBLISHER_ID', 'CHROME_EXTENSION_ID'];
  const fehlt = namen.filter(function (n) { return !process.env[n]; });
  if (fehlt.length) abbruch('Umgebungsvariablen fehlen: ' + fehlt.join(', ') + ' (siehe Kopf dieser Datei)');
  return {
    element: 'publishers/' + process.env.CHROME_PUBLISHER_ID + '/items/' + process.env.CHROME_EXTENSION_ID
  };
}

async function zugangstoken() {
  const antwort = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.CHROME_CLIENT_ID,
      client_secret: process.env.CHROME_CLIENT_SECRET,
      refresh_token: process.env.CHROME_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  const daten = await antwort.json().catch(function () { return {}; });
  if (!antwort.ok || !daten.access_token) {
    abbruch('kein Zugangstoken (HTTP ' + antwort.status + '): ' + (daten.error || '') + ' ' + (daten.error_description || '') +
      '\n  Bei „invalid_grant“ ist das Refresh-Token abgelaufen oder widerrufen: im OAuth Playground neu erzeugen. ' +
      'Refresh-Tokens einer Consent-Screen-App im Status „Testing“ verfallen nach 7 Tagen – App auf „In production“ stellen.');
  }
  return daten.access_token;
}

async function api(token, methode, pfad, body, contentType) {
  const antwort = await fetch(API + pfad, {
    method: methode,
    headers: Object.assign({ Authorization: 'Bearer ' + token },
      body ? { 'Content-Type': contentType || 'application/json' } : {}),
    body: body ? (Buffer.isBuffer(body) ? body : JSON.stringify(body)) : undefined
  });
  const text = await antwort.text();
  let daten; try { daten = JSON.parse(text); } catch (e) { daten = { roh: text }; }
  if (!antwort.ok) abbruch(methode + ' ' + pfad + ' -> HTTP ' + antwort.status + '\n' + JSON.stringify(daten, null, 2));
  return daten;
}

/* --- Befehle ---------------------------------------------------------------- */

function statusZeile(titel, revision) {
  if (!revision) return '  ' + titel + ': –';
  const kanaele = (revision.distributionChannels || []).map(function (k) {
    return k.crxVersion + (k.deployPercentage != null && k.deployPercentage !== 100 ? ' (' + k.deployPercentage + ' %)' : '');
  }).join(', ');
  return '  ' + titel + ': ' + revision.state + (kanaele ? ' – Version ' + kanaele : '');
}

async function status(token, element) {
  const s = await api(token, 'GET', '/v2/' + element + ':fetchStatus');
  console.log('Element ' + s.itemId + ':');
  console.log(statusZeile('veröffentlicht', s.publishedItemRevisionStatus));
  console.log(statusZeile('eingereicht   ', s.submittedItemRevisionStatus));
  if (s.lastAsyncUploadState && s.lastAsyncUploadState !== 'UPLOAD_STATE_UNSPECIFIED') console.log('  letzter Upload: ' + s.lastAsyncUploadState);
  if (s.warned) console.log('  VERWARNUNG wegen Richtlinienverstoss – im Dashboard nachsehen, sonst wird das Element entfernt');
  if (s.takenDown) console.log('  ENTFERNT wegen Richtlinienverstoss');
  console.log('  Dashboard: https://chrome.google.com/webstore/devconsole/' + process.env.CHROME_PUBLISHER_ID + '/' + s.itemId);
  return s;
}

async function hochladen(token, element) {
  const paket = await paketLaden();
  console.log('Upload auf ' + element + ' …');
  let a = await api(token, 'POST', '/upload/v2/' + element + ':upload', paket.bytes, 'application/zip');
  for (let i = 0; a.uploadState === 'IN_PROGRESS' && i < 24; i++) {
    await new Promise(function (r) { setTimeout(r, 5000); });
    const s = await api(token, 'GET', '/v2/' + element + ':fetchStatus');
    a.uploadState = s.lastAsyncUploadState;
  }
  if (a.uploadState !== 'SUCCEEDED') abbruch('Upload nicht erfolgreich: ' + a.uploadState + '\n' + JSON.stringify(a, null, 2) +
    '\n  Grund steht im Dashboard beim Element (Paket).');
  if (a.crxVersion && a.crxVersion !== paket.version) abbruch('Store meldet Version ' + a.crxVersion + ', erwartet ' + paket.version);
  console.log('  Upload ' + a.uploadState + ', Version ' + (a.crxVersion || paket.version) + ' liegt als Entwurf im Store');
}

async function einreichen(token, element) {
  const gestuft = !!option('--gestuft');
  const a = await api(token, 'POST', '/v2/' + element + ':publish', {
    publishType: gestuft ? 'STAGED_PUBLISH' : 'DEFAULT_PUBLISH'
  });
  console.log('Eingereicht: Stand ' + a.state + (gestuft ? ' (nach Freigabe gestuft, Veröffentlichung im Dashboard)' : ' (nach Freigabe sofort veröffentlicht)'));
  ((a.warningInfo || {}).warnings || []).forEach(function (w) {
    console.log('  Warnung ' + (w.reason || '') + ': ' + (w.description || ''));
  });
}

async function zurueckziehen(token, element) {
  await api(token, 'POST', '/v2/' + element + ':cancelSubmission', {});
  console.log('Einreichung zurückgezogen.');
}

(async function () {
  if (befehl === 'paket') { await paketLaden(); return; }
  if (!['hochladen', 'einreichen', 'status', 'zurueckziehen'].includes(befehl)) {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\* ?|^ \* ?/gm, ''));
    process.exit(befehl ? 1 : 0);
  }
  const z = umgebung();
  const token = await zugangstoken();
  if (befehl === 'status') await status(token, z.element);
  if (befehl === 'hochladen') { await hochladen(token, z.element); if (option('--einreichen')) await einreichen(token, z.element); }
  if (befehl === 'einreichen') await einreichen(token, z.element);
  if (befehl === 'zurueckziehen') await zurueckziehen(token, z.element);
})().catch(function (e) { abbruch(e && e.message ? e.message : String(e)); });

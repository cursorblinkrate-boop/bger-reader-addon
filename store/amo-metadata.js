#!/usr/bin/env node
/* Erzeugt store/amo-metadata.json für die Einreichung bei Firefox Add-ons:
 *   web-ext sign --channel listed --source-dir <entpacktes Release-ZIP> \
 *     --amo-metadata store/amo-metadata.json
 * (API-Keys als Umgebungsvariablen WEB_EXT_API_KEY / WEB_EXT_API_SECRET, nie im Repo.)
 *
 * Eine Quelle, kein Auseinanderlaufen – alles kommt aus den Dateien, die die
 * Autorin ohnehin pflegt:
 *   store/listing.en.md             Abschnitte 1–3: Name, Kurzbeschreibung,
 *                                   Beschreibung (nur Englisch, Vorgabe der Autorin)
 *   store/reviewer-notes.md         Abschnitt „Kurzfassung" -> version.approval_notes
 *   CHANGELOG.md                    Abschnitt der aktuellen Version muss existieren
 *   extension/_locales/en/messages.json  Abgleich: Name und Kurzbeschreibung
 *                                   müssen mit listing.en.md übereinstimmen
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node store/amo-metadata.js           schreibt store/amo-metadata.json
 *   node store/amo-metadata.js pruefen   vergleicht nur (Exit 1 bei Abweichung)
 *
 * Format: addons-server API v5 „Add-on Create" – übersetzte Felder als Objekt mit
 * dem AMO-Locale-Schlüssel en-US; Pflicht für ein neues gelistetes
 * Add-on: categories, summary, version.license. Grenzen: Name 50, Summary 250
 * (ohne URLs oder Domains – AMO lehnt sie ab), Beschreibung 15 000,
 * approval_notes und release_notes je 3000 Zeichen.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const ZIEL = path.join(__dirname, 'amo-metadata.json');
const LOCALES = { en: 'en-US' };
/* AMO-Kategorien für Erweiterungen (es gibt keine „Barrierefreiheit"; „other"
   ist nicht kombinierbar), Tags nur aus der festen AMO-Liste. */
const KATEGORIEN = ['appearance'];
const TAGS = ['dark mode'];
const HOMEPAGE = 'https://github.com/cursorblinkrate-boop/bger-reader-addon';
const SUPPORT_URL = HOMEPAGE + '/issues';
const SUPPORT_EMAIL = 'bge.reader@gmail.com';
/* Die Kurzbeschreibung des Manifests nennt die Domain bger.ch; die AMO-Summary
   darf keine URLs oder Domains enthalten (NoURLsValidator). */
const ERSATZ = {
  en: ['on bger.ch and bvger.ch', 'for Swiss federal court decisions']
};
const DOMAIN = /\b[\w-]+\.(ch|com|org|net|io|de|fr|it|eu)\b/i;

const fehler = [];
function pruefeLaenge(was, text, max) {
  const n = Array.from(text).length;
  if (n > max) fehler.push(was + ': ' + n + ' Zeichen (höchstens ' + max + ')');
}
function abschnitte(md) {
  return md.split(/^## /m).slice(1).map(function (t) {
    const nl = t.indexOf('\n');
    return { titel: t.slice(0, nl).trim(), text: t.slice(nl + 1).trim() };
  });
}
function uebersetzt(wert) {
  const o = {};
  Object.keys(LOCALES).forEach(function (l) { o[LOCALES[l]] = typeof wert === 'function' ? wert(l) : wert; });
  return o;
}

const manifest = JSON.parse(fs.readFileSync(path.join(WURZEL, 'extension', 'manifest.json'), 'utf8'));
const name = {}, summary = {}, description = {};
Object.keys(LOCALES).forEach(function (l) {
  const a = abschnitte(fs.readFileSync(path.join(__dirname, 'listing.' + l + '.md'), 'utf8'));
  const m = JSON.parse(fs.readFileSync(path.join(WURZEL, 'extension', '_locales', l, 'messages.json'), 'utf8'));
  const n = a[0].text, kurz = a[1].text, lang = a[2].text;
  if (n !== m.appName.message) fehler.push(l + ': Name in listing.' + l + '.md und _locales verschieden');
  if (kurz !== m.appDescription.message) fehler.push(l + ': Kurzbeschreibung in listing.' + l + '.md und _locales verschieden');
  const s = kurz.split(ERSATZ[l][0]).join(ERSATZ[l][1]);
  if (DOMAIN.test(s)) fehler.push(l + ': AMO-Summary enthält eine Domain: ' + s.match(DOMAIN)[0]);
  pruefeLaenge(l + ' Name', n, 50);
  pruefeLaenge(l + ' Summary', s, 250);
  pruefeLaenge(l + ' Beschreibung', lang, 15000);
  name[LOCALES[l]] = n; summary[LOCALES[l]] = s; description[LOCALES[l]] = lang;
});

const notizen = abschnitte(fs.readFileSync(path.join(__dirname, 'reviewer-notes.md'), 'utf8'))
  .filter(function (a) { return /^Kurzfassung/.test(a.titel); })[0];
if (!notizen) fehler.push('reviewer-notes.md: Abschnitt „Kurzfassung" fehlt');
else pruefeLaenge('approval_notes', notizen.text, 3000);

const changelog = fs.readFileSync(path.join(WURZEL, 'CHANGELOG.md'), 'utf8');
const eintrag = abschnitte(changelog).filter(function (a) { return a.titel.indexOf(manifest.version + ' ') === 0; })[0];
if (!eintrag) fehler.push('CHANGELOG.md: kein Abschnitt für Version ' + manifest.version);
const releaseNotes = {
  'en-US': 'Version ' + manifest.version + '. Changes are described (in German) in the changelog: ' + HOMEPAGE + '/blob/main/CHANGELOG.md'
};
Object.keys(releaseNotes).forEach(function (l) { pruefeLaenge('release_notes ' + l, releaseNotes[l], 3000); });

if (fehler.length) {
  console.error('FEHLER:\n  ' + fehler.join('\n  '));
  process.exit(1);
}

const metadaten = {
  name: name,
  summary: summary,
  description: description,
  default_locale: 'en-US',
  homepage: uebersetzt(HOMEPAGE),
  support_url: uebersetzt(SUPPORT_URL),
  support_email: uebersetzt(SUPPORT_EMAIL),
  categories: KATEGORIEN,
  tags: TAGS,
  is_experimental: false,
  requires_payment: false,
  version: {
    license: 'MIT',
    release_notes: releaseNotes,
    approval_notes: notizen.text
  }
};
const json = JSON.stringify(metadaten, null, 2) + '\n';

if (process.argv[2] === 'pruefen') {
  const alt = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8') : '';
  if (alt !== json) {
    console.error('store/amo-metadata.json ist nicht aktuell – bitte: node store/amo-metadata.js');
    process.exit(1);
  }
  console.log('store/amo-metadata.json ist aktuell (Version ' + manifest.version + ').');
} else {
  fs.writeFileSync(ZIEL, json, 'utf8');
  console.log('geschrieben: store/amo-metadata.json (Version ' + manifest.version + ', ' +
    Object.keys(LOCALES).length + ' Sprachen, approval_notes ' + Array.from(notizen.text).length + ' Zeichen)');
}

#!/usr/bin/env node
/* Baut dist/store-assets-<version>.zip: alle Bilder und Texte, die in den
 * Store-Dashboards von Hand eingefügt werden (Chrome Web Store, Edge Add-ons;
 * die AMO-Bilder liegen im Repo unter screenshots/firefox/). Die CI hängt das
 * ZIP an das GitHub-Release (release.yml), damit die Autorin alles mit einem
 * Download auf dem Rechner hat – das Paket der Erweiterung selbst ist NICHT
 * darin, es liegt daneben als bger-reader-<version>.zip.
 *
 * Quellen (die Dateien, die ohnehin gepflegt werden):
 *   store/listing.en.md        Beschreibung, Einzelzweck, Berechtigungs-
 *                              Begründungen, Edge-Suchbegriffe, Adressen
 *   store/reviewer-notes.md    Abschnitt „Kurzfassung" -> Notes for certification
 *   store/promo/               Logo 300x300, Kachel 440x280, Marquee 1400x560
 *   store/screenshots/chromium/ Auswahl und Reihenfolge wie in listing.en.md
 *   extension/icons/icon128.png Chrome Store-Symbol
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):  node store/assets-paket.js
 * Nur Node und das Kommandozeilenwerkzeug zip (macOS, Linux, GitHub-Runner).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const WURZEL = path.join(__dirname, '..');
const VERSION = JSON.parse(fs.readFileSync(path.join(WURZEL, 'extension', 'manifest.json'), 'utf8')).version;
const NAME = 'store-assets-' + VERSION;
const DIST = path.join(WURZEL, 'dist');
const ZIEL = path.join(DIST, NAME);

/* Reihenfolge = Bildliste in listing.en.md (Chrome höchstens 5, Edge 6). */
const SCREENSHOTS = [
  ['02-panel.png', '01-panel.png'],
  ['41-klammer-aufgeklappt.png', '02-citations-folded.png'],
  ['23-hintergrund-nacht.png', '03-night-background.png'],
  ['06-dialog-mittig.png', '04-toolbar-dialog.png'],
  ['03-panel-erweitert.png', '05-advanced-settings.png'],
  ['90-franzoesisch-regeste.png', '06-french-decision.png']
];
/* Eigene Bilder der Autorin, wahlweise statt 05/06. */
const WEITERE = ['50-garamond-zwei-spalten-italiano.png', '51-system-sans-dunkel-deutsch.png', '52-luciole-nacht-francais.png'];

function abschnitte(datei) {
  return fs.readFileSync(datei, 'utf8').split(/^## /m).slice(1).map(function (t) {
    const nl = t.indexOf('\n');
    return { titel: t.slice(0, nl).trim(), text: t.slice(nl + 1).trim() };
  });
}
function abschnitt(liste, muster, datei) {
  const a = liste.filter(function (x) { return muster.test(x.titel); })[0];
  if (!a) { console.error('ABBRUCH: Abschnitt ' + muster + ' fehlt in ' + datei); process.exit(1); }
  return a.text;
}
function schreiben(rel, text) {
  fs.writeFileSync(path.join(ZIEL, rel), text.replace(/\s+$/, '') + '\n', 'utf8');
}
function kopieren(von, rel) {
  if (!fs.existsSync(von)) { console.error('ABBRUCH: Datei fehlt: ' + von); process.exit(1); }
  fs.copyFileSync(von, path.join(ZIEL, rel));
}

fs.rmSync(ZIEL, { recursive: true, force: true });
fs.rmSync(ZIEL + '.zip', { force: true });
['texte', 'bilder/screenshots/weitere'].forEach(function (d) { fs.mkdirSync(path.join(ZIEL, d), { recursive: true }); });

/* Texte */
const listing = abschnitte(path.join(__dirname, 'listing.en.md'));
const notizen = abschnitte(path.join(__dirname, 'reviewer-notes.md'));
const rechte = abschnitt(listing, /^Permissions/, 'listing.en.md').split('\n');
schreiben('texte/01-description.txt', abschnitt(listing, /^Description/, 'listing.en.md'));
schreiben('texte/02-single-purpose.txt', abschnitt(listing, /^Single purpose/, 'listing.en.md'));
schreiben('texte/03-permission-storage.txt', rechte[0].replace(/^- `storage`: /, ''));
schreiben('texte/04-permission-host-sites.txt', rechte[1].replace(/^- Host permissions \([^)]*\): /, ''));
schreiben('texte/05-search-terms-edge.txt', abschnitt(listing, /^Search terms Edge/, 'listing.en.md').split(' · ').join('\n'));
schreiben('texte/06-urls.txt', abschnitt(listing, /^Addresses/, 'listing.en.md').replace(/^- /gm, '') +
  '\nPrivacy policy: https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/PRIVACY.md');
schreiben('texte/07-notes-for-certification.txt', abschnitt(notizen, /^Kurzfassung/, 'reviewer-notes.md'));
schreiben('texte/08-short-description-manifest.txt', abschnitt(listing, /^Short description/, 'listing.en.md'));

/* Bilder */
const PROMO = path.join(__dirname, 'promo');
const CHROMIUM = path.join(__dirname, 'screenshots', 'chromium');
kopieren(path.join(PROMO, 'logo-300x300.png'), 'bilder/logo-300x300.png');
kopieren(path.join(PROMO, 'kachel-klein-440x280.png'), 'bilder/kachel-klein-440x280.png');
kopieren(path.join(PROMO, 'kachel-marquee-1400x560.png'), 'bilder/kachel-marquee-1400x560.png');
kopieren(path.join(WURZEL, 'extension', 'icons', 'icon128.png'), 'bilder/chrome-store-icon-128x128.png');
SCREENSHOTS.forEach(function (p) { kopieren(path.join(CHROMIUM, p[0]), 'bilder/screenshots/' + p[1]); });
WEITERE.forEach(function (d) { kopieren(path.join(CHROMIUM, d), 'bilder/screenshots/weitere/' + d); });

schreiben('LIESMICH.txt', `${NAME} – Bilder und Texte zum Einfügen in die Store-Dashboards
(erzeugt mit store/assets-paket.js aus listing.en.md, reviewer-notes.md,
promo/ und screenshots/chromium/; Ablauf je Store: store/STORE-UPDATE.md)

Das Paket der Erweiterung ist NICHT hier drin: bger-reader-${VERSION}.zip liegt
daneben beim GitHub-Release (SHA-256 steht in der Release-Notiz).

texte/
  01-description.txt                Beschreibung (Chrome „Beschreibung", Edge
                                    „Description"), Englisch, dann Deutsch – ein Feld
  02-single-purpose.txt             Chrome „Einzelzweck" / Edge „Single Purpose"
  03-permission-storage.txt         Begründung für die Berechtigung storage
  04-permission-host-sites.txt      Begründung für die Host-Berechtigung (Chrome
                                    fragt sie wegen der content_scripts)
  05-search-terms-edge.txt          Edge „Search terms" (7 Begriffe, je eine Zeile)
  06-urls.txt                       Homepage, Support-URL, Support-Mail, Datenschutz-URL
  07-notes-for-certification.txt    Edge „Notes for certification"
  08-short-description-manifest.txt Kurzbeschreibung – kommt aus dem Paket, nur zur Kontrolle

bilder/
  logo-300x300.png                  Edge „Extension logo" (Pflicht)
  chrome-store-icon-128x128.png     Chrome „Store-Symbol"
  kachel-klein-440x280.png          Chrome kleine Werbekachel (Pflicht), Edge „Small promotional tile"
  kachel-marquee-1400x560.png       Chrome Marquee, Edge „Large promotional tile" (optional)
  screenshots/01…06                 1280 x 800, in dieser Reihenfolge hochladen
                                    (Chrome höchstens 5, Edge höchstens 6)
  screenshots/weitere/50…52         drei eigene Bilder der Autorin, wahlweise statt 05/06

CHROME WEB STORE – Text ersetzen und neu einreichen
  1. https://chrome.google.com/webstore/devconsole → Element → „Store-Eintrag"
  2. Feld „Beschreibung": alten Text löschen, Inhalt von texte/01-description.txt
     einfügen → „Entwurf speichern"
  3. oben rechts „Zur Überprüfung einreichen" → bestätigen.
     Paket, Bilder und Datenschutz-Tab bleiben, wie sie sind.

MICROSOFT EDGE ADD-ONS – Erstveröffentlichung
  0. Konto: https://partner.microsoft.com/dashboard/microsoftedge/public/login –
     mit Microsoft-Konto (Outlook/Live/Hotmail; oder „Mit GitHub anmelden", dann
     legt Microsoft ein Konto an). Registrierung „Microsoft Edge Developer Account":
     Land Schweiz, Kontotyp „Individual", Publisher display name (öffentlich, z. B.
     „bge.reader"), Kontakt-E-Mail bge.reader@gmail.com, Vereinbarung annehmen,
     „Finish". Kostenlos; Bestätigungsmail abwarten.
  1. Dashboard → „Create new extension" → bger-reader-${VERSION}.zip vom GitHub-Release
     hochladen → „Continue"
  2. „Availability": Public, alle Märkte → „Save & Continue"
  3. „Properties": Category „Accessibility"; Website und Support contact aus
     texte/06-urls.txt; „Mature content" leer → „Save & Continue"
  4. „Privacy": Single Purpose = 02; Permission justification storage = 03;
     Remote code „No"; Data usage: keine Kategorie ankreuzen, Zusicherungen
     bestätigen; Privacy Policy URL aus 06 → „Save & Continue"
  5. „Store listings" → Zeile „English (United States)" → „Edit details":
     Description = 01; Extension logo = bilder/logo-300x300.png; Screenshots =
     bilder/screenshots/01…06; die beiden Kacheln optional; Search terms = 05
     → „Save draft" → „Close"
  6. „Publish" → „Notes for certification" = 07 → „Publish".
     Zertifizierung bis zu 7 Werktage; Produkt-ID = GUID in der Adresszeile.`);

/* ZIP (zip -X: keine Betriebssystem-Extras, gleiche Bytes auf macOS und Linux) */
const zip = spawnSync('zip', ['-qr', '-X', NAME + '.zip', NAME], { cwd: DIST, stdio: 'inherit' });
if (zip.status !== 0) { console.error('ABBRUCH: zip fehlgeschlagen (ist zip installiert?)'); process.exit(1); }
fs.rmSync(ZIEL, { recursive: true, force: true });
const bytes = fs.readFileSync(ZIEL + '.zip');
console.log('geschrieben: dist/' + NAME + '.zip (' + Math.round(bytes.length / 1024) + ' KB, SHA-256 ' +
  crypto.createHash('sha256').update(bytes).digest('hex') + ')');

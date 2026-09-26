# Update in die drei Stores bringen

1. Version erhöhen: `node tools/version.js patch|minor|major`, CHANGELOG-Eintrag ausfüllen, Suite grün, Push auf `main`. Die CI legt das Release `v<version>` mit `bger-reader-<version>.zip` und `.sha256` an (github.com/cursorblinkrate-boop/bger-reader-addon/releases). Nur dieses ZIP wird hochgeladen, nie ein lokal gebautes (STARTPROMPT Regel 8).
2. Texte: nur Englisch, in allen drei Stores gleich (Vorgabe der Autorin). Name und Kurzbeschreibung liegen im Paket (`extension/_locales/en/messages.json`, Block [6] prüft die Längen), Beschreibung, Berechtigungs-Begründungen und Bildunterschriften in `store/listing.en.md` – sie werden im jeweiligen Dashboard von Hand eingetragen. Reviewer-Hinweise: `store/reviewer-notes.md`. Nach Textänderungen `node store/amo-metadata.js` (prüft auch, dass Listing und `_locales` übereinstimmen).
3. Chrome Web Store: https://chrome.google.com/webstore/devconsole → Element → „Paket" → „Neues Paket hochladen" → Release-ZIP → Tabs „Store-Eintrag" und „Datenschutz" prüfen → „Zur Überprüfung einreichen". Prüfung: einige Tage, bis zu einige Wochen.
4. Firefox Add-ons (AMO): headless mit `web-ext sign --channel listed --source-dir <entpacktes Release-ZIP> --amo-metadata store/amo-metadata.json` (API-Keys als Umgebungsvariablen `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`, nie im Repo) – oder https://addons.mozilla.org/developers/ → Add-on → „Neue Version hochladen". Listed-Versionen werden nach der automatischen Prüfung signiert und veröffentlicht; eine manuelle Prüfung kann folgen.
5. Microsoft Edge Add-ons: https://partner.microsoft.com/dashboard/microsoftedge → Erweiterung → „Update" → Release-ZIP → Listing prüfen → „Publish". Zertifizierung bis zu 7 Werktage.
6. Bilder nur bei sichtbaren Änderungen an Panel, Dialog oder Pop-up neu: CI-Artefakte `screenshots-windows-latest-chromium` (Chrome, Edge: die 1280 × 800 im Wurzelordner) und `screenshots-windows-latest-firefox` (AMO: die 1280 × 960 aus dem Unterordner `amo/`, Verhältnis 4:3) des Release-Laufs herunterladen, Auswahl nach `store/screenshots/<browser>/` (Liste und Reihenfolge in `listing.en.md`), jedes Bild ansehen. Promo-Kacheln und Edge-Logo: `node store/promo/render.js`.
7. Nach jeder Einreichung: Status im Dashboard prüfen, Ablehnungsgründe im CHANGELOG der Folgeversion nennen.

## Erstveröffentlichung (einmalig; Felder von Hand, Texte aus `listing.en.md`)

Voraussetzungen. Chrome Web Store: Entwicklerkonto (einmalig 5 USD), Google-Konto mit Bestätigung in zwei Schritten, im Tab „Konto" Kontakt-E-Mail bestätigt und Händlerstatus erklärt (EU-DSA; Privatprojekt = kein Händler) – ohne das lässt sich nicht einreichen. Edge: Partner-Center-Konto, im Programm „Microsoft Edge" registriert (kostenlos). Warnungen beim Hochladen zu `browser_specific_settings` oder `background.scripts` (Firefox-Teile des Manifests) sind erwartet, keine Ablehnung.

Chrome Web Store: Dashboard → „Neues Element" → Release-ZIP.
- „Store-Eintrag": Beschreibung = „Description"; Kategorie Accessibility; Sprache English; Store-Symbol `extension/icons/icon128.png`; Screenshots 1–5 aus `screenshots/chromium/` in der Reihenfolge der Bildliste; kleine Werbekachel `promo/kachel-klein-440x280.png` (Pflicht), Marquee `promo/kachel-marquee-1400x560.png`; Homepage- und Support-URL aus „Addresses", „Offizielle URL" leer lassen (nur verifizierte Websites); keine nicht jugendfreien Inhalte, keine Analytics-ID.
- „Datenschutz": Einzelzweck = „Single purpose"; Begründungen für `storage` und für die Host-Berechtigung (die `content_scripts`-Muster) = „Permissions – justifications"; Remote-Code: nein; Datennutzung: keine Kategorie ankreuzen, die drei Zusicherungen bestätigen; Datenschutzerklärung = PRIVACY-Link.
- „Vertrieb": kostenlos, Sichtbarkeit öffentlich, alle Regionen.
- „Zur Überprüfung einreichen"; automatische Veröffentlichung nach der Prüfung eingeschaltet lassen. Element-ID = die 32 Buchstaben in der URL des Elements.

Edge Add-ons: Partner Center → „Neue Erweiterung erstellen" → Release-ZIP.
- „Verfügbarkeit": öffentlich, alle Märkte.
- „Eigenschaften": Kategorie Accessibility; Datenschutzrichtlinie = PRIVACY-Link; Website = Homepage; Support-Kontakt = Issues-URL; keine nicht jugendfreien Inhalte.
- „Store-Einträge" (English): Beschreibung = „Description" (250–10 000 Zeichen); Kurzbeschreibung kommt aus dem Manifest; Store-Logo `promo/logo-300x300.png` (Pflicht); alle sechs Bilder aus `screenshots/chromium/`; die beiden Werbekacheln optional; Suchbegriffe = „Search terms Edge".
- „Veröffentlichen": „Hinweise für die Zertifizierung" = Kurzfassung aus `reviewer-notes.md`, dann „Veröffentlichen". Produkt-ID = GUID in der URL der Erweiterung.

AMO: erste Version wie Schritt 4 (`web-ext sign` legt das gelistete Add-on aus `amo-metadata.json` an). Bilder lädt die API nicht: danach im Developer Hub die sechs Bilder aus `screenshots/firefox/` mit Unterschriften hochladen. Slug notieren.

Danach die Kennungen unten eintragen und pushen.

Kennungen (nach der Erstveröffentlichung eintragen):
- Chrome Web Store, Element-ID: …
- AMO, Slug / Add-on-ID: … / bger-reader@bge.reader
- Edge Add-ons, Produkt-ID: …

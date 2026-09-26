# Update in die drei Stores bringen

1. Version erhöhen: `node tools/version.js patch|minor|major`, CHANGELOG-Eintrag ausfüllen, Suite grün, Push auf `main`. Die CI legt das Release `v<version>` mit `bger-reader-<version>.zip` und `.sha256` an (github.com/cursorblinkrate-boop/bger-reader-addon/releases). Nur dieses ZIP wird hochgeladen, nie ein lokal gebautes (STARTPROMPT Regel 8).
2. Texte: nur Englisch, in allen drei Stores gleich (Vorgabe der Autorin). Name und Kurzbeschreibung liegen im Paket (`extension/_locales/en/messages.json`, Block [6] prüft die Längen), Beschreibung, Berechtigungs-Begründungen und Bildunterschriften in `store/listing.en.md` – sie werden im jeweiligen Dashboard von Hand eingetragen. Reviewer-Hinweise: `store/reviewer-notes.md`. Nach Textänderungen `node store/amo-metadata.js` (prüft auch, dass Listing und `_locales` übereinstimmen).
3. Chrome Web Store: https://chrome.google.com/webstore/devconsole → Element → „Paket" → „Neues Paket hochladen" → Release-ZIP → Tabs „Store-Eintrag" und „Datenschutz" prüfen → „Zur Überprüfung einreichen". Prüfung: einige Tage, bis zu einige Wochen.
4. Firefox Add-ons (AMO): headless mit `web-ext sign --channel listed --source-dir <entpacktes Release-ZIP> --amo-metadata store/amo-metadata.json` (API-Keys als Umgebungsvariablen `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`, nie im Repo) – oder https://addons.mozilla.org/developers/ → Add-on → „Neue Version hochladen". Listed-Versionen werden nach der automatischen Prüfung signiert und veröffentlicht; eine manuelle Prüfung kann folgen.
5. Microsoft Edge Add-ons: https://partner.microsoft.com/dashboard/microsoftedge → Erweiterung → „Update" → Release-ZIP → Listing prüfen → „Publish". Zertifizierung bis zu 7 Werktage.
6. Bilder nur bei sichtbaren Änderungen an Panel, Dialog oder Pop-up neu: CI-Artefakte `screenshots-windows-latest-chromium` (Chrome, Edge: die 1280 × 800 im Wurzelordner) und `screenshots-windows-latest-firefox` (AMO: die 1280 × 960 aus dem Unterordner `amo/`, Verhältnis 4:3) des Release-Laufs herunterladen, Auswahl nach `store/screenshots/<browser>/` (Liste und Reihenfolge in `listing.en.md`), jedes Bild ansehen. Promo-Kacheln und Edge-Logo: `node store/promo/render.js`.
7. Nach jeder Einreichung: Status im Dashboard prüfen, Ablehnungsgründe im CHANGELOG der Folgeversion nennen.

Kennungen (nach der Erstveröffentlichung eintragen):
- Chrome Web Store, Element-ID: …
- AMO, Slug / Add-on-ID: … / bger-reader@bge.reader
- Edge Add-ons, Produkt-ID: …

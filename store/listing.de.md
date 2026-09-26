# Store-Eintrag – Deutsch

Quelle für den Chrome Web Store (Listing-Sprache Deutsch, Standardsprache),
Microsoft Edge Add-ons (Store listing „Deutsch") und Firefox Add-ons / AMO
(Locale de). Name und Kurzbeschreibung stehen zusätzlich im Paket
(`extension/_locales/de/messages.json`); beide Stellen gleich halten.
Ablauf für Einreichung und Updates: `STORE-UPDATE.md`.

## Name (Manifest, 42 Zeichen; Chrome empfiehlt ≤ 45, AMO erlaubt ≤ 50)

BGer Reader – Bundesgericht & BVGer lesbar

## Kurzbeschreibung (Manifest, 129 Zeichen; Chrome/Edge ≤ 132, AMO-Summary ≤ 250)

Bundesgerichtsentscheide barrierefrei lesen: Schrift, Abstände, Farben, Fundstellen einklappen. bger.ch und BVGer. 100 % offline.

## Ausführliche Beschreibung (Chrome, AMO, Edge; Edge verlangt 250–10 000 Zeichen)

BGer Reader macht Bundesgerichtsentscheide auf bger.ch (search.bger.ch, relevancy.bger.ch) und Entscheide des Bundesverwaltungsgerichts (BVGer, bvger.weblaw.ch) leichter lesbar. Die Erweiterung ist eine Lesehilfe für Menschen mit Legasthenie (Dyslexie), Dyskalkulie oder Sehbehinderung – und für alle, die Rechtsprechung lange am Bildschirm lesen: im Jurastudium, in der Anwaltskanzlei, am Gericht und in der Verwaltung.

Was die Erweiterung kann

• Schrift: neun Schriftarten, darunter Atkinson Hyperlegible und Luciole (für Menschen mit Sehbeeinträchtigung entworfen) und OpenDyslexic (für Menschen mit Legasthenie entworfen); Schriftgrösse 6 bis 50, Schriftstärke normal oder fett.
• Abstände und Satz: Zeilen-, Absatz-, Buchstaben- und Wortabstand, Zeilenlänge, Textbreite, Silbentrennung, Ausrichtung, ein bis drei Spalten.
• Hintergrund: Weiss, Sepia, Dunkelmodus, Hoher Kontrast und ein rötlicher Nachtmodus.
• Fundstellen einklappen: Klammern mit Rechtsprechungszitaten (BGE, Aktenzeichen, EGMR) und Literaturangaben werden hinter einem kleinen Pfeil eingeklappt, damit der Gedankengang nicht ständig unterbrochen wird. Gesetzesverweise und Entscheidtext bleiben offen; jede Klammer lässt sich mit einem Klick öffnen. Bei Dyskalkulie hilft das besonders: die langen Zahlenketten der Fundstellen verschwinden aus dem Lesefluss.
• Bedienung: Einstellungsfeld direkt auf der Seite (pinker Knopf oben rechts) oder gross in der Mitte über dem Entscheid (Klick auf das Symbol in der Symbolleiste), vollständig per Tastatur bedienbar. Bedienoberfläche in Deutsch, Französisch, Italienisch und Englisch.
• Drucken und PDF: schwarz auf weiss in der gewählten Schrift; eingeklappte Klammern bleiben eingeklappt.
• Lesemodus und Einstellungen werden automatisch gespeichert und gelten auf allen unterstützten Seiten der Schweizer Gerichte.

Datenschutz

BGer Reader arbeitet zu 100 % offline. Die Erweiterung sendet keine Daten, lädt nichts nach, enthält keine Werbung und keine Statistik. Ihre einzige Berechtigung ist der lokale Speicher für die eigenen Einstellungen. Der Quellcode ist Open Source (MIT-Lizenz) und öffentlich einsehbar.

Unabhängig

BGer Reader ist ein unabhängiges Projekt und weder mit dem Bundesgericht noch mit dem Bundesverwaltungsgericht oder mit Weblaw verbunden. Die Erweiterung verändert nur die Darstellung im eigenen Browser; der Text des Entscheids bleibt unverändert und vollständig.

Support

Fragen und Fehlermeldungen: https://github.com/cursorblinkrate-boop/bger-reader-addon/issues oder bger.reader@gmail.com

## Kategorie

- Chrome Web Store: Barrierefreiheit (Accessibility)
- Edge Add-ons: Accessibility
- AMO: Appearance (es gibt keine Kategorie „Barrierefreiheit"; „Other" ist nicht kombinierbar). Tag aus der festen AMO-Liste: „dark mode". AMO-Summary = Kurzbeschreibung, aber ohne Domain (AMO lehnt URLs in der Summary ab): „bger.ch und BVGer" wird zu „Bundesgericht und BVGer" (`amo-metadata.js`).

## Suchbegriffe Edge (nicht öffentlich sichtbar; max. 7 Begriffe, zusammen max. 21 Wörter, je ≤ 30 Zeichen)

Bundesgericht · Bundesgerichtsentscheide · BGE · Bundesverwaltungsgericht · Legasthenie · Lesehilfe · barrierefrei

## Single Purpose (Chrome „Einziger Zweck", Edge „Single purpose")

Die Erweiterung verbessert die Lesbarkeit von Entscheiden des Bundesgerichts (bger.ch) und des Bundesverwaltungsgerichts (bvger.weblaw.ch) durch anpassbare Typografie, Farbschemata und einklappbare Fundstellen-Klammern.

## Berechtigungen – Begründungen

- `storage`: Speichert ausschliesslich die Anzeige-Einstellungen lokal im Browser (storage.local); es werden keine Daten übertragen.
- Host-Berechtigungen (Content-Script-Muster search.bger.ch, relevancy.bger.ch, bvger.weblaw.ch): Die Skripte laufen nur auf diesen drei Seiten, weil nur dort die Entscheide dargestellt werden; sie verändern die Darstellung des Entscheidtexts und lesen weder Daten aus noch übertragen sie welche.
- Remote-Code: Nein. Datenerhebung: keine (alle drei Zusicherungen bestätigen).
- Datenschutzerklärung: https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/PRIVACY.md

## Adressen

- Homepage / Website: https://github.com/cursorblinkrate-boop/bger-reader-addon
- Support-URL: https://github.com/cursorblinkrate-boop/bger-reader-addon/issues
- Support-E-Mail: bger.reader@gmail.com

## Bilder und Bildunterschriften (Reihenfolge; Bilder in `screenshots/`)

Chrome (max. 5) und Edge (max. 6) aus `screenshots/chromium/`, AMO aus `screenshots/firefox/` (AMO zeigt Bildunterschriften):

1. `02-panel.png` – Das Einstellungsfeld auf der Entscheidseite: einschalten, Schriftgrösse, Schriftart, Hintergrund, Breite, „einfach" (Fundstellen einklappen).
2. `41-klammer-aufgeklappt.png` – Fundstellen eingeklappt, eine Klammer per Klick geöffnet; Gesetzesverweise bleiben offen.
3. `23-hintergrund-nacht.png` – Hintergrund Nacht: rötlich abgedunkelt für das Lesen am Abend.
4. `06-dialog-mittig.png` – Klick auf das Symbol in der Symbolleiste: dieselben Einstellungen gross in der Mitte, der Entscheid bleibt sichtbar (hier Sepia).
5. `03-panel-erweitert.png` – Erweiterte Einstellungen: Schriftstärke, Zeilen, Absatz, Buchstaben- und Wortabstand, Zeilenlänge, Silbentrennung, Ausrichtung, Spalten.
6. `90-franzoesisch-regeste.png` (Edge, AMO; für das französische Listing an erster Stelle) – Ein französischsprachiger Entscheid (BGE 145 I 207) auf der französischen Seite von bger.ch.

Promo-Bilder (`promo/`): `kachel-klein-440x280.png` (Chrome Pflicht, Edge optional), `kachel-marquee-1400x560.png` (Chrome optional, Edge optional), `logo-300x300.png` (Edge Store-Logo). Store-Icon Chrome: `extension/icons/icon128.png`.

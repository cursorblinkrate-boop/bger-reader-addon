# Store listing

One text for all three stores (Chrome Web Store, Firefox Add-ons, Microsoft
Edge Add-ons), English only, as short as possible – decision of the author.
Name and short description are also in the package
(`extension/_locales/en/messages.json`); keep both places identical.
`amo-metadata.js` reads sections 1–3 of this file. Procedure: `STORE-UPDATE.md`.

## Name (manifest, 45 characters; Chrome allows 75, AMO 50)

accessibility add-on for bger.ch and bvger.ch

## Short description (manifest, 111 characters; Chrome/Edge ≤ 132)

accessibility add-on: adjustable fonts, spacing, colours and citations on bger.ch and bvger.ch. 100 % offline.

## Description (Chrome, AMO, Edge; Edge requires 250–10,000 characters)

English, then German after `---` (one field; Chrome lists this package in English only). Text of the author, 2026-09-26.

Free and open-source accessibility add-on for Swiss Federal Supreme Court decisions and the Swiss Federal Administrative Court. It adds adjustable typography, fonts designed for low vision and dyslexia, colour schemes (dark mode, sepia).

Advanced settings: weight, line, paragraph, letter and word spacing, line length, hyphenation, alignment, columns.

Supported pages:
https://search.bger.ch/*
https://relevancy.bger.ch/*
http://relevancy.bger.ch/*
https://bvger.weblaw.ch/*

Runs entirely offline: no frameworks, no tracking, no external requests, no data collected, transmitted or stored outside your browser. Stores only the display settings locally in the browser (storage.local). Not affiliated with any courts, governments or Weblaw.

Fonts: Atkinson Hyperlegible Next, OpenDyslexic, Comic Neue, EB Garamond, Liberation Sans and Liberation Serif (SIL Open Font License 1.1), Luciole (CC BY 4.0), System Sans and System Serif (system default).

Source code (MIT) is public: https://github.com/cursorblinkrate-boop/bger-reader-addon

---

Open-Source Browser-Erweiterung für BGEs und Bundesverwaltungsgerichtsentscheide (experimentell). Die Erweiterung verbessert die Lesbarkeit von BGEs (bger.ch) und BVGer Entscheiden (bvger.weblaw.ch) - anpassbare Typografie, Farbschemata und einklappbare Fundstellen-Klammern.

Erweiterte Einstellungen: Schriftstärke, Zeilen, Absatz, Buchstaben- und Wortabstand, Zeilenlänge, Silbentrennung, Ausrichtung, Spalten.

Die Erweiterung arbeitet vollständig im eigenen Browser. Sie baut keine Verbindung zu Servern auf, lädt nichts nach und sendet nichts – auch nicht an die Entwicklerin. Erhebt, speichert und übermittelt keine personenbezogenen Daten, keine Registrierung, keine Werbung, keine Nutzungsstatistik und keine Absturzberichte. Speichert ausschliesslich die Anzeige-Einstellungen lokal im Browser (storage.local).

Unterstützte Seiten:
- https://search.bger.ch/*
- https://relevancy.bger.ch/*
- http://relevancy.bger.ch/*
- https://bvger.weblaw.ch/*

Der Quellcode ist öffentlich: https://github.com/cursorblinkrate-boop/bger-reader-addon

Schriftarten:
- OpenDyslexic (https://opendyslexic.org)
- Atkinson Hyperlegible Next (Braille Institute; https://www.brailleinstitute.org)
- Luciole (https://www.luciole-vision.com)
- Comic Neue, EB Garamond, Liberation Sans und Liberation Serif
- System Sans und System Serif (System-Default)

Die Schriftdateien werden mitgeliefert; lokal - in der Erweiterung selbst gebündelt.

Lizenz
Die mitgelieferten Schriften stehen unter der SIL Open Font License 1.1, Luciole unter Creative Commons BY 4.0.
Die Icons neben den Einstellungen stammen aus dem Icon-Thema Colibre von LibreOffice (CC0), das Symbol der Erweiterung ist mit Claude erstellt worden. Quellcode (MIT) ist öffentlich: https://github.com/cursorblinkrate-boop/bger-reader-addon

Das accessibility add-on ist ein privates Projekt und weder mit dem Bundesgericht noch mit dem Bundesverwaltungsgericht oder mit Weblaw verbunden.

## Category

- Chrome Web Store: Accessibility
- Edge Add-ons: Accessibility
- AMO: Appearance (no "Accessibility" category; "Other" cannot be combined). Tag from AMO's fixed list: "dark mode". AMO summary = short description without domains (AMO rejects URLs in the summary): "on bger.ch and bvger.ch" becomes "for Swiss federal court decisions" (`amo-metadata.js`).

## Search terms Edge (not shown publicly; max. 7 terms, max. 21 words in total, each ≤ 30 characters)

Swiss Federal Supreme Court · Swiss case law · accessibility · dyslexia · reader mode · low vision · offline

## Single purpose (Chrome, Edge)

The extension improves the readability of decisions of the Swiss Federal Supreme Court (bger.ch) and the Federal Administrative Court (bvger.weblaw.ch) through adjustable typography, colour schemes and collapsible citation parentheses.

## Permissions – justifications

- `storage`: Stores only the display settings locally in the browser (storage.local); no data is transmitted.
- Host permissions (content-script match patterns search.bger.ch, relevancy.bger.ch, bvger.weblaw.ch): The scripts run only on these three sites because only they display the court decisions; they change the presentation of the decision text and neither extract nor transmit any data.
- Remote code: No. Data collection: none (confirm all three certifications).
- Privacy policy: https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/PRIVACY.md

## Addresses

- Homepage / website: https://github.com/cursorblinkrate-boop/bger-reader-addon
- Support URL: https://github.com/cursorblinkrate-boop/bger-reader-addon/issues
- Support e-mail: bge.reader@gmail.com

## Images and captions (order; images in `screenshots/`)

Chrome (max. 5) and Edge (max. 6) from `screenshots/chromium/` (1280 × 800), AMO from `screenshots/firefox/` (1280 × 960, 4:3 ratio as AMO requires; AMO shows captions):

1. `02-panel.png` – Settings panel on the decision page: enable, font size, font, background, width, "simplify" (fold citations).
2. `41-klammer-aufgeklappt.png` – Citations folded, one parenthesis opened with a click; references to statutes stay open.
3. `23-hintergrund-nacht.png` – Night background.
4. `06-dialog-mittig.png` – Toolbar icon: the same settings large in the middle, the decision stays visible.
5. `03-panel-erweitert.png` – Advanced settings: weight, spacing, line length, hyphenation, alignment, columns.
6. `90-franzoesisch-regeste.png` (Edge, AMO) – A French-language decision on the French pages of bger.ch.

Three further screenshots by the author, cropped to 1280 × 800 from her own captures (`screenshots/chromium/50…52`); Chrome shows at most 5, so they replace items from the list above:

- `50-garamond-zwei-spalten-italiano.png` – EB Garamond, two columns, dark background, Italian interface (BGE 129 IV 230).
- `51-system-sans-dunkel-deutsch.png` – System Sans, wide text, dark background, German interface (BGE 116 Ia 359).
- `52-luciole-nacht-francais.png` – Luciole, night background, French interface (BGE 99 Ib 39).

Promo images (`promo/`): `kachel-klein-440x280.png` (Chrome required, Edge optional), `kachel-marquee-1400x560.png` (Chrome optional, Edge optional), `logo-300x300.png` (Edge store logo). Chrome store icon: `extension/icons/icon128.png`.

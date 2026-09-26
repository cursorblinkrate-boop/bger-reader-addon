# Store listing

One text for all three stores (Chrome Web Store, Firefox Add-ons, Microsoft
Edge Add-ons), English only, as short as possible – decision of the author.
Name and short description are also in the package
(`extension/_locales/en/messages.json`); keep both places identical.
`amo-metadata.js` reads sections 1–3 of this file. Procedure: `STORE-UPDATE.md`.

## Name (manifest, 45 characters; Chrome allows 75, AMO 50)

accessibility add-on for bger.ch and bvger.ch

## Short description (manifest, 110 characters; Chrome/Edge ≤ 132)

accessibility add-on: adjustable fonts, spacing, colours and citations on bger.ch and bvger.ch. 100 % offline.

## Description (Chrome, AMO, Edge; Edge requires 250–10,000 characters)

Free and open-source accessibility add-on for Swiss Federal Supreme Court decisions (search.bger.ch, relevancy.bger.ch) and the Swiss Federal Administrative Court (bvger.weblaw.ch). It adds adjustable typography, fonts designed for low vision and dyslexia, colour schemes (dark mode etc.) and folds citations in parentheses out of the way. Available in German, English, French and Italian. Runs entirely offline: no frameworks, no tracking, no external requests, no data collected, transmitted or stored outside your browser. The only browser permission it asks for is storage, used to remember your settings.

Supported pages: https://search.bger.ch/*, https://relevancy.bger.ch/*, http://relevancy.bger.ch/*, https://bvger.weblaw.ch/*

Fonts are bundled, none is hosted online or downloaded: Atkinson Hyperlegible Next, OpenDyslexic, Comic Neue, EB Garamond, Liberation Sans and Liberation Serif (SIL Open Font License 1.1), Luciole (CC BY 4.0), System Sans and System Serif (system default).

Private project, not affiliated with the courts or Weblaw. Code (MIT): https://github.com/cursorblinkrate-boop/bger-reader-addon – bugs and security: https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/SECURITY.md

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

Promo images (`promo/`): `kachel-klein-440x280.png` (Chrome required, Edge optional), `kachel-marquee-1400x560.png` (Chrome optional, Edge optional), `logo-300x300.png` (Edge store logo). Chrome store icon: `extension/icons/icon128.png`.

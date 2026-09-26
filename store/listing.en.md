# Store listing – English

Source for the Chrome Web Store (listing language English), Microsoft Edge
Add-ons (store listing "English") and Firefox Add-ons / AMO (locale en-US).
Name and short description are also in the package
(`extension/_locales/en/messages.json`); keep both places identical.
Submission and update procedure: `STORE-UPDATE.md`.

## Name (manifest, 45 characters; Chrome recommends ≤ 45, AMO allows ≤ 50)

BGer Reader – Swiss court decisions, readable

## Short description (manifest, 131 characters; Chrome/Edge ≤ 132, AMO summary ≤ 250)

Read Swiss Federal Supreme Court decisions accessibly: fonts, spacing, colours, folded citations. bger.ch and BVGer. 100 % offline.

## Detailed description (Chrome, AMO, Edge; Edge requires 250–10,000 characters)

BGer Reader makes decisions of the Swiss Federal Supreme Court on bger.ch (search.bger.ch, relevancy.bger.ch) and of the Swiss Federal Administrative Court (BVGer, bvger.weblaw.ch) easier to read. It is a reading aid for people with dyslexia, dyscalculia or low vision – and for everyone who reads Swiss case law on screen for hours: law students, lawyers, courts and public administration.

What the extension does

• Fonts: nine typefaces, including Atkinson Hyperlegible and Luciole (designed for people with low vision) and OpenDyslexic (designed for people with dyslexia); font size 6 to 50, regular or bold.
• Spacing and layout: line, paragraph, letter and word spacing, line length, text width, hyphenation, alignment, one to three columns.
• Background: white, sepia, dark mode, high contrast and a reddish night mode.
• Folded citations: parentheses containing case-law citations (BGE/ATF/DTF, docket numbers, ECtHR) and literature references are folded behind a small arrow so the court's reasoning is not interrupted all the time. References to statutes and the decision text itself stay open; every parenthesis can be opened with one click. This helps particularly with dyscalculia: the long strings of numbers in citations disappear from the reading flow.
• Controls: a settings panel right on the page (pink button, top right) or large in the middle over the decision (click the toolbar icon), fully keyboard accessible. Interface in German, French, Italian and English.
• Print and PDF: black on white in the chosen font; folded parentheses stay folded.
• Reader mode and settings are saved automatically and apply to all supported pages of the Swiss courts.

Privacy

BGer Reader works 100 % offline. The extension sends no data, downloads nothing, contains no advertising and no analytics. Its only permission is local storage for its own settings. The source code is open source (MIT licence) and public.

Independent

BGer Reader is an independent project and is not affiliated with the Swiss Federal Supreme Court, the Federal Administrative Court or Weblaw. The extension only changes how the decision is displayed in your own browser; the text of the decision remains unchanged and complete.

Support

Questions and bug reports: https://github.com/cursorblinkrate-boop/bger-reader-addon/issues or bger.reader@gmail.com

## Category

- Chrome Web Store: Accessibility
- Edge Add-ons: Accessibility
- AMO: Appearance (there is no "Accessibility" category; "Other" cannot be combined). Tag from AMO's fixed list: "dark mode". AMO summary = short description without the domain (AMO rejects URLs in the summary): "bger.ch and BVGer" becomes "Federal Supreme Court and BVGer" (`amo-metadata.js`).

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
- Support e-mail: bger.reader@gmail.com

## Images and captions (order; images in `screenshots/`)

Chrome (max. 5) and Edge (max. 6) from `screenshots/chromium/`, AMO from `screenshots/firefox/` (AMO shows captions):

1. `02-panel.png` – The settings panel on the decision page: enable, font size, font, background, width, "simplify" (fold citations).
2. `41-klammer-aufgeklappt.png` – Citations folded, one parenthesis opened with a click; references to statutes stay open.
3. `23-hintergrund-nacht.png` – Night background: reddish and dimmed for reading in the evening.
4. `06-dialog-mittig.png` – Click on the toolbar icon: the same settings large in the middle, the decision stays visible (here sepia).
5. `03-panel-erweitert.png` – Advanced settings: weight, line, paragraph, letter and word spacing, line length, hyphenation, alignment, columns.
6. `90-franzoesisch-regeste.png` (Edge, AMO) – A French-language decision (BGE 145 I 207) on the French pages of bger.ch.

Promo images (`promo/`): `kachel-klein-440x280.png` (Chrome required, Edge optional), `kachel-marquee-1400x560.png` (Chrome optional, Edge optional), `logo-300x300.png` (Edge store logo). Chrome store icon: `extension/icons/icon128.png`.

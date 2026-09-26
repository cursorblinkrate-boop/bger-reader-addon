# Notes to reviewers

Englisch, für AMO „Notes to Reviewer" (Feld `approval_notes`, höchstens
3000 Zeichen – `amo-metadata.js` übernimmt die Kurzfassung und prüft die
Länge), Edge „Notes for certification" und, falls gefragt, den Chrome Web
Store. Die Langfassung darunter ist die Referenz mit allen Details.

## Kurzfassung

Test page (public, no login) – BGE 116 Ia 359, a 1990 judgment on women's suffrage:
https://search.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F116-IA-359%3Ade&lang=de&type=show_document

Steps: 1) Open the page: a round pink button appears at the top right. 2) Click it: the settings panel opens. The interface defaults to Italian on purpose (the extension never reads the browser or page language); switch with the dropdown in the panel header (Deutsch / English / Français / Italiano). 3) Turn on the first switch ("attiva" / "einschalten" / "enable"): the typography changes and parentheses with citations fold into small arrows; click an arrow to expand a citation. 4) Try font, size and background; "avanzate" / "erweitert" / "advanced" shows the remaining settings. Settings survive a reload. 5) Click the toolbar icon: the same panel opens large over the decision; on a tab without a decision, a small settings window opens instead. 6) Print preview: black on white in the chosen font, folded parentheses stay folded.

- No network activity: no fetch, XMLHttpRequest, WebSocket or sendBeacon anywhere, nothing is loaded remotely (DevTools → Network shows no request from the extension); all fonts are bundled (fonts/*.woff2).
- Permissions: only "storage" (settings in storage.local). Content scripts run only on the three court sites listed in the manifest. No host_permissions, no "tabs" permission: the toolbar click uses tabs.sendMessage to the active tab.
- innerHTML is used once (content.js, ~line 1600) to build the settings panel in a Shadow DOM from a static template literal; the only interpolated values are module constants (panel CSS, inline SVG icons, one fixed tooltip). No page content or user input is ever inserted via innerHTML; the decision text is changed with DOM methods only and every change is reversible.
- data_collection_permissions: required ["none"] – the extension collects no data. Privacy policy: https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/PRIVACY.md
- No build step, no minification, no bundler, no third-party JavaScript: the uploaded ZIP is the source (git archive of extension/ at the tagged commit; SHA-256 published next to the GitHub release). Repository (MIT): https://github.com/cursorblinkrate-boop/bger-reader-addon
- Fonts (SIL OFL 1.1; Luciole CC BY 4.0) are Latin subsets made with tools/subset-fonts.py from the upstream files, so the binaries differ from upstream downloads; licences in fonts/LICENSES.md and icons/LICENSES.md.
- The manifest lists background as both service_worker (Chrome/Edge) and scripts (Firefox event page), same file; the linter warning BACKGROUND_SERVICE_WORKER_IGNORED is expected.
- search.bger.ch sits behind a bot protection (Imperva): an automated or headless browser may receive a CAPTCHA page; a normal browser session works. relevancy.bger.ch (plain http) is a second entry point to the same decisions.

## Langfassung

Test page (public, no login): BGE 116 Ia 359, a 1990 judgment on women's suffrage in the canton of Appenzell Innerrhoden:
https://search.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F116-IA-359%3Ade&lang=de&type=show_document
Second entry point to the same decision (plain http): http://relevancy.bger.ch/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F116-IA-359%3Ade&lang=de&type=show_document

Steps:
1. Install the extension and open the test page. A round pink button appears at the top right of the page.
2. Click it: the settings panel opens. The interface language defaults to Italian on purpose (the extension never reads the browser or page language – see privacy below); switch it with the dropdown in the panel header (Deutsch / English / Français / Italiano).
3. Turn on the first switch ("attiva" / "einschalten" / "enable"): the reading mode applies the typography, and parentheses with citations fold into small arrows. Click an arrow to expand a citation, click again to fold it.
4. Try font, size and background; "avanzate" / "erweitert" / "advanced" shows the remaining settings (spacing, line length, hyphenation, alignment, columns). Settings are saved and survive a reload.
5. Click the toolbar icon: the same panel opens large in the middle of the page over the decision. On a tab that has no decision, the toolbar icon opens the settings as a small separate window instead.
6. Print preview: black on white in the chosen font, folded parentheses stay folded.

Technical notes:
- No network activity. The extension contains no fetch, XMLHttpRequest, WebSocket or sendBeacon call and loads nothing from the network; DevTools → Network shows no request originating from the extension. All fonts are bundled (fonts/*.woff2, declared in web_accessible_resources).
- Permissions: only "storage" (settings in storage.local; storage.session in the background script for a window id). Content scripts are limited to the three court sites listed in the manifest. No host_permissions, no "tabs" permission: the toolbar click sends a message to the active tab (tabs.sendMessage), which needs no permission.
- innerHTML: content.js uses innerHTML exactly once (line ~1600), to build the settings panel inside a Shadow DOM from a static template literal. The only interpolated values are module-level constants (the panel CSS string, inline SVG icons, one fixed tooltip text). No page content and no user input is ever inserted through innerHTML. The decision text is changed with DOM methods only (createElement, textContent), and every change is reversible ("enable" off restores the original DOM).
- data_collection_permissions: { "required": ["none"] } – the extension collects no data at all. Privacy policy: https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/PRIVACY.md
- No build step, no minification, no bundler, no third-party JavaScript. The uploaded ZIP is the source: it is produced by the CI with "git archive" of the extension/ folder of the tagged commit, and its SHA-256 is published next to the release on GitHub. Repository (MIT): https://github.com/cursorblinkrate-boop/bger-reader-addon
- Fonts: OpenDyslexic, Atkinson Hyperlegible Next, EB Garamond, Comic Neue, Liberation Sans/Serif (SIL Open Font License 1.1) and Luciole (CC BY 4.0) are Latin subsets generated with tools/subset-fonts.py from the upstream files, which is why the binaries differ from upstream downloads. Licences: fonts/LICENSES.md; icons: icons/LICENSES.md (Colibre icons from LibreOffice, CC0).
- background: the manifest lists both "service_worker" (Chrome/Edge) and "scripts" (Firefox event page) pointing to the same file. Firefox ignores service_worker; the linter warning BACKGROUND_SERVICE_WORKER_IGNORED is expected.
- Localisation: name, short description and toolbar title come from _locales (de, en, fr, it; default de). The user interface texts are in sprachen.js.
- search.bger.ch sits behind a bot protection (Imperva). An automated or headless browser may receive a CAPTCHA page instead of the decision; a normal browser session works. bvger.weblaw.ch is a React app that loads the decision after the page; the extension waits for it (MutationObserver) and follows in-app navigation.

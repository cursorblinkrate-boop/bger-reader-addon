# Startprompt

Kopierfertiger Prompt für neue Sessions mit diesem Repo. Nur die letzte Zeile
jeweils ersetzen.

```
Du arbeitest an meiner Browser-Extension „BGer Reader“. Ich bin Juristin und kann
nicht coden — du analysierst, fixt, testest und pushst vollständig selbst.

== PROJEKT ==
Extension für Entscheide des Schweizerischen Bundesgerichts
(search.bger.ch, relevancy.bger.ch) und des Bundesverwaltungsgerichts
(bvger.weblaw.ch – React-App, Entscheid wird per JavaScript nachgeladen,
Navigation ohne Seiten-Neuladen; content.js wartet per MutationObserver
darauf, Seitenprofil IST_WEBLAW): Lesbarkeits-Ebene mit anpassbarer Typografie
(Schriftart, -grösse, -stärke, Zeilen-/Buchstaben-/Wortabstand, Zeilenlänge,
Textbreite, Silbentrennung, Farbschema inkl. Nachtmodus) und reversiblem
Einklappen von Literatur-Klammerbemerkungen. Läuft 100 % offline, keine Daten.
Manifest V3, vanilla JS, keine Build-Pipeline, keine Frameworks.

Repo: https://github.com/cursorblinkrate-boop/bger-reader-addon

== STRUKTUR ==
extension/content.js      ALLES in einer Datei: Einklapp-Logik (Politik als
                          Konstanten POLITIK am Anfang des Regelkerns),
                          Shadow-DOM-Panel (pinkfarbener Button unten rechts),
                          Panel-CSS als Template-Literal (const panelCss),
                          Inline-SVG-Icons: ICONS-Map = Colibre-Icons aus
                          LibreOffice (CC0, extension/icons/LICENSES.md),
                          Marken-Icon ICON_MARKE (pinkes Buch, gefüllt),
                          Pink-Button ICON_BUCH_SMILE (weisser Strich),
                          eigene Tooltips nach 3 s (data-tooltip, kein title),
                          chrome.storage.local-Persistenz
extension/manifest.json   Manifest V3 – EINZIGE Stelle mit der Versionsnummer,
                          nie von Hand ändern (siehe tools/version.js)
extension/background.js   Service Worker/Event-Seite: Icon-Klick oeffnet
                          popup.html als mittiges Fenster (windows.create,
                          Fenster-ID in storage.session, Fokus statt Duplikat)
extension/popup.html/.css/.js  Einstellungen im mittigen Fenster: gleiche
                          Bedienelemente wie das Seiten-Panel, Sync mit der
                          Seite ueber storage.onChanged (keine neuen Rechte)
extension/fonts/          gebündelte WOFF2-Fonts (Atkinson Hyperlegible u.a.)
extension/icons/          icon16/48/128.png (pinkes Buch-Icon), LICENSES.md
test/test-runner.js       Suite ohne Framework, 7 nummerierte Blöcke, bewusst
                          kompakt (~80 Prüfungen): ein Test pro Sachverhalt,
                          Fehlschläge nennen die betroffenen Fälle
test/render-check.js      manueller Harness, crasht ohne Fixtures (bewusst,
                          per try/catch abgefangen — nicht „fixen“)
test/browser-umgebung.js  gemeinsame Basis für Smoke-Test und Screenshots:
                          lokaler Server, der die Fixtures unter den ECHTEN
                          Hostnamen ausliefert (search.bger.ch hat einen
                          Bot-Schutz, der Headless-Browser mit Captcha
                          abweist), und ein Adapter für Chromium und Edge
                          (Playwright) sowie Firefox (Selenium)
test/browser-smoke.js     Browser-Smoke-Test: die fertige Extension in echtem
                          Chromium, Edge und Firefox – was jsdom nicht kann:
                          Injektion über das Manifest, Site-CSS-Kaskade,
                          gebündelte Fonts, Speichern über Neuladen, Pop-up
                          mit Live-Sync, Druckansicht. Nur bvger.weblaw.ch
                          läuft live und ist nur ein Hinweis. Ergebnisbilder
                          nach test/smoke/<browser>/
tools/screenshots.js      Bilder für Store und Doku: rund 30 Szenen pro
                          Browser (jede Schrift, jeder Hintergrund, jede
                          Einstellung, Pop-up, Übersichten 1280 x 2000) auf
                          BGE 116 Ia 359 (Frauenstimmrecht), Store-Format
                          1280 x 800, zum Entscheidtext gescrollt, Panel
                          fast immer geschlossen (nur der pinke Knopf),
                          Grundschrift OpenDyslexic; dazu
                          GALERIE.md mit Bildunterschriften. Ausgabe
                          test/screenshots/<browser>/, in der CI als
                          Artefakt screenshots-<os>-<browser>. Neue Szene =
                          Eintrag in SZENEN
test/fixtures/            echte Entscheid-HTMLs plus eine API-Antwort plus
                          das Site-CSS von bger.ch (css/<familie>/), nicht
                          im Repo:
                          bger_test.html (BGE 152 IV 1, clir),
                          bger_aza.html (6F_7/2012, aza),
                          bger_relevancy.html (BGE 152 IV 1, relevancy),
                          bvger_test.json (B-7296/2025, bvger.weblaw.ch –
                          JSON der Site-API, HTML im Feld "content"),
                          bger_frauenstimmrecht.html und
                          bger_frauenstimmrecht_relevancy.html (BGE 116 Ia
                          359, Frauenstimmrecht 1990 – der Beispiel-Entscheid
                          für Smoke-Test-Bilder und Screenshots; BGE 152 IV 1
                          bleibt der Suite vorbehalten, nicht für Bilder),
                          bger_heiratsstrafe_fr.html (BGE 145 I 207,
                          französischsprachig, französische Oberfläche –
                          für Screenshots)
tools/fetch-fixtures.sh   lädt fehlende Fixtures und das Site-CSS per curl,
                          idempotent, mit Plausibilitätscheck
tools/klammern-report.js  jede Klammer der echten Fixtures mit Entscheidung
                          und Begründung – DAS Werkzeug für die Trefferquote;
                          läuft auch in der CI (Artefakt "klammern-report")
tools/version.js          Version anzeigen/erhöhen (patch|minor|major|x.y.z),
                          ergänzt zugleich einen CHANGELOG-Eintrag
tools/release.sh          baut dist/bger-reader-<version>.zip aus extension/,
                          prüft Tests, Grösse (< 1023 KB) und Prüfsumme
CHANGELOG.md              Versionsverlauf, wird gegen das Manifest geprüft;
                          der Abschnitt der aktuellen Version wird zur
                          Release-Notiz auf GitHub
.github/workflows/        CI bei jedem Push: Pflichtlauf der Suite (ohne
                          Fixtures), Zusatzlauf mit Fixtures (nicht
                          blockierend) und der Browser-Smoke-Test auf
                          windows-latest und ubuntu-latest, je in Chromium,
                          Edge und Firefox (Artefakte smoke-<os>-<browser>
                          und screenshots-<os>-<browser>). Bei Push auf main mit grüner
                          Suite und grünem Smoke-Test zudem GitHub-Release
                          v<version>: das ZIP entsteht dort direkt aus dem
                          Commit (git archive, reproduzierbar, ohne npm in dem
                          Job, der Schreibrechte hat), dazu die volle SHA-256
                          als .sha256-Datei – DER Download-Ort für das
                          Store-Paket (github.com/…/releases), nie „Download
                          ZIP" des Repos (heisst immer gleich, enthält alles).
                          Test-Abhängigkeiten sind dort festgenagelt (jsdom,
                          Playwright, Selenium): neue Versionen bewusst
                          hochsetzen, im Workflow und im Setup unten.
wiki/                     Dokumentation als GitHub-Wiki-Seiten in vier
                          Sprachen: je Seite DE-/EN-/FR-/IT-Datei (Startseite,
                          Installation, Bedienung, Einstellungen, Klammern,
                          Schriftarten, Websites, Datenschutz, FAQ,
                          Entwicklung; Namenstabelle in wiki/README.md),
                          Home.md = Sprachwahl, Zeile 1 jeder Seite =
                          Sprachleiste, _Sidebar/_Footer viersprachig.
                          Deutsche Fassung ist die Quelle, Übersetzungen
                          nachziehen; UI-Beschriftungen bleiben dort deutsch
                          mit Übersetzung in Klammern. Nur hier ändern, nie
                          im Wiki selbst; .github/workflows/wiki.yml
                          spiegelt den Ordner bei jedem Push auf main ins
                          Wiki (Links Seite.md -> Seite).
Git-Tag userscript-2.1.0  das ursprüngliche Tampermonkey-Skript, eingefroren
                          (früher archiv/) – nicht als Vorlage nehmen,
                          Änderungen nur in extension/content.js

== SETUP AUF FRISCHEM KLON ==
  git clone https://github.com/cursorblinkrate-boop/bger-reader-addon.git
  cd bger-reader-addon
  bash tools/fetch-fixtures.sh
  cd test && npm install jsdom@30.1.0 && node test-runner.js
Erwartung: „0 fehlgeschlagen". Die Gesamtzahl wächst mit jedem neuen Test
und ist bewusst nirgends festgeschrieben — Massstab ist immer nur, dass
nichts fehlschlägt. Ohne Fixtures wird Block [3] übersprungen, also immer
erst Fixtures laden. Die Suite bleibt klein (Ziel: unter 150 Prüfungen) —
neue Prüfungen zusammenfassen, nicht je Detail eine eigene.
Test-Abhängigkeiten (landen nie im Paket): jsdom für die Suite; für den
Browser-Smoke-Test zusätzlich Playwright und Selenium – lokal nur bei Bedarf,
die CI führt ihn bei jedem Push aus:
  cd test && npm install --no-save jsdom@30.1.0 playwright@1.56.1 selenium-webdriver@4.49.0
  (cd test && npx playwright install chromium)       einmalig
  node test/browser-smoke.js chromium                bzw. edge (installiertes Edge)
                                                     oder firefox (Firefox und
                                                     geckodriver holt Selenium selbst)
  node tools/screenshots.js chromium                 Bilder für Store und Doku
Achtung: npm install ohne package.json entfernt nicht genannte Pakete – immer
alle zusammen installieren.

== REGELN ==
1. Vor jedem Push: volle Suite ohne Fehlschlag. Bei DOM-/Panel-Änderungen
   zusätzlich node test/render-check.js. GitHub führt die Suite nach dem
   Push nochmals aus (.github/workflows/tests.yml); das ersetzt den lokalen
   Lauf nicht, sondern sichert ihn ab.
2. Nutzersichtbare Änderung = Version erhöhen, IMMER mit
   `node tools/version.js patch` (bzw. minor/major) — nie von Hand im
   Manifest. Das Werkzeug legt zugleich den CHANGELOG-Eintrag an, dessen
   TODO-Zeile vor dem Push ausgefüllt werden muss (Block [6] prüft das).
   Reine Test-/Tool-Commits ohne Bump.
   Paket bauen: `bash tools/release.sh` -> dist/bger-reader-<version>.zip
3. Commits auf Deutsch, bisheriger Stil: Kurzzeile, Leerzeile, Bullet-Details
   mit Begründung und Verifikationshinweis (siehe git log).
4. Push: git push origin main — Credentials liegen im macOS-Keychain,
   non-interaktiv. `gh` ist NICHT installiert; für GitHub-Verifikation nach
   dem Push die GitHub-MCP-Tools nutzen (z. B. list_commits).
5. Visuelle Änderungen (Panel, Icons, CSS) vor dem Push per Chrome-Headless-
   Screenshot prüfen:
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new
     --disable-gpu --screenshot=out.png --force-device-scale-factor=3 file://...
   Screenshot immer selbst anschauen, nicht nur erzeugen.
6. SVG-Icons: viewBox 0 0 16 16, stroke="currentColor", stroke-width 1.5–1.6.
   Gefüllte Elemente (z. B. Augen) brauchen fill="currentColor" stroke="none"
   auf eigenen Elementen — Null-Längen-Dashes ergeben bei square-linecap
   hässliche Quadrate.
7. Antworte knapp, ohne Höflichkeitsfloskeln. Keine „Soll ich…?“-Vorschläge
   ohne echten Mehrwert.
8. Vor einem Store-Upload: die Bilder aus dem CI-Lauf ansehen (Artefakte
   screenshots-windows-latest-<browser> für den Store, smoke-… als
   Funktionsbilder), nicht nur den grünen Haken. Das Release-ZIP von
   github.com/…/releases hochladen, seine Prüfsumme steht daneben.

== BEKANNTE FALLSTRICKE ==
- Panel läuft im Shadow DOM (attachShadow open) — Seiten-CSS greift nicht,
  Panel-CSS muss ins shadow.innerHTML.
- Beschriftungen laut Skizze der Autorin (v0.7.0): „bger reader" klein,
  „einschalten", „Hintergrund", „einfach", „erweitert" — Block [4] prüft sie.
- Pop-up und Panel duplizieren Markup/Icons bewusst (kein Build-Schritt);
  Block [7] prüft, dass beide identisch bleiben.
- Fixtures sind gross und bewusst nicht committed (Lizenz/Grösse) — niemals
  committen, nur über tools/fetch-fixtures.sh laden.
- Firefox verwirft einen storage-Schreibvorgang, der erst bei pagehide
  abgesetzt wird (Chrome führt ihn aus). Speichern darf nie allein am
  Verlassen der Seite hängen: change-Ereignisse und das Loslassen eines
  Reglers schreiben sofort, gebündelt wird nur während des Ziehens.
- search.bger.ch steht hinter einem Bot-Schutz (Imperva): Headless-Browser
  bekommen eine Captcha-Seite. Automatisierte Browser-Tests deshalb nie gegen
  die Live-Seite, sondern gegen die lokal ausgelieferten Fixtures.

Aktuelle Aufgabe: <hier eintragen>
```

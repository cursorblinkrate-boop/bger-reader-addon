# Startprompt

Kopierfertiger Prompt für neue Sessions mit diesem Repo. Nur die letzte Zeile
jeweils ersetzen.

```
Du arbeitest an meiner Browser-Extension „BGer Reader“. Ich bin Juristin und kann
nicht coden — du analysierst, fixt, testest und pushst vollständig selbst.

== PROJEKT ==
Extension für Entscheide des Schweizerischen Bundesgerichts
(search.bger.ch, relevancy.bger.ch): Lesbarkeits-Ebene mit anpassbarer Typografie
(Schriftart, -grösse, -stärke, Zeilen-/Buchstaben-/Wortabstand, Zeilenlänge,
Textbreite, Silbentrennung, Farbschema inkl. Nachtmodus) und reversiblem
Einklappen von Literatur-Klammerbemerkungen. Läuft 100 % offline, keine Daten.
Manifest V3, vanilla JS, keine Build-Pipeline, keine Frameworks.

Repo: https://github.com/cursorblinkrate-boop/bger-reader-addon

== STRUKTUR ==
extension/content.js      ALLES in einer Datei: Einklapp-Logik,
                          Shadow-DOM-Panel (pinkfarbener Button unten rechts),
                          Panel-CSS als Template-Literal (const panelCss),
                          Inline-SVG-Icons (svgIcon() + ICONS-Map, Marken-Icon
                          ICON_BUCH_SMILE), chrome.storage.local-Persistenz
extension/manifest.json   Manifest V3 – EINZIGE Stelle mit der Versionsnummer,
                          nie von Hand ändern (siehe tools/version.js)
extension/fonts/          gebündelte WOFF2-Fonts (Atkinson Hyperlegible u.a.)
extension/icons/          icon16/48/128.png (pinkes Buch-Icon)
test/test-runner.js       Suite ohne Framework, nummerierte Blöcke
test/render-check.js      manueller Harness, crasht ohne Fixtures (bewusst,
                          per try/catch abgefangen — nicht „fixen“)
test/fixtures/            drei echte Entscheid-HTMLs (nicht im Repo):
                          bger_test.html (BGE 152 IV 1, clir),
                          bger_aza.html (6F_7/2012, aza),
                          bger_relevancy.html (BGE 152 IV 1, relevancy)
tools/fetch-fixtures.sh   lädt fehlende Fixtures per curl, idempotent,
                          mit Plausibilitätscheck
tools/version.js          Version anzeigen/erhöhen (patch|minor|major|x.y.z),
                          ergänzt zugleich einen CHANGELOG-Eintrag
tools/release.sh          baut dist/bger-reader-<version>.zip aus extension/,
                          prüft Tests, Grösse (< 1023 KB) und Prüfsumme
CHANGELOG.md              Versionsverlauf, wird gegen das Manifest geprüft
.github/workflows/        CI: Suite läuft bei jedem Push automatisch auf
                          GitHub (Pflichtlauf ohne Fixtures, Zusatzlauf mit
                          Fixtures nicht blockierend)
archiv/                   eingefrorene Vorgängerstände (bger-reader.user.js,
                          Userscript v2.1.0) – NICHT pflegen, nicht als Vorlage
                          nehmen, Änderungen nur in extension/content.js

== SETUP AUF FRISCHEM KLON ==
  git clone https://github.com/cursorblinkrate-boop/bger-reader-addon.git
  cd bger-reader-addon
  bash tools/fetch-fixtures.sh
  cd test && npm install jsdom && node test-runner.js
Erwartung: „0 fehlgeschlagen". Die Gesamtzahl wächst mit jedem neuen Test
und ist bewusst nirgends festgeschrieben — Massstab ist immer nur, dass
nichts fehlschlägt. Ohne Fixtures werden die Blöcke [4], [6], [7]
übersprungen, also immer erst Fixtures laden.
jsdom ist die einzige Test-Abhängigkeit.

== REGELN ==
1. Vor jedem Push: volle Suite ohne Fehlschlag. Bei DOM-/Panel-Änderungen
   zusätzlich node test/render-check.js. GitHub führt die Suite nach dem
   Push nochmals aus (.github/workflows/tests.yml); das ersetzt den lokalen
   Lauf nicht, sondern sichert ihn ab.
2. Nutzersichtbare Änderung = Version erhöhen, IMMER mit
   `node tools/version.js patch` (bzw. minor/major) — nie von Hand im
   Manifest. Das Werkzeug legt zugleich den CHANGELOG-Eintrag an, dessen
   TODO-Zeile vor dem Push ausgefüllt werden muss (Block [15] prüft das).
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

== BEKANNTE FALLSTRICKE ==
- Panel läuft im Shadow DOM (attachShadow open) — Seiten-CSS greift nicht,
  Panel-CSS muss ins shadow.innerHTML.
- Test-Block [9] prüft nur, dass ein <svg> im Button existiert, nicht welches.
- Fixtures sind gross und bewusst nicht committed (Lizenz/Grösse) — niemals
  committen, nur über tools/fetch-fixtures.sh laden.

Aktuelle Aufgabe: <hier eintragen>
```

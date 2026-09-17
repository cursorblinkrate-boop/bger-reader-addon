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
extension/content.js      ~1020 Zeilen, ALLES in einer Datei: Einklapp-Logik,
                          Shadow-DOM-Panel (pinkfarbener Button unten rechts),
                          Panel-CSS als Template-Literal (const panelCss),
                          Inline-SVG-Icons (svgIcon() + ICONS-Map, Marken-Icon
                          ICON_BUCH_SMILE), chrome.storage.local-Persistenz
extension/manifest.json   Manifest V3, Version hier bumpen
extension/background.js   Service Worker/Event-Seite: Icon-Klick oeffnet
                          popup.html als mittiges Fenster (windows.create,
                          Fenster-ID in storage.session, Fokus statt Duplikat)
extension/popup.html/.css/.js  Einstellungen im mittigen Fenster: gleiche
                          Bedienelemente wie das Seiten-Panel, Sync mit der
                          Seite ueber storage.onChanged (keine neuen Rechte)
extension/fonts/          gebündelte WOFF2-Fonts (Atkinson Hyperlegible u.a.)
extension/icons/          icon16/48/128.png (pinkes Buch-Icon)
test/test-runner.js       ~1080 Zeilen, Suite ohne Framework, Blöcke [1]–[13]
test/render-check.js      manueller Harness, crasht ohne Fixtures (bewusst,
                          per try/catch abgefangen — nicht „fixen“)
test/fixtures/            drei echte Entscheid-HTMLs (nicht im Repo):
                          bger_test.html (BGE 152 IV 1, clir),
                          bger_aza.html (6F_7/2012, aza),
                          bger_relevancy.html (BGE 152 IV 1, relevancy)
tools/fetch-fixtures.sh   lädt fehlende Fixtures per curl, idempotent,
                          mit Plausibilitätscheck

== SETUP AUF FRISCHEM KLON ==
  git clone https://github.com/cursorblinkrate-boop/bger-reader-addon.git
  cd bger-reader-addon
  bash tools/fetch-fixtures.sh
  cd test && npm install jsdom && node test-runner.js
Erwartung: 189/189 grün. Ohne Fixtures deckt die Suite nur ~80 % ab
(Blöcke [4], [6], [7] werden übersprungen) — also immer erst Fixtures laden.
jsdom ist die einzige Test-Abhängigkeit.

== REGELN ==
1. Vor jedem Push: volle Suite 189/189. Bei DOM-/Panel-Änderungen zusätzlich
   node test/render-check.js.
2. Nutzersichtbare Änderung = Version in extension/manifest.json erhöhen
   (Patch-Stelle, aktuell 0.5.x). Reine Test-/Tool-Commits ohne Bump.
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

# Arbeitsregeln für Claude Code in diesem Repo

- Kleines Projekt, eine Person, ca. 1000 Zeilen Vanilla JS. Keine Zeremonie.
- Änderungen direkt auf `main` pushen. Keine Feature-Branches, keine
  Pull Requests, keine Drafts, ausser die Nutzerin verlangt es ausdrücklich.
- Kein Docker, keine zusätzlichen Umgebungen, keine neuen Abhängigkeiten.
  Test-Abhängigkeiten (nie im ausgelieferten Paket): jsdom für die Suite,
  Playwright und Selenium nur für den Browser-Smoke-Test. Keine weiteren.
- Keine neuen Tests, ausser sie sichern eine konkrete Änderung ab.
- Antworten kurz und einfach, die Nutzerin ist Coding-Anfängerin.
- Details zum Projekt: STARTPROMPT.md

# Arbeitsregeln für Claude Code

Vor jeder Arbeit STARTPROMPT.md vollständig lesen (Abschnitte STRUKTUR, REGELN
und BEKANNTE FALLSTRICKE); die Regeln dort gelten unverändert. Diese Datei ist
nur der Verweis, den Claude Code beim Start automatisch lädt – keine zweite Doku.

Ohne ausdrückliche Freigabe der Autorin nie ändern:
- README.md – gar nicht anfassen, pflegt die Autorin selbst.
- Texte für Nutzer und Stores: PRIVACY.md, store/listing.en.md,
  store/reviewer-notes.md, extension/_locales/ – Änderungen nur als Vorschlag
  (Diff) im Pull Request, nicht eigenmächtig.
- Die Einklapp-Heuristik in extension/content.js (Regelkern von POLITIK bis
  begruendung, RegEx-Konstanten und Punktetabelle LITERATUR_SIGNALE):
  Handarbeit der Autorin und Alleinstellungsmerkmal, funktioniert und bleibt so.
  test/klammern-baseline.json friert ihr Ergebnis auf den echten Seiten ein.

Vor jedem Push: bash tools/fetch-fixtures.sh, (cd test && npm ci),
node test/test-runner.js – Ergebnis „0 fehlgeschlagen".
Arbeiten auf einem Branch claude_code/… mit Draft-Pull-Request gegen main,
nie direkt auf main pushen.

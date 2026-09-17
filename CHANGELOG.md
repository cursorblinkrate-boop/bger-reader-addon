# Änderungsverlauf

Alle veröffentlichten Versionen dieser Extension, neueste zuerst.

**Die Versionsnummer steht an genau einer Stelle: `extension/manifest.json`.**
Geändert wird sie ausschliesslich mit `node tools/version.js` — nie von Hand.
Dieser Verlauf und das Manifest werden von Testblock [15] automatisch
gegeneinander geprüft; laufen sie auseinander, wird die Suite rot.

Nummerierung nach [Semantic Versioning](https://semver.org/lang/de/):
`MAJOR.MINOR.PATCH` — vorne bei Umbauten, in der Mitte bei neuen Funktionen,
hinten bei Korrekturen.

---

## 0.5.6 — 2026-09-17

- Bedienung entkoppelt: Typografie- und Farbänderungen bauen die Klammer-Folds
  nicht mehr neu auf. 43,05 ms → 0,19 ms pro Reglerbewegung.
- Von Hand aufgeklappte Klammerbemerkungen bleiben beim Verstellen offen.
- Speicherzugriffe gebündelt (Throttle mit führender Kante, 400 ms), Nachschreiben
  bei `pagehide` und `visibilitychange`.
- Testblöcke [13] und [14] ergänzt.
- CI: `.github/workflows/tests.yml` läuft bei jedem Push.

## 0.5.5 — 2026-09-17

- Panel-Button und Kopfzeile: Buch-Piktogramm statt Lupe.

## 0.5.4 — 2026-09-17

- Web-Store-Icons (16/48/128 px), `icons`-Eintrag im Manifest.

## 0.5.3 — 2026-09-17

- Seitenrahmen (Grund, Navigation, Links) ans Farbschema angeglichen.
- Formularelemente und Suchmarkierungen vor dem Einfärben geschützt.

## 0.5.2 — 2026-09-17

- Header-Kommentarblock gekürzt.

## 0.5.1 — 2026-09-16

- Links im gesamten Entscheidcontainer folgen dem Farbschema (Render-Fix).

## 0.5.0 — 2026-09-16

- Klammer-Engine robuster: Seitenwechsel-Balken bleiben sichtbar, neuer Regelsatz.
- Panel vereinfacht, Farbschema „Nacht" ergänzt.

## 0.4.0 — 2026-09-16

- Easy-Mode-Klammerregel, Feinregler, Textbreite in der Hauptansicht.

## 0.3.1 — 2026-09-16

- WebExtensions-Speicher (`browser`/`chrome`), Firefox-Gecko-Einstellungen.

## 0.3.0 — 2026-09-13

- FOSS-Schriften lokal gebündelt (WOFF2, Latin-Subset) samt Lizenzen.

## 0.2.0 — 2026-09-13

- Erster Extension-Port auf Manifest V3: `manifest.json` + `content.js`,
  Speicher auf `chrome.storage.local` umgestellt.

---

## Vorgeschichte

**Userscript 2.1.0 — 2026-09-12.** Ursprung des Projekts als
Tampermonkey-Skript. Liegt eingefroren unter `archiv/bger-reader.user.js`.
Seine Versionsnummer gehört zu jener Zählung und wird **nicht** mitgezogen —
siehe `archiv/README.md`.

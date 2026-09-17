# Änderungsverlauf

Alle veröffentlichten Versionen dieser Extension, neueste zuerst.

**Die Versionsnummer steht an genau einer Stelle: `extension/manifest.json`.**
Geändert wird sie ausschliesslich mit `node tools/version.js` — nie von Hand.
Dieser Verlauf und das Manifest werden von Testblock [6] automatisch
gegeneinander geprüft; laufen sie auseinander, wird die Suite rot.

Nummerierung nach [Semantic Versioning](https://semver.org/lang/de/):
`MAJOR.MINOR.PATCH` — vorne bei Umbauten, in der Mitte bei neuen Funktionen,
hinten bei Korrekturen.

---

## 0.7.0 — 2026-09-17

- GUI nach Skizze der Autorin überarbeitet (Seiten-Panel und Pop-up-Fenster
  identisch): Kopfzeile „bger reader" klein geschrieben mit dem Extension-Icon
  als ausgefülltes pinkes Buch; Zwischentitel „Allgemein" und der
  Klammer-Zähler-Hinweis entfernt; Beschriftungen „einschalten", „Hintergrund",
  „einfach", „erweitert". Schliessen-Knopf, Regler und Häkchen in Pink.
- Schriftgrösse: Bereich 6–50 (vorher 12–30), Anzeige nur die Zahl ohne „px".
- Zeilen-Icons aus Colibre, dem Standard-Icon-Thema von LibreOffice (CC0,
  siehe `extension/icons/LICENSES.md`), statt selbst gezeichneter Striche.
- Dropdown-Vorschau: Schriftart-Optionen erscheinen in ihrer Schrift,
  Hintergrund-Optionen in ihren Farben; das geschlossene Dropdown zeigt den
  gewählten Eintrag ebenso. Browser mit nativ gezeichneter Liste (Firefox auf
  macOS) zeigen nur die Vorschau im geschlossenen Dropdown.
- Neue Einstellungen unter „erweitert": Ausrichtung (links, mittig, rechts,
  Blocksatz), Spalten (1–3, Zeitungssatz auf dem gemeinsamen Elternknoten der
  Absätze) und Absatzabstand (0–3, Faktor der Schriftgrösse). Alle drei sind
  layout-neutral: ohne Abweichung vom Standard wird keine Regel aktiv.
- Tooltips erscheinen erst nach 3 Sekunden (eigener Tooltip in
  `data-tooltip`, native `title`-Tooltips lassen sich nicht verzögern); der
  Zurücksetzen-Knopf nennt im Tooltip alle Standardwerte.
- Test-Suite gestrafft: 82 Prüfungen (mit Fixtures 88) statt 310, Korpus der
  Einklapp-Regeln unverändert, aber je Kategorie ausgewertet; Fehlschläge
  nennen die betroffenen Fälle. Blöcke neu nummeriert [1]–[7].

## 0.6.2 — 2026-09-17

- Pop-up-Fenster: Tooltip der Klammern-Checkbox und Hinweistext beschrieben noch
  die alte Regel „Literatur und lange Klammern" aus Versionen vor 0.6.0. Jetzt
  derselbe Wortlaut wie im Seiten-Panel: Fundstellen (Rechtsprechung, Literatur)
  werden eingeklappt, Gesetzesverweise und Entscheidtext bleiben offen.

## 0.6.1 — 2026-09-17

- Renderfehler auf search.bger.ch behoben: Unterhalb der ersten
  Bildschirmhöhe blieb links neben dem Entscheid eine weisse Fläche stehen
  (alle Farbschemata ausser Weiss). Ursache: Das Site-CSS setzt
  `html{background:#FFF}` und `body{height:100%}` – der eingefärbte `body`
  endet nach einer Bildschirmhöhe, darunter schien das weisse `<html>` durch.
  Jetzt wird `<html>` selbst mit eingefärbt. relevancy.bger.ch war nie
  betroffen (kennt beide Regeln nicht). Test in Block [12] ergänzt.

## 0.6.0 — 2026-09-17

- Bedienung entkoppelt: Typografie- und Farbänderungen bauen die Klammer-Folds
  nicht mehr neu auf. 43,05 ms → 0,19 ms pro Reglerbewegung. Von Hand
  aufgeklappte Klammern bleiben beim Verstellen offen. Speicherzugriffe
  gebündelt (Throttle mit führender Kante), Nachschreiben bei `pagehide`.
  Der Live-Sync aus dem Pop-up-Fenster folgt derselben Aufwandstrennung und
  ignoriert das Echo der eigenen Schreibvorgänge.
- **Einklapp-Heuristik neu gebaut.** Grundsatz nach Vorgabe der Autorin:
  Eingeklappt wird, was *Fundstelle* ist – Rechtsprechung (BGE/ATF/DTF,
  Urteile mit Aktenzeichen, auch kurz) und Literatur. Alles andere ist
  Entscheidtext und bleibt offen: Gesetzesverweise, Beträge, Mengen, Daten,
  interne Verweise (E. 4.2), inhaltliche Bemerkungen, Latinismen.
- Länge und Ziffernanzahl sind kein Kriterium mehr (die alten Regeln 5 und 6
  hielten Daten, Beträge und Erwägungsnummern für Zitate).
- Gesetzesverweise: Erlasskürzel generisch erkannt (StGB, SchKG, BetmG,
  VStrR …), dazu aArt., SR/AS/BBl, ausgeschriebene Erlasse, Fassungsangaben,
  italienische Gliederung (cpv., lett.), Restbudget relativ zur Länge.
- Latinismus-Liste ersatzlos entfernt – Prosa wird an der Satzstruktur
  erkannt, nicht an einem Wörterbuch.
- Literatur über bibliografische Form (Autorensignatur, Auflage, „in:",
  Werktyp, Zeitschrift, Kommentar-Kürzel, Randnote, Jahr) mit Punkteschwelle;
  „vgl." allein ist kein Signal mehr.
- Politik als Konstanten (`POLITIK`) am Anfang des Regelkerns, umstellbar
  ohne Eingriff in die Logik. `BGerReader.begruendung()` erklärt jede
  Entscheidung.
- `tools/klammern-report.js`: jede Klammer echter Entscheidseiten mit
  Entscheidung und Begründung; läuft in der CI, Ergebnis als Artefakt.
- Erste Prüfung an echtem Text (CI-Report, BGE 152 IV 1 und 6F_7/2012):
  56 von 58 Klammern richtig. Die zwei Ermessensfälle sind nachgezogen:
  das eigene Aktenzeichen im Rubrum („dossier 6B_399/2024") bleibt offen;
  Online-Quellen mit Abrufdatum („consulté le", „abgerufen am") zählen als
  Literatur.
- Fixtures werden wie im Browser dekodiert (bger.ch liefert Latin-1, nicht
  UTF-8); vorher wurden Akzente in den Tests zu Ersatzzeichen.
- Testblock [1] auf 120 Fälle in sechs Kategorien erweitert.

## 0.5.6 — 2026-09-17

- Mittiges Pop-up-Fenster per Klick aufs Extension-Symbol (660×860):
  dieselben Bedienelemente wie das Seiten-Panel, grössere Bedienfläche.
  `background.js` öffnet und fokussiert das Fenster, `popup.html/.css/.js`
  zeigen die Einstellungen; Sync mit der Seite über `storage.onChanged`,
  keine neuen Rechte. Firefox-Mindestversion 121.

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

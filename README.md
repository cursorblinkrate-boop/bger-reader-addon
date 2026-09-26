# Barrierefreie BGEs in Firefox, Chrome, Brave und Edge
Open-Source Browser-Erweiterung für BGEs und Bundesverwaltungsgerichtsentscheide (experimentell) - Schriftart, Schriftgrösse, Abstände, Zeilenlänge, Textbreite und Farbschema lassen sich frei einstellen. Die Erweiterung wird nur auf den vier genannten Adressen gestartet, hat keinen Zugriff auf das Internet und sammelt keine Daten. Einstellungen aus dem Einstellungsfeld, werden lokal in `storage`gespeichert. Kein Verlauf gelesener Entscheide, keine Statistik und kein Datensammeln für Absturzberichte. 

Zum Melden von Bugs und Sicherheitsproblemen siehe: https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/SECURITY.md

Privates Projekt,  siehe: https://github.com/cursorblinkrate-boop/bger-reader-addon

## Unterstützte Seiten

- `https://search.bger.ch/*` 
- `https://relevancy.bger.ch/*` und `http://relevancy.bger.ch/*` 
- `https://bvger.weblaw.ch/*`

## Datenschutz

Läuft nur auf den unterstützten Seiten, kein Zugriff auf das Internet und keine Datensammlungen. Einstellungen aus dem Einstellungsfeld, werden lokal in gespeichert. Kein Verlauf gelesener Entscheide, keine Statistik und keine Absturzberichte. 
Zum Melden von Sicherheitsproblemen siehe https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/SECURITY.md
Die vollständige Datenschutzerklärung in Deutsch, Englisch, Französisch und Italienisch steht in [PRIVACY.md](PRIVACY.md).

## Schriftarten (100% offline / lokal - in der Erweiterung selbst gebündelt)

Die Schriftdateien werden mitgeliefert - lokal komprimiert und eingebunden. Keine davon wird online gehostet oder runtergeladen. 

- Atkinson Hyperlegible Next ([Braille Institute](https://www.brailleinstitute.org), SIL Open Font License 1.1)
- Luciole ([luciole-vision.com](https://www.luciole-vision.com), CC BY 4.0)
- OpenDyslexic ([opendyslexic.org](https://opendyslexic.org), SIL Open Font License 1.1)
- Comic Neue, EB Garamond, Liberation Sans und Liberation Serif (SIL Open Font License 1.1)
- System Sans und System Serif (System-Default)

---

Free and open-source accessibility extension for decisions of the Swiss Federal Supreme Court (search.bger.ch, relevancy.bger.ch) and the Swiss Federal Administrative Court (bvger.weblaw.ch). It adds adjustable typography, fonts designed for low vision and dyslexia, colour schemes including dark and night mode, and it folds citations in parentheses out of the way so the court's reasoning stays readable. The interface is available in German, English, French and Italian. It runs entirely offline: no frameworks, no tracking, no external requests, no data collected, transmitted or stored outside your browser. The only browser permission it asks for is `storage`, used to remember your settings.

---

## Lizenz

Der Code steht unter der [MIT-Lizenz](LICENSE). Die mitgelieferten Schriften stehen unter der SIL Open Font License 1.1, Luciole unter Creative Commons BY 4.0 ([extension/fonts/LICENSES.md](extension/fonts/LICENSES.md)). Die Icons neben den Einstellungen stammen aus dem Icon-Thema Colibre von LibreOffice (CC0), das Symbol der Erweiterung ist mit Claude erstellt worden.

---


## Bildschirmfotos

Panel, mittiger Dialog und Einstellungsfenster in der Gestaltung „Klar" (Version 0.11.0, dunkel), erzeugt mit `tools/screenshots.js` in Chromium auf BGE 116 Ia 359 (Frauenstimmrecht); die vollständige Galerie mit rund 30 Szenen entsteht bei jedem CI-Lauf als Artefakt.

![Das Panel: einschalten, Schriftgrösse, Schriftart, Hintergrund, Breite, einfach](bilder/02-panel.png)

![Das Panel, erweitert: Schriftstärke, Zeilen, Absatz, Buchstaben- und Wortabstand, Zeilenlänge, Silbentrennung, Ausrichtung, Spalten](bilder/03-panel-erweitert.png)

![Das Panel auf Italienisch, der Standardsprache](bilder/04-panel-italienisch.png)

![Das Panel auf Französisch, Hintergrund Dunkel](bilder/05-panel-franzoesisch.png)

![Die Einstellungen mittig über dem Entscheid, per Klick auf das Symbol in der Symbolleiste](bilder/06-dialog-mittig.png)

![Das Einstellungsfenster, wenn im aktiven Tab kein Entscheid liegt](bilder/50-popup.png)

Alle Schriftarten, jeweils die Erwägungen desselben Entscheids:

![Atkinson Hyperlegible](bilder/10-schrift-atkinson.png)

![Luciole](bilder/11-schrift-luciole.png)

![OpenDyslexic](bilder/12-schrift-opendyslexic.png)

![Comic Neue](bilder/13-schrift-comic-neue.png)

![EB Garamond](bilder/14-schrift-eb-garamond.png)

![Liberation Sans](bilder/15-schrift-liberation-sans.png)

![Liberation Serif](bilder/16-schrift-liberation-serif.png)

![Hintergrund Nacht](bilder/23-hintergrund-nacht.png)

![Fundstellen eingeklappt, eine Klammer aufgeklappt](bilder/41-klammer-aufgeklappt.png)

<img width="1335" height="789" alt="Entscheidseite im Lesemodus" src="https://github.com/user-attachments/assets/d6fc10e1-0db4-4294-9829-c21ed0219134" />

<img width="1641" height="958" alt="Entscheidseite im Lesemodus mit Farbschema" src="https://github.com/user-attachments/assets/6ad8ae3f-833a-4c3f-9e81-0b19d7c56f46" />

<img width="1382" height="809" alt="Entscheidseite mit eingeklappten Klammern" src="https://github.com/user-attachments/assets/778bc9b2-55d8-4835-ac0c-ace2985e2caa" />

## Für Entwicklerinnen und Entwickler

Vanilla JavaScript, Manifest V3, keine Build-Pipeline, keine Abhängigkeiten im Paket. Das Herzstück ist `extension/content.js`; das Einstellungsfenster liegt in `extension/popup.html`, `popup.css` und `popup.js`, die Texte der Bedienoberfläche in vier Sprachen in `extension/sprachen.js`, das Hintergrundskript in `extension/background.js`. Die Test-Suite läuft ohne Framework mit jsdom, der Browser-Smoke-Test mit Playwright (Chromium und Edge) und Selenium (Firefox). Als Testseiten dienen echte, inhaltlich unverfängliche Entscheide (BGE 116 Ia 359 zum Frauenstimmrecht, BGE 145 I 207 zur Heiratsstrafe-Abstimmung, ein Revisionsentscheid zu Appenzeller Käse und ein Entscheid des Bundesverwaltungsgerichts zum Artenschutz); sie werden nicht im Repository abgelegt, sondern bei Bedarf geladen.

```
git clone https://github.com/cursorblinkrate-boop/bger-reader-addon.git
cd bger-reader-addon
bash tools/fetch-fixtures.sh
cd test && npm install --no-save jsdom@30.1.0 && node test-runner.js
```

Erwartet wird «0 fehlgeschlagen». Die Texte der Bedienoberfläche in allen vier Sprachen stehen zum Prüfen und Korrigieren in [SPRACHEN.md](SPRACHEN.md); `node tools/sprachen-tabelle.js uebernehmen` schreibt Korrekturen in den Code zurück. Name und Kurzbeschreibung der Erweiterung liegen in `extension/_locales/en/` (englisch), die Store-Texte, Bilder und der Ablauf für Einreichung und Updates in `store/`. Die Versionsnummer steht nur in `extension/manifest.json` und wird mit `node tools/version.js patch|minor|major` erhöht; `bash tools/release.sh` baut das Paket `dist/bger-reader-<Version>.zip`. Bei jedem Push auf `main` mit grünen Tests entsteht daraus automatisch ein GitHub-Release. Der [Änderungsverlauf](CHANGELOG.md) beschreibt, was sich von Version zu Version geändert hat; die Arbeitsregeln für Sessions mit Claude Code stehen in `STARTPROMPT.md`.

## Lizenz

Der Code steht unter der [MIT-Lizenz](LICENSE). Die mitgelieferten Schriften stehen unter der SIL Open Font License 1.1, Luciole unter Creative Commons BY 4.0 ([extension/fonts/LICENSES.md](extension/fonts/LICENSES.md)). Die Icons neben den Einstellungen stammen aus dem Icon-Thema Colibre von LibreOffice (CC0), das Symbol der Erweiterung ist ein eigenes Werk ([extension/icons/LICENSES.md](extension/icons/LICENSES.md)).

## Sicherheit

Sicherheitsprobleme bitte nicht öffentlich melden, sondern wie in [SECURITY.md](SECURITY.md) beschrieben. Unterstützt wird immer nur die neueste Version von der Releases-Seite.

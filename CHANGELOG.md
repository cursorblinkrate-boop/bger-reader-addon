# Änderungsverlauf

Alle veröffentlichten Versionen dieser Extension, neueste zuerst.

**Die Versionsnummer steht an genau einer Stelle: `extension/manifest.json`.**
Geändert wird sie ausschliesslich mit `node tools/version.js` — nie von Hand.
Das Werkzeug legt zugleich den Eintrag in diesem Verlauf an, damit Manifest
und Verlauf nicht auseinanderlaufen.

Nummerierung nach [Semantic Versioning](https://semver.org/lang/de/):
`MAJOR.MINOR.PATCH` — vorne bei Umbauten, in der Mitte bei neuen Funktionen,
hinten bei Korrekturen.

---

## 1.0.0 — 2026-09-26

- **Erstveröffentlichung in den Stores** (Chrome Web Store, Firefox Add-ons,
  Microsoft Edge Add-ons): 1.0.0 als erste stabile öffentliche Version. Die
  Erweiterung selbst ist gegenüber 0.11.1 unverändert; neu sind Texte und
  Werkzeuge für die Stores.
- Manifest: Name „accessibility add-on for bger.ch and bvger.ch",
  Kurzbeschreibung und Symbol-Titel aus `extension/_locales/en/messages.json`
  (`__MSG_…__`, `default_locale` en) – nur Englisch, in allen Stores gleich
  (Vorgabe der Autorin). Chrome Web Store und Edge zeigen die Kurzbeschreibung
  als Store-Kurztext. Block [6] prüft Schlüssel und Längen (Name ≤ 50,
  Kurzbeschreibung ≤ 132 Zeichen).
- Neu: `PRIVACY.md` (englisch) – die Datenschutz-URL der drei Stores.
- Neu: `store/` (nicht im Paket) – `listing.en.md` (der eine Store-Text),
  Reviewer-Hinweise, AMO-Metadaten daraus erzeugt (`amo-metadata.js`),
  Promo-Kachel 440 × 280, Marquee 1400 × 560 und Edge-Logo 300 × 300 aus
  `ICON_MARKE` gerendert (`promo/render.js`), Screenshot-Auswahl aus den
  CI-Artefakten, Ablauf für Updates (`STORE-UPDATE.md`).
- `tools/screenshots.js`: Store-Szenen zusätzlich als 1280 × 960 unter `amo/`,
  weil Firefox Add-ons Vorschaubilder im Verhältnis 4:3 verlangt.
- Doku: STARTPROMPT (Struktur, Regeln 2, 7, 8); README ist die Fassung der
  Autorin.

## 0.11.1 — 2026-09-24

- Mittiger Dialog und Einstellungsfenster **700 px breit statt 660**
  (Wunsch der Autorin); Galerie-Bilder 06 und 50 neu.
- Neu: **Übersetzungstabelle `SPRACHEN.md`** im Repo-Wurzelverzeichnis –
  alle 82 Texte der Bedienoberfläche in Deutsch, English, Français,
  Italiano, erzeugt aus `sprachen.js` mit `tools/sprachen-tabelle.js`. Die
  Autorin korrigiert Übersetzungen direkt in der Tabelle;
  `node tools/sprachen-tabelle.js uebernehmen` schreibt sie in den Code
  zurück, `tools/release.sh` bricht ab, wenn Tabelle und Code
  auseinanderlaufen. Block [4] prüft den Rundlauf.
- Doku: README (Übersetzungstabelle), STARTPROMPT (Struktur, Regel für
  Texte der Bedienoberfläche).

## 0.11.0 — 2026-09-24

- Korrektur (Firefox): die **Sprachwahl im Panel wirkte nicht** – das Panel
  blieb deutsch, die Auswahl zeigte „Italiano", die Flagge fehlte; im
  Einstellungsfenster funktionierte alles. Ursache: in Firefox-Content-
  Skripten ist der Skript-Kontext (`globalThis`, eine Sandbox) nicht das
  Fenster der Seite. `sprachen.js` registrierte sich am Skript-Kontext,
  `content.js` las `window.BGerReaderSprachen` – in Firefox leer, also lief
  die Übersetzung nie; Chrome kennt den Unterschied nicht. Jetzt registriert
  `sprachen.js` sich an beiden, `content.js` und `popup.js` lesen den nackten
  Bezeichner. Der Browser-Smoke-Test prüft die Beschriftung im echten Browser
  (schlug in Firefox fehl, jetzt grün).
- Neu: **Klick auf das Extension-Symbol öffnet die Einstellungen mittig über
  dem Entscheid** – dasselbe Panel, gross (660 px, Masse des
  Einstellungsfensters) in der Mitte des Fensters, der Entscheid bleibt
  sichtbar und bedienbar, jede Änderung ist sofort im Text zu sehen; ein
  zweiter Klick, das X oder Escape schliessen. Technik: `background.js`
  schickt dem aktiven Tab eine Nachricht (`tabs.sendMessage`, kein
  zusätzliches Recht), `content.js` antwortet und zeigt den Dialog (Klasse
  `bkl-mittig`). Nur wenn kein Entscheid im aktiven Tab liegt, öffnet sich
  wie bisher das Einstellungsfenster (`popup.html`). Grund: bis 0.10.0
  öffnete jeder Klick ein eigenes Browserfenster; auf macOS-Firefox lag es
  neben dem Browser auf dem Schreibtisch, der Entscheid war nicht mehr zu
  sehen, und Änderungen liessen sich nicht live verfolgen.
- **Oberfläche nur noch dunkel** (Entscheid der Autorin): der Schalter
  „Oberfläche dunkel" und der helle Token-Satz sind entfernt; Panel,
  mittiger Dialog und Einstellungsfenster tragen die dunkle Gestaltung
  „Klar" fest, unabhängig vom Hintergrund des Entscheids und nie nach dem
  System. Eine gespeicherte Einstellung `oberflaecheDunkel` aus 0.10.0 wird
  beim Laden verworfen. 15 statt 16 Colibre-Icons.
- **Breite bis 4000 px** statt 1400 (Regler „Breite", Schritt 25): auf
  Widescreen-Displays reichte 1400 nicht.
- **Drucken und „Als PDF sichern"** (PDF-Rückmeldung der Autorin aus
  Firefox: Text blass, verkleinert, rechts abgeschnitten, pinker Knopf auf
  der Seite): neues Druck-Stylesheet im Lesemodus. Schwarz auf weiss statt
  der Schemafarben (Dunkel, Kontrast und Nacht druckten hellen Text auf
  weisses Papier), Papierbreite statt Pixelbreite (Seitenrahmen und Text-
  spalte ohne feste Breite – Firefox verkleinerte sonst die ganze Seite und
  schnitt sie ab), Schrift, Grösse, Abstände, Zeilenlänge, Ausrichtung und
  Spalten wie am Bildschirm – der Entscheid lässt sich in OpenDyslexic oder
  jeder anderen Schrift drucken. **Klammern bleiben, wie sie sind:**
  eingeklappt bleibt eingeklappt (der Pfeil markiert die Stelle),
  aufgeklappt bleibt offen; bis 0.10.0 öffnete der Druck alle Klammern.
  Panel, Pink-Knopf und Tooltip werden nicht gedruckt.
- Manifest: `gecko_android.strict_min_version` 142 (dort versteht erst
  Firefox 142 `data_collection_permissions`; Hinweis von `web-ext lint`,
  das die Store-Prüfung von Mozilla vorwegnimmt: 0 Fehler), Titel des
  Symbols angepasst. Rechte unverändert: nur `storage`.
- Tests: Suite mit Sandbox-Test für `sprachen.js` (fremdes `window` wie in
  Firefox), Nachricht/Dialog im Panel, Hintergrundskript mit
  `tabs.sendMessage` und Fenster-Ersatz, Druck-CSS, Tokens (18, dunkel),
  19 Bedienelemente, 15 Icons, Breite 4000, Rechte nur `storage`. Browser-
  Smoke-Test: Panel-Sprache im echten Browser, mittiger Dialog per Nachricht
  (Bild `dialog-mittig.png`), Druckmedium (Chromium/Edge) und ein echtes
  PDF `druck.pdf` aus jedem Browser (Firefox über den WebDriver-Druck).
  `tools/screenshots.js`: neue Szene 06 (mittiger Dialog), Szene 05 ohne
  Schalter, Szene 70 Druck mit Nacht und 1400 px.
- Doku: README (Bedienung, Drucken, Galerie mit dunklem Panel und Dialog),
  STARTPROMPT (Fallstricke Firefox-Sandbox, Druck, Dialog),
  `icons/LICENSES.md`.

## 0.10.0 — 2026-09-19

- Neu: **Sprache der Bedienoberfläche** – Deutsch, English, Français,
  Italiano, wählbar in der Kopfzeile von Panel und Pop-up-Fenster (jede
  Sprache in ihrem eigenen Namen). Beschriftungen, Auswahltexte,
  Tooltips, Vorlesetexte (`aria-label`), die Wertanzeige „aus" und der Titel
  des Klammer-Pfeils im Entscheidtext folgen der Wahl. Die Sprache wird mit
  den übrigen Einstellungen gespeichert und zwischen Panel und Pop-up
  abgeglichen; Zurücksetzen behält sie. Standardsprache ist Italienisch
  (Vorgabe der Autorin). Bewusst keine Automatik nach Browser- oder
  Seitensprache: die Erweiterung fragt nichts über Browser oder Umgebung ab
  (Datenschutz). Neben der Sprachwahl steht die Flagge der gewählten Sprache
  (Schweiz für Deutsch, Grossbritannien, Frankreich, Italien) als Inline-SVG.
  Texte in `extension/sprachen.js`, einer Datei für Panel und Pop-up (das
  Manifest lädt sie vor `content.js`, `popup.html` vor `popup.js`); das
  Markup bleibt deutsch, die anderen Sprachen werden nach Element-ID
  hineingeschrieben, ohne Neuaufbau.
- Gestaltung von Panel und Pop-up überarbeitet („Klar", Variante A, von der
  Autorin aus drei UX-Entwürfen gewählt): ruhige Fläche in zartem Rosé,
  dunkles Schema fast schwarz, Schrift durchgehend Atkinson Hyperlegible Next
  (liegt bereits im Paket, nichts Neues wird geladen), Wortmarke fett in
  Gross-/Kleinschreibung, Beschriftungen normal, Pink nur als Akzent: Neon-Rand
  an Panel, Auswahllisten, Schaltern und Knöpfen, Regler mit pinkem Herz als
  Knopf, Schalter mit Verlauf Rosé-Violett und Herz im Knopf, flacher Knopf
  „erweitert" mit pinkem Pfeil. Die Colibre-Icons bleiben unverändert; ihre
  Blau-Akzente werden per CSS auf Rosé umgelenkt. Regler-Zeilen im Panel
  zweizeilig (Beschriftung und Wert oben, Regler in voller Breite – Platz für
  lange französische und italienische Beschriftungen). Kontraste: Text 16.4:1
  hell und 15.7:1 dunkel, Sekundärtext 7.8:1 und 8.6:1, Neon-Rand 3.6:1 und
  6.0:1, Fokusrahmen 6.7:1 und 11:1. Pop-up-Fenster 660 x 960 Pixel.
- Neu: **Schalter „Oberfläche dunkel"** in Panel und Pop-up (Colibre-Icon
  Kontrast): Bedienoberfläche hell oder dunkel nach eigener Wahl, unabhängig
  vom Hintergrund des Entscheids und nie nach dem System (keine Abfrage von
  prefers-color-scheme). Standard hell; Zurücksetzen behält die Wahl wie die
  Sprache.
- Beschriftungen gekürzt (Vorgabe der Autorin): „Breite", „Zeilen", „Absatz"
  statt Textbreite, Zeilenabstand, Absatzabstand; die Tooltips nennen weiter
  die vollen Begriffe. Standard der Breite neu 800 px statt der 625 px der
  Seite; Zurücksetzen stellt 800 px ein.
- Tests: `sprachen.js` im Harness; neue Prüfungen für vollständige
  Wörterbücher (gleiche Schlüssel in allen vier Sprachen), Umschalten in
  Panel und Pop-up, Sprache per Live-Sync, Zurücksetzen behält die Sprache,
  Schalter „Oberfläche dunkel", Design-Tokens und Flaggen in Panel und Pop-up
  identisch, Start auf Italienisch.

## 0.9.2 — 2026-09-19

- Test-Suite, Testseiten und Screenshot-Werkzeuge auf inhaltlich harmlose
  Beispiel-Entscheide umgestellt: BGE 116 Ia 359 (Frauenstimmrecht) für
  Suite, Smoke-Test und Bilder, 6F_7/2012 (aza), BGE 145 I 207
  (Heiratsstrafe-Abstimmung, französisch) und BVGer B-7296/2025 (CITES).
  Der bisherige clir-Testentscheid ist aus Suite, Werkzeugen, Kommentaren
  und Doku entfernt; Zitat-Beispiele im Test-Korpus und in Kommentaren
  entsprechend ersetzt. Keine Funktionsänderung.
- Wiki samt Spiegel-Workflow entfernt. Der CI-Workflow heisst jetzt
  `.github/workflows/release.yml` („Prüfung und Paket": Suite, Smoke-Test,
  Paketbau, Release); der Badge im README zeigt diesen Lauf.
- Bilder aus Smoke-Test und `tools/screenshots.js` zeigen die Erwägungen
  auf 1280 x 2000 statt nur den Urteilskopf, damit Schrift, Abstände und
  Hintergrund über den ganzen Text beurteilt werden können; nur die
  Store-Szenen bleiben 1280 x 800.

## 0.9.1 — 2026-09-19

- Korrektur (Firefox): eine Einstellung, die kurz vor einem Seitenwechsel
  gemacht wurde (innerhalb der 0,4 s Bündelung, etwa Hintergrund wählen und
  sofort einen Link anklicken), ging in Firefox verloren – Firefox verwirft
  den Schreibvorgang, den content.js erst beim Verlassen der Seite nachholt;
  Chrome führt ihn aus. Auswahl und Häkchen sowie das Loslassen eines Reglers
  speichern jetzt sofort, gebündelt wird nur noch während des Ziehens.
  Gefunden vom neuen Browser-Smoke-Test.
- Korrektur: Panel und Pop-up nehmen Bedienung erst an, wenn die gespeicherten
  Einstellungen geladen sind. Ein Klick davor (auf Windows-Firefox dauert der
  erste Speicherzugriff über eine Sekunde) wurde vom Laden umgeworfen und
  konnte Standardwerte über die gespeicherten Einstellungen schreiben.
  Ebenfalls vom Browser-Smoke-Test gefunden.
- Manifest: Mindestversionen erklärt – Chrome/Edge 121 (erst ab da darf
  neben `service_worker` der Firefox-Eintrag `background.scripts` stehen;
  ältere Browser verweigerten die Installation mit kryptischem Fehler, jetzt
  nennt der Store die Voraussetzung) und Firefox 140 (erste Version, die
  `data_collection_permissions` versteht; ältere Firefox-Versionen ignorierten
  die Angabe „keine Datenerhebung").
- Neu in der CI: Browser-Smoke-Test der fertigen Extension in echtem Chromium
  und Firefox, auf Windows und Linux (`test/browser-smoke.js`). Die
  Entscheidseiten werden dafür lokal unter ihren echten Hostnamen
  ausgeliefert (search.bger.ch weist Headless-Browser mit Captcha ab).
  Screenshots liegen jedem Lauf als Artefakt bei.
- Lieferkette: das Release-ZIP entsteht in der CI direkt aus dem Commit
  (`git archive`, reproduzierbar – gleicher Commit, gleiche Prüfsumme), ohne
  npm-Installation in dem Job, der Schreibrechte hat; die volle SHA-256 liegt
  als `.sha256`-Datei beim Release. Test-Abhängigkeiten (jsdom, Playwright,
  Selenium) sind auf feste Versionen gesetzt.
- Aufgeräumt: `archiv/` entfernt; das ursprüngliche Userscript 2.1.0 bleibt
  als Git-Tag `userscript-2.1.0` erreichbar.

## 0.9.0 — 2026-09-18

- Neue Site **bvger.weblaw.ch** (Bundesverwaltungsgericht): der Lesemodus
  funktioniert jetzt auch auf den Entscheidseiten `…/cache?id=…`. Die Site
  ist eine React-App – die Seite kommt leer an, der Entscheid wird per
  JavaScript nachgeladen und bei Navigation ohne Seiten-Neuladen ersetzt.
  content.js wartet darauf (MutationObserver auf `#root`, gedrosselt, Umbau
  nur bei tatsächlich verändertem Textblock) und baut Typografie und Klammern
  jedes Mal neu auf, auch nach dem Ein-/Ausschalten der Site-Markierungen.
  Absätze sind dort `<p>` ohne Klassen im Segment `#customContentSegment`,
  der Textblock erhält zur Laufzeit die Klasse `bkl-text`. Farbschema wirkt
  auch auf Segment, Titel, Datum und Seitenleiste; Markierungen der Site
  behalten dunklen Text; die Textbreite wirkt auf den Spaltenrahmen. Die
  Entscheidsprache wird am Rubrum erkannt (`lang` für die Silbentrennung –
  die Seite selbst sagt `en`). Keine Anfragen an die Site, weiterhin
  100 % offline.
- Klammer-Heuristik: BVGE-Zitate im Format Jahr/Nummer (`BVGE 2014/1`,
  `BVGE 2020 VII/4`, `ATAF 2007/6`, `DTAF 2010/53`) gelten als
  Rechtsprechung und werden eingeklappt.
- Korrektur (Panel und Pop-up): zwei Einstellungen kurz nacheinander –
  etwa Hintergrund und gleich darauf Schriftart – verloren die zweite, weil
  das asynchrone Echo des ersten Schreibvorgangs (`storage.onChanged`) sie
  zurückdrehte. Eigene Schreibvorgänge werden jetzt am Paket erkannt.
- Manifest: Content-Skript und Fonts für bvger.weblaw.ch freigegeben;
  Beschreibung auf höchstens 132 Zeichen gekürzt (Vorgabe des Chrome Web
  Store).
- Tests: Block [8] (bvger: Nachladen, Ersetzen, Navigation ohne Neuladen),
  Fixture `bvger_test.json` (JSON der Site-API, lädt
  `tools/fetch-fixtures.sh`), Klammer-Report liest es mit.

## 0.8.0 — 2026-09-17

- Neue Schriftart **Luciole** (Schrift für sehbehinderte Menschen vom
  französischen CTRDV, Creative Commons BY 4.0): als WOFF2-Latin-Subset
  gebündelt (Regular und Bold), im Dropdown direkt nach Atkinson Hyperlegible,
  mit Vorschau. Lizenznachweis in `extension/fonts/LICENSES.md`.
- Dropdown: „EB Garamond (Buchschrift)" heisst jetzt nur noch „EB Garamond".

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
- Erste Prüfung an echtem Text (CI-Report, zwei echte Entscheidseiten):
  56 von 58 Klammern richtig. Die zwei Ermessensfälle sind nachgezogen:
  das eigene Aktenzeichen im Rubrum („dossier 1C_338/2018") bleibt offen;
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
Tampermonkey-Skript. Liegt eingefroren im Git-Tag `userscript-2.1.0`
(auf GitHub unter „Tags"). Seine Versionsnummer gehört zu jener Zählung und
wird **nicht** mitgezogen.

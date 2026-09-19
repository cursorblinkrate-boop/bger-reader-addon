# Wiki-Seiten

Dieser Ordner enthält die Seiten des GitHub-Wikis von bger reader als Markdown-Dateien. Die Startseite ist [Home.md](Home.md); von dort sind alle anderen Seiten verlinkt. Die Seiten sind hier im Repository direkt lesbar und werden zusätzlich ins Wiki unter <https://github.com/cursorblinkrate-boop/bger-reader-addon/wiki> gespiegelt.

## Wie die Seiten ins Wiki kommen

Der Workflow `.github/workflows/wiki.yml` kopiert den Ordner bei jedem Push auf `main`, der eine Datei in `wiki/` verändert, ins Wiki-Repository; unter «Actions → Wiki → Run workflow» lässt er sich auch von Hand starten. Damit das funktioniert, ist einmalig nötig, im Browser in den Einstellungen des Repositories unter «Settings → General → Features» das Häkchen bei **Wikis** zu setzen und danach im Wiki-Tab die erste Seite anzulegen (der Inhalt ist egal, er wird beim ersten Lauf ersetzt). Solange das Wiki nicht eingerichtet ist, endet der Workflow mit einem Hinweis, nicht mit einem Fehler.

## Regeln für die Seiten

- Änderungen immer hier im Ordner machen, nie direkt im Wiki: Der nächste Lauf überschreibt das Wiki mit dem Stand dieses Ordners, und Seiten, die hier fehlen, werden im Wiki gelöscht.
- Links zwischen den Seiten mit Dateiendung schreiben, zum Beispiel `[Installation](Installation.md)`. So funktionieren sie hier im Repository; der Workflow entfernt die Endung beim Kopieren, weil das Wiki Seiten ohne Endung anspricht.
- Der Dateiname ist der Seitenname im Wiki; Bindestriche werden dort zu Leerzeichen. Keine Umlaute und keine Leerzeichen in Dateinamen.
- Die Seiten beginnen ohne Überschrift erster Ebene, weil das Wiki den Seitennamen bereits als Titel anzeigt.
- `_Sidebar.md` ist die Navigation am rechten Rand, `_Footer.md` die Fusszeile jeder Seite. Neue Seiten in beiden Listen (Sidebar und Home) eintragen.
- Diese Datei (`README.md`) beschreibt nur den Ordner und wird nicht ins Wiki kopiert.

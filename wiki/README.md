# Wiki-Seiten

Dieser Ordner enthält die Seiten des GitHub-Wikis von bger reader als Markdown-Dateien, in vier Sprachen. [Home.md](Home.md) ist die Sprachwahl, auf der das Wiki landet; von dort führen die Links zu den Startseiten [DE-Startseite.md](DE-Startseite.md), [EN-Home.md](EN-Home.md), [FR-Accueil.md](FR-Accueil.md) und [IT-Home.md](IT-Home.md). Die Seiten sind hier im Repository direkt lesbar und werden zusätzlich ins Wiki unter <https://github.com/cursorblinkrate-boop/bger-reader-addon/wiki> gespiegelt.

## Wie die Seiten ins Wiki kommen

Der Workflow `.github/workflows/wiki.yml` kopiert den Ordner bei jedem Push auf `main`, der eine Datei in `wiki/` verändert, ins Wiki-Repository; unter «Actions → Wiki → Run workflow» lässt er sich auch von Hand starten. Voraussetzung ist ein eingeschaltetes Wiki mit mindestens einer Seite (Settings → General → Features → Wikis, dann im Wiki-Tab eine erste Seite anlegen); solange das fehlt, endet der Workflow mit einem Hinweis, nicht mit einem Fehler.

## Die Seiten und ihre Namen

Jede Seite existiert in vier Sprachen. Der Dateiname beginnt mit dem Sprachkürzel und wird im Wiki zum Seitennamen (Bindestriche erscheinen dort als Leerzeichen).

| Inhalt | Deutsch | English | Français | Italiano |
|---|---|---|---|---|
| Startseite | `DE-Startseite` | `EN-Home` | `FR-Accueil` | `IT-Home` |
| Installation | `DE-Installation` | `EN-Installation` | `FR-Installation` | `IT-Installazione` |
| Bedienung | `DE-Bedienung` | `EN-Usage` | `FR-Utilisation` | `IT-Utilizzo` |
| Einstellungen | `DE-Einstellungen` | `EN-Settings` | `FR-Reglages` | `IT-Impostazioni` |
| Klammern | `DE-Klammern` | `EN-Brackets` | `FR-Parentheses` | `IT-Parentesi` |
| Schriftarten | `DE-Schriftarten` | `EN-Fonts` | `FR-Polices` | `IT-Caratteri` |
| Websites | `DE-Websites` | `EN-Websites` | `FR-Sites` | `IT-Siti` |
| Datenschutz | `DE-Datenschutz` | `EN-Privacy` | `FR-Confidentialite` | `IT-Privacy` |
| FAQ | `DE-FAQ` | `EN-FAQ` | `FR-FAQ` | `IT-FAQ` |
| Entwicklung | `DE-Entwicklung` | `EN-Development` | `FR-Developpement` | `IT-Sviluppo` |

## Regeln für die Seiten

- Änderungen immer hier im Ordner machen, nie direkt im Wiki: Der nächste Lauf überschreibt das Wiki mit dem Stand dieses Ordners, und Seiten, die hier fehlen, werden im Wiki gelöscht.
- Die deutsche Fassung ist die Quelle. Inhaltliche Änderungen zuerst in der `DE-`-Datei machen, dann in die drei Übersetzungen übertragen, damit die Fassungen nicht auseinanderlaufen.
- Die Bedienoberfläche der Erweiterung ist nur auf Deutsch. In den Übersetzungen bleibt jede Beschriftung im deutschen Wortlaut (fett wie in der Quelle) und bekommt beim ersten Vorkommen auf der Seite die Übersetzung in Klammern, zum Beispiel **einschalten** (switch on).
- Die erste Zeile jeder Seite ist die Sprachleiste: die eigene Sprache fett, die drei anderen als Links auf dieselbe Seite in ihrer Sprache, zum Beispiel `**Deutsch** · [English](EN-Installation.md) · [Français](FR-Installation.md) · [Italiano](IT-Installazione.md)`.
- Links zwischen den Seiten mit Dateiendung schreiben, zum Beispiel `[Installation](DE-Installation.md)`. So funktionieren sie hier im Repository; der Workflow entfernt die Endung beim Kopieren, weil das Wiki Seiten ohne Endung anspricht. Links zeigen immer auf die Seite derselben Sprache.
- Keine Umlaute, Akzente oder Leerzeichen in Dateinamen (sie werden zur Adresse der Seite). Der Linktext darf Akzente haben: `[Réglages](FR-Reglages.md)`.
- Die Seiten beginnen ohne Überschrift erster Ebene, weil das Wiki den Seitennamen bereits als Titel anzeigt.
- Nach der Sprachleiste folgt in jeder Seite ein unsichtbarer Hinweis (`<!-- Nicht hier im Wiki bearbeiten … -->`). Er erscheint nur im Editor des Wikis und warnt, wer dort auf «Edit» klickt. Bei neuen Seiten mitkopieren und den Dateinamen anpassen.
- `_Sidebar.md` ist die Navigation am rechten Rand (alle vier Sprachen), `_Footer.md` die Fusszeile jeder Seite. Neue Seiten in der Sidebar, auf der jeweiligen Startseite und in der Tabelle oben eintragen, in allen vier Sprachen.
- Diese Datei (`README.md`) beschreibt nur den Ordner und wird nicht ins Wiki kopiert.

**Deutsch** · [English](EN-Websites.md) · [Français](FR-Sites.md) · [Italiano](IT-Siti.md)

<!-- Nicht hier im Wiki bearbeiten: Quelle ist die Datei wiki/DE-Websites.md im Repository, der Workflow überschreibt das Wiki bei jedem Push. Diese deutsche Fassung ist die Quelle für EN, FR und IT: Änderungen hier machen und dann in die drei Übersetzungen übertragen. -->

bger reader arbeitet auf den Entscheidseiten des Schweizerischen Bundesgerichts und des Bundesverwaltungsgerichts. Der Browser startet die Erweiterung nur auf den hier aufgeführten Adressen; auf allen anderen Websites ist sie nicht vorhanden. Die Einstellungen gelten gemeinsam für alle unterstützten Seiten.

| Adresse | Gericht | Was dort liegt |
|---|---|---|
| `https://search.bger.ch/*` | Bundesgericht | Leitentscheide der amtlichen Sammlung (BGE) und alle weiteren Urteile ab dem Jahr 2000 |
| `https://relevancy.bger.ch/*` und `http://relevancy.bger.ch/*` | Bundesgericht | zweiter Zugang zu denselben Entscheiden, mit und ohne Verschlüsselung |
| `https://bvger.weblaw.ch/*` | Bundesverwaltungsgericht | Entscheiddatenbank des Bundesverwaltungsgerichts, betrieben von Weblaw |

## search.bger.ch und relevancy.bger.ch

Die Entscheide des Bundesgerichts liegen in zwei Ansichten vor. Die amtliche Sammlung (BGE) wird in der Ansicht «clir» dargestellt, in der jeder Absatz des Entscheids ein eigener Textblock ist und Seitenwechsel der gedruckten Sammlung als Balken wie «BGE 152 IV 1 S. 7» im Text markiert sind. Die übrigen Urteile ab 2000 erscheinen in der Ansicht «aza» mit einer etwas anderen Absatzstruktur. Die Erweiterung kennt beide und behandelt sie gleich: Typografie und Farben wirken auf die Absätze des Entscheids, die Seitenwechsel-Balken bleiben auch bei eingeklappten Klammern sichtbar, und die gelben Markierungen von Suchtreffern behalten dunklen Text.

Das Farbschema wirkt auf die ganze Seite, also auch auf Kopfzeile, linke Navigation und die Randspalten mit Inhaltsverzeichnis und Referenzen, damit bei dunklen Schemata kein weisser Rahmen stehen bleibt. Die Textbreite verändert den Rahmen, den die Seite standardmässig auf 625 Pixel festlegt; die Randspalten wandern mit. Auf den Suchseiten von `search.bger.ch`, also dort, wo Trefferlisten statt eines Entscheids stehen, wirkt nur das Farbschema; die Typografie-Einstellungen greifen erst auf der Entscheidseite.

`relevancy.bger.ch` ist ein zweiter Zugang zu denselben Entscheiden, der teilweise noch ohne Verschlüsselung (http) verlinkt wird; die Erweiterung unterstützt beide Varianten.

## bvger.weblaw.ch

Die Entscheide des Bundesverwaltungsgerichts liegen auf einer Website, die anders gebaut ist als die des Bundesgerichts: Sie ist eine sogenannte Web-App. Die Seite kommt zunächst leer beim Browser an, und der Entscheid wird erst danach von der Website per Programm nachgeladen und eingesetzt. Beim Wechsel zu einem anderen Entscheid oder beim Ein- und Ausschalten der Markierungen, die die Website anbietet, wird der Text ausgetauscht, ohne dass die Seite neu geladen wird.

Die Erweiterung wartet deshalb auf den Text und baut Typografie und Klammern jedes Mal neu auf, wenn sich der Entscheid auf der Seite ändert. Ein kurzer Moment zwischen dem Erscheinen des Entscheids und dem Lesemodus ist normal. Die Erweiterung stellt dabei selbst keine Anfragen an die Website; sie beobachtet nur, was auf der Seite erscheint.

Einige Besonderheiten der Seite werden berücksichtigt. Die Website gibt ihre Sprache als Englisch an, was der Silbentrennung schaden würde; die Erweiterung erkennt die Sprache des Entscheids am Rubrum («Urteil vom», «Arrêt du», «Sentenza del») und trennt entsprechend. Die farbigen Markierungen der Website für zitierte Entscheide und Stichwörter behalten dunklen Text, ihre Beschriftungen zählen nicht zum Klammertext. Das Farbschema wirkt auf den Entscheidbereich mit Titel und Datum sowie auf die Seitenleiste mit den Filtern, und die Textbreite verändert die Spalte, in der der Entscheid steht. Zitate im Format des Bundesverwaltungsgerichts wie `BVGE 2014/1` oder `ATAF 2007/6` werden als Rechtsprechung erkannt und eingeklappt.

## Was nicht unterstützt wird

Die Erweiterung wirkt nur auf die Entscheidseiten im Browser. Nicht unterstützt werden die PDF-Fassungen der Entscheide, die Nachrichten- und Informationsseiten unter `www.bger.ch`, die Entscheidsammlungen kantonaler Gerichte, andere Datenbanken wie entscheidsuche.ch oder Swisslex sowie die übrigen Produkte von Weblaw. Ein Smartphone-Browser wird nicht unterstützt, siehe [Häufige Fragen](DE-FAQ.md). Wünsche für weitere Seiten können als [Issue](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) eingebracht werden; jede neue Seite braucht ein eigenes Seitenprofil im Code und Testseiten, auf denen es geprüft werden kann.

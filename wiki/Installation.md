Diese Seite beschreibt, wie bger reader heruntergeladen und in den einzelnen Browsern eingerichtet wird. Der Weg über das Release-Paket ist etwas länger als ein Klick im Browser-Store, aber gut machbar; er ist so lange der Standardweg, bis die Erweiterung in den Stores freigegeben ist.

## Voraussetzungen

Die Erweiterung läuft in **Chrome, Brave und Edge ab Version 121** sowie in **Firefox ab Version 140**. Ältere Browser verweigern die Installation. Die Version des eigenen Browsers steht im Menü unter «Über Chrome» beziehungsweise «Über Firefox»; aktuelle Browser sind längst über diesen Mindestversionen. Ein Smartphone-Browser wird nicht unterstützt, siehe [Häufige Fragen](FAQ.md).

## Paket herunterladen

Alle Versionen liegen auf der [Releases-Seite](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases) des Projekts. Der oberste Eintrag ist die neueste Version. Unter «Assets» liegen dort zwei Dateien: das eigentliche Paket `bger-reader-<Version>.zip` (rund 250 KB) und daneben eine kleine Datei mit der Endung `.sha256`, die eine Prüfsumme enthält (dazu unten mehr). Das Paket enthält ausschliesslich die Erweiterung selbst, keine Testdateien und keine Werkzeuge.

Bitte immer das ZIP von der Releases-Seite verwenden und nicht den grünen Knopf «Code → Download ZIP» auf der Startseite des Repositories. Dieser lädt das gesamte Projekt mit Tests und Werkzeugen herunter, und die Datei heisst immer gleich, sodass die Version nicht erkennbar ist.

Nach dem Herunterladen wird das ZIP entpackt. Auf Windows genügt ein Rechtsklick auf die Datei und «Alle extrahieren…», auf macOS ein Doppelklick. Es entsteht ein Ordner, der unter anderem die Datei `manifest.json` und die Unterordner `fonts` und `icons` enthält. Dieser Ordner sollte an einem Ort liegen, an dem er dauerhaft bleiben kann, etwa im Dokumente-Ordner, denn Chrome, Brave und Edge lesen die Erweiterung bei jedem Start direkt aus diesem Ordner. Wird er verschoben oder gelöscht, verschwindet die Erweiterung.

## Chrome, Brave und Edge

Die drei Browser teilen sich die Technik und unterscheiden sich nur in der Adresse der Erweiterungsseite.

1. Die Erweiterungsseite öffnen: in Chrome `chrome://extensions`, in Brave `brave://extensions`, in Edge `edge://extensions` in die Adresszeile eingeben und Enter drücken.
2. Den **Entwicklermodus** einschalten. In Chrome und Brave ist das ein Schalter oben rechts, in Edge ein Schalter in der linken Spalte.
3. Auf **Entpackte Erweiterung laden** klicken.
4. Den entpackten Ordner auswählen, also den Ordner, in dem die Datei `manifest.json` liegt, und bestätigen.
5. bger reader erscheint nun in der Liste der Erweiterungen und ist eingeschaltet.

Chrome zeigt nach einem Neustart unter Umständen einen Hinweis, dass Erweiterungen im Entwicklermodus laufen. Das ist bei allen Erweiterungen so, die nicht aus dem Store stammen, und lässt sich mit einem Klick schliessen. Damit das Symbol der Erweiterung dauerhaft in der Symbolleiste sichtbar ist, klickt man auf das Puzzle-Symbol rechts neben der Adresszeile und dann auf die Stecknadel neben «BGer Reader»; ein Klick auf das Symbol öffnet später die Einstellungen in einem eigenen Fenster.

## Firefox

Firefox installiert Erweiterungen dauerhaft nur, wenn sie von Mozilla signiert sind, was mit der Freigabe im Store geschieht. Bis dahin lässt sich bger reader in Firefox als **temporäres Add-on** laden. Das funktioniert vollständig, gilt aber nur bis zum nächsten Schliessen des Browsers; danach muss die Erweiterung erneut geladen werden, und die gespeicherten Einstellungen gehen dabei in der Regel verloren.

1. In die Adresszeile `about:debugging#/runtime/this-firefox` eingeben und Enter drücken.
2. Auf **Temporäres Add-on laden…** klicken.
3. Die heruntergeladene Datei `bger-reader-<Version>.zip` auswählen. Entpacken ist bei Firefox nicht nötig; alternativ kann auch die Datei `manifest.json` aus dem entpackten Ordner gewählt werden.
4. bger reader erscheint in der Liste der temporären Erweiterungen.

Wer die Developer Edition oder Nightly von Firefox verwendet, kann die Signaturpflicht in `about:config` mit der Einstellung `xpinstall.signatures.required` auf `false` abschalten und das ZIP dann über `about:addons` und «Add-on aus Datei installieren…» dauerhaft installieren. Für die normale Firefox-Version ist das nicht möglich. Sobald die Erweiterung im Store freigegeben ist, wird hier der direkte Link ergänzt.

## Prüfsumme kontrollieren (optional)

Neben jedem Paket liegt auf der Releases-Seite eine Datei `bger-reader-<Version>.zip.sha256`. Sie enthält eine lange Zeichenfolge, die sogenannte SHA-256-Prüfsumme. Diese Zeichenfolge ist für die Datei so eindeutig wie ein Fingerabdruck: Wer die Prüfsumme des heruntergeladenen Pakets selbst berechnet und mit der veröffentlichten vergleicht, weiss bei Übereinstimmung sicher, dass die Datei unverändert und vollständig angekommen ist. Das Paket wird in der automatischen Auslieferung des Projekts direkt aus dem geprüften Quellcode gebaut, und die Prüfsumme entsteht dort ebenfalls.

Die Berechnung erfolgt in einem Terminal beziehungsweise in PowerShell, jeweils im Ordner, in dem das ZIP liegt:

```
# macOS
shasum -a 256 bger-reader-0.9.1.zip

# Linux
sha256sum bger-reader-0.9.1.zip

# Windows (PowerShell)
Get-FileHash .\bger-reader-0.9.1.zip -Algorithm SHA256
```

Die ausgegebene Zeichenfolge muss mit dem Inhalt der `.sha256`-Datei übereinstimmen; Gross- und Kleinschreibung spielt keine Rolle. Dieser Schritt ist freiwillig und für den Betrieb nicht nötig.

## Aktualisieren

Eine neue Version wird auf der Releases-Seite veröffentlicht; der Browser meldet sie nicht von selbst, solange die Erweiterung nicht aus dem Store stammt. Für die Aktualisierung in Chrome, Brave und Edge wird das neue ZIP heruntergeladen und **in denselben Ordner** entpackt wie bisher, sodass die alten Dateien ersetzt werden. Anschliessend genügt auf der Erweiterungsseite ein Klick auf das Aktualisieren-Symbol (kreisförmiger Pfeil) bei bger reader oder oben auf «Aktualisieren». Wichtig ist der gleiche Ordner: Der Browser erkennt eine entpackte Erweiterung an ihrem Speicherort. Wird die neue Version aus einem anderen Ordner geladen, gilt sie als neue Erweiterung, und die gespeicherten Einstellungen beginnen wieder bei den Standardwerten.

In Firefox wird das temporäre Add-on ohnehin bei jedem Start neu geladen; dort einfach das neue ZIP wählen.

## Entfernen

In Chrome, Brave und Edge wird die Erweiterung auf der Erweiterungsseite mit «Entfernen» gelöscht; anschliessend kann auch der entpackte Ordner gelöscht werden. Mit der Erweiterung werden die gespeicherten Einstellungen entfernt. In Firefox verschwindet ein temporäres Add-on mit dem Schliessen des Browsers oder über «Entfernen» auf der Seite `about:debugging`.

Die Gerichtsseiten selbst werden durch Installation und Entfernen nicht verändert; die Erweiterung wirkt ausschliesslich auf die Anzeige im eigenen Browser.

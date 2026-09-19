**Deutsch** · [English](EN-FAQ.md) · [Français](FR-FAQ.md) · [Italiano](IT-FAQ.md)

Antworten auf häufige Fragen und Hilfe, wenn etwas nicht wie erwartet funktioniert. Wenn die passende Antwort fehlt, hilft ein [Issue](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) auf GitHub; was eine Meldung enthalten sollte, steht ganz unten.

## Der pinke Knopf erscheint nicht

Der Knopf erscheint nur auf den unterstützten Adressen, siehe [Unterstützte Websites](DE-Websites.md). Die Adresse in der Adresszeile muss mit `search.bger.ch`, `relevancy.bger.ch` oder `bvger.weblaw.ch` beginnen. Erscheint der Knopf dort nicht, ist die Erweiterung möglicherweise ausgeschaltet: Auf der Erweiterungsseite des Browsers (`chrome://extensions`, `brave://extensions`, `edge://extensions`, in Firefox `about:addons` beziehungsweise `about:debugging` für ein temporäres Add-on) muss bger reader eingeschaltet sein. Nach dem Ein- oder Ausschalten der Erweiterung und nach einer Aktualisierung muss die Entscheidseite einmal neu geladen werden. In Chrome, Brave und Edge verschwindet die Erweiterung ausserdem, wenn der entpackte Ordner verschoben oder gelöscht wurde; dann hilft eine erneute [Installation](DE-Installation.md).

## Ich habe «einschalten» angehakt, aber nichts passiert

Die Erweiterung verändert nur die Absätze des Entscheidtextes. Auf einer Trefferliste von `search.bger.ch` oder auf der Startseite der Entscheiddatenbank wirkt darum nur das Farbschema; Schriftart und Grösse sind erst auf einer Entscheidseite sichtbar. Ist der Hintergrund auf «Weiss» und die Schriftart auf «System Serif» eingestellt, ist der Unterschied zur Originalseite ausserdem gering, weil das die Standardwerte sind: Ein anderer Hintergrund oder eine grössere Schrift macht den Lesemodus sofort sichtbar.

## Auf bvger.weblaw.ch erscheint der Lesemodus erst verzögert

Das ist normal. Die Website des Bundesverwaltungsgerichts lädt den Entscheid nach dem Öffnen der Seite per Programm nach, und die Erweiterung wartet darauf. Sobald der Text da ist, folgen Typografie und Klammern innerhalb eines Augenblicks. Beim Wechsel zu einem anderen Entscheid innerhalb der Website passiert dasselbe noch einmal. Bleibt der Lesemodus dauerhaft aus, obwohl der Entscheid angezeigt wird, hilft ein Neuladen der Seite; tritt das wiederholt auf, ist es eine Fehlermeldung wert.

## Nach dem Aktualisieren sind meine Einstellungen weg

In Chrome, Brave und Edge erkennt der Browser eine entpackte Erweiterung an ihrem Ordner. Wurde die neue Version in einen anderen Ordner entpackt und von dort geladen, gilt sie als neue Erweiterung mit frischem Speicher. Abhilfe: Die alte Erweiterung entfernen, die neue Version in den bisherigen Ordner entpacken und diesen laden, oder die Einstellungen einmalig neu setzen. Ab der Freigabe im Store entfällt dieses Problem, weil der Store die Erweiterung an ihrer festen Kennung erkennt.

## In Firefox ist die Erweiterung nach dem Neustart verschwunden

Firefox lädt unsignierte Erweiterungen nur als temporäres Add-on, das mit dem Schliessen des Browsers verschwindet, und die Einstellungen gehen dabei in der Regel verloren. Das ist eine Eigenschaft von Firefox, kein Fehler der Erweiterung. Bis zur Freigabe im Store muss die Erweiterung nach jedem Start über `about:debugging` neu geladen werden; die Schritte stehen unter [Installation](DE-Installation.md).

## Chrome warnt beim Start vor Erweiterungen im Entwicklermodus

Diese Meldung zeigt Chrome bei jeder Erweiterung, die nicht aus dem Chrome Web Store stammt. Sie bedeutet nicht, dass etwas gefährlich ist, sondern nur, dass die Erweiterung von Hand geladen wurde. Die Meldung lässt sich schliessen und verschwindet, sobald die Erweiterung aus dem Store installiert wird.

## Eine Klammer wurde eingeklappt, die kein Zitat ist, oder ein Zitat blieb offen

Die Regeln sind auf [Klammern einklappen](DE-Klammern.md) beschrieben, und dort steht auch, wie ein Fehlfall gemeldet wird. Sofort hilft der Klappknopf `▸`, mit dem sich jede Klammer einzeln öffnen lässt, oder das Entfernen des Häkchens bei **einfach**, womit alle Klammern offen bleiben. Ein gemeldeter Fall wird als Testfall aufgenommen.

## Die gewählte Schriftart sieht nicht anders aus

Manche Schriften unterscheiden sich nur wenig, etwa Liberation Serif von System Serif, weil beide Times-ähnlich sind. Die Auswahlliste zeigt jede Schrift in ihrer eigenen Gestalt; auf Firefox unter macOS gilt das nur für den geschlossenen Zustand der Liste. Der Unterschied ist am deutlichsten bei Atkinson Hyperlegible, OpenDyslexic und Comic Neue. Bleibt der Text trotz Wahl einer dieser Schriften unverändert, wurde vermutlich das Häkchen **einschalten** nicht gesetzt, oder es handelt sich nicht um eine Entscheidseite.

## Bei dunklem Hintergrund bleibt ein Teil der Seite weiss

Eingabefelder, Auswahllisten und Knöpfe der Gerichtsseite bleiben absichtlich hell, damit sie erkennbar und benutzbar bleiben. Die gelben Suchtreffer-Markierungen behalten ebenfalls ihre Farbe. Bleibt hingegen ein grösserer Bereich neben oder unter dem Entscheid weiss, ist das ein Fehler, der gemeldet werden sollte, mit Angabe der Adresse und des Browsers.

## Funktioniert die Erweiterung offline?

Die Erweiterung selbst braucht nie eine Internetverbindung; sie lädt nichts nach, auch keine Schriften. Die Entscheidseite muss allerdings vom Gericht geladen werden, dafür ist wie bei jeder Website eine Verbindung nötig. Eine bereits geladene Seite lässt sich anschliessend auch ohne Verbindung mit der Erweiterung lesen.

## Verändert die Erweiterung den Entscheid oder die Website des Gerichts?

Nein. Die Erweiterung verändert nur die Anzeige im eigenen Browser, und nur so lange, wie der Lesemodus eingeschaltet ist. Der Text wird weder gekürzt noch ergänzt, und die Website des Gerichts erfährt nichts von der Erweiterung. Details unter [Datenschutz und Sicherheit](DE-Datenschutz.md).

## Kann ich den Entscheid mit eingeklappten Klammern drucken?

Beim Drucken und beim Speichern als PDF über den Druckdialog werden alle Klammern vollständig ausgegeben und die Klappknöpfe weggelassen. Ein Ausdruck ist also immer vollständig. Schriftart und Farbschema werden mitgedruckt; für Schwarz auf Weiss vorher den Hintergrund «Weiss» wählen.

## Für welche Sprachen ist die Erweiterung gedacht?

Die Erweiterung funktioniert mit deutschen, französischen und italienischen Entscheiden; die Klammerregeln kennen die Zitierweisen aller drei Sprachen, und die Silbentrennung folgt der Sprache des Entscheids. Die Bedienoberfläche selbst ist auf Deutsch.

## Gibt es die Erweiterung für das Smartphone oder Tablet?

Chrome, Brave und Edge auf dem Smartphone unterstützen keine Erweiterungen. Firefox auf Android kann Erweiterungen aus dem Store installieren; bger reader ist dort nicht getestet und wird erst nach der Freigabe im Store überhaupt verfügbar sein. Auf dem Tablet mit einem Desktop-Browser sollte die Erweiterung funktionieren, ist dort aber ebenfalls nicht getestet.

## Kann ich die Erweiterung in Safari verwenden?

Nein. Safari verlangt ein eigens verpacktes Programm, das über Apple verteilt wird; das ist für dieses Projekt nicht vorgesehen.

## Werden meine Einstellungen zwischen Geräten abgeglichen?

Nein. Die Einstellungen liegen ausschliesslich im lokalen Speicher der Erweiterung auf dem jeweiligen Gerät und werden nicht mit einem Konto abgeglichen. Auf einem zweiten Gerät müssen sie einmalig neu gesetzt werden.

## Wie finde ich heraus, welche Version installiert ist?

Auf der Erweiterungsseite des Browsers steht die Versionsnummer neben dem Namen «BGer Reader», in Chrome nach einem Klick auf «Details». Die neueste veröffentlichte Version steht auf der [Releases-Seite](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases), und der [Änderungsverlauf](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/CHANGELOG.md) beschreibt, was sich von Version zu Version geändert hat.

## Wie melde ich einen Fehler oder einen Wunsch?

Über die [Issues](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) des Projekts auf GitHub; dafür ist ein kostenloses GitHub-Konto nötig. Eine gute Meldung enthält die Adresse des betroffenen Entscheids, den Browser samt Version, die Version der Erweiterung, die betroffenen Einstellungen und eine Beschreibung, was erwartet wurde und was stattdessen geschah. Ein Bildschirmfoto hilft oft. Sicherheitsprobleme bitte nicht öffentlich, sondern wie unter [Datenschutz und Sicherheit](DE-Datenschutz.md) beschrieben melden.

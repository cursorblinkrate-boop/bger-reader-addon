**Deutsch** · [English](EN-Privacy.md) · [Français](FR-Confidentialite.md) · [Italiano](IT-Privacy.md)

bger reader ist so gebaut, dass Datenschutz keine Frage des Vertrauens ist, sondern der Technik: Die Erweiterung hat keine Möglichkeit, Daten zu senden, weil sie keine Verbindung aufbaut. Diese Seite beschreibt, was sie tut, was sie speichert und wie ein Sicherheitsproblem gemeldet werden kann.

## Was die Erweiterung tut

Die Erweiterung wird vom Browser nur auf den vier unterstützten Adressen (`search.bger.ch`, `relevancy.bger.ch` über https und http, `bvger.weblaw.ch`) gestartet; auf allen anderen Websites ist sie nicht vorhanden und kann dort nichts sehen. Auf einer Entscheidseite fügt sie ihr Einstellungsfeld ein, legt Regeln für Schrift und Farben über den Entscheidtext und packt Fundstellen in Klammern in kleine auf- und zuklappbare Hüllen. Der Text des Entscheids wird dabei nur verschoben, nie verändert, gekürzt oder ergänzt; wird der Lesemodus ausgeschaltet, ist die Seite wieder genau so, wie der Browser sie geladen hat.

Sie liest keine Eingaben in Suchfelder, keine Cookies und keine anderen Tabs, und sie kennt weder Ihre Identität noch Ihre Suchanfragen. Sie hat keinen Zugriff auf das Internet: Es gibt keine Verbindung zu einem Server des Projekts, keine Statistik, keine Absturzberichte, keine automatische Update-Prüfung und keine Schriften, die nachgeladen werden. Alle Schriften liegen im Paket. Das gilt auch auf `bvger.weblaw.ch`, wo die Gerichtsseite selbst die Entscheide per Programm nachlädt: Die Erweiterung wartet nur darauf, dass der Text auf der Seite erscheint, stellt aber selbst keine Anfragen.

## Welche Berechtigung sie verlangt

Beim Installieren fragt der Browser nach genau einer Berechtigung: **Speicher** («storage»). Sie erlaubt der Erweiterung, ihre eigenen Einstellungen im lokalen Erweiterungsspeicher des Browsers abzulegen, damit sie beim nächsten Öffnen einer Entscheidseite wieder da sind. Der Zugriff auf die vier Gerichtsadressen ist keine gesondert erteilte Berechtigung, sondern ergibt sich daraus, dass die Erweiterung nur dort läuft; der Browser zeigt das in der Übersicht der Erweiterung als «Daten auf search.bger.ch lesen und ändern» an. Andere Berechtigungen, etwa für Browserverlauf, Tabs, Downloads oder Webseiten allgemein, verlangt die Erweiterung nicht.

Für Firefox enthält das Paket zusätzlich die formelle Erklärung, dass keine Daten erhoben werden («data collection permissions: none»); Firefox ab Version 140 wertet diese Angabe aus.

## Was gespeichert wird

Gespeichert werden ausschliesslich die Einstellungen aus dem Einstellungsfeld: ob der Lesemodus eingeschaltet ist, Schriftgrösse, Schriftart, Schriftstärke, Zeilen-, Absatz-, Buchstaben- und Wortabstand, Zeilenlänge, Textbreite, Silbentrennung, Farbschema, ob Klammern eingeklappt werden, Ausrichtung und Spaltenzahl. Diese Werte liegen als ein einziger Eintrag mit dem Namen `bger-reader-einstellungen-v2` im lokalen Speicher der Erweiterung. Es gibt keinen Verlauf, keine Liste gelesener Entscheide und keine Notizen. Der Speicher wird nicht mit einem Konto abgeglichen und verlässt das Gerät nicht; beim Entfernen der Erweiterung löscht der Browser ihn mit.

Das separate Einstellungsfenster merkt sich zusätzlich kurzzeitig seine eigene Fensternummer, damit ein zweiter Klick auf das Symbol das offene Fenster nach vorne holt statt ein zweites zu öffnen. Diese Nummer liegt im Sitzungsspeicher des Browsers und verfällt mit dem Schliessen des Browsers.

## Quellcode und Auslieferung

Der vollständige Quellcode ist auf GitHub öffentlich und in gewöhnlichem JavaScript geschrieben, ohne Werkzeuge, die den Code vor der Auslieferung umbauen. Das heruntergeladene Paket entspricht Zeile für Zeile dem, was im Repository steht. Das Release-Paket entsteht automatisch aus dem geprüften Stand des Codes, nachdem die Tests in echten Browsern durchgelaufen sind, und daneben wird eine Prüfsumme veröffentlicht, mit der sich die Unversehrtheit der Datei kontrollieren lässt; wie das geht, steht unter [Installation](DE-Installation.md). Die Erweiterung ist ein unabhängiges Projekt und weder mit dem Bundesgericht noch mit dem Bundesverwaltungsgericht oder mit Weblaw verbunden; die Gerichtsseiten wissen nichts von ihr.

## Sicherheitsprobleme melden

Unterstützt wird immer nur die neueste Version von der Releases-Seite; vor einer Meldung bitte auf diese aktualisieren. Wer ein Sicherheitsproblem findet, meldet es bitte nicht in einem öffentlichen Issue, sondern vertraulich: bevorzugt über das Formular von GitHub unter **Security → Report a vulnerability** im Repository, ersatzweise per E-Mail an die in der Datei [SECURITY.md](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/SECURITY.md) genannte Adresse (`bger.reader@gmail.com`). Da es sich um ein Ein-Personen-Projekt handelt, kann eine Antwort einige Tage dauern; bestätigte Probleme werden mit der nächsten Version behoben.

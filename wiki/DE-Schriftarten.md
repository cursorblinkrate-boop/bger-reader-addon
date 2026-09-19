**Deutsch** · [English](EN-Fonts.md) · [Français](FR-Polices.md) · [Italiano](IT-Caratteri.md)

<!-- Nicht hier im Wiki bearbeiten: Quelle ist die Datei wiki/DE-Schriftarten.md im Repository, der Workflow überschreibt das Wiki bei jedem Push. Diese deutsche Fassung ist die Quelle für EN, FR und IT: Änderungen hier machen und dann in die drei Übersetzungen übertragen. -->

bger reader bringt sieben Schriften mit, die der Erweiterung beiliegen und nie aus dem Internet geladen werden, dazu zwei Einträge für die Schriften des eigenen Systems. Alle mitgelieferten Schriften sind freie Schriften unter offenen Lizenzen; sie dürfen mit der Erweiterung weitergegeben werden, und die Lizenztexte liegen im Paket bei. Die Wahl erfolgt im Einstellungsfeld unter **Schriftart**; die Liste zeigt jeden Eintrag in seiner eigenen Schrift.

## Die Schriften im Überblick

| Eintrag im Menü | Herkunft | Wofür sie sich eignet | Lizenz |
|---|---|---|---|
| Atkinson Hyperlegible | Braille Institute of America | Sehbeeinträchtigung; Buchstaben und Ziffern, die sich leicht verwechseln lassen (I, l, 1, O, 0), sind deutlich verschieden geformt | SIL Open Font License 1.1 |
| Luciole | Centre Technique Régional pour la Déficience Visuelle (Frankreich), gestaltet von Laurent Bourcellier und Jonathan Perez | Sehbeeinträchtigung; eigens für sehbehinderte Menschen entwickelt, mit grosszügigen Innenräumen der Buchstaben | Creative Commons BY 4.0 |
| OpenDyslexic | Abbie Gonzalez | Legasthenie; die Buchstaben sind unten schwerer, was das Verdrehen und Vertauschen erschweren soll | SIL Open Font License 1.1 |
| Comic Neue | Craig Rozynski | freundliche, handschriftnahe Anmutung; von manchen Menschen mit Legasthenie bevorzugt, weil jede Form unverwechselbar ist | SIL Open Font License 1.1 |
| EB Garamond | Georg Duffner, weitergeführt von Octavio Pardo | klassische Buchschrift für langes Lesen auf hellem Grund | SIL Open Font License 1.1 |
| Liberation Sans (Arial-ähnlich) | Red Hat | neutrale serifenlose Schrift, gleich breit wie Arial | SIL Open Font License 1.1 |
| Liberation Serif (Times-ähnlich) | Red Hat | neutrale Serifenschrift, gleich breit wie Times New Roman | SIL Open Font License 1.1 |
| System Sans | Schrift des eigenen Geräts (Verdana, Arial oder Helvetica) | wer die gewohnte Systemschrift bevorzugt | – |
| System Serif | Schrift des eigenen Geräts (Georgia oder Times New Roman) | Standardwert; entspricht der Anmutung der Gerichtsseiten | – |

## Welche Schrift für wen

Bei einer Sehbeeinträchtigung lohnt es sich, Atkinson Hyperlegible und Luciole nacheinander auszuprobieren, jeweils mit etwas grösserer Schrift und einem Zeilenabstand von 1.6 oder mehr. Beide wurden gezielt dafür entworfen, dass ähnliche Zeichen auch bei Unschärfe oder geringem Kontrast auseinanderzuhalten sind. Welche der beiden angenehmer ist, zeigt am besten der direkte Vergleich am eigenen Bildschirm.

Bei Legasthenie ist OpenDyslexic die bekannteste Wahl; ob sie wirklich hilft, ist von Person zu Person verschieden, deshalb steht mit Comic Neue eine zweite Schrift mit deutlich unterscheidbaren Buchstabenformen zur Verfügung. Oft bringen ein grösserer Buchstaben- und Wortabstand und ein weiterer Zeilenabstand mehr als der Wechsel der Schrift allein; diese Einstellungen stehen unter **erweitert**.

Wer einfach lange und entspannt lesen möchte, ist mit EB Garamond auf dem Hintergrund «Sepia» gut bedient. Liberation Sans und Liberation Serif sind die neutralen Alternativen für alle, die eine vertraute Büroschrift möchten, aber unabhängig davon, was auf dem Gerät installiert ist.

## Technische Hinweise

Die Schriften liegen im Paket als WOFF2-Dateien, jeweils in den Schnitten «normal» und «fett». Sie enthalten den lateinischen Zeichenvorrat einschliesslich der Umlaute und Akzente der Schweizer Landessprachen, der juristischen Sonderzeichen wie § und ¶, der typografischen Anführungs- und Gedankenstriche sowie des Euro-Zeichens. Zeichen, die eine Schrift nicht enthält (bei Comic Neue etwa die Verweiszeichen † und ‡), ersetzt der Browser aus einer Systemschrift.

Zwei Familien tragen im Paket andere Namen als im Menü: OpenDyslexic ist intern «Dyslexie-Leseschrift», Liberation Sans und Serif sind «BGEReader Sans» und «BGEReader Serif». Der Grund ist eine Bedingung der Open Font License: Wer eine Schrift verändert, und das Verkleinern auf den lateinischen Zeichenvorrat ist eine solche Veränderung, darf den geschützten Originalnamen nicht weiterverwenden. Am Aussehen ändert das nichts.

Die vollständigen Lizenzangaben mit Quellen und Versionsnummern stehen in der Datei [extension/fonts/LICENSES.md](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/extension/fonts/LICENSES.md), der Lizenztext der Open Font License in `extension/fonts/OFL.txt`. Die Schriften werden mit einem Skript aus den Originaldateien erzeugt (`tools/subset-fonts.py`), damit der Vorgang nachvollziehbar und wiederholbar bleibt; mehr dazu unter [Entwicklung](DE-Entwicklung.md).

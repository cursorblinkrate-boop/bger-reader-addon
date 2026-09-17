# Icon-Lizenzen

## Extension-Icon (icon16/48/128.png, Marken-Icon in der Kopfzeile)

Eigenes Werk (pinkes Buch mit Smiley), Lizenz wie das Projekt (MIT).
Das Marken-Icon in der Kopfzeile von Panel und Pop-up ist eine Inline-SVG-
Nachzeichnung davon (`ICON_MARKE` in content.js, gleicher String in popup.html).

## Zeilen-Icons: Colibre (LibreOffice)

Die 15 Icons neben den Einstellungen stammen aus dem Icon-Thema **Colibre**,
dem Standard-Icon-Thema von LibreOffice (Original-Autor: Andreas Kainz).

- Quelle: https://github.com/LibreOffice/core/tree/master/icon-themes/colibre_svg/cmd
- Lizenz: **Creative Commons CC0 1.0** (Public Domain Dedication) –
  https://creativecommons.org/publicdomain/zero/1.0/
  Laut `readlicense_oo/license/license.xml` im LibreOffice-Repo: „Icon theme
  is released under Creative Commons CC0. You are free to adapt and use them
  for commercial purposes without attributing the original author or source."
- Änderungen: Koordinaten auf zwei Nachkommastellen gerundet, XML-Namensraum
  und Upstream-Textreste entfernt, Grösse 20×20 gesetzt. Farben unverändert
  (Colibre-Grau `#3a3a38`, Colibre-Blau `#1e8bcd`).
- Eingebettet als Inline-SVG (`ICONS` in content.js, identische Strings in
  popup.html), keine separaten Dateien.

| Einstellung        | Colibre-Datei                        |
|--------------------|--------------------------------------|
| einschalten        | sc_showbookview.svg                  |
| Schriftgrösse      | sc_grow.svg                          |
| Schriftart         | sc_charfontname.svg                  |
| Hintergrund        | sc_backgroundcolor.svg               |
| Textbreite         | sc_setoptimalcolumnwidth.svg         |
| einfach (Klammern) | sc_symbolshapes.bracket-pair.svg     |
| Schriftstärke      | sc_bold.svg                          |
| Zeilenabstand      | sc_spacepara15.svg                   |
| Absatzabstand      | sc_paraspaceincrease.svg             |
| Buchstabenabstand  | sc_spacing.svg                       |
| Wortabstand        | sc_wordcountdialog.svg               |
| Zeilenlänge        | sc_wraptext.svg                      |
| Silbentrennung     | sc_hyphenate.svg                     |
| Ausrichtung        | sc_alignblock.svg                    |
| Spalten            | sc_formatcolumns.svg                 |

Die Themen Elementary und Sifr aus LibreOffice stehen unter GPL bzw.
CC-BY-SA und wurden deshalb nicht verwendet (Projektlizenz MIT).

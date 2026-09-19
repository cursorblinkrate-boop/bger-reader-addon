[Deutsch](DE-Schriftarten.md) · **English** · [Français](FR-Polices.md) · [Italiano](IT-Caratteri.md)

<!-- Do not edit here in the wiki: the source is the file wiki/EN-Fonts.md in the repository, and the workflow overwrites the wiki on every push. The German page wiki/DE-Schriftarten.md is the master: make content changes there first, then carry them into this translation. -->

bger reader comes with seven fonts that are bundled with the extension and are never loaded from the internet, plus two entries for the fonts of your own system. All bundled fonts are free fonts under open licences; they may be distributed together with the extension, and the licence texts are included in the package. The choice is made in the settings panel under **Schriftart** (font); the list shows every entry in its own typeface.

## The fonts at a glance

| Menu entry | Origin | What it is suited for | Licence |
|---|---|---|---|
| Atkinson Hyperlegible | Braille Institute of America | visual impairment; letters and digits that are easily confused (I, l, 1, O, 0) are shaped distinctly differently | SIL Open Font License 1.1 |
| Luciole | Centre Technique Régional pour la Déficience Visuelle (France), designed by Laurent Bourcellier and Jonathan Perez | visual impairment; developed specifically for visually impaired people, with generous open spaces inside the letters | Creative Commons BY 4.0 |
| OpenDyslexic | Abbie Gonzalez | dyslexia; the letters are heavier at the bottom, which is meant to make them harder to rotate and swap | SIL Open Font License 1.1 |
| Comic Neue | Craig Rozynski | friendly, handwriting-like appearance; preferred by some people with dyslexia because every shape is unmistakable | SIL Open Font License 1.1 |
| EB Garamond | Georg Duffner, continued by Octavio Pardo | classic book face for long reading on a light background | SIL Open Font License 1.1 |
| Liberation Sans (Arial-ähnlich) (Arial-like) | Red Hat | neutral sans-serif font, same width as Arial | SIL Open Font License 1.1 |
| Liberation Serif (Times-ähnlich) (Times-like) | Red Hat | neutral serif font, same width as Times New Roman | SIL Open Font License 1.1 |
| System Sans | font of your own device (Verdana, Arial or Helvetica) | for anyone who prefers the familiar system font | – |
| System Serif | font of your own device (Georgia or Times New Roman) | default value; matches the look of the court websites | – |

## Which font for whom

With a visual impairment, it is worth trying Atkinson Hyperlegible and Luciole one after the other, each with a somewhat larger font size and a line spacing of 1.6 or more. Both were designed specifically so that similar characters can be told apart even when blurred or at low contrast. Which of the two is more comfortable is best shown by a direct comparison on your own screen.

With dyslexia, OpenDyslexic is the best-known choice; whether it really helps varies from person to person, which is why Comic Neue is available as a second font with clearly distinguishable letter shapes. Often a larger letter and word spacing and a wider line spacing bring more than changing the font alone; these settings are found under **erweitert** (advanced).

If you simply want to read for a long time and in a relaxed way, EB Garamond on the «Sepia» background is a good choice. Liberation Sans and Liberation Serif are the neutral alternatives for anyone who wants a familiar office font, but independently of what is installed on the device.

## Technical notes

The fonts are included in the package as WOFF2 files, each in the «normal» and «fett» (bold) weights. They contain the Latin character set including the umlauts and accents of the Swiss national languages, the legal special characters such as § and ¶, the typographic quotation marks and dashes and the euro sign. Characters that a font does not contain (with Comic Neue, for instance, the reference marks † and ‡) are substituted by the browser from a system font.

Two families carry different names in the package than in the menu: OpenDyslexic is internally «Dyslexie-Leseschrift», Liberation Sans and Serif are «BGEReader Sans» and «BGEReader Serif». The reason is a condition of the Open Font License: anyone who modifies a font, and reducing it to the Latin character set is such a modification, may not continue to use the protected original name. This changes nothing about the appearance.

The complete licence information with sources and version numbers is in the file [extension/fonts/LICENSES.md](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/extension/fonts/LICENSES.md), the licence text of the Open Font License in `extension/fonts/OFL.txt`. The fonts are generated from the original files with a script (`tools/subset-fonts.py`) so that the process remains traceable and repeatable; more on this under [Development](EN-Development.md).

# Font-Lizenzen

Alle gebündelten Schriften stehen unter der SIL Open Font License 1.1
(Lizenztext: [OFL.txt](OFL.txt)). Die WOFF2-Dateien in diesem Verzeichnis
sind Latin-Subsets (U+0020–007E, U+00A0–00FF, U+2010–2027, U+2030–203A,
U+20AC; Schweizer Umlaute/Akzente, § ¶ † ‡ € £, Interpunktion, Ligaturen),
erzeugt mit `tools/subset-fonts.py` (fontTools, font-display: swap,
kein Hinting, Layout-Features: liga). Subsetting ist von der OFL ausdrücklich
erlaubt („Modified Version“). OFL-Bedingung 3: Modified Versions dürfen keine
Reserved Font Names tragen – die Subsets von OpenDyslexic und Liberation
(RFNs „OpenDyslexic“ bzw. „Liberation“) sind deshalb in den WOFF2-Dateien
und im CSS unter eigenen Familiennamen umbenannt („Dyslexie-Leseschrift“,
„BGEReader Serif“, „BGEReader Sans“). Atkinson Hyperlegible Next, EB Garamond
und Comic Neue deklarieren keine Reserved Font Names und behalten ihre Namen.

## Atkinson Hyperlegible Next 2.001 (Regular 400, Bold 700)

- Quelle: https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegiblenext
  (Upstream: https://github.com/googlefonts/atkinson-hyperlegible-next)
- Variable Font, statisch instanziiert auf wght 400/700
- Lizenz: SIL OFL 1.1
- Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors
  (https://github.com/googlefonts/atkinson-hyperlegible-next)

## EB Garamond 1.003 (Regular 400, Bold 700)

- Quelle: https://github.com/google/fonts/tree/main/ofl/ebgaramond
  (Upstream: https://github.com/octaviopardo/EBGaramond12)
- Variable Font, statisch instanziiert auf wght 400/700
- Lizenz: SIL OFL 1.1
- Copyright 2017 The EB Garamond Project Authors
  (https://github.com/octaviopardo/EBGaramond12)

## OpenDyslexic 0.990 (Regular 400, Bold 800)

- Quelle: https://github.com/antijingoist/opendyslexic (`compiled/*.otf`)
- Lizenz: SIL OFL 1.1
- Copyright (c) 2019-07-29, Abbie Gonzalez (https://abbiecod.es|support@abbiecod.es),
  with Reserved Font Name OpenDyslexic.
  Copyright (c) 12/2012 - 2019
- Subset-Familienname: **Dyslexie-Leseschrift** (RFN-Konformität, s. o.)
- Hinweis: Der Bold-Schnitt ist im Font als usWeightClass 800 eingetragen,
  wird aber per @font-face als font-weight 700 eingebunden.

## Comic Neue 2.003 (Regular 400, Bold 700)

- Quelle: https://github.com/google/fonts/tree/main/ofl/comicneue
  (Upstream: https://github.com/crozynski/comicneue)
- Lizenz: SIL OFL 1.1
- Copyright 2014 The Comic Neue Project Authors
  (https://github.com/crozynski/comicneue)
- Hinweis: † (U+2020) und ‡ (U+2021) sind im Original nicht enthalten;
  der Browser ersetzt diese Zeichen aus der System-Fallback-Schrift.

## Liberation Serif / Liberation Sans 2.1.5 (je Regular 400, Bold 700)

- Quelle: https://github.com/liberationfonts/liberation-fonts
  (Release-Tarball liberation-fonts-ttf-2.1.5.tar.gz)
- Lizenz: SIL OFL 1.1
- Digitized data copyright (c) 2010 Google Corporation,
  with Reserved Font Name Arimo, Tinos and Cousine.
  Copyright (c) 2012 Red Hat, Inc.,
  with Reserved Font Name Liberation.
- Subset-Familiennamen: **BGEReader Serif** / **BGEReader Sans**
  (RFN-Konformität, s. o.)

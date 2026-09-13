#!/usr/bin/env python3
"""Reproduzierbares Subsetting der lokalen FOSS-Fonts für den BGer Reader.

Schritte:
  1. Quelldateien liegen als Original-TTF/OTF vor (siehe QUELLEN unten;
     Download-URLs sind in der LICENSES.md dokumentiert).
  2. Variable Fonts (Atkinson Hyperlegible Next, EB Garamond) werden mit
     fontTools.varLib.instancer auf wght 400/700 statisch instanziiert.
  3. Alle Fonts werden auf ein Latin-Subset reduziert (Schweizer Umlaute/
     Akzente, juristische Zeichen, Interpunktion) und als WOFF2 geschrieben.

Aufruf (aus dem Repo-Root):
  .venv-fonts/bin/python tools/subset-fonts.py

Voraussetzung: pip install fonttools brotli  (z. B. in .venv-fonts)
"""

import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.environ.get("BGR_FONT_SRC", "/tmp/bger-fonts")
OUT_DIR = os.path.join(REPO_ROOT, "extension", "fonts")

# Latin-Subset: Basic Latin, Latin-1 Supplement (Umlaute/Akzente, § ¶ £),
# allgemeine Interpunktion inkl. † ‡, Promille, Euro.
UNICODES = "U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+20AC"

# (Quelldatei, Ausgabebasis, statisch/variable Schnitte, Subset-Familienname)
# Bei variablen Fonts: Schnitte als (axis-pin, suffix).
# Subset-Familienname: OFL 1.1, Bedingung 3 – modifizierte Versionen (Subsets)
# duerfen keine Reserved Font Names tragen. OpenDyslexic (RFN "OpenDyslexic")
# und Liberation (RFN "Liberation") bekommen daher eigene Familiennamen;
# die Herkunft ist in LICENSES.md dokumentiert. Atkinson Hyperlegible Next,
# EB Garamond und Comic Neue deklarieren keine Reserved Font Names.
FONTS = [
    ("AtkinsonHyperlegibleNext[wght].ttf", "atkinson-hyperlegible-next",
     [(400, "400"), (700, "700")], "Atkinson Hyperlegible Next"),
    ("EBGaramond[wght].ttf", "eb-garamond",
     [(400, "400"), (700, "700")], "EB Garamond"),
    ("comicneue-ComicNeue-Regular.ttf", "comic-neue", [(None, "400")], "Comic Neue"),
    ("comicneue-ComicNeue-Bold.ttf", "comic-neue", [(None, "700")], "Comic Neue"),
    ("OpenDyslexic-Regular.otf", "opendyslexic", [(None, "400")], "Dyslexie-Leseschrift"),
    ("OpenDyslexic-Bold.otf", "opendyslexic", [(None, "700")], "Dyslexie-Leseschrift"),
    ("liberation-fonts-ttf-2.1.5/LiberationSerif-Regular.ttf",
     "liberation-serif", [(None, "400")], "BGEReader Serif"),
    ("liberation-fonts-ttf-2.1.5/LiberationSerif-Bold.ttf",
     "liberation-serif", [(None, "700")], "BGEReader Serif"),
    ("liberation-fonts-ttf-2.1.5/LiberationSans-Regular.ttf",
     "liberation-sans", [(None, "400")], "BGEReader Sans"),
    ("liberation-fonts-ttf-2.1.5/LiberationSans-Bold.ttf",
     "liberation-sans", [(None, "700")], "BGEReader Sans"),
]

# name-IDs, die den Familiennamen tragen: 1 (Family), 3 (Unique), 4 (Full),
# 6 (PostScript), 16 (Typographic Family). Unterfamilie (2/17) bleibt.
NAME_IDS_FAMILIE = (1, 3, 4, 6, 16)


def familie_umbenennen(font, name):
    """Familienname in der name-Tabelle ersetzen (RFN-Konformitaet)."""
    tabelle = font["name"]
    familie_alt = tabelle.getDebugName(1) or ""
    for eintrag in tabelle.names:
        if eintrag.nameID in NAME_IDS_FAMILIE:
            try:
                alt = eintrag.toUnicode()
            except Exception:
                continue
            # Unterfamilien-Suffix bei Full/Unique/PostScript beibehalten
            if eintrag.nameID in (3, 4, 6):
                if familie_alt and alt.startswith(familie_alt):
                    neu = name + alt[len(familie_alt):]
                else:
                    neu = name
            else:
                neu = name
            eintrag.string = neu.encode(eintrag.getEncoding(), errors="replace")


def subset_einen_font(font, out_path, familienname):
    """Latin-Subset + WOFF2. Ligaturen (liga) bleiben erhalten, kern nicht."""
    opts = subset.Options(flavor="woff2", with_zopfli=False)
    opts.name_IDs = ["*"]          # Lizenz-/Namensinfos behalten
    opts.name_languages = ["*"]
    # Nur liga: '*' würde per Closure Small-Caps/Alternates mit in die
    # Glyphenmenge ziehen; kern (GPOS) kostet ~10 KB/Schnitt und sprengt
    # das 300-KB-Gesamtbudget – für den Lese-Zweck verzichtbar.
    opts.layout_features = ["liga"]
    opts.hinting = False           # Webfont: Hinting nicht nötig
    opts.desubroutinize = True     # CFF: Subroutinen auflösen (woff2-komprimiert)
    opts.notdef_outline = True
    opts.recalc_bounds = True
    ss = subset.Subsetter(options=opts)
    ss.populate(unicodes=subset.parse_unicodes(UNICODES))
    ss.subset(font)
    if familienname:
        familie_umbenennen(font, familienname)
    font.save(out_path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    gesamt = 0
    for quelle, basis, schnitte, familienname in FONTS:
        src_path = os.path.join(SRC_DIR, quelle)
        if not os.path.exists(src_path):
            print("FEHLT: %s" % src_path, file=sys.stderr)
            sys.exit(1)
        for wght, suffix in schnitte:
            font = TTFont(src_path)
            if wght is not None:  # variable -> statisch pinnen
                instantiateVariableFont(font, {"wght": wght}, inplace=True)
            out_name = "%s-latin-%s.woff2" % (basis, suffix)
            out_path = os.path.join(OUT_DIR, out_name)
            subset_einen_font(font, out_path, familienname)
            font.close()
            groesse = os.path.getsize(out_path)
            gesamt += groesse
            print("%-48s %6.1f KB" % (out_name, groesse / 1024))
    print("GESAMT: %.1f KB" % (gesamt / 1024))


if __name__ == "__main__":
    main()

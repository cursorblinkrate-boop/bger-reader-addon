[Deutsch](DE-Einstellungen.md) · **English** · [Français](FR-Reglages.md) · [Italiano](IT-Impostazioni.md)

<!-- Do not edit here in the wiki: the source is the file wiki/EN-Settings.md in the repository, and the workflow overwrites the wiki on every push. The German page wiki/DE-Einstellungen.md is the master: make content changes there first, then carry them into this translation. -->

This page explains every setting of bger reader individually. The settings appear in the settings panel on the page and in the separate window in the same order; the first six are visible immediately, the others appear after a click on **erweitert** (advanced). How the two places are opened is described under [Usage](EN-Usage.md).

## Overview

| Setting | Section | Possible values | Default |
|---|---|---|---|
| einschalten (switch on) | main | aus / ein (off / on) | aus |
| Schriftgrösse (font size) | main | 6 to 50 | 18 |
| Schriftart (font) | main | 9 fonts, see [Fonts](EN-Fonts.md) | System Serif |
| Hintergrund (background) | main | Weiss (white), Sepia, Dunkel (dark), Hoher Kontrast (high contrast), Nacht (rötlich) (night, reddish) | Weiss |
| Textbreite (text width) | main | 400 to 1400 pixels, in steps of 25 | 625 |
| einfach (simple; brackets) | main | aus / ein | ein |
| Schriftstärke (font weight) | erweitert | normal / fett (bold) | normal |
| Zeilenabstand (line spacing) | erweitert | 1.0 to 2.5 | 1.6 |
| Absatzabstand (paragraph spacing) | erweitert | aus, 0.25 to 3 | aus |
| Buchstabenabstand (letter spacing) | erweitert | 0 to 4 pixels | 0 |
| Wortabstand (word spacing) | erweitert | 0 to 10 pixels | 0 |
| Zeilenlänge (line length) | erweitert | aus, 10 to 120 characters | aus |
| Silbentrennung (hyphenation) | erweitert | aus / ein | aus |
| Ausrichtung (alignment) | erweitert | links (left), mittig (centred), rechts (right), Blocksatz (justified) | links |
| Spalten (columns) | erweitert | 1, 2 or 3 | 1 |

All settings take effect only while **einschalten** is ticked, and they act exclusively on the paragraphs of the decision text together with the page frame around them. Menus, search fields and buttons of the court website remain unchanged and usable. If you leave a setting at its default value, you get exactly the display of the original page at that point; the extension intervenes only where something has been changed.

## einschalten (switch on)

The main switch. Without the tick, the extension merely waits; it shows the pink button but changes nothing. With the tick, the reading mode becomes active: font and colours are applied and, if **einfach** is ticked, the citations in brackets are collapsed. Removing the tick fully restores the original page.

## Schriftgrösse (font size)

The size of the type in the decision text in pixels, from 6 to 50. The default of 18 is slightly larger than the court websites' preset. The slider takes effect immediately while dragging, so the right size can be found while looking at the text. For long reading sessions, a value between 18 and 22 has proved to work well; anyone working with magnification software can go up to 50 without the page layout breaking.

## Schriftart (font)

The font in which the decision text is set. The choice comprises two fonts for people with a visual impairment (Atkinson Hyperlegible, Luciole), one for people with dyslexia (OpenDyslexic), a friendly handwriting-like face (Comic Neue), a classic book face (EB Garamond), two neutral standard fonts (Liberation Sans, Liberation Serif) and the system fonts of your own device (System Sans, System Serif). The list shows every font in its own shape, so the difference can be judged before choosing. All fonts except the two system fonts are bundled with the extension and are not loaded from the internet. Details and licences under [Fonts](EN-Fonts.md).

## Hintergrund (background)

The colour scheme for background, text and links. **Weiss** (white) matches the original page with black text. **Sepia** places dark brown text on a warm, slightly yellowish ground, which many find more pleasant for the eyes. **Dunkel** (dark) is a night mode with light grey text on an almost black ground. **Hoher Kontrast** (high contrast) sets pure white on pure black with yellow links and is intended for severely impaired vision. **Nacht (rötlich)** (night, reddish) uses a dark reddish ground with light, slightly rosé-tinted text and little blue content, which keeps you less awake in the evening. The scheme colours the whole page, including header, navigation and side columns, so that no glaring white frame is left around the dark text. The yellow highlights of search hits on the court website keep dark text in all schemes and remain readable.

## Textbreite (text width)

The width of the frame in which the decision text sits, in pixels. On `search.bger.ch` and `relevancy.bger.ch` this frame is fixed by the page at 625 pixels, which looks narrow on large screens. The slider allows values from 400 to 1400 pixels; the side columns of the page move along with it. On `bvger.weblaw.ch` the slider acts on the column in which the decision sits. At the default value of 625 the page remains unchanged.

## einfach (simple): collapsing brackets

With this tick, citations in brackets are collapsed, that is case-law citations (BGE, judgments with docket numbers) and references to legal literature. Statutory references such as `(Art. 8 Abs. 1 BV)`, amounts, dates, references to the decision's own considerations and substantive remarks stay open because they belong to the line of reasoning. The name «einfach» stands for the fixed set of rules that needs no further setting. Every collapsed bracket can be opened individually with the arrow `▸`. The rules in detail: [Collapsing brackets](EN-Brackets.md).

## Schriftstärke (font weight)

The options are normal and fett (bold). Bold can improve legibility with thin fonts or on a dark background. All bundled fonts contain a genuine bold weight, so nothing is artificially thickened.

## Zeilenabstand (line spacing)

The distance between lines as a multiple of the font size, from 1.0 (tight) to 2.5 (very wide). The default of 1.6 is more generous than the original page. A larger line spacing helps you not to slip into the wrong line when moving to the next one, which matters particularly with dyslexia and with small type.

## Absatzabstand (paragraph spacing)

Additional blank space after every paragraph, as a multiple of the font size from 0.25 to 3. At «aus» (off), the paragraph spacing of the original page is kept. A value around 0.75 to 1 makes the structure of a decision into considerations and sub-paragraphs recognisable at a glance.

## Buchstabenabstand (letter spacing)

Additional space between the individual letters in pixels, from 0 to 4 in steps of a tenth. A slightly increased value (around 0.5 to 1) prevents letters from running into one another; this is often felt as a relief with dyslexia and with visual impairment. Large values make the text look spaced out and rather harder to read.

## Wortabstand (word spacing)

Additional space between the words in pixels, from 0 to 10. A larger word spacing makes the word boundaries clearer. Together with an increased letter spacing, the word spacing should grow along with it, so that words and the gaps between letters remain distinguishable.

## Zeilenlänge (line length)

Limits the length of a line to a number of characters, from 10 to 120 in steps of ten; «aus» leaves the lines as long as the text frame is wide. Very long lines make it harder to find the way back to the start of the line; typographically, 60 to 80 characters are considered comfortable. If the line length is set, the text is centred within the frame. This setting is independent of the text width: the text width defines the frame, the line length the text within it.

## Silbentrennung (hyphenation)

Switches on the browser's automatic hyphenation. It breaks words at the end of the line according to the rules of the decision's language; on `bvger.weblaw.ch` the extension recognises the language from the heading of the decision (rubrum), because the page itself gives no suitable indication. Hyphenation pays off above all with narrow columns, with large type and with justified text, because it makes the gaps between words more even. Whether and how well words are hyphenated depends on the browser and its language support.

## Ausrichtung (alignment)

The options are links (left; the default and the court websites' preset), mittig (centred), rechts (right) and Blocksatz (justified). Justified text without hyphenation produces large gaps in narrow columns; the two settings therefore belong together. Centred and right are intended for special needs, for instance for magnifier software that enlarges a particular area of the screen.

## Spalten (columns)

Sets the decision text in 1, 2 or 3 columns side by side, as in a newspaper. Paragraphs may break across columns, because considerations are often long. Two columns make sense on wide screens together with a large text width; on narrow screens the columns quickly become too narrow. With one column the page remains unchanged.

## Zurücksetzen (reset)

Resets all settings to the default values from the table above and switches the reading mode off. The button's tooltip lists the default values. There is no undo; the old values must be set again if needed.

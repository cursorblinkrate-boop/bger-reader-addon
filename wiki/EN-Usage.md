[Deutsch](DE-Bedienung.md) · **English** · [Français](FR-Utilisation.md) · [Italiano](IT-Utilizzo.md)

<!-- Do not edit here in the wiki: the source is the file wiki/EN-Usage.md in the repository, and the workflow overwrites the wiki on every push. The German page wiki/DE-Bedienung.md is the master: make content changes there first, then carry them into this translation. -->

bger reader can be operated in two places: directly on the decision page via a small settings panel that opens with the pink button, or in a separate window that opens via the extension's icon in the toolbar. Both show the same settings, access the same storage and stay in sync with each other: whatever is changed in the window takes effect immediately on the page, and vice versa.

## The pink button and the settings panel

On every supported decision page, a round pink button with a white book icon appears at the top right. It floats above the page and does not scroll with it, so it is always within reach. A click on it opens the settings panel in the same place, a small white panel with the heading «bger reader». The pink button disappears while the panel is open and comes back as soon as it is closed. The panel is closed with the pink X button at its top right or with the **Escape** key.

The panel is deliberately kept simple. The upper part holds the settings that are needed most often: **einschalten** (switch on), **Schriftgrösse** (font size), **Schriftart** (font), **Hintergrund** (background), **Textbreite** (text width) and **einfach** (simple). A click on **erweitert** (advanced) expands the remaining settings below it: Schriftstärke (font weight), Zeilenabstand (line spacing), Absatzabstand (paragraph spacing), Buchstabenabstand (letter spacing), Wortabstand (word spacing), Zeilenlänge (line length), Silbentrennung (hyphenation), Ausrichtung (alignment), Spalten (columns) and the **Zurücksetzen** (reset) button. What each of these settings does in detail is explained on the [Settings](EN-Settings.md) page.

As long as **einschalten** is not ticked, the extension changes nothing on the page; it merely waits. With the tick, the reading mode becomes active and all other settings take effect immediately. Removing the tick again fully restores the original display of the page; the collapsed brackets are then unpacked again as well.

The sliders show the current value to their right, for example `18` for the font size or `1.6` for the line spacing. The drop-down lists for font and background show a preview: each font appears in the list in its own typeface, each background in its own colours, and the closed list shows the selected entry in the same way. Firefox on macOS draws the expanded list itself and shows the preview there only in the closed state.

If you rest the mouse on a control for a little longer than three seconds, a short tooltip appears. The delay is intentional, so that the tooltips do not get in the way when adjusting things quickly. For the reset button, the tooltip lists all default values.

## The settings window via the icon in the toolbar

A click on the extension's icon in the browser toolbar (the pink book) opens the same settings in a separate window that appears in the middle of the browser window. It is larger than the panel on the page and therefore more convenient when a lot is to be adjusted or when the screen is large. A second click on the icon does not open a second window but brings the already open one to the front. The window is closed with the X button or with Escape.

The window is also useful when no decision is open at the moment: the settings made there are saved and take effect as soon as a decision page is loaded again. If a decision page is open at the same time, every change in the window takes effect immediately on the page, and the panel on the page shows the new state.

In Chrome, Brave and Edge, the extension's icon is initially hidden behind the puzzle-piece icon to the right of the address bar; with the pin there it can be attached permanently.

## Reading collapsed brackets

If **einfach** is ticked, which is the default, citations in brackets are collapsed. What remains visible in their place is a small button with the sign `▸`. A click on it shows the content of the bracket in place, and the button changes to `▾`; another click collapses the bracket again. Every bracket can be opened and closed individually, and brackets once opened stay open even if font or colours are adjusted afterwards. Only switching the reading mode or the brackets off and on again resets all brackets to the collapsed state. Which brackets are collapsed at all is explained on the page [Collapsing brackets](EN-Brackets.md).

If you do not want the brackets collapsed at all, remove the tick at **einfach**; all other settings remain unaffected.

## Saving and scope of the settings

There is no save button. Every change is stored immediately in the extension's local storage and is there again the next time a decision page is opened, even after a browser restart. The settings apply jointly to all supported websites; if you choose Sepia and a font size of 20 on `search.bger.ch`, you see the same display on `bvger.weblaw.ch`. The **Zurücksetzen** button under «erweitert» resets all values to the default and switches the reading mode off.

## Keyboard operation

All controls can be reached with the keyboard. When the settings panel opens, the focus jumps to the close button; from there the **Tab** key leads through all elements, the **space bar** toggles checkboxes, the **arrow keys** adjust sliders and drop-down lists, and **Escape** closes the panel and returns the focus to the pink button. With keyboard operation, the tooltips also appear after three seconds on the element that has the focus. The toggle buttons of the brackets are real buttons and can be operated with Enter or the space bar; screen readers learn from them whether the bracket is currently open or closed.

## Printing

When printing or saving as PDF via the browser's print dialog, all brackets are output in full and the toggle buttons are omitted. A printed decision is therefore always complete, regardless of which brackets were collapsed on screen at the time. The other settings such as font and colour scheme are printed as well; if you prefer black on white on paper, briefly choose the «Weiss» (white) background before printing.

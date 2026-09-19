[Deutsch](DE-Datenschutz.md) · **English** · [Français](FR-Confidentialite.md) · [Italiano](IT-Privacy.md)

bger reader is built so that privacy is not a matter of trust but of technology: the extension has no way of sending data, because it establishes no connection. This page describes what it does, what it stores and how a security problem can be reported.

## What the extension does

The extension is started by the browser only on the four supported addresses (`search.bger.ch`, `relevancy.bger.ch` via https and http, `bvger.weblaw.ch`); on all other websites it is not present and cannot see anything there. On a decision page it inserts its settings panel, lays rules for font and colours over the decision text and wraps citations in brackets in small wrappers that can be expanded and collapsed. The text of the decision is only moved in the process, never changed, shortened or added to; if the reading mode is switched off, the page is again exactly as the browser loaded it.

It reads no input in search fields, no cookies and no other tabs, and it knows neither your identity nor your search queries. It has no access to the internet: there is no connection to a server of the project, no statistics, no crash reports, no automatic update check and no fonts that are downloaded afterwards. All fonts are in the package. This also applies on `bvger.weblaw.ch`, where the court website itself fetches the decisions by program: the extension only waits for the text to appear on the page, but makes no requests itself.

## Which permission it requests

When installing, the browser asks for exactly one permission: **Storage** («storage»). It allows the extension to keep its own settings in the browser's local extension storage, so that they are there again the next time a decision page is opened. Access to the four court addresses is not a separately granted permission but follows from the fact that the extension runs only there; the browser shows this in the extension's overview as «Read and change your data on search.bger.ch». Other permissions, for instance for browsing history, tabs, downloads or websites in general, are not requested by the extension.

For Firefox, the package additionally contains the formal declaration that no data is collected («data collection permissions: none»); Firefox from version 140 evaluates this information.

## What is stored

Only the settings from the settings panel are stored: whether the reading mode is switched on, font size, font, font weight, line, paragraph, letter and word spacing, line length, text width, hyphenation, colour scheme, whether brackets are collapsed, alignment and number of columns. These values are held as a single entry named `bger-reader-einstellungen-v2` in the extension's local storage. There is no history, no list of decisions read and no notes. The storage is not synchronised with an account and does not leave the device; when the extension is removed, the browser deletes it as well.

The separate settings window additionally remembers its own window number for a short time, so that a second click on the icon brings the open window to the front instead of opening a second one. This number is held in the browser's session storage and expires when the browser is closed.

## Source code and delivery

The complete source code is public on GitHub and written in ordinary JavaScript, without tools that rebuild the code before delivery. The downloaded package matches, line for line, what is in the repository. The release package is created automatically from the tested state of the code after the tests have run in real browsers, and next to it a checksum is published with which the integrity of the file can be checked; how to do this is described under [Installation](EN-Installation.md). The extension is an independent project and is not affiliated with the Federal Supreme Court, the Federal Administrative Court or Weblaw; the court websites know nothing of it.

## Reporting security problems

Only the latest version from the Releases page is ever supported; please update to it before reporting. If you find a security problem, please do not report it in a public issue but confidentially: preferably via GitHub's form under **Security → Report a vulnerability** in the repository, or alternatively by e-mail to the address given in the file [SECURITY.md](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/SECURITY.md) (`bger.reader@gmail.com`). As this is a one-person project, a reply may take a few days; confirmed problems are fixed with the next version.

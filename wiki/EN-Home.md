[Deutsch](DE-Startseite.md) · **English** · [Français](FR-Accueil.md) · [Italiano](IT-Home.md)

<!-- Do not edit here in the wiki: the source is the file wiki/EN-Home.md in the repository, and the workflow overwrites the wiki on every push. The German page wiki/DE-Startseite.md is the master: make content changes there first, then carry them into this translation. -->

**bger reader** is a free browser extension for Chrome, Brave, Edge and Firefox that makes decisions of the Swiss Federal Supreme Court and the Federal Administrative Court easier to read. It changes only the display in your own browser: font, font size, spacing, line length and colour scheme can be set freely, and citations in brackets (parentheses) – such as `(BGE 135 II 45 E. 3.2 S. 47)` – are collapsed behind a small arrow so that the line of reasoning of the decision is not constantly interrupted. The text itself remains completely intact; every bracket can be opened again with a single click.

The extension works 100% offline. It sends no data, downloads nothing, contains no advertising and no statistics functions. The only permission it requests from the browser is the local storage in which your own settings are kept. More on this under [Privacy and security](EN-Privacy.md).

bger reader is an independent project by a single person and is not affiliated with the Federal Supreme Court, the Federal Administrative Court or Weblaw.

This wiki is available in German, English, French and Italian; the language bar at the very top of each page leads to the same page in the other languages. The user interface of the extension itself is in German.

## Who the extension is for

The extension is aimed at everyone who reads court decisions on screen and struggles with the standard display of the court websites: people with a visual impairment or dyslexia who need a particularly legible font such as Atkinson Hyperlegible, Luciole or OpenDyslexic; people who prefer to read on a dark background in the evening; and, quite generally, lawyers, students and interested readers who read long considerations and do not want to be distracted by the many citations in brackets.

## How it works in brief

After installation, a round pink button with a book icon appears at the top right of every supported decision page. A click on it opens a small settings panel. There, the reading mode is activated with the **einschalten** (switch on) checkbox; after that, font, background and text width can be adjusted. Alternatively, a click on the extension's icon in the browser toolbar opens the same settings in a separate, larger window. All settings are saved automatically and apply on all supported pages until they are changed.

1. Install the extension, see [Installation](EN-Installation.md).
2. Open a decision on `search.bger.ch`, `relevancy.bger.ch` or `bvger.weblaw.ch`.
3. Click the pink button at the top right and tick **einschalten**.
4. Set font, size and background as you like. Done.

<img width="957" height="790" alt="Example view with the settings panel open" src="https://github.com/user-attachments/assets/4ae7d44b-6423-4ff9-9613-93a000e02cbf" />

## The pages of this wiki

- [Installation](EN-Installation.md) – Downloading and setting up in Chrome, Brave, Edge and Firefox, checking the checksum, updating, removing.
- [Usage](EN-Usage.md) – The pink button, the settings panel, the separate window, keyboard, printing.
- [Settings](EN-Settings.md) – Every setting explained individually, with range and default value.
- [Collapsing brackets](EN-Brackets.md) – Which brackets are collapsed, which stay open, and why.
- [Fonts](EN-Fonts.md) – The bundled fonts, what they are suited for and under which licence they are published.
- [Supported websites](EN-Websites.md) – On which pages the extension works and what is special about each of them.
- [Privacy and security](EN-Privacy.md) – What is stored, what is not, and how to report a security problem.
- [FAQ](EN-FAQ.md) – Answers to typical questions and help when something does not work.
- [Development](EN-Development.md) – Structure of the code, tests, versions and releases, for everyone who wants to contribute or understand the code.

## Current version and history

The current version is on the [Releases page](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases); every file carries the version number in its name, for example `bger-reader-0.9.1.zip`. What has changed from version to version is listed in the [changelog](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/CHANGELOG.md). The extension has been submitted to the browser stores; as soon as it is approved there, installation becomes a single click. Until then, the route via the release package described under [Installation](EN-Installation.md) works.

## Reporting bugs and asking questions

Bugs, requests and questions belong in the project's [Issues](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) on GitHub. The most helpful report contains the address of the affected decision, the browser used including its version, and a short description of what was expected and what happened instead. For a bracket that was wrongly collapsed or wrongly left open, the exact text of the bracket is enough. Please do not report security problems publicly, but as described under [Privacy and security](EN-Privacy.md).

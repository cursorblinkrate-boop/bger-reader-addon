[Deutsch](DE-Websites.md) · **English** · [Français](FR-Sites.md) · [Italiano](IT-Siti.md)

bger reader works on the decision pages of the Swiss Federal Supreme Court and the Federal Administrative Court. The browser starts the extension only on the addresses listed here; on all other websites it is not present. The settings apply jointly to all supported pages.

| Address | Court | What is there |
|---|---|---|
| `https://search.bger.ch/*` | Federal Supreme Court | leading cases of the official collection (BGE) and all other judgments from the year 2000 onwards |
| `https://relevancy.bger.ch/*` and `http://relevancy.bger.ch/*` | Federal Supreme Court | second access route to the same decisions, with and without encryption |
| `https://bvger.weblaw.ch/*` | Federal Administrative Court | decisions database of the Federal Administrative Court, operated by Weblaw |

## search.bger.ch and relevancy.bger.ch

The decisions of the Federal Supreme Court come in two views. The official collection (BGE) is shown in the «clir» view, in which every paragraph of the decision is a separate text block and page breaks of the printed collection are marked in the text as bars such as «BGE 152 IV 1 S. 7». The other judgments from 2000 onwards appear in the «aza» view with a slightly different paragraph structure. The extension knows both and treats them alike: typography and colours act on the paragraphs of the decision, the page-break bars remain visible even with collapsed brackets, and the yellow highlights of search hits keep dark text.

The colour scheme acts on the whole page, including the header, the left-hand navigation and the side columns with the table of contents and references, so that no white frame is left with dark schemes. The text width changes the frame that the page fixes at 625 pixels by default; the side columns move along with it. On the search pages of `search.bger.ch`, that is where lists of results appear instead of a decision, only the colour scheme takes effect; the typography settings only apply on the decision page.

`relevancy.bger.ch` is a second access route to the same decisions, which in places is still linked without encryption (http); the extension supports both variants.

## bvger.weblaw.ch

The decisions of the Federal Administrative Court are on a website that is built differently from that of the Federal Supreme Court: it is a so-called web app. The page initially arrives at the browser empty, and only afterwards is the decision fetched by the website's own program and inserted. When switching to another decision or when switching the highlights the website offers on and off, the text is exchanged without the page being reloaded.

The extension therefore waits for the text and rebuilds typography and brackets every time the decision on the page changes. A brief moment between the appearance of the decision and the reading mode is normal. The extension itself makes no requests to the website in the process; it only observes what appears on the page.

Some peculiarities of the site are taken into account. The website declares its language as English, which would harm hyphenation; the extension recognises the language of the decision from its heading (the rubrum: «Urteil vom», «Arrêt du», «Sentenza del») and hyphenates accordingly. The website's coloured highlights for cited decisions and keywords keep dark text, and their labels do not count as part of the bracket text. The colour scheme acts on the decision area with title and date and on the sidebar with the filters, and the text width changes the column in which the decision sits. Citations in the Federal Administrative Court's format such as `BVGE 2014/1` or `ATAF 2007/6` are recognised as case law and collapsed.

## What is not supported

The extension acts only on the decision pages in the browser. Not supported are the PDF versions of the decisions, the news and information pages under `www.bger.ch`, the decision collections of cantonal courts, other databases such as entscheidsuche.ch or Swisslex and the other products of Weblaw. Smartphone browsers are not supported, see [FAQ](EN-FAQ.md). Requests for further sites can be submitted as an [Issue](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues); every new site needs its own site profile in the code and test pages on which it can be checked.

[Deutsch](DE-FAQ.md) · **English** · [Français](FR-FAQ.md) · [Italiano](IT-FAQ.md)

<!-- Do not edit here in the wiki: the source is the file wiki/EN-FAQ.md in the repository, and the workflow overwrites the wiki on every push. The German page wiki/DE-FAQ.md is the master: make content changes there first, then carry them into this translation. -->

Answers to frequently asked questions and help when something does not work as expected. If the right answer is missing, an [Issue](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) on GitHub helps; what a report should contain is described at the very bottom.

## The pink button does not appear

The button appears only on the supported addresses, see [Supported websites](EN-Websites.md). The address in the address bar must begin with `search.bger.ch`, `relevancy.bger.ch` or `bvger.weblaw.ch`. If the button does not appear there, the extension may be switched off: on the browser's extensions page (`chrome://extensions`, `brave://extensions`, `edge://extensions`, in Firefox `about:addons` or `about:debugging` for a temporary add-on) bger reader must be switched on. After switching the extension on or off and after an update, the decision page must be reloaded once. In Chrome, Brave and Edge, the extension also disappears if the unpacked folder has been moved or deleted; then a fresh [Installation](EN-Installation.md) helps.

## I have ticked «einschalten» (switch on), but nothing happens

The extension changes only the paragraphs of the decision text. On a list of results on `search.bger.ch` or on the start page of the decisions database, only the colour scheme therefore takes effect; font and size become visible only on a decision page. If the background is set to «Weiss» (white) and the font to «System Serif», the difference from the original page is also small, because these are the default values: a different background or a larger font makes the reading mode visible immediately.

## On bvger.weblaw.ch the reading mode appears only after a delay

That is normal. The website of the Federal Administrative Court fetches the decision by program after the page has been opened, and the extension waits for it. As soon as the text is there, typography and brackets follow within an instant. When switching to another decision within the website, the same thing happens again. If the reading mode stays off permanently even though the decision is displayed, reloading the page helps; if this happens repeatedly, it is worth a bug report.

## After updating, my settings are gone

In Chrome, Brave and Edge, the browser recognises an unpacked extension by its folder. If the new version was unpacked into a different folder and loaded from there, it counts as a new extension with fresh storage. Remedy: remove the old extension, unpack the new version into the previous folder and load that folder, or set the settings again once. From the approval in the store onwards, this problem no longer arises, because the store recognises the extension by its fixed identifier.

## In Firefox the extension has disappeared after a restart

Firefox loads unsigned extensions only as a temporary add-on, which disappears when the browser is closed, and the settings are usually lost in the process. This is a property of Firefox, not a bug in the extension. Until the approval in the store, the extension must be reloaded via `about:debugging` after every start; the steps are described under [Installation](EN-Installation.md).

## Chrome warns at startup about extensions in developer mode

Chrome shows this message for every extension that does not come from the Chrome Web Store. It does not mean that something is dangerous, only that the extension was loaded by hand. The message can be dismissed and disappears as soon as the extension is installed from the store.

## A bracket that is not a citation was collapsed, or a citation stayed open

The rules are described on [Collapsing brackets](EN-Brackets.md), and that page also explains how to report a wrongly handled case. Immediate help comes from the toggle button `▸`, with which every bracket can be opened individually, or from removing the tick at **einfach** (simple), which leaves all brackets open. A reported case is added as a test case.

## The chosen font does not look any different

Some fonts differ only slightly, for instance Liberation Serif from System Serif, because both are Times-like. The drop-down list shows every font in its own shape; on Firefox under macOS this applies only to the closed state of the list. The difference is clearest with Atkinson Hyperlegible, OpenDyslexic and Comic Neue. If the text remains unchanged despite choosing one of these fonts, the **einschalten** tick was probably not set, or the page is not a decision page.

## With a dark background, part of the page stays white

Input fields, drop-down lists and buttons of the court website deliberately stay light so that they remain recognisable and usable. The yellow search-hit highlights also keep their colour. If, however, a larger area next to or below the decision stays white, that is a bug that should be reported, stating the address and the browser.

## Does the extension work offline?

The extension itself never needs an internet connection; it downloads nothing afterwards, not even fonts. The decision page, however, has to be loaded from the court, and for that a connection is needed as with any website. A page that has already been loaded can then be read with the extension even without a connection.

## Does the extension change the decision or the court's website?

No. The extension changes only the display in your own browser, and only for as long as the reading mode is switched on. The text is neither shortened nor added to, and the court's website learns nothing of the extension. Details under [Privacy and security](EN-Privacy.md).

## Can I print the decision with collapsed brackets?

When printing and when saving as PDF via the print dialog, all brackets are output in full and the toggle buttons are omitted. A printout is therefore always complete. Font and colour scheme are printed as well; for black on white, choose the «Weiss» background beforehand.

## Which languages is the extension intended for?

The extension works with German, French and Italian decisions; the bracket rules know the citation styles of all three languages, and the hyphenation follows the language of the decision. The user interface itself is in German.

## Is the extension available for smartphones or tablets?

Chrome, Brave and Edge on smartphones do not support extensions. Firefox on Android can install extensions from the store; bger reader has not been tested there and will only become available at all after the approval in the store. On a tablet with a desktop browser the extension should work, but it has not been tested there either.

## Can I use the extension in Safari?

No. Safari requires a specially packaged program that is distributed via Apple; this is not planned for this project.

## Are my settings synchronised between devices?

No. The settings are held exclusively in the extension's local storage on the respective device and are not synchronised with an account. On a second device they have to be set again once.

## How do I find out which version is installed?

On the browser's extensions page, the version number is shown next to the name «BGer Reader», in Chrome after a click on «Details». The latest published version is on the [Releases page](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases), and the [changelog](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/CHANGELOG.md) describes what has changed from version to version.

## How do I report a bug or a request?

Via the project's [Issues](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) on GitHub; a free GitHub account is needed for this. A good report contains the address of the affected decision, the browser including its version, the version of the extension, the settings concerned and a description of what was expected and what happened instead. A screenshot often helps. Please do not report security problems publicly, but as described under [Privacy and security](EN-Privacy.md).

[Deutsch](DE-Installation.md) · **English** · [Français](FR-Installation.md) · [Italiano](IT-Installazione.md)

<!-- Do not edit here in the wiki: the source is the file wiki/EN-Installation.md in the repository, and the workflow overwrites the wiki on every push. The German page wiki/DE-Installation.md is the master: make content changes there first, then carry them into this translation. -->

This page describes how bger reader is downloaded and set up in the individual browsers. The route via the release package takes a little longer than a click in the browser store, but it is quite manageable; it remains the standard route until the extension has been approved in the stores.

## Requirements

The extension runs in **Chrome, Brave and Edge from version 121** and in **Firefox from version 140**. Older browsers refuse the installation. The version of your own browser is shown in the menu under «About Chrome» or «About Firefox»; current browsers are well beyond these minimum versions. Smartphone browsers are not supported, see [FAQ](EN-FAQ.md).

## Downloading the package

All versions are on the project's [Releases page](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases). The topmost entry is the latest version. Under «Assets» there are two files: the actual package `bger-reader-<Version>.zip` (around 250 KB) and next to it a small file with the ending `.sha256`, which contains a checksum (more on this below). The package contains only the extension itself, no test files and no tools.

Please always use the ZIP from the Releases page and not the green «Code → Download ZIP» button on the front page of the repository. That button downloads the whole project including tests and tools, and the file always has the same name, so the version cannot be recognised.

After downloading, the ZIP is unpacked. On Windows, a right-click on the file and «Extract All…» is enough, on macOS a double-click. This creates a folder that contains, among other things, the file `manifest.json` and the subfolders `fonts` and `icons`. This folder should be kept in a place where it can stay permanently, for example in the Documents folder, because Chrome, Brave and Edge read the extension directly from this folder every time they start. If it is moved or deleted, the extension disappears.

## Chrome, Brave and Edge

The three browsers share the same technology and differ only in the address of the extensions page.

1. Open the extensions page: type `chrome://extensions` in Chrome, `brave://extensions` in Brave or `edge://extensions` in Edge into the address bar and press Enter.
2. Switch on **Developer mode**. In Chrome and Brave this is a switch at the top right, in Edge a switch in the left column.
3. Click **Load unpacked**.
4. Select the unpacked folder, that is the folder containing the file `manifest.json`, and confirm.
5. bger reader now appears in the list of extensions and is switched on.

After a restart, Chrome may show a notice that extensions are running in developer mode. This happens with all extensions that do not come from the store and can be dismissed with a click. To keep the extension's icon permanently visible in the toolbar, click the puzzle-piece icon to the right of the address bar and then the pin next to «BGer Reader»; a click on the icon later opens the settings in a separate window.

## Firefox

Firefox installs extensions permanently only if they are signed by Mozilla, which happens with the approval in the store. Until then, bger reader can be loaded in Firefox as a **temporary add-on**. This works fully, but only until the browser is next closed; after that the extension must be loaded again, and the saved settings are usually lost in the process.

1. Type `about:debugging#/runtime/this-firefox` into the address bar and press Enter.
2. Click **Load Temporary Add-on…**.
3. Select the downloaded file `bger-reader-<Version>.zip`. Unpacking is not necessary in Firefox; alternatively, the file `manifest.json` from the unpacked folder can be selected.
4. bger reader appears in the list of temporary extensions.

Anyone using the Developer Edition or Nightly of Firefox can switch off the signature requirement in `about:config` by setting `xpinstall.signatures.required` to `false` and then install the ZIP permanently via `about:addons` and «Install Add-on From File…». This is not possible in the regular version of Firefox. As soon as the extension has been approved in the store, the direct link will be added here.

## Checking the checksum (optional)

Next to every package on the Releases page there is a file `bger-reader-<Version>.zip.sha256`. It contains a long string of characters, the so-called SHA-256 checksum. This string is as unique to the file as a fingerprint: anyone who calculates the checksum of the downloaded package themselves and compares it with the published one knows for certain, if the two match, that the file has arrived unchanged and complete. The package is built in the project's automated release process directly from the tested source code, and the checksum is created there as well.

The calculation is done in a terminal or in PowerShell, in each case in the folder where the ZIP is located:

```
# macOS
shasum -a 256 bger-reader-0.9.1.zip

# Linux
sha256sum bger-reader-0.9.1.zip

# Windows (PowerShell)
Get-FileHash .\bger-reader-0.9.1.zip -Algorithm SHA256
```

The string that is output must match the content of the `.sha256` file; upper and lower case do not matter. This step is voluntary and not needed for operation.

## Updating

A new version is published on the Releases page; the browser does not report it by itself as long as the extension does not come from the store. To update in Chrome, Brave and Edge, download the new ZIP and unpack it **into the same folder** as before, so that the old files are replaced. Then a click on the reload icon (circular arrow) next to bger reader on the extensions page, or on «Update» at the top, is enough. The same folder is important: the browser recognises an unpacked extension by its location. If the new version is loaded from a different folder, it counts as a new extension, and the saved settings start again from the default values.

In Firefox, the temporary add-on is reloaded at every start anyway; there, simply choose the new ZIP.

## Removing

In Chrome, Brave and Edge, the extension is deleted on the extensions page with «Remove»; afterwards the unpacked folder can be deleted as well. The saved settings are removed together with the extension. In Firefox, a temporary add-on disappears when the browser is closed or via «Remove» on the `about:debugging` page.

The court websites themselves are not changed by installing or removing; the extension acts only on the display in your own browser.

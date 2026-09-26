#!/usr/bin/env node
/* Rendert die Promo-Bilder der Stores aus vorlage.html – mit Playwright in
 * Chromium, pixelgenau in den von den Stores verlangten Grössen.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):   node store/promo/render.js
 * Voraussetzung wie beim Smoke-Test (test/browser-umgebung.js):
 *   cd test && npm install --no-save jsdom@30.1.0 playwright@1.56.1 && npx playwright install chromium
 *
 * Ergebnis (in diesem Ordner):
 *   kachel-klein-440x280.png      Chrome Web Store: kleine Promo-Kachel (Pflicht); Edge optional
 *   kachel-marquee-1400x560.png   Chrome Web Store: Marquee (fürs Featuring); Edge optional
 *   logo-300x300.png              Edge Add-ons: Store-Logo (mindestens 128 x 128)
 * PNG ohne Alphakanal (Chrome verlangt 24-bit PNG oder JPEG), erzeugt aus
 * Vektoren – nie ein hochskaliertes icon128.png (STARTPROMPT Regel 8).
 */
'use strict';
const path = require('path');
const fs = require('fs');

const WURZEL = path.join(__dirname, '..', '..');
const { chromium } = require(path.join(WURZEL, 'test', 'node_modules', 'playwright'));
const VORLAGE = 'file://' + path.join(__dirname, 'vorlage.html');

const BILDER = [
  { datei: 'kachel-klein-440x280.png',          hash: 'klein',          b: 440,  h: 280 },
  { datei: 'kachel-marquee-1400x560.png',       hash: 'marquee',        b: 1400, h: 560 },
  { datei: 'logo-300x300.png',                  hash: 'logo',           b: 300,  h: 300 }
];

/* PNG-Kopf lesen: Breite, Höhe, Farbtyp (2 = RGB ohne Alpha, 6 = RGBA). */
function pngInfo(datei) {
  const d = fs.readFileSync(datei);
  return { breite: d.readUInt32BE(16), hoehe: d.readUInt32BE(20), farbtyp: d[25] };
}

(async function () {
  // chromiumSandbox: false – läuft auch als root (Container); sonst wie der Smoke-Test.
  const browser = await chromium.launch({ chromiumSandbox: false, executablePath: process.env.BGER_CHROMIUM || undefined });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  let fehler = 0;
  for (const b of BILDER) {
    const ziel = path.join(__dirname, b.datei);
    await page.setViewportSize({ width: b.b, height: b.h });
    // Über about:blank, damit jedes Bild die Vorlage frisch lädt (ein blosser
    // Hash-Wechsel wäre eine Navigation im selben Dokument).
    await page.goto('about:blank');
    await page.goto(VORLAGE + '#' + b.hash, { waitUntil: 'load' });
    await page.evaluate(function () { return document.fonts.ready; });
    await page.screenshot({ path: ziel, clip: { x: 0, y: 0, width: b.b, height: b.h }, omitBackground: false });
    const info = pngInfo(ziel);
    const ok = info.breite === b.b && info.hoehe === b.h && info.farbtyp === 2;
    if (!ok) fehler++;
    console.log((ok ? '  ✅ ' : '  ❌ ') + b.datei + ' ' + info.breite + ' x ' + info.hoehe + (info.farbtyp === 2 ? ' RGB' : ' Farbtyp ' + info.farbtyp));
  }
  await browser.close();
  process.exit(fehler ? 1 : 0);
})().catch(function (e) {
  console.error('❌ Rendern abgebrochen: ' + (e && e.stack || e));
  process.exit(1);
});

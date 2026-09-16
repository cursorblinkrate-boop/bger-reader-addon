/* Render-Harness für den BGer Reader – echte PNG-Screenshots der Fixtures
 * in allen Farbschemata (zum manuellen Sichten, nicht Teil des Test-Runs).
 *
 * Aufruf: node test/render-check.js
 *
 * Ablauf:
 *   1. Site-CSS lokal halten: die zum Fixture passenden CSS-Dateien
 *      (layout/typography/design/highlight.css, aus den <link>-Tags der
 *      Fixtures abgeleitet) nach test/fixtures/css/<familie>/ laden.
 *      Vorhandene Dateien werden nicht erneut geladen (Cache).
 *      404/Fehler -> Warnung, mit vorhandenen Dateien weiterarbeiten.
 *   2. Pro Fixture x Farbschema: jsdom mit vorbefülltem localStorage
 *      (aktiv + Schema), content.js eval'en, Site-CSS als <style> an den
 *      Anfang von <head> (Site zuerst, Extension danach mit !important –
 *      realistische Kaskade), Test-Markierung (exact_match mit Link)
 *      einbauen, Panel-Host entfernen, HTML nach test/render/ schreiben.
 *   3. Chrome headless rendert jede HTML-Datei als PNG.
 * Skript ist idempotent: test/render wird zu Beginn geleert.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const CSS_DIR = path.join(__dirname, 'fixtures', 'css');
const RENDER_DIR = path.join(__dirname, 'render');
const CONTENT_JS = path.join(ROOT, 'extension', 'content.js');
const SCRIPT = fs.readFileSync(CONTENT_JS, 'utf8');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SPEICHER_SCHLUESSEL = 'bger-reader-einstellungen-v2';
const SCHEMATA = ['hell', 'sepia', 'dunkel', 'kontrast', 'nacht'];
const CSS_DATEIEN = ['layout.css', 'typography.css', 'design.css', 'highlight.css'];

// Tatsächliche Stylesheet-URLs aus den <link>-Tags der Fixtures:
// bger_test -> clir auf search.bger.ch, bger_aza -> aza auf search.bger.ch,
// bger_relevancy -> clir-Pfade auf relevancy.bger.ch (Fallback: clir auf
// search.bger.ch, gleiche Dateien).
const FIXTURES = [
  {
    name: 'bger_test',
    datei: path.join(__dirname, 'fixtures', 'bger_test.html'),
    url: 'https://search.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?type=show_document',
    cssFamilie: 'clir',
    cssBasis: ['https://search.bger.ch/ext/eurospider/live/de/php/clir/http/css/']
  },
  {
    name: 'bger_aza',
    datei: path.join(__dirname, 'fixtures', 'bger_aza.html'),
    url: 'https://search.bger.ch/ext/eurospider/live/de/php/aza/http/index.php?type=show_document',
    cssFamilie: 'aza',
    cssBasis: ['https://search.bger.ch/ext/eurospider/live/de/php/aza/http/css/']
  },
  {
    name: 'bger_relevancy',
    datei: path.join(__dirname, 'fixtures', 'bger_relevancy.html'),
    url: 'http://relevancy.bger.ch/php/clir/http/index.php?type=show_document',
    cssFamilie: 'relevancy',
    cssBasis: [
      'http://relevancy.bger.ch/php/clir/http/css/',
      'https://search.bger.ch/ext/eurospider/live/de/php/clir/http/css/' // Fallback
    ]
  }
];

const warnungen = [];

/* ---------- 1. Site-CSS lokal halten ---------- */

async function ladeCss() {
  for (const f of FIXTURES) {
    const zielDir = path.join(CSS_DIR, f.cssFamilie);
    fs.mkdirSync(zielDir, { recursive: true });
    for (const datei of CSS_DATEIEN) {
      const ziel = path.join(zielDir, datei);
      if (fs.existsSync(ziel)) continue; // Cache
      let geladen = false;
      for (const basis of f.cssBasis) {
        const quelle = basis + datei;
        try {
          const res = await fetch(quelle, { redirect: 'follow' });
          const text = res.ok ? await res.text() : '';
          // Error-Pages der Site kommen als HTML mit 200 zurueck.
          if (!res.ok || /^\s*<!doctype html|^\s*<html/i.test(text)) {
            warnungen.push('CSS nicht ladbar (' + res.status + '): ' + quelle);
            continue;
          }
          fs.writeFileSync(ziel, text);
          console.log('  geladen: ' + f.cssFamilie + '/' + datei + ' <- ' + quelle);
          geladen = true;
          break;
        } catch (e) {
          warnungen.push('CSS-Fehler (' + e.message + '): ' + quelle);
        }
      }
      if (!geladen) warnungen.push('fehlend: ' + f.cssFamilie + '/' + datei + ' (alle Basen fehlgeschlagen)');
    }
  }
}

function cssTexteFuer(familie) {
  const dir = path.join(CSS_DIR, familie);
  let css = '';
  CSS_DATEIEN.forEach(function (datei) {
    const p = path.join(dir, datei);
    if (fs.existsSync(p)) css += fs.readFileSync(p, 'utf8') + '\n';
  });
  return css;
}

/* ---------- 2. Fixture mit Extension + Site-CSS serialisieren ---------- */

function baueRenderHtml(fixture, schema) {
  const html = fs.readFileSync(fixture.datei, 'utf8');
  const dom = new JSDOM(html, {
    url: fixture.url,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const win = dom.window;
  const doc = win.document;

  // Einstellungen vorbefüllen: Lesemodus an, Schema, Klammern an.
  // (kein chrome/browser im jsdom -> content.js nutzt den localStorage-Fallback)
  win.localStorage.setItem(SPEICHER_SCHLUESSEL,
    JSON.stringify({ aktiv: true, farbschema: schema, klammern: true }));
  win.eval(SCRIPT);

  // Site-CSS an den ANFANG von <head>: Site zuerst, unser #bkl-style danach.
  const siteCss = cssTexteFuer(fixture.cssFamilie);
  if (siteCss) {
    const stil = doc.createElement('style');
    stil.id = 'bkl-test-sitecss';
    stil.textContent = siteCss;
    doc.head.insertBefore(stil, doc.head.firstChild);
  } else {
    warnungen.push('kein Site-CSS für ' + fixture.name + ' (' + fixture.cssFamilie + ')');
  }

  // Test-Markierung: gelbe Site-Markierung mit verschachteltem Link +
  // ein normaler Link zum Vergleich (Highlight-Schutz muss sichtbar greifen).
  const eit = doc.querySelector('div.eit');
  const absatzKlasse = doc.querySelector('div.paraatf') ? 'paraatf' : 'para';
  const testAbsatz = doc.createElement('div');
  testAbsatz.className = absatzKlasse;
  testAbsatz.innerHTML = 'Testmarkierung BGer Reader: <span class="exact_match">Trefferwort mit ' +
    '<a href="#markierter-link">markiertem Link</a> darin</span> – und ein ' +
    '<a href="#normaler-link">normaler Link</a> ausserhalb der Markierung.';
  if (eit) eit.appendChild(testAbsatz);

  // Panel (Shadow DOM) ist separat getestet und wuerde im statischen
  // Screenshot fehlen – Host beim Serialisieren entfernen.
  const host = doc.getElementById('bkl-panel-host');
  if (host) host.parentNode.removeChild(host);

  return '<!doctype html>\n' + doc.documentElement.outerHTML;
}

/* ---------- 3. Chrome headless rendern ---------- */

function rendere(htmlPfad, pngPfad) {
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--screenshot=' + pngPfad,
    '--window-size=1400,2600',
    '--hide-scrollbars',
    'file://' + htmlPfad
  ], { timeout: 90000, stdio: 'pipe' });
}

/* ---------- Main ---------- */

(async function () {
  if (!fs.existsSync(CHROME)) {
    console.error('Chrome nicht gefunden: ' + CHROME);
    process.exit(1);
  }

  console.log('[1] Site-CSS lokal halten (' + CSS_DIR + ')');
  await ladeCss();

  console.log('\n[2] Fixtures rendern (' + FIXTURES.length + ' x ' + SCHEMATA.length + ' Schemata)');
  fs.rmSync(RENDER_DIR, { recursive: true, force: true }); // idempotent: leeren
  fs.mkdirSync(RENDER_DIR, { recursive: true });

  const pngs = [];
  for (const fixture of FIXTURES) {
    for (const schema of SCHEMATA) {
      const basis = fixture.name + '-' + schema;
      const htmlPfad = path.join(RENDER_DIR, basis + '.html');
      const pngPfad = path.join(RENDER_DIR, basis + '.png');
      try {
        fs.writeFileSync(htmlPfad, baueRenderHtml(fixture, schema));
        rendere(htmlPfad, pngPfad);
        pngs.push(pngPfad);
        console.log('  ✅ ' + basis + '.png');
      } catch (e) {
        warnungen.push('Render fehlgeschlagen: ' + basis + ' (' + e.message.slice(0, 200) + ')');
        console.log('  ❌ ' + basis + ': ' + e.message.slice(0, 120));
      }
    }
  }

  console.log('\n[3] Ergebnis: ' + pngs.length + ' PNGs in ' + RENDER_DIR);
  pngs.forEach(function (p) {
    console.log('  ' + path.basename(p) + '  ' + Math.round(fs.statSync(p).size / 1024) + ' KB');
  });
  if (warnungen.length) {
    console.log('\nWarnungen:');
    warnungen.forEach(function (w) { console.log('  ⚠️  ' + w); });
  }
  process.exit(pngs.length === FIXTURES.length * SCHEMATA.length ? 0 : 1);
})().catch(function (e) { console.error(e); process.exit(1); });

#!/usr/bin/env node
/* Screenshots für Store und Doku: jede Funktion der Extension einmal im Bild,
 * in echtem Chromium, Edge oder Firefox, auf den lokal ausgelieferten echten
 * Entscheidseiten (Aufbau: test/browser-umgebung.js).
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node tools/screenshots.js chromium|edge|firefox
 * Voraussetzungen wie beim Smoke-Test (test/browser-umgebung.js).
 *
 * Ergebnis: test/screenshots/<browser>/NN-name.png, dazu GALERIE.md mit
 * Bildunterschrift je Bild – die Vorlage für README und Store-Texte.
 * Beispiel-Entscheid: BGE 116 Ia 359, das Frauenstimmrecht-Urteil von 1990
 * (U.SEITEN.bge). Szenen mit store: true sind 1280 x 800 (Chrome Web Store
 * verlangt genau das), alle anderen 1280 x 2000 – ein bis zwei
 * Bildschirmseiten Fliesstext, damit sichtbar ist, ob Schrift, Abstände und
 * Hintergrund über den ganzen Text gleichmässig sind (STARTPROMPT Regel 10).
 * Jede Szene ist zu den Erwägungen gescrollt; nur Szenen mit kopf: true
 * zeigen den Urteilskopf. Das Panel ist fast überall geschlossen – nur der
 * pinke Knopf rechts oben ist zu sehen –, offen nur in den zwei
 * Panel-Bildern; das Einstellungsfenster hat sein eigenes Bild. Grundschrift
 * der Funktionsbilder: OpenDyslexic. In der CI liegt alles als Artefakt
 * "screenshots-<os>-<browser>" beim Lauf.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const U = require('../test/browser-umgebung.js');

const BROWSER = process.argv[2];
if (U.BROWSER_NAMEN.indexOf(BROWSER) === -1) {
  console.error('Aufruf: node tools/screenshots.js ' + U.BROWSER_NAMEN.join('|'));
  process.exit(2);
}
const AUSGABE = path.join(U.WURZEL, 'test', 'screenshots', BROWSER);
const Q = U.Q;

/* Bedienelement je Einstellung: wie im Panel (content.js), Werte wie STANDARDS. */
const BEDIENUNG = {
  aktiv:            { id: 'bkl-aktiv',         art: 'haekchen' },
  schriftgroesse:   { id: 'bkl-groesse',       art: 'input' },
  schriftart:       { id: 'bkl-art',           art: 'change' },
  schriftstaerke:   { id: 'bkl-staerke',       art: 'change',   erweitert: true },
  zeilenabstand:    { id: 'bkl-zeilenabstand', art: 'input',    erweitert: true },
  absatzabstand:    { id: 'bkl-absatz',        art: 'input',    erweitert: true },
  buchstabenabstand:{ id: 'bkl-buchstaben',    art: 'input',    erweitert: true },
  wortabstand:      { id: 'bkl-worte',         art: 'input',    erweitert: true },
  zeilenlaenge:     { id: 'bkl-laenge',        art: 'input',    erweitert: true },
  spaltenbreite:    { id: 'bkl-spalte',        art: 'input' },
  silbentrennung:   { id: 'bkl-silben',        art: 'haekchen', erweitert: true },
  farbschema:       { id: 'bkl-farbe',         art: 'change' },
  klammern:         { id: 'bkl-klammern',      art: 'haekchen' },
  ausrichtung:      { id: 'bkl-ausrichtung',   art: 'change',   erweitert: true },
  spalten:          { id: 'bkl-spalten',       art: 'change',   erweitert: true }
};

/* Die Szenen. e = Einstellungen zusätzlich zu Lesemodus an + OpenDyslexic
   (schriftart-Szenen setzen ihre eigene Schrift). store = 1280 x 800 für den
   Chrome Web Store (sonst 1280 x 2000). kopf = Urteilskopf statt Erwägungen.
   panelAuf = Panel im Bild offen (sonst geschlossen, nur der pinke Knopf). */
const SZENEN = [
  { datei: '01-vor-dem-einschalten', titel: 'Vor dem Einschalten',
    text: 'Die Entscheidseite wie gewohnt. Neu ist nur der pinke Knopf rechts oben; er öffnet die Einstellungen.',
    e: { aktiv: false }, store: true, kopf: true },
  { datei: '02-panel', titel: 'Das Panel',
    text: 'Ein Klick auf den pinken Knopf öffnet das Panel: Einschalten, Schriftgrösse, Schriftart, Hintergrund, Textbreite und „einfach" (Klammern einklappen).',
    e: {}, panelAuf: true, store: true, kopf: true },
  { datei: '03-panel-erweitert', titel: 'Das Panel, erweitert',
    text: 'Unter „erweitert": Schriftstärke, Zeilen-, Absatz-, Buchstaben- und Wortabstand, Zeilenlänge, Silbentrennung, Ausrichtung, Spalten, Zurücksetzen.',
    e: {}, panelAuf: true, erweitert: true, store: true, kopf: true },

  { datei: '10-schrift-atkinson', titel: 'Schriftart Atkinson Hyperlegible', text: 'Vom Braille Institute für gute Lesbarkeit entworfen: Buchstaben, die sich deutlich unterscheiden.', e: { schriftart: 'atkinson' } },
  { datei: '11-schrift-luciole', titel: 'Schriftart Luciole', text: 'Für sehbehinderte Menschen entwickelte Schrift (CTRDV, Frankreich).', e: { schriftart: 'luciole' } },
  { datei: '12-schrift-opendyslexic', titel: 'Schriftart OpenDyslexic', text: 'Schrift für Menschen mit Lese-Rechtschreib-Schwäche: schwere Fussenden geben den Buchstaben Halt.', e: { schriftart: 'opendyslexic' }, store: true },
  { datei: '13-schrift-comic-neue', titel: 'Schriftart Comic Neue', text: 'Locker und offen, für manche Leserinnen und Leser die angenehmste Schrift.', e: { schriftart: 'comicneue' } },
  { datei: '14-schrift-eb-garamond', titel: 'Schriftart EB Garamond', text: 'Klassische Buchschrift für langes Lesen.', e: { schriftart: 'garamond' } },
  { datei: '15-schrift-liberation-sans', titel: 'Schriftart Liberation Sans', text: 'Serifenlose Schrift, Arial-ähnlich, gebündelt und damit auf jedem Rechner gleich.', e: { schriftart: 'liberation-sans' } },
  { datei: '16-schrift-liberation-serif', titel: 'Schriftart Liberation Serif', text: 'Serifenschrift, Times-ähnlich, gebündelt.', e: { schriftart: 'liberation-serif' } },

  { datei: '20-hintergrund-sepia', titel: 'Hintergrund Sepia', text: 'Warmer Papierton, weniger Blendung als Weiss.', e: { farbschema: 'sepia' }, store: true },
  { datei: '21-hintergrund-dunkel', titel: 'Hintergrund Dunkel', text: 'Helle Schrift auf dunklem Grund.', e: { farbschema: 'dunkel' } },
  { datei: '22-hintergrund-kontrast', titel: 'Hintergrund Hoher Kontrast', text: 'Weiss auf Schwarz, gelbe Links: maximaler Kontrast.', e: { farbschema: 'kontrast' } },
  { datei: '23-hintergrund-nacht', titel: 'Hintergrund Nacht', text: 'Rötlich abgedunkelt für das Lesen am Abend.', e: { farbschema: 'nacht' }, store: true },

  { datei: '30-schriftgroesse', titel: 'Schriftgrösse', text: 'Stufenlos von 6 bis 50 Pixel, hier 24.', e: { schriftgroesse: 24 } },
  { datei: '31-schriftstaerke-fett', titel: 'Schriftstärke fett', text: 'Der ganze Entscheid in fetter Schrift.', e: { schriftstaerke: 'fett' } },
  { datei: '32-zeilenabstand', titel: 'Zeilenabstand', text: 'Faktor 1 bis 2,5, hier 2: mehr Luft zwischen den Zeilen.', e: { zeilenabstand: 2 } },
  { datei: '33-absatzabstand', titel: 'Absatzabstand', text: 'Zusätzlicher Abstand nach jedem Absatz, hier 1 Schrifthöhe.', e: { absatzabstand: 1 } },
  { datei: '34-buchstaben-und-wortabstand', titel: 'Buchstaben- und Wortabstand', text: 'Buchstaben 1 Pixel, Wörter 4 Pixel weiter auseinander.', e: { buchstabenabstand: 1, wortabstand: 4 } },
  { datei: '35-zeilenlaenge', titel: 'Zeilenlänge', text: 'Zeilen auf 60 Zeichen begrenzt: das Auge findet leichter zur nächsten Zeile.', e: { zeilenlaenge: 60 } },
  { datei: '36-textbreite', titel: 'Textbreite', text: 'Die Spalte des Entscheids breiter oder schmaler, hier 900 Pixel statt 625.', e: { spaltenbreite: 900 } },
  { datei: '37-blocksatz-silbentrennung', titel: 'Blocksatz mit Silbentrennung', text: 'Ausrichtung Blocksatz und Silbentrennung in der Sprache des Entscheids.', e: { ausrichtung: 'blocksatz', silbentrennung: true } },
  { datei: '38-zwei-spalten', titel: 'Zwei Spalten', text: 'Zeitungssatz: der Entscheid in zwei Spalten.', e: { spalten: 2 } },
  { datei: '39-drei-spalten', titel: 'Drei Spalten', text: 'Drei Spalten, mit Textbreite 1200 sinnvoll.', e: { spalten: 3, spaltenbreite: 1200 } },
  { datei: '40-klammern-einfach', titel: '„einfach": Fundstellen eingeklappt', text: 'Klammern mit Rechtsprechung und Literatur sind zu einem Pfeil eingeklappt. Gesetzesverweise und Entscheidtext bleiben offen.', e: {}, store: true },
  { datei: '41-klammer-aufgeklappt', titel: 'Eine Klammer aufgeklappt', text: 'Ein Klick auf den Pfeil zeigt die Fundstelle, ein zweiter klappt sie wieder ein.', e: {}, foldAuf: true, store: true },
  { datei: '42-klammern-aus', titel: '„einfach" ausgeschaltet', text: 'Der Entscheid mit allen Klammern, wie im Original.', e: { klammern: false }, store: true },

  { datei: '50-popup', titel: 'Einstellungsfenster', text: 'Ein Klick auf das Extension-Symbol öffnet dieselben Einstellungen als eigenes Fenster; Änderungen wirken sofort auf der Seite.', popup: true },
  { datei: '60-uebersicht-opendyslexic-sepia', titel: 'Übersicht: OpenDyslexic auf Sepia', text: 'Ein bis zwei Bildschirmseiten Entscheid am Stück.', e: { farbschema: 'sepia' } },
  { datei: '61-uebersicht-atkinson-nacht', titel: 'Übersicht: Atkinson Hyperlegible auf Nacht', text: 'Ein bis zwei Bildschirmseiten Entscheid am Stück.', e: { schriftart: 'atkinson', farbschema: 'nacht' } },
  { datei: '62-uebersicht-zwei-spalten', titel: 'Übersicht: zwei Spalten', text: 'Zeitungssatz über eine ganze Bildschirmseite.', e: { spalten: 2, spaltenbreite: 1000 } },
  { datei: '70-druckansicht', titel: 'Druckansicht', text: 'Beim Drucken sind alle Klammern offen und die Pfeile weg.', e: {}, druck: true },
  { datei: '80-bundesverwaltungsgericht', titel: 'Bundesverwaltungsgericht', text: 'Auch auf bvger.weblaw.ch: Typografie und eingeklappte Fundstellen.', e: { farbschema: 'sepia' }, seite: 'bvger' },
  // BGE 145 I 207 (Aufhebung der Abstimmung über die Heiratsstrafe-Initiative, 2019): französischsprachiger Entscheid auf der französischen Seite
  { datei: '90-franzoesisch-regeste', titel: 'Französische Seite', text: 'BGE 145 I 207, die Aufhebung der Volksabstimmung über die Heiratsstrafe-Initiative (2019): ein französischsprachiger Entscheid auf der französischen Oberfläche von bger.ch.', e: {}, seite: 'bgeFr', store: true, kopf: true },
  { datei: '91-franzoesisch-atkinson-nacht', titel: 'Französische Seite, Atkinson auf Nacht', text: 'Derselbe Entscheid in Atkinson Hyperlegible auf dem Schema Nacht.', e: { schriftart: 'atkinson', farbschema: 'nacht' }, seite: 'bgeFr' },
  { datei: '92-franzoesisch-uebersicht-luciole-sepia', titel: 'Französische Seite, Übersicht in Luciole auf Sepia', text: 'Ein bis zwei Bildschirmseiten mit Regeste und Sachverhalt.', e: { schriftart: 'luciole', farbschema: 'sepia' }, seite: 'bgeFr' }
];

const Z = {
  foldAuf: `function () { const k = document.querySelector('.bkl-fold .bkl-toggle'); if (k) k.click(); }`,
  bvgerText: `function () { const b = document.querySelector('.bkl-text'); return !!b && b.querySelectorAll('p').length > 100; }`,
  detailsAuf: `function (an) {
    const s = document.getElementById('bkl-panel-host').shadowRoot;
    if (s.getElementById('bkl-details').hidden === an) s.getElementById('bkl-details-toggle').click();
  }`,
  panelAuf: `function (an) {
    const s = document.getElementById('bkl-panel-host').shadowRoot;
    const offen = !s.getElementById('bkl-panel').hidden;
    if (offen !== an) s.getElementById(an ? 'bkl-button' : 'bkl-schliessen').click();
  }`
};

async function einstellen(seite, e) {
  let erweitert = false;
  for (const k of Object.keys(e)) {
    const b = BEDIENUNG[k];
    if (!b) throw new Error('unbekannte Einstellung ' + k);
    if (b.erweitert) erweitert = true;
    if (b.art === 'haekchen') await seite.js(Q.panelHaekchen, { id: b.id, an: !!e[k] });
    else await seite.js(Q.panelWert, { id: b.id, wert: String(e[k]), ereignis: b.art });
  }
  return erweitert;
}

(async function () {
  const warnungen = [];
  U.fixturesPruefen(warnungen);
  fs.rmSync(AUSGABE, { recursive: true, force: true });
  fs.mkdirSync(AUSGABE, { recursive: true });
  const galerie = ['# Screenshots – ' + BROWSER, '',
    'Erzeugt von tools/screenshots.js auf der echten Entscheidseite von ' + U.ENTSCHEID_NAME + '. Store-Bilder 1280 x 800, alle anderen 1280 x 2000; jede Szene zeigt die Erwägungen, ausser sie ist als Urteilskopf gekennzeichnet.', ''];
  let anzahl = 0;

  const server = await U.serverStarten();
  const b = await U.browserStarten(BROWSER);
  const s = b.hauptseite;
  try {
    await s.oeffne(U.SEITEN.bge);
    if (!await U.warteBis(s, Q.bereit, null, 20000)) throw new Error('Extension auf der BGE-Seite nicht bereit');
    console.log('Browser: ' + (await s.js(Q.status)).ua);
    let aktuelleSeite = 'bge';

    for (const sz of SZENEN) {
      const ziel = path.join(AUSGABE, sz.datei + '.png');
      try {
        // Seite wechseln, wenn die Szene eine andere braucht (bge, bgeFr, bvger)
        const seite = sz.seite || 'bge';
        if (!sz.popup && seite !== aktuelleSeite) {
          await s.oeffne(U.SEITEN[seite]);
          if (seite === 'bvger' && !await U.warteBis(s, Z.bvgerText, null, 60000)) {
            warnungen.push(sz.datei + ': bvger.weblaw.ch nicht vollständig geladen, übersprungen');
            await s.oeffne(U.SEITEN.bge); await U.warteBis(s, Q.bereit, null, 20000); aktuelleSeite = 'bge';
            continue;
          }
          if (!await U.warteBis(s, Q.bereit, null, 20000)) throw new Error('Extension auf ' + seite + ' nicht bereit');
          aktuelleSeite = seite;
        }
        if (sz.popup) {
          // Stand für das Fenster: OpenDyslexic, Sepia, Lesemodus an
          await s.js(Q.panelKlick, 'bkl-reset');
          await einstellen(s, { aktiv: true, schriftart: 'opendyslexic', farbschema: 'sepia' });
          const popup = await b.popupSeite();
          if (!popup) { warnungen.push(sz.datei + ': Pop-up-Seite in diesem Browser nicht automatisierbar'); continue; }
          await U.warteBis(popup, `function () { return document.body.hasAttribute('data-bereit'); }`, null, 10000);
          await popup.groesse(660, 860);
          await popup.js(`function () { if (document.activeElement) document.activeElement.blur(); }`);
          await popup.screenshot(ziel);
          await popup.schliessen();
        } else {
          if (sz.druck && !b.kannDruck) { warnungen.push(sz.datei + ': Druckansicht in diesem Browser nicht steuerbar'); continue; }
          // Bedienelemente reagieren auch bei geschlossenem Panel auf die
          // synthetischen Ereignisse; geöffnet wird es nur fürs Bild.
          await s.js(Q.panelKlick, 'bkl-reset');
          const e = Object.assign({ aktiv: true, schriftart: 'opendyslexic' }, sz.e || {});
          await einstellen(s, e);
          await s.js(Z.detailsAuf, !!sz.erweitert);
          await s.js(Z.panelAuf, !!sz.panelAuf);
          if (sz.foldAuf) await s.js(Z.foldAuf);
          if (sz.druck) await s.druck(true);
          await s.groesse(U.BREITE, sz.store ? U.HOEHE : U.HOCH);
          await U.schlaf(seite === 'bvger' ? 1500 : 400); // Schriften, Spaltenumbruch
          await s.js(Q.fokusWeg);
          await s.js(sz.kopf ? Q.zumKopf : Q.zumText);
          await s.screenshot(ziel);
          if (sz.druck) await s.druck(false);
        }
        anzahl++;
        console.log('  ✅ ' + sz.datei);
        galerie.push('## ' + sz.titel + (sz.store ? ' (Store-Format 1280 x 800)' : '') + (sz.kopf ? ' – Urteilskopf' : ''), '', '![' + sz.titel + '](' + sz.datei + '.png)', '', sz.text, '');
      } catch (e) {
        warnungen.push(sz.datei + ': ' + String(e && e.message || e).slice(0, 160));
        console.log('  ❌ ' + sz.datei + ': ' + String(e && e.message || e).slice(0, 120));
      }
    }
  } finally {
    try { await b.schliessen(); } catch (e) { /* Browser ist schon weg */ }
    server.schliessen();
  }

  fs.writeFileSync(path.join(AUSGABE, 'GALERIE.md'), galerie.join('\n'), 'utf8');
  console.log('\n' + anzahl + ' Bilder in ' + AUSGABE + ' (GALERIE.md mit Bildunterschriften)');
  if (warnungen.length) {
    console.log('\nHinweise:');
    warnungen.forEach(function (w) { console.log('  ⚠️  ' + w); });
  }
  process.exit(anzahl >= SZENEN.length - 3 ? 0 : 1); // bvger, Druck und Pop-up dürfen fehlen
})().catch(function (e) {
  console.error('\n❌ Screenshots abgebrochen: ' + (e && e.stack || e));
  process.exit(1);
});

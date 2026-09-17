// ==UserScript==
// @name         BGer Reader – Lesemodus für search.bger.ch
// @name:de      BGer Reader – Lesemodus für search.bger.ch
// @namespace    https://github.com/cursorblinkrate-boop/bger-reader
// @version      2.1.0
// @description  Accessibility Layer für Entscheide des Schweizerischen Bundesgerichts: Typografie und Farben anpassbar, Absätze bleiben erhalten, wahrscheinliche Literaturklammern werden reversibel einklappbar.
// @author       cursorblinkrate-boop
// @match        https://search.bger.ch/*
// @match        https://relevancy.bger.ch/*
// @match        http://relevancy.bger.ch/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * BGer Reader – unabhängiger Prototyp, nicht mit dem Schweizerischen Bundesgericht verbunden.
 *
 * Architektur:
 *   1. Kernlogik (BGerReader): reine DOM-Funktionen ohne Tampermonkey-Abhängigkeit –
 *      Bracket-Stack über Textknoten, konservative Literatur-Heuristik, Range-basiertes
 *      Ein-/Ausklappen (reversibel, Links und Formatierungen bleiben erhalten).
 *   2. UI: Shadow-DOM-Panel (das Seiten-CSS kann es nicht zerstören und umgekehrt).
 *   3. Styles: nur per Klasse + CSS-Variablen auf dem Entscheidcontainer, keine Inline-Hacks.
 */

(function () {
  'use strict';

  /* ================================================================== */
  /* KERNLOGIK – unabhängig von der Userscript-Umgebung                   */
  /* ================================================================== */

  const BGerReader = (function () {

    /* ---------- Textknoten-Karte eines Blocks aufbauen ---------- */
    // Liefert den Gesamttext eines Blocks plus eine Zuordnung
    // Zeichenposition -> {node, offset}, auch über Inline-Links hinweg.

    function textKarteAufbauen(block) {
      const knoten = [];
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.nodeValue) continue;
        const el = n.parentElement;
        if (el && el.closest('script, style')) continue;
        knoten.push(n);
      }
      let gesamt = '';
      const karte = [];
      knoten.forEach(function (k) {
        karte.push({ node: k, start: gesamt.length });
        gesamt += k.nodeValue;
      });
      return { knoten: knoten, karte: karte, gesamt: gesamt };
    }

    function positionZuKnoten(karte, pos) {
      if (!karte.length) return null;
      let lo = 0, hi = karte.length - 1, res = karte[0];
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (karte[mid].start <= pos) { res = karte[mid]; lo = mid + 1; }
        else { hi = mid - 1; }
      }
      const offset = pos - res.start;
      if (offset > res.node.nodeValue.length) return null; // ungültige Position
      return { node: res.node, offset: offset };
    }

    /* ---------- Klammern per Stack finden (verschachtelt-sicher) ---------- */

    function klammernFinden(text) {
      const stack = [];
      const ergebnis = [];
      for (let i = 0; i < text.length; i++) {
        const c = text.charAt(i);
        if (c === '(') {
          stack.push(i);
        } else if (c === ')') {
          if (!stack.length) continue; // unbalanciert: schliessende Klammer ignorieren
          const start = stack.pop();
          const tiefe = stack.length; // Verschachtelungstiefe NACH dem Pop
          ergebnis.push({
            start: start,
            end: i + 1,
            tiefe: tiefe,
            inhalt: text.slice(start + 1, i)
          });
        }
      }
      // Unbalancierte öffnende Klammern bleiben unbehandelt – Absichtlich konservativ.
      ergebnis.sort(function (a, b) { return a.start - b.start; });
      return ergebnis;
    }

    /* ---------- Konservative Literatur-Heuristik ---------- */
    // „Heuristisch und reversibel": lieber zu wenig als zu viel automatisch
    // einklappen. Jede Stelle bleibt einzeln manuell aufklappbar.

    const LITERATUR_SIGNALE = [
      /\bS\.\s*\d/i,                                  // S. 123
      /\bp{1,2}\.\s*\d/i,                             // p. 123 / pp. 123-128
      /\bpag\.\s*\d/i,                                // pag. 123
      /\bRz\.\s*\d/i,                                 // Randziffer
      /\bN\.\s*\d/i,                                  // Randnummer
      /\bin\s*:/i,                                    // in: Zeitschrift
      /\b(?:BGE|ATF)\s+\d{1,3}\s+[IVX]{1,4}\b/i,      // BGE 123 II 45 / ATF 143 IV 27
      /\bff\./i,                                      // „und folgende"
      /[A-ZÄÖÜ][A-Za-zäöüéèàä]*\s*\/\s*[A-ZÄÖÜ]/       // MEIER/BRUNNER
    ];

    function istWahrscheinlichLiteratur(klammerInhalt, mindestlaenge) {
      if (klammerInhalt.length < mindestlaenge) return false;
      return LITERATUR_SIGNALE.some(function (rx) { return rx.test(klammerInhalt); });
    }

    function sollEingeklapptWerden(klammerInhalt, modus, mindestlaenge) {
      if (modus === 'alle') return klammerInhalt.length >= mindestlaenge;
      return istWahrscheinlichLiteratur(klammerInhalt, mindestlaenge);
    }

    /* ---------- Ein-/Ausklappen (reversibel, formatierungserhaltend) ---------- */

    function pfeilAktualisieren(fold, knopf) {
      const offen = fold.classList.contains('bkl-offen');
      knopf.textContent = offen ? '▾' : '▸';
      knopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
    }

    function einzelnUmschalten(fold, knopf) {
      fold.classList.toggle('bkl-offen');
      pfeilAktualisieren(fold, knopf);
    }

    function alleUmschalten(oeffnen) {
      document.querySelectorAll('span.bkl-fold').forEach(function (fold) {
        fold.classList.toggle('bkl-offen', oeffnen);
        const k = fold.querySelector('.bkl-toggle');
        if (k) pfeilAktualisieren(fold, k);
      });
    }

    // Entfernt alle Wrapper und stellt den Original-DOM wieder her.
    function allesAufklappenUndEntfernen() {
      document.querySelectorAll('span.bkl-fold').forEach(function (fold) {
        const content = fold.querySelector('.bkl-fold-content');
        const eltern = fold.parentNode;
        if (!eltern) return;
        if (content) {
          while (content.firstChild) eltern.insertBefore(content.firstChild, fold);
        }
        eltern.removeChild(fold);
        if (eltern.normalize) eltern.normalize();
      });
    }

    /* ---------- Block verarbeiten ---------- */

    function blockVerarbeiten(block, modus, mindestlaenge) {
      const t = textKarteAufbauen(block);
      if (!t.gesamt || t.gesamt.length < mindestlaenge) return 0;

      const kandidaten = klammernFinden(t.gesamt).filter(function (k) {
        return sollEingeklapptWerden(k.inhalt, modus, mindestlaenge);
      });

      // Absteigend verarbeiten, damit frühere Positionen gültig bleiben.
      kandidaten.sort(function (a, b) { return b.start - a.start; });

      let anzahl = 0;
      kandidaten.forEach(function (k) {
        const von = positionZuKnoten(t.karte, k.start);
        const bis = positionZuKnoten(t.karte, k.end);
        if (!von || !bis) return;

        const range = document.createRange();
        try {
          range.setStart(von.node, von.offset);
          range.setEnd(bis.node, bis.offset);
        } catch (e) { return; } // ungültiger Range: überspringen (konservativ)

        const fold = document.createElement('span');
        fold.className = 'bkl-fold';

        const knopf = document.createElement('button');
        knopf.type = 'button';
        knopf.className = 'bkl-toggle';
        knopf.title = 'Klammerbemerkung ein-/ausklappen';
        knopf.setAttribute('aria-expanded', 'false');
        knopf.textContent = '▸';
        knopf.addEventListener('click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          einzelnUmschalten(fold, knopf);
        });

        const content = document.createElement('span');
        content.className = 'bkl-fold-content';
        content.appendChild(range.extractContents()); // verschiebt Inhalt mitsamt Links/Formatierung

        fold.appendChild(knopf);
        fold.appendChild(content);
        range.insertNode(fold);
        anzahl++;
      });
      return anzahl;
    }

    /* ---------- Öffentliche API ---------- */

    return {
      textKarteAufbauen: textKarteAufbauen,
      klammernFinden: klammernFinden,
      istWahrscheinlichLiteratur: istWahrscheinlichLiteratur,
      sollEingeklapptWerden: sollEingeklapptWerden,
      blockVerarbeiten: blockVerarbeiten,
      einzelnUmschalten: einzelnUmschalten,
      alleUmschalten: alleUmschalten,
      allesAufklappenUndEntfernen: allesAufklappenUndEntfernen
    };
  })();

  // Für Tests und zukünftige Erweiterungs-Verpackung verfügbar machen.
  window.BGerReader = BGerReader;

  /* ================================================================== */
  /* EINSTELLUNGEN                                                        */
  /* ================================================================== */

  const STORAGE_KEY = 'bger-reader-einstellungen-v2';

  const STANDARDS = {
    aktiv: false,               // Lesemodus ein/aus
    schriftgroesse: 18,         // px
    schriftart: 'serif',        // serif | sans
    schriftstaerke: 'normal',   // normal | fett
    zeilenabstand: 1.6,         // Faktor
    buchstabenabstand: 0,       // px
    wortabstand: 0,             // px
    zeilenlaenge: 0,            // 0 = unbegrenzt, sonst Zeichen (ch)
    spaltenbreite: 625,         // px – Breite der Haarlinien-Textspalte (Seiten-Standard: 625)
    silbentrennung: false,
    farbschema: 'hell',         // hell | sepia | dunkel | kontrast
    klammerModus: 'literatur',  // literatur (konservativ) | alle
    klammerMindestlaenge: 80    // Zeichen
  };

  let einstellungen = ladeEinstellungen();

  function ladeEinstellungen() {
    try {
      const gespeichert = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Object.assign({}, STANDARDS, gespeichert || {});
    } catch (e) {
      return Object.assign({}, STANDARDS);
    }
  }

  function speichereEinstellungen() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(einstellungen));
    } catch (e) { /* Speichern ist schön, aber nicht kritisch */ }
  }

  /* ================================================================== */
  /* CSS – nur Klasse + CSS-Variablen, Seitenstruktur bleibt unberührt    */
  /* ================================================================== */

  const seitenCss = `
    /* Entscheidcontainer: Hintergrund und Textfarbe (Seiten-CSS setzt div.eit auf weiss) */
    html.bkl-aktiv div.eit {
      background-color: var(--bkl-bg) !important;
      color: var(--bkl-fg) !important;
    }
    /* Entscheidabsätze: Typografie. Absatzstruktur bleibt vollständig erhalten.
       div.paraatf = BGE-Ansicht (clir/relevancy), div.para = aza-Ansicht (Weitere Urteile ab 2000). */
    html.bkl-aktiv div.paraatf,
    html.bkl-aktiv div.para {
      font-family: var(--bkl-font) !important;
      font-size: var(--bkl-size) !important;
      line-height: var(--bkl-lh) !important;
      font-weight: var(--bkl-fw) !important;
      letter-spacing: var(--bkl-ls) !important;
      word-spacing: var(--bkl-ws) !important;
      color: var(--bkl-fg) !important;
      background-color: var(--bkl-bg) !important;
      max-width: var(--bkl-maxw) !important;
      margin-left: auto !important;
      margin-right: auto !important;
      hyphens: var(--bkl-hyphens) !important;
    }
    html.bkl-aktiv div.paraatf a,
    html.bkl-aktiv div.para a { color: var(--bkl-link) !important; }

    /* Spaltenbreite (Haarlinien-Box): das Seiten-CSS fixiert div.eit .middle auf 625px;
       wir überschreiben mit einstellbarer Breite und passen den Page-Rahmen an. */
    html.bkl-aktiv div.eit .middle {
      width: var(--bkl-spalte) !important;
    }
    html.bkl-aktiv div.eit .main,
    html.bkl-aktiv div.eit .top,
    html.bkl-aktiv div.eit .bottom {
      width: calc(var(--bkl-spalte) + 280px) !important;
    }
    /* Haarlinien-Farbe ans Farbschema anpassen */
    html.bkl-aktiv div.eit .box .content {
      border-left-color: var(--bkl-border) !important;
      border-right-color: var(--bkl-border) !important;
    }

    /* Klammerbemerkungen (Disclosure-Pattern: echter Button, aria-expanded) */
    span.bkl-fold { display: inline; }
    span.bkl-fold-content { display: none; }
    span.bkl-fold.bkl-offen span.bkl-fold-content { display: inline; }
    button.bkl-toggle {
      display: inline;
      border: 1px solid var(--bkl-border, #999);
      border-radius: 4px;
      background: var(--bkl-toggle-bg, #eee);
      color: var(--bkl-toggle-fg, #333);
      font-size: 0.75em;
      line-height: 1;
      padding: 0 4px;
      margin: 0 2px;
      cursor: pointer;
      vertical-align: baseline;
    }
    button.bkl-toggle:hover { background: #ddd; }
    button.bkl-toggle:focus-visible { outline: 2px solid var(--bkl-link, #1a56cc); outline-offset: 1px; }

    /* Beim Drucken immer den vollständigen Text zeigen */
    @media print {
      span.bkl-fold-content { display: inline !important; }
      button.bkl-toggle { display: none !important; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'bkl-style';
  styleEl.textContent = seitenCss;
  document.head.appendChild(styleEl);

  /* ================================================================== */
  /* STILE ANWENDEN                                                       */
  /* ================================================================== */

  const SCHRIFTARTEN = {
    serif: 'Georgia, "Times New Roman", Times, serif',
    sans: 'Verdana, Arial, Helvetica, sans-serif'
  };

  const FARBSCHEMATA = {
    hell:    { bg: '#ffffff', fg: '#1a1a1a', link: '#1a56cc', border: '#999', tbg: '#eee', tfg: '#333' },
    sepia:   { bg: '#f4ecd8', fg: '#3b2f20', link: '#7a4a12', border: '#a08c62', tbg: '#e8dcb8', tfg: '#3b2f20' },
    dunkel:  { bg: '#181818', fg: '#e8e8e8', link: '#8ab4f8', border: '#555', tbg: '#333', tfg: '#e8e8e8' },
    kontrast:{ bg: '#000000', fg: '#ffffff', link: '#ffe26f', border: '#ffffff', tbg: '#222222', tfg: '#ffffff' }
  };

  function wendeStileAn() {
    const html = document.documentElement;
    const e = einstellungen;
    const farben = FARBSCHEMATA[e.farbschema] || FARBSCHEMATA.hell;

    html.classList.toggle('bkl-aktiv', e.aktiv);
    html.style.setProperty('--bkl-font', SCHRIFTARTEN[e.schriftart]);
    html.style.setProperty('--bkl-size', e.schriftgroesse + 'px');
    html.style.setProperty('--bkl-lh', e.zeilenabstand);
    html.style.setProperty('--bkl-fw', e.schriftstaerke === 'fett' ? '700' : '400');
    html.style.setProperty('--bkl-ls', e.buchstabenabstand + 'px');
    html.style.setProperty('--bkl-ws', e.wortabstand + 'px');
    html.style.setProperty('--bkl-maxw', e.zeilenlaenge > 0 ? e.zeilenlaenge + 'ch' : 'none');
    html.style.setProperty('--bkl-spalte', e.spaltenbreite + 'px');
    html.style.setProperty('--bkl-hyphens', e.silbentrennung ? 'auto' : 'manual');
    html.style.setProperty('--bkl-bg', farben.bg);
    html.style.setProperty('--bkl-fg', farben.fg);
    html.style.setProperty('--bkl-link', farben.link);
    html.style.setProperty('--bkl-border', farben.border);
    html.style.setProperty('--bkl-toggle-bg', farben.tbg);
    html.style.setProperty('--bkl-toggle-fg', farben.tfg);
  }

  /* ================================================================== */
  /* KLammer-VERARBEITUNG ÜBER ALLE ENTSCHEIDABSÄTZE                     */
  /* ================================================================== */

  function entscheidBloecke() {
    return Array.prototype.slice.call(document.querySelectorAll('div.paraatf, div.para'));
  }

  function verarbeiteKlammern() {
    BGerReader.allesAufklappenUndEntfernen();

    if (!einstellungen.aktiv) { aktualisiereZaehler(0); return; }

    let anzahl = 0;
    entscheidBloecke().forEach(function (block) {
      anzahl += BGerReader.blockVerarbeiten(
        block,
        einstellungen.klammerModus,
        einstellungen.klammerMindestlaenge
      );
    });
    aktualisiereZaehler(anzahl);
  }

  function aktualisiereZaehler(anzahl) {
    const z = shadow.getElementById('bkl-zaehler');
    if (!z) return;
    z.textContent = anzahl > 0
      ? anzahl + ' Klammerbemerkung' + (anzahl === 1 ? '' : 'en') + ' gefunden (Pfeil ▸ anklicken zum Aufklappen).'
      : (einstellungen.klammerModus === 'literatur'
        ? 'Keine sicheren Literaturhinweise gefunden – Heuristik ist bewusst konservativ.'
        : '');
  }

  /* ================================================================== */
  /* PANEL (Shadow DOM – weder Seiten-CSS noch unser CSS greifen herein)  */
  /* ================================================================== */

  const host = document.createElement('div');
  host.id = 'bkl-panel-host';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const panelCss = `
    :host { all: initial; }
    #bkl-panel {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 2147483647;
      width: 280px;
      font-family: -apple-system, "Segoe UI", Arial, sans-serif;
      font-size: 14px;
      line-height: 1.35;
      background: #ffffff;
      color: #222222;
      border: 1px solid #bbb;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,.25);
      padding: 10px 12px;
    }
    #bkl-panel.bkl-minimiert #bkl-inhalt { display: none; }
    h2 {
      font-size: 15px;
      font-weight: bold;
      margin: 0 0 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      color: #222222;
    }
    .bkl-zeile {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin: 6px 0;
    }
    label { flex: 1; color: #222222; }
    input[type="range"] { width: 110px; }
    select { width: 110px; font-size: 13px; }
    input[type="checkbox"] { width: 16px; height: 16px; }
    .bkl-wert { width: 38px; text-align: right; color: #555; }
    .bkl-knopfreihe { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    button.bkl-aktion {
      border: 1px solid #bbb;
      border-radius: 6px;
      background: #f4f4f4;
      color: #222222;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 13px;
    }
    button.bkl-aktion:hover { background: #e6e6e6; }
    button.bkl-aktion:focus-visible, h2:focus-visible { outline: 2px solid #1a56cc; outline-offset: 1px; }
    .bkl-hinweis { font-size: 12px; color: #666; margin-top: 6px; }
  `;

  shadow.innerHTML = `
    <style>${panelCss}</style>
    <div id="bkl-panel" role="group" aria-label="BGer Reader Einstellungen">
      <h2 id="bkl-titel" tabindex="0"><span>📖 BGer Reader</span><span id="bkl-minus" aria-hidden="true">–</span></h2>
      <div id="bkl-inhalt">
        <div class="bkl-zeile">
          <label for="bkl-aktiv">Lesemodus einschalten</label>
          <input type="checkbox" id="bkl-aktiv">
        </div>
        <div class="bkl-zeile">
          <label for="bkl-groesse">Schriftgrösse</label>
          <input type="range" id="bkl-groesse" min="12" max="30" step="1"><span class="bkl-wert" id="bkl-groesse-w"></span>
        </div>
        <div class="bkl-zeile">
          <label for="bkl-art">Schriftart</label>
          <select id="bkl-art">
            <option value="serif">Serif (klassisch)</option>
            <option value="sans">Serifenlos (Sans)</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <label for="bkl-staerke">Schriftstärke</label>
          <select id="bkl-staerke">
            <option value="normal">normal</option>
            <option value="fett">fett</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <label for="bkl-zeilenabstand">Zeilenabstand</label>
          <input type="range" id="bkl-zeilenabstand" min="1" max="2.5" step="0.1"><span class="bkl-wert" id="bkl-zeilenabstand-w"></span>
        </div>
        <div class="bkl-zeile">
          <label for="bkl-buchstaben">Buchstabenabstand</label>
          <input type="range" id="bkl-buchstaben" min="0" max="4" step="0.5"><span class="bkl-wert" id="bkl-buchstaben-w"></span>
        </div>
        <div class="bkl-zeile">
          <label for="bkl-worte">Wortabstand</label>
          <input type="range" id="bkl-worte" min="0" max="10" step="1"><span class="bkl-wert" id="bkl-worte-w"></span>
        </div>
        <div class="bkl-zeile">
          <label for="bkl-laenge">Zeilenlänge begrenzen</label>
          <input type="range" id="bkl-laenge" min="0" max="120" step="10"><span class="bkl-wert" id="bkl-laenge-w"></span>
        </div>
        <div class="bkl-zeile">
          <label for="bkl-spalte">Spaltenbreite (Rahmen)</label>
          <input type="range" id="bkl-spalte" min="400" max="1400" step="25"><span class="bkl-wert" id="bkl-spalte-w"></span>
        </div>
        <div class="bkl-zeile">
          <label for="bkl-silben">Silbentrennung</label>
          <input type="checkbox" id="bkl-silben">
        </div>
        <div class="bkl-zeile">
          <label for="bkl-farbe">Farbschema</label>
          <select id="bkl-farbe">
            <option value="hell">Weiss</option>
            <option value="sepia">Sepia</option>
            <option value="dunkel">Dunkel</option>
            <option value="kontrast">Hoher Kontrast</option>
          </select>
        </div>
        <hr>
        <div class="bkl-zeile">
          <label for="bkl-klammer-modus">Klammern einklappen</label>
          <select id="bkl-klammer-modus">
            <option value="literatur">nur wahrscheinliche Literaturhinweise</option>
            <option value="alle">alle Klammern ab Mindestlänge</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <label for="bkl-klammer-min">Mindestlänge (Zeichen)</label>
          <input type="range" id="bkl-klammer-min" min="40" max="400" step="10"><span class="bkl-wert" id="bkl-klammer-min-w"></span>
        </div>
        <div class="bkl-knopfreihe">
          <button class="bkl-aktion" id="bkl-alle-auf">Alle Klammern auf</button>
          <button class="bkl-aktion" id="bkl-alle-zu">Alle zu</button>
          <button class="bkl-aktion" id="bkl-reset">Zurücksetzen</button>
        </div>
        <div class="bkl-hinweis" id="bkl-zaehler"></div>
      </div>
    </div>
  `;

  const panel = shadow.getElementById('bkl-panel');

  // Panel ein-/ausklappen (Titelzeile bleibt) – Maus und Tastatur
  function panelUmschalten() {
    panel.classList.toggle('bkl-minimiert');
    shadow.getElementById('bkl-minus').textContent = panel.classList.contains('bkl-minimiert') ? '+' : '–';
  }
  shadow.getElementById('bkl-titel').addEventListener('click', panelUmschalten);
  shadow.getElementById('bkl-titel').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); panelUmschalten(); }
  });

  function aktualisiereAnzeige() {
    shadow.getElementById('bkl-aktiv').checked = einstellungen.aktiv;
    shadow.getElementById('bkl-groesse').value = einstellungen.schriftgroesse;
    shadow.getElementById('bkl-groesse-w').textContent = einstellungen.schriftgroesse + 'px';
    shadow.getElementById('bkl-art').value = einstellungen.schriftart;
    shadow.getElementById('bkl-staerke').value = einstellungen.schriftstaerke;
    shadow.getElementById('bkl-zeilenabstand').value = einstellungen.zeilenabstand;
    shadow.getElementById('bkl-zeilenabstand-w').textContent = einstellungen.zeilenabstand;
    shadow.getElementById('bkl-buchstaben').value = einstellungen.buchstabenabstand;
    shadow.getElementById('bkl-buchstaben-w').textContent = einstellungen.buchstabenabstand + 'px';
    shadow.getElementById('bkl-worte').value = einstellungen.wortabstand;
    shadow.getElementById('bkl-worte-w').textContent = einstellungen.wortabstand + 'px';
    shadow.getElementById('bkl-laenge').value = einstellungen.zeilenlaenge;
    shadow.getElementById('bkl-laenge-w').textContent = einstellungen.zeilenlaenge === 0 ? 'aus' : einstellungen.zeilenlaenge;
    shadow.getElementById('bkl-spalte').value = einstellungen.spaltenbreite;
    shadow.getElementById('bkl-spalte-w').textContent = einstellungen.spaltenbreite + 'px';
    shadow.getElementById('bkl-silben').checked = einstellungen.silbentrennung;
    shadow.getElementById('bkl-farbe').value = einstellungen.farbschema;
    shadow.getElementById('bkl-klammer-modus').value = einstellungen.klammerModus;
    shadow.getElementById('bkl-klammer-min').value = einstellungen.klammerMindestlaenge;
    shadow.getElementById('bkl-klammer-min-w').textContent = einstellungen.klammerMindestlaenge;
  }

  function allesAnwenden() {
    wendeStileAn();
    verarbeiteKlammern();
    aktualisiereAnzeige();
    speichereEinstellungen();
  }

  function bei(id, event, fn) {
    shadow.getElementById(id).addEventListener(event, fn);
  }

  bei('bkl-aktiv', 'change', function (e) { einstellungen.aktiv = e.target.checked; allesAnwenden(); });
  bei('bkl-groesse', 'input', function (e) { einstellungen.schriftgroesse = +e.target.value; allesAnwenden(); });
  bei('bkl-art', 'change', function (e) { einstellungen.schriftart = e.target.value; allesAnwenden(); });
  bei('bkl-staerke', 'change', function (e) { einstellungen.schriftstaerke = e.target.value; allesAnwenden(); });
  bei('bkl-zeilenabstand', 'input', function (e) { einstellungen.zeilenabstand = +e.target.value; allesAnwenden(); });
  bei('bkl-buchstaben', 'input', function (e) { einstellungen.buchstabenabstand = +e.target.value; allesAnwenden(); });
  bei('bkl-worte', 'input', function (e) { einstellungen.wortabstand = +e.target.value; allesAnwenden(); });
  bei('bkl-laenge', 'input', function (e) { einstellungen.zeilenlaenge = +e.target.value; allesAnwenden(); });
  bei('bkl-spalte', 'input', function (e) { einstellungen.spaltenbreite = +e.target.value; allesAnwenden(); });
  bei('bkl-silben', 'change', function (e) { einstellungen.silbentrennung = e.target.checked; allesAnwenden(); });
  bei('bkl-farbe', 'change', function (e) { einstellungen.farbschema = e.target.value; allesAnwenden(); });
  bei('bkl-klammer-modus', 'change', function (e) { einstellungen.klammerModus = e.target.value; allesAnwenden(); });
  bei('bkl-klammer-min', 'input', function (e) { einstellungen.klammerMindestlaenge = +e.target.value; allesAnwenden(); });
  bei('bkl-alle-auf', 'click', function () { BGerReader.alleUmschalten(true); });
  bei('bkl-alle-zu', 'click', function () { BGerReader.alleUmschalten(false); });
  bei('bkl-reset', 'click', function () {
    einstellungen = Object.assign({}, STANDARDS);
    allesAnwenden();
  });

  /* ================================================================== */
  /* START                                                                */
  /* ================================================================== */

  allesAnwenden();
})();

/*
 * BGer Reader – unabhängiges Projekt, nicht mit dem Schweizerischen Bundesgericht verbunden.
 *
 * Browser-Extension (Manifest V3), Content Script.
 * Läuft zu 100 % offline: keine Netzwerkzugriffe, keine Datenübertragung,
 * Einstellungen liegen in chrome.storage.local auf dem eigenen Gerät.
 *
 * Architektur:
 *   1. Kernlogik (BGerReader): reine DOM-Funktionen ohne Browser-Abhängigkeit –
 *      Bracket-Stack über Textknoten, konservative Literatur-Heuristik, Range-basiertes
 *      Ein-/Ausklappen (reversibel, Links und Formatierungen bleiben erhalten).
 *   2. UI: Shadow-DOM-Panel (das Seiten-CSS kann es nicht zerstören und umgekehrt).
 *   3. Styles: nur per Klasse + CSS-Variablen auf dem Entscheidcontainer, keine Inline-Hacks.
 *   4. Speicher: chrome.storage.local (domain-übergreifend, offline).
 *      localStorage-Fallback nur für die jsdom-Testumgebung ohne chrome-API.
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
    schriftart: 'serif',        // serif | sans | atkinson | garamond | opendyslexic | comicneue | liberation-serif | liberation-sans
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

  /* Speicher-Strategie (Privacy: 100 % offline, nichts verlässt das Gerät):
   * – Extension: chrome.storage.local → Einstellungen gelten domain-übergreifend
   *   (search.bger.ch UND relevancy.bger.ch), bleiben aber lokal.
   * – Testumgebung (jsdom, keine chrome-API): localStorage-Fallback.
   * Laden ist bei chrome.storage asynchron → Callback-Muster.
   */
  const hatExtensionStorage = (
    typeof chrome !== 'undefined' &&
    !!chrome.storage &&
    !!chrome.storage.local
  );

  let einstellungen = Object.assign({}, STANDARDS);

  function ladeEinstellungen(fertig) {
    if (hatExtensionStorage) {
      chrome.storage.local.get(STORAGE_KEY, function (res) {
        einstellungen = Object.assign({}, STANDARDS, (res && res[STORAGE_KEY]) || {});
        fertig();
      });
      return;
    }
    try {
      const gespeichert = JSON.parse(localStorage.getItem(STORAGE_KEY));
      einstellungen = Object.assign({}, STANDARDS, gespeichert || {});
    } catch (e) { /* Standardwerte behalten */ }
    fertig();
  }

  function speichereEinstellungen() {
    try {
      if (hatExtensionStorage) {
        const paket = {};
        paket[STORAGE_KEY] = einstellungen;
        chrome.storage.local.set(paket);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(einstellungen));
      }
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
      hyphens: var(--bkl-hyphens) !important;
    }
    html.bkl-aktiv div.paraatf a,
    html.bkl-aktiv div.para a { color: var(--bkl-link) !important; }

    /* Seiten-Boxen der Entscheidseite (Fixture bger_test.html):
       div.eit .box = Inhaltsbox (#highlight_content) und rechte Spalte
       (#highlight_index = Inhalt, #highlight_references = Referenzen,
       #highlight_navigation = Navigation, jeweils mit .content/h3/p).
       Diese Boxen blieben sonst weiss auf gefärbtem Grund. */
    html.bkl-aktiv div.eit .box,
    html.bkl-aktiv div.eit .box .content {
      background-color: var(--bkl-bg) !important;
      color: var(--bkl-fg) !important;
    }
    html.bkl-aktiv div.eit .box h3,
    html.bkl-aktiv div.eit .box p {
      background-color: var(--bkl-bg) !important;
      color: var(--bkl-fg) !important;
    }
    html.bkl-aktiv div.eit .box a { color: var(--bkl-link) !important; }

    /* Zeilenlänge begrenzen: NUR wenn eingestellt (> 0 Zeichen), Klasse bkl-maxw
       auf <html>. Im Standard bleibt der Text pixel-identisch an seiner
       Originalposition (kein margin:auto, kein max-width). */
    html.bkl-aktiv.bkl-maxw div.paraatf,
    html.bkl-aktiv.bkl-maxw div.para {
      max-width: var(--bkl-maxw) !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    /* Spaltenbreite (Haarlinien-Box): das Seiten-CSS fixiert div.eit .middle auf 625px.
       Überschrieben wird NUR bei Abweichung vom Seiten-Standard 625px,
       Klasse bkl-breite auf <html>. */
    html.bkl-aktiv.bkl-breite div.eit .middle {
      width: var(--bkl-spalte) !important;
    }
    html.bkl-aktiv.bkl-breite div.eit .main,
    html.bkl-aktiv.bkl-breite div.eit .top,
    html.bkl-aktiv.bkl-breite div.eit .bottom {
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

  /* ---------- Lokal gebündelte Fonts (WOFF2, Latin-Subset, OFL) ---------- */
  // @font-face muss chrome.runtime.getURL() verwenden (Content-Script-Kontext:
  // relative Pfade würden auf die Seite zeigen, nicht auf die Extension).
  // In der jsdom-Testumgebung gibt es chrome.runtime nicht -> keine
  // @font-face-Regeln injizieren (SCHRIFTARTEN-Stacks fallen auf System-
  // Schriften zurück, nichts bricht).
  const FONT_DATEIEN = [
    { familie: 'Atkinson Hyperlegible Next', basis: 'atkinson-hyperlegible-next' },
    { familie: 'EB Garamond',                basis: 'eb-garamond' },
    { familie: 'Dyslexie-Leseschrift',       basis: 'opendyslexic' },
    { familie: 'Comic Neue',                 basis: 'comic-neue' },
    { familie: 'BGEReader Serif',            basis: 'liberation-serif' },
    { familie: 'BGEReader Sans',             basis: 'liberation-sans' }
  ];

  function fontFaceCss() {
    const hatGetURL = (
      typeof chrome !== 'undefined' &&
      !!chrome.runtime &&
      typeof chrome.runtime.getURL === 'function'
    );
    if (!hatGetURL) return ''; // z. B. jsdom-Tests ohne Extension-API
    let css = '';
    FONT_DATEIEN.forEach(function (f) {
      [400, 700].forEach(function (w) {
        css += '@font-face {\n' +
          '  font-family: "' + f.familie + '";\n' +
          '  font-style: normal;\n' +
          '  font-weight: ' + w + ';\n' +
          '  font-display: swap;\n' +
          '  src: url("' + chrome.runtime.getURL('fonts/' + f.basis + '-latin-' + w + '.woff2') + '") format("woff2");\n' +
          '}\n';
      });
    });
    return css;
  }

  const styleEl = document.createElement('style');
  styleEl.id = 'bkl-style';
  styleEl.textContent = fontFaceCss() + seitenCss;
  document.head.appendChild(styleEl);

  /* ================================================================== */
  /* STILE ANWENDEN                                                       */
  /* ================================================================== */

  /* Schriftarten: lokal gebündelte FOSS-Fonts (WOFF2, siehe @font-face oben)
     jeweils mit System-Fallback im Stack; 'serif'/'sans' sind die reinen
     System-Fallbacks ohne Font-Datei (abwärtskompatibel zu v0.2.0). */
  const SCHRIFTARTEN = {
    serif: 'Georgia, "Times New Roman", Times, serif',
    sans: 'Verdana, Arial, Helvetica, sans-serif',
    atkinson: '"Atkinson Hyperlegible Next", Verdana, Arial, Helvetica, sans-serif',
    garamond: '"EB Garamond", Georgia, "Times New Roman", Times, serif',
    opendyslexic: '"Dyslexie-Leseschrift", Verdana, Arial, Helvetica, sans-serif',
    comicneue: '"Comic Neue", "Comic Sans MS", Verdana, sans-serif',
    'liberation-serif': '"BGEReader Serif", "Times New Roman", Times, serif',
    'liberation-sans': '"BGEReader Sans", Arial, Helvetica, sans-serif'
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

    /* Abwärtskompatibilität/Defensive: unbekannte gespeicherte Werte
       (z. B. aus älteren Versionen) auf den Standard zurückfallen lassen,
       statt mit undefined-CSS zu crashen. */
    if (!SCHRIFTARTEN[einstellungen.schriftart]) {
      einstellungen.schriftart = STANDARDS.schriftart;
    }

    html.classList.toggle('bkl-aktiv', e.aktiv);
    /* Layout-Neutralität: Breiten-Regeln nur bei Abweichung vom Standard
       (625px Spalte, keine Zeilenlängen-Begrenzung) aktivieren. */
    html.classList.toggle('bkl-maxw', e.aktiv && e.zeilenlaenge > 0);
    html.classList.toggle('bkl-breite', e.aktiv && e.spaltenbreite !== STANDARDS.spaltenbreite);
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

  /* Inline-SVG-Icons (selbst gezeichnet, einfache Pfade, kein Icon-Font,
     keine externe Ressource). stroke="currentColor" -> färbt sich mit dem Text. */
  function svgIcon(pfad) {
    return '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="square" ' +
      'aria-hidden="true" focusable="false"><path d="' + pfad + '"/></svg>';
  }

  const ICONS = {
    lupe:        'M14 14 L10.2 10.2 M11.5 6.75 a4.75 4.75 0 1 1 -9.5 0 a4.75 4.75 0 1 1 9.5 0 M6.75 4.5 v4.5 M4.5 6.75 h4.5',
    schliessen:  'M3 3 L13 13 M13 3 L3 13',
    buch:        'M2 4 c2 -1.3 4 -1.3 6 0 c2 -1.3 4 -1.3 6 0 v9 c-2 -1.3 -4 -1.3 -6 0 c-2 -1.3 -4 -1.3 -6 0 z M8 4 v9',
    groesse:     'M2 12.5 L5.5 3.5 L9 12.5 M3.4 9.5 h4.2 M12.5 3.5 v9 M12.5 3.5 l-1.5 2 M12.5 3.5 l1.5 2 M12.5 12.5 l-1.5 -2 M12.5 12.5 l1.5 -2',
    art:         'M1.5 12.5 L4 4.5 L6.5 12.5 M2.6 10 h2.8 M9 12.5 v-5 a2.5 2.5 0 0 1 5 0 v5 M9 10.5 h5',
    farbe:       'M8 2 C8 2 3.5 7.5 3.5 10 a4.5 4.5 0 0 0 9 0 C12.5 7.5 8 2 8 2 z',
    staerke:     'M4.5 2.5 h3.5 a3 3 0 0 1 0 6 h-3.5 z M4.5 8.5 h4.5 a3 3 0 0 1 0 6 h-4.5 z',
    zeilen:      'M6 4 h8 M6 8 h8 M6 12 h8 M2.5 3 v10 M2.5 3 L1 4.5 M2.5 3 L4 4.5 M2.5 13 L1 11.5 M2.5 13 L4 11.5',
    buchstaben:  'M1 12.5 L3.5 4.5 L6 12.5 M2 10 h3 M10 12.5 L12.5 4.5 L15 12.5 M11 10 h3 M6.8 8.5 h2.4',
    worte:       'M1 5 h5 M1 9 h5 M10 5 h5 M10 9 h5 M7 7 h2 M7 7 l1 -1.2 M7 7 l1 1.2 M9 7 l-1 -1.2 M9 7 l-1 1.2',
    laenge:      'M2 4 h12 M2 8 h8 M2 12 h10',
    spalte:      'M2 3 h12 v10 h-12 z M5.5 3 v10 M10.5 3 v10',
    silben:      'M2 4 h12 M2 8 h5 M9 8 h5 M2 12 h12',
    klammer:     'M6 3 c-2 1 -2.5 3 -2.5 5 s0.5 4 2.5 5 M10 3 c2 1 2.5 3 2.5 5 s-0.5 4 -2.5 5',
    min:         'M2 5 h12 v6 h-12 z M5 5 v3 M8 5 v4 M11 5 v3',
    pfeil:       'M6 4 L10 8 L6 12'
  };

  const panelCss = `
    :host { all: initial; }

    /* Geschlossener Zustand: kleiner runder Pink-Button oben rechts */
    #bkl-button {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 2147483647;
      width: 46px;
      height: 46px;
      padding: 0;
      border-radius: 50%;
      border: 2px solid #a61e63;
      background: #d63384;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.3);
    }
    #bkl-button:hover { background: #e64980; }

    /* Offener Zustand: annähernd quadratisches Panel, scrollbar bei kleinem Bildschirm */
    #bkl-panel {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 2147483647;
      width: 340px;
      max-width: calc(100vw - 24px);
      max-height: calc(100vh - 24px);
      overflow: auto;
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
    #bkl-panel[hidden],
    #bkl-button[hidden] { display: none; }

    #bkl-kopf {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    h2 {
      font-size: 15px;
      font-weight: bold;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #d63384;
    }
    #bkl-schliessen {
      width: 30px;
      height: 30px;
      padding: 0;
      border: 1px solid #bbb;
      border-radius: 6px;
      background: #f4f4f4;
      color: #222222;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #bkl-schliessen:hover { background: #e6e6e6; }

    .bkl-bereich-titel {
      font-size: 13px;
      font-weight: bold;
      color: #555555;
      margin: 8px 0 2px 0;
      padding-bottom: 2px;
      border-bottom: 1px solid #dddddd;
    }

    .bkl-zeile {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 6px 0;
    }
    .bkl-icon {
      flex: 0 0 16px;
      display: inline-flex;
      color: #444444;
    }
    label { flex: 1; color: #222222; }
    input[type="range"] { width: 110px; }
    select { width: 124px; font-size: 13px; }
    input[type="checkbox"] { width: 18px; height: 18px; }
    .bkl-wert { width: 42px; text-align: right; color: #555555; }

    /* Toggle für den Detail-Bereich (echter Button, aria-expanded) */
    #bkl-details-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding: 7px 8px;
      border: 1px solid #bbb;
      border-radius: 6px;
      background: #f4f4f4;
      color: #222222;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      text-align: left;
    }
    #bkl-details-toggle:hover { background: #e6e6e6; }
    #bkl-details-toggle .bkl-pfeil { display: inline-flex; }
    /* statische Drehung, absichtlich ohne Transition/Animation */
    #bkl-details-toggle[aria-expanded="true"] .bkl-pfeil svg { transform: rotate(90deg); }
    #bkl-details[hidden] { display: none; }

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

    /* Sichtbarer Fokus-Rahmen für Tastaturbedienung */
    #bkl-button:focus-visible,
    #bkl-schliessen:focus-visible,
    #bkl-details-toggle:focus-visible,
    button.bkl-aktion:focus-visible,
    input:focus-visible,
    select:focus-visible {
      outline: 2px solid #1a56cc;
      outline-offset: 1px;
    }

    .bkl-hinweis { font-size: 12px; color: #666666; margin-top: 6px; }
  `;

  shadow.innerHTML = `
    <style>${panelCss}</style>
    <button type="button" id="bkl-button"
            title="BGer Reader Einstellungen öffnen"
            aria-label="BGer Reader Einstellungen öffnen">${svgIcon(ICONS.lupe)}</button>
    <div id="bkl-panel" role="region" aria-label="BGer Reader Einstellungen" hidden>
      <div id="bkl-kopf">
        <h2>${svgIcon(ICONS.lupe)} BGer Reader</h2>
        <button type="button" id="bkl-schliessen"
                title="Einstellungen schliessen (Escape)"
                aria-label="Einstellungen schliessen">${svgIcon(ICONS.schliessen)}</button>
      </div>

      <div class="bkl-bereich" id="bkl-allgemein">
        <h3 class="bkl-bereich-titel">Allgemein</h3>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.buch)}</span>
          <label for="bkl-aktiv">Lesemodus</label>
          <input type="checkbox" id="bkl-aktiv" title="Lesemodus ein-/ausschalten" aria-label="Lesemodus ein-/ausschalten">
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.groesse)}</span>
          <label for="bkl-groesse">Schriftgrösse</label>
          <input type="range" id="bkl-groesse" min="12" max="30" step="1" title="Schriftgrösse in Pixel" aria-label="Schriftgrösse in Pixel"><span class="bkl-wert" id="bkl-groesse-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.art)}</span>
          <label for="bkl-art">Schriftart</label>
          <select id="bkl-art" title="Schriftart wählen" aria-label="Schriftart wählen">
            <option value="serif">System Serif</option>
            <option value="sans">System Sans</option>
            <option value="atkinson">Atkinson Hyperlegible (gut lesbar)</option>
            <option value="garamond">EB Garamond (Buchschrift)</option>
            <option value="opendyslexic">OpenDyslexic</option>
            <option value="comicneue">Comic Neue</option>
            <option value="liberation-serif">Liberation Serif (Times-ähnlich)</option>
            <option value="liberation-sans">Liberation Sans (Arial-ähnlich)</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.farbe)}</span>
          <label for="bkl-farbe">Farbschema</label>
          <select id="bkl-farbe" title="Farbschema wählen" aria-label="Farbschema wählen">
            <option value="hell">Weiss</option>
            <option value="sepia">Sepia</option>
            <option value="dunkel">Dunkel</option>
            <option value="kontrast">Hoher Kontrast</option>
          </select>
        </div>
      </div>

      <button type="button" id="bkl-details-toggle" aria-expanded="false" aria-controls="bkl-details"
              title="Weitere Einstellungen ein-/ausblenden" aria-label="Detaillierte Einstellungen ein-/ausblenden">
        <span class="bkl-pfeil">${svgIcon(ICONS.pfeil)}</span>Detaillierte Einstellungen
      </button>
      <div class="bkl-bereich" id="bkl-details" hidden>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.staerke)}</span>
          <label for="bkl-staerke">Schriftstärke</label>
          <select id="bkl-staerke" title="Schriftstärke wählen" aria-label="Schriftstärke wählen">
            <option value="normal">normal</option>
            <option value="fett">fett</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.zeilen)}</span>
          <label for="bkl-zeilenabstand">Zeilenabstand</label>
          <input type="range" id="bkl-zeilenabstand" min="1" max="2.5" step="0.1" title="Zeilenabstand (Faktor)" aria-label="Zeilenabstand (Faktor)"><span class="bkl-wert" id="bkl-zeilenabstand-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.buchstaben)}</span>
          <label for="bkl-buchstaben">Buchstabenabstand</label>
          <input type="range" id="bkl-buchstaben" min="0" max="4" step="0.5" title="Buchstabenabstand in Pixel" aria-label="Buchstabenabstand in Pixel"><span class="bkl-wert" id="bkl-buchstaben-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.worte)}</span>
          <label for="bkl-worte">Wortabstand</label>
          <input type="range" id="bkl-worte" min="0" max="10" step="1" title="Wortabstand in Pixel" aria-label="Wortabstand in Pixel"><span class="bkl-wert" id="bkl-worte-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.laenge)}</span>
          <label for="bkl-laenge">Zeilenlänge</label>
          <input type="range" id="bkl-laenge" min="0" max="120" step="10" title="Zeilenlänge begrenzen (Zeichen, 0 = aus)" aria-label="Zeilenlänge begrenzen (Zeichen, 0 = aus)"><span class="bkl-wert" id="bkl-laenge-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.spalte)}</span>
          <label for="bkl-spalte">Spaltenbreite</label>
          <input type="range" id="bkl-spalte" min="400" max="1400" step="25" title="Spaltenbreite des Rahmens in Pixel (Seiten-Standard: 625)" aria-label="Spaltenbreite des Rahmens in Pixel"><span class="bkl-wert" id="bkl-spalte-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.silben)}</span>
          <label for="bkl-silben">Silbentrennung</label>
          <input type="checkbox" id="bkl-silben" title="Silbentrennung ein-/ausschalten" aria-label="Silbentrennung ein-/ausschalten">
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.klammer)}</span>
          <label for="bkl-klammer-modus">Klammern einklappen</label>
          <select id="bkl-klammer-modus" title="Klammer-Modus wählen" aria-label="Klammer-Modus wählen">
            <option value="literatur">nur wahrscheinliche Literaturhinweise</option>
            <option value="alle">alle Klammern ab Mindestlänge</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.min)}</span>
          <label for="bkl-klammer-min">Mindestlänge</label>
          <input type="range" id="bkl-klammer-min" min="40" max="400" step="10" title="Mindestlänge für Klammern in Zeichen" aria-label="Mindestlänge für Klammern in Zeichen"><span class="bkl-wert" id="bkl-klammer-min-w"></span>
        </div>
        <div class="bkl-knopfreihe">
          <button class="bkl-aktion" id="bkl-alle-auf" title="Alle eingeklappten Klammerbemerkungen aufklappen" aria-label="Alle eingeklappten Klammerbemerkungen aufklappen">Alle Klammern auf</button>
          <button class="bkl-aktion" id="bkl-alle-zu" title="Alle Klammerbemerkungen einklappen" aria-label="Alle Klammerbemerkungen einklappen">Alle zu</button>
          <button class="bkl-aktion" id="bkl-reset" title="Alle Einstellungen auf Standard zurücksetzen" aria-label="Alle Einstellungen auf Standard zurücksetzen">Zurücksetzen</button>
        </div>
        <div class="bkl-hinweis" id="bkl-zaehler"></div>
      </div>
    </div>
  `;

  const panel = shadow.getElementById('bkl-panel');
  const pinkKnopf = shadow.getElementById('bkl-button');

  /* Öffnen/Schliessen: Pink-Button öffnet, X-Knopf oder Escape schliesst.
     Fokus-Management: beim Öffnen Fokus ins Panel (Schliessen-Knopf),
     beim Schliessen zurück auf den Pink-Button. */
  function panelOeffnen() {
    panel.hidden = false;
    pinkKnopf.hidden = true;
    shadow.getElementById('bkl-schliessen').focus();
  }
  function panelSchliessen() {
    panel.hidden = true;
    pinkKnopf.hidden = false;
    pinkKnopf.focus();
  }
  pinkKnopf.addEventListener('click', panelOeffnen);
  shadow.getElementById('bkl-schliessen').addEventListener('click', panelSchliessen);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) panelSchliessen();
  });

  /* Detail-Bereich ein-/ausklappen (echter Button, aria-expanded) */
  const detailsToggle = shadow.getElementById('bkl-details-toggle');
  const details = shadow.getElementById('bkl-details');
  detailsToggle.addEventListener('click', function () {
    const offen = details.hidden;
    details.hidden = !offen;
    detailsToggle.setAttribute('aria-expanded', offen ? 'true' : 'false');
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

  // Gespeicherte Einstellungen laden (bei chrome.storage asynchron),
  // erst danach Stile/Klammern/Panel-Anzeige anwenden.
  ladeEinstellungen(allesAnwenden);
})();

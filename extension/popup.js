// bger reader – unabhängiges Projekt, nicht mit dem Schweizerischen Bundesgericht verbunden. 100 % offline, keine Datenerhebung.

/* Einstellungen im mittigen Pop-up-Fenster (per Icon-Klick geöffnet).
 * Schreibt in denselben lokalen Speicher wie content.js; das Content-Skript
 * auf der Entscheidseite wendet Änderungen live an (storage.onChanged).
 * Keine Nachrichten an Tabs nötig, keine zusätzlichen Rechte.
 */

(function () {
  'use strict';

  /* Schlüssel und Standards: identisch zu content.js – Änderungen dort
     immer hier nachziehen. */
  const STORAGE_KEY = 'bger-reader-einstellungen-v2';

  const STANDARDS = {
    aktiv: false,               // Lesemodus ein/aus
    schriftgroesse: 18,         // px
    schriftart: 'serif',        // serif | sans | atkinson | luciole | garamond | opendyslexic | comicneue | liberation-serif | liberation-sans
    schriftstaerke: 'normal',   // normal | fett
    zeilenabstand: 1.6,         // Faktor
    buchstabenabstand: 0,       // px
    wortabstand: 0,             // px
    zeilenlaenge: 0,            // 0 = unbegrenzt, sonst Zeichen (ch)
    spaltenbreite: 625,         // px – Breite der Haarlinien-Textspalte (Seiten-Standard: 625)
    silbentrennung: false,
    farbschema: 'hell',         // hell | sepia | dunkel | kontrast | nacht
    klammern: true,             // „einfach": Klammern nach festem Regelsatz einklappen
    ausrichtung: 'links',       // links | mittig | rechts | blocksatz
    spalten: 1,                 // 1 | 2 | 3 Textspalten (Zeitungssatz)
    absatzabstand: 0            // em – zusätzlicher Abstand nach jedem Absatz, 0 = Seiten-Standard
  };

  /* Speicher-Strategie wie in content.js: Extension-Speicher wenn vorhanden,
     localStorage-Fallback für jsdom-Tests und die file://-Vorschau. */
  const extensionApi = typeof browser !== 'undefined' && browser.storage && browser.storage.local
    ? browser : (typeof chrome !== 'undefined' ? chrome : null);
  const verwendetPromises = typeof browser !== 'undefined' && extensionApi === browser;
  const extensionStorage = extensionApi && extensionApi.storage && extensionApi.storage.local;

  let einstellungen = Object.assign({}, STANDARDS);

  // Entfernt veraltete Schlüssel aus gespeicherten Einstellungen.
  function bereinige(e) {
    Object.keys(e).forEach(function (k) {
      if (!(k in STANDARDS)) delete e[k];
    });
    return e;
  }

  function ladeSchluessel(schluessel, fertig) {
    if (extensionStorage) {
      try {
        if (verwendetPromises) {
          extensionStorage.get(schluessel).then(fertig, function () { fertig({}); });
        } else {
          extensionStorage.get(schluessel, function (res) {
            if (extensionApi.runtime && extensionApi.runtime.lastError) { fertig({}); return; }
            fertig(res);
          });
        }
      } catch (e) { fertig({}); }
      return;
    }
    try {
      const aus = {};
      aus[schluessel] = JSON.parse(localStorage.getItem(schluessel));
      fertig(aus);
    } catch (e) { fertig({}); }
  }

  /* Eigene Schreibvorgänge merken, damit der onChanged-Listener unten das
     asynchrone Echo daran erkennt (wie in content.js): sonst setzt das Echo
     eines älteren Schreibens bei schnellem Reglerzug den Regler zurück. */
  const eigeneSchreibvorgaenge = [];
  function signatur(e) {
    return JSON.stringify(Object.assign({}, STANDARDS, e || {}));
  }

  function speichereEinstellungen() {
    try {
      if (extensionStorage) {
        const paket = {};
        paket[STORAGE_KEY] = einstellungen;
        eigeneSchreibvorgaenge.push(signatur(einstellungen));
        if (eigeneSchreibvorgaenge.length > 32) eigeneSchreibvorgaenge.shift();
        if (verwendetPromises) {
          extensionStorage.set(paket).catch(function () {});
        } else {
          extensionStorage.set(paket, function () {
            // lastError innerhalb des Callbacks lesen, damit ein Speicherfehler
            // keine unbehandelte API-Fehlermeldung erzeugt.
            if (extensionApi.runtime && extensionApi.runtime.lastError) return;
          });
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(einstellungen));
      }
    } catch (e) { /* Speichern ist schön, aber nicht kritisch */ }
  }

  /* ================================================================== */
  /* ANZEIGE                                                              */
  /* ================================================================== */

  function $(id) { return document.getElementById(id); }

  /* Wertanzeige neben den Reglern (Schriftgrösse bewusst ohne Einheit);
     bei den Dropdowns Schriftart/Hintergrund stattdessen data-wert für die
     Vorschau im geschlossenen Dropdown (popup.css). Gleiche Formate wie
     WERTANZEIGE in content.js. */
  const WERTANZEIGE = {
    'bkl-groesse':       function (e) { return String(e.schriftgroesse); },
    'bkl-zeilenabstand': function (e) { return String(e.zeilenabstand); },
    'bkl-absatz':        function (e) { return e.absatzabstand === 0 ? 'aus' : String(e.absatzabstand); },
    'bkl-buchstaben':    function (e) { return (+e.buchstabenabstand).toFixed(1) + 'px'; },
    'bkl-worte':         function (e) { return (+e.wortabstand).toFixed(1) + 'px'; },
    'bkl-laenge':        function (e) { return e.zeilenlaenge === 0 ? 'aus' : String(e.zeilenlaenge); },
    'bkl-spalte':        function (e) { return e.spaltenbreite + 'px'; },
    'bkl-art':           null,
    'bkl-farbe':         null
  };

  function wertAnzeigen(id) {
    if (!(id in WERTANZEIGE)) return;
    const f = WERTANZEIGE[id];
    if (!f) {
      const sel = $(id);
      if (sel) sel.setAttribute('data-wert', sel.value);
      return;
    }
    const el = $(id + '-w');
    if (el) el.textContent = f(einstellungen);
  }

  function aktualisiereAnzeige() {
    const e = einstellungen;
    $('bkl-aktiv').checked = e.aktiv;
    $('bkl-groesse').value = e.schriftgroesse;
    $('bkl-art').value = e.schriftart;
    $('bkl-staerke').value = e.schriftstaerke;
    $('bkl-zeilenabstand').value = e.zeilenabstand;
    $('bkl-absatz').value = e.absatzabstand;
    $('bkl-buchstaben').value = e.buchstabenabstand;
    $('bkl-worte').value = e.wortabstand;
    $('bkl-laenge').value = e.zeilenlaenge;
    $('bkl-spalte').value = e.spaltenbreite;
    $('bkl-silben').checked = e.silbentrennung;
    $('bkl-farbe').value = e.farbschema;
    $('bkl-klammern').checked = e.klammern;
    $('bkl-ausrichtung').value = e.ausrichtung;
    $('bkl-spalten').value = String(e.spalten);
    Object.keys(WERTANZEIGE).forEach(wertAnzeigen);
  }

  /* ================================================================== */
  /* BEDIENUNG                                                            */
  /* ================================================================== */

  function geaendert(id) {
    wertAnzeigen(id);
    speichereEinstellungen();
  }

  function bei(id, event, fn) {
    $(id).addEventListener(event, fn);
  }

  /* Bedienung erst nach dem Laden der Einstellungen anschliessen (wie in
     content.js): ein Klick davor schriebe Standardwerte über die gespeicherten. */
  function bedienungEinrichten() {
  bei('bkl-aktiv', 'change', function (e) { einstellungen.aktiv = e.target.checked; geaendert('bkl-aktiv'); });
  bei('bkl-groesse', 'input', function (e) { einstellungen.schriftgroesse = +e.target.value; geaendert('bkl-groesse'); });
  bei('bkl-art', 'change', function (e) { einstellungen.schriftart = e.target.value; geaendert('bkl-art'); });
  bei('bkl-staerke', 'change', function (e) { einstellungen.schriftstaerke = e.target.value; geaendert('bkl-staerke'); });
  bei('bkl-zeilenabstand', 'input', function (e) { einstellungen.zeilenabstand = +e.target.value; geaendert('bkl-zeilenabstand'); });
  bei('bkl-absatz', 'input', function (e) { einstellungen.absatzabstand = +e.target.value; geaendert('bkl-absatz'); });
  bei('bkl-buchstaben', 'input', function (e) { einstellungen.buchstabenabstand = +e.target.value; geaendert('bkl-buchstaben'); });
  bei('bkl-worte', 'input', function (e) { einstellungen.wortabstand = +e.target.value; geaendert('bkl-worte'); });
  bei('bkl-laenge', 'input', function (e) { einstellungen.zeilenlaenge = +e.target.value; geaendert('bkl-laenge'); });
  bei('bkl-spalte', 'input', function (e) { einstellungen.spaltenbreite = +e.target.value; geaendert('bkl-spalte'); });
  bei('bkl-silben', 'change', function (e) { einstellungen.silbentrennung = e.target.checked; geaendert('bkl-silben'); });
  bei('bkl-farbe', 'change', function (e) { einstellungen.farbschema = e.target.value; geaendert('bkl-farbe'); });
  bei('bkl-klammern', 'change', function (e) { einstellungen.klammern = e.target.checked; geaendert('bkl-klammern'); });
  bei('bkl-ausrichtung', 'change', function (e) { einstellungen.ausrichtung = e.target.value; geaendert('bkl-ausrichtung'); });
  bei('bkl-spalten', 'change', function (e) { einstellungen.spalten = +e.target.value; geaendert('bkl-spalten'); });
  bei('bkl-reset', 'click', function () {
    einstellungen = Object.assign({}, STANDARDS);
    aktualisiereAnzeige();
    speichereEinstellungen();
  });
  }

  /* ---------- Tooltips mit Verzögerung ----------
     Gleiche Logik wie tooltipsEinrichten() in content.js: Texte in
     data-tooltip, Einblendung erst nach TOOLTIP_VERZOEGERUNG (Maus über dem
     Element oder Tastaturfokus), weg bei Verlassen, Blur, Klick, Escape. */
  const TOOLTIP_VERZOEGERUNG = 3000; // ms

  function tooltipsEinrichten(wurzel, tip) {
    let timer = null;
    let ziel = null;
    function verbergen() {
      if (timer !== null) { clearTimeout(timer); timer = null; }
      if (ziel) { ziel.removeAttribute('aria-describedby'); ziel = null; }
      tip.hidden = true;
    }
    function zeigen(el, nurTastatur) {
      timer = null;
      if (nurTastatur) {
        try { if (!el.matches(':focus-visible')) return; } catch (e) { /* zeigen */ }
      }
      tip.textContent = el.getAttribute('data-tooltip');
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      const links = Math.max(8, Math.min(r.left, window.innerWidth - tip.offsetWidth - 8));
      const unten = r.bottom + 6 + tip.offsetHeight > window.innerHeight;
      tip.style.left = links + 'px';
      tip.style.top = (unten ? r.top - 6 - tip.offsetHeight : r.bottom + 6) + 'px';
      el.setAttribute('aria-describedby', tip.id);
      ziel = el;
    }
    function planen(e) {
      const el = e.currentTarget;
      const nurTastatur = e.type === 'focus';
      verbergen();
      timer = setTimeout(function () { zeigen(el, nurTastatur); }, TOOLTIP_VERZOEGERUNG);
    }
    wurzel.querySelectorAll('[data-tooltip]').forEach(function (el) {
      el.addEventListener('mouseenter', planen);
      el.addEventListener('focus', planen);
      el.addEventListener('mouseleave', verbergen);
      el.addEventListener('blur', verbergen);
      el.addEventListener('mousedown', verbergen);
    });
    return verbergen;
  }
  const tooltipVerbergen = tooltipsEinrichten(document, $('bkl-tooltip'));

  /* Detail-Bereich ein-/ausklappen (echter Button, aria-expanded) */
  const detailsToggle = $('bkl-details-toggle');
  const details = $('bkl-details');
  detailsToggle.addEventListener('click', function () {
    const offen = details.hidden;
    details.hidden = !offen;
    detailsToggle.setAttribute('aria-expanded', offen ? 'true' : 'false');
  });

  /* Schliessen: X-Knopf oder Escape (echtes Fenster, kein Seiten-Panel) */
  function fensterSchliessen() {
    try { window.close(); } catch (e) { /* jsdom/file-Vorschau: kein Fenster */ }
  }
  $('bkl-schliessen').addEventListener('click', fensterSchliessen);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { tooltipVerbergen(); fensterSchliessen(); }
  });

  /* ================================================================== */
  /* LIVE-SYNC MIT DER ENTSCHEIDSEITE                                     */
  /* ================================================================== */

  /* Änderungen aus dem Seiten-Panel (content.js) hier nachziehen. Die
     eigenen Speicher-Schreibvorgänge lösen onChanged ebenfalls aus – Anzeige
     aktualisieren ist idempotent, gespeichert wird hier nicht erneut
     (kein Ping-Pong). */
  if (extensionApi && extensionApi.storage &&
      extensionApi.storage.onChanged &&
      typeof extensionApi.storage.onChanged.addListener === 'function') {
    try {
      extensionApi.storage.onChanged.addListener(function (aenderungen, bereich) {
        if (bereich !== 'local') return;
        const diff = aenderungen && aenderungen[STORAGE_KEY];
        if (!diff || !diff.newValue) return;
        // Eigen-Echo (siehe eigeneSchreibvorgaenge): nichts anzuwenden.
        const echo = eigeneSchreibvorgaenge.indexOf(signatur(diff.newValue));
        if (echo !== -1) { eigeneSchreibvorgaenge.splice(echo, 1); return; }
        einstellungen = bereinige(Object.assign({}, STANDARDS, diff.newValue));
        aktualisiereAnzeige();
      });
    } catch (e) { /* ohne Live-Sync geht es auch */ }
  }

  /* ================================================================== */
  /* START                                                                */
  /* ================================================================== */

  // Gespeicherte Einstellungen laden, dann anzeigen.
  // Beim Start nur lesen: ein Ladefehler darf gespeicherte Werte nicht
  // durch Standardwerte überschreiben. Gespeichert wird bei Bedienung.
  ladeSchluessel(STORAGE_KEY, function (res) {
    einstellungen = bereinige(Object.assign({}, STANDARDS, (res && res[STORAGE_KEY]) || {}));
    aktualisiereAnzeige();
    bedienungEinrichten();
    document.body.setAttribute('data-bereit', ''); // Marker für Tests
    $('bkl-schliessen').focus();
  });
})();

// BGer Reader – unabhängiges Projekt, nicht mit dem Schweizerischen Bundesgericht verbunden. 100 % offline, keine Datenerhebung.

/* Einstellungen im mittigen Pop-up-Fenster (per Icon-Klick geöffnet).
 * Schreibt in denselben lokalen Speicher wie content.js; das Content-Skript
 * auf der Entscheidseite wendet Änderungen live an (storage.onChanged) und
 * publiziert umgekehrt seinen Klammer-Zähler, den dieses Fenster anzeigt.
 * Keine Nachrichten an Tabs nötig, keine zusätzlichen Rechte.
 */

(function () {
  'use strict';

  /* Schlüssel und Standards: identisch zu content.js (Konsistenz ist
     testabgesichert, test-runner.js Block [13]). */
  const STORAGE_KEY = 'bger-reader-einstellungen-v2';
  const ZAEHLER_SCHLUESSEL = 'bger-reader-zaehler';

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
    farbschema: 'hell',         // hell | sepia | dunkel | kontrast | nacht
    klammern: true              // Easy-Mode: Klammern nach festem Regelsatz einklappen
  };

  /* Speicher-Strategie wie in content.js: Extension-Speicher wenn vorhanden,
     localStorage-Fallback für jsdom-Tests und die file://-Vorschau. */
  const extensionApi = typeof browser !== 'undefined' && browser.storage && browser.storage.local
    ? browser : (typeof chrome !== 'undefined' ? chrome : null);
  const verwendetPromises = typeof browser !== 'undefined' && extensionApi === browser;
  const extensionStorage = extensionApi && extensionApi.storage && extensionApi.storage.local;

  let einstellungen = Object.assign({}, STANDARDS);
  let letzterZaehlerStand = null;

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

  function speichereEinstellungen() {
    try {
      if (extensionStorage) {
        const paket = {};
        paket[STORAGE_KEY] = einstellungen;
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

  function aktualisiereAnzeige() {
    $('bkl-aktiv').checked = einstellungen.aktiv;
    $('bkl-groesse').value = einstellungen.schriftgroesse;
    $('bkl-groesse-w').textContent = einstellungen.schriftgroesse + 'px';
    $('bkl-art').value = einstellungen.schriftart;
    $('bkl-staerke').value = einstellungen.schriftstaerke;
    $('bkl-zeilenabstand').value = einstellungen.zeilenabstand;
    $('bkl-zeilenabstand-w').textContent = einstellungen.zeilenabstand;
    $('bkl-buchstaben').value = einstellungen.buchstabenabstand;
    $('bkl-buchstaben-w').textContent = (+einstellungen.buchstabenabstand).toFixed(1) + 'px';
    $('bkl-worte').value = einstellungen.wortabstand;
    $('bkl-worte-w').textContent = (+einstellungen.wortabstand).toFixed(1) + 'px';
    $('bkl-laenge').value = einstellungen.zeilenlaenge;
    $('bkl-laenge-w').textContent = einstellungen.zeilenlaenge === 0 ? 'aus' : einstellungen.zeilenlaenge;
    $('bkl-spalte').value = einstellungen.spaltenbreite;
    $('bkl-spalte-w').textContent = einstellungen.spaltenbreite + 'px';
    $('bkl-silben').checked = einstellungen.silbentrennung;
    $('bkl-farbe').value = einstellungen.farbschema;
    $('bkl-klammern').checked = einstellungen.klammern;
  }

  /* Zähler-Anzeige: gleiche Texte wie aktualisiereZaehler() in content.js,
     ergänzt um einen Hinweis, solange noch keine Entscheidseite gezählt hat. */
  function aktualisiereZaehler() {
    const z = $('bkl-zaehler');
    if (!z) return;
    if (!letzterZaehlerStand || typeof letzterZaehlerStand.anzahl !== 'number') {
      z.textContent = 'Noch kein Entscheid gezählt – die Einstellungen gelten automatisch auf allen Entscheidseiten (search.bger.ch, relevancy.bger.ch).';
      return;
    }
    const anzahl = letzterZaehlerStand.anzahl;
    z.textContent = anzahl > 0
      ? anzahl + ' Klammerbemerkung' + (anzahl === 1 ? '' : 'en') + ' eingeklappt (Pfeil ▸ anklicken zum Aufklappen).'
      : (einstellungen.aktiv && einstellungen.klammern
        ? 'Keine Klammern eingeklappt. Regel: Gesetzesverweise und inhaltliche Bemerkungen bleiben offen, Literatur und lange Klammern werden eingeklappt.'
        : '');
  }

  /* ================================================================== */
  /* BEDIENUNG                                                            */
  /* ================================================================== */

  function geaendert() {
    speichereEinstellungen();
    aktualisiereZaehler(); // leerer Text hängt von aktiv/klammern ab
  }

  function bei(id, event, fn) {
    $(id).addEventListener(event, fn);
  }

  bei('bkl-aktiv', 'change', function (e) { einstellungen.aktiv = e.target.checked; geaendert(); });
  bei('bkl-groesse', 'input', function (e) { einstellungen.schriftgroesse = +e.target.value; $('bkl-groesse-w').textContent = einstellungen.schriftgroesse + 'px'; geaendert(); });
  bei('bkl-art', 'change', function (e) { einstellungen.schriftart = e.target.value; geaendert(); });
  bei('bkl-staerke', 'change', function (e) { einstellungen.schriftstaerke = e.target.value; geaendert(); });
  bei('bkl-zeilenabstand', 'input', function (e) { einstellungen.zeilenabstand = +e.target.value; $('bkl-zeilenabstand-w').textContent = einstellungen.zeilenabstand; geaendert(); });
  bei('bkl-buchstaben', 'input', function (e) { einstellungen.buchstabenabstand = +e.target.value; $('bkl-buchstaben-w').textContent = (+einstellungen.buchstabenabstand).toFixed(1) + 'px'; geaendert(); });
  bei('bkl-worte', 'input', function (e) { einstellungen.wortabstand = +e.target.value; $('bkl-worte-w').textContent = (+einstellungen.wortabstand).toFixed(1) + 'px'; geaendert(); });
  bei('bkl-laenge', 'input', function (e) { einstellungen.zeilenlaenge = +e.target.value; $('bkl-laenge-w').textContent = einstellungen.zeilenlaenge === 0 ? 'aus' : einstellungen.zeilenlaenge; geaendert(); });
  bei('bkl-spalte', 'input', function (e) { einstellungen.spaltenbreite = +e.target.value; $('bkl-spalte-w').textContent = einstellungen.spaltenbreite + 'px'; geaendert(); });
  bei('bkl-silben', 'change', function (e) { einstellungen.silbentrennung = e.target.checked; geaendert(); });
  bei('bkl-farbe', 'change', function (e) { einstellungen.farbschema = e.target.value; geaendert(); });
  bei('bkl-klammern', 'change', function (e) { einstellungen.klammern = e.target.checked; geaendert(); });
  bei('bkl-reset', 'click', function () {
    einstellungen = Object.assign({}, STANDARDS);
    aktualisiereAnzeige();
    geaendert();
  });

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
    if (e.key === 'Escape') fensterSchliessen();
  });

  /* ================================================================== */
  /* LIVE-SYNC MIT DER ENTSCHEIDSEITE                                     */
  /* ================================================================== */

  /* Änderungen aus dem Seiten-Panel (content.js) hier nachziehen; der
     Klammer-Zähler der Seite wird angezeigt. Die eigenen Speicher-Schreibvorgänge
     lösen onChanged ebenfalls aus – Anzeige aktualisieren ist idempotent,
     gespeichert wird hier nicht erneut (kein Ping-Pong). */
  if (extensionApi && extensionApi.storage &&
      extensionApi.storage.onChanged &&
      typeof extensionApi.storage.onChanged.addListener === 'function') {
    try {
      extensionApi.storage.onChanged.addListener(function (aenderungen, bereich) {
        if (bereich !== 'local') return;
        const diff = aenderungen && aenderungen[STORAGE_KEY];
        if (diff && diff.newValue) {
          einstellungen = bereinige(Object.assign({}, STANDARDS, diff.newValue));
          aktualisiereAnzeige();
        }
        const z = aenderungen && aenderungen[ZAEHLER_SCHLUESSEL];
        if (z && z.newValue) {
          letzterZaehlerStand = z.newValue;
        }
        if (diff || z) aktualisiereZaehler();
      });
    } catch (e) { /* ohne Live-Sync geht es auch */ }
  }

  /* ================================================================== */
  /* START                                                                */
  /* ================================================================== */

  // Gespeicherte Einstellungen und letzten Zähler-Stand laden, dann anzeigen.
  // Beim Start nur lesen: ein Ladefehler darf gespeicherte Werte nicht
  // durch Standardwerte überschreiben. Gespeichert wird bei Bedienung.
  ladeSchluessel(STORAGE_KEY, function (res) {
    einstellungen = bereinige(Object.assign({}, STANDARDS, (res && res[STORAGE_KEY]) || {}));
    ladeSchluessel(ZAEHLER_SCHLUESSEL, function (resZ) {
      letzterZaehlerStand = (resZ && resZ[ZAEHLER_SCHLUESSEL]) || null;
      aktualisiereAnzeige();
      aktualisiereZaehler();
      $('bkl-schliessen').focus();
    });
  });
})();

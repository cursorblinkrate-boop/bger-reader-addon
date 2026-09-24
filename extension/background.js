// BGer Reader – unabhängiges Projekt, nicht mit dem Schweizerischen Bundesgericht verbunden. 100 % offline, keine Datenerhebung.

/* Hintergrund (Service Worker auf Chrome/Brave/Edge, Event-Seite auf Firefox;
 * Mindestversionen stehen im Manifest: Chrome 121 – erst ab da darf neben
 * service_worker auch background.scripts stehen –, Firefox 140 wegen
 * data_collection_permissions):
 * Klick auf das Extension-Symbol: zuerst eine Nachricht an den aktiven Tab
 * (tabs.sendMessage, braucht kein zusätzliches Recht). Liegt dort ein
 * Entscheid, öffnet content.js die Einstellungen als mittigen, grossen
 * Dialog über der Seite – der Entscheid bleibt sichtbar, jede Änderung ist
 * live zu sehen; ein zweiter Klick schliesst ihn. Antwortet kein Content-
 * Skript (anderer Tab), öffnet der Hintergrund ersatzweise popup.html als
 * eigenes Fenster (grössere Bedienfläche); ein erneuter Klick holt ein
 * bereits offenes Fenster nach vorne, statt ein zweites zu öffnen.
 * Fenster-IDs liegen in storage.session (flüchtig, passt zur Fenster-Lebensdauer).
 * Bis 0.10.0 öffnete jeder Klick das Fenster; auf macOS-Firefox lag es neben
 * dem Browser auf dem Schreibtisch, und der Entscheid war nicht mehr zu sehen.
 *
 * MV3-Regel: Listener synchron auf oberster Ebene registrieren (der Worker
 * wird bei jedem Ereignis neu geweckt, Modul-Variablen überleben das nicht).
 */

(function () {
  'use strict';

  const extensionApi = typeof browser !== 'undefined' && browser.storage && browser.storage.local
    ? browser : (typeof chrome !== 'undefined' ? chrome : null);
  const verwendetPromises = typeof browser !== 'undefined' && extensionApi === browser;

  const FENSTER_SCHLUESSEL = 'bger-reader-popup-fenster';
  const NACHRICHT_DIALOG = 'bger-reader-einstellungen'; // gleicher Wert in content.js
  const POPUP_BREITE = 660;
  const POPUP_HOEHE = 960;

  /* Mittige Position relativ zum übergebenen Browser-Fenster. Rein funktional,
     ohne Seiteneffekte. */
  function zentriert(win, breite, hoehe) {
    const w = win || {};
    const links = Math.round((w.left || 0) + ((w.width || 0) - breite) / 2);
    const oben = Math.round((w.top || 0) + ((w.height || 0) - hoehe) / 2);
    return { left: Math.max(0, links), top: Math.max(0, oben) };
  }

  // Für Tests (jsdom) sichtbar machen.
  if (typeof globalThis !== 'undefined') {
    globalThis.BGerReaderPopup = {
      zentriert: zentriert,
      NACHRICHT_DIALOG: NACHRICHT_DIALOG,
      POPUP_BREITE: POPUP_BREITE,
      POPUP_HOEHE: POPUP_HOEHE
    };
  }

  // Ohne Extension-APIs (jsdom, file://) endet der Hintergrund hier.
  if (!extensionApi || !extensionApi.action || !extensionApi.windows) return;

  /* Einheitlicher Promise-Aufruf: Firefox nutzt browser.* (Promise),
     Chrome chrome.* (Callback mit runtime.lastError). */
  function rufe(objekt, methode) {
    const argumente = Array.prototype.slice.call(arguments, 2);
    if (verwendetPromises) return objekt[methode].apply(objekt, argumente);
    return new Promise(function (loesen, ablehnen) {
      objekt[methode].apply(objekt, argumente.concat([function (ergebnis) {
        const fehler = extensionApi.runtime && extensionApi.runtime.lastError;
        if (fehler) ablehnen(new Error(fehler.message || 'API-Fehler'));
        else loesen(ergebnis);
      }]));
    });
  }

  // storage.session wo vorhanden (Chrome 102+, Firefox 115+), sonst storage.local.
  const sitzungsSpeicher = extensionApi.storage && extensionApi.storage.session
    ? extensionApi.storage.session : (extensionApi.storage && extensionApi.storage.local);

  function fensterOeffnen() {
    const bereit = sitzungsSpeicher
      ? rufe(sitzungsSpeicher, 'get', FENSTER_SCHLUESSEL).catch(function () { return {}; })
      : Promise.resolve({});

    bereit
      .then(function (res) {
        const id = res && res[FENSTER_SCHLUESSEL];
        if (typeof id !== 'number') throw new Error('keine gespeicherte Fenster-ID');
        // Fenster existiert noch: nur nach vorne holen (update wirft sonst
        // einen Fehler -> catch öffnet ein neues Fenster).
        return rufe(extensionApi.windows, 'update', id, { focused: true });
      })
      .catch(function () {
        return rufe(extensionApi.windows, 'getLastFocused')
          .catch(function () { return null; })
          .then(function (win) {
            const pos = zentriert(win, POPUP_BREITE, POPUP_HOEHE);
            return rufe(extensionApi.windows, 'create', {
              url: extensionApi.runtime.getURL('popup.html'),
              type: 'popup',
              width: POPUP_BREITE,
              height: POPUP_HOEHE,
              left: pos.left,
              top: pos.top,
              focused: true
            });
          })
          .then(function (neu) {
            if (!sitzungsSpeicher || !neu || typeof neu.id !== 'number') return;
            const paket = {};
            paket[FENSTER_SCHLUESSEL] = neu.id;
            return rufe(sitzungsSpeicher, 'set', paket).catch(function () {});
          });
      })
      .catch(function () { /* Fenster ist Komfort, kein Abbruchgrund */ });
  }

  /* Icon-Klick: erst den aktiven Tab fragen (content.js antwortet mit
     { ok: true } und schaltet den mittigen Dialog um). Keine Antwort – kein
     Content-Skript im Tab, also kein Entscheid – heisst Fenster öffnen. */
  function symbolGeklickt(tab) {
    const tabId = tab && typeof tab.id === 'number' ? tab.id : null;
    const gefragt = tabId === null || !extensionApi.tabs
      ? Promise.reject(new Error('kein Tab'))
      : rufe(extensionApi.tabs, 'sendMessage', tabId, { typ: NACHRICHT_DIALOG });
    gefragt
      .then(function (antwort) {
        if (!antwort || antwort.ok !== true) throw new Error('keine Antwort');
      })
      .catch(fensterOeffnen);
  }

  extensionApi.action.onClicked.addListener(symbolGeklickt);
})();

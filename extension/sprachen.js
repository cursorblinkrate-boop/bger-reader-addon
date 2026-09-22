// bger reader – unabhängiges Projekt, weder mit dem Schweizerischen Bundesgericht noch mit dem Bundesverwaltungsgericht oder Weblaw verbunden. 100 % offline, keine Datenerhebung.

/* Texte der Bedienoberfläche in vier Sprachen: Deutsch, Englisch,
 * Französisch, Italienisch. Gemeinsame Quelle für das Seiten-Panel
 * (content.js) und das Pop-up-Fenster (popup.js) – eine Datei, kein
 * Build-Schritt: das Manifest lädt sie vor content.js in denselben
 * Kontext, popup.html lädt sie vor popup.js.
 *
 * Standardsprache ist Italienisch (Vorgabe der Autorin). Bewusst keine
 * Automatik nach Browser- oder Seitensprache: die Erweiterung fragt nichts
 * über Browser oder Umgebung ab (Datenschutz).
 * Deutsch ist die Quelle: das Markup in content.js und popup.html ist
 * deutsch. uebersetze() schreibt eine andere Sprache in dieselben Elemente,
 * adressiert über die Element-IDs (label[for], data-tooltip, aria-label,
 * option-Texte) – ohne Neuaufbau, die Ereignis-Listener bleiben angeschlossen.
 *
 * Aufbau je Sprache:
 *   allgemein  Texte ohne eigenes Bedienelement (Fenstertitel, Bereiche,
 *              Wertanzeige „aus", Titel des Klammer-Pfeils im Entscheidtext)
 *   felder     je Element-ID: label (Beschriftung bzw. Knopftext),
 *              tip (data-tooltip), aria (aria-label), optionen (Wert -> Text)
 * Schriftnamen (Atkinson Hyperlegible, Luciole …) und die Sprachnamen der
 * Sprachwahl (jede in ihrer eigenen Sprache) werden nicht übersetzt.
 * Die Test-Suite prüft, dass alle Sprachen dieselben Schlüssel tragen.
 */

(function (wurzel) {
  'use strict';

  const SPRACHEN = ['de', 'en', 'fr', 'it'];
  const SPRACHNAMEN = { de: 'Deutsch', en: 'English', fr: 'Français', it: 'Italiano' };

  const TEXTE = {
    de: {
      allgemein: {
        fenstertitel: 'bger reader – Einstellungen',
        bereich: 'bger reader Einstellungen',
        allgemein: 'Einstellungen',
        erweitert: 'Erweiterte Einstellungen',
        aus: 'aus',
        klammer: 'Klammerbemerkung ein-/ausklappen'
      },
      felder: {
        'bkl-button':         { tip: 'bger reader Einstellungen öffnen', aria: 'bger reader Einstellungen öffnen' },
        'bkl-schliessen':     { tip: 'Einstellungen schliessen (Escape)', aria: 'Einstellungen schliessen' },
        'bkl-sprache':        { label: 'Sprache', tip: 'Sprache der Bedienoberfläche (Deutsch, English, Français, Italiano)', aria: 'Sprache der Bedienoberfläche wählen' },
        'bkl-aktiv':          { label: 'einschalten', tip: 'Lesemodus ein-/ausschalten', aria: 'Lesemodus ein-/ausschalten' },
        'bkl-groesse':        { label: 'Schriftgrösse', tip: 'Schriftgrösse (6 bis 50, Standard 18)', aria: 'Schriftgrösse' },
        'bkl-art':            { label: 'Schriftart', tip: 'Schriftart wählen (Vorschau in der Liste)', aria: 'Schriftart wählen',
                                optionen: { 'liberation-sans': 'Liberation Sans (Arial-ähnlich)', 'liberation-serif': 'Liberation Serif (Times-ähnlich)', sans: 'System Sans', serif: 'System Serif' } },
        'bkl-farbe':          { label: 'Hintergrund', tip: 'Hintergrund und Textfarbe wählen (Vorschau in der Liste)', aria: 'Hintergrund wählen',
                                optionen: { hell: 'Weiss', sepia: 'Sepia', dunkel: 'Dunkel', kontrast: 'Hoher Kontrast', nacht: 'Nacht (rötlich)' } },
        'bkl-dunkel':         { label: 'Oberfläche dunkel', tip: 'Panel und Einstellungsfenster dunkel darstellen, unabhängig vom Hintergrund des Entscheids und nie nach dem System', aria: 'Oberfläche dunkel: Panel und Einstellungsfenster dunkel darstellen' },
        'bkl-spalte':         { label: 'Breite', tip: 'Breite des Textrahmens in Pixel (Standard 800, die Seite selbst 625)', aria: 'Breite des Textrahmens in Pixel' },
        'bkl-klammern':       { label: 'einfach', tip: 'Klammerbemerkungen einklappen (Regel: Fundstellen wie BGE-Zitate und Literatur werden eingeklappt; Gesetzesverweise und Entscheidtext bleiben offen)', aria: 'Klammerbemerkungen einklappen' },
        'bkl-details-toggle': { label: 'erweitert', tip: 'Weitere Einstellungen ein-/ausblenden', aria: 'Erweiterte Einstellungen ein-/ausblenden' },
        'bkl-staerke':        { label: 'Schriftstärke', tip: 'Schriftstärke wählen', aria: 'Schriftstärke wählen',
                                optionen: { normal: 'normal', fett: 'fett' } },
        'bkl-zeilenabstand':  { label: 'Zeilen', tip: 'Zeilenabstand (Faktor)', aria: 'Zeilenabstand (Faktor)' },
        'bkl-absatz':         { label: 'Absatz', tip: 'Zusätzlicher Abstand nach jedem Absatz (Faktor der Schriftgrösse, 0 = Seiten-Standard)', aria: 'Absatzabstand (Faktor, 0 = Seiten-Standard)' },
        'bkl-buchstaben':     { label: 'Buchstabenabstand', tip: 'Buchstabenabstand in Pixel', aria: 'Buchstabenabstand in Pixel' },
        'bkl-worte':          { label: 'Wortabstand', tip: 'Wortabstand in Pixel', aria: 'Wortabstand in Pixel' },
        'bkl-laenge':         { label: 'Zeilenlänge', tip: 'Zeilenlänge begrenzen (Zeichen, 0 = aus)', aria: 'Zeilenlänge begrenzen (Zeichen, 0 = aus)' },
        'bkl-silben':         { label: 'Silbentrennung', tip: 'Silbentrennung ein-/ausschalten', aria: 'Silbentrennung ein-/ausschalten' },
        'bkl-ausrichtung':    { label: 'Ausrichtung', tip: 'Textausrichtung der Absätze (Standard: links)', aria: 'Textausrichtung wählen',
                                optionen: { links: 'links', mittig: 'mittig', rechts: 'rechts', blocksatz: 'Blocksatz' } },
        'bkl-spalten':        { label: 'Spalten', tip: 'Entscheidtext in 1, 2 oder 3 Spalten (Zeitungssatz)', aria: 'Anzahl Textspalten wählen',
                                optionen: { '1': '1 Spalte', '2': '2 Spalten', '3': '3 Spalten' } },
        'bkl-reset':          { label: 'Zurücksetzen',
                                tip: 'Alle Einstellungen auf Standard zurücksetzen: Lesemodus aus, Schriftgrösse 18, Schriftart System Serif, Schriftstärke normal, Zeilenabstand 1.6, Absatzabstand aus, Buchstaben- und Wortabstand 0, Zeilenlänge aus, Silbentrennung aus, Ausrichtung links, 1 Spalte, Textbreite 800 px, Hintergrund Weiss, Klammern „einfach“ ein. Sprache und dunkle Oberfläche bleiben.',
                                aria: 'Alle Einstellungen auf Standard zurücksetzen' }
      }
    },

    en: {
      allgemein: {
        fenstertitel: 'bger reader – Settings',
        bereich: 'bger reader settings',
        allgemein: 'Settings',
        erweitert: 'Advanced settings',
        aus: 'off',
        klammer: 'Show or hide parenthetical'
      },
      felder: {
        'bkl-button':         { tip: 'Open bger reader settings', aria: 'Open bger reader settings' },
        'bkl-schliessen':     { tip: 'Close settings (Escape)', aria: 'Close settings' },
        'bkl-sprache':        { label: 'Language', tip: 'Language of the interface (Deutsch, English, Français, Italiano)', aria: 'Choose interface language' },
        'bkl-aktiv':          { label: 'enable', tip: 'Turn reading mode on or off', aria: 'Turn reading mode on or off' },
        'bkl-groesse':        { label: 'Font size', tip: 'Font size (6 to 50, default 18)', aria: 'Font size' },
        'bkl-art':            { label: 'Font', tip: 'Choose a font (preview in the list)', aria: 'Choose font',
                                optionen: { 'liberation-sans': 'Liberation Sans (Arial-like)', 'liberation-serif': 'Liberation Serif (Times-like)', sans: 'System Sans', serif: 'System Serif' } },
        'bkl-farbe':          { label: 'Background', tip: 'Choose background and text colour (preview in the list)', aria: 'Choose background',
                                optionen: { hell: 'White', sepia: 'Sepia', dunkel: 'Dark', kontrast: 'High contrast', nacht: 'Night (reddish)' } },
        'bkl-dunkel':         { label: 'Dark interface', tip: 'Show the panel and the settings window in dark colours, independent of the decision’s background and never taken from the system', aria: 'Dark interface: show the panel and the settings window in dark colours' },
        'bkl-spalte':         { label: 'Text width', tip: 'Width of the text frame in pixels (default 800, the site itself 625)', aria: 'Width of the text frame in pixels' },
        'bkl-klammern':       { label: 'simplify', tip: 'Fold parentheticals away (rule: citations such as BGE/ATF references and literature are folded; references to statutes and the court’s own text stay open)', aria: 'Fold parentheticals' },
        'bkl-details-toggle': { label: 'advanced', tip: 'Show or hide further settings', aria: 'Show or hide advanced settings' },
        'bkl-staerke':        { label: 'Font weight', tip: 'Choose font weight', aria: 'Choose font weight',
                                optionen: { normal: 'normal', fett: 'bold' } },
        'bkl-zeilenabstand':  { label: 'Line spacing', tip: 'Line spacing (factor)', aria: 'Line spacing (factor)' },
        'bkl-absatz':         { label: 'Paragraph spacing', tip: 'Extra space after each paragraph (factor of the font size, 0 = site default)', aria: 'Paragraph spacing (factor, 0 = site default)' },
        'bkl-buchstaben':     { label: 'Letter spacing', tip: 'Letter spacing in pixels', aria: 'Letter spacing in pixels' },
        'bkl-worte':          { label: 'Word spacing', tip: 'Word spacing in pixels', aria: 'Word spacing in pixels' },
        'bkl-laenge':         { label: 'Line length', tip: 'Limit line length (characters, 0 = off)', aria: 'Limit line length (characters, 0 = off)' },
        'bkl-silben':         { label: 'Hyphenation', tip: 'Turn hyphenation on or off', aria: 'Turn hyphenation on or off' },
        'bkl-ausrichtung':    { label: 'Alignment', tip: 'Text alignment of the paragraphs (default: left)', aria: 'Choose text alignment',
                                optionen: { links: 'left', mittig: 'centred', rechts: 'right', blocksatz: 'justified' } },
        'bkl-spalten':        { label: 'Columns', tip: 'Decision text in 1, 2 or 3 columns (newspaper layout)', aria: 'Choose number of text columns',
                                optionen: { '1': '1 column', '2': '2 columns', '3': '3 columns' } },
        'bkl-reset':          { label: 'Reset',
                                tip: 'Reset all settings to their defaults: reading mode off, font size 18, font System Serif, weight normal, line spacing 1.6, paragraph spacing off, letter and word spacing 0, line length off, hyphenation off, alignment left, 1 column, text width 800 px, background White, “simplify” on. Language and dark interface stay.',
                                aria: 'Reset all settings to their defaults' }
      }
    },

    fr: {
      allgemein: {
        fenstertitel: 'bger reader – Paramètres',
        bereich: 'Paramètres bger reader',
        allgemein: 'Paramètres',
        erweitert: 'Paramètres avancés',
        aus: 'désactivé',
        klammer: 'Afficher ou masquer la parenthèse'
      },
      felder: {
        'bkl-button':         { tip: 'Ouvrir les paramètres bger reader', aria: 'Ouvrir les paramètres bger reader' },
        'bkl-schliessen':     { tip: 'Fermer les paramètres (Échap)', aria: 'Fermer les paramètres' },
        'bkl-sprache':        { label: 'Langue', tip: 'Langue de l’interface (Deutsch, English, Français, Italiano)', aria: 'Choisir la langue de l’interface' },
        'bkl-aktiv':          { label: 'activer', tip: 'Activer ou désactiver le mode lecture', aria: 'Activer ou désactiver le mode lecture' },
        'bkl-groesse':        { label: 'Taille de police', tip: 'Taille de police (6 à 50, par défaut 18)', aria: 'Taille de police' },
        'bkl-art':            { label: 'Police', tip: 'Choisir la police (aperçu dans la liste)', aria: 'Choisir la police',
                                optionen: { 'liberation-sans': 'Liberation Sans (proche d’Arial)', 'liberation-serif': 'Liberation Serif (proche de Times)', sans: 'Sans-serif système', serif: 'Serif système' } },
        'bkl-farbe':          { label: 'Arrière-plan', tip: 'Choisir l’arrière-plan et la couleur du texte (aperçu dans la liste)', aria: 'Choisir l’arrière-plan',
                                optionen: { hell: 'Blanc', sepia: 'Sépia', dunkel: 'Sombre', kontrast: 'Contraste élevé', nacht: 'Nuit (rougeâtre)' } },
        'bkl-dunkel':         { label: 'Interface sombre', tip: 'Afficher le panneau et la fenêtre des paramètres en mode sombre, indépendamment de l’arrière-plan de l’arrêt et jamais d’après le système', aria: 'Interface sombre : afficher le panneau et la fenêtre des paramètres en mode sombre' },
        'bkl-spalte':         { label: 'Largeur du texte', tip: 'Largeur du cadre de texte en pixels (par défaut 800, le site lui-même 625)', aria: 'Largeur du cadre de texte en pixels' },
        'bkl-klammern':       { label: 'simplifier', tip: 'Replier les parenthèses (règle : les références telles que les citations d’ATF et la doctrine sont repliées ; les renvois aux lois et le texte de l’arrêt restent ouverts)', aria: 'Replier les parenthèses' },
        'bkl-details-toggle': { label: 'avancé', tip: 'Afficher ou masquer les autres paramètres', aria: 'Afficher ou masquer les paramètres avancés' },
        'bkl-staerke':        { label: 'Graisse', tip: 'Choisir la graisse de la police', aria: 'Choisir la graisse',
                                optionen: { normal: 'normale', fett: 'gras' } },
        'bkl-zeilenabstand':  { label: 'Interligne', tip: 'Interligne (facteur)', aria: 'Interligne (facteur)' },
        'bkl-absatz':         { label: 'Espacement des paragraphes', tip: 'Espace supplémentaire après chaque paragraphe (facteur de la taille de police, 0 = valeur du site)', aria: 'Espacement des paragraphes (facteur, 0 = valeur du site)' },
        'bkl-buchstaben':     { label: 'Espacement des lettres', tip: 'Espacement des lettres en pixels', aria: 'Espacement des lettres en pixels' },
        'bkl-worte':          { label: 'Espacement des mots', tip: 'Espacement des mots en pixels', aria: 'Espacement des mots en pixels' },
        'bkl-laenge':         { label: 'Longueur de ligne', tip: 'Limiter la longueur des lignes (caractères, 0 = désactivé)', aria: 'Limiter la longueur des lignes (caractères, 0 = désactivé)' },
        'bkl-silben':         { label: 'Césure', tip: 'Activer ou désactiver la césure', aria: 'Activer ou désactiver la césure' },
        'bkl-ausrichtung':    { label: 'Alignement', tip: 'Alignement du texte des paragraphes (par défaut : gauche)', aria: 'Choisir l’alignement',
                                optionen: { links: 'gauche', mittig: 'centré', rechts: 'droite', blocksatz: 'justifié' } },
        'bkl-spalten':        { label: 'Colonnes', tip: 'Texte de l’arrêt sur 1, 2 ou 3 colonnes (mise en page journal)', aria: 'Choisir le nombre de colonnes',
                                optionen: { '1': '1 colonne', '2': '2 colonnes', '3': '3 colonnes' } },
        'bkl-reset':          { label: 'Réinitialiser',
                                tip: 'Rétablir tous les paramètres par défaut : mode lecture désactivé, taille 18, police Serif système, graisse normale, interligne 1.6, espacement des paragraphes désactivé, espacement des lettres et des mots 0, longueur de ligne désactivée, césure désactivée, alignement à gauche, 1 colonne, largeur du texte 800 px, arrière-plan Blanc, « simplifier » activé. La langue et l’interface sombre sont conservées.',
                                aria: 'Rétablir tous les paramètres par défaut' }
      }
    },

    it: {
      allgemein: {
        fenstertitel: 'bger reader – Impostazioni',
        bereich: 'Impostazioni bger reader',
        allgemein: 'Impostazioni',
        erweitert: 'Impostazioni avanzate',
        aus: 'disattivato',
        klammer: 'Mostrare o nascondere la parentesi'
      },
      felder: {
        'bkl-button':         { tip: 'Aprire le impostazioni di bger reader', aria: 'Aprire le impostazioni di bger reader' },
        'bkl-schliessen':     { tip: 'Chiudere le impostazioni (Esc)', aria: 'Chiudere le impostazioni' },
        'bkl-sprache':        { label: 'Lingua', tip: 'Lingua dell’interfaccia (Deutsch, English, Français, Italiano)', aria: 'Scegliere la lingua dell’interfaccia' },
        'bkl-aktiv':          { label: 'attivare', tip: 'Attivare o disattivare la modalità lettura', aria: 'Attivare o disattivare la modalità lettura' },
        'bkl-groesse':        { label: 'Dimensione carattere', tip: 'Dimensione del carattere (da 6 a 50, predefinita 18)', aria: 'Dimensione carattere' },
        'bkl-art':            { label: 'Carattere', tip: 'Scegliere il carattere (anteprima nell’elenco)', aria: 'Scegliere il carattere',
                                optionen: { 'liberation-sans': 'Liberation Sans (simile ad Arial)', 'liberation-serif': 'Liberation Serif (simile a Times)', sans: 'Sans-serif di sistema', serif: 'Serif di sistema' } },
        'bkl-farbe':          { label: 'Sfondo', tip: 'Scegliere sfondo e colore del testo (anteprima nell’elenco)', aria: 'Scegliere lo sfondo',
                                optionen: { hell: 'Bianco', sepia: 'Seppia', dunkel: 'Scuro', kontrast: 'Contrasto elevato', nacht: 'Notte (rossastro)' } },
        'bkl-dunkel':         { label: 'Interfaccia scura', tip: 'Mostrare il pannello e la finestra delle impostazioni in modalità scura, indipendentemente dallo sfondo della sentenza e mai in base al sistema', aria: 'Interfaccia scura: mostrare il pannello e la finestra delle impostazioni in modalità scura' },
        'bkl-spalte':         { label: 'Larghezza del testo', tip: 'Larghezza del riquadro di testo in pixel (predefinita 800, il sito stesso 625)', aria: 'Larghezza del riquadro di testo in pixel' },
        'bkl-klammern':       { label: 'semplificare', tip: 'Ripiegare le parentesi (regola: i riferimenti come le citazioni DTF e la dottrina vengono ripiegati; i rinvii alle leggi e il testo della sentenza restano aperti)', aria: 'Ripiegare le parentesi' },
        'bkl-details-toggle': { label: 'avanzate', tip: 'Mostrare o nascondere le altre impostazioni', aria: 'Mostrare o nascondere le impostazioni avanzate' },
        'bkl-staerke':        { label: 'Peso', tip: 'Scegliere il peso del carattere', aria: 'Scegliere il peso del carattere',
                                optionen: { normal: 'normale', fett: 'grassetto' } },
        'bkl-zeilenabstand':  { label: 'Interlinea', tip: 'Interlinea (fattore)', aria: 'Interlinea (fattore)' },
        'bkl-absatz':         { label: 'Spaziatura paragrafi', tip: 'Spazio aggiuntivo dopo ogni paragrafo (fattore della dimensione del carattere, 0 = valore del sito)', aria: 'Spaziatura paragrafi (fattore, 0 = valore del sito)' },
        'bkl-buchstaben':     { label: 'Spaziatura lettere', tip: 'Spaziatura delle lettere in pixel', aria: 'Spaziatura delle lettere in pixel' },
        'bkl-worte':          { label: 'Spaziatura parole', tip: 'Spaziatura delle parole in pixel', aria: 'Spaziatura delle parole in pixel' },
        'bkl-laenge':         { label: 'Lunghezza riga', tip: 'Limitare la lunghezza delle righe (caratteri, 0 = disattivato)', aria: 'Limitare la lunghezza delle righe (caratteri, 0 = disattivato)' },
        'bkl-silben':         { label: 'Sillabazione', tip: 'Attivare o disattivare la sillabazione', aria: 'Attivare o disattivare la sillabazione' },
        'bkl-ausrichtung':    { label: 'Allineamento', tip: 'Allineamento del testo dei paragrafi (predefinito: sinistra)', aria: 'Scegliere l’allineamento',
                                optionen: { links: 'sinistra', mittig: 'centrato', rechts: 'destra', blocksatz: 'giustificato' } },
        'bkl-spalten':        { label: 'Colonne', tip: 'Testo della sentenza su 1, 2 o 3 colonne (impaginazione a giornale)', aria: 'Scegliere il numero di colonne',
                                optionen: { '1': '1 colonna', '2': '2 colonne', '3': '3 colonne' } },
        'bkl-reset':          { label: 'Ripristina',
                                tip: 'Ripristinare tutte le impostazioni predefinite: modalità lettura disattivata, dimensione 18, carattere Serif di sistema, peso normale, interlinea 1.6, spaziatura paragrafi disattivata, spaziatura lettere e parole 0, lunghezza riga disattivata, sillabazione disattivata, allineamento a sinistra, 1 colonna, larghezza del testo 800 px, sfondo Bianco, «semplificare» attivo. Lingua e interfaccia scura restano invariate.',
                                aria: 'Ripristinare tutte le impostazioni predefinite' }
      }
    }
  };

  // Unbekannte oder fehlende Sprache -> Deutsch (Quelle des Markups).
  function texte(sprache) {
    return TEXTE[sprache] || TEXTE.de;
  }

  /* Nur den Textknoten eines Elements ersetzen: Knöpfe tragen neben dem
     Text ein SVG (Pfeil), das erhalten bleiben muss. */
  function textSetzen(el, text) {
    const knoten = Array.prototype.filter.call(el.childNodes, function (k) {
      return k.nodeType === 3 && k.nodeValue.trim();
    });
    if (!knoten.length) { el.appendChild(el.ownerDocument.createTextNode(text)); return; }
    knoten[0].nodeValue = text;
    knoten.slice(1).forEach(function (k) { el.removeChild(k); });
  }

  /* Schreibt die Sprache in Panel oder Pop-up. wurzel ist die Shadow-Root
     des Panels oder das document des Pop-ups; beide kennen getElementById.
     Liefert die Texte der Sprache (für Wertanzeige und Fold-Titel). */
  function uebersetze(wurzel, sprache) {
    const t = texte(sprache);
    const code = TEXTE[sprache] ? sprache : 'de';
    Object.keys(t.felder).forEach(function (id) {
      const f = t.felder[id];
      const el = wurzel.getElementById(id);
      if (!el) return;
      if (f.tip) el.setAttribute('data-tooltip', f.tip);
      if (f.aria) el.setAttribute('aria-label', f.aria);
      if (f.label !== undefined) {
        const label = wurzel.querySelector('label[for="' + id + '"]');
        if (label) textSetzen(label, f.label);
        else if (el.tagName === 'BUTTON') textSetzen(el, f.label);
      }
      if (f.optionen) {
        Object.keys(f.optionen).forEach(function (wert) {
          const o = el.querySelector('option[value="' + wert + '"]');
          if (o) o.textContent = f.optionen[wert];
        });
      }
    });
    // Bereiche: Panel (#bkl-panel, role=region) bzw. Pop-up (main und die
    // beiden Abschnitte); nur, wo das Markup ein aria-label trägt.
    [['bkl-panel', t.allgemein.bereich], ['bkl-allgemein', t.allgemein.allgemein], ['bkl-details', t.allgemein.erweitert]]
      .forEach(function (p) {
        const el = wurzel.getElementById(p[0]);
        if (el && el.hasAttribute('aria-label')) el.setAttribute('aria-label', p[1]);
      });
    const main = wurzel.querySelector('main[aria-label]');
    if (main) main.setAttribute('aria-label', t.allgemein.bereich);
    // Flagge der gewählten Sprache neben der Sprachwahl (CSS blendet die übrigen aus).
    const wahl = wurzel.querySelector('.bkl-sprachwahl');
    if (wahl) wahl.setAttribute('data-sprache', code);
    // Sprache für Vorlesewerkzeuge: am Shadow-Host des Panels bzw. am Dokument.
    if (wurzel.host) wurzel.host.setAttribute('lang', code);
    else if (wurzel.documentElement) {
      wurzel.documentElement.setAttribute('lang', code);
      wurzel.title = t.allgemein.fenstertitel;
    }
    return t;
  }

  wurzel.BGerReaderSprachen = {
    SPRACHEN: SPRACHEN,
    SPRACHNAMEN: SPRACHNAMEN,
    TEXTE: TEXTE,
    texte: texte,
    uebersetze: uebersetze
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

// BGer Reader – unabhängiges Projekt, weder mit dem Schweizerischen Bundesgericht noch mit dem Bundesverwaltungsgericht oder Weblaw verbunden. 100 % offline, keine Datenerhebung.

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
        // Seitenwechsel-Balken („BGE 116 Ia 359 S. 362") liegen mitten im Absatz,
        // sind aber kein Entscheidtext: weder zur Länge noch zu den Ziffern
        // einer Klammer zählen. Ebenso die Beschriftungs-Chips der
        // Markierungen auf bvger.weblaw.ch („Zitierte BVGE" samt Icons,
        // .markedHtmlContentWrapper > span), die die App neben die
        // markierte Stelle setzt.
        if (el && el.closest('script, style, .pagebreak, .markedHtmlContentWrapper > span')) continue;
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

    /* ---------- Einklapp-Regeln ---------- */
    // Grundsatz (Vorgabe der Autorin): Eingeklappt wird, was FUNDSTELLE ist.
    // Fundstellen lesen sich wie eine Rechnung – Zahlenketten, deren Inhalt
    // man nicht im Kopf hat (BGE 135 II 45 E. 3.2 S. 47) – und lenken ab.
    // Alles andere ist Entscheidtext und bleibt offen, auch wenn Zahlen
    // darin vorkommen: Gesetzesverweise (Art. 8 BV – der Gehalt muss ohnehin
    // verstanden werden), Beträge, Mengen, Daten, interne Verweise auf die
    // eigenen Erwägungen (E. 4.2), inhaltliche Bemerkungen, Latinismen.
    //
    // Länge und Ziffernanzahl sind KEIN Kriterium mehr. Eine Klammer wird
    // nur eingeklappt, wenn sie positiv als Fundstelle erkannt ist.
    //
    // Ablauf pro Klammer:
    //   1. Normalisieren (geschützte Leerzeichen, Apostrophe der Website).
    //   2. Rechtsprechung irgendwo im Inhalt -> einklappen, auch wenn kurz
    //      (BGE 123 II 328 allein ist bereits eine Fundstelle).
    //   3. Sonst am Semikolon in Segmente teilen (Schweizer Zitierkonvention
    //      für getrennte Fundstellen) und jedes Segment auf bibliografische
    //      FORM prüfen – Autorensignatur, Auflage, "in:", Werktyp, Zeitschrift,
    //      Randnote, Erscheinungsjahr sammeln Punkte. Ein Segment, das nur
    //      aus Gesetzesverweisen besteht, zählt nicht; erkennbare Prosa
    //      braucht eine höhere Schwelle.
    //   4. Kein Segment erreicht die Schwelle -> offen.
    // Jede Stelle bleibt einzeln aufklappbar (reversibel).

    /* Politik – hier umstellen, wenn sich die Vorgabe ändert. */
    const POLITIK = {
      rechtsprechungEinklappen: true,   // BGE/ATF/DTF, Urteile mit Aktenzeichen
      literaturEinklappen: true,        // Kommentare, Aufsätze, Lehrbücher
      literaturSchwelle: 3,             // Punkte, ab denen ein Segment Literatur ist
      literaturSchwelleProsa: 5         // strengere Schwelle, wenn das Segment wie ein Satz aussieht
    };

    function normalisiere(s) {
      return s
        .replace(/[     ]/g, ' ')  // geschützte/schmale Leerzeichen
        .replace(/[’‘ʼ´`]/g, "'")       // typografische Apostrophe
        .replace(/\s+/g, ' ')
        .trim();
    }

    /* ---- Rechtsprechung: jede Fundstelle genügt ---- */
    // Amtliche Sammlung: BGE 135 II 45, ATF 145 I 207, DTF 120 Ia 1, BVGE 2019 I 1.
    // Bundesverwaltungsgericht nach Jahr/Nummer, wie das BVGer selbst zitiert
    // (bvger.weblaw.ch): BVGE 2014/1, BVGE 2020 VII/4, ATAF 2007/6, DTAF 2010/53.
    const BGE_RE = /\b(?:BGE|ATF|DTF)\s+\d{1,3}\s+[IVX]{1,4}[ab]?\s+\d{1,4}\b|\bBVGE\s+(?:19|20)\d{2}\s+[IVX]{1,4}\s+\d{1,4}\b|\b(?:BVGE|ATAF|DTAF)\s+(?:19|20)\d{2}(?:\s+[IVX]{1,4})?\/\d{1,4}\b|\bTPF\s+(?:19|20)\d{2}\s+\d{1,4}\b/;
    // Aktenzeichen: 6B_123/2020, 1C_45/2019, 6S.12/2004 (BGer); A-1234/2019 (BVGer);
    // SK.2019.12, BB.2020.5 (BStGer). Nicht: "S. 12", "N. 12" (Leerzeichen dazwischen).
    const AKTENZEICHEN_RE = /(?:^|[^A-Za-z0-9])(?:\d[A-Z]{1,2}[_.]\d{1,4}\/\d{2,4}|[A-Z]-\d{1,5}\/\d{4}|[A-Z]{2}\.(?:19|20)\d{2}\.\d{1,4})\b/;
    // Praxis des Bundesgerichts, EGMR/EuGH
    const WEITERE_RSPR_RE = /\bPra\s+\d{2,4}\s+Nr\.?\s*\d+|\b(?:EGMR|CourEDH|ECHR|EuGH|CJUE|CJEU)\b[^;]*\d|\bC-\d{1,4}\/\d{2}\b/;

    // Das EIGENE Aktenzeichen im Rubrum ("dossier 1C_338/2018", "Verfahren
    // 6B_1/2020") verweist auf nichts Nachzuschlagendes – es bleibt offen.
    // Ein zitiertes Urteil ("Urteil 6B_220/2011", "arrêt 1C_385/2012") ist
    // dagegen eine Fundstelle.
    const EIGENES_DOSSIER_RE = /^(?:dossier|Verfahren|Verfahrensnummer|procédure|procedimento|cause|causa|incarto|Geschäfts-?Nr\.?|Geschäftsnummer)\s+\d[A-Z]{1,2}[_.]\d{1,4}\/\d{2,4}$/i;

    function istRechtsprechung(s) {
      if (EIGENES_DOSSIER_RE.test(s)) return false;
      return BGE_RE.test(s) || AKTENZEICHEN_RE.test(s) || WEITERE_RSPR_RE.test(s);
    }

    /* ---- Gesetzesverweise: Veto für Segmente, die nur daraus bestehen ---- */
    // Erlasskürzel generisch: 2–10 Buchstaben mit mindestens zwei Grossbuchstaben
    // (BV, OR, StGB, SchKG, BetmG, VStrR, LTF, CPP …), optional römischer
    // Zusatz (UNO-Pakt II). Keine Liste nötig – jede künftige Abkürzung passt.
    const KUERZEL = '(?=[A-Za-zÄÖÜäöü\\-]{2,10}\\b)(?:[a-zäöü\\-]*[A-ZÄÖÜ]){2}[A-Za-zÄÖÜäöü\\-]*(?:\\s+[IVX]{1,3}\\b)?';
    // Untergliederung nach der Artikelzahl (Abs., al., cpv., Ziff., ch., n., lit., let., lett., Bst., Satz)
    const GLIED = '(?:\\s*(?:Abs|al|cpv|Ziff|ch|n|lit|let|lett|Bst|Satz|Halbsatz|Unterabs|para|par)\\.?\\s*[\\divx]+[a-z]?\\b\\.?)*';
    const ZAHL = '\\d+[a-z]{0,6}(?:\\s*(?:bis|ter|quater|quinquies|sexies|septies|octies|novies|decies)\\b)?';
    const FF = '(?:\\s*(?:ff|f)\\.)?';
    const VERBINDER = '(?:\\s*(?:und|et|e|sowie|oder|ou|o|bzw\\.|resp\\.|i\\.\\s*V\\.\\s*m\\.|in Verbindung mit|en relation avec|in combinazione con|,|-|–|bis)\\s*)';
    const ARTIKEL = '(?:\\b(?:a|alt|n)?(?:[Aa]rt(?:\\.|ikel|icle|icolo)?|§|§§|Par\\.?|Ziff\\.|Ziffer)\\s*' + ZAHL + GLIED + FF + ')';
    const FOLGE = '(?:' + VERBINDER + '(?:[Aa]rt\\.?\\s*)?' + ZAHL + GLIED + FF + ')*';
    const GESETZESVERWEIS_RE = new RegExp(ARTIKEL + FOLGE + '(?:\\s*' + KUERZEL + ')?', 'g');

    // Erlassnennung ausgeschrieben, Fundstellen der Sammlungen, Fassungsangaben.
    const ERLASS_TEXT_RE = /\b(?:Bundesgesetz|Bundesverfassung|Verordnung|Gesetz|Reglement|Konkordat|Übereinkommen|Abkommen|Loi fédérale|Ordonnance|Constitution|Legge federale|Ordinanza|Costituzione)\b(?:\s+(?:vom|du|del|della)\s+\d{1,2}\.?\s*\S+\s+(?:19|20)\d{2})?(?:\s+(?:über|betreffend|zum|zur|sur|concernant|relative à|su|sulla|sul|sui|sugli)\s+[^,;()]+)?/gi;
    const SAMMLUNG_RE = /\b(?:SR|RS|AS|RO|RU|BBl|FF)\s+\d{1,4}(?:[.\s]\d{1,4})*\b/g;
    const FASSUNG_RE = /\b(?:in der (?:bis(?: zum| Ende| am)?|ab|seit|vom|am)\s+[^,;()]+?\s+(?:geltenden|gültigen|massgeblichen|massgebenden|anwendbaren)\s+Fassung|in der (?:hier |damals |heute )?(?:massgeblichen|massgebenden|geltenden|ursprünglichen|alten|neuen) Fassung|in der Fassung (?:vom|gemäss|nach)\s+[^,;()]+|in Kraft (?:seit|bis|getreten am)\s+[^,;()]+|aufgehoben (?:per|am|mit)\s+[^,;()]+|dans sa (?:teneur|version) (?:en vigueur|applicable)[^,;()]*|nella versione (?:in vigore|applicabile)[^,;()]*)/gi;
    const DATUM_RE = /\b\d{1,2}\.?\s*(?:Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|Jan|Feb|Mär|Apr|Jun|Jul|Aug|Sep|Sept|Okt|Nov|Dez)\.?\s+(?:19|20)\d{2}\b|\b\d{1,2}\.\d{1,2}\.(?:19|20)\d{2}\b/g;
    const FUELLWORT_RE = /\b(?:gemäss|gemäß|nach|gestützt auf|im Sinne (?:von|des|der)|i\.\s*S\.\s*(?:v|d)\.|au sens de|ai sensi|selon|conformément à|vgl\.|cf\.|siehe|s\.|dazu|hierzu|hiezu|auch|insbesondere|namentlich|sowie|und|oder|bzw\.|je|jeweils|analog|sinngemäss|sinngemäß|per analogiam|e contrario|a contrario|Umkehrschluss|Abs|al|lit|ch|Ziff|erster|zweiter|dritter|erste|zweite|dritte|Satz|Halbsatz|zweiter Halbsatz|in fine|a\.E\.|am Ende|Ingress|Einleitungssatz|Randtitel|Marginalie|Sachüberschrift|Titel|Kapitel|Abschnitt|des|der|die|das|den|dem|le|la|les|il|lo|di|del|della|dell')\b\.?/gi;

    function hatGesetzesmarker(s) {
      return /\b(?:a|alt|n)?[Aa]rt(?:\.|ikel|icle|icolo)?\s*\d|§\s*\d|\b(?:SR|RS)\s+\d|\b(?:Bundesgesetz|Verordnung|Loi fédérale|Ordonnance|Legge federale|Ordinanza)\b/.test(s);
    }

    // Entfernt alles, was zu einem Gesetzesverweis gehört. Was übrig bleibt,
    // ist der "Rest" – Text, der kein Gesetz ist.
    function ohneGesetz(s) {
      return s
        .replace(FASSUNG_RE, ' ')
        .replace(ERLASS_TEXT_RE, ' ')
        .replace(SAMMLUNG_RE, ' ')
        .replace(GESETZESVERWEIS_RE, ' ')
        .replace(DATUM_RE, ' ')
        .replace(FUELLWORT_RE, ' ')
        .replace(/[^\p{L}\s]/gu, ' ')   // Satzzeichen und Ziffern
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Segment besteht im Wesentlichen aus Gesetzesverweisen: Rest ist klein,
    // und zwar RELATIV zur Länge (eine Kette aus acht Verweisen darf mehr
    // Rest haben als ein einzelner).
    function nurGesetzesverweise(segment) {
      if (!hatGesetzesmarker(segment)) return false;
      const rest = ohneGesetz(segment);
      return rest.length <= Math.max(15, Math.round(segment.length * 0.2));
    }

    /* ---- Prosa: Segment sieht aus wie ein Satz ---- */
    const FUNKTIONSWORT_RE = /\b(?:dass|weil|wobei|sofern|soweit|obwohl|obschon|indem|zumal|welche[rsn]?|dessen|deren|ist|sind|war|waren|hat|haben|hatte|hatten|wird|werden|wurde|wurden|kann|können|konnte|muss|müssen|musste|soll|sollen|darf|dürfen|nicht|nur|bereits|jedoch|allerdings|insoweit|zutreffend|zu Recht|offensichtlich|unbestritten|est|sont|était|a été|ont|peut|doit|que|qui|dont|è|sono|era|che|cui)\b/g;

    function istProsa(segment) {
      const treffer = segment.match(FUNKTIONSWORT_RE);
      return !!treffer && treffer.length >= 2;
    }

    /* ---- Literatur: Punkte für bibliografische Form ---- */
    const LITERATUR_SIGNALE = [
      // Autorensignatur in Kapitälchen mit Komma: STRATENWERTH, / NIGGLI/WIPRÄCHTIGER,
      { re: /\b[A-ZÄÖÜ][A-ZÄÖÜ'\-]{3,}(?:\s+[A-ZÄÖÜ][A-ZÄÖÜ'\-]{3,})*(?:\s*\/\s*[A-ZÄÖÜ][A-ZÄÖÜ'\-]{3,})*\s*,/, punkte: 2, name: 'Autor' },
      // Autorenpaar in Normalschrift: Niggli/Wiprächtiger
      { re: /\b[A-ZÄÖÜ][a-zäöüéèàçâêîôû]{2,}(?:-[A-ZÄÖÜ][a-zäöü]+)?\s*\/\s*[A-ZÄÖÜ][a-zäöüéèàçâêîôû]{2,}/, punkte: 2, name: 'Autor/Autor' },
      // Auflage: 4. Aufl. / 4. A. / 2e éd. / 3a ed.
      { re: /\b\d{1,2}\.\s*(?:Aufl|A)\.|\b\d{1,2}(?:e|ème|re|ère|a|st|nd|rd|th)?\s*(?:éd|ed|ediz|Aufl)\./i, punkte: 2, name: 'Auflage' },
      // "in:" leitet Sammelband/Zeitschrift ein
      { re: /(?:^|[\s(])in\s*:/i, punkte: 2, name: 'in:' },
      // Werktyp und Fachverlage
      { re: /\b(?:Kommentar|Commentaire|Commentario|Handkommentar|Praxiskommentar|Kurzkommentar|Handbuch|Lehrbuch|Grundriss|Traité|Précis|Manuel|Trattato|Festschrift|Festgabe|Gedenkschrift|Diss\.|Dissertation|Habil\.|Habilitation|Schulthess|Stämpfli|Helbing|Dike|Nomos|Orell Füssli)\b/, punkte: 2, name: 'Werk' },
      // Kommentar-Kürzel mit Bearbeiter: BSK StPO-Schmid, OFK ZGB-Müller, CR CP-Dupont
      { re: /\b(?:BSK|BK|ZK|OFK|CHK|SHK|KuKo|CR|CS|CPra|BeK|HK|PK|SK)\b\s*(?:[A-Za-zÄÖÜäöü]{2,10}\s*)?[-–]\s*[A-ZÄÖÜ][a-zäöüéè]+/, punkte: 2, name: 'Kommentar-Kürzel' },
      // Zeitschriftenkürzel
      { re: /\b(?:ZStrR|AJP|PJA|SJZ|RSJ|JdT|ZBJV|ZSR|RDS|ZBl|SZW|RSDA|ZBGR|FamPra|SZS|RSAS|ARV|DTA|ZZZ|BJM|GesKR|ASA|StR|RDAF|SemJud|RPS|Jusletter|plädoyer|forumpoenale|sic!|Anwaltsrevue|AnwR|ZKE|ZESAR|SJIR|SRIEL|ZVR|iusNet|ius\.full)\b/, punkte: 2, name: 'Zeitschrift' },
      // Rückverweis auf bereits zitiertes Werk
      { re: /\b(?:a\.\s*a\.\s*O\.|op\.\s*cit\.|loc\.\s*cit\.|ibid(?:em)?\.?|ebd\.|passim)/i, punkte: 3, name: 'Rückverweis' },
      // Herausgeber
      { re: /\b(?:Hrsg|Hg|éd|eds|a cura di|dir)\.|\bHerausgeber/i, punkte: 1, name: 'Hrsg' },
      // Online-Quelle mit Abrufdatum: "consulté le", "abgerufen am", "zuletzt besucht"
      { re: /\b(?:consulté le|consultée le|abgerufen am|abgerufen|zuletzt (?:besucht|abgerufen|eingesehen)|besucht am|eingesehen am|consultato il|accessed|visited)\b/i, punkte: 2, name: 'Abrufdatum' },
      // Online-Hinweis oder Adresse
      { re: /\b(?:en ligne|online|im Internet|www\.)|https?:\/\//i, punkte: 1, name: 'online' },
      // Randnote/Seite: N. 12, Rz. 45, S. 123, p. 45, n° 12
      { re: /\b(?:N|Rz|Rn|Nr|S|p|pp|pag|n|nn|no)\.?\s*\d|\bn°\s*\d/, punkte: 1, name: 'Fundstelle' },
      // Erscheinungsjahr (Tagesdaten werden vorher entfernt)
      { re: /\b(?:19|20)\d{2}\b/, punkte: 1, name: 'Jahr' }
    ];

    function literaturPunkte(segment) {
      // Gesetzesverweise und Tagesdaten vorher entfernen: "Art. 6 EMRK," darf
      // nicht als Autorensignatur zählen, "12. Januar 2021" nicht als Jahr.
      const s = segment.replace(GESETZESVERWEIS_RE, ' ').replace(DATUM_RE, ' ');
      let punkte = 0;
      LITERATUR_SIGNALE.forEach(function (sig) {
        if (sig.re.test(s)) punkte += sig.punkte;
      });
      return punkte;
    }

    function istLiteratur(segment) {
      if (nurGesetzesverweise(segment)) return false;   // Veto: reiner Gesetzesverweis
      const punkte = literaturPunkte(segment);
      const schwelle = istProsa(segment) ? POLITIK.literaturSchwelleProsa : POLITIK.literaturSchwelle;
      return punkte >= schwelle;
    }

    /* ---- Entscheidung pro Klammer ---- */
    function sollEingeklapptWerden(klammerInhalt) {
      const text = normalisiere(klammerInhalt);
      if (!text) return false;
      if (POLITIK.rechtsprechungEinklappen && istRechtsprechung(text)) return true;
      if (!POLITIK.literaturEinklappen) return false;
      return text.split(/\s*;\s*/).some(istLiteratur);
    }

    // Für Diagnose und Tests: erklärt, WARUM eine Klammer eingeklappt wird.
    function begruendung(klammerInhalt) {
      const text = normalisiere(klammerInhalt);
      if (!text) return 'leer';
      if (istRechtsprechung(text)) return 'Rechtsprechung';
      const segmente = text.split(/\s*;\s*/);
      for (let i = 0; i < segmente.length; i++) {
        const seg = segmente[i];
        if (nurGesetzesverweise(seg)) continue;
        const punkte = literaturPunkte(seg);
        const prosa = istProsa(seg);
        const schwelle = prosa ? POLITIK.literaturSchwelleProsa : POLITIK.literaturSchwelle;
        if (punkte >= schwelle) return 'Literatur (' + punkte + ' Punkte' + (prosa ? ', Prosa-Schwelle' : '') + ')';
      }
      return 'offen';
    }

    /* ---------- Ein-/Ausklappen (reversibel, formatierungserhaltend) ---------- */

    /* Titel des Klammer-Pfeils in der Sprache der Bedienoberfläche;
       gesetzt über beschriftungSetzen() aus sprachAnwenden(). */
    let klammerTitel = 'Klammerbemerkung ein-/ausklappen';
    function beschriftungSetzen(texte) {
      if (texte && texte.klammer) klammerTitel = texte.klammer;
    }

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
        // Verlagerte Seitenwechsel zuerst an ihren Platzhalter im Fold-Inhalt
        // zurücksetzen – so stimmt der Roundtrip exakt (Position und Text).
        (fold._bklPagebreaks || []).forEach(function (v) {
          const ziel = v.platzhalter.parentNode;
          if (!ziel) return;
          v.knoten.forEach(function (k) { ziel.insertBefore(k, v.platzhalter); });
          ziel.removeChild(v.platzhalter);
        });
        if (content) {
          while (content.firstChild) eltern.insertBefore(content.firstChild, fold);
        }
        eltern.removeChild(fold);
        if (eltern.normalize) eltern.normalize();
      });
    }

    /* ---------- Block verarbeiten ---------- */

    function blockVerarbeiten(block) {
      const t = textKarteAufbauen(block);
      if (!t.gesamt) return 0;

      // Nur Top-Level-Klammern: verschachtelte Klammern bleiben Teil des
      // Inhalts ihrer äusseren Klammer, es gibt kein Fold im Fold.
      const kandidaten = klammernFinden(t.gesamt).filter(function (k) {
        return k.tiefe === 0 && sollEingeklapptWerden(k.inhalt);
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
        knopf.title = klammerTitel;
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

        // Seitenwechsel (BGE-Paginierung) aus dem Fold-Inhalt herauslösen:
        // der Seitenzahl-Balken bleibt sichtbar direkt vor dem Fold, statt im
        // versteckten Inhalt zu verschwinden. Ein Kommentar-Platzhalter markiert
        // die ursprüngliche Stelle; die Referenz liegt am Fold-Element
        // (fold._bklPagebreaks) für den exakten Rückbau.
        const verlagert = [];
        content.querySelectorAll('.pagebreak').forEach(function (pb) {
          const knoten = [];
          const vor = pb.previousSibling;
          // ein leerer page-Anker direkt davor gehört zum Seitenwechsel
          if (vor && vor.nodeType === 1 && vor.tagName === 'A' &&
              /^page\d+$/.test(vor.getAttribute('name') || '') && !vor.textContent.trim()) {
            knoten.push(vor);
          }
          knoten.push(pb);
          const platzhalter = document.createComment('bkl-pb');
          knoten[0].parentNode.insertBefore(platzhalter, knoten[0]);
          knoten.forEach(function (k) { fold.parentNode.insertBefore(k, fold); });
          verlagert.push({ platzhalter: platzhalter, knoten: knoten });
        });
        if (verlagert.length) fold._bklPagebreaks = verlagert;
        anzahl++;
      });
      return anzahl;
    }

    /* ---------- Öffentliche API ---------- */

    return {
      textKarteAufbauen: textKarteAufbauen,
      klammernFinden: klammernFinden,
      sollEingeklapptWerden: sollEingeklapptWerden,
      begruendung: begruendung,
      blockVerarbeiten: blockVerarbeiten,
      einzelnUmschalten: einzelnUmschalten,
      alleUmschalten: alleUmschalten,
      allesAufklappenUndEntfernen: allesAufklappenUndEntfernen,
      beschriftungSetzen: beschriftungSetzen
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
    schriftart: 'serif',        // serif | sans | atkinson | luciole | garamond | opendyslexic | comicneue | liberation-serif | liberation-sans
    schriftstaerke: 'normal',   // normal | fett
    zeilenabstand: 1.6,         // Faktor
    buchstabenabstand: 0,       // px
    wortabstand: 0,             // px
    zeilenlaenge: 0,            // 0 = unbegrenzt, sonst Zeichen (ch)
    spaltenbreite: 800,         // px – Breite der Textspalte im Lesemodus (Vorgabe der Autorin; die Seite selbst hat 625)
    silbentrennung: false,
    farbschema: 'hell',         // hell | sepia | dunkel | kontrast | nacht
    klammern: true,             // „einfach": Klammern nach festem Regelsatz einklappen
    ausrichtung: 'links',       // links | mittig | rechts | blocksatz
    spalten: 1,                 // 1 | 2 | 3 Textspalten (Zeitungssatz)
    absatzabstand: 0,           // em – zusätzlicher Abstand nach jedem Absatz, 0 = Seiten-Standard
    oberflaecheDunkel: false,   // Bedienoberfläche (Panel und Pop-up) dunkel – eigene Wahl per Schalter, unabhängig
                                // vom Hintergrund des Entscheids und nie nach dem System (kein prefers-color-scheme).
    sprache: 'it'               // Sprache der Bedienoberfläche: it | de | en | fr (Texte in sprachen.js).
                                // Standard Italienisch nach Vorgabe der Autorin; bewusst KEINE Automatik nach
                                // Browser- oder Seitensprache – die Erweiterung fragt nichts ab (Datenschutz).
  };

  /* Speicher-Strategie (Privacy: 100 % offline, nichts verlässt das Gerät):
   * – Extension: browser.storage.local / chrome.storage.local → Einstellungen gelten domain-übergreifend
   *   (search.bger.ch, relevancy.bger.ch UND bvger.weblaw.ch), bleiben aber lokal.
   * – Testumgebung (jsdom, keine Extension-API): localStorage-Fallback.
   * browser verwendet Promises, chrome unterstützt Callbacks.
   */
  const extensionApi = typeof browser !== 'undefined' && browser.storage && browser.storage.local
    ? browser : (typeof chrome !== 'undefined' ? chrome : null);
  const verwendetPromises = typeof browser !== 'undefined' && extensionApi === browser;
  const extensionStorage = extensionApi && extensionApi.storage && extensionApi.storage.local;

  let einstellungen = Object.assign({}, STANDARDS);

  // Entfernt veraltete Schlüssel aus gespeicherten Einstellungen
  // (z. B. klammerModus/klammerMindestlaenge aus Versionen < 0.4.0).
  function bereinige(e) {
    Object.keys(e).forEach(function (k) {
      if (!(k in STANDARDS)) delete e[k];
    });
    return e;
  }

  function ladeEinstellungen(fertig) {
    function uebernehmen(res) {
        einstellungen = bereinige(Object.assign({}, STANDARDS, (res && res[STORAGE_KEY]) || {}));
        fertig();
    }
    if (extensionStorage) {
      try {
        if (verwendetPromises) {
          extensionStorage.get(STORAGE_KEY).then(uebernehmen, function () { fertig(); });
        } else {
          extensionStorage.get(STORAGE_KEY, function (res) {
            if (extensionApi.runtime && extensionApi.runtime.lastError) { fertig(); return; }
            uebernehmen(res);
          });
        }
      } catch (e) { fertig(); }
      return;
    }
    try {
      const gespeichert = JSON.parse(localStorage.getItem(STORAGE_KEY));
      einstellungen = bereinige(Object.assign({}, STANDARDS, gespeichert || {}));
    } catch (e) { /* Standardwerte behalten */ }
    fertig();
  }

  /* Eigene Schreibvorgänge merken: storage.onChanged meldet auch die
     Schreibvorgänge DIESER Seite (Echo), und zwar asynchron. Das Echo wird
     am geschriebenen Paket erkannt, nicht am aktuellen Stand – der kann sich
     in der Zwischenzeit weiterbewegt haben (zweite Einstellung innerhalb der
     Bündelung), und das Echo des ersten Schreibens drehte sie sonst zurück. */
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
  /* CSS – nur Klasse + CSS-Variablen, Seitenstruktur bleibt unberührt    */
  /* ================================================================== */

  const seitenCss = `
    /* Seitenrahmen (Kopfband, linke Navigation, Seitengrund): liegt ausserhalb
       von div.eit und bliebe weiss – greller Mischzustand auf dunklen Schemata.
       Daher Seitengrund und Grundtext des gesamten Dokuments einfärben. */
    /* Auch <html> selbst einfärben: search.bger.ch (Jahia-Rahmen) setzt
       html{background:#FFF} und body{height:100%}. Der body ist damit nur eine
       Bildschirmhöhe hoch, und weil <html> einen eigenen Hintergrund hat,
       reicht die body-Farbe nicht bis auf die Zeichenfläche durch – unterhalb
       der ersten Bildschirmhöhe schien links neben dem Entscheid das weisse
       <html> durch. relevancy.bger.ch kennt keine der beiden Regeln, dort
       trat der Fehler deshalb nie auf. */
    html.bkl-aktiv {
      background-color: var(--bkl-bg) !important;
    }
    html.bkl-aktiv body {
      background-color: var(--bkl-bg) !important;
      color: var(--bkl-fg) !important;
    }
    /* Alle Links der Seite (Rahmen-Navigation, linke Menüspalte, Entscheid).
       Der Highlight-Schutz unten ist spezifischer und gewinnt fuer die
       gelben Suchbegriff-Markierungen. */
    html.bkl-aktiv body a { color: var(--bkl-link) !important; }
    /* Formularelemente der Site (Suche-Feld, Selects, Buttons) bleiben hell
       und benutzbar – nicht mit Schemafarben einfärben. Unsere eigenen
       Fold-Pfeile (button.bkl-toggle) sind davon ausgenommen. */
    html.bkl-aktiv input,
    html.bkl-aktiv select,
    html.bkl-aktiv textarea,
    html.bkl-aktiv button:not(.bkl-toggle) {
      background-color: #ffffff !important;
      color: #1a1a1a !important;
      border-color: #999999 !important;
    }
    /* Trennlinien im Seitenrahmen ans Schema anpassen (sonst unsichtbar). */
    html.bkl-aktiv hr { border-color: var(--bkl-border) !important; }

    /* Entscheidcontainer: Hintergrund und Textfarbe (Seiten-CSS setzt div.eit auf weiss) */
    html.bkl-aktiv div.eit {
      background-color: var(--bkl-bg) !important;
      color: var(--bkl-fg) !important;
    }
    /* Entscheidabsätze: Typografie. Absatzstruktur bleibt vollständig erhalten.
       div.paraatf = BGE-Ansicht (clir/relevancy), div.para = aza-Ansicht (Weitere Urteile ab 2000),
       .bkl-text (Block) und .bkl-text p = bvger.weblaw.ch (Klasse zur Laufzeit gesetzt,
       siehe weblawTextblock; das Site-CSS fixiert am Segment Poppins 16px/28px
       mit !important, die Absatzregel hier ist spezifischer). */
    html.bkl-aktiv .bkl-text,
    html.bkl-aktiv .bkl-text p,
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
    /* Links im gesamten Entscheidcontainer: das Site-CSS setzt div.eit-Links
       generell auf schwarz (a:link #000, a:visited #666) – auf dunklen
       Schemata unleserlich, daher generell überschreiben (deckt auch
       Kopf-/Fusszeilen-Links ab, nicht nur Absätze und Boxen). */
    html.bkl-aktiv div.eit a { color: var(--bkl-link) !important; }

    /* Suchbegriff-Markierungen der Site (gelber Grund) müssen dunklen Text
       behalten – auch verschachtelte Links. Hintergrundfarbe unangetastet.
       Steht nach der generellen Link-Regel und ist spezifischer. */
    html.bkl-aktiv div.eit .concept_match,
    html.bkl-aktiv div.eit .exact_match,
    html.bkl-aktiv div.eit .complete_match,
    html.bkl-aktiv div.eit .inexact_match,
    html.bkl-aktiv div.eit .incomplete_match { color: #1a1a1a !important; }
    html.bkl-aktiv div.eit .concept_match a,
    html.bkl-aktiv div.eit .exact_match a,
    html.bkl-aktiv div.eit .complete_match a,
    html.bkl-aktiv div.eit .inexact_match a,
    html.bkl-aktiv div.eit .incomplete_match a { color: #1a1a1a !important; }

    /* Seiten-Boxen der Entscheidseite (Fixture bger_frauenstimmrecht.html):
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

    /* Zeilenlänge begrenzen: NUR wenn eingestellt (> 0 Zeichen), Klasse bkl-maxw
       auf <html>. Im Standard bleibt der Text pixel-identisch an seiner
       Originalposition (kein margin:auto, kein max-width). */
    html.bkl-aktiv.bkl-maxw .bkl-text p,
    html.bkl-aktiv.bkl-maxw div.paraatf,
    html.bkl-aktiv.bkl-maxw div.para {
      max-width: var(--bkl-maxw) !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    /* Ausrichtung: NUR bei Abweichung vom Seiten-Standard (linksbündig),
       Klasse bkl-ausrichtung auf <html>. */
    html.bkl-aktiv.bkl-ausrichtung .bkl-text p,
    html.bkl-aktiv.bkl-ausrichtung div.paraatf,
    html.bkl-aktiv.bkl-ausrichtung div.para {
      text-align: var(--bkl-align) !important;
    }

    /* Absatzabstand: NUR wenn eingestellt (> 0 em), Klasse bkl-absatz auf <html>. */
    html.bkl-aktiv.bkl-absatz .bkl-text p,
    html.bkl-aktiv.bkl-absatz div.paraatf,
    html.bkl-aktiv.bkl-absatz div.para {
      margin-bottom: var(--bkl-absatz) !important;
    }

    /* Textspalten (Zeitungssatz): der gemeinsame Elternknoten aller
       Entscheidabsätze erhält zur Laufzeit die Klasse bkl-spalten-container
       (siehe spaltenContainerSetzen) – NUR bei 2 oder 3 Spalten. Absätze
       dürfen über Spalten hinweg umbrechen (Erwägungen sind lang). */
    html.bkl-aktiv .bkl-spalten-container {
      column-count: var(--bkl-spalten) !important;
      column-gap: 2.5em !important;
      column-rule: 1px solid var(--bkl-border) !important;
    }

    /* Spaltenbreite (Haarlinien-Box): das Seiten-CSS fixiert div.eit .middle auf 625px.
       Überschrieben wird bei Abweichung vom Standard der Einstellung (800px,
       Vorgabe der Autorin; die Seite selbst hat 625px),
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

    /* ---- bvger.weblaw.ch (Bundesverwaltungsgericht) ----
       Seitengrund (body #f1f3f3), Segment mit Titel/Datum/Text (#customContentSegment
       #fcfefe, box-shadow) und Seitenleiste (Akkordeon mit Filtern, per ID und
       !important auf hell fixiert) ans Schema anpassen. Die Site setzt ihre
       Farben mit !important, teils per ID – daher hier ebenfalls per ID. */
    html.bkl-aktiv .ui.segment,
    html.bkl-aktiv #sideMenuCacheViewAccordionComputer,
    html.bkl-aktiv #sideMenuCacheViewAccordionMobile,
    html.bkl-aktiv .accordionLabelSideContentCacheView {
      background: var(--bkl-bg) !important;
      color: var(--bkl-fg) !important;
      border-color: var(--bkl-border) !important;
    }
    html.bkl-aktiv .ui.header,
    html.bkl-aktiv .titleLabel { color: var(--bkl-fg) !important; }
    html.bkl-aktiv .ui.divider { border-color: var(--bkl-border) !important; }
    /* Markierungen der Site (farbiger Grund hinter Fundstellen und
       Stichwörtern, Klassen markedOccurrence_*) behalten dunklen Text –
       wie der Highlight-Schutz auf bger.ch oben. */
    html.bkl-aktiv .markedHtmlContentWrapper { color: #1a1a1a !important; }
    /* Textbreite: die Site setzt die Breite des Spaltenrahmens um das Segment
       nach Fensterbreite als Inline-Stil (z. B. 855px). Nur bei Abweichung vom
       Standard (bkl-breite); Zuschlag 100px für die Innenränder des Segments,
       damit der Reglerwert wie auf bger.ch die Textbreite meint. */
    html.bkl-aktiv.bkl-breite .bkl-text-spalte {
      width: calc(var(--bkl-spalte) + 100px) !important;
      max-width: none !important;
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
  // @font-face muss runtime.getURL() der Extension verwenden (Content-Script-Kontext:
  // relative Pfade würden auf die Seite zeigen, nicht auf die Extension).
  // In der jsdom-Testumgebung gibt es runtime nicht -> keine
  // @font-face-Regeln injizieren (SCHRIFTARTEN-Stacks fallen auf System-
  // Schriften zurück, nichts bricht).
  const FONT_DATEIEN = [
    { familie: 'Atkinson Hyperlegible Next', basis: 'atkinson-hyperlegible-next' },
    { familie: 'Luciole',                    basis: 'luciole' },
    { familie: 'EB Garamond',                basis: 'eb-garamond' },
    { familie: 'Dyslexie-Leseschrift',       basis: 'opendyslexic' },
    { familie: 'Comic Neue',                 basis: 'comic-neue' },
    { familie: 'BGEReader Serif',            basis: 'liberation-serif' },
    { familie: 'BGEReader Sans',             basis: 'liberation-sans' }
  ];

  function fontFaceCss() {
    const hatGetURL = (
      extensionApi && extensionApi.runtime &&
      typeof extensionApi.runtime.getURL === 'function'
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
          '  src: url("' + extensionApi.runtime.getURL('fonts/' + f.basis + '-latin-' + w + '.woff2') + '") format("woff2");\n' +
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
    luciole: '"Luciole", Verdana, Arial, Helvetica, sans-serif',
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
    kontrast:{ bg: '#000000', fg: '#ffffff', link: '#ffe26f', border: '#ffffff', tbg: '#222222', tfg: '#ffffff' },
    nacht:   { bg: '#2b1518', fg: '#f3e3e3', link: '#ffb3c1', border: '#7a4a52', tbg: '#432227', tfg: '#f3e3e3' }
  };

  const AUSRICHTUNGEN = { links: 'left', mittig: 'center', rechts: 'right', blocksatz: 'justify' };

  /* Textspalten: column-count muss auf dem gemeinsamen Elternknoten der
     Entscheidabsätze liegen (auf den Absätzen selbst würde jeder Absatz für
     sich in Spalten zerfallen). Der Knoten wird einmal gesucht und gemerkt;
     ohne Spalten wird die Klasse wieder entfernt (Layout-Neutralität). */
  let spaltenContainer = null;

  function spaltenContainerSetzen(an) {
    if (!an) {
      if (spaltenContainer) spaltenContainer.classList.remove('bkl-spalten-container');
      spaltenContainer = null;
      return;
    }
    if (spaltenContainer && spaltenContainer.isConnected) return;
    const bloecke = entscheidBloecke();
    if (!bloecke.length) return;
    let el = bloecke[0].parentNode;
    while (el && el !== document.body &&
           !bloecke.every(function (b) { return el.contains(b); })) {
      el = el.parentNode;
    }
    if (!el || el === document.body || el === document.documentElement) return;
    spaltenContainer = el;
    el.classList.add('bkl-spalten-container');
  }

  function wendeStileAn() {
    const html = document.documentElement;
    const e = einstellungen;
    const farben = FARBSCHEMATA[e.farbschema] || FARBSCHEMATA.hell;
    // bvger.weblaw.ch: Textblock für das CSS markieren (Klasse bkl-text), auch
    // wenn die Klammern aus sind – die Typografie braucht die Klasse ebenso.
    if (IST_WEBLAW) weblawTextblock();
    if (!AUSRICHTUNGEN[e.ausrichtung]) e.ausrichtung = STANDARDS.ausrichtung;

    /* Abwärtskompatibilität/Defensive: unbekannte gespeicherte Werte
       (z. B. aus älteren Versionen) auf den Standard zurückfallen lassen,
       statt mit undefined-CSS zu crashen. */
    if (!SCHRIFTARTEN[einstellungen.schriftart]) {
      einstellungen.schriftart = STANDARDS.schriftart;
    }

    html.classList.toggle('bkl-aktiv', e.aktiv);
    /* Layout-Neutralität: Breiten-Regeln nur bei Abweichung vom Standard
       (keine Zeilenlängen-Begrenzung; die Textbreite weicht mit ihrem Standard
       800px bewusst von den 625px der Seite ab) aktivieren. */
    html.classList.toggle('bkl-maxw', e.aktiv && e.zeilenlaenge > 0);
    html.classList.toggle('bkl-breite', e.aktiv && e.spaltenbreite !== STANDARDS.spaltenbreite);
    html.classList.toggle('bkl-ausrichtung', e.aktiv && e.ausrichtung !== STANDARDS.ausrichtung);
    html.classList.toggle('bkl-absatz', e.aktiv && e.absatzabstand > 0);
    spaltenContainerSetzen(e.aktiv && e.spalten > 1);
    html.style.setProperty('--bkl-font', SCHRIFTARTEN[e.schriftart]);
    html.style.setProperty('--bkl-size', e.schriftgroesse + 'px');
    html.style.setProperty('--bkl-lh', e.zeilenabstand);
    html.style.setProperty('--bkl-fw', e.schriftstaerke === 'fett' ? '700' : '400');
    html.style.setProperty('--bkl-ls', e.buchstabenabstand + 'px');
    html.style.setProperty('--bkl-ws', e.wortabstand + 'px');
    html.style.setProperty('--bkl-maxw', e.zeilenlaenge > 0 ? e.zeilenlaenge + 'ch' : 'none');
    html.style.setProperty('--bkl-spalte', e.spaltenbreite + 'px');
    html.style.setProperty('--bkl-hyphens', e.silbentrennung ? 'auto' : 'manual');
    html.style.setProperty('--bkl-align', AUSRICHTUNGEN[e.ausrichtung]);
    html.style.setProperty('--bkl-absatz', e.absatzabstand + 'em');
    html.style.setProperty('--bkl-spalten', String(e.spalten));
    html.style.setProperty('--bkl-bg', farben.bg);
    html.style.setProperty('--bkl-fg', farben.fg);
    html.style.setProperty('--bkl-link', farben.link);
    html.style.setProperty('--bkl-border', farben.border);
    html.style.setProperty('--bkl-toggle-bg', farben.tbg);
    html.style.setProperty('--bkl-toggle-fg', farben.tfg);
    // Panel (und Pop-up, popup.js): dunkle Tokens (panelCss) allein nach dem
    // eigenen Schalter „Oberfläche dunkel" – unabhängig vom Hintergrund des
    // Entscheids und nie nach dem System (kein prefers-color-scheme).
    host.setAttribute('data-schema', e.oberflaecheDunkel ? 'dunkel' : 'hell');
  }

  /* ================================================================== */
  /* KLammer-VERARBEITUNG ÜBER ALLE ENTSCHEIDABSÄTZE                     */
  /* ================================================================== */

  /* ---------- Seitenprofil: bger.ch oder bvger.weblaw.ch ----------
     bger.ch liefert fertiges HTML, jeder Entscheidabsatz ist ein div.paraatf
     bzw. div.para. bvger.weblaw.ch (Bundesverwaltungsgericht) ist eine
     React-App: die Seite kommt als leere Hülle, der Entscheid wird per
     JavaScript nachgeladen und bei Navigation ohne Seiten-Neuladen ersetzt.
     Der Text liegt als <p>-Folge (Rubrum als Tabellen mit <p> in den Zellen)
     in einem Kind von #customContentSegment; Klassen tragen die Absätze
     keine. Der Ort ist die einzige Verbindung zur App – keine API, keine
     Anfragen, alles bleibt offline. */
  const IST_WEBLAW = /(^|\.)weblaw\.ch$/.test(location.hostname);

  // Liefert den Textblock des Entscheids (das Kind von #customContentSegment
  // mit den Absätzen). Markiert ihn für das CSS mit der Klasse bkl-text und
  // den Spaltenrahmen um das Segment mit bkl-text-spalte (Textbreite).
  // Idempotent: wird nach jedem Nachladen erneut aufgerufen.
  function weblawTextblock() {
    const segment = document.getElementById('customContentSegment');
    if (!segment) return null;
    let block = null, meiste = 0;
    Array.prototype.forEach.call(segment.children, function (kind) {
      const n = kind.querySelectorAll('p').length;
      if (n > meiste) { meiste = n; block = kind; }
    });
    if (!block) return null;
    if (!block.classList.contains('bkl-text')) {
      block.classList.add('bkl-text');
      // Entscheidsprache für die Silbentrennung: die Hülle sagt lang="en",
      // damit würde der Browser deutsche, französische und italienische
      // Wörter nach englischen Regeln trennen. Erkennung am Rubrum
      // („Urteil vom", „Arrêt du", „Sentenza del"); der Abstand vor dem
      // Datum fehlt in manchen Entscheiden („Zwischenentscheidvom 11. …").
      const rubrum = block.textContent.slice(0, 1200);
      const sprache = /\bArrêt\s*du\b|\bDécision\s*(?:incidente\s*)?du\b/i.test(rubrum) ? 'fr'
        : /\bSentenza\s*del\b|\bDecisione\s*(?:incidentale\s*)?del\b/i.test(rubrum) ? 'it'
        : /(?:urteil|entscheid|verfügung)\s*vom\b/i.test(rubrum) ? 'de' : '';
      if (sprache) block.lang = sprache;
    }
    if (segment.parentElement) segment.parentElement.classList.add('bkl-text-spalte');
    return block;
  }

  function entscheidBloecke() {
    if (IST_WEBLAW) {
      const block = weblawTextblock();
      return block ? Array.prototype.slice.call(block.querySelectorAll('p')) : [];
    }
    return Array.prototype.slice.call(document.querySelectorAll('div.paraatf, div.para'));
  }

  function verarbeiteKlammern() {
    BGerReader.allesAufklappenUndEntfernen();

    if (!einstellungen.aktiv || !einstellungen.klammern) return;

    entscheidBloecke().forEach(function (block) {
      BGerReader.blockVerarbeiten(block);
    });
  }

  /* ---------- Nachgeladener Inhalt (bvger.weblaw.ch) ----------
     Beim Start (document_idle) ist der Entscheid meist noch nicht da, und
     die App ersetzt ihn später ohne Seiten-Neuladen: Navigation zu einem
     anderen Entscheid, Markierungen ein/aus (der ganze Textblock wird neu
     gesetzt, unsere Folds sind dann weg). Ein MutationObserver auf #root
     meldet jede Änderung; ausgewertet wird gedrosselt (ein Timer, 150 ms)
     und umgebaut nur, wenn sich der Textblock tatsächlich geändert hat –
     Merkmal aus Element, Kindzahl und Textlänge, nach dem eigenen Umbau
     neu gemerkt, damit die Pfeile der Folds keinen weiteren Umbau auslösen.
     Klappen einer Klammer ändert nur Klassen und bleibt unbeachtet. */
  function inhaltBeobachten() {
    if (!IST_WEBLAW || typeof MutationObserver === 'undefined') return;
    const wurzel = document.getElementById('root') || document.body;
    let timer = null;
    let block = null, merkmal = '';
    function merkmalVon(b) {
      return b ? b.childElementCount + ':' + b.textContent.length : '';
    }
    function merken() {
      block = weblawTextblock();
      merkmal = merkmalVon(block);
    }
    const beobachter = new MutationObserver(function () {
      if (timer !== null) return;
      timer = setTimeout(function () {
        timer = null;
        const b = weblawTextblock();
        if (b === block && merkmalVon(b) === merkmal) return;
        wendeStileAn();
        verarbeiteKlammern();
        merken();
        beobachter.takeRecords(); // eigene Änderungen nicht erneut auswerten
      }, 150);
    });
    beobachter.observe(wurzel, { childList: true, subtree: true });
    merken();
  }

  /* ================================================================== */
  /* PANEL (Shadow DOM – weder Seiten-CSS noch unser CSS greifen herein)  */
  /* ================================================================== */

  const host = document.createElement('div');
  host.id = 'bkl-panel-host';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  /* Inline-SVG-Icons: die Strich-Symbole (Schliessen-X, Pfeil) sind selbst
     gezeichnet, stroke="currentColor" -> färben sich mit dem Text. */
  function svgIcon(pfad) {
    return '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="square" ' +
      'aria-hidden="true" focusable="false"><path d="' + pfad + '"/></svg>';
  }
  const PFAD_SCHLIESSEN = 'M3 3 L13 13 M13 3 L3 13';
  const PFAD_PFEIL = 'M6 4 L10 8 L6 12';

  /* Zeilen-Icons: Colibre, das Standard-Icon-Thema von LibreOffice
     (icon-themes/colibre_svg/cmd, 16x16, Lizenz CC0 – siehe
     extension/icons/LICENSES.md). Unverändert bis auf Rundung der
     Koordinaten und entfernte Namensräume; eigene Farben (Grau/Blau),
     daher kein currentColor. Dieselben Strings stehen in popup.html. */
  const ICONS = {
    buch:       '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m13 1v2h2v-1l-1.05-1z" fill="#fafafa"/><path d="m9 1v14h6v-12l-2.02-2z" fill="#fafafa"/><path d="m9 0c-0.55 0-1 0.45-1 1v14c0 0.55 0.45 1 1 1h6c0.55 0 1-0.45 1-1v-10.96-0.04-1-0.41l-2.59-2.59h-0.41-1zm0 1h3v2.5c0 0.28 0.22 0.5 0.5 0.5h0.5 2v11h-6zm4 0 2 2h-2z" fill="#3a3a38" fill-rule="evenodd"/><g transform="matrix(-1 0 0 1 16 0)"><path d="m13 1v2h2v-1l-1.05-1z" fill="#fafafa"/><path d="m9 1v14h6v-12l-2.02-2z" fill="#fafafa"/><path d="m9 0c-0.55 0-1 0.45-1 1v14c0 0.55 0.45 1 1 1h6c0.55 0 1-0.45 1-1v-10.96-0.04-1-0.41l-2.59-2.59h-0.41-1zm0 1h3v2.5c0 0.28 0.22 0.5 0.5 0.5h0.5 2v11h-6zm4 0 2 2h-2z" fill="#3a3a38" fill-rule="evenodd"/></g></svg>',
    groesse:    '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m7.39 1-5.17 14h1.26c0.16 0 0.3-0.05 0.41-0.14 0.12-0.09 0.2-0.2 0.24-0.32l1.23-3.54h5.28l1.23 3.54c0.04 0.12 0.12 0.23 0.24 0.32 0.11 0.09 0.25 0.14 0.41 0.14h1.26l-3.74-10.11c-0.54 0.2-1.18 0.1-1.61-0.33-0.02-0.02-0.04-0.05-0.06-0.07l1.92 5.52h-4.59l2.02-5.82c0.06-0.17 0.13-0.37 0.2-0.6 0.02-0.08 0.05-0.17 0.07-0.25 0.01 0.02 0.01 0.04 0.02 0.06 0.03-0.35 0.16-0.69 0.42-0.95l0.51-0.51-0.34-0.93h-0.61z" fill="#3a3a38"/><path d="m12.5 7c-0.28 0-0.5-0.22-0.5-0.5v-4.79l-2.15 2.15c-0.2 0.2-0.51 0.2-0.71 0-0.2-0.2-0.2-0.51 0-0.71l3-3c0.1-0.1 0.23-0.15 0.35-0.15 0.06 0 0.13 0.01 0.19 0.04 0.06 0.02 0.12 0.06 0.17 0.11l3 3c0.2 0.2 0.2 0.51 0 0.71-0.2 0.2-0.51 0.2-0.71 0l-2.15-2.15v4.79c0 0.28-0.22 0.5-0.5 0.5z" fill="#1e8bcd"/></svg>',
    art:        '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m7.06 1-5.06 14h1.45c0.16 0 0.29-0.05 0.4-0.14 0.12-0.09 0.2-0.2 0.24-0.32l0.86-2.54h6.12l0.87 2.55c0.05 0.13 0.13 0.24 0.23 0.32 0.1 0.09 0.24 0.13 0.4 0.13h1.45l-5.05-14zm0.94 1.83c0.06 0.26 0.13 0.51 0.2 0.74 0.07 0.23 0.14 0.43 0.21 0.6l1.98 5.84h-4.76l1.98-5.82c0.06-0.17 0.13-0.37 0.2-0.6 0.07-0.23 0.14-0.48 0.21-0.75z" fill="#3a3a38"/></svg>',
    farbe:      '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><g fill-rule="evenodd"><path d="m7 4-1.02 0.02-3.98-0.02c-0.93 0.07-1.26 0.25-1.81 1.07-0.24 0.5-0.19 1.01-0.19 1.11l-0.01 5.82c1.23-0.67 2.19-1.4 3-2.5 0-0.95-0.01-0.99 0.01-2.85-0.01-0.74 0.56-0.88 0.99-1.15z" fill="#0063b1"/><path d="m2.06 4.99c-0.39 0.03-0.54 0.07-0.61 0.12-0.06 0.04-0.19 0.18-0.38 0.44-0.04 0.1-0.07 0.2-0.08 0.3-0.01 0.12 0 0.14 0 0.3a0.99 0.99 0 0 1 0 0.03l0 3.72c0.32-0.28 0.74-0.49 1.01-0.84 0-0.62-0.01-0.86 0.01-2.41-0.01-0.62 0.33-1.23 0.69-1.53 0.1-0.08 0.12-0.08 0.21-0.13z" fill="#83beec"/></g><path d="m10.5 3-6 3 3.5 7 6-3z" fill="#3a3a38"/><path d="m10.18 3.97-4.71 2.36 2.86 5.71 4.71-2.36z" fill="#fafafa"/><path d="m8.5 8v-5.5c0-2.83 4-2.5 4 0v3.5" fill="none" stroke="#3a3a38"/></svg>',
    spalte:     '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m10 1h-4v6.11c0.24 0.08 0.46 0.21 0.62 0.39 0.27 0.3 0.38 0.67 0.38 1.01s-0.11 0.71-0.38 1.01c-0.16 0.18-0.38 0.31-0.62 0.39v5.08h4v-5.09c-0.24-0.08-0.46-0.22-0.62-0.39-0.27-0.3-0.38-0.66-0.38-1.01s0.11-0.71 0.38-1.01c0.16-0.18 0.38-0.31 0.62-0.39z" fill="#fafafa"/><path d="m11 0h-1-5v1h5v4h-4v-4h-1v4 0.36c0 0.03 0.01 0.05 0.01 0.07 0 0.06-0.01 0.12-0.01 0.18v0.38 1.01h0.48c0.17 0 0.35 0.03 0.52 0.09v-1.11h4v1.1c0.17-0.06 0.35-0.1 0.52-0.09h0.48v-1.4c-0.01-0.06-0.02-0.12-0.01-0.18 0-0.03 0.01-0.05 0.01-0.07zm0 10h-0.48c-0.17 0-0.35-0.03-0.52-0.09v1.09h-4v-1.08c-0.17 0.06-0.35 0.1-0.52 0.09h-0.48v0.99 0.33c0.01 0.09 0.02 0.17 0.02 0.25 0 0.04-0.01 0.08-0.02 0.11v3.3h1v-3h4v3h-5v1h5 1v-4.31c-0.01-0.04-0.02-0.07-0.02-0.11 0-0.08 0.01-0.17 0.02-0.25z" fill="#3a3a38"/><g fill="#1e8bcd" fill-rule="evenodd"><path d="m16 8.48c0-0.16-0.08-0.3-0.2-0.39l-2.95-2.94c-0.47-0.47-1.18 0.24-0.71 0.71l2.14 2.14-3.78 0.01c-0.68-0.01-0.68 1.01 0 1l3.78-0.01-2.14 2.15c-0.49 0.47 0.24 1.2 0.71 0.7l2.95-2.96c0.13-0.1 0.2-0.25 0.2-0.4z"/><path d="m0 8.49c0-0.16 0.08-0.3 0.2-0.39l2.95-2.94c0.47-0.47 1.18 0.24 0.71 0.71l-2.14 2.14 3.78 0.01c0.68-0.01 0.68 1.01 0 1l-3.78-0.01 2.14 2.15c0.49 0.47-0.24 1.2-0.71 0.7l-2.95-2.96c-0.13-0.1-0.2-0.25-0.2-0.4z"/></g></svg>',
    klammer:    '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m6 0c-1.1 0-2 0.9-2 2v12c0 1.1 0.9 2 2 2h1v-1h-1c-0.55 0-1-0.45-1-1v-8.28-3.72c0-0.55 0.43-1 1-1h1v-1zm3 0v1h1c0.55 0 1 0.45 1 1v3.72 8.28c0 0.55-0.45 1-1 1h-1v1h1c1.1 0 2-0.9 2-2v-12c0-1.1-0.62-2-2-2z" fill="#1e8bcd"/></svg>',
    staerke:    '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m3 15v-14h4.75c0.9 0 1.67 0.09 2.31 0.26 0.64 0.18 1.16 0.43 1.56 0.75 0.41 0.32 0.7 0.72 0.89 1.18 0.19 0.46 0.28 0.97 0.28 1.54 0 0.32-0.05 0.64-0.14 0.94-0.09 0.3-0.23 0.58-0.42 0.84-0.19 0.26-0.44 0.5-0.74 0.72-0.3 0.21-0.66 0.26-1.08 0.41 1.81 0.44 2.72 1.59 2.72 3.22 0 0.6-0.11 1.15-0.33 1.66-0.22 0.51-0.54 0.95-0.96 1.32-0.41 0.37-0.93 0.65-1.55 0.86-0.61 0.2-1.31 0.31-2.11 0.31zm3-6.21v3.93h2.13c0.44 0 0.81-0.06 1.11-0.17 0.3-0.11 0.53-0.26 0.7-0.45 0.18-0.19 0.3-0.41 0.37-0.65 0.07-0.25 0.11-0.51 0.11-0.78 0-0.29-0.04-0.55-0.13-0.78-0.08-0.23-0.21-0.43-0.39-0.59-0.18-0.16-0.41-0.28-0.71-0.37-0.29-0.09-0.64-0.14-1.06-0.14zm0-1.91h1.58c0.78 0 1.38-0.15 1.8-0.44 0.42-0.3 0.63-0.8 0.63-1.49 0-0.72-0.18-1.22-0.55-1.51-0.37-0.3-0.94-0.44-1.73-0.44h-1.74z" fill="#3a3a38"/></svg>',
    zeilen:     '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><g fill="#3a3a38"><rect height="1" ry="0.38" width="7" x="7" y="3"/><rect height="1" ry="0.44" width="7" x="7" y="9"/><rect height="1" ry="0.5" width="8" x="7" y="12"/><rect height="1" ry="0.48" width="8" x="7" y="6"/></g><g fill="#1e8bcd" fill-rule="evenodd"><path d="m0 3.48c-0.01 0.45 0.54 0.69 0.86 0.36l2.14-2.15 0 4.78c-0.02 0.35 0.24 0.53 0.5 0.53s0.52-0.18 0.5-0.53l0-4.78 2.14 2.15c0.32 0.33 0.87 0.09 0.86-0.36 0-0.13-0.06-0.25-0.15-0.34l-2.91-2.92c-0.16-0.17-0.27-0.22-0.44-0.22-0.17 0-0.27 0.05-0.44 0.22l-2.91 2.92c-0.09 0.09-0.15 0.21-0.15 0.34z"/><path d="m0 12.52c-0.01-0.45 0.54-0.69 0.86-0.36l2.14 2.15 0-4.78c-0.02-0.35 0.24-0.53 0.5-0.53s0.52 0.18 0.5 0.53l0 4.78 2.14-2.15c0.32-0.33 0.87-0.09 0.86 0.36 0 0.13-0.06 0.25-0.15 0.34l-2.91 2.92c-0.16 0.17-0.27 0.22-0.44 0.22-0.17 0-0.27-0.05-0.44-0.22l-2.91-2.92c-0.09-0.09-0.15-0.21-0.15-0.34z"/></g></svg>',
    buchstaben: '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m3.75 0-3.75 10h0.88l0.85-0.85 0.76-2.15c0 0 0.01 0 0.01 0h3.92l0.95 2.68c0.04 0.09 0.1 0.17 0.17 0.23 0.08 0.06 0.17 0.09 0.29 0.09h1.07l-3.74-10zm0.7 1.31c0.05 0.19 0.09 0.36 0.14 0.53 0.05 0.16 0.1 0.3 0.15 0.43l1.32 3.74h-3.23l1.31-3.73c0.05-0.12 0.1-0.26 0.15-0.43 0.05-0.16 0.1-0.34 0.15-0.53z" fill="#3a3a38"/><path d="m7.25 0 3.75 10h0.11c-0.13-0.36-0.13-0.76 0.01-1.08 0.1-0.23 0.27-0.44 0.49-0.6-0.04-0.16-0.08-0.32-0.13-0.47-0.06-0.19-0.11-0.36-0.17-0.52l-2.47-7.01c-0.04-0.09-0.09-0.17-0.17-0.23-0.08-0.06-0.18-0.09-0.3-0.09zm7.63 0c-0.12 0-0.22 0.03-0.3 0.1-0.08 0.07-0.14 0.14-0.17 0.23l-2.47 7c-0.06 0.16-0.12 0.33-0.18 0.52-0.04 0.13-0.07 0.27-0.1 0.41 0.25-0.17 0.55-0.27 0.86-0.26a1 1 0 0 1 0.01 0c0.15 0 0.29 0.04 0.42 0.08l3.03-8.08z" fill="#3a3a38"/><path d="m3.48 9c-0.13 0-0.25 0.06-0.34 0.15l-2.92 2.91c-0.17 0.16-0.22 0.27-0.22 0.44 0 0.17 0.05 0.27 0.22 0.44l2.92 2.91c0.09 0.09 0.21 0.15 0.34 0.15 0.45 0.01 0.69-0.54 0.36-0.86l-2.15-2.14h12.61l-2.15 2.14c-0.33 0.32-0.09 0.87 0.36 0.86 0.13 0 0.25-0.06 0.34-0.15l2.92-2.91c0.17-0.16 0.22-0.27 0.22-0.44 0-0.17-0.05-0.27-0.22-0.44l-2.92-2.91c-0.09-0.09-0.21-0.15-0.34-0.15-0.45-0.01-0.69 0.54-0.36 0.86l2.15 2.14h-12.61l2.15-2.14c0.33-0.32 0.09-0.87-0.36-0.86z" fill="#1e8bcd" fill-rule="evenodd"/></svg>',
    worte:      '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m1 8c-0.55 0-1 0.45-1 1v6c0 0.55 0.45 1 1 1h1.48a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h0.25v-0.87c-0.11 0.01-0.21 0.02-0.33 0-0.14-0.03-0.29-0.07-0.43-0.15a1 1 0 0 1-0.08-0.05c-0.1-0.07-0.2-0.15-0.3-0.27a1 1 0 0 1-0.01-0.01l-0.37-0.47a1 1 0 0 1 0.16-1.4l1.94-1.56a1 1 0 0 1 0.63-0.22zm4 0a1 1 0 0 1 1 1v4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h4a1 1 0 0 1-1-1v-0.36c0-0.21 0.04-0.39 0.1-0.54a1 1 0 0 1 0.01-0.02c0.08-0.23 0.22-0.44 0.39-0.6l1.69-1.74 0 0c-0.25 0.06-0.5 0.12-0.7 0.09a1 1 0 0 1 0 0l-0.57-0.1a1 1 0 0 1-0.82-1.14c0.06-0.38 0.17-0.74 0.35-1.07 0 0 0 0 0 0v0c0.17-0.32 0.39-0.6 0.67-0.84 0.27-0.23 0.59-0.4 0.93-0.51 0 0 0 0 0 0 0.33-0.11 0.68-0.16 1.04-0.16zm7.09 0c0.37 0 0.74 0.06 1.09 0.19 0.33 0.12 0.65 0.3 0.91 0.55 0.27 0.25 0.47 0.56 0.61 0.89 0.15 0.34 0.21 0.71 0.21 1.08 0 0.31-0.05 0.63-0.14 0.92a1 1 0 0 1 0 0.01c-0.09 0.25-0.2 0.5-0.34 0.73a1 1 0 0 1 0 0.01c-0.14 0.22-0.29 0.42-0.46 0.62a1 1 0 0 1-0.01 0.01c-0.03 0.03-0.06 0.07-0.09 0.1 0.25 0.04 0.51 0.09 0.71 0.28 0.27 0.25 0.42 0.66 0.42 0.98v0.64a1 1 0 0 1-1 1h1c0.55 0 1-0.45 1-1v-6c0-0.55-0.45-1-1-1zm-1.84 2.2c0 0-0.01 0.01-0.01 0.01l-0.01 0.04c0.01-0.02 0.02-0.03 0.02-0.05zm1.2 1.49c0 0 0 0.01-0.01 0.01l0.01-0.01c0 0 0 0-0.01 0z" fill="#fafafa"/><path d="m2.48 14h1.25v-3.17c0-0.14 0-0.28 0.01-0.43l-0.84 0.67c-0.06 0.04-0.11 0.07-0.17 0.08-0.06 0.01-0.11 0.01-0.16 0-0.05-0.01-0.09-0.02-0.13-0.05-0.04-0.02-0.06-0.05-0.08-0.07l-0.37-0.47 1.94-1.56h1.06v5h1v1h-3.52z" fill="#1e8bcd"/><path d="m12.09 9q0.41 0 0.74 0.13 0.34 0.12 0.57 0.34 0.24 0.22 0.37 0.54 0.13 0.31 0.13 0.69 0 0.33-0.09 0.61-0.09 0.28-0.25 0.53-0.16 0.25-0.37 0.49-0.21 0.24-0.44 0.48l-1.26 1.32q0.2-0.06 0.4-0.09 0.2-0.04 0.37-0.04h1.34q0.17 0 0.27 0.1 0.11 0.1 0.11 0.26v0.64h-4v-0.36q0-0.1 0.04-0.22 0.04-0.12 0.15-0.22l1.72-1.77q0.22-0.23 0.38-0.43 0.17-0.21 0.28-0.41 0.12-0.21 0.17-0.41 0.06-0.21 0.06-0.44 0-0.41-0.2-0.62-0.2-0.21-0.58-0.21-0.16 0-0.29 0.05-0.13 0.05-0.24 0.13-0.11 0.08-0.18 0.2-0.08 0.12-0.12 0.25-0.07 0.21-0.2 0.27-0.12 0.06-0.33 0.03l-0.57-0.1q0.07-0.43 0.24-0.76 0.17-0.33 0.43-0.54 0.26-0.22 0.6-0.33 0.34-0.11 0.73-0.11z" fill="#1e8bcd"/><g fill="#3a3a38"><path d="m0 8v8h16v-8zm1 1h14v6h-14z"/><g fill="#3a3a38" transform="translate(.074131 -2)"><path d="m5.59 9.59q-0.18 0-0.27-0.05-0.09-0.05-0.13-0.22l-0.15-0.61q-0.26 0.24-0.51 0.42-0.24 0.18-0.51 0.31-0.27 0.13-0.58 0.19-0.31 0.07-0.68 0.07-0.38 0-0.72-0.1-0.33-0.11-0.59-0.32-0.25-0.22-0.4-0.55-0.14-0.33-0.14-0.78 0-0.39 0.21-0.75 0.22-0.36 0.69-0.65 0.48-0.28 1.25-0.46 0.77-0.18 1.89-0.21v-0.51q0-0.77-0.33-1.15-0.32-0.39-0.95-0.39-0.42 0-0.71 0.11-0.28 0.11-0.49 0.24-0.21 0.13-0.36 0.24-0.15 0.11-0.3 0.11-0.12 0-0.21-0.06-0.09-0.06-0.14-0.16l-0.22-0.38q0.55-0.53 1.17-0.78 0.63-0.26 1.4-0.26 0.55 0 0.98 0.18 0.43 0.18 0.72 0.51 0.29 0.33 0.44 0.79 0.16 0.46 0.16 1.02v4.22zm-2.47-0.73q0.3 0 0.55-0.06 0.25-0.06 0.47-0.17 0.22-0.11 0.42-0.28 0.2-0.17 0.4-0.37v-1.36q-0.79 0.03-1.34 0.13-0.55 0.09-0.9 0.26-0.34 0.16-0.5 0.38-0.16 0.22-0.16 0.49 0 0.26 0.08 0.45 0.09 0.18 0.23 0.3 0.14 0.11 0.34 0.18 0.2 0.05 0.42 0.05z"/><path d="m7.93 9.59v-7.59h1.19v1.93c0.27-0.32 0.58-0.57 0.92-0.76 0.35-0.19 0.74-0.28 1.19-0.28 0.38 0 0.73 0.07 1.03 0.22 0.31 0.15 0.57 0.36 0.78 0.64 0.22 0.28 0.38 0.62 0.49 1.02 0.12 0.4 0.18 0.85 0.18 1.35 0 0.54-0.07 1.02-0.2 1.46-0.13 0.44-0.32 0.81-0.56 1.13-0.24 0.31-0.54 0.55-0.88 0.72-0.35 0.17-0.74 0.26-1.17 0.26s-0.79-0.08-1.09-0.24c-0.29-0.17-0.54-0.4-0.77-0.69l-0.07 0.59c-0.02 0.17-0.11 0.25-0.29 0.25zm2.91-5.76c-0.36 0-0.69 0.09-0.96 0.26-0.27 0.17-0.53 0.41-0.76 0.73v3.18c0.21 0.28 0.43 0.48 0.68 0.6 0.25 0.11 0.52 0.17 0.82 0.17 0.61 0 1.07-0.22 1.4-0.65 0.32-0.44 0.49-1.09 0.49-1.95 0-0.8-0.14-1.39-0.43-1.77-0.29-0.38-0.7-0.57-1.23-0.57z"/></g></g></svg>',
    laenge:     '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><g fill="#3a3a38" transform="scale(-1 1)"><rect height="1" ry="0.46" width="3" x="-4" y="5"/><rect height="1" ry="0.5" width="14" x="-15" y="2"/><rect height="1" ry="0.5" width="14" x="-15" y="13"/></g><path d="m15.5 8.51-3 2.99-3-2.99" fill="none" stroke="#1e8bcd" stroke-linecap="round" stroke-linejoin="round"/><path d="m5.5 5.01c-0.28 0-0.5 0.22-0.5 0.5s0.22 0.5 0.5 0.5h4c1.38 0 2.5 1.12 2.5 2.5h0.01v0.42 2.07h1v-2.07-0.5c-0.01-2.15-1.88-3.37-3.51-3.42z" fill="#1e8bcd" fill-rule="evenodd"/></svg>',
    silben:     '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m7.93 0v9.59h0.35l0.77-0.77 0.01-0.07c0.01 0.01 0.02 0.02 0.03 0.03l0.36-0.36c0.01-0.01 0.03-0.02 0.04-0.04-0.13-0.11-0.25-0.23-0.37-0.39v-3.18c0.23-0.31 0.48-0.56 0.76-0.73 0.28-0.17 0.6-0.26 0.96-0.26 0.53 0 0.94 0.19 1.23 0.57 0.29 0.38 0.43 0.97 0.43 1.77 0 0.86-0.16 1.51-0.49 1.95-0.11 0.15-0.25 0.27-0.39 0.37 0.12 0.13 0.22 0.26 0.28 0.41 0.07 0.17 0.1 0.37 0.1 0.57 0.03-0.01 0.06-0.02 0.08-0.03 0.35-0.17 0.64-0.41 0.88-0.72 0.24-0.31 0.43-0.69 0.56-1.13 0.13-0.44 0.2-0.92 0.2-1.46 0-0.5-0.06-0.95-0.18-1.35-0.11-0.4-0.28-0.74-0.49-1.02-0.22-0.28-0.48-0.49-0.78-0.64-0.31-0.15-0.65-0.22-1.03-0.22-0.45 0-0.85 0.09-1.19 0.28-0.35 0.18-0.65 0.43-0.92 0.75v-3.93zm-4.12 2.88c-0.51 0-0.98 0.09-1.4 0.26-0.42 0.17-0.81 0.43-1.17 0.78l0.22 0.38c0.04 0.06 0.08 0.12 0.14 0.16 0.06 0.04 0.13 0.06 0.21 0.06 0.1 0 0.21-0.04 0.3-0.11 0.1-0.07 0.22-0.15 0.36-0.24 0.14-0.09 0.3-0.16 0.49-0.24 0.19-0.07 0.43-0.11 0.71-0.11 0.42 0 0.74 0.13 0.95 0.39 0.22 0.26 0.33 0.64 0.33 1.15v0.51c-0.75 0.02-1.38 0.09-1.89 0.21-0.51 0.12-0.93 0.27-1.25 0.46-0.32 0.19-0.55 0.41-0.7 0.65-0.14 0.24-0.21 0.49-0.21 0.75 0 0.3 0.05 0.56 0.14 0.78 0.1 0.22 0.23 0.4 0.4 0.54 0.17 0.14 0.37 0.25 0.59 0.32 0.13 0.04 0.28 0.06 0.42 0.08-0.25 0.15-0.47 0.32-0.65 0.54-0.25 0.3-0.43 0.66-0.56 1.07-0.13 0.41-0.19 0.86-0.19 1.35 0 0.54 0.07 1.01 0.21 1.43 0.14 0.41 0.34 0.77 0.58 1.06 0.25 0.29 0.54 0.5 0.88 0.66 0.33 0.15 0.69 0.23 1.08 0.23 0.22 0 0.44-0.02 0.66-0.06 0.22-0.04 0.43-0.1 0.63-0.18 0.2-0.08 0.39-0.19 0.56-0.31 0.17-0.13 0.33-0.28 0.47-0.46l-0.34-0.43c-0.05-0.08-0.12-0.12-0.21-0.12-0.08 0-0.16 0.03-0.23 0.1-0.07 0.07-0.16 0.14-0.28 0.22-0.11 0.08-0.25 0.15-0.41 0.22-0.17 0.07-0.38 0.1-0.63 0.1-0.27 0-0.51-0.05-0.72-0.16-0.21-0.11-0.4-0.27-0.55-0.48-0.15-0.21-0.27-0.47-0.36-0.77-0.08-0.31-0.12-0.66-0.12-1.05 0-0.38 0.04-0.72 0.11-1.02 0.08-0.3 0.19-0.56 0.34-0.77 0.15-0.21 0.34-0.38 0.56-0.49 0.23-0.12 0.49-0.17 0.78-0.17 0.22 0 0.41 0.03 0.56 0.08 0.16 0.05 0.29 0.11 0.39 0.18 0.11 0.06 0.2 0.12 0.27 0.17 0.07 0.05 0.14 0.08 0.21 0.08 0.06 0 0.11-0.01 0.14-0.03 0.04-0.03 0.07-0.06 0.11-0.11l0.31-0.43c-0.26-0.27-0.55-0.48-0.89-0.62-0.26-0.12-0.56-0.17-0.88-0.2 0.09-0.05 0.18-0.1 0.27-0.16 0.17-0.13 0.33-0.27 0.51-0.43l0.15 0.61c0.02 0.11 0.06 0.19 0.13 0.22 0.06 0.04 0.15 0.05 0.27 0.05h0.53v-4.21c0-0.37-0.05-0.71-0.15-1.02-0.1-0.31-0.25-0.57-0.44-0.79-0.19-0.22-0.43-0.39-0.72-0.51-0.29-0.12-0.62-0.18-0.99-0.18zm1.14 3.74v1.36c-0.13 0.13-0.26 0.26-0.4 0.37-0.13 0.11-0.27 0.2-0.42 0.28-0.15 0.07-0.31 0.13-0.47 0.17-0.17 0.04-0.35 0.06-0.54 0.06-0.15 0-0.29-0.02-0.42-0.05-0.13-0.04-0.24-0.1-0.34-0.17-0.09-0.08-0.17-0.18-0.23-0.3-0.05-0.13-0.08-0.27-0.08-0.45 0-0.18 0.05-0.34 0.15-0.48 0.1-0.15 0.27-0.28 0.5-0.38 0.23-0.11 0.54-0.19 0.9-0.26 0.37-0.07 0.82-0.11 1.34-0.14z" fill="#3a3a38"/><path d="m15 8v2c0 1.1-0.9 2-2 2l-4.29-0.02 2.15-2.15c0.33-0.32 0.09-0.87-0.36-0.86-0.13 0-0.25 0.06-0.34 0.15l-2.96 2.96c-0.26 0.2-0.26 0.59 0 0.79l0.01 0 2.95 2.95c0.47 0.49 1.2-0.24 0.71-0.71l-2.15-2.15 4.29 0.02c1.66 0 3-1.34 3-3v-2z" fill="#1e8bcd" fill-rule="evenodd"/></svg>',
    ausrichtung:'<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><g fill="#3a3a38"><rect height="1" ry="0.5" width="14" x="1" y="2"/><rect height="1" ry="0.48" width="14" x="1" y="12"/><rect height="1" ry="0.5" width="14" x="1" y="14"/><rect height="1" ry="0.48" width="14" x="1" y="4"/><rect height="1" ry="0.48" width="14" x="1" y="9"/><rect height="1" ry="0.48" width="14" x="1" y="7"/></g></svg>',
    spalten:    '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m3 0c-0.55 0-1 0.45-1 1v14c0 0.55 0.45 1 1 1h11c0.55 0 1-0.45 1-1v-14c0-0.55-0.45-1-1-1zm0 1h11v14h-11z" fill="#3a3a38"/><path d="m3 1h11v14h-11z" fill="#fafafa"/><rect fill="#1e8bcd" height="1" ry="0.5" width="4" x="4" y="3"/><g fill="#3a3a38"><rect height="1" ry="0.5" width="4" x="4" y="7"/><rect height="1" ry="0.5" width="4" x="4" y="13"/><rect height="1" ry="0.5" width="4" x="4" y="10"/></g><rect fill="#1e8bcd" height="1" ry="0.5" width="4" x="9" y="3"/><g fill="#3a3a38"><rect height="1" ry="0.5" width="4" x="9" y="7"/><rect height="1" ry="0.5" width="4" x="9" y="13"/><rect height="1" ry="0.5" width="4" x="9" y="10"/></g></svg>',
    absatz:     '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><g fill="#3a3a38"><rect height="1" ry="0.38" width="7" x="1" y="2"/><rect height="1" ry="0.44" width="7" x="1" y="12"/><rect height="1" ry="0.5" width="8" x="1" y="14"/><rect height="1" ry="0.48" width="8" x="1" y="4"/></g><g fill="#1e8bcd" fill-rule="evenodd"><path d="m9 3.48c-0.01 0.45 0.54 0.69 0.86 0.36l2.14-2.15 0 4.78c-0.02 0.35 0.24 0.53 0.5 0.53s0.52-0.18 0.5-0.53l0-4.78 2.14 2.15c0.32 0.33 0.87 0.09 0.86-0.36 0-0.13-0.06-0.25-0.15-0.34l-2.91-2.92c-0.16-0.17-0.27-0.22-0.44-0.22-0.17 0-0.27 0.05-0.44 0.22l-2.91 2.92c-0.09 0.09-0.15 0.21-0.15 0.34z"/><path d="m9 12.52c-0.01-0.45 0.54-0.69 0.86-0.36l2.14 2.15 0-4.78c-0.02-0.35 0.24-0.53 0.5-0.53s0.52 0.18 0.5 0.53l0 4.78 2.14-2.15c0.32-0.33 0.87-0.09 0.86 0.36 0 0.13-0.06 0.25-0.15 0.34l-2.91 2.92c-0.16 0.17-0.27 0.22-0.44 0.22-0.17 0-0.27-0.05-0.44-0.22l-2.91-2.92c-0.09-0.09-0.15-0.21-0.15-0.34z"/></g></svg>',
    dunkel:     '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="m8 1a7 7 0 0 0 -7 7 7 7 0 0 0 7 7 7 7 0 0 0 7-7 7 7 0 0 0 -7-7z" fill="#fafafa"/><path d="m8 0c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 1c3.87 0 7 3.13 7 7 0 3.87-3.13 7-7 7z" fill="#3a3a38"/></svg>'
  };

  /* Marken-Icon in der Kopfzeile: das Extension-Icon (icons/icon128.png)
     als ausgefülltes pinkes Buch mit Smiley, als Inline-SVG nachgezeichnet
     (ein <img> bräuchte im Content-Skript web_accessible_resources). */
  const ICON_MARKE =
    '<svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true" focusable="false">' +
    '<path d="M2 1h5.6v14H2a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 2 1z" fill="#d63384"/>' +
    '<path d="M8.4 1H14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 14 15H8.4z" fill="#e64980"/>' +
    '<path d="M7.6 1h.8v14h-.8z" fill="#a61e63"/>' +
    '<circle cx="4.4" cy="5.8" r="1" fill="#fff"/><circle cx="11.6" cy="5.8" r="1" fill="#fff"/>' +
    '<path d="M3.6 9c1.4 1.8 7.4 1.8 8.8 0" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>' +
    '<path d="M2.2 12.6h11.6" stroke="#fff" stroke-width=".7" opacity=".7"/></svg>';

  /* Pink-Button auf der Seite: weisses Strich-Buch mit Smiley (auf pinkem
     Grund wäre das pinke Marken-Icon unsichtbar). */
  const ICON_BUCH_SMILE =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" ' +
    'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" ' +
    'aria-hidden="true" focusable="false">' +
    '<path d="M2 4 c2 -1.3 4 -1.3 6 0 c2 -1.3 4 -1.3 6 0 v9 ' +
    'c-2 -1.3 -4 -1.3 -6 0 c-2 -1.3 -4 -1.3 -6 0 z M8 4 v9 ' +
    'M3.8 9.2 c1 1.1 2.5 1.5 4.2 1.5 c1.7 0 3.2 -0.4 4.2 -1.5"/>' +
    '<circle cx="4.8" cy="6.4" r="0.55" fill="currentColor" stroke="none"/>' +
    '<circle cx="11.2" cy="6.4" r="0.55" fill="currentColor" stroke="none"/></svg>';

  /* Tooltip-Text des Zurücksetzen-Knopfs: nennt die Standardwerte, damit
     klar ist, was der Knopf tut. Gleicher Wortlaut in popup.html. */
  const RESET_TOOLTIP = 'Alle Einstellungen auf Standard zurücksetzen: ' +
    'Lesemodus aus, Schriftgrösse 18, Schriftart System Serif, Schriftstärke normal, ' +
    'Zeilenabstand 1.6, Absatzabstand aus, Buchstaben- und Wortabstand 0, ' +
    'Zeilenlänge aus, Silbentrennung aus, Ausrichtung links, 1 Spalte, ' +
    'Textbreite 800 px, Hintergrund Weiss, Klammern „einfach" ein. Sprache und dunkle Oberfläche bleiben.';

  /* Dropdown-Vorschau: jede Schriftart-Option in ihrer Schrift, jede
     Hintergrund-Option in ihren Farben; das Dropdown selbst zeigt den
     gewählten Wert ebenso (Attribut data-wert, gesetzt von wertAnzeigen).
     Aus SCHRIFTARTEN/FARBSCHEMATA erzeugt – eine Quelle, kein Auseinanderlaufen.
     Browser, die die Liste nativ zeichnen (Firefox auf macOS), ignorieren
     Option-Stile; dann bleibt nur die Vorschau im geschlossenen Dropdown. */
  function vorschauCss() {
    let css = '';
    Object.keys(SCHRIFTARTEN).forEach(function (k) {
      css += '#bkl-art option[value="' + k + '"], #bkl-art[data-wert="' + k + '"] { font-family: ' + SCHRIFTARTEN[k] + '; }\n';
    });
    Object.keys(FARBSCHEMATA).forEach(function (k) {
      css += '#bkl-farbe option[value="' + k + '"], #bkl-farbe[data-wert="' + k + '"] { background: ' +
        FARBSCHEMATA[k].bg + '; color: ' + FARBSCHEMATA[k].fg + '; }\n';
    });
    return css;
  }

  /* ---------- Sprache der Bedienoberfläche ----------
     Texte aus sprachen.js (BGerReaderSprachen; das Manifest lädt die Datei
     vor diesem Skript in denselben Kontext). Übersetzt wird in die
     bestehenden Elemente nach ID, das Markup unten bleibt deutsch. Fehlt die
     Datei (Skript allein geladen), bleibt alles deutsch. */
  const Sprachen = window.BGerReaderSprachen || {
    TEXTE: {},
    texte: function () { return { allgemein: { aus: 'aus', klammer: 'Klammerbemerkung ein-/ausklappen' }, felder: {} }; },
    uebersetze: function () { return this.texte(); }
  };
  let sprachTexte = Sprachen.texte('de');
  let angezeigteSprache = null;

  function sprachAnwenden() {
    const code = Sprachen.TEXTE[einstellungen.sprache] ? einstellungen.sprache : STANDARDS.sprache;
    einstellungen.sprache = code;
    sprachTexte = Sprachen.uebersetze(shadow, code);
    angezeigteSprache = code;
    BGerReader.beschriftungSetzen(sprachTexte.allgemein);
    // Pfeile bereits eingeklappter Klammern im Entscheidtext nachziehen
    document.querySelectorAll('button.bkl-toggle').forEach(function (k) { k.title = sprachTexte.allgemein.klammer; });
  }

  /* Flaggen der Sprachwahl (Vorgabe der Autorin): Schweiz für Deutsch,
     Grossbritannien, Frankreich, Italien – als Inline-SVG, damit sie auf
     jedem System gleich aussehen (Emoji-Flaggen fehlen unter Windows). Nur
     die Flagge der gewählten Sprache ist sichtbar (data-sprache am
     Behälter, gesetzt von sprachen.js; CSS blendet die übrigen aus).
     Dieselben Strings stehen in popup.html (Block [7] prüft das). */
  const ICON_FLAGGEN =
    '<span class="bkl-flagge" data-flagge="de" aria-hidden="true"><svg viewBox="0 0 16 12" width="18" height="13" focusable="false"><rect width="16" height="12" fill="#e30613"/><path d="M6.5 2.5h3v7h-3zM4.5 4.5h7v3h-7z" fill="#fff"/></svg></span>' +
    '<span class="bkl-flagge" data-flagge="en" aria-hidden="true"><svg viewBox="0 0 16 12" width="18" height="13" focusable="false"><rect width="16" height="12" fill="#012169"/><path d="M0 0l16 12M16 0L0 12" stroke="#fff" stroke-width="2.4"/><path d="M0 0l16 12M16 0L0 12" stroke="#c8102e" stroke-width=".8"/><path d="M8 0v12M0 6h16" stroke="#fff" stroke-width="4"/><path d="M8 0v12M0 6h16" stroke="#c8102e" stroke-width="2.4"/></svg></span>' +
    '<span class="bkl-flagge" data-flagge="fr" aria-hidden="true"><svg viewBox="0 0 16 12" width="18" height="13" focusable="false"><rect width="16" height="12" fill="#fff"/><rect width="5.34" height="12" fill="#0055a4"/><rect x="10.66" width="5.34" height="12" fill="#ef4135"/></svg></span>' +
    '<span class="bkl-flagge" data-flagge="it" aria-hidden="true"><svg viewBox="0 0 16 12" width="18" height="13" focusable="false"><rect width="16" height="12" fill="#fff"/><rect width="5.34" height="12" fill="#009246"/><rect x="10.66" width="5.34" height="12" fill="#ce2b37"/></svg></span>';

  const panelCss = `
    :host {
      all: initial;
      /* Design-Tokens „Klar" (Variante A, Wahl der Autorin), helles Schema:
         ruhige Fläche in zartem Rosé, Schrift Atkinson Hyperlegible Next,
         Pink als Akzent (Neon-Rand an Panel, Auswahllisten, Schaltern und
         Knöpfen; Herz als Regler-Knopf und im Schalter). Derselbe Satz steht
         in popup.css (:root); Block [7] der Suite prüft, dass beide gleich
         sind. Custom Properties sind von all:initial nicht betroffen. */
      --ui-bg: #fff8fb;
      --ui-bg-2: #fbeaf2;
      --ui-feld: #ffffff;
      --ui-fg: #1f1a1d;
      --ui-fg-2: #5c4a55;
      --ui-linie: #f2cfe0;
      --ui-rahmen: #f0329a;
      --ui-rose: #d63384;
      --ui-rose-2: #e64980;
      --ui-rose-3: #a61e63;
      --ui-rose-weich: #f3d9e5;
      --ui-violett: #7c3aed;
      --ui-aus: #e6d3dc;
      --ui-icon: #4a3542;
      --ui-knopf: #ffffff;
      --ui-herz: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23d63384' stroke='%23fff8fb' stroke-width='1.3' stroke-linejoin='round' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E");
      --ui-schatten: 0 1px 2px rgba(60, 10, 35, .06), 0 12px 32px rgba(166, 30, 99, .14);
      --ui-schrift: "Atkinson Hyperlegible Next", -apple-system, "Segoe UI", Arial, sans-serif;
    }
    /* Dunkles Schema: fast schwarz mit einem Hauch Pflaume, Pink als Akzent.
       Gilt nach der eigenen Einstellung „Oberfläche dunkel" (Schalter im
       Panel, siehe wendeStileAn) – unabhängig vom Hintergrund des Entscheids
       und nie nach dem System (kein prefers-color-scheme, kein Fingerprinting). */
    :host([data-schema="dunkel"]) {
      --ui-bg: #16141a;
      --ui-bg-2: #211d26;
      --ui-feld: #211d26;
      --ui-fg: #f2ecf0;
      --ui-fg-2: #bdaeb7;
      --ui-linie: #352a34;
      --ui-rahmen: #ff4fa3;
      --ui-rose: #ff6fa5;
      --ui-rose-2: #ff8fbb;
      --ui-rose-3: #ffb3cf;
      --ui-rose-weich: #3a2f38;
      --ui-violett: #b794ff;
      --ui-aus: #3a333f;
      --ui-icon: #e2d6dd;
      --ui-knopf: #ffffff;
      --ui-herz: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ff6fa5' stroke='%2316141a' stroke-width='1.3' stroke-linejoin='round' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E");
      --ui-schatten: 0 1px 2px rgba(0, 0, 0, .5), 0 14px 36px rgba(0, 0, 0, .6);
    }

    /* Geschlossener Zustand: runder Pink-Knopf oben rechts */
    #bkl-button {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 2147483647;
      width: 46px;
      height: 46px;
      padding: 0;
      border-radius: 50%;
      border: 1px solid #a61e63;
      background: #d63384;
      background-image: linear-gradient(145deg, #e64980, #c2276f);
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(166, 30, 99, .25), 0 8px 22px rgba(166, 30, 99, .3), inset 0 1px 0 rgba(255, 255, 255, .3);
    }
    #bkl-button:hover { background-image: linear-gradient(145deg, #f0619a, #d63384); }

    /* Offener Zustand: schmale Karte mit Neon-Rand; scrollbar bei kleinem Bildschirm */
    #bkl-panel {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 2147483647;
      width: 300px;
      max-width: calc(100vw - 24px);
      max-height: calc(100vh - 24px);
      overflow: auto;
      font-family: var(--ui-schrift);
      font-size: 13.5px;
      line-height: 1.35;
      background: var(--ui-bg);
      color: var(--ui-fg);
      color-scheme: light;
      border: 2px solid var(--ui-rahmen);
      border-radius: 12px;
      box-shadow: var(--ui-schatten);
      padding: 10px 12px 12px;
      -webkit-font-smoothing: antialiased;
    }
    :host([data-schema="dunkel"]) #bkl-panel { color-scheme: dark; }
    #bkl-panel[hidden],
    #bkl-button[hidden] { display: none; }

    /* Kopfzeile: Wortmarke fett in Gross-/Kleinschreibung, rechts Sprachwahl mit Flagge und Schliessen */
    #bkl-kopf {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--ui-linie);
    }
    h2 {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 7px;
      margin: 0;
      font-family: var(--ui-schrift);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: none;
      color: var(--ui-fg);
      white-space: nowrap;
    }
    h2 svg { flex: 0 0 auto; }
    .bkl-sprachwahl {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--ui-fg-2);
    }
    /* Flagge der gewählten Sprache (data-sprache, gesetzt von sprachen.js):
       Schweiz für Deutsch, Grossbritannien, Frankreich, Italien. Ein <select>
       kann keine Bilder in seinen Optionen zeigen, daher neben der Liste. */
    .bkl-flagge {
      display: none;
      width: 18px;
      height: 13px;
      border-radius: 2px;
      overflow: hidden;
      box-shadow: 0 0 0 1px rgba(60, 10, 35, .25);
    }
    .bkl-flagge svg { display: block; width: 18px; height: 13px; }
    .bkl-sprachwahl[data-sprache="de"] .bkl-flagge[data-flagge="de"],
    .bkl-sprachwahl[data-sprache="en"] .bkl-flagge[data-flagge="en"],
    .bkl-sprachwahl[data-sprache="fr"] .bkl-flagge[data-flagge="fr"],
    .bkl-sprachwahl[data-sprache="it"] .bkl-flagge[data-flagge="it"] { display: block; }
    /* nur für Vorlesewerkzeuge sichtbar */
    .bkl-sr {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }
    #bkl-sprache { width: auto; max-width: none; font-size: 12px; padding: 2px 4px; }

    /* Schliessen-Knopf: runder Pink-Knopf (wie der Pink-Button auf der Seite) */
    #bkl-schliessen {
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      padding: 0;
      border: 1px solid #a61e63;
      border-radius: 50%;
      background: #d63384;
      background-image: linear-gradient(145deg, #e64980, #c2276f);
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(166, 30, 99, .3), inset 0 1px 0 rgba(255, 255, 255, .25);
    }
    #bkl-schliessen:hover { background-image: linear-gradient(145deg, #f0619a, #d63384); }

    /* Zeilen: Icon, Beschriftung, Bedienelement rechts; zarte Haarlinien dazwischen */
    .bkl-zeile {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 34px;
      padding: 3px 0;
    }
    .bkl-zeile + .bkl-zeile { border-top: 1px solid var(--ui-linie); }
    .bkl-icon {
      flex: 0 0 18px;
      display: inline-flex;
    }
    .bkl-icon svg { display: block; width: 18px; height: 18px; }
    /* Colibre-Icons ans Schema koppeln: die festen Farben der SVGs (Grau,
       Blau, Papierweiss) werden über Attribut-Selektoren auf die Tokens
       umgelenkt; die Icon-Strings selbst bleiben unverändert (identisch zum
       Pop-up, siehe Block [7]). */
    .bkl-icon [fill="#3a3a38"] { fill: var(--ui-icon); }
    .bkl-icon [stroke="#3a3a38"] { stroke: var(--ui-icon); }
    .bkl-icon [fill="#fafafa"] { fill: var(--ui-bg); }
    .bkl-icon [fill="#1e8bcd"] { fill: var(--ui-rose); }
    .bkl-icon [stroke="#1e8bcd"] { stroke: var(--ui-rose); }
    .bkl-icon [fill="#0063b1"] { fill: var(--ui-rose-3); }
    .bkl-icon [fill="#83beec"] { fill: var(--ui-rose-weich); }
    label { flex: 1; min-width: 0; color: var(--ui-fg); font-weight: 400; }
    .bkl-wert {
      flex: 0 0 auto;
      color: var(--ui-fg-2);
      font-size: 12.5px;
      font-variant-numeric: tabular-nums;
      text-align: right;
      white-space: nowrap;
    }

    /* Regler-Zeilen zweizeilig: Beschriftung und Wert oben, der Regler in
       voller Breite darunter (feinere Bedienung, Platz für lange Beschriftungen). */
    .bkl-regler {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr) auto;
      grid-template-areas: "icon label wert" ". regler regler";
      row-gap: 0;
      column-gap: 8px;
      align-items: center;
    }
    .bkl-regler .bkl-icon { grid-area: icon; }
    .bkl-regler label { grid-area: label; }
    .bkl-regler .bkl-wert { grid-area: wert; }
    .bkl-regler input[type="range"] { grid-area: regler; width: 100%; }

    /* Regler: flache Spur, bis zum Wert in Rosé gefüllt (--bkl-p, gesetzt
       von wertAnzeigen), pinkes Herz als Knopf (--ui-herz). Firefox füllt die
       Spur selbst (::-moz-range-progress). */
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      accent-color: #d63384;
      --bkl-p: 0%;
      width: 100%;
      height: 22px;
      margin: 0;
      padding: 0;
      background: transparent;
      cursor: pointer;
    }
    input[type="range"]::-webkit-slider-runnable-track {
      height: 5px;
      border-radius: 999px;
      background: linear-gradient(to right, var(--ui-rose) 0 var(--bkl-p), var(--ui-rose-weich) var(--bkl-p) 100%);
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      margin-top: -7.5px;
      border: 0;
      border-radius: 0;
      background: var(--ui-herz) center / 20px 20px no-repeat;
      box-shadow: none;
    }
    input[type="range"]::-moz-range-track { height: 5px; border-radius: 999px; background: var(--ui-rose-weich); }
    input[type="range"]::-moz-range-progress { height: 5px; border-radius: 999px; background: var(--ui-rose); }
    input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border: 0;
      border-radius: 0;
      background: var(--ui-herz) center / 18px 18px no-repeat;
      background-color: transparent;
      box-shadow: none;
    }

    /* Häkchen als Schalter mit Neon-Rand: aus grau-rosé, ein mit Verlauf
       Rosé-Violett und Herz im Knopf (Herz-Knöpfe, Vorgabe der Autorin).
       Bleibt für Tastatur und Vorlesewerkzeuge eine Checkbox. */
    input[type="checkbox"] {
      -webkit-appearance: none;
      appearance: none;
      accent-color: #d63384;
      box-sizing: border-box;
      flex: 0 0 auto;
      position: relative;
      width: 40px;
      height: 22px;
      margin: 0;
      border-radius: 999px;
      border: 2px solid var(--ui-rahmen);
      background: var(--ui-aus);
      cursor: pointer;
    }
    input[type="checkbox"]::before {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--ui-knopf);
      box-shadow: 0 1px 2px rgba(60, 10, 35, .35);
    }
    input[type="checkbox"]:checked { background: linear-gradient(90deg, var(--ui-rose), var(--ui-violett)); border-color: var(--ui-rose-3); }
    input[type="checkbox"]:checked::before { left: 20px; background: var(--ui-herz) center / 10px 10px no-repeat, var(--ui-knopf); }

    /* Auswahllisten: weisses Feld mit Neon-Rand, native Pfeil-Schaltfläche (folgt color-scheme) */
    select {
      flex: 0 0 auto;
      width: 134px;
      max-width: 54%;
      font: inherit;
      font-size: 12.5px;
      color: var(--ui-fg);
      background-color: var(--ui-feld);
      border: 2px solid var(--ui-rahmen);
      border-radius: 9px;
      padding: 3px 5px;
      cursor: pointer;
    }
    select:hover { border-color: var(--ui-rose-3); }
${vorschauCss()}
    /* Toggle für den Detail-Bereich (echter Button, aria-expanded): flacher
       Knopf in Rosé mit pinkem Pfeil, ohne Verlauf */
    #bkl-details-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 7px 10px;
      border: 1px solid var(--ui-linie);
      border-radius: 8px;
      background: var(--ui-bg-2);
      color: var(--ui-fg);
      font: inherit;
      font-size: 13.5px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: none;
      cursor: pointer;
      text-align: left;
    }
    #bkl-details-toggle:hover { border-color: var(--ui-rahmen); }
    #bkl-details-toggle .bkl-pfeil { display: inline-flex; color: var(--ui-rose); }
    /* statische Drehung, absichtlich ohne Transition/Animation */
    #bkl-details-toggle[aria-expanded="true"] .bkl-pfeil svg { transform: rotate(90deg); }
    #bkl-details { margin-top: 6px; }
    #bkl-details[hidden] { display: none; }

    .bkl-knopfreihe { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    button.bkl-aktion {
      border: 2px solid var(--ui-rahmen);
      border-radius: 8px;
      background: transparent;
      color: var(--ui-fg);
      padding: 4px 12px;
      font: inherit;
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: none;
      cursor: pointer;
    }
    button.bkl-aktion:hover { background: var(--ui-bg-2); border-color: var(--ui-rose-3); }

    /* Sichtbarer Fokus-Rahmen für Tastaturbedienung (tiefes Rosé, 6.7:1 auf hell, 11:1 auf dunkel) */
    #bkl-button:focus-visible,
    #bkl-schliessen:focus-visible,
    #bkl-details-toggle:focus-visible,
    button.bkl-aktion:focus-visible,
    input:focus-visible,
    select:focus-visible {
      outline: 2px solid var(--ui-rose-3);
      outline-offset: 2px;
    }

    /* Eigener Tooltip (erscheint erst nach TOOLTIP_VERZOEGERUNG; native
       title-Tooltips lassen sich nicht verzögern). Liegt ausserhalb des
       Panels, damit dessen overflow ihn nicht abschneidet. */
    #bkl-tooltip {
      position: fixed;
      z-index: 2147483647;
      max-width: 300px;
      padding: 7px 10px;
      border-radius: 8px;
      background: #1f1a1d;
      color: #ffffff;
      font-family: var(--ui-schrift);
      font-size: 13px;
      line-height: 1.4;
      box-shadow: 0 4px 14px rgba(0, 0, 0, .35);
      pointer-events: none;
    }
    #bkl-tooltip[hidden] { display: none; }
  `;

  shadow.innerHTML = `
    <style>${panelCss}</style>
    <button type="button" id="bkl-button"
            data-tooltip="bger reader Einstellungen öffnen"
            aria-label="bger reader Einstellungen öffnen">${ICON_BUCH_SMILE}</button>
    <div id="bkl-panel" role="region" aria-label="bger reader Einstellungen" hidden>
      <div id="bkl-kopf">
        <h2>${ICON_MARKE} bger reader</h2>
        <span class="bkl-sprachwahl">${ICON_FLAGGEN}<label for="bkl-sprache" class="bkl-sr">Sprache</label><select id="bkl-sprache" data-tooltip="Sprache der Bedienoberfläche (Deutsch, English, Français, Italiano)" aria-label="Sprache der Bedienoberfläche wählen"><option value="de" lang="de">Deutsch</option><option value="en" lang="en">English</option><option value="fr" lang="fr">Français</option><option value="it" lang="it">Italiano</option></select></span>
        <button type="button" id="bkl-schliessen"
                data-tooltip="Einstellungen schliessen (Escape)"
                aria-label="Einstellungen schliessen">${svgIcon(PFAD_SCHLIESSEN)}</button>
      </div>

      <div class="bkl-bereich" id="bkl-allgemein">
        <div class="bkl-zeile">
          <span class="bkl-icon">${ICONS.buch}</span>
          <label for="bkl-aktiv">einschalten</label>
          <input type="checkbox" id="bkl-aktiv" data-tooltip="Lesemodus ein-/ausschalten" aria-label="Lesemodus ein-/ausschalten">
        </div>
        <div class="bkl-zeile bkl-regler">
          <span class="bkl-icon">${ICONS.groesse}</span>
          <label for="bkl-groesse">Schriftgrösse</label>
          <input type="range" id="bkl-groesse" min="6" max="50" step="1" data-tooltip="Schriftgrösse (6 bis 50, Standard 18)" aria-label="Schriftgrösse"><span class="bkl-wert" id="bkl-groesse-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${ICONS.art}</span>
          <label for="bkl-art">Schriftart</label>
          <select id="bkl-art" data-tooltip="Schriftart wählen (Vorschau in der Liste)" aria-label="Schriftart wählen">
            <option value="atkinson">Atkinson Hyperlegible</option>
            <option value="luciole">Luciole</option>
            <option value="opendyslexic">OpenDyslexic</option>
            <option value="comicneue">Comic Neue</option>
            <option value="garamond">EB Garamond</option>
            <option value="liberation-sans">Liberation Sans (Arial-ähnlich)</option>
            <option value="liberation-serif">Liberation Serif (Times-ähnlich)</option>
            <option value="sans">System Sans</option>
            <option value="serif">System Serif</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${ICONS.farbe}</span>
          <label for="bkl-farbe">Hintergrund</label>
          <select id="bkl-farbe" data-tooltip="Hintergrund und Textfarbe wählen (Vorschau in der Liste)" aria-label="Hintergrund wählen">
            <option value="hell">Weiss</option>
            <option value="sepia">Sepia</option>
            <option value="dunkel">Dunkel</option>
            <option value="kontrast">Hoher Kontrast</option>
            <option value="nacht">Nacht (rötlich)</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${ICONS.dunkel}</span>
          <label for="bkl-dunkel">Oberfläche dunkel</label>
          <input type="checkbox" id="bkl-dunkel" data-tooltip="Panel und Einstellungsfenster dunkel darstellen, unabhängig vom Hintergrund des Entscheids und nie nach dem System" aria-label="Bedienoberfläche dunkel darstellen">
        </div>
        <div class="bkl-zeile bkl-regler">
          <span class="bkl-icon">${ICONS.spalte}</span>
          <label for="bkl-spalte">Breite</label>
          <input type="range" id="bkl-spalte" min="400" max="1400" step="25" data-tooltip="Breite des Textrahmens in Pixel (Standard 800, die Seite selbst 625)" aria-label="Breite des Textrahmens in Pixel"><span class="bkl-wert" id="bkl-spalte-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${ICONS.klammer}</span>
          <label for="bkl-klammern">einfach</label>
          <input type="checkbox" id="bkl-klammern" data-tooltip="Klammerbemerkungen einklappen (Regel: Fundstellen wie BGE-Zitate und Literatur werden eingeklappt; Gesetzesverweise und Entscheidtext bleiben offen)" aria-label="Klammerbemerkungen einklappen">
        </div>
      </div>

      <button type="button" id="bkl-details-toggle" aria-expanded="false" aria-controls="bkl-details"
              data-tooltip="Weitere Einstellungen ein-/ausblenden" aria-label="Erweiterte Einstellungen ein-/ausblenden">
        <span class="bkl-pfeil">${svgIcon(PFAD_PFEIL)}</span>erweitert
      </button>
      <div class="bkl-bereich" id="bkl-details" hidden>
        <div class="bkl-zeile">
          <span class="bkl-icon">${ICONS.staerke}</span>
          <label for="bkl-staerke">Schriftstärke</label>
          <select id="bkl-staerke" data-tooltip="Schriftstärke wählen" aria-label="Schriftstärke wählen">
            <option value="normal">normal</option>
            <option value="fett">fett</option>
          </select>
        </div>
        <div class="bkl-zeile bkl-regler">
          <span class="bkl-icon">${ICONS.zeilen}</span>
          <label for="bkl-zeilenabstand">Zeilen</label>
          <input type="range" id="bkl-zeilenabstand" min="1" max="2.5" step="0.1" data-tooltip="Zeilenabstand (Faktor)" aria-label="Zeilenabstand (Faktor)"><span class="bkl-wert" id="bkl-zeilenabstand-w"></span>
        </div>
        <div class="bkl-zeile bkl-regler">
          <span class="bkl-icon">${ICONS.absatz}</span>
          <label for="bkl-absatz">Absatz</label>
          <input type="range" id="bkl-absatz" min="0" max="3" step="0.25" data-tooltip="Zusätzlicher Abstand nach jedem Absatz (Faktor der Schriftgrösse, 0 = Seiten-Standard)" aria-label="Absatzabstand (Faktor, 0 = Seiten-Standard)"><span class="bkl-wert" id="bkl-absatz-w"></span>
        </div>
        <div class="bkl-zeile bkl-regler">
          <span class="bkl-icon">${ICONS.buchstaben}</span>
          <label for="bkl-buchstaben">Buchstabenabstand</label>
          <input type="range" id="bkl-buchstaben" min="0" max="4" step="0.1" data-tooltip="Buchstabenabstand in Pixel" aria-label="Buchstabenabstand in Pixel"><span class="bkl-wert" id="bkl-buchstaben-w"></span>
        </div>
        <div class="bkl-zeile bkl-regler">
          <span class="bkl-icon">${ICONS.worte}</span>
          <label for="bkl-worte">Wortabstand</label>
          <input type="range" id="bkl-worte" min="0" max="10" step="0.1" data-tooltip="Wortabstand in Pixel" aria-label="Wortabstand in Pixel"><span class="bkl-wert" id="bkl-worte-w"></span>
        </div>
        <div class="bkl-zeile bkl-regler">
          <span class="bkl-icon">${ICONS.laenge}</span>
          <label for="bkl-laenge">Zeilenlänge</label>
          <input type="range" id="bkl-laenge" min="0" max="120" step="10" data-tooltip="Zeilenlänge begrenzen (Zeichen, 0 = aus)" aria-label="Zeilenlänge begrenzen (Zeichen, 0 = aus)"><span class="bkl-wert" id="bkl-laenge-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${ICONS.silben}</span>
          <label for="bkl-silben">Silbentrennung</label>
          <input type="checkbox" id="bkl-silben" data-tooltip="Silbentrennung ein-/ausschalten" aria-label="Silbentrennung ein-/ausschalten">
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${ICONS.ausrichtung}</span>
          <label for="bkl-ausrichtung">Ausrichtung</label>
          <select id="bkl-ausrichtung" data-tooltip="Textausrichtung der Absätze (Standard: links)" aria-label="Textausrichtung wählen">
            <option value="links">links</option>
            <option value="mittig">mittig</option>
            <option value="rechts">rechts</option>
            <option value="blocksatz">Blocksatz</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${ICONS.spalten}</span>
          <label for="bkl-spalten">Spalten</label>
          <select id="bkl-spalten" data-tooltip="Entscheidtext in 1, 2 oder 3 Spalten (Zeitungssatz)" aria-label="Anzahl Textspalten wählen">
            <option value="1">1 Spalte</option>
            <option value="2">2 Spalten</option>
            <option value="3">3 Spalten</option>
          </select>
        </div>
        <div class="bkl-knopfreihe">
          <button class="bkl-aktion" id="bkl-reset" data-tooltip="${RESET_TOOLTIP}" aria-label="Alle Einstellungen auf Standard zurücksetzen">Zurücksetzen</button>
        </div>
      </div>
    </div>
    <div id="bkl-tooltip" role="tooltip" hidden></div>
  `;

  const panel = shadow.getElementById('bkl-panel');
  const pinkKnopf = shadow.getElementById('bkl-button');

  /* Öffnen/Schliessen: Pink-Button öffnet, X-Knopf oder Escape schliesst.
     Fokus-Management: beim Öffnen Fokus ins Panel (Schliessen-Knopf),
     beim Schliessen zurück auf den Pink-Button. */
  function panelOeffnen() {
    tooltipVerbergen();
    panel.hidden = false;
    pinkKnopf.hidden = true;
    shadow.getElementById('bkl-schliessen').focus();
  }
  function panelSchliessen() {
    tooltipVerbergen();
    panel.hidden = true;
    pinkKnopf.hidden = false;
    pinkKnopf.focus();
  }
  pinkKnopf.addEventListener('click', panelOeffnen);
  shadow.getElementById('bkl-schliessen').addEventListener('click', panelSchliessen);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      tooltipVerbergen();
      if (!panel.hidden) panelSchliessen();
    }
  });

  /* ---------- Tooltips mit Verzögerung ----------
     Native title-Tooltips erscheinen nach ca. einer Sekunde und lassen sich
     nicht verzögern. Die Texte stehen deshalb in data-tooltip und werden
     erst nach TOOLTIP_VERZOEGERUNG in #bkl-tooltip eingeblendet – bei Maus
     über dem Element oder bei Tastaturfokus (:focus-visible). Weg bei
     Verlassen, Blur, Klick, Escape. Die gleiche Funktion steht in popup.js. */
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
        // Fokus durch Mausklick: kein Tooltip (der Regler hält den Fokus
        // noch lange nach dem Loslassen). jsdom kennt :focus-visible nicht.
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
  const tooltipVerbergen = tooltipsEinrichten(shadow, shadow.getElementById('bkl-tooltip'));

  /* Detail-Bereich ein-/ausklappen (echter Button, aria-expanded) */
  const detailsToggle = shadow.getElementById('bkl-details-toggle');
  const details = shadow.getElementById('bkl-details');
  detailsToggle.addEventListener('click', function () {
    const offen = details.hidden;
    details.hidden = !offen;
    detailsToggle.setAttribute('aria-expanded', offen ? 'true' : 'false');
  });

  function aktualisiereAnzeige() {
    const e = einstellungen;
    if (e.sprache !== angezeigteSprache) sprachAnwenden();
    shadow.getElementById('bkl-sprache').value = e.sprache;
    shadow.getElementById('bkl-aktiv').checked = e.aktiv;
    shadow.getElementById('bkl-groesse').value = e.schriftgroesse;
    shadow.getElementById('bkl-art').value = e.schriftart;
    shadow.getElementById('bkl-staerke').value = e.schriftstaerke;
    shadow.getElementById('bkl-zeilenabstand').value = e.zeilenabstand;
    shadow.getElementById('bkl-absatz').value = e.absatzabstand;
    shadow.getElementById('bkl-buchstaben').value = e.buchstabenabstand;
    shadow.getElementById('bkl-worte').value = e.wortabstand;
    shadow.getElementById('bkl-laenge').value = e.zeilenlaenge;
    shadow.getElementById('bkl-spalte').value = e.spaltenbreite;
    shadow.getElementById('bkl-silben').checked = e.silbentrennung;
    shadow.getElementById('bkl-farbe').value = e.farbschema;
    shadow.getElementById('bkl-dunkel').checked = e.oberflaecheDunkel;
    shadow.getElementById('bkl-klammern').checked = e.klammern;
    shadow.getElementById('bkl-ausrichtung').value = e.ausrichtung;
    shadow.getElementById('bkl-spalten').value = String(e.spalten);
    Object.keys(WERTANZEIGE).forEach(wertAnzeigen);
  }

  /* ---------- Reaktion auf Bedienung: drei Pfade nach Aufwand ----------
     Die drei Teilschritte kosten sehr unterschiedlich viel, deshalb laufen
     sie nicht mehr pauschal zusammen:

     1. wendeStileAn() setzt nur CSS-Variablen auf <html>. Ein gutes Dutzend
        Zuweisungen, den Rest rechnet der Browser im Layout. Laeuft bei JEDER
        Reglerbewegung sofort und ungedrosselt – hier wird bewusst nichts
        verzoegert, sonst fuehlt sich der Regler traege an.
     2. verarbeiteKlammern() reisst die Folds aller Entscheidabsaetze ab und
        baut sie neu auf (TreeWalker + Range ueber das ganze Dokument). Das
        Ergebnis haengt ausschliesslich an `aktiv` und `klammern`; Schriftart,
        Groesse, Abstaende und Farbschema aendern daran nichts. Frueher lief
        es bei jedem Regler-Pixel mit, jetzt nur noch beim Umschalten dieser
        beiden Einstellungen.
        Nebeneffekt, der vorher fehlte: von Hand aufgeklappte Klammern
        bleiben offen, wenn die Schrift verstellt wird.
     3. speichereEinstellungen() schreibt in chrome.storage.local. Bei Reglern
        gebuendelt, siehe speichereGebuendelt() – das ist der einzige
        gedrosselte Teil und fuer das Auge unsichtbar. Auswahl und Haekchen
        schreiben sofort, ebenso das Loslassen eines Reglers (change).
  */

  /* Schreibzugriffe buendeln (Throttle mit fuehrender Kante):
     Der erste Wert geht sofort raus, damit der gespeicherte Zustand auch bei
     einem Abbruch mitten im Ziehen stimmt. Weitere Aenderungen innerhalb des
     Fensters werden zu einem einzigen Schreibvorgang am Fensterende
     zusammengefasst; der zuletzt eingestellte Wert landet immer im Speicher.
     Bewusst KEIN klassisches Debouncing der Anzeige: gedrosselt wird nur der
     Speicher-I/O, nie die Darstellung. */
  const SPEICHER_ABSTAND = 400; // ms
  let speicherTimer = null;
  let letzteSpeicherung = 0;

  function speichereGebuendelt() {
    if (speicherTimer !== null) return; // Nachschreiben ist bereits geplant
    const seit = Date.now() - letzteSpeicherung;
    if (seit >= SPEICHER_ABSTAND) {
      letzteSpeicherung = Date.now();
      speichereEinstellungen();
      return;
    }
    speicherTimer = setTimeout(function () {
      speicherTimer = null;
      letzteSpeicherung = Date.now();
      speichereEinstellungen();
    }, SPEICHER_ABSTAND - seit);
  }

  function speichereSofort() {
    if (speicherTimer !== null) { clearTimeout(speicherTimer); speicherTimer = null; }
    letzteSpeicherung = Date.now();
    speichereEinstellungen();
  }

  /* Ausstehenden gebuendelten Schreibvorgang sofort nachholen. Aufgerufen beim
     Loslassen eines Reglers (change) und, als letzte Reserve, beim Verlassen
     oder Verstecken der Seite. Nur Reserve: Firefox verwirft einen erst bei
     pagehide abgesetzten storage-Schreibvorgang, wenn die Seite gerade
     navigiert (Chrome fuehrt ihn aus) – der Browser-Smoke-Test hat das
     gefunden. Deshalb darf kein Wert allein an pagehide haengen. */
  function nachschreiben() {
    if (speicherTimer !== null) speichereSofort();
  }
  window.addEventListener('pagehide', nachschreiben);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') nachschreiben();
  });

  /* Nur die Zahl neben dem bewegten Regler nachfuehren statt aller
     Bedienelemente wie in aktualisiereAnzeige(). Schriftgrösse bewusst ohne
     Einheit (nur die Zahl). Bei den Dropdowns Schriftart/Hintergrund wird
     stattdessen data-wert gesetzt (Vorschau im geschlossenen Dropdown). */
  /* Füllung der Regler-Spur bis zum Wert: CSS-Variable --bkl-p am Regler
     (panelCss zeichnet die Spur als Verlauf bis zu diesem Prozentwert). */
  function reglerFuellung(el) {
    if (!el || el.type !== 'range') return;
    const min = +el.min || 0, max = +el.max || 100, wert = +el.value;
    const p = max > min ? Math.max(0, Math.min(100, (wert - min) / (max - min) * 100)) : 0;
    el.style.setProperty('--bkl-p', p.toFixed(1) + '%');
  }

  const WERTANZEIGE = {
    'bkl-groesse':       function (e) { return String(e.schriftgroesse); },
    'bkl-zeilenabstand': function (e) { return String(e.zeilenabstand); },
    'bkl-absatz':        function (e) { return e.absatzabstand === 0 ? sprachTexte.allgemein.aus : String(e.absatzabstand); },
    'bkl-buchstaben':    function (e) { return (+e.buchstabenabstand).toFixed(1) + 'px'; },
    'bkl-worte':         function (e) { return (+e.wortabstand).toFixed(1) + 'px'; },
    'bkl-laenge':        function (e) { return e.zeilenlaenge === 0 ? sprachTexte.allgemein.aus : String(e.zeilenlaenge); },
    'bkl-spalte':        function (e) { return e.spaltenbreite + 'px'; },
    'bkl-art':           null,
    'bkl-farbe':         null
  };

  function wertAnzeigen(id) {
    if (!(id in WERTANZEIGE)) return;
    const f = WERTANZEIGE[id];
    if (!f) {
      const sel = shadow.getElementById(id);
      if (sel) sel.setAttribute('data-wert', sel.value);
      return;
    }
    const el = shadow.getElementById(id + '-w');
    if (el) el.textContent = f(einstellungen);
    reglerFuellung(shadow.getElementById(id));
  }

  /* Pfad A – Typografie und Farben: Darstellung sofort, Folds unberuehrt.
     Regler (viele input-Ereignisse waehrend des Ziehens) speichern
     gebuendelt, Auswahl und Haekchen (ein change-Ereignis) sofort. */
  function stilGeaendert(id, gebuendelt) {
    wendeStileAn();
    wertAnzeigen(id);
    if (gebuendelt) speichereGebuendelt(); else speichereSofort();
  }

  /* Pfad B – aktiv/klammern: hier aendert sich, WELCHE Klammern eingeklappt
     sind, also muessen die Folds neu aufgebaut werden. */
  function aufbauGeaendert() {
    wendeStileAn();
    verarbeiteKlammern();
    speichereSofort();
  }

  /* Pfad C – Zuruecksetzen: alles neu, inklusive aller Bedienelemente, und
     sofort speichern (kein Buendeln noetig, das ist ein Einzelereignis). */
  function allesAnwenden() {
    wendeStileAn();
    verarbeiteKlammern();
    aktualisiereAnzeige();
    speichereSofort();
  }

  function bei(id, event, fn) {
    shadow.getElementById(id).addEventListener(event, fn);
  }

  /* Bedienung erst nach dem Laden der Einstellungen anschliessen (siehe START).
     Der Ladevorgang ist asynchron; ein Klick davor schriebe Standardwerte plus
     eine Änderung über die gespeicherten Werte, und das nachträgliche Laden
     würfe den Klick wieder um. Auf Windows-Firefox dauert der erste
     Speicherzugriff über eine Sekunde (Browser-Smoke-Test). */
  function bedienungEinrichten() {
  bei('bkl-aktiv', 'change', function (e) { einstellungen.aktiv = e.target.checked; aufbauGeaendert(); });
  bei('bkl-klammern', 'change', function (e) { einstellungen.klammern = e.target.checked; aufbauGeaendert(); });

  bei('bkl-groesse', 'input', function (e) { einstellungen.schriftgroesse = +e.target.value; stilGeaendert('bkl-groesse', true); });
  bei('bkl-art', 'change', function (e) { einstellungen.schriftart = e.target.value; stilGeaendert('bkl-art'); });
  bei('bkl-staerke', 'change', function (e) { einstellungen.schriftstaerke = e.target.value; stilGeaendert('bkl-staerke'); });
  bei('bkl-zeilenabstand', 'input', function (e) { einstellungen.zeilenabstand = +e.target.value; stilGeaendert('bkl-zeilenabstand', true); });
  bei('bkl-buchstaben', 'input', function (e) { einstellungen.buchstabenabstand = +e.target.value; stilGeaendert('bkl-buchstaben', true); });
  bei('bkl-worte', 'input', function (e) { einstellungen.wortabstand = +e.target.value; stilGeaendert('bkl-worte', true); });
  bei('bkl-laenge', 'input', function (e) { einstellungen.zeilenlaenge = +e.target.value; stilGeaendert('bkl-laenge', true); });
  bei('bkl-spalte', 'input', function (e) { einstellungen.spaltenbreite = +e.target.value; stilGeaendert('bkl-spalte', true); });
  bei('bkl-silben', 'change', function (e) { einstellungen.silbentrennung = e.target.checked; stilGeaendert('bkl-silben'); });
  bei('bkl-farbe', 'change', function (e) { einstellungen.farbschema = e.target.value; stilGeaendert('bkl-farbe'); });
  bei('bkl-dunkel', 'change', function (e) { einstellungen.oberflaecheDunkel = e.target.checked; stilGeaendert('bkl-dunkel'); });
  bei('bkl-ausrichtung', 'change', function (e) { einstellungen.ausrichtung = e.target.value; stilGeaendert('bkl-ausrichtung'); });
  bei('bkl-spalten', 'change', function (e) { einstellungen.spalten = +e.target.value; stilGeaendert('bkl-spalten'); });
  bei('bkl-absatz', 'input', function (e) { einstellungen.absatzabstand = +e.target.value; stilGeaendert('bkl-absatz', true); });
  // Sprache: Panel und Pfeil-Titel sofort umschreiben, Wertanzeige („aus") nachziehen, speichern.
  bei('bkl-sprache', 'change', function (e) { einstellungen.sprache = e.target.value; sprachAnwenden(); aktualisiereAnzeige(); speichereSofort(); });
  // Regler losgelassen: den letzten Wert nicht in der Buendelung haengen lassen.
  ['bkl-groesse', 'bkl-zeilenabstand', 'bkl-buchstaben', 'bkl-worte', 'bkl-laenge', 'bkl-spalte', 'bkl-absatz']
    .forEach(function (id) { bei(id, 'change', nachschreiben); });
  bei('bkl-reset', 'click', function () {
    // Alles auf Standard; Sprache und dunkle Oberfläche bleiben (wer Französisch
    // liest, soll nicht Deutsch bekommen, und die Oberfläche soll nicht umspringen).
    einstellungen = Object.assign({}, STANDARDS, { sprache: einstellungen.sprache, oberflaecheDunkel: einstellungen.oberflaecheDunkel });
    allesAnwenden();
  });
  }

  /* ================================================================== */
  /* LIVE-SYNC MIT DEM POP-UP-FENSTER                                     */
  /* ================================================================== */

  /* Änderungen aus dem mittigen Pop-up-Fenster (background.js öffnet es per
     Icon-Klick, popup.js schreibt in denselben Speicher) live auf dieser
     Seite anwenden. Bewusst KEIN erneutes Speichern hier: sonst Ping-Pong
     über onChanged. */
  if (extensionApi && extensionApi.storage &&
      extensionApi.storage.onChanged &&
      typeof extensionApi.storage.onChanged.addListener === 'function') {
    try {
      extensionApi.storage.onChanged.addListener(function (aenderungen, bereich) {
        if (bereich !== 'local') return;
        const diff = aenderungen && aenderungen[STORAGE_KEY];
        if (!diff || !diff.newValue) return;
        // Eigen-Echo: Chrome meldet auch die Schreibvorgänge DIESER Seite.
        // Am gemerkten Paket erkennen (eigeneSchreibvorgaenge) – sonst käme
        // bei jedem Reglerzug der Fold-Neuaufbau durch die Hintertür zurück
        // (und aufgeklappte Klammern fielen wieder zu), und das Echo eines
        // älteren Schreibens würde eine jüngere Einstellung zurückdrehen.
        const echo = eigeneSchreibvorgaenge.indexOf(signatur(diff.newValue));
        if (echo !== -1) { eigeneSchreibvorgaenge.splice(echo, 1); return; }
        const neu = bereinige(Object.assign({}, STANDARDS, diff.newValue));
        // Stand bereits identisch (gleicher Wert aus dem Pop-up): nichts anzuwenden.
        if (JSON.stringify(neu) === JSON.stringify(einstellungen)) return;
        // Gleiche Aufwandstrennung wie bei der Bedienung im Panel: Folds nur
        // neu aufbauen, wenn aktiv oder klammern gekippt sind.
        const aufbau = neu.aktiv !== einstellungen.aktiv || neu.klammern !== einstellungen.klammern;
        einstellungen = neu;
        wendeStileAn();
        if (aufbau) verarbeiteKlammern();
        aktualisiereAnzeige();
      });
    } catch (e) { /* ohne Live-Sync geht es auch */ }
  }

  /* ================================================================== */
  /* START                                                                */
  /* ================================================================== */

  // Gespeicherte Einstellungen laden (Extension-Speicher ist asynchron),
  // erst danach Stile/Klammern/Panel-Anzeige anwenden.
  ladeEinstellungen(function () {
    wendeStileAn();
    verarbeiteKlammern();
    aktualisiereAnzeige();
    bedienungEinrichten();
    host.setAttribute('data-bereit', ''); // Marker für Tests: Einstellungen geladen, Bedienung aktiv
    inhaltBeobachten(); // nur bvger.weblaw.ch: nachgeladenen Entscheid verarbeiten
    // Beim Start nur lesen: Ein Ladefehler darf gespeicherte Werte nicht
    // durch Standardwerte überschreiben. Gespeichert wird bei Bedienung.
  });
})();

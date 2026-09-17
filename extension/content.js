// BGer Reader – unabhängiges Projekt, nicht mit dem Schweizerischen Bundesgericht verbunden. 100 % offline, keine Datenerhebung.

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
        // Seitenwechsel-Balken („BGE 152 IV 1 S. 7") liegen mitten im Absatz,
        // sind aber kein Entscheidtext: weder zur Länge noch zu den Ziffern
        // einer Klammer zählen.
        if (el && el.closest('script, style, .pagebreak')) continue;
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
    // Amtliche Sammlung: BGE 135 II 45, ATF 143 IV 27, DTF 120 Ia 1, BVGE 2019 I 1
    const BGE_RE = /\b(?:BGE|ATF|DTF)\s+\d{1,3}\s+[IVX]{1,4}[ab]?\s+\d{1,4}\b|\bBVGE\s+(?:19|20)\d{2}\s+[IVX]{1,4}\s+\d{1,4}\b|\bTPF\s+(?:19|20)\d{2}\s+\d{1,4}\b/;
    // Aktenzeichen: 6B_123/2020, 1C_45/2019, 6S.12/2004 (BGer); A-1234/2019 (BVGer);
    // SK.2019.12, BB.2020.5 (BStGer). Nicht: "S. 12", "N. 12" (Leerzeichen dazwischen).
    const AKTENZEICHEN_RE = /(?:^|[^A-Za-z0-9])(?:\d[A-Z]{1,2}[_.]\d{1,4}\/\d{2,4}|[A-Z]-\d{1,5}\/\d{4}|[A-Z]{2}\.(?:19|20)\d{2}\.\d{1,4})\b/;
    // Praxis des Bundesgerichts, EGMR/EuGH
    const WEITERE_RSPR_RE = /\bPra\s+\d{2,4}\s+Nr\.?\s*\d+|\b(?:EGMR|CourEDH|ECHR|EuGH|CJUE|CJEU)\b[^;]*\d|\bC-\d{1,4}\/\d{2}\b/;

    // Das EIGENE Aktenzeichen im Rubrum ("dossier 6B_399/2024", "Verfahren
    // 6B_1/2020") verweist auf nichts Nachzuschlagendes – es bleibt offen.
    // Ein zitiertes Urteil ("Urteil 6B_220/2011", "arrêt 6B_390/2018") ist
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
    farbschema: 'hell',         // hell | sepia | dunkel | kontrast | nacht
    klammern: true              // Easy-Mode: Klammern nach festem Regelsatz einklappen
  };

  /* Speicher-Strategie (Privacy: 100 % offline, nichts verlässt das Gerät):
   * – Extension: browser.storage.local / chrome.storage.local → Einstellungen gelten domain-übergreifend
   *   (search.bger.ch UND relevancy.bger.ch), bleiben aber lokal.
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

  /* Klammer-Zähler für das mittige Pop-up-Fenster veröffentlichen (gleicher
     lokaler Speicher, getrennter Schlüssel): das Fenster zeigt ihn an, ohne
     dass Nachrichten an Tabs oder zusätzliche Rechte nötig wären. */
  const ZAEHLER_SCHLUESSEL = 'bger-reader-zaehler';

  function publiziereZaehler(anzahl) {
    if (!extensionStorage) return; // jsdom/localStorage-Fallback: kein Fenster-Publikum
    try {
      const paket = {};
      paket[ZAEHLER_SCHLUESSEL] = { anzahl: anzahl, zeit: Date.now() };
      if (verwendetPromises) {
        extensionStorage.set(paket).catch(function () {});
      } else {
        extensionStorage.set(paket, function () {
          if (extensionApi.runtime && extensionApi.runtime.lastError) return;
        });
      }
    } catch (e) { /* Zähler-Anzeige ist nett, nicht kritisch */ }
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
  // @font-face muss runtime.getURL() der Extension verwenden (Content-Script-Kontext:
  // relative Pfade würden auf die Seite zeigen, nicht auf die Extension).
  // In der jsdom-Testumgebung gibt es runtime nicht -> keine
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

    if (!einstellungen.aktiv || !einstellungen.klammern) { aktualisiereZaehler(0); return; }

    let anzahl = 0;
    entscheidBloecke().forEach(function (block) {
      anzahl += BGerReader.blockVerarbeiten(block);
    });
    aktualisiereZaehler(anzahl);
  }

  function aktualisiereZaehler(anzahl) {
    publiziereZaehler(anzahl); // Spiegel für das Pop-up-Fenster
    const z = shadow.getElementById('bkl-zaehler');
    if (!z) return;
    z.textContent = anzahl > 0
      ? anzahl + ' Klammerbemerkung' + (anzahl === 1 ? '' : 'en') + ' eingeklappt (Pfeil ▸ anklicken zum Aufklappen).'
      : (einstellungen.aktiv && einstellungen.klammern
        ? 'Keine Klammern eingeklappt. Regel: Fundstellen (Rechtsprechung, Literatur) werden eingeklappt; Gesetzesverweise und Entscheidtext bleiben offen.'
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
    pfeil:       'M6 4 L10 8 L6 12'
  };

  /* Marken-Icon: Buch mit Smiley (angelehnt an das Extension-Icon).
     Eigenes Markup, weil die Augen gefüllte Kreise sind (fill statt stroke). */
  const ICON_BUCH_SMILE =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" ' +
    'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" ' +
    'aria-hidden="true" focusable="false">' +
    '<path d="M2 4 c2 -1.3 4 -1.3 6 0 c2 -1.3 4 -1.3 6 0 v9 ' +
    'c-2 -1.3 -4 -1.3 -6 0 c-2 -1.3 -4 -1.3 -6 0 z M8 4 v9 ' +
    'M3.8 9.2 c1 1.1 2.5 1.5 4.2 1.5 c1.7 0 3.2 -0.4 4.2 -1.5"/>' +
    '<circle cx="4.8" cy="6.4" r="0.55" fill="currentColor" stroke="none"/>' +
    '<circle cx="11.2" cy="6.4" r="0.55" fill="currentColor" stroke="none"/></svg>';

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
            aria-label="BGer Reader Einstellungen öffnen">${ICON_BUCH_SMILE}</button>
    <div id="bkl-panel" role="region" aria-label="BGer Reader Einstellungen" hidden>
      <div id="bkl-kopf">
        <h2>${ICON_BUCH_SMILE} BGer Reader</h2>
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
            <option value="atkinson">Atkinson Hyperlegible</option>
            <option value="opendyslexic">OpenDyslexic</option>
            <option value="comicneue">Comic Neue</option>
            <option value="garamond">EB Garamond (Buchschrift)</option>
            <option value="liberation-sans">Liberation Sans (Arial-ähnlich)</option>
            <option value="liberation-serif">Liberation Serif (Times-ähnlich)</option>
            <option value="sans">System Sans</option>
            <option value="serif">System Serif</option>
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
            <option value="nacht">Nacht (rötlich)</option>
          </select>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.spalte)}</span>
          <label for="bkl-spalte">Textbreite</label>
          <input type="range" id="bkl-spalte" min="400" max="1400" step="25" title="Breite des Textrahmens in Pixel (Seiten-Standard: 625)" aria-label="Breite des Textrahmens in Pixel"><span class="bkl-wert" id="bkl-spalte-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.klammer)}</span>
          <label for="bkl-klammern">Klammern einklappen</label>
          <input type="checkbox" id="bkl-klammern" title="Klammerbemerkungen einklappen (Regel: Fundstellen wie BGE-Zitate und Literatur werden eingeklappt; Gesetzesverweise und Entscheidtext bleiben offen)" aria-label="Klammerbemerkungen einklappen">
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
          <input type="range" id="bkl-buchstaben" min="0" max="4" step="0.1" title="Buchstabenabstand in Pixel" aria-label="Buchstabenabstand in Pixel"><span class="bkl-wert" id="bkl-buchstaben-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.worte)}</span>
          <label for="bkl-worte">Wortabstand</label>
          <input type="range" id="bkl-worte" min="0" max="10" step="0.1" title="Wortabstand in Pixel" aria-label="Wortabstand in Pixel"><span class="bkl-wert" id="bkl-worte-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.laenge)}</span>
          <label for="bkl-laenge">Zeilenlänge</label>
          <input type="range" id="bkl-laenge" min="0" max="120" step="10" title="Zeilenlänge begrenzen (Zeichen, 0 = aus)" aria-label="Zeilenlänge begrenzen (Zeichen, 0 = aus)"><span class="bkl-wert" id="bkl-laenge-w"></span>
        </div>
        <div class="bkl-zeile">
          <span class="bkl-icon">${svgIcon(ICONS.silben)}</span>
          <label for="bkl-silben">Silbentrennung</label>
          <input type="checkbox" id="bkl-silben" title="Silbentrennung ein-/ausschalten" aria-label="Silbentrennung ein-/ausschalten">
        </div>
        <div class="bkl-knopfreihe">
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
    shadow.getElementById('bkl-buchstaben-w').textContent = (+einstellungen.buchstabenabstand).toFixed(1) + 'px';
    shadow.getElementById('bkl-worte').value = einstellungen.wortabstand;
    shadow.getElementById('bkl-worte-w').textContent = (+einstellungen.wortabstand).toFixed(1) + 'px';
    shadow.getElementById('bkl-laenge').value = einstellungen.zeilenlaenge;
    shadow.getElementById('bkl-laenge-w').textContent = einstellungen.zeilenlaenge === 0 ? 'aus' : einstellungen.zeilenlaenge;
    shadow.getElementById('bkl-spalte').value = einstellungen.spaltenbreite;
    shadow.getElementById('bkl-spalte-w').textContent = einstellungen.spaltenbreite + 'px';
    shadow.getElementById('bkl-silben').checked = einstellungen.silbentrennung;
    shadow.getElementById('bkl-farbe').value = einstellungen.farbschema;
    shadow.getElementById('bkl-klammern').checked = einstellungen.klammern;
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
     3. speichereEinstellungen() schreibt in chrome.storage.local. Gebuendelt,
        siehe speichereGebuendelt() – das ist der einzige gedrosselte Teil und
        fuer das Auge unsichtbar.
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

  /* Seite wird verlassen/versteckt: ausstehenden Schreibvorgang nachholen,
     damit der letzte Reglerwert nicht im offenen Zeitfenster verlorengeht. */
  window.addEventListener('pagehide', function () {
    if (speicherTimer !== null) speichereSofort();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && speicherTimer !== null) speichereSofort();
  });

  /* Nur die Zahl neben dem bewegten Regler nachfuehren statt aller
     14 Bedienelemente wie in aktualisiereAnzeige(). */
  const WERTANZEIGE = {
    'bkl-groesse':       function (e) { return e.schriftgroesse + 'px'; },
    'bkl-zeilenabstand': function (e) { return String(e.zeilenabstand); },
    'bkl-buchstaben':    function (e) { return (+e.buchstabenabstand).toFixed(1) + 'px'; },
    'bkl-worte':         function (e) { return (+e.wortabstand).toFixed(1) + 'px'; },
    'bkl-laenge':        function (e) { return e.zeilenlaenge === 0 ? 'aus' : String(e.zeilenlaenge); },
    'bkl-spalte':        function (e) { return e.spaltenbreite + 'px'; }
  };

  function wertAnzeigen(id) {
    const f = WERTANZEIGE[id];
    if (!f) return;
    const el = shadow.getElementById(id + '-w');
    if (el) el.textContent = f(einstellungen);
  }

  /* Pfad A – Typografie und Farben: Darstellung sofort, Folds unberuehrt. */
  function stilGeaendert(id) {
    wendeStileAn();
    wertAnzeigen(id);
    speichereGebuendelt();
  }

  /* Pfad B – aktiv/klammern: hier aendert sich, WELCHE Klammern eingeklappt
     sind, also muessen die Folds neu aufgebaut werden. */
  function aufbauGeaendert() {
    wendeStileAn();
    verarbeiteKlammern();
    speichereGebuendelt();
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

  bei('bkl-aktiv', 'change', function (e) { einstellungen.aktiv = e.target.checked; aufbauGeaendert(); });
  bei('bkl-klammern', 'change', function (e) { einstellungen.klammern = e.target.checked; aufbauGeaendert(); });

  bei('bkl-groesse', 'input', function (e) { einstellungen.schriftgroesse = +e.target.value; stilGeaendert('bkl-groesse'); });
  bei('bkl-art', 'change', function (e) { einstellungen.schriftart = e.target.value; stilGeaendert('bkl-art'); });
  bei('bkl-staerke', 'change', function (e) { einstellungen.schriftstaerke = e.target.value; stilGeaendert('bkl-staerke'); });
  bei('bkl-zeilenabstand', 'input', function (e) { einstellungen.zeilenabstand = +e.target.value; stilGeaendert('bkl-zeilenabstand'); });
  bei('bkl-buchstaben', 'input', function (e) { einstellungen.buchstabenabstand = +e.target.value; stilGeaendert('bkl-buchstaben'); });
  bei('bkl-worte', 'input', function (e) { einstellungen.wortabstand = +e.target.value; stilGeaendert('bkl-worte'); });
  bei('bkl-laenge', 'input', function (e) { einstellungen.zeilenlaenge = +e.target.value; stilGeaendert('bkl-laenge'); });
  bei('bkl-spalte', 'input', function (e) { einstellungen.spaltenbreite = +e.target.value; stilGeaendert('bkl-spalte'); });
  bei('bkl-silben', 'change', function (e) { einstellungen.silbentrennung = e.target.checked; stilGeaendert('bkl-silben'); });
  bei('bkl-farbe', 'change', function (e) { einstellungen.farbschema = e.target.value; stilGeaendert('bkl-farbe'); });
  bei('bkl-reset', 'click', function () {
    einstellungen = Object.assign({}, STANDARDS);
    allesAnwenden();
  });

  /* ================================================================== */
  /* LIVE-SYNC MIT DEM POP-UP-FENSTER                                     */
  /* ================================================================== */

  /* Änderungen aus dem mittigen Pop-up-Fenster (background.js öffnet es per
     Icon-Klick, popup.js schreibt in denselben Speicher) live auf dieser
     Seite anwenden. Bewusst KEIN erneutes Speichern hier: sonst Ping-Pong
     über onChanged. Der eigene Zähler-Schlüssel wird ignoriert. */
  if (extensionApi && extensionApi.storage &&
      extensionApi.storage.onChanged &&
      typeof extensionApi.storage.onChanged.addListener === 'function') {
    try {
      extensionApi.storage.onChanged.addListener(function (aenderungen, bereich) {
        if (bereich !== 'local') return;
        const diff = aenderungen && aenderungen[STORAGE_KEY];
        if (!diff || !diff.newValue) return;
        const neu = bereinige(Object.assign({}, STANDARDS, diff.newValue));
        // Eigen-Echo: Chrome meldet auch die Schreibvorgänge DIESER Seite.
        // Ist der Stand bereits identisch, gibt es nichts anzuwenden – sonst
        // käme bei jedem Reglerzug der Fold-Neuaufbau durch die Hintertür
        // zurück (und aufgeklappte Klammern fielen wieder zu).
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
    // Beim Start nur lesen: Ein Ladefehler darf gespeicherte Werte nicht
    // durch Standardwerte überschreiben. Gespeichert wird bei Bedienung.
  });
})();

# Scheda dello store – Italiano

Fonte per il Chrome Web Store (lingua della scheda «Italiano»), Microsoft Edge
Add-ons (store listing «Italiano») e Firefox Add-ons / AMO (locale it).
Nome e descrizione breve si trovano anche nel pacchetto
(`extension/_locales/it/messages.json`); mantenere identici i due punti.
I campi non localizzati dei pannelli di controllo (single purpose,
giustificazione delle autorizzazioni, note per i revisori) sono in
`listing.en.md` / `listing.de.md` e `reviewer-notes.md`. Procedura: `STORE-UPDATE.md`.

## Nome (manifest, 42 caratteri; Chrome consiglia ≤ 45, AMO ammette ≤ 50)

BGer Reader – Tribunale federale leggibile

## Descrizione breve (manifest, 128 caratteri; Chrome/Edge ≤ 132, riepilogo AMO ≤ 250)

Sentenze del Tribunale federale accessibili: carattere, spaziature, colori, riferimenti ripiegati. bger.ch e TAF. 100 % offline.

## Descrizione dettagliata (Chrome, AMO, Edge; Edge richiede da 250 a 10 000 caratteri)

BGer Reader rende più leggibili le sentenze del Tribunale federale su bger.ch (search.bger.ch, relevancy.bger.ch) e le sentenze del Tribunale amministrativo federale (TAF, bvger.weblaw.ch). L'estensione è un aiuto alla lettura e all'accessibilità per persone con dislessia, discalculia o ipovisione – e per chiunque legga a lungo la giurisprudenza svizzera sullo schermo: durante gli studi di diritto, negli studi legali, nei tribunali e nell'amministrazione.

Cosa fa l'estensione

• Carattere: nove tipi di carattere, tra cui Atkinson Hyperlegible e Luciole (disegnati per persone ipovedenti) e OpenDyslexic (disegnato per persone con dislessia); dimensione da 6 a 50, peso normale o grassetto.
• Spaziature e impaginazione: interlinea, spaziatura tra paragrafi, lettere e parole, lunghezza delle righe, larghezza del testo, sillabazione, allineamento, da una a tre colonne.
• Sfondo: bianco, seppia, modalità scura, contrasto elevato e una modalità notte rossastra.
• Riferimenti ripiegati: le parentesi con citazioni di giurisprudenza (DTF, numeri di incarto, CEDU) e di dottrina vengono ripiegate dietro una piccola freccia, così il ragionamento non viene interrotto di continuo. I rinvii alle leggi e il testo della sentenza restano aperti; ogni parentesi si apre con un clic. In caso di discalculia è un aiuto particolare: le lunghe sequenze di cifre dei riferimenti spariscono dal flusso di lettura.
• Comandi: un pannello di impostazioni direttamente sulla pagina (pulsante rosa in alto a destra) oppure in grande al centro sopra la sentenza (clic sull'icona nella barra degli strumenti), interamente utilizzabile da tastiera. Interfaccia in italiano, tedesco, francese e inglese.
• Stampa e PDF: nero su bianco nel carattere scelto; le parentesi ripiegate restano ripiegate.
• La modalità lettura e le impostazioni vengono salvate automaticamente e valgono su tutte le pagine supportate dei tribunali svizzeri.

Protezione dei dati

BGer Reader funziona al 100 % offline. L'estensione non invia dati, non scarica nulla, non contiene pubblicità né statistiche. La sua unica autorizzazione è la memoria locale per le proprie impostazioni. Il codice sorgente è open source (licenza MIT) e pubblico.

Indipendenza

BGer Reader è un progetto indipendente, non collegato al Tribunale federale, al Tribunale amministrativo federale o a Weblaw. L'estensione modifica soltanto la visualizzazione nel vostro browser; il testo della sentenza resta invariato e completo.

Assistenza

Domande e segnalazioni: https://github.com/cursorblinkrate-boop/bger-reader-addon/issues oppure bger.reader@gmail.com

## Categoria

- Chrome Web Store: Accessibilità
- Edge Add-ons: Accessibility
- AMO: Aspetto (non esiste una categoria «Accessibilità»; «Altro» non è combinabile). Riepilogo AMO = descrizione breve senza il dominio (AMO rifiuta URL nel riepilogo): «bger.ch e TAF» diventa «Tribunale federale e TAF» (`amo-metadata.js`).

## Parole chiave Edge (non pubbliche; max. 7 termini, 21 parole in totale, ≤ 30 caratteri ciascuno)

Tribunale federale · DTF · sentenze · accessibilità · dislessia · modalità lettura · giurisprudenza svizzera

## Indirizzi

- Sito web: https://github.com/cursorblinkrate-boop/bger-reader-addon
- Assistenza: https://github.com/cursorblinkrate-boop/bger-reader-addon/issues · bger.reader@gmail.com
- Informativa sulla privacy: https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/PRIVACY.md

## Didascalie delle immagini (ordine; immagini in `screenshots/`)

1. `02-panel.png` – Il pannello di impostazioni sulla pagina della sentenza: attivare, dimensione, carattere, sfondo, larghezza, «semplificare» (ripiegare i riferimenti).
2. `41-klammer-aufgeklappt.png` – Riferimenti ripiegati, una parentesi aperta con un clic; i rinvii alle leggi restano aperti.
3. `23-hintergrund-nacht.png` – Sfondo notte: rossastro e attenuato per leggere la sera.
4. `06-dialog-mittig.png` – Clic sull'icona nella barra degli strumenti: le stesse impostazioni in grande al centro, la sentenza resta visibile (qui seppia).
5. `03-panel-erweitert.png` – Impostazioni avanzate: peso, interlinea, paragrafi, lettere, parole, lunghezza delle righe, sillabazione, allineamento, colonne.
6. `90-franzoesisch-regeste.png` (Edge, AMO) – Una sentenza in francese (DTF 145 I 207) sulle pagine francesi di bger.ch.

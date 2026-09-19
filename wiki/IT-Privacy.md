[Deutsch](DE-Datenschutz.md) · [English](EN-Privacy.md) · [Français](FR-Confidentialite.md) · **Italiano**

bger reader è costruito in modo che la protezione dei dati non sia una questione di fiducia, ma di tecnica: l'estensione non ha alcuna possibilità di inviare dati, perché non stabilisce alcuna connessione. Questa pagina descrive cosa fa, cosa salva e come si può segnalare un problema di sicurezza.

## Cosa fa l'estensione

L'estensione viene avviata dal browser solo sui quattro indirizzi supportati (`search.bger.ch`, `relevancy.bger.ch` tramite https e http, `bvger.weblaw.ch`); su tutti gli altri siti web non è presente e non può vedervi nulla. Su una pagina di decisione inserisce il proprio pannello delle impostazioni, applica regole per carattere e colori sul testo della decisione e racchiude i riferimenti tra parentesi in piccoli involucri che si possono aprire e chiudere. Il testo della decisione viene solo spostato, mai modificato, accorciato o integrato; se la modalità di lettura viene disattivata, la pagina è di nuovo esattamente come il browser l'ha caricata.

Non legge ciò che viene digitato nei campi di ricerca, né cookie, né altre schede, e non conosce né l'identità né le ricerche di chi la usa. Non ha accesso a internet: non esiste alcuna connessione a un server del progetto, nessuna statistica, nessuna segnalazione di crash, nessuna verifica automatica degli aggiornamenti e nessun carattere scaricato in un secondo momento. Tutti i caratteri sono nel pacchetto. Questo vale anche su `bvger.weblaw.ch`, dove è il sito del tribunale stesso a caricare le decisioni tramite un programma: l'estensione attende soltanto che il testo compaia sulla pagina, ma non invia da sé alcuna richiesta.

## Quale autorizzazione richiede

All'installazione il browser chiede esattamente un'autorizzazione: **archiviazione** («storage»). Consente all'estensione di salvare le proprie impostazioni nella memoria locale per le estensioni del browser, affinché siano di nuovo presenti alla successiva apertura di una pagina di decisione. L'accesso ai quattro indirizzi dei tribunali non è un'autorizzazione concessa separatamente, ma deriva dal fatto che l'estensione funziona solo lì; il browser lo mostra nella panoramica dell'estensione come «Lettura e modifica dei tuoi dati su search.bger.ch». Altre autorizzazioni, per esempio per la cronologia del browser, le schede, i download o i siti web in generale, l'estensione non le richiede.

Per Firefox il pacchetto contiene inoltre la dichiarazione formale che non vengono raccolti dati («data collection permissions: none»); Firefox a partire dalla versione 140 valuta questa indicazione.

## Cosa viene salvato

Vengono salvate esclusivamente le impostazioni del pannello delle impostazioni: se la modalità di lettura è attivata, dimensione del carattere, tipo di carattere, spessore del carattere, interlinea, spaziatura dei paragrafi, delle lettere e delle parole, lunghezza delle righe, larghezza del testo, sillabazione, schema di colori, se le parentesi vengono compresse, allineamento e numero di colonne. Questi valori si trovano come un'unica voce di nome `bger-reader-einstellungen-v2` nella memoria locale dell'estensione. Non esiste alcuna cronologia, alcun elenco delle decisioni lette e alcuna nota. La memoria non viene sincronizzata con un account e non lascia il dispositivo; alla rimozione dell'estensione il browser la cancella insieme a essa.

La finestra separata delle impostazioni memorizza inoltre per breve tempo il proprio numero di finestra, affinché un secondo clic sull'icona porti in primo piano la finestra aperta invece di aprirne una seconda. Questo numero si trova nella memoria di sessione del browser e decade con la chiusura del browser.

## Codice sorgente e distribuzione

Il codice sorgente completo è pubblico su GitHub ed è scritto in JavaScript ordinario, senza strumenti che trasformino il codice prima della distribuzione. Il pacchetto scaricato corrisponde riga per riga a ciò che si trova nel repository. Il pacchetto della versione (release) nasce automaticamente dallo stato verificato del codice, dopo che i test sono stati eseguiti in browser reali, e accanto viene pubblicata una somma di controllo (checksum) con cui si può verificare l'integrità del file; come fare è descritto in [Installazione](IT-Installazione.md). L'estensione è un progetto indipendente e non è collegata né al Tribunale federale (TF) né al Tribunale amministrativo federale (TAF) né a Weblaw; i siti dei tribunali non sanno nulla di essa.

## Segnalare problemi di sicurezza

È supportata sempre e soltanto la versione più recente della pagina delle release; prima di una segnalazione si prega di aggiornare a questa. Chi trova un problema di sicurezza è pregato di non segnalarlo in un'Issue pubblica, ma in modo confidenziale: preferibilmente tramite il modulo di GitHub sotto **Security → Report a vulnerability** nel repository, in alternativa per e-mail all'indirizzo indicato nel file [SECURITY.md](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/SECURITY.md) (`bger.reader@gmail.com`). Poiché si tratta di un progetto di una sola persona, una risposta può richiedere alcuni giorni; i problemi confermati vengono risolti con la versione successiva.

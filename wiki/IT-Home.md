[Deutsch](DE-Startseite.md) · [English](EN-Home.md) · [Français](FR-Accueil.md) · **Italiano**

<!-- Non modificare qui nel wiki: la fonte è il file wiki/IT-Home.md nel repository e il workflow sovrascrive il wiki a ogni push. La pagina tedesca wiki/DE-Startseite.md è quella di riferimento: apportare prima lì le modifiche di contenuto, poi riportarle in questa traduzione. -->

**bger reader** è un'estensione gratuita per browser (extension) per Chrome, Brave, Edge e Firefox che rende più leggibili le decisioni del Tribunale federale svizzero (TF) e del Tribunale amministrativo federale (TAF). Modifica soltanto la visualizzazione nel proprio browser: tipo di carattere, dimensione del carattere, spaziature, lunghezza delle righe e schema di colori si possono regolare liberamente, e i riferimenti tra parentesi – per esempio `(BGE 135 II 45 E. 3.2 S. 47)`, la forma tedesca di una citazione DTF, in cui «E.» indica il considerando e «S.» la pagina – vengono compressi dietro una piccola freccia, in modo che il filo del ragionamento della decisione non venga continuamente interrotto. Il testo stesso rimane integralmente conservato; ogni parentesi può essere riaperta con un clic.

L'estensione funziona al 100 % offline. Non invia dati, non scarica nulla, non contiene pubblicità né funzioni statistiche. L'unica autorizzazione che richiede al browser è la memoria locale, in cui vengono salvate le proprie impostazioni. Maggiori informazioni in [Protezione dei dati e sicurezza](IT-Privacy.md).

bger reader è un progetto indipendente di una singola persona e non è collegato né al Tribunale federale né al Tribunale amministrativo federale né a Weblaw.

Questo wiki è disponibile in tedesco, inglese, francese e italiano; la barra delle lingue in cima a ogni pagina conduce alla stessa pagina nelle altre lingue. L'interfaccia dell'estensione stessa è in tedesco.

## A chi è destinata l'estensione

L'estensione si rivolge a tutte le persone che leggono le decisioni giudiziarie sullo schermo e hanno difficoltà con la visualizzazione standard dei siti dei tribunali: persone con una disabilità visiva (ipovisione) o con dislessia, che hanno bisogno di un carattere particolarmente leggibile come Atkinson Hyperlegible, Luciole o OpenDyslexic; persone che la sera preferiscono leggere su sfondo scuro; e in generale giuriste e giuristi, studenti e persone interessate che leggono lunghi considerandi e non vogliono farsi distrarre dalle numerose citazioni tra parentesi.

## Come funziona in breve

Dopo l'installazione, su ogni pagina di decisione supportata compare in alto a destra un pulsante rosa rotondo con il simbolo di un libro. Un clic su di esso apre un piccolo pannello delle impostazioni. Lì la modalità di lettura si attiva con la casella **einschalten** (attivare); dopodiché si possono regolare carattere, sfondo e larghezza del testo. In alternativa, un clic sull'icona dell'estensione nella barra degli strumenti del browser apre le stesse impostazioni in una finestra separata e più grande. Tutte le impostazioni vengono salvate automaticamente e valgono su tutte le pagine supportate finché non vengono modificate.

1. Installare l'estensione, vedi [Installazione](IT-Installazione.md).
2. Aprire una decisione su `search.bger.ch`, `relevancy.bger.ch` o `bvger.weblaw.ch`.
3. Fare clic in alto a destra sul pulsante rosa e spuntare **einschalten**.
4. Impostare tipo di carattere, dimensione e sfondo a piacere. Fatto.

<img width="957" height="790" alt="Vista di esempio con il pannello delle impostazioni aperto" src="https://github.com/user-attachments/assets/4ae7d44b-6423-4ff9-9613-93a000e02cbf" />

## Le pagine di questo wiki

- [Installazione](IT-Installazione.md) – Scaricare e configurare in Chrome, Brave, Edge e Firefox, verificare la somma di controllo, aggiornare, rimuovere.
- [Utilizzo](IT-Utilizzo.md) – Il pulsante rosa, il pannello delle impostazioni, la finestra separata, tastiera, stampa.
- [Impostazioni](IT-Impostazioni.md) – Ogni impostazione spiegata singolarmente, con intervallo e valore predefinito.
- [Comprimere le parentesi](IT-Parentesi.md) – Quali parentesi vengono compresse, quali restano aperte, e perché.
- [Tipi di carattere](IT-Caratteri.md) – I caratteri forniti con l'estensione, a cosa si adattano e con quale licenza sono distribuiti.
- [Siti web supportati](IT-Siti.md) – Su quali pagine funziona l'estensione e cosa c'è di particolare in ciascuna.
- [Protezione dei dati e sicurezza](IT-Privacy.md) – Cosa viene salvato, cosa no, e come segnalare un problema di sicurezza.
- [Domande frequenti](IT-FAQ.md) – Risposte alle domande tipiche e aiuto quando qualcosa non funziona.
- [Sviluppo](IT-Sviluppo.md) – Struttura del codice, test, versioni e release, per chi desidera collaborare o capire il codice.

## Versione attuale e cronologia

La versione attuale si trova sulla [pagina delle release](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases); ogni file porta il numero di versione nel nome, per esempio `bger-reader-0.9.1.zip`. Cosa è cambiato da una versione all'altra è descritto nella [cronologia delle modifiche](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/CHANGELOG.md). L'estensione è stata presentata agli store dei browser; non appena vi sarà approvata, l'installazione si ridurrà a un solo clic; fino ad allora funziona la via attraverso il pacchetto della versione (release), descritta in [Installazione](IT-Installazione.md).

## Segnalare errori e porre domande

Errori, desideri e domande vanno nelle [Issues](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) del progetto su GitHub. La segnalazione più utile contiene l'indirizzo della decisione interessata, il browser utilizzato con la sua versione e una breve descrizione di cosa ci si aspettava e cosa è successo invece. Per una parentesi compressa per errore o rimasta aperta a torto basta il testo della parentesi alla lettera. I problemi di sicurezza non vanno segnalati pubblicamente, ma come descritto in [Protezione dei dati e sicurezza](IT-Privacy.md).

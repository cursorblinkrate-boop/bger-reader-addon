[Deutsch](DE-FAQ.md) · [English](EN-FAQ.md) · [Français](FR-FAQ.md) · **Italiano**

Risposte alle domande frequenti e aiuto quando qualcosa non funziona come previsto. Se manca la risposta adatta, è utile un'[Issue](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) su GitHub; cosa dovrebbe contenere una segnalazione è indicato in fondo alla pagina.

## Il pulsante rosa non compare

Il pulsante compare solo sugli indirizzi supportati, vedi [Siti web supportati](IT-Siti.md). L'indirizzo nella barra degli indirizzi deve iniziare con `search.bger.ch`, `relevancy.bger.ch` o `bvger.weblaw.ch`. Se lì il pulsante non compare, l'estensione è forse disattivata: sulla pagina delle estensioni del browser (`chrome://extensions`, `brave://extensions`, `edge://extensions`, in Firefox `about:addons` oppure `about:debugging` per un componente aggiuntivo temporaneo) bger reader deve essere attivato. Dopo l'attivazione o la disattivazione dell'estensione e dopo un aggiornamento, la pagina della decisione va ricaricata una volta. In Chrome, Brave ed Edge l'estensione scompare inoltre se la cartella decompressa è stata spostata o cancellata; in tal caso occorre una nuova [Installazione](IT-Installazione.md).

## Ho spuntato «einschalten» (attivare), ma non succede nulla

L'estensione modifica solo i paragrafi del testo della decisione. Su un elenco di risultati di `search.bger.ch` o sulla pagina iniziale della banca dati delle decisioni agisce perciò solo lo schema di colori; tipo e dimensione del carattere sono visibili solo su una pagina di decisione. Se lo sfondo è impostato su «Weiss» (bianco) e il tipo di carattere su «System Serif», la differenza rispetto alla pagina originale è inoltre minima, perché questi sono i valori predefiniti: un altro sfondo o un carattere più grande rende subito visibile la modalità di lettura.

## Su bvger.weblaw.ch la modalità di lettura compare solo con ritardo

È normale. Il sito del Tribunale amministrativo federale (TAF) carica la decisione tramite un programma dopo l'apertura della pagina, e l'estensione la attende. Non appena il testo è presente, tipografia e parentesi seguono in un istante. Al passaggio a un'altra decisione all'interno del sito succede di nuovo la stessa cosa. Se la modalità di lettura resta permanentemente disattivata benché la decisione sia visualizzata, aiuta ricaricare la pagina; se ciò si ripete, merita una segnalazione di errore.

## Dopo l'aggiornamento le mie impostazioni sono sparite

In Chrome, Brave ed Edge il browser riconosce un'estensione non pacchettizzata dalla sua cartella. Se la nuova versione è stata decompressa in un'altra cartella e caricata da lì, è considerata una nuova estensione con memoria vuota. Rimedio: rimuovere la vecchia estensione, decomprimere la nuova versione nella cartella precedente e caricare questa, oppure reimpostare una volta le impostazioni. Con l'approvazione nello store questo problema scompare, perché lo store riconosce l'estensione dal suo identificativo fisso.

## In Firefox l'estensione è scomparsa dopo il riavvio

Firefox carica le estensioni non firmate solo come componente aggiuntivo temporaneo, che scompare con la chiusura del browser, e le impostazioni vanno di regola perse. È una caratteristica di Firefox, non un errore dell'estensione. Fino all'approvazione nello store, l'estensione deve essere ricaricata dopo ogni avvio tramite `about:debugging`; i passaggi sono descritti in [Installazione](IT-Installazione.md).

## Chrome avvisa all'avvio della presenza di estensioni in modalità sviluppatore

Chrome mostra questo messaggio per ogni estensione che non proviene dal Chrome Web Store. Non significa che qualcosa sia pericoloso, ma solo che l'estensione è stata caricata manualmente. Il messaggio si può chiudere e scompare non appena l'estensione viene installata dallo store.

## È stata compressa una parentesi che non è una citazione, oppure una citazione è rimasta aperta

Le regole sono descritte in [Comprimere le parentesi](IT-Parentesi.md), dove è indicato anche come segnalare un caso errato. Aiuta subito il pulsante di apertura `▸`, con cui ogni parentesi si può aprire singolarmente, oppure togliere la spunta da **einfach** (semplice), con cui tutte le parentesi restano aperte. Un caso segnalato viene inserito come caso di test.

## Il tipo di carattere scelto non sembra diverso

Alcuni caratteri si distinguono solo di poco, per esempio Liberation Serif da System Serif, perché entrambi sono simili a Times. Il menu a discesa mostra ogni carattere nella propria forma; su Firefox sotto macOS questo vale solo per lo stato chiuso dell'elenco. La differenza è più evidente con Atkinson Hyperlegible, OpenDyslexic e Comic Neue. Se il testo resta invariato nonostante la scelta di uno di questi caratteri, probabilmente la spunta **einschalten** non è stata messa, oppure non si tratta di una pagina di decisione.

## Con lo sfondo scuro una parte della pagina resta bianca

Campi di immissione, menu a discesa e pulsanti del sito del tribunale restano volutamente chiari, affinché siano riconoscibili e utilizzabili. Anche le evidenziazioni gialle dei risultati di ricerca mantengono il loro colore. Se invece resta bianca un'area più grande accanto o sotto la decisione, si tratta di un errore da segnalare, indicando l'indirizzo e il browser.

## L'estensione funziona offline?

L'estensione stessa non ha mai bisogno di una connessione a internet; non scarica nulla, nemmeno i caratteri. La pagina della decisione deve però essere caricata dal tribunale, e per questo, come per ogni sito web, è necessaria una connessione. Una pagina già caricata si può poi leggere con l'estensione anche senza connessione.

## L'estensione modifica la decisione o il sito web del tribunale?

No. L'estensione modifica solo la visualizzazione nel proprio browser, e solo finché la modalità di lettura è attivata. Il testo non viene né accorciato né integrato, e il sito web del tribunale non sa nulla dell'estensione. Dettagli in [Protezione dei dati e sicurezza](IT-Privacy.md).

## Posso stampare la decisione con le parentesi compresse?

Durante la stampa e il salvataggio come PDF tramite la finestra di dialogo di stampa, tutte le parentesi vengono riprodotte per intero e i pulsanti di apertura vengono omessi. Una stampa è quindi sempre completa. Tipo di carattere e schema di colori vengono stampati anch'essi; per il nero su bianco scegliere prima lo sfondo «Weiss».

## Per quali lingue è pensata l'estensione?

L'estensione funziona con decisioni in tedesco, francese e italiano; le regole per le parentesi conoscono i modi di citare di tutte e tre le lingue, e la sillabazione segue la lingua della decisione. L'interfaccia stessa è in tedesco.

## L'estensione esiste per smartphone o tablet?

Chrome, Brave ed Edge su smartphone non supportano le estensioni. Firefox su Android può installare estensioni dallo store; bger reader lì non è testato e sarà disponibile solo dopo l'approvazione nello store. Su tablet con un browser desktop l'estensione dovrebbe funzionare, ma anche lì non è testata.

## Posso usare l'estensione in Safari?

No. Safari richiede un programma confezionato appositamente e distribuito tramite Apple; questo non è previsto per questo progetto.

## Le mie impostazioni vengono sincronizzate tra dispositivi?

No. Le impostazioni si trovano esclusivamente nella memoria locale dell'estensione sul rispettivo dispositivo e non vengono sincronizzate con un account. Su un secondo dispositivo vanno impostate una volta di nuovo.

## Come scopro quale versione è installata?

Sulla pagina delle estensioni del browser il numero di versione è indicato accanto al nome «BGer Reader», in Chrome dopo un clic su «Dettagli». La versione pubblicata più recente si trova sulla [pagina delle release](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases), e la [cronologia delle modifiche](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/CHANGELOG.md) descrive cosa è cambiato da una versione all'altra.

## Come segnalo un errore o un desiderio?

Tramite le [Issues](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) del progetto su GitHub; per questo è necessario un account GitHub gratuito. Una buona segnalazione contiene l'indirizzo della decisione interessata, il browser con la sua versione, la versione dell'estensione, le impostazioni interessate e una descrizione di cosa ci si aspettava e cosa è successo invece. Uno screenshot aiuta spesso. I problemi di sicurezza non vanno segnalati pubblicamente, ma come descritto in [Protezione dei dati e sicurezza](IT-Privacy.md).

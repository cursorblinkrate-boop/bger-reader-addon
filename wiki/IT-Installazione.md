[Deutsch](DE-Installation.md) · [English](EN-Installation.md) · [Français](FR-Installation.md) · **Italiano**

<!-- Non modificare qui nel wiki: la fonte è il file wiki/IT-Installazione.md nel repository e il workflow sovrascrive il wiki a ogni push. La pagina tedesca wiki/DE-Installation.md è quella di riferimento: apportare prima lì le modifiche di contenuto, poi riportarle in questa traduzione. -->

Questa pagina descrive come scaricare bger reader e configurarlo nei singoli browser. La via attraverso il pacchetto della versione (release) è un po' più lunga di un clic nello store del browser, ma è ben praticabile; rimane la via standard finché l'estensione non sarà approvata negli store.

## Requisiti

L'estensione funziona in **Chrome, Brave ed Edge a partire dalla versione 121** e in **Firefox a partire dalla versione 140**. I browser più vecchi rifiutano l'installazione. La versione del proprio browser è indicata nel menu sotto «Informazioni su Chrome» o «Informazioni su Firefox»; i browser attuali superano da tempo queste versioni minime. I browser per smartphone non sono supportati, vedi [Domande frequenti](IT-FAQ.md).

## Scaricare il pacchetto

Tutte le versioni si trovano sulla [pagina delle release](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases) del progetto. La voce più in alto è la versione più recente. Sotto «Assets» si trovano due file: il pacchetto vero e proprio `bger-reader-<Version>.zip` (circa 250 KB) e, accanto, un piccolo file con il suffisso `.sha256`, che contiene una somma di controllo (checksum; maggiori dettagli più sotto). Il pacchetto contiene esclusivamente l'estensione stessa, senza file di test e senza strumenti.

Usare sempre lo ZIP della pagina delle release e non il pulsante verde «Code → Download ZIP» sulla pagina iniziale del repository. Quest'ultimo scarica l'intero progetto con test e strumenti, e il file ha sempre lo stesso nome, per cui la versione non è riconoscibile.

Dopo il download, lo ZIP va decompresso. Su Windows basta un clic destro sul file e «Estrai tutto…», su macOS un doppio clic. Si ottiene una cartella che contiene, tra l'altro, il file `manifest.json` e le sottocartelle `fonts` e `icons`. Questa cartella dovrebbe trovarsi in un luogo in cui possa rimanere in modo permanente, per esempio nella cartella Documenti, perché Chrome, Brave ed Edge leggono l'estensione direttamente da questa cartella a ogni avvio. Se viene spostata o cancellata, l'estensione scompare.

## Chrome, Brave ed Edge

I tre browser condividono la stessa tecnologia e si distinguono solo per l'indirizzo della pagina delle estensioni.

1. Aprire la pagina delle estensioni: digitare nella barra degli indirizzi `chrome://extensions` in Chrome, `brave://extensions` in Brave, `edge://extensions` in Edge e premere Invio.
2. Attivare la **Modalità sviluppatore**. In Chrome e Brave è un interruttore in alto a destra, in Edge un interruttore nella colonna di sinistra.
3. Fare clic su **Carica estensione non pacchettizzata**.
4. Selezionare la cartella decompressa, cioè la cartella in cui si trova il file `manifest.json`, e confermare.
5. bger reader compare ora nell'elenco delle estensioni ed è attivato.

Dopo un riavvio, Chrome mostra talvolta un avviso che segnala che alcune estensioni sono in esecuzione in modalità sviluppatore. Succede con tutte le estensioni che non provengono dallo store, e l'avviso si chiude con un clic. Affinché l'icona dell'estensione resti sempre visibile nella barra degli strumenti, si fa clic sull'icona a forma di puzzle a destra della barra degli indirizzi e poi sulla puntina accanto a «BGer Reader»; in seguito un clic sull'icona apre le impostazioni in una finestra separata.

## Firefox

Firefox installa le estensioni in modo permanente solo se sono firmate da Mozilla, cosa che avviene con l'approvazione nello store. Fino ad allora bger reader può essere caricato in Firefox come **componente aggiuntivo temporaneo**. Funziona completamente, ma solo fino alla successiva chiusura del browser; dopo, l'estensione deve essere caricata di nuovo, e le impostazioni salvate vanno di regola perse.

1. Digitare nella barra degli indirizzi `about:debugging#/runtime/this-firefox` e premere Invio.
2. Fare clic su **Carica componente aggiuntivo temporaneo…**.
3. Selezionare il file scaricato `bger-reader-<Version>.zip`. Con Firefox non è necessario decomprimere; in alternativa si può scegliere anche il file `manifest.json` dalla cartella decompressa.
4. bger reader compare nell'elenco delle estensioni temporanee.

Chi usa la Developer Edition o Nightly di Firefox può disattivare l'obbligo di firma in `about:config` impostando `xpinstall.signatures.required` su `false` e installare poi lo ZIP in modo permanente tramite `about:addons` e «Installa componente aggiuntivo da file…». Con la versione normale di Firefox questo non è possibile. Non appena l'estensione sarà approvata nello store, qui verrà aggiunto il link diretto.

## Verificare la somma di controllo (facoltativo)

Accanto a ogni pacchetto, sulla pagina delle release si trova un file `bger-reader-<Version>.zip.sha256`. Contiene una lunga sequenza di caratteri, la cosiddetta somma di controllo SHA-256. Questa sequenza è univoca per il file come un'impronta digitale: chi calcola da sé la somma di controllo del pacchetto scaricato e la confronta con quella pubblicata sa con certezza, in caso di corrispondenza, che il file è arrivato integro e completo. Il pacchetto viene costruito nella distribuzione automatica del progetto direttamente dal codice sorgente verificato, e anche la somma di controllo viene generata lì.

Il calcolo si effettua in un terminale o in PowerShell, nella cartella in cui si trova lo ZIP:

```
# macOS
shasum -a 256 bger-reader-0.9.1.zip

# Linux
sha256sum bger-reader-0.9.1.zip

# Windows (PowerShell)
Get-FileHash .\bger-reader-0.9.1.zip -Algorithm SHA256
```

La sequenza visualizzata deve corrispondere al contenuto del file `.sha256`; maiuscole e minuscole non hanno importanza. Questo passaggio è facoltativo e non è necessario per il funzionamento.

## Aggiornare

Una nuova versione viene pubblicata sulla pagina delle release; il browser non la segnala da solo finché l'estensione non proviene dallo store. Per l'aggiornamento in Chrome, Brave ed Edge si scarica il nuovo ZIP e lo si decomprime **nella stessa cartella** di prima, in modo che i vecchi file vengano sostituiti. Poi basta, sulla pagina delle estensioni, un clic sul simbolo di ricarica (freccia circolare) accanto a bger reader oppure in alto su «Aggiorna». È importante che la cartella sia la stessa: il browser riconosce un'estensione non pacchettizzata dalla sua posizione. Se la nuova versione viene caricata da un'altra cartella, è considerata una nuova estensione, e le impostazioni salvate ripartono dai valori predefiniti.

In Firefox il componente aggiuntivo temporaneo viene comunque ricaricato a ogni avvio; lì basta scegliere il nuovo ZIP.

## Rimuovere

In Chrome, Brave ed Edge l'estensione si elimina sulla pagina delle estensioni con «Rimuovi»; dopo si può cancellare anche la cartella decompressa. Con l'estensione vengono rimosse anche le impostazioni salvate. In Firefox un componente aggiuntivo temporaneo scompare con la chiusura del browser o tramite «Rimuovi» sulla pagina `about:debugging`.

I siti dei tribunali non vengono modificati dall'installazione né dalla rimozione; l'estensione agisce esclusivamente sulla visualizzazione nel proprio browser.

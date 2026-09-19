[Deutsch](DE-Bedienung.md) · [English](EN-Usage.md) · [Français](FR-Utilisation.md) · **Italiano**

<!-- Non modificare qui nel wiki: la fonte è il file wiki/IT-Utilizzo.md nel repository e il workflow sovrascrive il wiki a ogni push. La pagina tedesca wiki/DE-Bedienung.md è quella di riferimento: apportare prima lì le modifiche di contenuto, poi riportarle in questa traduzione. -->

bger reader si può usare in due punti: direttamente sulla pagina della decisione, tramite un piccolo pannello delle impostazioni che si apre con il pulsante rosa, oppure in una finestra separata, che si apre tramite l'icona dell'estensione nella barra degli strumenti. Entrambi mostrano le stesse impostazioni, accedono alla stessa memoria e restano sincronizzati tra loro: ciò che si modifica nella finestra agisce subito sulla pagina, e viceversa.

## Il pulsante rosa e il pannello delle impostazioni

Su ogni pagina di decisione supportata compare in alto a destra un pulsante rosa rotondo con il simbolo bianco di un libro. Sta sopra la pagina e non scorre con essa, quindi è sempre raggiungibile. Un clic su di esso apre nello stesso punto il pannello delle impostazioni, un piccolo riquadro bianco con l'intestazione «bger reader». Il pulsante rosa scompare finché il pannello è aperto e ricompare non appena viene chiuso. Il pannello si chiude con il pulsante X rosa in alto a destra nel pannello o con il tasto **Esc**.

Il pannello è volutamente essenziale. Nella parte superiore si trovano le impostazioni usate più spesso: **einschalten** (attivare), **Schriftgrösse** (dimensione del carattere), **Schriftart** (tipo di carattere), **Hintergrund** (sfondo), **Textbreite** (larghezza del testo) e **einfach** (semplice). Un clic su **erweitert** (avanzate) espande sotto di esse le altre impostazioni: Schriftstärke (spessore del carattere), Zeilenabstand (interlinea), Absatzabstand (spaziatura dei paragrafi), Buchstabenabstand (spaziatura delle lettere), Wortabstand (spaziatura delle parole), Zeilenlänge (lunghezza delle righe), Silbentrennung (sillabazione), Ausrichtung (allineamento), Spalten (colonne) e il pulsante **Zurücksetzen** (ripristina). Cosa fa in dettaglio ciascuna di queste impostazioni è descritto nella pagina [Impostazioni](IT-Impostazioni.md).

Finché **einschalten** non è spuntato, l'estensione non modifica nulla nella pagina; si limita ad attendere. Con la spunta la modalità di lettura diventa attiva, e tutte le altre impostazioni agiscono immediatamente. Togliere di nuovo la spunta ripristina completamente la visualizzazione originale della pagina; anche le parentesi compresse vengono allora nuovamente espanse.

I cursori mostrano alla loro destra il valore attuale, per esempio `18` per la dimensione del carattere o `1.6` per l'interlinea. I menu a discesa per il tipo di carattere e lo sfondo mostrano un'anteprima: ogni tipo di carattere compare nell'elenco nel proprio carattere, ogni sfondo nei propri colori, e anche l'elenco chiuso mostra la voce selezionata allo stesso modo. Firefox su macOS disegna da sé l'elenco aperto e vi mostra l'anteprima solo nello stato chiuso.

Chi si sofferma con il mouse per più di tre secondi su un elemento di comando vede comparire un breve suggerimento (tooltip). Il ritardo è voluto, affinché i suggerimenti non disturbino durante le regolazioni rapide. Sul pulsante Zurücksetzen il suggerimento elenca tutti i valori predefiniti.

## La finestra delle impostazioni tramite l'icona nella barra degli strumenti

Un clic sull'icona dell'estensione nella barra degli strumenti del browser (il libro rosa) apre le stesse impostazioni in una finestra separata, che compare al centro della finestra del browser. È più grande del pannello sulla pagina e quindi più comoda quando c'è molto da regolare o quando lo schermo è grande. Un secondo clic sull'icona non apre una seconda finestra, ma porta in primo piano quella già aperta. La finestra si chiude con il pulsante X o con Esc.

La finestra è utile anche quando non è aperta alcuna decisione: le impostazioni fatte lì vengono salvate e agiscono non appena viene caricata di nuovo una pagina di decisione. Se contemporaneamente è aperta una pagina di decisione, ogni modifica nella finestra agisce subito sulla pagina, e il pannello sulla pagina mostra il nuovo stato.

In Chrome, Brave ed Edge l'icona dell'estensione è inizialmente nascosta dietro l'icona a forma di puzzle a destra della barra degli indirizzi; con la puntina che si trova lì si può fissare in modo permanente.

## Leggere le parentesi compresse

Se **einfach** è spuntato, che è l'impostazione predefinita, i riferimenti tra parentesi vengono compressi. Al loro posto rimane visibile un piccolo pulsante con il segno `▸`. Un clic su di esso mostra il contenuto della parentesi sul posto, e il pulsante diventa `▾`; un ulteriore clic comprime di nuovo la parentesi. Ogni parentesi può essere aperta e chiusa singolarmente, e le parentesi aperte una volta restano aperte anche se in seguito si modificano carattere o colori. Solo disattivare e riattivare la modalità di lettura o le parentesi riporta tutte le parentesi allo stato compresso. Quali parentesi vengono compresse è spiegato nella pagina [Comprimere le parentesi](IT-Parentesi.md).

Chi non desidera affatto le parentesi compresse toglie la spunta da **einfach**; tutte le altre impostazioni non ne sono toccate.

## Salvataggio e validità delle impostazioni

Non c'è un pulsante di salvataggio. Ogni modifica viene subito registrata nella memoria locale dell'estensione ed è di nuovo presente alla successiva apertura di una pagina di decisione, anche dopo un riavvio del browser. Le impostazioni valgono congiuntamente per tutti i siti web supportati; chi su `search.bger.ch` sceglie Sepia (seppia) e una Schriftgrösse di 20 vede su `bvger.weblaw.ch` la stessa visualizzazione. Il pulsante **Zurücksetzen** sotto «erweitert» riporta tutti i valori al valore predefinito e disattiva la modalità di lettura.

## Uso con la tastiera

Tutti gli elementi di comando sono raggiungibili con la tastiera. All'apertura del pannello delle impostazioni il focus passa al pulsante di chiusura; da lì il tasto **Tab** conduce attraverso tutti gli elementi, la **barra spaziatrice** attiva e disattiva le caselle, i **tasti freccia** regolano cursori e menu a discesa, ed **Esc** chiude il pannello e riporta il focus sul pulsante rosa. Anche con l'uso della tastiera i suggerimenti compaiono dopo tre secondi sull'elemento che ha il focus. I pulsanti di apertura delle parentesi sono veri pulsanti e si possono azionare con Invio o con la barra spaziatrice; i lettori di schermo (screen reader) apprendono attraverso di essi se la parentesi è al momento aperta o chiusa.

## Stampa

Durante la stampa o il salvataggio come PDF tramite la finestra di dialogo di stampa del browser, tutte le parentesi vengono riprodotte per intero e i pulsanti di apertura vengono omessi. Una decisione stampata è quindi sempre completa, indipendentemente da quali parentesi erano compresse sullo schermo in quel momento. Le altre impostazioni come il tipo di carattere e lo schema di colori vengono stampate anch'esse; chi su carta preferisce il nero su bianco sceglie brevemente, prima di stampare, lo sfondo «Weiss» (bianco).

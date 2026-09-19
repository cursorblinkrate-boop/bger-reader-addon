[Deutsch](DE-Einstellungen.md) · [English](EN-Settings.md) · [Français](FR-Reglages.md) · **Italiano**

Questa pagina spiega singolarmente ogni impostazione di bger reader. Le impostazioni si trovano nel pannello delle impostazioni sulla pagina e nella finestra separata nello stesso ordine; le prime sei sono subito visibili, le altre compaiono dopo un clic su **erweitert** (avanzate). Come si aprono i due punti di comando è descritto in [Utilizzo](IT-Utilizzo.md).

## Panoramica

| Impostazione | Sezione | Valori possibili | Predefinito |
|---|---|---|---|
| einschalten (attivare) | principale | disattivato / attivato | disattivato |
| Schriftgrösse (dimensione del carattere) | principale | da 6 a 50 | 18 |
| Schriftart (tipo di carattere) | principale | 9 caratteri, vedi [Tipi di carattere](IT-Caratteri.md) | System Serif |
| Hintergrund (sfondo) | principale | Weiss (bianco), Sepia (seppia), Dunkel (scuro), Hoher Kontrast (contrasto elevato), Nacht (rötlich) (notte, rossastro) | Weiss |
| Textbreite (larghezza del testo) | principale | da 400 a 1400 pixel, a passi di 25 | 625 |
| einfach (semplice; parentesi) | principale | disattivato / attivato | attivato |
| Schriftstärke (spessore del carattere) | erweitert | normal (normale) / fett (grassetto) | normal |
| Zeilenabstand (interlinea) | erweitert | da 1.0 a 2.5 | 1.6 |
| Absatzabstand (spaziatura dei paragrafi) | erweitert | aus (disattivato), da 0.25 a 3 | aus |
| Buchstabenabstand (spaziatura delle lettere) | erweitert | da 0 a 4 pixel | 0 |
| Wortabstand (spaziatura delle parole) | erweitert | da 0 a 10 pixel | 0 |
| Zeilenlänge (lunghezza delle righe) | erweitert | aus (disattivato), da 10 a 120 caratteri | aus |
| Silbentrennung (sillabazione) | erweitert | disattivato / attivato | disattivato |
| Ausrichtung (allineamento) | erweitert | links (a sinistra), mittig (centrato), rechts (a destra), Blocksatz (giustificato) | links |
| Spalten (colonne) | erweitert | 1, 2 o 3 | 1 |

Tutte le impostazioni agiscono solo finché **einschalten** è spuntato, e agiscono esclusivamente sui paragrafi del testo della decisione insieme alla cornice della pagina. Menu, campi di ricerca e pulsanti del sito del tribunale restano invariati e utilizzabili. Chi lascia un'impostazione al suo valore predefinito ottiene in quel punto esattamente la visualizzazione della pagina originale; l'estensione interviene solo dove qualcosa è stato modificato.

## einschalten (attivare)

L'interruttore principale. Senza spunta l'estensione si limita ad attendere; mostra il pulsante rosa, ma non modifica nulla. Con la spunta la modalità di lettura diventa attiva: carattere e colori vengono applicati e, se **einfach** è spuntato, i riferimenti tra parentesi vengono compressi. Togliere la spunta ripristina completamente la pagina originale.

## Schriftgrösse (dimensione del carattere)

La dimensione del carattere nel testo della decisione in pixel, da 6 a 50. Il valore predefinito 18 è un po' più grande di quello dei siti dei tribunali. Il cursore agisce subito durante il trascinamento, così la dimensione adatta si trova guardando il testo. Per letture lunghe si è dimostrato valido un valore tra 18 e 22; chi lavora con un software di ingrandimento può arrivare fino a 50 senza che il layout della pagina si rompa.

## Schriftart (tipo di carattere)

Il carattere in cui viene composto il testo della decisione. Si può scegliere tra due caratteri per persone con disabilità visiva (ipovisione) (Atkinson Hyperlegible, Luciole), uno per persone con dislessia (OpenDyslexic), uno dall'aspetto amichevole simile alla scrittura a mano (Comic Neue), un classico carattere da libro (EB Garamond), due caratteri standard neutri (Liberation Sans, Liberation Serif) e i caratteri di sistema del proprio dispositivo (System Sans, System Serif). L'elenco mostra ogni carattere nella propria forma, così la differenza si può valutare prima della scelta. Tutti i caratteri, tranne i due di sistema, sono inclusi nell'estensione e non vengono scaricati da internet. Dettagli e licenze in [Tipi di carattere](IT-Caratteri.md).

## Hintergrund (sfondo)

Lo schema di colori per sfondo, testo e link. **Weiss** (bianco) corrisponde alla pagina originale con testo nero. **Sepia** (seppia) mette uno sfondo caldo, leggermente giallastro, sotto un testo marrone scuro, che molti trovano più piacevole per gli occhi. **Dunkel** (scuro) è una modalità notturna con testo grigio chiaro su sfondo quasi nero. **Hoher Kontrast** (contrasto elevato) mette bianco puro su nero puro con link gialli ed è pensato per una vista fortemente ridotta. **Nacht (rötlich)** (notte, rossastro) usa uno sfondo scuro rossastro con testo chiaro dalla leggera tonalità rosata e poca componente blu, che la sera tiene meno svegli. Lo schema colora l'intera pagina, quindi anche intestazione, navigazione e colonne laterali, affinché non rimanga una cornice bianca abbagliante attorno al testo scuro. Le evidenziazioni gialle dei risultati di ricerca del sito del tribunale mantengono in tutti gli schemi il testo scuro e restano leggibili.

## Textbreite (larghezza del testo)

La larghezza della cornice in cui sta il testo della decisione, in pixel. Su `search.bger.ch` e `relevancy.bger.ch` questa cornice è fissata dalla pagina a 625 pixel, il che su schermi grandi appare stretto. Il cursore consente valori da 400 a 1400 pixel; le colonne laterali della pagina si spostano di conseguenza. Su `bvger.weblaw.ch` il cursore agisce sulla colonna in cui si trova la decisione. Con il valore predefinito 625 la pagina resta invariata.

## einfach (semplice; comprimere le parentesi)

Con questa spunta i riferimenti tra parentesi vengono compressi, cioè le citazioni della giurisprudenza (DTF, sentenze con numero di incarto) e le citazioni dottrinali. I rinvii a disposizioni di legge come `(Art. 8 Abs. 1 BV)`, importi, date, rinvii ai considerandi della stessa decisione e osservazioni di contenuto restano aperti, perché fanno parte del ragionamento. La denominazione «einfach» indica l'insieme fisso di regole, che non richiede ulteriori impostazioni. Ogni parentesi compressa si può aprire singolarmente con la freccia `▸`. Le regole in dettaglio: [Comprimere le parentesi](IT-Parentesi.md).

## Schriftstärke (spessore del carattere)

normal (normale) o fett (grassetto). Il grassetto può migliorare la leggibilità con caratteri sottili o su sfondo scuro. Tutti i caratteri forniti contengono una vera variante in grassetto, quindi non vengono ingrossati artificialmente.

## Zeilenabstand (interlinea)

La distanza tra le righe come multiplo della dimensione del carattere, da 1.0 (stretta) a 2.5 (molto ampia). Il valore predefinito 1.6 è più generoso della pagina originale. Un'interlinea maggiore aiuta a non perdere la riga al passaggio da una riga all'altra, il che conta soprattutto in caso di dislessia e con caratteri piccoli.

## Absatzabstand (spaziatura dei paragrafi)

Spazio vuoto aggiuntivo dopo ogni paragrafo, come multiplo della dimensione del carattere da 0.25 a 3. Con «aus» (disattivato) resta la spaziatura dei paragrafi della pagina originale. Un valore intorno a 0.75–1 rende riconoscibile a colpo d'occhio la suddivisione di una decisione in considerandi e sottoparagrafi.

## Buchstabenabstand (spaziatura delle lettere)

Distanza aggiuntiva tra le singole lettere in pixel, da 0 a 4 a passi di un decimo. Un valore leggermente aumentato (circa 0.5–1) evita che le lettere si confondano tra loro; in caso di dislessia e di disabilità visiva questo viene spesso percepito come un sollievo. Valori elevati rendono il testo troppo spaziato e tendenzialmente meno leggibile.

## Wortabstand (spaziatura delle parole)

Distanza aggiuntiva tra le parole in pixel, da 0 a 10. Una spaziatura delle parole maggiore rende più chiari i confini tra le parole. Insieme a una spaziatura delle lettere aumentata, la spaziatura delle parole dovrebbe crescere di pari passo, affinché gli spazi tra le parole e quelli tra le lettere restino distinguibili.

## Zeilenlänge (lunghezza delle righe)

Limita la lunghezza di una riga a un numero di caratteri, da 10 a 120 a passi di dieci; «aus» (disattivato) lascia le righe lunghe quanto è larga la cornice del testo. Righe molto lunghe rendono difficile ritrovare l'inizio della riga; dal punto di vista tipografico, da 60 a 80 caratteri sono considerati piacevoli. Se la lunghezza delle righe è impostata, il testo viene centrato all'interno della cornice. Questa impostazione è indipendente dalla larghezza del testo: la larghezza del testo definisce la cornice, la lunghezza delle righe il testo al suo interno.

## Silbentrennung (sillabazione)

Attiva la sillabazione automatica del browser. Divide le parole a fine riga secondo le regole della lingua della decisione; su `bvger.weblaw.ch` l'estensione riconosce la lingua dal rubrum (intestazione della decisione), perché il sito stesso non fornisce un'indicazione adeguata. La sillabazione conviene soprattutto con colonne strette, con caratteri grandi e con il testo giustificato, perché rende più uniformi gli spazi tra le parole. Se e quanto bene le parole vengano divise dipende dal browser e dal suo supporto linguistico.

## Ausrichtung (allineamento)

links (a sinistra; predefinito e impostazione dei siti dei tribunali), mittig (centrato), rechts (a destra) o Blocksatz (giustificato). Il testo giustificato senza sillabazione produce grandi spazi vuoti con colonne strette; le due impostazioni vanno quindi insieme. Centrato e a destra sono pensati per esigenze particolari, per esempio per un software con lente di ingrandimento che ingrandisce una determinata zona dello schermo.

## Spalten (colonne)

Dispone il testo della decisione in 1, 2 o 3 colonne affiancate, come in un giornale. I paragrafi possono passare da una colonna all'altra, perché i considerandi sono spesso lunghi. Due colonne hanno senso su schermi larghi insieme a una larghezza del testo elevata; su schermi stretti le colonne diventano presto troppo strette. Con una colonna la pagina resta invariata.

## Zurücksetzen (ripristina)

Riporta tutte le impostazioni ai valori predefiniti della tabella qui sopra e disattiva la modalità di lettura. Il suggerimento (tooltip) del pulsante elenca i valori predefiniti. Non esiste un annulla; i vecchi valori vanno reimpostati manualmente se necessario.

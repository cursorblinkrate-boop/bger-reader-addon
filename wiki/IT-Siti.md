[Deutsch](DE-Websites.md) · [English](EN-Websites.md) · [Français](FR-Sites.md) · **Italiano**

bger reader funziona sulle pagine delle decisioni del Tribunale federale svizzero (TF) e del Tribunale amministrativo federale (TAF). Il browser avvia l'estensione solo sugli indirizzi qui elencati; su tutti gli altri siti web non è presente. Le impostazioni valgono congiuntamente per tutte le pagine supportate.

| Indirizzo | Tribunale | Cosa vi si trova |
|---|---|---|
| `https://search.bger.ch/*` | Tribunale federale | decisioni di principio pubblicate nella raccolta ufficiale (DTF) e tutte le altre sentenze dall'anno 2000 |
| `https://relevancy.bger.ch/*` e `http://relevancy.bger.ch/*` | Tribunale federale | secondo accesso alle stesse decisioni, con e senza cifratura |
| `https://bvger.weblaw.ch/*` | Tribunale amministrativo federale | banca dati delle decisioni del Tribunale amministrativo federale, gestita da Weblaw |

## search.bger.ch e relevancy.bger.ch

Le decisioni del Tribunale federale sono disponibili in due viste. La raccolta ufficiale (DTF) è presentata nella vista «clir», in cui ogni paragrafo della decisione è un blocco di testo a sé e i cambi di pagina della raccolta stampata sono contrassegnati nel testo da barre come «BGE 152 IV 1 S. 7». Le altre sentenze dal 2000 compaiono nella vista «aza», con una struttura dei paragrafi un po' diversa. L'estensione conosce entrambe e le tratta allo stesso modo: tipografia e colori agiscono sui paragrafi della decisione, le barre di cambio pagina restano visibili anche con le parentesi compresse, e le evidenziazioni gialle dei risultati di ricerca mantengono il testo scuro.

Lo schema di colori agisce sull'intera pagina, quindi anche sull'intestazione, sulla navigazione a sinistra e sulle colonne laterali con indice e riferimenti, affinché con gli schemi scuri non rimanga una cornice bianca. La larghezza del testo modifica la cornice, che la pagina fissa per impostazione predefinita a 625 pixel; le colonne laterali si spostano di conseguenza. Sulle pagine di ricerca di `search.bger.ch`, cioè dove compaiono elenchi di risultati invece di una decisione, agisce solo lo schema di colori; le impostazioni tipografiche intervengono solo sulla pagina della decisione.

`relevancy.bger.ch` è un secondo accesso alle stesse decisioni, in parte ancora collegato senza cifratura (http); l'estensione supporta entrambe le varianti.

## bvger.weblaw.ch

Le decisioni del Tribunale amministrativo federale si trovano su un sito web costruito in modo diverso da quello del Tribunale federale: è una cosiddetta web app. La pagina arriva al browser inizialmente vuota, e solo dopo la decisione viene caricata e inserita dal sito tramite un programma. Al passaggio a un'altra decisione o all'attivazione e disattivazione delle evidenziazioni offerte dal sito, il testo viene sostituito senza che la pagina venga ricaricata.

L'estensione attende perciò il testo e ricostruisce tipografia e parentesi ogni volta che la decisione sulla pagina cambia. Un breve istante tra la comparsa della decisione e la modalità di lettura è normale. L'estensione non invia da sé alcuna richiesta al sito; osserva soltanto ciò che compare sulla pagina.

Alcune particolarità del sito vengono prese in considerazione. Il sito dichiara come propria lingua l'inglese, il che danneggerebbe la sillabazione; l'estensione riconosce la lingua della decisione dal rubrum (intestazione della decisione: «Urteil vom», «Arrêt du», «Sentenza del») e sillaba di conseguenza. Le evidenziazioni colorate del sito per le decisioni citate e le parole chiave mantengono il testo scuro, e le loro etichette non contano come testo della parentesi. Lo schema di colori agisce sull'area della decisione con titolo e data e sulla barra laterale con i filtri, e la larghezza del testo modifica la colonna in cui si trova la decisione. Le citazioni nel formato del Tribunale amministrativo federale come `BVGE 2014/1` o `ATAF 2007/6` vengono riconosciute come giurisprudenza e compresse.

## Cosa non è supportato

L'estensione agisce solo sulle pagine delle decisioni nel browser. Non sono supportate le versioni PDF delle decisioni, le pagine di notizie e informazioni su `www.bger.ch`, le raccolte di decisioni dei tribunali cantonali, altre banche dati come entscheidsuche.ch o Swisslex e gli altri prodotti di Weblaw. I browser per smartphone non sono supportati, vedi [Domande frequenti](IT-FAQ.md). Le richieste per ulteriori siti possono essere presentate come [Issue](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues); ogni nuovo sito richiede un proprio profilo di sito nel codice e pagine di prova (fixture) su cui poterlo verificare.

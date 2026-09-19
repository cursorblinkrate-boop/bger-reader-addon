[Deutsch](DE-Schriftarten.md) · [English](EN-Fonts.md) · [Français](FR-Polices.md) · **Italiano**

<!-- Non modificare qui nel wiki: la fonte è il file wiki/IT-Caratteri.md nel repository e il workflow sovrascrive il wiki a ogni push. La pagina tedesca wiki/DE-Schriftarten.md è quella di riferimento: apportare prima lì le modifiche di contenuto, poi riportarle in questa traduzione. -->

bger reader include sette tipi di carattere, forniti insieme all'estensione e mai scaricati da internet, oltre a due voci per i caratteri del proprio sistema. Tutti i caratteri forniti sono caratteri liberi con licenze aperte; possono essere distribuiti insieme all'estensione, e i testi delle licenze sono inclusi nel pacchetto. La scelta avviene nel pannello delle impostazioni sotto **Schriftart** (tipo di carattere); l'elenco mostra ogni voce nel proprio carattere.

## I caratteri in sintesi

| Voce nel menu | Origine | A cosa si adatta | Licenza |
|---|---|---|---|
| Atkinson Hyperlegible | Braille Institute of America | disabilità visiva (ipovisione); lettere e cifre facilmente confondibili (I, l, 1, O, 0) hanno forme nettamente diverse | SIL Open Font License 1.1 |
| Luciole | Centre Technique Régional pour la Déficience Visuelle (Francia), disegnato da Laurent Bourcellier e Jonathan Perez | disabilità visiva; sviluppato appositamente per persone ipovedenti, con ampi spazi interni delle lettere | Creative Commons BY 4.0 |
| OpenDyslexic | Abbie Gonzalez | dislessia; le lettere sono più pesanti nella parte inferiore, il che dovrebbe rendere più difficile capovolgerle e scambiarle | SIL Open Font License 1.1 |
| Comic Neue | Craig Rozynski | aspetto amichevole, vicino alla scrittura a mano; preferito da alcune persone con dislessia perché ogni forma è inconfondibile | SIL Open Font License 1.1 |
| EB Garamond | Georg Duffner, proseguito da Octavio Pardo | classico carattere da libro per letture lunghe su sfondo chiaro | SIL Open Font License 1.1 |
| Liberation Sans (Arial-ähnlich) (simile ad Arial) | Red Hat | carattere neutro senza grazie, della stessa larghezza di Arial | SIL Open Font License 1.1 |
| Liberation Serif (Times-ähnlich) (simile a Times) | Red Hat | carattere neutro con grazie, della stessa larghezza di Times New Roman | SIL Open Font License 1.1 |
| System Sans | carattere del proprio dispositivo (Verdana, Arial o Helvetica) | per chi preferisce il carattere di sistema abituale | – |
| System Serif | carattere del proprio dispositivo (Georgia o Times New Roman) | valore predefinito; corrisponde all'aspetto dei siti dei tribunali | – |

## Quale carattere per chi

In caso di disabilità visiva vale la pena provare uno dopo l'altro Atkinson Hyperlegible e Luciole, ciascuno con un carattere un po' più grande e un'interlinea di 1.6 o più. Entrambi sono stati progettati appositamente perché i segni simili si possano distinguere anche in caso di sfocatura o di contrasto ridotto. Quale dei due sia più gradevole lo mostra al meglio il confronto diretto sul proprio schermo.

In caso di dislessia OpenDyslexic è la scelta più conosciuta; se aiuti davvero varia da persona a persona, perciò con Comic Neue è disponibile un secondo carattere con forme delle lettere chiaramente distinguibili. Spesso una maggiore spaziatura delle lettere e delle parole e un'interlinea più ampia aiutano più del solo cambio di carattere; queste impostazioni si trovano sotto **erweitert** (avanzate).

Chi vuole semplicemente leggere a lungo e in modo rilassato è ben servito da EB Garamond sullo sfondo «Sepia» (seppia). Liberation Sans e Liberation Serif sono le alternative neutre per chi desidera un carattere da ufficio familiare, ma indipendentemente da ciò che è installato sul dispositivo.

## Note tecniche

I caratteri si trovano nel pacchetto come file WOFF2, ciascuno nelle varianti «normal» (normale) e «fett» (grassetto). Contengono il set di caratteri latini, comprese le dieresi e gli accenti delle lingue nazionali svizzere, i segni speciali giuridici come § e ¶, le virgolette e i trattini tipografici nonché il simbolo dell'euro. I segni che un carattere non contiene (per Comic Neue, per esempio, i segni di rinvio † e ‡) vengono sostituiti dal browser con quelli di un carattere di sistema.

Due famiglie portano nel pacchetto nomi diversi da quelli del menu: OpenDyslexic internamente è «Dyslexie-Leseschrift», Liberation Sans e Serif sono «BGEReader Sans» e «BGEReader Serif». Il motivo è una condizione della Open Font License: chi modifica un carattere, e la riduzione al set di caratteri latini è una tale modifica, non può continuare a usare il nome originale protetto. L'aspetto non cambia.

Le indicazioni complete sulle licenze, con fonti e numeri di versione, si trovano nel file [extension/fonts/LICENSES.md](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/extension/fonts/LICENSES.md), il testo della Open Font License in `extension/fonts/OFL.txt`. I caratteri vengono generati con uno script a partire dai file originali (`tools/subset-fonts.py`), affinché il procedimento resti tracciabile e ripetibile; maggiori informazioni in [Sviluppo](IT-Sviluppo.md).

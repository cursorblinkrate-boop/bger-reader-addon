# Übersetzungen der Bedienoberfläche

Alle Texte des Panels, des mittigen Dialogs und des Einstellungsfensters in
den vier Sprachen, erzeugt aus `extension/sprachen.js` mit
`node tools/sprachen-tabelle.js`. Deutsch ist die Quelle (so steht es im
Markup); die anderen drei Spalten sind zu prüfen und zu korrigieren.

**So korrigieren:** nur die Spalten English, Français und Italiano (oder
einen deutschen Text) ändern – direkt hier in der Datei. Die Spalte
„Schlüssel" und die Zeilen bleiben, wie sie sind; ein senkrechter Strich im
Text wird als `\|` geschrieben. Danach schreibt
`node tools/sprachen-tabelle.js uebernehmen` die Tabelle in den Code zurück
(macht die nächste Session mit Claude); `bash tools/release.sh` prüft, dass
Tabelle und Code übereinstimmen. Schriftnamen (Atkinson Hyperlegible …) und
die Namen der Sprachen in der Sprachwahl werden nicht übersetzt und stehen
deshalb nicht hier.

| Art | Bedeutung | Text |
|-----|-----------|------|
| Beschriftung | Text neben dem Bedienelement (bei Knöpfen: der Knopftext) | kurz |
| Tooltip | erscheint nach 3 Sekunden über dem Element | ein Satz |
| Vorlesetext | was Vorlesewerkzeuge (Screenreader) sagen (`aria-label`) | kurz, ohne Abkürzungen |
| Option | Eintrag einer Auswahlliste | so kurz wie möglich |

## Allgemein

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `allgemein.fenstertitel` | Titel des Einstellungsfensters | bger reader – Einstellungen | bger reader – Settings | bger reader – Paramètres | bger reader – Impostazioni |
| `allgemein.bereich` | Name des Panels für Vorlesewerkzeuge | bger reader Einstellungen | bger reader settings | Paramètres bger reader | Impostazioni bger reader |
| `allgemein.allgemein` | Name des oberen Bereichs (Vorlesewerkzeuge) | Einstellungen | Settings | Paramètres | Impostazioni |
| `allgemein.erweitert` | Name des Bereichs „erweitert" (Vorlesewerkzeuge) | Erweiterte Einstellungen | Advanced settings | Paramètres avancés | Impostazioni avanzate |
| `allgemein.aus` | Wertanzeige, wenn eine Einstellung aus ist | aus | off | désactivé | disattivato |
| `allgemein.klammer` | Titel des Klammer-Pfeils im Entscheidtext | Klammerbemerkung ein-/ausklappen | Show or hide parenthetical | Afficher ou masquer la parenthèse | Mostrare o nascondere la parentesi |

## Pinker Knopf auf der Entscheidseite (`bkl-button`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-button.tip` | Tooltip | bger reader Einstellungen öffnen | Open bger reader settings | Ouvrir les paramètres bger reader | Aprire le impostazioni di bger reader |
| `bkl-button.aria` | Vorlesetext | bger reader Einstellungen öffnen | Open bger reader settings | Ouvrir les paramètres bger reader | Aprire le impostazioni di bger reader |

## Schliessen-Knopf (X) (`bkl-schliessen`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-schliessen.tip` | Tooltip | Einstellungen schliessen (Escape) | Close settings (Escape) | Fermer les paramètres (Échap) | Chiudere le impostazioni (Esc) |
| `bkl-schliessen.aria` | Vorlesetext | Einstellungen schliessen | Close settings | Fermer les paramètres | Chiudere le impostazioni |

## „Sprache" – Sprachwahl (`bkl-sprache`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-sprache.label` | Beschriftung | Sprache | Language | Langue | Lingua |
| `bkl-sprache.tip` | Tooltip | Sprache der Bedienoberfläche (Deutsch, English, Français, Italiano) | Language of the interface (Deutsch, English, Français, Italiano) | Langue de l’interface (Deutsch, English, Français, Italiano) | Lingua dell’interfaccia (Deutsch, English, Français, Italiano) |
| `bkl-sprache.aria` | Vorlesetext | Sprache der Bedienoberfläche wählen | Choose interface language | Choisir la langue de l’interface | Scegliere la lingua dell’interfaccia |

## „einschalten" – Lesemodus ein/aus (`bkl-aktiv`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-aktiv.label` | Beschriftung | einschalten | enable | activer | attivare |
| `bkl-aktiv.tip` | Tooltip | Lesemodus ein-/ausschalten | Turn reading mode on or off | Activer ou désactiver le mode lecture | Attivare o disattivare la modalità lettura |
| `bkl-aktiv.aria` | Vorlesetext | Lesemodus ein-/ausschalten | Turn reading mode on or off | Activer ou désactiver le mode lecture | Attivare o disattivare la modalità lettura |

## „Schriftgrösse" – Schriftgrösse (`bkl-groesse`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-groesse.label` | Beschriftung | Schriftgrösse | Font size | Taille de police | Dimensione carattere |
| `bkl-groesse.tip` | Tooltip | Schriftgrösse (6 bis 50, Standard 18) | Font size (6 to 50, default 18) | Taille de police (6 à 50, par défaut 18) | Dimensione del carattere (da 6 a 50, predefinita 18) |
| `bkl-groesse.aria` | Vorlesetext | Schriftgrösse | Font size | Taille de police | Dimensione carattere |

## „Schriftart" – Schriftart (`bkl-art`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-art.label` | Beschriftung | Schriftart | Font | Police | Carattere |
| `bkl-art.tip` | Tooltip | Schriftart wählen (Vorschau in der Liste) | Choose a font (preview in the list) | Choisir la police (aperçu dans la liste) | Scegliere il carattere (anteprima nell’elenco) |
| `bkl-art.aria` | Vorlesetext | Schriftart wählen | Choose font | Choisir la police | Scegliere il carattere |
| `bkl-art.optionen.liberation-sans` | Option „liberation-sans" | Liberation Sans (Arial-ähnlich) | Liberation Sans (Arial-like) | Liberation Sans (proche d’Arial) | Liberation Sans (simile ad Arial) |
| `bkl-art.optionen.liberation-serif` | Option „liberation-serif" | Liberation Serif (Times-ähnlich) | Liberation Serif (Times-like) | Liberation Serif (proche de Times) | Liberation Serif (simile a Times) |
| `bkl-art.optionen.sans` | Option „sans" | System Sans | System Sans | Sans-serif système | Sans-serif di sistema |
| `bkl-art.optionen.serif` | Option „serif" | System Serif | System Serif | Serif système | Serif di sistema |

## „Hintergrund" – Hintergrund (`bkl-farbe`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-farbe.label` | Beschriftung | Hintergrund | Background | Arrière-plan | Sfondo |
| `bkl-farbe.tip` | Tooltip | Hintergrund und Textfarbe wählen (Vorschau in der Liste) | Choose background and text colour (preview in the list) | Choisir l’arrière-plan et la couleur du texte (aperçu dans la liste) | Scegliere sfondo e colore del testo (anteprima nell’elenco) |
| `bkl-farbe.aria` | Vorlesetext | Hintergrund wählen | Choose background | Choisir l’arrière-plan | Scegliere lo sfondo |
| `bkl-farbe.optionen.hell` | Option „hell" | Weiss | White | Blanc | Bianco |
| `bkl-farbe.optionen.sepia` | Option „sepia" | Sepia | Sepia | Sépia | Seppia |
| `bkl-farbe.optionen.dunkel` | Option „dunkel" | Dunkel | Dark | Sombre | Scuro |
| `bkl-farbe.optionen.kontrast` | Option „kontrast" | Hoher Kontrast | High contrast | Contraste élevé | Contrasto elevato |
| `bkl-farbe.optionen.nacht` | Option „nacht" | Nacht (rötlich) | Night (reddish) | Nuit (rougeâtre) | Notte (rossastro) |

## „Breite" – Breite (`bkl-spalte`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-spalte.label` | Beschriftung | Breite | Text width | Largeur du texte | Larghezza del testo |
| `bkl-spalte.tip` | Tooltip | Breite des Textrahmens in Pixel (Standard 800, die Seite selbst 625) | Width of the text frame in pixels (default 800, the site itself 625) | Largeur du cadre de texte en pixels (par défaut 800, le site lui-même 625) | Larghezza del riquadro di testo in pixel (predefinita 800, il sito stesso 625) |
| `bkl-spalte.aria` | Vorlesetext | Breite des Textrahmens in Pixel | Width of the text frame in pixels | Largeur du cadre de texte en pixels | Larghezza del riquadro di testo in pixel |

## „einfach" – Klammern einklappen (`bkl-klammern`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-klammern.label` | Beschriftung | einfach | simplify | simplifier | semplificare |
| `bkl-klammern.tip` | Tooltip | Klammerbemerkungen einklappen (Regel: Fundstellen wie BGE-Zitate und Literatur werden eingeklappt; Gesetzesverweise und Entscheidtext bleiben offen) | Fold parentheticals away (rule: citations such as BGE/ATF references and literature are folded; references to statutes and the court’s own text stay open) | Replier les parenthèses (règle : les références telles que les citations d’ATF et la doctrine sont repliées ; les renvois aux lois et le texte de l’arrêt restent ouverts) | Ripiegare le parentesi (regola: i riferimenti come le citazioni DTF e la dottrina vengono ripiegati; i rinvii alle leggi e il testo della sentenza restano aperti) |
| `bkl-klammern.aria` | Vorlesetext | Klammerbemerkungen einklappen | Fold parentheticals | Replier les parenthèses | Ripiegare le parentesi |

## „erweitert" – Knopf für die erweiterten Einstellungen (`bkl-details-toggle`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-details-toggle.label` | Beschriftung | erweitert | advanced | avancé | avanzate |
| `bkl-details-toggle.tip` | Tooltip | Weitere Einstellungen ein-/ausblenden | Show or hide further settings | Afficher ou masquer les autres paramètres | Mostrare o nascondere le altre impostazioni |
| `bkl-details-toggle.aria` | Vorlesetext | Erweiterte Einstellungen ein-/ausblenden | Show or hide advanced settings | Afficher ou masquer les paramètres avancés | Mostrare o nascondere le impostazioni avanzate |

## „Schriftstärke" – Schriftstärke (`bkl-staerke`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-staerke.label` | Beschriftung | Schriftstärke | Font weight | Graisse | Peso |
| `bkl-staerke.tip` | Tooltip | Schriftstärke wählen | Choose font weight | Choisir la graisse de la police | Scegliere il peso del carattere |
| `bkl-staerke.aria` | Vorlesetext | Schriftstärke wählen | Choose font weight | Choisir la graisse | Scegliere il peso del carattere |
| `bkl-staerke.optionen.normal` | Option „normal" | normal | normal | normale | normale |
| `bkl-staerke.optionen.fett` | Option „fett" | fett | bold | gras | grassetto |

## „Zeilen" – Zeilenabstand (`bkl-zeilenabstand`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-zeilenabstand.label` | Beschriftung | Zeilen | Line spacing | Interligne | Interlinea |
| `bkl-zeilenabstand.tip` | Tooltip | Zeilenabstand (Faktor) | Line spacing (factor) | Interligne (facteur) | Interlinea (fattore) |
| `bkl-zeilenabstand.aria` | Vorlesetext | Zeilenabstand (Faktor) | Line spacing (factor) | Interligne (facteur) | Interlinea (fattore) |

## „Absatz" – Absatzabstand (`bkl-absatz`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-absatz.label` | Beschriftung | Absatz | Paragraph spacing | Espacement des paragraphes | Spaziatura paragrafi |
| `bkl-absatz.tip` | Tooltip | Zusätzlicher Abstand nach jedem Absatz (Faktor der Schriftgrösse, 0 = Seiten-Standard) | Extra space after each paragraph (factor of the font size, 0 = site default) | Espace supplémentaire après chaque paragraphe (facteur de la taille de police, 0 = valeur du site) | Spazio aggiuntivo dopo ogni paragrafo (fattore della dimensione del carattere, 0 = valore del sito) |
| `bkl-absatz.aria` | Vorlesetext | Absatzabstand (Faktor, 0 = Seiten-Standard) | Paragraph spacing (factor, 0 = site default) | Espacement des paragraphes (facteur, 0 = valeur du site) | Spaziatura paragrafi (fattore, 0 = valore del sito) |

## „Buchstabenabstand" – Buchstabenabstand (`bkl-buchstaben`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-buchstaben.label` | Beschriftung | Buchstabenabstand | Letter spacing | Espacement des lettres | Spaziatura lettere |
| `bkl-buchstaben.tip` | Tooltip | Buchstabenabstand in Pixel | Letter spacing in pixels | Espacement des lettres en pixels | Spaziatura delle lettere in pixel |
| `bkl-buchstaben.aria` | Vorlesetext | Buchstabenabstand in Pixel | Letter spacing in pixels | Espacement des lettres en pixels | Spaziatura delle lettere in pixel |

## „Wortabstand" – Wortabstand (`bkl-worte`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-worte.label` | Beschriftung | Wortabstand | Word spacing | Espacement des mots | Spaziatura parole |
| `bkl-worte.tip` | Tooltip | Wortabstand in Pixel | Word spacing in pixels | Espacement des mots en pixels | Spaziatura delle parole in pixel |
| `bkl-worte.aria` | Vorlesetext | Wortabstand in Pixel | Word spacing in pixels | Espacement des mots en pixels | Spaziatura delle parole in pixel |

## „Zeilenlänge" – Zeilenlänge (`bkl-laenge`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-laenge.label` | Beschriftung | Zeilenlänge | Line length | Longueur de ligne | Lunghezza riga |
| `bkl-laenge.tip` | Tooltip | Zeilenlänge begrenzen (Zeichen, 0 = aus) | Limit line length (characters, 0 = off) | Limiter la longueur des lignes (caractères, 0 = désactivé) | Limitare la lunghezza delle righe (caratteri, 0 = disattivato) |
| `bkl-laenge.aria` | Vorlesetext | Zeilenlänge begrenzen (Zeichen, 0 = aus) | Limit line length (characters, 0 = off) | Limiter la longueur des lignes (caractères, 0 = désactivé) | Limitare la lunghezza delle righe (caratteri, 0 = disattivato) |

## „Silbentrennung" – Silbentrennung (`bkl-silben`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-silben.label` | Beschriftung | Silbentrennung | Hyphenation | Césure | Sillabazione |
| `bkl-silben.tip` | Tooltip | Silbentrennung ein-/ausschalten | Turn hyphenation on or off | Activer ou désactiver la césure | Attivare o disattivare la sillabazione |
| `bkl-silben.aria` | Vorlesetext | Silbentrennung ein-/ausschalten | Turn hyphenation on or off | Activer ou désactiver la césure | Attivare o disattivare la sillabazione |

## „Ausrichtung" – Ausrichtung (`bkl-ausrichtung`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-ausrichtung.label` | Beschriftung | Ausrichtung | Alignment | Alignement | Allineamento |
| `bkl-ausrichtung.tip` | Tooltip | Textausrichtung der Absätze (Standard: links) | Text alignment of the paragraphs (default: left) | Alignement du texte des paragraphes (par défaut : gauche) | Allineamento del testo dei paragrafi (predefinito: sinistra) |
| `bkl-ausrichtung.aria` | Vorlesetext | Textausrichtung wählen | Choose text alignment | Choisir l’alignement | Scegliere l’allineamento |
| `bkl-ausrichtung.optionen.links` | Option „links" | links | left | gauche | sinistra |
| `bkl-ausrichtung.optionen.mittig` | Option „mittig" | mittig | centred | centré | centrato |
| `bkl-ausrichtung.optionen.rechts` | Option „rechts" | rechts | right | droite | destra |
| `bkl-ausrichtung.optionen.blocksatz` | Option „blocksatz" | Blocksatz | justified | justifié | giustificato |

## „Spalten" – Spalten (`bkl-spalten`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-spalten.label` | Beschriftung | Spalten | Columns | Colonnes | Colonne |
| `bkl-spalten.tip` | Tooltip | Entscheidtext in 1, 2 oder 3 Spalten (Zeitungssatz) | Decision text in 1, 2 or 3 columns (newspaper layout) | Texte de l’arrêt sur 1, 2 ou 3 colonnes (mise en page journal) | Testo della sentenza su 1, 2 o 3 colonne (impaginazione a giornale) |
| `bkl-spalten.aria` | Vorlesetext | Anzahl Textspalten wählen | Choose number of text columns | Choisir le nombre de colonnes | Scegliere il numero di colonne |
| `bkl-spalten.optionen.1` | Option „1" | 1 Spalte | 1 column | 1 colonne | 1 colonna |
| `bkl-spalten.optionen.2` | Option „2" | 2 Spalten | 2 columns | 2 colonnes | 2 colonne |
| `bkl-spalten.optionen.3` | Option „3" | 3 Spalten | 3 columns | 3 colonnes | 3 colonne |

## „Zurücksetzen" – Knopf „Zurücksetzen" (`bkl-reset`)

| Schlüssel | Art | Deutsch | English | Français | Italiano |
|---|---|---|---|---|---|
| `bkl-reset.label` | Beschriftung | Zurücksetzen | Reset | Réinitialiser | Ripristina |
| `bkl-reset.tip` | Tooltip | Alle Einstellungen auf Standard zurücksetzen: Lesemodus aus, Schriftgrösse 18, Schriftart System Serif, Schriftstärke normal, Zeilenabstand 1.6, Absatzabstand aus, Buchstaben- und Wortabstand 0, Zeilenlänge aus, Silbentrennung aus, Ausrichtung links, 1 Spalte, Textbreite 800 px, Hintergrund Weiss, Klammern „einfach" ein. Die Sprache bleibt. | Reset all settings to their defaults: reading mode off, font size 18, font System Serif, weight normal, line spacing 1.6, paragraph spacing off, letter and word spacing 0, line length off, hyphenation off, alignment left, 1 column, text width 800 px, background White, “simplify” on. The language stays. | Rétablir tous les paramètres par défaut : mode lecture désactivé, taille 18, police Serif système, graisse normale, interligne 1.6, espacement des paragraphes désactivé, espacement des lettres et des mots 0, longueur de ligne désactivée, césure désactivée, alignement à gauche, 1 colonne, largeur du texte 800 px, arrière-plan Blanc, « simplifier » activé. La langue est conservée. | Ripristinare tutte le impostazioni predefinite: modalità lettura disattivata, dimensione 18, carattere Serif di sistema, peso normale, interlinea 1.6, spaziatura paragrafi disattivata, spaziatura lettere e parole 0, lunghezza riga disattivata, sillabazione disattivata, allineamento a sinistra, 1 colonna, larghezza del testo 800 px, sfondo Bianco, «semplificare» attivo. La lingua resta invariata. |
| `bkl-reset.aria` | Vorlesetext | Alle Einstellungen auf Standard zurücksetzen | Reset all settings to their defaults | Rétablir tous les paramètres par défaut | Ripristinare tutte le impostazioni predefinite |


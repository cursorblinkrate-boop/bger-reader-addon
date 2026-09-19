[Deutsch](DE-Schriftarten.md) · [English](EN-Fonts.md) · **Français** · [Italiano](IT-Caratteri.md)

<!-- Ne pas modifier ici dans le wiki : la source est le fichier wiki/FR-Polices.md du dépôt, et le workflow écrase le wiki à chaque push. La page allemande wiki/DE-Schriftarten.md fait foi : y faire d'abord les modifications de contenu, puis les reporter dans cette traduction. -->

bger reader apporte sept polices, fournies avec l'extension et jamais chargées depuis Internet, plus deux entrées pour les polices de votre propre système. Toutes les polices fournies sont des polices libres sous licences ouvertes; elles peuvent être redistribuées avec l'extension, et les textes des licences sont joints au paquet. Le choix se fait dans le panneau de réglages sous **Schriftart** (police); la liste montre chaque entrée dans sa propre police.

## Les polices en un coup d'œil

| Entrée du menu | Origine | À quoi elle convient | Licence |
|---|---|---|---|
| Atkinson Hyperlegible | Braille Institute of America | déficience visuelle; les lettres et chiffres faciles à confondre (I, l, 1, O, 0) ont des formes nettement différentes | SIL Open Font License 1.1 |
| Luciole | Centre Technique Régional pour la Déficience Visuelle (France), dessinée par Laurent Bourcellier et Jonathan Perez | déficience visuelle; conçue spécialement pour les personnes malvoyantes, avec des espaces intérieurs des lettres généreux | Creative Commons BY 4.0 |
| OpenDyslexic | Abbie Gonzalez | dyslexie; les lettres sont plus lourdes en bas, ce qui doit rendre plus difficiles les retournements et les inversions | SIL Open Font License 1.1 |
| Comic Neue | Craig Rozynski | allure amicale, proche de l'écriture manuscrite; préférée par certaines personnes dyslexiques, parce que chaque forme est reconnaissable entre toutes | SIL Open Font License 1.1 |
| EB Garamond | Georg Duffner, poursuivie par Octavio Pardo | police de livre classique pour de longues lectures sur fond clair | SIL Open Font License 1.1 |
| Liberation Sans (Arial-ähnlich) | Red Hat | police sans empattements neutre, de même largeur qu'Arial (« Arial-ähnlich » : semblable à Arial) | SIL Open Font License 1.1 |
| Liberation Serif (Times-ähnlich) | Red Hat | police à empattements neutre, de même largeur que Times New Roman (« Times-ähnlich » : semblable à Times) | SIL Open Font License 1.1 |
| System Sans | police de votre propre appareil (Verdana, Arial ou Helvetica) | pour qui préfère la police système habituelle | – |
| System Serif | police de votre propre appareil (Georgia ou Times New Roman) | valeur par défaut; correspond à l'allure des sites des tribunaux | – |

## Quelle police pour qui

En cas de déficience visuelle, il vaut la peine d'essayer successivement Atkinson Hyperlegible et Luciole, chacune avec une police un peu plus grande et un interligne de 1.6 ou plus. Toutes deux ont été dessinées précisément pour que des caractères semblables restent distinguables même en cas de flou ou de faible contraste. Laquelle des deux est la plus agréable se voit le mieux par comparaison directe sur votre propre écran.

En cas de dyslexie, OpenDyslexic est le choix le plus connu; qu'elle aide réellement varie d'une personne à l'autre, c'est pourquoi Comic Neue est proposée comme seconde police aux formes de lettres nettement distinguables. Souvent, un espacement des lettres et des mots plus grand et un interligne plus large apportent davantage que le seul changement de police; ces réglages se trouvent sous **erweitert** (avancé).

Qui souhaite simplement lire longtemps et de manière détendue est bien servi par EB Garamond sur l'arrière-plan « Sepia » (sépia). Liberation Sans et Liberation Serif sont les alternatives neutres pour toutes les personnes qui veulent une police de bureau familière, mais indépendamment de ce qui est installé sur l'appareil.

## Remarques techniques

Les polices se trouvent dans le paquet sous forme de fichiers WOFF2, chacune dans les styles « normal » et « fett » (gras). Elles contiennent le jeu de caractères latin, y compris les trémas et les accents des langues nationales suisses, les caractères spéciaux juridiques comme § et ¶, les guillemets et les tirets typographiques ainsi que le symbole de l'euro. Les caractères qu'une police ne contient pas (pour Comic Neue, par exemple, les signes de renvoi † et ‡) sont remplacés par le navigateur à partir d'une police système.

Deux familles portent dans le paquet d'autres noms que dans le menu : OpenDyslexic s'appelle en interne « Dyslexie-Leseschrift », Liberation Sans et Serif s'appellent « BGEReader Sans » et « BGEReader Serif ». La raison en est une condition de l'Open Font License : qui modifie une police, et la réduction au jeu de caractères latin est une telle modification, ne peut pas continuer à utiliser le nom d'origine protégé. Cela ne change rien à l'apparence.

Les indications de licence complètes, avec les sources et les numéros de version, figurent dans le fichier [extension/fonts/LICENSES.md](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/extension/fonts/LICENSES.md), le texte de l'Open Font License dans `extension/fonts/OFL.txt`. Les polices sont produites à partir des fichiers d'origine avec un script (`tools/subset-fonts.py`), afin que le processus reste traçable et reproductible; plus à ce sujet sous [Développement](FR-Developpement.md).

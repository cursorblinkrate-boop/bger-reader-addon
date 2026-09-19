[Deutsch](DE-Startseite.md) · [English](EN-Home.md) · **Français** · [Italiano](IT-Home.md)

**bger reader** est une extension de navigateur gratuite pour Chrome, Brave, Edge et Firefox qui rend plus lisibles les décisions du Tribunal fédéral suisse et du Tribunal administratif fédéral. Elle ne modifie que l'affichage dans votre propre navigateur : la police, la taille de police, les espacements, la longueur des lignes et le jeu de couleurs se règlent librement, et les références entre parenthèses – par exemple `(BGE 135 II 45 E. 3.2 S. 47)`, soit ATF 135 II 45 consid. 3.2 p. 47 – sont repliées derrière une petite flèche, afin que le fil du raisonnement de la décision ne soit pas constamment interrompu. Le texte lui-même reste intégralement conservé; chaque parenthèse se rouvre d'un clic.

L'extension fonctionne à 100 % hors ligne. Elle n'envoie aucune donnée, ne télécharge rien, ne contient ni publicité ni fonctions statistiques. La seule autorisation qu'elle demande au navigateur est le stockage local, dans lequel vos réglages sont enregistrés. Pour en savoir plus, voir [Confidentialité et sécurité](FR-Confidentialite.md).

bger reader est un projet indépendant d'une seule personne, sans lien avec le Tribunal fédéral, le Tribunal administratif fédéral ou Weblaw.

Ce wiki existe en allemand, en anglais, en français et en italien; la barre de langues tout en haut de chaque page mène à la même page dans les autres langues. L'interface de l'extension elle-même est en allemand.

## À qui s'adresse l'extension

L'extension s'adresse à toutes les personnes qui lisent des décisions de justice à l'écran et qui peinent avec l'affichage standard des sites des tribunaux : les personnes avec une déficience visuelle ou une dyslexie, qui ont besoin d'une police particulièrement lisible comme Atkinson Hyperlegible, Luciole ou OpenDyslexic; les personnes qui préfèrent lire le soir sur fond sombre; et, de manière générale, les juristes, les étudiantes et étudiants et toutes les personnes intéressées qui lisent de longs considérants et ne veulent pas se laisser distraire par les nombreuses citations entre parenthèses.

## Comment ça fonctionne, en bref

Après l'installation, un bouton rond rose portant un symbole de livre apparaît en haut à droite de chaque page de décision prise en charge. Un clic dessus ouvre un petit panneau de réglages. Le mode lecture s'y active avec la case **einschalten** (activer); ensuite, la police, l'arrière-plan et la largeur du texte peuvent être adaptés. Sinon, un clic sur l'icône de l'extension dans la barre d'outils du navigateur ouvre les mêmes réglages dans une fenêtre séparée, plus grande. Tous les réglages sont enregistrés automatiquement et s'appliquent à toutes les pages prises en charge, jusqu'à ce qu'ils soient modifiés.

1. Installer l'extension, voir [Installation](FR-Installation.md).
2. Ouvrir une décision sur `search.bger.ch`, `relevancy.bger.ch` ou `bvger.weblaw.ch`.
3. Cliquer en haut à droite sur le bouton rose et cocher **einschalten**.
4. Régler la police, la taille et l'arrière-plan selon vos préférences. C'est tout.

<img width="957" height="790" alt="Exemple d'affichage avec le panneau de réglages ouvert" src="https://github.com/user-attachments/assets/4ae7d44b-6423-4ff9-9613-93a000e02cbf" />

## Les pages de ce wiki

- [Installation](FR-Installation.md) – Télécharger et configurer dans Chrome, Brave, Edge et Firefox, vérifier la somme de contrôle, mettre à jour, supprimer.
- [Utilisation](FR-Utilisation.md) – Le bouton rose, le panneau de réglages, la fenêtre séparée, le clavier, l'impression.
- [Réglages](FR-Reglages.md) – Chaque réglage expliqué un par un, avec sa plage de valeurs et sa valeur par défaut.
- [Replier les parenthèses](FR-Parentheses.md) – Quelles parenthèses sont repliées, lesquelles restent ouvertes, et pourquoi.
- [Polices](FR-Polices.md) – Les polices fournies, à quoi elles conviennent et sous quelle licence elles sont placées.
- [Sites pris en charge](FR-Sites.md) – Sur quelles pages l'extension fonctionne et ce qui y est particulier.
- [Confidentialité et sécurité](FR-Confidentialite.md) – Ce qui est enregistré, ce qui ne l'est pas, et comment signaler un problème de sécurité.
- [Questions fréquentes](FR-FAQ.md) – Réponses aux questions typiques et aide lorsque quelque chose ne fonctionne pas.
- [Développement](FR-Developpement.md) – Structure du code, tests, versions et releases, pour toutes les personnes qui souhaitent contribuer ou comprendre le code.

## Version actuelle et historique

La version actuelle se trouve sur la [page des releases](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases); chaque fichier porte le numéro de version dans son nom, par exemple `bger-reader-0.9.1.zip`. Ce qui a changé d'une version à l'autre est décrit dans le [journal des modifications](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/CHANGELOG.md). L'extension a été soumise aux boutiques d'extensions (Chrome Web Store, Mozilla Add-ons); dès qu'elle y sera approuvée, l'installation se fera en un seul clic; d'ici là, le chemin par le paquet de la version (release), décrit sous [Installation](FR-Installation.md), fonctionne.

## Signaler une erreur et poser des questions

Les erreurs, les souhaits et les questions vont dans les [Issues](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) du projet sur GitHub. Le signalement le plus utile indique l'adresse de la décision concernée, le navigateur utilisé avec sa version et une brève description de ce qui était attendu et de ce qui s'est produit à la place. Pour une parenthèse repliée à tort ou restée ouverte à tort, le texte exact de la parenthèse suffit. Les problèmes de sécurité ne doivent pas être signalés publiquement, mais comme décrit sous [Confidentialité et sécurité](FR-Confidentialite.md).

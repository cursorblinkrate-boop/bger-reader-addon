[Deutsch](DE-Datenschutz.md) · [English](EN-Privacy.md) · **Français** · [Italiano](IT-Privacy.md)

bger reader est construit de telle sorte que la protection des données n'est pas une question de confiance, mais de technique : l'extension n'a aucune possibilité d'envoyer des données, parce qu'elle n'établit aucune connexion. Cette page décrit ce qu'elle fait, ce qu'elle enregistre et comment un problème de sécurité peut être signalé.

## Ce que fait l'extension

L'extension n'est démarrée par le navigateur que sur les quatre adresses prises en charge (`search.bger.ch`, `relevancy.bger.ch` en https et en http, `bvger.weblaw.ch`); sur tous les autres sites web, elle n'est pas présente et ne peut rien y voir. Sur une page de décision, elle insère son panneau de réglages, superpose des règles de police et de couleurs au texte de la décision et place les références entre parenthèses dans de petites enveloppes qui se déplient et se replient. Le texte de la décision est seulement déplacé, jamais modifié, raccourci ou complété; si le mode lecture est désactivé, la page est de nouveau exactement telle que le navigateur l'a chargée.

Elle ne lit aucune saisie dans les champs de recherche, aucun cookie et aucun autre onglet, et elle ne connaît ni votre identité ni vos requêtes de recherche. Elle n'a pas accès à Internet : il n'y a aucune connexion à un serveur du projet, aucune statistique, aucun rapport de plantage, aucune vérification automatique de mise à jour et aucune police téléchargée après coup. Toutes les polices se trouvent dans le paquet. Cela vaut aussi sur `bvger.weblaw.ch`, où le site du tribunal charge lui-même les décisions au moyen d'un programme : l'extension attend seulement que le texte apparaisse sur la page, mais n'adresse elle-même aucune requête.

## Quelle autorisation elle demande

À l'installation, le navigateur demande exactement une autorisation : **stockage** (« storage »). Elle permet à l'extension de déposer ses propres réglages dans le stockage local du navigateur réservé aux extensions, afin qu'ils soient de nouveau là à la prochaine ouverture d'une page de décision. L'accès aux quatre adresses des tribunaux n'est pas une autorisation accordée séparément; il découle du fait que l'extension ne s'exécute que là. Le navigateur l'affiche dans la vue d'ensemble de l'extension sous la forme « Lire et modifier vos données sur search.bger.ch ». L'extension ne demande aucune autre autorisation, par exemple pour l'historique de navigation, les onglets, les téléchargements ou les pages web en général.

Pour Firefox, le paquet contient en outre la déclaration formelle qu'aucune donnée n'est collectée (« data collection permissions: none »); Firefox à partir de la version 140 tient compte de cette indication.

## Ce qui est enregistré

Seuls les réglages du panneau de réglages sont enregistrés : si le mode lecture est activé, la taille de police, la police, la graisse, l'interligne, l'espacement des paragraphes, des lettres et des mots, la longueur des lignes, la largeur du texte, la césure, le jeu de couleurs, si les parenthèses sont repliées, l'alignement et le nombre de colonnes. Ces valeurs forment une seule entrée nommée `bger-reader-einstellungen-v2` dans le stockage local de l'extension. Il n'y a pas d'historique, pas de liste des décisions lues et pas de notes. Le stockage n'est pas synchronisé avec un compte et ne quitte pas l'appareil; lors de la suppression de l'extension, le navigateur le supprime aussi.

La fenêtre de réglages séparée mémorise en outre brièvement son propre numéro de fenêtre, afin qu'un second clic sur l'icône ramène la fenêtre ouverte au premier plan au lieu d'en ouvrir une seconde. Ce numéro se trouve dans le stockage de session du navigateur et expire à la fermeture du navigateur.

## Code source et livraison

Le code source complet est public sur GitHub et écrit en JavaScript ordinaire, sans outils qui transforment le code avant la livraison. Le paquet téléchargé correspond ligne pour ligne à ce qui se trouve dans le dépôt. Le paquet de la version (release) est produit automatiquement à partir de l'état testé du code, après que les tests ont été exécutés dans de vrais navigateurs, et une somme de contrôle est publiée à côté, avec laquelle l'intégrité du fichier peut être vérifiée; la marche à suivre est décrite sous [Installation](FR-Installation.md). L'extension est un projet indépendant, sans lien avec le Tribunal fédéral, le Tribunal administratif fédéral ou Weblaw; les sites des tribunaux ne savent rien d'elle.

## Signaler des problèmes de sécurité

Seule la version la plus récente de la page des releases est prise en charge; avant un signalement, veuillez mettre à jour vers celle-ci. Qui découvre un problème de sécurité est prié de ne pas le signaler dans une Issue publique, mais de manière confidentielle : de préférence par le formulaire de GitHub sous **Security → Report a vulnerability** dans le dépôt, sinon par e-mail à l'adresse indiquée dans le fichier [SECURITY.md](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/SECURITY.md) (`bger.reader@gmail.com`). Comme il s'agit d'un projet d'une seule personne, une réponse peut prendre quelques jours; les problèmes confirmés sont corrigés avec la version suivante.

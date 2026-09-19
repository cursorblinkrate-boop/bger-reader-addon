[Deutsch](DE-Websites.md) · [English](EN-Websites.md) · **Français** · [Italiano](IT-Siti.md)

bger reader fonctionne sur les pages de décision du Tribunal fédéral suisse et du Tribunal administratif fédéral. Le navigateur ne démarre l'extension que sur les adresses énumérées ici; sur tous les autres sites web, elle n'est pas présente. Les réglages valent pour l'ensemble des sites pris en charge.

| Adresse | Tribunal | Ce qui s'y trouve |
|---|---|---|
| `https://search.bger.ch/*` | Tribunal fédéral | les arrêts de principe publiés au recueil officiel (ATF) et tous les autres arrêts depuis l'an 2000 |
| `https://relevancy.bger.ch/*` et `http://relevancy.bger.ch/*` | Tribunal fédéral | second accès aux mêmes décisions, avec et sans chiffrement |
| `https://bvger.weblaw.ch/*` | Tribunal administratif fédéral | base de données des décisions du Tribunal administratif fédéral, exploitée par Weblaw |

## search.bger.ch et relevancy.bger.ch

Les décisions du Tribunal fédéral existent en deux vues. Le recueil officiel (ATF) est présenté dans la vue « clir », dans laquelle chaque paragraphe de la décision est un bloc de texte distinct et où les changements de page du recueil imprimé sont marqués dans le texte par des barres comme « BGE 152 IV 1 S. 7 ». Les autres arrêts depuis 2000 apparaissent dans la vue « aza », avec une structure de paragraphes un peu différente. L'extension connaît les deux et les traite de la même manière : la typographie et les couleurs agissent sur les paragraphes de la décision, les barres de changement de page restent visibles même avec les parenthèses repliées, et les surlignages jaunes des résultats de recherche conservent un texte sombre.

Le jeu de couleurs agit sur toute la page, donc aussi sur l'en-tête, la navigation de gauche et les colonnes latérales avec la table des matières et les références, afin qu'aucun cadre blanc ne subsiste avec les jeux de couleurs sombres. La largeur du texte modifie le cadre que le site fixe par défaut à 625 pixels; les colonnes latérales suivent. Sur les pages de recherche de `search.bger.ch`, c'est-à-dire là où se trouvent des listes de résultats au lieu d'une décision, seul le jeu de couleurs agit; les réglages typographiques ne s'appliquent que sur la page de la décision.

`relevancy.bger.ch` est un second accès aux mêmes décisions, vers lequel des liens sans chiffrement (http) existent encore en partie; l'extension prend en charge les deux variantes.

## bvger.weblaw.ch

Les décisions du Tribunal administratif fédéral se trouvent sur un site web construit autrement que celui du Tribunal fédéral : c'est une application web (web app). La page arrive d'abord vide dans le navigateur, et la décision n'est chargée et insérée qu'ensuite par le site, au moyen d'un programme. Lors du passage à une autre décision ou de l'activation et de la désactivation des surlignages proposés par le site, le texte est remplacé sans que la page soit rechargée.

L'extension attend donc le texte et reconstruit la typographie et les parenthèses chaque fois que la décision change sur la page. Un bref instant entre l'apparition de la décision et le mode lecture est normal. L'extension n'adresse elle-même aucune requête au site; elle observe seulement ce qui apparaît sur la page.

Quelques particularités du site sont prises en compte. Le site indique sa langue comme étant l'anglais, ce qui nuirait à la césure; l'extension reconnaît la langue de la décision au rubrum, l'en-tête de la décision (« Urteil vom », « Arrêt du », « Sentenza del »), et coupe les mots en conséquence. Les surlignages colorés du site pour les décisions citées et les mots-clés conservent un texte sombre, et leurs libellés ne comptent pas dans le texte de la parenthèse. Le jeu de couleurs agit sur la zone de la décision avec le titre et la date ainsi que sur la barre latérale avec les filtres, et la largeur du texte modifie la colonne dans laquelle se trouve la décision. Les citations au format du Tribunal administratif fédéral comme `BVGE 2014/1` ou `ATAF 2007/6` sont reconnues comme jurisprudence et repliées.

## Ce qui n'est pas pris en charge

L'extension n'agit que sur les pages de décision dans le navigateur. Ne sont pas pris en charge les versions PDF des décisions, les pages d'actualités et d'information sous `www.bger.ch`, les recueils de décisions des tribunaux cantonaux, d'autres bases de données comme entscheidsuche.ch ou Swisslex, ni les autres produits de Weblaw. Les navigateurs pour smartphone ne sont pas pris en charge, voir [Questions fréquentes](FR-FAQ.md). Les souhaits concernant d'autres sites peuvent être déposés sous forme d'[Issue](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues); chaque nouveau site nécessite son propre profil de site dans le code et des pages de test sur lesquelles il peut être vérifié.

[Deutsch](DE-Bedienung.md) · [English](EN-Usage.md) · **Français** · [Italiano](IT-Utilizzo.md)

<!-- Ne pas modifier ici dans le wiki : la source est le fichier wiki/FR-Utilisation.md du dépôt, et le workflow écrase le wiki à chaque push. La page allemande wiki/DE-Bedienung.md fait foi : y faire d'abord les modifications de contenu, puis les reporter dans cette traduction. -->

bger reader se commande à deux endroits : directement sur la page de la décision, par un petit panneau de réglages qui s'ouvre avec le bouton rose, ou dans une fenêtre séparée, qui s'ouvre par l'icône de l'extension dans la barre d'outils. Les deux montrent les mêmes réglages, accèdent au même stockage et restent synchronisés : ce qui est modifié dans la fenêtre agit immédiatement sur la page, et inversement.

## Le bouton rose et le panneau de réglages

Sur chaque page de décision prise en charge, un bouton rond rose portant un symbole de livre blanc apparaît en haut à droite. Il flotte au-dessus de la page et ne défile pas avec elle; il est donc toujours accessible. Un clic dessus ouvre au même endroit le panneau de réglages, un petit panneau blanc avec l'en-tête « bger reader ». Le bouton rose disparaît tant que le panneau est ouvert et revient dès qu'il est fermé. Le panneau se ferme avec le bouton X rose en haut à droite du panneau ou avec la touche **Échap**.

Le panneau est volontairement sobre. Dans la partie supérieure se trouvent les réglages les plus fréquemment utilisés : **einschalten** (activer), **Schriftgrösse** (taille de police), **Schriftart** (police), **Hintergrund** (arrière-plan), **Textbreite** (largeur du texte) et **einfach** (simple). Un clic sur **erweitert** (avancé) déplie en dessous les autres réglages : Schriftstärke (graisse), Zeilenabstand (interligne), Absatzabstand (espacement des paragraphes), Buchstabenabstand (espacement des lettres), Wortabstand (espacement des mots), Zeilenlänge (longueur des lignes), Silbentrennung (césure), Ausrichtung (alignement), Spalten (colonnes) et le bouton **Zurücksetzen** (réinitialiser). Ce que fait chacun de ces réglages en détail est expliqué sur la page [Réglages](FR-Reglages.md).

Tant que **einschalten** n'est pas coché, l'extension ne modifie rien sur la page; elle attend seulement. Avec la coche, le mode lecture devient actif et tous les autres réglages agissent immédiatement. Retirer la coche rétablit entièrement l'affichage d'origine de la page; les parenthèses repliées sont alors elles aussi dépliées à nouveau.

Les curseurs affichent à leur droite la valeur actuelle, par exemple `18` pour la taille de police ou `1.6` pour l'interligne. Les listes déroulantes de la police et de l'arrière-plan offrent un aperçu : chaque police apparaît dans la liste dans sa propre police, chaque arrière-plan dans ses propres couleurs, et la liste fermée montre de la même manière l'entrée choisie. Firefox sous macOS dessine lui-même la liste dépliée et n'y montre l'aperçu que dans l'état fermé.

Qui laisse la souris un peu plus de trois secondes sur un élément de commande voit apparaître une brève infobulle. Le délai est voulu, afin que les infobulles ne gênent pas lors de réglages rapides. Sur le bouton Zurücksetzen, l'infobulle indique toutes les valeurs par défaut.

## La fenêtre de réglages par l'icône de la barre d'outils

Un clic sur l'icône de l'extension dans la barre d'outils du navigateur (le livre rose) ouvre les mêmes réglages dans une fenêtre séparée, qui apparaît au centre de la fenêtre du navigateur. Elle est plus grande que le panneau sur la page et donc plus confortable lorsqu'il y a beaucoup à régler ou que l'écran est grand. Un deuxième clic sur l'icône n'ouvre pas une seconde fenêtre, mais ramène au premier plan celle qui est déjà ouverte. La fenêtre se ferme avec le bouton X ou avec Échap.

La fenêtre est utile même lorsqu'aucune décision n'est ouverte : les réglages qui y sont faits sont enregistrés et s'appliquent dès qu'une page de décision est à nouveau chargée. Si une page de décision est ouverte en même temps, chaque modification dans la fenêtre agit immédiatement sur la page, et le panneau sur la page affiche le nouvel état.

Dans Chrome, Brave et Edge, l'icône de l'extension est d'abord cachée derrière l'icône en forme de pièce de puzzle à droite de la barre d'adresse; l'épingle qui s'y trouve permet de la fixer durablement.

## Lire les parenthèses repliées

Si **einfach** est coché, ce qui est le réglage par défaut, les références entre parenthèses sont repliées. À leur place reste visible un petit bouton portant le signe `▸`. Un clic dessus affiche le contenu de la parenthèse sur place, et le bouton passe à `▾`; un nouveau clic replie la parenthèse. Chaque parenthèse s'ouvre et se ferme individuellement, et les parenthèses une fois ouvertes restent ouvertes, même si la police ou les couleurs sont modifiées ensuite. Seul le fait de désactiver puis de réactiver le mode lecture ou les parenthèses remet toutes les parenthèses à l'état replié. La page [Replier les parenthèses](FR-Parentheses.md) explique quelles parenthèses sont repliées.

Qui ne souhaite pas du tout que les parenthèses soient repliées retire la coche de **einfach**; tous les autres réglages n'en sont pas affectés.

## Enregistrement et validité des réglages

Il n'y a pas de bouton d'enregistrement. Chaque modification est immédiatement déposée dans le stockage local de l'extension et se retrouve à la prochaine ouverture d'une page de décision, même après un redémarrage du navigateur. Les réglages valent pour l'ensemble des sites pris en charge; qui choisit Sepia (sépia) et une Schriftgrösse de 20 sur `search.bger.ch` voit le même affichage sur `bvger.weblaw.ch`. Le bouton **Zurücksetzen** sous « erweitert » remet toutes les valeurs par défaut et désactive le mode lecture.

## Utilisation au clavier

Tous les éléments de commande sont accessibles au clavier. À l'ouverture du panneau de réglages, le focus se place sur le bouton de fermeture; de là, la touche **Tabulation** parcourt tous les éléments, la **barre d'espace** bascule les cases à cocher, les **touches fléchées** modifient les curseurs et les listes déroulantes, et **Échap** ferme le panneau et ramène le focus sur le bouton rose. En utilisation au clavier, les infobulles apparaissent également après trois secondes sur l'élément qui a le focus. Les boutons de dépliage des parenthèses sont de véritables boutons et s'actionnent avec Entrée ou la barre d'espace; les lecteurs d'écran apprennent par eux si la parenthèse est actuellement ouverte ou fermée.

## Imprimer

Lors de l'impression ou de l'enregistrement en PDF par la boîte de dialogue d'impression du navigateur, toutes les parenthèses sont restituées intégralement et les boutons de dépliage sont omis. Une décision imprimée est ainsi toujours complète, quelles que soient les parenthèses repliées à l'écran à ce moment-là. Les autres réglages comme la police et le jeu de couleurs sont imprimés avec le texte; qui préfère du noir sur blanc sur papier choisit brièvement l'arrière-plan « Weiss » (blanc) avant d'imprimer.

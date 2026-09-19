[Deutsch](DE-Einstellungen.md) · [English](EN-Settings.md) · **Français** · [Italiano](IT-Impostazioni.md)

<!-- Ne pas modifier ici dans le wiki : la source est le fichier wiki/FR-Reglages.md du dépôt, et le workflow écrase le wiki à chaque push. La page allemande wiki/DE-Einstellungen.md fait foi : y faire d'abord les modifications de contenu, puis les reporter dans cette traduction. -->

Cette page explique un par un chaque réglage de bger reader. Les réglages figurent dans le même ordre dans le panneau de réglages sur la page et dans la fenêtre séparée; les six premiers sont immédiatement visibles, les autres apparaissent après un clic sur **erweitert** (avancé). La manière d'ouvrir ces deux emplacements est décrite sous [Utilisation](FR-Utilisation.md).

## Vue d'ensemble

| Réglage | Section | Valeurs possibles | Par défaut |
|---|---|---|---|
| einschalten (activer) | principale | aus / ein (désactivé / activé) | aus |
| Schriftgrösse (taille de police) | principale | 6 à 50 | 18 |
| Schriftart (police) | principale | 9 polices, voir [Polices](FR-Polices.md) | System Serif |
| Hintergrund (arrière-plan) | principale | Weiss (blanc), Sepia (sépia), Dunkel (sombre), Hoher Kontrast (contraste élevé), Nacht (rötlich) (nuit, rougeâtre) | Weiss |
| Textbreite (largeur du texte) | principale | 400 à 1400 pixels, par pas de 25 | 625 |
| einfach (simple; parenthèses) | principale | aus / ein | ein |
| Schriftstärke (graisse) | erweitert | normal / fett (gras) | normal |
| Zeilenabstand (interligne) | erweitert | 1.0 à 2.5 | 1.6 |
| Absatzabstand (espacement des paragraphes) | erweitert | aus (désactivé), 0.25 à 3 | aus |
| Buchstabenabstand (espacement des lettres) | erweitert | 0 à 4 pixels | 0 |
| Wortabstand (espacement des mots) | erweitert | 0 à 10 pixels | 0 |
| Zeilenlänge (longueur des lignes) | erweitert | aus (désactivé), 10 à 120 caractères | aus |
| Silbentrennung (césure) | erweitert | aus / ein | aus |
| Ausrichtung (alignement) | erweitert | links (à gauche), mittig (centré), rechts (à droite), Blocksatz (justifié) | links |
| Spalten (colonnes) | erweitert | 1, 2 ou 3 | 1 |

Tous les réglages n'agissent que tant que **einschalten** est coché, et ils agissent exclusivement sur les paragraphes du texte de la décision ainsi que sur le cadre de la page. Les menus, les champs de recherche et les boutons du site du tribunal restent inchangés et utilisables. Qui laisse un réglage à sa valeur par défaut obtient à cet endroit exactement l'affichage de la page d'origine; l'extension n'intervient que là où quelque chose a été modifié.

## einschalten (activer)

L'interrupteur principal. Sans coche, l'extension attend seulement; elle affiche le bouton rose, mais ne modifie rien. Avec la coche, le mode lecture devient actif : la police et les couleurs sont appliquées et, si **einfach** est coché, les références entre parenthèses sont repliées. Retirer la coche rétablit entièrement la page d'origine.

## Schriftgrösse (taille de police)

La taille de la police du texte de la décision, en pixels, de 6 à 50. La valeur par défaut 18 est un peu plus grande que celle des sites des tribunaux. Le curseur agit immédiatement pendant le glissement, de sorte que la taille qui convient se trouve en regardant le texte. Pour de longues lectures, une valeur entre 18 et 22 a fait ses preuves; qui travaille avec un logiciel d'agrandissement peut aller jusqu'à 50 sans que la mise en page du site ne se brise.

## Schriftart (police)

La police dans laquelle le texte de la décision est composé. Au choix : deux polices pour les personnes avec une déficience visuelle (Atkinson Hyperlegible, Luciole), une pour les personnes dyslexiques (OpenDyslexic), une police à l'allure manuscrite et amicale (Comic Neue), une police de livre classique (EB Garamond), deux polices standard neutres (Liberation Sans, Liberation Serif) ainsi que les polices système de votre propre appareil (System Sans, System Serif). La liste montre chaque police dans sa propre forme, de sorte que la différence peut être jugée avant le choix. Toutes les polices, à l'exception des deux polices système, sont fournies avec l'extension et ne sont pas chargées depuis Internet. Détails et licences sous [Polices](FR-Polices.md).

## Hintergrund (arrière-plan)

Le jeu de couleurs pour l'arrière-plan, le texte et les liens. **Weiss** (blanc) correspond à la page d'origine avec du texte noir. **Sepia** (sépia) place un fond chaud, légèrement jaunâtre, sous un texte brun foncé, ce que beaucoup trouvent plus agréable pour les yeux. **Dunkel** (sombre) est un mode nuit avec du texte gris clair sur un fond presque noir. **Hoher Kontrast** (contraste élevé) met du blanc pur sur du noir pur avec des liens jaunes et s'adresse aux personnes dont la vue est fortement réduite. **Nacht (rötlich)** (nuit, rougeâtre) utilise un fond sombre rougeâtre avec un texte clair légèrement teinté de rosé et peu de bleu, ce qui tient moins éveillé le soir. Le jeu de couleurs colore toute la page, donc aussi l'en-tête, la navigation et les colonnes latérales, afin qu'aucun cadre blanc éblouissant ne subsiste autour du texte sombre. Les surlignages jaunes des résultats de recherche du site du tribunal conservent un texte sombre dans tous les jeux de couleurs et restent lisibles.

## Textbreite (largeur du texte)

La largeur du cadre dans lequel se trouve le texte de la décision, en pixels. Sur `search.bger.ch` et `relevancy.bger.ch`, ce cadre est fixé par le site à 625 pixels, ce qui paraît étroit sur les grands écrans. Le curseur permet des valeurs de 400 à 1400 pixels; les colonnes latérales de la page suivent. Sur `bvger.weblaw.ch`, le curseur agit sur la colonne dans laquelle se trouve la décision. À la valeur par défaut 625, la page reste inchangée.

## einfach (simple; replier les parenthèses)

Avec cette case, les références entre parenthèses sont repliées, c'est-à-dire les citations de la jurisprudence (ATF, arrêts avec numéro de dossier) et les références de doctrine. Les renvois à des dispositions légales comme `(Art. 8 Abs. 1 BV)`, les montants, les dates, les renvois aux propres considérants de la décision et les remarques de fond restent ouverts, parce qu'ils font partie du raisonnement. La désignation « einfach » désigne le jeu de règles fixe, qui ne nécessite aucun autre réglage. Chaque parenthèse repliée peut être ouverte individuellement avec la flèche `▸`. Les règles en détail : [Replier les parenthèses](FR-Parentheses.md).

## Schriftstärke (graisse)

« normal » ou « fett » (gras). Le gras peut améliorer la lisibilité avec des polices fines ou sur fond sombre. Toutes les polices fournies contiennent un véritable style gras; le texte n'est donc pas épaissi artificiellement.

## Zeilenabstand (interligne)

L'espace entre les lignes, en multiple de la taille de police, de 1.0 (serré) à 2.5 (très large). La valeur par défaut 1.6 est plus généreuse que la page d'origine. Un interligne plus grand aide à ne pas se tromper de ligne au passage à la ligne suivante, ce qui joue un rôle particulier en cas de dyslexie et avec une petite police.

## Absatzabstand (espacement des paragraphes)

Espace supplémentaire après chaque paragraphe, en multiple de la taille de police, de 0.25 à 3. Sur « aus » (désactivé), l'espacement des paragraphes de la page d'origine est conservé. Une valeur d'environ 0.75 à 1 rend la structure d'une décision en considérants et en sous-paragraphes reconnaissable d'un coup d'œil.

## Buchstabenabstand (espacement des lettres)

Espace supplémentaire entre les lettres, en pixels, de 0 à 4 par pas d'un dixième. Une valeur légèrement augmentée (environ 0.5 à 1) empêche les lettres de se confondre; c'est souvent ressenti comme un soulagement en cas de dyslexie et de déficience visuelle. De grandes valeurs rendent le texte trop espacé et plutôt moins lisible.

## Wortabstand (espacement des mots)

Espace supplémentaire entre les mots, en pixels, de 0 à 10. Un espacement des mots plus grand rend les limites des mots plus nettes. Avec un espacement des lettres augmenté, l'espacement des mots devrait croître également, afin que les mots et les espaces entre les lettres restent distinguables.

## Zeilenlänge (longueur des lignes)

Limite la longueur d'une ligne à un nombre de caractères, de 10 à 120 par pas de dix; « aus » laisse les lignes aussi longues que le cadre du texte est large. Les lignes très longues rendent difficile le retour au début de la ligne; en typographie, 60 à 80 caractères sont considérés comme agréables. Lorsque la longueur des lignes est fixée, le texte est centré à l'intérieur du cadre. Ce réglage est indépendant de la largeur du texte : la largeur du texte définit le cadre, la longueur des lignes le texte à l'intérieur.

## Silbentrennung (césure)

Active la césure automatique du navigateur (coupure des mots en fin de ligne). Elle coupe les mots en fin de ligne selon les règles de la langue de la décision; sur `bvger.weblaw.ch`, l'extension reconnaît la langue au rubrum (en-tête de la décision), parce que le site lui-même ne fournit pas d'indication adéquate. La césure vaut surtout la peine avec des colonnes étroites, une grande police et le texte justifié, parce qu'elle rend les espaces entre les mots plus réguliers. Si et dans quelle mesure les mots sont coupés dépend du navigateur et de sa prise en charge des langues.

## Ausrichtung (alignement)

« links » (à gauche; valeur par défaut et réglage des sites des tribunaux), « mittig » (centré), « rechts » (à droite) ou « Blocksatz » (justifié). Le texte justifié sans césure produit de grands espaces dans les colonnes étroites; les deux réglages vont donc de pair. Centré et à droite sont pensés pour des besoins particuliers, par exemple pour un logiciel de loupe qui agrandit une zone précise de l'écran.

## Spalten (colonnes)

Compose le texte de la décision sur 1, 2 ou 3 colonnes côte à côte, comme dans un journal. Les paragraphes peuvent alors se poursuivre d'une colonne à l'autre, parce que les considérants sont souvent longs. Deux colonnes ont du sens sur les écrans larges, combinées à une grande largeur du texte; sur les écrans étroits, les colonnes deviennent vite trop serrées. Avec une seule colonne, la page reste inchangée.

## Zurücksetzen (réinitialiser)

Remet tous les réglages aux valeurs par défaut du tableau ci-dessus et désactive le mode lecture. L'infobulle du bouton énumère les valeurs par défaut. Il n'y a pas d'annulation; les anciennes valeurs doivent au besoin être réglées à nouveau.

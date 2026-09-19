[Deutsch](DE-FAQ.md) · [English](EN-FAQ.md) · **Français** · [Italiano](IT-FAQ.md)

<!-- Ne pas modifier ici dans le wiki : la source est le fichier wiki/FR-FAQ.md du dépôt, et le workflow écrase le wiki à chaque push. La page allemande wiki/DE-FAQ.md fait foi : y faire d'abord les modifications de contenu, puis les reporter dans cette traduction. -->

Réponses aux questions fréquentes et aide lorsque quelque chose ne fonctionne pas comme prévu. Si la réponse qui convient manque, une [Issue](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) sur GitHub aide; ce qu'un signalement devrait contenir est indiqué tout en bas.

## Le bouton rose n'apparaît pas

Le bouton n'apparaît que sur les adresses prises en charge, voir [Sites pris en charge](FR-Sites.md). L'adresse dans la barre d'adresse doit commencer par `search.bger.ch`, `relevancy.bger.ch` ou `bvger.weblaw.ch`. Si le bouton n'y apparaît pas, l'extension est peut-être désactivée : sur la page des extensions du navigateur (`chrome://extensions`, `brave://extensions`, `edge://extensions`, dans Firefox `about:addons` ou `about:debugging` pour un module complémentaire temporaire), bger reader doit être activé. Après l'activation ou la désactivation de l'extension et après une mise à jour, la page de la décision doit être rechargée une fois. Dans Chrome, Brave et Edge, l'extension disparaît en outre si le dossier décompressé a été déplacé ou supprimé; une nouvelle [Installation](FR-Installation.md) y remédie.

## J'ai coché « einschalten » (activer), mais rien ne se passe

L'extension ne modifie que les paragraphes du texte de la décision. Sur une liste de résultats de `search.bger.ch` ou sur la page d'accueil de la base de données des décisions, seul le jeu de couleurs agit donc; la police et la taille ne sont visibles que sur une page de décision. Si l'arrière-plan est réglé sur « Weiss » (blanc) et la police sur « System Serif », la différence avec la page d'origine est en outre faible, parce que ce sont les valeurs par défaut : un autre arrière-plan ou une police plus grande rend le mode lecture immédiatement visible.

## Sur bvger.weblaw.ch, le mode lecture n'apparaît qu'avec un délai

C'est normal. Le site du Tribunal administratif fédéral charge la décision au moyen d'un programme après l'ouverture de la page, et l'extension attend cela. Dès que le texte est là, la typographie et les parenthèses suivent en un instant. Lors du passage à une autre décision à l'intérieur du site, la même chose se reproduit. Si le mode lecture reste durablement inactif alors que la décision est affichée, un rechargement de la page aide; si cela se répète, cela mérite un signalement d'erreur.

## Après la mise à jour, mes réglages ont disparu

Dans Chrome, Brave et Edge, le navigateur reconnaît une extension non empaquetée à son dossier. Si la nouvelle version a été décompressée dans un autre dossier et chargée depuis là, elle est considérée comme une nouvelle extension avec un stockage vierge. Remède : supprimer l'ancienne extension, décompresser la nouvelle version dans le dossier précédent et charger celui-ci, ou refaire les réglages une fois. Dès l'approbation dans la boutique, ce problème disparaît, parce que la boutique reconnaît l'extension à son identifiant fixe.

## Dans Firefox, l'extension a disparu après le redémarrage

Firefox ne charge les extensions non signées que comme module complémentaire temporaire, qui disparaît à la fermeture du navigateur, et les réglages sont en général perdus. C'est une caractéristique de Firefox, pas une erreur de l'extension. Jusqu'à l'approbation dans la boutique, l'extension doit être rechargée après chaque démarrage via `about:debugging`; les étapes sont décrites sous [Installation](FR-Installation.md).

## Chrome avertit au démarrage à propos des extensions en mode développeur

Chrome affiche ce message pour toute extension qui ne provient pas du Chrome Web Store. Il ne signifie pas que quelque chose est dangereux, mais seulement que l'extension a été chargée à la main. Le message peut être fermé et disparaît dès que l'extension est installée depuis la boutique.

## Une parenthèse qui n'est pas une citation a été repliée, ou une citation est restée ouverte

Les règles sont décrites sous [Replier les parenthèses](FR-Parentheses.md), et on y trouve aussi comment signaler un cas erroné. Dans l'immédiat, le bouton de dépliage `▸` aide, avec lequel chaque parenthèse s'ouvre individuellement, ou le retrait de la coche de **einfach** (simple), grâce auquel toutes les parenthèses restent ouvertes. Un cas signalé est intégré comme cas de test.

## La police choisie n'a pas l'air différente

Certaines polices ne se distinguent que peu, par exemple Liberation Serif de System Serif, parce que toutes deux ressemblent à Times. La liste déroulante montre chaque police dans sa propre forme; sur Firefox sous macOS, cela ne vaut que pour l'état fermé de la liste. La différence est la plus nette avec Atkinson Hyperlegible, OpenDyslexic et Comic Neue. Si le texte reste inchangé malgré le choix de l'une de ces polices, la case **einschalten** n'a probablement pas été cochée, ou il ne s'agit pas d'une page de décision.

## Avec un arrière-plan sombre, une partie de la page reste blanche

Les champs de saisie, les listes déroulantes et les boutons du site du tribunal restent volontairement clairs, afin qu'ils demeurent reconnaissables et utilisables. Les surlignages jaunes des résultats de recherche conservent également leur couleur. Si, en revanche, une zone plus grande à côté ou en dessous de la décision reste blanche, c'est une erreur qui devrait être signalée, avec indication de l'adresse et du navigateur.

## L'extension fonctionne-t-elle hors ligne?

L'extension elle-même n'a jamais besoin d'une connexion Internet; elle ne télécharge rien après coup, pas même des polices. La page de la décision doit toutefois être chargée depuis le tribunal, ce qui nécessite une connexion, comme pour tout site web. Une page déjà chargée peut ensuite être lue avec l'extension même sans connexion.

## L'extension modifie-t-elle la décision ou le site web du tribunal?

Non. L'extension ne modifie que l'affichage dans votre propre navigateur, et seulement tant que le mode lecture est activé. Le texte n'est ni raccourci ni complété, et le site web du tribunal ne sait rien de l'extension. Détails sous [Confidentialité et sécurité](FR-Confidentialite.md).

## Puis-je imprimer la décision avec les parenthèses repliées?

Lors de l'impression et de l'enregistrement en PDF par la boîte de dialogue d'impression, toutes les parenthèses sont restituées intégralement et les boutons de dépliage sont omis. Une impression est donc toujours complète. La police et le jeu de couleurs sont imprimés avec le texte; pour du noir sur blanc, choisir au préalable l'arrière-plan « Weiss ».

## Pour quelles langues l'extension est-elle conçue?

L'extension fonctionne avec des décisions en allemand, en français et en italien; les règles de repli des parenthèses connaissent les modes de citation des trois langues, et la césure suit la langue de la décision. L'interface elle-même est en allemand.

## L'extension existe-t-elle pour smartphone ou tablette?

Chrome, Brave et Edge sur smartphone ne prennent pas en charge les extensions. Firefox sur Android peut installer des extensions depuis la boutique; bger reader n'y est pas testé et n'y sera disponible qu'après l'approbation dans la boutique. Sur une tablette avec un navigateur de bureau, l'extension devrait fonctionner, mais elle n'y est pas non plus testée.

## Puis-je utiliser l'extension dans Safari?

Non. Safari exige un programme empaqueté spécialement, distribué par Apple; ce n'est pas prévu pour ce projet.

## Mes réglages sont-ils synchronisés entre appareils?

Non. Les réglages se trouvent exclusivement dans le stockage local de l'extension sur l'appareil concerné et ne sont pas synchronisés avec un compte. Sur un second appareil, ils doivent être refaits une fois.

## Comment savoir quelle version est installée?

Sur la page des extensions du navigateur, le numéro de version figure à côté du nom « BGer Reader », dans Chrome après un clic sur « Détails ». La version publiée la plus récente se trouve sur la [page des releases](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases), et le [journal des modifications](https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/CHANGELOG.md) décrit ce qui a changé d'une version à l'autre.

## Comment signaler une erreur ou un souhait?

Par les [Issues](https://github.com/cursorblinkrate-boop/bger-reader-addon/issues) du projet sur GitHub; un compte GitHub gratuit est nécessaire pour cela. Un bon signalement contient l'adresse de la décision concernée, le navigateur avec sa version, la version de l'extension, les réglages concernés et une description de ce qui était attendu et de ce qui s'est produit à la place. Une capture d'écran aide souvent. Les problèmes de sécurité ne doivent pas être signalés publiquement, mais comme décrit sous [Confidentialité et sécurité](FR-Confidentialite.md).

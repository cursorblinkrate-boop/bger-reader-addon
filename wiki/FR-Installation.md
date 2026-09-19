[Deutsch](DE-Installation.md) · [English](EN-Installation.md) · **Français** · [Italiano](IT-Installazione.md)

Cette page décrit comment télécharger bger reader et le configurer dans chacun des navigateurs. Le chemin par le paquet de la version (release) est un peu plus long qu'un clic dans la boutique d'extensions, mais tout à fait faisable; il reste le chemin standard jusqu'à ce que l'extension soit approuvée dans les boutiques (Chrome Web Store, Mozilla Add-ons).

## Prérequis

L'extension fonctionne dans **Chrome, Brave et Edge à partir de la version 121** ainsi que dans **Firefox à partir de la version 140**. Les navigateurs plus anciens refusent l'installation. La version de votre navigateur figure dans le menu sous « À propos de Chrome » ou « À propos de Firefox »; les navigateurs actuels dépassent depuis longtemps ces versions minimales. Les navigateurs pour smartphone ne sont pas pris en charge, voir [Questions fréquentes](FR-FAQ.md).

## Télécharger le paquet

Toutes les versions se trouvent sur la [page des releases](https://github.com/cursorblinkrate-boop/bger-reader-addon/releases) du projet. L'entrée la plus haute est la version la plus récente. Sous « Assets » s'y trouvent deux fichiers : le paquet proprement dit, `bger-reader-<Version>.zip` (environ 250 Ko), et, à côté, un petit fichier portant l'extension `.sha256`, qui contient une somme de contrôle (voir plus bas). Le paquet contient exclusivement l'extension elle-même, sans fichiers de test ni outils.

Utilisez toujours le ZIP de la page des releases et non le bouton vert « Code → Download ZIP » sur la page d'accueil du dépôt. Celui-ci télécharge l'ensemble du projet avec les tests et les outils, et le fichier porte toujours le même nom, de sorte que la version n'est pas reconnaissable.

Après le téléchargement, le ZIP est décompressé. Sous Windows, un clic droit sur le fichier puis « Extraire tout… » suffit; sous macOS, un double clic. Il en résulte un dossier qui contient entre autres le fichier `manifest.json` et les sous-dossiers `fonts` et `icons`. Ce dossier doit se trouver à un emplacement où il peut rester durablement, par exemple dans le dossier Documents, car Chrome, Brave et Edge lisent l'extension directement depuis ce dossier à chaque démarrage. S'il est déplacé ou supprimé, l'extension disparaît.

## Chrome, Brave et Edge

Les trois navigateurs partagent la même technique et ne se distinguent que par l'adresse de la page des extensions.

1. Ouvrir la page des extensions : saisir `chrome://extensions` dans Chrome, `brave://extensions` dans Brave ou `edge://extensions` dans Edge dans la barre d'adresse et appuyer sur Entrée.
2. Activer le **Mode développeur**. Dans Chrome et Brave, c'est un interrupteur en haut à droite; dans Edge, un interrupteur dans la colonne de gauche.
3. Cliquer sur **Charger l'extension non empaquetée**.
4. Sélectionner le dossier décompressé, c'est-à-dire le dossier dans lequel se trouve le fichier `manifest.json`, et confirmer.
5. bger reader apparaît maintenant dans la liste des extensions et est activé.

Après un redémarrage, Chrome affiche parfois un avertissement indiquant que des extensions s'exécutent en mode développeur. C'est le cas pour toutes les extensions qui ne proviennent pas de la boutique, et l'avertissement se ferme d'un clic. Pour que l'icône de l'extension reste visible en permanence dans la barre d'outils, cliquez sur l'icône en forme de pièce de puzzle à droite de la barre d'adresse, puis sur l'épingle à côté de « BGer Reader »; un clic sur l'icône ouvrira ensuite les réglages dans une fenêtre séparée.

## Firefox

Firefox n'installe durablement que les extensions signées par Mozilla, ce qui se fait avec l'approbation dans la boutique. D'ici là, bger reader peut être chargé dans Firefox comme **module complémentaire temporaire**. Cela fonctionne pleinement, mais seulement jusqu'à la prochaine fermeture du navigateur; ensuite, l'extension doit être rechargée, et les réglages enregistrés sont en général perdus.

1. Saisir `about:debugging#/runtime/this-firefox` dans la barre d'adresse et appuyer sur Entrée.
2. Cliquer sur **Charger un module complémentaire temporaire…**.
3. Sélectionner le fichier téléchargé `bger-reader-<Version>.zip`. Avec Firefox, il n'est pas nécessaire de décompresser; on peut aussi choisir le fichier `manifest.json` du dossier décompressé.
4. bger reader apparaît dans la liste des extensions temporaires.

Les personnes qui utilisent la Developer Edition ou Nightly de Firefox peuvent désactiver l'obligation de signature dans `about:config` en mettant le paramètre `xpinstall.signatures.required` sur `false`, puis installer durablement le ZIP via `about:addons` et « Installer un module depuis un fichier… ». Ce n'est pas possible avec la version normale de Firefox. Dès que l'extension sera approuvée dans la boutique, le lien direct sera ajouté ici.

## Vérifier la somme de contrôle (facultatif)

À côté de chaque paquet se trouve, sur la page des releases, un fichier `bger-reader-<Version>.zip.sha256`. Il contient une longue chaîne de caractères, la somme de contrôle SHA-256. Cette chaîne est aussi unique pour le fichier qu'une empreinte digitale : qui calcule soi-même la somme de contrôle du paquet téléchargé et la compare à celle qui est publiée sait avec certitude, en cas de concordance, que le fichier est arrivé intact et complet. Le paquet est construit dans la chaîne de livraison automatique du projet directement à partir du code source testé, et la somme de contrôle y est produite également.

Le calcul se fait dans un terminal ou dans PowerShell, dans le dossier où se trouve le ZIP :

```
# macOS
shasum -a 256 bger-reader-0.9.1.zip

# Linux
sha256sum bger-reader-0.9.1.zip

# Windows (PowerShell)
Get-FileHash .\bger-reader-0.9.1.zip -Algorithm SHA256
```

La chaîne affichée doit correspondre au contenu du fichier `.sha256`; majuscules et minuscules n'ont pas d'importance. Cette étape est facultative et n'est pas nécessaire au fonctionnement.

## Mettre à jour

Une nouvelle version est publiée sur la page des releases; le navigateur ne la signale pas de lui-même tant que l'extension ne provient pas de la boutique. Pour la mise à jour dans Chrome, Brave et Edge, le nouveau ZIP est téléchargé et décompressé **dans le même dossier** qu'auparavant, de sorte que les anciens fichiers sont remplacés. Ensuite, sur la page des extensions, il suffit d'un clic sur le symbole d'actualisation (flèche circulaire) à côté de bger reader ou sur « Mettre à jour » en haut. Le même dossier est important : le navigateur reconnaît une extension non empaquetée à son emplacement. Si la nouvelle version est chargée depuis un autre dossier, elle est considérée comme une nouvelle extension, et les réglages enregistrés repartent des valeurs par défaut.

Dans Firefox, le module complémentaire temporaire est de toute façon rechargé à chaque démarrage; il suffit d'y choisir le nouveau ZIP.

## Supprimer

Dans Chrome, Brave et Edge, l'extension est supprimée sur la page des extensions avec « Supprimer »; ensuite, le dossier décompressé peut aussi être supprimé. Les réglages enregistrés sont supprimés avec l'extension. Dans Firefox, un module complémentaire temporaire disparaît avec la fermeture du navigateur ou via « Supprimer » sur la page `about:debugging`.

Les sites des tribunaux eux-mêmes ne sont pas modifiés par l'installation ni par la suppression; l'extension agit exclusivement sur l'affichage dans votre propre navigateur.

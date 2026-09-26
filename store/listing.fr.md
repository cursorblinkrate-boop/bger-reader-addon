# Fiche du store – Français

Source pour le Chrome Web Store (langue de fiche « Français »), Microsoft Edge
Add-ons (store listing « Français ») et Firefox Add-ons / AMO (locale fr).
Le nom et la description courte se trouvent aussi dans le paquet
(`extension/_locales/fr/messages.json`) ; garder les deux identiques.
Les champs non localisés des tableaux de bord (Single purpose, justification
des autorisations, notes aux réviseurs) sont dans `listing.en.md` /
`listing.de.md` et `reviewer-notes.md`. Procédure : `STORE-UPDATE.md`.

## Nom (manifeste, 45 caractères ; Chrome recommande ≤ 45, AMO autorise ≤ 50)

BGer Reader – Tribunal fédéral & TAF lisibles

## Description courte (manifeste, 126 caractères ; Chrome/Edge ≤ 132, résumé AMO ≤ 250)

Arrêts du Tribunal fédéral accessibles : police, espacements, couleurs, références repliées. bger.ch et TAF. 100 % hors ligne.

## Description détaillée (Chrome, AMO, Edge ; Edge exige 250 à 10 000 caractères)

BGer Reader rend les arrêts du Tribunal fédéral sur bger.ch (search.bger.ch, relevancy.bger.ch) et les arrêts du Tribunal administratif fédéral (TAF, bvger.weblaw.ch) plus faciles à lire. L'extension est une aide à la lecture et à l'accessibilité pour les personnes atteintes de dyslexie, de dyscalculie ou de malvoyance – et pour toutes celles et ceux qui lisent longuement la jurisprudence suisse à l'écran : pendant les études de droit, dans les études d'avocats, dans les tribunaux et dans l'administration.

Ce que fait l'extension

• Police : neuf polices, dont Atkinson Hyperlegible et Luciole (conçues pour les personnes malvoyantes) et OpenDyslexic (conçue pour les personnes dyslexiques) ; taille de 6 à 50, graisse normale ou grasse.
• Espacements et mise en page : interligne, espacement des paragraphes, des lettres et des mots, longueur des lignes, largeur du texte, césure, alignement, une à trois colonnes.
• Fond : blanc, sépia, mode sombre, contraste élevé et un mode nuit rougeâtre.
• Références repliées : les parenthèses contenant des références de jurisprudence (ATF, numéros de dossier, CourEDH) et de doctrine sont repliées derrière une petite flèche pour ne pas interrompre sans cesse le raisonnement. Les renvois aux lois et le texte de l'arrêt restent ouverts ; chaque parenthèse s'ouvre d'un clic. En cas de dyscalculie, c'est une aide particulière : les longues suites de chiffres des références disparaissent du flux de lecture.
• Commandes : un panneau de réglages directement sur la page (bouton rose en haut à droite) ou en grand au milieu de l'arrêt (clic sur l'icône de la barre d'outils), entièrement utilisable au clavier. Interface en français, allemand, italien et anglais.
• Impression et PDF : noir sur blanc dans la police choisie ; les parenthèses repliées restent repliées.
• Le mode lecture et les réglages sont enregistrés automatiquement et s'appliquent à toutes les pages prises en charge des tribunaux suisses.

Protection des données

BGer Reader fonctionne à 100 % hors ligne. L'extension n'envoie aucune donnée, ne télécharge rien, ne contient ni publicité ni statistiques. Sa seule autorisation est le stockage local de ses propres réglages. Le code source est open source (licence MIT) et public.

Indépendance

BGer Reader est un projet indépendant, sans lien avec le Tribunal fédéral, le Tribunal administratif fédéral ou Weblaw. L'extension ne modifie que l'affichage dans votre navigateur ; le texte de l'arrêt reste inchangé et complet.

Assistance

Questions et signalements : https://github.com/cursorblinkrate-boop/bger-reader-addon/issues ou bger.reader@gmail.com

## Catégorie

- Chrome Web Store : Accessibilité
- Edge Add-ons : Accessibility
- AMO : Apparence (pas de catégorie « Accessibilité » ; « Autres » n'est pas combinable). Résumé AMO = description courte sans le domaine (AMO refuse les URL dans le résumé) : « bger.ch et TAF » devient « Tribunal fédéral et TAF » (`amo-metadata.js`).

## Mots-clés Edge (non publics ; max. 7 termes, 21 mots au total, ≤ 30 caractères chacun)

Tribunal fédéral · ATF · arrêts · accessibilité · dyslexie · mode lecture · jurisprudence suisse

## Adresses

- Site web : https://github.com/cursorblinkrate-boop/bger-reader-addon
- Assistance : https://github.com/cursorblinkrate-boop/bger-reader-addon/issues · bger.reader@gmail.com
- Politique de confidentialité : https://github.com/cursorblinkrate-boop/bger-reader-addon/blob/main/PRIVACY.md

## Légendes des images (ordre pour la fiche française ; images dans `screenshots/`)

1. `90-franzoesisch-regeste.png` – Un arrêt en français (ATF 145 I 207) sur les pages françaises de bger.ch, en OpenDyslexic.
2. `02-panel.png` – Le panneau de réglages sur la page de l'arrêt : activer, taille, police, fond, largeur, « simplifier » (replier les références).
3. `41-klammer-aufgeklappt.png` – Références repliées, une parenthèse ouverte d'un clic ; les renvois aux lois restent ouverts.
4. `23-hintergrund-nacht.png` – Fond nuit : rougeâtre et assombri pour lire le soir.
5. `06-dialog-mittig.png` – Clic sur l'icône de la barre d'outils : les mêmes réglages en grand au milieu, l'arrêt reste visible (ici sépia).
6. `03-panel-erweitert.png` (Edge, AMO) – Réglages avancés : graisse, interligne, paragraphes, lettres, mots, longueur de ligne, césure, alignement, colonnes.

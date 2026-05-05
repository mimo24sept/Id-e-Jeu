# Poker Survivor Prototype

Base jouable pour un survivant automatique façon Vampire Survivors / Brotato avec une couche poker entre les vagues.

## Lancer

Ouvre `index.html` dans un navigateur moderne.

## Contrôles

- Au lancement: saisis un pseudo, connecte-toi, puis lance une partie avec ce joueur.
- Le système de sélection de personnage est prêt: quand des personnages seront définis, 3 choix aléatoires seront proposés au début d'une run.
- `WASD` ou flèches: déplacer le personnage
- Les armes ciblent automatiquement l'ennemi le plus proche
- Entre deux vagues: vendre des cartes, acheter dans les 6 offres aléatoires, relancer la boutique, ouvrir les packs trouvés, acheter des armes, puis lancer la vague suivante

## Système actuel

- Les vagues sont infinies, durent un temps défini, et font apparaître des ennemis en continu pendant ce timer.
- La progression vise des shops plus actifs: vagues plus courtes, revenu naturel plus généreux, et assez d'or pour acheter plusieurs cartes avec quelques relances sans build économie.
- L'interface utilise une direction brutaliste: gros contours, ombres franches, moins de texte, et rareté d'arme affichée directement par la couleur de l'encadré.
- La couleur d'accent de l'UI suit la couleur dominante de la main: Coeur rouge, Carreau orange, Pique gris, Trèfle bleu.
- Les prix de boutique scalent avec la vague: cartes, packs, malédictions, modificateurs, slots et armes deviennent plus chers au fil de la run.
- Les ennemis peuvent être des chasseurs, des tireurs ou des brutes.
- La main contient 5 cartes et génère une vraie évaluation poker: paire, double paire, brelan, quinte, couleur, full, carré, quinte flush.
- Chaque combinaison de poker donne un bonus de dégâts dédié, de +12% pour une paire jusqu'à +185% pour une quinte flush.
- Chaque carte donne aussi un bonus selon sa couleur et son rang: 10 de Pique = +10 dégâts, 3 de Carreau = +3% or, 7 de Coeur = +7 PV. Valet/Dame/Roi/As appliquent des multiplicateurs x2/x3/x4/x5 sur leur stat.
- Si la main dépasse 5 cartes, le jeu évalue la meilleure combinaison de 5 cartes et peut détecter des mains spéciales comme Suite longue, Grande couleur, Flush royal et Couleur parfaite.
- Easter egg: réunir les 52 cartes uniques déclenche le mode Dieu tout puissant, puis la page tente de se fermer après 10 secondes.
- La boutique propose 6 offres aléatoires: cartes simples, cartes avec malédiction, packs, malédictions ciblées, bonus permanents et emplacements de carte supplémentaires.
- Les cartes et packs ne peuvent plus être achetés si tous les emplacements de main sont pris; il faut vendre une carte ou gagner un slot.
- Les malédictions sont des effets positifs à mettre sur les cartes: dégâts, vitesse d'attaque, vie, or, et très rarement +1 emplacement de carte.
- Les packs apparaissent dans ces 6 offres et révèlent 4 ou 6 cartes. Il existe des packs standards et des packs spécialisés Coeur, Pique, Trèfle et Carreau.
- Les armes apparaissent dans les 6 offres de boutique, avec au moins une arme garantie par boutique.
- Survoler une arme en boutique affiche un comparatif avec les armes équipées.
- Le joueur ne peut équiper que 2 armes en même temps. Acheter une troisième arme demande quelle arme jeter.
- Les armes ont un type, une couleur et un grade: mitraillette classique, Machine Gun, Uzi, Sniper, Katana, Fusil à pompe; grades verte, bleue, violette et jaune.
- Une arme a une couleur de scaling et un type de scaling séparés. Exemple: une arme Pique peut compter tes Piques mais donner de la vie, de la vitesse, des dégâts, du critique ou des revenus selon son type.
- Les meilleurs grades peuvent ajouter des modificateurs comme explosion, brûlure, stun ou bonus d'or.
- Les armes ont aussi un niveau d'objet basé sur la vague et des statistiques rollées. Une arme rare trouvée tôt finit donc par être dépassée par une arme commune trouvée bien plus tard.
- Chaque couleur donne une identité:
  - Pique: dégâts bruts
  - Carreau: argent et dégâts basés sur l'argent
  - Trèfle: vitesse d'attaque
  - Coeur: vie maximale et régénération
- Les armes achetables ont des synergies avec ces couleurs.

## Prochaines grosses briques

- Choix manuel de la carte à remplacer.
- Decks, reliques et déblocages persistants.
- Boss toutes les X vagues.
- Armes plus typées: zones, ricochets, projectiles perforants, invocations.
- Carte plus vivante avec obstacles, aimants d'argent et événements rares.

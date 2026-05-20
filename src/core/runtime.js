const keys = new Set();
const touchMovement = { x: 0, y: 0, pointerId: null };
let state;
let lastTime = performance.now();
let animationId = 0;
let cameraShake = 0;
let nextId = 0;
let uiRefresh = 0;
let godCloseTimeout = 0;
let godCountdownInterval = 0;
let connectedPlayerName = localStorage.getItem("pokerSurvivorName") || "";
const TUTORIAL_STORAGE_KEY = "pokerSurvivorInteractiveTutorialDone";
const TUTORIAL_STEPS_STORAGE_KEY = "pokerSurvivorInteractiveTutorialSteps";
let keyboardLayout = "qwerty";
let tutorialQueue = [];
let activeTutorialStep = null;
let tutorialSeenSteps = new Set(JSON.parse(localStorage.getItem(TUTORIAL_STEPS_STORAGE_KEY) || "[]"));

const TUTORIAL_STEPS = {
  // === MENU ===
  menuConnect: {
    selector: "#playerNameInput",
    kicker: "Bienvenue",
    title: "Entre ton pseudo",
    action: "ÉCRIS",
    text: "Rien à créer — ton nom sauvegarde ta progression localement.",
  },
  menuPlay: {
    selector: "#hubActions",
    kicker: "Prêt ?",
    title: "Lance ta première run",
    action: "CLIQUE",
    text: "Chaque run repart de zéro. Ce que tu gardes entre les runs, ce sont les fragments.",
  },
  menuFragments: {
    selector: ".meta-panel",
    kicker: "Progression permanente",
    title: "Les fragments durent",
    action: "REGARDE",
    text: "Tu gagnes des fragments en survivant. Ils améliorent des cartes qui renforcent toutes tes futures parties — même si tu meurs vague 1.",
  },

  // === PERSONNAGE ===
  characterPick: {
    selector: "#characterChoices",
    kicker: "Modificateur de run",
    title: "Un personnage = une règle changée",
    action: "CHOISIS",
    text: "Shadow est le plus direct pour commencer. Les autres personnages changent comment les couleurs ou l'or fonctionnent.",
  },

  // === VAGUE ===
  waveStart: {
    selector: ".panel-right",
    kicker: "Vague 1",
    title: "Tes armes tirent seules",
    action: "BOUGE",
    text: "Tu n'appuies sur aucune touche pour tirer. WASD ou le joystick pour te déplacer — ton seul job, c'est d'esquiver.",
  },
  firstCrate: {
    selector: "#game",
    kicker: "Caisse !",
    title: "Marche dessus",
    action: "RAMASSE",
    text: "Ces caisses dorées apparaissent pendant les vagues. Passe dessus pour gagner un pack de cartes gratuit — ouvert au shop après la vague.",
  },

  // === ÉVÉNEMENT ===
  eventWave: {
    selector: "#enemyCount",
    kicker: "Vague spéciale",
    title: "Complète l'objectif",
    action: "EXECUTE",
    text: "Pas de timer — les ennemis spawnen en boucle jusqu'à ce que l'objectif soit rempli. Lis le HUD en haut pour voir ce qu'il faut faire.",
  },

  // === SHOP ===
  shopIntro: {
    selector: ".shop-wallet",
    kicker: "Entre deux vagues",
    title: "Vague passée — dépense bien",
    action: "REGARDE",
    text: "L'or que tu gagnes en tuant achète des cartes et des armes. Plus ton build est fort, plus les vagues suivantes sont faciles.",
  },
  shopBuild: {
    selector: "#shopSlots",
    kicker: "Le marché",
    title: "Cartes, packs, armes",
    action: "ACHÈTE",
    text: "Achète des cartes pour ta main de poker, des packs pour en obtenir plusieurs d'un coup, ou des armes pour changer ton style de jeu. Survole pour voir les détails avant d'acheter.",
  },
  shopSell: {
    selector: "#shopHand",
    kicker: "Ta main",
    title: "5 cartes max — vends ce qui ne sert plus",
    action: "VENDS",
    text: "Clique une carte ici pour la vendre contre de l'or. Garde les cartes qui forment des combos ou qui se regroupent par couleur.",
  },
  shopReroll: {
    selector: "#rerollShop",
    kicker: "Pas convaincu ?",
    title: "Relance le marché",
    action: "RELANCE",
    text: "Paye pour voir de nouvelles offres. Le coût augmente à chaque relance — garde-en pour les shops décisifs.",
  },

  // === POKER & COULEURS ===
  pokerCombo: {
    selector: ".panel-left",
    kicker: "Main de poker",
    title: "Tes cartes forment un combo",
    action: "OBSERVE",
    text: "En haut à gauche : le nom de ta main de poker et son bonus de dégâts. Paire = +30%. Brelan = +60%. Quinte flush = +300%. Construis vers la meilleure combinaison possible.",
  },
  suitEffect: {
    selector: ".panel-left",
    kicker: "Les couleurs comptent",
    title: "Chaque couleur amplifie un stat",
    action: "ACCUMULE",
    text: "♠ Pique → dégâts bruts. ♣ Trèfle → vitesse d'attaque. ♦ Carreau → or gagné. ♥ Cœur → PV max et régén. Plus tu en as de la même couleur, plus l'effet est fort.",
  },

  // === DÉCISION DE RUN ===
  runDecision: {
    selector: "#runDecision",
    kicker: "Checkpoint",
    title: "Encaisser ou doubler ?",
    action: "DÉCIDE",
    text: "Encaisser maintenant sécurise tes fragments définitivement. Doubler les multiplie — mais si tu meurs avant le prochain checkpoint, tu n'en gardes que 20%. À toi de juger ton build.",
  },

  // === TALENT ===
  menuTalents: {
    selector: "#openTalentTree",
    kicker: "Fragments dépensés",
    title: "L'arbre de talents",
    action: "OUVRE",
    text: "Tes fragments s'investissent ici en bonus permanents : dégâts, PV, cadence, or. Chaque nœud débloqué renforce toutes tes futures parties.",
  },

  // === PACKS & MALÉDICTIONS ===
  packChoice: {
    selector: "#packOffer",
    kicker: "Pack ouvert",
    title: "Choisis ce qui complète ta main",
    action: "PRENDS",
    text: "Regarde ta main en haut à gauche. Prends la carte qui forme le meilleur combo ou renforce ta couleur dominante. Tu peux aussi vendre ou passer.",
  },
  curseChoice: {
    selector: "#packOffer",
    kicker: "Malédiction",
    title: "Risque calculé",
    action: "APPLIQUE",
    text: "Une malédiction affaiblit une carte en échange d'un bonus amplifié. Applique-la sur une carte que tu n'utilises presque plus — ou sur ta meilleure pour les grands bonus.",
  },
};



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
  menuName: {
    selector: "#playerNameInput",
    kicker: "Connexion",
    title: "Choisis ton pseudo",
    action: "ECRIS ICI",
    text: "Ton nom local sert aux scores et a la progression.",
  },
  menuLaunch: {
    selector: "#hubActions",
    kicker: "Menu",
    title: "Lance ta run",
    action: "CLIQUE",
    text: "Connecte-toi, puis lance une partie.",
  },
  menuMeta: {
    selector: ".meta-panel",
    kicker: "Progression",
    title: "Les fragments restent",
    action: "AMELIORE",
    text: "Les fragments achetent des upgrades permanents.",
  },
  menuCollection: {
    selector: "#openMetaCollection",
    kicker: "Collection",
    title: "Regarde tes cartes",
    action: "OUVRE",
    text: "Contours = couleur. Segments = niveau.",
  },
  characterPick: {
    selector: "#characterChoices",
    kicker: "Personnage",
    title: "Choisis ton modificateur",
    action: "CHOISIS",
    text: "Chaque personnage change la valeur des couleurs.",
  },
  waveControls: {
    selector: "#controlsTip",
    kicker: "Vague",
    title: "Bouge en continu",
    action: "ESQUIVE",
    text: "Clavier ou joystick tactile: evite le contact.",
  },
  handPanel: {
    selector: ".panel-left",
    kicker: "Main",
    title: "Tu pars sans carte",
    action: "REMPLIS",
    text: "Ta main vide devient ton build.",
  },
  pokerHands: {
    selector: ".panel-left",
    kicker: "Poker",
    title: "Cherche les combinaisons",
    action: "COMBINE",
    text: "Paires, quintes, couleurs et mains speciales augmentent tes degats.",
  },
  cardColors: {
    selector: ".panel-left",
    kicker: "Couleurs",
    title: "Chaque couleur a son role",
    action: "COMPARE",
    text: "Pique tape fort, Carreau genere de l'or, Trefle accelere, Coeur soigne. Les figures ameliorees ajoutent des effets uniques.",
  },
  weaponPanel: {
    selector: ".panel-right",
    kicker: "Armes",
    title: "Tes armes tirent seules",
    action: "SURVEILLE",
    text: "Tu en portes deux. Remplace les mauvais rolls.",
  },
  crateField: {
    selector: "#game",
    kicker: "Terrain",
    title: "Ramasse les caisses",
    action: "RAMASSE",
    text: "Les caisses donnent des packs gratuits.",
  },
  advancedCourts: {
    selector: ".panel-left",
    kicker: "Figures",
    title: "Les tetes changent le gameplay",
    action: "OBSERVE",
    text: "Figures ameliorees: taxe, ancrage, auras, rebonds.",
  },
  shopGold: {
    selector: ".shop-wallet",
    kicker: "Boutique",
    title: "Surveille ton or",
    action: "COMPTE",
    text: "Ton or finance cartes, armes, packs et rerolls.",
  },
  shopHand: {
    selector: "#shopHand",
    kicker: "Main",
    title: "Vends pour faire de la place",
    action: "VENDS",
    text: "Clique une carte ici pour liberer un slot.",
  },
  shopMarket: {
    selector: "#shopSlots",
    kicker: "Marche",
    title: "Six offres aleatoires",
    action: "ACHETE",
    text: "Cartes, packs, armes et maledictions tournent ici.",
  },
  shopWeapons: {
    selector: "#shopSlots",
    kicker: "Armes",
    title: "La rarete fixe le prix",
    action: "COMPARE",
    text: "Survole une arme: tes armes equipees apparaissent a cote.",
  },
  shopLocks: {
    selector: "#shopSlots",
    kicker: "Lock",
    title: "Garde une bonne offre",
    action: "LOCK",
    text: "Garde une offre si tu veux l'acheter plus tard.",
  },
  shopStart: {
    selector: ".shop-actions",
    kicker: "Suite",
    title: "Relance ou repars",
    action: "DECIDE",
    text: "Relance le marche ou lance la vague suivante.",
  },
  packChoice: {
    selector: "#packOffer",
    kicker: "Pack",
    title: "Choisis ou passe",
    action: "PRENDS",
    text: "Prends une carte, vends pour faire place, ou passe.",
  },
  curseChoice: {
    selector: "#packOffer",
    kicker: "Malediction",
    title: "Applique sur une carte",
    action: "APPLIQUE",
    text: "Choisis un effet, puis cible une carte non maudite.",
  },
};



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
    text: "C'est le nom de ta run locale. Ecris-le, puis connecte-toi pour pouvoir lancer une partie.",
  },
  menuLaunch: {
    selector: ".menu-actions",
    kicker: "Menu",
    title: "Lance ta run",
    text: "Une fois connecte, le bouton Lancer partie t'envoie au choix de personnage.",
  },
  characterPick: {
    selector: "#characterChoices",
    kicker: "Personnage",
    title: "Choisis ton modificateur",
    text: "Trois personnages sont tires au hasard. Chaque choix change la puissance des couleurs de tes cartes.",
  },
  waveControls: {
    selector: "#controlsTip",
    kicker: "Vague",
    title: "Bouge en continu",
    text: "Sur mobile, glisse le joystick tactile. Sur clavier, WASD, ZQSD et les fleches marchent pour esquiver.",
  },
  handPanel: {
    selector: ".panel-left",
    kicker: "Main",
    title: "Tes cartes font ton build",
    text: "Chaque carte donne une stat. La meilleure main de poker ajoute un gros bonus de degats.",
  },
  weaponPanel: {
    selector: ".panel-right",
    kicker: "Armes",
    title: "Tes armes tirent seules",
    text: "Elles ciblent automatiquement. Tu en gardes deux, alors cherche les meilleurs rolls au shop.",
  },
  crateField: {
    selector: "#game",
    kicker: "Terrain",
    title: "Ramasse les caisses",
    text: "Pendant les vagues, des caisses apparaissent sur la map. Elles donnent des packs gratuits en boutique.",
  },
  shopGold: {
    selector: ".shop-wallet",
    kicker: "Boutique",
    title: "Surveille ton or",
    text: "L'or disponible et ton multiplicateur sont ici. C'est ton carburant pour cartes, armes et rerolls.",
  },
  shopHand: {
    selector: "#shopHand",
    kicker: "Main",
    title: "Vends pour faire de la place",
    text: "Clique une carte ici pour la vendre. Tu peux aussi vendre pendant qu'un pack est ouvert.",
  },
  shopMarket: {
    selector: "#shopSlots",
    kicker: "Marche",
    title: "Six offres aleatoires",
    text: "Cartes, packs, armes, maledictions et bonus tournent ici. Tu peux lock une offre pour la garder.",
  },
  shopStart: {
    selector: ".shop-actions",
    kicker: "Suite",
    title: "Relance ou repars",
    text: "Reroll si le marche est mauvais, puis lance la vague suivante quand ton build te plait.",
  },
  packChoice: {
    selector: "#packOffer",
    kicker: "Pack",
    title: "Choisis ou passe",
    text: "Un pack revele plusieurs cartes. Prends une carte, vends d'abord si la main est pleine, ou passe.",
  },
};

const FULL_DECK_SIZE = 52;

const SUITS = {
  spades: { symbol: "♠", name: "Pique", stat: "Dégâts", color: "#d7dbe4" },
  diamonds: { symbol: "♦", name: "Carreau", stat: "Or", color: "#58b7e9" },
  clubs: { symbol: "♣", name: "Trèfle", stat: "Cadence", color: "#71d58a" },
  hearts: { symbol: "♥", name: "Coeur", stat: "PV + regen", color: "#e8526d" },
};

const UI_ACCENTS = {
  hearts: "#e8526d",
  diamonds: "#ff8a1f",
  spades: "#9da3ad",
  clubs: "#0d67ff",
};

function suitAccent(suit) {
  return UI_ACCENTS[suit] || SUITS[suit]?.color || UI_ACCENTS.clubs;
}

const RANKS = [
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8", value: 8 },
  { label: "9", value: 9 },
  { label: "10", value: 10 },
  { label: "J", value: 11 },
  { label: "Q", value: 12 },
  { label: "K", value: 13 },
  { label: "A", value: 14 },
];

const CARD_META_EFFECTS = {
  revolution: {
    name: "Révolution",
    badge: "R",
    desc: "Booste les autres cartes 2 à 6 en main.",
  },
  stipend: {
    name: "Prime",
    badge: "P",
    desc: "+3 or fixe par niveau à la fin de chaque vague.",
  },
  pacification: {
    name: "Pacification",
    badge: "M",
    desc: "-2.5% monstres par niveau pendant les vagues.",
  },
  bargaining: {
    name: "Marchandage",
    badge: "$",
    desc: "-3% coût des packs de cartes par niveau.",
  },
  legacy: {
    name: "Héritage",
    badge: "F",
    desc: "+5% fragments de fin de run par niveau.",
  },
  diamondJack: {
    name: "Délit d'initié",
    badge: "J$",
    desc: "Mange 20% de ton argent au début de vague et le convertit en stat aléatoire.",
  },
  diamondQueen: {
    name: "Garde royale",
    badge: "Q$",
    desc: "Mange 20% de ton argent au début de vague et invoque des gardes du corps.",
  },
  diamondKing: {
    name: "Impôt royal",
    badge: "K$",
    desc: "Multiplie le bonus d'or du roi, mais mange 50% de ton argent au début de vague.",
  },
  diamondAce: {
    name: "Paradis fiscal",
    badge: "A$",
    desc: "Divise par deux l'argent mangé par les figures de carreau.",
  },
  spadeJack: {
    name: "Posture vive",
    badge: "J♠",
    desc: "Augmente la vitesse d'attaque quand tu restes immobile.",
  },
  spadeQueen: {
    name: "Forteresse",
    badge: "Q♠",
    desc: "Augmente les PV et la regen quand tu restes immobile.",
  },
  spadeKing: {
    name: "Ligne de tir",
    badge: "K♠",
    desc: "Augmente les dégâts et la portée quand tu restes immobile.",
  },
  spadeAce: {
    name: "Ancrage absolu",
    badge: "A♠",
    desc: "Renforce les effets immobiles des figures de pique.",
  },
  heartJack: {
    name: "Aura lourde",
    badge: "J♥",
    desc: "Crée une zone qui ralentit les ennemis et les projectiles.",
  },
  heartQueen: {
    name: "Coeur ardent",
    badge: "Q♥",
    desc: "Crée une zone qui inflige des dégâts croissants basés sur tes PV max.",
  },
  heartKing: {
    name: "Chaînes vitales",
    badge: "K♥",
    desc: "Crée une zone qui vole la vie des ennemis en continu, mais les accélère.",
  },
  heartAce: {
    name: "Expansion",
    badge: "A♥",
    desc: "Augmente la taille de toutes les zones de coeur.",
  },
  clubJack: {
    name: "Ricochet léger",
    badge: "J♣",
    desc: "+1 rebond de balle. Après chaque rebond, la balle ralentit.",
  },
  clubQueen: {
    name: "Ricochet brisé",
    badge: "Q♣",
    desc: "+2 rebonds de balle. Après chaque rebond, les dégâts baissent.",
  },
  clubKing: {
    name: "Ricochet sauvage",
    badge: "K♣",
    desc: "+3 rebonds de balle. Après chaque rebond, la précision baisse.",
  },
  clubAce: {
    name: "Carambolage",
    badge: "A♣",
    desc: "Double les rebonds donnés par les figures de trèfle.",
  },
};

const CHARACTER_DEFS = [
  {
    id: "shadow",
    name: "L'ombre",
    title: "Noir miroir",
    desc: "Pique et Trèfle x2. Coeur et Carreau x0.5.",
    cardEffectMultipliers: {
      spades: 2,
      clubs: 2,
      hearts: 0.5,
      diamonds: 0.5,
    },
  },
  {
    id: "vampire",
    name: "Vampire",
    title: "Sang riche",
    desc: "Coeur et Carreau x2. Pique et Trèfle x0.5.",
    cardEffectMultipliers: {
      hearts: 2,
      diamonds: 2,
      spades: 0.5,
      clubs: 0.5,
    },
  },
  {
    id: "expert-comptable",
    name: "Expert comptable",
    title: "Audit brutal",
    desc: "Carreau x3. Pique, Trèfle et Coeur x0.33.",
    cardEffectMultipliers: {
      diamonds: 3,
      spades: 1 / 3,
      clubs: 1 / 3,
      hearts: 1 / 3,
    },
  },
  {
    id: "ange-blanc",
    name: "Ange Blanc",
    title: "Grâce clinique",
    desc: "Coeur x3. Pique, Trèfle et Carreau x0.33.",
    cardEffectMultipliers: {
      hearts: 3,
      spades: 1 / 3,
      clubs: 1 / 3,
      diamonds: 1 / 3,
    },
  },
  {
    id: "gachette-folle",
    name: "Gâchette folle",
    title: "Cadence sale",
    desc: "Trèfle x3. Pique, Coeur et Carreau x0.33.",
    cardEffectMultipliers: {
      clubs: 3,
      spades: 1 / 3,
      hearts: 1 / 3,
      diamonds: 1 / 3,
    },
  },
  {
    id: "bazooka",
    name: "Bazooka",
    title: "Dégâts purs",
    desc: "Pique x3. Trèfle, Coeur et Carreau x0.33.",
    cardEffectMultipliers: {
      spades: 3,
      clubs: 1 / 3,
      hearts: 1 / 3,
      diamonds: 1 / 3,
    },
  },
  {
    id: "gigachad",
    name: "GigaCHAD",
    title: "Late bloomer",
    desc: "Toutes les couleurs x0.5 jusqu'à la vague 10, puis x4.",
    getCardEffectMultiplier(state) {
      return state.wave >= 10 ? 4 : 0.5;
    },
  },
  {
    id: "time-breaker",
    name: "Time Breaker",
    title: "Scaling pur",
    desc: "Toutes les couleurs commencent à x0.1 et gagnent +0.1 par vague.",
    getCardEffectMultiplier(state) {
      return Math.max(0.1, state.wave * 0.1);
    },
  },
];

const CURSES = [
  {
    id: "curse-damage",
    name: "Malédiction de dégâts",
    desc: "+20% dégâts.",
    effects: { damage: 0.2 },
  },
  {
    id: "curse-speed",
    name: "Malédiction de vitesse",
    desc: "+18% vitesse d'attaque et +28 vitesse.",
    effects: { attackSpeed: 0.18, moveSpeed: 28 },
  },
  {
    id: "curse-health",
    name: "Malédiction de vie",
    desc: "+42 PV max.",
    effects: { maxHp: 42 },
  },
  {
    id: "curse-gold",
    name: "Malédiction d'or",
    desc: "+14% or gagné.",
    effects: { money: 0.14 },
  },
  {
    id: "curse-card-slot",
    name: "Malédiction de main",
    desc: "+1 emplacement de carte.",
    effects: { cardSlots: 1 },
    rare: true,
  },
  {
    id: "curse-all-suits",
    name: "Malédiction chromatique",
    desc: "Cette carte compte comme toutes les couleurs.",
    effects: {},
    allSuits: true,
    rare: true,
  },
];

const CARD_CURSE_DEFS = [
  {
    id: "curse-damage-apply",
    name: "Marque de dégâts",
    desc: "Ajoute +20% dégâts à une carte de ton choix.",
    curse: CURSES[0],
  },
  {
    id: "curse-speed-apply",
    name: "Marque de vitesse",
    desc: "Ajoute +18% vitesse d'attaque et +28 vitesse à une carte de ton choix.",
    curse: CURSES[1],
  },
  {
    id: "curse-health-apply",
    name: "Marque de vie",
    desc: "Ajoute +42 PV max à une carte de ton choix.",
    curse: CURSES[2],
  },
  {
    id: "curse-gold-apply",
    name: "Marque d'or",
    desc: "Ajoute +14% or gagné à une carte de ton choix.",
    curse: CURSES[3],
  },
  {
    id: "curse-slot-apply",
    name: "Marque de main",
    desc: "Ajoute +1 emplacement de carte. Très rare.",
    curse: CURSES[4],
    rare: true,
  },
  {
    id: "curse-all-suits-apply",
    name: "Marque chromatique",
    desc: "La carte choisie compte comme toutes les couleurs. Très rare.",
    curse: CURSES[5],
    rare: true,
  },
];

const CURSE_PACK_DEFS = [
  {
    id: "curse-pack",
    name: "Pack de malédictions",
    desc: "Révèle 3 malédictions. Choisis-en une à appliquer sur une carte.",
    price: 36,
    size: 3,
  },
];

const PACK_DEFS = [
  { id: "standard-4", name: "Pack standard", price: 12, size: 4, suit: null },
  { id: "standard-6", name: "Grand pack standard", price: 20, size: 6, suit: null },
  { id: "spades-4", name: "Pack Pique", price: 16, size: 4, suit: "spades" },
  { id: "spades-6", name: "Grand pack Pique", price: 26, size: 6, suit: "spades" },
  { id: "diamonds-4", name: "Pack Carreau", price: 16, size: 4, suit: "diamonds" },
  { id: "diamonds-6", name: "Grand pack Carreau", price: 26, size: 6, suit: "diamonds" },
  { id: "clubs-4", name: "Pack Trèfle", price: 16, size: 4, suit: "clubs" },
  { id: "clubs-6", name: "Grand pack Trèfle", price: 26, size: 6, suit: "clubs" },
  { id: "hearts-4", name: "Pack Coeur", price: 16, size: 4, suit: "hearts" },
  { id: "hearts-6", name: "Grand pack Coeur", price: 26, size: 6, suit: "hearts" },
];

const POKER_DAMAGE_BONUS = {
  high: 0,
  pair: 0.12,
  twoPair: 0.25,
  three: 0.42,
  straight: 0.62,
  flush: 0.78,
  fullHouse: 1,
  four: 1.35,
  straightFlush: 1.85,
  longStraight: 1.1,
  megaStraight: 1.75,
  royalRoad: 2.7,
  grandFlush: 1.25,
  royalFlush: 2.2,
  perfectFlush: 2.65,
  completeSuit: 4.5,
  doubleCompleteSuit: 8.5,
  tripleCompleteSuit: 13,
  fourCompleteSuits: 20,
  threePair: 0.72,
  fourPair: 1.25,
  fivePair: 1.95,
  sixPair: 2.9,
  tripleBrelan: 1.65,
  quadrupleBrelan: 2.55,
  quintupleBrelan: 3.7,
  doubleSquare: 2.4,
  tripleSquare: 4.2,
  quadrupleSquare: 6.4,
  sixSquare: 10.5,
  rankCollector: 5.6,
};



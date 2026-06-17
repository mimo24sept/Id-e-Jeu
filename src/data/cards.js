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
    name: "Sanctuaire",
    badge: "K$",
    desc: "Mange 50% de ton argent au début de vague et crée une zone de protection. Plus tu paies, plus la zone est grande et réduit les dégâts.",
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
    name: "Rempart tournant",
    badge: "K♠",
    desc: "Fait orbiter des boucliers autour de toi quand tu restes immobile. Ils bloquent les balles et repoussent les ennemis.",
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
    desc: "Toutes les couleurs x0.5 jusqu'à la vague 10, puis x3.",
    getCardEffectMultiplier(state) {
      return state.wave >= 10 ? 3 : 0.5;
    },
  },
  {
    id: "time-breaker",
    name: "Time Breaker",
    title: "Scaling pur",
    desc: "Toutes les couleurs commencent à x0.1 et gagnent +0.1 par vague (max x3.5).",
    getCardEffectMultiplier(state) {
      return Math.min(3.5, Math.max(0.1, state.wave * 0.1));
    },
  },
  {
    id: "banquier",
    name: "Le Banquier",
    title: "Intérêts sales",
    desc: "Carreau x1.75. Gagne 5% d'intérêts en fin de vague. Armes +25%.",
    cardEffectMultipliers: {
      diamonds: 1.75,
    },
    weaponPriceMultiplier: 1.25,
    endWaveInterest: 0.05,
  },
  {
    id: "moine",
    name: "Le Moine",
    title: "Sanctuaire",
    desc: "Coeur x3. Une seule arme. +30% PV max. Regen = 1.2% des PV max/s.",
    cardEffectMultipliers: {
      hearts: 3,
    },
    effects: { maxHpMultiplier: 0.30 },
    maxWeapons: 1,
    dynamicEffects(state) {
      return { regen: (state.stats?.maxHp || 100) * 0.012 };
    },
  },
  {
    id: "tempete",
    name: "La Tempête",
    title: "Ricochets",
    desc: "Trèfle x1.5. +1 rebond de base, dégâts après rebond réduits.",
    cardEffectMultipliers: {
      clubs: 1.5,
    },
    extraBounces: 1,
    bounceDamageMultiplier: 0.72,
  },
  {
    id: "cartomancien",
    name: "Le Cartomancien",
    title: "Main longue",
    desc: "+1 slot carte. Packs -12%. Cartes simples -10%.",
    effects: { cardSlots: 1 },
    packPriceMultiplier: 0.88,
    cardPriceMultiplier: 0.90,
  },
  {
    id: "deserteur",
    name: "Le Déserteur",
    title: "Bord de map",
    desc: "Au bord : +75% dégâts, +22% cadence. Au centre : regen = 1.5% des PV max/s.",
    dynamicEffects(state) {
      const d = Math.hypot(state.player.x, state.player.y);
      const max = Math.hypot(WORLD.width / 2, WORLD.height / 2);
      const ratio = Math.min(1, d / max);
      return {
        damage: ratio * 0.75,
        attackSpeed: ratio * 0.22,
        regen: (1 - ratio) * (state.stats?.maxHp || 100) * 0.015,
      };
    },
  },
  {
    id: "berserker",
    name: "Le Berserker",
    title: "Sang bas",
    desc: "Moins tu as de PV, plus tu gagnes dégâts et cadence. Soins -35%.",
    healingMultiplier: 0.65,
    dynamicEffects(state) {
      const maxHp = Math.max(1, state.stats?.maxHp || 100);
      const missing = 1 - Math.max(0, state.player.hp) / maxHp;
      return {
        damage: missing * 0.75,
        attackSpeed: missing * 0.55,
      };
    },
  },
  {
    id: "collectionneur",
    name: "Le Collectionneur",
    title: "Valeurs uniques",
    desc: "Chaque valeur différente en main donne un bonus. Couleurs x0.85.",
    cardEffectMultipliers: {
      spades: 0.85,
      diamonds: 0.85,
      clubs: 0.85,
      hearts: 0.85,
    },
    dynamicEffects(state) {
      const uniqueRanks = new Set(state.hand.map((card) => card.value)).size;
      return {
        damage: uniqueRanks * 0.028,
        attackSpeed: uniqueRanks * 0.018,
        money: uniqueRanks * 0.015,
        maxHpMultiplier: uniqueRanks * 0.06,
      };
    },
  },
  {
    id: "tricheur",
    name: "Le Tricheur",
    title: "Boutique truquée",
    desc: "Premier reroll gratuit chaque shop. Packs plus fréquents. Prix +8%.",
    shopPriceMultiplier: 1.08,
    freeFirstReroll: true,
    packBias: 0.12,
  },
  {
    id: "alchimiste",
    name: "L'Alchimiste",
    title: "Malédictions fortes",
    desc: "Toutes couleurs x1.1. Malédictions sur cartes x1.35. Packs de malédictions -20%.",
    cardEffectMultipliers: {
      spades: 1.1,
      diamonds: 1.1,
      clubs: 1.1,
      hearts: 1.1,
    },
    curseEffectMultiplier: 1.35,
    cursePackPriceMultiplier: 0.8,
  },
  {
    id: "stratege",
    name: "Le Stratège",
    title: "Plan froid",
    desc: "+25% dégâts aux objectifs et boss. +15% fragments. Chaque boss tué = +5% dégâts pour le reste de la run.",
    objectiveDamageMultiplier: 1.25,
    bossDamageMultiplier: 1.25,
    fragmentMultiplier: 1.15,
    dynamicEffects(state) {
      return { damage: (state.bossKills || 0) * 0.05 };
    },
  },
  {
    id: "parieur",
    name: "Le Parieur",
    title: "Prix instables",
    desc: "Prix du shop très variables. Vendre au prix normal. +6% or.",
    gamblingPrices: true,
    sellMultiplier: 1.0,
    effects: { money: 0.06 },
  },
  {
    id: "mercenaire",
    name: "Le Mercenaire",
    title: "Richesse = puissance",
    desc: "Toutes couleurs ×0.55. Chaque gold en caisse booste tes dégâts (log progressif).",
    cardEffectMultipliers: { spades: 0.55, diamonds: 0.55, clubs: 0.55, hearts: 0.55 },
    dynamicEffects(state) {
      return { damage: Math.log1p((state.money || 0) / 60) * 0.14 };
    },
  },
  {
    id: "arsenal",
    name: "L'Arsenal",
    title: "Triple armement",
    desc: "Jusqu'à 3 armes équipées. Toutes couleurs ×0.72. Armes -22%.",
    cardEffectMultipliers: { spades: 0.72, diamonds: 0.72, clubs: 0.72, hearts: 0.72 },
    maxWeapons: 3,
    weaponPriceMultiplier: 0.78,
  },
  {
    id: "chasseur",
    name: "Le Chasseur",
    title: "Momentum de vague",
    desc: "Toutes couleurs ×1.5. Chaque kill cette vague = +2.2% dégâts, +1.2% cadence (max +100%/+60%).",
    cardEffectMultipliers: { spades: 1.5, diamonds: 1.5, clubs: 1.5, hearts: 1.5 },
    dynamicEffects(state) {
      const kills = state.waveKillCount || 0;
      return {
        damage: Math.min(1.0, kills * 0.022),
        attackSpeed: Math.min(0.6, kills * 0.012),
      };
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
    desc: "+18% PV max.",
    effects: { maxHpMultiplier: 0.18 },
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
    desc: "Ajoute +18% PV max à une carte de ton choix.",
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
    cardEquivalent: 3,
    size: 3,
  },
];

const PACK_DEFS = [
  { id: "standard-4", name: "Pack standard", price: 16, cardEquivalent: 2, size: 4, suit: null },
  { id: "standard-6", name: "Grand pack standard", price: 22, cardEquivalent: 2.75, size: 6, suit: null },
  { id: "spades-4", name: "Pack Pique", price: 18, cardEquivalent: 2.25, size: 4, suit: "spades" },
  { id: "spades-6", name: "Grand pack Pique", price: 23, cardEquivalent: 2.9, size: 6, suit: "spades" },
  { id: "diamonds-4", name: "Pack Carreau", price: 18, cardEquivalent: 2.25, size: 4, suit: "diamonds" },
  { id: "diamonds-6", name: "Grand pack Carreau", price: 23, cardEquivalent: 2.9, size: 6, suit: "diamonds" },
  { id: "clubs-4", name: "Pack Trèfle", price: 18, cardEquivalent: 2.25, size: 4, suit: "clubs" },
  { id: "clubs-6", name: "Grand pack Trèfle", price: 23, cardEquivalent: 2.9, size: 6, suit: "clubs" },
  { id: "hearts-4", name: "Pack Coeur", price: 18, cardEquivalent: 2.25, size: 4, suit: "hearts" },
  { id: "hearts-6", name: "Grand pack Coeur", price: 23, cardEquivalent: 2.9, size: 6, suit: "hearts" },
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



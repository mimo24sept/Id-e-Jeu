const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  mainMenu: document.querySelector("#mainMenu"),
  playerNameInput: document.querySelector("#playerNameInput"),
  connectPlayer: document.querySelector("#connectPlayer"),
  launchGame: document.querySelector("#launchGame"),
  menuPlayerName: document.querySelector("#menuPlayerName"),
  characterSelect: document.querySelector("#characterSelect"),
  characterChoices: document.querySelector("#characterChoices"),
  playerNameHud: document.querySelector("#playerNameHud"),
  wave: document.querySelector("#wave"),
  hp: document.querySelector("#hp"),
  money: document.querySelector("#money"),
  goldMultiplier: document.querySelector("#goldMultiplier"),
  enemyCount: document.querySelector("#enemyCount"),
  hand: document.querySelector("#hand"),
  handRank: document.querySelector("#handRank"),
  suits: document.querySelector("#suits"),
  weapons: document.querySelector("#weapons"),
  dpsHint: document.querySelector("#dpsHint"),
  shop: document.querySelector("#shop"),
  shopHand: document.querySelector("#shopHand"),
  shopSlots: document.querySelector("#shopSlots"),
  shopGold: document.querySelector("#shopGold"),
  shopGoldMultiplier: document.querySelector("#shopGoldMultiplier"),
  shopRunInfo: document.querySelector("#shopRunInfo"),
  weaponCompare: document.querySelector("#weaponCompare"),
  packChoiceTitle: document.querySelector("#packChoiceTitle"),
  packOffer: document.querySelector("#packOffer"),
  rerollShop: document.querySelector("#rerollShop"),
  startWave: document.querySelector("#startWave"),
  godMode: document.querySelector("#godMode"),
  godCountdown: document.querySelector("#godCountdown"),
  gameOver: document.querySelector("#gameOver"),
  finalScore: document.querySelector("#finalScore"),
  restart: document.querySelector("#restart"),
};

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
    desc: "+12% dégâts.",
    effects: { damage: 0.12 },
  },
  {
    id: "curse-speed",
    name: "Malédiction de vitesse",
    desc: "+12% vitesse d'attaque.",
    effects: { attackSpeed: 0.12 },
  },
  {
    id: "curse-health",
    name: "Malédiction de vie",
    desc: "+24 PV max.",
    effects: { maxHp: 24 },
  },
  {
    id: "curse-gold",
    name: "Malédiction d'or",
    desc: "+8% or gagné.",
    effects: { money: 0.08 },
  },
  {
    id: "curse-card-slot",
    name: "Malédiction de main",
    desc: "+1 emplacement de carte.",
    effects: { cardSlots: 1 },
    rare: true,
  },
];

const CARD_CURSE_DEFS = [
  {
    id: "curse-damage-apply",
    name: "Marque de dégâts",
    desc: "Ajoute +12% dégâts à une carte de ton choix.",
    curse: CURSES[0],
  },
  {
    id: "curse-speed-apply",
    name: "Marque de vitesse",
    desc: "Ajoute +12% vitesse d'attaque à une carte de ton choix.",
    curse: CURSES[1],
  },
  {
    id: "curse-health-apply",
    name: "Marque de vie",
    desc: "Ajoute +24 PV max à une carte de ton choix.",
    curse: CURSES[2],
  },
  {
    id: "curse-gold-apply",
    name: "Marque d'or",
    desc: "Ajoute +8% or gagné à une carte de ton choix.",
    curse: CURSES[3],
  },
  {
    id: "curse-slot-apply",
    name: "Marque de main",
    desc: "Ajoute +1 emplacement de carte. Très rare.",
    curse: CURSES[4],
    rare: true,
  },
];

const MODIFIER_DEFS = [
  {
    id: "mod-damage",
    name: "Aiguisage",
    desc: "+10% dégâts.",
    price: 18,
    effects: { damage: 0.1 },
  },
  {
    id: "mod-money",
    name: "Bourse truquée",
    desc: "+8% or gagné.",
    price: 16,
    effects: { money: 0.08 },
  },
  {
    id: "mod-attack-speed",
    name: "Doigts rapides",
    desc: "+12% vitesse d'attaque.",
    price: 20,
    effects: { attackSpeed: 0.12 },
  },
  {
    id: "mod-health",
    name: "Peau dure",
    desc: "+24 PV max.",
    price: 17,
    effects: { maxHp: 24 },
  },
  {
    id: "mod-regen",
    name: "Sang chaud",
    desc: "+0.5 régénération.",
    price: 15,
    effects: { regen: 0.5 },
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
  grandFlush: 1.25,
  royalFlush: 2.2,
  perfectFlush: 2.65,
};

const WEAPON_ARCHETYPES = [
  {
    id: "rifle",
    name: "Mitraillette classique",
    fireLabel: "tir moyen",
    basePrice: 24,
    baseCooldown: 0.42,
    damage: 7,
    range: 420,
    projectileSpeed: 620,
    accuracy: 0.1,
    healthBonus: 14,
    moveSpeedBonus: 0,
  },
  {
    id: "machine-gun",
    name: "Machine Gun",
    fireLabel: "tir rapide",
    basePrice: 31,
    baseCooldown: 0.17,
    damage: 3.1,
    range: 410,
    projectileSpeed: 650,
    accuracy: 0.13,
    healthBonus: 14,
    moveSpeedBonus: -22,
  },
  {
    id: "uzi",
    name: "Uzi",
    fireLabel: "tir rapide",
    basePrice: 27,
    baseCooldown: 0.16,
    damage: 3,
    range: 280,
    projectileSpeed: 590,
    accuracy: 0.17,
    healthBonus: 12,
    moveSpeedBonus: 28,
  },
  {
    id: "sniper",
    name: "Sniper",
    fireLabel: "tir lent",
    basePrice: 36,
    baseCooldown: 1.28,
    damage: 36,
    range: 760,
    projectileSpeed: 900,
    accuracy: 0.025,
    healthBonus: 14,
    moveSpeedBonus: -24,
  },
  {
    id: "katana",
    name: "Katana",
    fireLabel: "frappe moyenne",
    basePrice: 33,
    baseCooldown: 0.56,
    damage: 21,
    range: 92,
    projectileSpeed: 0,
    accuracy: 0,
    healthBonus: 34,
    moveSpeedBonus: 24,
    melee: true,
  },
  {
    id: "shotgun",
    name: "Fusil à pompe",
    fireLabel: "cône",
    basePrice: 34,
    baseCooldown: 0.72,
    damage: 7,
    range: 300,
    projectileSpeed: 560,
    accuracy: 0.12,
    healthBonus: 30,
    moveSpeedBonus: 0,
    pellets: 6,
    spread: 0.62,
  },
];

const WEAPON_GRADES = [
  { id: "green", name: "Verte", color: "#71d58a", weight: 58, damageMult: 1, priceMult: 1, statMult: 1, modCount: 0 },
  { id: "blue", name: "Bleue", color: "#58b7e9", weight: 27, damageMult: 1.28, priceMult: 1.45, statMult: 1.18, modCount: 1 },
  { id: "purple", name: "Violette", color: "#b278ff", weight: 11, damageMult: 1.68, priceMult: 2.15, statMult: 1.42, modCount: 2 },
  { id: "yellow", name: "Jaune", color: "#f0d24b", weight: 4, damageMult: 2.25, priceMult: 3.15, statMult: 1.75, modCount: 3 },
];

const WEAPON_MODIFIERS = [
  { id: "explosive", name: "Explosif", weight: 24 },
  { id: "burn", name: "Incendiaire", weight: 25 },
  { id: "stun", name: "Stun", weight: 22 },
  { id: "gold", name: "Prime", weight: 29 },
];

const WEAPON_SCALING_TYPES = [
  {
    id: "damage",
    name: "Dégâts",
    desc: "augmente les dégâts",
    apply(effects, count, mult) {
      effects.damage += count * 0.055 * mult;
    },
  },
  {
    id: "vitality",
    name: "Vitalité",
    desc: "augmente la vie et la régénération",
    apply(effects, count, mult) {
      effects.maxHp += count * 9 * mult;
      effects.regen += count * 0.18 * mult;
    },
  },
  {
    id: "speed",
    name: "Vitesse",
    desc: "augmente la cadence et le déplacement",
    apply(effects, count, mult) {
      effects.attackSpeed += count * 0.045 * mult;
      effects.moveSpeed += count * 4 * mult;
    },
  },
  {
    id: "wealth",
    name: "Richesse",
    desc: "augmente les revenus",
    apply(effects, count, mult) {
      effects.money += count * 0.03 * mult;
    },
  },
  {
    id: "crit",
    name: "Critique",
    desc: "augmente les chances de coup critique",
    apply(effects, count, mult) {
      effects.critChance += count * 0.03 * mult;
    },
  },
];

const MAX_WEAPONS = 2;
const WORLD = {
  width: 2100,
  height: 1300,
};
const CRATE_RADIUS = 18;
const MAX_CRATES_ON_MAP = 3;

const keys = new Set();
let state;
let lastTime = performance.now();
let animationId = 0;
let cameraShake = 0;
let nextId = 0;
let uiRefresh = 0;
let godCloseTimeout = 0;
let godCountdownInterval = 0;
let connectedPlayerName = localStorage.getItem("pokerSurvivorName") || "";

function random(min, max) {
  return min + Math.random() * (max - min);
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function worldBounds() {
  return {
    left: -WORLD.width / 2,
    right: WORLD.width / 2,
    top: -WORLD.height / 2,
    bottom: WORLD.height / 2,
  };
}

function clampToWorld(x, y, radius = 0) {
  const bounds = worldBounds();
  return {
    x: clamp(x, bounds.left + radius, bounds.right - radius),
    y: clamp(y, bounds.top + radius, bounds.bottom - radius),
  };
}

function uniqueId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  nextId += 1;
  return `${prefix}-${Date.now()}-${nextId}-${Math.random().toString(36).slice(2)}`;
}

function cardKey(card) {
  return `${card.rank}-${card.suit}`;
}

function usedCardKeys(extraCards = []) {
  const keys = new Set(state?.hand.map(cardKey) || []);
  for (const slot of state?.shopSlots || []) {
    if ((slot.type === "card" || slot.type === "cursedCard") && !slot.bought) {
      keys.add(cardKey(slot.card));
    }
  }
  for (const card of state?.packOffer || []) {
    keys.add(cardKey(card));
  }
  extraCards.forEach((card) => keys.add(cardKey(card)));
  return keys;
}

function resizeCanvas() {
  const scale = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function makeDeck() {
  return Object.keys(SUITS).flatMap((suit) =>
    RANKS.map((rank) => ({
      id: uniqueId(`${rank.label}-${suit}`),
      suit,
      rank: rank.label,
      value: rank.value,
    })),
  );
}

function drawCard(options = {}) {
  const suits = Object.keys(SUITS);
  const blocked = options.exclude || new Set();
  const candidates = [];
  for (const suit of options.suit ? [options.suit] : suits) {
    for (const rank of RANKS) {
      const key = `${rank.label}-${suit}`;
      if (!blocked.has(key)) candidates.push({ rank, suit });
    }
  }
  if (candidates.length === 0 && options.suit) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        const key = `${rank.label}-${suit}`;
        if (!blocked.has(key)) candidates.push({ rank, suit });
      }
    }
  }
  const fallbackSuit = options.suit || suits[Math.floor(Math.random() * suits.length)];
  const fallbackRank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const picked = candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : { rank: fallbackRank, suit: fallbackSuit };
  const rank = picked.rank;
  const suit = picked.suit;
  const card = {
    id: uniqueId(`${rank.label}-${suit}`),
    suit,
    rank: rank.label,
    value: rank.value,
  };

  if (options.cursed) {
    const curse = rollCurse();
    card.cursed = true;
    card.curse = curse;
  }

  return card;
}

function drawUniqueCards(count, options = {}) {
  const cards = [];
  const exclude = new Set(options.exclude || []);
  for (let i = 0; i < count; i += 1) {
    const card = drawCard({ ...options, exclude });
    cards.push(card);
    exclude.add(cardKey(card));
  }
  return cards;
}

function rollWeaponModifiers(count) {
  const mods = [];
  const available = WEAPON_MODIFIERS.slice();
  while (mods.length < count && available.length > 0) {
    const mod = pickWeighted(available);
    mods.push(rollWeaponModifier(mod));
    available.splice(available.indexOf(mod), 1);
  }
  return mods;
}

function weaponItemPower(level) {
  return 1 + Math.max(0, level - 1) * 0.11;
}

function rollWeaponModifier(mod) {
  if (mod.id === "explosive") {
    const radius = Math.round(random(62, 112));
    const damage = random(0.28, 0.62);
    return {
      ...mod,
      radius,
      damage,
      desc: `Explosion ${radius}px, ${Math.round(damage * 100)}% dégâts secondaires.`,
    };
  }
  if (mod.id === "burn") {
    const duration = random(1.8, 4.2);
    const dps = random(0.22, 0.52);
    return {
      ...mod,
      duration,
      dps,
      desc: `Brûlure ${duration.toFixed(1)}s, ${Math.round(dps * 100)}% dégâts/s.`,
    };
  }
  if (mod.id === "stun") {
    const duration = random(0.35, 1);
    const chance = random(0.25, 0.72);
    return {
      ...mod,
      duration,
      chance,
      desc: `${Math.round(chance * 100)}% stun ${duration.toFixed(1)}s.`,
    };
  }
  const gold = random(0.18, 0.7);
  return {
    ...mod,
    gold,
    desc: `+${Math.round(gold * 100)}% or sur les victimes touchées.`,
  };
}

function getWeaponScalingType(id) {
  return WEAPON_SCALING_TYPES.find((type) => type.id === id) || WEAPON_SCALING_TYPES[0];
}

function createWeapon(options = {}) {
  const archetype = options.archetype || WEAPON_ARCHETYPES.find((item) => item.id === options.archetypeId) || WEAPON_ARCHETYPES[Math.floor(Math.random() * WEAPON_ARCHETYPES.length)];
  const grade = options.grade || WEAPON_GRADES.find((item) => item.id === options.gradeId) || pickWeighted(WEAPON_GRADES);
  const suitKey = options.suit || Object.keys(SUITS)[Math.floor(Math.random() * Object.keys(SUITS).length)];
  const suit = SUITS[suitKey];
  const scalingType = options.scalingType || (options.scalingTypeId ? getWeaponScalingType(options.scalingTypeId) : WEAPON_SCALING_TYPES[Math.floor(Math.random() * WEAPON_SCALING_TYPES.length)]);
  const modifiers = options.modifiers || rollWeaponModifiers(grade.modCount);
  const level = options.level || Math.max(1, state?.wave || 1);
  const itemPower = weaponItemPower(level);
  const rolls = options.rolls || {
    damage: random(0.86, 1.22),
    cooldown: random(0.86, 1.16),
    range: random(0.9, 1.18),
    accuracy: random(0.82, 1.18),
    stats: random(0.85, 1.22),
  };
  const name = `${grade.name} ${archetype.name} ${suit.symbol}`;
  const damage = archetype.damage * grade.damageMult * itemPower * rolls.damage;
  const cooldown = archetype.baseCooldown * rolls.cooldown;
  const range = Math.round(archetype.range * rolls.range);
  const statPower = Math.pow(itemPower, 0.72) * rolls.stats;

  return {
    id: uniqueId(`weapon-${archetype.id}`),
    type: "weapon",
    archetypeId: archetype.id,
    name,
    baseName: archetype.name,
    grade,
    suit: suitKey,
    scalingType,
    scalingTypeId: scalingType.id,
    color: suitAccent(suitKey),
    gradeColor: grade.color,
    level,
    itemPower,
    rolls,
    price: Math.round(archetype.basePrice * grade.priceMult * (1 + level * 0.08) * ((rolls.damage + rolls.stats) / 2)),
    desc: weaponDescription(archetype, suitKey, scalingType, grade, modifiers, { level, damage, cooldown, range, rolls }),
    baseCooldown: cooldown,
    damage,
    range,
    projectileSpeed: archetype.projectileSpeed,
    accuracy: archetype.accuracy * rolls.accuracy,
    healthBonus: Math.round(archetype.healthBonus * grade.statMult * statPower),
    moveSpeedBonus: Math.round(archetype.moveSpeedBonus * grade.statMult * Math.pow(itemPower, 0.35) * rolls.stats),
    pellets: archetype.pellets || 1,
    spread: archetype.spread || 0,
    melee: Boolean(archetype.melee),
    modifiers,
    cooldown: 0,
  };
}

function weaponDescription(archetype, suitKey, scalingType, grade, modifiers, stats) {
  const suit = SUITS[suitKey];
  const rollText = `Niv.${stats.level} · ${Math.round(stats.damage)} dégâts · ${stats.cooldown.toFixed(2)}s · portée ${stats.range}`;
  const mods = modifiers.length ? ` Mods: ${modifiers.map((mod) => `${mod.name} (${mod.desc})`).join(", ")}.` : "";
  return `${rollText}. ${archetype.fireLabel}. Scaling ${suit.symbol} ${suit.name} -> ${scalingType.name} (${scalingType.desc}).${mods}`;
}

function weaponScore(weapon) {
  const cadence = 1 / Math.max(0.08, weapon.baseCooldown);
  const pellets = weapon.pellets || 1;
  const modPower = weapon.modifiers.reduce((sum, mod) => {
    if (mod.id === "explosive") return sum + mod.damage * 1.7;
    if (mod.id === "burn") return sum + mod.dps * mod.duration * 0.7;
    if (mod.id === "stun") return sum + mod.chance * mod.duration;
    if (mod.id === "gold") return sum + mod.gold * 0.85;
    return sum;
  }, 0);
  return weapon.damage * cadence * Math.sqrt(pellets) * (1 + modPower) + weapon.level * 0.35 + weapon.healthBonus * 0.03;
}

function rollCurse() {
  const roll = Math.random();
  if (roll > 0.94) return CURSES.find((curse) => curse.rare);
  const common = CURSES.filter((curse) => !curse.rare);
  return common[Math.floor(Math.random() * common.length)];
}

function rollCardCurseDef() {
  const roll = Math.random();
  if (roll > 0.94) return CARD_CURSE_DEFS.find((curse) => curse.rare);
  const common = CARD_CURSE_DEFS.filter((curse) => !curse.rare);
  return common[Math.floor(Math.random() * common.length)];
}

function scaleEffects(effects, multiplier = 1) {
  if (multiplier === 1) return effects;
  return Object.fromEntries(Object.entries(effects).map(([key, value]) => [key, value * multiplier]));
}

function characterCardMultiplier(character, suit) {
  const dynamicMultiplier = character?.getCardEffectMultiplier?.(state, suit);
  if (dynamicMultiplier !== undefined) return dynamicMultiplier;
  return character?.cardEffectMultipliers?.[suit] ?? 1;
}

function cardBaseEffects(card) {
  const faceMultiplier = cardFaceMultiplier(card);
  const characterMultiplier = characterCardMultiplier(state?.character, card.suit);
  let effects;
  if (faceMultiplier > 0) {
    const multiplierBonus = faceMultiplier - 1;
    if (card.suit === "spades") effects = { damage: multiplierBonus };
    else if (card.suit === "diamonds") effects = { money: multiplierBonus };
    else if (card.suit === "clubs") effects = { attackSpeed: multiplierBonus };
    else effects = { maxHpMultiplier: multiplierBonus };
    return scaleEffects(effects, characterMultiplier);
  }

  const value = cardStatValue(card);
  if (card.suit === "spades") effects = { flatDamage: value };
  else if (card.suit === "diamonds") effects = { money: value / 100 };
  else if (card.suit === "clubs") effects = { attackSpeed: value / 100 };
  else effects = { maxHp: value };
  return scaleEffects(effects, characterMultiplier);
}

function cardStatValue(card) {
  return Math.min(card.value, 10);
}

function cardFaceMultiplier(card) {
  if (card.value <= 10) return 0;
  if (card.value === 11) return 2;
  if (card.value === 12) return 3;
  if (card.value === 13) return 4;
  return 5;
}

function describeCardBaseBonus(card) {
  const faceMultiplier = cardFaceMultiplier(card);
  if (faceMultiplier > 0) {
    if (card.suit === "spades") return `x${faceMultiplier} dégâts`;
    if (card.suit === "diamonds") return `x${faceMultiplier} or`;
    if (card.suit === "clubs") return `x${faceMultiplier} cadence`;
    return `x${faceMultiplier} PV`;
  }

  const effects = cardBaseEffects(card);
  if (effects.flatDamage) return `+${effects.flatDamage} dégâts`;
  if (effects.money) return `+${Math.round(effects.money * 100)}% or`;
  if (effects.attackSpeed) return `+${Math.round(effects.attackSpeed * 100)}% cadence`;
  return `+${effects.maxHp} PV`;
}

function evaluateFiveCardHand(cards) {
  if (cards.length === 0) {
    return { name: "Aucune carte", multiplier: 1, damageBonus: 0, power: 0 };
  }

  const values = cards.map((card) => card.value).sort((a, b) => a - b);
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const groups = [...counts.values()].sort((a, b) => b - a);
  const flush = cards.length === 5 && cards.every((card) => card.suit === cards[0].suit);
  const unique = [...new Set(values)];
  const wheel = unique.join(",") === "2,3,4,5,14";
  const straight =
    cards.length === 5 &&
    unique.length === 5 &&
    (wheel || unique[4] - unique[0] === 4);

  if (straight && flush) return { name: "Quinte flush", multiplier: 1 + POKER_DAMAGE_BONUS.straightFlush, damageBonus: POKER_DAMAGE_BONUS.straightFlush, power: 8 };
  if (groups[0] === 4) return { name: "Carré", multiplier: 1 + POKER_DAMAGE_BONUS.four, damageBonus: POKER_DAMAGE_BONUS.four, power: 7 };
  if (groups[0] === 3 && groups[1] === 2) return { name: "Full", multiplier: 1 + POKER_DAMAGE_BONUS.fullHouse, damageBonus: POKER_DAMAGE_BONUS.fullHouse, power: 6 };
  if (flush) return { name: "Couleur", multiplier: 1 + POKER_DAMAGE_BONUS.flush, damageBonus: POKER_DAMAGE_BONUS.flush, power: 5 };
  if (straight) return { name: "Quinte", multiplier: 1 + POKER_DAMAGE_BONUS.straight, damageBonus: POKER_DAMAGE_BONUS.straight, power: 4 };
  if (groups[0] === 3) return { name: "Brelan", multiplier: 1 + POKER_DAMAGE_BONUS.three, damageBonus: POKER_DAMAGE_BONUS.three, power: 3 };
  if (groups[0] === 2 && groups[1] === 2) return { name: "Double paire", multiplier: 1 + POKER_DAMAGE_BONUS.twoPair, damageBonus: POKER_DAMAGE_BONUS.twoPair, power: 2 };
  if (groups[0] === 2) return { name: "Paire", multiplier: 1 + POKER_DAMAGE_BONUS.pair, damageBonus: POKER_DAMAGE_BONUS.pair, power: 1 };
  return { name: "Carte haute", multiplier: 1, damageBonus: POKER_DAMAGE_BONUS.high, power: 0 };
}

function combinations(items, size) {
  const result = [];
  function walk(start, combo) {
    if (combo.length === size) {
      result.push(combo.slice());
      return;
    }
    for (let i = start; i <= items.length - (size - combo.length); i += 1) {
      combo.push(items[i]);
      walk(i + 1, combo);
      combo.pop();
    }
  }
  walk(0, []);
  return result;
}

function longestStraightLength(cards) {
  const values = new Set(cards.map((card) => card.value));
  if (values.has(14)) values.add(1);
  const sorted = [...values].sort((a, b) => a - b);
  let best = 0;
  let current = 0;
  let previous = null;
  for (const value of sorted) {
    current = previous !== null && value === previous + 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = value;
  }
  return best;
}

function specialHand(cards, best) {
  if (cards.length <= 5) return best;

  let upgraded = best;
  const suits = Object.keys(SUITS);
  for (const suit of suits) {
    const suited = cards.filter((card) => card.suit === suit);
    const royalValues = new Set(suited.map((card) => card.value));
    if ([10, 11, 12, 13, 14].every((value) => royalValues.has(value))) {
      const royal = { name: "Flush royal", multiplier: 1 + POKER_DAMAGE_BONUS.royalFlush, damageBonus: POKER_DAMAGE_BONUS.royalFlush, power: 9 };
      if (royal.damageBonus > upgraded.damageBonus) upgraded = royal;
    }
    if (suited.length >= 6) {
      const grand = { name: "Grande couleur", multiplier: 1 + POKER_DAMAGE_BONUS.grandFlush, damageBonus: POKER_DAMAGE_BONUS.grandFlush, power: 7 };
      if (grand.damageBonus > upgraded.damageBonus) upgraded = grand;
    }
    if (suited.length >= 7) {
      const perfect = { name: "Couleur parfaite", multiplier: 1 + POKER_DAMAGE_BONUS.perfectFlush, damageBonus: POKER_DAMAGE_BONUS.perfectFlush, power: 10 };
      if (perfect.damageBonus > upgraded.damageBonus) upgraded = perfect;
    }
  }

  if (longestStraightLength(cards) >= 6) {
    const longStraight = { name: "Suite longue", multiplier: 1 + POKER_DAMAGE_BONUS.longStraight, damageBonus: POKER_DAMAGE_BONUS.longStraight, power: 6 };
    if (longStraight.damageBonus > upgraded.damageBonus) upgraded = longStraight;
  }

  return upgraded;
}

function evaluateHand(cards) {
  if (cards.length <= 5) return evaluateFiveCardHand(cards);

  let best = { name: "Aucune carte", multiplier: 1, damageBonus: 0, power: 0 };
  for (const combo of combinations(cards, 5)) {
    const evaluated = evaluateFiveCardHand(combo);
    if (evaluated.damageBonus > best.damageBonus || (evaluated.damageBonus === best.damageBonus && evaluated.power > best.power)) {
      best = evaluated;
    }
  }
  return specialHand(cards, best);
}

function addEffects(total, effects = {}) {
  total.damage += effects.damage || 0;
  total.flatDamage += effects.flatDamage || 0;
  total.money += effects.money || 0;
  total.attackSpeed += effects.attackSpeed || 0;
  total.maxHp += effects.maxHp || 0;
  total.maxHpMultiplier += effects.maxHpMultiplier || 0;
  total.regen += effects.regen || 0;
  total.cardSlots += effects.cardSlots || 0;
  total.critChance += effects.critChance || 0;
  total.moveSpeed += effects.moveSpeed || 0;
}

function calculateStats() {
  const suits = { spades: 0, diamonds: 0, clubs: 0, hearts: 0 };
  const effects = { damage: 0, flatDamage: 0, money: 0, attackSpeed: 0, maxHp: 0, maxHpMultiplier: 0, regen: 0, cardSlots: 0, critChance: 0, moveSpeed: 0 };
  state.hand.forEach((card) => {
    suits[card.suit] += 1;
    addEffects(effects, cardBaseEffects(card));
    if (card.cursed) addEffects(effects, card.curse.effects);
  });
  state.modifiers.forEach((modifier) => addEffects(effects, modifier.effects));
  if (state.character?.effects) addEffects(effects, state.character.effects);
  state.weapons.forEach((weapon) => {
    const suitCount = suits[weapon.suit] || 0;
    const gradeMult = weapon.grade.statMult;
    const scalingType = getWeaponScalingType(weapon.scalingTypeId);
    effects.maxHp += weapon.healthBonus;
    effects.moveSpeed += weapon.moveSpeedBonus;
    scalingType.apply(effects, suitCount, gradeMult);
    const goldMod = weapon.modifiers.find((mod) => mod.id === "gold");
    if (goldMod) {
      effects.money += goldMod.gold * 0.1 * gradeMult;
    }
  });
  const hand = evaluateHand(state.hand);
  const baseMaxHp = 100 + suits.hearts * 10 + hand.power * 3 + effects.maxHp;
  const maxHp = Math.max(40, Math.round(baseMaxHp * Math.max(0.1, 1 + effects.maxHpMultiplier)));

  const stats = {
    ...suits,
    handName: hand.name,
    handMultiplier: hand.multiplier,
    handDamageBonus: hand.damageBonus,
    handPower: hand.power,
    damageMultiplier: Math.max(0.25, 1 + hand.damageBonus + suits.spades * 0.035 + effects.damage),
    flatDamage: effects.flatDamage,
    attackSpeedMultiplier: Math.max(0.25, 1 + suits.clubs * 0.07 + effects.attackSpeed),
    moneyMultiplier: Math.max(0.25, 1 + suits.diamonds * 0.08 + effects.money),
    moveSpeed: Math.max(120, 225 + suits.clubs * 4 + effects.moveSpeed),
    maxHp,
    regen: Math.max(0, suits.hearts * 0.18 + hand.power * 0.05 + effects.regen),
    extraCardSlots: effects.cardSlots,
    critChance: Math.min(0.75, effects.critChance),
    mapWidth: WORLD.width,
    mapHeight: WORLD.height,
  };

  if (state?.godMode) {
    return {
      ...stats,
      handName: "Deck complet",
      handDamageBonus: 52,
      handPower: 520,
      damageMultiplier: 999,
      flatDamage: 9999,
      attackSpeedMultiplier: 18,
      moneyMultiplier: 52,
      moveSpeed: 420,
      maxHp: 999999,
      regen: 9999,
      critChance: 1,
    };
  }

  return stats;
}

function createState(options = {}) {
  const hand = drawUniqueCards(5);
  const initial = {
    playerName: options.playerName || connectedPlayerName || "Joueur",
    character: options.character || null,
    paused: false,
    betweenWaves: false,
    wave: 1,
    money: 22,
    moneyDust: 0,
    worldTime: 0,
    hand,
    handSlots: 5,
    modifiers: [],
    shopSlots: [],
    shopRerolls: 0,
    packOffer: [],
    packContext: null,
    pendingCurse: null,
    pendingWeapon: null,
    previewWeaponId: null,
    player: { x: 0, y: 0, radius: 17, hp: 100, invuln: 0 },
    enemies: [],
    enemyBullets: [],
    projectiles: [],
    pulses: [],
    floatingText: [],
    crates: [],
    crateSpawnTimer: 0,
    pendingCratePacks: 0,
    weapons: [createWeapon({ archetypeId: "rifle", gradeId: "green" })],
    waveDuration: 0,
    waveTimeLeft: 0,
    spawnTimer: 0,
    godMode: false,
    godCloseEndsAt: 0,
    gameOver: false,
  };
  state = initial;
  state.stats = calculateStats();
  state.player.hp = state.stats.maxHp;
  state.shopSlots = rollShopSlots();
  return state;
}

function cardPrice(card) {
  const rankTax = card.value >= 11 ? 3 : card.value >= 8 ? 2 : 0;
  const curseTax = card.cursed ? (card.curse.rare ? 30 : 9) : 0;
  return Math.max(4, scaleShopPrice(7 + rankTax + curseTax));
}

function sellValue(card) {
  return Math.max(2, Math.floor(cardPrice(card) * 0.45));
}

function shopPriceMultiplier(wave = state?.wave || 1) {
  const waveIndex = Math.max(0, wave - 1);
  return 1 + waveIndex * 0.04 + Math.floor(waveIndex / 10) * 0.08;
}

function scaleShopPrice(basePrice, wave = state?.wave || 1) {
  return Math.max(1, Math.round(basePrice * shopPriceMultiplier(wave)));
}

function rerollCost() {
  return 3 + state.shopRerolls * 2 + Math.floor(state.wave / 6);
}

function rollShopEntry(offeredCards = []) {
  const roll = Math.random();

  if (roll < 0.24) {
    const card = drawCard({ exclude: new Set([...state.hand.map(cardKey), ...offeredCards.map(cardKey)]) });
    offeredCards.push(card);
    return {
      id: uniqueId("offer-card"),
      type: "card",
      name: "Carte simple",
      card,
      price: cardPrice(card),
      bought: false,
    };
  }

  if (roll < 0.37) {
    const card = drawCard({
      cursed: true,
      exclude: new Set([...state.hand.map(cardKey), ...offeredCards.map(cardKey)]),
    });
    offeredCards.push(card);
    return {
      id: uniqueId("offer-cursed"),
      type: "cursedCard",
      name: "Carte à malédiction",
      card,
      price: cardPrice(card),
      bought: false,
    };
  }

  if (roll < 0.5) {
    const pack = PACK_DEFS[Math.floor(Math.random() * PACK_DEFS.length)];
    return {
      ...pack,
      id: uniqueId(pack.id),
      type: "pack",
      price: scaleShopPrice(pack.price),
      bought: false,
    };
  }

  if (roll < 0.64) {
    const curse = rollCardCurseDef();
    return {
      ...curse,
      id: uniqueId(curse.id),
      type: "cardCurse",
      price: scaleShopPrice(curse.rare ? 46 : 14) + (curse.rare ? state.wave * 2 : 0),
      bought: false,
    };
  }

  if (roll < 0.8) {
    return {
      ...createWeapon(),
      bought: false,
    };
  }

  if (roll < 0.95) {
    const modifier = MODIFIER_DEFS[Math.floor(Math.random() * MODIFIER_DEFS.length)];
    return {
      ...modifier,
      id: uniqueId(modifier.id),
      type: "modifier",
      price: scaleShopPrice(modifier.price),
      bought: false,
    };
  }

  return {
    id: uniqueId("slot-upgrade"),
    type: "slot",
    name: "Emplacement de carte",
    desc: "+1 emplacement dans ta main.",
    price: scaleShopPrice(42) + state.wave * 2,
    bought: false,
  };
}

function rollShopSlots() {
  const slots = state.shopSlots.filter((slot) => slot.locked && !slot.bought);
  const offeredCards = slots
    .filter((slot) => slot.type === "card" || slot.type === "cursedCard")
    .map((slot) => slot.card);

  if (!slots.some((slot) => slot.type === "weapon")) {
    slots.push({ ...createWeapon(), bought: false });
  }

  while (slots.length < 6) {
    slots.push(rollShopEntry(offeredCards));
  }
  return slots.sort(() => Math.random() - 0.5);
}

function enemyTier(wave = state.wave) {
  return Math.floor(Math.max(1, wave) / 10);
}

function enemyTierMultiplier(wave = state.wave) {
  return Math.pow(1.75, enemyTier(wave));
}

function beginWave() {
  state.betweenWaves = false;
  state.packOffer = [];
  state.packContext = null;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.previewWeaponId = null;
  state.crates = [];
  state.crateSpawnTimer = random(2.5, 4.5);
  state.pendingCratePacks = 0;
  state.wave += state.wave === 0 ? 1 : 0;
  state.waveDuration = Math.min(18 + state.wave * 2, 58);
  state.waveTimeLeft = state.waveDuration;
  state.spawnTimer = 0;
  if (state.wave % 10 === 0) spawnBoss();
  ui.shop.classList.add("is-hidden");
  renderUI();
}

function completeWave() {
  state.betweenWaves = true;
  state.money += 18 + state.wave * 6;
  state.wave += 1;
  state.shopRerolls = 0;
  state.crates = [];
  state.packOffer = [];
  state.packContext = null;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.previewWeaponId = null;
  state.shopSlots = rollShopSlots();
  openNextCratePack();
  renderUI();
  ui.shop.classList.remove("is-hidden");
}

function spawnEnemy() {
  const angle = random(0, Math.PI * 2);
  const spawnDistance = Math.max(window.innerWidth, window.innerHeight) * 0.52 + 45;
  const wave = state.wave;
  const shooter = wave >= 2 && Math.random() < Math.min(0.14 + wave * 0.018, 0.42);
  const brute = wave >= 4 && Math.random() < Math.min(0.09 + wave * 0.014, 0.34);
  const tierMult = enemyTierMultiplier(wave);
  const hp = (brute ? 42 + wave * 10 : shooter ? 24 + wave * 6 : 16 + wave * 4.5) * tierMult;
  const radius = brute ? 21 : shooter ? 16 : 15;
  const spawnPoint = clampToWorld(
    state.player.x + Math.cos(angle) * spawnDistance,
    state.player.y + Math.sin(angle) * spawnDistance,
    radius,
  );

  state.enemies.push({
    x: spawnPoint.x,
    y: spawnPoint.y,
    radius,
    hp,
    maxHp: hp,
    speed: (brute ? 78 + wave * 2.4 : shooter ? 92 + wave * 2.4 : 118 + wave * 3.4) * Math.min(1.45, Math.pow(1.08, enemyTier(wave))),
    damage: (brute ? 19 : shooter ? 11 : 13) * Math.pow(1.35, enemyTier(wave)),
    type: brute ? "brute" : shooter ? "shooter" : "chaser",
    shootTimer: random(0.5, 1.6),
    value: (brute ? 2.35 : shooter ? 1.55 : 0.95) * Math.pow(1.35, enemyTier(wave)),
    tier: enemyTier(wave),
  });
}

function spawnBoss() {
  const wave = state.wave;
  const tierMult = enemyTierMultiplier(wave);
  const radius = 46 + enemyTier(wave) * 5;
  const side = Math.floor(random(0, 4));
  const bounds = worldBounds();
  let x = state.player.x;
  let y = state.player.y;
  if (side === 0) {
    x = random(bounds.left + radius, bounds.right - radius);
    y = bounds.top + radius;
  } else if (side === 1) {
    x = random(bounds.left + radius, bounds.right - radius);
    y = bounds.bottom - radius;
  } else if (side === 2) {
    x = bounds.left + radius;
    y = random(bounds.top + radius, bounds.bottom - radius);
  } else {
    x = bounds.right - radius;
    y = random(bounds.top + radius, bounds.bottom - radius);
  }

  state.enemies.push({
    x,
    y,
    radius,
    hp: (900 + wave * 120) * tierMult,
    maxHp: (900 + wave * 120) * tierMult,
    speed: 62 + wave * 1.6,
    damage: (28 + wave * 1.8) * Math.pow(1.35, enemyTier(wave)),
    type: "boss",
    shootTimer: 0.8,
    value: 70 + wave * 8,
    tier: enemyTier(wave),
    boss: true,
  });
}

function nextCrateDelay() {
  return random(6.5, 10.5);
}

function spawnCrate() {
  const bounds = worldBounds();
  let cratePoint = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const point = clampToWorld(
      state.player.x + random(-620, 620),
      state.player.y + random(-390, 390),
      CRATE_RADIUS,
    );
    if (distance(point, state.player) > 170) {
      cratePoint = point;
      break;
    }
  }

  if (!cratePoint) {
    cratePoint = {
      x: random(bounds.left + CRATE_RADIUS, bounds.right - CRATE_RADIUS),
      y: random(bounds.top + CRATE_RADIUS, bounds.bottom - CRATE_RADIUS),
    };
  }

  state.crates.push({
    id: uniqueId("crate"),
    x: cratePoint.x,
    y: cratePoint.y,
    radius: CRATE_RADIUS,
  });
}

function findNearestEnemy(maxRange = Infinity) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const enemy of state.enemies) {
    const d = distance(state.player, enemy);
    if (d <= maxRange && d < nearestDistance) {
      nearestDistance = d;
      nearest = enemy;
    }
  }
  return nearest;
}

function weaponHasMod(weapon, id) {
  return weapon.modifiers.some((mod) => mod.id === id);
}

function weaponDamage(weapon) {
  const suitCount = state.stats[weapon.suit] || 0;
  const scalingType = getWeaponScalingType(weapon.scalingTypeId);
  const suitBonus = scalingType.id === "damage" ? suitCount * 1.15 * weapon.grade.statMult : suitCount * 0.35 * weapon.grade.statMult;
  let damage = (weapon.damage + state.stats.flatDamage + suitBonus + state.stats.handPower * 0.75) * state.stats.damageMultiplier;
  const critChance = Math.min(0.9, state.stats.critChance + (scalingType.id === "crit" ? 0.03 * suitCount : 0));
  const crit = Math.random() < critChance;
  if (crit) damage *= 2;
  return { damage, crit };
}

function projectileEffects(weapon) {
  return {
    explosive: weapon.modifiers.find((mod) => mod.id === "explosive"),
    burn: weapon.modifiers.find((mod) => mod.id === "burn"),
    stun: weapon.modifiers.find((mod) => mod.id === "stun"),
    gold: weapon.modifiers.find((mod) => mod.id === "gold"),
  };
}

function fireWeapon(weapon) {
  if (weapon.melee) {
    const hit = weaponDamage(weapon);
    state.pulses.push({
      x: state.player.x,
      y: state.player.y,
      radius: 20,
      maxRadius: weapon.range,
      damage: hit.damage,
      life: 0.38,
      hit: new Set(),
      color: weapon.color,
      effects: projectileEffects(weapon),
      crit: hit.crit,
    });
    return;
  }

  const target = findNearestEnemy(weapon.range);
  if (!target) return;

  const baseAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
  const pellets = weapon.pellets || 1;
  for (let i = 0; i < pellets; i += 1) {
    const coneOffset = pellets > 1 ? ((i / (pellets - 1)) - 0.5) * weapon.spread : 0;
    const inaccuracy = random(-weapon.accuracy, weapon.accuracy);
    const angle = baseAngle + coneOffset + inaccuracy;
    const hit = weaponDamage(weapon);
    state.projectiles.push({
      x: state.player.x,
      y: state.player.y,
      vx: Math.cos(angle) * weapon.projectileSpeed,
      vy: Math.sin(angle) * weapon.projectileSpeed,
      radius: pellets > 1 ? 5 : weapon.archetypeId === "sniper" ? 8 : 6,
      damage: hit.damage,
      life: weapon.range / weapon.projectileSpeed,
      color: weapon.color,
      effects: projectileEffects(weapon),
      crit: hit.crit,
    });
  }
}

function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;

  const length = Math.hypot(dx, dy) || 1;
  const nextPosition = clampToWorld(
    state.player.x + (dx / length) * state.stats.moveSpeed * dt,
    state.player.y + (dy / length) * state.stats.moveSpeed * dt,
    state.player.radius,
  );
  state.player.x = nextPosition.x;
  state.player.y = nextPosition.y;
  state.player.invuln = Math.max(0, state.player.invuln - dt);
  state.player.hp = Math.min(state.stats.maxHp, state.player.hp + state.stats.regen * dt);
}

function updateWeapons(dt) {
  for (const weapon of state.weapons) {
    weapon.cooldown -= dt * state.stats.attackSpeedMultiplier;
    if (weapon.cooldown <= 0) {
      fireWeapon(weapon);
      weapon.cooldown = weapon.baseCooldown;
    }
  }
}

function updateSpawns(dt) {
  if (state.betweenWaves || state.waveTimeLeft <= 0) return;

  state.waveTimeLeft = Math.max(0, state.waveTimeLeft - dt);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    let spawnBurst = 1 + Math.floor(state.wave / 5);
    if (Math.random() < Math.min(0.12 + state.wave * 0.02, 0.68)) spawnBurst += 1;
    for (let i = 0; i < spawnBurst; i += 1) {
      spawnEnemy();
    }
    state.spawnTimer = Math.max(0.18, 0.86 - state.wave * 0.025);
  }
}

function updateCrates(dt) {
  if (state.betweenWaves || state.waveTimeLeft <= 0) return;

  state.crateSpawnTimer -= dt;
  if (state.crateSpawnTimer <= 0) {
    if (state.crates.length < MAX_CRATES_ON_MAP) {
      spawnCrate();
    }
    state.crateSpawnTimer = nextCrateDelay();
  }

  const remainingCrates = [];
  for (const crate of state.crates) {
    if (distance(crate, state.player) < crate.radius + state.player.radius) {
      state.pendingCratePacks += 1;
      state.floatingText.push({
        x: crate.x,
        y: crate.y - crate.radius,
        text: "PACK +1",
        life: 0.9,
        color: "#f0d24b",
      });
    } else {
      remainingCrates.push(crate);
    }
  }
  state.crates = remainingCrates;
}

function damagePlayer(amount) {
  if (state.godMode) return;
  if (state.player.invuln > 0) return;
  state.player.hp -= amount;
  state.player.invuln = 0.42;
  cameraShake = 0.18;
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.gameOver = true;
    ui.finalScore.textContent = `Tu as tenu jusqu'à la vague ${state.wave}`;
    ui.gameOver.classList.remove("is-hidden");
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (enemy.burn > 0) {
      enemy.hp -= (enemy.burnDps || 0) * dt;
      enemy.burn = Math.max(0, enemy.burn - dt);
    }
    if (enemy.stun > 0) {
      enemy.stun = Math.max(0, enemy.stun - dt);
      continue;
    }

    const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
    const desiredRange = enemy.type === "shooter" ? 250 : enemy.type === "boss" ? 190 : 0;
    const d = distance(enemy, state.player);

    if ((enemy.type !== "shooter" && enemy.type !== "boss") || d > desiredRange) {
      enemy.x += Math.cos(angle) * enemy.speed * dt;
      enemy.y += Math.sin(angle) * enemy.speed * dt;
    } else {
      const retreat = enemy.type === "boss" ? 0.12 : 0.28;
      enemy.x -= Math.cos(angle) * enemy.speed * retreat * dt;
      enemy.y -= Math.sin(angle) * enemy.speed * retreat * dt;
    }

    const clampedEnemy = clampToWorld(enemy.x, enemy.y, enemy.radius);
    enemy.x = clampedEnemy.x;
    enemy.y = clampedEnemy.y;

    if (enemy.type === "shooter" || enemy.type === "boss") {
      enemy.shootTimer -= dt;
      if (enemy.shootTimer <= 0 && d < (enemy.type === "boss" ? 880 : 680)) {
        const shots = enemy.type === "boss" ? 7 : 1;
        const spread = enemy.type === "boss" ? 0.78 : 0;
        for (let i = 0; i < shots; i += 1) {
          const offset = shots > 1 ? ((i / (shots - 1)) - 0.5) * spread : 0;
          state.enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle + offset) * (enemy.type === "boss" ? 230 : 270),
            vy: Math.sin(angle + offset) * (enemy.type === "boss" ? 230 : 270),
            radius: enemy.type === "boss" ? 9 : 6,
            damage: (enemy.type === "boss" ? 14 + state.wave * 0.9 : 9 + state.wave * 0.55) * Math.pow(1.25, enemy.tier || 0),
            life: enemy.type === "boss" ? 4 : 3,
          });
        }
        enemy.shootTimer = enemy.type === "boss" ? random(1.05, 1.5) : random(1.35, 2.2);
      }
    }

    if (d < enemy.radius + state.player.radius) {
      damagePlayer(enemy.damage);
      enemy.x -= Math.cos(angle) * 24;
      enemy.y -= Math.sin(angle) * 24;
    }
  }
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
  }

  for (const bullet of state.enemyBullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (distance(bullet, state.player) < bullet.radius + state.player.radius) {
      bullet.life = 0;
      damagePlayer(bullet.damage);
    }
  }

  for (const pulse of state.pulses) {
    pulse.life -= dt;
    pulse.radius = pulse.maxRadius * (1 - pulse.life / 0.38);
  }

  for (const projectile of state.projectiles) {
    for (const enemy of state.enemies) {
      if (projectile.life <= 0) continue;
      if (distance(projectile, enemy) < projectile.radius + enemy.radius) {
        projectile.life = 0;
        enemy.hp -= projectile.damage;
        applyHitEffects(enemy, projectile);
        state.floatingText.push({
          x: enemy.x,
          y: enemy.y - enemy.radius,
          text: projectile.crit ? `CRIT ${Math.round(projectile.damage)}` : Math.round(projectile.damage).toString(),
          life: 0.55,
          color: projectile.color,
        });
      }
    }
  }

  for (const pulse of state.pulses) {
    for (const enemy of state.enemies) {
      if (pulse.hit.has(enemy)) continue;
      if (distance(pulse, enemy) < pulse.radius + enemy.radius) {
        pulse.hit.add(enemy);
        enemy.hp -= pulse.damage;
        applyHitEffects(enemy, pulse);
      }
    }
  }

  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
  state.enemyBullets = state.enemyBullets.filter((bullet) => bullet.life > 0);
  state.pulses = state.pulses.filter((pulse) => pulse.life > 0);
}

function applyHitEffects(enemy, source) {
  const effects = source.effects || {};
  if (effects.explosive) {
    for (const other of state.enemies) {
      if (other === enemy) continue;
      if (distance(enemy, other) < effects.explosive.radius) {
        other.hp -= source.damage * effects.explosive.damage;
      }
    }
  }
  if (effects.burn) {
    enemy.burn = Math.max(enemy.burn || 0, effects.burn.duration);
    enemy.burnDps = Math.max(enemy.burnDps || 0, source.damage * effects.burn.dps);
  }
  if (effects.stun && Math.random() < effects.stun.chance) {
    enemy.stun = Math.max(enemy.stun || 0, effects.stun.duration);
  }
  if (effects.gold) {
    enemy.goldBonus = Math.max(enemy.goldBonus || 0, effects.gold.gold);
  }
}

function updateKills(dt) {
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      state.moneyDust += enemy.value * state.stats.moneyMultiplier * (1 + (enemy.goldBonus || 0));
      const gain = Math.floor(state.moneyDust);
      if (gain > 0) {
        state.money += gain;
        state.moneyDust -= gain;
        state.floatingText.push({
          x: enemy.x,
          y: enemy.y,
          text: `+$${gain}`,
          life: 0.75,
          color: SUITS.diamonds.color,
        });
      }
    }
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);

  for (const text of state.floatingText) {
    text.y -= 32 * dt;
    text.life -= dt;
  }
  state.floatingText = state.floatingText.filter((text) => text.life > 0);

  if (!state.betweenWaves && state.waveTimeLeft <= 0 && state.enemies.length === 0) {
    completeWave();
  }
}

function update(dt) {
  if (state.gameOver || state.betweenWaves) return;
  state.worldTime += dt;
  state.stats = calculateStats();
  if (state.player.hp > state.stats.maxHp) state.player.hp = state.stats.maxHp;
  updatePlayer(dt);
  updateSpawns(dt);
  updateCrates(dt);
  updateEnemies(dt);
  updateWeapons(dt);
  updateProjectiles(dt);
  updateKills(dt);
  cameraShake = Math.max(0, cameraShake - dt);
}

function screenPoint(worldX, worldY) {
  return {
    x: worldX - state.player.x + window.innerWidth / 2,
    y: worldY - state.player.y + window.innerHeight / 2,
  };
}

function drawGrid() {
  const grid = 72;
  const bounds = worldBounds();
  const topLeft = screenPoint(bounds.left, bounds.top);
  const bottomRight = screenPoint(bounds.right, bounds.bottom);
  const startX = Math.max(0, topLeft.x);
  const endX = Math.min(window.innerWidth, bottomRight.x);
  const startY = Math.max(0, topLeft.y);
  const endY = Math.min(window.innerHeight, bottomRight.y);
  const firstWorldX = Math.ceil(bounds.left / grid) * grid;
  const firstWorldY = Math.ceil(bounds.top / grid) * grid;

  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let worldX = firstWorldX; worldX <= bounds.right; worldX += grid) {
    const x = screenPoint(worldX, 0).x;
    if (x < 0 || x > window.innerWidth) continue;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  for (let worldY = firstWorldY; worldY <= bounds.bottom; worldY += grid) {
    const y = screenPoint(0, worldY).y;
    if (y < 0 || y > window.innerHeight) continue;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  ctx.lineWidth = 4;
  ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);

  ctx.strokeStyle = "rgba(13,103,255,0.86)";
  ctx.lineWidth = 2;
  ctx.strokeRect(topLeft.x + 8, topLeft.y + 8, bottomRight.x - topLeft.x - 16, bottomRight.y - topLeft.y - 16);
}

function drawGridBackdrop() {
  const grid = 72;
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x < window.innerWidth; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, window.innerHeight);
    ctx.stroke();
  }
  for (let y = 0; y < window.innerHeight; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(window.innerWidth, y);
    ctx.stroke();
  }
}

function drawCircle(x, y, radius, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function strongestSuit() {
  return Object.keys(SUITS).reduce((best, suit) => {
    if (state.stats[suit] > state.stats[best]) return suit;
    return best;
  }, "spades");
}

function updateUIAccent() {
  const dominantSuit = strongestSuit();
  document.documentElement.style.setProperty("--accent", suitAccent(dominantSuit));
}

function drawPlayer() {
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;
  const suit = SUITS[strongestSuit()];
  const radius = state.player.radius;

  ctx.save();
  if (state.godMode) {
    const pulse = Math.sin(state.worldTime * 8) * 9;
    ctx.globalAlpha = 0.34;
    drawCircle(x, y, radius + 46 + pulse, "rgba(240, 210, 75, 0.18)", "rgba(240, 210, 75, 0.56)");
    ctx.globalAlpha = 1;
  }
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 7;
  drawCircle(x, y, radius + 3, "#f0b84b", "#151719");
  ctx.shadowColor = "transparent";

  ctx.beginPath();
  ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
  ctx.fillStyle = "#201a10";
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "#151719";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - radius + 6, y);
  ctx.lineTo(x + radius - 6, y);
  ctx.moveTo(x, y - radius + 6);
  ctx.lineTo(x, y + radius - 6);
  ctx.stroke();

  ctx.fillStyle = suit.color;
  ctx.font = "900 14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(suit.symbol, x, y + radius + 12);
  ctx.restore();
}

function drawCrate(crate) {
  const p = screenPoint(crate.x, crate.y);
  const size = crate.radius * 2;
  const x = p.x - crate.radius;
  const y = p.y - crate.radius;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = "#f0d24b";
  ctx.fillRect(x, y, size, size);
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#080808";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = "#101010";
  ctx.fillRect(x + 5, y + size * 0.44, size - 10, 5);
  ctx.fillRect(x + size * 0.44, y + 5, 5, size - 10);
  ctx.fillStyle = "#101010";
  ctx.font = "900 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("4", p.x, p.y);
  ctx.restore();
}

function renderGame() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.save();

  if (cameraShake > 0) {
    ctx.translate(random(-5, 5) * cameraShake * 6, random(-5, 5) * cameraShake * 6);
  }

  drawGrid();

  for (const pulse of state.pulses) {
    const p = screenPoint(pulse.x, pulse.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, pulse.radius, 0, Math.PI * 2);
    ctx.strokeStyle = pulse.color;
    ctx.globalAlpha = Math.max(0.1, pulse.life / 0.38);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const projectile of state.projectiles) {
    const p = screenPoint(projectile.x, projectile.y);
    drawCircle(p.x, p.y, projectile.radius, projectile.color, "rgba(255,255,255,0.42)");
  }

  for (const bullet of state.enemyBullets) {
    const p = screenPoint(bullet.x, bullet.y);
    drawCircle(p.x, p.y, bullet.radius, "#e46363", "rgba(255,255,255,0.25)");
  }

  for (const crate of state.crates) {
    drawCrate(crate);
  }

  for (const enemy of state.enemies) {
    const p = screenPoint(enemy.x, enemy.y);
    const fill = enemy.type === "boss" ? "#f0d24b" : enemy.type === "brute" ? "#9f5ec7" : enemy.type === "shooter" ? "#e08d4f" : "#e46363";
    drawCircle(p.x, p.y, enemy.radius, fill, "rgba(0,0,0,0.35)");

    if (enemy.type === "boss") {
      ctx.save();
      ctx.strokeStyle = "#090909";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x - enemy.radius * 0.58, p.y);
      ctx.lineTo(p.x + enemy.radius * 0.58, p.y);
      ctx.moveTo(p.x, p.y - enemy.radius * 0.58);
      ctx.lineTo(p.x, p.y + enemy.radius * 0.58);
      ctx.stroke();
      ctx.restore();
    }

    const hpWidth = enemy.type === "boss" ? enemy.radius * 3 : enemy.radius * 2;
    const hpHeight = enemy.type === "boss" ? 7 : 4;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(p.x - hpWidth / 2, p.y - enemy.radius - 14, hpWidth, hpHeight);
    ctx.fillStyle = enemy.type === "boss" ? "#f0d24b" : "#71d58a";
    ctx.fillRect(p.x - hpWidth / 2, p.y - enemy.radius - 14, hpWidth * (enemy.hp / enemy.maxHp), hpHeight);
  }

  const playerPulse = state.player.invuln > 0 ? 0.45 + Math.sin(state.worldTime * 30) * 0.22 : 1;
  ctx.globalAlpha = playerPulse;
  drawPlayer();
  ctx.globalAlpha = 1;

  for (const text of state.floatingText) {
    const p = screenPoint(text.x, text.y);
    ctx.globalAlpha = Math.min(1, text.life * 2);
    ctx.fillStyle = text.color;
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function cardHTML(card) {
  return `
    <span class="rank">${card.rank}</span>
    <span class="suit">${SUITS[card.suit].symbol}</span>
    ${card.cursed ? `<span class="curse-mark">+</span>` : ""}
  `;
}

function emptyCardHTML() {
  return `<div class="card empty-card"><span class="rank">+</span><span class="suit">Slot</span></div>`;
}

function shopCardDetails(card) {
  const base = describeCardBaseBonus(card);
  if (!card.cursed) return base;
  return `${base} · ${card.curse.name}`;
}

function effectiveHandSlots() {
  const stats = state.stats || calculateStats();
  return state.handSlots + stats.extraCardSlots;
}

function hasFreeHandSlot() {
  return state.hand.length < effectiveHandSlots();
}

function cratePacksWaiting() {
  return state.pendingCratePacks + (state.packContext?.type === "cratePack" ? 1 : 0);
}

function updateGodCountdown() {
  if (!state?.godMode || !ui.godCountdown) return;
  const secondsLeft = Math.max(0, Math.ceil((state.godCloseEndsAt - performance.now()) / 1000));
  ui.godCountdown.textContent = secondsLeft;
}

function closeGodPage() {
  window.open("", "_self");
  window.close();
  setTimeout(() => {
    if (!document.hidden) {
      window.location.replace("about:blank");
    }
  }, 300);
}

function triggerGodMode() {
  if (state.godMode) return;
  state.godMode = true;
  state.godCloseEndsAt = performance.now() + 10000;
  state.money = 999999;
  state.moneyDust = 0;
  state.enemies = [];
  state.enemyBullets = [];
  state.projectiles = [];
  state.pulses = [];
  state.crates = [];
  state.pendingCratePacks = 0;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.packOffer = [];
  state.packContext = null;
  state.stats = calculateStats();
  state.player.hp = state.stats.maxHp;
  state.player.invuln = 999999;
  cameraShake = 0.6;
  ui.shop.classList.add("is-hidden");
  ui.gameOver.classList.add("is-hidden");
  ui.godMode.classList.remove("is-hidden");
  updateGodCountdown();
  clearTimeout(godCloseTimeout);
  clearInterval(godCountdownInterval);
  godCountdownInterval = setInterval(updateGodCountdown, 250);
  godCloseTimeout = setTimeout(closeGodPage, 10000);
}

function packDetails(pack) {
  const color = pack.suit ? ` ${SUITS[pack.suit].symbol} ${SUITS[pack.suit].name}` : "";
  return `${pack.size} cartes${color}`;
}

function weaponStatLine(weapon) {
  return `${Math.round(weapon.damage)} DMG · ${weapon.baseCooldown.toFixed(2)}S · ${weapon.range} POR`;
}

function weaponScalingEffects(weapon) {
  const effects = { damage: 0, flatDamage: 0, money: 0, attackSpeed: 0, maxHp: 0, maxHpMultiplier: 0, regen: 0, cardSlots: 0, critChance: 0, moveSpeed: 0 };
  const count = state?.stats?.[weapon.suit] || 0;
  getWeaponScalingType(weapon.scalingTypeId).apply(effects, count, weapon.grade.statMult);
  return { count, effects };
}

function formatWeaponScalingBonus(weapon) {
  const suit = SUITS[weapon.suit];
  const { count, effects } = weaponScalingEffects(weapon);
  const parts = [];
  if (effects.damage) parts.push(`+${Math.round(effects.damage * 100)}% DMG`);
  if (effects.money) parts.push(`+${Math.round(effects.money * 100)}% OR`);
  if (effects.attackSpeed) parts.push(`+${Math.round(effects.attackSpeed * 100)}% CAD`);
  if (effects.critChance) parts.push(`+${Math.round(effects.critChance * 100)}% CRIT`);
  if (effects.maxHp) parts.push(`+${Math.round(effects.maxHp)} PV`);
  if (effects.regen) parts.push(`+${effects.regen.toFixed(1)} REG`);
  if (effects.moveSpeed) parts.push(`+${Math.round(effects.moveSpeed)} VIT`);
  return `${count} ${suit.symbol} = ${parts.length ? parts.join(" / ") : "0 bonus"}`;
}

function weaponModBadges(weapon) {
  if (!weapon.modifiers.length) return "";
  return `
    <div class="weapon-tags">
      ${weapon.modifiers.map((mod) => `<span>${mod.name}</span>`).join("")}
    </div>
  `;
}

function weaponScalingBlock(weapon) {
  const suit = SUITS[weapon.suit];
  const scalingType = getWeaponScalingType(weapon.scalingTypeId);
  return `
    <div class="weapon-scale" style="--scale-color:${weapon.color}">
      <span>${suit.symbol} ${suit.name}</span>
      <strong>${scalingType.name}</strong>
    </div>
  `;
}

function weaponCardHTML(weapon, options = {}) {
  const replaceAttr = options.replaceIndex !== undefined ? `data-replace-weapon="${options.replaceIndex}"` : "";
  const offerAttr = options.shopSlotId ? `data-shop-slot="${options.shopSlotId}"` : "";
  const disabledAttr = options.disabled ? "aria-disabled=\"true\"" : "";
  const tag = options.shopSlotId ? "market-item weapon-offer" : "weapon";
  const lockButton = options.shopSlotId
    ? `<button class="lock-button ${options.locked ? "is-locked" : ""}" type="button" data-lock-slot="${weapon.id}">${options.locked ? "LOCK" : "GARDER"}</button>`
    : "";
  const cta = options.price
    ? `<div class="action-pill ${options.disabled ? "is-disabled" : ""}">$${options.price}</div>`
    : options.replaceIndex !== undefined
      ? `<div class="action-pill">JETER</div>`
      : "";

  return `
    <article class="${tag} ${options.locked ? "is-locked" : ""}" style="--rarity:${weapon.gradeColor}; --weapon-suit:${weapon.color}" ${offerAttr} ${replaceAttr} ${disabledAttr}>
      ${lockButton}
      <div class="weapon-top">
        <span class="grade">${weapon.grade.name} · Niv.${weapon.level}</span>
        <strong>${weapon.baseName}</strong>
      </div>
      ${weaponScalingBlock(weapon)}
      <div class="scaling-bonus">${formatWeaponScalingBonus(weapon)}</div>
      <div class="stat-strip">${weaponStatLine(weapon)}</div>
      ${weaponModBadges(weapon)}
      ${cta}
    </article>
  `;
}

function signedDelta(value, precision = 0) {
  const rounded = Number(value.toFixed(precision));
  if (rounded === 0) return "0";
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function compareBadge(label, value, precision = 0) {
  const rounded = Number(value.toFixed(precision));
  const stateClass = rounded > 0 ? "is-good" : rounded < 0 ? "is-bad" : "";
  return `<span class="${stateClass}">${label} ${signedDelta(value, precision)}</span>`;
}

function weaponCompareStats(candidate, current) {
  return `
    <div class="compare-deltas">
      ${compareBadge("DMG", candidate.damage - current.damage)}
      ${compareBadge("SPD", current.baseCooldown - candidate.baseCooldown, 2)}
      ${compareBadge("POR", candidate.range - current.range)}
      ${compareBadge("PWR", weaponScore(candidate) - weaponScore(current), 1)}
    </div>
  `;
}

function statBox(label, value) {
  return `
    <div class="stat-box">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderShopRunInfo() {
  if (!ui.shopRunInfo) return;
  const character = state.character;
  const characterName = character?.name || "Aucun";
  const characterDesc = character?.desc || "Pas de modificateur de personnage.";
  ui.shopRunInfo.innerHTML = `
    <article class="run-character">
      <span class="label">Personnage</span>
      <strong>${characterName}</strong>
      <p>${characterDesc}</p>
    </article>
    <div class="shop-stat-grid">
      ${statBox("PV", `${Math.ceil(state.player.hp)} / ${state.stats.maxHp}`)}
      ${statBox("Regen", state.stats.regen.toFixed(1))}
      ${statBox("Dégâts", `+${state.stats.flatDamage} · x${state.stats.damageMultiplier.toFixed(2)}`)}
      ${statBox("Cadence", `x${state.stats.attackSpeedMultiplier.toFixed(2)}`)}
      ${statBox("Crit", `${Math.round(state.stats.critChance * 100)}%`)}
      ${statBox("Vitesse", Math.round(state.stats.moveSpeed))}
      ${statBox("Or", `x${state.stats.moneyMultiplier.toFixed(2)}`)}
      ${statBox("Main", `${state.hand.length}/${effectiveHandSlots()}`)}
      ${statBox("Poker", state.stats.handName)}
      ${statBox("Bonus poker", `+${Math.round(state.stats.handDamageBonus * 100)}%`)}
      ${statBox("Armes", `${state.weapons.length}/${MAX_WEAPONS}`)}
      ${statBox("Caisses", cratePacksWaiting())}
      ${statBox("Map", `${state.stats.mapWidth}x${state.stats.mapHeight}`)}
    </div>
  `;
}

function positionWeaponCompare(anchor) {
  if (!anchor || !ui.weaponCompare) return;
  const anchorRect = anchor.getBoundingClientRect();
  const compareRect = ui.weaponCompare.getBoundingClientRect();
  const gap = 14;
  const margin = 14;
  const rightSpace = window.innerWidth - anchorRect.right;
  const leftSpace = anchorRect.left;
  let left = rightSpace >= compareRect.width + gap || rightSpace >= leftSpace
    ? anchorRect.right + gap
    : anchorRect.left - compareRect.width - gap;
  let top = anchorRect.top;

  left = clamp(left, margin, window.innerWidth - compareRect.width - margin);
  top = clamp(top, margin, window.innerHeight - compareRect.height - margin);
  ui.weaponCompare.style.left = `${left}px`;
  ui.weaponCompare.style.top = `${top}px`;
}

function renderWeaponCompare(anchor = null) {
  if (!ui.weaponCompare) return;
  const candidate = state.shopSlots.find((slot) => slot.id === state.previewWeaponId && slot.type === "weapon" && !slot.bought);
  if (!candidate || state.pendingWeapon || !state.betweenWaves) {
    ui.weaponCompare.classList.add("is-hidden");
    ui.weaponCompare.innerHTML = "";
    ui.weaponCompare.style.left = "";
    ui.weaponCompare.style.top = "";
    return;
  }

  ui.weaponCompare.classList.remove("is-hidden");
  ui.weaponCompare.innerHTML = `
    <h3>COMPARATIF</h3>
    <div class="compare-grid">
      <div>
        <span class="label">Offre</span>
        ${weaponCardHTML(candidate)}
      </div>
      <div>
        <span class="label">Tes armes</span>
        <div class="compare-equipped">
          ${
            state.weapons.length
              ? state.weapons
                  .map(
                    (weapon) => `
                      <div class="compare-current">
                        ${weaponCardHTML(weapon)}
                        ${weaponCompareStats(candidate, weapon)}
                      </div>
                    `,
                  )
                  .join("")
              : `<div class="compare-empty">Aucune arme équipée</div>`
          }
        </div>
      </div>
    </div>
  `;
  positionWeaponCompare(anchor || document.querySelector(`[data-shop-slot="${state.previewWeaponId}"]`));
}

function renderShopSlot(slot) {
  if (slot.bought) {
    return `
      <article class="market-item is-bought">
        <span class="label">Acheté</span>
        <h4>${slot.name}</h4>
      </article>
    `;
  }

  const lockButton = `
    <button class="lock-button ${slot.locked ? "is-locked" : ""}" type="button" data-lock-slot="${slot.id}">
      ${slot.locked ? "LOCK" : "GARDER"}
    </button>
  `;

  if (slot.type === "card" || slot.type === "cursedCard") {
    const fullHand = !hasFreeHandSlot();
    const disabled = state.money < slot.price || fullHand;
    return `
      <article class="market-item ${slot.locked ? "is-locked" : ""} ${slot.type === "cursedCard" ? "is-cursed" : ""}" data-shop-slot="${slot.id}" ${disabled ? "aria-disabled=\"true\"" : ""}>
        ${lockButton}
        <div class="market-card card ${slot.card.suit}">${cardHTML(slot.card)}</div>
        <div>
          <span class="label">${slot.name}</span>
          <h4>${slot.card.rank}${SUITS[slot.card.suit].symbol}</h4>
          <p>${shopCardDetails(slot.card)}</p>
        </div>
        <div class="action-pill ${disabled ? "is-disabled" : ""}">${fullHand ? "Main pleine" : `$${slot.price}`}</div>
      </article>
    `;
  }

  if (slot.type === "pack") {
    const fullHand = !hasFreeHandSlot();
    const disabled = state.money < slot.price || fullHand;
    return `
      <article class="market-item ${slot.locked ? "is-locked" : ""}" data-shop-slot="${slot.id}" ${disabled ? "aria-disabled=\"true\"" : ""}>
        ${lockButton}
        <div>
          <span class="label">Pack</span>
          <h4>${slot.name}</h4>
          <p>${packDetails(slot)}</p>
        </div>
        <div class="action-pill ${disabled ? "is-disabled" : ""}">${fullHand ? "Main pleine" : `$${slot.price}`}</div>
      </article>
    `;
  }

  if (slot.type === "cardCurse") {
    const disabled = state.money < slot.price || state.hand.every((card) => card.cursed);
    return `
      <article class="market-item is-cursed ${slot.locked ? "is-locked" : ""}" data-shop-slot="${slot.id}" ${disabled ? "aria-disabled=\"true\"" : ""}>
        ${lockButton}
        <div>
          <span class="label">Malédiction</span>
          <h4>${slot.name}</h4>
          <p>${slot.desc}</p>
        </div>
        <div class="action-pill ${disabled ? "is-disabled" : ""}">$${slot.price}</div>
      </article>
    `;
  }

  if (slot.type === "weapon") {
    const disabled = state.money < slot.price;
    return weaponCardHTML(slot, { shopSlotId: slot.id, price: slot.price, disabled, locked: slot.locked });
  }

  const disabled = state.money < slot.price;
  return `
    <article class="market-item ${slot.locked ? "is-locked" : ""}" data-shop-slot="${slot.id}" ${disabled ? "aria-disabled=\"true\"" : ""}>
      ${lockButton}
      <div>
        <span class="label">${slot.type === "slot" ? "Main" : "Modificateur"}</span>
        <h4>${slot.name}</h4>
        <p>${slot.desc}</p>
      </div>
      <div class="action-pill ${disabled ? "is-disabled" : ""}">$${slot.price}</div>
    </article>
  `;
}

function renderUI() {
  state.stats = calculateStats();
  updateUIAccent();
  updateGodCountdown();
  ui.playerNameHud.textContent = state.playerName;
  ui.wave.textContent = state.wave;
  ui.hp.textContent = `${Math.ceil(state.player.hp)} / ${state.stats.maxHp}`;
  ui.money.textContent = `$${state.money}`;
  ui.goldMultiplier.textContent = `x${state.stats.moneyMultiplier.toFixed(2)}`;
  ui.shopGold.textContent = `$${state.money}`;
  ui.shopGoldMultiplier.textContent = `OR x${state.stats.moneyMultiplier.toFixed(2)}`;
  const crateHudCount = state.pendingCratePacks + state.crates.length;
  ui.enemyCount.textContent = state.betweenWaves
    ? "Shop"
    : `${Math.ceil(state.waveTimeLeft)}s · ${state.enemies.length}`;
  if (state.betweenWaves && cratePacksWaiting() > 0) {
    ui.enemyCount.textContent = `Shop | ${cratePacksWaiting()} caisse`;
  } else if (!state.betweenWaves && crateHudCount > 0) {
    ui.enemyCount.textContent = `${Math.ceil(state.waveTimeLeft)}s | ${state.enemies.length} | C${crateHudCount}`;
  }
  ui.rerollShop.textContent = `Relancer - $${rerollCost()}`;
  ui.rerollShop.disabled = !state.betweenWaves || state.money < rerollCost() || state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0;
  ui.startWave.disabled = Boolean(state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0);
  ui.handRank.textContent = `${state.stats.handName} · +${Math.round(state.stats.handDamageBonus * 100)}%`;

  const emptySlots = Math.max(0, effectiveHandSlots() - state.hand.length);
  ui.hand.innerHTML =
    state.hand.map((card) => `<div class="card ${card.suit}">${cardHTML(card)}</div>`).join("") +
    Array.from({ length: emptySlots }, emptyCardHTML).join("");

  ui.suits.innerHTML = Object.entries(SUITS)
    .map(([key, suit]) => {
      const value = state.stats[key];
      return `
        <div class="suit-stat">
          <b style="color:${suitAccent(key)}">${suit.symbol} ${value}</b>
          <span>${suit.stat}</span>
        </div>
      `;
    })
    .join("");

  ui.weapons.innerHTML = state.weapons
    .map(
      (weapon, index) => weaponCardHTML(weapon, state.pendingWeapon ? { replaceIndex: index } : {}),
    )
    .join("") +
    Array.from({ length: Math.max(0, MAX_WEAPONS - state.weapons.length) }, () => `
      <article class="weapon empty-weapon">
        <div class="weapon-top">
          <span class="grade">Vide</span>
          <strong>SLOT LIBRE</strong>
        </div>
      </article>
    `).join("");

  ui.dpsHint.textContent = `DMG x${state.stats.damageMultiplier.toFixed(2)} · CRIT ${Math.round(state.stats.critChance * 100)} · SPD x${state.stats.attackSpeedMultiplier.toFixed(2)}`;

  ui.shopHand.innerHTML =
    state.hand
      .map(
        (card, index) => `
          <article class="shop-hand-card" ${state.pendingCurse && !card.cursed ? `data-curse-card="${index}"` : !state.pendingCurse ? `data-sell-card="${index}"` : ""}>
            <div class="card ${card.suit}">${cardHTML(card)}</div>
            <div>
              <strong>${card.rank}${SUITS[card.suit].symbol}</strong>
              <p>${shopCardDetails(card)}</p>
            </div>
            ${
              state.pendingCurse
                ? card.cursed
                  ? `<div class="action-pill is-disabled">Déjà</div>`
                  : `<div class="action-pill">Appliquer</div>`
                : `<div class="action-pill">+$${sellValue(card)}</div>`
            }
          </article>
        `,
      )
      .join("") + Array.from({ length: emptySlots }, emptyCardHTML).join("");

  ui.shopSlots.innerHTML = state.shopSlots.map(renderShopSlot).join("");
  renderWeaponCompare();
  renderShopRunInfo();

  ui.packChoiceTitle.textContent = state.packContext
    ? hasFreeHandSlot()
      ? `${state.packContext.name} · Choisis 1`
      : "Main pleine · Vends 1 carte"
    : state.pendingWeapon
      ? "JETER UNE ARME"
    : state.pendingCurse
      ? `${state.pendingCurse.name} · Cible`
    : "PACK";
  ui.packChoiceTitle.classList.toggle("is-hidden", state.packOffer.length === 0 && !state.pendingCurse && !state.pendingWeapon);
  ui.packOffer.classList.toggle("is-replacing-weapon", Boolean(state.pendingWeapon));

  ui.packOffer.innerHTML = state.pendingWeapon
    ? state.weapons
        .map((weapon, index) => weaponCardHTML(weapon, { replaceIndex: index }))
        .join("")
    : state.packOffer
        .map(
          (card, index) => `
            <div class="card ${card.suit}" data-card="${index}" title="Ajouter cette carte">
              ${cardHTML(card)}
            </div>
          `,
        )
        .join("");
}

function pickReplacementIndex(card) {
  const currentStats = calculateStats();
  let bestIndex = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < state.hand.length; i += 1) {
    const testHand = state.hand.slice();
    testHand[i] = card;
    const oldHand = state.hand;
    state.hand = testHand;
    const stats = calculateStats();
    state.hand = oldHand;

    const score =
      (stats.damageMultiplier - currentStats.damageMultiplier) * 12 +
      (stats.attackSpeedMultiplier - currentStats.attackSpeedMultiplier) * 10 +
      (stats.moneyMultiplier - currentStats.moneyMultiplier) * 8 +
      (stats.maxHp - currentStats.maxHp) * 0.12 +
      stats.handPower -
      currentStats.handPower;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestScore > 0 ? bestIndex : state.hand.findIndex((owned) => owned.value === Math.min(...state.hand.map((card) => card.value)));
}

function addCardToHand(card) {
  if (state.hand.some((owned) => cardKey(owned) === cardKey(card))) {
    return false;
  }
  if (!hasFreeHandSlot()) {
    return false;
  }
  state.hand.push(card);
  if (new Set(state.hand.map(cardKey)).size >= FULL_DECK_SIZE) {
    triggerGodMode();
  }
  return true;
}

function openNextCratePack() {
  if (state.pendingCratePacks <= 0) return false;
  state.pendingCratePacks -= 1;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.packContext = {
    id: uniqueId("crate-pack"),
    type: "cratePack",
    name: "Caisse recuperee",
    size: 4,
    price: 0,
  };
  state.packOffer = drawUniqueCards(4, { exclude: usedCardKeys() });
  return state.packOffer.length > 0;
}

function chooseCard(index) {
  if (state.pendingWeapon) return;
  const card = state.packOffer[index];
  if (!card) return;
  if (!addCardToHand(card)) return;
  state.packOffer = [];
  state.packContext = null;
  openNextCratePack();
  state.stats = calculateStats();
  state.player.hp = Math.min(state.stats.maxHp, state.player.hp + 12);
  renderUI();
}

function sellCard(index) {
  if (state.pendingCurse || state.pendingWeapon) return;
  const card = state.hand[index];
  if (!card) return;
  state.money += sellValue(card);
  state.hand.splice(index, 1);
  state.stats = calculateStats();
  state.player.hp = Math.min(state.player.hp, state.stats.maxHp);
  renderUI();
}

function rerollShop() {
  if (!state.betweenWaves || state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0) return;
  const cost = rerollCost();
  if (state.money < cost) return;
  state.money -= cost;
  state.shopRerolls += 1;
  state.previewWeaponId = null;
  state.shopSlots = rollShopSlots();
  renderUI();
}

function toggleShopLock(id) {
  if (!state.betweenWaves || state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0) return;
  const slot = state.shopSlots.find((item) => item.id === id);
  if (!slot || slot.bought) return;
  slot.locked = !slot.locked;
  renderUI();
}

function equipWeapon(weapon) {
  const equipped = { ...weapon, cooldown: 0.2 };
  if (state.weapons.length < MAX_WEAPONS) {
    state.weapons.push(equipped);
    return true;
  }

  state.pendingWeapon = {
    weapon: equipped,
    heal: weapon.healthBonus,
  };
  return false;
}

function replaceWeapon(index) {
  if (!state.pendingWeapon || !state.weapons[index]) return;
  state.weapons[index] = state.pendingWeapon.weapon;
  const heal = state.pendingWeapon.heal;
  state.pendingWeapon = null;
  state.stats = calculateStats();
  state.player.hp = Math.min(state.stats.maxHp, state.player.hp + heal);
  renderUI();
}

function buyShopSlot(id) {
  const slot = state.shopSlots.find((item) => item.id === id);
  if (state.pendingWeapon) return;
  if (!slot || slot.bought || state.money < slot.price) return;
  if ((slot.type === "card" || slot.type === "cursedCard" || slot.type === "pack") && !hasFreeHandSlot()) return;
  if (state.previewWeaponId === slot.id) state.previewWeaponId = null;

  if (slot.type === "pack") {
    buyPack(slot);
    return;
  }

  if (slot.type === "cardCurse") {
    buyCardCurse(slot);
    return;
  }

  state.money -= slot.price;
  slot.bought = true;
  slot.locked = false;

  if (slot.type === "weapon") {
    const equippedNow = equipWeapon(slot);
    if (!equippedNow) {
      renderUI();
      return;
    }
  }

  if (slot.type === "card" || slot.type === "cursedCard") {
    if (!addCardToHand(slot.card)) {
      slot.bought = false;
      state.money += slot.price;
      renderUI();
      return;
    }
  }

  if (slot.type === "modifier") {
    state.modifiers.push({
      id: slot.id,
      name: slot.name,
      desc: slot.desc,
      effects: slot.effects,
    });
  }

  if (slot.type === "slot") {
    state.handSlots += 1;
  }

  state.stats = calculateStats();
  state.player.hp = Math.min(state.stats.maxHp, state.player.hp + (slot.type === "slot" ? 8 : slot.type === "weapon" ? slot.healthBonus : 0));
  renderUI();
}

function buyCardCurse(slot) {
  if (state.hand.every((card) => card.cursed)) return;
  state.money -= slot.price;
  slot.bought = true;
  state.pendingCurse = {
    name: slot.name,
    curse: slot.curse,
  };
  state.packOffer = [];
  state.packContext = null;
  renderUI();
}

function applyCurseToCard(index) {
  const card = state.hand[index];
  if (!card || !state.pendingCurse || card.cursed) return;
  card.cursed = true;
  card.curse = state.pendingCurse.curse;
  state.pendingCurse = null;
  state.stats = calculateStats();
  state.player.hp = Math.min(state.stats.maxHp, state.player.hp + 8);
  renderUI();
}

function buyPack(pack) {
  if (!pack || pack.bought || state.money < pack.price || !hasFreeHandSlot()) return;
  state.money -= pack.price;
  pack.bought = true;
  state.packContext = pack;
  state.pendingCurse = null;
  state.packOffer = drawUniqueCards(pack.size, { suit: pack.suit, exclude: usedCardKeys() });
  renderUI();
}

function loop(now) {
  if (!state) return;
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  renderGame();
  uiRefresh -= dt;
  if (uiRefresh <= 0 && !state.betweenWaves && !state.gameOver) {
    renderUI();
    uiRefresh = 0.12;
  }
  animationId = requestAnimationFrame(loop);
}

function restart() {
  cancelAnimationFrame(animationId);
  clearTimeout(godCloseTimeout);
  clearInterval(godCountdownInterval);
  connectedPlayerName = connectedPlayerName || state?.playerName || "Joueur";
  ui.gameOver.classList.add("is-hidden");
  ui.godMode.classList.add("is-hidden");
  ui.mainMenu.classList.add("is-hidden");
  ui.characterSelect.classList.add("is-hidden");
  ui.shop.classList.add("is-hidden");
  showCharacterSelect();
}

function randomCharacterChoices() {
  return CHARACTER_DEFS
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
}

function characterBonusText(character) {
  if (character.desc) return character.desc;
  const multipliers = character.cardEffectMultipliers || {};
  const lines = Object.entries(SUITS)
    .map(([suit, data]) => {
      const multiplier = multipliers[suit];
      if (!multiplier || multiplier === 1) return "";
      return `${data.symbol} x${multiplier}`;
    })
    .filter(Boolean);
  return lines.length ? lines.join(" · ") : "Aucun modificateur de couleur";
}

function startRun(character = null) {
  cancelAnimationFrame(animationId);
  clearTimeout(godCloseTimeout);
  clearInterval(godCountdownInterval);
  createState({ playerName: connectedPlayerName, character });
  ui.mainMenu.classList.add("is-hidden");
  ui.characterSelect.classList.add("is-hidden");
  ui.gameOver.classList.add("is-hidden");
  ui.godMode.classList.add("is-hidden");
  ui.shop.classList.add("is-hidden");
  lastTime = performance.now();
  beginWave();
  animationId = requestAnimationFrame(loop);
}

function showCharacterSelect() {
  const choices = randomCharacterChoices();
  if (choices.length < 3) {
    startRun();
    return;
  }

  ui.mainMenu.classList.add("is-hidden");
  ui.characterSelect.classList.remove("is-hidden");
  ui.characterChoices.innerHTML = choices
    .map(
      (character) => `
        <button class="character-card" type="button" data-character-id="${character.id}">
          <span class="label">${character.title || "Personnage"}</span>
          <strong>${character.name}</strong>
          <p>${character.desc || ""}</p>
          <div class="stat-strip">${characterBonusText(character)}</div>
        </button>
      `,
    )
    .join("");
}

function cleanPlayerName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 18);
}

function setConnectedPlayer(name) {
  connectedPlayerName = cleanPlayerName(name) || "Joueur";
  localStorage.setItem("pokerSurvivorName", connectedPlayerName);
  ui.playerNameInput.value = connectedPlayerName;
  ui.menuPlayerName.textContent = `Connecté: ${connectedPlayerName}`;
  ui.launchGame.disabled = false;
  ui.playerNameHud.textContent = connectedPlayerName;
}

function connectPlayer() {
  setConnectedPlayer(ui.playerNameInput.value);
}

function launchGame() {
  const typedName = cleanPlayerName(ui.playerNameInput.value);
  if (typedName && typedName !== connectedPlayerName) setConnectedPlayer(typedName);
  if (!connectedPlayerName) connectPlayer();
  showCharacterSelect();
}

function initMenu() {
  resizeCanvas();
  ui.mainMenu.classList.remove("is-hidden");
  ui.characterSelect.classList.add("is-hidden");
  ui.playerNameInput.value = connectedPlayerName;
  ui.launchGame.disabled = !connectedPlayerName;
  ui.menuPlayerName.textContent = connectedPlayerName ? `Connecté: ${connectedPlayerName}` : "Aucun joueur connecté";
  ui.playerNameHud.textContent = connectedPlayerName || "-";
  renderGameShell();
}

function renderGameShell() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawGridBackdrop();
}

window.addEventListener("resize", resizeCanvas);
ui.connectPlayer.addEventListener("click", connectPlayer);
ui.launchGame.addEventListener("click", launchGame);
ui.characterChoices.addEventListener("click", (event) => {
  const button = event.target.closest("[data-character-id]");
  if (!button) return;
  const character = CHARACTER_DEFS.find((item) => item.id === button.dataset.characterId);
  if (!character) return;
  startRun(character);
});
ui.playerNameInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  if (connectedPlayerName) {
    launchGame();
    return;
  }
  connectPlayer();
});
window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
});
window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

ui.shopHand.addEventListener("click", (event) => {
  const curseButton = event.target.closest("[data-curse-card]");
  if (curseButton) {
    applyCurseToCard(Number(curseButton.dataset.curseCard));
    return;
  }

  const button = event.target.closest("[data-sell-card]");
  if (!button) return;
  sellCard(Number(button.dataset.sellCard));
});
ui.weapons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-replace-weapon]");
  if (!button) return;
  replaceWeapon(Number(button.dataset.replaceWeapon));
});
ui.shopSlots.addEventListener("click", (event) => {
  const lockButton = event.target.closest("[data-lock-slot]");
  if (lockButton) {
    event.stopPropagation();
    toggleShopLock(lockButton.dataset.lockSlot);
    return;
  }

  const button = event.target.closest("[data-shop-slot]");
  if (!button) return;
  buyShopSlot(button.dataset.shopSlot);
});
ui.shopSlots.addEventListener("mouseover", (event) => {
  const item = event.target.closest("[data-shop-slot]");
  if (!item || !ui.shopSlots.contains(item)) return;
  const slot = state.shopSlots.find((entry) => entry.id === item.dataset.shopSlot);
  const nextPreview = slot?.type === "weapon" ? slot.id : null;
  if (state.previewWeaponId === nextPreview) return;
  state.previewWeaponId = nextPreview;
  renderWeaponCompare(item);
});
ui.shopSlots.addEventListener("mousemove", (event) => {
  if (!state.previewWeaponId || ui.weaponCompare.classList.contains("is-hidden")) return;
  const item = event.target.closest("[data-shop-slot]");
  if (!item || item.dataset.shopSlot !== state.previewWeaponId) return;
  positionWeaponCompare(item);
});
ui.shopSlots.addEventListener("mouseout", (event) => {
  const item = event.target.closest("[data-shop-slot]");
  if (!item || item.contains(event.relatedTarget)) return;
  const slot = state.shopSlots.find((entry) => entry.id === item.dataset.shopSlot);
  if (slot?.id !== state.previewWeaponId) return;
  state.previewWeaponId = null;
  renderWeaponCompare();
});
window.addEventListener("scroll", () => {
  if (!state?.previewWeaponId) return;
  positionWeaponCompare(document.querySelector(`[data-shop-slot="${state.previewWeaponId}"]`));
}, true);
ui.rerollShop.addEventListener("click", rerollShop);
ui.packOffer.addEventListener("click", (event) => {
  const replaceButton = event.target.closest("[data-replace-weapon]");
  if (replaceButton) {
    replaceWeapon(Number(replaceButton.dataset.replaceWeapon));
    return;
  }

  const button = event.target.closest("[data-card]");
  if (!button) return;
  chooseCard(Number(button.dataset.card));
});
ui.startWave.addEventListener("click", beginWave);
ui.restart.addEventListener("click", restart);

window.PokerSurvivorDebug = {
  triggerGodMode,
  fillDeck() {
    const owned = new Set(state.hand.map(cardKey));
    for (const suit of Object.keys(SUITS)) {
      for (const rank of RANKS) {
        const key = `${rank.label}-${suit}`;
        if (owned.has(key)) continue;
        state.hand.push({
          id: uniqueId(`${rank.label}-${suit}`),
          suit,
          rank: rank.label,
          value: rank.value,
        });
        owned.add(key);
      }
    }
    state.handSlots = Math.max(state.handSlots, FULL_DECK_SIZE);
    triggerGodMode();
    renderUI();
  },
};

initMenu();

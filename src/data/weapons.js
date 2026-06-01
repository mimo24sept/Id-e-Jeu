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
    range: 160,
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
  { id: "green", name: "Verte", color: "#71d58a", weight: 58, damageMult: 1, priceMult: 1, cardEquivalent: 1, statMult: 1, modCount: 0 },
  { id: "blue", name: "Bleue", color: "#58b7e9", weight: 27, damageMult: 1.28, priceMult: 1.45, cardEquivalent: 2, statMult: 1.18, modCount: 1 },
  { id: "purple", name: "Violette", color: "#b278ff", weight: 11, damageMult: 1.68, priceMult: 2.15, cardEquivalent: 3, statMult: 1.42, modCount: 2 },
  { id: "yellow", name: "Jaune", color: "#f0d24b", weight: 4, damageMult: 2.25, priceMult: 3.15, cardEquivalent: 3, statMult: 1.75, modCount: 3 },
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



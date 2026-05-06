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



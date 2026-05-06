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

function pokerHand(name, bonusKey, power) {
  const damageBonus = POKER_DAMAGE_BONUS[bonusKey];
  return { name, multiplier: 1 + damageBonus, damageBonus, power };
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

function hasStraight(cards, minimumLength = 5) {
  return longestStraightLength(cards) >= minimumLength;
}

function hasStraightFlush(cards) {
  return Object.keys(SUITS).some((suit) => hasStraight(cards.filter((card) => card.suit === suit), 5));
}

function evaluateBestPokerHand(cards) {
  if (cards.length === 0) return pokerHand("Aucune carte", "high", 0);
  if (cards.length <= 5) return evaluateFiveCardHand(cards);

  const groups = rankGroupCounts(cards).sort((a, b) => b - a);
  const pairCount = groups.filter((count) => count >= 2).length;
  const tripleCount = groups.filter((count) => count >= 3).length;
  const hasFlush = Object.keys(SUITS).some((suit) => cards.filter((card) => card.suit === suit).length >= 5);
  const hasFullHouse = tripleCount >= 1 && (pairCount >= 2 || groups.filter((count) => count >= 3).length >= 2);

  if (hasStraightFlush(cards)) return pokerHand("Quinte flush", "straightFlush", 8);
  if (groups[0] >= 4) return pokerHand("Carré", "four", 7);
  if (hasFullHouse) return pokerHand("Full", "fullHouse", 6);
  if (hasFlush) return pokerHand("Couleur", "flush", 5);
  if (hasStraight(cards)) return pokerHand("Quinte", "straight", 4);
  if (groups[0] >= 3) return pokerHand("Brelan", "three", 3);
  if (pairCount >= 2) return pokerHand("Double paire", "twoPair", 2);
  if (pairCount >= 1) return pokerHand("Paire", "pair", 1);
  return pokerHand("Carte haute", "high", 0);
}

function betterHand(candidate, current) {
  if (!candidate) return current;
  if (candidate.damageBonus > current.damageBonus) return candidate;
  if (candidate.damageBonus === current.damageBonus && candidate.power > current.power) return candidate;
  return current;
}

function pokerSpecial(name, bonusKey, power) {
  const damageBonus = POKER_DAMAGE_BONUS[bonusKey];
  return { name, multiplier: 1 + damageBonus, damageBonus, power };
}

function rankGroupCounts(cards) {
  const ranks = new Map();
  for (const card of cards) {
    ranks.set(card.value, (ranks.get(card.value) || 0) + 1);
  }
  return [...ranks.values()];
}

function completeSuitCount(cards) {
  return Object.keys(SUITS).filter((suit) => {
    const values = new Set(cards.filter((card) => card.suit === suit).map((card) => card.value));
    return RANKS.every((rank) => values.has(rank.value));
  }).length;
}

function specialHand(cards, best) {
  if (cards.length <= 5) return best;

  let upgraded = best;
  const groups = rankGroupCounts(cards);
  const pairCount = groups.filter((count) => count >= 2).length;
  const brelanCount = groups.filter((count) => count >= 3).length;
  const squareCount = groups.filter((count) => count >= 4).length;
  const fullRankCount = groups.filter((count) => count === 4).length;
  const fullSuits = completeSuitCount(cards);
  const suits = Object.keys(SUITS);

  for (const suit of suits) {
    const suited = cards.filter((card) => card.suit === suit);
    const royalValues = new Set(suited.map((card) => card.value));
    if ([10, 11, 12, 13, 14].every((value) => royalValues.has(value))) {
      upgraded = betterHand(pokerSpecial("Flush royal", "royalFlush", 9), upgraded);
    }
    if (suited.length >= 6) {
      upgraded = betterHand(pokerSpecial("Grande couleur", "grandFlush", 7), upgraded);
    }
    if (suited.length >= 7) {
      upgraded = betterHand(pokerSpecial("Couleur parfaite", "perfectFlush", 10), upgraded);
    }
  }

  const straightLength = longestStraightLength(cards);
  if (straightLength >= 6) upgraded = betterHand(pokerSpecial("Suite longue", "longStraight", 6), upgraded);
  if (straightLength >= 9) upgraded = betterHand(pokerSpecial("Autoroute royale", "megaStraight", 11), upgraded);
  if (straightLength >= 13) upgraded = betterHand(pokerSpecial("Route complète", "royalRoad", 15), upgraded);

  if (pairCount >= 3) upgraded = betterHand(pokerSpecial("Triple paire", "threePair", 4), upgraded);
  if (pairCount >= 4) upgraded = betterHand(pokerSpecial("Quatre paires", "fourPair", 7), upgraded);
  if (pairCount >= 5) upgraded = betterHand(pokerSpecial("Cinq paires", "fivePair", 10), upgraded);
  if (pairCount >= 6) upgraded = betterHand(pokerSpecial("Six paires", "sixPair", 14), upgraded);

  if (brelanCount >= 3) upgraded = betterHand(pokerSpecial("Triple brelan", "tripleBrelan", 11), upgraded);
  if (brelanCount >= 4) upgraded = betterHand(pokerSpecial("Quatre brelans", "quadrupleBrelan", 15), upgraded);
  if (brelanCount >= 5) upgraded = betterHand(pokerSpecial("Cinq brelans", "quintupleBrelan", 19), upgraded);

  if (squareCount >= 2) upgraded = betterHand(pokerSpecial("Double carré", "doubleSquare", 13), upgraded);
  if (squareCount >= 3) upgraded = betterHand(pokerSpecial("Triple carré", "tripleSquare", 18), upgraded);
  if (squareCount >= 4) upgraded = betterHand(pokerSpecial("Quatre carrés", "quadrupleSquare", 24), upgraded);
  if (squareCount >= 6) upgraded = betterHand(pokerSpecial("Six carrés", "sixSquare", 34), upgraded);

  if (fullRankCount >= 13) upgraded = betterHand(pokerSpecial("Toutes les familles", "rankCollector", 42), upgraded);

  if (fullSuits >= 1) upgraded = betterHand(pokerSpecial("Couleur complète", "completeSuit", 22), upgraded);
  if (fullSuits >= 2) upgraded = betterHand(pokerSpecial("Double couleur complète", "doubleCompleteSuit", 34), upgraded);
  if (fullSuits >= 3) upgraded = betterHand(pokerSpecial("Triple couleur complète", "tripleCompleteSuit", 48), upgraded);
  if (fullSuits >= 4) upgraded = betterHand(pokerSpecial("Deck chromatique", "fourCompleteSuits", 70), upgraded);

  return upgraded;
}

function evaluateHand(cards) {
  return specialHand(cards, evaluateBestPokerHand(cards));
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

function softCap(value, start, strength = 0.55) {
  if (value <= start) return value;
  const excess = value - start;
  return start + (excess < 1 ? excess * strength : Math.pow(excess, strength));
}

function moneyMultiplierValue(suits, effects) {
  const rawValue = 1 + suits.diamonds * 0.08 + effects.money;
  if (state.character?.id === "expert-comptable") {
    return softCap(rawValue, 2.3, 0.55);
  }
  return softCap(rawValue, 3.1, 0.72);
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
    moneyMultiplier: Math.max(0.25, moneyMultiplierValue(suits, effects)),
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



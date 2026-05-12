function rollCurse() {
  const roll = Math.random();
  if (roll > 0.94) return CURSES.find((curse) => curse.rare);
  const common = CURSES.filter((curse) => !curse.rare);
  return common[Math.floor(Math.random() * common.length)];
}

function rollCardCurseDef() {
  return pickWeighted([
    { weight: 25, value: CARD_CURSE_DEFS.find((curse) => curse.id === "curse-health-apply") },
    { weight: 25, value: CARD_CURSE_DEFS.find((curse) => curse.id === "curse-damage-apply") },
    { weight: 20, value: CARD_CURSE_DEFS.find((curse) => curse.id === "curse-speed-apply") },
    { weight: 10, value: CARD_CURSE_DEFS.find((curse) => curse.id === "curse-gold-apply") },
    { weight: 10, value: CARD_CURSE_DEFS.find((curse) => curse.id === "curse-slot-apply") },
    { weight: 10, value: CARD_CURSE_DEFS.find((curse) => curse.id === "curse-all-suits-apply") },
  ]).value;
}

function cardSuits(card) {
  return card.cursed && card.curse?.allSuits ? Object.keys(SUITS) : [card.suit];
}

function cardHasSuit(card, suit) {
  return cardSuits(card).includes(suit);
}

function scaleEffects(effects, multiplier = 1) {
  if (multiplier === 1) return effects;
  return Object.fromEntries(Object.entries(effects).map(([key, value]) => [key, value * multiplier]));
}

function revolutionSourceLevel(targetCard) {
  if (!state?.hand || targetCard.value < 2 || targetCard.value > 6) return 0;
  return state.hand.reduce((total, sourceCard) => {
    if (sourceCard.value < 2 || sourceCard.value > 6) return total;
    if (sourceCard.value === targetCard.value) return total;
    return total + cardMetaLevel(sourceCard);
  }, 0);
}

function revolutionBoostMultiplier(card) {
  return 1 + revolutionSourceLevel(card) * 0.08;
}

function metaRankLevelInHand(rankValue) {
  if (!state?.hand) return 0;
  return state.hand.reduce((total, card) => (card.value === rankValue ? total + cardMetaLevel(card) : total), 0);
}

function metaCardLevelInHand(rankValue, suit) {
  if (!state?.hand) return 0;
  return state.hand.reduce((total, card) => {
    if (card.value !== rankValue || card.suit !== suit) return total;
    return total + cardMetaLevel(card);
  }, 0);
}

function metaRunBonuses() {
  const levels = {
    stipend: metaRankLevelInHand(7),
    pacification: metaRankLevelInHand(8),
    bargaining: metaRankLevelInHand(9),
    legacy: metaRankLevelInHand(10),
    diamondJack: metaCardLevelInHand(11, "diamonds"),
    diamondQueen: metaCardLevelInHand(12, "diamonds"),
    diamondKing: metaCardLevelInHand(13, "diamonds"),
    diamondAce: metaCardLevelInHand(14, "diamonds"),
    spadeJack: metaCardLevelInHand(11, "spades"),
    spadeQueen: metaCardLevelInHand(12, "spades"),
    spadeKing: metaCardLevelInHand(13, "spades"),
    spadeAce: metaCardLevelInHand(14, "spades"),
    heartJack: metaCardLevelInHand(11, "hearts"),
    heartQueen: metaCardLevelInHand(12, "hearts"),
    heartKing: metaCardLevelInHand(13, "hearts"),
    heartAce: metaCardLevelInHand(14, "hearts"),
    clubJack: metaCardLevelInHand(11, "clubs"),
    clubQueen: metaCardLevelInHand(12, "clubs"),
    clubKing: metaCardLevelInHand(13, "clubs"),
    clubAce: metaCardLevelInHand(14, "clubs"),
  };
  const courtTaxMultiplier = levels.diamondAce > 0 ? 0.5 : 1;
  const stationaryTime = Math.max(0, state?.player?.stationaryTime || 0);
  const stationaryPower = Math.min(1, Math.max(0, stationaryTime - 0.45) / 1.55);
  const spadeAceMultiplier = 1 + levels.spadeAce * 0.18;
  const spadeStanceMultiplier = stationaryPower * spadeAceMultiplier;
  const heartAuraSizeMultiplier = 1 + levels.heartAce * 0.16;
  const clubAceMultiplier = levels.clubAce > 0 ? 2 : 1;
  const clubJackBounces = levels.clubJack > 0 ? 1 : 0;
  const clubQueenBounces = levels.clubQueen > 0 ? 2 : 0;
  const clubKingBounces = levels.clubKing > 0 ? 3 : 0;
  const clubJackPenalty = levels.clubJack > 0 ? 1 - Math.min(4, levels.clubJack) * 0.125 : 1;
  const clubQueenPenalty = levels.clubQueen > 0 ? 1 - Math.min(4, levels.clubQueen) * 0.125 : 1;
  const clubKingPenalty = levels.clubKing > 0 ? 1 - Math.min(4, levels.clubKing) * 0.125 : 1;
  return {
    levels,
    waveGold: levels.stipend * 3,
    enemyReduction: Math.min(0.4, levels.pacification * 0.025),
    packDiscount: Math.min(0.45, levels.bargaining * 0.03),
    fragmentMultiplier: 1 + Math.min(1, levels.legacy * 0.05),
    courtTaxMultiplier,
    diamondJackTaxRate: levels.diamondJack > 0 ? 0.2 * courtTaxMultiplier : 0,
    diamondQueenTaxRate: levels.diamondQueen > 0 ? 0.2 * courtTaxMultiplier : 0,
    diamondKingTaxRate: levels.diamondKing > 0 ? 0.5 * courtTaxMultiplier : 0,
    diamondKingBonusMultiplier: levels.diamondKing > 0 ? 1 + levels.diamondKing : 1,
    stationaryPower,
    spadeAceMultiplier,
    spadeAttackSpeed: levels.spadeJack * 0.08 * spadeStanceMultiplier,
    spadeMaxHp: levels.spadeQueen * 16 * spadeStanceMultiplier,
    spadeRegen: levels.spadeQueen * 0.18 * spadeStanceMultiplier,
    spadeDamage: levels.spadeKing * 0.1 * spadeStanceMultiplier,
    spadeRange: levels.spadeKing * 0.06 * spadeStanceMultiplier,
    heartAuraSizeMultiplier,
    heartSlowRadius: levels.heartJack > 0 ? (125 + levels.heartJack * 18) * heartAuraSizeMultiplier : 0,
    heartSlowMultiplier: Math.max(0.38, 1 - levels.heartJack * 0.08),
    heartDamageRadius: levels.heartQueen > 0 ? (110 + levels.heartQueen * 16) * heartAuraSizeMultiplier : 0,
    heartDamageDpsRatio: levels.heartQueen * 0.006,
    heartDamageRampRatio: levels.heartQueen * 0.004,
    heartDrainRadius: levels.heartKing > 0 ? (100 + levels.heartKing * 15) * heartAuraSizeMultiplier : 0,
    heartDrainDpsRatio: levels.heartKing * 0.0045,
    heartChainSpeedMultiplier: 1 + levels.heartKing * 0.08,
    clubAceMultiplier,
    clubBounceCount: (clubJackBounces + clubQueenBounces + clubKingBounces) * clubAceMultiplier,
    clubBounceSpeedMultiplier: levels.clubJack > 0 ? 1 - 0.36 * clubJackPenalty : 1,
    clubBounceDamageMultiplier: levels.clubQueen > 0 ? 1 - 0.42 * clubQueenPenalty : 1,
    clubBounceInaccuracy: levels.clubKing > 0 ? 0.46 * clubKingPenalty : 0,
  };
}

function characterCardMultiplier(character, suit) {
  const dynamicMultiplier = character?.getCardEffectMultiplier?.(state, suit);
  if (dynamicMultiplier !== undefined) return dynamicMultiplier;
  return character?.cardEffectMultipliers?.[suit] ?? 1;
}

function cardBaseEffects(card) {
  const faceMultiplier = cardFaceMultiplier(card);
  const characterMultiplier = characterCardMultiplier(state?.character, card.suit);
  const metaMultiplier = revolutionBoostMultiplier(card);
  let effects;
  if (faceMultiplier > 0) {
    const kingMultiplier = card.suit === "diamonds" && card.value === 13 ? metaRunBonuses().diamondKingBonusMultiplier : 1;
    const multiplierBonus = (faceMultiplier - 1) * kingMultiplier;
    if (card.suit === "spades") effects = { damage: multiplierBonus };
    else if (card.suit === "diamonds") effects = { money: multiplierBonus };
    else if (card.suit === "clubs") effects = { attackSpeed: multiplierBonus };
    else effects = { maxHpMultiplier: multiplierBonus };
    return scaleEffects(effects, characterMultiplier * metaMultiplier);
  }

  const value = cardStatValue(card);
  if (card.suit === "spades") effects = { flatDamage: value };
  else if (card.suit === "diamonds") effects = { money: value / 100 };
  else if (card.suit === "clubs") effects = { attackSpeed: value / 100 };
  else effects = { maxHp: value };
  return scaleEffects(effects, characterMultiplier * metaMultiplier);
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
  const flush = cards.length === 5 && Object.keys(SUITS).some((suit) => cards.every((card) => cardHasSuit(card, suit)));
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
  return Object.keys(SUITS).some((suit) => hasStraight(cards.filter((card) => cardHasSuit(card, suit)), 5));
}

function evaluateBestPokerHand(cards) {
  if (cards.length === 0) return pokerHand("Aucune carte", "high", 0);
  if (cards.length <= 5) return evaluateFiveCardHand(cards);

  const groups = rankGroupCounts(cards).sort((a, b) => b - a);
  const pairCount = groups.filter((count) => count >= 2).length;
  const tripleCount = groups.filter((count) => count >= 3).length;
  const hasFlush = Object.keys(SUITS).some((suit) => cards.filter((card) => cardHasSuit(card, suit)).length >= 5);
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
    const values = new Set(cards.filter((card) => cardHasSuit(card, suit)).map((card) => card.value));
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
    const suited = cards.filter((card) => cardHasSuit(card, suit));
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

function logarithmicMoneyMultiplier(suits, effects) {
  const rawBonus = suits.diamonds * 0.08 + effects.money;
  if (rawBonus <= 0) return 1 + rawBonus;
  return 1 + Math.log1p(rawBonus * 1.4) / Math.log(2.4);
}

function applyWeaponSuitIdentityEffects(effects, weapon, suitCount) {
  const gradeMult = weapon.grade.statMult;
  if (weapon.suit === "hearts") {
    effects.maxHp += suitCount * 5 * gradeMult;
    effects.regen += suitCount * 0.12 * gradeMult;
  }
  if (weapon.suit === "diamonds") {
    effects.money += suitCount * 0.018 * gradeMult;
  }
}

function calculateStats() {
  const suits = { spades: 0, diamonds: 0, clubs: 0, hearts: 0 };
  const effects = { damage: 0, flatDamage: 0, money: 0, attackSpeed: 0, maxHp: 0, maxHpMultiplier: 0, regen: 0, cardSlots: 0, critChance: 0, moveSpeed: 0 };
  const runBonuses = metaRunBonuses();
  state.hand.forEach((card) => {
    cardSuits(card).forEach((suit) => {
      suits[suit] += 1;
    });
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
    applyWeaponSuitIdentityEffects(effects, weapon, suitCount);
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
    damageMultiplier: Math.max(0.25, 1 + hand.damageBonus + suits.spades * 0.035 + effects.damage + runBonuses.spadeDamage),
    flatDamage: effects.flatDamage,
    attackSpeedMultiplier: Math.max(0.25, 1 + suits.clubs * 0.07 + effects.attackSpeed + runBonuses.spadeAttackSpeed),
    moneyMultiplier: Math.max(0.25, logarithmicMoneyMultiplier(suits, effects)),
    moveSpeed: Math.max(120, 225 + suits.clubs * 4 + effects.moveSpeed),
    maxHp: Math.round(maxHp + runBonuses.spadeMaxHp),
    regen: Math.max(0, suits.hearts * 0.18 + hand.power * 0.05 + effects.regen + runBonuses.spadeRegen),
    weaponRangeMultiplier: Math.max(0.5, 1 + runBonuses.spadeRange),
    stationaryPower: runBonuses.stationaryPower,
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
      weaponRangeMultiplier: 4,
      stationaryPower: 1,
      critChance: 1,
    };
  }

  return stats;
}



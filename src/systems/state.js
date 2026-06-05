function hasRelic(id) {
  return (state?.relics || []).includes(id);
}

function characterDominantSuit(character) {
  if (!character?.cardEffectMultipliers) return null;
  const entries = Object.entries(character.cardEffectMultipliers);
  if (entries.length === 0) return null;
  const maxMult = Math.max(...entries.map(([, v]) => v));
  const dominant = entries.filter(([, v]) => v === maxMult).map(([k]) => k);
  return dominant[Math.floor(Math.random() * dominant.length)];
}

function createState(options = {}) {
  const hand = [];
  const startingSuit = characterDominantSuit(options.character);
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
    player: { x: 0, y: 0, vx: 0, vy: 0, radius: 17, hp: 100, invuln: 0, stationaryTime: 0, healPenalty: 0 },
    enemies: [],
    smokeClouds: [],
    enemyBullets: [],
    projectiles: [],
    pulses: [],
    bodyguards: [],
    floatingText: [],
    crates: [],
    objective: null,
    objectiveItems: [],
    waveKillCount: 0,
    waveGoldCap: 0,
    waveGoldEarned: 0,
    crateSpawnTimer: 0,
    pendingCratePacks: 0,
    mapShape: options.mapShape || "square",
    relics: [],
    weapons: [createWeapon({ archetypeId: "rifle", gradeId: "green", ...(startingSuit && { suit: startingSuit }) })],
    waveTimeLeft: 0,
    spawnTimer: 0,
    godMode: false,
    godCloseEndsAt: 0,
    fragmentStakeMultiplier: 1,
    fragmentDecisionWave: 0,
    lastBossKind: null,
    gameOver: false,
    lowHpKills: 0,
    edgeTime: 0,
    bounceKills: 0,
    runRerolls: 0,
    runCursesApplied: 0,
    runMaxWeapons: 1,
    bossKills: 0,
    eventWaveMisses: 0,
  };
  state = initial;
  state.stats = calculateStats();
  state.player.hp = state.stats.maxHp;
  state.shopSlots = rollShopSlots();
  return state;
}

function cardPrice(card) {
  const faceTax = card.value >= 11 ? 0.2 : 0;
  const curseTax = card.cursed ? (card.curse.rare ? 1.2 : 0.45) : 0;
  return equivalentPrice(1 + faceTax + curseTax);
}

function sellValue(card) {
  const tb = talentBonuses();
  return Math.max(2, Math.floor(cardPrice(card) * 0.45 * (state.character?.sellMultiplier || 1) * (1 + (tb.sellBonus || 0))));
}

function characterShopPrice(basePrice, type) {
  let multiplier = state.character?.shopPriceMultiplier || 1;
  if (type === "card") multiplier *= state.character?.cardPriceMultiplier || 1;
  if (type === "weapon") multiplier *= state.character?.weaponPriceMultiplier || 1;
  if (type === "pack") multiplier *= state.character?.packPriceMultiplier || 1;
  if (type === "cursePack") multiplier *= state.character?.cursePackPriceMultiplier || 1;
  if (state.character?.gamblingPrices) multiplier *= random(0.4, 1.8);
  return Math.max(1, Math.round(basePrice * multiplier));
}

function shopPriceMultiplier(wave = state?.wave || 1) {
  const waveIndex = Math.max(0, wave - 1);
  return 1 + waveIndex * 0.045 + Math.floor(waveIndex / 10) * 0.1;
}

function scaleShopPrice(basePrice, wave = state?.wave || 1) {
  return Math.max(1, Math.round(basePrice * shopPriceMultiplier(wave)));
}

function expectedShopEnemyCount(wave = state?.wave || 1) {
  const duration = Math.min(15 + wave * 1.7, 54);
  const interval = Math.max(0.14, 0.72 - wave * 0.022);
  let burst = 1 + Math.floor(wave / 5);
  burst += Math.min(0.22 + wave * 0.025, 0.78);
  if (wave >= 4) burst += 0.28;
  if (wave >= 7) burst += 0.22;
  return (1 + Math.floor(duration / interval)) * burst + (wave % 10 === 0 ? 6 : 0);
}

function expectedShopEnemyValue(wave = state?.wave || 1) {
  const tier = Math.floor(Math.max(1, wave) / 10);
  const goldPressure = Math.max(0.58, 1 - Math.min(16, wave) * 0.025);
  const valueMult = Math.pow(1.35, tier) * goldPressure;
  const chances = {
    sprayer: wave >= 6 ? Math.min(0.06 + wave * 0.008, 0.22) : 0,
    dasher: wave >= 4 ? Math.min(0.08 + wave * 0.01, 0.26) : 0,
    brute: wave >= 3 ? Math.min(0.11 + wave * 0.014, 0.34) : 0,
    shooter: wave >= 2 ? Math.min(0.14 + wave * 0.014, 0.36) : 0,
  };
  const sprayerChance = chances.sprayer;
  const dasherChance = Math.min(chances.dasher, Math.max(0, 1 - sprayerChance));
  const bruteChance = Math.min(chances.brute, Math.max(0, 1 - sprayerChance - dasherChance));
  const shooterChance = Math.min(chances.shooter, Math.max(0, 1 - sprayerChance - dasherChance - bruteChance));
  const chaserChance = Math.max(0, 1 - sprayerChance - dasherChance - bruteChance - shooterChance);
  return (
    chaserChance * 0.95 +
    shooterChance * 1.55 +
    bruteChance * 2.35 +
    dasherChance * 1.75 +
    sprayerChance * 1.9
  ) * valueMult;
}

function expectedWaveIncome(wave = state?.wave || 1) {
  const fixed = 18 + wave * 6;
  const enemyGold = expectedShopEnemyCount(wave) * expectedShopEnemyValue(wave);
  const bossGold = wave % 10 === 0 ? 70 + wave * 8 : 0;
  return fixed + enemyGold + bossGold;
}

function equivalentPrice(cards, wave = state?.wave || 1) {
  return Math.max(1, Math.round((expectedWaveIncome(wave) / 3) * cards));
}

function cursePackPrice(pack) {
  return characterShopPrice(equivalentPrice(pack.cardEquivalent || 3), "cursePack");
}

function cardPackPrice(pack) {
  const tb = talentBonuses();
  const discounted = Math.max(1, Math.round(equivalentPrice(pack.cardEquivalent || (pack.size >= 6 ? 2.75 : 2)) * (1 - metaRunBonuses().packDiscount) * (1 - (tb.packDiscount || 0))));
  return characterShopPrice(discounted, "pack");
}

function rerollCost() {
  if (state.character?.freeFirstReroll && (state.shopRerolls || 0) === 0) return 0;
  const waveCost = 2 + Math.round(state.wave * state.wave / 10);
  const base = Math.round(waveCost * Math.pow(1.5, state.shopRerolls || 0));
  const tb = talentBonuses();
  return Math.max(1, Math.round(base * (1 - (tb.rerollDiscount || 0))));
}

function dominantHandSuits() {
  const counts = Object.fromEntries(Object.keys(SUITS).map((suit) => [suit, 0]));
  for (const card of state.hand) {
    cardSuits(card).forEach((suit) => {
      counts[suit] += 1;
    });
  }
  const maxCount = Math.max(...Object.values(counts));
  return Object.keys(counts).filter((suit) => counts[suit] === maxCount);
}

function pickPack({ size, specialized }) {
  const dominantSuits = specialized ? dominantHandSuits() : [];
  const packs = PACK_DEFS.filter((pack) => {
    if (pack.size !== size) return false;
    if (specialized) return pack.suit && dominantSuits.includes(pack.suit);
    return !pack.suit;
  });
  return packs[Math.floor(Math.random() * packs.length)];
}

function rollShopEntry(offeredCards = []) {
  const roll = Math.min(0.999, Math.random() + (state.character?.packBias || 0));

  if (roll < 0.4) {
    const card = drawCard({ exclude: new Set([...state.hand.map(cardKey), ...offeredCards.map(cardKey)]) });
    offeredCards.push(card);
    return {
      id: uniqueId("offer-card"),
      type: "card",
      name: "Carte simple",
      card,
      price: characterShopPrice(cardPrice(card), "card"),
      bought: false,
    };
  }

  if (roll < 0.55) {
    const weapon = createWeapon();
    return {
      ...weapon,
      price: characterShopPrice(weapon.price, "weapon"),
      bought: false,
    };
  }

  if (roll < 0.6) {
    const pack = CURSE_PACK_DEFS[Math.floor(Math.random() * CURSE_PACK_DEFS.length)];
    return {
      ...pack,
      id: uniqueId(pack.id),
      type: "cursePack",
      price: cursePackPrice(pack),
      bought: false,
    };
  }

  if (roll < 0.8) {
    const pack = pickPack({ size: 4, specialized: false });
    return {
      ...pack,
      id: uniqueId(pack.id),
      type: "pack",
      price: cardPackPrice(pack),
      bought: false,
    };
  }

  if (roll < 0.85) {
    const pack = pickPack({ size: 4, specialized: true });
    return {
      ...pack,
      id: uniqueId(pack.id),
      type: "pack",
      price: cardPackPrice(pack),
      bought: false,
    };
  }

  if (roll < 0.975) {
    const pack = pickPack({ size: 6, specialized: false });
    return {
      ...pack,
      id: uniqueId(pack.id),
      type: "pack",
      price: cardPackPrice(pack),
      bought: false,
    };
  }

  const pack = pickPack({ size: 6, specialized: true });
  return {
    ...pack,
    id: uniqueId(pack.id),
    type: "pack",
    price: cardPackPrice(pack),
    bought: false,
  };
}

function rollShopSlots() {
  const slots = state.shopSlots.filter((slot) => slot.locked && !slot.bought);
  const offeredCards = slots
    .filter((slot) => slot.type === "card")
    .map((slot) => slot.card);

  while (slots.length < 6) {
    slots.push(rollShopEntry(offeredCards));
  }
  return slots.sort(() => Math.random() - 0.5);
}



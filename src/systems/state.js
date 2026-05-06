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
  return 1 + waveIndex * 0.045 + Math.floor(waveIndex / 10) * 0.1;
}

function scaleShopPrice(basePrice, wave = state?.wave || 1) {
  return Math.max(1, Math.round(basePrice * shopPriceMultiplier(wave)));
}

function rerollCost() {
  return 3 + (state.shopRerolls || 0) * 2 + Math.floor(state.wave / 6);
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
  const roll = Math.random();

  if (roll < 0.4) {
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

  if (roll < 0.55) {
    return {
      ...createWeapon(),
      bought: false,
    };
  }

  if (roll < 0.6) {
    const pack = CURSE_PACK_DEFS[Math.floor(Math.random() * CURSE_PACK_DEFS.length)];
    return {
      ...pack,
      id: uniqueId(pack.id),
      type: "cursePack",
      price: scaleShopPrice(pack.price),
      bought: false,
    };
  }

  if (roll < 0.8) {
    const pack = pickPack({ size: 4, specialized: false });
    return {
      ...pack,
      id: uniqueId(pack.id),
      type: "pack",
      price: scaleShopPrice(pack.price),
      bought: false,
    };
  }

  if (roll < 0.85) {
    const pack = pickPack({ size: 4, specialized: true });
    return {
      ...pack,
      id: uniqueId(pack.id),
      type: "pack",
      price: scaleShopPrice(pack.price),
      bought: false,
    };
  }

  if (roll < 0.975) {
    const pack = pickPack({ size: 6, specialized: false });
    return {
      ...pack,
      id: uniqueId(pack.id),
      type: "pack",
      price: scaleShopPrice(pack.price),
      bought: false,
    };
  }

  const pack = pickPack({ size: 6, specialized: true });
  return {
    ...pack,
    id: uniqueId(pack.id),
    type: "pack",
    price: scaleShopPrice(pack.price),
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



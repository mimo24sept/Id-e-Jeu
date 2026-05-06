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



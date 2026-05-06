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
  return Math.max(5, scaleShopPrice(9 + rankTax + curseTax + handSizeTax()));
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

function handSizeTax() {
  const expectedCards = 5 + Math.max(1, state.wave) * 4;
  const excessCards = Math.max(0, state.hand.length - expectedCards);
  return Math.floor(excessCards * 2.1 + Math.max(0, excessCards - 6) * 2.4 + Math.max(0, excessCards - 14) * 4.5);
}

function packPrice(pack) {
  const sizeTax = pack.size === 6 ? Math.ceil(handSizeTax() * 1.45) : handSizeTax();
  const suitTax = pack.suit ? 2 + Math.floor(state.wave / 5) : 0;
  return scaleShopPrice(pack.price + sizeTax + suitTax);
}

function rerollCost() {
  return 3 + (state.shopRerolls || 0) * 2 + Math.floor(state.wave / 6) + Math.floor(handSizeTax() / 8);
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
      price: packPrice(pack),
      bought: false,
    };
  }

  if (roll < 0.64) {
    const curse = rollCardCurseDef();
    return {
      ...curse,
      id: uniqueId(curse.id),
      type: "cardCurse",
      price: scaleShopPrice(curse.rare ? 46 : 14) + (curse.rare ? state.wave * 2 + handSizeTax() : Math.floor(handSizeTax() * 0.45)),
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
      price: scaleShopPrice(modifier.price + Math.floor(handSizeTax() * 0.25)),
      bought: false,
    };
  }

  return {
    id: uniqueId("slot-upgrade"),
    type: "slot",
    name: "Emplacement de carte",
    desc: "+1 emplacement dans ta main.",
    price: scaleShopPrice(42 + handSizeTax() * 2) + state.wave * 2,
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



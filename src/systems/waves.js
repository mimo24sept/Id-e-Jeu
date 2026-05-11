function enemyTier(wave = state.wave) {
  return Math.floor(Math.max(1, wave) / 10);
}

function enemyTierMultiplier(wave = state.wave) {
  return Math.pow(1.75, enemyTier(wave));
}

function enemyGoldPressureMultiplier(wave = state.wave) {
  return Math.max(0.58, 1 - Math.min(16, wave) * 0.025);
}

function spendCourtMoneyAmount(amount) {
  const spent = Math.min(state.money, Math.max(0, Math.floor(amount)));
  state.money -= spent;
  return spent;
}

function addCourtStatModifier(spent, level) {
  if (spent <= 0 || level <= 0) return;
  const options = [
    {
      name: "Délit dégâts",
      label: "DMG",
      color: SUITS.spades.color,
      effects: { damage: spent * 0.0025 * level },
      text: `+${Math.round(spent * 0.25 * level)}% DMG`,
    },
    {
      name: "Délit cadence",
      label: "CAD",
      color: SUITS.clubs.color,
      effects: { attackSpeed: spent * 0.0022 * level },
      text: `+${Math.round(spent * 0.22 * level)}% CAD`,
    },
    {
      name: "Délit vie",
      label: "PV",
      color: SUITS.hearts.color,
      effects: { maxHp: Math.round(spent * 0.85 * level) },
      text: `+${Math.round(spent * 0.85 * level)} PV`,
    },
    {
      name: "Délit mobilité",
      label: "VIT",
      color: SUITS.clubs.color,
      effects: { moveSpeed: spent * 0.12 * level },
      text: `+${Math.round(spent * 0.12 * level)} VIT`,
    },
    {
      name: "Délit regen",
      label: "REG",
      color: SUITS.hearts.color,
      effects: { regen: spent * 0.01 * level },
      text: `+${(spent * 0.01 * level).toFixed(1)} REG`,
    },
  ];
  const chosen = options[Math.floor(Math.random() * options.length)];
  state.modifiers.push({
    id: uniqueId("diamond-jack"),
    name: chosen.name,
    desc: `Valet de carreau: ${chosen.text}`,
    effects: chosen.effects,
  });
  state.floatingText.push({
    x: state.player.x,
    y: state.player.y - 62,
    text: chosen.text,
    life: 1.4,
    color: chosen.color,
  });
}

function summonBodyguards(spent, level) {
  if (spent <= 0 || level <= 0) return;
  const count = Math.min(24, Math.max(1, Math.floor(spent / Math.max(28, 62 - level * 7))));
  const tier = enemyTier(state.wave);
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    state.bodyguards.push({
      id: uniqueId("bodyguard"),
      angle,
      radius: 12,
      orbit: 74 + (i % 3) * 24,
      hp: (24 + state.wave * 6) * Math.pow(1.25, tier) * (1 + level * 0.16),
      maxHp: (24 + state.wave * 6) * Math.pow(1.25, tier) * (1 + level * 0.16),
      cooldown: random(0.1, 0.8),
      fireRate: Math.max(0.52, 1.35 - level * 0.09),
      range: 580,
      damage: (9 + state.wave * 0.55) * Math.pow(1.25, tier) * (1 + level * 0.12),
    });
  }
  state.floatingText.push({
    x: state.player.x,
    y: state.player.y - 84,
    text: `${count} gardes`,
    life: 1.4,
    color: SUITS.diamonds.color,
  });
}

function applyDiamondCourtStartOfWave() {
  const bonuses = metaRunBonuses();
  const startingMoney = state.money;
  const jackSpent = spendCourtMoneyAmount(startingMoney * bonuses.diamondJackTaxRate);
  addCourtStatModifier(jackSpent, bonuses.levels.diamondJack);

  const queenSpent = spendCourtMoneyAmount(startingMoney * bonuses.diamondQueenTaxRate);
  summonBodyguards(queenSpent, bonuses.levels.diamondQueen);

  const kingSpent = spendCourtMoneyAmount(startingMoney * bonuses.diamondKingTaxRate);
  if (kingSpent > 0) {
    state.floatingText.push({
      x: state.player.x,
      y: state.player.y - 106,
      text: `impôt -$${kingSpent}`,
      life: 1.4,
      color: SUITS.diamonds.color,
    });
  }
}

function beginWave() {
  state.betweenWaves = false;
  state.packOffer = [];
  state.packContext = null;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.previewWeaponId = null;
  state.crates = [];
  state.bodyguards = [];
  state.crateSpawnTimer = random(2.5, 4.5);
  state.pendingCratePacks = 0;
  state.wave += state.wave === 0 ? 1 : 0;
  state.waveDuration = Math.min(15 + state.wave * 1.7, 54);
  state.waveTimeLeft = state.waveDuration;
  state.spawnTimer = 0;
  state.player.stationaryTime = 0;
  applyDiamondCourtStartOfWave();
  state.stats = calculateStats();
  if (state.wave % 10 === 0) spawnBoss();
  ui.shop.classList.add("is-hidden");
  renderUI();
  queueTutorialSteps(["waveControls", "handPanel", "weaponPanel", "crateField"]);
}

function completeWave() {
  state.betweenWaves = true;
  state.money += 18 + state.wave * 6 + metaRunBonuses().waveGold;
  state.wave += 1;
  state.shopRerolls = 0;
  state.crates = [];
  state.bodyguards = [];
  state.packOffer = [];
  state.packContext = null;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.previewWeaponId = null;
  state.shopSlots = rollShopSlots();
  openNextCratePack();
  renderUI();
  ui.shop.classList.remove("is-hidden");
  queueTutorialSteps(["shopGold", "shopHand", "shopMarket", "shopStart"]);
  if (state.packOffer.length > 0) queueTutorialSteps(["packChoice"]);
}

function spawnEnemy() {
  const angle = random(0, Math.PI * 2);
  const spawnDistance = Math.max(window.innerWidth, window.innerHeight) * 0.52 + 45;
  const wave = state.wave;
  const shooter = wave >= 2 && Math.random() < Math.min(0.14 + wave * 0.018, 0.42);
  const brute = wave >= 3 && Math.random() < Math.min(0.11 + wave * 0.016, 0.38);
  const tierMult = enemyTierMultiplier(wave);
  const earlyPressure = 1 + Math.min(wave, 10) * 0.035;
  const hp = (brute ? 42 + wave * 10 : shooter ? 24 + wave * 6 : 16 + wave * 4.5) * tierMult * earlyPressure;
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
    value: (brute ? 2.35 : shooter ? 1.55 : 0.95) * Math.pow(1.35, enemyTier(wave)) * enemyGoldPressureMultiplier(wave),
    tier: enemyTier(wave),
  });
}

function spawnBoss() {
  const wave = state.wave;
  const tierMult = enemyTierMultiplier(wave);
  const bossTier = Math.max(1, enemyTier(wave));
  const bossHp = (1400 + wave * 180) * tierMult * (1 + bossTier * 0.35);
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
    hp: bossHp,
    maxHp: bossHp,
    speed: 62 + wave * 1.6,
    damage: (28 + wave * 1.8) * Math.pow(1.35, enemyTier(wave)),
    type: "boss",
    shootTimer: 0.8,
    value: 70 + wave * 8,
    tier: enemyTier(wave),
    boss: true,
  });

  for (let i = 0; i < 4 + bossTier * 2; i += 1) {
    spawnEnemy();
  }
}

function nextCrateDelay() {
  return random(8, 13);
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



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
  if (kingSpent > 0 && bonuses.levels.diamondKing > 0) {
    const sanctuaryRadius = Math.min(480, 60 + kingSpent * 0.85);
    const sanctuaryReduction = Math.min(0.65, kingSpent / (kingSpent + 200));
    state.diamondKingSanctuary = {
      x: state.player.x,
      y: state.player.y,
      radius: sanctuaryRadius,
      damageReduction: sanctuaryReduction,
    };
    state.floatingText.push({
      x: state.player.x,
      y: state.player.y - 106,
      text: `sanctuaire -$${kingSpent} (${Math.round(sanctuaryReduction * 100)}% réduction)`,
      life: 1.8,
      color: SUITS.diamonds.color,
    });
  } else {
    state.diamondKingSanctuary = null;
  }
}

function randomWorldPoint(margin = 120) {
  const shape = state?.mapShape || "square";
  if (shape === "square") {
    const bounds = worldBounds();
    return {
      x: random(bounds.left + margin, bounds.right - margin),
      y: random(bounds.top + margin, bounds.bottom - margin),
    };
  }
  // Rejet : tirage dans la boite englobante jusqu'à trouver un point valide
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = random(-1600, 1600);
    const y = random(-1050, 1050);
    if (isInsideMap(x, y, margin)) return { x, y };
  }
  return { x: 0, y: 0 };
}

function rollEventWave() {
  if (state.wave % 10 === 0) return true; // boss wave : toujours un événement, compteur inchangé
  if (!isTutorialDone() && state.wave <= 3) return false; // première partie : 3 vagues de survie garanties
  const chance = Math.min(1, 0.10 * Math.pow(2, state.eventWaveMisses));
  const isEvent = Math.random() < chance;
  if (isEvent) {
    state.eventWaveMisses = 0;
  } else {
    state.eventWaveMisses += 1;
  }
  return isEvent;
}

function createWaveObjective() {
  const choices = ["capture", "turrets", "runners", "kills"];
  const type = choices[Math.floor(random(0, choices.length))];
  if (type === "capture") {
    const point = randomWorldPoint(250);
    return {
      type,
      title: "CHARGE",
      desc: "Reste dans la zone",
      x: point.x,
      y: point.y,
      radius: 150,
      progress: 0,
      target: Math.max(6, 10 + state.wave * 0.35),
      completed: false,
    };
  }
  if (type === "turrets") {
    return {
      type,
      title: "TOURELLES",
      desc: "Détruis les 4 coins",
      killed: 0,
      target: 4,
      completed: false,
    };
  }
  if (type === "runners") {
    return {
      type,
      title: "TRAQUE",
      desc: "Ramasse 3 reliques",
      collected: 0,
      target: 3,
      runnerSpawnTimer: 0,
      completed: false,
    };
  }
  return {
    type,
    title: "MASSACRE",
    desc: "Tue les monstres requis",
    killed: 0,
    target: Math.round(50 + state.wave * 40),
    completed: false,
  };
}

function spawnObjectiveTurrets() {
  const objective = state.objective;
  if (!objective || objective.type !== "turrets") return;
  const bounds = worldBounds();
  const tier = enemyTier(state.wave);
  const hp = (50 + state.wave * 18) * enemyTierMultiplier(state.wave);
  const points = [
    { x: bounds.left + 135, y: bounds.top + 135 },
    { x: bounds.right - 135, y: bounds.top + 135 },
    { x: bounds.left + 135, y: bounds.bottom - 135 },
    { x: bounds.right - 135, y: bounds.bottom - 135 },
  ];
  for (const point of points) {
    state.enemies.push({
      ...point,
      radius: 24,
      hp,
      maxHp: hp,
      speed: 0,
      damage: (10 + state.wave * 0.7) * Math.pow(1.25, tier),
      type: "objective-turret",
      shootTimer: random(0.2, 1),
      value: 0,
      tier,
      objectiveTarget: true,
    });
  }
}

function spawnObjectiveRunner() {
  const objective = state.objective;
  if (!objective || objective.type !== "runners") return;
  if (state.enemies.some((enemy) => enemy.type === "objective-runner" && enemy.hp > 0)) return;
  const tier = enemyTier(state.wave);
  const hp = (45 + state.wave * 9) * enemyTierMultiplier(state.wave);
  const point = randomWorldPoint(170);
  state.enemies.push({
    x: point.x,
    y: point.y,
    radius: 18,
    hp,
    maxHp: hp,
    speed: (145 + state.wave * 3.8) * Math.min(1.45, Math.pow(1.08, tier)),
    damage: 0,
    type: "objective-runner",
    shootTimer: 999,
    value: 0,
    tier,
    objectiveTarget: true,
    seed: random(0, Math.PI * 2),
  });
}

function beginWave() {
  state.betweenWaves = false;
  state.packOffer = [];
  state.packContext = null;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.previewWeaponId = null;
  state.crates = [];
  state.objectiveItems = [];
  state.bodyguards = [];
  state.crateSpawnTimer = random(2.5, 4.5);
  state.pendingCratePacks = 0;
  state.waveKillCount = 0;
  state.waveGoldEarned = 0;
  state.wave += state.wave === 0 ? 1 : 0;
  const isEvent = rollEventWave();
  state.waveTimeLeft = isEvent ? 0 : Math.min(15 + state.wave * 1.7, 54);
  state.spawnTimer = 0;
  state.player.stationaryTime = 0;
  applyDiamondCourtStartOfWave();
  state.stats = calculateStats();
  const fixedWaveGold = 18 + state.wave * 6 + metaRunBonuses().waveGold;
  state.waveGoldCap = Math.max(0, Math.round((expectedWaveIncome(state.wave) - fixedWaveGold) * state.stats.moneyMultiplier));
  state.objective = isEvent ? createWaveObjective() : null;
  if (state.objective?.type === "turrets") spawnObjectiveTurrets();
  if (state.objective?.type === "runners") spawnObjectiveRunner();
  if (state.wave % 10 === 0) spawnBoss();

  // Labels et couleurs communs aux annonces et aux vagues monotype
  const monoLabels = {
    chaser: "CHASSEURS", shooter: "TIREURS", brute: "BRUTES",
    dasher: "DASHERS", sprayer: "ARROSEURS", sniper: "SNIPERS",
    healer: "GUÉRISSEURS", bomber: "BOMBARDIERS", splitter: "DIVISEURS", blocker: "BLOQUEURS",
  };
  const monoColors = {
    chaser: "#e46363", shooter: "#e08d4f", brute: "#9f5ec7",
    dasher: "#55b8ff", sprayer: "#66e08f", sniper: "#c03050",
    healer: "#4dcc7a", bomber: "#ffe020", splitter: "#e87fac", blocker: "#3d4a5c",
  };

  // Vague monotype (~12% de chance, pas sur les vagues boss)
  state.monoTypeWave = null;
  if (state.wave % 10 !== 0 && Math.random() < 0.12) {
    const pool = ["chaser", "shooter", "brute", "dasher", "sprayer", "sniper", "healer", "bomber", "splitter", "blocker"];
    state.monoTypeWave = pool[Math.floor(Math.random() * pool.length)];
  }

  // Annonce plein écran
  if (state.wave % 10 === 0) {
    showWaveAnnouncement({
      label: `Vague ${state.wave}`,
      title: "BOSS",
      desc: "Un ennemi majeur apparaît",
      color: "#ff9a2e",
    });
  } else if (state.monoTypeWave) {
    showWaveAnnouncement({
      label: `Vague ${state.wave} · Spéciale`,
      title: `Vague ${monoLabels[state.monoTypeWave] || state.monoTypeWave} !`,
      desc: "",
      color: monoColors[state.monoTypeWave] || "#ffffff",
    });
  } else if (isEvent && state.objective) {
    showWaveAnnouncement({
      label: `Vague ${state.wave} · Défi`,
      title: state.objective.title,
      desc: state.objective.desc,
      color: "#f4f4f4",
    });
  }

  ui.shop.classList.add("is-hidden");
  renderUI();
  queueTutorialSteps(["waveStart"]);
  if (isEvent) queueTutorialSteps(["eventWave"]);
}

function completeWave() {
  const completedWave = state.wave;
  state.betweenWaves = true;
  state.money += 18 + state.wave * 6 + metaRunBonuses().waveGold;
  const totalInterestRate = (state.character?.endWaveInterest || 0) + (talentBonuses().interestBonus || 0);
  if (totalInterestRate > 0) {
    const interest = Math.floor(state.money * totalInterestRate);
    if (interest > 0) {
      state.money += interest;
      state.floatingText.push({
        x: state.player.x,
        y: state.player.y - 90,
        text: `intérêts +$${interest}`,
        life: 1.2,
        color: SUITS.diamonds.color,
      });
    }
  }
  state.wave += 1;
  state.diamondKingSanctuary = null;
  state.monoTypeWave = null;
  state.shopRerolls = 0;
  state.crates = [];
  state.objective = null;
  state.objectiveItems = [];
  state.enemies = [];
  state.enemyBullets = [];
  state.projectiles = [];
  state.pulses = [];
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
  queueTutorialSteps(["shopIntro", "shopBuild", "shopSell", "shopReroll", "pokerCombo", "suitEffect"]);
  if (state.packOffer.length > 0) queueTutorialSteps(["packChoice"]);
  if (completedWave > 0 && completedWave % 10 === 0) {
    showRunDecision(completedWave);
  }
}

function spawnEnemy() {
  const angle = random(0, Math.PI * 2);
  const spawnDistance = Math.max(window.innerWidth, window.innerHeight) * 0.52 + 45;
  const wave = state.wave;
  const chances = {
    sprayer:  wave >= 6 ? Math.min(0.06 + wave * 0.008, 0.22) : 0,
    dasher:   wave >= 4 ? Math.min(0.08 + wave * 0.01,  0.26) : 0,
    brute:    wave >= 3 ? Math.min(0.11 + wave * 0.014, 0.34) : 0,
    shooter:  wave >= 2 ? Math.min(0.14 + wave * 0.014, 0.36) : 0,
    sniper:   wave >= 5 ? Math.min(0.03 + wave * 0.005, 0.11) : 0,
    healer:   wave >= 7 ? Math.min(0.02 + wave * 0.004, 0.08) : 0,
    bomber:   wave >= 4 ? Math.min(0.04 + wave * 0.005, 0.11) : 0,
    splitter: wave >= 5 ? Math.min(0.03 + wave * 0.005, 0.10) : 0,
    blocker:  wave >= 8 ? Math.min(0.02 + wave * 0.004, 0.08) : 0,
  };
  let cum = 0;
  const roll = Math.random();
  let type = "chaser";
  for (const [t, c] of Object.entries(chances)) {
    cum += c;
    if (roll < cum) { type = t; break; }
  }

  if (state.monoTypeWave) type = state.monoTypeWave;

  const typeCaps = { sniper: 3, healer: 20, blocker: 30, bomber: 5 };
  if (!state.monoTypeWave && typeCaps[type] !== undefined) {
    const count = state.enemies.filter((e) => e.type === type).length;
    if (count >= typeCaps[type]) type = "chaser";
  }

  const chaserHp = wave === 1 ? 11 : 16 + wave * 4.5;
  const presets = {
    chaser:   { hp: chaserHp,        radius: 15, speed: 118 + wave * 3.4, damage: 13, value: 0.95 },
    shooter:  { hp: 24 + wave * 6,   radius: 16, speed:  92 + wave * 2.4, damage: 11, value: 1.55 },
    brute:    { hp: 42 + wave * 10,  radius: 21, speed:  78 + wave * 2.4, damage: 19, value: 2.35 },
    dasher:   { hp: 30 + wave * 7,   radius: 16, speed: 112 + wave * 3,   damage: 17, value: 1.75 },
    sprayer:  { hp: 22 + wave * 5.5, radius: 14, speed: 146 + wave * 4.2, damage: 10, value: 1.90 },
    sniper:   { hp: 18 + wave * 4,   radius: 14, speed:  68 + wave * 1.6, damage: 18, value: 2.10 },
    healer:   { hp: 24 + wave * 5,   radius: 15, speed:  82 + wave * 2,   damage:  0, value: 1.80 },
    bomber:   { hp: 22 + wave * 5,   radius: 17, speed: 110 + wave * 3,   damage: 32, value: 1.60 },
    splitter: { hp: 28 + wave * 6,   radius: 17, speed:  95 + wave * 2.5, damage: 12, value: 1.65 },
    blocker:  { hp: 62 + wave * 14,  radius: 28, speed:  40 + wave * 1,   damage: 20, value: 2.20 },
  };
  const preset = presets[type];
  const tierMult = enemyTierMultiplier(wave);
  const earlyPressure = 1 + Math.min(wave, 10) * 0.035;
  const hp = preset.hp * tierMult * earlyPressure;
  const radius = preset.radius;
  const MIN_SPAWN_DIST = 200;
  let spawnPoint = clampToWorld(
    state.player.x + Math.cos(angle) * spawnDistance,
    state.player.y + Math.sin(angle) * spawnDistance,
    radius,
  );
  if (distance(spawnPoint, state.player) < MIN_SPAWN_DIST) {
    let bestPoint = spawnPoint;
    let bestDist = distance(spawnPoint, state.player);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const tryAngle = random(0, Math.PI * 2);
      const candidate = clampToWorld(
        state.player.x + Math.cos(tryAngle) * spawnDistance,
        state.player.y + Math.sin(tryAngle) * spawnDistance,
        radius,
      );
      const d = distance(candidate, state.player);
      if (d >= MIN_SPAWN_DIST) { spawnPoint = candidate; break; }
      if (d > bestDist) { bestDist = d; bestPoint = candidate; }
    }
    if (distance(spawnPoint, state.player) < MIN_SPAWN_DIST) spawnPoint = bestPoint;
  }

  state.enemies.push({
    x: spawnPoint.x,
    y: spawnPoint.y,
    radius,
    hp,
    maxHp: hp,
    speed: preset.speed * Math.min(1.45, Math.pow(1.08, enemyTier(wave))),
    damage: preset.damage * Math.pow(1.35, enemyTier(wave)),
    type,
    shootTimer: type === "sniper" ? random(1.2, 2.4) : random(0.5, 1.6),
    sniperCharging: 0,
    exploded: false,
    value: preset.value * Math.pow(1.35, enemyTier(wave)) * enemyGoldPressureMultiplier(wave),
    tier: enemyTier(wave),
    seed: random(0, Math.PI * 2),
    dashCooldown: random(0.8, 1.8),
    dashWindup: 0,
    dashTime: 0,
    dashAngle: angle + Math.PI,
  });
}

function spawnBoss() {
  const wave = state.wave;
  const tierMult = enemyTierMultiplier(wave);
  const bossTier = Math.max(1, enemyTier(wave));
  const bossHp = (1400 + wave * 180) * tierMult * (1 + bossTier * 0.35);
  const radius = 46 + enemyTier(wave) * 5;
  const bossKinds = ["hearts", "spades", "clubs", "diamonds"];
  const bossPool = bossKinds.filter((kind) => kind !== state.lastBossKind);
  const bossKind = bossPool[Math.floor(random(0, bossPool.length))] || bossKinds[0];
  state.lastBossKind = bossKind;
  const bounds = worldBounds();
  let x, y;
  const shape = state.mapShape || "square";
  if (shape === "square") {
    const side = Math.floor(random(0, 4));
    if (side === 0) { x = random(bounds.left + radius, bounds.right - radius); y = bounds.top + radius; }
    else if (side === 1) { x = random(bounds.left + radius, bounds.right - radius); y = bounds.bottom - radius; }
    else if (side === 2) { x = bounds.left + radius; y = random(bounds.top + radius, bounds.bottom - radius); }
    else { x = bounds.right - radius; y = random(bounds.top + radius, bounds.bottom - radius); }
  } else {
    // Pour les autres formes : trouver un point sur la bordure dans une direction aléatoire
    const angle = random(0, Math.PI * 2);
    let lo = 100, hi = 1800;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (isInsideMap(Math.cos(angle) * mid, Math.sin(angle) * mid, radius)) lo = mid;
      else hi = mid;
    }
    const r = (lo + hi) / 2;
    x = Math.cos(angle) * r;
    y = Math.sin(angle) * r;
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
    bossKind,
    bossAge: 0,
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
  queueTutorialSteps(["firstCrate"]);
}



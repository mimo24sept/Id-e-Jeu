function enemyTier(wave = state.wave) {
  return Math.floor(Math.max(1, wave) / 10);
}

function enemyTierMultiplier(wave = state.wave) {
  return Math.pow(1.75, enemyTier(wave));
}

function beginWave() {
  state.betweenWaves = false;
  state.packOffer = [];
  state.packContext = null;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.previewWeaponId = null;
  state.crates = [];
  state.crateSpawnTimer = random(2.5, 4.5);
  state.pendingCratePacks = 0;
  state.wave += state.wave === 0 ? 1 : 0;
  state.waveDuration = Math.min(18 + state.wave * 2, 58);
  state.waveTimeLeft = state.waveDuration;
  state.spawnTimer = 0;
  if (state.wave % 10 === 0) spawnBoss();
  ui.shop.classList.add("is-hidden");
  renderUI();
  queueTutorialSteps(["waveControls", "handPanel", "weaponPanel", "crateField"]);
}

function completeWave() {
  state.betweenWaves = true;
  state.money += 18 + state.wave * 6;
  state.wave += 1;
  state.shopRerolls = 0;
  state.crates = [];
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
  const brute = wave >= 4 && Math.random() < Math.min(0.09 + wave * 0.014, 0.34);
  const tierMult = enemyTierMultiplier(wave);
  const hp = (brute ? 42 + wave * 10 : shooter ? 24 + wave * 6 : 16 + wave * 4.5) * tierMult;
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
    value: (brute ? 2.35 : shooter ? 1.55 : 0.95) * Math.pow(1.35, enemyTier(wave)),
    tier: enemyTier(wave),
  });
}

function spawnBoss() {
  const wave = state.wave;
  const tierMult = enemyTierMultiplier(wave);
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
    hp: (900 + wave * 120) * tierMult,
    maxHp: (900 + wave * 120) * tierMult,
    speed: 62 + wave * 1.6,
    damage: (28 + wave * 1.8) * Math.pow(1.35, enemyTier(wave)),
    type: "boss",
    shootTimer: 0.8,
    value: 70 + wave * 8,
    tier: enemyTier(wave),
    boss: true,
  });
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



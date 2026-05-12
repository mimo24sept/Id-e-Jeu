function findNearestEnemy(maxRange = Infinity) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const enemy of state.enemies) {
    const d = distance(state.player, enemy);
    if (d <= maxRange && d < nearestDistance) {
      nearestDistance = d;
      nearest = enemy;
    }
  }
  return nearest;
}

function weaponHasMod(weapon, id) {
  return weapon.modifiers.some((mod) => mod.id === id);
}

function findNearestEnemyFrom(origin, maxRange = Infinity) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const enemy of state.enemies) {
    const d = distance(origin, enemy);
    if (d <= maxRange && d < nearestDistance) {
      nearestDistance = d;
      nearest = enemy;
    }
  }
  return nearest;
}

function weaponSuitIdentityDamageBonus(weapon, suitCount) {
  if (suitCount <= 0) return 0;
  const gradeMult = weapon.grade.statMult;
  if (weapon.suit === "hearts") {
    const vitality = Math.log1p((state.stats.maxHp || 0) / 150) + (state.stats.regen || 0) * 0.08;
    return suitCount * vitality * 0.42 * gradeMult;
  }
  if (weapon.suit === "diamonds") {
    return suitCount * Math.log1p(Math.max(0, state.money || 0) / 120) * 0.38 * gradeMult;
  }
  return 0;
}

function weaponDamage(weapon) {
  const suitCount = state.stats[weapon.suit] || 0;
  const scalingType = getWeaponScalingType(weapon.scalingTypeId);
  const suitBonus = scalingType.id === "damage" ? suitCount * 1.15 * weapon.grade.statMult : suitCount * 0.35 * weapon.grade.statMult;
  const identityBonus = weaponSuitIdentityDamageBonus(weapon, suitCount);
  let damage = (weapon.damage + state.stats.flatDamage + suitBonus + identityBonus + state.stats.handPower * 0.75) * state.stats.damageMultiplier;
  const critChance = Math.min(0.9, state.stats.critChance + (scalingType.id === "crit" ? 0.03 * suitCount : 0));
  const crit = Math.random() < critChance;
  if (crit) damage *= 2;
  return { damage, crit };
}

function projectileEffects(weapon) {
  return {
    explosive: weapon.modifiers.find((mod) => mod.id === "explosive"),
    burn: weapon.modifiers.find((mod) => mod.id === "burn"),
    stun: weapon.modifiers.find((mod) => mod.id === "stun"),
    gold: weapon.modifiers.find((mod) => mod.id === "gold"),
  };
}

function projectileBounceData() {
  const bonuses = metaRunBonuses();
  return {
    remaining: bonuses.clubBounceCount,
    speedMultiplier: bonuses.clubBounceSpeedMultiplier,
    damageMultiplier: bonuses.clubBounceDamageMultiplier,
    inaccuracy: bonuses.clubBounceInaccuracy,
  };
}

function fireWeapon(weapon) {
  const weaponRange = weapon.range * (state.stats.weaponRangeMultiplier || 1);
  if (weapon.melee) {
    const hit = weaponDamage(weapon);
    state.pulses.push({
      x: state.player.x,
      y: state.player.y,
      radius: 20,
      maxRadius: weaponRange,
      damage: hit.damage,
      life: 0.38,
      hit: new Set(),
      color: weapon.color,
      effects: projectileEffects(weapon),
      crit: hit.crit,
    });
    return;
  }

  const target = findNearestEnemy(weaponRange);
  if (!target) return;

  const baseAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
  const pellets = weapon.pellets || 1;
  for (let i = 0; i < pellets; i += 1) {
    const coneOffset = pellets > 1 ? ((i / (pellets - 1)) - 0.5) * weapon.spread : 0;
    const inaccuracy = random(-weapon.accuracy, weapon.accuracy);
    const angle = baseAngle + coneOffset + inaccuracy;
    const hit = weaponDamage(weapon);
    const bounce = projectileBounceData();
    state.projectiles.push({
      x: state.player.x,
      y: state.player.y,
      vx: Math.cos(angle) * weapon.projectileSpeed,
      vy: Math.sin(angle) * weapon.projectileSpeed,
      radius: pellets > 1 ? 5 : weapon.archetypeId === "sniper" ? 8 : 6,
      damage: hit.damage,
      life: weaponRange / weapon.projectileSpeed,
      color: weapon.color,
      effects: projectileEffects(weapon),
      crit: hit.crit,
      bouncesRemaining: bounce.remaining,
      bounceSpeedMultiplier: bounce.speedMultiplier,
      bounceDamageMultiplier: bounce.damageMultiplier,
      bounceInaccuracy: bounce.inaccuracy,
      bounceIndex: 0,
      bouncedTargets: new Set(),
    });
  }
}

function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has("up")) dy -= 1;
  if (keys.has("down")) dy += 1;
  if (keys.has("left")) dx -= 1;
  if (keys.has("right")) dx += 1;
  dx += touchMovement.x;
  dy += touchMovement.y;

  const inputLength = Math.hypot(dx, dy);
  const length = inputLength || 1;
  const nextPosition = clampToWorld(
    state.player.x + (dx / length) * state.stats.moveSpeed * dt,
    state.player.y + (dy / length) * state.stats.moveSpeed * dt,
    state.player.radius,
  );
  state.player.vx = dt > 0 ? (nextPosition.x - state.player.x) / dt : 0;
  state.player.vy = dt > 0 ? (nextPosition.y - state.player.y) / dt : 0;
  state.player.stationaryTime = inputLength > 0.08 ? 0 : (state.player.stationaryTime || 0) + dt;
  state.player.x = nextPosition.x;
  state.player.y = nextPosition.y;
  state.player.invuln = Math.max(0, state.player.invuln - dt);
  state.player.hp = Math.min(state.stats.maxHp, state.player.hp + state.stats.regen * dt);
}

function updateWeapons(dt) {
  for (const weapon of state.weapons) {
    weapon.cooldown -= dt * state.stats.attackSpeedMultiplier;
    if (weapon.cooldown <= 0) {
      fireWeapon(weapon);
      weapon.cooldown = weapon.baseCooldown;
    }
  }
}

function updateBodyguards(dt) {
  state.bodyguards ||= [];
  for (let i = 0; i < state.bodyguards.length; i += 1) {
    const guard = state.bodyguards[i];
    guard.angle += dt * (0.75 + (i % 4) * 0.08);
    guard.x = state.player.x + Math.cos(guard.angle) * guard.orbit;
    guard.y = state.player.y + Math.sin(guard.angle) * guard.orbit;
    guard.cooldown -= dt;
    if (guard.cooldown > 0) continue;

    const target = findNearestEnemyFrom(guard, guard.range);
    if (!target) continue;
    const angle = Math.atan2(target.y - guard.y, target.x - guard.x);
    state.projectiles.push({
      x: guard.x,
      y: guard.y,
      vx: Math.cos(angle) * 520,
      vy: Math.sin(angle) * 520,
      radius: 5,
      damage: guard.damage,
      life: guard.range / 520,
      color: SUITS.diamonds.color,
      effects: {},
      crit: false,
      bouncesRemaining: 0,
      bounceIndex: 0,
      bouncedTargets: new Set(),
    });
    guard.cooldown = guard.fireRate;
  }
}

function updateSpawns(dt) {
  if (state.betweenWaves || state.waveTimeLeft <= 0) return;

  state.waveTimeLeft = Math.max(0, state.waveTimeLeft - dt);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    let spawnBurst = 1 + Math.floor(state.wave / 5);
    if (Math.random() < Math.min(0.22 + state.wave * 0.025, 0.78)) spawnBurst += 1;
    if (state.wave >= 4 && Math.random() < 0.28) spawnBurst += 1;
    if (state.wave >= 7 && Math.random() < 0.22) spawnBurst += 1;
    const reducedBurst = spawnBurst * (1 - metaRunBonuses().enemyReduction);
    spawnBurst = Math.max(1, Math.floor(reducedBurst) + (Math.random() < reducedBurst % 1 ? 1 : 0));
    for (let i = 0; i < spawnBurst; i += 1) {
      spawnEnemy();
    }
    state.spawnTimer = Math.max(0.14, 0.72 - state.wave * 0.022);
  }
}

function updateCrates(dt) {
  if (state.betweenWaves || state.waveTimeLeft <= 0) return;

  state.crateSpawnTimer -= dt;
  if (state.crateSpawnTimer <= 0) {
    if (state.crates.length < MAX_CRATES_ON_MAP && state.pendingCratePacks < 1) {
      spawnCrate();
    }
    state.crateSpawnTimer = nextCrateDelay();
  }

  const remainingCrates = [];
  for (const crate of state.crates) {
    if (distance(crate, state.player) < crate.radius + state.player.radius) {
      state.pendingCratePacks += 1;
      state.floatingText.push({
        x: crate.x,
        y: crate.y - crate.radius,
        text: "PACK +1",
        life: 0.9,
        color: "#f0d24b",
      });
    } else {
      remainingCrates.push(crate);
    }
  }
  state.crates = remainingCrates;
}

function damagePlayer(amount) {
  if (state.godMode) return;
  if (state.player.invuln > 0) return;
  state.player.hp -= amount;
  state.player.invuln = 0.42;
  cameraShake = 0.18;
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.gameOver = true;
    updateMobileControlsVisibility();
    const waveReached = state.wave;
    const reward = grantRunFragments(waveReached, metaRunBonuses().fragmentMultiplier * state.fragmentStakeMultiplier * 0.2);
    ui.finalScore.textContent = `Tu as tenu jusqu'à la vague ${state.wave}`;
    ui.fragmentReward.textContent = `+${reward} fragments · 80% perdus`;
    ui.gameOver.classList.remove("is-hidden");
  }
}

function applyHeartAuras(enemy, dt, bonuses) {
  const maxHp = state.stats?.maxHp || 100;
  enemy.heartQueenTime = Math.max(0, (enemy.heartQueenTime || 0) - dt * 1.5);
  enemy.heartChained = false;

  if (bonuses.heartDamageRadius > 0 && distance(enemy, state.player) <= bonuses.heartDamageRadius) {
    enemy.heartQueenTime = Math.min(6, (enemy.heartQueenTime || 0) + dt * 2.5);
    const ramp = 1 + enemy.heartQueenTime * bonuses.heartDamageRampRatio * 10;
    enemy.hp -= maxHp * bonuses.heartDamageDpsRatio * ramp * dt;
  }

  if (bonuses.heartDrainRadius > 0 && distance(enemy, state.player) <= bonuses.heartDrainRadius) {
    const drain = maxHp * bonuses.heartDrainDpsRatio * dt;
    enemy.hp -= drain;
    state.player.hp = Math.min(state.stats.maxHp, state.player.hp + drain * 0.75);
    enemy.heartChained = true;
  }
}

function predictiveAimAngle(enemy, target, bulletSpeed, jitter = 0) {
  const targetSpeedX = target === state.player ? state.player.vx || 0 : target.vx || 0;
  const targetSpeedY = target === state.player ? state.player.vy || 0 : target.vy || 0;
  const leadTime = Math.min(0.95, distance(enemy, target) / bulletSpeed);
  const aimX = target.x + targetSpeedX * leadTime;
  const aimY = target.y + targetSpeedY * leadTime;
  return Math.atan2(aimY - enemy.y, aimX - enemy.x) + random(-jitter, jitter);
}

function moveEnemy(enemy, angle, speedMultiplier, dt, factor = 1) {
  enemy.x += Math.cos(angle) * enemy.speed * speedMultiplier * factor * dt;
  enemy.y += Math.sin(angle) * enemy.speed * speedMultiplier * factor * dt;
}

function updateDasher(enemy, angle, d, speedMultiplier, dt) {
  enemy.dashCooldown = Math.max(0, (enemy.dashCooldown || 0) - dt);
  if (enemy.dashTime > 0) {
    enemy.dashTime = Math.max(0, enemy.dashTime - dt);
    moveEnemy(enemy, enemy.dashAngle, speedMultiplier, dt, 4.2);
    return;
  }
  if (enemy.dashWindup > 0) {
    enemy.dashWindup = Math.max(0, enemy.dashWindup - dt);
    if (enemy.dashWindup <= 0) {
      enemy.dashTime = 0.28;
      enemy.dashCooldown = random(2.1, 3);
    }
    return;
  }
  if (d < 270 && enemy.dashCooldown <= 0) {
    enemy.dashAngle = angle;
    enemy.dashWindup = 0.38;
    return;
  }
  moveEnemy(enemy, angle, speedMultiplier, dt);
}

function updateSprayer(enemy, angle, d, speedMultiplier, dt) {
  const wobble = Math.sin(state.worldTime * 3.2 + (enemy.seed || 0)) * 1.45;
  const farBias = d > 420 ? 0 : Math.PI * 0.5;
  moveEnemy(enemy, angle + wobble + farBias, speedMultiplier, dt, d < 150 ? -0.45 : 1);
}

function updateEnemies(dt) {
  const bonuses = metaRunBonuses();
  for (const enemy of state.enemies) {
    applyHeartAuras(enemy, dt, bonuses);
    if (enemy.burn > 0) {
      enemy.hp -= (enemy.burnDps || 0) * dt;
      enemy.burn = Math.max(0, enemy.burn - dt);
    }
    if (enemy.stun > 0) {
      enemy.stun = Math.max(0, enemy.stun - dt);
      continue;
    }

    const guardTarget = (state.bodyguards || []).reduce(
      (closest, guard) => {
        const guardDistance = distance(enemy, guard);
        return guardDistance < closest.distance ? { guard, distance: guardDistance } : closest;
      },
      { guard: null, distance: Infinity },
    );
    const target = guardTarget.guard && guardTarget.distance < distance(enemy, state.player) ? guardTarget.guard : state.player;
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    const desiredRange = enemy.type === "shooter" ? 250 : enemy.type === "boss" ? 190 : 0;
    const d = distance(enemy, target);

    let speedMultiplier = enemy.heartChained ? bonuses.heartChainSpeedMultiplier : 1;
    if (bonuses.heartSlowRadius > 0 && distance(enemy, state.player) <= bonuses.heartSlowRadius) {
      speedMultiplier *= bonuses.heartSlowMultiplier;
    }
    if (enemy.type === "dasher") {
      updateDasher(enemy, angle, d, speedMultiplier, dt);
    } else if (enemy.type === "sprayer") {
      updateSprayer(enemy, angle, d, speedMultiplier, dt);
    } else if ((enemy.type !== "shooter" && enemy.type !== "boss") || d > desiredRange) {
      moveEnemy(enemy, angle, speedMultiplier, dt);
    } else {
      const retreat = enemy.type === "boss" ? 0.12 : 0.28;
      moveEnemy(enemy, angle, speedMultiplier, dt, -retreat);
    }

    const clampedEnemy = clampToWorld(enemy.x, enemy.y, enemy.radius);
    enemy.x = clampedEnemy.x;
    enemy.y = clampedEnemy.y;

    if (enemy.type === "shooter" || enemy.type === "boss" || enemy.type === "sprayer") {
      enemy.shootTimer -= dt;
      const shootRange = enemy.type === "boss" ? 880 : enemy.type === "sprayer" ? 620 : 720;
      if (enemy.shootTimer <= 0 && d < shootRange) {
        const shots = enemy.type === "boss" ? 7 : enemy.type === "sprayer" ? 4 : 1;
        const spread = enemy.type === "boss" ? 0.78 : enemy.type === "sprayer" ? random(1.4, 3.1) : 0;
        const bulletSpeed = enemy.type === "boss" ? 230 : enemy.type === "sprayer" ? 235 : 310;
        const baseAngle = enemy.type === "shooter"
          ? predictiveAimAngle(enemy, target, bulletSpeed, 0.035)
          : angle + (enemy.type === "sprayer" ? random(-1.25, 1.25) : 0);
        for (let i = 0; i < shots; i += 1) {
          const offset = shots > 1 ? ((i / (shots - 1)) - 0.5) * spread : 0;
          state.enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(baseAngle + offset) * bulletSpeed,
            vy: Math.sin(baseAngle + offset) * bulletSpeed,
            radius: enemy.type === "boss" ? 9 : enemy.type === "sprayer" ? 5 : 6,
            damage: (enemy.type === "boss" ? 14 + state.wave * 0.9 : enemy.type === "sprayer" ? 6 + state.wave * 0.38 : 9 + state.wave * 0.55) * Math.pow(1.25, enemy.tier || 0),
            life: enemy.type === "boss" ? 4 : 3,
            target: target === state.player ? "player" : "guard",
          });
        }
        enemy.shootTimer = enemy.type === "boss" ? random(1.05, 1.5) : enemy.type === "sprayer" ? random(0.8, 1.25) : random(1.25, 1.9);
      }
    }

    if (target === state.player && d < enemy.radius + state.player.radius) {
      damagePlayer(enemy.damage);
      enemy.x -= Math.cos(angle) * 24;
      enemy.y -= Math.sin(angle) * 24;
    } else if (target !== state.player && d < enemy.radius + target.radius) {
      target.hp -= enemy.damage * dt * 1.8;
      enemy.x -= Math.cos(angle) * 24;
      enemy.y -= Math.sin(angle) * 24;
    }
  }
  state.bodyguards = (state.bodyguards || []).filter((guard) => guard.hp > 0);
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
  }

  for (const bullet of state.enemyBullets) {
    const bonuses = metaRunBonuses();
    const slow = bonuses.heartSlowRadius > 0 && distance(bullet, state.player) <= bonuses.heartSlowRadius ? bonuses.heartSlowMultiplier : 1;
    bullet.x += bullet.vx * slow * dt;
    bullet.y += bullet.vy * slow * dt;
    bullet.life -= dt;
    if (bullet.target !== "guard" && distance(bullet, state.player) < bullet.radius + state.player.radius) {
      bullet.life = 0;
      damagePlayer(bullet.damage);
      continue;
    }
    for (const guard of state.bodyguards || []) {
      if (bullet.life <= 0) continue;
      if (distance(bullet, guard) < bullet.radius + guard.radius) {
        bullet.life = 0;
        guard.hp -= bullet.damage;
        state.floatingText.push({
          x: guard.x,
          y: guard.y - guard.radius,
          text: `-${Math.round(bullet.damage)}`,
          life: 0.45,
          color: SUITS.diamonds.color,
        });
      }
    }
  }
  state.bodyguards = (state.bodyguards || []).filter((guard) => guard.hp > 0);

  for (const pulse of state.pulses) {
    pulse.life -= dt;
    pulse.radius = pulse.maxRadius * (1 - pulse.life / 0.38);
  }

  function bounceProjectile(projectile, enemy) {
    projectile.bouncedTargets ||= new Set();
    projectile.bouncedTargets.add(enemy);
    if ((projectile.bouncesRemaining || 0) <= 0) {
      projectile.life = 0;
      return;
    }

    let target = null;
    let targetDistance = Infinity;
    for (const candidate of state.enemies) {
      if (candidate === enemy || candidate.hp <= 0 || projectile.bouncedTargets.has(candidate)) continue;
      const d = distance(enemy, candidate);
      if (d < targetDistance && d <= 560) {
        target = candidate;
        targetDistance = d;
      }
    }

    if (!target) {
      projectile.life = 0;
      return;
    }

    projectile.bouncesRemaining -= 1;
    projectile.bounceIndex = (projectile.bounceIndex || 0) + 1;
    projectile.damage *= projectile.bounceDamageMultiplier || 1;
    const currentSpeed = Math.hypot(projectile.vx, projectile.vy) * (projectile.bounceSpeedMultiplier || 1);
    const inaccuracy = (projectile.bounceInaccuracy || 0) * projectile.bounceIndex;
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x) + random(-inaccuracy, inaccuracy);
    projectile.x = enemy.x;
    projectile.y = enemy.y;
    projectile.vx = Math.cos(angle) * currentSpeed;
    projectile.vy = Math.sin(angle) * currentSpeed;
    projectile.life = Math.max(projectile.life, targetDistance / Math.max(120, currentSpeed));
  }

  for (const projectile of state.projectiles) {
    for (const enemy of state.enemies) {
      if (projectile.life <= 0) continue;
      if (projectile.bouncedTargets?.has(enemy)) continue;
      if (distance(projectile, enemy) < projectile.radius + enemy.radius) {
        enemy.hp -= projectile.damage;
        applyHitEffects(enemy, projectile);
        state.floatingText.push({
          x: enemy.x,
          y: enemy.y - enemy.radius,
          text: projectile.crit ? `CRIT ${Math.round(projectile.damage)}` : Math.round(projectile.damage).toString(),
          life: 0.55,
          color: projectile.color,
        });
        bounceProjectile(projectile, enemy);
      }
    }
  }

  for (const pulse of state.pulses) {
    for (const enemy of state.enemies) {
      if (pulse.hit.has(enemy)) continue;
      if (distance(pulse, enemy) < pulse.radius + enemy.radius) {
        pulse.hit.add(enemy);
        enemy.hp -= pulse.damage;
        applyHitEffects(enemy, pulse);
      }
    }
  }

  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
  state.enemyBullets = state.enemyBullets.filter((bullet) => bullet.life > 0);
  state.pulses = state.pulses.filter((pulse) => pulse.life > 0);
}

function applyHitEffects(enemy, source) {
  const effects = source.effects || {};
  if (effects.explosive) {
    for (const other of state.enemies) {
      if (other === enemy) continue;
      if (distance(enemy, other) < effects.explosive.radius) {
        other.hp -= source.damage * effects.explosive.damage;
      }
    }
  }
  if (effects.burn) {
    enemy.burn = Math.max(enemy.burn || 0, effects.burn.duration);
    enemy.burnDps = Math.max(enemy.burnDps || 0, source.damage * effects.burn.dps);
  }
  if (effects.stun && Math.random() < effects.stun.chance) {
    enemy.stun = Math.max(enemy.stun || 0, effects.stun.duration);
  }
  if (effects.gold) {
    enemy.goldBonus = Math.max(enemy.goldBonus || 0, effects.gold.gold);
  }
}

function updateKills(dt) {
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      state.moneyDust += enemy.value * state.stats.moneyMultiplier * (1 + (enemy.goldBonus || 0));
      const gain = Math.floor(state.moneyDust);
      if (gain > 0) {
        state.money += gain;
        state.moneyDust -= gain;
        state.floatingText.push({
          x: enemy.x,
          y: enemy.y,
          text: `+$${gain}`,
          life: 0.75,
          color: SUITS.diamonds.color,
        });
      }
    }
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);

  for (const text of state.floatingText) {
    text.y -= 32 * dt;
    text.life -= dt;
  }
  state.floatingText = state.floatingText.filter((text) => text.life > 0);

  if (!state.betweenWaves && state.waveTimeLeft <= 0 && state.enemies.length === 0) {
    completeWave();
  }
}

function update(dt) {
  if (state.gameOver || state.betweenWaves) return;
  state.worldTime += dt;
  state.stats = calculateStats();
  if (state.player.hp > state.stats.maxHp) state.player.hp = state.stats.maxHp;
  updatePlayer(dt);
  updateSpawns(dt);
  updateCrates(dt);
  updateEnemies(dt);
  updateWeapons(dt);
  updateBodyguards(dt);
  updateProjectiles(dt);
  updateKills(dt);
  cameraShake = Math.max(0, cameraShake - dt);
}



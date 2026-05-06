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

function weaponDamage(weapon) {
  const suitCount = state.stats[weapon.suit] || 0;
  const scalingType = getWeaponScalingType(weapon.scalingTypeId);
  const suitBonus = scalingType.id === "damage" ? suitCount * 1.15 * weapon.grade.statMult : suitCount * 0.35 * weapon.grade.statMult;
  let damage = (weapon.damage + state.stats.flatDamage + suitBonus + state.stats.handPower * 0.75) * state.stats.damageMultiplier;
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

function fireWeapon(weapon) {
  if (weapon.melee) {
    const hit = weaponDamage(weapon);
    state.pulses.push({
      x: state.player.x,
      y: state.player.y,
      radius: 20,
      maxRadius: weapon.range,
      damage: hit.damage,
      life: 0.38,
      hit: new Set(),
      color: weapon.color,
      effects: projectileEffects(weapon),
      crit: hit.crit,
    });
    return;
  }

  const target = findNearestEnemy(weapon.range);
  if (!target) return;

  const baseAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
  const pellets = weapon.pellets || 1;
  for (let i = 0; i < pellets; i += 1) {
    const coneOffset = pellets > 1 ? ((i / (pellets - 1)) - 0.5) * weapon.spread : 0;
    const inaccuracy = random(-weapon.accuracy, weapon.accuracy);
    const angle = baseAngle + coneOffset + inaccuracy;
    const hit = weaponDamage(weapon);
    state.projectiles.push({
      x: state.player.x,
      y: state.player.y,
      vx: Math.cos(angle) * weapon.projectileSpeed,
      vy: Math.sin(angle) * weapon.projectileSpeed,
      radius: pellets > 1 ? 5 : weapon.archetypeId === "sniper" ? 8 : 6,
      damage: hit.damage,
      life: weapon.range / weapon.projectileSpeed,
      color: weapon.color,
      effects: projectileEffects(weapon),
      crit: hit.crit,
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

  const length = Math.hypot(dx, dy) || 1;
  const nextPosition = clampToWorld(
    state.player.x + (dx / length) * state.stats.moveSpeed * dt,
    state.player.y + (dy / length) * state.stats.moveSpeed * dt,
    state.player.radius,
  );
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

function updateSpawns(dt) {
  if (state.betweenWaves || state.waveTimeLeft <= 0) return;

  state.waveTimeLeft = Math.max(0, state.waveTimeLeft - dt);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    let spawnBurst = 1 + Math.floor(state.wave / 5);
    if (Math.random() < Math.min(0.12 + state.wave * 0.02, 0.68)) spawnBurst += 1;
    for (let i = 0; i < spawnBurst; i += 1) {
      spawnEnemy();
    }
    state.spawnTimer = Math.max(0.18, 0.86 - state.wave * 0.025);
  }
}

function updateCrates(dt) {
  if (state.betweenWaves || state.waveTimeLeft <= 0) return;

  state.crateSpawnTimer -= dt;
  if (state.crateSpawnTimer <= 0) {
    if (state.crates.length < MAX_CRATES_ON_MAP) {
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
    ui.finalScore.textContent = `Tu as tenu jusqu'Ã  la vague ${state.wave}`;
    ui.gameOver.classList.remove("is-hidden");
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (enemy.burn > 0) {
      enemy.hp -= (enemy.burnDps || 0) * dt;
      enemy.burn = Math.max(0, enemy.burn - dt);
    }
    if (enemy.stun > 0) {
      enemy.stun = Math.max(0, enemy.stun - dt);
      continue;
    }

    const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
    const desiredRange = enemy.type === "shooter" ? 250 : enemy.type === "boss" ? 190 : 0;
    const d = distance(enemy, state.player);

    if ((enemy.type !== "shooter" && enemy.type !== "boss") || d > desiredRange) {
      enemy.x += Math.cos(angle) * enemy.speed * dt;
      enemy.y += Math.sin(angle) * enemy.speed * dt;
    } else {
      const retreat = enemy.type === "boss" ? 0.12 : 0.28;
      enemy.x -= Math.cos(angle) * enemy.speed * retreat * dt;
      enemy.y -= Math.sin(angle) * enemy.speed * retreat * dt;
    }

    const clampedEnemy = clampToWorld(enemy.x, enemy.y, enemy.radius);
    enemy.x = clampedEnemy.x;
    enemy.y = clampedEnemy.y;

    if (enemy.type === "shooter" || enemy.type === "boss") {
      enemy.shootTimer -= dt;
      if (enemy.shootTimer <= 0 && d < (enemy.type === "boss" ? 880 : 680)) {
        const shots = enemy.type === "boss" ? 7 : 1;
        const spread = enemy.type === "boss" ? 0.78 : 0;
        for (let i = 0; i < shots; i += 1) {
          const offset = shots > 1 ? ((i / (shots - 1)) - 0.5) * spread : 0;
          state.enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle + offset) * (enemy.type === "boss" ? 230 : 270),
            vy: Math.sin(angle + offset) * (enemy.type === "boss" ? 230 : 270),
            radius: enemy.type === "boss" ? 9 : 6,
            damage: (enemy.type === "boss" ? 14 + state.wave * 0.9 : 9 + state.wave * 0.55) * Math.pow(1.25, enemy.tier || 0),
            life: enemy.type === "boss" ? 4 : 3,
          });
        }
        enemy.shootTimer = enemy.type === "boss" ? random(1.05, 1.5) : random(1.35, 2.2);
      }
    }

    if (d < enemy.radius + state.player.radius) {
      damagePlayer(enemy.damage);
      enemy.x -= Math.cos(angle) * 24;
      enemy.y -= Math.sin(angle) * 24;
    }
  }
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
  }

  for (const bullet of state.enemyBullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (distance(bullet, state.player) < bullet.radius + state.player.radius) {
      bullet.life = 0;
      damagePlayer(bullet.damage);
    }
  }

  for (const pulse of state.pulses) {
    pulse.life -= dt;
    pulse.radius = pulse.maxRadius * (1 - pulse.life / 0.38);
  }

  for (const projectile of state.projectiles) {
    for (const enemy of state.enemies) {
      if (projectile.life <= 0) continue;
      if (distance(projectile, enemy) < projectile.radius + enemy.radius) {
        projectile.life = 0;
        enemy.hp -= projectile.damage;
        applyHitEffects(enemy, projectile);
        state.floatingText.push({
          x: enemy.x,
          y: enemy.y - enemy.radius,
          text: projectile.crit ? `CRIT ${Math.round(projectile.damage)}` : Math.round(projectile.damage).toString(),
          life: 0.55,
          color: projectile.color,
        });
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
  updateProjectiles(dt);
  updateKills(dt);
  cameraShake = Math.max(0, cameraShake - dt);
}

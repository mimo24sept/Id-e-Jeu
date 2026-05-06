function rollWeaponModifiers(count) {
  const mods = [];
  const available = WEAPON_MODIFIERS.slice();
  while (mods.length < count && available.length > 0) {
    const mod = pickWeighted(available);
    mods.push(rollWeaponModifier(mod));
    available.splice(available.indexOf(mod), 1);
  }
  return mods;
}

function weaponItemPower(level) {
  return 1 + Math.max(0, level - 1) * 0.11;
}

function rollWeaponModifier(mod) {
  if (mod.id === "explosive") {
    const radius = Math.round(random(62, 112));
    const damage = random(0.28, 0.62);
    return {
      ...mod,
      radius,
      damage,
      desc: `Explosion ${radius}px, ${Math.round(damage * 100)}% dégâts secondaires.`,
    };
  }
  if (mod.id === "burn") {
    const duration = random(1.8, 4.2);
    const dps = random(0.22, 0.52);
    return {
      ...mod,
      duration,
      dps,
      desc: `Brûlure ${duration.toFixed(1)}s, ${Math.round(dps * 100)}% dégâts/s.`,
    };
  }
  if (mod.id === "stun") {
    const duration = random(0.35, 1);
    const chance = random(0.25, 0.72);
    return {
      ...mod,
      duration,
      chance,
      desc: `${Math.round(chance * 100)}% stun ${duration.toFixed(1)}s.`,
    };
  }
  const gold = random(0.18, 0.7);
  return {
    ...mod,
    gold,
    desc: `+${Math.round(gold * 100)}% or sur les victimes touchées.`,
  };
}

function getWeaponScalingType(id) {
  return WEAPON_SCALING_TYPES.find((type) => type.id === id) || WEAPON_SCALING_TYPES[0];
}

function createWeapon(options = {}) {
  const archetype = options.archetype || WEAPON_ARCHETYPES.find((item) => item.id === options.archetypeId) || WEAPON_ARCHETYPES[Math.floor(Math.random() * WEAPON_ARCHETYPES.length)];
  const grade = options.grade || WEAPON_GRADES.find((item) => item.id === options.gradeId) || pickWeighted(WEAPON_GRADES);
  const suitKey = options.suit || Object.keys(SUITS)[Math.floor(Math.random() * Object.keys(SUITS).length)];
  const suit = SUITS[suitKey];
  const scalingType = options.scalingType || (options.scalingTypeId ? getWeaponScalingType(options.scalingTypeId) : WEAPON_SCALING_TYPES[Math.floor(Math.random() * WEAPON_SCALING_TYPES.length)]);
  const modifiers = options.modifiers || rollWeaponModifiers(grade.modCount);
  const level = options.level || Math.max(1, state?.wave || 1);
  const itemPower = weaponItemPower(level);
  const rolls = options.rolls || {
    damage: random(0.86, 1.22),
    cooldown: random(0.86, 1.16),
    range: random(0.9, 1.18),
    accuracy: random(0.82, 1.18),
    stats: random(0.85, 1.22),
  };
  const name = `${grade.name} ${archetype.name} ${suit.symbol}`;
  const damage = archetype.damage * grade.damageMult * itemPower * rolls.damage;
  const cooldown = archetype.baseCooldown * rolls.cooldown;
  const range = Math.round(archetype.range * rolls.range);
  const statPower = Math.pow(itemPower, 0.72) * rolls.stats;

  return {
    id: uniqueId(`weapon-${archetype.id}`),
    type: "weapon",
    archetypeId: archetype.id,
    name,
    baseName: archetype.name,
    grade,
    suit: suitKey,
    scalingType,
    scalingTypeId: scalingType.id,
    color: suitAccent(suitKey),
    gradeColor: grade.color,
    level,
    itemPower,
    rolls,
    price: Math.round(archetype.basePrice * grade.priceMult * (1 + level * 0.08) * ((rolls.damage + rolls.stats) / 2)),
    desc: weaponDescription(archetype, suitKey, scalingType, grade, modifiers, { level, damage, cooldown, range, rolls }),
    baseCooldown: cooldown,
    damage,
    range,
    projectileSpeed: archetype.projectileSpeed,
    accuracy: archetype.accuracy * rolls.accuracy,
    healthBonus: Math.round(archetype.healthBonus * grade.statMult * statPower),
    moveSpeedBonus: Math.round(archetype.moveSpeedBonus * grade.statMult * Math.pow(itemPower, 0.35) * rolls.stats),
    pellets: archetype.pellets || 1,
    spread: archetype.spread || 0,
    melee: Boolean(archetype.melee),
    modifiers,
    cooldown: 0,
  };
}

function weaponDescription(archetype, suitKey, scalingType, grade, modifiers, stats) {
  const suit = SUITS[suitKey];
  const rollText = `Niv.${stats.level} · ${Math.round(stats.damage)} dégâts · ${stats.cooldown.toFixed(2)}s · portée ${stats.range}`;
  const mods = modifiers.length ? ` Mods: ${modifiers.map((mod) => `${mod.name} (${mod.desc})`).join(", ")}.` : "";
  return `${rollText}. ${archetype.fireLabel}. Scaling ${suit.symbol} ${suit.name} -> ${scalingType.name} (${scalingType.desc}).${mods}`;
}

function weaponScore(weapon) {
  const cadence = 1 / Math.max(0.08, weapon.baseCooldown);
  const pellets = weapon.pellets || 1;
  const modPower = weapon.modifiers.reduce((sum, mod) => {
    if (mod.id === "explosive") return sum + mod.damage * 1.7;
    if (mod.id === "burn") return sum + mod.dps * mod.duration * 0.7;
    if (mod.id === "stun") return sum + mod.chance * mod.duration;
    if (mod.id === "gold") return sum + mod.gold * 0.85;
    return sum;
  }, 0);
  return weapon.damage * cadence * Math.sqrt(pellets) * (1 + modPower) + weapon.level * 0.35 + weapon.healthBonus * 0.03;
}



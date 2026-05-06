function packDetails(pack) {
  const color = pack.suit ? ` ${SUITS[pack.suit].symbol} ${SUITS[pack.suit].name}` : "";
  return `${pack.size} cartes${color}`;
}

function weaponStatLine(weapon) {
  return `${Math.round(weapon.damage)} DMG Â· ${weapon.baseCooldown.toFixed(2)}S Â· ${weapon.range} POR`;
}

function weaponScalingEffects(weapon) {
  const effects = { damage: 0, flatDamage: 0, money: 0, attackSpeed: 0, maxHp: 0, maxHpMultiplier: 0, regen: 0, cardSlots: 0, critChance: 0, moveSpeed: 0 };
  const count = state?.stats?.[weapon.suit] || 0;
  getWeaponScalingType(weapon.scalingTypeId).apply(effects, count, weapon.grade.statMult);
  return { count, effects };
}

function formatWeaponScalingBonus(weapon) {
  const suit = SUITS[weapon.suit];
  const { count, effects } = weaponScalingEffects(weapon);
  const parts = [];
  if (effects.damage) parts.push(`+${Math.round(effects.damage * 100)}% DMG`);
  if (effects.money) parts.push(`+${Math.round(effects.money * 100)}% OR`);
  if (effects.attackSpeed) parts.push(`+${Math.round(effects.attackSpeed * 100)}% CAD`);
  if (effects.critChance) parts.push(`+${Math.round(effects.critChance * 100)}% CRIT`);
  if (effects.maxHp) parts.push(`+${Math.round(effects.maxHp)} PV`);
  if (effects.regen) parts.push(`+${effects.regen.toFixed(1)} REG`);
  if (effects.moveSpeed) parts.push(`+${Math.round(effects.moveSpeed)} VIT`);
  return `${count} ${suit.symbol} = ${parts.length ? parts.join(" / ") : "0 bonus"}`;
}

function weaponModBadges(weapon) {
  if (!weapon.modifiers.length) return "";
  return `
    <div class="weapon-tags">
      ${weapon.modifiers.map((mod) => `<span>${mod.name}</span>`).join("")}
    </div>
  `;
}

function weaponScalingBlock(weapon) {
  const suit = SUITS[weapon.suit];
  const scalingType = getWeaponScalingType(weapon.scalingTypeId);
  return `
    <div class="weapon-scale" style="--scale-color:${weapon.color}">
      <span>${suit.symbol} ${suit.name}</span>
      <strong>${scalingType.name}</strong>
    </div>
  `;
}

function weaponCardHTML(weapon, options = {}) {
  const replaceAttr = options.replaceIndex !== undefined ? `data-replace-weapon="${options.replaceIndex}"` : "";
  const offerAttr = options.shopSlotId ? `data-shop-slot="${options.shopSlotId}"` : "";
  const disabledAttr = options.disabled ? "aria-disabled=\"true\"" : "";
  const tag = options.shopSlotId ? "market-item weapon-offer" : "weapon";
  const lockButton = options.shopSlotId
    ? `<button class="lock-button ${options.locked ? "is-locked" : ""}" type="button" data-lock-slot="${weapon.id}">${options.locked ? "LOCK" : "GARDER"}</button>`
    : "";
  const cta = options.price
    ? `<div class="action-pill ${options.disabled ? "is-disabled" : ""}">$${options.price}</div>`
    : options.replaceIndex !== undefined
      ? `<div class="action-pill">JETER</div>`
      : "";

  return `
    <article class="${tag} ${options.locked ? "is-locked" : ""}" style="--rarity:${weapon.gradeColor}; --weapon-suit:${weapon.color}" ${offerAttr} ${replaceAttr} ${disabledAttr}>
      ${lockButton}
      <div class="weapon-top">
        <span class="grade">${weapon.grade.name} Â· Niv.${weapon.level}</span>
        <strong>${weapon.baseName}</strong>
      </div>
      ${weaponScalingBlock(weapon)}
      <div class="scaling-bonus">${formatWeaponScalingBonus(weapon)}</div>
      <div class="stat-strip">${weaponStatLine(weapon)}</div>
      ${weaponModBadges(weapon)}
      ${cta}
    </article>
  `;
}

function signedDelta(value, precision = 0) {
  const rounded = Number(value.toFixed(precision));
  if (rounded === 0) return "0";
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function compareBadge(label, value, precision = 0) {
  const rounded = Number(value.toFixed(precision));
  const stateClass = rounded > 0 ? "is-good" : rounded < 0 ? "is-bad" : "";
  return `<span class="${stateClass}">${label} ${signedDelta(value, precision)}</span>`;
}

function weaponCompareStats(candidate, current) {
  return `
    <div class="compare-deltas">
      ${compareBadge("DMG", candidate.damage - current.damage)}
      ${compareBadge("SPD", current.baseCooldown - candidate.baseCooldown, 2)}
      ${compareBadge("POR", candidate.range - current.range)}
      ${compareBadge("PWR", weaponScore(candidate) - weaponScore(current), 1)}
    </div>
  `;
}

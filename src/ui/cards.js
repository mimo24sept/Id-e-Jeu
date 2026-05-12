function cardHTML(card) {
  const metaLevel = cardMetaLevel(card);
  return `
    <span class="rank">${card.rank}</span>
    <span class="suit">${card.cursed && card.curse?.allSuits ? "♠♦♣♥" : SUITS[card.suit].symbol}</span>
    ${card.cursed ? `<span class="curse-mark">+</span>` : ""}
    ${metaLevel > 0 ? `<span class="meta-mark">${cardMetaEffectBadge(card)}${metaLevel}</span>` : ""}
  `;
}

function emptyCardHTML() {
  return `<div class="card empty-card"><span class="rank">+</span><span class="suit">Slot</span></div>`;
}

function shopCardDetails(card) {
  const parts = [describeCardBaseBonus(card)];
  const metaLevel = cardMetaLevel(card);
  const metaName = cardMetaEffectName(card);
  const revolutionBoost = revolutionSourceLevel(card);
  if (metaLevel > 0 && metaName) parts.push(`${metaName} niv.${metaLevel}`);
  if (revolutionBoost > 0) parts.push(`+${Math.round((revolutionBoostMultiplier(card) - 1) * 100)}% Révolution`);
  if (metaLevel > 0 && card.value === 7) parts.push(`+$${metaLevel * 3}/vague si en main`);
  if (metaLevel > 0 && card.value === 8) parts.push(`-${Math.round(metaLevel * 2.5)}% monstres si en main`);
  if (metaLevel > 0 && card.value === 9) parts.push(`-${metaLevel * 3}% prix packs si en main`);
  if (metaLevel > 0 && card.value === 10) parts.push(`+${metaLevel * 5}% fragments si en main`);
  if (metaLevel > 0 && card.suit === "diamonds" && card.value === 11) parts.push(`mange ${Math.round(metaRunBonuses().diamondJackTaxRate * 100)}% or -> stat`);
  if (metaLevel > 0 && card.suit === "diamonds" && card.value === 12) parts.push(`mange ${Math.round(metaRunBonuses().diamondQueenTaxRate * 100)}% or -> gardes`);
  if (metaLevel > 0 && card.suit === "diamonds" && card.value === 13) parts.push(`bonus or x${metaRunBonuses().diamondKingBonusMultiplier.toFixed(1)}, impôt ${Math.round(metaRunBonuses().diamondKingTaxRate * 100)}%`);
  if (metaLevel > 0 && card.suit === "diamonds" && card.value === 14) parts.push("taxes cour divisées par 2");
  if (metaLevel > 0 && card.suit === "spades" && card.value === 11) parts.push(`+${Math.round(metaLevel * 8 * metaRunBonuses().spadeAceMultiplier)}% cadence immobile`);
  if (metaLevel > 0 && card.suit === "spades" && card.value === 12) parts.push(`+${Math.round(metaLevel * 16 * metaRunBonuses().spadeAceMultiplier)} PV + regen immobile`);
  if (metaLevel > 0 && card.suit === "spades" && card.value === 13) parts.push(`+${Math.round(metaLevel * 10 * metaRunBonuses().spadeAceMultiplier)}% dégâts, +${Math.round(metaLevel * 6 * metaRunBonuses().spadeAceMultiplier)}% portée immobile`);
  if (metaLevel > 0 && card.suit === "spades" && card.value === 14) parts.push(`effets immobiles x${metaRunBonuses().spadeAceMultiplier.toFixed(2)}`);
  if (metaLevel > 0 && card.suit === "hearts" && card.value === 11) parts.push(`aura lenteur ${Math.round(metaRunBonuses().heartSlowRadius)}px`);
  if (metaLevel > 0 && card.suit === "hearts" && card.value === 12) parts.push(`aura dégâts PV ${Math.round(metaRunBonuses().heartDamageRadius)}px`);
  if (metaLevel > 0 && card.suit === "hearts" && card.value === 13) parts.push(`chaînes vol de vie ${Math.round(metaRunBonuses().heartDrainRadius)}px`);
  if (metaLevel > 0 && card.suit === "hearts" && card.value === 14) parts.push(`zones x${metaRunBonuses().heartAuraSizeMultiplier.toFixed(2)}`);
  if (metaLevel > 0 && card.suit === "clubs" && card.value === 11) parts.push(`rebonds, vitesse x${metaRunBonuses().clubBounceSpeedMultiplier.toFixed(2)}`);
  if (metaLevel > 0 && card.suit === "clubs" && card.value === 12) parts.push(`rebonds, dégâts x${metaRunBonuses().clubBounceDamageMultiplier.toFixed(2)}`);
  if (metaLevel > 0 && card.suit === "clubs" && card.value === 13) parts.push(`rebonds, précision -${Math.round(metaRunBonuses().clubBounceInaccuracy * 100)}`);
  if (metaLevel > 0 && card.suit === "clubs" && card.value === 14) parts.push(`rebonds x${metaRunBonuses().clubAceMultiplier}`);
  if (card.cursed) parts.push(card.curse.name);
  return parts.join(" · ");
}

function effectiveHandSlots() {
  const stats = state.stats || calculateStats();
  return state.handSlots + stats.extraCardSlots;
}

function hasFreeHandSlot() {
  return state.hand.length < effectiveHandSlots();
}

function cratePacksWaiting() {
  return state.pendingCratePacks + (state.packContext?.type === "cratePack" ? 1 : 0);
}

function updateGodCountdown() {
  if (!state?.godMode || !ui.godCountdown) return;
  const secondsLeft = Math.max(0, Math.ceil((state.godCloseEndsAt - performance.now()) / 1000));
  ui.godCountdown.textContent = secondsLeft;
}

function closeGodPage() {
  window.open("", "_self");
  window.close();
  setTimeout(() => {
    if (!document.hidden) {
      window.location.replace("about:blank");
    }
  }, 300);
}

function triggerGodMode() {
  if (state.godMode) return;
  unlockSkin("absolute");
  state.godMode = true;
  state.godCloseEndsAt = performance.now() + 10000;
  state.money = 999999;
  state.moneyDust = 0;
  state.enemies = [];
  state.enemyBullets = [];
  state.projectiles = [];
  state.pulses = [];
  state.bodyguards = [];
  state.crates = [];
  state.pendingCratePacks = 0;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.packOffer = [];
  state.packContext = null;
  state.stats = calculateStats();
  state.player.hp = state.stats.maxHp;
  state.player.invuln = 999999;
  cameraShake = 0.6;
  updateMobileControlsVisibility();
  ui.shop.classList.add("is-hidden");
  ui.gameOver.classList.add("is-hidden");
  ui.godMode.classList.remove("is-hidden");
  updateGodCountdown();
  clearTimeout(godCloseTimeout);
  clearInterval(godCountdownInterval);
  godCountdownInterval = setInterval(updateGodCountdown, 250);
  godCloseTimeout = setTimeout(closeGodPage, 10000);
}



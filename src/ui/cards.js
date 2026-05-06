function cardHTML(card) {
  return `
    <span class="rank">${card.rank}</span>
    <span class="suit">${SUITS[card.suit].symbol}</span>
    ${card.cursed ? `<span class="curse-mark">+</span>` : ""}
  `;
}

function emptyCardHTML() {
  return `<div class="card empty-card"><span class="rank">+</span><span class="suit">Slot</span></div>`;
}

function shopCardDetails(card) {
  const base = describeCardBaseBonus(card);
  if (!card.cursed) return base;
  return `${base} · ${card.curse.name}`;
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
  state.godMode = true;
  state.godCloseEndsAt = performance.now() + 10000;
  state.money = 999999;
  state.moneyDust = 0;
  state.enemies = [];
  state.enemyBullets = [];
  state.projectiles = [];
  state.pulses = [];
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



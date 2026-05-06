function renderUI() {
  state.stats = calculateStats();
  updateMobileControlsVisibility();
  updateUIAccent();
  updateGodCountdown();
  ui.playerNameHud.textContent = state.playerName;
  ui.wave.textContent = state.wave;
  ui.hp.textContent = `${Math.ceil(state.player.hp)} / ${state.stats.maxHp}`;
  ui.money.textContent = `$${state.money}`;
  ui.goldMultiplier.textContent = `x${state.stats.moneyMultiplier.toFixed(2)}`;
  ui.shopGold.textContent = `$${state.money}`;
  ui.shopGoldMultiplier.textContent = `OR x${state.stats.moneyMultiplier.toFixed(2)}`;
  const crateHudCount = state.pendingCratePacks + state.crates.length;
  ui.enemyCount.textContent = state.betweenWaves
    ? "Shop"
    : `${Math.ceil(state.waveTimeLeft)}s Â· ${state.enemies.length}`;
  if (state.betweenWaves && cratePacksWaiting() > 0) {
    ui.enemyCount.textContent = `Shop | ${cratePacksWaiting()} caisse`;
  } else if (!state.betweenWaves && crateHudCount > 0) {
    ui.enemyCount.textContent = `${Math.ceil(state.waveTimeLeft)}s | ${state.enemies.length} | C${crateHudCount}`;
  }
  ui.rerollShop.textContent = `Relancer - $${rerollCost()}`;
  ui.rerollShop.disabled = !state.betweenWaves || state.money < rerollCost() || state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0;
  ui.startWave.disabled = Boolean(state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0);
  ui.handRank.textContent = `${state.stats.handName} Â· +${Math.round(state.stats.handDamageBonus * 100)}%`;

  const emptySlots = Math.max(0, effectiveHandSlots() - state.hand.length);
  ui.hand.innerHTML =
    state.hand.map((card) => `<div class="card ${card.suit}">${cardHTML(card)}</div>`).join("") +
    Array.from({ length: emptySlots }, emptyCardHTML).join("");

  ui.suits.innerHTML = Object.entries(SUITS)
    .map(([key, suit]) => {
      const value = state.stats[key];
      return `
        <div class="suit-stat">
          <b style="color:${suitAccent(key)}">${suit.symbol} ${value}</b>
          <span>${suit.stat}</span>
        </div>
      `;
    })
    .join("");

  ui.weapons.innerHTML = state.weapons
    .map(
      (weapon, index) => weaponCardHTML(weapon, state.pendingWeapon ? { replaceIndex: index } : {}),
    )
    .join("") +
    Array.from({ length: Math.max(0, MAX_WEAPONS - state.weapons.length) }, () => `
      <article class="weapon empty-weapon">
        <div class="weapon-top">
          <span class="grade">Vide</span>
          <strong>SLOT LIBRE</strong>
        </div>
      </article>
    `).join("");

  ui.dpsHint.textContent = `DMG x${state.stats.damageMultiplier.toFixed(2)} Â· CRIT ${Math.round(state.stats.critChance * 100)} Â· SPD x${state.stats.attackSpeedMultiplier.toFixed(2)}`;

  ui.shopHand.innerHTML =
    state.hand
      .map(
        (card, index) => `
          <article class="shop-hand-card" ${state.pendingCurse && !card.cursed ? `data-curse-card="${index}"` : !state.pendingCurse ? `data-sell-card="${index}"` : ""}>
            <div class="card ${card.suit}">${cardHTML(card)}</div>
            <div>
              <strong>${card.rank}${SUITS[card.suit].symbol}</strong>
              <p>${shopCardDetails(card)}</p>
            </div>
            ${
              state.pendingCurse
                ? card.cursed
                  ? `<div class="action-pill is-disabled">DÃ©jÃ </div>`
                  : `<div class="action-pill">Appliquer</div>`
                : `<div class="action-pill">+$${sellValue(card)}</div>`
            }
          </article>
        `,
      )
      .join("") + Array.from({ length: emptySlots }, emptyCardHTML).join("");

  ui.shopSlots.innerHTML = state.shopSlots.map(renderShopSlot).join("");
  renderWeaponCompare();
  renderShopRunInfo();

  ui.packChoiceTitle.textContent = state.packContext
    ? hasFreeHandSlot()
      ? `${state.packContext.name} Â· Choisis 1`
      : "Main pleine Â· Vends 1 carte"
    : state.pendingWeapon
      ? "JETER UNE ARME"
    : state.pendingCurse
      ? `${state.pendingCurse.name} Â· Cible`
    : "PACK";
  if (state.packContext) {
    ui.packChoiceTitle.textContent = hasFreeHandSlot()
      ? `${state.packContext.name} | Choisis 1 ou passe`
      : "Main pleine | Vends ou passe";
  }
  ui.packChoiceTitle.classList.toggle("is-hidden", state.packOffer.length === 0 && !state.pendingCurse && !state.pendingWeapon);
  ui.packOffer.classList.toggle("is-replacing-weapon", Boolean(state.pendingWeapon));

  ui.packOffer.innerHTML = state.pendingWeapon
    ? state.weapons
        .map((weapon, index) => weaponCardHTML(weapon, { replaceIndex: index }))
        .join("")
    : state.packOffer.length > 0
      ? state.packOffer
          .map(
            (card, index) => `
              <div class="card ${card.suit}" data-card="${index}" title="Ajouter cette carte">
                ${cardHTML(card)}
              </div>
            `,
          )
          .join("") + `
            <button class="pack-skip" type="button" data-skip-pack>
              <span>PASSER</span>
              <strong>0 carte</strong>
            </button>
          `
      : "";
}

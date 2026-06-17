function renderUI() {
  state.stats = calculateStats();
  updateMobileControlsVisibility();
  updateUIAccent();
  updateGodCountdown();
  ui.playerNameHud.textContent = state.playerName;
  ui.wave.textContent = state.wave;
  ui.hp.textContent = `${Math.ceil(state.player.hp)} / ${state.stats.maxHp}`;
  const hpRatio = state.stats.maxHp > 0 ? Math.max(0, Math.min(1, state.player.hp / state.stats.maxHp)) : 1;
  if (ui.hpBarFill) {
    ui.hpBarFill.style.width = `${Math.round(hpRatio * 100)}%`;
    ui.hpBarFill.style.background = hpRatio > 0.6 ? "var(--club)" : hpRatio > 0.25 ? "var(--gold)" : "var(--danger)";
  }
  ui.money.textContent = `$${state.money}`;
  const capRatio = state.waveGoldCap > 0 ? Math.min(1, (state.waveGoldEarned || 0) / state.waveGoldCap) : 0;
  ui.goldCapFill.style.width = `${Math.round(capRatio * 100)}%`;
  ui.goldMultiplier.textContent = `x${state.stats.moneyMultiplier.toFixed(2)}`;
  ui.shopGold.textContent = `$${state.money}`;
  ui.shopGoldMultiplier.textContent = `OR x${state.stats.moneyMultiplier.toFixed(2)}`;
  const crateHudCount = state.pendingCratePacks + state.crates.length;
  if (state.betweenWaves) {
    ui.enemyCount.textContent = cratePacksWaiting() > 0 ? `Shop | ${cratePacksWaiting()} caisse` : "Shop";
    ui.objectivePanel.classList.add("is-hidden");
  } else if (state.objective) {
    const objective = state.objective;
    let progress = "";
    let progressFull = "";
    if (objective.type === "capture") {
      progress = `${Math.floor((objective.progress / objective.target) * 100)}%`;
      progressFull = `${Math.floor((objective.progress / objective.target) * 100)} / 100%`;
    }
    if (objective.type === "turrets") { progress = `${objective.killed}/${objective.target}`; progressFull = progress; }
    if (objective.type === "runners") { progress = `${objective.collected}/${objective.target}`; progressFull = progress; }
    if (objective.type === "kills")   { progress = `${objective.killed}/${objective.target}`;   progressFull = progress; }
    const crateStr = crateHudCount > 0 ? ` | C${crateHudCount}` : "";
    ui.enemyCount.textContent = `${progress} · ${state.enemies.length}${crateStr}`;
    ui.objectivePanelTitle.textContent = objective.title;
    ui.objectivePanelProgress.textContent = progressFull;
    ui.objectivePanelDesc.textContent = objective.desc;
    ui.objectivePanel.classList.remove("is-hidden");
  } else {
    const crateStr = crateHudCount > 0 ? ` | C${crateHudCount}` : "";
    ui.enemyCount.textContent = `${Math.ceil(state.waveTimeLeft)}s · ${state.enemies.length}${crateStr}`;
    ui.objectivePanel.classList.add("is-hidden");
  }
  ui.rerollShop.textContent = `Relancer - $${rerollCost()}`;
  ui.rerollShop.disabled = !state.betweenWaves || state.money < rerollCost() || state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0;
  ui.startWave.disabled = Boolean(state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0);
  ui.handRank.textContent = `${state.stats.handName} · +${Math.round(state.stats.handDamageBonus * 100)}%`;

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
    Array.from({ length: Math.max(0, (state.character?.maxWeapons || MAX_WEAPONS) + (hasRelic("forge") ? 1 : 0) - state.weapons.length) }, () => `
      <article class="weapon empty-weapon">
        <div class="weapon-top">
          <span class="grade">Vide</span>
          <strong>SLOT LIBRE</strong>
        </div>
      </article>
    `).join("");

  ui.dpsHint.textContent = `DMG x${state.stats.damageMultiplier.toFixed(2)} · CRIT ${Math.round(state.stats.critChance * 100)} · SPD x${state.stats.attackSpeedMultiplier.toFixed(2)}`;

  ui.shopHand.innerHTML =
    state.hand
      .map(
        (card, index) => `
          <article class="shop-hand-card ${state.pendingCurse && !card.cursed ? "is-curse-target" : ""}" data-hand-index="${index}">
            <div class="card ${card.suit}">${cardHTML(card)}</div>
            <div>
              <strong>${card.rank}${SUITS[card.suit].symbol}</strong>
              <p>${shopCardDetails(card)}</p>
            </div>
            ${
              state.pendingCurse
                ? card.cursed
                  ? `<div class="action-pill is-disabled">Déjà</div>`
                  : `<button class="action-pill" type="button" data-curse-card="${index}">Appliquer</button>`
                : `<button class="action-pill sell-card-button" type="button" data-sell-card="${index}">+$${sellValue(card)}</button>`
            }
          </article>
        `,
      )
      .join("") + Array.from({ length: emptySlots }, emptyCardHTML).join("");

  ui.shopSlots.innerHTML = state.shopSlots.map(renderShopSlot).join("");
  renderWeaponCompare();
  renderShopRunInfo();

  ui.packChoiceTitle.textContent = state.packContext
    ? state.packContext.type === "cursePack"
      ? `${state.packContext.name} | Choisis 1`
      : hasFreeHandSlot()
      ? `${state.packContext.name} · Choisis 1`
      : "Main pleine · Vends 1 carte"
    : state.pendingWeapon
      ? "JETER UNE ARME"
    : state.pendingCurse
      ? `${state.pendingCurse.name} · Cible`
    : "PACK";
  if (state.packContext && state.packContext.type !== "cursePack") {
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
      ? state.packContext?.type === "cursePack"
        ? state.packOffer
            .map(
              (curse, index) => `
                <article class="curse-choice" data-curse-choice="${index}">
                  <span class="label">Malédiction</span>
                  <strong>${curse.name}</strong>
                  <p>${curse.desc}</p>
                </article>
              `,
            )
            .join("") + `
              <button class="pack-skip" type="button" data-skip-pack>
                <span>PASSER</span>
                <strong>0 malédiction</strong>
              </button>
            `
        : state.packOffer
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



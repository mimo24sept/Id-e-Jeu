function statBox(label, value) {
  return `
    <div class="stat-box">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderShopRunInfo() {
  if (!ui.shopRunInfo) return;
  const character = state.character;
  const characterName = character?.name || "Aucun";
  const characterDesc = character?.desc || "Pas de modificateur de personnage.";
  const runBonuses = metaRunBonuses();
  const relicEntries = (state.relics || []).map((id) => {
    const r = RELICS.find((r) => r.id === id);
    return r ? `<div class="relic-entry">
      <span class="relic-symbol" style="color:${r.color}">${r.symbol}</span>
      <div><strong>${r.name}</strong><p>${r.desc}</p></div>
    </div>` : "";
  }).join("");

  ui.shopRunInfo.innerHTML = `
    <article class="run-character">
      <span class="label">Personnage</span>
      <strong>${characterName}</strong>
      <p>${characterDesc}</p>
    </article>
    ${relicEntries ? `<div class="run-relics"><span class="label">Reliques</span><div class="relic-list">${relicEntries}</div></div>` : ""}
    <div class="shop-stat-grid">
      ${statBox("PV", `${Math.ceil(state.player.hp)} / ${state.stats.maxHp}`)}
      ${statBox("Regen", state.stats.regen.toFixed(1))}
      ${statBox("Dégâts", `+${state.stats.flatDamage} · x${state.stats.damageMultiplier.toFixed(2)}`)}
      ${statBox("Cadence", `x${state.stats.attackSpeedMultiplier.toFixed(2)}`)}
      ${statBox("Crit", `${Math.round(state.stats.critChance * 100)}%`)}
      ${statBox("Vitesse", Math.round(state.stats.moveSpeed))}
      ${statBox("Portée", `x${(state.stats.weaponRangeMultiplier || 1).toFixed(2)}`)}
      ${statBox("Or", `x${state.stats.moneyMultiplier.toFixed(2)}`)}
      ${statBox("Main", `${state.hand.length}/${effectiveHandSlots()}`)}
      ${statBox("Poker", state.stats.handName)}
      ${statBox("Bonus poker", `+${Math.round(state.stats.handDamageBonus * 100)}%`)}
      ${statBox("Armes", `${state.weapons.length}/${MAX_WEAPONS}`)}
      ${statBox("Caisses", cratePacksWaiting())}
      ${statBox("Prime 7", `+$${runBonuses.waveGold}/vague`)}
      ${statBox("Calme 8", `-${Math.round(runBonuses.enemyReduction * 100)}% monstres`)}
      ${statBox("Packs 9", `-${Math.round(runBonuses.packDiscount * 100)}%`)}
      ${statBox("Fragments 10", `x${runBonuses.fragmentMultiplier.toFixed(2)}`)}
      ${statBox("Cour ♦", `J${Math.round(runBonuses.diamondJackTaxRate * 100)} Q${Math.round(runBonuses.diamondQueenTaxRate * 100)} K${Math.round(runBonuses.diamondKingTaxRate * 100)}`)}
      ${statBox("Ancrage ♠", `${Math.round(runBonuses.stationaryPower * 100)}%`)}
      ${statBox("Auras ♥", `x${runBonuses.heartAuraSizeMultiplier.toFixed(2)}`)}
      ${statBox("Rebonds ♣", runBonuses.clubBounceCount)}
      ${statBox("Gardes", state.bodyguards.length)}
      ${statBox("Map", `${state.stats.mapWidth}x${state.stats.mapHeight}`)}
    </div>
  `;
}

function positionWeaponCompare(anchor) {
  if (!anchor || !ui.weaponCompare) return;
  const anchorRect = anchor.getBoundingClientRect();
  const compareRect = ui.weaponCompare.getBoundingClientRect();
  const gap = 14;
  const margin = 14;
  const rightSpace = window.innerWidth - anchorRect.right;
  const leftSpace = anchorRect.left;
  let left = rightSpace >= compareRect.width + gap || rightSpace >= leftSpace
    ? anchorRect.right + gap
    : anchorRect.left - compareRect.width - gap;
  let top = anchorRect.top;

  left = clamp(left, margin, window.innerWidth - compareRect.width - margin);
  top = clamp(top, margin, window.innerHeight - compareRect.height - margin);
  ui.weaponCompare.style.left = `${left}px`;
  ui.weaponCompare.style.top = `${top}px`;
}

function renderWeaponCompare(anchor = null) {
  if (!ui.weaponCompare) return;
  const candidate = state.shopSlots.find((slot) => slot.id === state.previewWeaponId && slot.type === "weapon" && !slot.bought);
  if (!candidate || state.pendingWeapon || !state.betweenWaves) {
    ui.weaponCompare.classList.add("is-hidden");
    ui.weaponCompare.innerHTML = "";
    ui.weaponCompare.style.left = "";
    ui.weaponCompare.style.top = "";
    return;
  }

  ui.weaponCompare.classList.remove("is-hidden");
  ui.weaponCompare.innerHTML = `
    <h3>COMPARATIF</h3>
    <div class="compare-grid">
      <div>
        <span class="label">Offre</span>
        ${weaponCardHTML(candidate)}
      </div>
      <div>
        <span class="label">Tes armes</span>
        <div class="compare-equipped">
          ${
            state.weapons.length
              ? state.weapons
                  .map(
                    (weapon) => `
                      <div class="compare-current">
                        ${weaponCardHTML(weapon)}
                        ${weaponCompareStats(candidate, weapon)}
                      </div>
                    `,
                  )
                  .join("")
              : `<div class="compare-empty">Aucune arme équipée</div>`
          }
        </div>
      </div>
    </div>
  `;
  positionWeaponCompare(anchor || document.querySelector(`[data-shop-slot="${state.previewWeaponId}"]`));
}

function positionShopTooltip(anchor) {
  if (!anchor || !ui.shopTooltip) return;
  const anchorRect = anchor.getBoundingClientRect();
  const tooltipRect = ui.shopTooltip.getBoundingClientRect();
  const gap = 12;
  const margin = 12;
  const rightSpace = window.innerWidth - anchorRect.right;
  const leftSpace = anchorRect.left;
  let left = rightSpace >= tooltipRect.width + gap || rightSpace >= leftSpace
    ? anchorRect.right + gap
    : anchorRect.left - tooltipRect.width - gap;
  let top = anchorRect.top;
  left = clamp(left, margin, window.innerWidth - tooltipRect.width - margin);
  top = clamp(top, margin, window.innerHeight - tooltipRect.height - margin);
  ui.shopTooltip.style.left = `${left}px`;
  ui.shopTooltip.style.top = `${top}px`;
}

function cardTooltipHTML(card, price = null) {
  return `
    <div class="tooltip-card-head ${card.suit}">
      <div class="card ${card.suit}">${cardHTML(card)}</div>
      <div>
        <span class="label">Carte</span>
        <h3>${card.rank}${SUITS[card.suit].symbol} ${SUITS[card.suit].name}</h3>
        ${price !== null ? `<strong class="tooltip-price">$${price}</strong>` : ""}
      </div>
    </div>
    <p>${shopCardDetails(card)}</p>
  `;
}

function shopSlotTooltipHTML(slot) {
  if (!slot || slot.bought || slot.type === "weapon") return "";
  if (slot.type === "card") return cardTooltipHTML(slot.card, slot.price);
  if (slot.type === "pack") {
    return `
      <span class="label">Pack</span>
      <h3>${slot.name}</h3>
      <strong class="tooltip-price">$${slot.price}</strong>
      <p>${packDetails(slot)}</p>
      <p>Ouvre ${slot.size} cartes. Tu peux en choisir une, vendre une carte pendant le choix, ou passer.</p>
    `;
  }
  if (slot.type === "cursePack") {
    return `
      <span class="label">Malédictions</span>
      <h3>${slot.name}</h3>
      <strong class="tooltip-price">$${slot.price}</strong>
      <p>${slot.desc}</p>
      <p>Révèle 3 effets. Tu en choisis un puis tu l'appliques sur une carte non maudite.</p>
    `;
  }
  return `
    <span class="label">Offre</span>
    <h3>${slot.name}</h3>
    <strong class="tooltip-price">$${slot.price}</strong>
    <p>${slot.desc || ""}</p>
  `;
}

function showShopTooltip(html, anchor) {
  if (!ui.shopTooltip || !html) {
    hideShopTooltip();
    return;
  }
  ui.shopTooltip.innerHTML = html;
  ui.shopTooltip.classList.remove("is-hidden");
  positionShopTooltip(anchor);
}

function hideShopTooltip() {
  if (!ui.shopTooltip) return;
  ui.shopTooltip.classList.add("is-hidden");
  ui.shopTooltip.innerHTML = "";
  ui.shopTooltip.style.left = "";
  ui.shopTooltip.style.top = "";
}

function renderShopSlot(slot) {
  if (slot.bought) {
    return `
      <article class="market-item is-bought">
        <span class="label">Acheté</span>
        <h4>${slot.name}</h4>
      </article>
    `;
  }

  const lockButton = `
    <button class="lock-button ${slot.locked ? "is-locked" : ""}" type="button" data-lock-slot="${slot.id}">
      ${slot.locked ? "LOCK" : "GARDER"}
    </button>
  `;

  if (slot.type === "card") {
    const fullHand = !hasFreeHandSlot();
    const disabled = state.money < slot.price || fullHand;
    return `
      <article class="market-item ${slot.locked ? "is-locked" : ""}" data-shop-slot="${slot.id}" ${disabled ? "aria-disabled=\"true\"" : ""}>
        ${lockButton}
        <div class="market-card card ${slot.card.suit}">${cardHTML(slot.card)}</div>
        <div>
          <span class="label">${slot.name}</span>
          <h4>${slot.card.rank}${SUITS[slot.card.suit].symbol}</h4>
          <p>${shopCardDetails(slot.card)}</p>
        </div>
        <div class="action-pill ${disabled ? "is-disabled" : ""}">${fullHand ? "Main pleine" : `$${slot.price}`}</div>
      </article>
    `;
  }

  if (slot.type === "pack") {
    const disabled = state.money < slot.price;
    return `
      <article class="market-item ${slot.locked ? "is-locked" : ""}" data-shop-slot="${slot.id}" ${disabled ? "aria-disabled=\"true\"" : ""}>
        ${lockButton}
        <div>
          <span class="label">Pack</span>
          <h4>${slot.name}</h4>
          <p>${packDetails(slot)}</p>
        </div>
        <div class="action-pill ${disabled ? "is-disabled" : ""}">$${slot.price}</div>
      </article>
    `;
  }

  if (slot.type === "cursePack") {
    const disabled = state.money < slot.price || state.hand.every((card) => card.cursed);
    return `
      <article class="market-item is-cursed ${slot.locked ? "is-locked" : ""}" data-shop-slot="${slot.id}" ${disabled ? "aria-disabled=\"true\"" : ""}>
        ${lockButton}
        <div>
          <span class="label">Pack</span>
          <h4>${slot.name}</h4>
          <p>${slot.desc}</p>
        </div>
        <div class="action-pill ${disabled ? "is-disabled" : ""}">$${slot.price}</div>
      </article>
    `;
  }

  if (slot.type === "weapon") {
    const disabled = state.money < slot.price;
    return weaponCardHTML(slot, { shopSlotId: slot.id, price: slot.price, disabled, locked: slot.locked });
  }

  const disabled = state.money < slot.price;
  return `
    <article class="market-item ${slot.locked ? "is-locked" : ""}" data-shop-slot="${slot.id}" ${disabled ? "aria-disabled=\"true\"" : ""}>
      ${lockButton}
      <div>
        <span class="label">Main</span>
        <h4>${slot.name}</h4>
        <p>${slot.desc}</p>
      </div>
      <div class="action-pill ${disabled ? "is-disabled" : ""}">$${slot.price}</div>
    </article>
  `;
}



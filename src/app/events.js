window.addEventListener("resize", () => {
  resizeCanvas();
  if (activeTutorialStep) showActiveTutorialStep();
});
ui.connectPlayer.addEventListener("click", connectPlayer);
ui.disconnectPlayer.addEventListener("click", disconnectPlayer);
ui.launchGame.addEventListener("click", launchGame);
ui.openTutorial.addEventListener("click", showTutorial);
ui.buyMetaPack.addEventListener("click", buyMetaPack);
ui.skinGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-skin-id]");
  if (!button) return;
  buyOrEquipSkin(button.dataset.skinId);
});
ui.openMetaCollection.addEventListener("click", openMetaCollection);
ui.closeMetaCollection.addEventListener("click", closeMetaCollection);
ui.openTalentTree.addEventListener("click", () => talentTreeUI.open());
ui.closeTalentTree.addEventListener("click", () => talentTreeUI.close());
ui.closeTutorial.addEventListener("click", closeTutorial);
ui.skipTutorial.addEventListener("click", skipTutorial);
ui.characterChoices.addEventListener("click", (event) => {
  const button = event.target.closest("[data-character-id]");
  if (!button) return;
  if (button.disabled) return;
  const character = CHARACTER_DEFS.find((item) => item.id === button.dataset.characterId);
  if (!character) return;
  if (!isCharacterUnlocked(character.id)) return;
  startRun(character);
});
ui.playerNameInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  if (connectedPlayerName) {
    launchGame();
    return;
  }
  connectPlayer();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !ui.tutorial.classList.contains("is-hidden")) {
    closeTutorial();
    return;
  }
  if (isTypingTarget(event.target)) return;
  const movementKey = movementKeyFromEvent(event);
  if (!movementKey) return;
  event.preventDefault();
  keys.add(movementKey);
});
window.addEventListener("keyup", (event) => {
  if (isTypingTarget(event.target)) return;
  const movementKey = movementKeyFromEvent(event);
  if (movementKey) keys.delete(movementKey);
});
window.addEventListener("blur", () => {
  keys.clear();
  clearTouchMovement();
});

ui.shopHand.addEventListener("click", (event) => {
  const curseButton = event.target.closest("[data-curse-card]");
  if (curseButton) {
    applyCurseToCard(Number(curseButton.dataset.curseCard));
    return;
  }

  const button = event.target.closest("[data-sell-card]");
  if (!button) return;
  sellCard(Number(button.dataset.sellCard));
});
ui.shopHand.addEventListener("mouseover", (event) => {
  const item = event.target.closest(".shop-hand-card");
  if (!item || !ui.shopHand.contains(item)) return;
  const index = Number(item.dataset.handIndex);
  const card = state.hand[index];
  if (!card) return;
  showShopTooltip(cardTooltipHTML(card, sellValue(card)), item);
});
ui.shopHand.addEventListener("mousemove", (event) => {
  const item = event.target.closest(".shop-hand-card");
  if (item && !ui.shopTooltip.classList.contains("is-hidden")) positionShopTooltip(item);
});
ui.shopHand.addEventListener("mouseout", (event) => {
  const item = event.target.closest(".shop-hand-card");
  if (!item || item.contains(event.relatedTarget)) return;
  hideShopTooltip();
});
ui.weapons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-replace-weapon]");
  if (!button) return;
  replaceWeapon(Number(button.dataset.replaceWeapon));
});
ui.shopSlots.addEventListener("click", (event) => {
  const lockButton = event.target.closest("[data-lock-slot]");
  if (lockButton) {
    event.stopPropagation();
    toggleShopLock(lockButton.dataset.lockSlot);
    return;
  }

  const button = event.target.closest("[data-shop-slot]");
  if (!button) return;
  buyShopSlot(button.dataset.shopSlot);
});
ui.shopSlots.addEventListener("mouseover", (event) => {
  const item = event.target.closest("[data-shop-slot]");
  if (!item || !ui.shopSlots.contains(item)) return;
  const slot = state.shopSlots.find((entry) => entry.id === item.dataset.shopSlot);
  const nextPreview = slot?.type === "weapon" ? slot.id : null;
  if (state.previewWeaponId === nextPreview) return;
  state.previewWeaponId = nextPreview;
  renderWeaponCompare(item);
  showShopTooltip(shopSlotTooltipHTML(slot), item);
});
ui.shopSlots.addEventListener("mousemove", (event) => {
  const item = event.target.closest("[data-shop-slot]");
  if (!item) return;
  if (state.previewWeaponId && item.dataset.shopSlot === state.previewWeaponId && !ui.weaponCompare.classList.contains("is-hidden")) {
    positionWeaponCompare(item);
  }
  if (!ui.shopTooltip.classList.contains("is-hidden")) positionShopTooltip(item);
});
ui.shopSlots.addEventListener("mouseout", (event) => {
  const item = event.target.closest("[data-shop-slot]");
  if (!item || item.contains(event.relatedTarget)) return;
  const slot = state.shopSlots.find((entry) => entry.id === item.dataset.shopSlot);
  if (slot?.id === state.previewWeaponId) {
    state.previewWeaponId = null;
    renderWeaponCompare();
  }
  hideShopTooltip();
});
window.addEventListener("scroll", () => {
  if (!state?.previewWeaponId) return;
  positionWeaponCompare(document.querySelector(`[data-shop-slot="${state.previewWeaponId}"]`));
}, true);
ui.rerollShop.addEventListener("click", rerollShop);
ui.packOffer.addEventListener("click", (event) => {
  const skipButton = event.target.closest("[data-skip-pack]");
  if (skipButton) {
    skipPack();
    return;
  }

  const replaceButton = event.target.closest("[data-replace-weapon]");
  if (replaceButton) {
    replaceWeapon(Number(replaceButton.dataset.replaceWeapon));
    return;
  }

  const curseChoice = event.target.closest("[data-curse-choice]");
  if (curseChoice) {
    chooseCurse(Number(curseChoice.dataset.curseChoice));
    return;
  }

  const button = event.target.closest("[data-card]");
  if (!button) return;
  chooseCard(Number(button.dataset.card));
});
ui.packOffer.addEventListener("mouseover", (event) => {
  const cardButton = event.target.closest("[data-card]");
  if (cardButton) {
    showShopTooltip(cardTooltipHTML(state.packOffer[Number(cardButton.dataset.card)]), cardButton);
    return;
  }
  const curseChoice = event.target.closest("[data-curse-choice]");
  if (curseChoice) {
    const curse = state.packOffer[Number(curseChoice.dataset.curseChoice)];
    showShopTooltip(`
      <span class="label">Malédiction</span>
      <h3>${curse.name}</h3>
      <p>${curse.desc}</p>
    `, curseChoice);
  }
});
ui.packOffer.addEventListener("mousemove", (event) => {
  const anchor = event.target.closest("[data-card], [data-curse-choice]");
  if (anchor && !ui.shopTooltip.classList.contains("is-hidden")) positionShopTooltip(anchor);
});
ui.packOffer.addEventListener("mouseout", (event) => {
  const anchor = event.target.closest("[data-card], [data-curse-choice]");
  if (!anchor || anchor.contains(event.relatedTarget)) return;
  hideShopTooltip();
});
ui.startWave.addEventListener("click", beginWave);
ui.restart.addEventListener("click", restart);
ui.cashOutRun.addEventListener("click", cashOutRun);
ui.continueRun.addEventListener("click", continueRun);

window.PokerSurvivorDebug = {
  triggerGodMode,
  fillDeck() {
    const owned = new Set(state.hand.map(cardKey));
    for (const suit of Object.keys(SUITS)) {
      for (const rank of RANKS) {
        const key = `${rank.label}-${suit}`;
        if (owned.has(key)) continue;
        state.hand.push({
          id: uniqueId(`${rank.label}-${suit}`),
          suit,
          rank: rank.label,
          value: rank.value,
        });
        owned.add(key);
      }
    }
    state.handSlots = Math.max(state.handSlots, FULL_DECK_SIZE);
    triggerGodMode();
    renderUI();
  },
};

initMenu();



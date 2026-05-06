window.addEventListener("resize", () => {
  resizeCanvas();
  if (activeTutorialStep) showActiveTutorialStep();
});
ui.connectPlayer.addEventListener("click", connectPlayer);
ui.launchGame.addEventListener("click", launchGame);
ui.openTutorial.addEventListener("click", showTutorial);
ui.closeTutorial.addEventListener("click", closeTutorial);
ui.skipTutorial.addEventListener("click", skipTutorial);
ui.characterChoices.addEventListener("click", (event) => {
  const button = event.target.closest("[data-character-id]");
  if (!button) return;
  const character = CHARACTER_DEFS.find((item) => item.id === button.dataset.characterId);
  if (!character) return;
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
});
ui.shopSlots.addEventListener("mousemove", (event) => {
  if (!state.previewWeaponId || ui.weaponCompare.classList.contains("is-hidden")) return;
  const item = event.target.closest("[data-shop-slot]");
  if (!item || item.dataset.shopSlot !== state.previewWeaponId) return;
  positionWeaponCompare(item);
});
ui.shopSlots.addEventListener("mouseout", (event) => {
  const item = event.target.closest("[data-shop-slot]");
  if (!item || item.contains(event.relatedTarget)) return;
  const slot = state.shopSlots.find((entry) => entry.id === item.dataset.shopSlot);
  if (slot?.id !== state.previewWeaponId) return;
  state.previewWeaponId = null;
  renderWeaponCompare();
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

  const button = event.target.closest("[data-card]");
  if (!button) return;
  chooseCard(Number(button.dataset.card));
});
ui.startWave.addEventListener("click", beginWave);
ui.restart.addEventListener("click", restart);

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



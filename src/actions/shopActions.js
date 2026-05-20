function pickReplacementIndex(card) {
  const currentStats = calculateStats();
  let bestIndex = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < state.hand.length; i += 1) {
    const testHand = state.hand.slice();
    testHand[i] = card;
    const oldHand = state.hand;
    state.hand = testHand;
    const stats = calculateStats();
    state.hand = oldHand;

    const score =
      (stats.damageMultiplier - currentStats.damageMultiplier) * 12 +
      (stats.attackSpeedMultiplier - currentStats.attackSpeedMultiplier) * 10 +
      (stats.moneyMultiplier - currentStats.moneyMultiplier) * 8 +
      (stats.maxHp - currentStats.maxHp) * 0.12 +
      stats.handPower -
      currentStats.handPower;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestScore > 0 ? bestIndex : state.hand.findIndex((owned) => owned.value === Math.min(...state.hand.map((card) => card.value)));
}

function addCardToHand(card) {
  if (state.hand.some((owned) => cardKey(owned) === cardKey(card))) {
    return false;
  }
  if (!hasFreeHandSlot()) {
    return false;
  }
  state.hand.push(card);
  if (new Set(state.hand.map(cardKey)).size >= FULL_DECK_SIZE) {
    triggerGodMode();
  }
  return true;
}

function refreshStatsKeepingMaxHpGain(extraHeal = 0) {
  const previousMaxHp = state.stats?.maxHp || calculateStats().maxHp;
  state.stats = calculateStats();
  const maxHpGain = Math.max(0, state.stats.maxHp - previousMaxHp);
  state.player.hp = Math.min(state.stats.maxHp, state.player.hp + maxHpGain + extraHeal);
}

function openNextCratePack() {
  if (state.pendingCratePacks <= 0) return false;
  state.pendingCratePacks -= 1;
  state.pendingCurse = null;
  state.pendingWeapon = null;
  state.packContext = {
    id: uniqueId("crate-pack"),
    type: "cratePack",
    name: "Caisse recuperee",
    size: 4,
    price: 0,
  };
  state.packOffer = drawUniqueCards(4, { exclude: usedCardKeys() });
  return state.packOffer.length > 0;
}

function closePackChoice() {
  state.packOffer = [];
  state.packContext = null;
  openNextCratePack();
}

function chooseCard(index) {
  if (state.pendingWeapon) return;
  const card = state.packOffer[index];
  if (!card) return;
  if (!addCardToHand(card)) return;
  closePackChoice();
  refreshStatsKeepingMaxHpGain();
  renderUI();
  if (state.packOffer.length > 0) queueTutorialSteps(["packChoice"]);
}

function skipPack() {
  if (state.pendingWeapon || state.packOffer.length === 0) return;
  closePackChoice();
  renderUI();
  if (state.packOffer.length > 0) queueTutorialSteps(["packChoice"]);
}

function sellCard(index) {
  if (state.pendingCurse || state.pendingWeapon) return;
  const card = state.hand[index];
  if (!card) return;
  state.money += sellValue(card);
  state.hand.splice(index, 1);
  state.stats = calculateStats();
  state.player.hp = Math.min(state.player.hp, state.stats.maxHp);
  renderUI();
}

function rerollShop() {
  if (!state.betweenWaves || state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0) return;
  const cost = rerollCost();
  if (state.money < cost) return;
  state.money -= cost;
  state.shopRerolls += 1;
  state.runRerolls = (state.runRerolls || 0) + 1;
  state.previewWeaponId = null;
  state.shopSlots = rollShopSlots();
  renderUI();
}

function toggleShopLock(id) {
  if (!state.betweenWaves || state.pendingCurse || state.pendingWeapon || state.packOffer.length > 0) return;
  const slot = state.shopSlots.find((item) => item.id === id);
  if (!slot || slot.bought) return;
  slot.locked = !slot.locked;
  renderUI();
}

function equipWeapon(weapon) {
  const equipped = { ...weapon, cooldown: 0.2 };
  const maxWeapons = state.character?.maxWeapons || MAX_WEAPONS;
  if (state.weapons.length < maxWeapons) {
    state.weapons.push(equipped);
    state.runMaxWeapons = Math.max(state.runMaxWeapons || 1, state.weapons.length);
    return true;
  }

  state.pendingWeapon = {
    weapon: equipped,
    heal: weapon.healthBonus,
  };
  return false;
}

function replaceWeapon(index) {
  if (!state.pendingWeapon || !state.weapons[index]) return;
  state.weapons[index] = state.pendingWeapon.weapon;
  const heal = state.pendingWeapon.heal;
  state.pendingWeapon = null;
  state.stats = calculateStats();
  state.player.hp = Math.min(state.stats.maxHp, state.player.hp + heal);
  renderUI();
}

function buyShopSlot(id) {
  const slot = state.shopSlots.find((item) => item.id === id);
  if (state.pendingWeapon) return;
  if (!slot || slot.bought || state.money < slot.price) return;
  if (slot.type === "card" && !hasFreeHandSlot()) return;
  if (state.previewWeaponId === slot.id) state.previewWeaponId = null;

  if (slot.type === "pack") {
    buyPack(slot);
    return;
  }

  if (slot.type === "cursePack") {
    buyCursePack(slot);
    return;
  }

  state.money -= slot.price;
  slot.bought = true;
  slot.locked = false;

  if (slot.type === "weapon") {
    const equippedNow = equipWeapon(slot);
    if (!equippedNow) {
      renderUI();
      return;
    }
  }

  if (slot.type === "card") {
    if (!addCardToHand(slot.card)) {
      slot.bought = false;
      state.money += slot.price;
      renderUI();
      return;
    }
  }

  if (slot.type === "slot") {
    state.handSlots += 1;
  }

  refreshStatsKeepingMaxHpGain(slot.type === "slot" ? 8 : slot.type === "weapon" ? slot.healthBonus : 0);
  renderUI();
}

function rollCurseChoices(count) {
  const choices = [];
  const used = new Set();
  let guard = 0;
  while (choices.length < count && guard < 40) {
    guard += 1;
    const curseDef = rollCardCurseDef();
    if (used.has(curseDef.id)) continue;
    used.add(curseDef.id);
    choices.push({
      ...curseDef,
      id: uniqueId(curseDef.id),
    });
  }
  return choices;
}

function buyCursePack(slot) {
  if (state.hand.every((card) => card.cursed)) return;
  state.money -= slot.price;
  slot.bought = true;
  state.pendingCurse = null;
  state.packContext = slot;
  state.packOffer = rollCurseChoices(slot.size || 3);
  renderUI();
  queueTutorialSteps(["curseChoice"]);
}

function chooseCurse(index) {
  if (!state.packContext || state.packContext.type !== "cursePack") return;
  const curse = state.packOffer[index];
  if (!curse) return;
  state.pendingCurse = {
    name: curse.name,
    curse: curse.curse,
  };
  state.packOffer = [];
  state.packContext = null;
  renderUI();
}

function applyCurseToCard(index) {
  const card = state.hand[index];
  if (!card || !state.pendingCurse || card.cursed) return;
  card.cursed = true;
  card.curse = state.pendingCurse.curse;
  state.runCursesApplied = (state.runCursesApplied || 0) + 1;
  state.pendingCurse = null;
  refreshStatsKeepingMaxHpGain();
  renderUI();
}

function buyPack(pack) {
  if (!pack || pack.bought || state.money < pack.price) return;
  state.money -= pack.price;
  pack.bought = true;
  state.packContext = pack;
  state.pendingCurse = null;
  state.packOffer = drawUniqueCards(pack.size, { suit: pack.suit, exclude: usedCardKeys() });
  renderUI();
  queueTutorialSteps(["packChoice"]);
}



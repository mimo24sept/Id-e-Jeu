function loop(now) {
  if (!state) return;
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  renderGame();
  uiRefresh -= dt;
  if (uiRefresh <= 0 && !state.betweenWaves && !state.gameOver) {
    renderUI();
    uiRefresh = 0.12;
  }
  animationId = requestAnimationFrame(loop);
}

function showMainMenu() {
  cancelAnimationFrame(animationId);
  clearTimeout(godCloseTimeout);
  clearInterval(godCountdownInterval);
  connectedPlayerName = connectedPlayerName || state?.playerName || "Joueur";
  ui.gameOver.classList.add("is-hidden");
  ui.runDecision.classList.add("is-hidden");
  ui.godMode.classList.add("is-hidden");
  ui.mainMenu.classList.remove("is-hidden");
  ui.characterSelect.classList.add("is-hidden");
  ui.shop.classList.add("is-hidden");
  hideShopTooltip();
  state = null;
  renderGameShell();
  updateMenuPanels();
  renderMetaProgression();
  updateMobileControlsVisibility();
}

function restart() {
  showMainMenu();
}

function characterBonusText(character) {
  if (character.desc) return character.desc;
  const multipliers = character.cardEffectMultipliers || {};
  const lines = Object.entries(SUITS)
    .map(([suit, data]) => {
      const multiplier = multipliers[suit];
      if (!multiplier || multiplier === 1) return "";
      return `${data.symbol} x${multiplier}`;
    })
    .filter(Boolean);
  return lines.length ? lines.join(" · ") : "Aucun modificateur de couleur";
}

function startRun(character = null) {
  cancelAnimationFrame(animationId);
  clearTimeout(godCloseTimeout);
  clearInterval(godCountdownInterval);
  createState({ playerName: connectedPlayerName, character });
  ui.mainMenu.classList.add("is-hidden");
  ui.characterSelect.classList.add("is-hidden");
  ui.gameOver.classList.add("is-hidden");
  ui.runDecision.classList.add("is-hidden");
  ui.godMode.classList.add("is-hidden");
  ui.shop.classList.add("is-hidden");
  lastTime = performance.now();
  beginWave();
  updateMobileControlsVisibility();
  animationId = requestAnimationFrame(loop);
}

function showRunDecision(completedWave) {
  state.fragmentDecisionWave = completedWave;
  const cashReward = runFragmentReward(completedWave) * metaRunBonuses().fragmentMultiplier * state.fragmentStakeMultiplier;
  const nextReward = cashReward * 2;
  ui.runDecisionTitle.textContent = `Vague ${completedWave}`;
  ui.runDecisionText.textContent = `Encaisser ${Math.round(cashReward)} fragments, ou doubler a ${Math.round(nextReward)}. Si tu meurs, tu ne gardes que 20%.`;
  ui.cashOutRun.textContent = `Encaisser ${Math.round(cashReward)}`;
  ui.continueRun.textContent = `Doubler vers vague ${completedWave + 10}`;
  ui.runDecision.classList.remove("is-hidden");
  queueTutorialSteps(["runDecision"]);
}

function cashOutRun() {
  if (!state?.fragmentDecisionWave) return;
  grantRunFragments(state.fragmentDecisionWave, metaRunBonuses().fragmentMultiplier * state.fragmentStakeMultiplier);
  ui.runDecision.classList.add("is-hidden");
  showMainMenu();
}

function continueRun() {
  if (!state?.fragmentDecisionWave) return;
  state.fragmentStakeMultiplier *= 2;
  state.fragmentDecisionWave = 0;
  ui.runDecision.classList.add("is-hidden");
  renderUI();
}

function showCharacterSelect() {
  const meta = playerMeta();
  syncCharacterUnlocks(meta);

  ui.mainMenu.classList.add("is-hidden");
  ui.characterSelect.classList.remove("is-hidden");
  updateMobileControlsVisibility();
  ui.characterChoices.innerHTML = CHARACTER_DEFS
    .map(
      (character) => {
        const unlocked = isCharacterUnlocked(character.id, meta);
        const unlock = characterUnlockInfo(character, meta);
        return `
        <button class="character-card ${unlocked ? "" : "is-locked"}" type="button" data-character-id="${character.id}" ${unlocked ? "" : "disabled"}>
          <span class="label">${character.title || "Personnage"}</span>
          <strong>${character.name}</strong>
          <p>${character.desc || ""}</p>
          <div class="stat-strip">${characterBonusText(character)}</div>
          <span class="character-lock">${unlocked ? "Disponible" : `Bloqué · ${unlock.text}`}</span>
        </button>
      `;
      },
    )
    .join("");
  queueTutorialSteps(["characterPick"]);
}

function cleanPlayerName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 18);
}

function setConnectedPlayer(name) {
  connectedPlayerName = cleanPlayerName(name) || "Joueur";
  localStorage.setItem("pokerSurvivorName", connectedPlayerName);
  ui.playerNameInput.value = connectedPlayerName;
  ui.menuPlayerName.textContent = `Connecté: ${connectedPlayerName}`;
  ui.launchGame.disabled = false;
  ui.playerNameHud.textContent = connectedPlayerName;
  updateMenuPanels();
  renderMetaProgression();
}

function connectPlayer() {
  setConnectedPlayer(ui.playerNameInput.value);
}

function disconnectPlayer() {
  connectedPlayerName = "";
  localStorage.removeItem("pokerSurvivorName");
  ui.playerNameInput.value = "";
  ui.playerNameHud.textContent = "-";
  updateMenuPanels();
  renderMetaProgression();
}

function launchGame() {
  const typedName = cleanPlayerName(ui.playerNameInput.value);
  if (typedName && typedName !== connectedPlayerName) setConnectedPlayer(typedName);
  if (!connectedPlayerName) connectPlayer();
  showCharacterSelect();
}

function showTutorial() {
  replayTutorial();
}

let waveAnnouncementTimeout = null;

function showWaveAnnouncement({ label, title, desc, color }) {
  ui.waveAnnouncementLabel.textContent = label || "";
  ui.waveAnnouncementTitle.textContent = title || "";
  ui.waveAnnouncementTitle.style.color = color || "var(--text)";
  ui.waveAnnouncementDesc.textContent = desc || "";
  ui.waveAnnouncement.classList.add("is-visible");
  clearTimeout(waveAnnouncementTimeout);
  waveAnnouncementTimeout = setTimeout(() => {
    ui.waveAnnouncement.classList.remove("is-visible");
  }, 2000);
}

function exportSave() {
  const save = {
    version: 1,
    exportedAt: new Date().toISOString(),
    playerName: connectedPlayerName || localStorage.getItem("pokerSurvivorName") || "",
    metaProgression: localStorage.getItem("pokerSurvivorMetaProgression"),
  };
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `poker-survivor-${save.playerName || "save"}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importSave() {
  ui.importSaveInput.value = "";
  ui.importSaveInput.click();
}

function onImportSaveFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const save = JSON.parse(e.target.result);
      if (!save.metaProgression) throw new Error("Fichier invalide");
      localStorage.setItem("pokerSurvivorMetaProgression", save.metaProgression);
      if (save.playerName) {
        localStorage.setItem("pokerSurvivorName", save.playerName);
        connectedPlayerName = save.playerName;
      }
      metaProgression = loadMetaProgression();
      showMainMenu();
      if (connectedPlayerName) setConnectedPlayer(connectedPlayerName);
    } catch {
      alert("Fichier de sauvegarde invalide ou corrompu.");
    }
  };
  reader.readAsText(file);
}

function closeTutorial() {
  completeTutorialStep();
}

function initMenu() {
  resizeCanvas();
  updateControlsTip();
  detectKeyboardLayout();
  ui.mainMenu.classList.remove("is-hidden");
  ui.characterSelect.classList.add("is-hidden");
  ui.playerNameInput.value = connectedPlayerName;
  ui.playerNameHud.textContent = connectedPlayerName || "-";
  updateMenuPanels();
  renderMetaProgression();
  renderGameShell();
  queueTutorialSteps(["menuConnect", "menuPlay", "menuFragments", "menuTalents"]);
  updateMobileControlsVisibility();
}

function updateMenuPanels() {
  const connected = Boolean(connectedPlayerName);
  ui.loginPanel.classList.toggle("is-hidden", connected);
  ui.playerHub.classList.toggle("is-hidden", !connected);
  ui.launchGame.disabled = !connected;
  ui.menuTitle.textContent = connected ? "HUB" : "ENTRÉE";
  ui.menuPlayerName.textContent = connected ? `Connecté: ${connectedPlayerName}` : "Aucun joueur connecté";
}

function renderGameShell() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawGridBackdrop();
}




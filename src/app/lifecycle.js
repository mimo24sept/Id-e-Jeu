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

function restart() {
  cancelAnimationFrame(animationId);
  clearTimeout(godCloseTimeout);
  clearInterval(godCountdownInterval);
  connectedPlayerName = connectedPlayerName || state?.playerName || "Joueur";
  ui.gameOver.classList.add("is-hidden");
  ui.godMode.classList.add("is-hidden");
  ui.mainMenu.classList.add("is-hidden");
  ui.characterSelect.classList.add("is-hidden");
  ui.shop.classList.add("is-hidden");
  showCharacterSelect();
}

function randomCharacterChoices() {
  return CHARACTER_DEFS
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
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
  return lines.length ? lines.join(" Â· ") : "Aucun modificateur de couleur";
}

function startRun(character = null) {
  cancelAnimationFrame(animationId);
  clearTimeout(godCloseTimeout);
  clearInterval(godCountdownInterval);
  createState({ playerName: connectedPlayerName, character });
  ui.mainMenu.classList.add("is-hidden");
  ui.characterSelect.classList.add("is-hidden");
  ui.gameOver.classList.add("is-hidden");
  ui.godMode.classList.add("is-hidden");
  ui.shop.classList.add("is-hidden");
  lastTime = performance.now();
  beginWave();
  animationId = requestAnimationFrame(loop);
}

function showCharacterSelect() {
  const choices = randomCharacterChoices();
  if (choices.length < 3) {
    startRun();
    return;
  }

  ui.mainMenu.classList.add("is-hidden");
  ui.characterSelect.classList.remove("is-hidden");
  ui.characterChoices.innerHTML = choices
    .map(
      (character) => `
        <button class="character-card" type="button" data-character-id="${character.id}">
          <span class="label">${character.title || "Personnage"}</span>
          <strong>${character.name}</strong>
          <p>${character.desc || ""}</p>
          <div class="stat-strip">${characterBonusText(character)}</div>
        </button>
      `,
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
  ui.menuPlayerName.textContent = `ConnectÃ©: ${connectedPlayerName}`;
  ui.launchGame.disabled = false;
  ui.playerNameHud.textContent = connectedPlayerName;
}

function connectPlayer() {
  setConnectedPlayer(ui.playerNameInput.value);
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
  ui.launchGame.disabled = !connectedPlayerName;
  ui.menuPlayerName.textContent = connectedPlayerName ? `ConnectÃ©: ${connectedPlayerName}` : "Aucun joueur connectÃ©";
  ui.playerNameHud.textContent = connectedPlayerName || "-";
  renderGameShell();
  queueTutorialSteps(["menuName", "menuLaunch"]);
}

function renderGameShell() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawGridBackdrop();
}


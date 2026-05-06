const META_STORAGE_KEY = "pokerSurvivorMetaProgression";
const MAX_CARD_UPGRADE_LEVEL = 4;

function emptyMetaProgression() {
  return { players: {} };
}

function loadMetaProgression() {
  try {
    return JSON.parse(localStorage.getItem(META_STORAGE_KEY)) || emptyMetaProgression();
  } catch {
    return emptyMetaProgression();
  }
}

function saveMetaProgression() {
  localStorage.setItem(META_STORAGE_KEY, JSON.stringify(metaProgression));
}

function defaultPlayerMeta() {
  return {
    fragments: 0,
    packsBought: 0,
    cardUpgrades: {},
    bestWave: 0,
  };
}

function playerMeta(name = connectedPlayerName || "Joueur") {
  const playerName = cleanPlayerName(name) || "Joueur";
  metaProgression.players[playerName] ||= defaultPlayerMeta();
  return metaProgression.players[playerName];
}

function metaCardKey(suit, rank) {
  return `${rank.label}-${suit}`;
}

function metaDeckKeys() {
  return Object.keys(SUITS).flatMap((suit) => RANKS.map((rank) => metaCardKey(suit, rank)));
}

function metaPackCost(meta = playerMeta()) {
  return Math.round(35 * Math.pow(1.16, meta.packsBought));
}

function runFragmentReward(waveReached) {
  const wave = Math.max(1, waveReached || 1);
  return Math.round(8 + wave * 7 + Math.pow(wave, 1.35) * 2.2);
}

function grantRunFragments(waveReached) {
  const meta = playerMeta();
  const reward = runFragmentReward(waveReached);
  meta.fragments += reward;
  meta.bestWave = Math.max(meta.bestWave || 0, waveReached);
  saveMetaProgression();
  renderMetaProgression();
  return reward;
}

function cardUpgradeLevel(key, meta = playerMeta()) {
  return meta.cardUpgrades[key] || 0;
}

function upgradeableMetaCards(meta = playerMeta()) {
  return metaDeckKeys().filter((key) => cardUpgradeLevel(key, meta) < MAX_CARD_UPGRADE_LEVEL);
}

function describeMetaCard(key) {
  const [rank, suit] = key.split("-");
  return `${rank}${SUITS[suit].symbol}`;
}

function buyMetaPack() {
  const meta = playerMeta();
  const cost = metaPackCost(meta);
  if (meta.fragments < cost) return;

  const pool = upgradeableMetaCards(meta);
  if (pool.length === 0) return;

  meta.fragments -= cost;
  meta.packsBought += 1;
  const results = [];
  while (results.length < 2 && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const key = pool.splice(index, 1)[0];
    const before = cardUpgradeLevel(key, meta);
    meta.cardUpgrades[key] = Math.min(MAX_CARD_UPGRADE_LEVEL, before + 1);
    results.push({ key, before, after: meta.cardUpgrades[key] });
  }

  saveMetaProgression();
  renderMetaProgression(results);
}

function renderMetaProgression(lastPack = []) {
  if (!ui.metaFragments) return;
  const meta = playerMeta();
  const cost = metaPackCost(meta);
  const upgradedCount = Object.keys(meta.cardUpgrades).length;
  const totalLevels = Object.values(meta.cardUpgrades).reduce((sum, level) => sum + level, 0);

  ui.metaFragments.textContent = meta.fragments;
  ui.metaPackCost.textContent = cost;
  ui.buyMetaPack.disabled = meta.fragments < cost || upgradeableMetaCards(meta).length === 0;
  ui.metaUpgradeSummary.textContent = `${upgradedCount}/52 cartes améliorées · ${totalLevels} niveaux · best vague ${meta.bestWave || 0}`;
  ui.metaPackResult.innerHTML = lastPack
    .map((item) => `<span>${describeMetaCard(item.key)} niv.${item.before} -> ${item.after}</span>`)
    .join("");
}

let metaProgression = loadMetaProgression();

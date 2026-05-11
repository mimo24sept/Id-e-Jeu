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
  if (playerName === "Dev") unlockDevMeta(metaProgression.players[playerName]);
  return metaProgression.players[playerName];
}

function unlockDevMeta(meta) {
  for (const key of metaDeckKeys()) {
    meta.cardUpgrades[key] = MAX_CARD_UPGRADE_LEVEL;
  }
  meta.fragments = Math.max(meta.fragments || 0, 999999);
  meta.packsBought = Math.max(meta.packsBought || 0, 0);
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

function grantRunFragments(waveReached, multiplier = 1) {
  const meta = playerMeta();
  const reward = Math.round(runFragmentReward(waveReached) * Math.max(1, multiplier));
  meta.fragments += reward;
  meta.bestWave = Math.max(meta.bestWave || 0, waveReached);
  saveMetaProgression();
  renderMetaProgression();
  return reward;
}

function cardUpgradeLevel(key, meta = playerMeta()) {
  return meta.cardUpgrades[key] || 0;
}

function cardMetaKey(card) {
  return `${card.rank}-${card.suit}`;
}

function cardMetaLevel(card, meta = playerMeta()) {
  return cardUpgradeLevel(cardMetaKey(card), meta);
}

function cardMetaEffectDef(card) {
  const value = card?.value || 0;
  if (value >= 2 && value <= 6) return CARD_META_EFFECTS.revolution;
  if (value === 7) return CARD_META_EFFECTS.stipend;
  if (value === 8) return CARD_META_EFFECTS.pacification;
  if (value === 9) return CARD_META_EFFECTS.bargaining;
  if (value === 10) return CARD_META_EFFECTS.legacy;
  if (card?.suit === "diamonds" && value === 11) return CARD_META_EFFECTS.diamondJack;
  if (card?.suit === "diamonds" && value === 12) return CARD_META_EFFECTS.diamondQueen;
  if (card?.suit === "diamonds" && value === 13) return CARD_META_EFFECTS.diamondKing;
  if (card?.suit === "diamonds" && value === 14) return CARD_META_EFFECTS.diamondAce;
  if (card?.suit === "spades" && value === 11) return CARD_META_EFFECTS.spadeJack;
  if (card?.suit === "spades" && value === 12) return CARD_META_EFFECTS.spadeQueen;
  if (card?.suit === "spades" && value === 13) return CARD_META_EFFECTS.spadeKing;
  if (card?.suit === "spades" && value === 14) return CARD_META_EFFECTS.spadeAce;
  if (card?.suit === "hearts" && value === 11) return CARD_META_EFFECTS.heartJack;
  if (card?.suit === "hearts" && value === 12) return CARD_META_EFFECTS.heartQueen;
  if (card?.suit === "hearts" && value === 13) return CARD_META_EFFECTS.heartKing;
  if (card?.suit === "hearts" && value === 14) return CARD_META_EFFECTS.heartAce;
  if (card?.suit === "clubs" && value === 11) return CARD_META_EFFECTS.clubJack;
  if (card?.suit === "clubs" && value === 12) return CARD_META_EFFECTS.clubQueen;
  if (card?.suit === "clubs" && value === 13) return CARD_META_EFFECTS.clubKing;
  if (card?.suit === "clubs" && value === 14) return CARD_META_EFFECTS.clubAce;
  return null;
}

function cardMetaEffectName(card) {
  return cardMetaEffectDef(card)?.name || "";
}

function cardMetaEffectBadge(card) {
  return cardMetaEffectDef(card)?.badge || "M";
}

function upgradeableMetaCards(meta = playerMeta()) {
  return metaDeckKeys().filter((key) => cardUpgradeLevel(key, meta) < MAX_CARD_UPGRADE_LEVEL);
}

function describeMetaCard(key) {
  const [rank, suit] = key.split("-");
  return `${rank}${SUITS[suit].symbol}`;
}

function metaCardDataFromKey(key) {
  const [rank, suit] = key.split("-");
  const rankDef = RANKS.find((item) => item.label === rank);
  return { rank, suit, value: rankDef?.value || 0 };
}

function metaCardSort(a, b) {
  const suitOrder = Object.keys(SUITS);
  const aCard = metaCardDataFromKey(a);
  const bCard = metaCardDataFromKey(b);
  return suitOrder.indexOf(aCard.suit) - suitOrder.indexOf(bCard.suit) || aCard.value - bCard.value;
}

function describeMetaEffectForKey(key) {
  const card = metaCardDataFromKey(key);
  return cardMetaEffectDef(card)?.desc || "Effet à définir";
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
  if (ui.metaCollection && !ui.metaCollection.classList.contains("is-hidden")) renderMetaCollection();
}

function renderMetaCollection() {
  if (!ui.metaCollectionGrid) return;
  const meta = playerMeta();
  const entries = Object.entries(meta.cardUpgrades)
    .filter(([, level]) => level > 0)
    .sort(([a], [b]) => metaCardSort(a, b));
  const totalLevels = entries.reduce((sum, [, level]) => sum + level, 0);

  ui.metaCollectionStats.textContent = `${entries.length}/52 cartes · ${totalLevels} niveaux · ${meta.fragments} fragments`;
  ui.metaCollectionGrid.innerHTML = entries.length
    ? entries
        .map(([key, level]) => {
          const card = metaCardDataFromKey(key);
          const suit = SUITS[card.suit];
          const pips = Array.from({ length: MAX_CARD_UPGRADE_LEVEL }, (_, index) => (
            `<span class="${index < level ? "is-lit" : ""}"></span>`
          )).join("");
          return `
            <article class="meta-card-entry ${card.suit} level-${level}">
              <div class="meta-card-face">
                <strong>${card.rank}</strong>
                <span>${suit.symbol}</span>
                <em>${cardMetaEffectBadge(card)}</em>
              </div>
              <div>
                <span class="label">${suit.name}</span>
                <h3>Niveau ${level}</h3>
                <div class="meta-level-pips" aria-label="Niveau ${level} sur ${MAX_CARD_UPGRADE_LEVEL}">${pips}</div>
                <p>${describeMetaEffectForKey(key)}</p>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="meta-collection-empty">Aucune carte améliorée</div>`;
}

function openMetaCollection() {
  renderMetaCollection();
  ui.metaCollection.classList.remove("is-hidden");
}

function closeMetaCollection() {
  ui.metaCollection.classList.add("is-hidden");
}

let metaProgression = loadMetaProgression();

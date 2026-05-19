const META_STORAGE_KEY = "pokerSurvivorMetaProgression";
const MAX_CARD_UPGRADE_LEVEL = 4;
const STARTER_CHARACTER_IDS = ["shadow", "vampire"];

const SKIN_DEFS = [
  { id: "classic", name: "Classique", desc: "Rond jaune brutal.", cost: 0, shape: "circle", primary: "#f0b84b", stroke: "#151719", symbol: "" },
  { id: "black-brut", name: "Noir Brut", desc: "Carré anguleux noir et blanc.", cost: 220, shape: "square", primary: "#f4f4f4", stroke: "#080808", symbol: "X" },
  { id: "neon-blue", name: "Néon Bleu", desc: "Losange bleu électrique.", cost: 420, shape: "diamond", primary: "#0d67ff", stroke: "#f4f4f4", symbol: "◆" },
  { id: "blood-royal", name: "Sang Royal", desc: "Silhouette rouge à pointes.", cost: 760, shape: "crown", primary: "#e8526d", stroke: "#080808", symbol: "♥" },
  { id: "dirty-gold", name: "Or Sale", desc: "Hexagone or massif.", cost: 1200, shape: "hex", primary: "#ff8a1f", stroke: "#080808", symbol: "$" },
  { id: "spectre", name: "Spectre", desc: "Forme creuse et froide.", cost: 1800, shape: "ring", primary: "#9da3ad", stroke: "#f4f4f4", symbol: "○" },
  { id: "perfect-spades", name: "Pique Parfait", desc: "Secret: couleur complète pique.", secret: true, shape: "spade", primary: "#d7dbe4", stroke: "#080808", symbol: "♠" },
  { id: "perfect-hearts", name: "Coeur Parfait", desc: "Secret: couleur complète coeur.", secret: true, shape: "heart", primary: "#e8526d", stroke: "#f4f4f4", symbol: "♥" },
  { id: "perfect-clubs", name: "Trèfle Parfait", desc: "Secret: couleur complète trèfle.", secret: true, shape: "club", primary: "#0d67ff", stroke: "#f4f4f4", symbol: "♣" },
  { id: "perfect-diamonds", name: "Carreau Parfait", desc: "Secret: couleur complète carreau.", secret: true, shape: "diamond", primary: "#ff8a1f", stroke: "#080808", symbol: "♦" },
  { id: "double-complete", name: "Double Couleur", desc: "Secret: deux couleurs complètes.", secret: true, shape: "split", primary: "#f0d24b", stroke: "#080808", symbol: "2" },
  { id: "chromatic", name: "Chromatique", desc: "Secret: quatre couleurs complètes.", secret: true, shape: "star", primary: "#f4f4f4", stroke: "#080808", symbol: "4" },
  { id: "absolute", name: "Absolu", desc: "Secret: easter egg des 52 cartes.", secret: true, shape: "absolute", primary: "#f0d24b", stroke: "#f4f4f4", symbol: "∞" },
];

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
    unlockedSkins: ["classic"],
    unlockedCharacters: [...STARTER_CHARACTER_IDS],
    equippedSkin: "classic",
    bestWave: 0,
  };
}

function playerMeta(name = connectedPlayerName || "Joueur") {
  const playerName = cleanPlayerName(name) || "Joueur";
  metaProgression.players[playerName] ||= defaultPlayerMeta();
  metaProgression.players[playerName].unlockedSkins ||= ["classic"];
  metaProgression.players[playerName].unlockedCharacters ||= [...STARTER_CHARACTER_IDS];
  metaProgression.players[playerName].equippedSkin ||= "classic";
  if (playerName === "Dev") unlockDevMeta(metaProgression.players[playerName]);
  return metaProgression.players[playerName];
}

function unlockDevMeta(meta) {
  for (const key of metaDeckKeys()) {
    meta.cardUpgrades[key] = MAX_CARD_UPGRADE_LEVEL;
  }
  meta.fragments = Math.max(meta.fragments || 0, 999999);
  meta.packsBought = Math.max(meta.packsBought || 0, 0);
  meta.unlockedSkins = SKIN_DEFS.map((skin) => skin.id);
  meta.unlockedCharacters = CHARACTER_DEFS.map((character) => character.id);
  meta.equippedSkin ||= "classic";
}

function upgradedCardCount(meta = playerMeta()) {
  return Object.keys(meta.cardUpgrades || {}).length;
}

function upgradedCardLevels(meta = playerMeta()) {
  return Object.values(meta.cardUpgrades || {}).reduce((sum, level) => sum + level, 0);
}

function upgradedSuitCount(suit, meta = playerMeta()) {
  return Object.keys(meta.cardUpgrades || {}).filter((key) => key.endsWith(`-${suit}`)).length;
}

function characterUnlockInfo(character, meta = playerMeta()) {
  const unlockedSkins = meta.unlockedSkins || [];
  const rules = {
    shadow: { text: "Disponible au départ", done: true },
    vampire: { text: "Disponible au départ", done: true },
    "expert-comptable": { text: "Améliore 4 cartes Carreau", done: upgradedSuitCount("diamonds", meta) >= 4 },
    "ange-blanc": { text: "Améliore 4 cartes Coeur", done: upgradedSuitCount("hearts", meta) >= 4 },
    "gachette-folle": { text: "Améliore 4 cartes Trèfle", done: upgradedSuitCount("clubs", meta) >= 4 },
    bazooka: { text: "Améliore 4 cartes Pique", done: upgradedSuitCount("spades", meta) >= 4 },
    gigachad: { text: "Atteins la vague 20", done: (meta.bestWave || 0) >= 20 },
    "time-breaker": { text: "Atteins la vague 30", done: (meta.bestWave || 0) >= 30 },
    banquier: { text: "Achète 3 packs d'amélioration", done: (meta.packsBought || 0) >= 3 },
    moine: { text: "Atteins la vague 20 avec 1 seule arme", done: (meta.bestWaveOneWeapon || 0) >= 20 },
    tempete: { text: "Tue 400 ennemis par ricochet", done: (meta.bounceKills || 0) >= 400 },
    cartomancien: { text: "Améliore 12 cartes différentes", done: upgradedCardCount(meta) >= 12 },
    deserteur: { text: "Passe 3 min aux bords de la map", done: (meta.edgeTime || 0) >= 180 },
    berserker: { text: "Tue 150 ennemis sous 25% de PV", done: (meta.lowHpKills || 0) >= 150 },
    collectionneur: { text: "Améliore 26 cartes différentes", done: upgradedCardCount(meta) >= 26 },
    tricheur: { text: "Reroll 30 fois en une partie", done: (meta.bestRerollsInRun || 0) >= 30 },
    alchimiste: { text: "Applique 10 malédictions en une partie", done: (meta.bestCursesInRun || 0) >= 10 },
    stratege: { text: "Tue 10 boss", done: (meta.bossKills || 0) >= 10 },
    parieur: { text: "Débloque un skin secret", done: unlockedSkins.some((id) => id !== "classic" && skinDef(id).secret) },
  };
  return rules[character.id] || { text: "Challenge à définir", done: false };
}

function syncCharacterUnlocks(meta = playerMeta()) {
  meta.unlockedCharacters ||= [...STARTER_CHARACTER_IDS];
  let changed = false;
  for (const character of CHARACTER_DEFS) {
    if (meta.unlockedCharacters.includes(character.id)) continue;
    if (!characterUnlockInfo(character, meta).done) continue;
    meta.unlockedCharacters.push(character.id);
    changed = true;
  }
  if (changed) saveMetaProgression();
  return changed;
}

function isCharacterUnlocked(id, meta = playerMeta()) {
  syncCharacterUnlocks(meta);
  return (meta.unlockedCharacters || []).includes(id);
}

function skinDef(id = playerMeta().equippedSkin) {
  return SKIN_DEFS.find((skin) => skin.id === id) || SKIN_DEFS[0];
}

function unlockSkin(id) {
  const meta = playerMeta();
  meta.unlockedSkins ||= ["classic"];
  if (meta.unlockedSkins.includes(id)) return false;
  meta.unlockedSkins.push(id);
  syncCharacterUnlocks(meta);
  saveMetaProgression();
  renderMetaProgression();
  return true;
}

function buyOrEquipSkin(id) {
  const meta = playerMeta();
  const skin = skinDef(id);
  meta.unlockedSkins ||= ["classic"];
  if (meta.unlockedSkins.includes(id)) {
    meta.equippedSkin = id;
    saveMetaProgression();
    renderMetaProgression();
    return;
  }
  if (skin.secret || meta.fragments < skin.cost) return;
  meta.fragments -= skin.cost;
  meta.unlockedSkins.push(id);
  meta.equippedSkin = id;
  saveMetaProgression();
  renderMetaProgression();
}

function metaCardKey(suit, rank) {
  return `${rank.label}-${suit}`;
}

function metaDeckKeys() {
  return Object.keys(SUITS).flatMap((suit) => RANKS.map((rank) => metaCardKey(suit, rank)));
}

function metaPackCost(meta = playerMeta()) {
  return 35 + (meta.packsBought || 0) * 8;
}

function runFragmentReward(waveReached) {
  const wave = Math.max(1, waveReached || 1);
  return Math.round(8 + wave * 7 + Math.pow(wave, 1.35) * 2.2);
}

function grantRunFragments(waveReached, multiplier = 1) {
  const meta = playerMeta();
  const characterMultiplier = state?.character?.fragmentMultiplier || 1;
  const reward = Math.round(runFragmentReward(waveReached) * Math.max(1, multiplier * characterMultiplier));
  meta.fragments += reward;
  meta.bestWave = Math.max(meta.bestWave || 0, waveReached);
  meta.lowHpKills = (meta.lowHpKills || 0) + (state?.lowHpKills || 0);
  meta.bossKills = (meta.bossKills || 0) + (state?.bossKills || 0);
  meta.edgeTime = (meta.edgeTime || 0) + (state?.edgeTime || 0);
  meta.bounceKills = (meta.bounceKills || 0) + (state?.bounceKills || 0);
  meta.bestRerollsInRun = Math.max(meta.bestRerollsInRun || 0, state?.runRerolls || 0);
  meta.bestCursesInRun = Math.max(meta.bestCursesInRun || 0, state?.runCursesApplied || 0);
  if ((state?.runMaxWeapons || 1) <= 1) {
    meta.bestWaveOneWeapon = Math.max(meta.bestWaveOneWeapon || 0, waveReached);
  }
  syncCharacterUnlocks(meta);
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
  syncCharacterUnlocks(meta);
  const cost = metaPackCost(meta);
  const upgradedCount = Object.keys(meta.cardUpgrades).length;
  const totalLevels = Object.values(meta.cardUpgrades).reduce((sum, level) => sum + level, 0);
  const unlockedCharacters = (meta.unlockedCharacters || []).length;

  ui.metaFragments.textContent = meta.fragments;
  ui.metaPackCost.textContent = cost;
  ui.buyMetaPack.disabled = meta.fragments < cost || upgradeableMetaCards(meta).length === 0;
  ui.metaUpgradeSummary.textContent = `${upgradedCount}/52 cartes améliorées · ${totalLevels} niveaux · ${unlockedCharacters}/${CHARACTER_DEFS.length} persos · best vague ${meta.bestWave || 0}`;
  ui.metaPackResult.innerHTML = lastPack
    .map((item) => `<span>${describeMetaCard(item.key)} niv.${item.before} -> ${item.after}</span>`)
    .join("");
  renderSkinShop(meta);
  if (ui.metaCollection && !ui.metaCollection.classList.contains("is-hidden")) renderMetaCollection();
}

function renderSkinShop(meta = playerMeta()) {
  if (!ui.skinGrid) return;
  meta.unlockedSkins ||= ["classic"];
  ui.skinGrid.innerHTML = SKIN_DEFS.map((skin) => {
    const unlocked = meta.unlockedSkins.includes(skin.id);
    const equipped = meta.equippedSkin === skin.id;
    const disabled = skin.secret && !unlocked || (!unlocked && meta.fragments < skin.cost);
    const action = equipped ? "Équipé" : unlocked ? "Équiper" : skin.secret ? "Secret" : `$${skin.cost}`;
    return `
      <button class="skin-card ${equipped ? "is-equipped" : ""}" type="button" data-skin-id="${skin.id}" ${disabled ? "disabled" : ""} style="--skin:${skin.primary}; --skin-stroke:${skin.stroke}">
        <span class="skin-preview skin-${skin.shape}">${skin.symbol || ""}</span>
        <strong>${skin.name}</strong>
        <em>${skin.desc}</em>
        <span>${action}</span>
      </button>
    `;
  }).join("");
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

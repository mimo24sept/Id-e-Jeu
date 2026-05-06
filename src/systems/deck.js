function makeDeck() {
  return Object.keys(SUITS).flatMap((suit) =>
    RANKS.map((rank) => ({
      id: uniqueId(`${rank.label}-${suit}`),
      suit,
      rank: rank.label,
      value: rank.value,
    })),
  );
}

function drawCard(options = {}) {
  const suits = Object.keys(SUITS);
  const blocked = options.exclude || new Set();
  const candidates = [];
  for (const suit of options.suit ? [options.suit] : suits) {
    for (const rank of RANKS) {
      const key = `${rank.label}-${suit}`;
      if (!blocked.has(key)) candidates.push({ rank, suit });
    }
  }
  if (candidates.length === 0 && options.suit) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        const key = `${rank.label}-${suit}`;
        if (!blocked.has(key)) candidates.push({ rank, suit });
      }
    }
  }
  const fallbackSuit = options.suit || suits[Math.floor(Math.random() * suits.length)];
  const fallbackRank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const picked = candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : { rank: fallbackRank, suit: fallbackSuit };
  const rank = picked.rank;
  const suit = picked.suit;
  const card = {
    id: uniqueId(`${rank.label}-${suit}`),
    suit,
    rank: rank.label,
    value: rank.value,
  };

  if (options.cursed) {
    const curse = rollCurse();
    card.cursed = true;
    card.curse = curse;
  }

  return card;
}

function drawUniqueCards(count, options = {}) {
  const cards = [];
  const exclude = new Set(options.exclude || []);
  for (let i = 0; i < count; i += 1) {
    const card = drawCard({ ...options, exclude });
    cards.push(card);
    exclude.add(cardKey(card));
  }
  return cards;
}


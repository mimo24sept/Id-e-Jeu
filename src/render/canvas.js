function screenPoint(worldX, worldY) {
  return {
    x: worldX - state.player.x + window.innerWidth / 2,
    y: worldY - state.player.y + window.innerHeight / 2,
  };
}

function drawGrid() {
  const grid = 72;
  const bounds = worldBounds();
  const topLeft = screenPoint(bounds.left, bounds.top);
  const bottomRight = screenPoint(bounds.right, bounds.bottom);
  const startX = Math.max(0, topLeft.x);
  const endX = Math.min(window.innerWidth, bottomRight.x);
  const startY = Math.max(0, topLeft.y);
  const endY = Math.min(window.innerHeight, bottomRight.y);
  const firstWorldX = Math.ceil(bounds.left / grid) * grid;
  const firstWorldY = Math.ceil(bounds.top / grid) * grid;

  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let worldX = firstWorldX; worldX <= bounds.right; worldX += grid) {
    const x = screenPoint(worldX, 0).x;
    if (x < 0 || x > window.innerWidth) continue;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  for (let worldY = firstWorldY; worldY <= bounds.bottom; worldY += grid) {
    const y = screenPoint(0, worldY).y;
    if (y < 0 || y > window.innerHeight) continue;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  ctx.lineWidth = 4;
  ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);

  ctx.strokeStyle = "rgba(13,103,255,0.86)";
  ctx.lineWidth = 2;
  ctx.strokeRect(topLeft.x + 8, topLeft.y + 8, bottomRight.x - topLeft.x - 16, bottomRight.y - topLeft.y - 16);
}

function drawGridBackdrop() {
  const grid = 72;
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x < window.innerWidth; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, window.innerHeight);
    ctx.stroke();
  }
  for (let y = 0; y < window.innerHeight; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(window.innerWidth, y);
    ctx.stroke();
  }
}

function drawCircle(x, y, radius, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function strongestSuit() {
  return Object.keys(SUITS).reduce((best, suit) => {
    if (state.stats[suit] > state.stats[best]) return suit;
    return best;
  }, "spades");
}

function updateUIAccent() {
  const dominantSuit = strongestSuit();
  document.documentElement.style.setProperty("--accent", suitAccent(dominantSuit));
}

function drawPlayer() {
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;
  const suit = SUITS[strongestSuit()];
  const radius = state.player.radius;

  ctx.save();
  if (state.godMode) {
    const pulse = Math.sin(state.worldTime * 8) * 9;
    ctx.globalAlpha = 0.34;
    drawCircle(x, y, radius + 46 + pulse, "rgba(240, 210, 75, 0.18)", "rgba(240, 210, 75, 0.56)");
    ctx.globalAlpha = 1;
  }
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 7;
  drawCircle(x, y, radius + 3, "#f0b84b", "#151719");
  ctx.shadowColor = "transparent";

  ctx.beginPath();
  ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
  ctx.fillStyle = "#201a10";
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "#151719";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - radius + 6, y);
  ctx.lineTo(x + radius - 6, y);
  ctx.moveTo(x, y - radius + 6);
  ctx.lineTo(x, y + radius - 6);
  ctx.stroke();

  ctx.fillStyle = suit.color;
  ctx.font = "900 14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(suit.symbol, x, y + radius + 12);
  ctx.restore();
}

function drawCrate(crate) {
  const p = screenPoint(crate.x, crate.y);
  const size = crate.radius * 2;
  const x = p.x - crate.radius;
  const y = p.y - crate.radius;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = "#f0d24b";
  ctx.fillRect(x, y, size, size);
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#080808";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = "#101010";
  ctx.fillRect(x + 5, y + size * 0.44, size - 10, 5);
  ctx.fillRect(x + size * 0.44, y + 5, 5, size - 10);
  ctx.fillStyle = "#101010";
  ctx.font = "900 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("4", p.x, p.y);
  ctx.restore();
}

function renderGame() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.save();

  if (cameraShake > 0) {
    ctx.translate(random(-5, 5) * cameraShake * 6, random(-5, 5) * cameraShake * 6);
  }

  drawGrid();

  for (const pulse of state.pulses) {
    const p = screenPoint(pulse.x, pulse.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, pulse.radius, 0, Math.PI * 2);
    ctx.strokeStyle = pulse.color;
    ctx.globalAlpha = Math.max(0.1, pulse.life / 0.38);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const projectile of state.projectiles) {
    const p = screenPoint(projectile.x, projectile.y);
    drawCircle(p.x, p.y, projectile.radius, projectile.color, "rgba(255,255,255,0.42)");
  }

  for (const bullet of state.enemyBullets) {
    const p = screenPoint(bullet.x, bullet.y);
    drawCircle(p.x, p.y, bullet.radius, "#e46363", "rgba(255,255,255,0.25)");
  }

  for (const crate of state.crates) {
    drawCrate(crate);
  }

  for (const enemy of state.enemies) {
    const p = screenPoint(enemy.x, enemy.y);
    const fill = enemy.type === "boss" ? "#f0d24b" : enemy.type === "brute" ? "#9f5ec7" : enemy.type === "shooter" ? "#e08d4f" : "#e46363";
    drawCircle(p.x, p.y, enemy.radius, fill, "rgba(0,0,0,0.35)");

    if (enemy.type === "boss") {
      ctx.save();
      ctx.strokeStyle = "#090909";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x - enemy.radius * 0.58, p.y);
      ctx.lineTo(p.x + enemy.radius * 0.58, p.y);
      ctx.moveTo(p.x, p.y - enemy.radius * 0.58);
      ctx.lineTo(p.x, p.y + enemy.radius * 0.58);
      ctx.stroke();
      ctx.restore();
    }

    const hpWidth = enemy.type === "boss" ? enemy.radius * 3 : enemy.radius * 2;
    const hpHeight = enemy.type === "boss" ? 7 : 4;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(p.x - hpWidth / 2, p.y - enemy.radius - 14, hpWidth, hpHeight);
    ctx.fillStyle = enemy.type === "boss" ? "#f0d24b" : "#71d58a";
    ctx.fillRect(p.x - hpWidth / 2, p.y - enemy.radius - 14, hpWidth * (enemy.hp / enemy.maxHp), hpHeight);
  }

  const playerPulse = state.player.invuln > 0 ? 0.45 + Math.sin(state.worldTime * 30) * 0.22 : 1;
  ctx.globalAlpha = playerPulse;
  drawPlayer();
  ctx.globalAlpha = 1;

  for (const text of state.floatingText) {
    const p = screenPoint(text.x, text.y);
    ctx.globalAlpha = Math.min(1, text.life * 2);
    ctx.fillStyle = text.color;
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

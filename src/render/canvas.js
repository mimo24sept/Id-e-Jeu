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

function polygonPath(x, y, radius, sides, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (Math.PI * 2 * i) / sides;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawSkinShape(x, y, radius, skin) {
  ctx.lineWidth = 4;
  ctx.fillStyle = skin.primary;
  ctx.strokeStyle = skin.stroke;

  if (skin.shape === "square") {
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
  } else if (skin.shape === "diamond") {
    polygonPath(x, y, radius * 1.35, 4, 0);
    ctx.fill();
    ctx.stroke();
  } else if (skin.shape === "hex") {
    polygonPath(x, y, radius * 1.18, 6);
    ctx.fill();
    ctx.stroke();
  } else if (skin.shape === "crown") {
    polygonPath(x, y, radius * 1.22, 8, -Math.PI / 8);
    ctx.fill();
    ctx.stroke();
  } else if (skin.shape === "ring") {
    drawCircle(x, y, radius + 2, "rgba(0,0,0,0.15)", skin.stroke);
    drawCircle(x, y, radius - 6, "#090909", null);
  } else if (skin.shape === "spade" || skin.shape === "heart") {
    drawCircle(x - radius * 0.36, y - radius * 0.22, radius * 0.62, skin.primary, skin.stroke);
    drawCircle(x + radius * 0.36, y - radius * 0.22, radius * 0.62, skin.primary, skin.stroke);
    polygonPath(x, y + radius * 0.18, radius * 0.95, 3, Math.PI / 2);
    ctx.fill();
    ctx.stroke();
  } else if (skin.shape === "club") {
    drawCircle(x, y - radius * 0.45, radius * 0.62, skin.primary, skin.stroke);
    drawCircle(x - radius * 0.52, y + radius * 0.14, radius * 0.62, skin.primary, skin.stroke);
    drawCircle(x + radius * 0.52, y + radius * 0.14, radius * 0.62, skin.primary, skin.stroke);
  } else if (skin.shape === "split") {
    drawCircle(x, y, radius + 3, "#f0d24b", skin.stroke);
    ctx.fillStyle = "#0d67ff";
    ctx.fillRect(x, y - radius, radius, radius * 2);
  } else if (skin.shape === "star" || skin.shape === "absolute") {
    const points = skin.shape === "absolute" ? 12 : 8;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const angle = -Math.PI / 2 + (Math.PI * i) / points + state.worldTime * 0.8;
      const r = i % 2 === 0 ? radius * 1.35 : radius * 0.62;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    drawCircle(x, y, radius + 3, skin.primary, skin.stroke);
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
  const skin = skinDef();
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
  drawSkinShape(x, y, radius, skin);
  ctx.shadowColor = "transparent";

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
  ctx.fillText(skin.symbol || suit.symbol, x, y);
  ctx.fillText(suit.symbol, x, y + radius + 14);
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

function drawAura(radius, color, label) {
  if (radius <= 0) return;
  const p = screenPoint(state.player.x, state.player.y);
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.08;
  ctx.fill();
  ctx.globalAlpha = 0.48;
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color;
  ctx.font = "900 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, p.x, p.y - radius - 8);
  ctx.restore();
}

function renderGame() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.save();

  if (cameraShake > 0) {
    ctx.translate(random(-5, 5) * cameraShake * 6, random(-5, 5) * cameraShake * 6);
  }

  drawGrid();

  const runBonuses = metaRunBonuses();
  drawAura(runBonuses.heartSlowRadius, "rgba(232,82,109,1)", "LENTEUR");
  drawAura(runBonuses.heartDamageRadius, "rgba(240,210,75,1)", "BRULURE");
  drawAura(runBonuses.heartDrainRadius, "rgba(255,255,255,1)", "CHAINES");

  for (const pulse of state.pulses) {
    const p = screenPoint(pulse.x, pulse.y);
    const alpha = Math.max(0.1, pulse.life / 0.38);
    ctx.lineWidth = 4;
    ctx.strokeStyle = pulse.color;
    if (pulse.arcAngle !== undefined) {
      const startAngle = pulse.angle - pulse.arcAngle;
      const endAngle = pulse.angle + pulse.arcAngle;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, pulse.radius, startAngle, endAngle);
      ctx.closePath();
      ctx.globalAlpha = alpha * 0.22;
      ctx.fillStyle = pulse.color;
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulse.radius, 0, Math.PI * 2);
      ctx.globalAlpha = alpha;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  for (const projectile of state.projectiles) {
    const p = screenPoint(projectile.x, projectile.y);
    drawCircle(p.x, p.y, projectile.radius, projectile.color, "rgba(255,255,255,0.42)");
  }

  for (const bullet of state.enemyBullets) {
    const p = screenPoint(bullet.x, bullet.y);
    drawCircle(p.x, p.y, bullet.radius, bullet.color || "#e46363", "rgba(255,255,255,0.25)");
  }

  if (!state.betweenWaves && state.objective?.type === "capture") {
    const objective = state.objective;
    const p = screenPoint(objective.x, objective.y);
    const ratio = clamp(objective.progress / objective.target, 0, 1);
    ctx.save();
    ctx.fillStyle = "rgba(240,210,75,0.08)";
    ctx.strokeStyle = "rgba(240,210,75,0.72)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, objective.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#f0d24b";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, objective.radius + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
    ctx.restore();
  }

  for (const crate of state.crates) {
    drawCrate(crate);
  }

  for (const item of state.objectiveItems || []) {
    const p = screenPoint(item.x, item.y);
    drawCircle(p.x, p.y, item.radius, "#f0d24b", "rgba(255,255,255,0.85)");
    ctx.save();
    ctx.strokeStyle = "#080808";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x - 7, p.y);
    ctx.lineTo(p.x + 7, p.y);
    ctx.moveTo(p.x, p.y - 7);
    ctx.lineTo(p.x, p.y + 7);
    ctx.stroke();
    ctx.restore();
  }

  for (const guard of state.bodyguards || []) {
    const p = screenPoint(guard.x || state.player.x, guard.y || state.player.y);
    drawCircle(p.x, p.y, guard.radius, SUITS.diamonds.color, "rgba(255,255,255,0.5)");
    ctx.save();
    ctx.fillStyle = "#080808";
    ctx.font = "900 10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", p.x, p.y + 1);
    ctx.restore();
    const hpWidth = guard.radius * 2.2;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(p.x - hpWidth / 2, p.y - guard.radius - 10, hpWidth, 3);
    ctx.fillStyle = "#f0d24b";
    ctx.fillRect(p.x - hpWidth / 2, p.y - guard.radius - 10, hpWidth * Math.max(0, guard.hp / guard.maxHp), 3);
  }

  for (const enemy of state.enemies) {
    const p = screenPoint(enemy.x, enemy.y);
    const fill = enemy.type === "boss"
      ? enemy.bossKind === "hearts"
        ? "#e8526d"
        : enemy.bossKind === "spades"
          ? "#c5cbd6"
          : enemy.bossKind === "clubs"
            ? "#2e8cff"
            : enemy.bossKind === "diamonds"
              ? "#ff9a2e"
              : "#f0d24b"
      : enemy.type === "brute"
        ? "#9f5ec7"
        : enemy.type === "shooter"
          ? "#e08d4f"
          : enemy.type === "dasher"
            ? "#55b8ff"
            : enemy.type === "sprayer"
              ? "#66e08f"
              : enemy.type === "objective-turret"
                ? "#f0d24b"
                : enemy.type === "objective-runner"
                  ? "#ffffff"
                  : "#e46363";
    drawCircle(p.x, p.y, enemy.radius, fill, "rgba(0,0,0,0.35)");

    if (enemy.type === "boss" && enemy.bossKind === "hearts") {
      ctx.save();
      ctx.strokeStyle = "rgba(232,82,109,0.5)";
      ctx.fillStyle = "rgba(232,82,109,0.08)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, enemy.radius + 190, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(232,82,109,0.85)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, enemy.radius + 95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (enemy.type === "boss" && enemy.bossKind === "diamonds") {
      const rage = 1 + Math.min(2.2, (enemy.bossAge || 0) * 0.035);
      ctx.save();
      ctx.strokeStyle = "rgba(255,154,46,0.62)";
      ctx.lineWidth = 2 + rage;
      ctx.beginPath();
      ctx.arc(p.x, p.y, enemy.radius + 10 + Math.sin(state.worldTime * 8) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (enemy.type === "boss" || enemy.type === "dasher") {
      ctx.save();
      ctx.strokeStyle = enemy.type === "boss" ? "#090909" : "#f5f5f5";
      ctx.lineWidth = enemy.type === "boss" ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(p.x - enemy.radius * 0.58, p.y);
      ctx.lineTo(p.x + enemy.radius * 0.58, p.y);
      if (enemy.type === "boss") {
        ctx.moveTo(p.x, p.y - enemy.radius * 0.58);
        ctx.lineTo(p.x, p.y + enemy.radius * 0.58);
      }
      ctx.stroke();
      if (enemy.type === "dasher" && enemy.dashWindup > 0) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, enemy.radius + 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (enemy.heartChained) {
      const player = screenPoint(state.player.x, state.player.y);
      ctx.save();
      ctx.strokeStyle = "rgba(232,82,109,0.72)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
    }

    const hpWidth = enemy.type === "boss" ? enemy.radius * 3 : enemy.radius * 2;
    const hpHeight = enemy.type === "boss" ? 7 : 4;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(p.x - hpWidth / 2, p.y - enemy.radius - 14, hpWidth, hpHeight);
    ctx.fillStyle = enemy.type === "boss" ? fill : "#71d58a";
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



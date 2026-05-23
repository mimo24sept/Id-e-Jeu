const talentTreeUI = (() => {
  let cvs, ctx2d;
  let camX = 0, camY = 0, camZoom = 0.45;
  let isPanning = false, panStartX = 0, panStartY = 0, panCamX = 0, panCamY = 0;
  let hoveredId = null;
  let raf = null;

  const TIER_RADIUS = [10, 10, 16, 24];
  const MIN_ZOOM = 0.16;
  const MAX_ZOOM = 2.4;

  const EFFECT_META = {
    damage:          { label: "Dégâts",              pct: true,  negGood: false },
    flatDamage:      { label: "Dégâts plats",         pct: false, negGood: false },
    attackSpeed:     { label: "Vitesse d'attaque",    pct: true,  negGood: false },
    moveSpeed:       { label: "Vitesse dépl.",         pct: false, negGood: false },
    maxHp:           { label: "PV max",               pct: false, negGood: false },
    maxHpMultiplier: { label: "PV max",               pct: true,  negGood: false },
    regen:           { label: "Régénération/s",       pct: false, negGood: false },
    critChance:      { label: "Chance crit.",          pct: true,  negGood: false },
    money:           { label: "Or",                   pct: true,  negGood: false },
    packDiscount:    { label: "Prix packs",            pct: true,  negGood: true  },
    rerollDiscount:  { label: "Coût reroll",           pct: true,  negGood: true  },
    fragmentGain:    { label: "Gain fragments",        pct: true,  negGood: false },
    bounceCount:     { label: "Rebonds projectiles",   pct: false, negGood: false },
    healingBonus:    { label: "Soins reçus",           pct: true,  negGood: false },
    interestBonus:   { label: "Intérêts fin de vague", pct: true,  negGood: false },
    waveScaling:     { label: "Dégâts par vague",      pct: true,  negGood: false },
    curseBonus:      { label: "Effets malédictions",   pct: true,  negGood: false },
    sellBonus:       { label: "Revente cartes",         pct: true,  negGood: false },
  };

  function w2s(wx, wy) {
    return { x: (wx - camX) * camZoom + cvs.width / 2, y: (wy - camY) * camZoom + cvs.height / 2 };
  }
  function s2w(sx, sy) {
    return { x: (sx - cvs.width / 2) / camZoom + camX, y: (sy - cvs.height / 2) / camZoom + camY };
  }

  function getMeta() { return typeof playerMeta === "function" ? playerMeta() : null; }

  function isUnlocked(id) {
    if (id === "origin") return true;
    const m = getMeta();
    return m ? (m.unlockedTalents || []).includes(id) : false;
  }
  function isAvailable(node) {
    if (isUnlocked(node.id)) return false;
    return node.connections.some(cid => isUnlocked(cid));
  }
  function nodeStatus(node) {
    if (isUnlocked(node.id)) return "unlocked";
    if (isAvailable(node)) return "available";
    return "locked";
  }
  function rColor(regionId) { return (TALENT_REGIONS[regionId] || {}).color || "#aaaaaa"; }
  function nr(tier) { return TIER_RADIUS[Math.min(tier, 3)] || 10; }

  function drawBackground() {
    ctx2d.fillStyle = "#09090f";
    ctx2d.fillRect(0, 0, cvs.width, cvs.height);

    // Subtle dot grid
    const step = 80 * camZoom;
    const ox = ((-camX * camZoom + cvs.width / 2) % step + step) % step;
    const oy = ((-camY * camZoom + cvs.height / 2) % step + step) % step;
    ctx2d.fillStyle = "rgba(255,255,255,0.04)";
    for (let x = ox; x < cvs.width; x += step) {
      for (let y = oy; y < cvs.height; y += step) {
        ctx2d.beginPath();
        ctx2d.arc(x, y, 1, 0, Math.PI * 2);
        ctx2d.fill();
      }
    }
  }

  function drawConnections() {
    const seen = new Set();
    for (const node of TALENT_NODES) {
      for (const cid of node.connections) {
        const key = node.id < cid ? `${node.id}|${cid}` : `${cid}|${node.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const other = talentNode(cid);
        if (!other) continue;

        const p1 = w2s(node.x, node.y);
        const p2 = w2s(other.x, other.y);
        const mx = Math.max(p1.x, p2.x), mnx = Math.min(p1.x, p2.x);
        const my = Math.max(p1.y, p2.y), mny = Math.min(p1.y, p2.y);
        if (mx < 0 || mnx > cvs.width || my < 0 || mny > cvs.height) continue;

        const aU = isUnlocked(node.id), bU = isUnlocked(other.id);
        let color, lw;
        if (aU && bU) {
          color = rColor(node.region);
          lw = 2.5;
        } else if (aU || bU || isAvailable(node) || isAvailable(other)) {
          color = "rgba(100,100,170,0.4)";
          lw = 1.5;
        } else {
          color = "rgba(40,40,65,0.35)";
          lw = 1;
        }

        ctx2d.beginPath();
        ctx2d.moveTo(p1.x, p1.y);
        ctx2d.lineTo(p2.x, p2.y);
        ctx2d.strokeStyle = color;
        ctx2d.lineWidth = lw;
        ctx2d.stroke();
      }
    }
  }

  function drawNodes() {
    for (const node of TALENT_NODES) {
      const { x: sx, y: sy } = w2s(node.x, node.y);
      const margin = 80;
      if (sx < -margin || sx > cvs.width + margin || sy < -margin || sy > cvs.height + margin) continue;

      const r = nr(node.tier) * camZoom;
      const ns = nodeStatus(node);
      const col = rColor(node.region);
      const hov = node.id === hoveredId;

      ctx2d.save();

      if (ns === "unlocked") {
        if (r > 2) {
          const grd = ctx2d.createRadialGradient(sx, sy, 0, sx, sy, r * 3.2);
          grd.addColorStop(0, col + "44");
          grd.addColorStop(1, "transparent");
          ctx2d.fillStyle = grd;
          ctx2d.beginPath();
          ctx2d.arc(sx, sy, r * 3.2, 0, Math.PI * 2);
          ctx2d.fill();
        }
        ctx2d.beginPath();
        ctx2d.arc(sx, sy, r, 0, Math.PI * 2);
        ctx2d.fillStyle = col;
        ctx2d.fill();
        ctx2d.strokeStyle = "rgba(255,255,255,0.28)";
        ctx2d.lineWidth = 1.5;
        ctx2d.stroke();
      } else if (ns === "available") {
        if (hov) {
          const grd = ctx2d.createRadialGradient(sx, sy, 0, sx, sy, r * 3.8);
          grd.addColorStop(0, col + "2e");
          grd.addColorStop(1, "transparent");
          ctx2d.fillStyle = grd;
          ctx2d.beginPath();
          ctx2d.arc(sx, sy, r * 3.8, 0, Math.PI * 2);
          ctx2d.fill();
        }
        ctx2d.beginPath();
        ctx2d.arc(sx, sy, r, 0, Math.PI * 2);
        ctx2d.fillStyle = col + "22";
        ctx2d.fill();
        ctx2d.strokeStyle = col;
        ctx2d.lineWidth = hov ? 2.5 : 1.5;
        ctx2d.stroke();
      } else {
        ctx2d.beginPath();
        ctx2d.arc(sx, sy, r, 0, Math.PI * 2);
        ctx2d.fillStyle = "#181824";
        ctx2d.fill();
        ctx2d.strokeStyle = hov ? "#555577" : "#252538";
        ctx2d.lineWidth = 1;
        ctx2d.stroke();
      }

      // Inner tier symbol for notables / keystones
      if (r >= 9 && node.tier >= 2) {
        const sym = node.tier === 3 ? "✦" : "◆";
        ctx2d.font = `bold ${Math.max(7, Math.round(r * 0.72))}px sans-serif`;
        ctx2d.textAlign = "center";
        ctx2d.textBaseline = "middle";
        ctx2d.fillStyle = ns === "unlocked" ? "#00000066" : ns === "available" ? col + "cc" : "#33334e";
        ctx2d.fillText(sym, sx, sy);
      }

      // Name label (shown when zoomed in or hovered)
      if (camZoom >= 0.6 || hov) {
        const fSize = Math.max(8, Math.round(9.5 * Math.min(camZoom, 1.15)));
        ctx2d.font = `${fSize}px "Space Mono", monospace`;
        ctx2d.textAlign = "center";
        ctx2d.textBaseline = "top";
        ctx2d.fillStyle = ns === "unlocked"
          ? "rgba(255,240,160,0.82)"
          : ns === "available"
          ? "rgba(190,190,255,0.82)"
          : "rgba(90,90,130,0.65)";
        const labelY = sy + r + Math.max(2, 3 * camZoom);
        ctx2d.fillText(node.name, sx, labelY);
      }

      ctx2d.restore();
    }

    // Hover ring drawn on top
    if (hoveredId) {
      const node = talentNode(hoveredId);
      if (node) {
        const { x: sx, y: sy } = w2s(node.x, node.y);
        const r = nr(node.tier) * camZoom;
        ctx2d.save();
        ctx2d.beginPath();
        ctx2d.arc(sx, sy, r + Math.max(3, 5 * camZoom), 0, Math.PI * 2);
        ctx2d.strokeStyle = "rgba(255,255,255,0.45)";
        ctx2d.lineWidth = 1.5;
        ctx2d.stroke();
        ctx2d.restore();
      }
    }
  }

  function drawRegionLabels() {
    if (camZoom > 1.0) return;
    const fade = Math.max(0, 0.38 * (1 - camZoom));
    if (fade < 0.01) return;

    const centers = {
      spades:     [-850,    0],
      hearts:     [-430,  760],
      diamonds:   [ 430,  760],
      clubs:      [ 850,    0],
      poker:      [   0, -850],
      combat:     [ 710, -710],
      shop:       [-710, -710],
      bridge:     [   0,    0],
      guerriers:  [ 950,  550],
      vitaux:     [   0, 1050],
      cameleons:  [-950,  550],
      negociants: [-980, -405],
      strateges:  [-405, -980],
      rapides:    [ 980, -405],
    };

    for (const [rid, reg] of Object.entries(TALENT_REGIONS)) {
      if (rid === "center" || rid === "bridge") continue;
      const pos = centers[rid];
      if (!pos) continue;
      const { x: sx, y: sy } = w2s(pos[0], pos[1]);
      if (sx < -200 || sx > cvs.width + 200 || sy < -100 || sy > cvs.height + 100) continue;

      const fSize = Math.max(16, Math.round(44 * camZoom));
      ctx2d.save();
      ctx2d.font = `bold ${fSize}px "Bebas Neue", sans-serif`;
      ctx2d.textAlign = "center";
      ctx2d.textBaseline = "middle";
      const alpha = Math.round(fade * 255).toString(16).padStart(2, "0");
      ctx2d.fillStyle = reg.color + alpha;
      ctx2d.fillText(reg.label, sx, sy);
      ctx2d.restore();
    }
  }

  function frame() {
    if (!cvs) return;
    if (cvs.width !== cvs.offsetWidth || cvs.height !== cvs.offsetHeight) {
      cvs.width = cvs.offsetWidth || 1280;
      cvs.height = cvs.offsetHeight || 720;
    }
    drawBackground();
    drawConnections();
    drawRegionLabels();
    drawNodes();
    raf = requestAnimationFrame(frame);
  }

  function nodeAt(sx, sy) {
    const { x: wx, y: wy } = s2w(sx, sy);
    let best = null, bestD = Infinity;
    for (const n of TALENT_NODES) {
      const hitR = (nr(n.tier) + 10) / camZoom;
      const d = Math.hypot(n.x - wx, n.y - wy);
      if (d < hitR && d < bestD) { best = n; bestD = d; }
    }
    return best;
  }

  function fmtEffect(key, val) {
    const m = EFFECT_META[key];
    if (!m) return null;
    const good = m.negGood ? val < 0 : val > 0;
    let display;
    if (m.pct) {
      const pct = (Math.round(Math.abs(val) * 1000) / 10).toFixed(1).replace(".0", "");
      const sign = m.negGood ? (val < 0 ? "-" : "+") : (val >= 0 ? "+" : "-");
      display = `${sign}${pct}%`;
    } else {
      display = (val >= 0 ? "+" : "") + val;
    }
    return { display, label: m.label, good };
  }

  function showTooltip(node, cx, cy) {
    const el = document.getElementById("talentTreeTooltip");
    if (!el) return;
    const meta = getMeta();
    const ns = nodeStatus(node);
    const col = rColor(node.region);
    const reg = TALENT_REGIONS[node.region];
    const tierNames = ["Origine", "Mineur", "Notable", "Pierre angulaire"];

    const effectLines = Object.entries(node.effect)
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => {
        const info = fmtEffect(k, v);
        if (!info) return "";
        return `<span style="color:${info.good ? "#7de09a" : "#e46363"}">${info.display} ${info.label}</span>`;
      }).filter(Boolean).join("<br>");

    let statusHtml = "";
    if (ns === "unlocked") {
      statusHtml = `<div style="color:var(--gold);margin-top:8px">✓ Débloqué</div>`;
    } else if (ns === "locked") {
      statusHtml = `<div style="color:#55557a;margin-top:8px">🔒 Connecte un nœud adjacent d'abord</div>`;
    } else {
      const frags = meta?.fragments || 0;
      statusHtml = frags >= node.cost
        ? `<div style="color:#88aaff;margin-top:8px">Clic pour débloquer · ${node.cost} fragments</div>`
        : `<div style="color:var(--danger);margin-top:8px">Insuffisant — ${frags} / ${node.cost} frags</div>`;
    }

    el.innerHTML = `
      <div style="font-size:10px;color:${col};margin-bottom:4px;letter-spacing:.06em">${reg?.label || ""} · ${tierNames[node.tier] || ""}${node.cost > 0 ? ` · ${node.cost} frags` : ""}</div>
      <div style="font-size:14px;font-weight:700;color:#e8e8f4;margin-bottom:4px">${node.name}</div>
      <div style="font-size:11px;color:#8888aa;margin-bottom:8px">${node.desc}</div>
      ${effectLines ? `<div style="font-size:12px;line-height:1.7">${effectLines}</div>` : ""}
      ${statusHtml}
    `;

    const tw = 240;
    let tx = cx + 18;
    let ty = cy - el.offsetHeight / 2;
    if (tx + tw > window.innerWidth - 8) tx = cx - tw - 18;
    if (ty < 8) ty = 8;
    if (ty + el.offsetHeight > window.innerHeight - 8) ty = window.innerHeight - el.offsetHeight - 8;
    el.style.left = tx + "px";
    el.style.top = ty + "px";
    el.classList.remove("is-hidden");
  }

  function hideTooltip() {
    const el = document.getElementById("talentTreeTooltip");
    if (el) el.classList.add("is-hidden");
  }

  function updateHUD() {
    const el = document.getElementById("talentFragCount");
    if (!el) return;
    const meta = getMeta();
    const count = (meta?.unlockedTalents || []).length;
    el.textContent = `${meta?.fragments || 0} fragments · ${count} talents débloqués`;

    const autoBtn = document.getElementById("autoUnlockTalents");
    if (autoBtn) {
      const unlockedSet = new Set([...(meta?.unlockedTalents || []), "origin"]);
      const canAfford = typeof TALENT_NODES !== "undefined" &&
        TALENT_NODES.some(n =>
          !unlockedSet.has(n.id) &&
          n.connections.some(cid => unlockedSet.has(cid)) &&
          n.cost <= (meta?.fragments || 0)
        );
      autoBtn.disabled = !canAfford;
    }
  }

  function onAutoUnlock() {
    if (typeof autoUnlockTalents === "function") autoUnlockTalents();
    updateHUD();
  }

  function onMouseMove(e) {
    const rect = cvs.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    if (isPanning) {
      camX = panCamX - (sx - panStartX) / camZoom;
      camY = panCamY - (sy - panStartY) / camZoom;
      return;
    }
    const node = nodeAt(sx, sy);
    hoveredId = node?.id || null;
    cvs.style.cursor = node ? "pointer" : "grab";
    if (node) showTooltip(node, e.clientX, e.clientY);
    else hideTooltip();
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    const rect = cvs.getBoundingClientRect();
    panStartX = e.clientX - rect.left;
    panStartY = e.clientY - rect.top;
    panCamX = camX;
    panCamY = camY;
    isPanning = true;
    cvs.style.cursor = "grabbing";
  }

  function onMouseUp(e) {
    if (!isPanning) return;
    isPanning = false;
    cvs.style.cursor = "grab";
    const rect = cvs.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    if (Math.hypot(sx - panStartX, sy - panStartY) < 6) {
      const node = nodeAt(sx, sy);
      if (node) tryUnlock(node);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = cvs.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wBefore = s2w(sx, sy);
    const factor = e.deltaY > 0 ? 0.87 : 1.15;
    camZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camZoom * factor));
    const wAfter = s2w(sx, sy);
    camX += wBefore.x - wAfter.x;
    camY += wBefore.y - wAfter.y;
    hideTooltip();
  }

  function onKeyDown(e) {
    if (e.key === "Escape") close();
  }

  function tryUnlock(node) {
    if (isUnlocked(node.id) || !isAvailable(node)) return;
    const meta = getMeta();
    if (!meta || (meta.fragments || 0) < node.cost) return;
    meta.fragments -= node.cost;
    meta.unlockedTalents = meta.unlockedTalents || [];
    meta.unlockedTalents.push(node.id);
    if (typeof saveMetaProgression === "function") saveMetaProgression();
    if (typeof renderMetaProgression === "function") renderMetaProgression();
    updateHUD();
  }

  function open() {
    const section = document.getElementById("talentTree");
    if (!section) return;
    section.classList.remove("is-hidden");
    cvs = document.getElementById("talentTreeCanvas");
    ctx2d = cvs.getContext("2d");
    cvs.width = cvs.offsetWidth || 1280;
    cvs.height = cvs.offsetHeight || 720;

    cvs.addEventListener("mousemove", onMouseMove);
    cvs.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    cvs.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    document.getElementById("autoUnlockTalents")?.addEventListener("click", onAutoUnlock);

    updateHUD();
    raf = requestAnimationFrame(frame);
  }

  function close() {
    const section = document.getElementById("talentTree");
    if (section) section.classList.add("is-hidden");
    hideTooltip();
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (cvs) {
      cvs.removeEventListener("mousemove", onMouseMove);
      cvs.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      cvs.removeEventListener("wheel", onWheel);
    }
    window.removeEventListener("keydown", onKeyDown);
    document.getElementById("autoUnlockTalents")?.removeEventListener("click", onAutoUnlock);
  }

  return { open, close };
})();

// ============================================================
//  POKER SURVIVOR — Comparaison Before/After rééquilibrage
//  node simulate_balance.js
// ============================================================

// ── Helpers ────────────────────────────────────────────────
function enemyTier(wave) { return Math.floor(Math.max(1, wave) / 10); }
function enemyTierMult(wave) { return Math.pow(1.75, enemyTier(wave)); }
function earlyPressure(wave) { return 1 + Math.min(wave, 10) * 0.035; }

// AVANT
const OLD = {
  waveExpHp:  w => Math.pow(1.040, w),
  waveExpDmg: w => Math.pow(1.035, w),
  eliteRate:  w => w >= 10 ? 0.20 : 0,
  shopMult:   w => { const i = Math.max(0, w-1); return 1 + i*0.045 + Math.floor(i/10)*0.1; },
};

// APRÈS (proposition)
const NEW = {
  waveExpHp:  w => Math.pow(1.050, w),
  waveExpDmg: w => Math.pow(1.048, w),
  eliteRate:  w => w >= 10 ? Math.min(0.40, 0.20 + (w-10)*0.012) : 0,
  shopMult:   w => { const i = Math.max(0, w-1); return 1 + i*0.065 + Math.floor(i/8)*0.16; },
};

function enemyHp(type, wave, v) {
  const presets = {
    chaser:  w => (w === 1 ? 11 : 16 + w*4.5),
    brute:   w => 42 + w*10,
    blocker: w => 62 + w*14,
    sniper:  w => 18 + w*4,
  };
  const base = (presets[type] || presets.chaser)(wave);
  return base * enemyTierMult(wave) * earlyPressure(wave) * v.waveExpHp(wave);
}

function enemyDmg(type, wave, v) {
  const dmgBase = { chaser:13, brute:19, sniper:18, bomber:32, shooter:11 };
  return (dmgBase[type]||13) * Math.pow(1.35, enemyTier(wave)) * v.waveExpDmg(wave);
}

function bossHp(wave, bsm, v) {
  const tier = Math.floor(Math.max(1,wave)/10);
  return (1400 + wave*180) * Math.pow(1.75,tier) * (1 + Math.max(1,tier)*0.35) * v.waveExpHp(wave) * bsm;
}

function col(s, w) { return String(s).padEnd(w).slice(0,w); }
function pct(a, b) { const p = Math.round((b/a-1)*100); return (p >= 0 ? "+" : "") + p + "%"; }

const WAVES = [5, 10, 15, 20, 25, 30, 40];

console.log("\n╔═══════════════════════════════════════════════════════════════╗");
console.log("║       COMPARAISON AVANT / APRÈS RÉÉQUILIBRAGE                ║");
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

// ── 1. HP ennemis ─────────────────────────────────────────
console.log("━━━ HP CHASER (avant → après → delta) ━━━");
console.log(col("Vague",7) + col("Avant",10) + col("Après",10) + col("Delta",8));
console.log("─".repeat(36));
for (const w of WAVES) {
  const a = enemyHp("chaser", w, OLD);
  const b = enemyHp("chaser", w, NEW);
  console.log(col(`V${w}`,7) + col(Math.round(a),10) + col(Math.round(b),10) + col(pct(a,b),8));
}

// ── 2. Dégâts ennemis ─────────────────────────────────────
console.log("\n━━━ DÉGÂTS CHASER PAR HIT (avant → après → delta) ━━━");
console.log(col("Vague",7) + col("Avant",10) + col("Après",10) + col("Delta",8));
console.log("─".repeat(36));
for (const w of WAVES) {
  const a = enemyDmg("chaser", w, OLD);
  const b = enemyDmg("chaser", w, NEW);
  console.log(col(`V${w}`,7) + col(a.toFixed(1),10) + col(b.toFixed(1),10) + col(pct(a,b),8));
}

console.log("\n━━━ DÉGÂTS SNIPER PAR TIR (avant → après → delta) ━━━");
console.log(col("Vague",7) + col("Avant",10) + col("Après",10) + col("Delta",8));
console.log("─".repeat(36));
for (const w of WAVES) {
  const a = enemyDmg("sniper", w, OLD);
  const b = enemyDmg("sniper", w, NEW);
  console.log(col(`V${w}`,7) + col(a.toFixed(1),10) + col(b.toFixed(1),10) + col(pct(a,b),8));
}

// ── 3. Taux d'élites ──────────────────────────────────────
console.log("\n━━━ TAUX D'ÉLITES ━━━");
console.log(col("Vague",7) + col("Avant",10) + col("Après",10));
console.log("─".repeat(27));
for (const w of WAVES) {
  const a = OLD.eliteRate(w);
  const b = NEW.eliteRate(w);
  console.log(col(`V${w}`,7) + col((a*100).toFixed(0)+"%",10) + col((b*100).toFixed(0)+"%",10));
}

// ── 4. Prix shop ──────────────────────────────────────────
console.log("\n━━━ MULTIPLICATEUR PRIX SHOP ━━━");
console.log(col("Vague",7) + col("Avant",10) + col("Après",10) + col("Delta",8));
console.log("─".repeat(36));
for (const w of WAVES) {
  const a = OLD.shopMult(w);
  const b = NEW.shopMult(w);
  console.log(col(`V${w}`,7) + col("×"+a.toFixed(2),10) + col("×"+b.toFixed(2),10) + col(pct(a,b),8));
}

// ── 5. Boss HP à bsm=1.0 (référence) ─────────────────────
console.log("\n━━━ BOSS HP (bsm=1.0 référence neutre) ━━━");
console.log(col("Vague",7) + col("Avant",12) + col("Après",12) + col("Delta",8));
console.log("─".repeat(40));
for (const w of [10,20,30,40]) {
  const a = bossHp(w, 1.0, OLD);
  const b = bossHp(w, 1.0, NEW);
  console.log(col(`V${w}`,7) + col(Math.round(a/1000)+"k",12) + col(Math.round(b/1000)+"k",12) + col(pct(a,b),8));
}

// ── 6. Résumé gameplay ────────────────────────────────────
console.log("\n━━━ RÉSUMÉ — IMPACT PAR MILESTONE ━━━\n");

function summarize(wave) {
  const chHpA = enemyHp("chaser",wave,OLD), chHpB = enemyHp("chaser",wave,NEW);
  const chDmgA = enemyDmg("chaser",wave,OLD), chDmgB = enemyDmg("chaser",wave,NEW);
  const snDmgA = enemyDmg("sniper",wave,OLD), snDmgB = enemyDmg("sniper",wave,NEW);
  const shopA = OLD.shopMult(wave), shopB = NEW.shopMult(wave);
  const elA = OLD.eliteRate(wave)*100, elB = NEW.eliteRate(wave)*100;
  console.log(`  ── VAGUE ${wave} ──`);
  console.log(`  Chaser HP     : ${Math.round(chHpA)} → ${Math.round(chHpB)}  (${pct(chHpA,chHpB)})`);
  console.log(`  Chaser dégâts : ${chDmgA.toFixed(1)} → ${chDmgB.toFixed(1)} par hit  (${pct(chDmgA,chDmgB)})`);
  console.log(`  Sniper dégâts : ${snDmgA.toFixed(1)} → ${snDmgB.toFixed(1)} par tir   (${pct(snDmgA,snDmgB)})`);
  console.log(`  Shop mult     : ×${shopA.toFixed(2)} → ×${shopB.toFixed(2)}  (${pct(shopA,shopB)} plus cher)`);
  console.log(`  Taux élite    : ${elA.toFixed(0)}% → ${elB.toFixed(0)}%`);
  console.log();
}

summarize(10);
summarize(20);
summarize(30);

console.log("  ── NOTE HEAL PENALTY ──");
console.log("  Actuellement: 9 secondes pour revenir à 100% soin");
console.log("  Si un sniper tape 2× plus fort à V20, la fenêtre de vulnérabilité");
console.log("  après une touche est beaucoup plus dangereuse.");

console.log("\n═══════════════════════════════════════════════════════════════\n");

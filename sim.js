const os = require('os'), path = require('path'), fs = require('fs');

// ─── Charger l'arbre de talent ────────────────────────────────────────────────
const src = fs.readFileSync('src/data/talentTree.js', 'utf8');
const tmpFile = path.join(os.tmpdir(), 'tt_sim.js');
fs.writeFileSync(tmpFile, src + '\nmodule.exports = TALENT_NODES_RAW;');
delete require.cache[tmpFile];
const ALL_NODES = require(tmpFile);

const TALENT_NODES_SORTED = ALL_NODES.filter(n => n.id !== 'origin').sort((a,b) => a.cost - b.cost);

function talentBonusesForFragments(fragmentsSpent) {
  const b = { damage:0, flatDamage:0, maxHp:0, maxHpMultiplier:0, regen:0, attackSpeed:0, critChance:0, moveSpeed:0 };
  let spent = 0;
  for (const n of TALENT_NODES_SORTED) {
    if (spent + n.cost > fragmentsSpent) break;
    spent += n.cost;
    for (const [k,v] of Object.entries(n.effect)) if (k in b) b[k] += v;
  }
  return b;
}

// ─── Modèle ennemi ─────────────────────────────────────────────────────────────
function enemyTier(wave) { return Math.floor(Math.max(1,wave)/10); }
function tierMult(wave)  { return Math.pow(1.75, enemyTier(wave)); }
function earlyPressure(wave) { return 1 + Math.min(wave,10)*0.035; }

function enemyMix(wave) {
  const sp = wave>=6 ? Math.min(0.06+wave*0.008,0.22):0;
  const da = wave>=4 ? Math.min(0.08+wave*0.01,0.26):0;
  const br = wave>=3 ? Math.min(0.11+wave*0.014,0.34):0;
  const sh = wave>=2 ? Math.min(0.14+wave*0.014,0.36):0;
  const ch = Math.max(0,1-sp-da-br-sh);
  return {chaser:ch,shooter:sh,brute:br,dasher:da,sprayer:sp};
}

function avgEnemyHP(wave) {
  const m = enemyMix(wave), tm = tierMult(wave), ep = earlyPressure(wave);
  const hp = {
    chaser:  wave===1?11:16+wave*4.5,
    shooter: 24+wave*6, brute: 42+wave*10, dasher: 30+wave*7, sprayer: 22+wave*5.5
  };
  const base = Object.keys(m).reduce((s,k)=>s+m[k]*hp[k],0);
  return base * tm * ep;
}

function avgEnemyDamage(wave) {
  const m = enemyMix(wave), tm = Math.pow(1.35, enemyTier(wave));
  const dmg = {chaser:13,shooter:11,brute:19,dasher:17,sprayer:10};
  return Object.keys(m).reduce((s,k)=>s+m[k]*dmg[k],0) * tm;
}

function bossHP(wave) {
  const tier = Math.max(1, enemyTier(wave));
  return (1400+wave*180) * tierMult(wave) * (1+tier*0.35);
}
function bossDamagePerHit(wave) {
  return (28+wave*1.8) * Math.pow(1.35, enemyTier(wave));
}

// ─── Modèle joueur ─────────────────────────────────────────────────────────────
// Main : 1 carte tous les 2 vagues, max 5, répartition 2♠ 1♥ 1♣ 1◆
function handAtWave(wave) {
  const n      = Math.min(5, Math.max(0, Math.floor(wave/2)));
  const spades = Math.min(2, n >= 4 ? 2 : n >= 1 ? 1 : 0);
  const hearts = Math.min(1, n >= 2 ? 1 : 0);
  const clubs  = Math.min(1, n >= 3 ? 1 : 0);
  const avgCardVal = 5.5;
  return {
    n, spades, hearts, clubs,
    flatDamage:  spades * avgCardVal,
    addedHp:     hearts * (10 + avgCardVal),
    attackSpeed: clubs * 0.07 + clubs * 0.05,
    pokerBonus:  n >= 5 ? 0.25 : n >= 2 ? 0.12 : 0,
    regen:       hearts * 0.18,
  };
}

function playerStats(wave, tb) {
  const h        = handAtWave(wave);
  const flatDmg  = h.flatDamage + tb.flatDamage;
  const dmgMult  = Math.max(0.25, 1 + h.pokerBonus + h.spades*0.035 + tb.damage);
  const atkSpeed = Math.max(0.25, 1 + h.attackSpeed + tb.attackSpeed);
  const critMult = 1 + tb.critChance;
  const dps      = (7 + flatDmg) * dmgMult * critMult * atkSpeed / 0.42;
  const maxHp    = Math.max(40, (100 + 14 + h.addedHp + tb.maxHp) * (1 + tb.maxHpMultiplier));
  const regen    = h.regen + tb.regen;
  const moveSpd  = 225 + tb.moveSpeed;
  return { dps, maxHp, regen, moveSpd };
}

function effectiveHP(stats, duration) {
  return stats.maxHp + stats.regen * duration;
}

// ─── Vague normale ──────────────────────────────────────────────────────────────
function simNormalWave(wave, tb) {
  const duration = Math.min(15 + wave*1.7, 54);
  const interval = Math.max(0.14, 0.72 - wave*0.022);
  const totalEnemies = duration / interval;
  const stats    = playerStats(wave, tb);
  const killRate = stats.dps / avgEnemyHP(wave);
  const spawnRate = 1 / interval;
  const overRatio = killRate / spawnRate;
  // Ennemis simultanément à l'écran (pire au fur et à mesure de l'accumulation)
  const avgOnScreen = overRatio >= 1.5 ? 2.5
                    : overRatio >= 0.8 ? 4.5
                    : overRatio >= 0.4 ? 8.0
                    : 14.0;
  const dodge     = 0.76;
  const hitFreq   = 0.9;
  const dmgPerSec = avgOnScreen * avgEnemyDamage(wave) * hitFreq * (1 - dodge);
  const pEHP      = effectiveHP(stats, duration);
  const totalEnemyHP = totalEnemies * avgEnemyHP(wave);
  const canKill   = stats.dps * duration >= totalEnemyHP * 0.85;
  const raw       = pEHP / (dmgPerSec * duration);
  return canKill ? raw : raw * 0.5;
}

// ─── Vague boss ─────────────────────────────────────────────────────────────────
function simBossWave(wave, tb) {
  const stats     = playerStats(wave, tb);
  const hp        = bossHP(wave);
  const bossHit   = bossDamagePerHit(wave);
  const shootRate = 0.8;
  const killTime  = hp / stats.dps;
  const baseDodge = 0.82;
  const speedBonus = Math.min(0.08, (stats.moveSpd - 225) / 300 * 0.08);
  const bossDodge = Math.min(0.94, baseDodge + speedBonus);
  const bossDPS   = bossHit / shootRate * (1 - bossDodge);
  const totalDPS  = bossDPS * 1.20; // +20% pour les ennemis mineurs du boss
  const pEHP      = effectiveHP(stats, killTime);
  return { survivalRatio: pEHP / (totalDPS * killTime), killTime: Math.round(killTime), hp: Math.round(hp), stats };
}

// ─── Scénarios ──────────────────────────────────────────────────────────────────
const SCENARIOS = [
  { label: 'Run   0  (    0 frags  — aucune méta)',            fragments: 0 },
  { label: 'Run ~18  (  5 000 frags — début de talents)',       fragments: 5000 },
  { label: 'Run ~36  ( 10 000 frags — 1/4 de l\'arbre)',        fragments: 10000 },
  { label: 'Run ~73  ( 20 131 frags — arbre complet)',          fragments: 20131 },
  { label: 'Run ~130 ( 36 000 frags — upgrades cartes à 50%)', fragments: 36000 },
  { label: 'Run ~260 ( 71 019 frags — tout débloqué)',          fragments: 71019 },
];

console.log('=== SIMULATION — PROGRESSION DE VAGUES PAR NIVEAU DE MÉTA ===\n');
console.log('Hypothèses :');
console.log('  • Arme de base : mitraillette verte (dmg=7, cooldown=0.42s, +14 HP)');
console.log('  • Main : 1 carte toutes les 2 vagues, max 5 (2♠ 1♥ 1♣ 1◆, valeur moy. 5.5)');
console.log('  • Esquive ennemis normaux : 76%  |  Esquive boss : 82–90%');
console.log('  • Ratio de survie : >1.5=facile ✓✓ | 1.0-1.5=ok ✓ | 0.6-1.0=risqué △ | <0.5=mort probable ✗');
console.log('  • ★ = vague boss (doit être tuée, pas de timer)');
console.log('');

for (const scen of SCENARIOS) {
  const tb = talentBonusesForFragments(scen.fragments);
  // Compter les talents débloqués
  let spent2=0, talentCount=0;
  for (const n of TALENT_NODES_SORTED) {
    if (spent2+n.cost > scen.fragments) break;
    spent2+=n.cost; talentCount++;
  }

  console.log('─'.repeat(75));
  console.log(scen.label);
  console.log(
    '  Talents: '+talentCount+'/'+TALENT_NODES_SORTED.length+
    ' | +'+Math.round(tb.damage*100)+'% DMG'+
    ' | +'+Math.round(tb.flatDamage)+' plats'+
    ' | +'+Math.round(tb.maxHp)+' HP'+
    ' | +'+tb.regen.toFixed(2)+' regen'+
    ' | +'+Math.round(tb.attackSpeed*100)+'% cad'+
    ' | +'+Math.round(tb.critChance*100)+'% crit'
  );

  let firstDeath = null;
  const results = [];
  for (let w = 1; w <= 35; w++) {
    const isBoss = w % 10 === 0;
    const r = isBoss ? simBossWave(w, tb).survivalRatio : simNormalWave(w, tb);
    if (r < 0.5 && !firstDeath) firstDeath = w;
    const sym = r >= 1.5 ? 'VV' : r >= 1.0 ? 'V ' : r >= 0.6 ? '△ ' : 'X ';
    results.push('V'+String(w).padStart(2,'0')+':'+sym+'('+r.toFixed(1)+')' + (isBoss?'★':' '));
  }
  for (let i=0; i<results.length; i+=7) {
    process.stdout.write('  ' + results.slice(i,i+7).join('  ') + '\n');
  }

  const s10 = playerStats(10, tb);
  const s20 = playerStats(20, tb);
  const b20 = simBossWave(20, tb);
  const b30 = simBossWave(30, tb);
  console.log('  V10 → DPS='+Math.round(s10.dps)+' | HP='+Math.round(s10.maxHp)+' | Boss 10: '+Math.round(bossHP(10))+' PV');
  console.log('  V20 → DPS='+Math.round(s20.dps)+' | HP='+Math.round(s20.maxHp)+' | Boss 20: '+Math.round(bossHP(20))+' PV, tuer en '+b20.killTime+'s');
  console.log('  V30 → Boss 30: '+Math.round(bossHP(30))+' PV, tuer en '+b30.killTime+'s');
  console.log(firstDeath
    ? '  !! Limite probable : vague ' + firstDeath
    : '  ** Survie solide jusqu\'à la vague 30+');
}

console.log('\n' + '='.repeat(75));
console.log('RÉSUMÉ — Nombre de vagues accessible selon la progression');
console.log('='.repeat(75));
const summary = SCENARIOS.map(scen => {
  const tb = talentBonusesForFragments(scen.fragments);
  let limit = 35;
  for (let w=1; w<=35; w++) {
    const isBoss = w%10===0;
    const r = isBoss ? simBossWave(w,tb).survivalRatio : simNormalWave(w,tb);
    if (r < 0.5) { limit = w; break; }
  }
  return { label: scen.label.split('—')[1].trim(), limit };
});
summary.forEach(s => console.log('  '+(s.label+' '.repeat(45)).slice(0,45)+' → jusqu\'à V'+s.limit+(s.limit===35?'+':'')));

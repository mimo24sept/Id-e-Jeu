const TALENT_REGIONS = {
  center:  { label: "Origine",   color: "#f0d24b", stroke: "#e0c040" },
  spades:  { label: "♠ Pique",   color: "#e46363", stroke: "#c04040" },
  hearts:  { label: "♥ Cœur",    color: "#e8889e", stroke: "#c06070" },
  diamonds:{ label: "♦ Carreau", color: "#f0d24b", stroke: "#c0a030" },
  clubs:   { label: "♣ Trèfle",  color: "#66e08f", stroke: "#40b060" },
  poker:   { label: "⚡ Poker",   color: "#9b8bff", stroke: "#7060d0" },
  combat:  { label: "⚔ Combat",  color: "#55b8ff", stroke: "#3090d0" },
  shop:    { label: "◆ Boutique",color: "#ffb84b", stroke: "#d08030" },
  bridge:  { label: "◈ Jonction",color: "#c8b8ff", stroke: "#9070e0" },
};

function buildRegionNodes(regionId, gx, gy, dx, dy, rows) {
  const px = -dy, py = dx;
  const step = 140;
  return rows.map(([depth, width, tier, cost, name, desc, effect], i) => ({
    id: `${regionId}-${i}`,
    x: Math.round(gx + depth * step * dx + width * step * px),
    y: Math.round(gy + depth * step * dy + width * step * py),
    tier, cost, name, desc, region: regionId, effect, connections: [],
  }));
}

const TALENT_CENTER_NODES = [
  { id: "origin",    x: 0,    y: 0,    tier: 0, cost: 0,  name: "Origine",    desc: "Point de départ",             region: "center", effect: {},                                    connections: [] },
  { id: "ct-0",      x: -150, y: 0,    tier: 2, cost: 25, name: "Force brute",  desc: "+6% dégâts",                region: "center", effect: { damage: 0.06 },                      connections: [] },
  { id: "ct-1",      x: -75,  y: 130,  tier: 2, cost: 25, name: "Endurance",    desc: "+15 PV max",                region: "center", effect: { maxHp: 15 },                         connections: [] },
  { id: "ct-2",      x: 75,   y: 130,  tier: 2, cost: 25, name: "Prospérité",   desc: "+6% or",                    region: "center", effect: { money: 0.06 },                       connections: [] },
  { id: "ct-3",      x: 150,  y: 0,    tier: 2, cost: 25, name: "Cadence",      desc: "+6% vitesse att.",          region: "center", effect: { attackSpeed: 0.06 },                 connections: [] },
  { id: "ct-4",      x: 0,    y: -150, tier: 2, cost: 25, name: "Intuition",    desc: "+4% dégâts, +4% vitesse att.",region: "center", effect: { damage: 0.04, attackSpeed: 0.04 }, connections: [] },
  { id: "ct-5",      x: 106,  y: -106, tier: 2, cost: 25, name: "Tactique",     desc: "+5% dégâts, +10 PV",        region: "center", effect: { damage: 0.05, maxHp: 10 },           connections: [] },
  { id: "ct-6",      x: -106, y: -106, tier: 2, cost: 25, name: "Réseau",       desc: "+4% or, -4% reroll",        region: "center", effect: { money: 0.04, rerollDiscount: 0.04 }, connections: [] },
  { id: "ct-7",      x: -80,  y: -80,  tier: 1, cost: 18, name: "Équilibre",    desc: "+2% dégâts, +2% vitesse att.",region: "center", effect: { damage: 0.02, attackSpeed: 0.02 }, connections: [] },
  { id: "ct-8",      x: 80,   y: -80,  tier: 1, cost: 18, name: "Vitalité",     desc: "+10 PV, +0.15 regen",       region: "center", effect: { maxHp: 10, regen: 0.15 },            connections: [] },
  { id: "ct-9",      x: 0,    y: 90,   tier: 1, cost: 18, name: "Richesse",     desc: "+3% or, -2% packs",         region: "center", effect: { money: 0.03, packDiscount: 0.02 },   connections: [] },
];

// ♠ PIQUE — Dégâts & Critiques — direction gauche
const TALENT_SPADES = buildRegionNodes("spades", -300, 0, -1, 0, [
  [1,-2,1,20,"Taille nette",       "+1.5% dégâts",               {damage:0.015}],
  [1,-1,1,18,"Coup sûr",           "+1.5% dégâts",               {damage:0.015}],
  [1, 0,1,18,"Frappe ciblée",      "+1.5% dégâts",               {damage:0.015}],
  [1, 1,1,18,"Impact brut",        "+2 dégâts plats",            {flatDamage:2}],
  [1, 2,1,20,"Lame lourde",        "+2 dégâts plats",            {flatDamage:2}],
  [2,-2,1,20,"Visée précise",      "+1.2% chance critique",      {critChance:0.012}],
  [2,-1,1,18,"Point faible",       "+1.5% dégâts",               {damage:0.015}],
  [2, 0,1,18,"Tranche",            "+1.5% dégâts",               {damage:0.015}],
  [2, 1,1,18,"Blessure profonde",  "+2 dégâts plats",            {flatDamage:2}],
  [2, 2,1,20,"Incision",           "+1.2% chance critique",      {critChance:0.012}],
  [3,-2,2,35,"Maîtrise du tranchant","+5% dégâts",              {damage:0.05}],
  [3,-1,1,20,"Coup net",           "+2% dégâts",                 {damage:0.02}],
  [3, 0,2,35,"Expertise",          "+5% dégâts",                 {damage:0.05}],
  [3, 1,1,20,"Entaille",           "+2% dégâts",                 {damage:0.02}],
  [3, 2,2,38,"Précision avancée",  "+4% chance critique",        {critChance:0.04}],
  [4,-2,2,38,"Spécialisation",     "+5% dégâts",                 {damage:0.05}],
  [4,-1,2,35,"Technique supérieure","+4% dégâts, +2% crit",     {damage:0.04,critChance:0.02}],
  [4, 0,2,40,"Maîtrise",           "+6% dégâts",                 {damage:0.06}],
  [4, 1,2,35,"Art de la lame",     "+4% dégâts, +3 plats",      {damage:0.04,flatDamage:3}],
  [4, 2,2,38,"Coup imparable",     "+6 dégâts plats",            {flatDamage:6}],
  [5,-1,2,42,"Savoir-faire",       "+5% dégâts, +2% crit",       {damage:0.05,critChance:0.02}],
  [5, 0,2,42,"Perfection guerrière","+7% dégâts",                {damage:0.07}],
  [5, 1,2,42,"Frappe implacable",  "+5% dégâts, +4 plats",      {damage:0.05,flatDamage:4}],
  [5,-2,3,75,"Verre trempé",       "+18% dégâts, -15% PV max",  {damage:0.18,maxHpMultiplier:-0.15}],
  [5, 2,3,75,"Assaut total",       "+15% dégâts, +10% vitesse att.",{damage:0.15,attackSpeed:0.10}],
  [6,-1,2,45,"Lame de maître",     "+6% dégâts, +3% crit",       {damage:0.06,critChance:0.03}],
  [6, 0,2,45,"Expertise avancée",  "+8% dégâts",                 {damage:0.08}],
  [6, 1,2,45,"Impact dévastateur", "+8 dégâts plats",            {flatDamage:8}],
  [6,-2,3,80,"Assassin",           "+12% dégâts, +10% crit",    {damage:0.12,critChance:0.10}],
  [6, 2,3,80,"Lame vorace",        "+15% dégâts, -0.4 regen",   {damage:0.15,regen:-0.4}],
  [7, 0,3,90,"Transcendance",      "+12% dégâts, +8% crit, +6 plats",{damage:0.12,critChance:0.08,flatDamage:6}],
  [7,-1,3,85,"Chasseur d'élites",  "+12% crit, +8% dégâts",     {critChance:0.12,damage:0.08}],
  [7, 1,3,85,"Poing de fer",       "+20 dégâts plats",           {flatDamage:20}],
  [8, 0,3,95,"Prédateur",          "+20% dégâts, +8% crit",     {damage:0.20,critChance:0.08}],
  [8,-1,3,90,"Frappe fatale",      "+14% crit, +8% dégâts",     {critChance:0.14,damage:0.08}],
  [8, 1,3,90,"Furie dévastatrice", "+12% dégâts, +15 plats",    {damage:0.12,flatDamage:15}],
  [9,-1,2,50,"Endurance de combat","+9% dégâts",                 {damage:0.09}],
  [9, 0,3,92,"Scaling Berserker",  "+0.5% dégâts par vague",    {waveScaling:0.005}],
  [9, 1,2,50,"Coup de grâce",      "+7% dégâts, +5% crit",      {damage:0.07,critChance:0.05}],
  [10,-1,2,55,"Force brute ultime","+10% dégâts, +5 plats",      {damage:0.10,flatDamage:5}],
  [10, 0,3,95,"Overtime",          "+0.8% dégâts par vague",     {waveScaling:0.008}],
  [10, 1,2,55,"Précision absolue", "+10% dégâts, +8% crit",      {damage:0.10,critChance:0.08}],
  [11, 0,3,98,"Puissance intemporelle","+1.5% dégâts par vague, +15% dégâts",{waveScaling:0.015,damage:0.15}],
]);

// ♥ CŒUR — Survie & Régénération — direction bas-gauche
const TALENT_HEARTS = buildRegionNodes("hearts", -150, 260, -0.5, 0.866, [
  [1,-2,1,18,"Chair robuste",      "+7 PV max",                  {maxHp:7}],
  [1,-1,1,18,"Résistance",         "+7 PV max",                  {maxHp:7}],
  [1, 0,1,18,"Corps solide",       "+7 PV max",                  {maxHp:7}],
  [1, 1,1,18,"Récupération",       "+0.12 regen",                {regen:0.12}],
  [1, 2,1,18,"Endurance vitale",   "+0.12 regen",                {regen:0.12}],
  [2,-2,1,20,"Fortitude",          "+2% PV max",                 {maxHpMultiplier:0.02}],
  [2,-1,1,18,"Vigueur",            "+7 PV max",                  {maxHp:7}],
  [2, 0,1,18,"Peau dure",          "+7 PV max",                  {maxHp:7}],
  [2, 1,1,18,"Régénération",       "+0.12 regen",                {regen:0.12}],
  [2, 2,1,20,"Vitalité pure",      "+2% PV max",                 {maxHpMultiplier:0.02}],
  [3,-2,2,35,"Muraille de chair",  "+20 PV max",                 {maxHp:20}],
  [3,-1,1,20,"Force vitale",       "+8 PV max",                  {maxHp:8}],
  [3, 0,2,35,"Résilience",         "+20 PV max",                 {maxHp:20}],
  [3, 1,1,20,"Flux sanguin",       "+0.15 regen",                {regen:0.15}],
  [3, 2,2,38,"Guérison rapide",    "+0.4 regen",                 {regen:0.4}],
  [4,-2,2,38,"Cuirasse naturelle", "+5% PV max",                 {maxHpMultiplier:0.05}],
  [4,-1,2,35,"Puits de vie",       "+18 PV, +0.15 regen",       {maxHp:18,regen:0.15}],
  [4, 0,2,40,"Titan",              "+22 PV max",                 {maxHp:22}],
  [4, 1,2,35,"Flux vital",         "+0.35 regen, +8 PV",        {regen:0.35,maxHp:8}],
  [4, 2,2,38,"Régénération soutenue","+0.5 regen",              {regen:0.5}],
  [5,-1,2,42,"Force vitale majeure","+20 PV, +3% PV max",       {maxHp:20,maxHpMultiplier:0.03}],
  [5, 0,2,42,"Constitution légendaire","+25 PV max",            {maxHp:25}],
  [5, 1,2,42,"Sang de guerre",     "+0.4 regen, +12 PV",        {regen:0.4,maxHp:12}],
  [5,-2,3,75,"Colosse",            "+20% PV max, -12% vitesse att.",{maxHpMultiplier:0.20,attackSpeed:-0.12}],
  [5, 2,3,75,"Flux inépuisable",   "+1.0 regen, -8% dégâts",   {regen:1.0,damage:-0.08}],
  [6,-1,2,45,"Corps de titan",     "+22 PV, +4% PV max",        {maxHp:22,maxHpMultiplier:0.04}],
  [6, 0,2,45,"Invulnérabilité",    "+28 PV max",                 {maxHp:28}],
  [6, 1,2,45,"Métabolisme actif",  "+0.5 regen, +10 PV",        {regen:0.5,maxHp:10}],
  [6,-2,3,80,"Forteresse vivante", "+15% PV max, +0.5 regen",   {maxHpMultiplier:0.15,regen:0.5}],
  [6, 2,3,80,"Sang immortel",      "+1.5 regen",                 {regen:1.5}],
  [7, 0,3,90,"Apothéose",          "+25 PV, +5% PV max, +0.5 regen",{maxHp:25,maxHpMultiplier:0.05,regen:0.5}],
  [7,-1,3,85,"Citadelle",          "+18% PV max",                {maxHpMultiplier:0.18}],
  [7, 1,3,85,"Régénération totale","+1.0 regen, +15 PV",        {regen:1.0,maxHp:15}],
  [8, 0,3,95,"Immortel",           "+20% PV max, +0.8 regen",   {maxHpMultiplier:0.20,regen:0.8}],
  [8,-1,3,90,"Titan de guerre",    "+50 PV max",                 {maxHp:50}],
  [8, 1,3,90,"Régénérant",         "+1.2 regen",                 {regen:1.2}],
  [9,-1,2,50,"Vitalité transcendante","+0.6 regen, +15 PV",      {regen:0.6,maxHp:15}],
  [9, 0,3,92,"Sang régénérant",    "+25% soins reçus",            {healingBonus:0.25}],
  [9, 1,2,50,"Bouclier vital",     "+6% PV max",                  {maxHpMultiplier:0.06}],
  [10,-1,2,55,"Flux éternel",      "+1.0 regen, +20 PV",          {regen:1.0,maxHp:20}],
  [10, 0,3,95,"Résurrection partielle","+45% soins reçus",        {healingBonus:0.45}],
  [10, 1,2,55,"Corps indestructible","+8% PV max, +25 PV",        {maxHpMultiplier:0.08,maxHp:25}],
  [11, 0,3,98,"Immortel véritable","+70% soins reçus, +12% PV max",{healingBonus:0.70,maxHpMultiplier:0.12}],
]);

// ♦ CARREAU — Or & Fragments — direction bas-droite
const TALENT_DIAMONDS = buildRegionNodes("diamonds", 150, 260, 0.5, 0.866, [
  [1,-2,1,18,"Pièce trouvée",      "+1.5% or",                   {money:0.015}],
  [1,-1,1,18,"Économies",          "+1.5% or",                   {money:0.015}],
  [1, 0,1,18,"Commerce",           "+1.5% or",                   {money:0.015}],
  [1, 1,1,18,"Réduction",          "-2% prix packs",             {packDiscount:0.02}],
  [1, 2,1,18,"Bonne affaire",      "-2% prix packs",             {packDiscount:0.02}],
  [2,-2,1,20,"Investisseur",       "+2% fragments",              {fragmentGain:0.02}],
  [2,-1,1,18,"Marchand",           "+1.5% or",                   {money:0.015}],
  [2, 0,1,18,"Flair financier",    "+1.5% or",                   {money:0.015}],
  [2, 1,1,18,"Négociation",        "-2% prix packs",             {packDiscount:0.02}],
  [2, 2,1,20,"Héritier",           "+2% fragments",              {fragmentGain:0.02}],
  [3,-2,2,35,"Or coulant",         "+5% or",                     {money:0.05}],
  [3,-1,1,20,"Aubaine",            "+2% or",                     {money:0.02}],
  [3, 0,2,35,"Financier",          "+5% or",                     {money:0.05}],
  [3, 1,1,20,"Rabais",             "-2.5% prix packs",           {packDiscount:0.025}],
  [3, 2,2,38,"Soldes permanentes", "-4% prix packs",             {packDiscount:0.04}],
  [4,-2,2,38,"Fortune grandissante","+5% or",                    {money:0.05}],
  [4,-1,2,35,"Trésor",             "+4% or, -3% packs",         {money:0.04,packDiscount:0.03}],
  [4, 0,2,40,"Mogul",              "+6% or",                     {money:0.06}],
  [4, 1,2,35,"Discount géant",     "-4% packs, +4% or",         {packDiscount:0.04,money:0.04}],
  [4, 2,2,38,"Legs",               "+4% fragments",              {fragmentGain:0.04}],
  [5,-1,2,42,"Richesse abondante", "+5% or, +2% fragments",     {money:0.05,fragmentGain:0.02}],
  [5, 0,2,42,"Maître des finances","+7% or",                     {money:0.07}],
  [5, 1,2,42,"Bazar",              "-5% packs, +3% or",         {packDiscount:0.05,money:0.03}],
  [5,-2,3,75,"Fortune colossale",  "+18% or",                    {money:0.18}],
  [5, 2,3,75,"Investisseur fou",   "+12% fragments, -6% or",    {fragmentGain:0.12,money:-0.06}],
  [6,-1,2,45,"Roi du commerce",    "+6% or, -4% packs",         {money:0.06,packDiscount:0.04}],
  [6, 0,2,45,"Tycoon",             "+8% or",                     {money:0.08}],
  [6, 1,2,45,"Liquidateur",        "-6% prix packs",             {packDiscount:0.06}],
  [6,-2,3,80,"Capitaliste",        "+20% or",                    {money:0.20}],
  [6, 2,3,80,"Archiviste",         "+10% fragments",             {fragmentGain:0.10}],
  [7, 0,3,90,"Dieu des marchés",   "+10% or, -6% packs, +6% frag",{money:0.10,packDiscount:0.06,fragmentGain:0.06}],
  [7,-1,3,85,"Milliardaire",       "+15% or",                    {money:0.15}],
  [7, 1,3,85,"Bibliothèque",       "+12% fragments",             {fragmentGain:0.12}],
  [8, 0,3,95,"Le Grand Baron",     "+20% or, +10% fragments",   {money:0.20,fragmentGain:0.10}],
  [8,-1,3,90,"Trésor infini",      "+18% or",                    {money:0.18}],
  [8, 1,3,90,"Héritage éternel",   "+15% fragments",             {fragmentGain:0.15}],
  [9,-1,2,50,"Rendement solide",   "+10% or, +4% fragments",     {money:0.10,fragmentGain:0.04}],
  [9, 0,3,92,"Intérêts composés",  "+3% intérêts fin de vague",  {interestBonus:0.03}],
  [9, 1,2,50,"Dividendes stables", "+8% fragments",              {fragmentGain:0.08}],
  [10,-1,2,55,"Fortune immense",   "+12% or, -6% packs",         {money:0.12,packDiscount:0.06}],
  [10, 0,3,95,"Capitaliste absolu","+5% intérêts fin de vague",  {interestBonus:0.05}],
  [10, 1,2,55,"Fonds d'urgence",   "+10% fragments, +8% or",     {fragmentGain:0.10,money:0.08}],
  [11, 0,3,98,"Seigneur des marchés","+8% intérêts fin de vague, +20% or",{interestBonus:0.08,money:0.20}],
]);

// ♣ TRÈFLE — Vitesse & Mouvement — direction droite
const TALENT_CLUBS = buildRegionNodes("clubs", 300, 0, 1, 0, [
  [1,-2,1,18,"Réflexes",           "+1.5% vitesse att.",         {attackSpeed:0.015}],
  [1,-1,1,18,"Cadence",            "+1.5% vitesse att.",         {attackSpeed:0.015}],
  [1, 0,1,18,"Fluidité",           "+1.5% vitesse att.",         {attackSpeed:0.015}],
  [1, 1,1,18,"Agilité",            "+6 vitesse dépl.",           {moveSpeed:6}],
  [1, 2,1,18,"Légèreté",           "+6 vitesse dépl.",           {moveSpeed:6}],
  [2,-2,1,20,"Coup vif",           "+2% vitesse att.",           {attackSpeed:0.02}],
  [2,-1,1,18,"Rythme",             "+1.5% vitesse att.",         {attackSpeed:0.015}],
  [2, 0,1,18,"Vivacité",           "+1.5% vitesse att.",         {attackSpeed:0.015}],
  [2, 1,1,18,"Accélération",       "+6 vitesse dépl.",           {moveSpeed:6}],
  [2, 2,1,20,"Vif-argent",         "+2% vitesse att.",           {attackSpeed:0.02}],
  [3,-2,2,35,"Feu roulant",        "+5% vitesse att.",           {attackSpeed:0.05}],
  [3,-1,1,20,"Pression",           "+2% vitesse att.",           {attackSpeed:0.02}],
  [3, 0,2,35,"Bourrasque",         "+5% vitesse att.",           {attackSpeed:0.05}],
  [3, 1,1,20,"Sprint",             "+12 vitesse dépl.",          {moveSpeed:12}],
  [3, 2,2,38,"Dash constant",      "+18 vitesse dépl.",          {moveSpeed:18}],
  [4,-2,2,38,"Rafale",             "+5% vitesse att.",           {attackSpeed:0.05}],
  [4,-1,2,35,"Tir continu",        "+4% vitesse att., +8 vitesse",{attackSpeed:0.04,moveSpeed:8}],
  [4, 0,2,40,"Tempête de plombs",  "+6% vitesse att.",           {attackSpeed:0.06}],
  [4, 1,2,35,"Vent de guerre",     "+4% vitesse att., +12 vitesse",{attackSpeed:0.04,moveSpeed:12}],
  [4, 2,2,38,"Vitesse pure",       "+20 vitesse dépl.",          {moveSpeed:20}],
  [5,-1,2,42,"Mitraille",          "+5% vitesse att., +8 vitesse",{attackSpeed:0.05,moveSpeed:8}],
  [5, 0,2,42,"Déluge",             "+7% vitesse att.",           {attackSpeed:0.07}],
  [5, 1,2,42,"Vent déchaîné",      "+5% vitesse att., +15 vitesse",{attackSpeed:0.05,moveSpeed:15}],
  [5,-2,3,75,"Furie",              "+18% vitesse att., -10% dégâts",{attackSpeed:0.18,damage:-0.10}],
  [5, 2,3,75,"Fantôme",            "+45 vitesse dépl.",          {moveSpeed:45}],
  [6,-1,2,45,"Cadence infernale",  "+6% vitesse att., +10 vitesse",{attackSpeed:0.06,moveSpeed:10}],
  [6, 0,2,45,"Foudre",             "+8% vitesse att.",           {attackSpeed:0.08}],
  [6, 1,2,45,"Vent du nord",       "+22 vitesse dépl.",          {moveSpeed:22}],
  [6,-2,3,80,"Tornade",            "+15% vitesse att., +20 vitesse",{attackSpeed:0.15,moveSpeed:20}],
  [6, 2,3,80,"Éclair",             "+30 vitesse dépl., +5% vitesse att.",{moveSpeed:30,attackSpeed:0.05}],
  [7, 0,3,90,"Tempête absolue",    "+10% vitesse att., +20 vitesse",{attackSpeed:0.10,moveSpeed:20}],
  [7,-1,3,85,"Déchaînement",       "+15% vitesse att.",          {attackSpeed:0.15}],
  [7, 1,3,85,"Vent éternel",       "+35 vitesse dépl.",          {moveSpeed:35}],
  [8, 0,3,95,"Dieu de la vitesse", "+20% vitesse att., +30 vitesse",{attackSpeed:0.20,moveSpeed:30}],
  [8,-1,3,90,"Avalanche",          "+18% vitesse att.",          {attackSpeed:0.18}],
  [8, 1,3,90,"Vrille",             "+40 vitesse dépl.",          {moveSpeed:40}],
  [9,-1,2,50,"Frappe rapide",      "+10% vitesse att., +12 vitesse",{attackSpeed:0.10,moveSpeed:12}],
  [9, 0,3,92,"Premier ricochet",   "+1 rebond de projectile",    {bounceCount:1}],
  [9, 1,2,50,"Vent vif",           "+8% vitesse att., +18 vitesse",{attackSpeed:0.08,moveSpeed:18}],
  [10,-1,2,55,"Salve ricochets",   "+12% vitesse att.",          {attackSpeed:0.12}],
  [10, 0,3,95,"Rebond maîtrisé",   "+1 rebond, +15% vitesse att.",{bounceCount:1,attackSpeed:0.15}],
  [10, 1,2,55,"Tempête intérieure","+10% vitesse att., +25 vitesse",{attackSpeed:0.10,moveSpeed:25}],
  [11, 0,3,98,"Maître des ricochets","+2 rebonds, +20% vitesse att.",{bounceCount:2,attackSpeed:0.20}],
]);

// ⚡ POKER — Mains & Cartes — direction haut
const TALENT_POKER = buildRegionNodes("poker", 0, -300, 0, -1, [
  [1,-2,1,18,"Mise initiale",      "+1.5% dégâts",               {damage:0.015}],
  [1,-1,1,18,"Carte piochée",      "+1.5% vitesse att.",         {attackSpeed:0.015}],
  [1, 0,1,18,"Main forte",         "+1.5% dégâts, +1.5% vitesse",{damage:0.015,attackSpeed:0.015}],
  [1, 1,1,18,"Joker de poche",     "+7 PV",                      {maxHp:7}],
  [1, 2,1,18,"Mise prudente",      "+1.5% or",                   {money:0.015}],
  [2,-2,1,20,"Bluff calculé",      "+2% dégâts",                 {damage:0.02}],
  [2,-1,1,18,"Cartes cachées",     "+1.5% vitesse att.",         {attackSpeed:0.015}],
  [2, 0,1,18,"Paire gagnante",     "+1.5% dégâts, +0.1 regen",  {damage:0.015,regen:0.1}],
  [2, 1,1,18,"Double mise",        "+7 PV, +1.5% or",           {maxHp:7,money:0.015}],
  [2, 2,1,20,"Économie de table",  "+2% or",                     {money:0.02}],
  [3,-2,2,35,"Deux paires",        "+4% dégâts, +2% vitesse att.",{damage:0.04,attackSpeed:0.02}],
  [3,-1,1,20,"Tactique",           "+2% dégâts",                 {damage:0.02}],
  [3, 0,2,35,"Brelan",             "+5% dégâts",                 {damage:0.05}],
  [3, 1,1,20,"Stratégie",          "+2% vitesse att.",           {attackSpeed:0.02}],
  [3, 2,2,38,"Bonne main",         "+3% or, +3% dégâts",        {money:0.03,damage:0.03}],
  [4,-2,2,38,"Suite montante",     "+5% dégâts, +2% crit",      {damage:0.05,critChance:0.02}],
  [4,-1,2,35,"Flush partiel",      "+3% dégâts, +2% vitesse att.",{damage:0.03,attackSpeed:0.02}],
  [4, 0,2,40,"Main pleine",        "+3% dégâts, +12 PV, +2% vitesse",{damage:0.03,maxHp:12,attackSpeed:0.02}],
  [4, 1,2,35,"Pot commun",         "+3% or, +12 PV",            {money:0.03,maxHp:12}],
  [4, 2,2,38,"Carré",              "+4% dégâts, +2% crit",      {damage:0.04,critChance:0.02}],
  [5,-1,2,42,"Flush coloré",       "+4% dégâts, +3% crit",      {damage:0.04,critChance:0.03}],
  [5, 0,2,42,"Quinte flush",       "+5% dégâts, +3% vitesse att.",{damage:0.05,attackSpeed:0.03}],
  [5, 1,2,42,"Jackpot",            "+4% or, +15 PV",            {money:0.04,maxHp:15}],
  [5,-2,3,75,"Grand slam",         "+12% dégâts, +6% crit",     {damage:0.12,critChance:0.06}],
  [5, 2,3,75,"Banque ouverte",     "+10% or, +6% fragments",    {money:0.10,fragmentGain:0.06}],
  [6,-1,2,45,"Bluff maîtrisé",     "+5% dégâts, +3% vitesse att.",{damage:0.05,attackSpeed:0.03}],
  [6, 0,2,45,"Jeu parfait",        "+6% dégâts, +4% vitesse att.",{damage:0.06,attackSpeed:0.04}],
  [6, 1,2,45,"Roi du casino",      "+5% or, +12 PV",            {money:0.05,maxHp:12}],
  [6,-2,3,80,"Royal flush",        "+15% dégâts, +8% crit",     {damage:0.15,critChance:0.08}],
  [6, 2,3,80,"Casino infini",      "+12% or, -5% dégâts",       {money:0.12,damage:-0.05}],
  [7, 0,3,90,"Maître du jeu",      "+10% dégâts, +5% crit, +5% vitesse",{damage:0.10,critChance:0.05,attackSpeed:0.05}],
  [7,-1,3,85,"As dans la manche",  "+10% dégâts, +8% crit",     {damage:0.10,critChance:0.08}],
  [7, 1,3,85,"Tapis absolu",       "+10% or, +8% fragments",    {money:0.10,fragmentGain:0.08}],
  [8, 0,3,95,"L'Élu du poker",     "+15% dégâts, +8% crit, +5% vitesse",{damage:0.15,critChance:0.08,attackSpeed:0.05}],
  [8,-1,3,90,"Quinte royale",      "+12% dégâts, +12% crit",    {damage:0.12,critChance:0.12}],
  [8, 1,3,90,"Fortune finale",     "+15% or, +8% fragments",    {money:0.15,fragmentGain:0.08}],
  [9,-1,2,50,"Stratège chevronné", "+8% dégâts, +4% crit",      {damage:0.08,critChance:0.04}],
  [9, 0,3,92,"Grande main",        "+10% dégâts, +5% vitesse att.",{damage:0.10,attackSpeed:0.05}],
  [9, 1,2,50,"Gain maximal",       "+10% or, +6% fragments",    {money:0.10,fragmentGain:0.06}],
  [10,-1,2,55,"Professionnel du poker","+10% dégâts, +8% crit", {damage:0.10,critChance:0.08}],
  [10, 0,3,95,"Tournoi final",     "+12% dégâts, +6% vitesse att.",{damage:0.12,attackSpeed:0.06}],
  [10, 1,2,55,"Tapis illimité",    "+12% or, +8% fragments",    {money:0.12,fragmentGain:0.08}],
  [11, 0,3,98,"Légende du poker",  "+15% dégâts, +10% crit, +8% vitesse att.",{damage:0.15,critChance:0.10,attackSpeed:0.08}],
]);

// ⚔ COMBAT — Armes & Tactique — direction haut-droite
const TALENT_COMBAT = buildRegionNodes("combat", 212, -212, 0.707, -0.707, [
  [1,-2,1,18,"Entretien d'arme",   "+1.5% dégâts",               {damage:0.015}],
  [1,-1,1,18,"Précision de tir",   "+1.5% dégâts",               {damage:0.015}],
  [1, 0,1,18,"Portée étendue",     "+1.5% dégâts",               {damage:0.015}],
  [1, 1,1,18,"Tir instinctif",     "+1.5% vitesse att.",         {attackSpeed:0.015}],
  [1, 2,1,18,"Chargeur lourd",     "+2 dégâts plats",            {flatDamage:2}],
  [2,-2,1,20,"Calibration",        "+2% dégâts",                 {damage:0.02}],
  [2,-1,1,18,"Visée améliorée",    "+1.5% dégâts",               {damage:0.015}],
  [2, 0,1,18,"Tir groupé",         "+1.5% dégâts, +1% vitesse", {damage:0.015,attackSpeed:0.01}],
  [2, 1,1,18,"Rapidité d'arme",    "+1.5% vitesse att.",         {attackSpeed:0.015}],
  [2, 2,1,20,"Munitions lourdes",  "+2 dégâts plats",            {flatDamage:2}],
  [3,-2,2,35,"Maîtrise de l'arsenal","+5% dégâts",              {damage:0.05}],
  [3,-1,1,20,"Expertise de terrain","+2% dégâts",               {damage:0.02}],
  [3, 0,2,35,"Tactique offensive", "+5% dégâts",                 {damage:0.05}],
  [3, 1,1,20,"Cadence de tir",     "+2% vitesse att.",           {attackSpeed:0.02}],
  [3, 2,2,38,"Impact cinétique",   "+6 dégâts plats",            {flatDamage:6}],
  [4,-2,2,38,"Spécialiste",        "+5% dégâts, +2% crit",      {damage:0.05,critChance:0.02}],
  [4,-1,2,35,"Expert de combat",   "+4% dégâts, +2% vitesse att.",{damage:0.04,attackSpeed:0.02}],
  [4, 0,2,40,"Tactique de guerre", "+6% dégâts",                 {damage:0.06}],
  [4, 1,2,35,"Assaut rapide",      "+4% vitesse att., +4% dégâts",{attackSpeed:0.04,damage:0.04}],
  [4, 2,2,38,"Obus perforant",     "+8 dégâts plats",            {flatDamage:8}],
  [5,-1,2,42,"Maestro de l'arme",  "+5% dégâts, +3% crit",      {damage:0.05,critChance:0.03}],
  [5, 0,2,42,"Offensive totale",   "+7% dégâts",                 {damage:0.07}],
  [5, 1,2,42,"Salve dévastatrice", "+5% vitesse att., +4% dégâts",{attackSpeed:0.05,damage:0.04}],
  [5,-2,3,75,"Berserk",            "+18% dégâts, -15% PV max",  {damage:0.18,maxHpMultiplier:-0.15}],
  [5, 2,3,75,"Fusillade totale",   "+10% vitesse att., +8% dégâts",{attackSpeed:0.10,damage:0.08}],
  [6,-1,2,45,"Lame et plomb",      "+6% dégâts, +3% crit",      {damage:0.06,critChance:0.03}],
  [6, 0,2,45,"Commandant de terrain","+8% dégâts",              {damage:0.08}],
  [6, 1,2,45,"Feux croisés",       "+5% vitesse att., +10 plats",{attackSpeed:0.05,flatDamage:10}],
  [6,-2,3,80,"Sniper légendaire",  "+12% crit, +10% dégâts",    {critChance:0.12,damage:0.10}],
  [6, 2,3,80,"Avalanche de plomb", "+15 plats, +10% vitesse att.",{flatDamage:15,attackSpeed:0.10}],
  [7, 0,3,90,"Général de guerre",  "+10% dégâts, +5% vitesse att., +5% crit",{damage:0.10,attackSpeed:0.05,critChance:0.05}],
  [7,-1,3,85,"Tireur d'élite",     "+15% crit, +8% dégâts",     {critChance:0.15,damage:0.08}],
  [7, 1,3,85,"Mitrailleur ultime", "+12% vitesse att., +10% dégâts",{attackSpeed:0.12,damage:0.10}],
  [8, 0,3,95,"Dieu de la guerre",  "+18% dégâts, +10% vitesse att.",{damage:0.18,attackSpeed:0.10}],
  [8,-1,3,90,"Chasseur de géants", "+12% dégâts, +12% crit",    {damage:0.12,critChance:0.12}],
  [8, 1,3,90,"Tempête de feu",     "+20 plats, +12% vitesse att.",{flatDamage:20,attackSpeed:0.12}],
  [9,-1,2,50,"Tactique de terrain","+9% dégâts, +5% crit",       {damage:0.09,critChance:0.05}],
  [9, 0,3,92,"Maestro militaire",  "+12% dégâts, +6% vitesse att.",{damage:0.12,attackSpeed:0.06}],
  [9, 1,2,50,"Arsenal perfectionné","+12 plats, +6% dégâts",     {flatDamage:12,damage:0.06}],
  [10,-1,2,55,"Général de division","+10% dégâts, +10% crit",    {damage:0.10,critChance:0.10}],
  [10, 0,3,95,"Art de la guerre",  "+15% dégâts, +8% vitesse att.",{damage:0.15,attackSpeed:0.08}],
  [10, 1,2,55,"Armure balistique", "+15 plats, +8% dégâts",      {flatDamage:15,damage:0.08}],
  [11, 0,3,98,"Dieu vivant de la guerre","+20% dégâts, +12% crit, +10% vitesse att.",{damage:0.20,critChance:0.12,attackSpeed:0.10}],
]);

// ◆ BOUTIQUE — Shop & Rerolls — direction haut-gauche
const TALENT_SHOP = buildRegionNodes("shop", -212, -212, -0.707, -0.707, [
  [1,-2,1,18,"Œil du marchand",    "-2% coût reroll",            {rerollDiscount:0.02}],
  [1,-1,1,18,"Bon plan",           "-2% prix packs",             {packDiscount:0.02}],
  [1, 0,1,18,"Négociation",        "-2% prix packs",             {packDiscount:0.02}],
  [1, 1,1,18,"Relance facile",     "-3% coût reroll",            {rerollDiscount:0.03}],
  [1, 2,1,18,"Aubaine",            "+1.5% or",                   {money:0.015}],
  [2,-2,1,20,"Connaissance marché","-3% prix packs",             {packDiscount:0.03}],
  [2,-1,1,18,"Trouver la perle",   "-2% prix packs",             {packDiscount:0.02}],
  [2, 0,1,18,"Marché favorable",   "-2.5% prix packs",           {packDiscount:0.025}],
  [2, 1,1,18,"Relance fréquente",  "-3% coût reroll",            {rerollDiscount:0.03}],
  [2, 2,1,20,"Accumulation",       "+2% or",                     {money:0.02}],
  [3,-2,2,35,"Liquidateur",        "-5% prix packs",             {packDiscount:0.05}],
  [3,-1,1,20,"Bonne pêche",        "-3% prix packs",             {packDiscount:0.03}],
  [3, 0,2,35,"Expert du marché",   "-5% prix packs",             {packDiscount:0.05}],
  [3, 1,1,20,"Reroll économique",  "-4% coût reroll",            {rerollDiscount:0.04}],
  [3, 2,2,38,"Monnaie économisée", "+5% or, -3% packs",         {money:0.05,packDiscount:0.03}],
  [4,-2,2,38,"Grossiste",          "-5% packs, +3% or",         {packDiscount:0.05,money:0.03}],
  [4,-1,2,35,"Catalogue parfait",  "-4% packs, -4% reroll",     {packDiscount:0.04,rerollDiscount:0.04}],
  [4, 0,2,40,"Maître du commerce", "-6% prix packs",             {packDiscount:0.06}],
  [4, 1,2,35,"Reroll stratégique", "-5% coût reroll, +3% or",   {rerollDiscount:0.05,money:0.03}],
  [4, 2,2,38,"Bonus d'achat",      "+5% or, -3% reroll",        {money:0.05,rerollDiscount:0.03}],
  [5,-1,2,42,"Affaire du siècle",  "-5% packs, -4% reroll",     {packDiscount:0.05,rerollDiscount:0.04}],
  [5, 0,2,42,"Génie du commerce",  "-7% prix packs",             {packDiscount:0.07}],
  [5, 1,2,42,"Économiste de guerre","-6% coût reroll",           {rerollDiscount:0.06}],
  [5,-2,3,75,"Soldes colossales",  "-15% prix packs",            {packDiscount:0.15}],
  [5, 2,3,75,"Reroll presque gratuit","-18% coût reroll",       {rerollDiscount:0.18}],
  [6,-1,2,45,"Marchand exceptionnel","-6% packs, -4% reroll",   {packDiscount:0.06,rerollDiscount:0.04}],
  [6, 0,2,45,"Magnat du commerce", "-8% prix packs",             {packDiscount:0.08}],
  [6, 1,2,45,"Reroll illimité",    "-7% coût reroll",            {rerollDiscount:0.07}],
  [6,-2,3,80,"Monopole",           "-18% packs, +8% or",        {packDiscount:0.18,money:0.08}],
  [6, 2,3,80,"Reroll absolu",      "-22% coût reroll",           {rerollDiscount:0.22}],
  [7, 0,3,90,"Gourou du marché",   "-10% packs, -10% reroll, +5% or",{packDiscount:0.10,rerollDiscount:0.10,money:0.05}],
  [7,-1,3,85,"Roi des soldes",     "-15% packs, +6% or",        {packDiscount:0.15,money:0.06}],
  [7, 1,3,85,"Roi du reroll",      "-20% coût reroll",           {rerollDiscount:0.20}],
  [8, 0,3,95,"Dieu du marché",     "-15% packs, -18% reroll, +8% or",{packDiscount:0.15,rerollDiscount:0.18,money:0.08}],
  [8,-1,3,90,"Braderie infinie",   "-20% prix packs",            {packDiscount:0.20}],
  [8, 1,3,90,"Maître absolu",      "-25% coût reroll",           {rerollDiscount:0.25}],
  [9,-1,2,50,"Pacte économique",   "-8% packs, -6% reroll",      {packDiscount:0.08,rerollDiscount:0.06}],
  [9, 0,3,92,"Runes puissantes",   "+30% effets de malédiction", {curseBonus:0.30}],
  [9, 1,2,50,"Commerce maudit",    "-10% packs, +6% or",         {packDiscount:0.10,money:0.06}],
  [10,-1,2,55,"Grand marché",      "-12% packs, -10% reroll",    {packDiscount:0.12,rerollDiscount:0.10}],
  [10, 0,3,95,"Sorcellerie avancée","+50% effets de malédiction",{curseBonus:0.50}],
  [10, 1,2,55,"Monopole maudit",   "-15% packs, +10% or",        {packDiscount:0.15,money:0.10}],
  [11, 0,3,98,"Archimaudit",       "+80% effets de malédiction, -12% packs",{curseBonus:0.80,packDiscount:0.12}],
]);

// ◈ JONCTION — Nœuds inter-branches (entre les étoiles + autour)
// Zones dans le sens horaire depuis la droite :
//   Zone 1 (30°)  Clubs ↔ Diamonds  : Rusheur  — vitesse att. + dépl.
//   Zone 2 (90°)  Diamonds ↔ Hearts : Tycoon   — or + PV
//   Zone 3 (150°) Hearts ↔ Spades   : Guerrier — dégâts + PV
//   Zone 4 (337°) Combat ↔ Clubs    : Commando — dégâts + vitesse att.
//   Zone 5 (292°) Poker ↔ Combat    : Stratège — dégâts + crit
//   Zone 6 (247°) Shop ↔ Poker      : Marchand — or + réduction packs
//   Zone 7 (202°) Spades ↔ Shop     : Revendeur — dégâts + bonus revente
const TALENT_INTER_NODES = [
  // Zone 1 — 30° (Clubs ↔ Diamonds)
  { id:"br-1a", x:242,  y:140,  tier:2, cost:35, region:"bridge", connections:[],
    name:"Ruée dévastatrice",   desc:"+4% vitesse att., +12 vitesse dépl.", effect:{attackSpeed:0.04, moveSpeed:12} },
  { id:"br-1b", x:329,  y:190,  tier:2, cost:45, region:"bridge", connections:[],
    name:"Torrent de vitesse",  desc:"+5% vitesse att., +18 vitesse dépl.", effect:{attackSpeed:0.05, moveSpeed:18} },
  { id:"br-1c", x:416,  y:240,  tier:3, cost:65, region:"bridge", connections:[],
    name:"Ouragan",             desc:"+10% vitesse att., +30 vitesse dépl.", effect:{attackSpeed:0.10, moveSpeed:30} },

  // Zone 2 — 90° (Diamonds ↔ Hearts)
  { id:"br-2a", x:0,    y:280,  tier:2, cost:35, region:"bridge", connections:[],
    name:"Capital vital",       desc:"+5% or, +12 PV",                      effect:{money:0.05, maxHp:12} },
  { id:"br-2b", x:0,    y:380,  tier:2, cost:45, region:"bridge", connections:[],
    name:"Fortune et santé",    desc:"+7% or, +18 PV",                      effect:{money:0.07, maxHp:18} },
  { id:"br-2c", x:0,    y:480,  tier:3, cost:65, region:"bridge", connections:[],
    name:"Baron prospère",      desc:"+12% or, +30 PV",                     effect:{money:0.12, maxHp:30} },

  // Zone 3 — 150° (Hearts ↔ Spades)
  { id:"br-3a", x:-242, y:140,  tier:2, cost:35, region:"bridge", connections:[],
    name:"Frappe résistante",   desc:"+4% dégâts, +12 PV",                  effect:{damage:0.04, maxHp:12} },
  { id:"br-3b", x:-329, y:190,  tier:2, cost:45, region:"bridge", connections:[],
    name:"Gladiateur",          desc:"+5% dégâts, +18 PV",                  effect:{damage:0.05, maxHp:18} },
  { id:"br-3c", x:-416, y:240,  tier:3, cost:65, region:"bridge", connections:[],
    name:"Champion",            desc:"+10% dégâts, +30 PV",                 effect:{damage:0.10, maxHp:30} },

  // Zone 4 — 337° (Combat ↔ Clubs)
  { id:"br-4a", x:259,  y:-107, tier:2, cost:35, region:"bridge", connections:[],
    name:"Assaut éclair",       desc:"+4% dégâts, +5% vitesse att.",        effect:{damage:0.04, attackSpeed:0.05} },
  { id:"br-4c", x:443,  y:-184, tier:3, cost:65, region:"bridge", connections:[],
    name:"Commando d'élite",    desc:"+8% dégâts, +10% vitesse att.",       effect:{damage:0.08, attackSpeed:0.10} },

  // Zone 5 — 292° (Poker ↔ Combat)
  { id:"br-5a", x:107,  y:-259, tier:2, cost:35, region:"bridge", connections:[],
    name:"Tactique implacable", desc:"+4% dégâts, +3% crit",                effect:{damage:0.04, critChance:0.03} },
  { id:"br-5c", x:184,  y:-443, tier:3, cost:65, region:"bridge", connections:[],
    name:"Stratège de guerre",  desc:"+8% dégâts, +8% crit",               effect:{damage:0.08, critChance:0.08} },

  // Zone 6 — 247° (Shop ↔ Poker)
  { id:"br-6a", x:-107, y:-259, tier:2, cost:35, region:"bridge", connections:[],
    name:"Investisseur stratège",desc:"+4% or, -4% packs",                  effect:{money:0.04, packDiscount:0.04} },
  { id:"br-6c", x:-184, y:-443, tier:3, cost:65, region:"bridge", connections:[],
    name:"Magnat calculateur",  desc:"+8% or, -8% packs, +4% fragments",   effect:{money:0.08, packDiscount:0.08, fragmentGain:0.04} },

  // Zone 7 — 202° (Spades ↔ Shop)
  { id:"br-7a", x:-259, y:-107, tier:2, cost:35, region:"bridge", connections:[],
    name:"Commerce sanglant",   desc:"+4% dégâts, +15% revente cartes",     effect:{damage:0.04, sellBonus:0.15} },
  { id:"br-7c", x:-443, y:-184, tier:3, cost:65, region:"bridge", connections:[],
    name:"Assassin marchand",   desc:"+8% dégâts, +25% revente cartes",     effect:{damage:0.08, sellBonus:0.25} },
];

// Assembler tous les nœuds
const TALENT_NODES_RAW = [
  ...TALENT_CENTER_NODES,
  ...TALENT_SPADES,
  ...TALENT_HEARTS,
  ...TALENT_DIAMONDS,
  ...TALENT_CLUBS,
  ...TALENT_POKER,
  ...TALENT_COMBAT,
  ...TALENT_SHOP,
  ...TALENT_INTER_NODES,
];

// Calcul automatique des connexions par proximité
(function buildConnections() {
  const maxDist = 210;
  const bridgeDist = 330;
  for (const a of TALENT_NODES_RAW) {
    for (const b of TALENT_NODES_RAW) {
      if (a.id >= b.id) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const sameRegion = a.region === b.region;
      const involvesCenter = a.region === "center" || b.region === "center";
      const involvesBridge = a.region === "bridge" || b.region === "bridge";
      const limit = (involvesCenter || involvesBridge) ? bridgeDist : maxDist;
      if (d <= limit && (sameRegion || involvesCenter || involvesBridge)) {
        a.connections.push(b.id);
        b.connections.push(a.id);
      }
    }
  }
})();

const TALENT_NODES = TALENT_NODES_RAW;

function talentNode(id) {
  return TALENT_NODES.find(n => n.id === id);
}

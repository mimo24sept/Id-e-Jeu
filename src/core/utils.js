function random(min, max) {
  return min + Math.random() * (max - min);
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function worldBounds() {
  return {
    left: -WORLD.width / 2,
    right: WORLD.width / 2,
    top: -WORLD.height / 2,
    bottom: WORLD.height / 2,
  };
}

// MAP_SHAPES : carré, cercle, croix, triangle — coordonnées monde
const MAP_CROSS_AW = 430;   // demi-largeur des bras
const MAP_CROSS_AHL = 1050; // demi-longueur horizontale (= WORLD.width/2)
const MAP_CROSS_AVL = 650;  // demi-longueur verticale (= WORLD.height/2)
const MAP_CIRCLE_R = 930;
// Triangle : sommet (0,-980), bas-gauche (-1500,860), bas-droit (1500,860)
const MAP_TRI = [[0, -980], [-1500, 860], [1500, 860]];

function isInsideMap(x, y, margin = 0) {
  const shape = state?.mapShape || "square";
  if (shape === "square") {
    const b = worldBounds();
    return x >= b.left + margin && x <= b.right - margin &&
           y >= b.top + margin && y <= b.bottom - margin;
  }
  if (shape === "circle") {
    return Math.hypot(x, y) <= MAP_CIRCLE_R - margin;
  }
  if (shape === "cross") {
    const aw = MAP_CROSS_AW - margin;
    const ahl = MAP_CROSS_AHL - margin;
    const avl = MAP_CROSS_AVL - margin;
    return (Math.abs(x) <= ahl && Math.abs(y) <= aw) ||
           (Math.abs(x) <= aw  && Math.abs(y) <= avl);
  }
  if (shape === "triangle") {
    const [[ax, ay], [bx, by], [cx, cy]] = MAP_TRI;
    const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by);
    const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy);
    const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }
  return true;
}

function clampToWorld(x, y, radius = 0) {
  const shape = state?.mapShape || "square";
  if (shape === "square") {
    const bounds = worldBounds();
    return {
      x: clamp(x, bounds.left + radius, bounds.right - radius),
      y: clamp(y, bounds.top + radius, bounds.bottom - radius),
    };
  }
  if (isInsideMap(x, y, radius)) return { x, y };
  // Recherche binaire vers (0,0) pour trouver le point limite
  let lo = 0, hi = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (isInsideMap(x * (1 - mid), y * (1 - mid), radius)) hi = mid;
    else lo = mid;
  }
  const t = (lo + hi) / 2;
  return { x: x * (1 - t), y: y * (1 - t) };
}

function controlLabel() {
  return keyboardLayout === "azerty" ? "ZQSD" : "WASD";
}

function updateControlsTip() {
  if (!ui.controlsTip) return;
  const touchCapable = navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches;
  ui.controlsTip.textContent = touchCapable ? `TACTILE · ${controlLabel()}` : `${controlLabel()} · Auto-fire`;
}

async function detectKeyboardLayout() {
  let detected = /^fr\b|^fr-|^be\b|^be-/i.test(navigator.language || "") ? "azerty" : "qwerty";

  try {
    const layoutMap = await navigator.keyboard?.getLayoutMap?.();
    const keyW = layoutMap?.get("KeyW")?.toLowerCase();
    const keyA = layoutMap?.get("KeyA")?.toLowerCase();
    const keyQ = layoutMap?.get("KeyQ")?.toLowerCase();
    if (keyW === "z" || keyA === "q" || keyQ === "a") {
      detected = "azerty";
    } else if (keyW === "w" || keyA === "a") {
      detected = "qwerty";
    }
  } catch {
    // Some browsers block layout reads; physical key codes still make both layouts playable.
  }

  keyboardLayout = detected;
  updateControlsTip();
}

function movementKeyFromEvent(event) {
  const byCode = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyW: "up",
    KeyZ: "up",
    KeyS: "down",
    KeyA: "left",
    KeyQ: "left",
    KeyD: "right",
  };
  const codeMatch = byCode[event.code];
  if (codeMatch) return codeMatch;

  const key = event.key.toLowerCase();
  const byKey = {
    arrowup: "up",
    arrowdown: "down",
    arrowleft: "left",
    arrowright: "right",
    w: "up",
    z: "up",
    s: "down",
    a: "left",
    q: "left",
    d: "right",
  };
  return byKey[key] || null;
}

function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable);
}

function saveTutorialProgress() {
  localStorage.setItem(TUTORIAL_STEPS_STORAGE_KEY, JSON.stringify([...tutorialSeenSteps]));
}

function isTutorialDone() {
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
}

function tutorialTarget(step) {
  return document.querySelector(step.selector);
}

function clearTutorialTarget() {
  document.querySelectorAll(".tutorial-target-active").forEach((element) => {
    element.classList.remove("tutorial-target-active");
  });
}

function isVisibleElement(element) {
  if (!element || element.classList.contains("is-hidden")) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function positionTutorialCard(step, target) {
  const rect = target.getBoundingClientRect();
  const padding = 8;
  const spotLeft = clamp(rect.left - padding, 8, window.innerWidth - 16);
  const spotTop = clamp(rect.top - padding, 8, window.innerHeight - 16);
  const spotWidth = clamp(rect.width + padding * 2, 54, window.innerWidth - spotLeft - 8);
  const spotHeight = clamp(rect.height + padding * 2, 54, window.innerHeight - spotTop - 8);

  ui.tutorialSpotlight.style.left = `${spotLeft}px`;
  ui.tutorialSpotlight.style.top = `${spotTop}px`;
  ui.tutorialSpotlight.style.width = `${spotWidth}px`;
  ui.tutorialSpotlight.style.height = `${spotHeight}px`;

  const markerSize = ui.tutorialMarker.getBoundingClientRect();
  const markerLeft = clamp(spotLeft + spotWidth - markerSize.width * 0.55, 12, window.innerWidth - markerSize.width - 12);
  const markerTop = clamp(spotTop - markerSize.height * 0.45, 12, window.innerHeight - markerSize.height - 12);
  ui.tutorialMarker.style.left = `${markerLeft}px`;
  ui.tutorialMarker.style.top = `${markerTop}px`;

  const cardRect = ui.tutorialCard.getBoundingClientRect();
  const gap = 14;
  const margin = 14;
  let left = rect.left;
  let top = rect.bottom + gap;
  if (top + cardRect.height > window.innerHeight - margin) {
    top = rect.top - cardRect.height - gap;
  }
  if (top < margin) {
    top = Math.min(window.innerHeight - cardRect.height - margin, rect.top + rect.height / 2 - cardRect.height / 2);
  }
  left = clamp(left, margin, window.innerWidth - cardRect.width - margin);
  top = clamp(top, margin, window.innerHeight - cardRect.height - margin);

  ui.tutorialCard.style.left = `${left}px`;
  ui.tutorialCard.style.top = `${top}px`;
}

function showActiveTutorialStep() {
  const step = TUTORIAL_STEPS[activeTutorialStep];
  const target = step ? tutorialTarget(step) : null;
  if (!step || !isVisibleElement(target)) {
    activeTutorialStep = null;
    ui.tutorial.classList.add("is-hidden");
    clearTutorialTarget();
    return;
  }

  ui.tutorialKicker.textContent = step.kicker;
  ui.tutorialTitle.textContent = step.title;
  ui.tutorialText.textContent = step.text;
  ui.tutorialAction.textContent = step.action || "REGARDE";
  ui.tutorialProgress.textContent = `${tutorialSeenSteps.size + 1} / ${Object.keys(TUTORIAL_STEPS).length}`;
  ui.closeTutorial.textContent = tutorialQueue.length > 0 ? "Suivant" : "OK";
  clearTutorialTarget();
  target.classList.add("tutorial-target-active");
  ui.tutorial.classList.remove("is-hidden");
  requestAnimationFrame(() => positionTutorialCard(step, target));
}

function showNextTutorialStep() {
  if (activeTutorialStep || isTutorialDone()) return;

  while (tutorialQueue.length > 0) {
    const nextStep = tutorialQueue.shift();
    if (tutorialSeenSteps.has(nextStep)) continue;
    const step = TUTORIAL_STEPS[nextStep];
    if (!step || !isVisibleElement(tutorialTarget(step))) continue;
    activeTutorialStep = nextStep;
    showActiveTutorialStep();
    return;
  }

  ui.tutorial.classList.add("is-hidden");
  clearTutorialTarget();
}

function queueTutorialSteps(stepIds, options = {}) {
  if (isTutorialDone() && !options.force) return;
  if (activeTutorialStep && !isVisibleElement(tutorialTarget(TUTORIAL_STEPS[activeTutorialStep]))) {
    tutorialSeenSteps.add(activeTutorialStep);
    saveTutorialProgress();
    activeTutorialStep = null;
  }

  for (const stepId of stepIds) {
    if (!TUTORIAL_STEPS[stepId]) continue;
    if (!options.force && tutorialSeenSteps.has(stepId)) continue;
    if (activeTutorialStep === stepId || tutorialQueue.includes(stepId)) continue;
    tutorialQueue.push(stepId);
  }

  requestAnimationFrame(showNextTutorialStep);
}

function completeTutorialStep() {
  if (!activeTutorialStep) {
    showNextTutorialStep();
    return;
  }
  tutorialSeenSteps.add(activeTutorialStep);
  saveTutorialProgress();
  if (tutorialSeenSteps.size >= Object.keys(TUTORIAL_STEPS).length) {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
  }
  activeTutorialStep = null;
  ui.tutorial.classList.add("is-hidden");
  clearTutorialTarget();
  showNextTutorialStep();
}

function skipTutorial() {
  Object.keys(TUTORIAL_STEPS).forEach((stepId) => tutorialSeenSteps.add(stepId));
  saveTutorialProgress();
  localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
  tutorialQueue = [];
  activeTutorialStep = null;
  ui.tutorial.classList.add("is-hidden");
  clearTutorialTarget();
}

function replayTutorial() {
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  tutorialSeenSteps = new Set();
  saveTutorialProgress();
  tutorialQueue = [];
  activeTutorialStep = null;
  queueTutorialSteps(["menuConnect", "menuPlay", "menuFragments", "menuTalents"], { force: true });
}

function uniqueId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  nextId += 1;
  return `${prefix}-${Date.now()}-${nextId}-${Math.random().toString(36).slice(2)}`;
}

function cardKey(card) {
  return `${card.rank}-${card.suit}`;
}

function usedCardKeys(extraCards = []) {
  const keys = new Set(state?.hand.map(cardKey) || []);
  for (const slot of state?.shopSlots || []) {
    if (slot.type === "card" && !slot.bought) {
      keys.add(cardKey(slot.card));
    }
  }
  for (const card of state?.packOffer || []) {
    if (card.suit && card.rank) keys.add(cardKey(card));
  }
  extraCards.forEach((card) => keys.add(cardKey(card)));
  return keys;
}

function resizeCanvas() {
  const scale = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}



function clearTouchMovement() {
  touchMovement.x = 0;
  touchMovement.y = 0;
  touchMovement.pointerId = null;
  if (ui.mobileStickKnob) {
    ui.mobileStickKnob.style.transform = "translate(-50%, -50%)";
  }
}

function setTouchMovementFromPointer(event) {
  const rect = ui.mobileStick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxDistance = rect.width * 0.36;
  const rawX = event.clientX - centerX;
  const rawY = event.clientY - centerY;
  const distance = Math.hypot(rawX, rawY);
  const clampedDistance = Math.min(distance, maxDistance);
  const angle = Math.atan2(rawY, rawX);
  const knobX = Math.cos(angle) * clampedDistance;
  const knobY = Math.sin(angle) * clampedDistance;

  touchMovement.x = maxDistance > 0 ? knobX / maxDistance : 0;
  touchMovement.y = maxDistance > 0 ? knobY / maxDistance : 0;
  ui.mobileStickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
}

function shouldShowMobileControls() {
  return Boolean(
    state &&
      !state.betweenWaves &&
      !state.gameOver &&
      ui.mainMenu.classList.contains("is-hidden") &&
      ui.characterSelect.classList.contains("is-hidden") &&
      ui.shop.classList.contains("is-hidden") &&
      ui.gameOver.classList.contains("is-hidden"),
  );
}

function updateMobileControlsVisibility() {
  if (!ui.mobileControls) return;
  const visible = shouldShowMobileControls();
  ui.mobileControls.classList.toggle("is-hidden", !visible);
  if (!visible) clearTouchMovement();
}

function bindMobileControls() {
  if (!ui.mobileStick) return;

  ui.mobileStick.addEventListener("pointerdown", (event) => {
    if (!shouldShowMobileControls()) return;
    event.preventDefault();
    touchMovement.pointerId = event.pointerId;
    ui.mobileStick.setPointerCapture(event.pointerId);
    setTouchMovementFromPointer(event);
  });

  ui.mobileStick.addEventListener("pointermove", (event) => {
    if (event.pointerId !== touchMovement.pointerId) return;
    event.preventDefault();
    setTouchMovementFromPointer(event);
  });

  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    ui.mobileStick.addEventListener(eventName, (event) => {
      if (event.pointerId !== touchMovement.pointerId && eventName !== "lostpointercapture") return;
      clearTouchMovement();
    });
  }
}

bindMobileControls();



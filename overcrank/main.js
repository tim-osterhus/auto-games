const shell = {
  bootState: document.querySelector("#boot-state"),
  statusMessage: document.querySelector("#status-message"),
  heightValue: document.querySelector("#height-value"),
  scoreValue: document.querySelector("#score-value"),
  bestScoreValue: document.querySelector("#best-score-value"),
  comboValue: document.querySelector("#combo-value"),
  heatStatusValue: document.querySelector("#heat-status-value"),
  statusReadout: document.querySelector("#status-readout"),
  chainReadout: document.querySelector("#chain-readout"),
  failureReadout: document.querySelector("#failure-readout"),
  viewportShell: document.querySelector("#viewport-shell"),
  gameViewport: document.querySelector("#game-viewport"),
  gameCanvas: document.querySelector("#game-canvas"),
  feedbackFlash: document.querySelector("#feedback-flash"),
  hazardBanner: document.querySelector("#hazard-banner"),
  feedbackCallout: document.querySelector("#feedback-callout"),
  gameOverlay: document.querySelector("#game-overlay"),
  overlayEyebrow: document.querySelector("#overlay-eyebrow"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlayCopy: document.querySelector("#overlay-copy"),
};

const missingElements = Object.entries(shell)
  .filter(([, element]) => !element)
  .map(([key]) => key);

if (missingElements.length > 0) {
  throw new Error(`Overcrank shell is missing required elements: ${missingElements.join(", ")}`);
}

const config = {
  width: 360,
  height: 640,
  wallWidth: 34,
  floorY: 34,
  playerWidth: 28,
  playerHeight: 28,
  moveSpeed: 230,
  airControl: 0.16,
  jumpVelocity: 540,
  wallJumpX: 290,
  wallJumpY: 575,
  gravity: 1320,
  wallSlideSpeed: 190,
  maxFallSpeed: 760,
  cameraLead: 180,
  heatStart: -220,
  heatBaseSpeed: 36,
  heatRamp: 8,
  platformHeight: 12,
  segmentHeight: 180,
  generateAhead: 980,
  cleanupBelow: 320,
  coolantPush: 120,
  coolantSlowDuration: 3.6,
  ventTelegraph: 0.9,
  ventActive: 1.1,
  comboGrace: 1.15,
  comboStep: 52,
  scorePerMeter: 12,
  comboBonusStep: 0.35,
};

const BEST_SCORE_STORAGE_KEY = "millrace.overcrank.best-score";
const FEEDBACK_COPY = {
  launch: { title: "Launch", copy: "Clean ignition. Keep your upward line live." },
  landing: { title: "Hard landing", copy: "Absorb the hit and jump again before the chain drops." },
  combo: { title: "Chain up", copy: "Multiplier climbing. Keep the rig moving upward." },
  failureHeat: { title: "Heat breach", copy: "The heat line reached the runner. Restart from a cold floor." },
  failureSteam: { title: "Steam contact", copy: "Vent plume contact ended the run. Watch the warning flash." },
  collapse: { title: "Platform collapse", copy: "Crumble deck giving way. Clear it now." },
  steam: { title: "Steam warning", copy: "Vent flash detected. Shift lanes before ignition." },
};

const canvas = shell.gameCanvas;
const context = canvas.getContext("2d");

function createPlayer() {
  return {
    x: config.width * 0.5 - config.playerWidth * 0.5,
    y: config.floorY,
    vx: 0,
    vy: 0,
    onGround: true,
    onWall: null,
    platformId: null,
  };
}

function loadBestScore() {
  try {
    const rawValue = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    if (!rawValue) {
      return 0;
    }

    const parsed = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch (error) {
    return 0;
  }
}

function persistBestScore(score) {
  try {
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(score));
  } catch (error) {
    // Local storage access can fail in restricted contexts; keep runtime alive.
  }
}

const state = {
  mode: "intro",
  cameraY: 0,
  highestY: config.floorY,
  heatY: config.heatStart,
  lastTime: 0,
  nextEntityId: 1,
  segmentIndex: 0,
  generatedToY: config.floorY,
  keys: {
    left: false,
    right: false,
  },
  score: 0,
  scoreBank: 0,
  bestScore: loadBestScore(),
  chainCount: 0,
  chainProgress: 0,
  comboTimer: 0,
  coolantSlowTimer: 0,
  coolantPulse: 0,
  platforms: [],
  vents: [],
  pickups: [],
  failReason: null,
  feedback: {
    flashTone: "",
    flashTimer: 0,
    calloutTone: "",
    calloutTimer: 0,
    calloutTitle: "",
    calloutCopy: "",
    hazardTone: "",
    hazardTimer: 0,
    hazardTitle: "",
    hazardCopy: "",
    comboMilestone: 0,
    warnedVentIds: new Set(),
    warnedCollapseIds: new Set(),
  },
  player: createPlayer(),
};

function showFlash(tone, duration = 0.18) {
  state.feedback.flashTone = tone;
  state.feedback.flashTimer = Math.max(state.feedback.flashTimer, duration);
}

function showCallout(tone, title, copy, duration = 0.7) {
  state.feedback.calloutTone = tone;
  state.feedback.calloutTitle = title;
  state.feedback.calloutCopy = copy;
  state.feedback.calloutTimer = duration;
  showFlash(tone, Math.min(duration, 0.26));
}

function showPresetCallout(key, duration) {
  const preset = FEEDBACK_COPY[key];
  if (!preset) {
    return;
  }
  showCallout(
    key === "failureHeat" || key === "failureSteam" ? "failure" : key,
    preset.title,
    preset.copy,
    duration
  );
}

function showHazardBanner(tone, title, copy, duration = 0.9) {
  state.feedback.hazardTone = tone;
  state.feedback.hazardTitle = title;
  state.feedback.hazardCopy = copy;
  state.feedback.hazardTimer = Math.max(state.feedback.hazardTimer, duration);
  showFlash(tone, 0.2);
}

function updateFeedbackLayer() {
  if (state.feedback.flashTimer > 0 && state.feedback.flashTone) {
    shell.feedbackFlash.dataset.tone = state.feedback.flashTone;
    shell.feedbackFlash.classList.remove("is-hidden");
  } else {
    shell.feedbackFlash.classList.add("is-hidden");
    delete shell.feedbackFlash.dataset.tone;
  }

  if (state.feedback.hazardTimer > 0 && state.feedback.hazardTitle) {
    shell.hazardBanner.dataset.tone = state.feedback.hazardTone;
    shell.hazardBanner.innerHTML = `<p class="feedback-title">${state.feedback.hazardTitle}</p><p class="feedback-copy">${state.feedback.hazardCopy}</p>`;
    shell.hazardBanner.classList.remove("is-hidden");
  } else {
    shell.hazardBanner.classList.add("is-hidden");
    shell.hazardBanner.textContent = "";
    delete shell.hazardBanner.dataset.tone;
  }

  if (state.feedback.calloutTimer > 0 && state.feedback.calloutTitle) {
    shell.feedbackCallout.dataset.tone = state.feedback.calloutTone;
    shell.feedbackCallout.innerHTML = `<p class="feedback-title">${state.feedback.calloutTitle}</p><p class="feedback-copy">${state.feedback.calloutCopy}</p>`;
    shell.feedbackCallout.classList.remove("is-hidden");
  } else {
    shell.feedbackCallout.classList.add("is-hidden");
    shell.feedbackCallout.textContent = "";
    delete shell.feedbackCallout.dataset.tone;
  }
}

function stepFeedback(dt) {
  state.feedback.flashTimer = Math.max(0, state.feedback.flashTimer - dt);
  state.feedback.calloutTimer = Math.max(0, state.feedback.calloutTimer - dt);
  state.feedback.hazardTimer = Math.max(0, state.feedback.hazardTimer - dt);

  if (state.feedback.flashTimer === 0) {
    state.feedback.flashTone = "";
  }
  if (state.feedback.calloutTimer === 0) {
    state.feedback.calloutTone = "";
    state.feedback.calloutTitle = "";
    state.feedback.calloutCopy = "";
  }
  if (state.feedback.hazardTimer === 0) {
    state.feedback.hazardTone = "";
    state.feedback.hazardTitle = "";
    state.feedback.hazardCopy = "";
  }

  updateFeedbackLayer();
}

function setOverlay(eyebrow, title, copy) {
  shell.overlayEyebrow.textContent = eyebrow;
  shell.overlayTitle.textContent = title;
  shell.overlayCopy.textContent = copy;
}

function updateOverlay() {
  if (state.mode === "running") {
    shell.gameOverlay.classList.add("is-hidden");
    return;
  }

  shell.gameOverlay.classList.remove("is-hidden");

  if (state.mode === "intro") {
    setOverlay(
      "Start run",
      "Ignite the rig",
      "Press Space, W, Up, A, D, or the arrow keys to start. Ride lifts, avoid steam bursts, grab coolant, and keep a live score chain by climbing without stalling."
    );
    return;
  }

  if (state.failReason === "steam") {
    setOverlay(
      "Run failed",
      "Steam contact",
      "A live vent plume caught the runner. Press any movement key or jump key to restart, watch the warning flash, and clear the next lane earlier."
    );
    return;
  }

  setOverlay(
    "Run failed",
    "Heat breach",
    "The heat line reached the runner. Press any movement key or jump key to restart with a clean score run and stay ahead of the rising floor."
  );
}

function updateHud() {
  const altitude = Math.max(0, Math.round((state.highestY - config.floorY) / 10));
  const heatGap = Math.max(0, state.player.y - state.heatY);
  const heatPercent = Math.max(0, Math.min(100, Math.round(100 - heatGap / 4.8)));
  const coolantSeconds = Math.max(0, state.coolantSlowTimer);
  const heatState =
    coolantSeconds > 0
      ? "coolant"
      : heatPercent >= 85
        ? "critical"
        : heatPercent >= 60
          ? "rising"
          : "stable";
  const chainLabel = state.chainCount > 0 ? `x${state.chainCount}` : "x0";

  shell.statusMessage.textContent =
    state.mode === "intro"
      ? "Stand by. One key press starts the climb and begins scoring."
      : state.mode === "running"
        ? coolantSeconds > 0
          ? `Coolant surge live for ${coolantSeconds.toFixed(1)}s. The heat line is backing off while the chain stays open.`
          : "Climb clean, read steam telegraphs, and keep the chain alive with steady upward gain."
        : "Heat contact detected. Any movement or jump key restarts.";
  shell.heightValue.textContent = `${altitude} m`;
  shell.scoreValue.textContent = `${state.score}`;
  shell.bestScoreValue.textContent = `${state.bestScore}`;
  shell.comboValue.textContent = chainLabel;
  shell.heatStatusValue.textContent = `${heatPercent}% ${heatState}`;
  shell.statusReadout.textContent =
    state.mode === "intro"
      ? "Awaiting ignition"
      : state.mode === "running"
        ? `Run live at ${altitude} m with ${state.vents.filter((vent) => isVentActive(vent)).length} hot vents`
        : `Run ended at ${altitude} m with ${state.score} points`;
  shell.chainReadout.textContent =
    state.mode === "intro"
      ? "Start climbing to light the chain"
      : state.mode === "running"
        ? state.chainCount > 0
          ? `Chain open for ${state.comboTimer.toFixed(1)}s. Keep rising to hold ${chainLabel}.`
          : "Find an upward line to start the score chain."
        : state.chainCount > 0
          ? `Final chain held at ${chainLabel}. Restart to build past it.`
          : "Chain broken. Restart and keep the climb continuous.";
  shell.failureReadout.textContent =
    state.mode === "gameover"
      ? state.failReason === "steam"
        ? "Failure logged: steam plume contact."
        : "Failure logged: heat-line contact."
      : coolantSeconds > 0
        ? "Coolant is live, but steam and heat still end the run."
        : "Steam contact or heat-line contact ends the run.";
  shell.gameViewport.dataset.mode = state.mode;
  shell.gameViewport.dataset.failure = state.mode === "gameover" ? state.failReason ?? "heat" : "none";
}

function nextId() {
  const id = state.nextEntityId;
  state.nextEntityId += 1;
  return id;
}

function getPlatformById(id) {
  return state.platforms.find((platform) => platform.id === id) || null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createPlatform(y, type, lane, width, extra = {}) {
  const minX = config.wallWidth + 6;
  const shaftWidth = config.width - config.wallWidth * 2 - 12;
  const x = minX + lane * shaftWidth;
  return {
    id: nextId(),
    type,
    x,
    y,
    width,
    height: config.platformHeight,
    active: true,
    crumbleTimer: extra.crumbleTimer ?? 0,
    movingRange: extra.movingRange ?? 0,
    movingSpeed: extra.movingSpeed ?? 0,
    movingPhase: extra.movingPhase ?? 0,
    baseX: extra.baseX ?? x,
    deltaX: 0,
    previousX: x,
  };
}

function createVent(y, side, extra = {}) {
  const width = 72;
  const x =
    side === "left"
      ? config.wallWidth + 6
      : config.width - config.wallWidth - width - 6;

  return {
    id: nextId(),
    x,
    y,
    width,
    plumeHeight: extra.plumeHeight ?? 108,
    cycleOffset: extra.cycleOffset ?? 0,
  };
}

function createPickup(y, lane, extra = {}) {
  const shaftWidth = config.width - config.wallWidth * 2 - 56;
  return {
    id: nextId(),
    x: config.wallWidth + 28 + lane * shaftWidth,
    y,
    radius: 10,
    collected: false,
    bobPhase: extra.bobPhase ?? 0,
  };
}

function addSegment(baseY, index) {
  const segmentBase = baseY;
  const pattern = index % 4;
  const laneA = (index % 3) * 0.18;
  const laneB = ((index + 1) % 3) * 0.2 + 0.36;
  const laneC = 0.68 - (index % 2) * 0.08;

  if (pattern === 0) {
    state.platforms.push(createPlatform(segmentBase + 46, "stable", laneA, 96));
    state.platforms.push(createPlatform(segmentBase + 104, "crumble", laneB, 80, { crumbleTimer: 0.55 }));
    state.platforms.push(createPlatform(segmentBase + 154, "stable", laneC, 92));
    state.vents.push(createVent(segmentBase + 42, index % 2 === 0 ? "right" : "left", { plumeHeight: 96, cycleOffset: 0.8 }));
    state.pickups.push(createPickup(segmentBase + 142, 0.46, { bobPhase: index * 0.7 }));
    return;
  }

  if (pattern === 1) {
    state.platforms.push(createPlatform(segmentBase + 40, "stable", laneC, 90));
    state.platforms.push(
      createPlatform(segmentBase + 96, "moving", 0.28, 84, {
        movingRange: 96,
        movingSpeed: 1.3,
        movingPhase: index * 0.9,
        baseX: config.wallWidth + 26,
      })
    );
    state.platforms.push(createPlatform(segmentBase + 152, "stable", 0.58, 88));
    state.pickups.push(createPickup(segmentBase + 120, 0.16, { bobPhase: index * 0.5 }));
    return;
  }

  if (pattern === 2) {
    state.platforms.push(createPlatform(segmentBase + 48, "crumble", 0.12, 84, { crumbleTimer: 0.42 }));
    state.platforms.push(createPlatform(segmentBase + 98, "stable", 0.52, 94));
    state.platforms.push(createPlatform(segmentBase + 150, "moving", 0.18, 82, {
      movingRange: 82,
      movingSpeed: 1.55,
      movingPhase: 1.4 + index * 0.4,
      baseX: config.wallWidth + 30,
    }));
    state.vents.push(createVent(segmentBase + 94, "right", { plumeHeight: 118, cycleOffset: 1.6 }));
    return;
  }

  state.platforms.push(createPlatform(segmentBase + 44, "stable", 0.62, 98));
  state.platforms.push(createPlatform(segmentBase + 102, "stable", 0.2, 90));
  state.platforms.push(createPlatform(segmentBase + 150, "crumble", 0.5, 76, { crumbleTimer: 0.5 }));
  state.vents.push(createVent(segmentBase + 40, "left", { plumeHeight: 86, cycleOffset: 0.2 }));
  state.pickups.push(createPickup(segmentBase + 162, 0.7, { bobPhase: index }));
}

function ensureContent(targetY) {
  while (state.generatedToY < targetY) {
    addSegment(state.generatedToY, state.segmentIndex);
    state.generatedToY += config.segmentHeight;
    state.segmentIndex += 1;
  }
}

function isVentActive(vent) {
  const cycle = config.ventTelegraph + config.ventActive + 1.4;
  const phase = (performance.now() / 1000 + vent.cycleOffset) % cycle;
  return phase >= config.ventTelegraph && phase < config.ventTelegraph + config.ventActive;
}

function isVentTelegraphing(vent) {
  const cycle = config.ventTelegraph + config.ventActive + 1.4;
  const phase = (performance.now() / 1000 + vent.cycleOffset) % cycle;
  return phase < config.ventTelegraph;
}

function resetRun(mode = "intro") {
  state.mode = mode;
  state.cameraY = 0;
  state.highestY = config.floorY;
  state.heatY = config.heatStart;
  state.lastTime = 0;
  state.nextEntityId = 1;
  state.segmentIndex = 0;
  state.generatedToY = config.floorY;
  state.score = 0;
  state.scoreBank = 0;
  state.chainCount = 0;
  state.chainProgress = 0;
  state.comboTimer = 0;
  state.coolantSlowTimer = 0;
  state.coolantPulse = 0;
  state.keys.left = false;
  state.keys.right = false;
  state.platforms = [];
  state.vents = [];
  state.pickups = [];
  state.failReason = null;
  state.feedback.flashTone = "";
  state.feedback.flashTimer = 0;
  state.feedback.calloutTone = "";
  state.feedback.calloutTimer = 0;
  state.feedback.calloutTitle = "";
  state.feedback.calloutCopy = "";
  state.feedback.hazardTone = "";
  state.feedback.hazardTimer = 0;
  state.feedback.hazardTitle = "";
  state.feedback.hazardCopy = "";
  state.feedback.comboMilestone = 0;
  state.feedback.warnedVentIds = new Set();
  state.feedback.warnedCollapseIds = new Set();
  state.player = createPlayer();
  ensureContent(config.height + config.generateAhead);
  updateOverlay();
  updateHud();
  updateFeedbackLayer();
  draw();
}

function startRun() {
  resetRun("running");
  shell.bootState.textContent = "Run live";
  shell.viewportShell.dataset.boot = "running";
}

function failRun(reason = "heat") {
  state.mode = "gameover";
  state.failReason = reason;
  state.player.vx = 0;
  state.player.vy = 0;
  state.feedback.hazardTone = "";
  state.feedback.hazardTimer = 0;
  state.feedback.hazardTitle = "";
  state.feedback.hazardCopy = "";
  syncBestScore();
  shell.bootState.textContent = "Overheat";
  if (reason === "steam") {
    showPresetCallout("failureSteam", 1.8);
  } else {
    showPresetCallout("failureHeat", 1.8);
  }
  updateOverlay();
  updateHud();
  updateFeedbackLayer();
  draw();
}

function syncBestScore() {
  if (state.score <= state.bestScore) {
    return;
  }

  state.bestScore = state.score;
  persistBestScore(state.bestScore);
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(config.width * ratio);
  canvas.height = Math.round(config.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}

function handleAction() {
  if (state.mode !== "running") {
    startRun();
    return;
  }

  if (state.player.onGround) {
    state.player.vy = config.jumpVelocity;
    state.player.onGround = false;
    state.player.platformId = null;
    showPresetCallout("launch");
    return;
  }

  if (state.player.onWall === "left") {
    state.player.vx = config.wallJumpX;
    state.player.vy = config.wallJumpY;
    showPresetCallout("launch");
    return;
  }

  if (state.player.onWall === "right") {
    state.player.vx = -config.wallJumpX;
    state.player.vy = config.wallJumpY;
    showPresetCallout("launch");
  }
}

function onKeyChange(event, pressed) {
  const { code } = event;

  if (code === "ArrowLeft" || code === "KeyA") {
    state.keys.left = pressed;
  } else if (code === "ArrowRight" || code === "KeyD") {
    state.keys.right = pressed;
  } else if ((code === "Space" || code === "ArrowUp" || code === "KeyW") && pressed && !event.repeat) {
    event.preventDefault();
    handleAction();
  }

  if (pressed && !event.repeat && (code === "ArrowLeft" || code === "KeyA" || code === "ArrowRight" || code === "KeyD")) {
    handleAction();
  }
}

function updateMovingPlatforms(dt) {
  for (const platform of state.platforms) {
    if (platform.type !== "moving" || platform.active === false) {
      continue;
    }

    platform.previousX = platform.x;
    platform.movingPhase += dt * platform.movingSpeed;
    platform.x = platform.baseX + Math.sin(platform.movingPhase) * platform.movingRange;
    platform.x = clamp(platform.x, config.wallWidth + 6, config.width - config.wallWidth - platform.width - 6);
    platform.deltaX = platform.x - platform.previousX;
  }
}

function applyPlatformCarry() {
  const platform = getPlatformById(state.player.platformId);
  if (!platform || platform.type !== "moving" || platform.active === false) {
    return;
  }

  state.player.x += platform.deltaX;
}

function resolvePlatformLanding(prevY) {
  const player = state.player;
  if (player.vy > 0) {
    return;
  }

  for (const platform of state.platforms) {
    if (platform.active === false) {
      continue;
    }

    const topY = platform.y;
    const overlapX =
      player.x + config.playerWidth > platform.x + 4 && player.x < platform.x + platform.width - 4;

    if (!overlapX) {
      continue;
    }

    if (prevY >= topY && player.y <= topY) {
      const landingSpeed = Math.abs(player.vy);
      player.y = topY;
      player.vy = 0;
      player.onGround = true;
      player.platformId = platform.id;

      if (platform.type === "crumble" && platform.crumbleTimer > 0) {
        platform.crumbleTimer -= 1 / 60;
      }
      if (landingSpeed >= 360) {
        showPresetCallout("landing", 0.85);
      }

      return;
    }
  }
}

function updatePlatforms(dt) {
  for (const platform of state.platforms) {
    if (
      platform.type === "crumble" &&
      platform.active !== false &&
      state.player.platformId === platform.id &&
      platform.crumbleTimer <= 0.2 &&
      !state.feedback.warnedCollapseIds.has(platform.id)
    ) {
      state.feedback.warnedCollapseIds.add(platform.id);
      showHazardBanner("collapse", FEEDBACK_COPY.collapse.title, FEEDBACK_COPY.collapse.copy, 0.95);
    }

    if (platform.type === "crumble" && platform.active !== false && platform.crumbleTimer <= 0) {
      platform.active = false;
      showHazardBanner("collapse", FEEDBACK_COPY.collapse.title, FEEDBACK_COPY.collapse.copy, 0.7);
      if (state.player.platformId === platform.id) {
        state.player.platformId = null;
        state.player.onGround = false;
      }
    }

    if (platform.type === "crumble" && platform.active !== false && state.player.platformId === platform.id) {
      platform.crumbleTimer -= dt;
    }
  }
}

function updateHazardsAndPickups(dt) {
  const playerLeft = state.player.x;
  const playerRight = state.player.x + config.playerWidth;
  const playerBottom = state.player.y;
  const playerTop = state.player.y + config.playerHeight;

  for (const vent of state.vents) {
    const ventNearPlayer = Math.abs(vent.y - state.player.y) < 150;
    if (ventNearPlayer && isVentTelegraphing(vent) && !state.feedback.warnedVentIds.has(vent.id)) {
      state.feedback.warnedVentIds.add(vent.id);
      showHazardBanner("warning", FEEDBACK_COPY.steam.title, FEEDBACK_COPY.steam.copy, config.ventTelegraph);
    }

    if (!isVentTelegraphing(vent)) {
      state.feedback.warnedVentIds.delete(vent.id);
    }

    if (!isVentActive(vent)) {
      continue;
    }

    const plumeTop = vent.y + vent.plumeHeight;
    const overlapX = playerRight > vent.x && playerLeft < vent.x + vent.width;
    const overlapY = playerTop > vent.y && playerBottom < plumeTop;
    if (overlapX && overlapY) {
      failRun("steam");
      return;
    }
  }

  for (const pickup of state.pickups) {
    if (pickup.collected) {
      continue;
    }

    const dx = state.player.x + config.playerWidth * 0.5 - pickup.x;
    const dy = state.player.y + config.playerHeight * 0.5 - pickup.y;
    if (dx * dx + dy * dy <= (pickup.radius + 14) * (pickup.radius + 14)) {
      pickup.collected = true;
      state.heatY -= config.coolantPush;
      state.coolantSlowTimer = Math.max(state.coolantSlowTimer, config.coolantSlowDuration);
      state.coolantPulse = 0.85;
    }
  }

  state.coolantSlowTimer = Math.max(0, state.coolantSlowTimer - dt);
  state.coolantPulse = Math.max(0, state.coolantPulse - dt);
}

function updateScore(dt, previousHighestY) {
  const climbed = Math.max(0, state.highestY - previousHighestY);

  if (climbed > 0) {
    state.chainCount = Math.max(1, state.chainCount);
    state.chainProgress += climbed;
    state.comboTimer = config.comboGrace;

    while (state.chainProgress >= config.comboStep) {
      state.chainProgress -= config.comboStep;
      state.chainCount += 1;
      if (state.chainCount > state.feedback.comboMilestone) {
        state.feedback.comboMilestone = state.chainCount;
        showPresetCallout("combo", 0.95);
      }
    }

    const multiplier = 1 + Math.max(0, state.chainCount - 1) * config.comboBonusStep;
    state.scoreBank += (climbed / 10) * config.scorePerMeter * multiplier;
    state.score = Math.round(state.scoreBank);
    syncBestScore();
    return;
  }

  if (state.chainCount === 0) {
    return;
  }

  state.comboTimer = Math.max(0, state.comboTimer - dt);
  if (state.comboTimer === 0) {
    state.chainCount = 0;
    state.chainProgress = 0;
  }
}

function cleanupContent() {
  const threshold = state.cameraY - config.cleanupBelow;
  state.platforms = state.platforms.filter(
    (platform) => platform.y > threshold || platform.id === state.player.platformId
  );
  state.vents = state.vents.filter((vent) => vent.y + vent.plumeHeight > threshold);
  state.pickups = state.pickups.filter((pickup) => pickup.collected || pickup.y > threshold);
}

function update(dt) {
  const player = state.player;
  const prevY = player.y;
  const input = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
  const targetVelocity = input * config.moveSpeed;
  const control = player.onGround ? 1 : config.airControl;

  updateMovingPlatforms(dt);
  if (player.onGround) {
    applyPlatformCarry();
  }

  player.vx += (targetVelocity - player.vx) * Math.min(1, control * 10 * dt);
  player.vy = Math.max(player.vy - config.gravity * dt, -config.maxFallSpeed);
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.onGround = false;
  player.onWall = null;
  player.platformId = null;

  if (player.y <= config.floorY) {
    player.y = config.floorY;
    player.vy = 0;
    player.onGround = true;
  }

  resolvePlatformLanding(prevY);

  const minX = config.wallWidth;
  const maxX = config.width - config.wallWidth - config.playerWidth;

  if (player.x <= minX) {
    player.x = minX;
    if (player.vx < 0) {
      player.vx = 0;
    }
    if (!player.onGround) {
      player.onWall = "left";
    }
  } else if (player.x >= maxX) {
    player.x = maxX;
    if (player.vx > 0) {
      player.vx = 0;
    }
    if (!player.onGround) {
      player.onWall = "right";
    }
  }

  if (player.onWall && player.vy < -config.wallSlideSpeed) {
    player.vy = -config.wallSlideSpeed;
  }

  updatePlatforms(dt);
  updateHazardsAndPickups(dt);
  if (state.mode !== "running") {
    return;
  }

  const previousHighestY = state.highestY;
  state.highestY = Math.max(state.highestY, player.y);
  updateScore(dt, previousHighestY);
  state.cameraY = Math.max(0, state.highestY - config.cameraLead);
  ensureContent(state.highestY + config.generateAhead);
  cleanupContent();

  const heatSpeedMultiplier = state.coolantSlowTimer > 0 ? 0.42 : 1;
  state.heatY += (config.heatBaseSpeed + (state.cameraY / 220) * config.heatRamp) * dt * heatSpeedMultiplier;

  if (player.y <= state.heatY + 10) {
    failRun("heat");
  }
}

function renderWorldY(worldY) {
  return config.height - (worldY - state.cameraY);
}

function drawPlatform(platform) {
  if (platform.active === false) {
    return;
  }

  const screenY = renderWorldY(platform.y);
  let fill = "#596b78";
  let stroke = "rgba(255, 255, 255, 0.08)";

  if (platform.type === "crumble") {
    const urgency = clamp(platform.crumbleTimer / 0.55, 0, 1);
    fill = `rgba(${Math.round(214 + (1 - urgency) * 22)}, ${Math.round(158 - (1 - urgency) * 60)}, 105, 0.95)`;
    stroke = "rgba(255, 220, 184, 0.26)";
  } else if (platform.type === "moving") {
    fill = "#74d0ff";
    stroke = "rgba(198, 239, 255, 0.32)";
  }

  context.fillStyle = fill;
  context.fillRect(platform.x, screenY - platform.height, platform.width, platform.height);
  context.strokeStyle = stroke;
  context.lineWidth = 2;
  context.strokeRect(platform.x, screenY - platform.height, platform.width, platform.height);

  if (platform.type === "moving") {
    context.strokeStyle = "rgba(116, 208, 255, 0.22)";
    context.setLineDash([6, 6]);
    context.beginPath();
    context.moveTo(platform.baseX, screenY - platform.height * 0.5);
    context.lineTo(platform.baseX + platform.movingRange, screenY - platform.height * 0.5);
    context.stroke();
    context.setLineDash([]);
  }
}

function drawVent(vent) {
  const baseY = renderWorldY(vent.y);
  const telegraph = isVentTelegraphing(vent);
  const active = isVentActive(vent);

  context.fillStyle = telegraph ? "rgba(255, 190, 120, 0.7)" : "rgba(255, 98, 56, 0.5)";
  context.fillRect(vent.x, baseY - 8, vent.width, 8);

  if (!telegraph && !active) {
    return;
  }

  const plumeTop = renderWorldY(vent.y + vent.plumeHeight);
  const gradient = context.createLinearGradient(0, plumeTop, 0, baseY);
  if (active) {
    gradient.addColorStop(0, "rgba(255, 190, 120, 0.04)");
    gradient.addColorStop(0.45, "rgba(255, 154, 92, 0.22)");
    gradient.addColorStop(1, "rgba(255, 98, 56, 0.72)");
  } else {
    gradient.addColorStop(0, "rgba(255, 230, 180, 0.02)");
    gradient.addColorStop(1, "rgba(255, 214, 163, 0.28)");
  }

  context.fillStyle = gradient;
  context.fillRect(vent.x, plumeTop, vent.width, baseY - plumeTop);
}

function drawPickup(pickup, time) {
  if (pickup.collected) {
    return;
  }

  const bob = Math.sin(time * 2.8 + pickup.bobPhase) * 4;
  const screenY = renderWorldY(pickup.y + bob);
  context.fillStyle = "rgba(116, 208, 255, 0.18)";
  context.beginPath();
  context.arc(pickup.x, screenY, pickup.radius + 6, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#8fe7ff";
  context.beginPath();
  context.arc(pickup.x, screenY, pickup.radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(255, 255, 255, 0.45)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(pickup.x, screenY - 6);
  context.lineTo(pickup.x, screenY + 6);
  context.moveTo(pickup.x - 6, screenY);
  context.lineTo(pickup.x + 6, screenY);
  context.stroke();
}

function draw() {
  context.clearRect(0, 0, config.width, config.height);

  const shaftTop = renderWorldY(state.cameraY + config.height + 100);
  const shaftBottom = renderWorldY(state.cameraY - 120);

  context.fillStyle = "#081018";
  context.fillRect(config.wallWidth, shaftTop, config.width - config.wallWidth * 2, shaftBottom - shaftTop);

  for (let i = -1; i < 12; i += 1) {
    const rungY = Math.floor(state.cameraY / 80 + i) * 80;
    const screenY = renderWorldY(rungY);
    context.strokeStyle = "rgba(255, 255, 255, 0.04)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(config.wallWidth + 10, screenY);
    context.lineTo(config.width - config.wallWidth - 10, screenY);
    context.stroke();
  }

  context.fillStyle = "#131a23";
  context.fillRect(0, 0, config.wallWidth, config.height);
  context.fillRect(config.width - config.wallWidth, 0, config.wallWidth, config.height);

  context.fillStyle = "rgba(116, 208, 255, 0.18)";
  for (let y = -40; y < config.height + 80; y += 110) {
    context.fillRect(12, y, 10, 44);
    context.fillRect(config.width - 22, y + 42, 10, 44);
  }

  const floorY = renderWorldY(config.floorY);
  context.fillStyle = "#202833";
  context.fillRect(config.wallWidth, floorY, config.width - config.wallWidth * 2, config.height - floorY);

  const time = performance.now() / 1000;
  for (const vent of state.vents) {
    drawVent(vent);
  }

  for (const platform of state.platforms) {
    drawPlatform(platform);
  }

  for (const pickup of state.pickups) {
    drawPickup(pickup, time);
  }

  const heatY = renderWorldY(state.heatY);
  const heatGradient = context.createLinearGradient(0, heatY - 140, 0, heatY + 8);
  heatGradient.addColorStop(0, "rgba(255, 98, 56, 0)");
  heatGradient.addColorStop(1, state.coolantPulse > 0 ? "rgba(120, 216, 255, 0.26)" : "rgba(255, 98, 56, 0.44)");
  context.fillStyle = heatGradient;
  context.fillRect(config.wallWidth, heatY - 140, config.width - config.wallWidth * 2, 148);
  context.fillStyle = state.coolantPulse > 0 ? "#8fe7ff" : "#ff6238";
  context.fillRect(config.wallWidth, heatY - 4, config.width - config.wallWidth * 2, 6);

  const playerY = renderWorldY(state.player.y + config.playerHeight);
  context.fillStyle = "#d7ecff";
  context.fillRect(state.player.x, playerY, config.playerWidth, config.playerHeight);
  context.fillStyle = state.coolantSlowTimer > 0 ? "#8fe7ff" : "#74d0ff";
  context.fillRect(state.player.x + 6, playerY + 6, config.playerWidth - 12, 8);
}

function tick(timestamp) {
  if (state.feedback.flashTimer > 0 || state.feedback.calloutTimer > 0 || state.feedback.hazardTimer > 0) {
    stepFeedback(state.lastTime ? Math.min(0.033, (timestamp - state.lastTime) / 1000) : 0.016);
  }

  if (state.mode === "running") {
    if (!state.lastTime) {
      state.lastTime = timestamp;
    }

    const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000);
    state.lastTime = timestamp;
    update(dt);
    updateHud();
    draw();
  }

  window.requestAnimationFrame(tick);
}

function bootShell() {
  shell.bootState.textContent = "Shell ready";
  shell.viewportShell.dataset.boot = "ready";
  resizeCanvas();
  resetRun("intro");
  updateFeedbackLayer();
  window.requestAnimationFrame(tick);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => onKeyChange(event, true));
window.addEventListener("keyup", (event) => onKeyChange(event, false));
shell.gameViewport.addEventListener("pointerdown", () => {
  if (state.mode !== "running") {
    startRun();
  }
});

window.__overcrank = {
  getState() {
    return {
      mode: state.mode,
      cameraY: state.cameraY,
      highestY: state.highestY,
      heatY: state.heatY,
      score: state.score,
      bestScore: state.bestScore,
      chainCount: state.chainCount,
      comboTimer: state.comboTimer,
      coolantSlowTimer: state.coolantSlowTimer,
      platformCounts: state.platforms.reduce((counts, platform) => {
        const key = platform.type;
        counts[key] = (counts[key] || 0) + (platform.active === false ? 0 : 1);
        return counts;
      }, {}),
      ventCount: state.vents.length,
      pickupCount: state.pickups.filter((pickup) => !pickup.collected).length,
      player: {
        x: state.player.x,
        y: state.player.y,
        vx: state.player.vx,
        vy: state.player.vy,
        onGround: state.player.onGround,
        onWall: state.player.onWall,
        platformId: state.player.platformId,
      },
    };
  },
  failRun,
  startRun,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootShell, { once: true });
} else {
  bootShell();
}

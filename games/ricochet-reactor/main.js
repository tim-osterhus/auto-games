const requiredElements = {
  bootState: document.querySelector("#boot-state"),
  statusMessage: document.querySelector("#status-message"),
  arenaShell: document.querySelector("#arena-shell"),
  arenaCanvas: document.querySelector("#arena-canvas"),
  chargeValue: document.querySelector("#charge-value"),
  integrityValue: document.querySelector("#integrity-value"),
  chainValue: document.querySelector("#chain-value"),
  dashValue: document.querySelector("#dash-value"),
  laneValue: document.querySelector("#lane-value"),
  directiveValue: document.querySelector("#directive-value"),
  arenaValue: document.querySelector("#arena-value"),
};

const ARENA_WIDTH = 960;
const ARENA_HEIGHT = 540;
const PLAYER_RADIUS = 14;
const PLAYER_SPEED = 240;
const DASH_DISTANCE = 150;
const DASH_DURATION = 0.12;
const DASH_COOLDOWN = 1.4;
const FIRE_COOLDOWN = 0.16;
const SHOT_SPEED = 520;
const SHOT_RADIUS = 5;
const SHOT_BOUNCES = 4;
const SHOT_LIFETIME = 2.6;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createGame(elements) {
  const ctx = elements.arenaCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Arena canvas 2D context unavailable.");
  }

  const state = {
    ctx,
    lastTime: 0,
    keys: new Set(),
    pointer: { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2, inside: false },
    firing: false,
    player: {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2 + 110,
      radius: PLAYER_RADIUS,
      speed: PLAYER_SPEED,
      health: 100,
      aim: 0,
      dashCooldown: 0,
      dashTime: 0,
      dashVectorX: 0,
      dashVectorY: -1,
    },
    shots: [],
    lastShotAt: 0,
    pulse: 0,
  };

  function resizeCanvas() {
    const rect = elements.arenaShell.getBoundingClientRect();
    elements.arenaCanvas.width = Math.max(640, Math.round(rect.width));
    elements.arenaCanvas.height = Math.max(320, Math.round(rect.height));
  }

  function getPointerPosition(event) {
    const rect = elements.arenaCanvas.getBoundingClientRect();
    const scaleX = ARENA_WIDTH / rect.width;
    const scaleY = ARENA_HEIGHT / rect.height;
    return {
      x: clamp((event.clientX - rect.left) * scaleX, 0, ARENA_WIDTH),
      y: clamp((event.clientY - rect.top) * scaleY, 0, ARENA_HEIGHT),
    };
  }

  function updateAim() {
    const dx = state.pointer.x - state.player.x;
    const dy = state.pointer.y - state.player.y;
    state.player.aim = Math.atan2(dy, dx);
  }

  function fireShot(now) {
    if (now - state.lastShotAt < FIRE_COOLDOWN) {
      return;
    }

    updateAim();
    const directionX = Math.cos(state.player.aim);
    const directionY = Math.sin(state.player.aim);
    const startDistance = state.player.radius + 16;

    state.shots.push({
      x: state.player.x + directionX * startDistance,
      y: state.player.y + directionY * startDistance,
      vx: directionX * SHOT_SPEED,
      vy: directionY * SHOT_SPEED,
      radius: SHOT_RADIUS,
      bouncesLeft: SHOT_BOUNCES,
      life: SHOT_LIFETIME,
    });
    state.lastShotAt = now;
  }

  function tryDash() {
    if (state.player.dashCooldown > 0 || state.player.dashTime > 0) {
      return;
    }

    let moveX = 0;
    let moveY = 0;
    if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) {
      moveY -= 1;
    }
    if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) {
      moveY += 1;
    }
    if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) {
      moveX -= 1;
    }
    if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) {
      moveX += 1;
    }

    if (moveX === 0 && moveY === 0) {
      moveX = Math.cos(state.player.aim);
      moveY = Math.sin(state.player.aim);
    }

    const length = Math.hypot(moveX, moveY) || 1;
    state.player.dashVectorX = moveX / length;
    state.player.dashVectorY = moveY / length;
    state.player.dashTime = DASH_DURATION;
    state.player.dashCooldown = DASH_COOLDOWN;
  }

  function bindEvents() {
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", (event) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
        state.keys.add(event.code);
      }

      if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
        event.preventDefault();
        tryDash();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
      state.keys.delete(event.code);
    });

    elements.arenaCanvas.addEventListener("mousemove", (event) => {
      state.pointer = { ...getPointerPosition(event), inside: true };
      updateAim();
    });

    elements.arenaCanvas.addEventListener("mouseenter", (event) => {
      state.pointer = { ...getPointerPosition(event), inside: true };
      updateAim();
    });

    elements.arenaCanvas.addEventListener("mouseleave", () => {
      state.pointer.inside = false;
    });

    elements.arenaCanvas.addEventListener("mousedown", (event) => {
      if (event.button !== 0) {
        return;
      }

      state.pointer = { ...getPointerPosition(event), inside: true };
      state.firing = true;
      fireShot(state.lastTime || 0);
    });

    window.addEventListener("mouseup", () => {
      state.firing = false;
    });
  }

  function updatePlayer(dt) {
    let moveX = 0;
    let moveY = 0;

    if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) {
      moveY -= 1;
    }
    if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) {
      moveY += 1;
    }
    if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) {
      moveX -= 1;
    }
    if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) {
      moveX += 1;
    }

    if (state.player.dashTime > 0) {
      const dashStep = (DASH_DISTANCE / DASH_DURATION) * dt;
      state.player.x += state.player.dashVectorX * dashStep;
      state.player.y += state.player.dashVectorY * dashStep;
      state.player.dashTime = Math.max(0, state.player.dashTime - dt);
    } else if (moveX !== 0 || moveY !== 0) {
      const length = Math.hypot(moveX, moveY);
      state.player.x += (moveX / length) * state.player.speed * dt;
      state.player.y += (moveY / length) * state.player.speed * dt;
    }

    state.player.x = clamp(state.player.x, state.player.radius, ARENA_WIDTH - state.player.radius);
    state.player.y = clamp(state.player.y, state.player.radius, ARENA_HEIGHT - state.player.radius);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt);
    updateAim();
  }

  function updateShots(dt) {
    for (const shot of state.shots) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;

      let bounced = false;
      if (shot.x <= shot.radius || shot.x >= ARENA_WIDTH - shot.radius) {
        shot.x = clamp(shot.x, shot.radius, ARENA_WIDTH - shot.radius);
        shot.vx *= -1;
        bounced = true;
      }
      if (shot.y <= shot.radius || shot.y >= ARENA_HEIGHT - shot.radius) {
        shot.y = clamp(shot.y, shot.radius, ARENA_HEIGHT - shot.radius);
        shot.vy *= -1;
        bounced = true;
      }
      if (bounced) {
        shot.bouncesLeft -= 1;
      }
    }

    state.shots = state.shots.filter((shot) => shot.life > 0 && shot.bouncesLeft >= 0);
  }

  function updateHud() {
    const readiness = state.player.dashCooldown <= 0 ? "Ready" : `${Math.ceil(state.player.dashCooldown * 10) / 10}s`;
    const loadRatio = Math.min(1, state.shots.length / 8);
    const waveState = state.player.dashTime > 0 ? "Prep-01 / dash" : state.shots.length > 0 ? "Prep-01 / firing" : "Prep-01 / idle";
    const aimDegrees = (Math.atan2(Math.sin(state.player.aim), Math.cos(state.player.aim)) * 180) / Math.PI;

    elements.bootState.textContent = "Arena live";
    elements.statusMessage.textContent = state.player.dashTime > 0
      ? "Dash burst active."
      : state.firing
        ? "Ricochet fire online."
        : "Movement, dash, and ricochet systems online.";
    elements.chargeValue.textContent = `${String(state.player.health).padStart(3, "0")}%`;
    elements.integrityValue.textContent = loadRatio > 0.75 ? "Strained" : loadRatio > 0.35 ? "Watching" : "Stable";
    elements.chainValue.textContent = waveState;
    elements.dashValue.textContent = readiness;
    elements.laneValue.textContent = `${state.shots.length} live ${state.shots.length === 1 ? "round" : "rounds"}`;
    elements.directiveValue.textContent = state.pointer.inside ? "Track cursor and bank shots off the walls" : "Bring the cursor into the chamber to steer fire";
    elements.arenaValue.textContent = `Aim bearing ${Math.round(aimDegrees)}deg`;
  }

  function drawArena() {
    const { ctx } = state;
    ctx.clearRect(0, 0, elements.arenaCanvas.width, elements.arenaCanvas.height);
    ctx.save();
    ctx.scale(elements.arenaCanvas.width / ARENA_WIDTH, elements.arenaCanvas.height / ARENA_HEIGHT);

    ctx.fillStyle = "#101723";
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, ARENA_WIDTH - 20, ARENA_HEIGHT - 20);

    state.pulse += 0.02;
    const pulseAlpha = 0.09 + Math.sin(state.pulse) * 0.03;
    const gradient = ctx.createRadialGradient(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 40, ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 170);
    gradient.addColorStop(0, `rgba(93, 226, 255, ${0.22 + pulseAlpha})`);
    gradient.addColorStop(1, "rgba(93, 226, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 170, 0, Math.PI * 2);
    ctx.fill();

    for (const shot of state.shots) {
      ctx.fillStyle = "#ff9b64";
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const aimLength = 30;
    const aimX = state.player.x + Math.cos(state.player.aim) * aimLength;
    const aimY = state.player.y + Math.sin(state.player.aim) * aimLength;
    ctx.strokeStyle = "rgba(255, 140, 105, 0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(state.player.x, state.player.y);
    ctx.lineTo(aimX, aimY);
    ctx.stroke();

    ctx.fillStyle = state.player.dashTime > 0 ? "#bcf4ff" : "#ff5a36";
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius + 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function tick(nowMs) {
    const now = nowMs / 1000;
    const dt = state.lastTime ? Math.min(0.032, now - state.lastTime) : 0.016;
    state.lastTime = now;

    updatePlayer(dt);
    if (state.firing) {
      fireShot(now);
    }
    updateShots(dt);
    updateHud();
    drawArena();
    window.requestAnimationFrame(tick);
  }

  resizeCanvas();
  bindEvents();
  updateAim();
  updateHud();
  drawArena();
  window.requestAnimationFrame(tick);
}

function bootShell() {
  const missing = Object.entries(requiredElements)
    .filter(([, element]) => !element)
    .map(([key]) => key);

  if (missing.length > 0) {
    const message = `Shell boot failed: missing ${missing.join(", ")}.`;
    if (requiredElements.statusMessage) {
      requiredElements.statusMessage.textContent = message;
    }
    console.error(message);
    return;
  }

  try {
    createGame(requiredElements);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown arena boot failure.";
    requiredElements.statusMessage.textContent = `Shell boot failed: ${message}`;
    console.error(error);
    return;
  }

  requiredElements.arenaShell.classList.add("shell-ready");
  document.body.classList.add("shell-ready");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootShell, { once: true });
} else {
  bootShell();
}

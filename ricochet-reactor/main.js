const requiredElements = {
  bootState: document.querySelector("#boot-state"),
  statusMessage: document.querySelector("#status-message"),
  arenaShell: document.querySelector("#arena-shell"),
  arenaCanvas: document.querySelector("#arena-canvas"),
  chargeValue: document.querySelector("#charge-value"),
  integrityValue: document.querySelector("#integrity-value"),
  chainValue: document.querySelector("#chain-value"),
  dashValue: document.querySelector("#dash-value"),
  scoreValue: document.querySelector("#score-value"),
  bestScoreValue: document.querySelector("#best-score-value"),
  laneValue: document.querySelector("#lane-value"),
  directiveValue: document.querySelector("#directive-value"),
  arenaValue: document.querySelector("#arena-value"),
  pickupValue: document.querySelector("#pickup-value"),
  restartButton: document.querySelector("#restart-button"),
  dangerBadge: document.querySelector("#danger-badge"),
  eventFeed: document.querySelector("#event-feed"),
  introOverlay: document.querySelector("#intro-overlay"),
  introButton: document.querySelector("#intro-button"),
};

const ARENA_WIDTH = 960;
const ARENA_HEIGHT = 540;
const PLAYER_RADIUS = 14;
const PLAYER_SPEED = 240;
const PLAYER_MAX_HEALTH = 100;
const REACTOR_MAX_INTEGRITY = 100;
const DASH_DISTANCE = 150;
const DASH_DURATION = 0.12;
const DASH_COOLDOWN = 1.4;
const FIRE_COOLDOWN = 0.16;
const SHOT_SPEED = 520;
const SHOT_RADIUS = 5;
const SHOT_BOUNCES = 4;
const SHOT_LIFETIME = 2.6;
const PICKUP_RADIUS = 10;
const PICKUP_LIFETIME = 10;
const PICKUP_REACTOR_REPAIR = 12;
const ENEMY_PROJECTILE_SPEED = 240;
const ENEMY_PROJECTILE_RADIUS = 6;
const ENEMY_PROJECTILE_LIFETIME = 4.2;
const PLAYER_CONTACT_INVULNERABILITY = 0.5;
const WAVE_BREAK = 3.5;
const BEST_SCORE_STORAGE_KEY = "millrace.ricochet-reactor.best-score";
const INTRO_DISMISSED_STORAGE_KEY = "millrace.ricochet-reactor.intro-dismissed";

const ENEMY_SCORE_VALUES = {
  chaser: 100,
  turret: 220,
  splitter: 180,
  swarmer: 40,
};

const PICKUP_DROP_CHANCE = {
  chaser: 0.4,
  turret: 0.8,
  splitter: 0.7,
  swarmer: 0.15,
};

const ENEMY_ARCHETYPES = {
  chaser: {
    label: "Chaser",
    color: "#ff7a5c",
    radius: 16,
    speed: 102,
    health: 2,
    contactDamage: 10,
  },
  turret: {
    label: "Turret",
    color: "#f7d36b",
    radius: 18,
    speed: 52,
    health: 4,
    fireCooldown: 1.9,
    preferredOrbit: 170,
    projectileDamage: 12,
  },
  splitter: {
    label: "Splitter",
    color: "#8cf0ff",
    radius: 20,
    speed: 88,
    health: 3,
    reactorDamage: 18,
  },
  swarmer: {
    label: "Swarmer",
    color: "#f49dff",
    radius: 10,
    speed: 144,
    health: 1,
    contactDamage: 7,
    reactorDamage: 8,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(dx, dy) {
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function formatPercent(value) {
  return `${String(Math.max(0, Math.ceil(value))).padStart(3, "0")}%`;
}

function formatScore(value) {
  return String(Math.max(0, Math.floor(value))).padStart(4, "0");
}

function withAlpha(color, alpha) {
  if (!color.startsWith("rgba(")) {
    return color;
  }
  return color.replace(/[\d.]+\)$/, `${alpha})`);
}

function loadBestScore() {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    if (!raw) {
      return 0;
    }

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch (error) {
    return 0;
  }
}

function persistBestScore(value) {
  try {
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(value));
    return true;
  } catch (error) {
    return false;
  }
}

function createEnemy(type, x, y) {
  const config = ENEMY_ARCHETYPES[type];

  return {
    id: `${type}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    x,
    y,
    radius: config.radius,
    color: config.color,
    speed: config.speed,
    health: config.health,
    maxHealth: config.health,
    contactDamage: config.contactDamage ?? 0,
    reactorDamage: config.reactorDamage ?? 0,
    fireCooldown: config.fireCooldown ?? 0,
    fireTimer: randomRange(0.2, config.fireCooldown ?? 0.2),
    preferredOrbit: config.preferredOrbit ?? 0,
    contactTimer: 0,
  };
}

function createGame(elements) {
  const ctx = elements.arenaCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Arena canvas 2D context unavailable.");
  }

  const reactorX = ARENA_WIDTH / 2;
  const reactorY = ARENA_HEIGHT / 2;

  const state = {
    ctx,
    lastTime: 0,
    keys: new Set(),
    pointer: { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2, inside: false },
    firing: false,
    pulse: 0,
    gameOver: false,
    endReason: "",
    wave: 0,
    nextWaveTimer: 2,
    spawnTimer: 0,
    spawnQueue: [],
    score: 0,
    bestScore: loadBestScore(),
    introDismissed: false,
    pickups: [],
    pickupFlash: 0,
    pickupStatus: "No cells recovered yet",
    uiMessage: {
      text: "Objective: defend the reactor, keep moving, and use dash to reopen your angle.",
      tone: "neutral",
      timer: 0,
    },
    effects: [],
    reactor: {
      x: reactorX,
      y: reactorY,
      radius: 38,
      integrity: REACTOR_MAX_INTEGRITY,
      pulse: 0,
      hitFlash: 0,
    },
    player: {
      x: reactorX,
      y: reactorY + 120,
      radius: PLAYER_RADIUS,
      speed: PLAYER_SPEED,
      health: PLAYER_MAX_HEALTH,
      aim: 0,
      dashCooldown: 0,
      dashTime: 0,
      dashVectorX: 0,
      dashVectorY: -1,
      hitFlash: 0,
      contactInvulnerability: 0,
    },
    shots: [],
    enemies: [],
    enemyProjectiles: [],
    lastShotAt: 0,
  };

  persistBestScore(state.bestScore);
  try {
    state.introDismissed = window.localStorage.getItem(INTRO_DISMISSED_STORAGE_KEY) === "1";
  } catch (error) {
    state.introDismissed = false;
  }

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

  function getSpawnPoint() {
    const side = Math.floor(Math.random() * 4);
    const margin = 30;
    if (side === 0) {
      return { x: randomRange(margin, ARENA_WIDTH - margin), y: -20 };
    }
    if (side === 1) {
      return { x: ARENA_WIDTH + 20, y: randomRange(margin, ARENA_HEIGHT - margin) };
    }
    if (side === 2) {
      return { x: randomRange(margin, ARENA_WIDTH - margin), y: ARENA_HEIGHT + 20 };
    }
    return { x: -20, y: randomRange(margin, ARENA_HEIGHT - margin) };
  }

  function queueWave() {
    state.wave += 1;
    const chasers = 2 + state.wave * 2;
    const turrets = 1 + Math.floor(state.wave / 2);
    const splitters = Math.max(1, Math.floor((state.wave + 1) / 2));
    const queue = [];

    for (let index = 0; index < chasers; index += 1) {
      queue.push("chaser");
    }
    for (let index = 0; index < turrets; index += 1) {
      queue.push("turret");
    }
    for (let index = 0; index < splitters; index += 1) {
      queue.push("splitter");
    }

    state.spawnQueue = queue.sort(() => Math.random() - 0.5);
    state.spawnTimer = 0.4;
    state.nextWaveTimer = 0;
  }

  function spawnEnemy(type) {
    const spawn = getSpawnPoint();
    state.enemies.push(createEnemy(type, spawn.x, spawn.y));
  }

  function spawnPickup(x, y, amount) {
    state.pickups.push({
      x,
      y,
      radius: PICKUP_RADIUS,
      amount,
      life: PICKUP_LIFETIME,
      pulse: Math.random() * Math.PI * 2,
    });
  }

  function syncBestScore() {
    if (state.score <= state.bestScore) {
      return;
    }

    state.bestScore = state.score;
    persistBestScore(state.bestScore);
  }

  function setUiMessage(text, tone = "neutral", duration = 1.2) {
    state.uiMessage.text = text;
    state.uiMessage.tone = tone;
    state.uiMessage.timer = duration;
  }

  function addEffect(effect) {
    state.effects.push(effect);
  }

  function createBurst(x, y, color, radius, life, lineWidth = 3) {
    addEffect({
      type: "ring",
      x,
      y,
      color,
      radius,
      maxRadius: radius,
      life,
      maxLife: life,
      lineWidth,
    });
  }

  function createSparkFan(x, y, color, count, speed, life) {
    for (let index = 0; index < count; index += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const velocity = randomRange(speed * 0.45, speed);
      addEffect({
        type: "spark",
        x,
        y,
        color,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: randomRange(1.6, 3.6),
        life,
        maxLife: life,
      });
    }
  }

  function dismissIntro() {
    if (state.introDismissed) {
      return;
    }

    state.introDismissed = true;
    elements.introOverlay.hidden = true;
    elements.arenaCanvas.style.pointerEvents = "auto";
    try {
      window.localStorage.setItem(INTRO_DISMISSED_STORAGE_KEY, "1");
    } catch (error) {
      // Ignore storage failures and keep the overlay dismissed for this page view.
    }
  }

  function handleEnemyDefeat(enemy) {
    state.score += ENEMY_SCORE_VALUES[enemy.type] ?? 50;
    syncBestScore();
    createBurst(enemy.x, enemy.y, "rgba(255, 244, 214, 0.95)", enemy.radius + 10, 0.24, 4);
    createSparkFan(enemy.x, enemy.y, enemy.color, 10, 150, 0.34);
    setUiMessage(`${ENEMY_ARCHETYPES[enemy.type].label} down. Keep the lane clear.`, "kill", 1.2);

    if (Math.random() <= (PICKUP_DROP_CHANCE[enemy.type] ?? 0)) {
      spawnPickup(enemy.x, enemy.y, PICKUP_REACTOR_REPAIR);
    }

    if (enemy.type === "splitter") {
      spawnSplitterChildren(enemy);
    }
  }

  function restartGame() {
    state.gameOver = false;
    state.endReason = "";
    state.wave = 0;
    state.nextWaveTimer = 2;
    state.spawnTimer = 0;
    state.spawnQueue = [];
    state.score = 0;
    state.pickups = [];
    state.pickupFlash = 0;
    state.pickupStatus = "No cells recovered yet";
    state.effects = [];
    state.shots = [];
    state.enemies = [];
    state.enemyProjectiles = [];
    state.lastShotAt = 0;
    state.player.x = reactorX;
    state.player.y = reactorY + 120;
    state.player.health = PLAYER_MAX_HEALTH;
    state.player.dashCooldown = 0;
    state.player.dashTime = 0;
    state.player.hitFlash = 0;
    state.player.contactInvulnerability = 0;
    state.reactor.integrity = REACTOR_MAX_INTEGRITY;
    state.reactor.hitFlash = 0;
    setUiMessage("Objective: defend the reactor, keep moving, and use dash to reopen your angle.", "neutral", 0);
    updateAim();
  }

  function setGameOver(reason) {
    if (state.gameOver) {
      return;
    }

    syncBestScore();
    state.gameOver = true;
    state.endReason = reason;
    state.firing = false;
  }

  function damagePlayer(amount) {
    if (state.gameOver || state.player.contactInvulnerability > 0) {
      return;
    }

    state.player.health = Math.max(0, state.player.health - amount);
    state.player.hitFlash = 0.28;
    state.player.contactInvulnerability = PLAYER_CONTACT_INVULNERABILITY;
    createBurst(state.player.x, state.player.y, "rgba(255, 109, 144, 0.92)", state.player.radius + 10, 0.24, 3);
    createSparkFan(state.player.x, state.player.y, "#ff6d90", 7, 130, 0.26);
    setUiMessage(`Pilot hit. Health ${Math.max(0, Math.ceil(state.player.health))}%.`, "damage", 1.05);
    if (state.player.health <= 0) {
      setGameOver("Pilot down");
    }
  }

  function damageReactor(amount) {
    if (state.gameOver) {
      return;
    }

    state.reactor.integrity = Math.max(0, state.reactor.integrity - amount);
    state.reactor.hitFlash = 0.35;
    createBurst(state.reactor.x, state.reactor.y, "rgba(255, 90, 54, 0.95)", state.reactor.radius + 24, 0.32, 4);
    createSparkFan(state.reactor.x, state.reactor.y, "#ff8c69", 11, 160, 0.34);
    setUiMessage(`Reactor impact. Integrity ${Math.max(0, Math.ceil(state.reactor.integrity))}%.`, "reactor", 1.2);
    if (state.reactor.integrity <= 0) {
      setGameOver("Containment lost");
    }
  }

  function fireShot(now) {
    if (state.gameOver || now - state.lastShotAt < FIRE_COOLDOWN) {
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
      damage: 1,
    });
    state.lastShotAt = now;
    createBurst(
      state.player.x + directionX * (state.player.radius + 8),
      state.player.y + directionY * (state.player.radius + 8),
      "rgba(255, 155, 100, 0.92)",
      12,
      0.16,
      2,
    );
  }

  function tryDash() {
    if (state.gameOver || state.player.dashCooldown > 0 || state.player.dashTime > 0) {
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

    const direction = normalize(moveX, moveY);
    state.player.dashVectorX = direction.x;
    state.player.dashVectorY = direction.y;
    state.player.dashTime = DASH_DURATION;
    state.player.dashCooldown = DASH_COOLDOWN;
    createBurst(state.player.x, state.player.y, "rgba(93, 226, 255, 0.92)", 18, 0.22, 3);
    createSparkFan(state.player.x, state.player.y, "#5de2ff", 8, 200, 0.28);
    setUiMessage("Dash engaged. Reposition and reopen the ricochet lane.", "dash", 1);
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

      if (event.code === "KeyR" && state.gameOver) {
        restartGame();
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
      dismissIntro();
      if (state.gameOver) {
        restartGame();
        return;
      }

      state.firing = true;
      fireShot(state.lastTime || 0);
    });

    elements.restartButton.addEventListener("click", () => {
      restartGame();
    });

    elements.introButton.addEventListener("click", () => {
      dismissIntro();
    });

    window.addEventListener("mouseup", () => {
      state.firing = false;
    });
  }

  function updateWaveState(dt) {
    if (state.gameOver) {
      return;
    }

    if (state.spawnQueue.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnEnemy(state.spawnQueue.shift());
        const densityFactor = Math.min(0.1, state.wave * 0.03);
        state.spawnTimer = Math.max(0.22, 0.72 - densityFactor);
      }
      return;
    }

    if (state.enemies.length === 0 && state.enemyProjectiles.length === 0) {
      if (state.nextWaveTimer <= 0) {
        state.nextWaveTimer = state.wave === 0 ? 2 : WAVE_BREAK;
      }
      state.nextWaveTimer -= dt;
      if (state.nextWaveTimer <= 0) {
        queueWave();
      }
    }
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

    if (!state.gameOver) {
      if (state.player.dashTime > 0) {
        const dashStep = (DASH_DISTANCE / DASH_DURATION) * dt;
        state.player.x += state.player.dashVectorX * dashStep;
        state.player.y += state.player.dashVectorY * dashStep;
        state.player.dashTime = Math.max(0, state.player.dashTime - dt);
      } else if (moveX !== 0 || moveY !== 0) {
        const direction = normalize(moveX, moveY);
        state.player.x += direction.x * state.player.speed * dt;
        state.player.y += direction.y * state.player.speed * dt;
      }
    }

    state.player.x = clamp(state.player.x, state.player.radius, ARENA_WIDTH - state.player.radius);
    state.player.y = clamp(state.player.y, state.player.radius, ARENA_HEIGHT - state.player.radius);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt);
    state.player.contactInvulnerability = Math.max(0, state.player.contactInvulnerability - dt);
    state.player.hitFlash = Math.max(0, state.player.hitFlash - dt);
    state.reactor.hitFlash = Math.max(0, state.reactor.hitFlash - dt);
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
        createSparkFan(shot.x, shot.y, "#ffd39b", 5, 90, 0.18);
        createBurst(shot.x, shot.y, "rgba(255, 211, 155, 0.9)", 10, 0.14, 2);
      }
    }

    state.shots = state.shots.filter((shot) => shot.life > 0 && shot.bouncesLeft >= 0);
  }

  function spawnSplitterChildren(enemy) {
    for (let index = 0; index < 2; index += 1) {
      const offsetAngle = Math.atan2(enemy.y - state.reactor.y, enemy.x - state.reactor.x) + (index === 0 ? -0.55 : 0.55);
      const offset = enemy.radius + 8;
      const child = createEnemy(
        "swarmer",
        clamp(enemy.x + Math.cos(offsetAngle) * offset, 10, ARENA_WIDTH - 10),
        clamp(enemy.y + Math.sin(offsetAngle) * offset, 10, ARENA_HEIGHT - 10),
      );
      state.enemies.push(child);
    }
  }

  function updateEnemies(dt) {
    const survivors = [];

    for (const enemy of state.enemies) {
      if (enemy.health <= 0) {
        handleEnemyDefeat(enemy);
        continue;
      }

      enemy.contactTimer = Math.max(0, enemy.contactTimer - dt);
      const toPlayer = normalize(state.player.x - enemy.x, state.player.y - enemy.y);
      const toReactor = normalize(state.reactor.x - enemy.x, state.reactor.y - enemy.y);

      if (enemy.type === "chaser" || enemy.type === "swarmer") {
        enemy.x += toPlayer.x * enemy.speed * dt;
        enemy.y += toPlayer.y * enemy.speed * dt;
      } else if (enemy.type === "splitter") {
        enemy.x += toReactor.x * enemy.speed * dt;
        enemy.y += toReactor.y * enemy.speed * dt;
      } else if (enemy.type === "turret") {
        const dx = enemy.x - state.reactor.x;
        const dy = enemy.y - state.reactor.y;
        const distance = Math.hypot(dx, dy) || 1;
        const radialAdjust = clamp((distance - enemy.preferredOrbit) * 0.8, -60, 60);
        const tangent = normalize(-dy, dx);
        const radial = normalize(-dx, -dy);
        enemy.x += (tangent.x * enemy.speed + radial.x * radialAdjust) * dt;
        enemy.y += (tangent.y * enemy.speed + radial.y * radialAdjust) * dt;
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0 && !state.gameOver) {
          const target = distanceBetween(enemy, state.player) < 220 || state.player.health < state.reactor.integrity ? state.player : state.reactor;
          const aim = normalize(target.x - enemy.x, target.y - enemy.y);
          state.enemyProjectiles.push({
            x: enemy.x + aim.x * (enemy.radius + 8),
            y: enemy.y + aim.y * (enemy.radius + 8),
            vx: aim.x * ENEMY_PROJECTILE_SPEED,
            vy: aim.y * ENEMY_PROJECTILE_SPEED,
            radius: ENEMY_PROJECTILE_RADIUS,
            life: ENEMY_PROJECTILE_LIFETIME,
            damage: ENEMY_ARCHETYPES.turret.projectileDamage,
            target: target === state.player ? "player" : "reactor",
          });
          enemy.fireTimer = enemy.fireCooldown;
        }
      }

      enemy.x = clamp(enemy.x, enemy.radius, ARENA_WIDTH - enemy.radius);
      enemy.y = clamp(enemy.y, enemy.radius, ARENA_HEIGHT - enemy.radius);

      const playerDistance = distanceBetween(enemy, state.player);
      if (playerDistance <= enemy.radius + state.player.radius && enemy.contactDamage > 0 && enemy.contactTimer <= 0) {
        damagePlayer(enemy.contactDamage);
        enemy.contactTimer = 0.45;
      }

      const reactorDistance = distanceBetween(enemy, state.reactor);
      if (reactorDistance <= enemy.radius + state.reactor.radius) {
        if (enemy.type === "splitter") {
          damageReactor(enemy.reactorDamage);
          continue;
        }
        if (enemy.type === "swarmer") {
          damageReactor(enemy.reactorDamage);
          continue;
        }
      }

      if (enemy.health > 0) {
        survivors.push(enemy);
      }
    }

    state.enemies = survivors;
  }

  function updatePickups(dt) {
    const survivors = [];

    state.pickupFlash = Math.max(0, state.pickupFlash - dt);

    for (const pickup of state.pickups) {
      pickup.life -= dt;
      pickup.pulse += dt * 5;

      if (pickup.life <= 0) {
        continue;
      }

      if (!state.gameOver && distanceBetween(pickup, state.player) <= pickup.radius + state.player.radius) {
        state.reactor.integrity = Math.min(REACTOR_MAX_INTEGRITY, state.reactor.integrity + pickup.amount);
        state.pickupFlash = 1;
        state.pickupStatus = `Recovered cell: +${pickup.amount} reactor integrity`;
        continue;
      }

      survivors.push(pickup);
    }

    state.pickups = survivors;
  }

  function updateEnemyProjectiles(dt) {
    const survivors = [];

    for (const projectile of state.enemyProjectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;

      const outsideBounds =
        projectile.x < -20 ||
        projectile.x > ARENA_WIDTH + 20 ||
        projectile.y < -20 ||
        projectile.y > ARENA_HEIGHT + 20;

      if (projectile.life <= 0 || outsideBounds) {
        continue;
      }

      if (distanceBetween(projectile, state.player) <= projectile.radius + state.player.radius) {
        damagePlayer(projectile.damage);
        continue;
      }

      if (distanceBetween(projectile, state.reactor) <= projectile.radius + state.reactor.radius) {
        damageReactor(projectile.damage);
        continue;
      }

      survivors.push(projectile);
    }

    state.enemyProjectiles = survivors;
  }

  function updateEffects(dt) {
    const survivors = [];

    for (const effect of state.effects) {
      effect.life -= dt;
      if (effect.life <= 0) {
        continue;
      }

      if (effect.type === "ring") {
        effect.radius += dt * effect.maxRadius * 4.4;
      } else if (effect.type === "spark") {
        effect.x += effect.vx * dt;
        effect.y += effect.vy * dt;
        effect.vx *= 0.94;
        effect.vy *= 0.94;
      }

      survivors.push(effect);
    }

    state.effects = survivors;
    state.uiMessage.timer = Math.max(0, state.uiMessage.timer - dt);
  }

  function handleShotImpacts() {
    const remainingShots = [];

    for (const shot of state.shots) {
      let hitEnemy = false;

      for (const enemy of state.enemies) {
        if (distanceBetween(shot, enemy) <= shot.radius + enemy.radius) {
          enemy.health -= shot.damage;
          createBurst(shot.x, shot.y, "rgba(255, 211, 155, 0.95)", Math.max(8, enemy.radius * 0.7), 0.18, 2);
          createSparkFan(shot.x, shot.y, "#ffd39b", enemy.health <= 0 ? 8 : 5, enemy.health <= 0 ? 145 : 95, enemy.health <= 0 ? 0.28 : 0.18);
          if (enemy.health > 0) {
            setUiMessage(`${ENEMY_ARCHETYPES[enemy.type].label} tagged. Keep pressure on the bounce lane.`, "hit", 0.7);
          }
          hitEnemy = true;
          break;
        }
      }

      if (!hitEnemy) {
        remainingShots.push(shot);
      }
    }

    state.shots = remainingShots;
  }

  function getWaveLabel() {
    if (state.gameOver) {
      return "Run failed";
    }
    if (state.spawnQueue.length > 0) {
      return `Wave-${String(state.wave).padStart(2, "0")} / breach`;
    }
    if (state.enemies.length > 0 || state.enemyProjectiles.length > 0) {
      return `Wave-${String(state.wave).padStart(2, "0")} / active`;
    }
    if (state.wave === 0) {
      return "Prep-01";
    }
    return `Wave-${String(state.wave + 1).padStart(2, "0")} in ${Math.max(1, Math.ceil(state.nextWaveTimer))}s`;
  }

  function getIntegrityState() {
    if (state.reactor.integrity <= 35) {
      return "critical";
    }
    if (state.reactor.integrity <= 70) {
      return "warning";
    }
    return "stable";
  }

  function updateHud() {
    const readiness = state.player.dashCooldown <= 0 ? "Ready" : `${Math.ceil(state.player.dashCooldown * 10) / 10}s`;
    const liveThreats = state.enemies.length + state.enemyProjectiles.length;
    const turretCount = state.enemies.filter((enemy) => enemy.type === "turret").length;
    const pickupLabel = state.pickups.length > 0
      ? `${state.pickups.length} cell${state.pickups.length === 1 ? "" : "s"} active / +${PICKUP_REACTOR_REPAIR} integrity`
      : state.pickupStatus;
    const integrityState = getIntegrityState();
    const eventText = state.uiMessage.timer > 0
      ? state.uiMessage.text
      : "Objective: defend the reactor, keep moving, and use dash to reopen your angle.";
    const eventTone = state.uiMessage.timer > 0 ? state.uiMessage.tone : "neutral";

    elements.bootState.textContent = state.gameOver ? "Run failed" : state.wave === 0 ? "Booting" : `Wave ${state.wave}`;
    elements.statusMessage.textContent = state.gameOver
      ? `${state.endReason}. Press R or click the arena to restart.`
      : state.pickupFlash > 0
        ? `Recovery cell secured. Reactor integrity restored by ${PICKUP_REACTOR_REPAIR}.`
      : state.spawnQueue.length > 0
        ? `Wave ${state.wave} breach in progress. Hold the center and thin the queue.`
        : state.enemies.length > 0
          ? `Threats active: ${state.enemies.length} hostile units, ${turretCount} turret${turretCount === 1 ? "" : "s"} online.`
          : `Wave ${state.wave + 1} incoming in ${Math.max(1, Math.ceil(state.nextWaveTimer))}s.`;
    elements.chargeValue.textContent = formatPercent(state.player.health);
    elements.integrityValue.textContent = formatPercent(state.reactor.integrity);
    elements.chainValue.textContent = getWaveLabel();
    elements.dashValue.textContent = readiness;
    elements.scoreValue.textContent = formatScore(state.score);
    elements.bestScoreValue.textContent = formatScore(state.bestScore);
    elements.laneValue.textContent = `${state.shots.length} live ${state.shots.length === 1 ? "round" : "rounds"} / ${liveThreats} hostile traces`;
    elements.directiveValue.textContent = state.gameOver
      ? "Lock the restart control and reset for another score run"
      : state.pickups.length > 0
        ? "Sweep the recovery cells when the lane is clear to stabilize the reactor"
      : liveThreats > 0
        ? "Protect the core, kite the chasers, and break splitters before impact"
        : "Use the lull to reload your angle around the reactor";
    elements.arenaValue.textContent = state.gameOver
      ? `${state.endReason} | Score ${state.score} | Best ${state.bestScore}`
      : `Turrets ${turretCount} | Queue ${state.spawnQueue.length} | Next break ${state.enemies.length === 0 ? Math.max(0, Math.ceil(state.nextWaveTimer)) : 0}s`;
    elements.pickupValue.textContent = pickupLabel;
    elements.restartButton.hidden = !state.gameOver;
    elements.eventFeed.textContent = eventText;
    elements.eventFeed.dataset.tone = eventTone;
    elements.dangerBadge.textContent = integrityState === "critical"
      ? "Reactor critical"
      : integrityState === "warning"
        ? "Reactor unstable"
        : "Reactor stable";
    elements.arenaShell.dataset.integrityState = integrityState;
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
    state.reactor.pulse += 0.04;

    const pulseAlpha = 0.09 + Math.sin(state.pulse) * 0.03;
    const gradient = ctx.createRadialGradient(reactorX, reactorY, 40, reactorX, reactorY, 170);
    gradient.addColorStop(0, `rgba(93, 226, 255, ${0.24 + pulseAlpha + state.reactor.hitFlash * 0.2})`);
    gradient.addColorStop(1, "rgba(93, 226, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(reactorX, reactorY, 170, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = state.reactor.hitFlash > 0 ? "rgba(255, 90, 54, 0.95)" : "rgba(93, 226, 255, 0.65)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(reactorX, reactorY, state.reactor.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(93, 226, 255, ${0.32 + Math.sin(state.reactor.pulse) * 0.08 + state.reactor.hitFlash * 0.25})`;
    ctx.beginPath();
    ctx.arc(reactorX, reactorY, 24, 0, Math.PI * 2);
    ctx.fill();

    if (state.reactor.integrity <= 35) {
      ctx.strokeStyle = `rgba(255, 77, 95, ${0.4 + Math.sin(state.pulse * 1.8) * 0.18})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(reactorX, reactorY, 64, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const shot of state.shots) {
      const shotGlow = ctx.createRadialGradient(shot.x, shot.y, 0, shot.x, shot.y, shot.radius + 10);
      shotGlow.addColorStop(0, "rgba(255, 190, 140, 0.9)");
      shotGlow.addColorStop(1, "rgba(255, 155, 100, 0)");
      ctx.fillStyle = shotGlow;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ff9b64";
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const projectile of state.enemyProjectiles) {
      ctx.fillStyle = projectile.target === "reactor" ? "#ffd86e" : "#ff6d90";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const pickup of state.pickups) {
      const glow = 0.22 + (Math.sin(pickup.pulse) + 1) * 0.12;
      ctx.fillStyle = `rgba(93, 226, 255, ${glow})`;
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.radius + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#bcf4ff";
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(5, 8, 12, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pickup.x - 4, pickup.y);
      ctx.lineTo(pickup.x + 4, pickup.y);
      ctx.moveTo(pickup.x, pickup.y - 4);
      ctx.lineTo(pickup.x, pickup.y + 4);
      ctx.stroke();
    }

    for (const enemy of state.enemies) {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(5, 8, 12, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 1.5, 0, Math.PI * 2);
      ctx.stroke();

      const barWidth = enemy.radius * 2;
      const healthRatio = clamp(enemy.health / enemy.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, barWidth, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, barWidth * healthRatio, 4);
    }

    for (const effect of state.effects) {
      const alpha = clamp(effect.life / effect.maxLife, 0, 1);
      if (effect.type === "ring") {
        ctx.strokeStyle = withAlpha(effect.color, Number((alpha * 0.95).toFixed(3)));
        ctx.lineWidth = effect.lineWidth;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (effect.type === "spark") {
        ctx.fillStyle = withAlpha(effect.color, Number(alpha.toFixed(3)));
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.fill();
      }
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

    ctx.fillStyle = state.player.hitFlash > 0 ? "#fff3ef" : state.player.dashTime > 0 ? "#bcf4ff" : "#ff5a36";
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = state.player.contactInvulnerability > 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius + 5, 0, Math.PI * 2);
    ctx.stroke();

    if (state.gameOver) {
      ctx.fillStyle = "rgba(4, 7, 11, 0.72)";
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      ctx.textAlign = "center";
      ctx.fillStyle = "#eff3ff";
      ctx.font = "700 42px 'Clash Display', sans-serif";
      ctx.fillText(state.endReason, reactorX, reactorY - 12);
      ctx.font = "500 18px 'DM Sans', sans-serif";
      ctx.fillStyle = "#c8d1e4";
      ctx.fillText(`Score ${state.score} | Best ${state.bestScore} | Press R, click, or use Restart run.`, reactorX, reactorY + 26);
    }

    ctx.restore();
  }

  function tick(nowMs) {
    const now = nowMs / 1000;
    const dt = state.lastTime ? Math.min(0.032, now - state.lastTime) : 0.016;
    state.lastTime = now;

    updateWaveState(dt);
    updatePlayer(dt);
    if (state.firing) {
      fireShot(now);
    }
    updateShots(dt);
    handleShotImpacts();
    updateEnemies(dt);
    updateEnemyProjectiles(dt);
    updatePickups(dt);
    updateEffects(dt);

    updateHud();
    drawArena();
    window.requestAnimationFrame(tick);
  }

  resizeCanvas();
  bindEvents();
  restartGame();
  if (state.introDismissed) {
    elements.introOverlay.hidden = true;
    elements.arenaCanvas.style.pointerEvents = "auto";
  } else {
    elements.arenaCanvas.style.pointerEvents = "none";
  }
  state.nextWaveTimer = 2;
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

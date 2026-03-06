"use strict";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const hudDepth = document.getElementById("hud-depth");
const hudCash = document.getElementById("hud-cash");
const hudInventory = document.getElementById("hud-inventory");
const hudFuel = document.getElementById("hud-fuel");
const hudSellRow = document.getElementById("hud-sell");
const sellButton = document.getElementById("sell-button");
const shopUpgradeName = document.getElementById("shop-upgrade-name");
const shopUpgradeDetail = document.getElementById("shop-upgrade-detail");
const buyUpgradeButton = document.getElementById("buy-upgrade");

const TILE_SIZE = 32;
const WORLD_COLS = 80;
const WORLD_ROWS = 120;
const WORLD_WIDTH = WORLD_COLS * TILE_SIZE;
const WORLD_HEIGHT = WORLD_ROWS * TILE_SIZE;
const STARTER_SHAFT_WIDTH = 2;
const STARTER_SHAFT_DEPTH = 8;
const FUEL_MAX = 100;
const FUEL_MOVE_RATE = 6;
const FUEL_DIG_COST = 8;
const FUEL_LOW_THRESHOLD = 20;
const FUEL_EMPTY_SPEED_MULT = 0.4;

const TILE = {
  AIR: 0,
  SURFACE: 1,
  SOLID: 2,
};

const TILE_COLORS = {
  surface: "#7fb069",
  solid: "#6a4b2a",
};

const ORE_TYPES = {
  copper: { id: "copper", label: "Copper", short: "Cu", color: "#c97943", value: 10 },
  iron: { id: "iron", label: "Iron", short: "Fe", color: "#c7ccd6", value: 20 },
};

const ORE_ORDER = ["copper", "iron"];

const SURFACE_UPGRADE = {
  id: "cargo-pods",
  name: "Cargo Pods",
  cost: 120,
  capacityBoost: 5,
};

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function toNonNegativeInt(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function getPlayerDepth() {
  const depth = toNonNegativeInt(state.player.y / TILE_SIZE);
  return clamp(depth, 0, WORLD_ROWS - 1);
}

function getSafeCash() {
  return toNonNegativeInt(state.cash);
}

function clampFuel(value) {
  return clamp(value, 0, FUEL_MAX);
}

function getSafeFuel() {
  return clampFuel(toNonNegativeInt(state.fuel));
}

function setFuel(nextFuel) {
  state.fuel = clampFuel(nextFuel);
}

function getSafeCapacity() {
  return toNonNegativeInt(state.inventory.capacity);
}

function getSafeOreCount(oreId) {
  return toNonNegativeInt(state.inventory.counts[oreId]);
}

function createTile(type, oreId = null) {
  return { type, oreId };
}

function pickOreForDepth(row) {
  const depthRatio = Math.min(1, Math.max(0, row / (WORLD_ROWS - 1)));
  const oreChance = 0.08 + depthRatio * 0.07;
  if (Math.random() >= oreChance) return null;

  const ironShare = 0.2 + depthRatio * 0.6;
  return Math.random() < ironShare ? "iron" : "copper";
}

function seedOres(tiles) {
  const placed = new Set();
  const candidates = [];

  for (let row = 1; row < WORLD_ROWS; row += 1) {
    for (let col = 0; col < WORLD_COLS; col += 1) {
      const tile = tiles[row][col];
      if (tile.type !== TILE.SOLID) continue;

      candidates.push({ row, col });

      const oreId = pickOreForDepth(row);

      if (oreId) {
        tile.oreId = oreId;
        placed.add(oreId);
      }
    }
  }

  for (const oreId of ORE_ORDER) {
    if (placed.has(oreId) || candidates.length === 0) continue;
    const spot = candidates[Math.floor(Math.random() * candidates.length)];
    tiles[spot.row][spot.col].oreId = oreId;
    placed.add(oreId);
  }
}

function generateWorld() {
  const tiles = Array.from({ length: WORLD_ROWS }, (_, row) =>
    Array.from({ length: WORLD_COLS }, () =>
      createTile(row === 0 ? TILE.SURFACE : TILE.SOLID)
    )
  );

  const shaftCol = Math.floor(WORLD_COLS / 2);
  for (let row = 0; row <= STARTER_SHAFT_DEPTH && row < WORLD_ROWS; row += 1) {
    for (let offset = 0; offset < STARTER_SHAFT_WIDTH; offset += 1) {
      const col = shaftCol + offset;
      if (col >= 0 && col < WORLD_COLS) {
        tiles[row][col] = createTile(TILE.AIR);
      }
    }
  }

  seedOres(tiles);
  return tiles;
}

const world = generateWorld();
const spawnCol = Math.floor(WORLD_COLS / 2);
const spawnRow = 0;

const state = {
  dpr: window.devicePixelRatio || 1,
  viewWidth: window.innerWidth,
  viewHeight: window.innerHeight,
  lastTime: 0,
  keys: new Set(),
  lastMove: { x: 0, y: 1 },
  inventory: {
    capacity: 12,
    counts: Object.fromEntries(ORE_ORDER.map((id) => [id, 0])),
  },
  upgrades: {
    [SURFACE_UPGRADE.id]: false,
  },
  cash: 0,
  fuel: FUEL_MAX,
  player: {
    x: (spawnCol + 0.5) * TILE_SIZE,
    y: (spawnRow + 0.5) * TILE_SIZE,
    size: 26,
    speed: 240,
  },
};

function resizeCanvas() {
  state.viewWidth = window.innerWidth;
  state.viewHeight = window.innerHeight;
  state.dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(state.viewWidth * state.dpr);
  canvas.height = Math.floor(state.viewHeight * state.dpr);
  canvas.style.width = `${state.viewWidth}px`;
  canvas.style.height = `${state.viewHeight}px`;

  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function getInventoryTotal() {
  return ORE_ORDER.reduce((total, oreId) => total + getSafeOreCount(oreId), 0);
}

function inventoryHasSpace() {
  return getInventoryTotal() < getSafeCapacity();
}

function addOreToInventory(oreId) {
  if (!oreId || !(oreId in state.inventory.counts)) return false;
  if (!inventoryHasSpace()) return false;
  state.inventory.counts[oreId] = getSafeOreCount(oreId) + 1;
  return true;
}

function sellInventory() {
  const depth = getPlayerDepth();
  if (depth !== 0) return;
  const total = getInventoryTotal();
  if (total === 0) return;

  const payout = ORE_ORDER.reduce(
    (sum, oreId) => sum + getSafeOreCount(oreId) * ORE_TYPES[oreId].value,
    0
  );

  state.cash = getSafeCash() + payout;
  ORE_ORDER.forEach((oreId) => {
    state.inventory.counts[oreId] = 0;
  });

  updateHud();
}

function canBuyUpgrade(depth) {
  return (
    depth === 0 &&
    getSafeCash() >= SURFACE_UPGRADE.cost &&
    !state.upgrades[SURFACE_UPGRADE.id]
  );
}

function buyUpgrade() {
  const depth = getPlayerDepth();
  if (!canBuyUpgrade(depth)) return;
  state.cash = getSafeCash() - SURFACE_UPGRADE.cost;
  state.inventory.capacity = getSafeCapacity() + SURFACE_UPGRADE.capacityBoost;
  state.upgrades[SURFACE_UPGRADE.id] = true;
  updateHud();
}

function isSolidTile(col, row) {
  if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) {
    return true;
  }
  const tile = world[row][col];
  return tile.type === TILE.SOLID || tile.type === TILE.SURFACE;
}

function collidesAt(x, y) {
  const half = state.player.size / 2;
  const left = x - half;
  const right = x + half;
  const top = y - half;
  const bottom = y + half;

  const minCol = Math.floor(left / TILE_SIZE);
  const maxCol = Math.floor((right - 1) / TILE_SIZE);
  const minRow = Math.floor(top / TILE_SIZE);
  const maxRow = Math.floor((bottom - 1) / TILE_SIZE);

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      if (isSolidTile(col, row)) {
        return true;
      }
    }
  }

  return false;
}

function movePlayer(delta) {
  let dirX = 0;
  let dirY = 0;

  if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) dirY -= 1;
  if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) dirY += 1;
  if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) dirX -= 1;
  if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) dirX += 1;

  const hasInput = dirX !== 0 || dirY !== 0;
  if (dirX !== 0 || dirY !== 0) {
    const length = Math.hypot(dirX, dirY);
    dirX /= length;
    dirY /= length;
    state.lastMove.x = Math.sign(dirX);
    state.lastMove.y = Math.sign(dirY);
  }

  let speed = state.player.speed;
  if (state.fuel <= 0) {
    speed *= FUEL_EMPTY_SPEED_MULT;
  }
  const moveX = dirX * speed * delta;
  const moveY = dirY * speed * delta;
  const half = state.player.size / 2;
  const minX = half;
  const maxX = WORLD_WIDTH - half;
  const minY = half;
  const maxY = WORLD_HEIGHT - half;
  const startX = state.player.x;
  const startY = state.player.y;

  if (moveX !== 0) {
    const nextX = state.player.x + moveX;
    const clampedX = clamp(nextX, minX, maxX);
    if (!collidesAt(clampedX, state.player.y)) {
      state.player.x = clampedX;
    }
  }

  if (moveY !== 0) {
    const nextY = state.player.y + moveY;
    const clampedY = clamp(nextY, minY, maxY);
    if (!collidesAt(state.player.x, clampedY)) {
      state.player.y = clampedY;
    }
  }

  if (hasInput && (state.player.x !== startX || state.player.y !== startY)) {
    setFuel(state.fuel - FUEL_MOVE_RATE * delta);
  }
}

function digAdjacentTile() {
  if (getSafeFuel() <= 0) return;
  const playerCol = Math.floor(state.player.x / TILE_SIZE);
  const playerRow = Math.floor(state.player.y / TILE_SIZE);
  const rawTargetCol = playerCol + state.lastMove.x;
  const rawTargetRow = playerRow + state.lastMove.y;
  const targetCol = clamp(rawTargetCol, 0, WORLD_COLS - 1);
  const targetRow = clamp(rawTargetRow, 0, WORLD_ROWS - 1);
  if (targetCol !== rawTargetCol || targetRow !== rawTargetRow) return;

  const tile = world[targetRow][targetCol];
  if (tile.type === TILE.AIR) return;

  if (tile.oreId) {
    if (!inventoryHasSpace()) {
      return;
    }
    addOreToInventory(tile.oreId);
  }

  tile.type = TILE.AIR;
  tile.oreId = null;
  setFuel(state.fuel - FUEL_DIG_COST);
}

function updateHud() {
  const depth = getPlayerDepth();
  const cash = getSafeCash();
  const capacity = getSafeCapacity();
  const fuel = getSafeFuel();
  hudDepth.textContent = `${depth}m`;
  hudCash.textContent = `$${cash}`;
  const total = getInventoryTotal();
  const perOre = ORE_ORDER.map(
    (oreId) => `${ORE_TYPES[oreId].short}:${getSafeOreCount(oreId)}`
  ).join(" ");
  hudInventory.textContent = `${total} / ${capacity} | ${perOre}`;
  if (hudFuel) {
    hudFuel.textContent = `${fuel} / ${FUEL_MAX}`;
  }

  const canSell = depth === 0 && total > 0;
  if (hudSellRow) {
    hudSellRow.hidden = !canSell;
  }
  if (sellButton) {
    sellButton.disabled = !canSell;
  }

  if (shopUpgradeName) {
    shopUpgradeName.textContent = SURFACE_UPGRADE.name;
  }
  if (shopUpgradeDetail) {
    shopUpgradeDetail.textContent = `+${SURFACE_UPGRADE.capacityBoost} capacity • $${SURFACE_UPGRADE.cost}`;
  }
  if (buyUpgradeButton) {
    buyUpgradeButton.disabled = !canBuyUpgrade(depth);
    buyUpgradeButton.textContent = state.upgrades[SURFACE_UPGRADE.id] ? "Owned" : "Buy";
  }
}

function drawWorld(cameraX, cameraY) {
  const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
  const endCol = Math.min(WORLD_COLS - 1, Math.floor((cameraX + state.viewWidth) / TILE_SIZE));
  const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE));
  const endRow = Math.min(WORLD_ROWS - 1, Math.floor((cameraY + state.viewHeight) / TILE_SIZE));

  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      const tile = world[row][col];
      if (tile.type === TILE.AIR) continue;

      if (tile.oreId) {
        ctx.fillStyle = ORE_TYPES[tile.oreId].color;
      } else if (tile.type === TILE.SURFACE) {
        ctx.fillStyle = TILE_COLORS.surface;
      } else {
        ctx.fillStyle = TILE_COLORS.solid;
      }

      const screenX = col * TILE_SIZE - cameraX;
      const screenY = row * TILE_SIZE - cameraY;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }
}

function render() {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, state.viewWidth, state.viewHeight);

  const cameraX = state.player.x - state.viewWidth / 2;
  const cameraY = state.player.y - state.viewHeight / 2;

  drawWorld(cameraX, cameraY);

  const playerScreenX = state.viewWidth / 2 - state.player.size / 2;
  const playerScreenY = state.viewHeight / 2 - state.player.size / 2;

  ctx.fillStyle = "#5de3ff";
  ctx.fillRect(playerScreenX, playerScreenY, state.player.size, state.player.size);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.strokeRect(playerScreenX, playerScreenY, state.player.size, state.player.size);
}

function tick(timestamp) {
  const delta = Math.min(0.05, (timestamp - state.lastTime) / 1000 || 0);
  state.lastTime = timestamp;

  movePlayer(delta);
  updateHud();
  render();

  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) ||
    event.code === "Space"
  ) {
    event.preventDefault();
  }
  if (event.code === "Space" && !event.repeat) {
    digAdjacentTile();
  }
  state.keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.code);
});

window.addEventListener("blur", () => {
  state.keys.clear();
});

if (sellButton) {
  sellButton.addEventListener("click", () => {
    sellInventory();
  });
}

if (buyUpgradeButton) {
  buyUpgradeButton.addEventListener("click", () => {
    buyUpgrade();
  });
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(tick);

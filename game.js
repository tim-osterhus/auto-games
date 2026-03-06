"use strict";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const hudDepth = document.getElementById("hud-depth");
const hudStratum = document.getElementById("hud-stratum");
const hudCash = document.getElementById("hud-cash");
const hudInventory = document.getElementById("hud-inventory");
const hudFuel = document.getElementById("hud-fuel");
const hudFuelRow = document.getElementById("hud-fuel-row");
const hudSellRow = document.getElementById("hud-sell");
const sellButton = document.getElementById("sell-button");
const hudShopList = document.getElementById("hud-shop-list");

const TILE_SIZE = 32;
const WORLD_COLS = 80;
const WORLD_ROWS = 120;
const WORLD_WIDTH = WORLD_COLS * TILE_SIZE;
const WORLD_HEIGHT = WORLD_ROWS * TILE_SIZE;
const STARTER_SHAFT_WIDTH = 2;
const STARTER_SHAFT_DEPTH = 8;
const BASE_FUEL_CAPACITY = 100;
const STARTING_INVENTORY_CAPACITY = 12;
const STARTING_PLAYER_SPEED = 240;
const FUEL_MOVE_RATE = 6;
const FUEL_DIG_COST = 8;
const FUEL_LOW_THRESHOLD_RATIO = 0.2;
const FUEL_EMPTY_SPEED_MULT = 0.4;
const STRATA = [
  { id: "shallows", name: "Shallows", minRow: 1, maxRow: Math.floor((WORLD_ROWS - 1) / 3) },
  {
    id: "mid-depths",
    name: "Mid Depths",
    minRow: Math.floor((WORLD_ROWS - 1) / 3) + 1,
    maxRow: Math.floor(((WORLD_ROWS - 1) * 2) / 3),
  },
  {
    id: "deep-core",
    name: "Deep Core",
    minRow: Math.floor(((WORLD_ROWS - 1) * 2) / 3) + 1,
    maxRow: WORLD_ROWS - 1,
  },
];
const SURFACE_STRATUM = { id: "surface", name: "Surface", minRow: 0, maxRow: 0 };
const shopLineElements = new Map();

const TILE = {
  AIR: 0,
  SURFACE: 1,
  SOLID: 2,
};

const TILE_COLORS = {
  surface: "#7fb069",
  solid: "#6a4b2a",
};
const STRATUM_TILE_COLORS = {
  shallows: "#6a4b2a",
  "mid-depths": "#5a3f28",
  "deep-core": "#4a3424",
};

const ORE_TYPES = {
  copper: { id: "copper", label: "Copper", short: "Cu", color: "#c97943", value: 10 },
  iron: { id: "iron", label: "Iron", short: "Fe", color: "#c7ccd6", value: 20 },
  gold: { id: "gold", label: "Gold", short: "Au", color: "#e1ba4e", value: 35 },
};

const ORE_ORDER = ["copper", "iron", "gold"];
const STRATUM_ORE_TABLES = {
  shallows: {
    oreChance: 0.08,
    weights: {
      copper: 10,
      iron: 3,
      gold: 0,
    },
  },
  "mid-depths": {
    oreChance: 0.12,
    weights: {
      copper: 7,
      iron: 6,
      gold: 2,
    },
  },
  "deep-core": {
    oreChance: 0.18,
    weights: {
      copper: 4,
      iron: 7,
      gold: 5,
    },
  },
};

const UPGRADE_LINES = [
  {
    id: "cargo-pods",
    name: "Cargo Pods",
    unlock: { minDepth: 0 },
    tiers: [
      {
        id: "cargo-pods-1",
        cost: 120,
        effectLabel: "+5 capacity",
        effects: { inventoryCapacity: 5 },
      },
      {
        id: "cargo-pods-2",
        cost: 220,
        effectLabel: "+8 capacity",
        effects: { inventoryCapacity: 8 },
      },
    ],
  },
  {
    id: "fuel-tanks",
    name: "Fuel Tank",
    unlock: { minDepth: 0 },
    tiers: [
      {
        id: "fuel-tanks-1",
        cost: 90,
        effectLabel: "+20 fuel",
        effects: { fuelCapacity: 20 },
      },
      {
        id: "fuel-tanks-2",
        cost: 180,
        effectLabel: "+35 fuel",
        effects: { fuelCapacity: 35 },
      },
    ],
  },
  {
    id: "thrusters",
    name: "Thrusters",
    unlock: { minDepth: STRATA[1].minRow },
    tiers: [
      {
        id: "thrusters-1",
        cost: 160,
        effectLabel: "+20 speed",
        effects: { moveSpeed: 20 },
      },
      {
        id: "thrusters-2",
        cost: 280,
        effectLabel: "+35 speed",
        effects: { moveSpeed: 35 },
      },
    ],
  },
];

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function getSafeWorldRow(row) {
  const normalizedRow = Number.isFinite(row) ? Math.floor(row) : 0;
  return clamp(normalizedRow, 0, WORLD_ROWS - 1);
}

function getStratumForRow(row) {
  const safeRow = getSafeWorldRow(row);
  if (safeRow === 0) return SURFACE_STRATUM;

  return (
    STRATA.find((stratum) => safeRow >= stratum.minRow && safeRow <= stratum.maxRow) ||
    STRATA.find((stratum) => safeRow <= stratum.maxRow) ||
    STRATA[STRATA.length - 1] ||
    SURFACE_STRATUM
  );
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
  return clamp(value, 0, getMaxFuel());
}

function getSafeFuel() {
  return clampFuel(toNonNegativeInt(state.fuel));
}

function setFuel(nextFuel) {
  state.fuel = clampFuel(nextFuel);
}

function getPurchasedUpgradeTiers(lineId) {
  const line = getUpgradeLine(lineId);
  if (!line) return [];
  return line.tiers.slice(0, getPurchasedUpgradeTier(lineId));
}

function getUpgradeEffectTotal(effectKey) {
  return UPGRADE_LINES.reduce((total, line) => {
    return (
      total +
      getPurchasedUpgradeTiers(line.id).reduce(
        (lineTotal, tier) => lineTotal + toNonNegativeInt(tier.effects?.[effectKey]),
        0
      )
    );
  }, 0);
}

function getMaxFuel() {
  return BASE_FUEL_CAPACITY + getUpgradeEffectTotal("fuelCapacity");
}

function isFuelLow(fuel = getSafeFuel()) {
  return fuel <= Math.ceil(getMaxFuel() * FUEL_LOW_THRESHOLD_RATIO);
}

function getSafeCapacity() {
  return Math.max(STARTING_INVENTORY_CAPACITY, toNonNegativeInt(state.inventory.capacity));
}

function getMoveSpeed() {
  const speed = toNonNegativeInt(state.player.speed);
  return speed > 0 ? speed : STARTING_PLAYER_SPEED;
}

function getSafeOreCount(oreId) {
  return toNonNegativeInt(state.inventory.counts[oreId]);
}

function createTile(type, oreId = null, metadata = {}) {
  return { type, oreId, ...metadata };
}

function getStratumTileMetadata(row) {
  const stratum = getStratumForRow(row);

  return {
    stratumId: stratum.id,
    stratumName: stratum.name,
  };
}

function getOreTableForRow(row) {
  const stratum = getStratumForRow(row);
  return STRATUM_ORE_TABLES[stratum.id] || null;
}

function getSolidTileColor(tile, row) {
  const stratumId = tile?.stratumId || getStratumForRow(row).id;
  return STRATUM_TILE_COLORS[stratumId] || TILE_COLORS.solid;
}

function pickWeightedOre(weights) {
  const weightedOreIds = ORE_ORDER.filter((oreId) => toNonNegativeInt(weights[oreId]) > 0);
  const totalWeight = weightedOreIds.reduce(
    (sum, oreId) => sum + toNonNegativeInt(weights[oreId]),
    0
  );
  if (totalWeight <= 0) return null;

  let roll = Math.random() * totalWeight;
  for (const oreId of weightedOreIds) {
    roll -= toNonNegativeInt(weights[oreId]);
    if (roll < 0) {
      return oreId;
    }
  }

  return weightedOreIds[weightedOreIds.length - 1] || null;
}

function pickOreForRow(row) {
  const oreTable = getOreTableForRow(row);
  if (!oreTable || Math.random() >= oreTable.oreChance) return null;

  return pickWeightedOre(oreTable.weights);
}

function seedOres(tiles) {
  const placed = new Set();
  const candidatesByOre = Object.fromEntries(ORE_ORDER.map((oreId) => [oreId, []]));

  for (let row = 1; row < WORLD_ROWS; row += 1) {
    for (let col = 0; col < WORLD_COLS; col += 1) {
      const tile = tiles[row][col];
      if (tile.type !== TILE.SOLID) continue;

      const oreTable = getOreTableForRow(row);
      if (oreTable) {
        for (const oreId of ORE_ORDER) {
          if (toNonNegativeInt(oreTable.weights[oreId]) > 0) {
            candidatesByOre[oreId].push({ row, col });
          }
        }
      }

      const oreId = pickOreForRow(row);

      if (oreId) {
        tile.oreId = oreId;
        placed.add(oreId);
      }
    }
  }

  for (const oreId of ORE_ORDER) {
    const candidates = candidatesByOre[oreId];
    if (placed.has(oreId) || candidates.length === 0) continue;

    const spot = candidates[Math.floor(Math.random() * candidates.length)];
    tiles[spot.row][spot.col].oreId = oreId;
    placed.add(oreId);
  }
}

function generateWorld() {
  const tiles = Array.from({ length: WORLD_ROWS }, (_, row) =>
    Array.from({ length: WORLD_COLS }, () =>
      row === 0
        ? createTile(TILE.SURFACE)
        : createTile(TILE.SOLID, null, getStratumTileMetadata(row))
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
    capacity: STARTING_INVENTORY_CAPACITY,
    counts: Object.fromEntries(ORE_ORDER.map((id) => [id, 0])),
  },
  upgrades: Object.fromEntries(UPGRADE_LINES.map((line) => [line.id, 0])),
  deepestDepth: 0,
  cash: 0,
  fuel: BASE_FUEL_CAPACITY,
  player: {
    x: (spawnCol + 0.5) * TILE_SIZE,
    y: (spawnRow + 0.5) * TILE_SIZE,
    size: 26,
    speed: STARTING_PLAYER_SPEED,
  },
};

function syncUpgradeState() {
  state.inventory.capacity =
    STARTING_INVENTORY_CAPACITY + getUpgradeEffectTotal("inventoryCapacity");
  state.player.speed = STARTING_PLAYER_SPEED + getUpgradeEffectTotal("moveSpeed");
  setFuel(state.fuel);
}

syncUpgradeState();

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

function getDeepestDepth() {
  return clamp(toNonNegativeInt(state.deepestDepth), 0, WORLD_ROWS - 1);
}

function updateDeepestDepth(depth = getPlayerDepth()) {
  const safeDepth = clamp(toNonNegativeInt(depth), 0, WORLD_ROWS - 1);
  state.deepestDepth = Math.max(getDeepestDepth(), safeDepth);
  return state.deepestDepth;
}

function getUpgradeLine(lineId) {
  return UPGRADE_LINES.find((line) => line.id === lineId) || null;
}

function getPurchasedUpgradeTier(lineId) {
  const line = getUpgradeLine(lineId);
  if (!line) return 0;
  return clamp(toNonNegativeInt(state.upgrades[lineId]), 0, line.tiers.length);
}

function getNextUpgradeTier(lineId) {
  const line = getUpgradeLine(lineId);
  if (!line) return null;
  return line.tiers[getPurchasedUpgradeTier(lineId)] || null;
}

function getUpgradeUnlock(lineId) {
  const line = getUpgradeLine(lineId);
  if (!line) return null;

  return getNextUpgradeTier(lineId)?.unlock || line.unlock || { minDepth: 0 };
}

function getUnlockDepth(unlock) {
  return clamp(toNonNegativeInt(unlock?.minDepth), 0, WORLD_ROWS - 1);
}

function formatUnlockLabel(unlock) {
  const minDepth = getUnlockDepth(unlock);
  if (minDepth === 0) return SURFACE_STRATUM.name;
  return `${getStratumForRow(minDepth).name} (${minDepth}m)`;
}

function isUpgradeUnlocked(lineId, milestoneDepth = getDeepestDepth()) {
  const line = getUpgradeLine(lineId);
  if (!line) return false;
  return milestoneDepth >= getUnlockDepth(getUpgradeUnlock(lineId));
}

function isUpgradeMaxed(lineId) {
  const line = getUpgradeLine(lineId);
  if (!line) return true;
  return getPurchasedUpgradeTier(lineId) >= line.tiers.length;
}

function canAffordUpgrade(lineId) {
  const nextTier = getNextUpgradeTier(lineId);
  return Boolean(nextTier) && getSafeCash() >= nextTier.cost;
}

function canPurchaseUpgrade(lineId, depth = getPlayerDepth()) {
  if (depth !== 0) return false;
  if (!getUpgradeLine(lineId)) return false;
  if (isUpgradeMaxed(lineId)) return false;
  if (!isUpgradeUnlocked(lineId)) return false;
  return canAffordUpgrade(lineId);
}

function purchaseUpgrade(lineId) {
  if (!canPurchaseUpgrade(lineId)) return false;

  const nextTier = getNextUpgradeTier(lineId);
  if (!nextTier) return false;

  state.cash = getSafeCash() - nextTier.cost;
  state.upgrades[lineId] = getPurchasedUpgradeTier(lineId) + 1;
  syncUpgradeState();
  updateHud();
  return true;
}

function createShopLine(line) {
  if (!hudShopList) return;

  const row = document.createElement("div");
  row.className = "shop-line";
  row.dataset.lineId = line.id;

  const main = document.createElement("div");
  main.className = "shop-line-main";

  const header = document.createElement("div");
  header.className = "shop-line-header";

  const name = document.createElement("div");
  name.className = "shop-line-name";
  name.textContent = line.name;

  const level = document.createElement("div");
  level.className = "shop-level";

  const meta = document.createElement("div");
  meta.className = "shop-line-meta";

  const effect = document.createElement("span");
  effect.className = "shop-effect";

  const cost = document.createElement("span");
  cost.className = "shop-cost";

  const status = document.createElement("div");
  status.className = "shop-status";

  const button = document.createElement("button");
  button.className = "hud-button shop-buy-button";
  button.type = "button";
  button.addEventListener("click", () => {
    purchaseUpgrade(line.id);
  });

  header.append(name, level);
  meta.append(effect, cost);
  main.append(header, meta, status);
  row.append(main, button);
  hudShopList.append(row);

  shopLineElements.set(line.id, { row, level, effect, cost, status, button });
}

function initializeShopList() {
  if (!hudShopList || shopLineElements.size > 0) return;
  UPGRADE_LINES.forEach((line) => {
    createShopLine(line);
  });
}

function getShopLineState(lineId, depth = getPlayerDepth()) {
  const nextTier = getNextUpgradeTier(lineId);

  if (isUpgradeMaxed(lineId)) {
    return {
      buttonDisabled: true,
      buttonLabel: "Maxed",
      costText: "Cost: --",
      effectText: "Next: Complete",
      rowClass: "is-maxed",
      statusText: "Maxed",
    };
  }

  if (!nextTier) {
    return {
      buttonDisabled: true,
      buttonLabel: "N/A",
      costText: "Cost: --",
      effectText: "Next: Pending",
      rowClass: "is-unaffordable",
      statusText: "Unavailable",
    };
  }

  const unlocked = isUpgradeUnlocked(lineId);
  const affordable = canAffordUpgrade(lineId);
  const onSurface = depth === 0;
  let buttonLabel = "Buy";
  let buttonDisabled = false;
  let rowClass = affordable ? "is-affordable" : "is-unaffordable";
  let statusText = affordable ? "Available" : "Need more cash";

  if (!unlocked) {
    buttonLabel = "Locked";
    buttonDisabled = true;
    rowClass = "is-locked";
    statusText = `Unlock at ${formatUnlockLabel(getUpgradeUnlock(lineId))}`;
  } else if (!onSurface) {
    buttonLabel = "Surface only";
    buttonDisabled = true;
    statusText = affordable ? "Surface only" : "Return with more cash";
  } else if (!affordable) {
    buttonDisabled = true;
  }

  return {
    buttonDisabled,
    buttonLabel,
    costText: `Cost: $${nextTier.cost}`,
    effectText: `Next: ${nextTier.effectLabel}`,
    rowClass,
    statusText,
  };
}

function updateShopLine(line, depth) {
  const elements = shopLineElements.get(line.id);
  if (!elements) return;

  const purchased = getPurchasedUpgradeTier(line.id);
  const lineState = getShopLineState(line.id, depth);

  elements.row.classList.remove("is-locked", "is-affordable", "is-unaffordable", "is-maxed");
  elements.row.classList.add(lineState.rowClass);
  elements.level.textContent = `Level ${purchased}/${line.tiers.length}`;
  elements.effect.textContent = lineState.effectText;
  elements.cost.textContent = lineState.costText;
  elements.status.textContent = lineState.statusText;
  elements.button.disabled = lineState.buttonDisabled;
  elements.button.textContent = lineState.buttonLabel;
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

  let speed = getMoveSpeed();
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
  syncUpgradeState();
  const depth = getPlayerDepth();
  updateDeepestDepth(depth);
  initializeShopList();
  const stratumName = getStratumForRow(depth).name;
  if (depth === 0) {
    setFuel(getMaxFuel());
  }
  const cash = getSafeCash();
  const capacity = getSafeCapacity();
  const fuelCapacity = getMaxFuel();
  const fuel = getSafeFuel();
  if (hudStratum) {
    hudStratum.textContent = stratumName;
  }
  hudDepth.textContent = `${depth}m`;
  hudCash.textContent = `$${cash}`;
  const total = getInventoryTotal();
  const perOre = ORE_ORDER.map(
    (oreId) => `${ORE_TYPES[oreId].short}:${getSafeOreCount(oreId)}`
  ).join(" ");
  hudInventory.textContent = `${total} / ${capacity} | ${perOre}`;
  if (hudFuel) {
    hudFuel.textContent = `${fuel} / ${fuelCapacity}`;
  }
  if (hudFuelRow) {
    hudFuelRow.classList.toggle("is-low", isFuelLow(fuel));
  }

  const canSell = depth === 0 && total > 0;
  if (hudSellRow) {
    hudSellRow.hidden = !canSell;
  }
  if (sellButton) {
    sellButton.disabled = !canSell;
  }
  UPGRADE_LINES.forEach((line) => {
    updateShopLine(line, depth);
  });
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
        ctx.fillStyle = getSolidTileColor(tile, row);
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

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(tick);

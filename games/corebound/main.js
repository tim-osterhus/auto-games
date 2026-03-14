const WIDTH = 12;
const HEIGHT = 18;
const BASE_PRESSURE = 100;
const BASE_MOVE_COST = 1;
const BASE_MINE_COST = 4;
const SAVE_KEY = "corebound-save-v1";
const SURFACE_X = 5;
const CAVERN_COUNT = 3;
const HAZARD_TELEGRAPH_TURNS = 2;
const HAZARD_TRIGGER_RADIUS = 1;
const RUN_LAYOUT_ATTEMPTS = 80;

const HAZARD_TYPES = {
  vent: {
    label: "Pressure vent",
    pressureCost: 8,
    telegraphText: "A pressure vent starts hissing nearby.",
  },
  caveIn: {
    label: "Unstable cave-in",
    pressureCost: 5,
    telegraphText: "Loose rock shifts. A cave-in is forming.",
  },
};

const RESOURCE_TYPES = {
  copper: { value: 4, label: "Copper shards" },
  amber: { value: 7, label: "Amber resin" },
  iridium: { value: 12, label: "Iridium cores" },
};

const RESOURCE_IDS = Object.keys(RESOURCE_TYPES);

const CONTRACT_PRESETS = {
  standard: {
    copper: { targets: [4, 3, 2], payout: 18, title: "Copper rush" },
    amber: { targets: [3, 2], payout: 24, title: "Amber insulation" },
    iridium: { targets: [2, 1], payout: 32, title: "Iridium survey" },
  },
  deep: {
    copper: { targets: [3, 2], payout: 24, title: "Lower seam braces" },
    amber: { targets: [3, 2], payout: 30, title: "Deep amber lattice" },
    iridium: { targets: [2, 1], payout: 38, title: "Abyssal iridium scan" },
  },
  relic: {
    payout: 44,
    target: 1,
    title: "Relic recovery",
    description: "Retrieve the buried relic node from the lower shaft and keep it intact through the run.",
  },
};

const UPGRADES = {
  servos: {
    label: "Servo Rails",
    description: "Traverse the shaft with less pressure loss on each movement step.",
    baseCost: 14,
    costStep: 10,
    maxLevel: 4,
    effect(level) {
      return `Move cost ${formatNumber(Math.max(0.4, BASE_MOVE_COST - level * 0.15))}`;
    },
  },
  drill: {
    label: "Resonant Drill",
    description: "Cuts ore veins cleaner, reducing the pressure cost of each mining hit.",
    baseCost: 18,
    costStep: 12,
    maxLevel: 4,
    effect(level) {
      return `Mine cost ${formatNumber(Math.max(1.5, BASE_MINE_COST - level * 0.65))}`;
    },
  },
  seals: {
    label: "Pressure Seals",
    description: "Adds reinforced hull buffering so every fresh run starts with more pressure.",
    baseCost: 16,
    costStep: 14,
    maxLevel: 4,
    effect(level) {
      return `${BASE_PRESSURE + level * 20} max pressure`;
    },
  },
};

const elements = {
  grid: document.querySelector("#game-grid"),
  feedbackLayer: document.querySelector("#feedback-layer"),
  message: document.querySelector("#message"),
  depth: document.querySelector("#depth-value"),
  banked: document.querySelector("#banked-value"),
  bankedCard: document.querySelector("#banked-card"),
  pressure: document.querySelector("#pressure-value"),
  pressureDetail: document.querySelector("#pressure-detail"),
  pressureFill: document.querySelector("#pressure-fill"),
  pressureBlock: document.querySelector("#pressure-block"),
  hazardBadge: document.querySelector("#hazard-badge"),
  hazardStatus: document.querySelector("#hazard-status"),
  contractList: document.querySelector("#contract-list"),
  relicStatus: document.querySelector("#relic-status"),
  cargoTotal: document.querySelector("#cargo-total"),
  cargoCopper: document.querySelector("#cargo-copper"),
  cargoAmber: document.querySelector("#cargo-amber"),
  cargoIridium: document.querySelector("#cargo-iridium"),
  upgradeHint: document.querySelector("#upgrade-hint"),
  upgradeList: document.querySelector("#upgrade-list"),
  restartButton: document.querySelector("#restart-button"),
  overlay: document.querySelector("#overlay"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlayCopy: document.querySelector("#overlay-copy"),
  overlayRestart: document.querySelector("#overlay-restart"),
  onboardingOverlay: document.querySelector("#onboarding-overlay"),
  onboardingDismiss: document.querySelector("#onboarding-dismiss"),
};

let saveState = loadSave();
let state = createRunState();
let nextFeedbackId = 1;

function defaultSave() {
  return {
    bankedCurrency: 0,
    upgrades: {
      servos: 0,
      drill: 0,
      seals: 0,
    },
    onboardingDismissed: false,
  };
}

function loadSave() {
  const fallback = defaultSave();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return {
      bankedCurrency: Number.isFinite(parsed?.bankedCurrency) ? parsed.bankedCurrency : fallback.bankedCurrency,
      upgrades: {
        servos: sanitizeLevel(parsed?.upgrades?.servos, UPGRADES.servos.maxLevel),
        drill: sanitizeLevel(parsed?.upgrades?.drill, UPGRADES.drill.maxLevel),
        seals: sanitizeLevel(parsed?.upgrades?.seals, UPGRADES.seals.maxLevel),
      },
      onboardingDismissed: Boolean(parsed?.onboardingDismissed),
    };
  } catch (error) {
    return fallback;
  }
}

function sanitizeLevel(value, maxLevel) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(maxLevel, Math.floor(value)));
}

function persistSave() {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
}

function formatNumber(value) {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1);
}

function currentMaxPressure() {
  return BASE_PRESSURE + saveState.upgrades.seals * 20;
}

function currentMoveCost() {
  return Math.max(0.4, BASE_MOVE_COST - saveState.upgrades.servos * 0.15);
}

function currentMineCost() {
  return Math.max(1.5, BASE_MINE_COST - saveState.upgrades.drill * 0.65);
}

function createRunState() {
  const maxPressure = currentMaxPressure();
  const { grid, hazards, pickups, contracts } = createValidatedRunLayout();
  return {
    grid,
    hazards,
    player: { x: SURFACE_X, y: 0 },
    cargo: { copper: 0, amber: 0, iridium: 0 },
    pickups,
    pressure: maxPressure,
    maxPressure,
    moveCount: 0,
    gameOver: false,
    statusMessage: "Mine downward, complete the three contracts, then return to the extractor to bank cargo and payouts.",
    hazardStatus: {
      tone: "stable",
      badge: "Stable",
      text: "No active hazard signatures yet. Procedural caverns can hide vents and cave-ins off the main shaft.",
    },
    contractStatus: contracts,
    carryingRelic: false,
    floatingFeedback: [],
    tileFeedback: [],
  };
}

function createValidatedRunLayout() {
  for (let attempt = 0; attempt < RUN_LAYOUT_ATTEMPTS; attempt += 1) {
    const layout = createGrid();
    const reachable = getReachableTiles(layout.grid, { x: SURFACE_X, y: 0 });
    const runDirectives = createContractStatus(layout.grid, layout.hazards, reachable);
    if (runDirectives) {
      return {
        ...layout,
        pickups: [{ x: runDirectives.relicTile.x, y: runDirectives.relicTile.y, type: "relic" }],
        contracts: runDirectives.contracts,
      };
    }
  }

  throw new Error("Corebound could not generate a valid contract and relic layout.");
}

function createContractStatus(grid, hazards, reachable) {
  const midpoint = (HEIGHT - 1) / 2;
  const reachableResources = getReachableResourcePools(grid, reachable);
  const generalResource = pickContractResource(reachableResources.all, CONTRACT_PRESETS.standard);
  const deepResource = pickContractResource(reachableResources.lowerHalf, CONTRACT_PRESETS.deep);
  const relicTile = pickRelicTile(reachable, hazards, midpoint);

  if (!generalResource || !deepResource || !relicTile) {
    return null;
  }

  return {
    relicTile,
    contracts: [
      buildResourceContract("standard", generalResource.resource, generalResource.available, "Extractor Contract 01"),
      buildResourceContract("deep", deepResource.resource, deepResource.available, "Extractor Contract 02"),
      {
        id: `relic-${relicTile.x}-${relicTile.y}`,
        kind: "relic",
        label: "Extractor Contract 03",
        title: CONTRACT_PRESETS.relic.title,
        description: CONTRACT_PRESETS.relic.description,
        target: CONTRACT_PRESETS.relic.target,
        payout: CONTRACT_PRESETS.relic.payout,
        progress: 0,
        paid: false,
      },
    ],
  };
}

function createGrid() {
  const grid = Array.from({ length: HEIGHT }, (_, y) => {
    return Array.from({ length: WIDTH }, (_, x) => {
      if (y === 0) {
        return x === SURFACE_X ? "extractor" : "air";
      }
      return "rock";
    });
  });

  const route = carvePrimaryRoute(grid);
  const caverns = carveCaverns(grid, route);
  seedRouteResources(grid, route, caverns);
  populateResources(grid);
  const hazards = createHazards(grid, route, caverns);
  return { grid, hazards };
}

function getReachableTiles(grid, start) {
  const queue = [{ x: start.x, y: start.y }];
  const tiles = [{ x: start.x, y: start.y }];
  const seen = new Set([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const current = queue.shift();
    const adjacent = [
      { x: current.x, y: current.y - 1 },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
    ];

    adjacent.forEach((point) => {
      if (point.x < 0 || point.x >= WIDTH || point.y < 0 || point.y >= HEIGHT) {
        return;
      }
      const key = `${point.x},${point.y}`;
      if (seen.has(key) || !isWalkableTile(grid[point.y][point.x])) {
        return;
      }
      seen.add(key);
      queue.push(point);
      tiles.push(point);
    });
  }

  return { tiles, seen };
}

function getReachableResourcePools(grid, reachable) {
  const all = {};
  const lowerHalf = {};
  const midpoint = (HEIGHT - 1) / 2;

  RESOURCE_IDS.forEach((resource) => {
    all[resource] = [];
    lowerHalf[resource] = [];
  });

  for (let y = 1; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const tile = grid[y][x];
      if (!RESOURCE_TYPES[tile] || !hasReachableAdjacentTile(reachable.seen, x, y)) {
        continue;
      }

      const point = { x, y };
      all[tile].push(point);
      if (y > midpoint) {
        lowerHalf[tile].push(point);
      }
    }
  }

  return { all, lowerHalf };
}

function hasReachableAdjacentTile(reachableSet, x, y) {
  const adjacent = [
    { x, y: y - 1 },
    { x: x + 1, y },
    { x, y: y + 1 },
    { x: x - 1, y },
  ];

  return adjacent.some((point) => reachableSet.has(`${point.x},${point.y}`));
}

function pickContractResource(pool, presetGroup) {
  const candidates = RESOURCE_IDS
    .map((resource) => ({ resource, available: pool[resource]?.length ?? 0 }))
    .filter((entry) => chooseContractTarget(presetGroup[entry.resource].targets, entry.available) > 0);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[randomInt(0, candidates.length - 1)];
}

function chooseContractTarget(targets, available) {
  const validTargets = targets.filter((target) => target <= available);
  if (validTargets.length === 0) {
    return 0;
  }
  return validTargets[randomInt(0, validTargets.length - 1)];
}

function buildResourceContract(kind, resource, available, label) {
  const preset = CONTRACT_PRESETS[kind][resource];
  const target = chooseContractTarget(preset.targets, available);
  const resourceLabel = RESOURCE_TYPES[resource].label.toLowerCase();
  const description = kind === "deep"
    ? `Pull ${resourceLabel} from the lower shaft and return it before the route destabilizes.`
    : `Feed the extractor with reachable ${resourceLabel} to stabilize the next survey pass.`;

  return {
    id: `${kind}-${resource}-${target}`,
    kind,
    label,
    title: preset.title,
    description,
    resource,
    target,
    payout: preset.payout,
    progress: 0,
    paid: false,
  };
}

function pickRelicTile(reachable, hazards, midpoint) {
  const blockedHazards = new Set(hazards.map((hazard) => `${hazard.x},${hazard.y}`));
  const candidates = reachable.tiles.filter((point) => {
    if (point.x === SURFACE_X && point.y === 0) {
      return false;
    }
    if (point.y <= midpoint || blockedHazards.has(`${point.x},${point.y}`)) {
      return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates[randomInt(0, candidates.length - 1)];
}

function createHazards(grid, route, caverns) {
  const hazards = [];
  const used = new Set([`${SURFACE_X},0`]);
  const routeCandidates = route.filter((point) => point.y >= 2 && point.y <= HEIGHT - 2);
  const cavernCandidates = caverns.map((cavern) => ({ x: cavern.x, y: cavern.y })).filter((point) => point.y >= 2);
  const ventTargets = [0.28, 0.68];
  const caveInTargets = [0.46, 0.82];

  ventTargets.forEach((ratio) => {
    const anchor = pickHazardAnchor(routeCandidates, used, ratio, () => true);
    if (anchor) {
      hazards.push(createHazard(anchor.x, anchor.y, "vent"));
      used.add(`${anchor.x},${anchor.y}`);
    }
  });

  caveInTargets.forEach((ratio) => {
    const anchor = pickHazardAnchor(
      [...routeCandidates, ...cavernCandidates],
      used,
      ratio,
      (point) => getAdjacentRockTiles(grid, point.x, point.y).length > 0,
    );
    if (anchor) {
      hazards.push(createHazard(anchor.x, anchor.y, "caveIn"));
      used.add(`${anchor.x},${anchor.y}`);
    }
  });

  return hazards;
}

function createHazard(x, y, type) {
  return {
    id: `${type}-${x}-${y}`,
    x,
    y,
    type,
    state: "idle",
    countdown: 0,
  };
}

function pickHazardAnchor(candidates, used, depthRatio, predicate) {
  const targetY = Math.round((HEIGHT - 1) * depthRatio);
  const ranked = candidates
    .filter((point) => !used.has(`${point.x},${point.y}`) && predicate(point))
    .sort((left, right) => {
      const leftScore = Math.abs(left.y - targetY) + Math.abs(left.x - SURFACE_X) * 0.1;
      const rightScore = Math.abs(right.y - targetY) + Math.abs(right.x - SURFACE_X) * 0.1;
      return leftScore - rightScore;
    });
  return ranked[0] || null;
}

function carvePrimaryRoute(grid) {
  const route = [{ x: SURFACE_X, y: 0 }];
  let x = SURFACE_X;

  for (let y = 1; y < HEIGHT; y += 1) {
    const previousX = x;
    if (y > 1) {
      const driftRoll = Math.random();
      if (driftRoll < 0.36) {
        x += -1;
      } else if (driftRoll > 0.64) {
        x += 1;
      }
      x = clamp(x, 1, WIDTH - 2);
    }

    setGridTile(grid, x, y, "air");
    if (x !== previousX) {
      const startX = Math.min(x, previousX);
      const endX = Math.max(x, previousX);
      for (let tunnelX = startX; tunnelX <= endX; tunnelX += 1) {
        setGridTile(grid, tunnelX, y, "air");
      }
    }
    route.push({ x, y });

    if (y < HEIGHT - 1 && Math.random() < 0.4) {
      const branchDirection = x <= SURFACE_X ? 1 : -1;
      const branchX = clamp(x + branchDirection, 1, WIDTH - 2);
      setGridTile(grid, branchX, y, "air");
    }
  }

  return route;
}

function carveCaverns(grid, route) {
  const caverns = [];
  const usedRows = new Set();

  for (let index = 0; index < CAVERN_COUNT; index += 1) {
    let anchor = null;
    let attempts = 0;
    while (!anchor && attempts < 20) {
      const routeIndex = randomInt(3, route.length - 2);
      const candidate = route[routeIndex];
      if (!usedRows.has(candidate.y)) {
        anchor = candidate;
        usedRows.add(candidate.y);
      }
      attempts += 1;
    }

    if (!anchor) {
      continue;
    }

    const radiusX = randomInt(1, 2);
    const radiusY = randomInt(1, 2);
    const centerX = clamp(anchor.x + randomInt(-2, 2), 1, WIDTH - 2);
    const centerY = clamp(anchor.y + randomInt(-1, 1), 2, HEIGHT - 2);

    for (let y = centerY - radiusY; y <= centerY + radiusY; y += 1) {
      for (let x = centerX - radiusX; x <= centerX + radiusX; x += 1) {
        const normalizedX = (x - centerX) / (radiusX + 0.25);
        const normalizedY = (y - centerY) / (radiusY + 0.25);
        if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) {
          setGridTile(grid, x, y, "air");
        }
      }
    }

    carveTunnel(grid, anchor.x, anchor.y, centerX, centerY);
    caverns.push({ x: centerX, y: centerY, radiusX, radiusY });
  }

  return caverns;
}

function carveTunnel(grid, startX, startY, endX, endY) {
  let x = startX;
  let y = startY;

  while (x !== endX || y !== endY) {
    setGridTile(grid, x, y, "air");
    if (x !== endX && (y === endY || Math.random() < 0.5)) {
      x += Math.sign(endX - x);
    } else if (y !== endY) {
      y += Math.sign(endY - y);
    }
  }

  setGridTile(grid, endX, endY, "air");
}

function seedRouteResources(grid, route, caverns) {
  route.forEach((point, index) => {
    if (point.y === 0) {
      return;
    }

    const direction = index % 2 === 0 ? 1 : -1;
    const targetX = point.x + direction;
    if (isSolidTile(grid, targetX, point.y)) {
      setGridTile(grid, targetX, point.y, pickResourceForDepth(point.y, true));
    }
  });

  caverns.forEach((cavern, index) => {
    const resourceY = clamp(cavern.y, 1, HEIGHT - 1);
    const leftX = cavern.x - cavern.radiusX - 1;
    const rightX = cavern.x + cavern.radiusX + 1;
    const targetX = index % 2 === 0 ? leftX : rightX;
    if (isSolidTile(grid, targetX, resourceY)) {
      setGridTile(grid, targetX, resourceY, pickResourceForDepth(resourceY, true));
    }
  });
}

function populateResources(grid) {
  for (let y = 1; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (!isSolidTile(grid, x, y)) {
        continue;
      }

      if (Math.random() < resourceChanceForDepth(y)) {
        setGridTile(grid, x, y, pickResourceForDepth(y, false));
      }
    }
  }
}

function resourceChanceForDepth(y) {
  const depthRatio = y / (HEIGHT - 1);
  return 0.16 + depthRatio * 0.32;
}

function pickResourceForDepth(y, boosted) {
  const depthRatio = y / (HEIGHT - 1);
  const copperWeight = Math.max(0.2, 1.35 - depthRatio * 0.9 + (boosted && depthRatio < 0.35 ? 0.45 : 0));
  const amberWeight = 0.3 + depthRatio * 0.95 + (boosted && depthRatio >= 0.25 ? 0.2 : 0);
  const iridiumWeight = 0.08 + depthRatio * depthRatio * 1.35 + (boosted && depthRatio >= 0.55 ? 0.3 : 0);
  const totalWeight = copperWeight + amberWeight + iridiumWeight;
  const roll = Math.random() * totalWeight;

  if (roll < copperWeight) {
    return "copper";
  }
  if (roll < copperWeight + amberWeight) {
    return "amber";
  }
  return "iridium";
}

function isSolidTile(grid, x, y) {
  if (x < 0 || x >= WIDTH || y <= 0 || y >= HEIGHT) {
    return false;
  }
  return grid[y][x] === "rock";
}

function isWalkableTile(tile) {
  return tile === "air" || tile === "extractor";
}

function getAdjacentRockTiles(grid, x, y) {
  const adjacent = [
    { x, y: y - 1 },
    { x: x + 1, y },
    { x, y: y + 1 },
    { x: x - 1, y },
  ];
  return adjacent.filter((point) => isSolidTile(grid, point.x, point.y));
}

function setGridTile(grid, x, y, tile) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
    return;
  }
  grid[y][x] = tile;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTile(x, y) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
    return "void";
  }
  return state.grid[y][x];
}

function setTile(x, y, tile) {
  state.grid[y][x] = tile;
}

function pickupAt(x, y) {
  return state.pickups.find((pickup) => pickup.x === x && pickup.y === y) || null;
}

function removePickupAt(x, y) {
  state.pickups = state.pickups.filter((pickup) => pickup.x !== x || pickup.y !== y);
}

function tileFeedbackAt(x, y) {
  return state.tileFeedback.find((feedback) => feedback.x === x && feedback.y === y) || null;
}

function hazardAt(x, y) {
  return state.hazards.find((hazard) => hazard.x === x && hazard.y === y) || null;
}

function removeFeedback(collectionName, id) {
  state[collectionName] = state[collectionName].filter((entry) => entry.id !== id);
  render();
}

function addFloatingFeedback(text, x, y, kind) {
  const id = nextFeedbackId;
  nextFeedbackId += 1;
  state.floatingFeedback.push({ id, text, x, y, kind });
  render();
  window.setTimeout(() => removeFeedback("floatingFeedback", id), 900);
}

function addTileFeedback(x, y, kind) {
  const id = nextFeedbackId;
  nextFeedbackId += 1;
  state.tileFeedback.push({ id, x, y, kind });
  render();
  window.setTimeout(() => removeFeedback("tileFeedback", id), 420);
}

function distanceBetween(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function pulseElement(element, className, duration = 650) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => {
    element.classList.remove(className);
  }, duration);
}

function totalCargo() {
  return Object.values(state.cargo).reduce((sum, amount) => sum + amount, 0);
}

function bankedCurrency() {
  return saveState.bankedCurrency;
}

function announceContractCompletion(contract, x, y) {
  addFloatingFeedback(`${contract.label} complete`, x + 0.5, y + 0.5, "contract");
}

function updateContractProgress(resourceType, x, y) {
  const completedContracts = [];
  state.contractStatus.forEach((contract) => {
    const matchesResource = resourceType === "relic"
      ? contract.kind === "relic"
      : contract.kind !== "relic" && contract.resource === resourceType;
    if (!matchesResource || contract.paid || contract.progress >= contract.target) {
      return;
    }
    contract.progress = Math.min(contract.target, contract.progress + 1);
    if (contract.progress >= contract.target) {
      completedContracts.push(contract);
    }
  });

  completedContracts.forEach((contract, index) => {
    announceContractCompletion(contract, x, y + index * 0.35);
  });

  if (completedContracts.length > 0) {
    const completionLabel = completedContracts.length === 1 ? completedContracts[0].label : `${completedContracts.length} contracts`;
    state.statusMessage = `${completionLabel} complete. Bank at the extractor to claim payout.`;
  }
  return completedContracts.length > 0;
}

function setHazardStatus(text, tone = "stable") {
  const config = {
    stable: { badge: "Stable" },
    warning: { badge: "Warning" },
    impact: { badge: "Impact" },
  };
  const nextTone = config[tone] ? tone : "stable";
  state.hazardStatus = {
    tone: nextTone,
    badge: config[nextTone].badge,
    text,
  };
}

function betweenRuns() {
  return state.gameOver || (state.player.x === SURFACE_X && state.player.y === 0 && totalCargo() === 0);
}

function spendPressure(amount, reason, focusX = state.player.x, focusY = state.player.y) {
  state.pressure = Math.max(0, state.pressure - amount);
  if (reason === "mine" || reason === "damage") {
    pulseElement(elements.pressureBlock, "is-damaged", 450);
    addFloatingFeedback(`-${formatNumber(amount)} pressure`, focusX + 0.5, focusY + 0.45, "damage");
  }
  if (state.pressure === 0) {
    triggerFailure();
  }
}

function advanceHazards() {
  state.moveCount += 1;
  const hazardMessages = [];
  let hazardTone = "stable";

  state.hazards.forEach((hazard) => {
    if (hazard.state !== "telegraph") {
      return;
    }

    hazard.countdown -= 1;
    if (hazard.countdown <= 0) {
      const resolution = resolveHazard(hazard);
      if (resolution) {
        hazardMessages.push(resolution.text);
        hazardTone = resolution.tone;
      }
    }
  });

  state.hazards = state.hazards.filter((hazard) => hazard.state !== "resolved");
  if (state.gameOver) {
    return;
  }

  state.hazards.forEach((hazard) => {
    if (hazard.state !== "idle") {
      return;
    }
    if (distanceBetween(state.player.x, state.player.y, hazard.x, hazard.y) > HAZARD_TRIGGER_RADIUS) {
      return;
    }
    hazard.state = "telegraph";
    hazard.countdown = HAZARD_TELEGRAPH_TURNS;
    hazardMessages.push(HAZARD_TYPES[hazard.type].telegraphText);
    hazardTone = "warning";
  });

  if (hazardMessages.length > 0) {
    state.statusMessage = hazardMessages.join(" ");
    setHazardStatus(hazardMessages.join(" "), hazardTone);
  }
}

function resolveHazard(hazard) {
  let resolution = null;
  if (hazard.type === "vent") {
    resolution = resolveVentHazard(hazard);
  } else if (hazard.type === "caveIn") {
    resolution = resolveCaveInHazard(hazard);
  }
  hazard.state = "resolved";
  return resolution;
}

function resolveVentHazard(hazard) {
  addTileFeedback(hazard.x, hazard.y, "hazard");
  addFloatingFeedback("Vent", hazard.x + 0.5, hazard.y + 0.5, "warning");

  const isNearby = distanceBetween(state.player.x, state.player.y, hazard.x, hazard.y) <= HAZARD_TRIGGER_RADIUS;
  if (isNearby) {
    spendPressure(HAZARD_TYPES.vent.pressureCost, "damage", hazard.x, hazard.y);
    return {
      tone: "impact",
      text: "A pressure vent erupts and scorches the rig hull.",
    };
  }

  return {
    tone: "stable",
    text: "A pressure vent bursts harmlessly into an empty shaft.",
  };
}

function resolveCaveInHazard(hazard) {
  const collapseTarget = findSafeCaveInTarget(hazard);
  let terrainMessage = "The cave-in shudders, but the extractor route holds.";
  let tone = "stable";

  if (collapseTarget) {
    setTile(collapseTarget.x, collapseTarget.y, "rock");
    removePickupAt(collapseTarget.x, collapseTarget.y);
    addTileFeedback(collapseTarget.x, collapseTarget.y, "hazard");
    terrainMessage = "An unstable cave-in seals a tunnel, but the return route stays open.";
  } else {
    const breachTarget = getAdjacentRockTiles(state.grid, hazard.x, hazard.y)[0];
    if (breachTarget) {
      setTile(breachTarget.x, breachTarget.y, "air");
      addTileFeedback(breachTarget.x, breachTarget.y, "hazard");
      terrainMessage = "The cave-in breaks sideways and opens a fresh bypass through the rock.";
    }
  }

  addFloatingFeedback("Shift", hazard.x + 0.5, hazard.y + 0.5, "warning");
  if (distanceBetween(state.player.x, state.player.y, hazard.x, hazard.y) <= HAZARD_TRIGGER_RADIUS) {
    spendPressure(HAZARD_TYPES.caveIn.pressureCost, "damage", hazard.x, hazard.y);
    tone = "impact";
  }
  return { tone, text: terrainMessage };
}

function findSafeCaveInTarget(hazard) {
  const candidates = [
    { x: hazard.x, y: hazard.y },
    { x: hazard.x, y: hazard.y - 1 },
    { x: hazard.x + 1, y: hazard.y },
    { x: hazard.x, y: hazard.y + 1 },
    { x: hazard.x - 1, y: hazard.y },
  ];

  return candidates.find((candidate) => {
    if (candidate.x === SURFACE_X && candidate.y === 0) {
      return false;
    }
    if (candidate.x === state.player.x && candidate.y === state.player.y) {
      return false;
    }
    if (!isWalkableTile(getTile(candidate.x, candidate.y))) {
      return false;
    }
    return pathToExtractorExists(state.grid, state.player, candidate);
  }) || null;
}

function pathToExtractorExists(grid, start, blocked = null) {
  const startKey = `${start.x},${start.y}`;
  const queue = [{ x: start.x, y: start.y }];
  const seen = new Set([startKey]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.x === SURFACE_X && current.y === 0) {
      return true;
    }

    const adjacent = [
      { x: current.x, y: current.y - 1 },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
    ];

    adjacent.forEach((point) => {
      if (point.x < 0 || point.x >= WIDTH || point.y < 0 || point.y >= HEIGHT) {
        return;
      }
      if (blocked && point.x === blocked.x && point.y === blocked.y) {
        return;
      }
      const key = `${point.x},${point.y}`;
      if (seen.has(key)) {
        return;
      }
      if (!isWalkableTile(grid[point.y][point.x])) {
        return;
      }
      seen.add(key);
      queue.push(point);
    });
  }

  return false;
}

function collectPickup(x, y) {
  const pickup = pickupAt(x, y);
  if (!pickup) {
    return;
  }
  state.pickups = state.pickups.filter((item) => item !== pickup);
  if (pickup.type === "relic") {
    state.carryingRelic = true;
    const completedContract = updateContractProgress("relic", x, y);
    if (!completedContract) {
      state.statusMessage = "Recovered the relic core. It only pays if you bank it at the extractor, and failure loses it.";
    }
    addTileFeedback(x, y, "relic");
    addFloatingFeedback("Relic secured", x + 0.5, y + 0.5, "relic");
    return;
  }

  state.cargo[pickup.type] += 1;
  const completedContract = updateContractProgress(pickup.type, x, y);
  if (!completedContract) {
    state.statusMessage = `Collected ${RESOURCE_TYPES[pickup.type].label}.`;
  }
  addTileFeedback(x, y, "pickup");
  addFloatingFeedback(`+1 ${pickup.type}`, x + 0.5, y + 0.5, "pickup");
}

function bankCargo() {
  const cargoHaul = Object.entries(state.cargo).reduce((sum, [type, amount]) => {
    return sum + amount * RESOURCE_TYPES[type].value;
  }, 0);
  const payableContracts = state.contractStatus.filter((contract) => !contract.paid && contract.progress >= contract.target);
  const contractHaul = payableContracts
    .filter((contract) => contract.kind !== "relic")
    .reduce((sum, contract) => sum + contract.payout, 0);
  const relicHaul = payableContracts
    .filter((contract) => contract.kind === "relic")
    .reduce((sum, contract) => sum + contract.payout, 0);
  const totalHaul = cargoHaul + contractHaul + relicHaul;

  state.cargo = { copper: 0, amber: 0, iridium: 0 };
  state.pressure = state.maxPressure;
  state.carryingRelic = false;
  payableContracts.forEach((contract) => {
    contract.paid = true;
  });

  if (totalHaul === 0) {
    state.statusMessage = "Extractor sealed. Pressure refreshed, but cargo hold is empty.";
    setHazardStatus("Surface systems clear. No active hazard telegraphs remain on this run.", "stable");
    addTileFeedback(SURFACE_X, 0, "bank");
    render();
    return;
  }

  saveState.bankedCurrency += totalHaul;
  persistSave();
  const bankedParts = [];
  if (cargoHaul > 0) {
    bankedParts.push(`${cargoHaul} cargo credits`);
  }
  if (contractHaul > 0) {
    bankedParts.push(`${contractHaul} contract credits`);
  }
  if (relicHaul > 0) {
    bankedParts.push(`${relicHaul} relic bonus credits`);
  }
  state.statusMessage = `Banked ${bankedParts.join(", ")}. Hull pressure refreshed.`;
  setHazardStatus("Extractor reset the rig. Banked credits and upgrades persist into the next launch.", "stable");
  addTileFeedback(SURFACE_X, 0, "bank");
  if (cargoHaul > 0) {
    addFloatingFeedback(`+${cargoHaul} cr cargo`, SURFACE_X + 0.5, 0.55, "bank");
  }
  if (contractHaul > 0) {
    addFloatingFeedback(`+${contractHaul} cr contracts`, SURFACE_X + 0.5, 0.95, "contract");
  }
  if (relicHaul > 0) {
    addFloatingFeedback(`+${relicHaul} cr relic`, SURFACE_X + 0.5, 1.35, "relic-bank");
  }
  pulseElement(elements.bankedCard, "is-banked");
}

function triggerFailure() {
  state.gameOver = true;
  state.cargo = { copper: 0, amber: 0, iridium: 0 };
  state.carryingRelic = false;
  state.contractStatus.forEach((contract) => {
    if (!contract.paid) {
      contract.progress = 0;
    }
  });
  state.pickups = [];
  elements.overlayTitle.textContent = "Pressure failure";
  elements.overlayCopy.textContent = "Unbanked cargo, unpaid contract progress, and any carried relic were lost. Banked currency and purchased upgrades persist.";
  elements.overlay.classList.remove("hidden");
  state.statusMessage = "Pressure collapsed. Restart to launch a fresh run.";
  setHazardStatus("Run lost. Restart clears this run's hazards, but banked currency, upgrades, and briefing progress stay intact.", "impact");
}

function restartRun() {
  state = createRunState();
  elements.overlay.classList.add("hidden");
  render();
}

function upgradeCost(upgradeId) {
  const upgrade = UPGRADES[upgradeId];
  const level = saveState.upgrades[upgradeId];
  return upgrade.baseCost + level * upgrade.costStep;
}

function tryPurchaseUpgrade(upgradeId) {
  if (!betweenRuns()) {
    state.statusMessage = "Upgrades can only be installed at the extractor between runs.";
    render();
    return;
  }

  const upgrade = UPGRADES[upgradeId];
  const level = saveState.upgrades[upgradeId];
  if (level >= upgrade.maxLevel) {
    state.statusMessage = `${upgrade.label} is already maxed out.`;
    render();
    return;
  }

  const cost = upgradeCost(upgradeId);
  if (saveState.bankedCurrency < cost) {
    state.statusMessage = `Need ${cost} credits for ${upgrade.label}.`;
    render();
    return;
  }

  saveState.bankedCurrency -= cost;
  saveState.upgrades[upgradeId] += 1;
  persistSave();
  state.maxPressure = currentMaxPressure();
  if (state.player.x === SURFACE_X && state.player.y === 0) {
    state.pressure = state.maxPressure;
  } else {
    state.pressure = Math.min(state.pressure, state.maxPressure);
  }
  state.statusMessage = `${upgrade.label} upgraded to level ${saveState.upgrades[upgradeId]}.`;
  setHazardStatus("Hangar systems recalibrated. Launching a fresh run will generate a new hazard layout.", "stable");
  addFloatingFeedback(`-${cost} cr`, SURFACE_X + 0.5, 0.55, "damage");
  pulseElement(elements.bankedCard, "is-banked");
  render();
}

function dismissOnboarding() {
  saveState.onboardingDismissed = true;
  persistSave();
  elements.onboardingOverlay.classList.add("hidden");
}

function movePlayer(dx, dy) {
  if (state.gameOver || !elements.onboardingOverlay.classList.contains("hidden")) {
    return;
  }

  const nextX = state.player.x + dx;
  const nextY = state.player.y + dy;
  const tile = getTile(nextX, nextY);
  if (tile === "void") {
    state.statusMessage = "The rig cannot move beyond the mine boundary.";
    render();
    return;
  }

  if (tile === "rock" || RESOURCE_TYPES[tile]) {
    if (tile !== "rock") {
      state.pickups.push({ x: nextX, y: nextY, type: tile });
      state.statusMessage = `${RESOURCE_TYPES[tile].label} exposed. Move onto the drop to collect it.`;
    } else {
      state.statusMessage = "Rock wall broken open.";
    }
    setTile(nextX, nextY, "air");
    addTileFeedback(nextX, nextY, "mine");
    addFloatingFeedback("Crack", nextX + 0.5, nextY + 0.5, "damage");
    spendPressure(currentMineCost(), "mine", nextX, nextY);
    if (!state.gameOver) {
      advanceHazards();
    }
    render();
    return;
  }

  state.player.x = nextX;
  state.player.y = nextY;
  spendPressure(currentMoveCost(), "move");
  if (state.gameOver) {
    render();
    return;
  }
  collectPickup(nextX, nextY);
  if (getTile(nextX, nextY) === "extractor") {
    bankCargo();
  }
  advanceHazards();
  render();
}

function renderUpgradePanel() {
  elements.upgradeList.innerHTML = "";
  const canBuy = betweenRuns();
  elements.upgradeHint.textContent = canBuy
    ? "Available now at the extractor."
    : "Return to the extractor with an empty hold to install upgrades.";

  Object.entries(UPGRADES).forEach(([upgradeId, upgrade]) => {
    const level = saveState.upgrades[upgradeId];
    const cost = upgradeCost(upgradeId);
    const button = document.createElement("button");
    button.className = "button secondary";
    button.type = "button";
    button.textContent = level >= upgrade.maxLevel ? "Maxed" : `Buy ${cost} cr`;
    button.disabled = !canBuy || level >= upgrade.maxLevel || saveState.bankedCurrency < cost;
    button.addEventListener("click", () => tryPurchaseUpgrade(upgradeId));

    const card = document.createElement("article");
    card.className = "upgrade-card";
    card.innerHTML = `
      <div class="upgrade-top">
        <div>
          <h3>${upgrade.label}</h3>
          <p class="upgrade-copy">${upgrade.description}</p>
        </div>
        <strong>Lv ${level}/${upgrade.maxLevel}</strong>
      </div>
      <div class="upgrade-meta">
        <span>${upgrade.effect(level + 1 > upgrade.maxLevel ? level : level + 1)}</span>
        <span>${level >= upgrade.maxLevel ? "Installed" : `Next cost ${cost} cr`}</span>
      </div>
    `;
    card.appendChild(button);
    elements.upgradeList.appendChild(card);
  });
}

function renderContractPanel() {
  elements.contractList.innerHTML = "";

  state.contractStatus.forEach((contract) => {
    const delivered = Math.min(contract.target, contract.progress);
    const progressRatio = contract.target > 0 ? Math.min(1, delivered / contract.target) : 0;
    const progressPercent = Math.round(progressRatio * 100);
    const progressCopy = contract.paid
      ? "Payout secured"
      : contract.kind === "relic"
        ? `${delivered} / ${contract.target} recovered`
        : `${delivered} / ${contract.target} collected`;
    const card = document.createElement("article");
    card.className = "contract-card";
    if (contract.progress >= contract.target) {
      card.classList.add("is-complete");
    }
    if (contract.paid) {
      card.classList.add("is-paid");
    }
    card.innerHTML = `
      <div class="contract-top">
        <div>
          <p class="contract-label">${contract.label}</p>
          <h3>${contract.title}</h3>
        </div>
        <strong>${progressPercent}%</strong>
      </div>
      <p class="contract-copy">${contract.description}</p>
      <div class="contract-meta">
        <span>${progressCopy}</span>
        <span>${contract.payout} cr payout</span>
      </div>
    `;
    elements.contractList.appendChild(card);
  });
}

function renderFeedback() {
  elements.feedbackLayer.innerHTML = "";
  state.floatingFeedback.forEach((feedback) => {
    const item = document.createElement("div");
    item.className = `floating-feedback ${feedback.kind}`;
    item.textContent = feedback.text;
    item.style.setProperty("--grid-x", String(feedback.x / WIDTH));
    item.style.setProperty("--grid-y", String(feedback.y / HEIGHT));
    elements.feedbackLayer.appendChild(item);
  });
}

function render() {
  elements.grid.innerHTML = "";
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const tile = document.createElement("div");
      const baseTile = getTile(x, y);
      tile.className = `tile tile-${baseTile}`;
      const hazard = hazardAt(x, y);
      if (hazard) {
        tile.classList.add("tile-hazard", `tile-hazard-${hazard.type}`);
        if (hazard.state === "telegraph") {
          tile.classList.add("tile-hazard-telegraph", `tile-hazard-countdown-${hazard.countdown}`);
        }
      }

      const pickup = pickupAt(x, y);
      if (pickup) {
        tile.classList.add("tile-pickup", `pickup-${pickup.type}`);
      }

      const feedback = tileFeedbackAt(x, y);
      if (feedback) {
        tile.classList.add(`tile-feedback-${feedback.kind}`);
      }

      if (state.player.x === x && state.player.y === y) {
        tile.classList.add("tile-player");
      }

      tile.setAttribute("role", "presentation");
      elements.grid.appendChild(tile);
    }
  }

  const depth = state.player.y * 12;
  const pressurePercent = Math.round((state.pressure / state.maxPressure) * 100);
  elements.depth.textContent = `${depth} m`;
  elements.banked.textContent = `${bankedCurrency()} cr`;
  elements.pressure.textContent = `${pressurePercent}%`;
  elements.pressureDetail.textContent = `${formatNumber(state.pressure)} / ${state.maxPressure}`;
  elements.pressureFill.style.transform = `scaleX(${state.pressure / state.maxPressure})`;
  elements.cargoCopper.textContent = String(state.cargo.copper);
  elements.cargoAmber.textContent = String(state.cargo.amber);
  elements.cargoIridium.textContent = String(state.cargo.iridium);
  elements.cargoTotal.textContent = `${totalCargo()} units`;
  elements.message.textContent = state.statusMessage;
  elements.message.classList.toggle(
    "is-emphasis",
    state.statusMessage.includes("Banked")
      || state.statusMessage.includes("Collected")
      || state.statusMessage.includes("Recovered")
      || state.statusMessage.includes("complete"),
  );
  elements.hazardBadge.textContent = state.hazardStatus.badge;
  elements.hazardBadge.classList.toggle("is-warning", state.hazardStatus.tone === "warning");
  elements.hazardBadge.classList.toggle("is-impact", state.hazardStatus.tone === "impact");
  elements.hazardStatus.textContent = state.hazardStatus.text;
  elements.hazardStatus.classList.toggle("is-warning", state.hazardStatus.tone === "warning");
  elements.hazardStatus.classList.toggle("is-impact", state.hazardStatus.tone === "impact");
  elements.relicStatus.textContent = state.carryingRelic ? "Relic secured in hold" : "Relic hold empty";
  elements.relicStatus.classList.toggle("is-carrying", state.carryingRelic);
  renderContractPanel();
  renderUpgradePanel();
  renderFeedback();
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  const directions = {
    arrowup: [0, -1],
    w: [0, -1],
    arrowdown: [0, 1],
    s: [0, 1],
    arrowleft: [-1, 0],
    a: [-1, 0],
    arrowright: [1, 0],
    d: [1, 0],
  };
  const direction = directions[key];
  if (!direction) {
    return;
  }
  event.preventDefault();
  movePlayer(direction[0], direction[1]);
}

document.addEventListener("keydown", handleKeydown);
elements.restartButton.addEventListener("click", restartRun);
elements.overlayRestart.addEventListener("click", restartRun);
elements.onboardingDismiss.addEventListener("click", dismissOnboarding);

if (!saveState.onboardingDismissed) {
  elements.onboardingOverlay.classList.remove("hidden");
}

render();

"use strict";

const VoidProspector = (() => {
  const RENDERER_PATH = "vendor/three.min.js";
  const TWO_PI = Math.PI * 2;
  const DEFAULT_SEED = 41729;

  const GAME_DATA = {
    renderer: {
      name: "Three.js",
      path: RENDERER_PATH,
      localOnly: true,
    },
    controls: {
      thrust: ["KeyW", "ArrowUp"],
      brake: ["KeyS", "ArrowDown"],
      turnLeft: ["KeyA", "ArrowLeft"],
      turnRight: ["KeyD", "ArrowRight"],
      retarget: ["Tab", "KeyE"],
      mine: ["Space", "KeyM"],
      interact: ["Enter", "KeyF"],
      upgrade: ["KeyU"],
      reset: ["KeyR"],
    },
    ship: {
      name: "Prospector Kite",
      hullMax: 100,
      fuelMax: 100,
      cargoCapacity: 6,
      acceleration: 18,
      brakeDrag: 0.34,
      cruiseDrag: 0.988,
      maxSpeed: 18,
      turnRate: 2.2,
      fuelBurnPerSecond: 4,
      miningPower: 1,
      startPosition: { x: 0, y: 0, z: 18 },
      startVelocity: { x: 0, y: 0, z: 0 },
      startHeading: 0,
    },
    camera: {
      mode: "chase",
      distance: 18,
      height: 8,
      lookAhead: 8,
      smoothing: 0.16,
    },
    station: {
      id: "station-frontier-spoke",
      name: "Frontier Spoke",
      position: { x: 24, y: 0, z: -12 },
      dockingRadius: 8,
      services: ["sell cargo", "repair hull", "refuel", "contract board", "upgrade rig"],
    },
    contract: {
      id: "charter-ore-spoke",
      title: "Spoke Charter",
      objective: "Mine 8 ore, dock at Frontier Spoke, and keep the pirate wake off the hold.",
      requiredOre: 8,
      rewardCredits: 160,
      status: "active",
    },
    asteroidField: {
      miningRange: 9,
      nodes: [
        {
          id: "node-cinder-01",
          name: "Cinder Node",
          position: { x: -22, y: 1, z: -30 },
          radius: 4.2,
          oreRemaining: 5,
          oreValue: 18,
        },
        {
          id: "node-glass-02",
          name: "Glass Node",
          position: { x: 10, y: -1, z: -42 },
          radius: 5.1,
          oreRemaining: 7,
          oreValue: 22,
        },
        {
          id: "node-basal-03",
          name: "Basal Node",
          position: { x: 36, y: 2, z: -34 },
          radius: 3.7,
          oreRemaining: 4,
          oreValue: 27,
        },
        {
          id: "node-echo-04",
          name: "Echo Node",
          position: { x: -38, y: -2, z: -8 },
          radius: 3.2,
          oreRemaining: 3,
          oreValue: 34,
        },
      ],
    },
    pirate: {
      id: "pirate-knife-01",
      name: "Knife Wake",
      spawnTick: 18,
      position: { x: -46, y: 4, z: -58 },
      patrolPoint: { x: -26, y: 2, z: -36 },
      pressureRadius: 42,
      attackRadius: 16,
      driftSpeed: 4.2,
      pressureRate: 0.7,
      hullDamagePerSecond: 2.4,
      stealCooldown: 6,
    },
    upgrades: [
      {
        id: "refined-beam",
        name: "Refined Beam",
        cost: 90,
        miningPowerBonus: 0.55,
      },
      {
        id: "cargo-baffles",
        name: "Cargo Baffles",
        cost: 120,
        cargoCapacityBonus: 2,
      },
    ],
    sector: {
      radius: 68,
      gridStep: 12,
    },
  };

  const dom = {};
  const pressedControls = {
    thrust: false,
    brake: false,
    turnLeft: false,
    turnRight: false,
    mine: false,
  };
  let currentState = null;
  let sceneHandle = null;
  let lastFrameTime = 0;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function round(value, places = 2) {
    const factor = 10 ** places;
    return Math.round(value * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function vector(x = 0, y = 0, z = 0) {
    return { x, y, z };
  }

  function add(a, b) {
    return vector(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  function subtract(a, b) {
    return vector(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  function scale(a, amount) {
    return vector(a.x * amount, a.y * amount, a.z * amount);
  }

  function length(a) {
    return Math.hypot(a.x, a.y, a.z);
  }

  function distance(a, b) {
    return length(subtract(a, b));
  }

  function normalize(a) {
    const magnitude = length(a);
    if (!magnitude) {
      return vector();
    }
    return scale(a, 1 / magnitude);
  }

  function forwardVector(heading) {
    return vector(Math.sin(heading), 0, -Math.cos(heading));
  }

  function normalizeAngle(angle) {
    let wrapped = angle % TWO_PI;
    if (wrapped > Math.PI) {
      wrapped -= TWO_PI;
    }
    if (wrapped < -Math.PI) {
      wrapped += TWO_PI;
    }
    return wrapped;
  }

  function bearingTo(from, heading, target) {
    const delta = subtract(target, from);
    const targetAngle = Math.atan2(delta.x, -delta.z);
    return normalizeAngle(targetAngle - heading);
  }

  function bearingDegrees(from, heading, target) {
    return Math.round((bearingTo(from, heading, target) * 180) / Math.PI);
  }

  function formatBearing(degrees) {
    if (Math.abs(degrees) <= 3) {
      return "000 center";
    }
    const side = degrees < 0 ? "port" : "starboard";
    return `${String(Math.abs(degrees)).padStart(3, "0")} ${side}`;
  }

  function createRng(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function createAsteroidNodes(seed = DEFAULT_SEED) {
    const random = createRng(seed);
    return GAME_DATA.asteroidField.nodes.map((node, index) => {
      const oreVariance = Math.floor(random() * 4);
      const spin = round(random() * TWO_PI, 4);
      return {
        ...clone(node),
        scanSignature: `vp-${seed}-${index + 1}`,
        spin,
        oreValue: node.oreValue + oreVariance,
        mineState: {
          status: "ready",
          progress: 0,
          beamHeat: 0,
          depleted: false,
          lastMinedTick: null,
        },
      };
    });
  }

  function createCameraState(ship) {
    const forward = forwardVector(ship.heading);
    const settings = GAME_DATA.camera;
    return {
      mode: settings.mode,
      distance: settings.distance,
      height: settings.height,
      lookAhead: settings.lookAhead,
      smoothing: settings.smoothing,
      position: add(ship.position, vector(-forward.x * settings.distance, settings.height, -forward.z * settings.distance)),
      target: add(ship.position, vector(forward.x * settings.lookAhead, 2, forward.z * settings.lookAhead)),
    };
  }

  function upgradeById(upgradeId) {
    return GAME_DATA.upgrades.find((upgrade) => upgrade.id === upgradeId) || null;
  }

  function purchasedUpgradeStats(purchased = []) {
    return purchased.reduce(
      (stats, upgradeId) => {
        const upgrade = upgradeById(upgradeId);
        if (!upgrade) {
          return stats;
        }
        stats.miningPower += upgrade.miningPowerBonus || 0;
        stats.cargoCapacity += upgrade.cargoCapacityBonus || 0;
        return stats;
      },
      {
        miningPower: GAME_DATA.ship.miningPower,
        cargoCapacity: GAME_DATA.ship.cargoCapacity,
      }
    );
  }

  function applyPurchasedUpgrades(state) {
    const stats = purchasedUpgradeStats(state.upgrades.purchased);
    state.ship.miningPower = round(stats.miningPower, 2);
    state.cargo.capacity = stats.cargoCapacity;
    if (state.cargo.ore > state.cargo.capacity) {
      state.cargo.ore = state.cargo.capacity;
    }
    return state;
  }

  function createInitialState(options = {}) {
    const seed = options.seed === undefined ? DEFAULT_SEED : options.seed;
    const purchasedUpgrades = Array.isArray(options.upgrades) ? options.upgrades.slice() : [];
    const asteroids = createAsteroidNodes(seed);
    const ship = {
      name: GAME_DATA.ship.name,
      position: clone(GAME_DATA.ship.startPosition),
      velocity: clone(GAME_DATA.ship.startVelocity),
      heading: GAME_DATA.ship.startHeading,
      hull: GAME_DATA.ship.hullMax,
      fuel: GAME_DATA.ship.fuelMax,
      maxHull: GAME_DATA.ship.hullMax,
      maxFuel: GAME_DATA.ship.fuelMax,
      maxSpeed: GAME_DATA.ship.maxSpeed,
      miningPower: GAME_DATA.ship.miningPower,
    };
    const state = {
      seed,
      tick: 0,
      elapsed: 0,
      renderer: {
        path: RENDERER_PATH,
        status: "pending",
      },
      ship,
      camera: createCameraState(ship),
      cargo: {
        ore: 0,
        value: 0,
        capacity: GAME_DATA.ship.cargoCapacity,
      },
      credits: options.credits === undefined ? 0 : options.credits,
      asteroids,
      station: {
        ...clone(GAME_DATA.station),
        docked: false,
        lastSale: 0,
        lastService: "undocked",
        proximity: {
          distance: 0,
          bearing: 0,
          dockable: false,
        },
      },
      contract: {
        ...clone(GAME_DATA.contract),
        progress: 0,
        deliveredOre: 0,
        completedAt: null,
      },
      target: {
        kind: "asteroid",
        id: asteroids[0].id,
        index: 0,
        distance: 0,
        bearing: 0,
      },
      pirate: {
        ...clone(GAME_DATA.pirate),
        state: "dormant",
        encounterState: "distant",
        pressure: 0,
        attackCooldown: 0,
        velocity: vector(),
      },
      mining: {
        active: false,
        targetId: null,
        status: "idle",
        range: GAME_DATA.asteroidField.miningRange,
        lastYield: 0,
      },
      upgrades: {
        purchased: purchasedUpgrades,
        lastPurchase: null,
      },
      stats: {
        oreMined: 0,
        oreSold: 0,
        oreLost: 0,
        sorties: options.runCount || 1,
      },
      run: {
        status: "launch",
        objective: GAME_DATA.contract.objective,
        failureReason: null,
        count: options.runCount || 1,
      },
      input: {
        thrust: false,
        brake: false,
        turnLeft: false,
        turnRight: false,
        mine: false,
      },
      log: [{ tick: 0, message: "Prospector sortie online." }],
    };
    applyPurchasedUpgrades(state);
    return syncDerivedState(state);
  }

  function targetables(state) {
    const asteroidTargets = state.asteroids
      .filter((asteroid) => !asteroid.mineState.depleted)
      .map((asteroid) => ({ kind: "asteroid", id: asteroid.id, position: asteroid.position, name: asteroid.name }));
    return [
      ...asteroidTargets,
      { kind: "station", id: state.station.id, position: state.station.position, name: state.station.name },
      { kind: "pirate", id: state.pirate.id, position: state.pirate.position, name: state.pirate.name },
    ];
  }

  function findTarget(state, target = state.target) {
    if (!target) {
      return null;
    }
    if (target.kind === "asteroid") {
      return state.asteroids.find((asteroid) => asteroid.id === target.id) || null;
    }
    if (target.kind === "station") {
      return state.station;
    }
    if (target.kind === "pirate") {
      return state.pirate;
    }
    return null;
  }

  function objectiveText(state) {
    if (state.run.failureReason) {
      return `${state.run.failureReason} Press R to restart.`;
    }
    if (state.contract.status === "complete") {
      return `${state.contract.title} complete. Restart for a stronger sortie.`;
    }
    if (state.station.proximity.dockable && state.cargo.ore > 0) {
      return "Dock at Frontier Spoke to sell ore, repair, refuel, and log charter progress.";
    }
    if (state.cargo.ore >= state.cargo.capacity) {
      return "Cargo full. Return to Frontier Spoke before the pirate closes.";
    }
    if (state.pirate.encounterState === "close") {
      return "Pirate in attack range. Break away or dock for repairs.";
    }
    return GAME_DATA.contract.objective;
  }

  function syncDerivedState(state) {
    const stationDistance = distance(state.ship.position, state.station.position);
    const stationBearing = bearingDegrees(state.ship.position, state.ship.heading, state.station.position);
    state.station.proximity = {
      distance: round(stationDistance, 1),
      bearing: stationBearing,
      dockable: stationDistance <= state.station.dockingRadius,
    };
    if (!state.station.proximity.dockable) {
      state.station.docked = false;
    }

    const selected = findTarget(state);
    if (selected) {
      state.target.distance = round(distance(state.ship.position, selected.position), 1);
      state.target.bearing = bearingDegrees(state.ship.position, state.ship.heading, selected.position);
    }

    state.contract.progress = round(Math.min(1, state.contract.deliveredOre / state.contract.requiredOre), 3);
    if (state.ship.hull <= 0) {
      state.ship.hull = 0;
      state.run.status = "failed";
      state.run.failureReason = state.run.failureReason || "Hull breached under pirate pressure.";
    } else if (state.contract.status === "complete") {
      state.run.status = "complete";
      state.run.failureReason = null;
    } else if (state.ship.fuel <= 0 && length(state.ship.velocity) < 0.2) {
      state.run.status = "drifting";
      state.run.failureReason = "Fuel exhausted. Drift beacon fired.";
    } else if (state.station.proximity.dockable) {
      state.run.status = state.station.docked ? "docked" : "dock range";
      state.run.failureReason = null;
    } else if (state.pirate.encounterState === "close") {
      state.run.status = "evading";
      state.run.failureReason = null;
    } else if (state.cargo.ore >= state.cargo.capacity) {
      state.run.status = "cargo full";
      state.run.failureReason = null;
    } else if (state.run.status === "launch") {
      state.run.status = "surveying";
      state.run.failureReason = null;
    }
    state.run.objective = objectiveText(state);
    state.camera = updateCameraState(state);
    return state;
  }

  function updateCameraState(state) {
    const forward = forwardVector(state.ship.heading);
    const settings = state.camera || GAME_DATA.camera;
    const desiredPosition = add(
      state.ship.position,
      vector(-forward.x * settings.distance, settings.height, -forward.z * settings.distance)
    );
    const desiredTarget = add(
      state.ship.position,
      vector(forward.x * settings.lookAhead, 2, forward.z * settings.lookAhead)
    );
    return {
      mode: settings.mode || GAME_DATA.camera.mode,
      distance: settings.distance || GAME_DATA.camera.distance,
      height: settings.height || GAME_DATA.camera.height,
      lookAhead: settings.lookAhead || GAME_DATA.camera.lookAhead,
      smoothing: settings.smoothing || GAME_DATA.camera.smoothing,
      position: desiredPosition,
      target: desiredTarget,
    };
  }

  function limitVelocity(velocity, maxSpeed) {
    const speed = length(velocity);
    if (speed <= maxSpeed) {
      return velocity;
    }
    return scale(normalize(velocity), maxSpeed);
  }

  function applyFlightInput(state, input = {}, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 2));
    const next = clone(state);
    const turnAxis = (input.turnRight ? 1 : 0) - (input.turnLeft ? 1 : 0);
    next.ship.heading = normalizeAngle(next.ship.heading + turnAxis * GAME_DATA.ship.turnRate * dt);

    let velocity = clone(next.ship.velocity);
    if (input.thrust && next.ship.fuel > 0) {
      velocity = add(velocity, scale(forwardVector(next.ship.heading), GAME_DATA.ship.acceleration * dt));
      next.ship.fuel = Math.max(0, next.ship.fuel - GAME_DATA.ship.fuelBurnPerSecond * dt);
      next.input.thrust = true;
    } else {
      next.input.thrust = false;
    }

    if (input.brake) {
      velocity = scale(velocity, Math.max(0, 1 - GAME_DATA.ship.brakeDrag * dt));
      next.input.brake = true;
    } else {
      velocity = scale(velocity, GAME_DATA.ship.cruiseDrag);
      next.input.brake = false;
    }

    next.input.turnLeft = Boolean(input.turnLeft);
    next.input.turnRight = Boolean(input.turnRight);
    next.input.mine = Boolean(input.mine);
    next.ship.velocity = limitVelocity(velocity, GAME_DATA.ship.maxSpeed);
    next.ship.position = add(next.ship.position, scale(next.ship.velocity, dt));
    next.ship.position.y = Math.max(-6, Math.min(6, next.ship.position.y));
    const sectorDistance = length(vector(next.ship.position.x, 0, next.ship.position.z));
    if (sectorDistance > GAME_DATA.sector.radius) {
      const clamped = scale(normalize(vector(next.ship.position.x, 0, next.ship.position.z)), GAME_DATA.sector.radius);
      next.ship.position.x = clamped.x;
      next.ship.position.z = clamped.z;
      next.ship.velocity = scale(next.ship.velocity, 0.35);
      next.ship.hull = Math.max(0, next.ship.hull - 3 * dt);
      next.log.unshift({ tick: next.tick, message: "Outer grid shear clipped the hull." });
    }
    return syncDerivedState(next);
  }

  function coolMiningState(state, deltaSeconds) {
    const next = state;
    next.mining.active = false;
    next.mining.targetId = null;
    next.mining.lastYield = 0;
    next.asteroids.forEach((asteroid) => {
      const mineState = asteroid.mineState;
      if (mineState.depleted) {
        mineState.status = "depleted";
        mineState.beamHeat = 0;
        return;
      }
      mineState.beamHeat = clamp(mineState.beamHeat - deltaSeconds * 32, 0, 100);
      if (mineState.status === "mining" && mineState.beamHeat < 70) {
        mineState.status = "cooldown";
      }
      if ((mineState.status === "cooldown" || mineState.status === "mining") && mineState.beamHeat <= 0) {
        mineState.status = "ready";
      }
    });
    return next;
  }

  function mineTarget(state, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 2));
    const next = clone(state);
    if (next.run.status === "failed" || next.run.status === "complete") {
      next.mining.status = "run closed";
      return syncDerivedState(next);
    }

    const target = findTarget(next);
    if (!target || next.target.kind !== "asteroid") {
      next.mining.status = "no asteroid lock";
      return syncDerivedState(next);
    }

    const range = distance(next.ship.position, target.position);
    if (range > next.mining.range + target.radius) {
      next.mining.status = "out of range";
      return syncDerivedState(next);
    }

    if (next.cargo.ore >= next.cargo.capacity) {
      next.mining.status = "cargo full";
      return syncDerivedState(next);
    }

    if (target.mineState.depleted || target.oreRemaining <= 0) {
      target.mineState.status = "depleted";
      target.mineState.depleted = true;
      next.mining.status = "depleted";
      return syncDerivedState(next);
    }

    let extracted = 0;
    target.mineState.status = "mining";
    target.mineState.beamHeat = clamp(target.mineState.beamHeat + 42 * dt, 0, 100);
    target.mineState.progress += next.ship.miningPower * dt;
    while (
      target.mineState.progress >= 1 &&
      target.oreRemaining > 0 &&
      next.cargo.ore < next.cargo.capacity
    ) {
      target.mineState.progress -= 1;
      target.oreRemaining -= 1;
      next.cargo.ore += 1;
      next.cargo.value += target.oreValue;
      next.stats.oreMined += 1;
      extracted += 1;
    }

    if (target.oreRemaining <= 0) {
      target.oreRemaining = 0;
      target.mineState.status = "depleted";
      target.mineState.depleted = true;
      target.mineState.progress = 0;
    }

    next.mining.active = extracted > 0 || target.mineState.status === "mining";
    next.mining.targetId = target.id;
    next.mining.lastYield = extracted;
    next.mining.status = extracted > 0 ? `extracted ${extracted}` : "cutting";
    target.mineState.lastMinedTick = next.tick;
    if (extracted > 0) {
      next.log.unshift({ tick: next.tick, message: `${target.name} yielded ${extracted} ore.` });
    }
    return syncDerivedState(next);
  }

  function dockAtStation(state) {
    const next = syncDerivedState(clone(state));
    if (!next.station.proximity.dockable) {
      next.station.docked = false;
      next.station.lastService = "approach vector";
      next.log.unshift({ tick: next.tick, message: "Frontier Spoke outside docking radius." });
      return syncDerivedState(next);
    }

    const soldOre = next.cargo.ore;
    const saleCredits = next.cargo.value;
    next.station.docked = true;
    next.station.lastSale = saleCredits;
    next.station.lastService = "sold cargo / repaired / refueled";
    next.credits += saleCredits;
    next.stats.oreSold += soldOre;
    next.contract.deliveredOre += soldOre;
    next.cargo.ore = 0;
    next.cargo.value = 0;
    next.ship.hull = next.ship.maxHull;
    next.ship.fuel = next.ship.maxFuel;

    if (soldOre > 0) {
      next.log.unshift({ tick: next.tick, message: `Sold ${soldOre} ore for ${saleCredits} credits.` });
    } else {
      next.log.unshift({ tick: next.tick, message: "Docking clamps serviced hull and tanks." });
    }

    if (next.contract.status === "active" && next.contract.deliveredOre >= next.contract.requiredOre) {
      next.contract.status = "complete";
      next.contract.completedAt = next.tick;
      next.credits += next.contract.rewardCredits;
      next.run.status = "complete";
      next.log.unshift({
        tick: next.tick,
        message: `${next.contract.title} complete. ${next.contract.rewardCredits} credit charter paid.`,
      });
    }

    return syncDerivedState(next);
  }

  function purchaseUpgrade(state, upgradeId = "refined-beam") {
    const next = syncDerivedState(clone(state));
    const upgrade = upgradeById(upgradeId);
    if (!upgrade) {
      next.upgrades.lastPurchase = "unknown upgrade";
      return syncDerivedState(next);
    }
    if (!next.station.proximity.dockable) {
      next.upgrades.lastPurchase = "dock required";
      return syncDerivedState(next);
    }
    if (next.upgrades.purchased.includes(upgradeId)) {
      next.upgrades.lastPurchase = `${upgrade.name} installed`;
      return syncDerivedState(next);
    }
    if (next.credits < upgrade.cost) {
      next.upgrades.lastPurchase = `${upgrade.cost - next.credits} credits short`;
      return syncDerivedState(next);
    }
    next.credits -= upgrade.cost;
    next.upgrades.purchased.push(upgradeId);
    next.upgrades.lastPurchase = `${upgrade.name} installed`;
    applyPurchasedUpgrades(next);
    next.log.unshift({ tick: next.tick, message: `${upgrade.name} installed.` });
    return syncDerivedState(next);
  }

  function resetRun(state, options = {}) {
    const seed = options.seed === undefined ? state.seed + 1 : options.seed;
    const credits = options.credits === undefined ? state.credits : options.credits;
    const next = createInitialState({
      seed,
      credits,
      upgrades: state.upgrades.purchased,
      runCount: (state.run.count || 1) + 1,
    });
    next.log.unshift({ tick: 0, message: `Sortie ${next.run.count} reset with installed upgrades.` });
    return syncDerivedState(next);
  }

  function updatePirateState(state, deltaSeconds) {
    const next = state;
    if (next.elapsed >= next.pirate.spawnTick && next.pirate.state === "dormant") {
      next.pirate.state = "shadowing";
      next.pirate.encounterState = "contact";
    }

    if (next.pirate.state !== "dormant") {
      const toShip = subtract(next.ship.position, next.pirate.position);
      const range = length(toShip);
      const desired = range < next.pirate.attackRadius ? scale(normalize(toShip), -1) : normalize(toShip);
      next.pirate.velocity = scale(desired, next.pirate.driftSpeed);
      next.pirate.position = add(next.pirate.position, scale(next.pirate.velocity, deltaSeconds));
      next.pirate.attackCooldown = Math.max(0, next.pirate.attackCooldown - deltaSeconds);
      if (range <= next.pirate.attackRadius) {
        next.pirate.encounterState = "close";
        next.pirate.pressure = Math.min(100, next.pirate.pressure + next.pirate.pressureRate * deltaSeconds * 4);
        next.ship.hull = Math.max(0, next.ship.hull - next.pirate.hullDamagePerSecond * deltaSeconds);
        if (next.cargo.ore > 0 && next.pirate.attackCooldown <= 0) {
          const averageValue = next.cargo.ore > 0 ? Math.ceil(next.cargo.value / next.cargo.ore) : 0;
          next.cargo.ore -= 1;
          next.cargo.value = Math.max(0, next.cargo.value - averageValue);
          next.stats.oreLost += 1;
          next.pirate.attackCooldown = next.pirate.stealCooldown;
          next.log.unshift({ tick: next.tick, message: "Pirate wake cut one ore crate loose." });
        }
      } else if (range <= next.pirate.pressureRadius) {
        next.pirate.encounterState = "shadow";
        next.pirate.pressure = Math.min(100, next.pirate.pressure + next.pirate.pressureRate * deltaSeconds);
      } else {
        next.pirate.encounterState = "distant";
        next.pirate.pressure = Math.max(0, next.pirate.pressure - deltaSeconds);
      }
    }
    return next;
  }

  function stepSpaceflight(state, input = {}, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 2));
    if (input.reset) {
      return resetRun(state);
    }
    let next = applyFlightInput(state, input, dt);
    next.tick = round(next.tick + dt, 3);
    next.elapsed = round(next.elapsed + dt, 3);
    next = updatePirateState(next, dt);
    next = coolMiningState(next, dt);
    if (input.mine) {
      next = mineTarget(next, dt);
    }
    if (input.interact) {
      next = dockAtStation(next);
    }
    if (input.upgrade) {
      next = purchaseUpgrade(next);
    }
    return syncDerivedState(next);
  }

  function setTarget(state, kind, id) {
    const next = clone(state);
    const targets = targetables(next);
    const index = targets.findIndex((target) => target.kind === kind && target.id === id);
    if (index >= 0) {
      next.target = {
        kind,
        id,
        index,
        distance: 0,
        bearing: 0,
      };
    }
    return syncDerivedState(next);
  }

  function retarget(state, direction = 1) {
    const next = clone(state);
    const targets = targetables(next);
    if (!targets.length) {
      return next;
    }
    const currentIndex = targets.findIndex((target) => target.kind === next.target.kind && target.id === next.target.id);
    const origin = currentIndex >= 0 ? currentIndex : 0;
    const index = (origin + direction + targets.length) % targets.length;
    next.target = {
      kind: targets[index].kind,
      id: targets[index].id,
      index,
      distance: 0,
      bearing: 0,
    };
    return syncDerivedState(next);
  }

  function dockingStatus(state) {
    return {
      stationId: state.station.id,
      distance: state.station.proximity.distance,
      bearing: state.station.proximity.bearing,
      dockable: state.station.proximity.dockable,
      docked: state.station.docked,
      lastSale: state.station.lastSale,
      lastService: state.station.lastService,
      services: state.station.services.slice(),
    };
  }

  function nextAffordableUpgrade(state) {
    return GAME_DATA.upgrades.find((upgrade) => !state.upgrades.purchased.includes(upgrade.id)) || null;
  }

  function upgradeSummary(state) {
    const nextUpgrade = nextAffordableUpgrade(state);
    if (!nextUpgrade) {
      return {
        id: null,
        text: "all installed",
        affordable: false,
      };
    }
    return {
      id: nextUpgrade.id,
      text: `${nextUpgrade.name} / ${nextUpgrade.cost}cr`,
      affordable: state.credits >= nextUpgrade.cost,
    };
  }

  function targetSummary(state) {
    const target = findTarget(state);
    if (!target) {
      return {
        name: "No target",
        kind: "none",
        status: "none",
        distance: 0,
        bearing: 0,
      };
    }
    let status = "ready";
    if (state.target.kind === "asteroid") {
      const oreStatus = `${target.oreRemaining} ore`;
      if (target.mineState.depleted) {
        status = "depleted";
      } else if (state.mining.active && state.mining.targetId === target.id) {
        status = `${state.mining.status} / ${Math.round(target.mineState.progress * 100)}% / ${oreStatus}`;
      } else {
        status = `${target.mineState.status} / ${oreStatus}`;
      }
    } else if (state.target.kind === "station") {
      status = state.station.proximity.dockable ? "dockable" : "stand off";
    } else if (state.target.kind === "pirate") {
      status = state.pirate.encounterState;
    }
    return {
      name: target.name,
      kind: state.target.kind,
      status,
      distance: state.target.distance,
      bearing: state.target.bearing,
    };
  }

  function cssToneForPercent(value) {
    if (value <= 25) {
      return "danger";
    }
    if (value <= 50) {
      return "warn";
    }
    return "signal";
  }

  function cacheDom() {
    dom.root = document.getElementById("void-prospector");
    dom.canvas = document.getElementById("void-prospector-scene");
    dom.runStatus = document.getElementById("run-status");
    dom.objective = document.getElementById("objective-readout");
    dom.hull = document.getElementById("hull-readout");
    dom.fuel = document.getElementById("fuel-readout");
    dom.cargo = document.getElementById("cargo-readout");
    dom.credits = document.getElementById("credits-readout");
    dom.pressure = document.getElementById("pressure-readout");
    dom.contract = document.getElementById("contract-readout");
    dom.upgrade = document.getElementById("upgrade-readout");
    dom.target = document.getElementById("target-readout");
    dom.station = document.getElementById("station-readout");
    dom.targetName = document.getElementById("target-name");
    dom.targetKind = document.getElementById("target-kind");
    dom.targetBearing = document.getElementById("target-bearing");
    dom.targetRange = document.getElementById("target-range");
    dom.targetState = document.getElementById("target-state");
    dom.mineAction = document.getElementById("mine-action");
    dom.dockAction = document.getElementById("dock-action");
    dom.upgradeAction = document.getElementById("upgrade-action");
    dom.restartAction = document.getElementById("restart-action");
  }

  function renderHud(state) {
    const target = targetSummary(state);
    const station = dockingStatus(state);
    const upgrade = upgradeSummary(state);
    dom.runStatus.textContent = `${state.run.status} / ${state.renderer.status}`;
    dom.objective.textContent = state.run.objective;
    dom.hull.textContent = `${Math.round(state.ship.hull)} / ${state.ship.maxHull}`;
    dom.fuel.textContent = `${Math.round(state.ship.fuel)} / ${state.ship.maxFuel}`;
    dom.cargo.textContent = `${state.cargo.ore} / ${state.cargo.capacity} / ${state.cargo.value}cr`;
    dom.credits.textContent = String(state.credits);
    dom.pressure.textContent = `${Math.round(state.pirate.pressure)} / ${state.pirate.encounterState}`;
    dom.contract.textContent = `${state.contract.status} / ${state.contract.deliveredOre} of ${state.contract.requiredOre}`;
    dom.upgrade.textContent = upgrade.text;
    dom.target.textContent = `${target.kind} / ${target.name} / ${target.distance}m`;
    dom.station.textContent = `${formatBearing(station.bearing)} / ${station.distance}m / ${station.dockable ? "dock" : "approach"}`;
    dom.targetName.textContent = target.name;
    dom.targetKind.textContent = target.kind;
    dom.targetBearing.textContent = `bearing ${formatBearing(target.bearing)}`;
    dom.targetRange.textContent = `${target.distance}m`;
    dom.targetState.textContent = target.status;

    dom.hull.closest(".readout").dataset.tone = cssToneForPercent(state.ship.hull);
    dom.fuel.closest(".readout").dataset.tone = cssToneForPercent(state.ship.fuel);
    dom.pressure.closest(".readout").dataset.tone = state.pirate.pressure > 60 ? "danger" : "signal";
    dom.contract.closest(".readout").dataset.tone = state.contract.status === "complete" ? "signal" : "warn";
    dom.upgrade.closest(".readout").dataset.tone = upgrade.affordable ? "signal" : "warn";
    if (dom.mineAction) {
      dom.mineAction.disabled = target.kind !== "asteroid" || state.cargo.ore >= state.cargo.capacity || state.run.status === "failed";
    }
    if (dom.dockAction) {
      dom.dockAction.disabled = !station.dockable || state.run.status === "failed";
    }
    if (dom.upgradeAction) {
      dom.upgradeAction.disabled = !station.dockable || !upgrade.id || state.credits < (upgradeById(upgrade.id)?.cost || 0);
    }
    if (dom.restartAction) {
      dom.restartAction.disabled = false;
    }
  }

  function controlNameForCode(code) {
    for (const [name, codes] of Object.entries(GAME_DATA.controls)) {
      if (codes.includes(code)) {
        return name;
      }
    }
    return null;
  }

  function performAction(action) {
    if (!currentState) {
      return;
    }
    if (action === "mine") {
      currentState = mineTarget(currentState, 1);
    } else if (action === "interact") {
      currentState = dockAtStation(currentState);
    } else if (action === "upgrade") {
      const upgrade = nextAffordableUpgrade(currentState);
      currentState = purchaseUpgrade(currentState, upgrade ? upgrade.id : "refined-beam");
    } else if (action === "reset") {
      currentState = resetRun(currentState);
    }
    renderHud(currentState);
    if (sceneHandle) {
      updateScene(sceneHandle, currentState, performance.now() / 1000);
    }
  }

  function bindControls() {
    window.addEventListener("keydown", (event) => {
      const control = controlNameForCode(event.code);
      if (!control) {
        return;
      }
      event.preventDefault();
      if (control === "retarget" && !event.repeat) {
        currentState = retarget(currentState, 1);
        renderHud(currentState);
        return;
      }
      if (["interact", "upgrade", "reset"].includes(control) && !event.repeat) {
        performAction(control);
        return;
      }
      if (control in pressedControls) {
        pressedControls[control] = true;
      }
    });
    window.addEventListener("keyup", (event) => {
      const control = controlNameForCode(event.code);
      if (control && control in pressedControls) {
        pressedControls[control] = false;
      }
    });
    if (dom.mineAction) {
      dom.mineAction.addEventListener("click", () => performAction("mine"));
    }
    if (dom.dockAction) {
      dom.dockAction.addEventListener("click", () => performAction("interact"));
    }
    if (dom.upgradeAction) {
      dom.upgradeAction.addEventListener("click", () => performAction("upgrade"));
    }
    if (dom.restartAction) {
      dom.restartAction.addEventListener("click", () => performAction("reset"));
    }
  }

  function createShipMesh(THREE) {
    const group = new THREE.Group();
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0xdce8e2,
      roughness: 0.58,
      metalness: 0.25,
      emissive: 0x102a26,
      emissiveIntensity: 0.18,
    });
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x53635c,
      roughness: 0.72,
      metalness: 0.2,
      emissive: 0x07110f,
      emissiveIntensity: 0.12,
    });
    const signalMaterial = new THREE.MeshBasicMaterial({ color: 0x4bd6c0 });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 3.2, 4), hullMaterial);
    nose.rotation.x = -Math.PI / 2;
    group.add(nose);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.46, 2.6), hullMaterial);
    spine.position.z = 0.6;
    group.add(spine);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 1.1), wingMaterial);
    wing.position.z = 0.9;
    group.add(wing);

    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), signalMaterial);
    cockpit.position.set(0, 0.28, -0.34);
    group.add(cockpit);
    return group;
  }

  function createStationMesh(THREE) {
    const group = new THREE.Group();
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x738078,
      roughness: 0.65,
      metalness: 0.35,
      emissive: 0x0c2522,
      emissiveIntensity: 0.28,
    });
    const dockMaterial = new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.55 });
    const core = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 5), ringMaterial);
    group.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6, 0.12, 8, 48), dockMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 1.2), ringMaterial);
    mast.position.y = 1.8;
    group.add(mast);
    return group;
  }

  function createAsteroidMesh(THREE, asteroid) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.DodecahedronGeometry(asteroid.radius, 0),
      new THREE.MeshStandardMaterial({
        color: 0x4d554f,
        roughness: 0.94,
        metalness: 0.06,
        emissive: 0x0a0f0d,
        emissiveIntensity: 0.2,
      })
    );
    group.add(body);

    const glintMaterial = new THREE.MeshBasicMaterial({ color: 0x4bd6c0 });
    for (let index = 0; index < 3; index += 1) {
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glintMaterial);
      const angle = asteroid.spin + index * 2.1;
      glint.position.set(Math.cos(angle) * asteroid.radius * 0.72, 0.25 * index, Math.sin(angle) * asteroid.radius * 0.72);
      group.add(glint);
    }
    return group;
  }

  function createPirateMesh(THREE) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: 0x8f3f35,
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0x3a0906,
      emissiveIntensity: 0.5,
    });
    const hull = new THREE.Mesh(new THREE.TetrahedronGeometry(1.55, 0), material);
    hull.rotation.y = Math.PI / 4;
    group.add(hull);
    const wake = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 2.2, 12),
      new THREE.MeshBasicMaterial({ color: 0xd46857, transparent: true, opacity: 0.45 })
    );
    wake.rotation.x = Math.PI / 2;
    wake.position.z = 1.5;
    group.add(wake);
    return group;
  }

  function createTargetRing(THREE) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.8, 0.06, 6, 64),
      new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.8 })
    );
    ring.rotation.x = Math.PI / 2;
    return ring;
  }

  function createMiningBeam(THREE) {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const material = new THREE.LineBasicMaterial({
      color: 0x4bd6c0,
      transparent: true,
      opacity: 0.84,
    });
    const beam = new THREE.Line(geometry, material);
    beam.visible = false;
    return beam;
  }

  function createStarField(THREE) {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    const random = createRng(90331);
    for (let index = 0; index < 160; index += 1) {
      points.push((random() - 0.5) * 180, random() * 70 - 12, (random() - 0.7) * 180);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xa8b4ae, size: 0.18, transparent: true, opacity: 0.58 })
    );
  }

  function createScene(canvas, state) {
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050706);
    scene.fog = new THREE.FogExp2(0x050706, 0.014);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    scene.add(new THREE.AmbientLight(0x6e7c77, 0.62));
    const keyLight = new THREE.DirectionalLight(0xdfe7e2, 1.25);
    keyLight.position.set(22, 28, 18);
    scene.add(keyLight);
    const signalLight = new THREE.PointLight(0x4bd6c0, 1.2, 72);
    signalLight.position.set(10, 8, -18);
    scene.add(signalLight);

    const grid = new THREE.GridHelper(132, 22, 0x4bd6c0, 0x26302d);
    grid.position.y = -5.5;
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    scene.add(grid);
    scene.add(createStarField(THREE));

    const ship = createShipMesh(THREE);
    scene.add(ship);

    const station = createStationMesh(THREE);
    station.position.set(state.station.position.x, state.station.position.y, state.station.position.z);
    scene.add(station);

    const asteroidMeshes = new Map();
    state.asteroids.forEach((asteroid) => {
      const mesh = createAsteroidMesh(THREE, asteroid);
      mesh.position.set(asteroid.position.x, asteroid.position.y, asteroid.position.z);
      asteroidMeshes.set(asteroid.id, mesh);
      scene.add(mesh);
    });

    const pirate = createPirateMesh(THREE);
    scene.add(pirate);

    const targetRing = createTargetRing(THREE);
    scene.add(targetRing);

    const miningBeam = createMiningBeam(THREE);
    scene.add(miningBeam);

    return {
      THREE,
      scene,
      camera,
      renderer,
      objects: {
        ship,
        station,
        asteroidMeshes,
        pirate,
        targetRing,
        miningBeam,
      },
    };
  }

  function resizeScene(handle) {
    const canvas = handle.renderer.domElement;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    if (canvas.width !== Math.floor(width * handle.renderer.getPixelRatio()) || canvas.height !== Math.floor(height * handle.renderer.getPixelRatio())) {
      handle.renderer.setSize(width, height, false);
      handle.camera.aspect = width / height;
      handle.camera.updateProjectionMatrix();
    }
  }

  function updateScene(handle, state, timeSeconds) {
    const { THREE } = handle;
    resizeScene(handle);
    handle.objects.ship.position.set(state.ship.position.x, state.ship.position.y, state.ship.position.z);
    handle.objects.ship.rotation.y = state.ship.heading;
    handle.objects.station.rotation.y = timeSeconds * 0.12;
    handle.objects.pirate.position.set(state.pirate.position.x, state.pirate.position.y, state.pirate.position.z);
    handle.objects.pirate.rotation.y = timeSeconds * 0.85;
    handle.objects.pirate.visible = state.pirate.state !== "dormant" || state.elapsed > 5;

    state.asteroids.forEach((asteroid) => {
      const mesh = handle.objects.asteroidMeshes.get(asteroid.id);
      if (mesh) {
        mesh.rotation.set(timeSeconds * 0.05 + asteroid.spin, timeSeconds * 0.07 + asteroid.spin, 0);
        mesh.scale.setScalar(asteroid.mineState.depleted ? 0.56 : 1);
        mesh.traverse((child) => {
          if (child.material) {
            child.material.transparent = asteroid.mineState.depleted;
            child.material.opacity = asteroid.mineState.depleted ? 0.38 : 1;
          }
        });
      }
    });

    const target = findTarget(state);
    if (target) {
      const radius = target.radius ? target.radius + 1.2 : 6;
      handle.objects.targetRing.position.set(target.position.x, target.position.y, target.position.z);
      handle.objects.targetRing.scale.setScalar(radius / 3.8);
      handle.objects.targetRing.visible = true;
    } else {
      handle.objects.targetRing.visible = false;
    }

    if (state.mining.active && state.mining.targetId) {
      const asteroid = state.asteroids.find((node) => node.id === state.mining.targetId);
      if (asteroid) {
        handle.objects.miningBeam.geometry.setFromPoints([
          new THREE.Vector3(state.ship.position.x, state.ship.position.y, state.ship.position.z),
          new THREE.Vector3(asteroid.position.x, asteroid.position.y, asteroid.position.z),
        ]);
        handle.objects.miningBeam.visible = true;
      } else {
        handle.objects.miningBeam.visible = false;
      }
    } else {
      handle.objects.miningBeam.visible = false;
    }

    handle.camera.position.copy(new THREE.Vector3(state.camera.position.x, state.camera.position.y, state.camera.position.z));
    handle.camera.lookAt(new THREE.Vector3(state.camera.target.x, state.camera.target.y, state.camera.target.z));
    handle.renderer.render(handle.scene, handle.camera);
  }

  function animationFrame(now) {
    if (!sceneHandle || !currentState) {
      return;
    }
    const deltaSeconds = Math.min(0.05, (now - lastFrameTime) / 1000 || 0.016);
    lastFrameTime = now;
    currentState = stepSpaceflight(currentState, pressedControls, deltaSeconds);
    updateScene(sceneHandle, currentState, now / 1000);
    renderHud(currentState);
    window.requestAnimationFrame(animationFrame);
  }

  function initDom() {
    cacheDom();
    if (!dom.root || !dom.canvas) {
      return;
    }
    currentState = createInitialState();
    bindControls();

    if (!window.THREE) {
      currentState.renderer.status = "blocked";
      renderHud(currentState);
      return;
    }

    try {
      sceneHandle = createScene(dom.canvas, currentState);
      currentState.renderer.status = "local renderer";
      renderHud(currentState);
      lastFrameTime = performance.now();
      window.requestAnimationFrame(animationFrame);
    } catch (error) {
      currentState.renderer.status = "renderer blocked";
      currentState.log.unshift({ tick: currentState.tick, message: error.message });
      renderHud(currentState);
    }
  }

  const api = {
    GAME_DATA,
    RENDERER_PATH,
    createInitialState,
    createAsteroidNodes,
    applyFlightInput,
    stepSpaceflight,
    mineTarget,
    dockAtStation,
    purchaseUpgrade,
    resetRun,
    retarget,
    setTarget,
    updateCameraState,
    dockingStatus,
    upgradeSummary,
    targetSummary,
    bearingTo,
    bearingDegrees,
    formatBearing,
    distance,
  };

  if (typeof window !== "undefined") {
    window.VoidProspector = api;
    window.addEventListener("DOMContentLoaded", initDom);
  }

  return api;
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = VoidProspector;
}

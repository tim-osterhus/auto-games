"use strict";

const VoidProspector = (() => {
  const RENDERER_PATH = "vendor/three.min.js";
  const ASSET_PATHS = Object.freeze({
    sourceManifest: "assets/asset-manifest.json",
    shipDecal: "assets/ship-decal.png",
    asteroidOreGlow: "assets/asteroid-ore-glow.png",
    stationDockPanel: "assets/station-dock-panel.png",
    pirateMarker: "assets/pirate-marker.png",
    arcadeTitleCard: "assets/arcade-title-card.png",
  });
  const TWO_PI = Math.PI * 2;
  const DEFAULT_SEED = 41729;

  const GAME_DATA = {
    renderer: {
      name: "Three.js",
      path: RENDERER_PATH,
      localOnly: true,
    },
    assets: ASSET_PATHS,
    controls: {
      thrust: ["KeyW", "ArrowUp"],
      brake: ["KeyS", "ArrowDown"],
      turnLeft: ["KeyA", "ArrowLeft"],
      turnRight: ["KeyD", "ArrowRight"],
      retarget: ["Tab", "KeyE"],
      mine: ["Space", "KeyM"],
      scan: ["KeyC"],
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
      services: [
        "sell cargo",
        "repair hull",
        "refuel",
        "contract board",
        "upgrade rig",
        "survey probes",
        "decoy burst",
        "salvage rig",
        "recovery drones",
      ],
    },
    contract: {
      id: "charter-ore-spoke",
      title: "Spoke Charter",
      objective: "Mine 8 ore, dock at Frontier Spoke, and keep the pirate wake off the hold.",
      requiredOre: 8,
      rewardCredits: 160,
      status: "active",
    },
    surveyLadder: {
      version: "0.1.0",
      releaseLabel: "Survey Ladder",
      defaultSectorId: "spoke-approach",
      stationServices: [
        {
          id: "survey-probes",
          name: "Survey Probes",
          cost: 45,
          scanPowerBonus: 1,
          hazardMitigation: 0.25,
        },
        {
          id: "decoy-burst",
          name: "Decoy Burst",
          cost: 60,
          countermeasureCharges: 1,
        },
        {
          id: "salvage-rig",
          name: "Salvage Rig",
          cost: 80,
          salvagePowerBonus: 0.55,
          salvageConfidenceBonus: 0.12,
        },
        {
          id: "recovery-drones",
          name: "Recovery Drones",
          cost: 95,
          salvagePowerBonus: 0.25,
          salvageRiskMitigation: 0.32,
        },
      ],
      sectors: [
        {
          id: "spoke-approach",
          name: "Spoke Approach",
          tier: 1,
          condition: "Mapped harbor",
          charterTitle: "Spoke Charter",
          objective: "Mine 8 ore, dock at Frontier Spoke, and keep the pirate wake off the hold.",
          requiredOre: 8,
          requiredScans: 0,
          requiredSalvageValue: 0,
          requiredRelics: 0,
          rewardCredits: 160,
          surveyReward: 20,
          salvageReward: 10,
          oreValueBonus: 0,
          oreReserveBonus: 0,
          hazard: {
            status: "clear",
            intensity: 0,
            fuelDrainPerSecond: 0,
            hullDamagePerSecond: 0,
            warningThreshold: 99,
          },
          pirate: {
            spawnTick: 18,
            driftSpeed: 4.2,
            pressureRate: 0.7,
            hullDamagePerSecond: 2.4,
          },
          anomalies: [
            {
              id: "anomaly-spoke-buoy",
              name: "Dormant Survey Buoy",
              position: { x: -6, y: 3, z: -52 },
              radius: 4,
              scanDifficulty: 2,
              surveyValue: 18,
              chartsHazard: false,
            },
          ],
          salvageSites: [
            {
              id: "salvage-spoke-relay",
              name: "Spoke Relay Cache",
              type: "relay-cache",
              family: "manifest",
              position: { x: -12, y: -1, z: -44 },
              radius: 3.4,
              scanDifficulty: 1.8,
              confidenceThreshold: 0.55,
              extractionDifficulty: 1.6,
              remainingSalvage: 2,
              rewardValue: 28,
              valueVariance: 5,
              relicReward: 0,
              volatility: 0.08,
              failureThreshold: 1.05,
              piratePressure: 4,
              hazardExposure: 0.2,
              failureHullDamage: 3,
              scanValue: 8,
            },
          ],
          unlocks: ["rift-shelf"],
        },
        {
          id: "rift-shelf",
          name: "Rift Shelf",
          tier: 2,
          condition: "Charged dust lanes",
          charterTitle: "Rift Shelf Survey",
          objective: "Scan one anomaly, mine 10 ore, and choose whether to salvage derelicts before Knife Wake tightens.",
          requiredOre: 10,
          requiredScans: 1,
          requiredSalvageValue: 0,
          requiredRelics: 0,
          rewardCredits: 230,
          surveyReward: 45,
          salvageReward: 20,
          oreValueBonus: 6,
          oreReserveBonus: 1,
          hazard: {
            status: "charged dust",
            intensity: 1.4,
            fuelDrainPerSecond: 0.42,
            hullDamagePerSecond: 0.55,
            warningThreshold: 5,
          },
          pirate: {
            spawnTick: 14,
            driftSpeed: 4.8,
            pressureRate: 0.9,
            hullDamagePerSecond: 2.9,
          },
          anomalies: [
            {
              id: "anomaly-rift-lens",
              name: "Rift Lens",
              position: { x: -30, y: 3, z: -48 },
              radius: 4.6,
              scanDifficulty: 2.5,
              surveyValue: 32,
              chartsHazard: true,
            },
            {
              id: "anomaly-derelict-slate",
              name: "Derelict Slate",
              position: { x: 42, y: -1, z: -18 },
              radius: 5,
              scanDifficulty: 3,
              surveyValue: 40,
              chartsHazard: false,
            },
          ],
          salvageSites: [
            {
              id: "salvage-rift-hulk",
              name: "Rift-Torn Crew Hulk",
              type: "derelict-hull",
              family: "relic",
              position: { x: -14, y: 0, z: -58 },
              radius: 5.4,
              scanDifficulty: 2.7,
              confidenceThreshold: 0.68,
              extractionDifficulty: 2.3,
              remainingSalvage: 3,
              rewardValue: 48,
              valueVariance: 10,
              relicReward: 1,
              volatility: 0.34,
              failureThreshold: 1.1,
              piratePressure: 9,
              hazardExposure: 1.1,
              failureHullDamage: 8,
              scanValue: 18,
            },
            {
              id: "salvage-rift-volatile",
              name: "Volatile Engine Grave",
              type: "volatile-wreck",
              family: "hazard",
              position: { x: 34, y: -2, z: -48 },
              radius: 4.8,
              scanDifficulty: 3.3,
              confidenceThreshold: 0.78,
              extractionDifficulty: 2.8,
              remainingSalvage: 2,
              rewardValue: 64,
              valueVariance: 14,
              relicReward: 0,
              volatility: 0.74,
              failureThreshold: 1.0,
              piratePressure: 18,
              hazardExposure: 2.6,
              failureHullDamage: 13,
              scanValue: 24,
            },
          ],
          unlocks: ["umbra-trench"],
        },
        {
          id: "umbra-trench",
          name: "Umbra Trench",
          tier: 3,
          condition: "Pirate-marked hazard shelf",
          charterTitle: "Umbra Ladder Charter",
          objective: "Scan two anomalies, pull 12 ore, recover a derelict relic, and decide when to spend decoys before the trench closes.",
          requiredOre: 12,
          requiredScans: 2,
          requiredSalvageValue: 90,
          requiredRelics: 1,
          rewardCredits: 320,
          surveyReward: 80,
          salvageReward: 45,
          oreValueBonus: 11,
          oreReserveBonus: 2,
          hazard: {
            status: "ion shear",
            intensity: 2.1,
            fuelDrainPerSecond: 0.55,
            hullDamagePerSecond: 0.85,
            warningThreshold: 4,
          },
          pirate: {
            spawnTick: 10,
            driftSpeed: 5.6,
            pressureRate: 1.15,
            hullDamagePerSecond: 3.4,
          },
          anomalies: [
            {
              id: "anomaly-umbra-crown",
              name: "Umbra Crown",
              position: { x: -44, y: 4, z: -40 },
              radius: 5.4,
              scanDifficulty: 3.2,
              surveyValue: 52,
              chartsHazard: true,
            },
            {
              id: "anomaly-black-pylon",
              name: "Black Pylon",
              position: { x: 8, y: 5, z: -60 },
              radius: 4.8,
              scanDifficulty: 3.4,
              surveyValue: 56,
              chartsHazard: true,
            },
            {
              id: "anomaly-wake-cache",
              name: "Wake Cache",
              position: { x: 45, y: -3, z: -36 },
              radius: 4.2,
              scanDifficulty: 2.8,
              surveyValue: 44,
              chartsHazard: false,
            },
          ],
          salvageSites: [
            {
              id: "salvage-umbra-vault",
              name: "Umbra Vault Spine",
              type: "derelict-hull",
              family: "relic",
              position: { x: -28, y: 1, z: -62 },
              radius: 5.8,
              scanDifficulty: 3,
              confidenceThreshold: 0.72,
              extractionDifficulty: 2.5,
              remainingSalvage: 3,
              rewardValue: 72,
              valueVariance: 16,
              relicReward: 1,
              volatility: 0.46,
              failureThreshold: 1.05,
              piratePressure: 15,
              hazardExposure: 1.9,
              failureHullDamage: 10,
              scanValue: 30,
            },
            {
              id: "salvage-umbra-blackbox",
              name: "Knife Wake Blackbox",
              type: "relay-cache",
              family: "manifest",
              position: { x: 30, y: 3, z: -24 },
              radius: 3.8,
              scanDifficulty: 2.6,
              confidenceThreshold: 0.62,
              extractionDifficulty: 2.1,
              remainingSalvage: 2,
              rewardValue: 58,
              valueVariance: 12,
              relicReward: 0,
              volatility: 0.28,
              failureThreshold: 1.15,
              piratePressure: 22,
              hazardExposure: 0.8,
              failureHullDamage: 6,
              scanValue: 22,
            },
          ],
          unlocks: [],
        },
      ],
    },
    salvage: {
      version: "0.2.0",
      releaseLabel: "Derelict Salvage",
      extractionRange: 10.5,
      scanRange: 16,
      baseExtractionPower: 1,
      confidencePerScan: 1,
      blindExtractionPenalty: 0.28,
      pressureRiskThreshold: 0.45,
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
    scan: false,
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

  function uniqueList(values = []) {
    return values.filter((value, index, source) => value && source.indexOf(value) === index);
  }

  function sectorById(sectorId) {
    return (
      GAME_DATA.surveyLadder.sectors.find((sector) => sector.id === sectorId) ||
      GAME_DATA.surveyLadder.sectors.find((sector) => sector.id === GAME_DATA.surveyLadder.defaultSectorId)
    );
  }

  function stationServiceById(serviceId) {
    return GAME_DATA.surveyLadder.stationServices.find((service) => service.id === serviceId) || null;
  }

  function sortSectorIdsByTier(sectorIds) {
    return sectorIds.slice().sort((left, right) => sectorById(left).tier - sectorById(right).tier);
  }

  function nextIncompleteSectorId(ladder) {
    const unlocked = sortSectorIdsByTier(ladder.unlockedSectorIds || []);
    return unlocked.find((sectorId) => !(ladder.completedSectorIds || []).includes(sectorId)) || ladder.currentSectorId;
  }

  function createSurveyLadderState(options = {}) {
    const base = options.ladder || {};
    const defaultSectorId = GAME_DATA.surveyLadder.defaultSectorId;
    const completedSectorIds = uniqueList(base.completedSectorIds || []);
    let unlockedSectorIds = uniqueList([defaultSectorId, ...(base.unlockedSectorIds || [])]);
    completedSectorIds.forEach((sectorId) => {
      const sector = sectorById(sectorId);
      unlockedSectorIds = uniqueList([...unlockedSectorIds, ...(sector.unlocks || [])]);
    });

    let currentSectorId = options.sectorId || base.currentSectorId || base.recommendedSectorId || defaultSectorId;
    if (!unlockedSectorIds.includes(currentSectorId)) {
      currentSectorId = nextIncompleteSectorId({ ...base, unlockedSectorIds, completedSectorIds }) || defaultSectorId;
    }
    const currentSector = sectorById(currentSectorId);

    return {
      version: GAME_DATA.surveyLadder.version,
      releaseLabel: GAME_DATA.surveyLadder.releaseLabel,
      currentSectorId,
      currentTier: currentSector.tier,
      unlockedSectorIds,
      completedSectorIds,
      recommendedSectorId: base.recommendedSectorId || nextIncompleteSectorId({ ...base, unlockedSectorIds, completedSectorIds, currentSectorId }),
      surveyScore: base.surveyScore || 0,
      anomalyScans: base.anomalyScans || 0,
      salvageScore: base.salvageScore || 0,
      relicsRecovered: base.relicsRecovered || 0,
      hazardCharts: { ...(base.hazardCharts || {}) },
      lastChoice: base.lastChoice || "spoke-approach",
      lastCompletedSectorId: base.lastCompletedSectorId || null,
    };
  }

  function createStationServiceState(options = {}) {
    const base = options.stationServices || {};
    const purchased = uniqueList(base.purchased || []);
    const state = {
      purchased,
      scanPowerBonus: base.scanPowerBonus || 0,
      hazardMitigation: base.hazardMitigation || 0,
      countermeasureCharges: base.countermeasureCharges || 0,
      salvagePowerBonus: base.salvagePowerBonus || 0,
      salvageConfidenceBonus: base.salvageConfidenceBonus || 0,
      salvageRiskMitigation: base.salvageRiskMitigation || 0,
      lastService: base.lastService || "none",
      countermeasureStatus: base.countermeasureStatus || "idle",
    };
    purchased.forEach((serviceId) => {
      const service = stationServiceById(serviceId);
      if (!service) {
        return;
      }
      state.scanPowerBonus = Math.max(state.scanPowerBonus, service.scanPowerBonus || 0);
      state.hazardMitigation = Math.max(state.hazardMitigation, service.hazardMitigation || 0);
      state.salvagePowerBonus = Math.max(state.salvagePowerBonus, service.salvagePowerBonus || 0);
      state.salvageConfidenceBonus = Math.max(state.salvageConfidenceBonus, service.salvageConfidenceBonus || 0);
      state.salvageRiskMitigation = Math.max(state.salvageRiskMitigation, service.salvageRiskMitigation || 0);
    });
    return state;
  }

  function createAnomalyNodes(seed = DEFAULT_SEED, sectorInput = GAME_DATA.surveyLadder.defaultSectorId) {
    const sector = typeof sectorInput === "string" ? sectorById(sectorInput) : sectorInput;
    const random = createRng(seed + sector.tier * 7919);
    return (sector.anomalies || []).map((anomaly, index) => ({
      ...clone(anomaly),
      scanSignature: `survey-${sector.id}-${seed}-${index + 1}`,
      signalPhase: round(random() * TWO_PI, 4),
      scanState: {
        status: "unscanned",
        progress: 0,
        scanned: false,
        lastScannedTick: null,
      },
    }));
  }

  function createSalvageSites(seed = DEFAULT_SEED, sectorInput = GAME_DATA.surveyLadder.defaultSectorId) {
    const sector = typeof sectorInput === "string" ? sectorById(sectorInput) : sectorInput;
    const random = createRng(seed + sector.tier * 12239 + 5003);
    return (sector.salvageSites || []).map((site, index) => {
      const valueVariance = site.valueVariance ? Math.floor(random() * site.valueVariance) : 0;
      const riskPhase = round(random(), 4);
      const remainingSalvage = site.remainingSalvage || 1;
      return {
        ...clone(site),
        rewardValue: (site.rewardValue || 0) + valueVariance,
        scanSignature: `salvage-${sector.id}-${seed}-${index + 1}`,
        riskPhase,
        salvageState: {
          status: "unscanned",
          lockProgress: 0,
          scanConfidence: 0,
          targetLocked: false,
          extractionProgress: 0,
          remainingSalvage,
          recoveredValue: 0,
          recoveredRelics: 0,
          failed: false,
          failure: null,
          lastTouchedTick: null,
        },
      };
    });
  }

  function createSalvageState(options = {}, stationServices = createStationServiceState(), salvageSites = []) {
    const base = options.salvage || {};
    const recommendedSite =
      base.recommendedSiteId ||
      (salvageSites.find((site) => site.type === "derelict-hull") || salvageSites[0] || {}).id ||
      null;
    return {
      version: GAME_DATA.salvage.version,
      releaseLabel: GAME_DATA.salvage.releaseLabel,
      range: GAME_DATA.salvage.extractionRange,
      scanRange: GAME_DATA.salvage.scanRange,
      extractionPower: round(GAME_DATA.salvage.baseExtractionPower + (stationServices.salvagePowerBonus || 0), 2),
      confidenceBonus: stationServices.salvageConfidenceBonus || 0,
      riskMitigation: stationServices.salvageRiskMitigation || 0,
      holdValue: base.holdValue || 0,
      relicsInHold: base.relicsInHold || 0,
      recoveredValue: base.recoveredValue || 0,
      bankedValue: base.bankedValue || 0,
      relicsRecovered: base.relicsRecovered || 0,
      failures: base.failures || 0,
      abandoned: base.abandoned || 0,
      active: false,
      targetId: null,
      status: base.status || "idle",
      lastOutcome: base.lastOutcome || "none",
      recommendedSiteId: recommendedSite,
    };
  }

  function createSectorContract(sector) {
    return {
      id: `charter-${sector.id}`,
      title: sector.charterTitle,
      objective: sector.objective,
      requiredOre: sector.requiredOre,
      requiredScans: sector.requiredScans,
      requiredSalvageValue: sector.requiredSalvageValue || 0,
      requiredRelics: sector.requiredRelics || 0,
      rewardCredits: sector.rewardCredits,
      status: "active",
      sectorId: sector.id,
      tier: sector.tier,
      progress: 0,
      deliveredOre: 0,
      deliveredScans: 0,
      deliveredSalvageValue: 0,
      deliveredRelics: 0,
      completedAt: null,
    };
  }

  function createHazardState(sector, ladder, stationServices) {
    const charted = Boolean((ladder.hazardCharts || {})[sector.id]);
    const hazard = sector.hazard || {};
    return {
      sectorId: sector.id,
      status: charted ? "charted" : hazard.status || "clear",
      intensity: hazard.intensity || 0,
      effectiveIntensity: 0,
      exposure: 0,
      surveyed: charted,
      mitigation: stationServices.hazardMitigation || 0,
      fuelDrainPerSecond: hazard.fuelDrainPerSecond || 0,
      hullDamagePerSecond: hazard.hullDamagePerSecond || 0,
      warningThreshold: hazard.warningThreshold || 99,
    };
  }

  function createAsteroidNodes(seed = DEFAULT_SEED, sectorInput = GAME_DATA.surveyLadder.defaultSectorId) {
    const sector = typeof sectorInput === "string" ? sectorById(sectorInput) : sectorInput;
    const random = createRng(seed);
    return GAME_DATA.asteroidField.nodes.map((node, index) => {
      const oreVariance = Math.floor(random() * 4);
      const spin = round(random() * TWO_PI, 4);
      return {
        ...clone(node),
        scanSignature: `vp-${sector.id}-${seed}-${index + 1}`,
        spin,
        oreRemaining: node.oreRemaining + (sector.oreReserveBonus || 0),
        oreValue: node.oreValue + oreVariance + (sector.oreValueBonus || 0),
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
    const ladder = createSurveyLadderState({ ladder: options.ladder, sectorId: options.sectorId });
    const sector = sectorById(ladder.currentSectorId);
    const stationServices = createStationServiceState({ stationServices: options.stationServices });
    const asteroids = createAsteroidNodes(seed, sector);
    const anomalies = createAnomalyNodes(seed, sector);
    const salvageSites = createSalvageSites(seed, sector);
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
      ladder,
      asteroids,
      anomalies,
      salvageSites,
      salvage: createSalvageState(options, stationServices, salvageSites),
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
      contract: createSectorContract(sector),
      target: {
        kind: "asteroid",
        id: asteroids[0].id,
        index: 0,
        distance: 0,
        bearing: 0,
      },
      pirate: {
        ...clone(GAME_DATA.pirate),
        ...clone(sector.pirate || {}),
        state: "dormant",
        encounterState: "distant",
        pressure: 0,
        attackCooldown: 0,
        velocity: vector(),
      },
      hazard: createHazardState(sector, ladder, stationServices),
      mining: {
        active: false,
        targetId: null,
        status: "idle",
        range: GAME_DATA.asteroidField.miningRange,
        lastYield: 0,
      },
      scanning: {
        active: false,
        targetId: null,
        status: "idle",
        range: GAME_DATA.asteroidField.miningRange + 7,
        power: 1 + stationServices.scanPowerBonus,
        lastScan: 0,
      },
      stationServices,
      upgrades: {
        purchased: purchasedUpgrades,
        lastPurchase: null,
      },
      stats: {
        oreMined: 0,
        oreSold: 0,
        oreLost: 0,
        anomaliesScanned: 0,
        salvageSitesLocked: 0,
        salvageUnitsRecovered: 0,
        salvageValueRecovered: 0,
        relicsRecovered: 0,
        salvageFailures: 0,
        countermeasuresDeployed: 0,
        sorties: options.runCount || 1,
      },
      run: {
        status: "launch",
        objective: sector.objective,
        failureReason: null,
        count: options.runCount || 1,
      },
      input: {
        thrust: false,
        brake: false,
        turnLeft: false,
        turnRight: false,
        mine: false,
        scan: false,
      },
      log: [{ tick: 0, message: `${GAME_DATA.surveyLadder.releaseLabel} tier ${sector.tier}: ${sector.name}.` }],
    };
    applyPurchasedUpgrades(state);
    return syncDerivedState(state);
  }

  function targetables(state) {
    const asteroidTargets = state.asteroids
      .filter((asteroid) => !asteroid.mineState.depleted)
      .map((asteroid) => ({ kind: "asteroid", id: asteroid.id, position: asteroid.position, name: asteroid.name }));
    const anomalyTargets = (state.anomalies || [])
      .filter((anomaly) => !anomaly.scanState.scanned)
      .map((anomaly) => ({ kind: "anomaly", id: anomaly.id, position: anomaly.position, name: anomaly.name }));
    const salvageTargets = (state.salvageSites || [])
      .filter((site) => !["depleted", "failed", "abandoned"].includes(site.salvageState.status))
      .map((site) => ({ kind: "salvage", id: site.id, position: site.position, name: site.name }));
    return [
      ...asteroidTargets,
      ...salvageTargets,
      ...anomalyTargets,
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
    if (target.kind === "anomaly") {
      return (state.anomalies || []).find((anomaly) => anomaly.id === target.id) || null;
    }
    if (target.kind === "salvage") {
      return (state.salvageSites || []).find((site) => site.id === target.id) || null;
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
      return `${state.contract.title} complete. Restart into ${state.ladder.recommendedSectorId}.`;
    }
    if (state.contract.requiredScans > state.contract.deliveredScans) {
      const remaining = state.contract.requiredScans - state.contract.deliveredScans;
      return `Scan ${remaining} anomaly signal${remaining === 1 ? "" : "s"} in ${sectorById(state.ladder.currentSectorId).name}, then finish the ore charter.`;
    }
    if ((state.contract.requiredSalvageValue || 0) > (state.contract.deliveredSalvageValue || 0)) {
      const remaining = Math.max(0, state.contract.requiredSalvageValue - (state.contract.deliveredSalvageValue || 0));
      if (state.salvage.holdValue > 0 || state.salvage.relicsInHold > 0) {
        return "Dock at Frontier Spoke to log recovered salvage and relics into the charter.";
      }
      return `Recover ${remaining}cr salvage value from ${sectorById(state.ladder.currentSectorId).name}.`;
    }
    if ((state.contract.requiredRelics || 0) > (state.contract.deliveredRelics || 0)) {
      if (state.salvage.relicsInHold > 0) {
        return "Dock at Frontier Spoke to secure the recovered relic.";
      }
      return `Recover ${state.contract.requiredRelics - (state.contract.deliveredRelics || 0)} derelict relic.`;
    }
    if ((state.salvage.holdValue > 0 || state.salvage.relicsInHold > 0) && state.station.proximity.dockable) {
      return "Dock at Frontier Spoke to bank salvage value and relic manifests.";
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
    return state.contract.objective || GAME_DATA.contract.objective;
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

    if (state.stationServices && state.scanning) {
      state.scanning.power = 1 + (state.stationServices.scanPowerBonus || 0);
      state.hazard.mitigation = state.stationServices.hazardMitigation || 0;
    }
    if (state.stationServices && state.salvage) {
      state.salvage.extractionPower = round(
        GAME_DATA.salvage.baseExtractionPower + (state.stationServices.salvagePowerBonus || 0),
        2
      );
      state.salvage.confidenceBonus = state.stationServices.salvageConfidenceBonus || 0;
      state.salvage.riskMitigation = state.stationServices.salvageRiskMitigation || 0;
    }

    const oreProgress = Math.min(1, state.contract.deliveredOre / state.contract.requiredOre);
    const scanProgress =
      state.contract.requiredScans > 0 ? Math.min(1, state.contract.deliveredScans / state.contract.requiredScans) : 1;
    const salvageProgress =
      state.contract.requiredSalvageValue > 0
        ? Math.min(1, (state.contract.deliveredSalvageValue || 0) / state.contract.requiredSalvageValue)
        : 1;
    const relicProgress =
      state.contract.requiredRelics > 0 ? Math.min(1, (state.contract.deliveredRelics || 0) / state.contract.requiredRelics) : 1;
    const progressParts = [oreProgress];
    if (state.contract.requiredScans > 0) {
      progressParts.push(scanProgress);
    }
    if (state.contract.requiredSalvageValue > 0) {
      progressParts.push(salvageProgress);
    }
    if (state.contract.requiredRelics > 0) {
      progressParts.push(relicProgress);
    }
    state.contract.progress = round(
      progressParts.reduce((total, progress) => total + progress, 0) / progressParts.length,
      3
    );
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
    } else if (state.scanning && state.scanning.active) {
      state.run.status = "scanning";
      state.run.failureReason = null;
    } else if (state.hazard && state.hazard.exposure >= state.hazard.warningThreshold) {
      state.run.status = "hazard";
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
    next.input.scan = Boolean(input.scan);
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

  function coolScanningState(state) {
    const next = state;
    if (!next.scanning) {
      return next;
    }
    next.scanning.active = false;
    next.scanning.targetId = null;
    next.scanning.lastScan = 0;
    (next.anomalies || []).forEach((anomaly) => {
      if (anomaly.scanState.scanned) {
        anomaly.scanState.status = "scanned";
      } else if (anomaly.scanState.status === "scanning") {
        anomaly.scanState.status = "locked";
      }
    });
    return next;
  }

  function coolSalvageState(state) {
    const next = state;
    if (!next.salvage) {
      return next;
    }
    next.salvage.active = false;
    next.salvage.targetId = null;
    (next.salvageSites || []).forEach((site) => {
      if (site.salvageState.status === "extracting") {
        site.salvageState.status = site.salvageState.targetLocked ? "locked" : "unscanned";
      }
      if (site.salvageState.status === "partial") {
        site.salvageState.status = site.salvageState.targetLocked ? "locked" : "unscanned";
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

  function scanTarget(state, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 2));
    const next = clone(state);
    if (next.run.status === "failed" || next.run.status === "complete") {
      next.scanning.status = "run closed";
      return syncDerivedState(next);
    }

    const target = findTarget(next);
    if (!target || next.target.kind !== "anomaly") {
      next.scanning.status = "no anomaly lock";
      return syncDerivedState(next);
    }

    const range = distance(next.ship.position, target.position);
    if (range > next.scanning.range + target.radius) {
      next.scanning.status = "out of range";
      return syncDerivedState(next);
    }

    if (target.scanState.scanned) {
      target.scanState.status = "scanned";
      next.scanning.status = "already scanned";
      return syncDerivedState(next);
    }

    target.scanState.status = "scanning";
    target.scanState.progress += next.scanning.power * dt;
    next.scanning.active = true;
    next.scanning.targetId = target.id;
    next.scanning.lastScan = 0;

    if (target.scanState.progress >= target.scanDifficulty) {
      target.scanState.progress = target.scanDifficulty;
      target.scanState.scanned = true;
      target.scanState.status = "scanned";
      target.scanState.lastScannedTick = next.tick;
      next.scanning.status = `scanned ${target.name}`;
      next.scanning.lastScan = 1;
      next.contract.deliveredScans += 1;
      next.stats.anomaliesScanned += 1;
      next.ladder.anomalyScans += 1;
      next.ladder.surveyScore += target.surveyValue || 0;
      if (target.chartsHazard) {
        next.hazard.surveyed = true;
        next.hazard.status = "charted";
        next.hazard.exposure = Math.max(0, next.hazard.exposure - 2);
        next.ladder.hazardCharts[next.ladder.currentSectorId] = true;
      }
      next.log.unshift({ tick: next.tick, message: `${target.name} scanned into the Survey Ladder.` });
    } else {
      next.scanning.status = `scanning ${Math.round((target.scanState.progress / target.scanDifficulty) * 100)}%`;
    }
    return syncDerivedState(next);
  }

  function salvageRisk(site, state) {
    const confidenceGap = Math.max(0, (site.confidenceThreshold || 0.65) - site.salvageState.scanConfidence);
    const phaseRisk = (site.riskPhase || 0) * 0.08;
    return round(clamp((site.volatility || 0) + confidenceGap + phaseRisk - (state.salvage.riskMitigation || 0), 0, 1.5), 3);
  }

  function scanSalvageTarget(state, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 2));
    const next = clone(state);
    if (next.run.status === "failed" || next.run.status === "complete") {
      next.salvage.status = "run closed";
      return syncDerivedState(next);
    }

    const target = findTarget(next);
    if (!target || next.target.kind !== "salvage") {
      next.salvage.status = "no salvage lock";
      return syncDerivedState(next);
    }

    const range = distance(next.ship.position, target.position);
    if (range > next.salvage.scanRange + target.radius) {
      next.salvage.status = "out of scan range";
      return syncDerivedState(next);
    }

    if (["failed", "depleted", "abandoned"].includes(target.salvageState.status)) {
      next.salvage.status = target.salvageState.status;
      return syncDerivedState(next);
    }

    const wasLocked = target.salvageState.targetLocked;
    target.salvageState.status = "scanning";
    target.salvageState.lockProgress +=
      (next.scanning.power * GAME_DATA.salvage.confidencePerScan + (next.salvage.confidenceBonus || 0)) * dt;
    target.salvageState.scanConfidence = round(
      clamp(target.salvageState.lockProgress / target.scanDifficulty + (next.salvage.confidenceBonus || 0), 0, 1),
      3
    );
    target.salvageState.targetLocked = target.salvageState.scanConfidence >= (target.confidenceThreshold || 0.65);
    target.salvageState.lastTouchedTick = next.tick;

    next.scanning.active = true;
    next.scanning.targetId = target.id;
    next.scanning.lastScan = target.salvageState.scanConfidence;
    next.scanning.status = `salvage confidence ${Math.round(target.salvageState.scanConfidence * 100)}%`;
    next.salvage.active = true;
    next.salvage.targetId = target.id;
    next.salvage.status = next.scanning.status;

    if (target.salvageState.targetLocked) {
      target.salvageState.status = target.salvageState.scanConfidence >= 1 ? "mapped" : "locked";
      next.salvage.status = `${target.name} ${target.salvageState.status}`;
      if (!wasLocked) {
        next.stats.salvageSitesLocked += 1;
        next.ladder.salvageScore += target.scanValue || 0;
        next.log.unshift({ tick: next.tick, message: `${target.name} salvage lock resolved.` });
      }
    }

    return syncDerivedState(next);
  }

  function applySalvagePressure(state, site, risk, failed = false) {
    const next = state;
    if (risk < GAME_DATA.salvage.pressureRiskThreshold && !failed) {
      return next;
    }
    const pressureScale = failed ? 1 : 0.45;
    next.hazard.exposure = round(next.hazard.exposure + (site.hazardExposure || 0) * risk * pressureScale, 3);
    next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (site.piratePressure || 0) * risk * pressureScale, 2));
    if (next.pirate.state === "dormant" && (site.piratePressure || 0) > 0) {
      next.pirate.state = "shadowing";
      next.pirate.encounterState = "contact";
    }
    return next;
  }

  function failSalvageSite(state, site, reason) {
    const next = state;
    site.salvageState.status = "failed";
    site.salvageState.failed = true;
    site.salvageState.failure = reason;
    site.salvageState.remainingSalvage = 0;
    site.salvageState.extractionProgress = 0;
    site.salvageState.lastTouchedTick = next.tick;
    const hullDamage = Math.max(0, (site.failureHullDamage || 0) - (next.salvage.riskMitigation || 0) * 10);
    next.ship.hull = Math.max(0, round(next.ship.hull - hullDamage, 2));
    applySalvagePressure(next, site, Math.max(site.failureThreshold || 1, salvageRisk(site, next)), true);
    next.salvage.failures += 1;
    next.salvage.active = false;
    next.salvage.targetId = site.id;
    next.salvage.status = `failed ${site.name}`;
    next.salvage.lastOutcome = reason;
    next.stats.salvageFailures += 1;
    next.log.unshift({ tick: next.tick, message: `${site.name} failed: ${reason}.` });
    return next;
  }

  function extractSalvageTarget(state, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 2));
    const next = clone(state);
    if (next.run.status === "failed" || next.run.status === "complete") {
      next.salvage.status = "run closed";
      return syncDerivedState(next);
    }

    const target = findTarget(next);
    if (!target || next.target.kind !== "salvage") {
      next.salvage.status = "no salvage lock";
      return syncDerivedState(next);
    }

    const range = distance(next.ship.position, target.position);
    if (range > next.salvage.range + target.radius) {
      next.salvage.status = "out of extraction range";
      return syncDerivedState(next);
    }

    if (["failed", "depleted", "abandoned"].includes(target.salvageState.status)) {
      next.salvage.status = target.salvageState.status;
      return syncDerivedState(next);
    }

    const risk = salvageRisk(target, next);
    if (risk >= (target.failureThreshold || 1.1)) {
      failSalvageSite(next, target, "volatile blind extraction");
      return syncDerivedState(next);
    }

    const confidenceFactor = clamp(
      1 - GAME_DATA.salvage.blindExtractionPenalty + target.salvageState.scanConfidence * 0.42,
      0.55,
      1.18
    );
    let recoveredUnits = 0;
    let recoveredValue = 0;
    let recoveredRelics = 0;
    target.salvageState.status = "extracting";
    target.salvageState.extractionProgress += next.salvage.extractionPower * confidenceFactor * dt;

    while (
      target.salvageState.extractionProgress >= target.extractionDifficulty &&
      target.salvageState.remainingSalvage > 0
    ) {
      target.salvageState.extractionProgress -= target.extractionDifficulty;
      target.salvageState.remainingSalvage -= 1;
      recoveredUnits += 1;
      const unitValue = Math.round((target.rewardValue || 0) * (target.salvageState.targetLocked ? 1.08 : 1));
      recoveredValue += unitValue;
      if ((target.relicReward || 0) > target.salvageState.recoveredRelics) {
        recoveredRelics += 1;
        target.salvageState.recoveredRelics += 1;
      }
    }

    if (recoveredUnits > 0) {
      target.salvageState.recoveredValue += recoveredValue;
      next.salvage.holdValue += recoveredValue;
      next.salvage.relicsInHold += recoveredRelics;
      next.salvage.recoveredValue += recoveredValue;
      next.salvage.relicsRecovered += recoveredRelics;
      next.ladder.salvageScore += Math.ceil(recoveredValue / 5) + recoveredRelics * 25;
      next.ladder.relicsRecovered += recoveredRelics;
      next.stats.salvageUnitsRecovered += recoveredUnits;
      next.stats.salvageValueRecovered += recoveredValue;
      next.stats.relicsRecovered += recoveredRelics;
      next.salvage.lastOutcome =
        recoveredRelics > 0 ? `${recoveredValue}cr / ${recoveredRelics} relic` : `${recoveredValue}cr salvage`;
      next.log.unshift({
        tick: next.tick,
        message: `${target.name} yielded ${recoveredValue}cr salvage${recoveredRelics ? ` and ${recoveredRelics} relic` : ""}.`,
      });
    }

    if (target.salvageState.remainingSalvage <= 0) {
      target.salvageState.remainingSalvage = 0;
      target.salvageState.extractionProgress = 0;
      target.salvageState.status = "depleted";
    } else if (recoveredUnits > 0) {
      target.salvageState.status = "partial";
    }

    target.salvageState.lastTouchedTick = next.tick;
    next.salvage.active = true;
    next.salvage.targetId = target.id;
    next.salvage.status = recoveredUnits > 0 ? `recovered ${recoveredUnits}` : "extracting";
    applySalvagePressure(next, target, risk, false);
    return syncDerivedState(next);
  }

  function abandonSalvageTarget(state) {
    const next = clone(state);
    const target = findTarget(next);
    if (!target || next.target.kind !== "salvage") {
      next.salvage.status = "no salvage lock";
      return syncDerivedState(next);
    }
    if (!["failed", "depleted"].includes(target.salvageState.status)) {
      target.salvageState.status = "abandoned";
      target.salvageState.lastTouchedTick = next.tick;
      next.salvage.abandoned += 1;
      next.salvage.status = `abandoned ${target.name}`;
      next.salvage.lastOutcome = "abandoned";
      next.log.unshift({ tick: next.tick, message: `${target.name} marked abandoned for a safer route.` });
    }
    return syncDerivedState(next);
  }

  function contractReadyForCompletion(state) {
    return (
      state.contract.status === "active" &&
      state.contract.deliveredOre >= state.contract.requiredOre &&
      state.contract.deliveredScans >= state.contract.requiredScans &&
      (state.contract.deliveredSalvageValue || 0) >= (state.contract.requiredSalvageValue || 0) &&
      (state.contract.deliveredRelics || 0) >= (state.contract.requiredRelics || 0)
    );
  }

  function advanceSurveyLadder(state) {
    const next = state;
    const sector = sectorById(next.contract.sectorId || next.ladder.currentSectorId);
    const wasCompleted = next.ladder.completedSectorIds.includes(sector.id);
    if (!wasCompleted) {
      next.ladder.completedSectorIds = uniqueList([...next.ladder.completedSectorIds, sector.id]);
      next.ladder.unlockedSectorIds = uniqueList([...next.ladder.unlockedSectorIds, ...(sector.unlocks || [])]);
      next.ladder.surveyScore += sector.surveyReward || 0;
      if ((sector.requiredSalvageValue || 0) > 0 && (next.contract.deliveredSalvageValue || 0) >= sector.requiredSalvageValue) {
        next.ladder.salvageScore += sector.salvageReward || 0;
      }
      next.ladder.lastCompletedSectorId = sector.id;
    }
    next.ladder.recommendedSectorId = nextIncompleteSectorId(next.ladder) || sector.id;
    next.ladder.lastChoice = `completed ${sector.name}`;
    return next;
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
    const salvagedValue = next.salvage ? next.salvage.holdValue : 0;
    const salvagedRelics = next.salvage ? next.salvage.relicsInHold : 0;
    next.station.docked = true;
    next.station.lastSale = saleCredits;
    next.station.lastService = "sold cargo / repaired / refueled";
    next.credits += saleCredits + salvagedValue;
    next.stats.oreSold += soldOre;
    next.contract.deliveredOre += soldOre;
    next.cargo.ore = 0;
    next.cargo.value = 0;
    if (next.salvage) {
      next.contract.deliveredSalvageValue = (next.contract.deliveredSalvageValue || 0) + salvagedValue;
      next.contract.deliveredRelics = (next.contract.deliveredRelics || 0) + salvagedRelics;
      next.salvage.bankedValue += salvagedValue;
      next.salvage.holdValue = 0;
      next.salvage.relicsInHold = 0;
    }
    next.ship.hull = next.ship.maxHull;
    next.ship.fuel = next.ship.maxFuel;

    if (soldOre > 0 || salvagedValue > 0 || salvagedRelics > 0) {
      const salvageText =
        salvagedValue > 0 || salvagedRelics > 0
          ? ` and logged ${salvagedValue}cr salvage${salvagedRelics ? ` / ${salvagedRelics} relic` : ""}`
          : "";
      next.log.unshift({ tick: next.tick, message: `Sold ${soldOre} ore for ${saleCredits} credits${salvageText}.` });
    } else {
      next.log.unshift({ tick: next.tick, message: "Docking clamps serviced hull and tanks." });
    }

    if (contractReadyForCompletion(next)) {
      next.contract.status = "complete";
      next.contract.completedAt = next.tick;
      advanceSurveyLadder(next);
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

  function purchaseStationService(state, serviceId = "survey-probes") {
    const next = syncDerivedState(clone(state));
    const service = stationServiceById(serviceId);
    if (!service) {
      next.stationServices.lastService = "unknown service";
      return syncDerivedState(next);
    }
    if (!next.station.proximity.dockable) {
      next.stationServices.lastService = "dock required";
      return syncDerivedState(next);
    }
    if (next.stationServices.purchased.includes(serviceId)) {
      next.stationServices.lastService = `${service.name} ready`;
      return syncDerivedState(next);
    }
    if (next.credits < service.cost) {
      next.stationServices.lastService = `${service.cost - next.credits} credits short`;
      return syncDerivedState(next);
    }

    next.credits -= service.cost;
    next.stationServices.purchased.push(serviceId);
    next.stationServices.scanPowerBonus += service.scanPowerBonus || 0;
    next.stationServices.hazardMitigation += service.hazardMitigation || 0;
    next.stationServices.countermeasureCharges += service.countermeasureCharges || 0;
    next.stationServices.salvagePowerBonus += service.salvagePowerBonus || 0;
    next.stationServices.salvageConfidenceBonus += service.salvageConfidenceBonus || 0;
    next.stationServices.salvageRiskMitigation += service.salvageRiskMitigation || 0;
    next.stationServices.lastService = `${service.name} purchased`;
    next.log.unshift({ tick: next.tick, message: `${service.name} purchased for the next survey push.` });
    return syncDerivedState(next);
  }

  function deployCountermeasure(state) {
    const next = clone(state);
    if (!next.stationServices || next.stationServices.countermeasureCharges <= 0) {
      next.stationServices = next.stationServices || createStationServiceState();
      next.stationServices.countermeasureStatus = "no charge";
      return syncDerivedState(next);
    }

    next.stationServices.countermeasureCharges -= 1;
    next.stationServices.countermeasureStatus = "deployed";
    next.pirate.pressure = Math.max(0, next.pirate.pressure - 35);
    next.pirate.attackCooldown = Math.max(next.pirate.attackCooldown, next.pirate.stealCooldown + 4);
    const awayFromShip = normalize(subtract(next.pirate.position, next.ship.position));
    const fallback = vector(-1, 0, -1);
    const shove = length(awayFromShip) ? awayFromShip : normalize(fallback);
    next.pirate.position = add(next.ship.position, scale(shove, next.pirate.attackRadius + 12));
    next.stats.countermeasuresDeployed += 1;
    next.log.unshift({ tick: next.tick, message: "Decoy burst broke the pirate wake lock." });
    return syncDerivedState(next);
  }

  function sectorChoiceOpen(state) {
    return (
      state.contract.status === "active" &&
      state.cargo.ore === 0 &&
      state.contract.deliveredOre === 0 &&
      state.contract.deliveredScans === 0 &&
      state.stats.oreMined === 0 &&
      state.stats.anomaliesScanned === 0 &&
      state.stats.salvageUnitsRecovered === 0 &&
      state.stats.salvageSitesLocked === 0 &&
      state.salvage.holdValue === 0 &&
      state.salvage.relicsInHold === 0
    );
  }

  function chooseSector(state, sectorId) {
    const current = syncDerivedState(clone(state));
    const sector = GAME_DATA.surveyLadder.sectors.find((candidate) => candidate.id === sectorId);
    if (!sector || !current.ladder.unlockedSectorIds.includes(sector.id)) {
      current.ladder.lastChoice = `locked ${sectorId}`;
      return syncDerivedState(current);
    }
    if (!sectorChoiceOpen(current)) {
      current.ladder.lastChoice = "finish current charter first";
      return syncDerivedState(current);
    }

    const next = createInitialState({
      seed: current.seed,
      credits: current.credits,
      upgrades: current.upgrades.purchased,
      runCount: current.run.count,
      ladder: { ...current.ladder, currentSectorId: sector.id, recommendedSectorId: sector.id },
      stationServices: current.stationServices,
      salvage: {
        bankedValue: current.salvage.bankedValue,
        recoveredValue: current.salvage.recoveredValue,
        relicsRecovered: current.salvage.relicsRecovered,
        failures: current.salvage.failures,
        abandoned: current.salvage.abandoned,
      },
      sectorId: sector.id,
    });
    next.ladder.lastChoice = `sector ${sector.name}`;
    next.log.unshift({ tick: 0, message: `${sector.name} selected from the Survey Ladder.` });
    return syncDerivedState(next);
  }

  function resetRun(state, options = {}) {
    const seed = options.seed === undefined ? state.seed + 1 : options.seed;
    const credits = options.credits === undefined ? state.credits : options.credits;
    const sectorId = options.sectorId || state.ladder.recommendedSectorId || state.ladder.currentSectorId;
    const next = createInitialState({
      seed,
      credits,
      upgrades: state.upgrades.purchased,
      runCount: (state.run.count || 1) + 1,
      ladder: state.ladder,
      stationServices: state.stationServices,
      salvage: {
        bankedValue: state.salvage.bankedValue,
        recoveredValue: state.salvage.recoveredValue,
        relicsRecovered: state.salvage.relicsRecovered,
        failures: state.salvage.failures,
        abandoned: state.salvage.abandoned,
      },
      sectorId,
    });
    next.log.unshift({
      tick: 0,
      message: `Sortie ${next.run.count} reset into ${sectorById(next.ladder.currentSectorId).name}.`,
    });
    return syncDerivedState(next);
  }

  function updateHazardState(state, deltaSeconds) {
    const next = state;
    if (!next.hazard || next.hazard.intensity <= 0 || next.station.proximity.dockable) {
      return next;
    }
    const chartBonus = next.hazard.surveyed ? 0.55 : 0;
    const effectiveIntensity = Math.max(0, next.hazard.intensity - (next.hazard.mitigation || 0) - chartBonus);
    next.hazard.effectiveIntensity = round(effectiveIntensity, 3);
    if (effectiveIntensity <= 0) {
      next.hazard.status = next.hazard.surveyed ? "charted" : "suppressed";
      return next;
    }

    next.hazard.exposure = round(next.hazard.exposure + effectiveIntensity * deltaSeconds, 3);
    next.ship.fuel = Math.max(0, next.ship.fuel - effectiveIntensity * next.hazard.fuelDrainPerSecond * deltaSeconds);
    if (next.hazard.exposure >= next.hazard.warningThreshold) {
      next.ship.hull = Math.max(0, next.ship.hull - effectiveIntensity * next.hazard.hullDamagePerSecond * deltaSeconds);
      next.hazard.status = "biting";
    } else {
      next.hazard.status = next.hazard.surveyed ? "charted" : sectorById(next.ladder.currentSectorId).hazard.status;
    }
    return next;
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
    next = updateHazardState(next, dt);
    next = coolMiningState(next, dt);
    next = coolScanningState(next, dt);
    next = coolSalvageState(next, dt);
    if (input.mine) {
      next = next.target.kind === "salvage" ? extractSalvageTarget(next, dt) : mineTarget(next, dt);
    }
    if (input.scan) {
      next = next.target.kind === "salvage" ? scanSalvageTarget(next, dt) : scanTarget(next, dt);
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

  function surveySummary(state) {
    const sector = sectorById(state.ladder.currentSectorId);
    return {
      version: state.ladder.version,
      releaseLabel: state.ladder.releaseLabel,
      sectorId: sector.id,
      sectorName: sector.name,
      tier: sector.tier,
      condition: sector.condition,
      unlockedSectorIds: state.ladder.unlockedSectorIds.slice(),
      completedSectorIds: state.ladder.completedSectorIds.slice(),
      recommendedSectorId: state.ladder.recommendedSectorId,
      surveyScore: state.ladder.surveyScore,
      anomalyScans: state.ladder.anomalyScans,
      contract: {
        title: state.contract.title,
        ore: `${state.contract.deliveredOre}/${state.contract.requiredOre}`,
        scans: `${state.contract.deliveredScans}/${state.contract.requiredScans}`,
        progress: state.contract.progress,
      },
      hazard: {
        status: state.hazard.status,
        intensity: state.hazard.intensity,
        effectiveIntensity: state.hazard.effectiveIntensity,
        exposure: state.hazard.exposure,
        surveyed: state.hazard.surveyed,
        warningThreshold: state.hazard.warningThreshold,
      },
      salvage: {
        version: state.salvage.version,
        releaseLabel: state.salvage.releaseLabel,
        holdValue: state.salvage.holdValue,
        relicsInHold: state.salvage.relicsInHold,
        bankedValue: state.salvage.bankedValue,
        relicsRecovered: state.salvage.relicsRecovered,
        salvageScore: state.ladder.salvageScore,
      },
    };
  }

  function salvageSummary(state) {
    return {
      version: state.salvage.version,
      releaseLabel: state.salvage.releaseLabel,
      status: state.salvage.status,
      extractionPower: state.salvage.extractionPower,
      confidenceBonus: state.salvage.confidenceBonus,
      riskMitigation: state.salvage.riskMitigation,
      holdValue: state.salvage.holdValue,
      relicsInHold: state.salvage.relicsInHold,
      bankedValue: state.salvage.bankedValue,
      recoveredValue: state.salvage.recoveredValue,
      relicsRecovered: state.salvage.relicsRecovered,
      failures: state.salvage.failures,
      abandoned: state.salvage.abandoned,
      recommendedSiteId: state.salvage.recommendedSiteId,
      contract: {
        requiredSalvageValue: state.contract.requiredSalvageValue,
        deliveredSalvageValue: state.contract.deliveredSalvageValue,
        requiredRelics: state.contract.requiredRelics,
        deliveredRelics: state.contract.deliveredRelics,
      },
      sites: (state.salvageSites || []).map((site) => ({
        id: site.id,
        name: site.name,
        type: site.type,
        family: site.family,
        remainingSalvage: site.salvageState.remainingSalvage,
        rewardValue: site.rewardValue,
        relicReward: site.relicReward || 0,
        scanConfidence: site.salvageState.scanConfidence,
        targetLocked: site.salvageState.targetLocked,
        extractionProgress: round(site.salvageState.extractionProgress, 3),
        status: site.salvageState.status,
        risk: salvageRisk(site, state),
      })),
    };
  }

  function stationServiceSummary(state) {
    return GAME_DATA.surveyLadder.stationServices.map((service) => ({
      id: service.id,
      name: service.name,
      cost: service.cost,
      purchased: state.stationServices.purchased.includes(service.id),
      affordable: state.credits >= service.cost,
    }));
  }

  function sectorRouteState(state, sector) {
    if (state.ladder.currentSectorId === sector.id) {
      return "current";
    }
    if (state.ladder.completedSectorIds.includes(sector.id)) {
      return "complete";
    }
    if (!state.ladder.unlockedSectorIds.includes(sector.id)) {
      return "locked";
    }
    if (state.ladder.recommendedSectorId === sector.id) {
      return "recommended";
    }
    return "open";
  }

  function serviceStatusText(state, service) {
    if (state.stationServices.purchased.includes(service.id)) {
      return "installed";
    }
    if (!state.station.proximity.dockable) {
      return "dock required";
    }
    if (state.credits < service.cost) {
      return `${service.cost - state.credits}cr short`;
    }
    return `${service.cost}cr ready`;
  }

  function surveyCockpitSurface(state) {
    const summary = surveySummary(state);
    const salvage = salvageSummary(state);
    const completedCount = summary.completedSectorIds.length;
    const totalSectors = GAME_DATA.surveyLadder.sectors.length;
    const target = targetSummary(state);
    const canAct = state.run.status !== "failed" && state.run.status !== "complete";
    const services = GAME_DATA.surveyLadder.stationServices.map((service) => ({
      id: service.id,
      name: service.name,
      cost: service.cost,
      purchased: state.stationServices.purchased.includes(service.id),
      affordable: state.credits >= service.cost,
      enabled:
        state.station.proximity.dockable &&
        !state.stationServices.purchased.includes(service.id) &&
        state.credits >= service.cost,
      status: serviceStatusText(state, service),
    }));
    const sectors = GAME_DATA.surveyLadder.sectors.map((sector) => ({
      id: sector.id,
      name: sector.name,
      tier: sector.tier,
      condition: sector.condition,
      state: sectorRouteState(state, sector),
      unlocked: state.ladder.unlockedSectorIds.includes(sector.id),
      completed: state.ladder.completedSectorIds.includes(sector.id),
      current: state.ladder.currentSectorId === sector.id,
      recommended: state.ladder.recommendedSectorId === sector.id,
      objective: sector.objective,
      requiredOre: sector.requiredOre,
      requiredScans: sector.requiredScans,
      rewardCredits: sector.rewardCredits,
      hazardStatus: sector.hazard.status,
      pirateSpawnTick: sector.pirate.spawnTick,
    }));
    const serviceNames = services.filter((service) => service.purchased).map((service) => service.name);
    const scanGoal =
      state.contract.requiredScans > 0
        ? `${state.contract.deliveredScans}/${state.contract.requiredScans} scans`
        : `${state.anomalies.filter((anomaly) => anomaly.scanState.scanned).length}/${state.anomalies.length} optional`;
    const countermeasureReady =
      canAct && state.stationServices.countermeasureCharges > 0 && state.pirate.state !== "dormant";

    return {
      titleText: `${summary.releaseLabel} v${summary.version} / tier ${summary.tier}`,
      ladderText: `tier ${summary.tier} / ${completedCount}/${totalSectors} charted`,
      sectorText: `${summary.sectorName} / ${summary.condition}`,
      objectiveProgressText: `${state.contract.title}: ${summary.contract.ore} ore / ${summary.contract.scans} scans`,
      hazardText: `${summary.hazard.status} / exposure ${round(summary.hazard.exposure, 1)} / eff ${round(summary.hazard.effectiveIntensity, 1)}`,
      scanText: `${scanGoal} / ${state.scanning.status}`,
      salvageText: `${salvage.releaseLabel} / hold ${salvage.holdValue}cr / relics ${salvage.relicsInHold} / ${state.salvage.status}`,
      serviceText:
        serviceNames.length > 0
          ? `${serviceNames.join(" + ")} / ${state.stationServices.countermeasureCharges} burst`
          : `${state.stationServices.lastService} / ${state.stationServices.countermeasureCharges} burst`,
      statusText: `${summary.sectorName}: ${state.run.objective}`,
      routeText: `${completedCount} charted / next ${sectorById(summary.recommendedSectorId).name}`,
      sectors,
      services,
      actions: {
        canScan: canAct && target.kind === "anomaly",
        canScanSalvage: canAct && target.kind === "salvage",
        canExtractSalvage: canAct && target.kind === "salvage",
        canSetSector: canAct && sectorChoiceOpen(state),
        countermeasureReady,
        countermeasureText:
          state.stationServices.countermeasureCharges > 0
            ? `${state.stationServices.countermeasureCharges} burst${state.stationServices.countermeasureCharges === 1 ? "" : "s"}`
            : "no burst",
      },
      log: state.log.slice(0, 3).map((entry) => entry.message),
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
    } else if (state.target.kind === "anomaly") {
      if (target.scanState.scanned) {
        status = "scanned";
      } else if (state.scanning.active && state.scanning.targetId === target.id) {
        status = `${state.scanning.status} / ${Math.round((target.scanState.progress / target.scanDifficulty) * 100)}%`;
      } else {
        status = `${target.scanState.status} / difficulty ${target.scanDifficulty}`;
      }
    } else if (state.target.kind === "salvage") {
      const confidence = Math.round(target.salvageState.scanConfidence * 100);
      const progress = Math.round((target.salvageState.extractionProgress / target.extractionDifficulty) * 100);
      const risk = salvageRisk(target, state);
      if (target.salvageState.failed) {
        status = `failed / ${target.salvageState.failure}`;
      } else {
        status = `${target.salvageState.status} / confidence ${confidence}% / extraction ${progress}% / ${target.salvageState.remainingSalvage} left / risk ${risk}`;
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
    dom.ladder = document.getElementById("ladder-readout");
    dom.sector = document.getElementById("sector-readout");
    dom.hull = document.getElementById("hull-readout");
    dom.fuel = document.getElementById("fuel-readout");
    dom.cargo = document.getElementById("cargo-readout");
    dom.credits = document.getElementById("credits-readout");
    dom.pressure = document.getElementById("pressure-readout");
    dom.hazard = document.getElementById("hazard-readout");
    dom.contract = document.getElementById("contract-readout");
    dom.scan = document.getElementById("scan-readout");
    dom.upgrade = document.getElementById("upgrade-readout");
    dom.service = document.getElementById("service-readout");
    dom.target = document.getElementById("target-readout");
    dom.station = document.getElementById("station-readout");
    dom.targetName = document.getElementById("target-name");
    dom.targetKind = document.getElementById("target-kind");
    dom.targetBearing = document.getElementById("target-bearing");
    dom.targetRange = document.getElementById("target-range");
    dom.targetState = document.getElementById("target-state");
    dom.mineAction = document.getElementById("mine-action");
    dom.scanAction = document.getElementById("scan-action");
    dom.dockAction = document.getElementById("dock-action");
    dom.upgradeAction = document.getElementById("upgrade-action");
    dom.restartAction = document.getElementById("restart-action");
    dom.ladderTitle = document.getElementById("ladder-title");
    dom.ladderStatus = document.getElementById("ladder-status-surface");
    dom.sectorList = document.getElementById("sector-list");
    dom.sectorSelect = document.getElementById("sector-select");
    dom.sectorAction = document.getElementById("sector-action");
    dom.serviceProbesAction = document.getElementById("service-probes-action");
    dom.serviceDecoyAction = document.getElementById("service-decoy-action");
    dom.countermeasureAction = document.getElementById("countermeasure-action");
    dom.eventLog = document.getElementById("event-log");
  }

  function renderSectorRows(surface) {
    if (!dom.sectorList) {
      return;
    }
    const signature = surface.sectors.map((sector) => `${sector.id}:${sector.state}`).join("|");
    if (dom.sectorList.dataset.signature === signature) {
      return;
    }
    dom.sectorList.dataset.signature = signature;
    dom.sectorList.replaceChildren();
    surface.sectors.forEach((sector) => {
      const row = document.createElement("div");
      row.className = "sector-row";
      row.dataset.state = sector.state;

      const name = document.createElement("strong");
      name.textContent = `T${sector.tier} ${sector.name}`;
      const state = document.createElement("span");
      state.textContent = `${sector.state} / ${sector.condition}`;
      row.append(name, state);
      dom.sectorList.append(row);
    });
  }

  function renderSectorSelect(surface, state) {
    if (!dom.sectorSelect) {
      return;
    }
    const signature = surface.sectors.map((sector) => `${sector.id}:${sector.unlocked}:${sector.current}`).join("|");
    if (dom.sectorSelect.dataset.signature !== signature) {
      dom.sectorSelect.dataset.signature = signature;
      dom.sectorSelect.replaceChildren();
      surface.sectors.forEach((sector) => {
        const option = document.createElement("option");
        option.value = sector.id;
        option.disabled = !sector.unlocked;
        option.textContent = `T${sector.tier} ${sector.name}${sector.unlocked ? "" : " locked"}`;
        dom.sectorSelect.append(option);
      });
    }
    if (dom.sectorSelect.dataset.currentSector !== state.ladder.currentSectorId && document.activeElement !== dom.sectorSelect) {
      dom.sectorSelect.value = state.ladder.currentSectorId;
      dom.sectorSelect.dataset.currentSector = state.ladder.currentSectorId;
    }
  }

  function renderEventLog(surface) {
    if (!dom.eventLog) {
      return;
    }
    const signature = surface.log.join("|");
    if (dom.eventLog.dataset.signature === signature) {
      return;
    }
    dom.eventLog.dataset.signature = signature;
    dom.eventLog.replaceChildren();
    surface.log.forEach((message) => {
      const item = document.createElement("li");
      item.textContent = message;
      dom.eventLog.append(item);
    });
  }

  function renderSurveyPanel(state, surface) {
    if (dom.ladderTitle) {
      dom.ladderTitle.textContent = surface.titleText;
    }
    if (dom.ladderStatus) {
      dom.ladderStatus.textContent = surface.statusText;
    }
    renderSectorRows(surface);
    renderSectorSelect(surface, state);
    renderEventLog(surface);

    if (dom.sectorAction) {
      dom.sectorAction.disabled = !surface.actions.canSetSector;
    }
    if (dom.serviceProbesAction) {
      const service = surface.services.find((candidate) => candidate.id === "survey-probes");
      dom.serviceProbesAction.disabled = !service || !service.enabled;
      dom.serviceProbesAction.textContent = service ? `Probes ${service.status}` : "Probes";
    }
    if (dom.serviceDecoyAction) {
      const service = surface.services.find((candidate) => candidate.id === "decoy-burst");
      dom.serviceDecoyAction.disabled = !service || !service.enabled;
      dom.serviceDecoyAction.textContent = service ? `Decoy ${service.status}` : "Decoy";
    }
    if (dom.countermeasureAction) {
      dom.countermeasureAction.disabled = !surface.actions.countermeasureReady;
      dom.countermeasureAction.textContent = `Burst ${surface.actions.countermeasureText}`;
    }
  }

  function renderHud(state) {
    const target = targetSummary(state);
    const station = dockingStatus(state);
    const upgrade = upgradeSummary(state);
    const surface = surveyCockpitSurface(state);
    dom.runStatus.textContent = `${state.run.status} / ${state.renderer.status}`;
    dom.objective.textContent = state.run.objective;
    dom.ladder.textContent = surface.ladderText;
    dom.sector.textContent = surface.sectorText;
    dom.hull.textContent = `${Math.round(state.ship.hull)} / ${state.ship.maxHull}`;
    dom.fuel.textContent = `${Math.round(state.ship.fuel)} / ${state.ship.maxFuel}`;
    dom.cargo.textContent = `${state.cargo.ore} / ${state.cargo.capacity} / ${state.cargo.value}cr`;
    dom.credits.textContent = String(state.credits);
    dom.pressure.textContent = `${Math.round(state.pirate.pressure)} / ${state.pirate.encounterState}`;
    dom.hazard.textContent = surface.hazardText;
    dom.contract.textContent =
      state.contract.requiredScans > 0
        ? `${state.contract.status} / ${state.contract.deliveredOre}/${state.contract.requiredOre} ore / ${state.contract.deliveredScans}/${state.contract.requiredScans} scans`
        : `${state.contract.status} / ${state.contract.deliveredOre} of ${state.contract.requiredOre}`;
    dom.scan.textContent = surface.scanText;
    dom.upgrade.textContent = upgrade.text;
    dom.service.textContent = surface.serviceText;
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
    dom.ladder.closest(".readout").dataset.tone = "signal";
    dom.sector.closest(".readout").dataset.tone = state.ladder.currentTier > 1 ? "warn" : "signal";
    dom.hazard.closest(".readout").dataset.tone = state.hazard.effectiveIntensity > 1 ? "danger" : state.hazard.intensity > 0 ? "warn" : "signal";
    dom.scan.closest(".readout").dataset.tone =
      state.contract.requiredScans > state.contract.deliveredScans ? "warn" : "signal";
    dom.service.closest(".readout").dataset.tone =
      state.stationServices.countermeasureCharges > 0 || state.stationServices.purchased.length > 0 ? "signal" : "warn";
    if (dom.mineAction) {
      const cargoBlocked = target.kind === "asteroid" && state.cargo.ore >= state.cargo.capacity;
      dom.mineAction.disabled =
        !["asteroid", "salvage"].includes(target.kind) || cargoBlocked || state.run.status === "failed";
    }
    if (dom.scanAction) {
      dom.scanAction.disabled = !(surface.actions.canScan || surface.actions.canScanSalvage);
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
    renderSurveyPanel(state, surface);
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
      currentState =
        currentState.target.kind === "salvage" ? extractSalvageTarget(currentState, 1) : mineTarget(currentState, 1);
    } else if (action === "scan") {
      currentState =
        currentState.target.kind === "salvage" ? scanSalvageTarget(currentState, 1) : scanTarget(currentState, 1);
    } else if (action === "interact") {
      currentState = dockAtStation(currentState);
    } else if (action === "upgrade") {
      const upgrade = nextAffordableUpgrade(currentState);
      currentState = purchaseUpgrade(currentState, upgrade ? upgrade.id : "refined-beam");
    } else if (action === "service-probes") {
      currentState = purchaseStationService(currentState, "survey-probes");
    } else if (action === "service-decoy") {
      currentState = purchaseStationService(currentState, "decoy-burst");
    } else if (action === "countermeasure") {
      currentState = deployCountermeasure(currentState);
    } else if (action === "sector") {
      const sectorId = dom.sectorSelect ? dom.sectorSelect.value : currentState.ladder.currentSectorId;
      currentState = chooseSector(currentState, sectorId);
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
    if (dom.scanAction) {
      dom.scanAction.addEventListener("click", () => performAction("scan"));
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
    if (dom.sectorAction) {
      dom.sectorAction.addEventListener("click", () => performAction("sector"));
    }
    if (dom.serviceProbesAction) {
      dom.serviceProbesAction.addEventListener("click", () => performAction("service-probes"));
    }
    if (dom.serviceDecoyAction) {
      dom.serviceDecoyAction.addEventListener("click", () => performAction("service-decoy"));
    }
    if (dom.countermeasureAction) {
      dom.countermeasureAction.addEventListener("click", () => performAction("countermeasure"));
    }
  }

  function configureTexture(THREE, texture, options = {}) {
    if (!texture) {
      return null;
    }
    if (THREE.SRGBColorSpace) {
      texture.colorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding) {
      texture.encoding = THREE.sRGBEncoding;
    }
    if (options.repeat) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(options.repeat[0], options.repeat[1]);
    }
    return texture;
  }

  function loadSceneAssets(THREE) {
    const loader = new THREE.TextureLoader();
    return {
      shipDecal: configureTexture(THREE, loader.load(ASSET_PATHS.shipDecal)),
      asteroidOreGlow: configureTexture(THREE, loader.load(ASSET_PATHS.asteroidOreGlow), { repeat: [2, 2] }),
      stationDockPanel: configureTexture(THREE, loader.load(ASSET_PATHS.stationDockPanel)),
      pirateMarker: configureTexture(THREE, loader.load(ASSET_PATHS.pirateMarker)),
    };
  }

  function createShipMesh(THREE, assets = {}) {
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

    if (assets.shipDecal) {
      const decal = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 1.8),
        new THREE.MeshBasicMaterial({
          map: assets.shipDecal,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      decal.position.set(0, 0.34, 0.2);
      decal.rotation.x = -Math.PI / 2;
      group.add(decal);
    }
    return group;
  }

  function createStationMesh(THREE, assets = {}) {
    const group = new THREE.Group();
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x738078,
      roughness: 0.65,
      metalness: 0.35,
      emissive: 0x0c2522,
      emissiveIntensity: 0.28,
    });
    const panelMaterial = assets.stationDockPanel
      ? new THREE.MeshStandardMaterial({
          color: 0x8f9a94,
          map: assets.stationDockPanel,
          roughness: 0.72,
          metalness: 0.28,
          emissive: 0x0c2522,
          emissiveMap: assets.stationDockPanel,
          emissiveIntensity: 0.12,
        })
      : ringMaterial;
    const dockMaterial = new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.55 });
    const core = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 5), panelMaterial);
    group.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6, 0.12, 8, 48), dockMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 1.2), ringMaterial);
    mast.position.y = 1.8;
    group.add(mast);
    return group;
  }

  function createAsteroidMesh(THREE, asteroid, assets = {}) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.DodecahedronGeometry(asteroid.radius, 0),
      new THREE.MeshStandardMaterial({
        color: 0x4d554f,
        map: assets.asteroidOreGlow || null,
        roughness: 0.94,
        metalness: 0.06,
        emissive: 0x16342f,
        emissiveMap: assets.asteroidOreGlow || null,
        emissiveIntensity: assets.asteroidOreGlow ? 0.18 : 0.2,
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

  function createPirateMesh(THREE, assets = {}) {
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
    if (assets.pirateMarker) {
      const marker = new THREE.Mesh(
        new THREE.PlaneGeometry(3.8, 3.8),
        new THREE.MeshBasicMaterial({
          map: assets.pirateMarker,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      marker.position.set(0, 0.28, 0);
      marker.rotation.x = -Math.PI / 2;
      group.add(marker);
    }
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

    const sceneAssets = loadSceneAssets(THREE);
    const ship = createShipMesh(THREE, sceneAssets);
    scene.add(ship);

    const station = createStationMesh(THREE, sceneAssets);
    station.position.set(state.station.position.x, state.station.position.y, state.station.position.z);
    scene.add(station);

    const asteroidMeshes = new Map();
    state.asteroids.forEach((asteroid) => {
      const mesh = createAsteroidMesh(THREE, asteroid, sceneAssets);
      mesh.position.set(asteroid.position.x, asteroid.position.y, asteroid.position.z);
      asteroidMeshes.set(asteroid.id, mesh);
      scene.add(mesh);
    });

    const pirate = createPirateMesh(THREE, sceneAssets);
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
        sceneAssets,
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
    ASSET_PATHS,
    createInitialState,
    createAsteroidNodes,
    createAnomalyNodes,
    createSalvageSites,
    createSurveyLadderState,
    applyFlightInput,
    stepSpaceflight,
    mineTarget,
    scanTarget,
    scanSalvageTarget,
    extractSalvageTarget,
    abandonSalvageTarget,
    salvageRisk,
    dockAtStation,
    purchaseUpgrade,
    purchaseStationService,
    deployCountermeasure,
    chooseSector,
    resetRun,
    retarget,
    setTarget,
    sectorById,
    updateCameraState,
    updateHazardState,
    dockingStatus,
    upgradeSummary,
    surveySummary,
    salvageSummary,
    surveyCockpitSurface,
    stationServiceSummary,
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

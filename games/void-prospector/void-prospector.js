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
    accessibility: {
      reducedMotionStorageKey: "void-prospector-reduced-motion",
      motion: {
        full: {
          mode: "full",
          nonessentialMotionScale: 1,
          particleScale: 1,
          pulseScale: 1,
          rotationScale: 1,
          glowScale: 1,
          radarSweep: "animated",
        },
        reduced: {
          mode: "reduced",
          nonessentialMotionScale: 0.18,
          particleScale: 0.35,
          pulseScale: 0,
          rotationScale: 0.15,
          glowScale: 0.58,
          radarSweep: "static",
        },
      },
    },
    assets: ASSET_PATHS,
    controls: {
      thrust: ["KeyW", "ArrowUp"],
      brake: ["KeyS", "ArrowDown"],
      turnLeft: ["KeyA", "ArrowLeft"],
      turnRight: ["KeyD", "ArrowRight"],
      ascend: ["KeyQ", "ShiftLeft", "ShiftRight"],
      descend: ["ControlLeft", "ControlRight"],
      retarget: ["Tab", "KeyE"],
      mine: ["Space", "KeyM"],
      scan: ["KeyC"],
      beacon: ["KeyB"],
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
      verticalAcceleration: 12,
      brakeDrag: 0.34,
      cruiseDrag: 0.988,
      maxSpeed: 18,
      turnRate: 2.2,
      fuelBurnPerSecond: 4,
      verticalFuelBurnPerSecond: 2,
      miningPower: 1,
      startPosition: { x: 18, y: 0, z: 2 },
      startVelocity: { x: 0, y: 0, z: 0 },
      startHeading: 0,
    },
    tutorial: {
      id: "first-spoke-contract",
      title: "First Spoke Contract",
      requiredOre: 3,
      targetId: "node-cinder-01",
      stationId: "station-frontier-spoke",
      alignmentDegrees: 12,
      verticalTolerance: 1.25,
      closeDistanceDelta: 8,
      pirateUnlockDelay: 6,
      phases: [
        { id: "target-alignment", label: "Align to Cinder Node" },
        { id: "vertical-adjustment", label: "Match target height" },
        { id: "thrust", label: "Apply forward thrust" },
        { id: "closing-distance", label: "Close mining distance" },
        { id: "mining", label: "Mine three ore" },
        { id: "station-return", label: "Return to Frontier Spoke" },
        { id: "docking", label: "Dock at Frontier Spoke" },
        { id: "cargo-sale", label: "Sell cargo" },
        { id: "upgrade-preview", label: "Preview Refined Beam" },
      ],
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
        "escort drones",
        "signal jammers",
        "chart processors",
        "storm plating",
        "patrol uplink",
        "gate tuners",
      ],
    },
    contract: {
      id: "charter-ore-spoke",
      title: "Spoke Charter",
      objective: "Mine 3 ore from Cinder Node, dock at Frontier Spoke, and preview the Refined Beam.",
      requiredOre: 3,
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
        {
          id: "escort-drones",
          name: "Escort Drones",
          cost: 110,
          convoyEscortIntegrity: 18,
          convoyPayoutBonus: 0.08,
        },
        {
          id: "signal-jammers",
          name: "Signal Jammers",
          cost: 90,
          convoyAmbushMitigation: 0.24,
          countermeasureCharges: 1,
        },
        {
          id: "chart-processors",
          name: "Chart Processors",
          cost: 105,
          stormScanBonus: 0.75,
          stormWindowBonus: 3,
          stormPayoutBonus: 0.08,
        },
        {
          id: "storm-plating",
          name: "Storm Plating",
          cost: 125,
          stormAnchorIntegrity: 18,
          stormHazardMitigation: 0.32,
          salvageRiskMitigation: 0.12,
        },
        {
          id: "patrol-uplink",
          name: "Patrol Uplink",
          cost: 140,
          countermeasureCharges: 1,
          interdictionScanBonus: 0.85,
          interdictionResponseWindowBonus: 3,
          interdictionRaidMitigation: 0.28,
          interdictionPayoutBonus: 0.1,
          interdictionSupportIntegrity: 14,
          convoyAmbushMitigation: 0.08,
        },
        {
          id: "gate-tuners",
          name: "Gate Tuners",
          cost: 165,
          countermeasureCharges: 1,
          signalScanBonus: 0.9,
          signalPylonIntegrity: 16,
          signalCapacitorBonus: 0.8,
          signalTransitWindowBonus: 3,
          signalJamMitigation: 0.22,
          signalPayoutBonus: 0.12,
        },
      ],
      sectors: [
        {
          id: "spoke-approach",
          name: "Spoke Approach",
          tier: 1,
          condition: "Mapped harbor",
          charterTitle: "Spoke Charter",
          objective: "Mine 3 ore from Cinder Node, dock at Frontier Spoke, and preview the Refined Beam.",
          requiredOre: 3,
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
          convoyRoutes: [],
          interdictionCells: [],
          signalGates: [],
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
          convoyRoutes: [
            {
              id: "convoy-rift-relay",
              name: "Rift Relay Convoy",
              type: "relay convoy",
              family: "courier",
              prerequisiteLabel: "Spoke charter and Rift Lens chart",
              prerequisites: {
                completedSectorIds: ["spoke-approach"],
                scannedAnomalyIds: ["anomaly-rift-lens"],
              },
              beacon: {
                id: "beacon-rift-relay",
                name: "Rift Relay Beacon",
                position: { x: -20, y: 2, z: -36 },
                radius: 4.2,
                integrity: 64,
              },
              startPosition: { x: -20, y: 2, z: -36 },
              endPosition: { x: 38, y: -1, z: -42 },
              cargoValue: 210,
              valueVariance: 28,
              payoutCredits: 260,
              progressRate: 0.28,
              escortIntegrity: 70,
              ambushPressure: 31,
              hazardExposure: 1.15,
              failureIntegrity: 18,
              partialIntegrity: 44,
              partialPayoutRate: 0.55,
              ladderScore: 38,
              beaconDeployRange: 13,
            },
          ],
          stormCharts: [
            {
              id: "storm-rift-breaker",
              name: "Rift Breaker Front",
              type: "charged storm front",
              family: "route-window",
              prerequisiteLabel: "Rift Lens hazard chart",
              prerequisites: {
                completedSectorIds: ["spoke-approach"],
                scannedAnomalyIds: ["anomaly-rift-lens"],
                hazardChartedSectorIds: ["rift-shelf"],
              },
              position: { x: -34, y: 5, z: -32 },
              radius: 6.2,
              scanDifficulty: 3.2,
              intensity: 1.8,
              safeWindow: {
                opensAt: 4,
                closesAt: 18,
              },
              anchor: {
                id: "anchor-rift-breaker",
                name: "Rift Breaker Relay Anchor",
                position: { x: -26, y: 3, z: -40 },
                radius: 4.4,
                integrity: 58,
              },
              convoyRouteIds: ["convoy-rift-relay"],
              salvageSiteIds: ["salvage-rift-hulk", "salvage-rift-volatile"],
              rewardCredits: 150,
              rewardVariance: 18,
              surveyReward: 28,
              ladderScore: 44,
              convoyAmbushReduction: 9,
              convoyHazardReduction: 0.45,
              convoyPayoutBonus: 0.08,
              salvageRiskReduction: 0.16,
              hazardMitigation: 0.35,
              piratePressureClear: 8,
              anchorDeployRange: 12,
              failureIntegrity: 14,
              partialIntegrity: 36,
              partialPayoutRate: 0.55,
              missedHullDamage: 8,
              missedFuelDrain: 10,
              missedHazardExposure: 1.4,
              missedPiratePressure: 12,
            },
          ],
          interdictionCells: [
            {
              id: "cell-rift-decoy-net",
              name: "Rift Decoy Net",
              type: "distress lure",
              family: "raider-cell",
              trigger: "false distress ping on the Rift Relay Convoy lane",
              prerequisiteLabel: "Rift Lens chart and Rift Relay beacon",
              prerequisites: {
                completedSectorIds: ["spoke-approach"],
                scannedAnomalyIds: ["anomaly-rift-lens"],
                convoyBeaconRouteIds: ["convoy-rift-relay"],
              },
              position: { x: -24, y: 4, z: -44 },
              radius: 5.4,
              transponderDifficulty: 2.6,
              responseWindow: {
                opensAt: 3,
                closesAt: 14,
              },
              raidPressure: 28,
              scanRequirement: 1,
              lureRequirement: 1,
              escortRequirement: 32,
              convoyRouteIds: ["convoy-rift-relay"],
              salvageSiteIds: ["salvage-rift-hulk"],
              stormChartIds: ["storm-rift-breaker"],
              payoutCredits: 130,
              rewardVariance: 16,
              ladderScore: 36,
              convoyAmbushReduction: 12,
              convoyEscortIntegrity: 10,
              salvageRiskReduction: 0.18,
              piratePressureClear: 14,
              markerResponseBonus: 2,
              distressEscortIntegrity: 8,
              decoyRaidReduction: 9,
              lurePressureDrop: 12,
              partialPayoutRate: 0.55,
              partialHullDamage: 5,
              failureHullDamage: 12,
              failureFuelDrain: 8,
              failurePressure: 18,
              cargoLoss: 1,
            },
          ],
          signalGates: [
            {
              id: "gate-rift-relay-aperture",
              name: "Rift Relay Signal Gate",
              type: "relay aperture",
              family: "convoy-lane",
              routeAssociation: "convoy-rift-relay",
              prerequisiteLabel: "Spoke charter, Rift Lens chart, and Rift Relay beacon",
              prerequisites: {
                completedSectorIds: ["spoke-approach"],
                scannedAnomalyIds: ["anomaly-rift-lens"],
                convoyBeaconRouteIds: ["convoy-rift-relay"],
              },
              position: { x: -18, y: 5, z: -42 },
              radius: 5.6,
              pylon: {
                id: "pylon-rift-relay",
                name: "Rift Relay Pylon",
                position: { x: -12, y: 4, z: -36 },
                radius: 4.4,
                integrity: 56,
              },
              latticePosition: { x: 8, y: 6, z: -48 },
              harmonicDifficulty: 3,
              capacitorRequirement: 3.5,
              chargeRate: 1.1,
              chargeFuelCost: 1.4,
              transitWindow: {
                opensAt: 5,
                closesAt: 16,
              },
              convoyRouteIds: ["convoy-rift-relay"],
              stormChartIds: ["storm-rift-breaker"],
              salvageSiteIds: ["salvage-rift-hulk"],
              payoutCredits: 190,
              rewardVariance: 20,
              ladderScore: 46,
              transitFuelCost: 8,
              forceFuelCost: 14,
              pirateGateJam: 22,
              jamPressureScale: 0.28,
              convoyTransitPayoutBonus: 0.06,
              convoyAmbushReduction: 10,
              convoyHazardReduction: 0.5,
              salvageRiskReduction: 0.12,
              stormAnchorIntegrity: 8,
              piratePressureClear: 10,
              stormWindowBonus: 3,
              pylonAlignRange: 12,
              partialPayoutRate: 0.55,
              failureHullDamage: 10,
              failureFuelDrain: 12,
              failurePressure: 16,
              cargoLoss: 1,
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
          convoyRoutes: [
            {
              id: "convoy-umbra-blackbox",
              name: "Umbra Blackbox Convoy",
              type: "blackbox convoy",
              family: "manifest",
              prerequisiteLabel: "Rift completion, Black Pylon chart, and Knife Wake blackbox",
              prerequisites: {
                completedSectorIds: ["rift-shelf"],
                scannedAnomalyIds: ["anomaly-black-pylon"],
                salvageManifestIds: ["salvage-umbra-blackbox"],
                hazardChartedSectorIds: ["umbra-trench"],
              },
              beacon: {
                id: "beacon-umbra-blackbox",
                name: "Umbra Blackbox Beacon",
                position: { x: 18, y: 4, z: -50 },
                radius: 4.8,
                integrity: 58,
              },
              startPosition: { x: 18, y: 4, z: -50 },
              endPosition: { x: -34, y: 1, z: -22 },
              cargoValue: 360,
              valueVariance: 42,
              payoutCredits: 430,
              progressRate: 0.22,
              escortIntegrity: 82,
              ambushPressure: 48,
              hazardExposure: 2.4,
              failureIntegrity: 22,
              partialIntegrity: 52,
              partialPayoutRate: 0.5,
              ladderScore: 72,
              beaconDeployRange: 13,
            },
          ],
          stormCharts: [
            {
              id: "storm-umbra-knife-wake",
              name: "Knife Wake Storm Corridor",
              type: "pirate-shadowed storm corridor",
              family: "blackbox-route",
              prerequisiteLabel: "Black Pylon chart and Knife Wake blackbox",
              prerequisites: {
                completedSectorIds: ["rift-shelf"],
                scannedAnomalyIds: ["anomaly-black-pylon"],
                salvageManifestIds: ["salvage-umbra-blackbox"],
                hazardChartedSectorIds: ["umbra-trench"],
              },
              position: { x: 20, y: 6, z: -58 },
              radius: 7,
              scanDifficulty: 3.8,
              intensity: 2.35,
              safeWindow: {
                opensAt: 6,
                closesAt: 20,
              },
              anchor: {
                id: "anchor-umbra-knife-wake",
                name: "Knife Wake Relay Anchor",
                position: { x: 16, y: 4, z: -48 },
                radius: 4.8,
                integrity: 66,
              },
              convoyRouteIds: ["convoy-umbra-blackbox"],
              salvageSiteIds: ["salvage-umbra-vault", "salvage-umbra-blackbox"],
              rewardCredits: 240,
              rewardVariance: 28,
              surveyReward: 44,
              ladderScore: 76,
              convoyAmbushReduction: 13,
              convoyHazardReduction: 0.68,
              convoyPayoutBonus: 0.11,
              salvageRiskReduction: 0.2,
              hazardMitigation: 0.5,
              piratePressureClear: 12,
              anchorDeployRange: 12,
              failureIntegrity: 18,
              partialIntegrity: 44,
              partialPayoutRate: 0.5,
              missedHullDamage: 13,
              missedFuelDrain: 15,
              missedHazardExposure: 2.2,
              missedPiratePressure: 18,
            },
          ],
          interdictionCells: [
            {
              id: "cell-umbra-blackbox-raid",
              name: "Umbra Blackbox Raid",
              type: "blackbox raid",
              family: "salvage-raid",
              trigger: "Knife Wake cell triangulates the recovered blackbox manifest",
              prerequisiteLabel: "Black Pylon chart and Knife Wake blackbox",
              prerequisites: {
                completedSectorIds: ["rift-shelf"],
                scannedAnomalyIds: ["anomaly-black-pylon"],
                salvageManifestIds: ["salvage-umbra-blackbox"],
                hazardChartedSectorIds: ["umbra-trench"],
              },
              position: { x: 26, y: 5, z: -34 },
              radius: 5.8,
              transponderDifficulty: 3.4,
              responseWindow: {
                opensAt: 5,
                closesAt: 18,
              },
              raidPressure: 42,
              scanRequirement: 1,
              lureRequirement: 1,
              escortRequirement: 48,
              convoyRouteIds: ["convoy-umbra-blackbox"],
              salvageSiteIds: ["salvage-umbra-blackbox", "salvage-umbra-vault"],
              stormChartIds: ["storm-umbra-knife-wake"],
              payoutCredits: 220,
              rewardVariance: 24,
              ladderScore: 68,
              convoyAmbushReduction: 16,
              convoyEscortIntegrity: 14,
              salvageRiskReduction: 0.24,
              piratePressureClear: 18,
              markerResponseBonus: 3,
              distressEscortIntegrity: 12,
              decoyRaidReduction: 12,
              lurePressureDrop: 16,
              partialPayoutRate: 0.5,
              partialHullDamage: 8,
              failureHullDamage: 18,
              failureFuelDrain: 12,
              failurePressure: 24,
              cargoLoss: 2,
            },
          ],
          signalGates: [
            {
              id: "gate-umbra-blackbox-lattice",
              name: "Umbra Blackbox Lattice",
              type: "blackbox lattice",
              family: "manifest-gate",
              routeAssociation: "convoy-umbra-blackbox",
              prerequisiteLabel: "Rift completion, Black Pylon chart, Knife Wake blackbox, and Umbra storm window",
              prerequisites: {
                completedSectorIds: ["rift-shelf"],
                scannedAnomalyIds: ["anomaly-black-pylon"],
                salvageManifestIds: ["salvage-umbra-blackbox"],
                hazardChartedSectorIds: ["umbra-trench"],
                stormChartIds: ["storm-umbra-knife-wake"],
              },
              position: { x: 12, y: 7, z: -54 },
              radius: 6.4,
              pylon: {
                id: "pylon-umbra-blackbox",
                name: "Umbra Blackbox Pylon",
                position: { x: 22, y: 5, z: -44 },
                radius: 5,
                integrity: 66,
              },
              latticePosition: { x: -20, y: 6, z: -28 },
              harmonicDifficulty: 3.8,
              capacitorRequirement: 5,
              chargeRate: 0.95,
              chargeFuelCost: 1.7,
              transitWindow: {
                opensAt: 8,
                closesAt: 22,
              },
              convoyRouteIds: ["convoy-umbra-blackbox"],
              stormChartIds: ["storm-umbra-knife-wake"],
              salvageSiteIds: ["salvage-umbra-blackbox", "salvage-umbra-vault"],
              payoutCredits: 310,
              rewardVariance: 34,
              ladderScore: 84,
              transitFuelCost: 12,
              forceFuelCost: 20,
              pirateGateJam: 42,
              jamPressureScale: 0.34,
              convoyTransitPayoutBonus: 0.09,
              convoyAmbushReduction: 15,
              convoyHazardReduction: 0.75,
              salvageRiskReduction: 0.18,
              stormAnchorIntegrity: 12,
              piratePressureClear: 15,
              stormWindowBonus: 4,
              pylonAlignRange: 13,
              partialPayoutRate: 0.5,
              failureHullDamage: 18,
              failureFuelDrain: 16,
              failurePressure: 24,
              cargoLoss: 2,
            },
          ],
          unlocks: ["tempest-verge"],
        },
        {
          id: "tempest-verge",
          name: "Tempest Verge",
          tier: 4,
          condition: "Storm-gated relay verge",
          charterTitle: "Tempest Verge Cartography",
          objective: "Scan the verge eye, mine 14 ore, lock one storm window, break the Knife Wake patrol net, and bank route payouts.",
          requiredOre: 14,
          requiredScans: 1,
          requiredSalvageValue: 0,
          requiredRelics: 0,
          requiredStormCharts: 1,
          requiredStormPayout: 200,
          requiredInterdictions: 1,
          requiredInterdictionPayout: 180,
          requiredSignalTransits: 1,
          requiredSignalPayout: 240,
          rewardCredits: 420,
          surveyReward: 125,
          salvageReward: 55,
          stormReward: 90,
          signalReward: 110,
          oreValueBonus: 17,
          oreReserveBonus: 3,
          hazard: {
            status: "tempest verge",
            intensity: 2.7,
            fuelDrainPerSecond: 0.62,
            hullDamagePerSecond: 1.05,
            warningThreshold: 3.5,
          },
          pirate: {
            spawnTick: 8,
            driftSpeed: 6,
            pressureRate: 1.28,
            hullDamagePerSecond: 3.8,
          },
          anomalies: [
            {
              id: "anomaly-tempest-eye",
              name: "Tempest Eye",
              position: { x: -18, y: 7, z: -62 },
              radius: 6,
              scanDifficulty: 3.6,
              surveyValue: 72,
              chartsHazard: true,
            },
            {
              id: "anomaly-verge-spire",
              name: "Verge Signal Spire",
              position: { x: 38, y: 5, z: -48 },
              radius: 4.8,
              scanDifficulty: 3.1,
              surveyValue: 58,
              chartsHazard: false,
            },
          ],
          salvageSites: [
            {
              id: "salvage-tempest-spool",
              name: "Tempest Relay Spool",
              type: "relay-cache",
              family: "manifest",
              position: { x: 26, y: 2, z: -30 },
              radius: 4.5,
              scanDifficulty: 3,
              confidenceThreshold: 0.7,
              extractionDifficulty: 2.4,
              remainingSalvage: 2,
              rewardValue: 82,
              valueVariance: 18,
              relicReward: 0,
              volatility: 0.52,
              failureThreshold: 1.05,
              piratePressure: 24,
              hazardExposure: 1.6,
              failureHullDamage: 11,
              scanValue: 32,
            },
          ],
          convoyRoutes: [
            {
              id: "convoy-tempest-relay",
              name: "Tempest Relay Convoy",
              type: "storm relay convoy",
              family: "verge-relay",
              prerequisiteLabel: "Umbra completion and Tempest Eye storm window",
              prerequisites: {
                completedSectorIds: ["umbra-trench"],
                scannedAnomalyIds: ["anomaly-tempest-eye"],
                hazardChartedSectorIds: ["tempest-verge"],
                stormChartIds: ["storm-tempest-verge"],
              },
              beacon: {
                id: "beacon-tempest-relay",
                name: "Tempest Relay Beacon",
                position: { x: -6, y: 5, z: -50 },
                radius: 5,
                integrity: 70,
              },
              startPosition: { x: -6, y: 5, z: -50 },
              endPosition: { x: 42, y: 3, z: -22 },
              cargoValue: 470,
              valueVariance: 50,
              payoutCredits: 560,
              progressRate: 0.18,
              escortIntegrity: 92,
              ambushPressure: 56,
              hazardExposure: 3,
              failureIntegrity: 26,
              partialIntegrity: 58,
              partialPayoutRate: 0.46,
              ladderScore: 115,
              beaconDeployRange: 13,
            },
          ],
          stormCharts: [
            {
              id: "storm-tempest-verge",
              name: "Tempest Verge Safe Window",
              type: "deep storm gate",
              family: "late-run-gate",
              prerequisiteLabel: "Umbra completion and Tempest Eye chart",
              prerequisites: {
                completedSectorIds: ["umbra-trench"],
                scannedAnomalyIds: ["anomaly-tempest-eye"],
                hazardChartedSectorIds: ["tempest-verge"],
              },
              position: { x: -12, y: 8, z: -54 },
              radius: 7.5,
              scanDifficulty: 4.2,
              intensity: 2.9,
              safeWindow: {
                opensAt: 8,
                closesAt: 23,
              },
              anchor: {
                id: "anchor-tempest-verge",
                name: "Tempest Verge Relay Anchor",
                position: { x: -8, y: 6, z: -46 },
                radius: 5,
                integrity: 74,
              },
              convoyRouteIds: ["convoy-tempest-relay"],
              salvageSiteIds: ["salvage-tempest-spool"],
              rewardCredits: 330,
              rewardVariance: 36,
              surveyReward: 62,
              ladderScore: 118,
              convoyAmbushReduction: 17,
              convoyHazardReduction: 0.9,
              convoyPayoutBonus: 0.14,
              salvageRiskReduction: 0.24,
              hazardMitigation: 0.65,
              piratePressureClear: 16,
              anchorDeployRange: 13,
              failureIntegrity: 22,
              partialIntegrity: 50,
              partialPayoutRate: 0.48,
              missedHullDamage: 18,
              missedFuelDrain: 20,
              missedHazardExposure: 2.8,
              missedPiratePressure: 24,
            },
          ],
          interdictionCells: [
            {
              id: "cell-tempest-patrol-net",
              name: "Tempest Patrol Net",
              type: "patrol net",
              family: "pirate-den",
              trigger: "Knife Wake patrol net closes around the Tempest relay route",
              prerequisiteLabel: "Umbra completion and Tempest Eye chart",
              prerequisites: {
                completedSectorIds: ["umbra-trench"],
                scannedAnomalyIds: ["anomaly-tempest-eye"],
                hazardChartedSectorIds: ["tempest-verge"],
              },
              position: { x: 4, y: 7, z: -44 },
              radius: 6.4,
              transponderDifficulty: 4,
              responseWindow: {
                opensAt: 7,
                closesAt: 24,
              },
              raidPressure: 54,
              scanRequirement: 1,
              lureRequirement: 1,
              escortRequirement: 62,
              convoyRouteIds: ["convoy-tempest-relay"],
              salvageSiteIds: ["salvage-tempest-spool"],
              stormChartIds: ["storm-tempest-verge"],
              payoutCredits: 310,
              rewardVariance: 32,
              ladderScore: 105,
              convoyAmbushReduction: 20,
              convoyEscortIntegrity: 18,
              salvageRiskReduction: 0.28,
              piratePressureClear: 24,
              markerResponseBonus: 4,
              distressEscortIntegrity: 16,
              decoyRaidReduction: 15,
              lurePressureDrop: 20,
              partialPayoutRate: 0.48,
              partialHullDamage: 10,
              failureHullDamage: 24,
              failureFuelDrain: 16,
              failurePressure: 30,
              cargoLoss: 2,
            },
          ],
          signalGates: [
            {
              id: "gate-tempest-verge-corridor",
              name: "Tempest Verge Gate Corridor",
              type: "charged transit corridor",
              family: "late-run-lattice",
              routeAssociation: "convoy-tempest-relay",
              prerequisiteLabel: "Umbra completion, Verge charts, patrol net break, Umbra lattice, and Tempest storm window",
              prerequisites: {
                completedSectorIds: ["umbra-trench"],
                scannedAnomalyIds: ["anomaly-tempest-eye", "anomaly-verge-spire"],
                hazardChartedSectorIds: ["tempest-verge"],
                stormChartIds: ["storm-tempest-verge"],
                completedInterdictionCellIds: ["cell-tempest-patrol-net"],
                completedSignalGateIds: ["gate-umbra-blackbox-lattice"],
              },
              position: { x: -2, y: 9, z: -52 },
              radius: 7,
              pylon: {
                id: "pylon-tempest-verge",
                name: "Tempest Verge Lattice Pylon",
                position: { x: 8, y: 7, z: -42 },
                radius: 5.4,
                integrity: 78,
              },
              latticePosition: { x: 36, y: 6, z: -30 },
              harmonicDifficulty: 4.4,
              capacitorRequirement: 6,
              chargeRate: 0.85,
              chargeFuelCost: 2,
              transitWindow: {
                opensAt: 10,
                closesAt: 26,
              },
              convoyRouteIds: ["convoy-tempest-relay"],
              stormChartIds: ["storm-tempest-verge"],
              salvageSiteIds: ["salvage-tempest-spool"],
              payoutCredits: 420,
              rewardVariance: 44,
              ladderScore: 132,
              transitFuelCost: 16,
              forceFuelCost: 26,
              pirateGateJam: 58,
              jamPressureScale: 0.38,
              convoyTransitPayoutBonus: 0.12,
              convoyAmbushReduction: 22,
              convoyHazardReduction: 1,
              salvageRiskReduction: 0.24,
              stormAnchorIntegrity: 16,
              piratePressureClear: 24,
              stormWindowBonus: 5,
              pylonAlignRange: 14,
              partialPayoutRate: 0.48,
              failureHullDamage: 26,
              failureFuelDrain: 22,
              failurePressure: 34,
              cargoLoss: 2,
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
    beaconConvoy: {
      version: "0.3.0",
      releaseLabel: "Beacon Convoy",
      beaconDeployRange: 13,
      beaconMaintenanceIntegrity: 22,
      beaconMaintenanceHazardClear: 0.5,
      formationRange: 18,
      baseProgressRate: 0.24,
      countermeasureWindow: 0.78,
      countermeasurePressureDrop: 19,
      countermeasureIntegrity: 12,
    },
    stormCartography: {
      version: "0.4.0",
      releaseLabel: "Storm Cartography",
      scanRange: 18,
      baseScanPower: 1,
      anchorDeployRange: 12,
      anchorMaintenanceIntegrity: 24,
      countermeasureIntegrity: 16,
      countermeasureWindowBonus: 4,
      countermeasureHazardClear: 0.65,
    },
    knifeWakeInterdiction: {
      version: "0.5.0",
      releaseLabel: "Knife Wake Interdiction",
      scanRange: 17,
      baseScanPower: 1,
      markerRange: 16,
      lureRange: 14,
      countermeasureRaidReduction: 12,
      countermeasurePressureDrop: 16,
      failureCargoValueRate: 0.22,
    },
    signalGateExpedition: {
      version: "0.6.0",
      releaseLabel: "Signal Gate Expedition",
      scanRange: 18,
      baseScanPower: 1,
      pylonAlignRange: 12,
      capacitorRange: 13,
      transitRange: 16,
      baseChargeRate: 1,
      chargeFuelCost: 1.5,
      countermeasureJamReduction: 18,
      countermeasurePressureDrop: 20,
      countermeasureCapacitorCharge: 1.25,
    },
    asteroidField: {
      miningRange: 9,
      nodes: [
        {
          id: "node-cinder-01",
          name: "Cinder Node",
          position: { x: -22, y: 5, z: -30 },
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
    ascend: false,
    descend: false,
    mine: false,
    scan: false,
  };
  let currentState = null;
  let sceneHandle = null;
  let lastFrameTime = 0;
  let evidenceHoldUntil = 0;

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

  function normalizeReducedMotionValue(value) {
    if (value === true || value === "true" || value === "reduce" || value === "reduced" || value === "on") {
      return true;
    }
    if (
      value === false ||
      value === "false" ||
      value === "full" ||
      value === "normal" ||
      value === "off" ||
      value === "no-preference"
    ) {
      return false;
    }
    return null;
  }

  function explicitReducedMotionOption(options = {}) {
    if (Object.prototype.hasOwnProperty.call(options, "reducedMotion")) {
      return normalizeReducedMotionValue(options.reducedMotion);
    }
    if (Object.prototype.hasOwnProperty.call(options, "motionMode")) {
      return normalizeReducedMotionValue(options.motionMode);
    }
    if (options.accessibility && Object.prototype.hasOwnProperty.call(options.accessibility, "reducedMotion")) {
      return normalizeReducedMotionValue(options.accessibility.reducedMotion);
    }
    if (options.accessibility && Object.prototype.hasOwnProperty.call(options.accessibility, "motionMode")) {
      return normalizeReducedMotionValue(options.accessibility.motionMode);
    }
    return null;
  }

  function resolveReducedMotionPreference(options = {}, environment = {}) {
    const explicit = explicitReducedMotionOption(options);
    if (explicit !== null) {
      return {
        reducedMotion: explicit,
        motionMode: explicit ? "reduced" : "full",
        motionSource: "override",
      };
    }

    const stored = normalizeReducedMotionValue(environment.storedPreference);
    if (stored !== null) {
      return {
        reducedMotion: stored,
        motionMode: stored ? "reduced" : "full",
        motionSource: "local",
      };
    }

    if (environment.prefersReducedMotion === true) {
      return {
        reducedMotion: true,
        motionMode: "reduced",
        motionSource: "system",
      };
    }

    return {
      reducedMotion: false,
      motionMode: "full",
      motionSource: "default",
    };
  }

  function readStoredReducedMotionPreference() {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      if (!window.localStorage) {
        return null;
      }
      return window.localStorage.getItem(GAME_DATA.accessibility.reducedMotionStorageKey);
    } catch (error) {
      return null;
    }
  }

  function writeStoredReducedMotionPreference(reducedMotion) {
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (!window.localStorage) {
        return;
      }
      window.localStorage.setItem(GAME_DATA.accessibility.reducedMotionStorageKey, reducedMotion ? "reduced" : "full");
    } catch (error) {
      // Local storage can be disabled; the live state still updates for this session.
    }
  }

  function browserMotionEnvironment() {
    if (typeof window === "undefined") {
      return {};
    }
    return {
      storedPreference: readStoredReducedMotionPreference(),
      prefersReducedMotion: Boolean(
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ),
    };
  }

  function createAccessibilityState(options = {}) {
    const preference = resolveReducedMotionPreference(options, options.motionEnvironment || browserMotionEnvironment());
    return {
      reducedMotion: preference.reducedMotion,
      motionMode: preference.motionMode,
      motionSource: preference.motionSource,
    };
  }

  function motionSettingsForState(state) {
    const reduced = Boolean(state.accessibility && state.accessibility.reducedMotion);
    return GAME_DATA.accessibility.motion[reduced ? "reduced" : "full"];
  }

  function motionSurfaceForState(state) {
    const settings = motionSettingsForState(state);
    return {
      reduced: settings.mode === "reduced",
      mode: settings.mode,
      source: state.accessibility ? state.accessibility.motionSource : "default",
      nonessentialMotionScale: settings.nonessentialMotionScale,
      particleScale: settings.particleScale,
      radarSweep: settings.radarSweep,
      cssHook: `motion-${settings.mode}`,
    };
  }

  function setReducedMotion(state, reducedMotion, source = "user") {
    const next = clone(state);
    const active = normalizeReducedMotionValue(reducedMotion);
    next.accessibility = {
      ...(next.accessibility || {}),
      reducedMotion: active === null ? false : active,
      motionMode: active ? "reduced" : "full",
      motionSource: source,
    };
    return syncDerivedState(next);
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

  function forwardVector3(heading, pitch = 0) {
    const horizontal = Math.cos(pitch);
    return normalize(vector(Math.sin(heading) * horizontal, Math.sin(pitch), -Math.cos(heading) * horizontal));
  }

  function createShipOrientation(heading = 0) {
    const yaw = normalizeAngle(heading);
    return {
      yaw,
      pitch: 0,
      roll: 0,
      bank: 0,
      forward: forwardVector3(yaw, 0),
    };
  }

  function createEngineState() {
    return {
      thrusting: false,
      braking: false,
      verticalAxis: 0,
      thrustLevel: 0,
      brakeLevel: 0,
      speed: 0,
      driftAngle: 0,
    };
  }

  function syncShipFlightState(ship, input = {}) {
    const speed = length(ship.velocity || vector());
    const verticalAxis = (input.ascend ? 1 : 0) - (input.descend ? 1 : 0);
    const turnAxis = (input.turnRight ? 1 : 0) - (input.turnLeft ? 1 : 0);
    const pitch = clamp((ship.velocity.y / Math.max(1, ship.maxSpeed || GAME_DATA.ship.maxSpeed)) * 0.7 + verticalAxis * 0.2, -0.55, 0.55);
    const bank = clamp(turnAxis * 0.42 + ((ship.orientation && ship.orientation.bank) || 0) * 0.35, -0.65, 0.65);
    const yaw = normalizeAngle(ship.heading || 0);
    const velocityBearing = speed > 0.2 ? Math.atan2(ship.velocity.x, -ship.velocity.z) : yaw;
    ship.orientation = {
      yaw,
      pitch: round(pitch, 3),
      roll: round(-bank, 3),
      bank: round(bank, 3),
      forward: forwardVector3(yaw, pitch),
    };
    ship.engineState = {
      thrusting: Boolean(input.thrust),
      braking: Boolean(input.brake),
      verticalAxis,
      thrustLevel: input.thrust ? 1 : 0,
      brakeLevel: input.brake ? 1 : 0,
      speed: round(speed, 2),
      driftAngle: round(normalizeAngle(velocityBearing - yaw), 3),
    };
    return ship;
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
      scannedAnomalyIds: uniqueList(base.scannedAnomalyIds || []),
      salvageScore: base.salvageScore || 0,
      salvageManifestIds: uniqueList(base.salvageManifestIds || []),
      relicsRecovered: base.relicsRecovered || 0,
      convoyScore: base.convoyScore || 0,
      completedConvoyRouteIds: uniqueList(base.completedConvoyRouteIds || []),
      stormScore: base.stormScore || 0,
      completedStormChartIds: uniqueList(base.completedStormChartIds || []),
      failedStormChartIds: uniqueList(base.failedStormChartIds || []),
      partialStormChartIds: uniqueList(base.partialStormChartIds || []),
      anchoredStormChartIds: uniqueList(base.anchoredStormChartIds || []),
      interdictionScore: base.interdictionScore || 0,
      completedInterdictionCellIds: uniqueList(base.completedInterdictionCellIds || []),
      failedInterdictionCellIds: uniqueList(base.failedInterdictionCellIds || []),
      partialInterdictionCellIds: uniqueList(base.partialInterdictionCellIds || []),
      scannedInterdictionCellIds: uniqueList(base.scannedInterdictionCellIds || []),
      luredInterdictionCellIds: uniqueList(base.luredInterdictionCellIds || []),
      signalScore: base.signalScore || 0,
      completedSignalGateIds: uniqueList(base.completedSignalGateIds || []),
      failedSignalGateIds: uniqueList(base.failedSignalGateIds || []),
      partialSignalGateIds: uniqueList(base.partialSignalGateIds || []),
      scannedSignalGateIds: uniqueList(base.scannedSignalGateIds || []),
      alignedSignalGateIds: uniqueList(base.alignedSignalGateIds || []),
      chargedSignalGateIds: uniqueList(base.chargedSignalGateIds || []),
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
      convoyEscortIntegrity: base.convoyEscortIntegrity || 0,
      convoyAmbushMitigation: base.convoyAmbushMitigation || 0,
      convoyPayoutBonus: base.convoyPayoutBonus || 0,
      stormScanBonus: base.stormScanBonus || 0,
      stormAnchorIntegrity: base.stormAnchorIntegrity || 0,
      stormWindowBonus: base.stormWindowBonus || 0,
      stormHazardMitigation: base.stormHazardMitigation || 0,
      stormPayoutBonus: base.stormPayoutBonus || 0,
      interdictionScanBonus: base.interdictionScanBonus || 0,
      interdictionResponseWindowBonus: base.interdictionResponseWindowBonus || 0,
      interdictionRaidMitigation: base.interdictionRaidMitigation || 0,
      interdictionPayoutBonus: base.interdictionPayoutBonus || 0,
      interdictionSupportIntegrity: base.interdictionSupportIntegrity || 0,
      signalScanBonus: base.signalScanBonus || 0,
      signalPylonIntegrity: base.signalPylonIntegrity || 0,
      signalCapacitorBonus: base.signalCapacitorBonus || 0,
      signalTransitWindowBonus: base.signalTransitWindowBonus || 0,
      signalJamMitigation: base.signalJamMitigation || 0,
      signalPayoutBonus: base.signalPayoutBonus || 0,
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
      state.countermeasureCharges += service.countermeasureCharges || 0;
      state.salvagePowerBonus = Math.max(state.salvagePowerBonus, service.salvagePowerBonus || 0);
      state.salvageConfidenceBonus = Math.max(state.salvageConfidenceBonus, service.salvageConfidenceBonus || 0);
      state.salvageRiskMitigation = Math.max(state.salvageRiskMitigation, service.salvageRiskMitigation || 0);
      state.convoyEscortIntegrity += service.convoyEscortIntegrity || 0;
      state.convoyAmbushMitigation += service.convoyAmbushMitigation || 0;
      state.convoyPayoutBonus += service.convoyPayoutBonus || 0;
      state.stormScanBonus += service.stormScanBonus || 0;
      state.stormAnchorIntegrity += service.stormAnchorIntegrity || 0;
      state.stormWindowBonus += service.stormWindowBonus || 0;
      state.stormHazardMitigation += service.stormHazardMitigation || 0;
      state.stormPayoutBonus += service.stormPayoutBonus || 0;
      state.interdictionScanBonus += service.interdictionScanBonus || 0;
      state.interdictionResponseWindowBonus += service.interdictionResponseWindowBonus || 0;
      state.interdictionRaidMitigation += service.interdictionRaidMitigation || 0;
      state.interdictionPayoutBonus += service.interdictionPayoutBonus || 0;
      state.interdictionSupportIntegrity += service.interdictionSupportIntegrity || 0;
      state.signalScanBonus += service.signalScanBonus || 0;
      state.signalPylonIntegrity += service.signalPylonIntegrity || 0;
      state.signalCapacitorBonus += service.signalCapacitorBonus || 0;
      state.signalTransitWindowBonus += service.signalTransitWindowBonus || 0;
      state.signalJamMitigation += service.signalJamMitigation || 0;
      state.signalPayoutBonus += service.signalPayoutBonus || 0;
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

  function createConvoyRoutes(
    seed = DEFAULT_SEED,
    sectorInput = GAME_DATA.surveyLadder.defaultSectorId,
    stationServices = createStationServiceState(),
    options = {}
  ) {
    const sector = typeof sectorInput === "string" ? sectorById(sectorInput) : sectorInput;
    const base = options.convoy || {};
    const routeMemory = base.routeMemory || {};
    const random = createRng(seed + sector.tier * 16007 + 9209);
    return (sector.convoyRoutes || []).map((route, index) => {
      const remembered = routeMemory[route.id] || {};
      const rememberedBeacon = remembered.beaconState || {};
      const rememberedConvoy = remembered.convoyState || {};
      const cargoValue = (route.cargoValue || 0) + (route.valueVariance ? Math.floor(random() * route.valueVariance) : 0);
      const escortIntegrity = Math.max(
        rememberedConvoy.maxEscortIntegrity || 0,
        (route.escortIntegrity || 0) + (stationServices.convoyEscortIntegrity || 0)
      );
      return {
        ...clone(route),
        cargoValue,
        scanSignature: `convoy-${sector.id}-${seed}-${index + 1}`,
        position: clone(route.beacon.position),
        radius: route.beacon.radius || 4,
        beaconState: {
          deployed: false,
          status: "undeployed",
          integrity: 0,
          maxIntegrity: route.beacon.integrity || 60,
          lastTouchedTick: null,
          ...clone(rememberedBeacon),
        },
        convoyState: {
          status: "locked",
          progress: 0,
          position: clone(route.startPosition || route.beacon.position),
          escortIntegrity,
          maxEscortIntegrity: escortIntegrity,
          cargoValue,
          payoutCredits: route.payoutCredits || cargoValue,
          deliveredValue: 0,
          ambushPressure: route.ambushPressure || 0,
          hazardExposure: route.hazardExposure || 0,
          failureReason: null,
          startedAt: null,
          completedAt: null,
          countermeasureUsed: false,
          formationStatus: "idle",
          lastDamage: 0,
          ...clone(rememberedConvoy),
        },
        prerequisiteStatus: {
          ready: false,
          missing: [],
          label: route.prerequisiteLabel || "route prerequisites",
        },
      };
    });
  }

  function createConvoyState(options = {}, stationServices = createStationServiceState(), convoyRoutes = []) {
    const base = options.convoy || {};
    return {
      version: GAME_DATA.beaconConvoy.version,
      releaseLabel: GAME_DATA.beaconConvoy.releaseLabel,
      activeRouteId: base.activeRouteId || null,
      completedRouteIds: uniqueList(base.completedRouteIds || []),
      failedRouteIds: uniqueList(base.failedRouteIds || []),
      partialRouteIds: uniqueList(base.partialRouteIds || []),
      beaconsDeployed: base.beaconsDeployed || 0,
      payoutBanked: base.payoutBanked || 0,
      convoyScore: base.convoyScore || 0,
      escortLosses: base.escortLosses || 0,
      supportIntegrity: stationServices.convoyEscortIntegrity || 0,
      supportMitigation: stationServices.convoyAmbushMitigation || 0,
      payoutBonus: stationServices.convoyPayoutBonus || 0,
      status: base.status || (convoyRoutes.length ? "routes charted" : "no convoy routes"),
      lastOutcome: base.lastOutcome || "none",
      routeMemory: base.routeMemory || {},
    };
  }

  function createStormCharts(
    seed = DEFAULT_SEED,
    sectorInput = GAME_DATA.surveyLadder.defaultSectorId,
    stationServices = createStationServiceState(),
    options = {}
  ) {
    const sector = typeof sectorInput === "string" ? sectorById(sectorInput) : sectorInput;
    const base = options.storm || {};
    const chartMemory = base.chartMemory || {};
    const random = createRng(seed + sector.tier * 19013 + 13007);
    return (sector.stormCharts || []).map((chart, index) => {
      const remembered = chartMemory[chart.id] || {};
      const rememberedStorm = remembered.stormState || {};
      const rewardCredits = (chart.rewardCredits || 0) + (chart.rewardVariance ? Math.floor(random() * chart.rewardVariance) : 0);
      const maxAnchorIntegrity = Math.max(
        rememberedStorm.maxAnchorIntegrity || 0,
        (chart.anchor && chart.anchor.integrity ? chart.anchor.integrity : 60) + (stationServices.stormAnchorIntegrity || 0)
      );
      const safeWindow = {
        opensAt: chart.safeWindow ? chart.safeWindow.opensAt || 0 : 0,
        closesAt: (chart.safeWindow ? chart.safeWindow.closesAt || 0 : 0) + (stationServices.stormWindowBonus || 0),
        locked: false,
        lockedAt: null,
        missed: false,
        ...clone(rememberedStorm.safeWindow || {}),
      };
      return {
        ...clone(chart),
        rewardCredits,
        scanSignature: `storm-${sector.id}-${seed}-${index + 1}`,
        position: clone(chart.position || (chart.anchor ? chart.anchor.position : GAME_DATA.ship.startPosition)),
        radius: chart.radius || 5,
        prerequisiteStatus: {
          ready: false,
          missing: [],
          label: chart.prerequisiteLabel || "storm prerequisites",
        },
        stormState: {
          status: "locked",
          progress: 0,
          charted: false,
          anchorDeployed: false,
          anchorIntegrity: 0,
          maxAnchorIntegrity,
          safeWindow,
          payoutCredits: rewardCredits,
          deliveredValue: 0,
          partialPayoutCredits: 0,
          failureReason: null,
          outcome: "none",
          countermeasureUsed: false,
          salvageReroutes: [],
          lastTouchedTick: null,
          ...clone(rememberedStorm),
          maxAnchorIntegrity,
          safeWindow,
        },
      };
    });
  }

  function createStormCartographyState(options = {}, stationServices = createStationServiceState(), stormCharts = []) {
    const base = options.storm || {};
    return {
      version: GAME_DATA.stormCartography.version,
      releaseLabel: GAME_DATA.stormCartography.releaseLabel,
      activeChartId: base.activeChartId || null,
      completedChartIds: uniqueList(base.completedChartIds || []),
      failedChartIds: uniqueList(base.failedChartIds || []),
      partialChartIds: uniqueList(base.partialChartIds || []),
      anchoredChartIds: uniqueList(base.anchoredChartIds || []),
      payoutBanked: base.payoutBanked || 0,
      stormScore: base.stormScore || 0,
      anchorsDeployed: base.anchorsDeployed || 0,
      windowsLocked: base.windowsLocked || 0,
      salvageReroutes: base.salvageReroutes || 0,
      scanPower: GAME_DATA.stormCartography.baseScanPower + (stationServices.stormScanBonus || 0),
      scanRange: GAME_DATA.stormCartography.scanRange,
      supportIntegrity: stationServices.stormAnchorIntegrity || 0,
      supportMitigation: stationServices.stormHazardMitigation || 0,
      windowBonus: stationServices.stormWindowBonus || 0,
      payoutBonus: stationServices.stormPayoutBonus || 0,
      status: base.status || (stormCharts.length ? "storm charts available" : "no storm charts"),
      lastOutcome: base.lastOutcome || "none",
      chartMemory: base.chartMemory || {},
    };
  }

  function createInterdictionCells(
    seed = DEFAULT_SEED,
    sectorInput = GAME_DATA.surveyLadder.defaultSectorId,
    stationServices = createStationServiceState(),
    options = {}
  ) {
    const sector = typeof sectorInput === "string" ? sectorById(sectorInput) : sectorInput;
    const base = options.interdiction || {};
    const cellMemory = base.cellMemory || {};
    const random = createRng(seed + sector.tier * 22031 + 17011);
    return (sector.interdictionCells || []).map((cell, index) => {
      const remembered = cellMemory[cell.id] || {};
      const rememberedInterdiction = remembered.interdictionState || {};
      const payoutCredits = (cell.payoutCredits || 0) + (cell.rewardVariance ? Math.floor(random() * cell.rewardVariance) : 0);
      const responseWindow = {
        opensAt: cell.responseWindow ? cell.responseWindow.opensAt || 0 : 0,
        closesAt:
          (cell.responseWindow ? cell.responseWindow.closesAt || 0 : 0) +
          (stationServices.interdictionResponseWindowBonus || 0),
        locked: false,
        markedAt: null,
        missed: false,
        ...clone(rememberedInterdiction.responseWindow || {}),
      };
      return {
        ...clone(cell),
        payoutCredits,
        scanSignature: `interdiction-${sector.id}-${seed}-${index + 1}`,
        position: clone(cell.position || GAME_DATA.pirate.patrolPoint),
        radius: cell.radius || 5,
        prerequisiteStatus: {
          ready: false,
          missing: [],
          label: cell.prerequisiteLabel || "interdiction prerequisites",
        },
        interdictionState: {
          status: "locked",
          progress: 0,
          transponderScanned: false,
          markerPlaced: false,
          markerType: null,
          lureDeployed: false,
          escortIntegrity: 0,
          raidPressure: cell.raidPressure || 0,
          responseWindow,
          payoutCredits,
          deliveredValue: 0,
          partialPayoutCredits: 0,
          protectedSalvageIds: [],
          failureReason: null,
          outcome: "none",
          countermeasureUsed: false,
          lastTouchedTick: null,
          ...clone(rememberedInterdiction),
          responseWindow,
          payoutCredits,
        },
      };
    });
  }

  function createInterdictionState(options = {}, stationServices = createStationServiceState(), interdictionCells = []) {
    const base = options.interdiction || {};
    return {
      version: GAME_DATA.knifeWakeInterdiction.version,
      releaseLabel: GAME_DATA.knifeWakeInterdiction.releaseLabel,
      activeCellId: base.activeCellId || null,
      completedCellIds: uniqueList(base.completedCellIds || []),
      failedCellIds: uniqueList(base.failedCellIds || []),
      partialCellIds: uniqueList(base.partialCellIds || []),
      scannedCellIds: uniqueList(base.scannedCellIds || []),
      luredCellIds: uniqueList(base.luredCellIds || []),
      markerCellIds: uniqueList(base.markerCellIds || []),
      payoutBanked: base.payoutBanked || 0,
      interdictionScore: base.interdictionScore || 0,
      raidsResolved: base.raidsResolved || 0,
      scansCompleted: base.scansCompleted || 0,
      markersPlaced: base.markersPlaced || 0,
      luresDeployed: base.luresDeployed || 0,
      protectedSalvage: base.protectedSalvage || 0,
      scanPower: GAME_DATA.knifeWakeInterdiction.baseScanPower + (stationServices.interdictionScanBonus || 0),
      scanRange: GAME_DATA.knifeWakeInterdiction.scanRange,
      markerRange: GAME_DATA.knifeWakeInterdiction.markerRange,
      lureRange: GAME_DATA.knifeWakeInterdiction.lureRange,
      supportMitigation: stationServices.interdictionRaidMitigation || 0,
      supportIntegrity: stationServices.interdictionSupportIntegrity || 0,
      responseWindowBonus: stationServices.interdictionResponseWindowBonus || 0,
      payoutBonus: stationServices.interdictionPayoutBonus || 0,
      status: base.status || (interdictionCells.length ? "pirate cells charted" : "no pirate cells"),
      lastOutcome: base.lastOutcome || "none",
      cellMemory: base.cellMemory || {},
    };
  }

  function createSignalGates(
    seed = DEFAULT_SEED,
    sectorInput = GAME_DATA.surveyLadder.defaultSectorId,
    stationServices = createStationServiceState(),
    options = {}
  ) {
    const sector = typeof sectorInput === "string" ? sectorById(sectorInput) : sectorInput;
    const base = options.signalGate || {};
    const gateMemory = base.gateMemory || {};
    const random = createRng(seed + sector.tier * 25013 + 21019);
    return (sector.signalGates || []).map((gate, index) => {
      const remembered = gateMemory[gate.id] || {};
      const rememberedGate = remembered.gateState || {};
      const payoutCredits = (gate.payoutCredits || 0) + (gate.rewardVariance ? Math.floor(random() * gate.rewardVariance) : 0);
      const maxPylonIntegrity = Math.max(
        rememberedGate.maxPylonIntegrity || 0,
        (gate.pylon && gate.pylon.integrity ? gate.pylon.integrity : 60) + (stationServices.signalPylonIntegrity || 0)
      );
      const transitWindow = {
        opensAt: gate.transitWindow ? gate.transitWindow.opensAt || 0 : 0,
        closesAt:
          (gate.transitWindow ? gate.transitWindow.closesAt || 0 : 0) +
          (stationServices.signalTransitWindowBonus || 0),
        committed: false,
        committedAt: null,
        forced: false,
        missed: false,
        anchoredChartId: null,
        abortedAt: null,
        ...clone(rememberedGate.transitWindow || {}),
      };
      return {
        ...clone(gate),
        sectorId: gate.sectorId || sector.id,
        payoutCredits,
        scanSignature: `signal-gate-${sector.id}-${seed}-${index + 1}`,
        position: clone(gate.position || GAME_DATA.ship.startPosition),
        radius: gate.radius || 5,
        prerequisiteStatus: {
          ready: false,
          missing: [],
          label: gate.prerequisiteLabel || "signal gate prerequisites",
        },
        gateState: {
          status: "locked",
          progress: 0,
          harmonicsScanned: false,
          pylonAligned: false,
          pylonIntegrity: 0,
          maxPylonIntegrity,
          capacitorCharge: 0,
          capacitorRequirement: gate.capacitorRequirement || 1,
          transitWindow,
          payoutCredits,
          deliveredValue: 0,
          partialPayoutCredits: 0,
          failureReason: null,
          outcome: "none",
          convoyTransitCommitted: false,
          countermeasureUsed: false,
          stormWindowAnchoredChartId: null,
          pirateJam: gate.pirateGateJam || 0,
          lastTouchedTick: null,
          ...clone(rememberedGate),
          maxPylonIntegrity,
          transitWindow,
          payoutCredits,
        },
      };
    });
  }

  function createSignalGateState(options = {}, stationServices = createStationServiceState(), signalGates = []) {
    const base = options.signalGate || {};
    return {
      version: GAME_DATA.signalGateExpedition.version,
      releaseLabel: GAME_DATA.signalGateExpedition.releaseLabel,
      activeGateId: base.activeGateId || null,
      completedGateIds: uniqueList(base.completedGateIds || []),
      failedGateIds: uniqueList(base.failedGateIds || []),
      partialGateIds: uniqueList(base.partialGateIds || []),
      scannedGateIds: uniqueList(base.scannedGateIds || []),
      alignedGateIds: uniqueList(base.alignedGateIds || []),
      chargedGateIds: uniqueList(base.chargedGateIds || []),
      transitGateIds: uniqueList(base.transitGateIds || []),
      payoutBanked: base.payoutBanked || 0,
      signalScore: base.signalScore || 0,
      scansCompleted: base.scansCompleted || 0,
      pylonsAligned: base.pylonsAligned || 0,
      capacitorsCharged: base.capacitorsCharged || 0,
      transitsResolved: base.transitsResolved || 0,
      convoyTransits: base.convoyTransits || 0,
      abortedTransits: base.abortedTransits || 0,
      pirateJamsMitigated: base.pirateJamsMitigated || 0,
      scanPower: GAME_DATA.signalGateExpedition.baseScanPower + (stationServices.signalScanBonus || 0),
      scanRange: GAME_DATA.signalGateExpedition.scanRange,
      pylonAlignRange: GAME_DATA.signalGateExpedition.pylonAlignRange,
      capacitorRange: GAME_DATA.signalGateExpedition.capacitorRange,
      transitRange: GAME_DATA.signalGateExpedition.transitRange,
      pylonSupportIntegrity: stationServices.signalPylonIntegrity || 0,
      capacitorBonus: stationServices.signalCapacitorBonus || 0,
      transitWindowBonus: stationServices.signalTransitWindowBonus || 0,
      jamMitigation: stationServices.signalJamMitigation || 0,
      payoutBonus: stationServices.signalPayoutBonus || 0,
      status: base.status || (signalGates.length ? "signal gates charted" : "no signal gates"),
      lastOutcome: base.lastOutcome || "none",
      gateMemory: base.gateMemory || {},
    };
  }

  function interdictionCellMemoryFromCells(cells = []) {
    return cells.reduce((memory, cell) => {
      memory[cell.id] = {
        interdictionState: clone(cell.interdictionState),
      };
      return memory;
    }, {});
  }

  function interdictionPersistence(state) {
    return {
      activeCellId: state.interdiction.activeCellId,
      completedCellIds: state.interdiction.completedCellIds,
      failedCellIds: state.interdiction.failedCellIds,
      partialCellIds: state.interdiction.partialCellIds,
      scannedCellIds: state.interdiction.scannedCellIds,
      luredCellIds: state.interdiction.luredCellIds,
      markerCellIds: state.interdiction.markerCellIds,
      payoutBanked: state.interdiction.payoutBanked,
      interdictionScore: state.interdiction.interdictionScore,
      raidsResolved: state.interdiction.raidsResolved,
      scansCompleted: state.interdiction.scansCompleted,
      markersPlaced: state.interdiction.markersPlaced,
      luresDeployed: state.interdiction.luresDeployed,
      protectedSalvage: state.interdiction.protectedSalvage,
      status: state.interdiction.status,
      lastOutcome: state.interdiction.lastOutcome,
      cellMemory: {
        ...(state.interdiction.cellMemory || {}),
        ...interdictionCellMemoryFromCells(state.interdictionCells || []),
      },
    };
  }

  function signalGateMemoryFromGates(gates = []) {
    return gates.reduce((memory, gate) => {
      memory[gate.id] = {
        gateState: clone(gate.gateState),
      };
      return memory;
    }, {});
  }

  function signalGatePersistence(state) {
    return {
      activeGateId: state.signalGate.activeGateId,
      completedGateIds: state.signalGate.completedGateIds,
      failedGateIds: state.signalGate.failedGateIds,
      partialGateIds: state.signalGate.partialGateIds,
      scannedGateIds: state.signalGate.scannedGateIds,
      alignedGateIds: state.signalGate.alignedGateIds,
      chargedGateIds: state.signalGate.chargedGateIds,
      transitGateIds: state.signalGate.transitGateIds,
      payoutBanked: state.signalGate.payoutBanked,
      signalScore: state.signalGate.signalScore,
      scansCompleted: state.signalGate.scansCompleted,
      pylonsAligned: state.signalGate.pylonsAligned,
      capacitorsCharged: state.signalGate.capacitorsCharged,
      transitsResolved: state.signalGate.transitsResolved,
      convoyTransits: state.signalGate.convoyTransits,
      abortedTransits: state.signalGate.abortedTransits,
      pirateJamsMitigated: state.signalGate.pirateJamsMitigated,
      status: state.signalGate.status,
      lastOutcome: state.signalGate.lastOutcome,
      gateMemory: {
        ...(state.signalGate.gateMemory || {}),
        ...signalGateMemoryFromGates(state.signalGates || []),
      },
    };
  }

  function stormChartMemoryFromCharts(charts = []) {
    return charts.reduce((memory, chart) => {
      memory[chart.id] = {
        stormState: clone(chart.stormState),
      };
      return memory;
    }, {});
  }

  function stormPersistence(state) {
    return {
      activeChartId: state.storm.activeChartId,
      completedChartIds: state.storm.completedChartIds,
      failedChartIds: state.storm.failedChartIds,
      partialChartIds: state.storm.partialChartIds,
      anchoredChartIds: state.storm.anchoredChartIds,
      payoutBanked: state.storm.payoutBanked,
      stormScore: state.storm.stormScore,
      anchorsDeployed: state.storm.anchorsDeployed,
      windowsLocked: state.storm.windowsLocked,
      salvageReroutes: state.storm.salvageReroutes,
      status: state.storm.status,
      lastOutcome: state.storm.lastOutcome,
      chartMemory: {
        ...(state.storm.chartMemory || {}),
        ...stormChartMemoryFromCharts(state.stormCharts || []),
      },
    };
  }

  function stormChartById(state, chartId) {
    return (state.stormCharts || []).find((chart) => chart.id === chartId) || null;
  }

  function interdictionCellById(state, cellId) {
    return (state.interdictionCells || []).find((cell) => cell.id === cellId) || null;
  }

  function signalGateById(state, gateId) {
    return (state.signalGates || []).find((gate) => gate.id === gateId) || null;
  }

  function convoyRouteMemoryFromRoutes(routes = []) {
    return routes.reduce((memory, route) => {
      memory[route.id] = {
        beaconState: clone(route.beaconState),
        convoyState: clone(route.convoyState),
      };
      return memory;
    }, {});
  }

  function convoyPersistence(state) {
    return {
      activeRouteId: state.convoy.activeRouteId,
      completedRouteIds: state.convoy.completedRouteIds,
      failedRouteIds: state.convoy.failedRouteIds,
      partialRouteIds: state.convoy.partialRouteIds,
      beaconsDeployed: state.convoy.beaconsDeployed,
      payoutBanked: state.convoy.payoutBanked,
      convoyScore: state.convoy.convoyScore,
      escortLosses: state.convoy.escortLosses,
      status: state.convoy.status,
      lastOutcome: state.convoy.lastOutcome,
      routeMemory: {
        ...(state.convoy.routeMemory || {}),
        ...convoyRouteMemoryFromRoutes(state.convoyRoutes || []),
      },
    };
  }

  function convoyRouteById(state, routeId) {
    return (state.convoyRoutes || []).find((route) => route.id === routeId) || null;
  }

  function convoyRoutePosition(route) {
    const progress = route.convoyState ? route.convoyState.progress || 0 : 0;
    const start = route.startPosition || route.beacon.position;
    const end = route.endPosition || route.beacon.position;
    return vector(
      start.x + (end.x - start.x) * progress,
      start.y + (end.y - start.y) * progress,
      start.z + (end.z - start.z) * progress
    );
  }

  function currentScannedAnomalyIds(state) {
    return uniqueList([
      ...(state.ladder.scannedAnomalyIds || []),
      ...(state.anomalies || [])
        .filter((anomaly) => anomaly.scanState && anomaly.scanState.scanned)
        .map((anomaly) => anomaly.id),
    ]);
  }

  function currentSalvageManifestIds(state) {
    return uniqueList([
      ...(state.ladder.salvageManifestIds || []),
      ...(state.salvageSites || [])
        .filter((site) => site.family === "manifest" && site.salvageState && site.salvageState.recoveredValue > 0)
        .map((site) => site.id),
    ]);
  }

  function stormChartPrerequisiteStatus(chart, state) {
    const requirements = chart.prerequisites || {};
    const missing = [];
    const scannedAnomalyIds = currentScannedAnomalyIds(state);
    const salvageManifestIds = currentSalvageManifestIds(state);
    (requirements.completedSectorIds || []).forEach((sectorId) => {
      if (!(state.ladder.completedSectorIds || []).includes(sectorId)) {
        missing.push(`complete ${sectorById(sectorId).name}`);
      }
    });
    (requirements.scannedAnomalyIds || []).forEach((anomalyId) => {
      if (!scannedAnomalyIds.includes(anomalyId)) {
        missing.push(`scan ${anomalyId}`);
      }
    });
    (requirements.salvageManifestIds || []).forEach((siteId) => {
      if (!salvageManifestIds.includes(siteId)) {
        missing.push(`recover ${siteId}`);
      }
    });
    (requirements.hazardChartedSectorIds || []).forEach((sectorId) => {
      if (!(state.ladder.hazardCharts || {})[sectorId]) {
        missing.push(`chart ${sectorById(sectorId).name}`);
      }
    });
    (requirements.stormChartIds || []).forEach((chartId) => {
      const requiredChart = stormChartById(state, chartId);
      const lockedWindow = Boolean(
        requiredChart &&
          requiredChart.stormState &&
          requiredChart.stormState.safeWindow &&
          requiredChart.stormState.safeWindow.locked &&
          requiredChart.stormState.outcome === "none"
      );
      if (!(state.ladder.completedStormChartIds || []).includes(chartId) && !lockedWindow) {
        missing.push(`lock ${chartId}`);
      }
    });
    return {
      ready: missing.length === 0,
      missing,
      label: chart.prerequisiteLabel || "storm prerequisites",
    };
  }

  function convoyPrerequisiteStatus(route, state) {
    const requirements = route.prerequisites || {};
    const missing = [];
    const scannedAnomalyIds = currentScannedAnomalyIds(state);
    const salvageManifestIds = currentSalvageManifestIds(state);

    (requirements.completedSectorIds || []).forEach((sectorId) => {
      if (!(state.ladder.completedSectorIds || []).includes(sectorId)) {
        missing.push(`complete ${sectorById(sectorId).name}`);
      }
    });
    (requirements.scannedAnomalyIds || []).forEach((anomalyId) => {
      if (!scannedAnomalyIds.includes(anomalyId)) {
        missing.push(`scan ${anomalyId}`);
      }
    });
    (requirements.salvageManifestIds || []).forEach((siteId) => {
      if (!salvageManifestIds.includes(siteId)) {
        missing.push(`recover ${siteId}`);
      }
    });
    (requirements.hazardChartedSectorIds || []).forEach((sectorId) => {
      if (!(state.ladder.hazardCharts || {})[sectorId]) {
        missing.push(`chart ${sectorById(sectorId).name}`);
      }
    });
    (requirements.stormChartIds || []).forEach((chartId) => {
      const chart = stormChartById(state, chartId);
      const lockedWindow = Boolean(
        chart &&
          chart.stormState &&
          chart.stormState.safeWindow &&
          chart.stormState.safeWindow.locked &&
          chart.stormState.outcome === "none"
      );
      if (!(state.ladder.completedStormChartIds || []).includes(chartId) && !lockedWindow) {
        missing.push(`lock ${chartId}`);
      }
    });

    return {
      ready: missing.length === 0,
      missing,
      label: route.prerequisiteLabel || "route prerequisites",
    };
  }

  function interdictionCellPrerequisiteStatus(cell, state) {
    const requirements = cell.prerequisites || {};
    const missing = [];
    const scannedAnomalyIds = currentScannedAnomalyIds(state);
    const salvageManifestIds = currentSalvageManifestIds(state);

    (requirements.completedSectorIds || []).forEach((sectorId) => {
      if (!(state.ladder.completedSectorIds || []).includes(sectorId)) {
        missing.push(`complete ${sectorById(sectorId).name}`);
      }
    });
    (requirements.scannedAnomalyIds || []).forEach((anomalyId) => {
      if (!scannedAnomalyIds.includes(anomalyId)) {
        missing.push(`scan ${anomalyId}`);
      }
    });
    (requirements.salvageManifestIds || []).forEach((siteId) => {
      if (!salvageManifestIds.includes(siteId)) {
        missing.push(`recover ${siteId}`);
      }
    });
    (requirements.hazardChartedSectorIds || []).forEach((sectorId) => {
      if (!(state.ladder.hazardCharts || {})[sectorId]) {
        missing.push(`chart ${sectorById(sectorId).name}`);
      }
    });
    (requirements.convoyBeaconRouteIds || []).forEach((routeId) => {
      const route = convoyRouteById(state, routeId);
      if (!route || !route.beaconState.deployed) {
        missing.push(`deploy ${routeId} beacon`);
      }
    });
    (requirements.stormChartIds || []).forEach((chartId) => {
      const chart = stormChartById(state, chartId);
      const lockedWindow = Boolean(
        chart &&
          chart.stormState &&
          chart.stormState.safeWindow &&
          chart.stormState.safeWindow.locked &&
          chart.stormState.outcome === "none"
      );
      if (!(state.ladder.completedStormChartIds || []).includes(chartId) && !lockedWindow) {
        missing.push(`lock ${chartId}`);
      }
    });

    return {
      ready: missing.length === 0,
      missing,
      label: cell.prerequisiteLabel || "interdiction prerequisites",
    };
  }

  function signalGatePrerequisiteStatus(gate, state) {
    const requirements = gate.prerequisites || {};
    const missing = [];
    const scannedAnomalyIds = currentScannedAnomalyIds(state);
    const salvageManifestIds = currentSalvageManifestIds(state);

    (requirements.completedSectorIds || []).forEach((sectorId) => {
      if (!(state.ladder.completedSectorIds || []).includes(sectorId)) {
        missing.push(`complete ${sectorById(sectorId).name}`);
      }
    });
    (requirements.scannedAnomalyIds || []).forEach((anomalyId) => {
      if (!scannedAnomalyIds.includes(anomalyId)) {
        missing.push(`scan ${anomalyId}`);
      }
    });
    (requirements.salvageManifestIds || []).forEach((siteId) => {
      if (!salvageManifestIds.includes(siteId)) {
        missing.push(`recover ${siteId}`);
      }
    });
    (requirements.hazardChartedSectorIds || []).forEach((sectorId) => {
      if (!(state.ladder.hazardCharts || {})[sectorId]) {
        missing.push(`chart ${sectorById(sectorId).name}`);
      }
    });
    (requirements.convoyBeaconRouteIds || []).forEach((routeId) => {
      const route = convoyRouteById(state, routeId);
      if (!route || !route.beaconState.deployed) {
        missing.push(`deploy ${routeId} beacon`);
      }
    });
    (requirements.stormChartIds || []).forEach((chartId) => {
      const chart = stormChartById(state, chartId);
      const lockedWindow = Boolean(
        chart &&
          chart.stormState &&
          chart.stormState.safeWindow &&
          chart.stormState.safeWindow.locked &&
          chart.stormState.outcome === "none"
      );
      if (!(state.ladder.completedStormChartIds || []).includes(chartId) && !lockedWindow) {
        missing.push(`lock ${chartId}`);
      }
    });
    (requirements.completedInterdictionCellIds || []).forEach((cellId) => {
      const cell = interdictionCellById(state, cellId);
      const resolved = Boolean(cell && ["success", "partial"].includes(cell.interdictionState.outcome));
      if (!(state.ladder.completedInterdictionCellIds || []).includes(cellId) && !resolved) {
        missing.push(`break ${cellId}`);
      }
    });
    (requirements.completedSignalGateIds || []).forEach((gateId) => {
      const requiredGate = signalGateById(state, gateId);
      const transited = Boolean(requiredGate && ["success", "partial"].includes(requiredGate.gateState.outcome));
      if (!(state.ladder.completedSignalGateIds || []).includes(gateId) && !transited) {
        missing.push(`transit ${gateId}`);
      }
    });

    return {
      ready: missing.length === 0,
      missing,
      label: gate.prerequisiteLabel || "signal gate prerequisites",
    };
  }

  function signalGateTransitTiming(gate, state) {
    const transitWindow = gate.gateState.transitWindow || {};
    const opensAt = transitWindow.opensAt || 0;
    const closesAt = transitWindow.closesAt || 0;
    const elapsed = state.elapsed || 0;
    return {
      opensAt,
      closesAt,
      remaining: round(Math.max(0, closesAt - elapsed), 2),
      open: elapsed >= opensAt && elapsed <= closesAt,
      pending: elapsed < opensAt,
      missed: elapsed > closesAt && !transitWindow.committed,
      committed: Boolean(transitWindow.committed),
      committedAt: transitWindow.committedAt,
      forced: Boolean(transitWindow.forced),
      anchoredChartId: transitWindow.anchoredChartId || gate.gateState.stormWindowAnchoredChartId || null,
      abortedAt: transitWindow.abortedAt || null,
    };
  }

  function signalGateReadiness(state, gateId) {
    const gate = signalGateById(state, gateId);
    if (!gate) {
      return {
        gateId,
        ready: false,
        missing: ["unknown signal gate"],
        canScan: false,
        canAlignPylon: false,
        canChargeCapacitor: false,
        canAnchorStormWindow: false,
        canCommitTransit: false,
        canAbortTransit: false,
        canForceOpen: false,
        canCountermeasureJam: false,
      };
    }
    const prerequisites = signalGatePrerequisiteStatus(gate, state);
    const timing = signalGateTransitTiming(gate, state);
    const terminal = ["success", "partial", "failed"].includes(gate.gateState.outcome);
    const charged = gate.gateState.capacitorCharge >= gate.gateState.capacitorRequirement;
    const anchorableChart = (gate.stormChartIds || []).some((chartId) => {
      const chart = stormChartById(state, chartId);
      return Boolean(chart && chart.stormState.safeWindow.locked && chart.stormState.outcome === "none");
    });
    return {
      gateId: gate.id,
      ready: prerequisites.ready,
      missing: prerequisites.missing,
      label: prerequisites.label,
      harmonicsScanned: gate.gateState.harmonicsScanned,
      pylonAligned: gate.gateState.pylonAligned,
      capacitorCharge: gate.gateState.capacitorCharge,
      capacitorRequirement: gate.gateState.capacitorRequirement,
      transitWindow: timing,
      pirateJam: gate.gateState.pirateJam,
      canScan: prerequisites.ready && !gate.gateState.harmonicsScanned && !terminal,
      canAlignPylon: prerequisites.ready && gate.gateState.harmonicsScanned && !gate.gateState.pylonAligned && !terminal,
      canChargeCapacitor:
        prerequisites.ready &&
        gate.gateState.harmonicsScanned &&
        gate.gateState.pylonAligned &&
        !charged &&
        !terminal,
      canAnchorStormWindow:
        prerequisites.ready &&
        gate.gateState.pylonAligned &&
        anchorableChart &&
        !gate.gateState.stormWindowAnchoredChartId &&
        !terminal,
      canCommitTransit:
        prerequisites.ready &&
        gate.gateState.harmonicsScanned &&
        gate.gateState.pylonAligned &&
        charged &&
        (timing.open || timing.forced) &&
        !terminal,
      canAbortTransit: prerequisites.ready && gate.gateState.capacitorCharge > 0 && !terminal,
      canForceOpen:
        prerequisites.ready &&
        gate.gateState.harmonicsScanned &&
        gate.gateState.pylonAligned &&
        charged &&
        !timing.open &&
        !terminal,
      canCountermeasureJam:
        prerequisites.ready &&
        gate.gateState.harmonicsScanned &&
        !terminal &&
        (state.stationServices ? state.stationServices.countermeasureCharges > 0 : false),
    };
  }

  function interdictionResponseTiming(cell, state) {
    const responseWindow = cell.interdictionState.responseWindow || {};
    const opensAt = responseWindow.opensAt || 0;
    const closesAt = responseWindow.closesAt || 0;
    const elapsed = state.elapsed || 0;
    return {
      opensAt,
      closesAt,
      remaining: round(Math.max(0, closesAt - elapsed), 2),
      open: elapsed >= opensAt && elapsed <= closesAt,
      pending: elapsed < opensAt,
      missed: elapsed > closesAt && !responseWindow.locked,
      locked: Boolean(responseWindow.locked),
      markedAt: responseWindow.markedAt,
    };
  }

  function interdictionCellReadiness(state, cellId) {
    const cell = interdictionCellById(state, cellId);
    if (!cell) {
      return {
        cellId,
        ready: false,
        missing: ["unknown interdiction cell"],
        canScan: false,
        canPlaceMarker: false,
        canDeployLure: false,
        canResolveRaid: false,
      };
    }
    const prerequisites = interdictionCellPrerequisiteStatus(cell, state);
    const timing = interdictionResponseTiming(cell, state);
    const terminal = ["success", "partial", "failed"].includes(cell.interdictionState.outcome);
    return {
      cellId: cell.id,
      ready: prerequisites.ready,
      missing: prerequisites.missing,
      label: prerequisites.label,
      transponderScanned: cell.interdictionState.transponderScanned,
      markerPlaced: cell.interdictionState.markerPlaced,
      markerType: cell.interdictionState.markerType,
      lureDeployed: cell.interdictionState.lureDeployed,
      raidPressure: cell.interdictionState.raidPressure,
      responseWindow: timing,
      canScan: prerequisites.ready && !cell.interdictionState.transponderScanned && !terminal,
      canPlaceMarker: prerequisites.ready && cell.interdictionState.transponderScanned && !cell.interdictionState.markerPlaced && !terminal,
      canDeployLure:
        prerequisites.ready &&
        cell.interdictionState.transponderScanned &&
        !cell.interdictionState.lureDeployed &&
        !terminal &&
        (state.stationServices ? state.stationServices.countermeasureCharges > 0 : false),
      canResolveRaid: prerequisites.ready && cell.interdictionState.transponderScanned && !terminal && !timing.pending,
    };
  }

  function syncInterdictionDerivedState(state) {
    if (!state.interdiction || !state.interdictionCells) {
      return state;
    }
    let activeCell = null;
    state.interdiction.scanPower =
      GAME_DATA.knifeWakeInterdiction.baseScanPower + (state.stationServices ? state.stationServices.interdictionScanBonus || 0 : 0);
    state.interdiction.supportMitigation = state.stationServices ? state.stationServices.interdictionRaidMitigation || 0 : 0;
    state.interdiction.supportIntegrity = state.stationServices ? state.stationServices.interdictionSupportIntegrity || 0 : 0;
    state.interdiction.responseWindowBonus = state.stationServices ? state.stationServices.interdictionResponseWindowBonus || 0 : 0;
    state.interdiction.payoutBonus = state.stationServices ? state.stationServices.interdictionPayoutBonus || 0 : 0;

    state.interdictionCells.forEach((cell) => {
      cell.prerequisiteStatus = interdictionCellPrerequisiteStatus(cell, state);
      if (!cell.interdictionState.responseWindow.locked) {
        cell.interdictionState.responseWindow.closesAt =
          (cell.responseWindow ? cell.responseWindow.closesAt || 0 : 0) + state.interdiction.responseWindowBonus;
      }
      const terminal = ["success", "partial", "failed"].includes(cell.interdictionState.outcome);
      if (terminal) {
        return;
      }
      if (!cell.prerequisiteStatus.ready) {
        cell.interdictionState.status = "locked";
        return;
      }
      if (!cell.interdictionState.transponderScanned) {
        cell.interdictionState.status =
          cell.interdictionState.status === "scanning" ? "scanning" : "transponder quiet";
        activeCell = activeCell || cell;
        return;
      }
      const timing = interdictionResponseTiming(cell, state);
      if (timing.missed && !cell.interdictionState.markerPlaced && !cell.interdictionState.lureDeployed) {
        cell.interdictionState.status = "raid window missed";
      } else if (cell.interdictionState.lureDeployed) {
        cell.interdictionState.status = timing.open ? "lure active" : timing.pending ? "lure armed" : "lure aging";
      } else if (cell.interdictionState.markerPlaced) {
        cell.interdictionState.status = timing.open ? `${cell.interdictionState.markerType} window open` : `${cell.interdictionState.markerType} marker armed`;
      } else {
        cell.interdictionState.status = timing.open ? "raid window open" : timing.pending ? "awaiting response window" : "response overdue";
      }
      activeCell = activeCell || cell;
    });

    if (activeCell) {
      state.interdiction.activeCellId = activeCell.id;
      state.interdiction.status = `${activeCell.name} ${activeCell.interdictionState.status}`;
    } else if (state.interdictionCells.length) {
      state.interdiction.activeCellId = null;
      state.interdiction.status = "pirate cells settled";
    } else {
      state.interdiction.activeCellId = null;
      state.interdiction.status = "no pirate cells";
    }
    return state;
  }

  function syncSignalGateDerivedState(state) {
    if (!state.signalGate || !state.signalGates) {
      return state;
    }
    let activeGate = null;
    state.signalGate.scanPower =
      GAME_DATA.signalGateExpedition.baseScanPower + (state.stationServices ? state.stationServices.signalScanBonus || 0 : 0);
    state.signalGate.pylonSupportIntegrity = state.stationServices ? state.stationServices.signalPylonIntegrity || 0 : 0;
    state.signalGate.capacitorBonus = state.stationServices ? state.stationServices.signalCapacitorBonus || 0 : 0;
    state.signalGate.transitWindowBonus = state.stationServices ? state.stationServices.signalTransitWindowBonus || 0 : 0;
    state.signalGate.jamMitigation = state.stationServices ? state.stationServices.signalJamMitigation || 0 : 0;
    state.signalGate.payoutBonus = state.stationServices ? state.stationServices.signalPayoutBonus || 0 : 0;

    state.signalGates.forEach((gate) => {
      gate.prerequisiteStatus = signalGatePrerequisiteStatus(gate, state);
      const supportedPylonMax = (gate.pylon && gate.pylon.integrity ? gate.pylon.integrity : 60) + state.signalGate.pylonSupportIntegrity;
      gate.gateState.maxPylonIntegrity = Math.max(gate.gateState.maxPylonIntegrity || 0, supportedPylonMax);
      if (!gate.gateState.transitWindow.committed && !gate.gateState.transitWindow.forced) {
        const anchorBonus = gate.gateState.stormWindowAnchoredChartId ? gate.stormWindowBonus || 0 : 0;
        gate.gateState.transitWindow.closesAt =
          (gate.transitWindow ? gate.transitWindow.closesAt || 0 : 0) + state.signalGate.transitWindowBonus + anchorBonus;
      }
      gate.gateState.pirateJam = Math.max(0, round((gate.gateState.pirateJam || gate.pirateGateJam || 0), 2));
      const terminal = ["success", "partial", "failed"].includes(gate.gateState.outcome);
      if (terminal) {
        return;
      }
      if (!gate.prerequisiteStatus.ready) {
        gate.gateState.status = "locked";
        return;
      }
      if (!gate.gateState.harmonicsScanned) {
        gate.gateState.status = gate.gateState.status === "scanning" ? "scanning" : "harmonics quiet";
        activeGate = activeGate || gate;
        return;
      }
      if (!gate.gateState.pylonAligned) {
        gate.gateState.status = "harmonics scanned";
        activeGate = activeGate || gate;
        return;
      }
      if (gate.gateState.capacitorCharge < gate.gateState.capacitorRequirement) {
        gate.gateState.status = `capacitor ${round(gate.gateState.capacitorCharge, 1)}/${gate.gateState.capacitorRequirement}`;
        activeGate = activeGate || gate;
        return;
      }
      const timing = signalGateTransitTiming(gate, state);
      if (timing.missed) {
        gate.gateState.status = "transit window missed";
      } else if (timing.open || timing.forced) {
        gate.gateState.status = "transit window open";
      } else {
        gate.gateState.status = "capacitor charged";
      }
      activeGate = activeGate || gate;
    });

    if (activeGate) {
      state.signalGate.activeGateId = activeGate.id;
      state.signalGate.status = `${activeGate.name} ${activeGate.gateState.status}`;
    } else if (state.signalGates.length) {
      state.signalGate.activeGateId = null;
      state.signalGate.status = "signal gates settled";
    } else {
      state.signalGate.activeGateId = null;
      state.signalGate.status = "no signal gates";
    }
    return state;
  }

  function syncConvoyDerivedState(state) {
    if (!state.convoy || !state.convoyRoutes) {
      return state;
    }
    let activeRoute = null;
    state.convoy.supportIntegrity = state.stationServices ? state.stationServices.convoyEscortIntegrity || 0 : 0;
    state.convoy.supportMitigation = state.stationServices ? state.stationServices.convoyAmbushMitigation || 0 : 0;
    state.convoy.payoutBonus = state.stationServices ? state.stationServices.convoyPayoutBonus || 0 : 0;

    state.convoyRoutes.forEach((route) => {
      route.prerequisiteStatus = convoyPrerequisiteStatus(route, state);
      route.position = clone(route.beacon.position);
      if (["enroute", "ambushed", "straggling"].includes(route.convoyState.status)) {
        route.convoyState.position = convoyRoutePosition(route);
        activeRoute = route;
        return;
      }
      if (["delivered", "partial", "failed"].includes(route.convoyState.status)) {
        return;
      }
      if (!route.prerequisiteStatus.ready) {
        route.convoyState.status = "locked";
      } else if (!route.beaconState.deployed) {
        route.convoyState.status = "needs beacon";
      } else if (["locked", "needs beacon", "idle"].includes(route.convoyState.status)) {
        route.convoyState.status = "ready";
      }
    });

    if (activeRoute) {
      state.convoy.activeRouteId = activeRoute.id;
      state.convoy.status = `${activeRoute.name} ${activeRoute.convoyState.status}`;
    } else if (state.convoy.activeRouteId && !convoyRouteById(state, state.convoy.activeRouteId)) {
      state.convoy.activeRouteId = null;
    } else if (!state.convoy.activeRouteId) {
      const readyRoute = state.convoyRoutes.find((route) => route.convoyState.status === "ready");
      const beaconRoute = state.convoyRoutes.find((route) => route.convoyState.status === "needs beacon");
      const lockedRoute = state.convoyRoutes.find((route) => route.convoyState.status === "locked");
      state.convoy.status = readyRoute
        ? `${readyRoute.name} ready`
        : beaconRoute
          ? `${beaconRoute.name} needs beacon`
          : lockedRoute
            ? `${lockedRoute.name} locked`
            : state.convoyRoutes.length
              ? "convoy routes settled"
              : "no convoy routes";
    }
    return state;
  }

  function convoyRouteReadiness(state, routeId) {
    const route = convoyRouteById(state, routeId);
    if (!route) {
      return {
        routeId,
        ready: false,
        missing: ["unknown route"],
        beaconDeployed: false,
        canDeployBeacon: false,
        canStart: false,
      };
    }
    const prerequisites = convoyPrerequisiteStatus(route, state);
    return {
      routeId: route.id,
      ready: prerequisites.ready,
      missing: prerequisites.missing,
      label: prerequisites.label,
      beaconDeployed: route.beaconState.deployed,
      canDeployBeacon: prerequisites.ready && !route.beaconState.deployed,
      canStart:
        prerequisites.ready &&
        route.beaconState.deployed &&
        route.convoyState.status !== "delivered" &&
        route.convoyState.status !== "partial" &&
        route.convoyState.status !== "failed",
    };
  }

  function stormWindowTiming(chart, state) {
    const safeWindow = chart.stormState.safeWindow || {};
    const opensAt = safeWindow.opensAt || 0;
    const closesAt = safeWindow.closesAt || 0;
    const elapsed = state.elapsed || 0;
    return {
      opensAt,
      closesAt,
      remaining: round(Math.max(0, closesAt - elapsed), 2),
      open: elapsed >= opensAt && elapsed <= closesAt,
      pending: elapsed < opensAt,
      missed: elapsed > closesAt && !safeWindow.locked,
      locked: Boolean(safeWindow.locked),
      lockedAt: safeWindow.lockedAt,
    };
  }

  function stormChartReadiness(state, chartId) {
    const chart = stormChartById(state, chartId);
    if (!chart) {
      return {
        chartId,
        ready: false,
        missing: ["unknown storm chart"],
        canScan: false,
        canDeployAnchor: false,
        canMaintainAnchor: false,
        canLockWindow: false,
      };
    }
    const prerequisites = stormChartPrerequisiteStatus(chart, state);
    const timing = stormWindowTiming(chart, state);
    const terminal = ["complete", "partial", "failed"].includes(chart.stormState.outcome);
    return {
      chartId: chart.id,
      ready: prerequisites.ready,
      missing: prerequisites.missing,
      label: prerequisites.label,
      charted: chart.stormState.charted,
      anchorDeployed: chart.stormState.anchorDeployed,
      anchorIntegrity: chart.stormState.anchorIntegrity,
      maxAnchorIntegrity: chart.stormState.maxAnchorIntegrity,
      safeWindow: timing,
      canScan: prerequisites.ready && !chart.stormState.charted && !terminal,
      canDeployAnchor: prerequisites.ready && chart.stormState.charted && !chart.stormState.anchorDeployed && !terminal,
      canMaintainAnchor: prerequisites.ready && chart.stormState.anchorDeployed && !terminal,
      canLockWindow:
        prerequisites.ready &&
        chart.stormState.charted &&
        chart.stormState.anchorDeployed &&
        !chart.stormState.safeWindow.locked &&
        timing.open &&
        !terminal,
    };
  }

  function syncStormDerivedState(state) {
    if (!state.storm || !state.stormCharts) {
      return state;
    }
    let activeChart = null;
    state.storm.scanPower = GAME_DATA.stormCartography.baseScanPower + (state.stationServices ? state.stationServices.stormScanBonus || 0 : 0);
    state.storm.supportIntegrity = state.stationServices ? state.stationServices.stormAnchorIntegrity || 0 : 0;
    state.storm.supportMitigation = state.stationServices ? state.stationServices.stormHazardMitigation || 0 : 0;
    state.storm.windowBonus = state.stationServices ? state.stationServices.stormWindowBonus || 0 : 0;
    state.storm.payoutBonus = state.stationServices ? state.stationServices.stormPayoutBonus || 0 : 0;
    state.stormCharts.forEach((chart) => {
      chart.prerequisiteStatus = stormChartPrerequisiteStatus(chart, state);
      const supportedAnchorMax = (chart.anchor && chart.anchor.integrity ? chart.anchor.integrity : 60) + state.storm.supportIntegrity;
      chart.stormState.maxAnchorIntegrity = Math.max(chart.stormState.maxAnchorIntegrity || 0, supportedAnchorMax);
      if (!chart.stormState.safeWindow.locked) {
        chart.stormState.safeWindow.closesAt = (chart.safeWindow ? chart.safeWindow.closesAt || 0 : 0) + state.storm.windowBonus;
      }
      const terminal = ["complete", "partial", "failed"].includes(chart.stormState.outcome);
      if (terminal) {
        return;
      }
      if (!chart.prerequisiteStatus.ready) {
        chart.stormState.status = "locked";
        return;
      }
      if (!chart.stormState.charted) {
        chart.stormState.status = chart.stormState.status === "scanning" ? "scanning" : "uncharted";
        activeChart = activeChart || chart;
        return;
      }
      if (!chart.stormState.anchorDeployed) {
        chart.stormState.status = "charted";
        activeChart = activeChart || chart;
        return;
      }
      if (!chart.stormState.safeWindow.locked) {
        const timing = stormWindowTiming(chart, state);
        chart.stormState.status = timing.missed ? "window missed" : timing.pending ? "anchor ready" : "window open";
        activeChart = activeChart || chart;
        return;
      }
      chart.stormState.status = "window locked";
      activeChart = activeChart || chart;
    });
    if (activeChart) {
      state.storm.activeChartId = activeChart.id;
      state.storm.status = `${activeChart.name} ${activeChart.stormState.status}`;
    } else if (state.stormCharts.length) {
      state.storm.activeChartId = null;
      state.storm.status = "storm charts settled";
    } else {
      state.storm.activeChartId = null;
      state.storm.status = "no storm charts";
    }
    return state;
  }

  function stormWindowModifierForRoute(state, route) {
    const modifier = {
      active: false,
      chartId: null,
      ambushReduction: 0,
      hazardReduction: 0,
      payoutBonus: 0,
      anchorIntegrity: 0,
    };
    (state.stormCharts || []).forEach((chart) => {
      if (
        !(chart.convoyRouteIds || []).includes(route.id) ||
        !chart.stormState.safeWindow.locked ||
        chart.stormState.outcome !== "none"
      ) {
        return;
      }
      modifier.active = true;
      modifier.chartId = chart.id;
      modifier.ambushReduction = Math.max(modifier.ambushReduction, chart.convoyAmbushReduction || 0);
      modifier.hazardReduction = Math.max(modifier.hazardReduction, chart.convoyHazardReduction || 0);
      modifier.payoutBonus = Math.max(
        modifier.payoutBonus,
        (chart.convoyPayoutBonus || 0) + (state.stationServices ? state.stationServices.stormPayoutBonus || 0 : 0)
      );
      modifier.anchorIntegrity = Math.max(modifier.anchorIntegrity, chart.stormState.anchorIntegrity || 0);
    });
    return modifier;
  }

  function stormSalvageRiskMitigation(site, state) {
    let mitigation = 0;
    (state.stormCharts || []).forEach((chart) => {
      const rerouted = (site.salvageState.stormReroute || {}).chartId === chart.id;
      const lockedWindow =
        (chart.salvageSiteIds || []).includes(site.id) &&
        chart.stormState.safeWindow.locked &&
        chart.stormState.outcome === "none";
      if (lockedWindow || rerouted) {
        mitigation = Math.max(
          mitigation,
          (chart.salvageRiskReduction || 0) + (state.stationServices ? (state.stationServices.stormHazardMitigation || 0) * 0.25 : 0)
        );
      }
    });
    return mitigation;
  }

  function interdictionModifierForRoute(state, route) {
    const modifier = {
      active: false,
      cellId: null,
      raidPressure: 0,
      ambushReduction: 0,
      escortIntegrity: 0,
      payoutBonus: 0,
      label: "none",
    };
    (state.interdictionCells || []).forEach((cell) => {
      if (!(cell.convoyRouteIds || []).includes(route.id)) {
        return;
      }
      const outcome = cell.interdictionState.outcome;
      if (outcome === "success" || outcome === "partial") {
        modifier.active = true;
        modifier.cellId = cell.id;
        modifier.ambushReduction = Math.max(
          modifier.ambushReduction,
          (cell.convoyAmbushReduction || 0) * (outcome === "success" ? 1 : 0.5)
        );
        modifier.escortIntegrity = Math.max(
          modifier.escortIntegrity,
          (cell.convoyEscortIntegrity || 0) * (outcome === "success" ? 1 : 0.5)
        );
        modifier.payoutBonus = Math.max(modifier.payoutBonus, state.stationServices ? state.stationServices.interdictionPayoutBonus || 0 : 0);
        modifier.label = `${cell.id} ${outcome}`;
        return;
      }
      if (!cell.prerequisiteStatus || !cell.prerequisiteStatus.ready || !cell.interdictionState.transponderScanned) {
        return;
      }
      const markerScale = cell.interdictionState.markerType === "decoy" ? 0.65 : cell.interdictionState.markerType === "distress" ? 0.82 : 1;
      const lureScale = cell.interdictionState.lureDeployed ? 0.58 : 1;
      const supportScale = 1 - Math.min(0.45, state.stationServices ? state.stationServices.interdictionRaidMitigation || 0 : 0);
      modifier.active = true;
      modifier.cellId = cell.id;
      modifier.raidPressure = Math.max(
        modifier.raidPressure,
        round((cell.interdictionState.raidPressure || cell.raidPressure || 0) * markerScale * lureScale * supportScale, 2)
      );
      modifier.label = `${cell.id} unresolved`;
    });
    return modifier;
  }

  function interdictionSalvageRiskModifier(site, state) {
    let modifier = 0;
    (state.interdictionCells || []).forEach((cell) => {
      if (!(cell.salvageSiteIds || []).includes(site.id)) {
        return;
      }
      const shield = (site.salvageState.interdictionShield || {}).cellId === cell.id;
      if (cell.interdictionState.outcome === "success" || shield) {
        modifier -= cell.salvageRiskReduction || 0;
        return;
      }
      if (cell.interdictionState.outcome === "partial") {
        modifier -= (cell.salvageRiskReduction || 0) * 0.5;
        return;
      }
      if (!cell.prerequisiteStatus || !cell.prerequisiteStatus.ready || !cell.interdictionState.transponderScanned) {
        return;
      }
      const markerScale = cell.interdictionState.markerType === "decoy" ? 0.45 : cell.interdictionState.markerPlaced ? 0.65 : 1;
      const lureScale = cell.interdictionState.lureDeployed ? 0.5 : 1;
      const supportReduction = state.stationServices ? state.stationServices.interdictionRaidMitigation || 0 : 0;
      modifier += Math.max(0, (cell.interdictionState.raidPressure || cell.raidPressure || 0) / 150 - supportReduction) * markerScale * lureScale;
    });
    return modifier;
  }

  function signalGateModifierForRoute(state, route) {
    const modifier = {
      active: false,
      gateId: null,
      jamPressure: 0,
      ambushReduction: 0,
      hazardReduction: 0,
      payoutBonus: 0,
      label: "none",
    };
    (state.signalGates || []).forEach((gate) => {
      if (!(gate.convoyRouteIds || []).includes(route.id)) {
        return;
      }
      const outcome = gate.gateState.outcome;
      if (outcome === "success" || outcome === "partial") {
        const scaleValue = outcome === "success" ? 1 : 0.5;
        modifier.active = true;
        modifier.gateId = gate.id;
        modifier.ambushReduction = Math.max(modifier.ambushReduction, (gate.convoyAmbushReduction || 0) * scaleValue);
        modifier.hazardReduction = Math.max(modifier.hazardReduction, (gate.convoyHazardReduction || 0) * scaleValue);
        modifier.payoutBonus = Math.max(
          modifier.payoutBonus,
          (gate.convoyTransitPayoutBonus || 0) * scaleValue + (state.stationServices ? state.stationServices.signalPayoutBonus || 0 : 0)
        );
        modifier.label = `${gate.id} ${outcome}`;
        return;
      }
      if (!gate.prerequisiteStatus || !gate.prerequisiteStatus.ready || !gate.gateState.harmonicsScanned) {
        return;
      }
      const chargedScale = gate.gateState.capacitorCharge >= gate.gateState.capacitorRequirement ? 0.55 : 0.3;
      const supportReduction = state.stationServices ? state.stationServices.signalJamMitigation || 0 : 0;
      modifier.active = true;
      modifier.gateId = gate.id;
      modifier.jamPressure = Math.max(
        modifier.jamPressure,
        round(Math.max(0, (gate.gateState.pirateJam || gate.pirateGateJam || 0) - supportReduction * 100) * chargedScale, 2)
      );
      modifier.label = `${gate.id} unresolved`;
    });
    return modifier;
  }

  function signalGateSalvageRiskModifier(site, state) {
    let modifier = 0;
    (state.signalGates || []).forEach((gate) => {
      if (!(gate.salvageSiteIds || []).includes(site.id)) {
        return;
      }
      const outcome = gate.gateState.outcome;
      if (outcome === "success") {
        modifier -= gate.salvageRiskReduction || 0;
        return;
      }
      if (outcome === "partial") {
        modifier -= (gate.salvageRiskReduction || 0) * 0.5;
        return;
      }
      if (!gate.prerequisiteStatus || !gate.prerequisiteStatus.ready || !gate.gateState.harmonicsScanned) {
        return;
      }
      const chargeScale = gate.gateState.capacitorCharge >= gate.gateState.capacitorRequirement ? 0.45 : 0.22;
      const supportReduction = state.stationServices ? state.stationServices.signalJamMitigation || 0 : 0;
      modifier += Math.max(0, (gate.gateState.pirateJam || gate.pirateGateJam || 0) / 180 - supportReduction) * chargeScale;
    });
    return modifier;
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
      requiredStormCharts: sector.requiredStormCharts || 0,
      requiredStormPayout: sector.requiredStormPayout || 0,
      requiredInterdictions: sector.requiredInterdictions || 0,
      requiredInterdictionPayout: sector.requiredInterdictionPayout || 0,
      requiredSignalTransits: sector.requiredSignalTransits || 0,
      requiredSignalPayout: sector.requiredSignalPayout || 0,
      rewardCredits: sector.rewardCredits,
      status: "active",
      sectorId: sector.id,
      tier: sector.tier,
      progress: 0,
      deliveredOre: 0,
      deliveredScans: 0,
      deliveredSalvageValue: 0,
      deliveredRelics: 0,
      deliveredConvoyValue: 0,
      deliveredStormCharts: 0,
      deliveredStormPayout: 0,
      deliveredInterdictions: 0,
      deliveredInterdictionPayout: 0,
      deliveredSignalTransits: 0,
      deliveredSignalPayout: 0,
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

  function shouldStartTutorial(options = {}, ladder = {}) {
    if (options.tutorialMode === false) {
      return false;
    }
    if (options.tutorialMode === true || options.restartTutorial === true) {
      return true;
    }
    const runCount = options.runCount || 1;
    const currentSectorId = ladder.currentSectorId || GAME_DATA.surveyLadder.defaultSectorId;
    const completed = ladder.completedSectorIds || [];
    return (
      runCount === 1 &&
      currentSectorId === GAME_DATA.surveyLadder.defaultSectorId &&
      !completed.includes(GAME_DATA.surveyLadder.defaultSectorId)
    );
  }

  function createTutorialState(active, options = {}, asteroids = []) {
    const config = GAME_DATA.tutorial;
    const target = asteroids.find((asteroid) => asteroid.id === config.targetId) || asteroids[0] || null;
    const targetDistance = target ? round(distance(GAME_DATA.ship.startPosition, target.position), 1) : 0;
    const restored = options.tutorial || {};
    const phases = config.phases.map((phase) => ({
      ...phase,
      complete: active ? false : true,
    }));
    return {
      id: config.id,
      title: config.title,
      status: active ? "active" : "complete",
      phase: active ? config.phases[0].id : "upgrade-preview",
      phases,
      targetId: config.targetId,
      stationId: config.stationId,
      requiredOre: config.requiredOre,
      targetAlignmentComplete: false,
      verticalAdjustmentRequired: active,
      verticalAdjustmentComplete: !active,
      thrustComplete: false,
      closingDistanceStart: targetDistance,
      closingDistanceComplete: false,
      miningComplete: false,
      stationReturnPrompted: false,
      stationReturnComplete: false,
      dockingComplete: false,
      cargoSaleComplete: false,
      upgradePreviewShown: !active,
      resettable: true,
      restartCount: restored.restartCount || 0,
      pirateUnlocked: !active,
      pirateUnlockedAt: active ? null : 0,
      completedAt: active ? null : 0,
      prompt: active ? "Align the reticle with Cinder Node." : "Tutorial complete. Advanced contracts are available.",
    };
  }

  function advancedSystemsUnlocked(state) {
    if (!state.tutorial) {
      return true;
    }
    return state.tutorial.status === "complete" || state.ladder.currentSectorId !== GAME_DATA.surveyLadder.defaultSectorId || state.run.count > 1;
  }

  function createDisclosureState(advancedUnlocked = false) {
    return {
      tutorial: !advancedUnlocked,
      objective: true,
      targetPrompt: true,
      stationMenu: true,
      upgradePreview: advancedUnlocked,
      upgradeCatalog: advancedUnlocked,
      surveyLadder: advancedUnlocked,
      salvage: advancedUnlocked,
      convoy: advancedUnlocked,
      storm: advancedUnlocked,
      interdiction: advancedUnlocked,
      signalGate: advancedUnlocked,
      stationServices: advancedUnlocked,
      rawTelemetry: advancedUnlocked,
      pirate: advancedUnlocked,
    };
  }

  function syncDisclosureState(state) {
    const advancedUnlocked = advancedSystemsUnlocked(state);
    const disclosure = createDisclosureState(advancedUnlocked);
    disclosure.tutorial = Boolean(state.tutorial && state.tutorial.status === "active");
    disclosure.upgradePreview = advancedUnlocked || Boolean(state.station && state.station.docked && state.tutorial && state.tutorial.upgradePreviewShown);
    disclosure.pirate = advancedUnlocked || (state.pirate && state.pirate.state !== "dormant");
    state.disclosure = disclosure;
    state.systemAccess = {
      asteroids: true,
      station: true,
      mining: true,
      docking: true,
      upgrades: advancedUnlocked,
      surveyLadder: advancedUnlocked,
      salvage: advancedUnlocked,
      convoy: advancedUnlocked,
      storm: advancedUnlocked,
      interdiction: advancedUnlocked,
      signalGate: advancedUnlocked,
      stationServices: advancedUnlocked,
      pirate: disclosure.pirate,
      rawTelemetry: advancedUnlocked,
    };
    return state;
  }

  function tutorialPhasePrompt(phase) {
    const prompts = {
      "target-alignment": "Align the reticle with Cinder Node.",
      "vertical-adjustment": "Use Q or Ctrl to match Cinder Node height.",
      thrust: "Press W to thrust toward Cinder Node.",
      "closing-distance": "Hold W until Cinder Node enters mining range.",
      mining: "Hold Space or M to mine three ore.",
      "station-return": "Return to the Frontier Spoke beacon.",
      docking: "Press F or Enter inside the docking ring.",
      "cargo-sale": "Ore sold at Frontier Spoke.",
      "upgrade-preview": "Preview Refined Beam before the next sortie.",
    };
    return prompts[phase] || "Follow the active target prompt.";
  }

  function completeTutorialPhase(tutorial, phaseId, complete) {
    const phase = tutorial.phases.find((item) => item.id === phaseId);
    if (phase) {
      phase.complete = Boolean(complete);
    }
  }

  function syncTutorialState(state) {
    if (!state.tutorial) {
      return state;
    }
    if (state.tutorial.status !== "active") {
      state.tutorial.phases.forEach((phase) => {
        phase.complete = true;
      });
      state.tutorial.pirateUnlocked = true;
      return state;
    }

    const config = GAME_DATA.tutorial;
    const target = state.asteroids.find((asteroid) => asteroid.id === state.tutorial.targetId) || state.asteroids[0] || null;
    if (!target) {
      return state;
    }

    const targetDistance = distance(state.ship.position, target.position);
    const targetBearing = Math.abs(bearingDegrees(state.ship.position, state.ship.heading, target.position));
    const verticalDelta = target.position.y - state.ship.position.y;
    state.tutorial.targetAlignmentComplete =
      state.tutorial.targetAlignmentComplete || targetBearing <= config.alignmentDegrees;
    state.tutorial.verticalAdjustmentComplete =
      state.tutorial.verticalAdjustmentComplete ||
      Math.abs(verticalDelta) <= config.verticalTolerance ||
      Math.abs(state.ship.position.y - GAME_DATA.ship.startPosition.y) >= 1;
    state.tutorial.thrustComplete =
      state.tutorial.thrustComplete || state.input.thrust || length(state.ship.velocity) >= 1.2;
    state.tutorial.closingDistanceComplete =
      state.tutorial.closingDistanceComplete ||
      targetDistance <= state.mining.range + target.radius ||
      targetDistance <= Math.max(0, state.tutorial.closingDistanceStart - config.closeDistanceDelta);
    state.tutorial.miningComplete =
      state.tutorial.miningComplete || state.cargo.ore >= state.tutorial.requiredOre || state.contract.deliveredOre >= state.tutorial.requiredOre;
    state.tutorial.stationReturnPrompted = state.tutorial.stationReturnPrompted || state.tutorial.miningComplete;
    state.tutorial.stationReturnComplete =
      state.tutorial.stationReturnComplete ||
      (state.tutorial.miningComplete && (state.station.proximity.distance <= state.station.dockingRadius * 2 || state.station.docked));
    state.tutorial.dockingComplete = state.tutorial.dockingComplete || state.station.docked;
    state.tutorial.cargoSaleComplete =
      state.tutorial.cargoSaleComplete ||
      (state.contract.deliveredOre >= state.tutorial.requiredOre && state.station.lastSale > 0);
    state.tutorial.upgradePreviewShown = state.tutorial.upgradePreviewShown || state.tutorial.cargoSaleComplete;

    completeTutorialPhase(state.tutorial, "target-alignment", state.tutorial.targetAlignmentComplete);
    completeTutorialPhase(state.tutorial, "vertical-adjustment", state.tutorial.verticalAdjustmentComplete);
    completeTutorialPhase(state.tutorial, "thrust", state.tutorial.thrustComplete);
    completeTutorialPhase(state.tutorial, "closing-distance", state.tutorial.closingDistanceComplete);
    completeTutorialPhase(state.tutorial, "mining", state.tutorial.miningComplete);
    completeTutorialPhase(state.tutorial, "station-return", state.tutorial.stationReturnComplete);
    completeTutorialPhase(state.tutorial, "docking", state.tutorial.dockingComplete);
    completeTutorialPhase(state.tutorial, "cargo-sale", state.tutorial.cargoSaleComplete);
    completeTutorialPhase(state.tutorial, "upgrade-preview", state.tutorial.upgradePreviewShown);

    const nextPhase =
      state.tutorial.phases.find((phase) => !phase.complete) ||
      state.tutorial.phases[state.tutorial.phases.length - 1];
    state.tutorial.phase = nextPhase.id;
    state.tutorial.prompt = tutorialPhasePrompt(state.tutorial.phase);

    if (["station-return", "docking"].includes(state.tutorial.phase) && state.target.kind !== "station") {
      state.target = {
        kind: "station",
        id: state.station.id,
        index: 0,
        distance: 0,
        bearing: 0,
      };
    }

    if (state.tutorial.upgradePreviewShown) {
      state.tutorial.status = "complete";
      state.tutorial.phase = "upgrade-preview";
      state.tutorial.prompt = tutorialPhasePrompt("upgrade-preview");
      state.tutorial.phases.forEach((phase) => {
        phase.complete = true;
      });
      state.tutorial.pirateUnlocked = true;
      state.tutorial.pirateUnlockedAt = state.tutorial.pirateUnlockedAt === null ? state.elapsed : state.tutorial.pirateUnlockedAt;
      state.tutorial.completedAt = state.tutorial.completedAt === null ? state.tick : state.tutorial.completedAt;
      if (state.pirate.unlockState !== "unlocked") {
        state.pirate.unlockState = "unlocked";
        state.pirate.unlockedAt = state.elapsed;
        state.pirate.spawnTick = round(state.elapsed + config.pirateUnlockDelay, 3);
      }
    }

    return state;
  }

  function reticleStateForTarget(state, target) {
    if (!target) {
      return "no-target";
    }
    if (state.cargo.ore >= state.cargo.capacity && state.target.kind !== "station") {
      return "cargo-full-return";
    }
    if (Math.abs(state.target.bearing || 0) > 75) {
      return "offscreen-direction";
    }
    if (state.target.kind === "station") {
      return state.station.proximity.dockable ? "dockable-station" : "station-out-of-range";
    }
    if (state.target.kind === "asteroid") {
      return state.target.distance <= state.mining.range + (target.radius || 0) ? "mine-in-range" : "target-out-of-range";
    }
    return "target-locked";
  }

  function promptActionForTarget(state, target) {
    if (!target) {
      return "retarget";
    }
    if (state.target.kind === "station") {
      return state.station.proximity.dockable ? "dock" : "approach";
    }
    if (state.target.kind === "asteroid") {
      return state.target.distance <= state.mining.range + (target.radius || 0) ? "mine" : "close-distance";
    }
    if (state.target.kind === "pirate") {
      return "evade";
    }
    return "inspect";
  }

  function syncSelectedTargetPromptState(state) {
    const target = findTarget(state);
    const tutorialTarget = target && state.tutorial && target.id === state.tutorial.targetId;
    state.selectedTargetPrompt = {
      targetId: target ? target.id : null,
      name: target ? target.name : "No target",
      kind: target ? state.target.kind : "none",
      phase: state.tutorial ? state.tutorial.phase : "free-flight",
      prompt: state.tutorial && state.tutorial.status === "active" ? state.tutorial.prompt : target ? `${target.name}: ${promptActionForTarget(state, target)}` : "Cycle target",
      action: promptActionForTarget(state, target),
      distance: state.target.distance || 0,
      bearing: state.target.bearing || 0,
      reticleState: reticleStateForTarget(state, target),
      inRange: target ? ["mine-in-range", "dockable-station", "target-locked"].includes(reticleStateForTarget(state, target)) : false,
      verticalDelta: target ? round(target.position.y - state.ship.position.y, 1) : 0,
      verticalAdjustmentRequired: Boolean(tutorialTarget && state.tutorial.verticalAdjustmentRequired),
      verticalAdjustmentComplete: Boolean(!tutorialTarget || state.tutorial.verticalAdjustmentComplete),
    };
    return state;
  }

  function syncStationMenuState(state) {
    const upgrade = upgradeSummary(state);
    state.stationMenu = {
      open: Boolean(state.station.docked),
      state: state.station.docked ? (state.tutorial && state.tutorial.status === "complete" ? "tutorial-summary" : "services") : "closed",
      lastSale: state.station.lastSale,
      lastService: state.station.lastService,
      contractStatus: state.contract.status,
      contractOre: `${state.contract.deliveredOre}/${state.contract.requiredOre}`,
      launchPrompt: state.station.docked ? "Launch" : "Approach Frontier Spoke",
      upgradePreview: {
        ...upgrade,
        visible: Boolean(state.station.docked && (state.disclosure.upgradePreview || state.disclosure.upgradeCatalog)),
      },
    };
    return state;
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
    const convoyRoutes = createConvoyRoutes(seed, sector, stationServices, options);
    const stormCharts = createStormCharts(seed, sector, stationServices, options);
    const interdictionCells = createInterdictionCells(seed, sector, stationServices, options);
    const signalGates = createSignalGates(seed, sector, stationServices, options);
    const tutorialActive = shouldStartTutorial(options, ladder);
    const advancedUnlocked = !tutorialActive;
    const accessibility = createAccessibilityState(options);
    const ship = {
      name: GAME_DATA.ship.name,
      position: clone(GAME_DATA.ship.startPosition),
      velocity: clone(GAME_DATA.ship.startVelocity),
      heading: GAME_DATA.ship.startHeading,
      orientation: createShipOrientation(GAME_DATA.ship.startHeading),
      engineState: createEngineState(),
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
      accessibility,
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
      convoyRoutes,
      convoy: createConvoyState(options, stationServices, convoyRoutes),
      stormCharts,
      storm: createStormCartographyState(options, stationServices, stormCharts),
      interdictionCells,
      interdiction: createInterdictionState(options, stationServices, interdictionCells),
      signalGates,
      signalGate: createSignalGateState(options, stationServices, signalGates),
      tutorial: createTutorialState(tutorialActive, options, asteroids),
      disclosure: createDisclosureState(advancedUnlocked),
      systemAccess: {
        asteroids: true,
        station: true,
        mining: true,
        docking: true,
        upgrades: advancedUnlocked,
        surveyLadder: advancedUnlocked,
        salvage: advancedUnlocked,
        convoy: advancedUnlocked,
        storm: advancedUnlocked,
        interdiction: advancedUnlocked,
        signalGate: advancedUnlocked,
        stationServices: advancedUnlocked,
        pirate: advancedUnlocked,
        rawTelemetry: advancedUnlocked,
      },
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
        unlockState: advancedUnlocked ? "unlocked" : "locked",
        unlockedAt: advancedUnlocked ? 0 : null,
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
        convoyBeaconsDeployed: 0,
        convoysStarted: 0,
        convoyPayouts: 0,
        convoyFailures: 0,
        convoyPartialPayouts: 0,
        convoyCountermeasures: 0,
        stormChartsScanned: 0,
        stormAnchorsDeployed: 0,
        stormWindowsLocked: 0,
        stormPayouts: 0,
        stormFailures: 0,
        stormPartialPayouts: 0,
        stormCountermeasures: 0,
        stormSalvageReroutes: 0,
        interdictionTranspondersScanned: 0,
        interdictionMarkersPlaced: 0,
        interdictionLuresDeployed: 0,
        interdictionRaidsResolved: 0,
        interdictionPayouts: 0,
        interdictionFailures: 0,
        interdictionPartialPayouts: 0,
        interdictionCargoLost: 0,
        signalGateScans: 0,
        signalPylonsAligned: 0,
        signalCapacitorsCharged: 0,
        signalGateTransits: 0,
        signalGatePayouts: 0,
        signalGateFailures: 0,
        signalGatePartialPayouts: 0,
        signalGateConvoyTransits: 0,
        signalGateAborts: 0,
        signalGateJamsMitigated: 0,
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
        ascend: false,
        descend: false,
        mine: false,
        scan: false,
      },
      selectedTargetPrompt: null,
      stationMenu: null,
      log: [{ tick: 0, message: `${GAME_DATA.surveyLadder.releaseLabel} tier ${sector.tier}: ${sector.name}.` }],
    };
    applyPurchasedUpgrades(state);
    return syncDerivedState(state);
  }

  function targetables(state) {
    const access = state.systemAccess || {};
    const asteroidTargets = state.asteroids
      .filter((asteroid) => !asteroid.mineState.depleted)
      .map((asteroid) => ({ kind: "asteroid", id: asteroid.id, position: asteroid.position, name: asteroid.name }));
    const anomalyTargets =
      access.surveyLadder === false
        ? []
        : (state.anomalies || [])
            .filter((anomaly) => !anomaly.scanState.scanned)
            .map((anomaly) => ({ kind: "anomaly", id: anomaly.id, position: anomaly.position, name: anomaly.name }));
    const salvageTargets =
      access.salvage === false
        ? []
        : (state.salvageSites || [])
            .filter((site) => !["depleted", "failed", "abandoned"].includes(site.salvageState.status))
            .map((site) => ({ kind: "salvage", id: site.id, position: site.position, name: site.name }));
    const convoyTargets =
      access.convoy === false
        ? []
        : (state.convoyRoutes || []).map((route) => ({
            kind: "convoy",
            id: route.id,
            position: route.beacon.position,
            name: route.beacon.name,
          }));
    const stormTargets =
      access.storm === false
        ? []
        : (state.stormCharts || []).map((chart) => ({
            kind: "storm",
            id: chart.id,
            position: chart.position,
            name: chart.name,
          }));
    const interdictionTargets =
      access.interdiction === false
        ? []
        : (state.interdictionCells || []).map((cell) => ({
            kind: "interdiction",
            id: cell.id,
            position: cell.position,
            name: cell.name,
          }));
    const signalGateTargets =
      access.signalGate === false
        ? []
        : (state.signalGates || []).map((gate) => ({
            kind: "signal-gate",
            id: gate.id,
            position: gate.position,
            name: gate.name,
          }));
    const pirateTargets =
      access.pirate === false && state.pirate.state === "dormant"
        ? []
        : [{ kind: "pirate", id: state.pirate.id, position: state.pirate.position, name: state.pirate.name }];
    return [
      ...asteroidTargets,
      ...salvageTargets,
      ...convoyTargets,
      ...stormTargets,
      ...interdictionTargets,
      ...signalGateTargets,
      ...anomalyTargets,
      { kind: "station", id: state.station.id, position: state.station.position, name: state.station.name },
      ...pirateTargets,
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
    if (target.kind === "convoy") {
      return convoyRouteById(state, target.id);
    }
    if (target.kind === "storm") {
      return stormChartById(state, target.id);
    }
    if (target.kind === "interdiction") {
      return interdictionCellById(state, target.id);
    }
    if (target.kind === "signal-gate") {
      return signalGateById(state, target.id);
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
    if (state.tutorial && state.tutorial.status === "active") {
      return state.tutorial.prompt || tutorialPhasePrompt(state.tutorial.phase);
    }
    if (state.tutorial && state.tutorial.status === "complete" && state.station.docked && state.station.lastSale > 0) {
      return "First contract complete. Preview Refined Beam, then launch the next sortie.";
    }
    if (state.contract.status === "complete") {
      return `${state.contract.title} complete. Restart into ${state.ladder.recommendedSectorId}.`;
    }
    if (state.interdiction && state.interdiction.activeCellId) {
      const cell = interdictionCellById(state, state.interdiction.activeCellId);
      if (cell && cell.interdictionState.transponderScanned && cell.interdictionState.outcome === "none") {
        return `Answer ${cell.name}: ${cell.interdictionState.status} / raid ${Math.round(
          cell.interdictionState.raidPressure
        )} / window ${interdictionResponseTiming(cell, state).remaining}s.`;
      }
    }
    if (state.signalGate && state.signalGate.activeGateId) {
      const gate = signalGateById(state, state.signalGate.activeGateId);
      if (gate && gate.gateState.harmonicsScanned && gate.gateState.outcome === "none") {
        return `Work ${gate.name}: ${gate.gateState.status} / capacitor ${round(
          gate.gateState.capacitorCharge,
          1
        )}/${gate.gateState.capacitorRequirement} / jam ${Math.round(gate.gateState.pirateJam)}.`;
      }
    }
    if (state.storm && state.storm.activeChartId) {
      const chart = stormChartById(state, state.storm.activeChartId);
      if (chart && chart.stormState.safeWindow.locked && chart.stormState.outcome === "none") {
        return `Hold ${chart.name}: window ${stormWindowTiming(chart, state).remaining}s / anchor ${Math.round(
          chart.stormState.anchorIntegrity
        )} integrity.`;
      }
    }
    if (state.convoy && state.convoy.activeRouteId) {
      const route = convoyRouteById(state, state.convoy.activeRouteId);
      if (route) {
        return `Escort ${route.name}: ${Math.round(route.convoyState.progress * 100)}% route / ${Math.round(
          route.convoyState.escortIntegrity
        )} escort integrity.`;
      }
    }
    if (state.convoyRoutes && state.convoyRoutes.length) {
      const readyRoute = state.convoyRoutes.find((route) => route.convoyState.status === "ready");
      const needsBeacon = state.convoyRoutes.find((route) => route.convoyState.status === "needs beacon");
      if (readyRoute) {
        return `${readyRoute.name} ready. Start the convoy or finish the ordinary charter.`;
      }
      if (needsBeacon) {
        return `Deploy ${needsBeacon.beacon.name} to open ${needsBeacon.name}.`;
      }
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
    if ((state.contract.requiredStormCharts || 0) > (state.contract.deliveredStormCharts || 0)) {
      return `Chart ${state.contract.requiredStormCharts - (state.contract.deliveredStormCharts || 0)} storm window in ${
        sectorById(state.ladder.currentSectorId).name
      }.`;
    }
    if ((state.contract.requiredStormPayout || 0) > (state.contract.deliveredStormPayout || 0)) {
      return `Bank ${state.contract.requiredStormPayout - (state.contract.deliveredStormPayout || 0)}cr from storm-cartography routes.`;
    }
    if ((state.contract.requiredInterdictions || 0) > (state.contract.deliveredInterdictions || 0)) {
      return `Break ${state.contract.requiredInterdictions - (state.contract.deliveredInterdictions || 0)} Knife Wake interdiction.`;
    }
    if ((state.contract.requiredInterdictionPayout || 0) > (state.contract.deliveredInterdictionPayout || 0)) {
      return `Bank ${
        state.contract.requiredInterdictionPayout - (state.contract.deliveredInterdictionPayout || 0)
      }cr from Knife Wake interdiction support.`;
    }
    if ((state.contract.requiredSignalTransits || 0) > (state.contract.deliveredSignalTransits || 0)) {
      return `Open ${state.contract.requiredSignalTransits - (state.contract.deliveredSignalTransits || 0)} Signal Gate transit.`;
    }
    if ((state.contract.requiredSignalPayout || 0) > (state.contract.deliveredSignalPayout || 0)) {
      return `Bank ${state.contract.requiredSignalPayout - (state.contract.deliveredSignalPayout || 0)}cr from Signal Gate transit.`;
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
    state.accessibility = state.accessibility || createAccessibilityState({ reducedMotion: false });
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

    state.input = state.input || {};
    state.ship = syncShipFlightState(state.ship, state.input);
    syncTutorialState(state);
    syncDisclosureState(state);

    syncStormDerivedState(state);
    syncConvoyDerivedState(state);
    syncInterdictionDerivedState(state);
    syncSignalGateDerivedState(state);

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
    const stormChartProgress =
      state.contract.requiredStormCharts > 0
        ? Math.min(1, (state.contract.deliveredStormCharts || 0) / state.contract.requiredStormCharts)
        : 1;
    const stormPayoutProgress =
      state.contract.requiredStormPayout > 0
        ? Math.min(1, (state.contract.deliveredStormPayout || 0) / state.contract.requiredStormPayout)
        : 1;
    const interdictionProgress =
      state.contract.requiredInterdictions > 0
        ? Math.min(1, (state.contract.deliveredInterdictions || 0) / state.contract.requiredInterdictions)
        : 1;
    const interdictionPayoutProgress =
      state.contract.requiredInterdictionPayout > 0
        ? Math.min(1, (state.contract.deliveredInterdictionPayout || 0) / state.contract.requiredInterdictionPayout)
        : 1;
    const signalTransitProgress =
      state.contract.requiredSignalTransits > 0
        ? Math.min(1, (state.contract.deliveredSignalTransits || 0) / state.contract.requiredSignalTransits)
        : 1;
    const signalPayoutProgress =
      state.contract.requiredSignalPayout > 0
        ? Math.min(1, (state.contract.deliveredSignalPayout || 0) / state.contract.requiredSignalPayout)
        : 1;
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
    if (state.contract.requiredStormCharts > 0) {
      progressParts.push(stormChartProgress);
    }
    if (state.contract.requiredStormPayout > 0) {
      progressParts.push(stormPayoutProgress);
    }
    if (state.contract.requiredInterdictions > 0) {
      progressParts.push(interdictionProgress);
    }
    if (state.contract.requiredInterdictionPayout > 0) {
      progressParts.push(interdictionPayoutProgress);
    }
    if (state.contract.requiredSignalTransits > 0) {
      progressParts.push(signalTransitProgress);
    }
    if (state.contract.requiredSignalPayout > 0) {
      progressParts.push(signalPayoutProgress);
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
    syncDisclosureState(state);
    syncSelectedTargetPromptState(state);
    syncStationMenuState(state);
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
    next.input = next.input || {};
    const turnAxis = (input.turnRight ? 1 : 0) - (input.turnLeft ? 1 : 0);
    const verticalAxis = (input.ascend ? 1 : 0) - (input.descend ? 1 : 0);
    next.ship.heading = normalizeAngle(next.ship.heading + turnAxis * GAME_DATA.ship.turnRate * dt);

    let velocity = clone(next.ship.velocity);
    if (input.thrust && next.ship.fuel > 0) {
      velocity = add(velocity, scale(forwardVector(next.ship.heading), GAME_DATA.ship.acceleration * dt));
      next.ship.fuel = Math.max(0, next.ship.fuel - GAME_DATA.ship.fuelBurnPerSecond * dt);
      next.input.thrust = true;
    } else {
      next.input.thrust = false;
    }

    if (verticalAxis !== 0 && next.ship.fuel > 0) {
      velocity = add(velocity, vector(0, verticalAxis * GAME_DATA.ship.verticalAcceleration * dt, 0));
      next.ship.fuel = Math.max(0, next.ship.fuel - GAME_DATA.ship.verticalFuelBurnPerSecond * dt);
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
    next.input.ascend = Boolean(input.ascend);
    next.input.descend = Boolean(input.descend);
    next.input.mine = Boolean(input.mine);
    next.input.scan = Boolean(input.scan);
    next.ship.velocity = limitVelocity(velocity, GAME_DATA.ship.maxSpeed);
    next.ship.position = add(next.ship.position, scale(next.ship.velocity, dt));
    next.ship.position.y = Math.max(-8, Math.min(8, next.ship.position.y));
    if (next.ship.position.y === -8 || next.ship.position.y === 8) {
      next.ship.velocity.y = 0;
    }
    next.ship = syncShipFlightState(next.ship, next.input);
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
      next.ladder.scannedAnomalyIds = uniqueList([...(next.ladder.scannedAnomalyIds || []), target.id]);
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

  function stormAnchorInRange(state, chart) {
    const range = chart.anchorDeployRange || GAME_DATA.stormCartography.anchorDeployRange;
    const anchorPosition = chart.anchor ? chart.anchor.position : chart.position;
    const anchorRadius = chart.anchor ? chart.anchor.radius || 0 : chart.radius || 0;
    return distance(state.ship.position, anchorPosition) <= range + anchorRadius;
  }

  function scanStormChart(state, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 2));
    const next = clone(state);
    if (next.run.status === "failed" || next.run.status === "complete") {
      next.storm.status = "run closed";
      return syncDerivedState(next);
    }
    const target = findTarget(next);
    if (!target || next.target.kind !== "storm") {
      next.storm.status = "no storm lock";
      return syncDerivedState(next);
    }
    const readiness = stormChartReadiness(next, target.id);
    if (!readiness.ready) {
      target.stormState.status = "locked";
      next.storm.status = `locked: ${readiness.missing.join(", ")}`;
      return syncDerivedState(next);
    }
    const range = distance(next.ship.position, target.position);
    if (range > next.storm.scanRange + target.radius) {
      next.storm.status = "out of storm scan range";
      return syncDerivedState(next);
    }
    if (target.stormState.charted) {
      target.stormState.status = "charted";
      next.storm.status = `${target.name} already charted`;
      return syncDerivedState(next);
    }

    target.stormState.status = "scanning";
    target.stormState.progress += next.storm.scanPower * dt;
    target.stormState.lastTouchedTick = next.tick;
    next.scanning.active = true;
    next.scanning.targetId = target.id;
    next.scanning.lastScan = clamp(target.stormState.progress / target.scanDifficulty, 0, 1);
    next.scanning.status = `storm chart ${Math.round(next.scanning.lastScan * 100)}%`;
    if (target.stormState.progress >= target.scanDifficulty) {
      target.stormState.progress = target.scanDifficulty;
      target.stormState.charted = true;
      target.stormState.status = "charted";
      next.storm.status = `${target.name} charted`;
      next.storm.lastOutcome = `${target.name} charted`;
      next.contract.deliveredStormCharts = (next.contract.deliveredStormCharts || 0) + 1;
      next.ladder.stormScore += target.surveyReward || 0;
      next.ladder.hazardCharts[next.ladder.currentSectorId] = true;
      next.hazard.surveyed = true;
      next.hazard.status = "charted";
      next.hazard.exposure = Math.max(0, round(next.hazard.exposure - (target.hazardMitigation || 0), 3));
      next.stats.stormChartsScanned += 1;
      next.log.unshift({ tick: next.tick, message: `${target.name} charted into Storm Cartography.` });
    }
    return syncDerivedState(next);
  }

  function deployStormAnchor(state, chartId) {
    const next = syncDerivedState(clone(state));
    const chart = stormChartById(next, chartId);
    if (!chart) {
      next.storm.status = "unknown storm chart";
      return syncDerivedState(next);
    }
    const readiness = stormChartReadiness(next, chartId);
    if (!readiness.ready || !chart.stormState.charted) {
      chart.stormState.status = "locked";
      next.storm.status = `locked: ${readiness.missing.join(", ") || "chart storm front"}`;
      return syncDerivedState(next);
    }
    if (!stormAnchorInRange(next, chart)) {
      chart.stormState.status = "anchor out of range";
      next.storm.status = `${chart.anchor.name} out of range`;
      return syncDerivedState(next);
    }
    if (chart.stormState.anchorDeployed) {
      chart.stormState.status = "anchor deployed";
      next.storm.status = `${chart.anchor.name} already deployed`;
      return syncDerivedState(next);
    }

    chart.stormState.anchorDeployed = true;
    chart.stormState.anchorIntegrity = chart.stormState.maxAnchorIntegrity;
    chart.stormState.status = "anchor deployed";
    chart.stormState.lastTouchedTick = next.tick;
    next.storm.anchorsDeployed += 1;
    next.storm.anchoredChartIds = uniqueList([...next.storm.anchoredChartIds, chart.id]);
    next.ladder.anchoredStormChartIds = uniqueList([...(next.ladder.anchoredStormChartIds || []), chart.id]);
    next.hazard.exposure = Math.max(0, round(next.hazard.exposure - 0.35, 3));
    next.pirate.pressure = Math.max(0, round(next.pirate.pressure - (chart.piratePressureClear || 0) * 0.25, 2));
    next.stats.stormAnchorsDeployed += 1;
    next.storm.lastOutcome = `${chart.anchor.name} deployed`;
    next.log.unshift({ tick: next.tick, message: `${chart.anchor.name} deployed for ${chart.name}.` });
    return syncDerivedState(next);
  }

  function maintainStormAnchor(state, chartId) {
    const next = syncDerivedState(clone(state));
    const chart = stormChartById(next, chartId);
    if (!chart) {
      next.storm.status = "unknown storm chart";
      return syncDerivedState(next);
    }
    if (!chart.stormState.anchorDeployed) {
      return deployStormAnchor(next, chartId);
    }
    if (!stormAnchorInRange(next, chart) && !next.station.proximity.dockable) {
      chart.stormState.status = "anchor maintenance out of range";
      next.storm.status = `${chart.anchor.name} maintenance out of range`;
      return syncDerivedState(next);
    }
    const integrityGain =
      GAME_DATA.stormCartography.anchorMaintenanceIntegrity + Math.round((next.stationServices.stormAnchorIntegrity || 0) * 0.35);
    chart.stormState.anchorIntegrity = Math.min(
      chart.stormState.maxAnchorIntegrity,
      round(chart.stormState.anchorIntegrity + integrityGain, 2)
    );
    chart.stormState.status = "anchor maintained";
    chart.stormState.lastTouchedTick = next.tick;
    next.hazard.exposure = Math.max(0, round(next.hazard.exposure - (chart.hazardMitigation || 0), 3));
    next.pirate.pressure = Math.max(0, round(next.pirate.pressure - (chart.piratePressureClear || 0) * 0.35, 2));
    next.storm.lastOutcome = `${chart.anchor.name} maintained`;
    next.log.unshift({ tick: next.tick, message: `${chart.anchor.name} maintained; storm interference dropped.` });
    return syncDerivedState(next);
  }

  function applyStormWindowBenefits(state, chart) {
    const next = state;
    (chart.convoyRouteIds || []).forEach((routeId) => {
      const route = convoyRouteById(next, routeId);
      if (!route) {
        return;
      }
      route.convoyState.ambushPressure = Math.max(0, round((route.convoyState.ambushPressure || route.ambushPressure || 0) - (chart.convoyAmbushReduction || 0), 2));
      route.convoyState.hazardExposure = Math.max(0, round((route.convoyState.hazardExposure || route.hazardExposure || 0) - (chart.convoyHazardReduction || 0), 2));
      route.convoyState.payoutCredits = Math.round(
        (route.payoutCredits || route.cargoValue || 0) * (1 + (chart.convoyPayoutBonus || 0) + (next.stationServices.stormPayoutBonus || 0))
      );
      route.convoyState.stormWindowStatus = `locked ${chart.id}`;
    });
    (chart.salvageSiteIds || []).forEach((siteId) => {
      const site = (next.salvageSites || []).find((candidate) => candidate.id === siteId);
      if (site) {
        site.salvageState.stormReroute = {
          chartId: chart.id,
          status: "window shielded",
          riskReduction: chart.salvageRiskReduction || 0,
        };
      }
    });
    return next;
  }

  function missStormWindow(state, chart, reason = "safe window missed") {
    const next = state;
    chart.stormState.status = "failed";
    chart.stormState.outcome = "failed";
    chart.stormState.failureReason = reason;
    chart.stormState.safeWindow.missed = true;
    chart.stormState.lastTouchedTick = next.tick;
    next.storm.failedChartIds = uniqueList([...next.storm.failedChartIds, chart.id]);
    next.ladder.failedStormChartIds = uniqueList([...(next.ladder.failedStormChartIds || []), chart.id]);
    next.ship.hull = Math.max(0, round(next.ship.hull - (chart.missedHullDamage || 0), 2));
    next.ship.fuel = Math.max(0, round(next.ship.fuel - (chart.missedFuelDrain || 0), 2));
    next.hazard.exposure = round(next.hazard.exposure + (chart.missedHazardExposure || 0), 3);
    next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (chart.missedPiratePressure || 0), 2));
    if (next.pirate.state === "dormant" && (chart.missedPiratePressure || 0) > 0) {
      next.pirate.state = "shadowing";
      next.pirate.encounterState = "contact";
    }
    next.storm.status = `${chart.name} failed`;
    next.storm.lastOutcome = reason;
    next.stats.stormFailures += 1;
    next.log.unshift({ tick: next.tick, message: `${chart.name} failed: ${reason}.` });
    return next;
  }

  function lockStormRouteWindow(state, chartId) {
    const next = syncDerivedState(clone(state));
    const chart = stormChartById(next, chartId);
    if (!chart) {
      next.storm.status = "unknown storm chart";
      return syncDerivedState(next);
    }
    const readiness = stormChartReadiness(next, chartId);
    if (!readiness.ready || !chart.stormState.charted || !chart.stormState.anchorDeployed) {
      chart.stormState.status = "window locked out";
      next.storm.status = `window locked out: ${readiness.missing.join(", ") || "chart and anchor required"}`;
      return syncDerivedState(next);
    }
    const timing = stormWindowTiming(chart, next);
    if (timing.pending) {
      chart.stormState.status = `window opens at ${timing.opensAt}`;
      next.storm.status = chart.stormState.status;
      return syncDerivedState(next);
    }
    if (timing.missed) {
      missStormWindow(next, chart, "safe window missed before anchor lock");
      return syncDerivedState(next);
    }
    if (chart.stormState.safeWindow.locked) {
      chart.stormState.status = "window locked";
      next.storm.status = `${chart.name} already locked`;
      return syncDerivedState(next);
    }
    chart.stormState.safeWindow.locked = true;
    chart.stormState.safeWindow.lockedAt = next.elapsed;
    chart.stormState.status = "window locked";
    chart.stormState.lastTouchedTick = next.tick;
    next.storm.activeChartId = chart.id;
    next.storm.windowsLocked += 1;
    next.stats.stormWindowsLocked += 1;
    next.hazard.exposure = Math.max(0, round(next.hazard.exposure - (chart.hazardMitigation || 0), 3));
    next.pirate.pressure = Math.max(0, round(next.pirate.pressure - (chart.piratePressureClear || 0), 2));
    applyStormWindowBenefits(next, chart);
    next.storm.lastOutcome = `${chart.name} window locked`;
    next.log.unshift({ tick: next.tick, message: `${chart.name} safe window locked through ${chart.anchor.name}.` });
    return syncDerivedState(next);
  }

  function stabilizeStormWindow(state, chartId) {
    const next = syncDerivedState(clone(state));
    const chart = stormChartById(next, chartId);
    if (!chart) {
      next.storm.status = "unknown storm chart";
      return syncDerivedState(next);
    }
    if (!chart.stormState.safeWindow.locked || chart.stormState.outcome !== "none") {
      next.storm.status = "no active storm window";
      return syncDerivedState(next);
    }
    if (!next.stationServices || next.stationServices.countermeasureCharges <= 0) {
      next.stationServices = next.stationServices || createStationServiceState();
      next.stationServices.countermeasureStatus = "no charge";
      return syncDerivedState(next);
    }
    next.stationServices.countermeasureCharges -= 1;
    next.stationServices.countermeasureStatus = "storm burst";
    chart.stormState.countermeasureUsed = true;
    chart.stormState.anchorIntegrity = Math.min(
      chart.stormState.maxAnchorIntegrity,
      round(chart.stormState.anchorIntegrity + GAME_DATA.stormCartography.countermeasureIntegrity, 2)
    );
    chart.stormState.safeWindow.closesAt = round(
      chart.stormState.safeWindow.closesAt + GAME_DATA.stormCartography.countermeasureWindowBonus,
      2
    );
    next.hazard.exposure = Math.max(0, round(next.hazard.exposure - GAME_DATA.stormCartography.countermeasureHazardClear, 3));
    next.pirate.pressure = Math.max(0, round(next.pirate.pressure - 18, 2));
    next.stats.countermeasuresDeployed += 1;
    next.stats.stormCountermeasures += 1;
    next.storm.lastOutcome = `${chart.name} stabilized`;
    applyStormWindowBenefits(next, chart);
    next.log.unshift({ tick: next.tick, message: `Countermeasure stabilized ${chart.name}.` });
    return syncDerivedState(next);
  }

  function rerouteStormSalvage(state, siteId, chartId) {
    const next = syncDerivedState(clone(state));
    const chart = stormChartById(next, chartId);
    const site = (next.salvageSites || []).find((candidate) => candidate.id === siteId);
    if (!chart || !site) {
      next.storm.status = "unknown storm salvage reroute";
      return syncDerivedState(next);
    }
    if (!chart.stormState.safeWindow.locked || chart.stormState.outcome !== "none" || !(chart.salvageSiteIds || []).includes(site.id)) {
      next.storm.status = `${site.name} has no storm window`;
      return syncDerivedState(next);
    }
    site.salvageState.stormReroute = {
      chartId: chart.id,
      status: "rerouted",
      riskReduction: chart.salvageRiskReduction || 0,
    };
    chart.stormState.salvageReroutes = uniqueList([...(chart.stormState.salvageReroutes || []), site.id]);
    next.storm.salvageReroutes += 1;
    next.stats.stormSalvageReroutes += 1;
    next.hazard.exposure = Math.max(0, round(next.hazard.exposure - (chart.hazardMitigation || 0) * 0.5, 3));
    next.pirate.pressure = Math.max(0, round(next.pirate.pressure - (chart.piratePressureClear || 0) * 0.5, 2));
    next.salvage.lastOutcome = `${site.name} storm reroute`;
    next.storm.lastOutcome = `${site.name} rerouted through ${chart.name}`;
    next.log.unshift({ tick: next.tick, message: `${site.name} rerouted through ${chart.name}.` });
    return syncDerivedState(next);
  }

  function resolveStormWindow(state, chartId) {
    const next = syncDerivedState(clone(state));
    const chart = stormChartById(next, chartId);
    if (!chart) {
      next.storm.status = "unknown storm chart";
      return syncDerivedState(next);
    }
    if (["complete", "partial", "failed"].includes(chart.stormState.outcome)) {
      return syncDerivedState(next);
    }
    if (!chart.stormState.safeWindow.locked) {
      if (stormWindowTiming(chart, next).missed) {
        missStormWindow(next, chart, "safe window missed before route lock");
      } else {
        next.storm.status = `${chart.name} window not locked`;
      }
      return syncDerivedState(next);
    }
    if (chart.stormState.anchorIntegrity <= (chart.failureIntegrity || 0)) {
      missStormWindow(next, chart, "relay anchor collapsed");
      return syncDerivedState(next);
    }
    const partial =
      chart.stormState.anchorIntegrity < (chart.partialIntegrity || chart.stormState.maxAnchorIntegrity * 0.6) ||
      (next.elapsed || 0) > (chart.stormState.safeWindow.closesAt || 0);
    const payoutRate = partial ? chart.partialPayoutRate || 0.5 : 1;
    const payout = Math.round((chart.stormState.payoutCredits || chart.rewardCredits || 0) * payoutRate * (1 + (next.stationServices.stormPayoutBonus || 0)));
    chart.stormState.status = partial ? "partial" : "complete";
    chart.stormState.outcome = partial ? "partial" : "complete";
    chart.stormState.deliveredValue = payout;
    chart.stormState.partialPayoutCredits = partial ? payout : 0;
    chart.stormState.failureReason = partial ? "anchor losses narrowed the storm window" : null;
    chart.stormState.lastTouchedTick = next.tick;
    next.storm.completedChartIds = uniqueList([...next.storm.completedChartIds, chart.id]);
    next.ladder.completedStormChartIds = uniqueList([...(next.ladder.completedStormChartIds || []), chart.id]);
    if (partial) {
      next.storm.partialChartIds = uniqueList([...next.storm.partialChartIds, chart.id]);
      next.ladder.partialStormChartIds = uniqueList([...(next.ladder.partialStormChartIds || []), chart.id]);
      next.stats.stormPartialPayouts += 1;
    }
    next.storm.payoutBanked += payout;
    next.storm.stormScore += partial ? Math.ceil((chart.ladderScore || 0) * 0.55) : chart.ladderScore || 0;
    next.ladder.stormScore += partial ? Math.ceil((chart.ladderScore || 0) * 0.55) : chart.ladderScore || 0;
    next.credits += payout;
    next.contract.deliveredStormPayout = (next.contract.deliveredStormPayout || 0) + payout;
    next.stats.stormPayouts += payout;
    next.storm.status = `${chart.name} ${chart.stormState.status}`;
    next.storm.lastOutcome = `${payout}cr ${chart.stormState.status}`;
    next.log.unshift({
      tick: next.tick,
      message: `${chart.name} ${partial ? "held partially" : "held"} for ${payout} credits.`,
    });
    return syncDerivedState(next);
  }

  function salvageRisk(site, state) {
    const confidenceGap = Math.max(0, (site.confidenceThreshold || 0.65) - site.salvageState.scanConfidence);
    const phaseRisk = (site.riskPhase || 0) * 0.08;
    return round(
      clamp(
        (site.volatility || 0) +
          confidenceGap +
          phaseRisk -
          (state.salvage.riskMitigation || 0) -
          stormSalvageRiskMitigation(site, state) +
          interdictionSalvageRiskModifier(site, state) +
          signalGateSalvageRiskModifier(site, state),
        0,
        1.5
      ),
      3
    );
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
      if (target.family === "manifest") {
        next.ladder.salvageManifestIds = uniqueList([...(next.ladder.salvageManifestIds || []), target.id]);
      }
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
    if (!["failed", "depleted", "abandoned"].includes(target.salvageState.status)) {
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
      (state.contract.deliveredRelics || 0) >= (state.contract.requiredRelics || 0) &&
      (state.contract.deliveredStormCharts || 0) >= (state.contract.requiredStormCharts || 0) &&
      (state.contract.deliveredStormPayout || 0) >= (state.contract.requiredStormPayout || 0) &&
      (state.contract.deliveredInterdictions || 0) >= (state.contract.requiredInterdictions || 0) &&
      (state.contract.deliveredInterdictionPayout || 0) >= (state.contract.requiredInterdictionPayout || 0) &&
      (state.contract.deliveredSignalTransits || 0) >= (state.contract.requiredSignalTransits || 0) &&
      (state.contract.deliveredSignalPayout || 0) >= (state.contract.requiredSignalPayout || 0)
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
      if ((sector.requiredStormCharts || 0) > 0 && (next.contract.deliveredStormCharts || 0) >= sector.requiredStormCharts) {
        next.ladder.stormScore += sector.stormReward || 0;
      }
      if (
        (sector.requiredInterdictions || 0) > 0 &&
        (next.contract.deliveredInterdictions || 0) >= sector.requiredInterdictions
      ) {
        next.ladder.interdictionScore += Math.ceil((sector.stormReward || sector.surveyReward || 0) * 0.75);
      }
      if (
        (sector.requiredSignalTransits || 0) > 0 &&
        (next.contract.deliveredSignalTransits || 0) >= sector.requiredSignalTransits
      ) {
        next.ladder.signalScore += sector.signalReward || Math.ceil((sector.surveyReward || 0) * 0.8);
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

  function launchFromStation(state) {
    const next = syncDerivedState(clone(state));
    if (!next.station.docked) {
      return next;
    }
    const forward = forwardVector(next.ship.heading || 0);
    const launchOffset = next.station.dockingRadius + 4;
    next.station.docked = false;
    next.station.lastService = "launched";
    next.ship.position = add(next.station.position, scale(forward, launchOffset));
    next.ship.velocity = scale(forward, 1.2);
    next.log.unshift({ tick: next.tick, message: "Launch clamps released from Frontier Spoke." });
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
    next.stationServices.convoyEscortIntegrity += service.convoyEscortIntegrity || 0;
    next.stationServices.convoyAmbushMitigation += service.convoyAmbushMitigation || 0;
    next.stationServices.convoyPayoutBonus += service.convoyPayoutBonus || 0;
    next.stationServices.stormScanBonus += service.stormScanBonus || 0;
    next.stationServices.stormAnchorIntegrity += service.stormAnchorIntegrity || 0;
    next.stationServices.stormWindowBonus += service.stormWindowBonus || 0;
    next.stationServices.stormHazardMitigation += service.stormHazardMitigation || 0;
    next.stationServices.stormPayoutBonus += service.stormPayoutBonus || 0;
    next.stationServices.interdictionScanBonus += service.interdictionScanBonus || 0;
    next.stationServices.interdictionResponseWindowBonus += service.interdictionResponseWindowBonus || 0;
    next.stationServices.interdictionRaidMitigation += service.interdictionRaidMitigation || 0;
    next.stationServices.interdictionPayoutBonus += service.interdictionPayoutBonus || 0;
    next.stationServices.interdictionSupportIntegrity += service.interdictionSupportIntegrity || 0;
    next.stationServices.signalScanBonus += service.signalScanBonus || 0;
    next.stationServices.signalPylonIntegrity += service.signalPylonIntegrity || 0;
    next.stationServices.signalCapacitorBonus += service.signalCapacitorBonus || 0;
    next.stationServices.signalTransitWindowBonus += service.signalTransitWindowBonus || 0;
    next.stationServices.signalJamMitigation += service.signalJamMitigation || 0;
    next.stationServices.signalPayoutBonus += service.signalPayoutBonus || 0;
    next.stationServices.lastService = `${service.name} purchased`;
    next.log.unshift({ tick: next.tick, message: `${service.name} purchased for the next survey push.` });
    return syncDerivedState(next);
  }

  function deployCountermeasure(state) {
    if (state.convoy && state.convoy.activeRouteId) {
      return deployConvoyCountermeasure(state);
    }
    if (state.storm && state.storm.activeChartId) {
      const chart = stormChartById(state, state.storm.activeChartId);
      if (chart && chart.stormState.safeWindow.locked && chart.stormState.outcome === "none") {
        return stabilizeStormWindow(state, chart.id);
      }
    }
    if (state.interdiction && state.interdiction.activeCellId) {
      const cell = interdictionCellById(state, state.interdiction.activeCellId);
      if (cell && cell.interdictionState.transponderScanned && cell.interdictionState.outcome === "none") {
        return deployInterdictionLure(state, cell.id);
      }
    }
    if (state.signalGate && state.signalGate.activeGateId) {
      const gate = signalGateById(state, state.signalGate.activeGateId);
      if (gate && gate.gateState.harmonicsScanned && gate.gateState.outcome === "none") {
        return mitigateSignalGateJam(state, gate.id);
      }
    }
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

  function signalGateInRange(state, gate, range, point = "gate") {
    const targetPosition = point === "pylon" && gate.pylon ? gate.pylon.position : gate.position;
    const targetRadius = point === "pylon" && gate.pylon ? gate.pylon.radius || 0 : gate.radius || 0;
    return distance(state.ship.position, targetPosition) <= range + targetRadius;
  }

  function scanSignalGateHarmonics(state, gateId = null, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 2));
    const next = syncDerivedState(clone(state));
    if (next.run.status === "failed" || next.run.status === "complete") {
      next.signalGate.status = "run closed";
      return syncDerivedState(next);
    }
    const target = gateId ? signalGateById(next, gateId) : findTarget(next);
    if (!target || (gateId === null && next.target.kind !== "signal-gate")) {
      next.signalGate.status = "no signal gate lock";
      return syncDerivedState(next);
    }
    const readiness = signalGateReadiness(next, target.id);
    if (!readiness.ready) {
      target.gateState.status = "locked";
      next.signalGate.status = `locked: ${readiness.missing.join(", ")}`;
      return syncDerivedState(next);
    }
    if (!signalGateInRange(next, target, next.signalGate.scanRange)) {
      next.signalGate.status = "out of harmonic range";
      return syncDerivedState(next);
    }
    if (target.gateState.harmonicsScanned) {
      target.gateState.status = "harmonics scanned";
      next.signalGate.status = `${target.name} already scanned`;
      return syncDerivedState(next);
    }

    target.gateState.status = "scanning";
    target.gateState.progress += next.signalGate.scanPower * dt;
    target.gateState.lastTouchedTick = next.tick;
    next.scanning.active = true;
    next.scanning.targetId = target.id;
    next.scanning.lastScan = clamp(target.gateState.progress / target.harmonicDifficulty, 0, 1);
    next.scanning.status = `gate harmonics ${Math.round(next.scanning.lastScan * 100)}%`;
    if (target.gateState.progress >= target.harmonicDifficulty) {
      target.gateState.progress = target.harmonicDifficulty;
      target.gateState.harmonicsScanned = true;
      target.gateState.status = "harmonics scanned";
      next.signalGate.scannedGateIds = uniqueList([...next.signalGate.scannedGateIds, target.id]);
      next.ladder.scannedSignalGateIds = uniqueList([...(next.ladder.scannedSignalGateIds || []), target.id]);
      next.signalGate.scansCompleted += 1;
      next.stats.signalGateScans += 1;
      next.pirate.state = next.pirate.state === "dormant" ? "shadowing" : next.pirate.state;
      next.pirate.encounterState = next.pirate.encounterState === "distant" ? "contact" : next.pirate.encounterState;
      next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (target.pirateGateJam || 0) * 0.08, 2));
      next.signalGate.lastOutcome = `${target.name} harmonics scanned`;
      next.log.unshift({ tick: next.tick, message: `${target.name} harmonics scanned into Signal Gate Expedition.` });
    }
    return syncDerivedState(next);
  }

  function alignSignalGatePylon(state, gateId) {
    const next = syncDerivedState(clone(state));
    const gate = signalGateById(next, gateId);
    if (!gate) {
      next.signalGate.status = "unknown signal gate";
      return syncDerivedState(next);
    }
    const readiness = signalGateReadiness(next, gate.id);
    if (!readiness.ready || !gate.gateState.harmonicsScanned) {
      gate.gateState.status = "pylon locked";
      next.signalGate.status = `pylon locked: ${readiness.missing.join(", ") || "scan harmonics"}`;
      return syncDerivedState(next);
    }
    const range = gate.pylonAlignRange || next.signalGate.pylonAlignRange;
    if (!signalGateInRange(next, gate, range, "pylon") && !next.station.proximity.dockable) {
      gate.gateState.status = "pylon out of range";
      next.signalGate.status = `${gate.pylon.name} out of range`;
      return syncDerivedState(next);
    }
    if (gate.gateState.pylonAligned) {
      gate.gateState.status = "pylon aligned";
      next.signalGate.status = `${gate.pylon.name} already aligned`;
      return syncDerivedState(next);
    }

    gate.gateState.pylonAligned = true;
    gate.gateState.pylonIntegrity = gate.gateState.maxPylonIntegrity;
    gate.gateState.status = "pylon aligned";
    gate.gateState.lastTouchedTick = next.tick;
    next.signalGate.alignedGateIds = uniqueList([...next.signalGate.alignedGateIds, gate.id]);
    next.ladder.alignedSignalGateIds = uniqueList([...(next.ladder.alignedSignalGateIds || []), gate.id]);
    next.signalGate.pylonsAligned += 1;
    next.hazard.exposure = Math.max(0, round(next.hazard.exposure - 0.3, 3));
    next.pirate.pressure = Math.max(0, round(next.pirate.pressure - (gate.piratePressureClear || 0) * 0.25, 2));
    next.stats.signalPylonsAligned += 1;
    next.signalGate.lastOutcome = `${gate.pylon.name} aligned`;
    next.log.unshift({ tick: next.tick, message: `${gate.pylon.name} aligned for ${gate.name}.` });
    return syncDerivedState(next);
  }

  function chargeSignalGateCapacitor(state, gateId, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 3));
    const next = syncDerivedState(clone(state));
    const gate = signalGateById(next, gateId);
    if (!gate) {
      next.signalGate.status = "unknown signal gate";
      return syncDerivedState(next);
    }
    const readiness = signalGateReadiness(next, gate.id);
    if (!readiness.ready || !gate.gateState.harmonicsScanned || !gate.gateState.pylonAligned) {
      gate.gateState.status = "capacitor locked";
      next.signalGate.status = `capacitor locked: ${readiness.missing.join(", ") || "scan and align pylon"}`;
      return syncDerivedState(next);
    }
    if (!signalGateInRange(next, gate, next.signalGate.capacitorRange) && !next.station.proximity.dockable) {
      gate.gateState.status = "capacitor out of range";
      next.signalGate.status = `${gate.name} capacitor out of range`;
      return syncDerivedState(next);
    }
    if (gate.gateState.capacitorCharge >= gate.gateState.capacitorRequirement) {
      gate.gateState.status = "capacitor charged";
      next.signalGate.status = `${gate.name} capacitor charged`;
      return syncDerivedState(next);
    }
    const fuelCost = (gate.chargeFuelCost || GAME_DATA.signalGateExpedition.chargeFuelCost) * dt;
    if (next.ship.fuel <= 0 || next.ship.fuel < fuelCost * 0.35) {
      gate.gateState.status = "capacitor fuel starved";
      next.signalGate.status = `${gate.name} needs fuel to charge`;
      return syncDerivedState(next);
    }

    const wasCharged = gate.gateState.capacitorCharge >= gate.gateState.capacitorRequirement;
    const chargeGain = ((gate.chargeRate || GAME_DATA.signalGateExpedition.baseChargeRate) + (next.signalGate.capacitorBonus || 0)) * dt;
    next.ship.fuel = Math.max(0, round(next.ship.fuel - fuelCost, 2));
    gate.gateState.capacitorCharge = round(
      Math.min(gate.gateState.capacitorRequirement, gate.gateState.capacitorCharge + chargeGain),
      2
    );
    gate.gateState.lastTouchedTick = next.tick;
    next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (gate.pirateGateJam || 0) * 0.015 * dt, 2));
    if (!wasCharged && gate.gateState.capacitorCharge >= gate.gateState.capacitorRequirement) {
      gate.gateState.status = "capacitor charged";
      next.signalGate.chargedGateIds = uniqueList([...next.signalGate.chargedGateIds, gate.id]);
      next.ladder.chargedSignalGateIds = uniqueList([...(next.ladder.chargedSignalGateIds || []), gate.id]);
      next.signalGate.capacitorsCharged += 1;
      next.stats.signalCapacitorsCharged += 1;
      next.signalGate.lastOutcome = `${gate.name} capacitor charged`;
      next.log.unshift({ tick: next.tick, message: `${gate.name} capacitor charged for transit.` });
    } else {
      gate.gateState.status = `capacitor ${round(gate.gateState.capacitorCharge, 1)}/${gate.gateState.capacitorRequirement}`;
    }
    return syncDerivedState(next);
  }

  function anchorSignalGateStormWindow(state, gateId, chartId = null) {
    const next = syncDerivedState(clone(state));
    const gate = signalGateById(next, gateId);
    if (!gate) {
      next.signalGate.status = "unknown signal gate";
      return syncDerivedState(next);
    }
    const readiness = signalGateReadiness(next, gate.id);
    if (!readiness.ready || !gate.gateState.pylonAligned) {
      gate.gateState.status = "storm anchor locked";
      next.signalGate.status = `storm anchor locked: ${readiness.missing.join(", ") || "align pylon"}`;
      return syncDerivedState(next);
    }
    const chart =
      (chartId ? stormChartById(next, chartId) : null) ||
      (gate.stormChartIds || [])
        .map((candidateId) => stormChartById(next, candidateId))
        .find((candidate) => candidate && candidate.stormState.safeWindow.locked && candidate.stormState.outcome === "none");
    if (!chart || !(gate.stormChartIds || []).includes(chart.id) || !chart.stormState.safeWindow.locked) {
      gate.gateState.status = "storm window unavailable";
      next.signalGate.status = `${gate.name} needs a locked storm window`;
      return syncDerivedState(next);
    }
    if (gate.gateState.stormWindowAnchoredChartId) {
      next.signalGate.status = `${gate.name} already anchored to ${gate.gateState.stormWindowAnchoredChartId}`;
      return syncDerivedState(next);
    }

    gate.gateState.stormWindowAnchoredChartId = chart.id;
    gate.gateState.transitWindow.anchoredChartId = chart.id;
    gate.gateState.transitWindow.closesAt = round(
      (gate.gateState.transitWindow.closesAt || 0) + (gate.stormWindowBonus || 0) + (next.signalGate.transitWindowBonus || 0),
      2
    );
    gate.gateState.pylonIntegrity = Math.min(
      gate.gateState.maxPylonIntegrity,
      round((gate.gateState.pylonIntegrity || 0) + (gate.stormAnchorIntegrity || 0), 2)
    );
    chart.stormState.anchorIntegrity = Math.max(0, round(chart.stormState.anchorIntegrity - 2, 2));
    next.hazard.exposure = Math.max(0, round(next.hazard.exposure - (chart.hazardMitigation || 0) * 0.4, 3));
    next.signalGate.lastOutcome = `${gate.name} anchored to ${chart.name}`;
    next.log.unshift({ tick: next.tick, message: `${gate.name} transit window anchored to ${chart.name}.` });
    return syncDerivedState(next);
  }

  function mitigateSignalGateJam(state, gateId) {
    const next = syncDerivedState(clone(state));
    const gate = signalGateById(next, gateId);
    if (!gate) {
      next.signalGate.status = "unknown signal gate";
      return syncDerivedState(next);
    }
    const readiness = signalGateReadiness(next, gate.id);
    if (!readiness.ready || !gate.gateState.harmonicsScanned) {
      gate.gateState.status = "jam mitigation locked";
      next.signalGate.status = `jam mitigation locked: ${readiness.missing.join(", ") || "scan harmonics"}`;
      return syncDerivedState(next);
    }
    if (!next.stationServices || next.stationServices.countermeasureCharges <= 0) {
      next.stationServices = next.stationServices || createStationServiceState();
      next.stationServices.countermeasureStatus = "no gate burst";
      return syncDerivedState(next);
    }

    next.stationServices.countermeasureCharges -= 1;
    next.stationServices.countermeasureStatus = "signal gate burst";
    gate.gateState.countermeasureUsed = true;
    gate.gateState.pirateJam = Math.max(
      0,
      round((gate.gateState.pirateJam || gate.pirateGateJam || 0) - GAME_DATA.signalGateExpedition.countermeasureJamReduction, 2)
    );
    gate.gateState.capacitorCharge = round(
      Math.min(
        gate.gateState.capacitorRequirement,
        gate.gateState.capacitorCharge + GAME_DATA.signalGateExpedition.countermeasureCapacitorCharge
      ),
      2
    );
    next.pirate.pressure = Math.max(0, round(next.pirate.pressure - GAME_DATA.signalGateExpedition.countermeasurePressureDrop, 2));
    next.signalGate.pirateJamsMitigated += 1;
    next.stats.countermeasuresDeployed += 1;
    next.stats.signalGateJamsMitigated += 1;
    next.signalGate.lastOutcome = `${gate.name} jam mitigated`;
    next.log.unshift({ tick: next.tick, message: `Countermeasure burst cleared pirate gate interference around ${gate.name}.` });
    return syncDerivedState(next);
  }

  function forceSignalGateOpen(state, gateId) {
    const next = syncDerivedState(clone(state));
    const gate = signalGateById(next, gateId);
    if (!gate) {
      next.signalGate.status = "unknown signal gate";
      return syncDerivedState(next);
    }
    const readiness = signalGateReadiness(next, gate.id);
    if (!readiness.ready || !gate.gateState.harmonicsScanned || !gate.gateState.pylonAligned) {
      gate.gateState.status = "force locked";
      next.signalGate.status = `force locked: ${readiness.missing.join(", ") || "scan and align pylon"}`;
      return syncDerivedState(next);
    }
    if (gate.gateState.capacitorCharge < gate.gateState.capacitorRequirement) {
      gate.gateState.status = "force needs capacitor";
      next.signalGate.status = `${gate.name} capacitor not charged`;
      return syncDerivedState(next);
    }
    const fuelCost = gate.forceFuelCost || (gate.transitFuelCost || 0) + 8;
    next.ship.fuel = Math.max(0, round(next.ship.fuel - fuelCost, 2));
    next.ship.hull = Math.max(0, round(next.ship.hull - Math.max(4, (gate.failureHullDamage || 0) * 0.35), 2));
    gate.gateState.transitWindow.forced = true;
    gate.gateState.transitWindow.opensAt = Math.min(gate.gateState.transitWindow.opensAt || next.elapsed, next.elapsed);
    gate.gateState.transitWindow.closesAt = Math.max(gate.gateState.transitWindow.closesAt || 0, next.elapsed + 3);
    gate.gateState.pirateJam = round((gate.gateState.pirateJam || gate.pirateGateJam || 0) + 12, 2);
    gate.gateState.status = "forced open";
    next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (gate.failurePressure || 0) * 0.45, 2));
    next.signalGate.lastOutcome = `${gate.name} forced open`;
    next.log.unshift({ tick: next.tick, message: `${gate.name} forced open against pirate gate interference.` });
    return syncDerivedState(next);
  }

  function abortSignalGateTransit(state, gateId) {
    const next = syncDerivedState(clone(state));
    const gate = signalGateById(next, gateId);
    if (!gate) {
      next.signalGate.status = "unknown signal gate";
      return syncDerivedState(next);
    }
    if (gate.gateState.outcome !== "none" || gate.gateState.capacitorCharge <= 0) {
      next.signalGate.status = `${gate.name} has no pending transit`;
      return syncDerivedState(next);
    }
    gate.gateState.capacitorCharge = Math.max(0, round(gate.gateState.capacitorCharge - Math.max(1, gate.gateState.capacitorRequirement * 0.45), 2));
    gate.gateState.transitWindow.abortedAt = next.elapsed;
    gate.gateState.status = "transit aborted";
    gate.gateState.lastTouchedTick = next.tick;
    next.signalGate.abortedTransits += 1;
    next.stats.signalGateAborts += 1;
    next.pirate.pressure = Math.max(0, round(next.pirate.pressure - (gate.piratePressureClear || 0) * 0.3, 2));
    next.signalGate.lastOutcome = `${gate.name} transit aborted`;
    next.log.unshift({ tick: next.tick, message: `${gate.name} transit aborted before convoy commitment.` });
    return syncDerivedState(next);
  }

  function signalGateTransitPower(state, gate, transitMode = "convoy") {
    const pylonPower = (gate.gateState.pylonIntegrity || 0) * 0.25;
    const capacitorPower = (gate.gateState.capacitorCharge || 0) * 8;
    const stationPower =
      (state.stationServices.signalJamMitigation || 0) * 100 +
      (state.stationServices.signalPylonIntegrity || 0) * 0.35 +
      (state.stationServices.signalCapacitorBonus || 0) * 8;
    const stormPower = gate.gateState.stormWindowAnchoredChartId ? 18 : 0;
    const convoyPower =
      transitMode === "convoy"
        ? (gate.convoyRouteIds || []).reduce((score, routeId) => {
            const route = convoyRouteById(state, routeId);
            if (!route) {
              return score;
            }
            const beaconScore = route.beaconState.deployed ? 10 : 0;
            const escortScore = route.convoyState ? Math.min(24, (route.convoyState.escortIntegrity || 0) * 0.22) : 0;
            const completedScore = (state.ladder.completedConvoyRouteIds || []).includes(routeId) ? 14 : 0;
            return score + Math.max(beaconScore + escortScore, completedScore);
          }, 0)
        : 0;
    const salvagePower = (gate.salvageSiteIds || []).reduce((score, siteId) => {
      const manifestReady = currentSalvageManifestIds(state).includes(siteId);
      return score + (manifestReady ? 8 : 0);
    }, 0);
    const interdictionPower = (state.interdictionCells || []).reduce((score, cell) => {
      if (!(cell.convoyRouteIds || []).some((routeId) => (gate.convoyRouteIds || []).includes(routeId))) {
        return score;
      }
      return score + (["success", "partial"].includes(cell.interdictionState.outcome) ? 10 : 0);
    }, 0);
    const shipPower = (state.ship.fuel > (gate.transitFuelCost || 0) ? 8 : 0) + (state.ship.hull > 55 ? 6 : 0);
    return round(18 + pylonPower + capacitorPower + stationPower + stormPower + convoyPower + salvagePower + interdictionPower + shipPower, 2);
  }

  function signalGateJamPressure(state, gate, forced = false) {
    const stationReduction = (state.stationServices.signalJamMitigation || 0) * 100;
    const pressureJam = (state.pirate.pressure || 0) * (gate.jamPressureScale || 0.32);
    const forcedJam = forced ? 14 : 0;
    return round(Math.max(1, (gate.gateState.pirateJam || gate.pirateGateJam || 0) + pressureJam + forcedJam - stationReduction), 2);
  }

  function settleSignalGateConvoyRoute(state, gate, route, outcome) {
    const next = state;
    if (!route || !route.convoyState || !route.beaconState.deployed || ["delivered", "partial", "failed"].includes(route.convoyState.status)) {
      return next;
    }
    const success = outcome === "success";
    const partial = outcome === "partial";
    if (success || partial) {
      const payoutRate = success ? 1 : route.partialPayoutRate || 0.5;
      const payout = Math.round(
        (route.convoyState.payoutCredits || route.payoutCredits || route.cargoValue) *
          payoutRate *
          (1 + (next.stationServices.convoyPayoutBonus || 0) + (gate.convoyTransitPayoutBonus || 0))
      );
      route.convoyState.status = success ? "delivered" : "partial";
      route.convoyState.progress = 1;
      route.convoyState.position = clone(route.endPosition || route.beacon.position);
      route.convoyState.deliveredValue = payout;
      route.convoyState.completedAt = next.tick;
      route.convoyState.failureReason = partial ? "gate jam narrowed the convoy transit" : null;
      route.convoyState.signalGateStatus = `${gate.id} ${outcome}`;
      next.convoy.activeRouteId = next.convoy.activeRouteId === route.id ? null : next.convoy.activeRouteId;
      next.convoy.completedRouteIds = uniqueList([...next.convoy.completedRouteIds, route.id]);
      next.ladder.completedConvoyRouteIds = uniqueList([...(next.ladder.completedConvoyRouteIds || []), route.id]);
      if (partial) {
        next.convoy.partialRouteIds = uniqueList([...next.convoy.partialRouteIds, route.id]);
        next.stats.convoyPartialPayouts += 1;
      }
      next.convoy.payoutBanked += payout;
      next.convoy.convoyScore += partial ? Math.ceil((route.ladderScore || 0) * 0.55) : route.ladderScore || 0;
      next.ladder.convoyScore += partial ? Math.ceil((route.ladderScore || 0) * 0.55) : route.ladderScore || 0;
      next.credits += payout;
      next.contract.deliveredConvoyValue = (next.contract.deliveredConvoyValue || 0) + payout;
      next.stats.convoyPayouts += payout;
      next.signalGate.convoyTransits += 1;
      next.stats.signalGateConvoyTransits += 1;
      return next;
    }
    route.convoyState.status = "failed";
    route.convoyState.failureReason = "pirate gate jam scattered the convoy transit";
    route.convoyState.completedAt = next.tick;
    route.convoyState.escortIntegrity = Math.max(0, round((route.convoyState.escortIntegrity || 0) - (gate.pirateGateJam || 0) * 0.25, 2));
    route.convoyState.signalGateStatus = `${gate.id} failed`;
    next.convoy.failedRouteIds = uniqueList([...next.convoy.failedRouteIds, route.id]);
    next.stats.convoyFailures += 1;
    return next;
  }

  function applySignalGateOutcomeCoupling(state, gate, outcome, transitMode, payout) {
    const next = state;
    const success = outcome === "success";
    const partial = outcome === "partial";
    (gate.convoyRouteIds || []).forEach((routeId) => {
      const route = convoyRouteById(next, routeId);
      if (!route || !route.convoyState) {
        return;
      }
      if (success || partial) {
        const scaleValue = success ? 1 : 0.5;
        route.convoyState.ambushPressure = Math.max(
          0,
          round((route.convoyState.ambushPressure || route.ambushPressure || 0) - (gate.convoyAmbushReduction || 0) * scaleValue, 2)
        );
        route.convoyState.hazardExposure = Math.max(
          0,
          round((route.convoyState.hazardExposure || route.hazardExposure || 0) - (gate.convoyHazardReduction || 0) * scaleValue, 2)
        );
        route.convoyState.signalGateStatus = `${gate.id} ${outcome}`;
        if (transitMode === "convoy") {
          settleSignalGateConvoyRoute(next, gate, route, outcome);
        }
      } else {
        route.convoyState.ambushPressure = round((route.convoyState.ambushPressure || route.ambushPressure || 0) + (gate.failurePressure || 0) * 0.45, 2);
        route.convoyState.signalGateStatus = `${gate.id} failed`;
        if (transitMode === "convoy") {
          settleSignalGateConvoyRoute(next, gate, route, outcome);
        }
      }
    });
    (gate.salvageSiteIds || []).forEach((siteId) => {
      const site = (next.salvageSites || []).find((candidate) => candidate.id === siteId);
      if (!site || !site.salvageState) {
        return;
      }
      if (success || partial) {
        site.salvageState.signalGateShield = {
          gateId: gate.id,
          status: success ? "transit shielded" : "partially shielded",
          riskReduction: (gate.salvageRiskReduction || 0) * (success ? 1 : 0.5),
        };
      } else {
        site.salvageState.signalGateRaid = {
          gateId: gate.id,
          status: "jam raided",
          lostValue: Math.round((site.rewardValue || 0) * 0.18),
        };
        site.salvageState.scanConfidence = Math.max(0, round((site.salvageState.scanConfidence || 0) - 0.14, 3));
      }
    });
    if (success) {
      next.ship.fuel = Math.max(0, round(next.ship.fuel - (gate.transitFuelCost || 0), 2));
      next.pirate.pressure = Math.max(0, round(next.pirate.pressure - (gate.piratePressureClear || 0), 2));
      next.hazard.exposure = Math.max(0, round(next.hazard.exposure - (gate.convoyHazardReduction || 0) * 0.45, 3));
    } else if (partial) {
      next.ship.hull = Math.max(0, round(next.ship.hull - (gate.failureHullDamage || 0) * 0.45, 2));
      next.ship.fuel = Math.max(0, round(next.ship.fuel - (gate.failureFuelDrain || 0) * 0.55, 2));
      next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (gate.failurePressure || 0) * 0.35, 2));
    } else {
      next.ship.hull = Math.max(0, round(next.ship.hull - (gate.failureHullDamage || 0), 2));
      next.ship.fuel = Math.max(0, round(next.ship.fuel - (gate.failureFuelDrain || 0), 2));
      next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (gate.failurePressure || 0), 2));
    }
    if (outcome === "failed" && next.cargo.ore > 0 && (gate.cargoLoss || 0) > 0) {
      const lost = Math.min(next.cargo.ore, gate.cargoLoss || 0);
      const averageValue = next.cargo.ore > 0 ? Math.ceil(next.cargo.value / next.cargo.ore) : 0;
      next.cargo.ore -= lost;
      next.cargo.value = Math.max(0, next.cargo.value - averageValue * lost);
      next.stats.oreLost += lost;
    }
    if (payout > 0) {
      next.credits += payout;
    }
    return next;
  }

  function commitSignalGateTransit(state, gateId, transitMode = "convoy") {
    const next = syncDerivedState(clone(state));
    const gate = signalGateById(next, gateId);
    if (!gate) {
      next.signalGate.status = "unknown signal gate";
      return syncDerivedState(next);
    }
    if (["success", "partial", "failed"].includes(gate.gateState.outcome)) {
      return syncDerivedState(next);
    }
    const readiness = signalGateReadiness(next, gate.id);
    if (!readiness.ready || !gate.gateState.harmonicsScanned || !gate.gateState.pylonAligned) {
      gate.gateState.status = "transit locked";
      next.signalGate.status = `transit locked: ${readiness.missing.join(", ") || "scan and align pylon"}`;
      return syncDerivedState(next);
    }
    if (gate.gateState.capacitorCharge < gate.gateState.capacitorRequirement) {
      gate.gateState.status = "capacitor not charged";
      next.signalGate.status = `${gate.name} capacitor not charged`;
      return syncDerivedState(next);
    }
    if (!signalGateInRange(next, gate, next.signalGate.transitRange) && !next.station.proximity.dockable) {
      gate.gateState.status = "transit out of range";
      next.signalGate.status = `${gate.name} transit out of range`;
      return syncDerivedState(next);
    }
    const timing = signalGateTransitTiming(gate, next);
    if (timing.pending && !timing.forced) {
      gate.gateState.status = `transit opens at ${timing.opensAt}`;
      next.signalGate.status = gate.gateState.status;
      return syncDerivedState(next);
    }
    const forced = timing.forced || timing.missed;
    const transitPower = signalGateTransitPower(next, gate, transitMode);
    const jamPressure = signalGateJamPressure(next, gate, forced);
    let outcome = "failed";
    if (!timing.missed && transitPower >= jamPressure) {
      outcome = "success";
    } else if (transitPower >= jamPressure * 0.58 || gate.gateState.countermeasureUsed || gate.gateState.stormWindowAnchoredChartId) {
      outcome = "partial";
    }
    const payoutRate = outcome === "success" ? 1 : outcome === "partial" ? gate.partialPayoutRate || 0.5 : 0;
    const payout = Math.round((gate.gateState.payoutCredits || gate.payoutCredits || 0) * payoutRate * (1 + (next.stationServices.signalPayoutBonus || 0)));

    gate.gateState.status = outcome;
    gate.gateState.outcome = outcome;
    gate.gateState.deliveredValue = payout;
    gate.gateState.partialPayoutCredits = outcome === "partial" ? payout : 0;
    gate.gateState.failureReason =
      outcome === "success"
        ? null
        : outcome === "partial"
          ? "pirate gate interference clipped the transit corridor"
          : "pirate gate interference collapsed the transit";
    gate.gateState.transitWindow.committed = true;
    gate.gateState.transitWindow.committedAt = next.elapsed;
    gate.gateState.convoyTransitCommitted = transitMode === "convoy";
    gate.gateState.lastTouchedTick = next.tick;
    next.signalGate.transitsResolved += 1;
    next.stats.signalGateTransits += 1;
    next.signalGate.transitGateIds = uniqueList([...next.signalGate.transitGateIds, gate.id]);
    if (outcome === "failed") {
      next.signalGate.failedGateIds = uniqueList([...next.signalGate.failedGateIds, gate.id]);
      next.ladder.failedSignalGateIds = uniqueList([...(next.ladder.failedSignalGateIds || []), gate.id]);
      next.stats.signalGateFailures += 1;
    } else {
      next.signalGate.completedGateIds = uniqueList([...next.signalGate.completedGateIds, gate.id]);
      next.ladder.completedSignalGateIds = uniqueList([...(next.ladder.completedSignalGateIds || []), gate.id]);
      next.contract.deliveredSignalTransits = (next.contract.deliveredSignalTransits || 0) + 1;
      if (outcome === "partial") {
        next.signalGate.partialGateIds = uniqueList([...next.signalGate.partialGateIds, gate.id]);
        next.ladder.partialSignalGateIds = uniqueList([...(next.ladder.partialSignalGateIds || []), gate.id]);
        next.stats.signalGatePartialPayouts += 1;
      }
      const score = outcome === "success" ? gate.ladderScore || 0 : Math.ceil((gate.ladderScore || 0) * 0.55);
      next.signalGate.signalScore += score;
      next.ladder.signalScore += score;
      next.signalGate.payoutBanked += payout;
      next.contract.deliveredSignalPayout = (next.contract.deliveredSignalPayout || 0) + payout;
      next.stats.signalGatePayouts += payout;
    }
    applySignalGateOutcomeCoupling(next, gate, outcome, transitMode, payout);
    next.signalGate.status = `${gate.name} ${outcome}`;
    next.signalGate.lastOutcome = `${payout}cr ${outcome}`;
    next.log.unshift({
      tick: next.tick,
      message: `${gate.name} ${outcome === "success" ? "opened" : outcome === "partial" ? "partially opened" : "collapsed"} for ${payout} credits.`,
    });
    return syncDerivedState(next);
  }

  function interdictionCellInRange(state, cell, range) {
    return distance(state.ship.position, cell.position) <= range + (cell.radius || 0);
  }

  function scanInterdictionTransponder(state, cellId = null, deltaSeconds = 1) {
    const dt = Math.max(0, Math.min(deltaSeconds, 2));
    const next = syncDerivedState(clone(state));
    if (next.run.status === "failed" || next.run.status === "complete") {
      next.interdiction.status = "run closed";
      return syncDerivedState(next);
    }
    const target = cellId ? interdictionCellById(next, cellId) : findTarget(next);
    if (!target || (cellId === null && next.target.kind !== "interdiction")) {
      next.interdiction.status = "no interdiction lock";
      return syncDerivedState(next);
    }
    const readiness = interdictionCellReadiness(next, target.id);
    if (!readiness.ready) {
      target.interdictionState.status = "locked";
      next.interdiction.status = `locked: ${readiness.missing.join(", ")}`;
      return syncDerivedState(next);
    }
    if (!interdictionCellInRange(next, target, next.interdiction.scanRange)) {
      next.interdiction.status = "out of transponder range";
      return syncDerivedState(next);
    }
    if (target.interdictionState.transponderScanned) {
      target.interdictionState.status = "transponder scanned";
      next.interdiction.status = `${target.name} already scanned`;
      return syncDerivedState(next);
    }

    target.interdictionState.status = "scanning";
    target.interdictionState.progress += next.interdiction.scanPower * dt;
    target.interdictionState.lastTouchedTick = next.tick;
    next.scanning.active = true;
    next.scanning.targetId = target.id;
    next.scanning.lastScan = clamp(target.interdictionState.progress / target.transponderDifficulty, 0, 1);
    next.scanning.status = `transponder ${Math.round(next.scanning.lastScan * 100)}%`;
    if (target.interdictionState.progress >= target.transponderDifficulty) {
      target.interdictionState.progress = target.transponderDifficulty;
      target.interdictionState.transponderScanned = true;
      target.interdictionState.status = "transponder scanned";
      next.interdiction.scannedCellIds = uniqueList([...next.interdiction.scannedCellIds, target.id]);
      next.ladder.scannedInterdictionCellIds = uniqueList([...(next.ladder.scannedInterdictionCellIds || []), target.id]);
      next.interdiction.scansCompleted += 1;
      next.stats.interdictionTranspondersScanned += 1;
      next.pirate.state = next.pirate.state === "dormant" ? "shadowing" : next.pirate.state;
      next.pirate.encounterState = next.pirate.encounterState === "distant" ? "contact" : next.pirate.encounterState;
      next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (target.raidPressure || 0) * 0.12, 2));
      next.interdiction.lastOutcome = `${target.name} transponder scanned`;
      next.log.unshift({ tick: next.tick, message: `${target.name} transponder scanned into Knife Wake Interdiction.` });
    }
    return syncDerivedState(next);
  }

  function placeInterdictionMarker(state, cellId, markerType = "distress") {
    const next = syncDerivedState(clone(state));
    const cell = interdictionCellById(next, cellId);
    if (!cell) {
      next.interdiction.status = "unknown interdiction cell";
      return syncDerivedState(next);
    }
    const kind = markerType === "decoy" ? "decoy" : "distress";
    const readiness = interdictionCellReadiness(next, cell.id);
    if (!readiness.ready || !cell.interdictionState.transponderScanned) {
      cell.interdictionState.status = "marker locked";
      next.interdiction.status = `marker locked: ${readiness.missing.join(", ") || "scan transponder"}`;
      return syncDerivedState(next);
    }
    if (!interdictionCellInRange(next, cell, next.interdiction.markerRange) && !next.station.proximity.dockable) {
      cell.interdictionState.status = "marker out of range";
      next.interdiction.status = `${cell.name} marker out of range`;
      return syncDerivedState(next);
    }

    cell.interdictionState.markerPlaced = true;
    cell.interdictionState.markerType = kind;
    cell.interdictionState.responseWindow.locked = true;
    cell.interdictionState.responseWindow.markedAt = next.elapsed;
    cell.interdictionState.responseWindow.closesAt = round(
      Math.max(cell.interdictionState.responseWindow.closesAt || 0, next.elapsed + 1) +
        (cell.markerResponseBonus || 0) +
        (next.stationServices.interdictionResponseWindowBonus || 0),
      2
    );
    if (kind === "distress") {
      cell.interdictionState.escortIntegrity = round(
        cell.interdictionState.escortIntegrity +
          (cell.distressEscortIntegrity || 0) +
          (next.stationServices.interdictionSupportIntegrity || 0),
        2
      );
    } else {
      cell.interdictionState.raidPressure = Math.max(
        0,
        round((cell.interdictionState.raidPressure || 0) - (cell.decoyRaidReduction || 0), 2)
      );
      next.pirate.pressure = Math.max(0, round(next.pirate.pressure - (cell.decoyRaidReduction || 0) * 0.8, 2));
    }
    cell.interdictionState.status = `${kind} marker armed`;
    cell.interdictionState.lastTouchedTick = next.tick;
    next.interdiction.markerCellIds = uniqueList([...next.interdiction.markerCellIds, cell.id]);
    next.interdiction.markersPlaced += 1;
    next.stats.interdictionMarkersPlaced += 1;
    next.interdiction.lastOutcome = `${cell.name} ${kind} marker`;
    next.log.unshift({ tick: next.tick, message: `${cell.name} ${kind} marker armed for the Knife Wake response window.` });
    return syncDerivedState(next);
  }

  function deployInterdictionLure(state, cellId) {
    const next = syncDerivedState(clone(state));
    const cell = interdictionCellById(next, cellId);
    if (!cell) {
      next.interdiction.status = "unknown interdiction cell";
      return syncDerivedState(next);
    }
    const readiness = interdictionCellReadiness(next, cell.id);
    if (!readiness.ready || !cell.interdictionState.transponderScanned) {
      cell.interdictionState.status = "lure locked";
      next.interdiction.status = `lure locked: ${readiness.missing.join(", ") || "scan transponder"}`;
      return syncDerivedState(next);
    }
    if (!next.stationServices || next.stationServices.countermeasureCharges <= 0) {
      next.stationServices = next.stationServices || createStationServiceState();
      next.stationServices.countermeasureStatus = "no lure charge";
      return syncDerivedState(next);
    }
    if (!interdictionCellInRange(next, cell, next.interdiction.lureRange) && !next.station.proximity.dockable) {
      cell.interdictionState.status = "lure out of range";
      next.interdiction.status = `${cell.name} lure out of range`;
      return syncDerivedState(next);
    }

    next.stationServices.countermeasureCharges -= 1;
    next.stationServices.countermeasureStatus = "interdiction lure";
    cell.interdictionState.lureDeployed = true;
    cell.interdictionState.countermeasureUsed = true;
    cell.interdictionState.raidPressure = Math.max(
      0,
      round(
        (cell.interdictionState.raidPressure || 0) -
          (cell.lurePressureDrop || GAME_DATA.knifeWakeInterdiction.countermeasureRaidReduction),
        2
      )
    );
    cell.interdictionState.responseWindow.closesAt = round(
      (cell.interdictionState.responseWindow.closesAt || 0) + (cell.markerResponseBonus || 0),
      2
    );
    cell.interdictionState.status = "lure deployed";
    cell.interdictionState.lastTouchedTick = next.tick;
    next.pirate.state = "shadowing";
    next.pirate.encounterState = "contact";
    next.pirate.position = clone(cell.position);
    next.pirate.pressure = Math.max(
      0,
      round(next.pirate.pressure - (cell.lurePressureDrop || GAME_DATA.knifeWakeInterdiction.countermeasurePressureDrop), 2)
    );
    next.interdiction.luredCellIds = uniqueList([...next.interdiction.luredCellIds, cell.id]);
    next.ladder.luredInterdictionCellIds = uniqueList([...(next.ladder.luredInterdictionCellIds || []), cell.id]);
    next.interdiction.luresDeployed += 1;
    next.stats.countermeasuresDeployed += 1;
    next.stats.interdictionLuresDeployed += 1;
    next.interdiction.lastOutcome = `${cell.name} lure deployed`;
    next.log.unshift({ tick: next.tick, message: `${cell.name} lure deployed; Knife Wake pressure split off the convoy lane.` });
    return syncDerivedState(next);
  }

  function interdictionResponsePower(state, cell, responseMode = "escort") {
    const markerPower =
      cell.interdictionState.markerType === "distress"
        ? cell.distressEscortIntegrity || 0
        : cell.interdictionState.markerType === "decoy"
          ? cell.decoyRaidReduction || 0
          : 0;
    const lurePower = cell.interdictionState.lureDeployed ? cell.lurePressureDrop || 0 : 0;
    const supportPower =
      (state.stationServices.interdictionRaidMitigation || 0) * 100 + (state.stationServices.interdictionSupportIntegrity || 0);
    const convoyPower = (cell.convoyRouteIds || []).reduce((score, routeId) => {
      const route = convoyRouteById(state, routeId);
      if (!route) {
        return score;
      }
      const beaconScore = route.beaconState.deployed ? 8 : 0;
      const escortScore = route.convoyState ? Math.min(20, (route.convoyState.escortIntegrity || 0) * 0.2) : 0;
      const completeScore = (state.ladder.completedConvoyRouteIds || []).includes(routeId) ? 12 : 0;
      return score + Math.max(beaconScore + escortScore, completeScore);
    }, 0);
    const salvagePower = (cell.salvageSiteIds || []).reduce((score, siteId) => {
      const site = (state.salvageSites || []).find((candidate) => candidate.id === siteId);
      if (!site || !site.salvageState) {
        return score;
      }
      return score + (site.salvageState.targetLocked ? 6 : 0) + (site.salvageState.recoveredValue > 0 ? 8 : 0);
    }, 0);
    const stormPower = (cell.stormChartIds || []).reduce((score, chartId) => {
      const chart = stormChartById(state, chartId);
      if (!chart || !chart.stormState) {
        return score;
      }
      const lockedScore = chart.stormState.safeWindow && chart.stormState.safeWindow.locked ? 12 : 0;
      const completeScore = (state.ladder.completedStormChartIds || []).includes(chartId) ? 16 : 0;
      return score + Math.max(lockedScore, completeScore);
    }, 0);
    const cargoSacrificePower = responseMode === "cargo-sacrifice" && state.cargo.ore > 0 ? 14 : 0;
    return round(
      12 +
        markerPower +
        lurePower +
        supportPower +
        convoyPower +
        salvagePower +
        stormPower +
        cargoSacrificePower +
        (cell.interdictionState.escortIntegrity || 0),
      2
    );
  }

  function applyInterdictionOutcomeCoupling(state, cell, outcome, responseMode, payout) {
    const next = state;
    const success = outcome === "success";
    const partial = outcome === "partial";
    (cell.convoyRouteIds || []).forEach((routeId) => {
      const route = convoyRouteById(next, routeId);
      if (!route || !route.convoyState) {
        return;
      }
      if (success || partial) {
        route.convoyState.ambushPressure = Math.max(
          0,
          round((route.convoyState.ambushPressure || route.ambushPressure || 0) - (cell.convoyAmbushReduction || 0) * (success ? 1 : 0.5), 2)
        );
        route.convoyState.escortIntegrity = Math.min(
          route.convoyState.maxEscortIntegrity || route.convoyState.escortIntegrity || 0,
          round((route.convoyState.escortIntegrity || 0) + (cell.convoyEscortIntegrity || 0) * (success ? 1 : 0.5), 2)
        );
        route.convoyState.interdictionStatus = `${cell.id} ${outcome}`;
      } else {
        route.convoyState.escortIntegrity = Math.max(
          0,
          round((route.convoyState.escortIntegrity || 0) - (cell.raidPressure || 0) * 0.22, 2)
        );
        route.convoyState.ambushPressure = round((route.convoyState.ambushPressure || route.ambushPressure || 0) + (cell.failurePressure || 0) * 0.45, 2);
        route.convoyState.interdictionStatus = `${cell.id} failed`;
      }
    });
    (cell.salvageSiteIds || []).forEach((siteId) => {
      const site = (next.salvageSites || []).find((candidate) => candidate.id === siteId);
      if (!site || !site.salvageState) {
        return;
      }
      if (success || partial) {
        site.salvageState.interdictionShield = {
          cellId: cell.id,
          status: success ? "protected" : "screened",
          riskReduction: (cell.salvageRiskReduction || 0) * (success ? 1 : 0.5),
        };
        cell.interdictionState.protectedSalvageIds = uniqueList([
          ...(cell.interdictionState.protectedSalvageIds || []),
          site.id,
        ]);
      } else {
        site.salvageState.interdictionRaid = {
          cellId: cell.id,
          status: "raided",
          lostValue: Math.round((site.rewardValue || 0) * GAME_DATA.knifeWakeInterdiction.failureCargoValueRate),
        };
        site.salvageState.scanConfidence = Math.max(0, round((site.salvageState.scanConfidence || 0) - 0.18, 3));
        if (site.salvageState.remainingSalvage > 0) {
          site.salvageState.remainingSalvage -= 1;
        }
      }
    });
    if (success) {
      next.pirate.pressure = Math.max(0, round(next.pirate.pressure - (cell.piratePressureClear || 0), 2));
    } else if (partial) {
      next.ship.hull = Math.max(0, round(next.ship.hull - (cell.partialHullDamage || 0), 2));
      next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (cell.failurePressure || 0) * 0.35, 2));
    } else {
      next.ship.hull = Math.max(0, round(next.ship.hull - (cell.failureHullDamage || 0), 2));
      next.ship.fuel = Math.max(0, round(next.ship.fuel - (cell.failureFuelDrain || 0), 2));
      next.pirate.pressure = Math.min(100, round(next.pirate.pressure + (cell.failurePressure || 0), 2));
    }
    if ((outcome === "failed" || responseMode === "cargo-sacrifice") && next.cargo.ore > 0 && (cell.cargoLoss || 0) > 0) {
      const lost = Math.min(next.cargo.ore, cell.cargoLoss || 0);
      const averageValue = next.cargo.ore > 0 ? Math.ceil(next.cargo.value / next.cargo.ore) : 0;
      next.cargo.ore -= lost;
      next.cargo.value = Math.max(0, next.cargo.value - averageValue * lost);
      next.stats.oreLost += lost;
      next.stats.interdictionCargoLost += lost;
    }
    if (payout > 0) {
      next.credits += payout;
    }
    return next;
  }

  function resolveInterdictionRaid(state, cellId, responseMode = "escort") {
    const next = syncDerivedState(clone(state));
    const cell = interdictionCellById(next, cellId);
    if (!cell) {
      next.interdiction.status = "unknown interdiction cell";
      return syncDerivedState(next);
    }
    if (["success", "partial", "failed"].includes(cell.interdictionState.outcome)) {
      return syncDerivedState(next);
    }
    const readiness = interdictionCellReadiness(next, cell.id);
    if (!readiness.ready || !cell.interdictionState.transponderScanned) {
      cell.interdictionState.status = "raid unresolved";
      next.interdiction.status = `raid unresolved: ${readiness.missing.join(", ") || "scan transponder"}`;
      return syncDerivedState(next);
    }
    const timing = interdictionResponseTiming(cell, next);
    if (timing.pending) {
      cell.interdictionState.status = `response opens at ${timing.opensAt}`;
      next.interdiction.status = cell.interdictionState.status;
      return syncDerivedState(next);
    }
    const responsePower = interdictionResponsePower(next, cell, responseMode);
    const raidPressure = Math.max(1, cell.interdictionState.raidPressure || cell.raidPressure || 1);
    let outcome = "failed";
    if (!timing.missed && responsePower >= raidPressure) {
      outcome = "success";
    } else if (responsePower >= raidPressure * 0.55 || cell.interdictionState.markerPlaced || cell.interdictionState.lureDeployed) {
      outcome = "partial";
    }
    const payoutRate = outcome === "success" ? 1 : outcome === "partial" ? cell.partialPayoutRate || 0.5 : 0;
    const payout = Math.round((cell.interdictionState.payoutCredits || cell.payoutCredits || 0) * payoutRate * (1 + (next.stationServices.interdictionPayoutBonus || 0)));

    cell.interdictionState.status = outcome;
    cell.interdictionState.outcome = outcome;
    cell.interdictionState.deliveredValue = payout;
    cell.interdictionState.partialPayoutCredits = outcome === "partial" ? payout : 0;
    cell.interdictionState.failureReason =
      outcome === "success" ? null : outcome === "partial" ? "raid pressure bled through the response window" : "Knife Wake raid landed";
    cell.interdictionState.lastTouchedTick = next.tick;
    next.interdiction.raidsResolved += 1;
    next.stats.interdictionRaidsResolved += 1;
    if (outcome === "failed") {
      next.interdiction.failedCellIds = uniqueList([...next.interdiction.failedCellIds, cell.id]);
      next.ladder.failedInterdictionCellIds = uniqueList([...(next.ladder.failedInterdictionCellIds || []), cell.id]);
      next.stats.interdictionFailures += 1;
    } else {
      next.interdiction.completedCellIds = uniqueList([...next.interdiction.completedCellIds, cell.id]);
      next.ladder.completedInterdictionCellIds = uniqueList([...(next.ladder.completedInterdictionCellIds || []), cell.id]);
      next.contract.deliveredInterdictions = (next.contract.deliveredInterdictions || 0) + 1;
      if (outcome === "partial") {
        next.interdiction.partialCellIds = uniqueList([...next.interdiction.partialCellIds, cell.id]);
        next.ladder.partialInterdictionCellIds = uniqueList([...(next.ladder.partialInterdictionCellIds || []), cell.id]);
        next.stats.interdictionPartialPayouts += 1;
      }
      const score = outcome === "success" ? cell.ladderScore || 0 : Math.ceil((cell.ladderScore || 0) * 0.55);
      next.interdiction.interdictionScore += score;
      next.ladder.interdictionScore += score;
      next.interdiction.payoutBanked += payout;
      next.contract.deliveredInterdictionPayout = (next.contract.deliveredInterdictionPayout || 0) + payout;
      next.stats.interdictionPayouts += payout;
    }
    applyInterdictionOutcomeCoupling(next, cell, outcome, responseMode, payout);
    next.interdiction.protectedSalvage += (cell.interdictionState.protectedSalvageIds || []).length;
    next.interdiction.status = `${cell.name} ${outcome}`;
    next.interdiction.lastOutcome = `${payout}cr ${outcome}`;
    next.log.unshift({
      tick: next.tick,
      message: `${cell.name} ${outcome === "success" ? "broken" : outcome === "partial" ? "partially checked" : "landed"} for ${payout} credits.`,
    });
    return syncDerivedState(next);
  }

  function routeBeaconInRange(state, route) {
    const range = route.beaconDeployRange || GAME_DATA.beaconConvoy.beaconDeployRange;
    return distance(state.ship.position, route.beacon.position) <= range + (route.beacon.radius || 0);
  }

  function deployRouteBeacon(state, routeId) {
    const next = syncDerivedState(clone(state));
    const route = convoyRouteById(next, routeId);
    if (!route) {
      next.convoy.status = "unknown convoy route";
      return syncDerivedState(next);
    }
    const readiness = convoyRouteReadiness(next, routeId);
    if (!readiness.ready) {
      route.beaconState.status = "locked";
      route.convoyState.status = "locked";
      next.convoy.status = `locked: ${readiness.missing.join(", ")}`;
      return syncDerivedState(next);
    }
    if (!routeBeaconInRange(next, route)) {
      route.beaconState.status = "out of range";
      next.convoy.status = `${route.beacon.name} out of range`;
      return syncDerivedState(next);
    }
    if (route.beaconState.deployed) {
      route.beaconState.status = "deployed";
      next.convoy.status = `${route.beacon.name} already deployed`;
      return syncDerivedState(next);
    }

    route.beaconState.deployed = true;
    route.beaconState.status = "deployed";
    route.beaconState.integrity = route.beaconState.maxIntegrity;
    route.beaconState.lastTouchedTick = next.tick;
    route.convoyState.status = "ready";
    next.convoy.beaconsDeployed += 1;
    next.stats.convoyBeaconsDeployed += 1;
    next.convoy.lastOutcome = `${route.beacon.name} deployed`;
    next.log.unshift({ tick: next.tick, message: `${route.beacon.name} deployed for ${route.name}.` });
    return syncDerivedState(next);
  }

  function maintainRouteBeacon(state, routeId) {
    const next = syncDerivedState(clone(state));
    const route = convoyRouteById(next, routeId);
    if (!route) {
      next.convoy.status = "unknown convoy route";
      return syncDerivedState(next);
    }
    if (!route.beaconState.deployed) {
      return deployRouteBeacon(next, routeId);
    }
    if (!routeBeaconInRange(next, route) && !next.station.proximity.dockable) {
      route.beaconState.status = "maintenance out of range";
      next.convoy.status = `${route.beacon.name} maintenance out of range`;
      return syncDerivedState(next);
    }

    const integrityGain =
      GAME_DATA.beaconConvoy.beaconMaintenanceIntegrity + Math.round((next.stationServices.convoyEscortIntegrity || 0) * 0.25);
    route.beaconState.integrity = Math.min(route.beaconState.maxIntegrity, round(route.beaconState.integrity + integrityGain, 2));
    route.beaconState.status = "maintained";
    route.beaconState.lastTouchedTick = next.tick;
    route.convoyState.ambushPressure = Math.max(0, round(route.convoyState.ambushPressure - 5, 2));
    route.convoyState.hazardExposure = Math.max(
      0,
      round(route.convoyState.hazardExposure - GAME_DATA.beaconConvoy.beaconMaintenanceHazardClear, 2)
    );
    next.hazard.exposure = Math.max(0, round(next.hazard.exposure - GAME_DATA.beaconConvoy.beaconMaintenanceHazardClear, 3));
    next.convoy.lastOutcome = `${route.beacon.name} maintained`;
    next.log.unshift({ tick: next.tick, message: `${route.beacon.name} maintained; convoy lane interference dropped.` });
    return syncDerivedState(next);
  }

  function startConvoyRoute(state, routeId) {
    const next = syncDerivedState(clone(state));
    const route = convoyRouteById(next, routeId);
    if (!route) {
      next.convoy.status = "unknown convoy route";
      return syncDerivedState(next);
    }
    const readiness = convoyRouteReadiness(next, routeId);
    if (!readiness.ready) {
      route.convoyState.status = "locked";
      next.convoy.status = `locked: ${readiness.missing.join(", ")}`;
      return syncDerivedState(next);
    }
    if (!route.beaconState.deployed) {
      route.convoyState.status = "needs beacon";
      next.convoy.status = `${route.beacon.name} required`;
      return syncDerivedState(next);
    }
    if (next.convoy.activeRouteId && next.convoy.activeRouteId !== route.id) {
      next.convoy.status = `${convoyRouteById(next, next.convoy.activeRouteId).name} already active`;
      return syncDerivedState(next);
    }
    if (next.convoy.activeRouteId === route.id && ["enroute", "ambushed", "straggling"].includes(route.convoyState.status)) {
      next.convoy.status = `${route.name} already active`;
      return syncDerivedState(next);
    }
    if (["delivered", "partial", "failed"].includes(route.convoyState.status)) {
      next.convoy.status = `${route.name} ${route.convoyState.status}`;
      return syncDerivedState(next);
    }

    const escortIntegrity = (route.escortIntegrity || 0) + (next.stationServices.convoyEscortIntegrity || 0);
    const ambushPressure = Math.max(
      0,
      round((route.ambushPressure || 0) - (next.stationServices.convoyAmbushMitigation || 0) * 100, 2)
    );
    const stormModifier = stormWindowModifierForRoute(next, route);
    const interdictionModifier = interdictionModifierForRoute(next, route);
    const signalModifier = signalGateModifierForRoute(next, route);
    route.convoyState.status = "enroute";
    route.convoyState.progress = 0;
    route.convoyState.position = clone(route.startPosition || route.beacon.position);
    route.convoyState.escortIntegrity = escortIntegrity + interdictionModifier.escortIntegrity;
    route.convoyState.maxEscortIntegrity = escortIntegrity + interdictionModifier.escortIntegrity;
    route.convoyState.cargoValue = route.cargoValue;
    route.convoyState.payoutCredits = Math.round(
      (route.payoutCredits || route.cargoValue) *
        (1 + stormModifier.payoutBonus + interdictionModifier.payoutBonus + signalModifier.payoutBonus)
    );
    route.convoyState.deliveredValue = 0;
    route.convoyState.ambushPressure = Math.max(
      0,
      round(
        ambushPressure +
          interdictionModifier.raidPressure +
          signalModifier.jamPressure -
          stormModifier.ambushReduction -
          interdictionModifier.ambushReduction -
          signalModifier.ambushReduction,
        2
      )
    );
    route.convoyState.hazardExposure = Math.max(
      0,
      round((route.hazardExposure || 0) - stormModifier.hazardReduction - signalModifier.hazardReduction, 2)
    );
    route.convoyState.failureReason = null;
    route.convoyState.startedAt = next.tick;
    route.convoyState.completedAt = null;
    route.convoyState.countermeasureUsed = false;
    route.convoyState.formationStatus = "forming";
    route.convoyState.lastDamage = 0;
    route.convoyState.stormWindowStatus = stormModifier.active ? `locked ${stormModifier.chartId}` : "none";
    route.convoyState.interdictionStatus = interdictionModifier.label;
    route.convoyState.signalGateStatus = signalModifier.label;
    next.convoy.activeRouteId = route.id;
    next.convoy.status = `${route.name} enroute`;
    next.stats.convoysStarted += 1;
    if (next.pirate.state === "dormant") {
      next.pirate.state = "shadowing";
      next.pirate.encounterState = "contact";
    }
    next.pirate.pressure = Math.min(100, round(next.pirate.pressure + route.convoyState.ambushPressure * 0.2, 2));
    next.log.unshift({ tick: next.tick, message: `${route.name} started with ${escortIntegrity} escort integrity.` });
    return syncDerivedState(next);
  }

  function failConvoyRoute(state, route, reason) {
    const next = state;
    route.convoyState.status = "failed";
    route.convoyState.failureReason = reason;
    route.convoyState.completedAt = next.tick;
    route.convoyState.deliveredValue = 0;
    next.convoy.activeRouteId = null;
    next.convoy.failedRouteIds = uniqueList([...next.convoy.failedRouteIds, route.id]);
    next.convoy.status = `${route.name} failed`;
    next.convoy.lastOutcome = reason;
    next.stats.convoyFailures += 1;
    next.pirate.pressure = Math.min(100, round(next.pirate.pressure + 8, 2));
    next.log.unshift({ tick: next.tick, message: `${route.name} failed: ${reason}.` });
    return next;
  }

  function applyConvoyInterdiction(state, route, deltaSeconds = 1) {
    const next = state;
    const dt = Math.max(0, Math.min(deltaSeconds, 5));
    const convoyPosition = convoyRoutePosition(route);
    route.convoyState.position = convoyPosition;
    const inFormation = distance(next.ship.position, convoyPosition) <= GAME_DATA.beaconConvoy.formationRange;
    const hazardCharted = Boolean((next.ladder.hazardCharts || {})[next.ladder.currentSectorId]);
    const chartScale = hazardCharted ? 0.62 : 1;
    const beaconScale = route.beaconState.deployed
      ? 1 - clamp(route.beaconState.integrity / Math.max(1, route.beaconState.maxIntegrity), 0, 1) * 0.18
      : 1;
    const stormModifier = stormWindowModifierForRoute(next, route);
    const stormScale = stormModifier.active ? 0.72 : 1;
    const signalModifier = signalGateModifierForRoute(next, route);
    const signalScale = signalModifier.active && signalModifier.jamPressure <= 0 ? 0.82 : 1;
    const countermeasureScale = route.convoyState.countermeasureUsed ? 0.62 : 1;
    const formationScale = inFormation ? 0.68 : 1.35;
    const ambushDamage =
      Math.max(0, route.convoyState.ambushPressure || 0) *
      0.028 *
      dt *
      countermeasureScale *
      formationScale *
      stormScale *
      signalScale;
    const hazardDamage = (route.convoyState.hazardExposure || 0) * 0.34 * dt * chartScale * beaconScale * stormScale * signalScale;
    const damage = round(ambushDamage + hazardDamage, 2);

    route.convoyState.escortIntegrity = Math.max(0, round(route.convoyState.escortIntegrity - damage, 2));
    route.convoyState.lastDamage = damage;
    route.convoyState.formationStatus = inFormation ? "tight" : "straggling";
    route.convoyState.status = inFormation ? "enroute" : "straggling";
    route.beaconState.integrity = Math.max(0, round(route.beaconState.integrity - dt * (inFormation ? 0.35 : 0.75) * stormScale, 2));
    next.convoy.escortLosses = round(next.convoy.escortLosses + damage, 2);
    next.hazard.exposure = round(next.hazard.exposure + (route.convoyState.hazardExposure || 0) * dt * (hazardCharted ? 0.055 : 0.1), 3);
    next.pirate.pressure = Math.min(
      100,
      round(next.pirate.pressure + Math.max(0, route.convoyState.ambushPressure || 0) * dt * (countermeasureScale < 1 ? 0.015 : 0.032), 2)
    );
    if (next.pirate.state === "dormant" && route.convoyState.ambushPressure > 0) {
      next.pirate.state = "shadowing";
      next.pirate.encounterState = "contact";
    }
    return next;
  }

  function resolveConvoyPayout(state, routeId) {
    const next = syncDerivedState(clone(state));
    const route = convoyRouteById(next, routeId);
    if (!route) {
      next.convoy.status = "unknown convoy route";
      return syncDerivedState(next);
    }
    if (["delivered", "partial", "failed"].includes(route.convoyState.status)) {
      return syncDerivedState(next);
    }
    if (route.convoyState.escortIntegrity <= (route.failureIntegrity || 0)) {
      failConvoyRoute(next, route, "escort integrity collapsed before delivery");
      return syncDerivedState(next);
    }

    const partial = route.convoyState.escortIntegrity < (route.partialIntegrity || route.convoyState.maxEscortIntegrity * 0.6);
    const payoutRate = partial ? route.partialPayoutRate || 0.5 : 1;
    const payoutBonus = next.stationServices.convoyPayoutBonus || 0;
    const payout = Math.round((route.convoyState.payoutCredits || route.payoutCredits || route.cargoValue) * payoutRate * (1 + payoutBonus));
    route.convoyState.status = partial ? "partial" : "delivered";
    route.convoyState.progress = 1;
    route.convoyState.position = clone(route.endPosition || route.beacon.position);
    route.convoyState.deliveredValue = payout;
    route.convoyState.completedAt = next.tick;
    route.convoyState.failureReason = partial ? "escort losses reduced payout" : null;
    next.convoy.activeRouteId = null;
    next.convoy.completedRouteIds = uniqueList([...next.convoy.completedRouteIds, route.id]);
    if (partial) {
      next.convoy.partialRouteIds = uniqueList([...next.convoy.partialRouteIds, route.id]);
      next.stats.convoyPartialPayouts += 1;
    }
    next.convoy.payoutBanked += payout;
    next.convoy.convoyScore += partial ? Math.ceil((route.ladderScore || 0) * 0.55) : route.ladderScore || 0;
    next.convoy.status = `${route.name} ${route.convoyState.status}`;
    next.convoy.lastOutcome = `${payout}cr ${route.convoyState.status}`;
    next.credits += payout;
    next.contract.deliveredConvoyValue = (next.contract.deliveredConvoyValue || 0) + payout;
    next.ladder.convoyScore += partial ? Math.ceil((route.ladderScore || 0) * 0.55) : route.ladderScore || 0;
    next.ladder.completedConvoyRouteIds = uniqueList([...next.ladder.completedConvoyRouteIds, route.id]);
    next.stats.convoyPayouts += payout;
    next.log.unshift({
      tick: next.tick,
      message: `${route.name} ${partial ? "limped in" : "delivered"} for ${payout} credits.`,
    });
    return syncDerivedState(next);
  }

  function advanceConvoyRoute(state, deltaSeconds = 1, routeId = null) {
    const next = syncDerivedState(clone(state));
    const activeId = routeId || next.convoy.activeRouteId;
    const route = convoyRouteById(next, activeId);
    if (!route) {
      next.convoy.status = "no active convoy";
      return syncDerivedState(next);
    }
    if (!["enroute", "ambushed", "straggling"].includes(route.convoyState.status)) {
      next.convoy.status = `${route.name} ${route.convoyState.status}`;
      return syncDerivedState(next);
    }

    const dt = Math.max(0, Math.min(deltaSeconds, 5));
    const progressRate = route.progressRate || GAME_DATA.beaconConvoy.baseProgressRate;
    route.convoyState.progress = round(Math.min(1, route.convoyState.progress + progressRate * dt), 3);
    applyConvoyInterdiction(next, route, dt);
    if (route.convoyState.escortIntegrity <= (route.failureIntegrity || 0)) {
      failConvoyRoute(next, route, "pirate interdiction broke the escort");
      return syncDerivedState(next);
    }
    if (route.convoyState.progress >= 1) {
      return resolveConvoyPayout(next, route.id);
    }
    next.convoy.status = `${route.name} ${route.convoyState.status}`;
    return syncDerivedState(next);
  }

  function deployConvoyCountermeasure(state) {
    const next = clone(state);
    const route = convoyRouteById(next, next.convoy ? next.convoy.activeRouteId : null);
    if (!route) {
      if (next.stationServices) {
        next.stationServices.countermeasureStatus = "no active convoy";
      }
      return syncDerivedState(next);
    }
    if (!next.stationServices || next.stationServices.countermeasureCharges <= 0) {
      next.stationServices = next.stationServices || createStationServiceState();
      next.stationServices.countermeasureStatus = "no charge";
      return syncDerivedState(next);
    }
    if (route.convoyState.progress > GAME_DATA.beaconConvoy.countermeasureWindow) {
      next.stationServices.countermeasureStatus = "late convoy burst";
      route.convoyState.formationStatus = "late countermeasure";
      return syncDerivedState(next);
    }

    next.stationServices.countermeasureCharges -= 1;
    next.stationServices.countermeasureStatus = "convoy burst";
    route.convoyState.countermeasureUsed = true;
    route.convoyState.ambushPressure = Math.max(
      0,
      round(route.convoyState.ambushPressure - GAME_DATA.beaconConvoy.countermeasurePressureDrop, 2)
    );
    route.convoyState.escortIntegrity = Math.min(
      route.convoyState.maxEscortIntegrity,
      round(route.convoyState.escortIntegrity + GAME_DATA.beaconConvoy.countermeasureIntegrity, 2)
    );
    next.pirate.pressure = Math.max(0, round(next.pirate.pressure - 24, 2));
    next.stats.countermeasuresDeployed += 1;
    next.stats.convoyCountermeasures += 1;
    next.convoy.lastOutcome = `${route.name} countermeasure`;
    next.log.unshift({ tick: next.tick, message: `Countermeasure burst screened ${route.name}.` });
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
      state.salvage.relicsInHold === 0 &&
      (!state.convoy || (state.stats.convoysStarted === 0 && state.convoy.payoutBanked === 0)) &&
      (!state.storm || (state.stats.stormChartsScanned === 0 && state.storm.payoutBanked === 0 && state.storm.windowsLocked === 0)) &&
      (!state.interdiction ||
        (state.stats.interdictionTranspondersScanned === 0 &&
          state.interdiction.payoutBanked === 0 &&
          state.interdiction.raidsResolved === 0)) &&
      (!state.signalGate ||
        (state.stats.signalGateScans === 0 &&
          state.signalGate.payoutBanked === 0 &&
          state.signalGate.transitsResolved === 0 &&
          state.signalGate.pylonsAligned === 0))
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
      convoy: convoyPersistence(current),
      storm: stormPersistence(current),
      interdiction: interdictionPersistence(current),
      signalGate: signalGatePersistence(current),
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
      convoy: convoyPersistence(state),
      storm: stormPersistence(state),
      interdiction: interdictionPersistence(state),
      signalGate: signalGatePersistence(state),
      sectorId,
    });
    next.log.unshift({
      tick: 0,
      message: `Sortie ${next.run.count} reset into ${sectorById(next.ladder.currentSectorId).name}.`,
    });
    return syncDerivedState(next);
  }

  function restartTutorial(state, options = {}) {
    const seed = options.seed === undefined ? state.seed : options.seed;
    const next = createInitialState({
      seed,
      credits: options.keepCredits ? state.credits : 0,
      upgrades: options.keepUpgrades ? state.upgrades.purchased : [],
      tutorialMode: true,
      restartTutorial: true,
      tutorial: {
        restartCount: ((state.tutorial && state.tutorial.restartCount) || 0) + 1,
      },
    });
    next.log.unshift({ tick: 0, message: "First Spoke Contract tutorial restarted." });
    return syncDerivedState(next);
  }

  function updateHazardState(state, deltaSeconds) {
    const next = state;
    if (!next.hazard || next.hazard.intensity <= 0 || next.station.proximity.dockable) {
      return next;
    }
    const chartBonus = next.hazard.surveyed ? 0.55 : 0;
    const stormBonus = (next.stormCharts || []).reduce((bonus, chart) => {
      if (chart.stormState.safeWindow.locked && chart.stormState.outcome === "none") {
        return Math.max(bonus, (chart.hazardMitigation || 0) + (next.stationServices.stormHazardMitigation || 0));
      }
      return bonus;
    }, 0);
    const effectiveIntensity = Math.max(0, next.hazard.intensity - (next.hazard.mitigation || 0) - chartBonus - stormBonus);
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

  function updateStormWindows(state, deltaSeconds) {
    const next = state;
    if (!next.storm || !next.stormCharts) {
      return next;
    }
    const dt = Math.max(0, Math.min(deltaSeconds, 5));
    next.stormCharts.forEach((chart) => {
      if (!chart.stormState.safeWindow.locked || chart.stormState.outcome !== "none") {
        return;
      }
      const mitigation = next.stationServices ? next.stationServices.stormHazardMitigation || 0 : 0;
      const decay = Math.max(0.12, (chart.intensity || 0) - mitigation) * dt * 0.38;
      chart.stormState.anchorIntegrity = Math.max(0, round(chart.stormState.anchorIntegrity - decay, 2));
      chart.stormState.status = (next.elapsed || 0) > (chart.stormState.safeWindow.closesAt || 0) ? "window closing" : "window locked";
      if (chart.stormState.anchorIntegrity <= (chart.failureIntegrity || 0)) {
        missStormWindow(next, chart, "relay anchor collapsed under storm load");
      }
    });
    return next;
  }

  function updateInterdictionRaids(state, deltaSeconds) {
    const next = state;
    if (!next.interdiction || !next.interdictionCells) {
      return next;
    }
    const dt = Math.max(0, Math.min(deltaSeconds, 5));
    next.interdictionCells.forEach((cell) => {
      if (
        !cell.prerequisiteStatus ||
        !cell.prerequisiteStatus.ready ||
        !cell.interdictionState.transponderScanned ||
        ["success", "partial", "failed"].includes(cell.interdictionState.outcome)
      ) {
        return;
      }
      const timing = interdictionResponseTiming(cell, next);
      if (!timing.open && !timing.missed) {
        return;
      }
      const markerScale = cell.interdictionState.markerPlaced ? 0.55 : 1;
      const lureScale = cell.interdictionState.lureDeployed ? 0.42 : 1;
      const supportScale = 1 - Math.min(0.45, next.stationServices ? next.stationServices.interdictionRaidMitigation || 0 : 0);
      const pressureGain = (cell.interdictionState.raidPressure || 0) * 0.018 * dt * markerScale * lureScale * supportScale;
      next.pirate.state = next.pirate.state === "dormant" ? "shadowing" : next.pirate.state;
      next.pirate.encounterState = next.pirate.encounterState === "distant" ? "contact" : next.pirate.encounterState;
      next.pirate.pressure = Math.min(100, round(next.pirate.pressure + pressureGain, 2));
    });
    return next;
  }

  function updateSignalGateJams(state, deltaSeconds) {
    const next = state;
    if (!next.signalGate || !next.signalGates) {
      return next;
    }
    const dt = Math.max(0, Math.min(deltaSeconds, 5));
    next.signalGates.forEach((gate) => {
      if (
        !gate.prerequisiteStatus ||
        !gate.prerequisiteStatus.ready ||
        !gate.gateState.harmonicsScanned ||
        ["success", "partial", "failed"].includes(gate.gateState.outcome)
      ) {
        return;
      }
      const chargedRatio = clamp(gate.gateState.capacitorCharge / Math.max(1, gate.gateState.capacitorRequirement), 0, 1);
      if (chargedRatio <= 0) {
        return;
      }
      const timing = signalGateTransitTiming(gate, next);
      const windowScale = timing.open || timing.missed ? 1 : 0.35;
      const supportScale = 1 - Math.min(0.45, next.stationServices ? next.stationServices.signalJamMitigation || 0 : 0);
      const pressureGain = (gate.gateState.pirateJam || gate.pirateGateJam || 0) * 0.012 * dt * chargedRatio * windowScale * supportScale;
      next.pirate.state = next.pirate.state === "dormant" ? "shadowing" : next.pirate.state;
      next.pirate.encounterState = next.pirate.encounterState === "distant" ? "contact" : next.pirate.encounterState;
      next.pirate.pressure = Math.min(100, round(next.pirate.pressure + pressureGain, 2));
      if (gate.gateState.pylonAligned && gate.gateState.pylonIntegrity > 0 && !next.station.proximity.dockable) {
        gate.gateState.pylonIntegrity = Math.max(0, round(gate.gateState.pylonIntegrity - pressureGain * 0.18, 2));
      }
    });
    return next;
  }

  function updatePirateState(state, deltaSeconds) {
    const next = state;
    const pirateUnlocked =
      (next.systemAccess && next.systemAccess.pirate) ||
      next.pirate.unlockState === "unlocked" ||
      next.pirate.state !== "dormant" ||
      !next.tutorial ||
      next.tutorial.status === "complete";
    if (!pirateUnlocked && next.pirate.state === "dormant") {
      next.pirate.encounterState = "distant";
      next.pirate.pressure = 0;
      return next;
    }
    if (pirateUnlocked && next.pirate.unlockState !== "unlocked") {
      next.pirate.unlockState = "unlocked";
      next.pirate.unlockedAt = next.elapsed;
    }
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
      return state.tutorial && state.ladder.currentSectorId === GAME_DATA.surveyLadder.defaultSectorId
        ? restartTutorial(state)
        : resetRun(state);
    }
    let next = applyFlightInput(state, input, dt);
    next.tick = round(next.tick + dt, 3);
    next.elapsed = round(next.elapsed + dt, 3);
    next = updatePirateState(next, dt);
    next = updateHazardState(next, dt);
    next = updateStormWindows(next, dt);
    next = updateInterdictionRaids(next, dt);
    next = updateSignalGateJams(next, dt);
    if (next.convoy && next.convoy.activeRouteId) {
      next = advanceConvoyRoute(next, dt);
    }
    next = coolMiningState(next, dt);
    next = coolScanningState(next, dt);
    next = coolSalvageState(next, dt);
    if (input.mine) {
      next = next.target.kind === "salvage" ? extractSalvageTarget(next, dt) : mineTarget(next, dt);
    }
    if (input.scan) {
      next =
        next.target.kind === "salvage"
          ? scanSalvageTarget(next, dt)
          : next.target.kind === "storm"
            ? scanStormChart(next, dt)
            : next.target.kind === "interdiction"
              ? scanInterdictionTransponder(next, next.target.id, dt)
              : next.target.kind === "signal-gate"
                ? scanSignalGateHarmonics(next, next.target.id, dt)
                : scanTarget(next, dt);
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
        signalTransits: `${state.contract.deliveredSignalTransits || 0}/${state.contract.requiredSignalTransits || 0}`,
        signalPayout: `${state.contract.deliveredSignalPayout || 0}/${state.contract.requiredSignalPayout || 0}`,
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
      convoy: {
        version: state.convoy.version,
        releaseLabel: state.convoy.releaseLabel,
        status: state.convoy.status,
        payoutBanked: state.convoy.payoutBanked,
        convoyScore: state.ladder.convoyScore,
        completedRouteIds: state.ladder.completedConvoyRouteIds.slice(),
      },
      storm: {
        version: state.storm.version,
        releaseLabel: state.storm.releaseLabel,
        status: state.storm.status,
        payoutBanked: state.storm.payoutBanked,
        stormScore: state.ladder.stormScore,
        completedChartIds: state.ladder.completedStormChartIds.slice(),
        failedChartIds: state.ladder.failedStormChartIds.slice(),
        partialChartIds: state.ladder.partialStormChartIds.slice(),
      },
      interdiction: {
        version: state.interdiction.version,
        releaseLabel: state.interdiction.releaseLabel,
        status: state.interdiction.status,
        payoutBanked: state.interdiction.payoutBanked,
        interdictionScore: state.ladder.interdictionScore,
        completedCellIds: state.ladder.completedInterdictionCellIds.slice(),
        failedCellIds: state.ladder.failedInterdictionCellIds.slice(),
        partialCellIds: state.ladder.partialInterdictionCellIds.slice(),
        scannedCellIds: state.ladder.scannedInterdictionCellIds.slice(),
      },
      signalGate: {
        version: state.signalGate.version,
        releaseLabel: state.signalGate.releaseLabel,
        status: state.signalGate.status,
        payoutBanked: state.signalGate.payoutBanked,
        signalScore: state.ladder.signalScore,
        completedGateIds: state.ladder.completedSignalGateIds.slice(),
        failedGateIds: state.ladder.failedSignalGateIds.slice(),
        partialGateIds: state.ladder.partialSignalGateIds.slice(),
        scannedGateIds: state.ladder.scannedSignalGateIds.slice(),
        alignedGateIds: state.ladder.alignedSignalGateIds.slice(),
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
        extractionDifficulty: site.extractionDifficulty,
        confidenceThreshold: site.confidenceThreshold,
        remainingSalvage: site.salvageState.remainingSalvage,
        rewardValue: site.rewardValue,
        relicReward: site.relicReward || 0,
        scanConfidence: site.salvageState.scanConfidence,
        targetLocked: site.salvageState.targetLocked,
        extractionProgress: round(site.salvageState.extractionProgress, 3),
        status: site.salvageState.status,
        risk: salvageRisk(site, state),
        stormReroute: site.salvageState.stormReroute || null,
        interdictionShield: site.salvageState.interdictionShield || null,
        interdictionRaid: site.salvageState.interdictionRaid || null,
        signalGateShield: site.salvageState.signalGateShield || null,
        signalGateRaid: site.salvageState.signalGateRaid || null,
      })),
    };
  }

  function convoySummary(state) {
    return {
      version: state.convoy.version,
      releaseLabel: state.convoy.releaseLabel,
      status: state.convoy.status,
      activeRouteId: state.convoy.activeRouteId,
      completedRouteIds: state.convoy.completedRouteIds.slice(),
      failedRouteIds: state.convoy.failedRouteIds.slice(),
      partialRouteIds: state.convoy.partialRouteIds.slice(),
      beaconsDeployed: state.convoy.beaconsDeployed,
      payoutBanked: state.convoy.payoutBanked,
      convoyScore: state.ladder.convoyScore,
      escortLosses: state.convoy.escortLosses,
      supportIntegrity: state.stationServices.convoyEscortIntegrity || 0,
      supportMitigation: state.stationServices.convoyAmbushMitigation || 0,
      payoutBonus: state.stationServices.convoyPayoutBonus || 0,
      contract: {
        deliveredConvoyValue: state.contract.deliveredConvoyValue || 0,
      },
      routes: (state.convoyRoutes || []).map((route) => ({
        id: route.id,
        name: route.name,
        type: route.type,
        family: route.family,
        cargoValue: route.convoyState.cargoValue,
        payoutCredits: route.convoyState.payoutCredits,
        prerequisitesReady: route.prerequisiteStatus.ready,
        missingPrerequisites: route.prerequisiteStatus.missing.slice(),
        beacon: {
          id: route.beacon.id,
          name: route.beacon.name,
          deployed: route.beaconState.deployed,
          status: route.beaconState.status,
          integrity: route.beaconState.integrity,
          maxIntegrity: route.beaconState.maxIntegrity,
        },
        convoy: {
          status: route.convoyState.status,
          progress: route.convoyState.progress,
          cargoValue: route.convoyState.cargoValue,
          payoutCredits: route.convoyState.payoutCredits,
          escortIntegrity: route.convoyState.escortIntegrity,
          maxEscortIntegrity: route.convoyState.maxEscortIntegrity,
          ambushPressure: route.convoyState.ambushPressure,
          hazardExposure: route.convoyState.hazardExposure,
          deliveredValue: route.convoyState.deliveredValue,
          failureReason: route.convoyState.failureReason,
          countermeasureUsed: route.convoyState.countermeasureUsed,
          formationStatus: route.convoyState.formationStatus,
          lastDamage: route.convoyState.lastDamage,
          stormWindowStatus: route.convoyState.stormWindowStatus || "none",
          interdictionStatus: route.convoyState.interdictionStatus || "none",
          signalGateStatus: route.convoyState.signalGateStatus || "none",
        },
      })),
    };
  }

  function stormSummary(state) {
    return {
      version: state.storm.version,
      releaseLabel: state.storm.releaseLabel,
      status: state.storm.status,
      activeChartId: state.storm.activeChartId,
      completedChartIds: state.storm.completedChartIds.slice(),
      failedChartIds: state.storm.failedChartIds.slice(),
      partialChartIds: state.storm.partialChartIds.slice(),
      anchoredChartIds: state.storm.anchoredChartIds.slice(),
      payoutBanked: state.storm.payoutBanked,
      stormScore: state.ladder.stormScore,
      anchorsDeployed: state.storm.anchorsDeployed,
      windowsLocked: state.storm.windowsLocked,
      salvageReroutes: state.storm.salvageReroutes,
      scanPower: state.storm.scanPower,
      scanRange: state.storm.scanRange,
      supportIntegrity: state.stationServices.stormAnchorIntegrity || 0,
      supportMitigation: state.stationServices.stormHazardMitigation || 0,
      windowBonus: state.stationServices.stormWindowBonus || 0,
      payoutBonus: state.stationServices.stormPayoutBonus || 0,
      contract: {
        requiredStormCharts: state.contract.requiredStormCharts || 0,
        deliveredStormCharts: state.contract.deliveredStormCharts || 0,
        requiredStormPayout: state.contract.requiredStormPayout || 0,
        deliveredStormPayout: state.contract.deliveredStormPayout || 0,
      },
      charts: (state.stormCharts || []).map((chart) => ({
        id: chart.id,
        name: chart.name,
        type: chart.type,
        family: chart.family,
        intensity: chart.intensity,
        prerequisitesReady: chart.prerequisiteStatus.ready,
        missingPrerequisites: chart.prerequisiteStatus.missing.slice(),
        rewardCredits: chart.stormState.payoutCredits,
        surveyReward: chart.surveyReward || 0,
        ladderScore: chart.ladderScore || 0,
        safeWindow: stormWindowTiming(chart, state),
        anchor: {
          id: chart.anchor.id,
          name: chart.anchor.name,
          deployed: chart.stormState.anchorDeployed,
          integrity: chart.stormState.anchorIntegrity,
          maxIntegrity: chart.stormState.maxAnchorIntegrity,
        },
        modifiers: {
          convoyRouteIds: (chart.convoyRouteIds || []).slice(),
          salvageSiteIds: (chart.salvageSiteIds || []).slice(),
          convoyAmbushReduction: chart.convoyAmbushReduction || 0,
          convoyHazardReduction: chart.convoyHazardReduction || 0,
          convoyPayoutBonus: chart.convoyPayoutBonus || 0,
          salvageRiskReduction: chart.salvageRiskReduction || 0,
          hazardMitigation: chart.hazardMitigation || 0,
          piratePressureClear: chart.piratePressureClear || 0,
        },
        storm: {
          status: chart.stormState.status,
          progress: chart.stormState.progress,
          charted: chart.stormState.charted,
          outcome: chart.stormState.outcome,
          deliveredValue: chart.stormState.deliveredValue,
          partialPayoutCredits: chart.stormState.partialPayoutCredits,
          failureReason: chart.stormState.failureReason,
          countermeasureUsed: chart.stormState.countermeasureUsed,
          salvageReroutes: (chart.stormState.salvageReroutes || []).slice(),
        },
      })),
    };
  }

  function interdictionSummary(state) {
    return {
      version: state.interdiction.version,
      releaseLabel: state.interdiction.releaseLabel,
      status: state.interdiction.status,
      activeCellId: state.interdiction.activeCellId,
      completedCellIds: state.interdiction.completedCellIds.slice(),
      failedCellIds: state.interdiction.failedCellIds.slice(),
      partialCellIds: state.interdiction.partialCellIds.slice(),
      scannedCellIds: state.interdiction.scannedCellIds.slice(),
      luredCellIds: state.interdiction.luredCellIds.slice(),
      markerCellIds: state.interdiction.markerCellIds.slice(),
      payoutBanked: state.interdiction.payoutBanked,
      interdictionScore: state.ladder.interdictionScore,
      raidsResolved: state.interdiction.raidsResolved,
      scansCompleted: state.interdiction.scansCompleted,
      markersPlaced: state.interdiction.markersPlaced,
      luresDeployed: state.interdiction.luresDeployed,
      protectedSalvage: state.interdiction.protectedSalvage,
      scanPower: state.interdiction.scanPower,
      scanRange: state.interdiction.scanRange,
      markerRange: state.interdiction.markerRange,
      lureRange: state.interdiction.lureRange,
      supportMitigation: state.stationServices.interdictionRaidMitigation || 0,
      supportIntegrity: state.stationServices.interdictionSupportIntegrity || 0,
      responseWindowBonus: state.stationServices.interdictionResponseWindowBonus || 0,
      payoutBonus: state.stationServices.interdictionPayoutBonus || 0,
      contract: {
        requiredInterdictions: state.contract.requiredInterdictions || 0,
        deliveredInterdictions: state.contract.deliveredInterdictions || 0,
        requiredInterdictionPayout: state.contract.requiredInterdictionPayout || 0,
        deliveredInterdictionPayout: state.contract.deliveredInterdictionPayout || 0,
      },
      cells: (state.interdictionCells || []).map((cell) => ({
        id: cell.id,
        name: cell.name,
        type: cell.type,
        family: cell.family,
        trigger: cell.trigger,
        prerequisitesReady: cell.prerequisiteStatus.ready,
        missingPrerequisites: cell.prerequisiteStatus.missing.slice(),
        raidPressure: cell.interdictionState.raidPressure,
        baseRaidPressure: cell.raidPressure || 0,
        scanRequirement: cell.scanRequirement || 0,
        lureRequirement: cell.lureRequirement || 0,
        escortRequirement: cell.escortRequirement || 0,
        responseWindow: interdictionResponseTiming(cell, state),
        rewardCredits: cell.interdictionState.payoutCredits,
        ladderScore: cell.ladderScore || 0,
        targets: {
          convoyRouteIds: (cell.convoyRouteIds || []).slice(),
          salvageSiteIds: (cell.salvageSiteIds || []).slice(),
          stormChartIds: (cell.stormChartIds || []).slice(),
        },
        modifiers: {
          convoyAmbushReduction: cell.convoyAmbushReduction || 0,
          convoyEscortIntegrity: cell.convoyEscortIntegrity || 0,
          salvageRiskReduction: cell.salvageRiskReduction || 0,
          piratePressureClear: cell.piratePressureClear || 0,
          distressEscortIntegrity: cell.distressEscortIntegrity || 0,
          decoyRaidReduction: cell.decoyRaidReduction || 0,
          lurePressureDrop: cell.lurePressureDrop || 0,
          cargoLoss: cell.cargoLoss || 0,
        },
        state: {
          status: cell.interdictionState.status,
          progress: cell.interdictionState.progress,
          transponderScanned: cell.interdictionState.transponderScanned,
          markerPlaced: cell.interdictionState.markerPlaced,
          markerType: cell.interdictionState.markerType,
          lureDeployed: cell.interdictionState.lureDeployed,
          escortIntegrity: cell.interdictionState.escortIntegrity,
          outcome: cell.interdictionState.outcome,
          deliveredValue: cell.interdictionState.deliveredValue,
          partialPayoutCredits: cell.interdictionState.partialPayoutCredits,
          failureReason: cell.interdictionState.failureReason,
          countermeasureUsed: cell.interdictionState.countermeasureUsed,
          protectedSalvageIds: (cell.interdictionState.protectedSalvageIds || []).slice(),
        },
      })),
    };
  }

  function signalGateSummary(state) {
    return {
      version: state.signalGate.version,
      releaseLabel: state.signalGate.releaseLabel,
      status: state.signalGate.status,
      activeGateId: state.signalGate.activeGateId,
      completedGateIds: state.signalGate.completedGateIds.slice(),
      failedGateIds: state.signalGate.failedGateIds.slice(),
      partialGateIds: state.signalGate.partialGateIds.slice(),
      scannedGateIds: state.signalGate.scannedGateIds.slice(),
      alignedGateIds: state.signalGate.alignedGateIds.slice(),
      chargedGateIds: state.signalGate.chargedGateIds.slice(),
      transitGateIds: state.signalGate.transitGateIds.slice(),
      payoutBanked: state.signalGate.payoutBanked,
      signalScore: state.ladder.signalScore,
      scansCompleted: state.signalGate.scansCompleted,
      pylonsAligned: state.signalGate.pylonsAligned,
      capacitorsCharged: state.signalGate.capacitorsCharged,
      transitsResolved: state.signalGate.transitsResolved,
      convoyTransits: state.signalGate.convoyTransits,
      abortedTransits: state.signalGate.abortedTransits,
      pirateJamsMitigated: state.signalGate.pirateJamsMitigated,
      scanPower: state.signalGate.scanPower,
      scanRange: state.signalGate.scanRange,
      pylonAlignRange: state.signalGate.pylonAlignRange,
      capacitorRange: state.signalGate.capacitorRange,
      transitRange: state.signalGate.transitRange,
      pylonSupportIntegrity: state.stationServices.signalPylonIntegrity || 0,
      capacitorBonus: state.stationServices.signalCapacitorBonus || 0,
      transitWindowBonus: state.stationServices.signalTransitWindowBonus || 0,
      jamMitigation: state.stationServices.signalJamMitigation || 0,
      payoutBonus: state.stationServices.signalPayoutBonus || 0,
      contract: {
        requiredSignalTransits: state.contract.requiredSignalTransits || 0,
        deliveredSignalTransits: state.contract.deliveredSignalTransits || 0,
        requiredSignalPayout: state.contract.requiredSignalPayout || 0,
        deliveredSignalPayout: state.contract.deliveredSignalPayout || 0,
      },
      gates: (state.signalGates || []).map((gate) => ({
        id: gate.id,
        name: gate.name,
        type: gate.type,
        family: gate.family,
        sectorId: gate.sectorId,
        routeAssociation: gate.routeAssociation || null,
        prerequisitesReady: gate.prerequisiteStatus.ready,
        missingPrerequisites: gate.prerequisiteStatus.missing.slice(),
        scanSignature: gate.scanSignature,
        harmonicDifficulty: gate.harmonicDifficulty,
        capacitorRequirement: gate.gateState.capacitorRequirement,
        capacitorCharge: gate.gateState.capacitorCharge,
        transitWindow: signalGateTransitTiming(gate, state),
        rewardCredits: gate.gateState.payoutCredits,
        ladderScore: gate.ladderScore || 0,
        pirateJam: gate.gateState.pirateJam,
        pylon: {
          id: gate.pylon.id,
          name: gate.pylon.name,
          position: clone(gate.pylon.position),
          aligned: gate.gateState.pylonAligned,
          integrity: gate.gateState.pylonIntegrity,
          maxIntegrity: gate.gateState.maxPylonIntegrity,
        },
        lattice: {
          position: clone(gate.latticePosition || gate.position),
        },
        targets: {
          convoyRouteIds: (gate.convoyRouteIds || []).slice(),
          salvageSiteIds: (gate.salvageSiteIds || []).slice(),
          stormChartIds: (gate.stormChartIds || []).slice(),
        },
        modifiers: {
          convoyAmbushReduction: gate.convoyAmbushReduction || 0,
          convoyHazardReduction: gate.convoyHazardReduction || 0,
          convoyTransitPayoutBonus: gate.convoyTransitPayoutBonus || 0,
          salvageRiskReduction: gate.salvageRiskReduction || 0,
          stormAnchorIntegrity: gate.stormAnchorIntegrity || 0,
          piratePressureClear: gate.piratePressureClear || 0,
          cargoLoss: gate.cargoLoss || 0,
        },
        state: {
          status: gate.gateState.status,
          progress: gate.gateState.progress,
          harmonicsScanned: gate.gateState.harmonicsScanned,
          pylonAligned: gate.gateState.pylonAligned,
          capacitorCharge: gate.gateState.capacitorCharge,
          outcome: gate.gateState.outcome,
          deliveredValue: gate.gateState.deliveredValue,
          partialPayoutCredits: gate.gateState.partialPayoutCredits,
          failureReason: gate.gateState.failureReason,
          convoyTransitCommitted: gate.gateState.convoyTransitCommitted,
          countermeasureUsed: gate.gateState.countermeasureUsed,
          stormWindowAnchoredChartId: gate.gateState.stormWindowAnchoredChartId,
        },
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

  function convoySupportText(convoy, state) {
    const parts = [];
    if (convoy.supportIntegrity > 0) {
      parts.push(`escort +${Math.round(convoy.supportIntegrity)}`);
    }
    if (convoy.supportMitigation > 0) {
      parts.push(`ambush -${Math.round(convoy.supportMitigation * 100)}`);
    }
    if (convoy.payoutBonus > 0) {
      parts.push(`payout +${Math.round(convoy.payoutBonus * 100)}%`);
    }
    if (state.stationServices.countermeasureCharges > 0) {
      parts.push(`${state.stationServices.countermeasureCharges} burst`);
    }
    return parts.length ? parts.join(" / ") : "support none";
  }

  function convoyRouteSurface(route, supportText) {
    if (!route) {
      return {
        name: "No convoy route",
        routeText: "route none",
        beaconText: "beacon none",
        escortText: "escort 0/0",
        riskText: "ambush 0 / hazard 0",
        rewardText: "reward 0cr",
        supportText,
      };
    }
    const escort = `${Math.round(route.convoy.escortIntegrity)}/${Math.round(route.convoy.maxEscortIntegrity)}`;
    return {
      name: route.name,
      routeText: `${route.name} / ${route.convoy.status}`,
      beaconText: `${route.beacon.name} / ${route.beacon.status} / ${Math.round(route.beacon.integrity)}/${Math.round(
        route.beacon.maxIntegrity
      )}`,
      escortText: `escort ${escort} / ${route.convoy.formationStatus}`,
      riskText: `ambush ${Math.round(route.convoy.ambushPressure)} / hazard ${round(route.convoy.hazardExposure, 1)}`,
      rewardText: `${route.convoy.payoutCredits}cr reward / cargo ${route.cargoValue}cr`,
      supportText,
    };
  }

  function stormWindowText(timing) {
    if (!timing) {
      return "window none";
    }
    if (timing.locked) {
      return `window locked / ${timing.remaining}s remaining`;
    }
    if (timing.open) {
      return `window open / ${timing.remaining}s remaining`;
    }
    if (timing.pending) {
      return `opens ${timing.opensAt}s / closes ${timing.closesAt}s`;
    }
    if (timing.missed) {
      return "window missed";
    }
    return `window ${timing.opensAt}-${timing.closesAt}s`;
  }

  function stormSupportText(storm, state) {
    const parts = [];
    if (storm.scanPower > GAME_DATA.stormCartography.baseScanPower) {
      parts.push(`scan +${round(storm.scanPower - GAME_DATA.stormCartography.baseScanPower, 2)}`);
    }
    if (storm.supportIntegrity > 0) {
      parts.push(`anchor +${Math.round(storm.supportIntegrity)}`);
    }
    if (storm.windowBonus > 0) {
      parts.push(`window +${Math.round(storm.windowBonus)}s`);
    }
    if (storm.supportMitigation > 0) {
      parts.push(`hazard -${Math.round(storm.supportMitigation * 100)}%`);
    }
    if (storm.payoutBonus > 0) {
      parts.push(`payout +${Math.round(storm.payoutBonus * 100)}%`);
    }
    if (state.stationServices.countermeasureCharges > 0) {
      parts.push(`${state.stationServices.countermeasureCharges} burst`);
    }
    return parts.length ? parts.join(" / ") : "support none";
  }

  function stormRerouteCandidate(state, chart) {
    if (
      !chart ||
      !chart.stormState ||
      !chart.stormState.safeWindow.locked ||
      chart.stormState.outcome !== "none"
    ) {
      return null;
    }
    const completed = new Set(chart.stormState.salvageReroutes || []);
    return (
      (chart.salvageSiteIds || [])
        .map((siteId) => (state.salvageSites || []).find((site) => site.id === siteId))
        .find((site) => site && !completed.has(site.id) && (site.salvageState.stormReroute || {}).status !== "rerouted") || null
    );
  }

  function stormChartSurface(chart, supportText) {
    if (!chart) {
      return {
        name: "No storm chart",
        chartText: "chart none",
        windowText: "window none",
        anchorText: "anchor none",
        exposureText: "intensity 0 / reroute none",
        rewardText: "reward 0cr",
        supportText,
      };
    }
    const anchorStatus = chart.anchor.deployed ? "deployed" : "undeployed";
    const routedCount = chart.storm.salvageReroutes.length;
    const exposedCount = chart.modifiers.salvageSiteIds.length;
    return {
      name: chart.name,
      chartText: `${chart.name} / ${chart.storm.status}`,
      windowText: stormWindowText(chart.safeWindow),
      anchorText: `${chart.anchor.name} / ${anchorStatus} / ${Math.round(chart.anchor.integrity)}/${Math.round(
        chart.anchor.maxIntegrity
      )}`,
      exposureText: `intensity ${round(chart.intensity, 1)} / reroute ${routedCount}/${exposedCount} salvage / convoy ${chart.modifiers.convoyRouteIds.length}`,
      rewardText: `${chart.rewardCredits}cr reward / score ${chart.ladderScore} / outcome ${chart.storm.outcome}`,
      supportText,
    };
  }

  function interdictionResponseText(timing) {
    if (!timing) {
      return "window none";
    }
    if (timing.locked) {
      return `window marked / ${timing.remaining}s remaining`;
    }
    if (timing.open) {
      return `window open / ${timing.remaining}s remaining`;
    }
    if (timing.pending) {
      return `opens ${timing.opensAt}s / closes ${timing.closesAt}s`;
    }
    if (timing.missed) {
      return "window missed";
    }
    return `window ${timing.opensAt}-${timing.closesAt}s`;
  }

  function interdictionSupportText(interdiction, state) {
    const parts = [];
    if (interdiction.scanPower > GAME_DATA.knifeWakeInterdiction.baseScanPower) {
      parts.push(`scan +${round(interdiction.scanPower - GAME_DATA.knifeWakeInterdiction.baseScanPower, 2)}`);
    }
    if (interdiction.supportIntegrity > 0) {
      parts.push(`patrol +${Math.round(interdiction.supportIntegrity)}`);
    }
    if (interdiction.supportMitigation > 0) {
      parts.push(`raid -${Math.round(interdiction.supportMitigation * 100)}%`);
    }
    if (interdiction.responseWindowBonus > 0) {
      parts.push(`window +${Math.round(interdiction.responseWindowBonus)}s`);
    }
    if (interdiction.payoutBonus > 0) {
      parts.push(`payout +${Math.round(interdiction.payoutBonus * 100)}%`);
    }
    if (state.stationServices.countermeasureCharges > 0) {
      parts.push(`${state.stationServices.countermeasureCharges} burst`);
    }
    return parts.length ? parts.join(" / ") : "support none";
  }

  function interdictionCellSurface(cell, supportText) {
    if (!cell) {
      return {
        name: "No interdiction cell",
        cellText: "cell none",
        markerText: "marker none / lure no",
        windowText: "window none",
        exposureText: "convoy 0 / salvage 0 / storm 0",
        rewardText: "reward 0cr",
        supportText,
      };
    }
    const marker = cell.state.markerPlaced ? cell.state.markerType : "none";
    const lure = cell.state.lureDeployed ? "yes" : "no";
    const stateText = cell.prerequisitesReady ? cell.state.status : `locked: ${cell.missingPrerequisites.slice(0, 2).join(" + ") || "prereq"}`;
    return {
      name: cell.name,
      cellText: `${cell.name} / ${cell.type} / ${cell.family}`,
      markerText: `marker ${marker} / lure ${lure} / scan ${cell.state.transponderScanned ? "yes" : "no"}`,
      windowText: interdictionResponseText(cell.responseWindow),
      exposureText: `raid ${Math.round(cell.raidPressure)} / convoy ${cell.targets.convoyRouteIds.length} / salvage ${cell.targets.salvageSiteIds.length} / storm ${cell.targets.stormChartIds.length}`,
      rewardText: `${cell.rewardCredits}cr reward / score ${cell.ladderScore} / ${stateText}`,
      supportText,
    };
  }

  function signalGateWindowText(timing) {
    if (!timing) {
      return "window none";
    }
    if (timing.committed) {
      return `transit committed / ${timing.committedAt}s`;
    }
    if (timing.forced) {
      return `forced open / ${timing.remaining}s remaining`;
    }
    if (timing.open) {
      return `window open / ${timing.remaining}s remaining`;
    }
    if (timing.pending) {
      return `opens ${timing.opensAt}s / closes ${timing.closesAt}s`;
    }
    if (timing.missed) {
      return "window missed";
    }
    return `window ${timing.opensAt}-${timing.closesAt}s`;
  }

  function signalGateSupportText(signalGate, state) {
    const parts = [];
    if (signalGate.scanPower > GAME_DATA.signalGateExpedition.baseScanPower) {
      parts.push(`scan +${round(signalGate.scanPower - GAME_DATA.signalGateExpedition.baseScanPower, 2)}`);
    }
    if (signalGate.pylonSupportIntegrity > 0) {
      parts.push(`pylon +${Math.round(signalGate.pylonSupportIntegrity)}`);
    }
    if (signalGate.capacitorBonus > 0) {
      parts.push(`charge +${round(signalGate.capacitorBonus, 1)}`);
    }
    if (signalGate.transitWindowBonus > 0) {
      parts.push(`window +${Math.round(signalGate.transitWindowBonus)}s`);
    }
    if (signalGate.jamMitigation > 0) {
      parts.push(`jam -${Math.round(signalGate.jamMitigation * 100)}%`);
    }
    if (signalGate.payoutBonus > 0) {
      parts.push(`payout +${Math.round(signalGate.payoutBonus * 100)}%`);
    }
    if (state.stationServices.countermeasureCharges > 0) {
      parts.push(`${state.stationServices.countermeasureCharges} burst`);
    }
    return parts.length ? parts.join(" / ") : "support none";
  }

  function signalGateSurface(gate, supportText) {
    if (!gate) {
      return {
        name: "No signal gate",
        gateText: "gate none",
        pylonText: "pylon none",
        capacitorText: "charge 0/0",
        windowText: "window none",
        convoyText: "convoy none",
        jamText: `jam none / ${supportText}`,
        rewardText: "reward 0cr",
        prereqText: "prereq none",
        supportText,
      };
    }
    const stateText = gate.prerequisitesReady ? gate.state.status : `locked: ${gate.missingPrerequisites.slice(0, 2).join(" + ") || "prereq"}`;
    const pylonRatio = `${Math.round(gate.pylon.integrity)}/${Math.round(gate.pylon.maxIntegrity)}`;
    return {
      name: gate.name,
      gateText: `${gate.name} / ${gate.type} / ${gate.family}`,
      pylonText: `${gate.pylon.name} / ${gate.pylon.aligned ? "aligned" : "unaligned"} / ${pylonRatio}`,
      capacitorText: `charge ${round(gate.capacitorCharge, 1)}/${gate.capacitorRequirement} / ${
        gate.state.harmonicsScanned ? "harmonics yes" : "harmonics no"
      }`,
      windowText: signalGateWindowText(gate.transitWindow),
      convoyText: `${gate.routeAssociation || "no route"} / convoy ${gate.targets.convoyRouteIds.length} / salvage ${
        gate.targets.salvageSiteIds.length
      } / storm ${gate.targets.stormChartIds.length}`,
      jamText: `jam ${Math.round(gate.pirateJam)} / ${supportText}`,
      rewardText: `${gate.rewardCredits}cr reward / score ${gate.ladderScore} / ${stateText}`,
      prereqText: gate.prerequisitesReady ? "ready" : gate.missingPrerequisites.slice(0, 2).join(" + ") || "locked",
      supportText,
    };
  }

  function surveyCockpitSurface(state) {
    const summary = surveySummary(state);
    const salvage = salvageSummary(state);
    const convoy = convoySummary(state);
    const storm = stormSummary(state);
    const interdiction = interdictionSummary(state);
    const signalGate = signalGateSummary(state);
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
    const selectedSalvage =
      target.kind === "salvage" ? salvage.sites.find((site) => site.id === state.target.id) || null : null;
    const recommendedSalvage =
      selectedSalvage ||
      salvage.sites.find((site) => site.id === salvage.recommendedSiteId) ||
      salvage.sites.find((site) => site.remainingSalvage > 0) ||
      null;
    const lockedSalvageCount = salvage.sites.filter((site) => site.targetLocked).length;
    const activeConvoy = convoy.routes.find((route) => route.id === convoy.activeRouteId) || null;
    const convoyFocus =
      activeConvoy ||
      convoy.routes.find((route) => route.convoy.status === "ready") ||
      convoy.routes.find((route) => route.convoy.status === "needs beacon") ||
      convoy.routes[0] ||
      null;
    const selectedConvoy =
      target.kind === "convoy" ? convoy.routes.find((route) => route.id === state.target.id) || null : null;
    const selectedConvoyRoute = selectedConvoy ? convoyRouteById(state, selectedConvoy.id) : null;
    const selectedConvoyReadiness = selectedConvoy ? convoyRouteReadiness(state, selectedConvoy.id) : null;
    const selectedConvoyInRange = selectedConvoyRoute ? routeBeaconInRange(state, selectedConvoyRoute) : false;
    const selectedConvoyTerminal = selectedConvoyRoute
      ? ["delivered", "partial", "failed"].includes(selectedConvoyRoute.convoyState.status)
      : false;
    const supportText = convoySupportText(convoy, state);
    const convoyTarget = convoyRouteSurface(selectedConvoy || convoyFocus, supportText);
    const activeStorm = storm.charts.find((chart) => chart.id === storm.activeChartId) || null;
    const stormFocus =
      activeStorm ||
      storm.charts.find((chart) => ["window locked", "window open", "anchor ready", "charted", "uncharted"].includes(chart.storm.status)) ||
      storm.charts[0] ||
      null;
    const selectedStorm = target.kind === "storm" ? storm.charts.find((chart) => chart.id === state.target.id) || null : null;
    const selectedStormChart = selectedStorm ? stormChartById(state, selectedStorm.id) : null;
    const selectedStormReadiness = selectedStorm ? stormChartReadiness(state, selectedStorm.id) : null;
    const selectedStormScanInRange = selectedStormChart
      ? distance(state.ship.position, selectedStormChart.position) <= state.storm.scanRange + selectedStormChart.radius
      : false;
    const selectedStormAnchorInRange = selectedStormChart ? stormAnchorInRange(state, selectedStormChart) : false;
    const selectedStormTerminal = selectedStormChart
      ? ["complete", "partial", "failed"].includes(selectedStormChart.stormState.outcome)
      : false;
    const selectedStormReroute = stormRerouteCandidate(state, selectedStormChart);
    const stormSupport = stormSupportText(storm, state);
    const stormTarget = stormChartSurface(selectedStorm || stormFocus, stormSupport);
    const activeInterdiction = interdiction.cells.find((cell) => cell.id === interdiction.activeCellId) || null;
    const interdictionFocus =
      activeInterdiction ||
      interdiction.cells.find((cell) => cell.state.status !== "locked" && cell.state.outcome === "none") ||
      interdiction.cells[0] ||
      null;
    const selectedInterdiction =
      target.kind === "interdiction" ? interdiction.cells.find((cell) => cell.id === state.target.id) || null : null;
    const selectedInterdictionCell = selectedInterdiction ? interdictionCellById(state, selectedInterdiction.id) : null;
    const selectedInterdictionReadiness = selectedInterdiction ? interdictionCellReadiness(state, selectedInterdiction.id) : null;
    const selectedInterdictionScanInRange = selectedInterdictionCell
      ? interdictionCellInRange(state, selectedInterdictionCell, state.interdiction.scanRange)
      : false;
    const selectedInterdictionMarkerInRange = selectedInterdictionCell
      ? interdictionCellInRange(state, selectedInterdictionCell, state.interdiction.markerRange) || state.station.proximity.dockable
      : false;
    const selectedInterdictionLureInRange = selectedInterdictionCell
      ? interdictionCellInRange(state, selectedInterdictionCell, state.interdiction.lureRange) || state.station.proximity.dockable
      : false;
    const selectedInterdictionTerminal = selectedInterdictionCell
      ? ["success", "partial", "failed"].includes(selectedInterdictionCell.interdictionState.outcome)
      : false;
    const interdictionSupport = interdictionSupportText(interdiction, state);
    const interdictionTarget = interdictionCellSurface(selectedInterdiction || interdictionFocus, interdictionSupport);
    const selectedSignal = target.kind === "signal-gate" ? signalGate.gates.find((gate) => gate.id === state.target.id) || null : null;
    const selectedSignalGate = selectedSignal ? signalGateById(state, selectedSignal.id) : null;
    const selectedSignalReadiness = selectedSignal ? signalGateReadiness(state, selectedSignal.id) : null;
    const selectedSignalScanInRange = selectedSignalGate
      ? signalGateInRange(state, selectedSignalGate, state.signalGate.scanRange)
      : false;
    const selectedSignalPylonInRange = selectedSignalGate
      ? signalGateInRange(state, selectedSignalGate, selectedSignalGate.pylonAlignRange || state.signalGate.pylonAlignRange, "pylon") ||
        state.station.proximity.dockable
      : false;
    const selectedSignalCapacitorInRange = selectedSignalGate
      ? signalGateInRange(state, selectedSignalGate, state.signalGate.capacitorRange) || state.station.proximity.dockable
      : false;
    const selectedSignalTransitInRange = selectedSignalGate
      ? signalGateInRange(state, selectedSignalGate, state.signalGate.transitRange) || state.station.proximity.dockable
      : false;
    const selectedSignalTerminal = selectedSignalGate
      ? ["success", "partial", "failed"].includes(selectedSignalGate.gateState.outcome)
      : false;
    const activeSignal = signalGate.gates.find((gate) => gate.id === signalGate.activeGateId) || null;
    const signalFocus =
      activeSignal ||
      signalGate.gates.find((gate) => gate.prerequisitesReady && !["success", "partial", "failed"].includes(gate.state.outcome)) ||
      signalGate.gates[0] ||
      null;
    const signalSupport = signalGateSupportText(signalGate, state);
    const signalTarget = signalGateSurface(selectedSignal || signalFocus, signalSupport);
    const convoyRows =
      convoy.routes.length > 0
        ? convoy.routes.map((route) => ({
            id: route.id,
            name: route.name,
            state: route.convoy.status,
            primaryText: `${route.convoy.status} / ${route.beacon.status}`,
            detailText: route.prerequisitesReady
              ? `escort ${Math.round(route.convoy.escortIntegrity)}/${Math.round(
                  route.convoy.maxEscortIntegrity
                )} / ambush ${Math.round(route.convoy.ambushPressure)} / ${route.convoy.payoutCredits}cr`
              : route.missingPrerequisites.slice(0, 2).join(" + ") || "locked",
          }))
        : [
            {
              id: "no-convoy-route",
              name: "No convoy lane",
              state: "no-route",
              primaryText: "no convoy route in this sector",
              detailText: "choose a higher tier route",
            },
          ];
    const stormRows =
      storm.charts.length > 0
        ? storm.charts.map((chart) => ({
            id: chart.id,
            name: chart.name,
            state: chart.storm.status,
            primaryText: `${chart.storm.status} / ${stormWindowText(chart.safeWindow)}`,
            detailText: chart.prerequisitesReady
              ? `anchor ${Math.round(chart.anchor.integrity)}/${Math.round(chart.anchor.maxIntegrity)} / intensity ${round(
                  chart.intensity,
                  1
                )} / ${chart.rewardCredits}cr`
              : chart.missingPrerequisites.slice(0, 2).join(" + ") || "locked",
          }))
        : [
            {
              id: "no-storm-chart",
              name: "No storm chart",
              state: "no-chart",
              primaryText: "no storm front in this sector",
              detailText: "choose a higher tier route",
            },
          ];
    const interdictionRows =
      interdiction.cells.length > 0
        ? interdiction.cells.map((cell) => ({
            id: cell.id,
            name: cell.name,
            state: cell.state.status,
            primaryText: `${cell.state.status} / ${interdictionResponseText(cell.responseWindow)}`,
            detailText: cell.prerequisitesReady
              ? `raid ${Math.round(cell.raidPressure)} / marker ${cell.state.markerType || "none"} / ${cell.rewardCredits}cr`
              : cell.missingPrerequisites.slice(0, 2).join(" + ") || "locked",
          }))
        : [
            {
              id: "no-interdiction-cell",
              name: "No Knife Wake cell",
              state: "no-cell",
              primaryText: "no pirate cell in this sector",
              detailText: "choose a higher tier route",
            },
          ];
    const signalRows =
      signalGate.gates.length > 0
        ? signalGate.gates.map((gate) => ({
            id: gate.id,
            name: gate.name,
            state: gate.state.status,
            primaryText: `${gate.state.status} / ${signalGateWindowText(gate.transitWindow)}`,
            detailText: gate.prerequisitesReady
              ? `charge ${round(gate.capacitorCharge, 1)}/${gate.capacitorRequirement} / jam ${Math.round(
                  gate.pirateJam
                )} / ${gate.rewardCredits}cr`
              : gate.missingPrerequisites.slice(0, 2).join(" + ") || "locked",
          }))
        : [
            {
              id: "no-signal-gate",
              name: "No signal gate",
              state: "no-gate",
              primaryText: "no relay gate in this sector",
              detailText: "choose a higher tier route",
            },
          ];
    const salvageProgress =
      selectedSalvage && selectedSalvage.extractionDifficulty
        ? Math.round((selectedSalvage.extractionProgress / selectedSalvage.extractionDifficulty) * 100)
        : 0;
    const salvageContractParts = [];
    if (state.contract.requiredSalvageValue > 0) {
      salvageContractParts.push(
        `${state.contract.deliveredSalvageValue}/${state.contract.requiredSalvageValue}cr contract`
      );
    }
    if (state.contract.requiredRelics > 0) {
      salvageContractParts.push(`${state.contract.deliveredRelics}/${state.contract.requiredRelics} relic`);
    }
    const objectiveParts = [`${state.contract.title}: ${summary.contract.ore} ore`];
    if (state.contract.requiredScans > 0) {
      objectiveParts.push(`${summary.contract.scans} scans`);
    }
    if (state.contract.requiredSalvageValue > 0) {
      objectiveParts.push(`${state.contract.deliveredSalvageValue}/${state.contract.requiredSalvageValue}cr salvage`);
    }
    if (state.contract.requiredRelics > 0) {
      objectiveParts.push(`${state.contract.deliveredRelics}/${state.contract.requiredRelics} relic`);
    }
    if (state.contract.requiredStormCharts > 0) {
      objectiveParts.push(`${state.contract.deliveredStormCharts}/${state.contract.requiredStormCharts} storm`);
    }
    if (state.contract.requiredStormPayout > 0) {
      objectiveParts.push(`${state.contract.deliveredStormPayout}/${state.contract.requiredStormPayout}cr storm`);
    }
    if (state.contract.requiredInterdictions > 0) {
      objectiveParts.push(`${state.contract.deliveredInterdictions}/${state.contract.requiredInterdictions} interdiction`);
    }
    if (state.contract.requiredInterdictionPayout > 0) {
      objectiveParts.push(
        `${state.contract.deliveredInterdictionPayout}/${state.contract.requiredInterdictionPayout}cr interdiction`
      );
    }
    if (state.contract.requiredSignalTransits > 0) {
      objectiveParts.push(`${state.contract.deliveredSignalTransits}/${state.contract.requiredSignalTransits} gate`);
    }
    if (state.contract.requiredSignalPayout > 0) {
      objectiveParts.push(`${state.contract.deliveredSignalPayout}/${state.contract.requiredSignalPayout}cr gate`);
    }

    return {
      titleText: `${summary.releaseLabel} v${summary.version} + ${salvage.releaseLabel} v${salvage.version} + ${convoy.releaseLabel} v${convoy.version} + ${storm.releaseLabel} v${storm.version} + ${interdiction.releaseLabel} v${interdiction.version} + ${signalGate.releaseLabel} v${signalGate.version} / tier ${summary.tier}`,
      ladderText: `tier ${summary.tier} / ${completedCount}/${totalSectors} charted`,
      sectorText: `${summary.sectorName} / ${summary.condition}`,
      objectiveProgressText: objectiveParts.join(" / "),
      hazardText: `${summary.hazard.status} / exposure ${round(summary.hazard.exposure, 1)} / eff ${round(summary.hazard.effectiveIntensity, 1)}`,
      scanText: `${scanGoal} / ${state.scanning.status}`,
      salvageText: `${salvage.releaseLabel} / hold ${salvage.holdValue}cr / relics ${salvage.relicsInHold} / locks ${lockedSalvageCount}/${salvage.sites.length}`,
      convoyText: convoyFocus
        ? `${convoy.releaseLabel} / ${convoyFocus.name} / ${convoyFocus.convoy.status} / escort ${Math.round(
            convoyFocus.convoy.escortIntegrity
          )}/${Math.round(convoyFocus.convoy.maxEscortIntegrity)}`
        : `${convoy.releaseLabel} / no route`,
      beaconText: convoyFocus ? convoyRouteSurface(convoyFocus, supportText).beaconText : "beacon none",
      ambushText: convoyFocus
        ? `${convoyRouteSurface(convoyFocus, supportText).riskText} / ${convoyFocus.convoy.payoutCredits}cr`
        : "risk 0 / 0cr",
      stormText: stormFocus
        ? `${storm.releaseLabel} / ${stormFocus.name} / ${stormFocus.storm.status} / intensity ${round(stormFocus.intensity, 1)}`
        : `${storm.releaseLabel} / no chart`,
      interdictionText: interdictionFocus
        ? `${interdiction.releaseLabel} / ${interdictionFocus.name} / ${interdictionFocus.state.status} / raid ${Math.round(
            interdictionFocus.raidPressure
          )}`
        : `${interdiction.releaseLabel} / no cell`,
      signalGateText: signalFocus
        ? `${signalGate.releaseLabel} / ${signalFocus.name} / ${signalFocus.state.status} / jam ${Math.round(signalFocus.pirateJam)}`
        : `${signalGate.releaseLabel} / no gate`,
      interdictionRaidText: interdictionFocus
        ? `raid ${Math.round(interdictionFocus.raidPressure)} / ${interdictionFocus.type} / ${interdictionFocus.state.outcome}`
        : "raid none",
      interdictionLureText: interdictionFocus
        ? `marker ${interdictionFocus.state.markerType || "none"} / lure ${
            interdictionFocus.state.lureDeployed ? "yes" : "no"
          } / ${interdictionResponseText(interdictionFocus.responseWindow)}`
        : "marker none",
      signalCapacitorText: signalTarget.capacitorText,
      signalTransitText: signalTarget.windowText,
      signalJamText: signalTarget.jamText,
      stormWindowText: stormTarget.windowText,
      stormAnchorText: stormTarget.anchorText,
      salvageTarget: {
        name: recommendedSalvage ? recommendedSalvage.name : "No salvage site",
        familyText: recommendedSalvage
          ? `${recommendedSalvage.type} / ${recommendedSalvage.family} / ${recommendedSalvage.remainingSalvage} units`
          : "site none",
        lockText: selectedSalvage
          ? `lock ${Math.round(selectedSalvage.scanConfidence * 100)}% / ${
              selectedSalvage.targetLocked ? "locked" : "unlocked"
            }`
          : "select salvage target",
        extractionText: selectedSalvage ? `extract ${salvageProgress}% / ${selectedSalvage.status}` : "extract idle",
        riskRewardText: recommendedSalvage
          ? `risk ${recommendedSalvage.risk} / ${recommendedSalvage.rewardValue}cr${
              recommendedSalvage.relicReward ? ` / ${recommendedSalvage.relicReward} relic` : ""
            }`
          : "risk none",
        contractText: salvageContractParts.length ? salvageContractParts.join(" / ") : "optional recovery",
      },
      convoyTarget,
      convoySupportText: supportText,
      stormTarget,
      stormSupportText: stormSupport,
      interdictionTarget,
      interdictionSupportText: interdictionSupport,
      signalTarget,
      signalSupportText: signalSupport,
      serviceText:
        serviceNames.length > 0
          ? `${serviceNames.join(" + ")} / ${state.stationServices.countermeasureCharges} burst`
          : `${state.stationServices.lastService} / ${state.stationServices.countermeasureCharges} burst`,
      cockpit: cockpitSurface(state, target),
      statusText: `${summary.sectorName}: ${state.run.objective}`,
      routeText: `${completedCount} charted / next ${sectorById(summary.recommendedSectorId).name}`,
      tutorial: state.tutorial,
      accessibility: {
        ...(state.accessibility || {}),
        ...motionSurfaceForState(state),
      },
      disclosure: state.disclosure,
      systemAccess: state.systemAccess,
      selectedTargetPrompt: state.selectedTargetPrompt,
      stationMenu: state.stationMenu,
      sectors,
      services,
      convoyRoutes: convoy.routes,
      convoyRows,
      stormCharts: storm.charts,
      stormRows,
      interdictionCells: interdiction.cells,
      interdictionRows,
      signalGates: signalGate.gates,
      signalRows,
      actions: {
        canScan:
          canAct &&
          (target.kind === "anomaly" ||
            (target.kind === "storm" &&
              selectedStormReadiness &&
              selectedStormReadiness.canScan &&
              selectedStormScanInRange) ||
            (target.kind === "interdiction" &&
              selectedInterdictionReadiness &&
              selectedInterdictionReadiness.canScan &&
              selectedInterdictionScanInRange) ||
            (target.kind === "signal-gate" &&
              selectedSignalReadiness &&
              selectedSignalReadiness.canScan &&
              selectedSignalScanInRange)),
        canScanSalvage: canAct && target.kind === "salvage",
        canExtractSalvage: canAct && target.kind === "salvage",
        canAbandonSalvage:
          canAct &&
          target.kind === "salvage" &&
          selectedSalvage &&
          !["failed", "depleted", "abandoned"].includes(selectedSalvage.status),
        canSetSector: canAct && sectorChoiceOpen(state),
        canDeployBeacon:
          canAct &&
          target.kind === "convoy" &&
          selectedConvoyReadiness &&
          selectedConvoyReadiness.canDeployBeacon &&
          selectedConvoyInRange,
        canMaintainBeacon:
          canAct &&
          target.kind === "convoy" &&
          selectedConvoyRoute &&
          selectedConvoyRoute.beaconState.deployed &&
          !selectedConvoyTerminal &&
          (selectedConvoyInRange || state.station.proximity.dockable),
        canStartConvoy:
          canAct &&
          target.kind === "convoy" &&
          selectedConvoyReadiness &&
          selectedConvoyReadiness.canStart &&
          selectedConvoyRoute &&
          !["enroute", "ambushed", "straggling"].includes(selectedConvoyRoute.convoyState.status),
        canCountermeasureConvoy: canAct && Boolean(convoy.activeRouteId) && state.stationServices.countermeasureCharges > 0,
        canDeployStormAnchor:
          canAct &&
          target.kind === "storm" &&
          selectedStormReadiness &&
          selectedStormReadiness.canDeployAnchor &&
          selectedStormAnchorInRange,
        canMaintainStormAnchor:
          canAct &&
          target.kind === "storm" &&
          selectedStormReadiness &&
          selectedStormReadiness.canMaintainAnchor &&
          !selectedStormTerminal &&
          (selectedStormAnchorInRange || state.station.proximity.dockable),
        canLockStormWindow:
          canAct &&
          target.kind === "storm" &&
          selectedStormReadiness &&
          selectedStormReadiness.canLockWindow,
        canRerouteStormSalvage: canAct && target.kind === "storm" && Boolean(selectedStormReroute),
        canCountermeasureStorm:
          canAct &&
          Boolean(
            activeStorm &&
              activeStorm.safeWindow.locked &&
              activeStorm.storm.outcome === "none" &&
              state.stationServices.countermeasureCharges > 0
          ),
        canCountermeasureInterdiction:
          canAct &&
          Boolean(
            activeInterdiction &&
              activeInterdiction.state.transponderScanned &&
              activeInterdiction.state.outcome === "none" &&
              state.stationServices.countermeasureCharges > 0
          ),
        canCountermeasureSignalGate:
          canAct &&
          Boolean(
            signalGate.activeGateId &&
              signalGate.gates.find((gate) => gate.id === signalGate.activeGateId && gate.state.harmonicsScanned && gate.state.outcome === "none") &&
              state.stationServices.countermeasureCharges > 0
          ),
        canAlignSignalGatePylon:
          canAct &&
          target.kind === "signal-gate" &&
          selectedSignalReadiness &&
          selectedSignalReadiness.canAlignPylon &&
          selectedSignalPylonInRange,
        canChargeSignalGateCapacitor:
          canAct &&
          target.kind === "signal-gate" &&
          selectedSignalReadiness &&
          selectedSignalReadiness.canChargeCapacitor &&
          selectedSignalCapacitorInRange,
        canAnchorSignalGateWindow:
          canAct &&
          target.kind === "signal-gate" &&
          selectedSignalReadiness &&
          selectedSignalReadiness.canAnchorStormWindow,
        canCommitSignalGateTransit:
          canAct &&
          target.kind === "signal-gate" &&
          selectedSignalReadiness &&
          selectedSignalReadiness.canCommitTransit &&
          selectedSignalTransitInRange,
        canAbortSignalGateTransit:
          canAct &&
          target.kind === "signal-gate" &&
          selectedSignalReadiness &&
          selectedSignalReadiness.canAbortTransit &&
          !selectedSignalTerminal,
        canForceSignalGateOpen:
          canAct &&
          target.kind === "signal-gate" &&
          selectedSignalReadiness &&
          selectedSignalReadiness.canForceOpen &&
          selectedSignalTransitInRange,
        canScanSignalGate:
          canAct &&
          target.kind === "signal-gate" &&
          selectedSignalReadiness &&
          selectedSignalReadiness.canScan &&
          selectedSignalScanInRange,
        canScanInterdiction:
          canAct &&
          target.kind === "interdiction" &&
          selectedInterdictionReadiness &&
          selectedInterdictionReadiness.canScan &&
          selectedInterdictionScanInRange,
        canPlaceInterdictionMarker:
          canAct &&
          target.kind === "interdiction" &&
          selectedInterdictionReadiness &&
          selectedInterdictionReadiness.canPlaceMarker &&
          selectedInterdictionMarkerInRange,
        canDeployInterdictionLure:
          canAct &&
          target.kind === "interdiction" &&
          selectedInterdictionReadiness &&
          selectedInterdictionReadiness.canDeployLure &&
          selectedInterdictionLureInRange,
        canResolveInterdictionRaid:
          canAct &&
          target.kind === "interdiction" &&
          selectedInterdictionReadiness &&
          selectedInterdictionReadiness.canResolveRaid &&
          !selectedInterdictionTerminal,
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
        id: null,
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
    } else if (state.target.kind === "convoy") {
      status = `${target.convoyState.status} / beacon ${target.beaconState.status} / escort ${Math.round(
        target.convoyState.escortIntegrity
      )}/${Math.round(target.convoyState.maxEscortIntegrity)} / ambush ${target.convoyState.ambushPressure}`;
    } else if (state.target.kind === "storm") {
      const timing = stormWindowTiming(target, state);
      const progress = Math.round((target.stormState.progress / target.scanDifficulty) * 100);
      status = `${target.stormState.status} / chart ${progress}% / window ${timing.locked ? "locked" : timing.open ? "open" : timing.pending ? "pending" : "missed"} / anchor ${Math.round(
        target.stormState.anchorIntegrity
      )}/${Math.round(target.stormState.maxAnchorIntegrity)}`;
    } else if (state.target.kind === "interdiction") {
      const timing = interdictionResponseTiming(target, state);
      const progress = Math.round((target.interdictionState.progress / target.transponderDifficulty) * 100);
      status = `${target.interdictionState.status} / transponder ${progress}% / window ${
        timing.locked ? "marked" : timing.open ? "open" : timing.pending ? "pending" : "missed"
      } / raid ${Math.round(target.interdictionState.raidPressure)}`;
    } else if (state.target.kind === "signal-gate") {
      const timing = signalGateTransitTiming(target, state);
      const progress = Math.round((target.gateState.progress / target.harmonicDifficulty) * 100);
      status = `${target.gateState.status} / harmonics ${progress}% / capacitor ${round(
        target.gateState.capacitorCharge,
        1
      )}/${target.gateState.capacitorRequirement} / window ${
        timing.committed ? "committed" : timing.forced ? "forced" : timing.open ? "open" : timing.pending ? "pending" : "missed"
      } / jam ${Math.round(target.gateState.pirateJam)}`;
    } else if (state.target.kind === "station") {
      status = state.station.proximity.dockable ? "dockable" : "stand off";
    } else if (state.target.kind === "pirate") {
      status = state.pirate.encounterState;
    }
    const summary = {
      id: state.target.id,
      name: target.name,
      kind: state.target.kind,
      status,
      distance: state.target.distance,
      bearing: state.target.bearing,
      prompt: state.selectedTargetPrompt ? state.selectedTargetPrompt.prompt : null,
      action: state.selectedTargetPrompt ? state.selectedTargetPrompt.action : null,
      reticleState: state.selectedTargetPrompt ? state.selectedTargetPrompt.reticleState : null,
    };
    if (state.target.kind === "salvage") {
      summary.type = target.type;
      summary.family = target.family;
      summary.scanConfidence = target.salvageState.scanConfidence;
      summary.targetLocked = target.salvageState.targetLocked;
      summary.extractionProgress = target.salvageState.extractionProgress;
      summary.extractionDifficulty = target.extractionDifficulty;
      summary.extractionPercent = Math.round((target.salvageState.extractionProgress / target.extractionDifficulty) * 100);
      summary.remainingSalvage = target.salvageState.remainingSalvage;
      summary.rewardValue = target.rewardValue;
      summary.relicReward = target.relicReward || 0;
      summary.risk = salvageRisk(target, state);
    }
    if (state.target.kind === "convoy") {
      summary.type = target.type;
      summary.family = target.family;
      summary.beaconId = target.beacon.id;
      summary.beaconStatus = target.beaconState.status;
      summary.beaconIntegrity = target.beaconState.integrity;
      summary.prerequisitesReady = target.prerequisiteStatus.ready;
      summary.missingPrerequisites = target.prerequisiteStatus.missing.slice();
      summary.progress = target.convoyState.progress;
      summary.escortIntegrity = target.convoyState.escortIntegrity;
      summary.maxEscortIntegrity = target.convoyState.maxEscortIntegrity;
      summary.ambushPressure = target.convoyState.ambushPressure;
      summary.hazardExposure = target.convoyState.hazardExposure;
      summary.payoutCredits = target.convoyState.payoutCredits;
      summary.deliveredValue = target.convoyState.deliveredValue;
    }
    if (state.target.kind === "storm") {
      summary.type = target.type;
      summary.family = target.family;
      summary.intensity = target.intensity;
      summary.charted = target.stormState.charted;
      summary.anchorId = target.anchor.id;
      summary.anchorStatus = target.stormState.anchorDeployed ? "deployed" : "undeployed";
      summary.anchorIntegrity = target.stormState.anchorIntegrity;
      summary.maxAnchorIntegrity = target.stormState.maxAnchorIntegrity;
      summary.safeWindow = stormWindowTiming(target, state);
      summary.rewardCredits = target.stormState.payoutCredits;
      summary.prerequisitesReady = target.prerequisiteStatus.ready;
      summary.missingPrerequisites = target.prerequisiteStatus.missing.slice();
      summary.outcome = target.stormState.outcome;
      summary.deliveredValue = target.stormState.deliveredValue;
    }
    if (state.target.kind === "interdiction") {
      summary.type = target.type;
      summary.family = target.family;
      summary.trigger = target.trigger;
      summary.raidPressure = target.interdictionState.raidPressure;
      summary.baseRaidPressure = target.raidPressure || 0;
      summary.transponderScanned = target.interdictionState.transponderScanned;
      summary.markerPlaced = target.interdictionState.markerPlaced;
      summary.markerType = target.interdictionState.markerType;
      summary.lureDeployed = target.interdictionState.lureDeployed;
      summary.responseWindow = interdictionResponseTiming(target, state);
      summary.rewardCredits = target.interdictionState.payoutCredits;
      summary.prerequisitesReady = target.prerequisiteStatus.ready;
      summary.missingPrerequisites = target.prerequisiteStatus.missing.slice();
      summary.convoyRouteIds = (target.convoyRouteIds || []).slice();
      summary.salvageSiteIds = (target.salvageSiteIds || []).slice();
      summary.stormChartIds = (target.stormChartIds || []).slice();
      summary.outcome = target.interdictionState.outcome;
      summary.deliveredValue = target.interdictionState.deliveredValue;
    }
    if (state.target.kind === "signal-gate") {
      summary.type = target.type;
      summary.family = target.family;
      summary.routeAssociation = target.routeAssociation || null;
      summary.pylonId = target.pylon.id;
      summary.pylonAligned = target.gateState.pylonAligned;
      summary.pylonIntegrity = target.gateState.pylonIntegrity;
      summary.maxPylonIntegrity = target.gateState.maxPylonIntegrity;
      summary.harmonicsScanned = target.gateState.harmonicsScanned;
      summary.capacitorCharge = target.gateState.capacitorCharge;
      summary.capacitorRequirement = target.gateState.capacitorRequirement;
      summary.transitWindow = signalGateTransitTiming(target, state);
      summary.rewardCredits = target.gateState.payoutCredits;
      summary.prerequisitesReady = target.prerequisiteStatus.ready;
      summary.missingPrerequisites = target.prerequisiteStatus.missing.slice();
      summary.convoyRouteIds = (target.convoyRouteIds || []).slice();
      summary.salvageSiteIds = (target.salvageSiteIds || []).slice();
      summary.stormChartIds = (target.stormChartIds || []).slice();
      summary.pirateJam = target.gateState.pirateJam;
      summary.outcome = target.gateState.outcome;
      summary.deliveredValue = target.gateState.deliveredValue;
    }
    return summary;
  }

  function cockpitLabelPosition(state, position) {
    const bearing = bearingDegrees(state.ship.position, state.ship.heading, position);
    const verticalDelta = position.y - state.ship.position.y;
    return {
      bearing,
      x: round(clamp(50 + bearing * 0.44, 8, 92), 1),
      y: round(clamp(44 - verticalDelta * 1.55, 16, 74), 1),
      offscreen: Math.abs(bearing) > 75,
    };
  }

  function radarBlipForPosition(state, position, kind, label) {
    const delta = subtract(position, state.ship.position);
    const heading = -(state.ship.heading || 0);
    const cos = Math.cos(heading);
    const sin = Math.sin(heading);
    const localX = delta.x * cos - delta.z * sin;
    const localZ = delta.x * sin + delta.z * cos;
    return {
      kind,
      label,
      x: round(clamp(50 + (localX / 90) * 50, 6, 94), 1),
      y: round(clamp(50 + (localZ / 90) * 50, 6, 94), 1),
      distance: round(distance(state.ship.position, position), 1),
    };
  }

  function targetTypeLabel(kind) {
    const labels = {
      asteroid: "Ore target",
      anomaly: "Anomaly",
      salvage: "Salvage",
      convoy: "Convoy beacon",
      storm: "Storm chart",
      interdiction: "Interdiction",
      "signal-gate": "Signal gate",
      station: "Station",
      pirate: "Threat",
    };
    return labels[kind] || "Target";
  }

  function cockpitSecondaryPrompt(state, reticleState) {
    const threatFeedback = pirateWarningFeedback(state);
    if (threatFeedback.visible && threatFeedback.stage !== "locked") {
      return threatFeedback.guidance;
    }
    if (reticleState === "mine-in-range") {
      return "Hold Space or M to mine.";
    }
    if (reticleState === "dockable-station") {
      return "Press F or Enter to dock.";
    }
    if (reticleState === "cargo-full-return") {
      return "Cargo full: return to Frontier Spoke.";
    }
    if (reticleState === "offscreen-direction") {
      const side = (state.target.bearing || 0) < 0 ? "port" : "starboard";
      return `Target off-screen ${side}: follow the edge arrow.`;
    }
    if (reticleState === "station-out-of-range") {
      return "Close to the docking ring.";
    }
    if (reticleState === "target-out-of-range") {
      return "Close distance until the reticle changes to ready.";
    }
    if (state.selectedTargetPrompt && state.selectedTargetPrompt.verticalAdjustmentRequired && !state.selectedTargetPrompt.verticalAdjustmentComplete) {
      return "Use Q or Ctrl to trim vertical alignment.";
    }
    return "Tab or E cycles targets.";
  }

  function pirateWarningFeedback(state) {
    const pirate = state.pirate || {};
    const unlocked =
      pirate.unlockState === "unlocked" ||
      pirate.state !== "dormant" ||
      Boolean(state.systemAccess && state.systemAccess.pirate && !(state.tutorial && state.tutorial.status === "active"));
    if (!unlocked) {
      return {
        stage: "locked",
        markerState: "hidden",
        visible: false,
        countdown: null,
        guidance: "Complete the first contract before pirate pressure unlocks.",
      };
    }

    const spawnTick = pirate.spawnTick === undefined || pirate.spawnTick === null ? state.elapsed : pirate.spawnTick;
    const countdown = Math.max(0, round(spawnTick - state.elapsed, 1));
    if (pirate.state === "dormant") {
      return {
        stage: countdown > 3 ? "warning" : "imminent",
        markerState: "warning",
        visible: true,
        countdown,
        guidance:
          countdown > 3
            ? "Pirate signal unlocked: dock for decoy bursts or keep the station between you and Knife Wake."
            : "Knife Wake closing: launch, dock, or save a decoy burst for contact.",
      };
    }

    if (pirate.encounterState === "close") {
      return {
        stage: "close",
        markerState: "threat",
        visible: true,
        countdown: 0,
        guidance: "Knife Wake close: brake away, dock, or fire a decoy burst.",
      };
    }

    return {
      stage: pirate.encounterState === "shadow" ? "shadow" : "contact",
      markerState: "threat",
      visible: true,
      countdown: 0,
      guidance: "Pirate marker live: keep distance, dock for repairs, or spend a decoy burst.",
    };
  }

  function cockpitStationMenu(state) {
    const upgrades = GAME_DATA.upgrades
      .filter((upgrade) => !state.upgrades.purchased.includes(upgrade.id))
      .slice(0, 3)
      .map((upgrade) => ({
        id: upgrade.id,
        name: upgrade.name,
        cost: upgrade.cost,
        enabled: Boolean(state.station.docked && state.credits >= upgrade.cost),
        status: state.credits >= upgrade.cost ? "ready" : `${upgrade.cost - state.credits}cr short`,
        miningPowerBonus: upgrade.miningPowerBonus || 0,
        cargoCapacityBonus: upgrade.cargoCapacityBonus || 0,
        preview: `cargo +${upgrade.cargoCapacityBonus || 0} / beam +${upgrade.miningPowerBonus || 0}`,
      }));
    return {
      open: Boolean(state.station.docked),
      title: state.stationMenu ? state.stationMenu.launchPrompt : "Docked",
      cargoSaleText:
        state.station.lastSale > 0
          ? `Sold cargo: ${state.station.lastSale}cr`
          : state.cargo.ore > 0
            ? `${state.cargo.ore} ore ready for sale`
            : "No cargo in hold",
      refuelText:
        state.ship.fuel >= state.ship.maxFuel
          ? "Fuel full"
          : `Refuel ${Math.round(state.ship.maxFuel - state.ship.fuel)} units`,
      repairText:
        state.ship.hull >= state.ship.maxHull
          ? "Hull repaired"
          : `Repair ${Math.round(state.ship.maxHull - state.ship.hull)} hull`,
      contractText: `${state.contract.title}: ${state.contract.deliveredOre}/${state.contract.requiredOre} ore / ${state.contract.status}`,
      upgrades,
      launchText: "Launch",
    };
  }

  function cockpitFeedbackSurface(state, selectedTarget, reticleState, station, beamTarget, beamHeat, stationMenu) {
    const engine = state.ship.engineState || createEngineState();
    const miningActive = Boolean(state.mining.active && beamTarget);
    const cargoDelta = state.mining.lastYield || 0;
    const motion = motionSurfaceForState(state);
    const baseOreParticles = miningActive ? Math.max(1, cargoDelta * 3 || 2) : 0;
    const depleted = Boolean(beamTarget && beamTarget.mineState && beamTarget.mineState.depleted);
    const heatState = beamHeat >= 80 ? "hot" : beamHeat > 0 ? "cooldown" : "ready";
    const docked = Boolean(state.station.docked);
    const threat = pirateWarningFeedback(state);
    const upgradePreview = stationMenu.upgrades[0] || null;

    return {
      motion,
      ship: {
        thrustGlow: engine.thrusting ? "active" : "idle",
        brakeGlow: engine.braking ? "active" : "idle",
        verticalGlow: engine.verticalAxis > 0 ? "ascend" : engine.verticalAxis < 0 ? "descend" : "idle",
        speed: round(length(state.ship.velocity), 2),
      },
      mining: {
        beamActive: miningActive,
        beamTargetId: beamTarget ? beamTarget.id : null,
        hitGlow: miningActive ? "active" : beamHeat > 0 ? "cooldown" : depleted ? "depleted" : "idle",
        sparkState: miningActive ? (cargoDelta > 0 ? "ore-yield" : "cutting") : beamHeat > 0 ? "cooldown" : "idle",
        oreParticles: miningActive ? Math.max(1, Math.round(baseOreParticles * motion.particleScale)) : 0,
        cargoDelta,
        heat: beamHeat,
        heatState,
        motionScale: motion.nonessentialMotionScale,
        cooldown: heatState === "cooldown" || heatState === "hot",
        depleted,
        targetName: beamTarget ? beamTarget.name : selectedTarget.name || "No target",
        reticleState,
      },
      docking: {
        state: docked ? "docked" : station.dockable ? "dockable" : "approach",
        corridor: station.dockable ? "lit" : "approach",
        dockable: Boolean(station.dockable),
        successfulDock: docked,
        cargoSaleCredits: state.station.lastSale || 0,
        refuelSummary: stationMenu.refuelText,
        repairSummary: stationMenu.repairText,
        serviceSummary: state.station.lastService,
        upgradePreview: upgradePreview
          ? {
              id: upgradePreview.id,
              name: upgradePreview.name,
              status: upgradePreview.status,
              preview: upgradePreview.preview,
            }
          : null,
      },
      threat,
    };
  }

  function cockpitSurface(state, selectedTarget = targetSummary(state)) {
    const target = findTarget(state);
    const station = dockingStatus(state);
    const reticleState = selectedTarget.reticleState || (state.selectedTargetPrompt && state.selectedTargetPrompt.reticleState) || "no-target";
    const targetPosition = target && target.position ? target.position : state.ship.position;
    const targetLabel = cockpitLabelPosition(state, targetPosition);
    const stationLabel = cockpitLabelPosition(state, state.station.position);
    const threatActive = Boolean(state.systemAccess && state.systemAccess.pirate && state.pirate.state !== "dormant");
    const threatLabel = cockpitLabelPosition(state, state.pirate.position);
    const targetStatus =
      state.target.kind === "asteroid" && target
        ? `${target.oreRemaining} ore / ${selectedTarget.action || "approach"}`
        : selectedTarget.status || "ready";
    const primaryPrompt =
      (state.selectedTargetPrompt && state.selectedTargetPrompt.prompt) ||
      state.run.objective ||
      "Follow the selected target.";
    const prompts = uniqueList([primaryPrompt, cockpitSecondaryPrompt(state, reticleState)]).slice(0, 2);
    const beamTarget =
      state.target.kind === "asteroid" && target && target.mineState
        ? target
        : state.mining.targetId
          ? state.asteroids.find((asteroid) => asteroid.id === state.mining.targetId)
          : null;
    const beamHeat = beamTarget && beamTarget.mineState ? Math.round(beamTarget.mineState.beamHeat || 0) : 0;
    const radarBlips = [
      radarBlipForPosition(state, state.station.position, "station", "Frontier Spoke"),
      radarBlipForPosition(state, targetPosition, state.target.kind || "target", selectedTarget.name || "Target"),
    ];
    if (threatActive) {
      radarBlips.push(radarBlipForPosition(state, state.pirate.position, "threat", state.pirate.name));
    }
    const threatFeedback = pirateWarningFeedback(state);
    if (threatFeedback.visible && !threatActive) {
      radarBlips.push(radarBlipForPosition(state, state.pirate.position, "threat", state.pirate.name));
    }
    const stationMenu = cockpitStationMenu(state);

    return {
      mode: state.station.docked ? "station" : "flight",
      advancedOpen: Boolean(state.disclosure && state.disclosure.rawTelemetry),
      motion: motionSurfaceForState(state),
      objectiveText: state.run.objective,
      objectiveProgressText: `${state.contract.deliveredOre}/${state.contract.requiredOre} ore / ${state.contract.status}`,
      resources: {
        hull: `${Math.round(state.ship.hull)} / ${state.ship.maxHull}`,
        fuel: `${Math.round(state.ship.fuel)} / ${state.ship.maxFuel}`,
        cargo: `${state.cargo.ore} / ${state.cargo.capacity}`,
        targetDistance: `${selectedTarget.distance || 0}m`,
        speed: `${round(length(state.ship.velocity), 1)} m/s`,
        beamHeat: `${beamHeat}%`,
      },
      reticle: {
        state: reticleState,
        rangeText: `${selectedTarget.distance || 0}m`,
        stateText: reticleState.replace(/-/g, " "),
        bearing: selectedTarget.bearing || 0,
        edgeRotate: (selectedTarget.bearing || 0) < 0 ? 180 : 0,
      },
      labels: {
        station: {
          ...stationLabel,
          state: station.dockable ? "dockable" : "station-out-of-range",
          role: "Station",
          name: state.station.name,
          detail: `${station.distance}m / ${station.dockable ? "dockable" : "approach"}`,
        },
        target: {
          ...targetLabel,
          state: reticleState,
          role: targetTypeLabel(state.target.kind),
          name: selectedTarget.name || "No target",
          detail: `${selectedTarget.distance || 0}m / ${targetStatus}`,
        },
        threat: {
          ...threatLabel,
          state: threatFeedback.visible ? threatFeedback.markerState : "hidden",
          role: "Threat",
          name: state.pirate.name,
          detail:
            threatFeedback.stage === "warning" || threatFeedback.stage === "imminent"
              ? `${Math.round(distance(state.ship.position, state.pirate.position))}m / ${threatFeedback.stage} / ${threatFeedback.countdown}s`
              : `${Math.round(distance(state.ship.position, state.pirate.position))}m / ${state.pirate.encounterState}`,
        },
      },
      radar: {
        bearingText: formatBearing(selectedTarget.bearing || 0),
        blips: radarBlips,
      },
      targetCard: {
        name: selectedTarget.name || "No target",
        kind: state.target.kind || "none",
        bearingText: formatBearing(selectedTarget.bearing || 0),
        rangeText: `${selectedTarget.distance || 0}m`,
        status: targetStatus,
      },
      prompts,
      stationMenu,
      feedback: cockpitFeedbackSurface(state, selectedTarget, reticleState, station, beamTarget, beamHeat, stationMenu),
      help: {
        objective: state.run.objective,
        target: `${selectedTarget.name || "No target"} / ${selectedTarget.distance || 0}m / ${selectedTarget.action || "approach"}`,
        controls: "W thrust / S brake / A-D turn / Q-Ctrl vertical / Space mine / F dock / Tab target",
      },
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
    dom.motionAction = document.getElementById("motion-action");
    dom.helpAction = document.getElementById("help-action");
    dom.cockpitObjective = document.getElementById("cockpit-objective-text");
    dom.cockpitObjectiveProgress = document.getElementById("cockpit-objective-progress");
    dom.cockpitHull = document.getElementById("cockpit-hull");
    dom.cockpitFuel = document.getElementById("cockpit-fuel");
    dom.cockpitCargo = document.getElementById("cockpit-cargo");
    dom.cockpitDistance = document.getElementById("cockpit-distance");
    dom.centerReticle = document.getElementById("center-reticle");
    dom.reticleState = document.getElementById("reticle-state");
    dom.reticleRange = document.getElementById("reticle-range");
    dom.edgeArrow = document.getElementById("edge-arrow");
    dom.stationWorldLabel = document.getElementById("station-world-label");
    dom.targetWorldLabel = document.getElementById("target-world-label");
    dom.threatWorldLabel = document.getElementById("threat-world-label");
    dom.radarBlips = document.getElementById("radar-blips");
    dom.cockpitBearing = document.getElementById("cockpit-bearing");
    dom.promptPrimary = document.getElementById("prompt-primary");
    dom.promptSecondary = document.getElementById("prompt-secondary");
    dom.cockpitSpeed = document.getElementById("cockpit-speed");
    dom.cockpitHeat = document.getElementById("cockpit-heat");
    dom.cockpitReticleSummary = document.getElementById("cockpit-reticle-summary");
    dom.stationPanelTitle = document.getElementById("station-panel-title");
    dom.stationSaleSummary = document.getElementById("station-sale-summary");
    dom.stationRefuelSummary = document.getElementById("station-refuel-summary");
    dom.stationRepairSummary = document.getElementById("station-repair-summary");
    dom.stationContractSummary = document.getElementById("station-contract-summary");
    dom.stationUpgradeList = document.getElementById("station-upgrade-list");
    dom.stationLaunchAction = document.getElementById("station-launch-action");
    dom.helpPanel = document.getElementById("help-panel");
    dom.helpObjective = document.getElementById("help-objective");
    dom.helpTarget = document.getElementById("help-target");
    dom.helpControls = document.getElementById("help-controls");
    dom.helpRestartAction = document.getElementById("help-restart-action");
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
    dom.salvage = document.getElementById("salvage-readout");
    dom.convoy = document.getElementById("convoy-readout");
    dom.storm = document.getElementById("storm-readout");
    dom.interdiction = document.getElementById("interdiction-readout");
    dom.signalGate = document.getElementById("signal-gate-readout");
    dom.beacon = document.getElementById("beacon-readout");
    dom.ambush = document.getElementById("ambush-readout");
    dom.stormWindow = document.getElementById("storm-window-readout");
    dom.stormAnchor = document.getElementById("storm-anchor-readout");
    dom.interdictionRaid = document.getElementById("interdiction-raid-readout");
    dom.interdictionLure = document.getElementById("interdiction-lure-readout");
    dom.signalCapacitor = document.getElementById("signal-capacitor-readout");
    dom.signalTransit = document.getElementById("signal-transit-readout");
    dom.signalJam = document.getElementById("signal-jam-readout");
    dom.upgrade = document.getElementById("upgrade-readout");
    dom.service = document.getElementById("service-readout");
    dom.target = document.getElementById("target-readout");
    dom.station = document.getElementById("station-readout");
    dom.targetName = document.getElementById("target-name");
    dom.targetKind = document.getElementById("target-kind");
    dom.targetBearing = document.getElementById("target-bearing");
    dom.targetRange = document.getElementById("target-range");
    dom.targetState = document.getElementById("target-state");
    dom.salvageTargetFamily = document.getElementById("salvage-target-family");
    dom.salvageLockState = document.getElementById("salvage-lock-state");
    dom.salvageExtractionState = document.getElementById("salvage-extraction-state");
    dom.salvageRiskReward = document.getElementById("salvage-risk-reward");
    dom.convoyRouteState = document.getElementById("convoy-route-state");
    dom.convoyBeaconState = document.getElementById("convoy-beacon-state");
    dom.convoyEscortState = document.getElementById("convoy-escort-state");
    dom.convoyRiskState = document.getElementById("convoy-risk-state");
    dom.convoyRewardState = document.getElementById("convoy-reward-state");
    dom.convoySupportState = document.getElementById("convoy-support-state");
    dom.stormChartState = document.getElementById("storm-chart-state");
    dom.stormWindowState = document.getElementById("storm-window-state");
    dom.stormAnchorState = document.getElementById("storm-anchor-state");
    dom.stormExposureState = document.getElementById("storm-exposure-state");
    dom.stormRewardState = document.getElementById("storm-reward-state");
    dom.stormSupportState = document.getElementById("storm-support-state");
    dom.interdictionCellState = document.getElementById("interdiction-cell-state");
    dom.interdictionMarkerState = document.getElementById("interdiction-marker-state");
    dom.interdictionWindowState = document.getElementById("interdiction-window-state");
    dom.interdictionExposureState = document.getElementById("interdiction-exposure-state");
    dom.interdictionRewardState = document.getElementById("interdiction-reward-state");
    dom.interdictionSupportState = document.getElementById("interdiction-support-state");
    dom.signalGateState = document.getElementById("signal-gate-state");
    dom.signalPylonState = document.getElementById("signal-pylon-state");
    dom.signalCapacitorState = document.getElementById("signal-capacitor-state");
    dom.signalWindowState = document.getElementById("signal-window-state");
    dom.signalConvoyState = document.getElementById("signal-convoy-state");
    dom.signalJamState = document.getElementById("signal-jam-state");
    dom.signalRewardState = document.getElementById("signal-reward-state");
    dom.signalPrereqState = document.getElementById("signal-prereq-state");
    dom.mineAction = document.getElementById("mine-action");
    dom.scanAction = document.getElementById("scan-action");
    dom.beaconAction = document.getElementById("beacon-action");
    dom.convoyAction = document.getElementById("convoy-action");
    dom.abandonAction = document.getElementById("abandon-action");
    dom.dockAction = document.getElementById("dock-action");
    dom.upgradeAction = document.getElementById("upgrade-action");
    dom.restartAction = document.getElementById("restart-action");
    dom.ladderTitle = document.getElementById("ladder-title");
    dom.ladderStatus = document.getElementById("ladder-status-surface");
    dom.sectorList = document.getElementById("sector-list");
    dom.convoyList = document.getElementById("convoy-list");
    dom.stormList = document.getElementById("storm-list");
    dom.interdictionList = document.getElementById("interdiction-list");
    dom.signalList = document.getElementById("signal-list");
    dom.sectorSelect = document.getElementById("sector-select");
    dom.sectorAction = document.getElementById("sector-action");
    dom.serviceProbesAction = document.getElementById("service-probes-action");
    dom.serviceDecoyAction = document.getElementById("service-decoy-action");
    dom.serviceSalvageRigAction = document.getElementById("service-salvage-rig-action");
    dom.serviceRecoveryDronesAction = document.getElementById("service-recovery-drones-action");
    dom.serviceEscortAction = document.getElementById("service-escort-action");
    dom.serviceJammersAction = document.getElementById("service-jammers-action");
    dom.serviceChartProcessorsAction = document.getElementById("service-chart-processors-action");
    dom.serviceStormPlatingAction = document.getElementById("service-storm-plating-action");
    dom.servicePatrolUplinkAction = document.getElementById("service-patrol-uplink-action");
    dom.serviceGateTunersAction = document.getElementById("service-gate-tuners-action");
    dom.countermeasureAction = document.getElementById("countermeasure-action");
    dom.eventLog = document.getElementById("event-log");
  }

  function setText(node, text) {
    if (node) {
      node.textContent = text;
    }
  }

  function renderWorldLabel(node, label) {
    if (!node || !label) {
      return;
    }
    node.dataset.state = label.state;
    node.style.setProperty("--label-x", `${label.x}%`);
    node.style.setProperty("--label-y", `${label.y}%`);
    const role = node.querySelector("span");
    const name = node.querySelector("strong");
    const detail = node.querySelector("small");
    setText(role, label.role);
    setText(name, label.name);
    setText(detail, label.detail);
  }

  function renderRadarBlips(cockpit) {
    if (!dom.radarBlips) {
      return;
    }
    const signature = cockpit.radar.blips.map((blip) => `${blip.kind}:${blip.label}:${blip.x}:${blip.y}`).join("|");
    if (dom.radarBlips.dataset.signature === signature) {
      return;
    }
    dom.radarBlips.dataset.signature = signature;
    dom.radarBlips.replaceChildren();
    cockpit.radar.blips.forEach((blip) => {
      const marker = document.createElement("span");
      marker.className = "radar-blip";
      marker.dataset.kind = blip.kind;
      marker.title = `${blip.label} / ${blip.distance}m`;
      marker.style.setProperty("--blip-x", `${blip.x}%`);
      marker.style.setProperty("--blip-y", `${blip.y}%`);
      dom.radarBlips.append(marker);
    });
  }

  function renderStationUpgradeChoices(cockpit) {
    if (!dom.stationUpgradeList) {
      return;
    }
    const signature = cockpit.stationMenu.upgrades
      .map((upgrade) => `${upgrade.id}:${upgrade.status}:${upgrade.enabled}`)
      .join("|");
    if (dom.stationUpgradeList.dataset.signature === signature) {
      return;
    }
    dom.stationUpgradeList.dataset.signature = signature;
    dom.stationUpgradeList.replaceChildren();
    cockpit.stationMenu.upgrades.forEach((upgrade) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.upgradeId = upgrade.id;
      button.dataset.kind = upgrade.miningPowerBonus > 0 ? "beam-upgrade" : upgrade.cargoCapacityBonus > 0 ? "cargo-upgrade" : "upgrade";
      button.disabled = !upgrade.enabled;
      button.textContent = `${upgrade.name} / ${upgrade.cost}cr / ${upgrade.status} / ${upgrade.preview}`;
      dom.stationUpgradeList.append(button);
    });
    if (!cockpit.stationMenu.upgrades.length) {
      const installed = document.createElement("span");
      installed.textContent = "All upgrade previews installed.";
      dom.stationUpgradeList.append(installed);
    }
  }

  function renderCockpit(cockpit) {
    if (!cockpit) {
      return;
    }
    if (dom.root) {
      dom.root.dataset.surface = cockpit.mode;
      dom.root.dataset.advanced = cockpit.advancedOpen ? "open" : "locked";
      dom.root.dataset.thrust = cockpit.feedback.ship.thrustGlow;
      dom.root.dataset.brake = cockpit.feedback.ship.brakeGlow;
      dom.root.dataset.mining = cockpit.feedback.mining.hitGlow;
      dom.root.dataset.docking = cockpit.feedback.docking.state;
      dom.root.dataset.threat = cockpit.feedback.threat.markerState;
      dom.root.dataset.motion = cockpit.motion.mode;
      dom.root.dataset.motionScale = String(cockpit.motion.nonessentialMotionScale);
    }
    if (dom.motionAction) {
      dom.motionAction.setAttribute("aria-pressed", cockpit.motion.reduced ? "true" : "false");
      dom.motionAction.textContent = cockpit.motion.reduced ? "Reduced motion" : "Reduce motion";
      dom.motionAction.title = `Motion ${cockpit.motion.mode} / ${cockpit.motion.source}`;
    }
    if (dom.helpAction) {
      dom.helpAction.setAttribute("aria-expanded", dom.root && dom.root.dataset.help === "open" ? "true" : "false");
    }
    setText(dom.cockpitObjective, cockpit.objectiveText);
    setText(dom.cockpitObjectiveProgress, cockpit.objectiveProgressText);
    setText(dom.cockpitHull, cockpit.resources.hull);
    setText(dom.cockpitFuel, cockpit.resources.fuel);
    setText(dom.cockpitCargo, cockpit.resources.cargo);
    setText(dom.cockpitDistance, cockpit.resources.targetDistance);
    setText(dom.cockpitSpeed, cockpit.resources.speed);
    setText(dom.cockpitHeat, cockpit.resources.beamHeat);
    setText(dom.cockpitReticleSummary, cockpit.reticle.state);
    if (dom.centerReticle) {
      dom.centerReticle.dataset.state = cockpit.reticle.state;
      dom.centerReticle.style.setProperty("--edge-rotate", `${cockpit.reticle.edgeRotate}deg`);
    }
    setText(dom.reticleState, cockpit.reticle.stateText);
    setText(dom.reticleRange, cockpit.reticle.rangeText);
    renderWorldLabel(dom.stationWorldLabel, cockpit.labels.station);
    renderWorldLabel(dom.targetWorldLabel, cockpit.labels.target);
    renderWorldLabel(dom.threatWorldLabel, cockpit.labels.threat);
    setText(dom.cockpitBearing, cockpit.radar.bearingText);
    renderRadarBlips(cockpit);
    setText(dom.promptPrimary, cockpit.prompts[0] || "");
    setText(dom.promptSecondary, cockpit.prompts[1] || "");
    setText(dom.stationPanelTitle, cockpit.stationMenu.title);
    setText(dom.stationSaleSummary, cockpit.stationMenu.cargoSaleText);
    setText(dom.stationRefuelSummary, cockpit.stationMenu.refuelText);
    setText(dom.stationRepairSummary, cockpit.stationMenu.repairText);
    setText(dom.stationContractSummary, cockpit.stationMenu.contractText);
    if (dom.stationLaunchAction) {
      dom.stationLaunchAction.textContent = cockpit.stationMenu.launchText;
      dom.stationLaunchAction.disabled = !cockpit.stationMenu.open;
    }
    renderStationUpgradeChoices(cockpit);
    setText(dom.helpObjective, cockpit.help.objective);
    setText(dom.helpTarget, cockpit.help.target);
    setText(dom.helpControls, cockpit.help.controls);
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

  function renderConvoyRows(surface) {
    if (!dom.convoyList) {
      return;
    }
    const signature = surface.convoyRows.map((route) => `${route.id}:${route.state}:${route.primaryText}:${route.detailText}`).join("|");
    if (dom.convoyList.dataset.signature === signature) {
      return;
    }
    dom.convoyList.dataset.signature = signature;
    dom.convoyList.replaceChildren();
    surface.convoyRows.forEach((route) => {
      const row = document.createElement("div");
      row.className = "convoy-row";
      row.dataset.state = route.state;

      const name = document.createElement("strong");
      name.textContent = route.name;
      const state = document.createElement("span");
      state.textContent = `${route.primaryText} / ${route.detailText}`;
      row.append(name, state);
      dom.convoyList.append(row);
    });
  }

  function renderStormRows(surface) {
    if (!dom.stormList) {
      return;
    }
    const signature = surface.stormRows.map((chart) => `${chart.id}:${chart.state}:${chart.primaryText}:${chart.detailText}`).join("|");
    if (dom.stormList.dataset.signature === signature) {
      return;
    }
    dom.stormList.dataset.signature = signature;
    dom.stormList.replaceChildren();
    surface.stormRows.forEach((chart) => {
      const row = document.createElement("div");
      row.className = "storm-row";
      row.dataset.state = chart.state;

      const name = document.createElement("strong");
      name.textContent = chart.name;
      const state = document.createElement("span");
      state.textContent = `${chart.primaryText} / ${chart.detailText}`;
      row.append(name, state);
      dom.stormList.append(row);
    });
  }

  function renderInterdictionRows(surface) {
    if (!dom.interdictionList) {
      return;
    }
    const signature = surface.interdictionRows.map((cell) => `${cell.id}:${cell.state}:${cell.primaryText}:${cell.detailText}`).join("|");
    if (dom.interdictionList.dataset.signature === signature) {
      return;
    }
    dom.interdictionList.dataset.signature = signature;
    dom.interdictionList.replaceChildren();
    surface.interdictionRows.forEach((cell) => {
      const row = document.createElement("div");
      row.className = "interdiction-row";
      row.dataset.state = cell.state;

      const name = document.createElement("strong");
      name.textContent = cell.name;
      const state = document.createElement("span");
      state.textContent = `${cell.primaryText} / ${cell.detailText}`;
      row.append(name, state);
      dom.interdictionList.append(row);
    });
  }

  function renderSignalRows(surface) {
    if (!dom.signalList) {
      return;
    }
    const signature = surface.signalRows.map((gate) => `${gate.id}:${gate.state}:${gate.primaryText}:${gate.detailText}`).join("|");
    if (dom.signalList.dataset.signature === signature) {
      return;
    }
    dom.signalList.dataset.signature = signature;
    dom.signalList.replaceChildren();
    surface.signalRows.forEach((gate) => {
      const row = document.createElement("div");
      row.className = "signal-row";
      row.dataset.state = gate.state;

      const name = document.createElement("strong");
      name.textContent = gate.name;
      const state = document.createElement("span");
      state.textContent = `${gate.primaryText} / ${gate.detailText}`;
      row.append(name, state);
      dom.signalList.append(row);
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

  function renderServiceButton(button, surface, serviceId, label) {
    if (!button) {
      return;
    }
    const service = surface.services.find((candidate) => candidate.id === serviceId);
    button.disabled = !service || !service.enabled;
    button.textContent = service ? `${label} ${service.status}` : label;
  }

  function renderSurveyPanel(state, surface) {
    if (dom.ladderTitle) {
      dom.ladderTitle.textContent = surface.titleText;
    }
    if (dom.ladderStatus) {
      dom.ladderStatus.textContent = surface.statusText;
    }
    renderSectorRows(surface);
    renderConvoyRows(surface);
    renderStormRows(surface);
    renderInterdictionRows(surface);
    renderSignalRows(surface);
    renderSectorSelect(surface, state);
    renderEventLog(surface);

    if (dom.sectorAction) {
      dom.sectorAction.disabled = !surface.actions.canSetSector;
    }
    renderServiceButton(dom.serviceProbesAction, surface, "survey-probes", "Probes");
    renderServiceButton(dom.serviceDecoyAction, surface, "decoy-burst", "Decoy");
    renderServiceButton(dom.serviceSalvageRigAction, surface, "salvage-rig", "Rig");
    renderServiceButton(dom.serviceRecoveryDronesAction, surface, "recovery-drones", "Drones");
    renderServiceButton(dom.serviceEscortAction, surface, "escort-drones", "Escort");
    renderServiceButton(dom.serviceJammersAction, surface, "signal-jammers", "Jammers");
    renderServiceButton(dom.serviceChartProcessorsAction, surface, "chart-processors", "Processors");
    renderServiceButton(dom.serviceStormPlatingAction, surface, "storm-plating", "Plating");
    renderServiceButton(dom.servicePatrolUplinkAction, surface, "patrol-uplink", "Patrol");
    renderServiceButton(dom.serviceGateTunersAction, surface, "gate-tuners", "Tuners");
    if (dom.countermeasureAction) {
      dom.countermeasureAction.disabled = !(
        surface.actions.countermeasureReady ||
        surface.actions.canCountermeasureConvoy ||
        surface.actions.canCountermeasureStorm ||
        surface.actions.canCountermeasureInterdiction ||
        surface.actions.canCountermeasureSignalGate
      );
      dom.countermeasureAction.textContent = `Burst ${surface.actions.countermeasureText}`;
    }
  }

  function contractReadoutText(state) {
    const parts = [`${state.contract.status}`, `${state.contract.deliveredOre}/${state.contract.requiredOre} ore`];
    if (state.contract.requiredScans > 0) {
      parts.push(`${state.contract.deliveredScans}/${state.contract.requiredScans} scans`);
    }
    if (state.contract.requiredSalvageValue > 0) {
      parts.push(`${state.contract.deliveredSalvageValue}/${state.contract.requiredSalvageValue}cr salvage`);
    }
    if (state.contract.requiredRelics > 0) {
      parts.push(`${state.contract.deliveredRelics}/${state.contract.requiredRelics} relic`);
    }
    if ((state.contract.deliveredConvoyValue || 0) > 0) {
      parts.push(`${state.contract.deliveredConvoyValue}cr convoy`);
    }
    if ((state.contract.requiredStormCharts || 0) > 0) {
      parts.push(`${state.contract.deliveredStormCharts}/${state.contract.requiredStormCharts} storm`);
    }
    if ((state.contract.requiredStormPayout || 0) > 0) {
      parts.push(`${state.contract.deliveredStormPayout}/${state.contract.requiredStormPayout}cr storm`);
    }
    if ((state.contract.requiredInterdictions || 0) > 0) {
      parts.push(`${state.contract.deliveredInterdictions}/${state.contract.requiredInterdictions} interdiction`);
    }
    if ((state.contract.requiredInterdictionPayout || 0) > 0) {
      parts.push(`${state.contract.deliveredInterdictionPayout}/${state.contract.requiredInterdictionPayout}cr interdiction`);
    }
    if ((state.contract.requiredSignalTransits || 0) > 0) {
      parts.push(`${state.contract.deliveredSignalTransits}/${state.contract.requiredSignalTransits} gate`);
    }
    if ((state.contract.requiredSignalPayout || 0) > 0) {
      parts.push(`${state.contract.deliveredSignalPayout}/${state.contract.requiredSignalPayout}cr gate`);
    }
    return parts.join(" / ");
  }

  function renderHud(state) {
    const target = targetSummary(state);
    const station = dockingStatus(state);
    const upgrade = upgradeSummary(state);
    const surface = surveyCockpitSurface(state);
    dom.runStatus.textContent = `${state.run.status} / ${state.renderer.status}`;
    renderCockpit(surface.cockpit);
    dom.objective.textContent = state.run.objective;
    dom.ladder.textContent = surface.ladderText;
    dom.sector.textContent = surface.sectorText;
    dom.hull.textContent = `${Math.round(state.ship.hull)} / ${state.ship.maxHull}`;
    dom.fuel.textContent = `${Math.round(state.ship.fuel)} / ${state.ship.maxFuel}`;
    dom.cargo.textContent = `${state.cargo.ore} / ${state.cargo.capacity} / ${state.cargo.value}cr`;
    dom.credits.textContent = String(state.credits);
    dom.pressure.textContent = `${Math.round(state.pirate.pressure)} / ${state.pirate.encounterState}`;
    dom.hazard.textContent = surface.hazardText;
    dom.contract.textContent = contractReadoutText(state);
    dom.scan.textContent = surface.scanText;
    dom.salvage.textContent = surface.salvageText;
    dom.convoy.textContent = surface.convoyText;
    dom.storm.textContent = surface.stormText;
    dom.interdiction.textContent = surface.interdictionText;
    dom.signalGate.textContent = surface.signalGateText;
    dom.beacon.textContent = surface.beaconText;
    dom.ambush.textContent = surface.ambushText;
    dom.stormWindow.textContent = surface.stormWindowText;
    dom.stormAnchor.textContent = surface.stormAnchorText;
    dom.interdictionRaid.textContent = surface.interdictionRaidText;
    dom.interdictionLure.textContent = surface.interdictionLureText;
    dom.signalCapacitor.textContent = surface.signalCapacitorText;
    dom.signalTransit.textContent = surface.signalTransitText;
    dom.signalJam.textContent = surface.signalJamText;
    dom.upgrade.textContent = upgrade.text;
    dom.service.textContent = surface.serviceText;
    dom.target.textContent = `${target.kind} / ${target.name} / ${target.distance}m`;
    dom.station.textContent = `${formatBearing(station.bearing)} / ${station.distance}m / ${station.dockable ? "dock" : "approach"}`;
    dom.targetName.textContent = surface.cockpit.targetCard.name;
    dom.targetKind.textContent = surface.cockpit.targetCard.kind;
    dom.targetBearing.textContent = `bearing ${surface.cockpit.targetCard.bearingText}`;
    dom.targetRange.textContent = surface.cockpit.targetCard.rangeText;
    dom.targetState.textContent = surface.cockpit.targetCard.status;
    dom.salvageTargetFamily.textContent = surface.salvageTarget.familyText;
    dom.salvageLockState.textContent = surface.salvageTarget.lockText;
    dom.salvageExtractionState.textContent = surface.salvageTarget.extractionText;
    dom.salvageRiskReward.textContent = surface.salvageTarget.riskRewardText;
    dom.convoyRouteState.textContent = surface.convoyTarget.routeText;
    dom.convoyBeaconState.textContent = surface.convoyTarget.beaconText;
    dom.convoyEscortState.textContent = surface.convoyTarget.escortText;
    dom.convoyRiskState.textContent = surface.convoyTarget.riskText;
    dom.convoyRewardState.textContent = surface.convoyTarget.rewardText;
    dom.convoySupportState.textContent = surface.convoyTarget.supportText;
    dom.stormChartState.textContent = surface.stormTarget.chartText;
    dom.stormWindowState.textContent = surface.stormTarget.windowText;
    dom.stormAnchorState.textContent = surface.stormTarget.anchorText;
    dom.stormExposureState.textContent = surface.stormTarget.exposureText;
    dom.stormRewardState.textContent = surface.stormTarget.rewardText;
    dom.stormSupportState.textContent = surface.stormTarget.supportText;
    dom.interdictionCellState.textContent = surface.interdictionTarget.cellText;
    dom.interdictionMarkerState.textContent = surface.interdictionTarget.markerText;
    dom.interdictionWindowState.textContent = surface.interdictionTarget.windowText;
    dom.interdictionExposureState.textContent = surface.interdictionTarget.exposureText;
    dom.interdictionRewardState.textContent = surface.interdictionTarget.rewardText;
    dom.interdictionSupportState.textContent = surface.interdictionTarget.supportText;
    dom.signalGateState.textContent = surface.signalTarget.gateText;
    dom.signalPylonState.textContent = surface.signalTarget.pylonText;
    dom.signalCapacitorState.textContent = surface.signalTarget.capacitorText;
    dom.signalWindowState.textContent = surface.signalTarget.windowText;
    dom.signalConvoyState.textContent = surface.signalTarget.convoyText;
    dom.signalJamState.textContent = surface.signalTarget.jamText;
    dom.signalRewardState.textContent = surface.signalTarget.rewardText;
    dom.signalPrereqState.textContent = surface.signalTarget.prereqText;

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
    dom.salvage.closest(".readout").dataset.tone =
      state.salvage.failures > 0 ? "danger" : state.salvage.holdValue > 0 || state.salvage.relicsInHold > 0 ? "signal" : "warn";
    const convoyFocus =
      (state.convoy.activeRouteId && convoyRouteById(state, state.convoy.activeRouteId)) ||
      (state.convoyRoutes || []).find((route) => route.convoyState.status === "ready") ||
      (state.convoyRoutes || []).find((route) => route.convoyState.status === "needs beacon") ||
      (state.convoyRoutes || [])[0] ||
      null;
    dom.convoy.closest(".readout").dataset.tone = state.convoy.activeRouteId ? "signal" : convoyFocus ? "warn" : "signal";
    dom.beacon.closest(".readout").dataset.tone =
      convoyFocus && convoyFocus.beaconState.deployed ? "signal" : convoyFocus ? "warn" : "signal";
    dom.ambush.closest(".readout").dataset.tone =
      convoyFocus && convoyFocus.convoyState.ambushPressure > 42
        ? "danger"
        : convoyFocus && convoyFocus.convoyState.ambushPressure > 0
          ? "warn"
          : "signal";
    const stormFocus =
      (state.storm.activeChartId && stormChartById(state, state.storm.activeChartId)) ||
      (state.stormCharts || []).find((chart) => chart.stormState.status === "window open") ||
      (state.stormCharts || []).find((chart) => chart.stormState.status === "anchor ready") ||
      (state.stormCharts || [])[0] ||
      null;
    dom.storm.closest(".readout").dataset.tone =
      stormFocus && ["failed", "window missed"].includes(stormFocus.stormState.status)
        ? "danger"
        : stormFocus && ["locked", "uncharted", "charted", "anchor ready", "window open"].includes(stormFocus.stormState.status)
          ? "warn"
          : "signal";
    dom.stormWindow.closest(".readout").dataset.tone =
      stormFocus && stormFocus.stormState.safeWindow.locked
        ? "signal"
        : stormFocus && stormWindowTiming(stormFocus, state).missed
          ? "danger"
          : stormFocus
            ? "warn"
            : "signal";
    dom.stormAnchor.closest(".readout").dataset.tone =
      stormFocus && stormFocus.stormState.anchorDeployed
        ? cssToneForPercent((stormFocus.stormState.anchorIntegrity / Math.max(1, stormFocus.stormState.maxAnchorIntegrity)) * 100)
        : stormFocus
          ? "warn"
          : "signal";
    const interdictionFocus =
      (state.interdiction.activeCellId && interdictionCellById(state, state.interdiction.activeCellId)) ||
      (state.interdictionCells || []).find((cell) => cell.interdictionState.status !== "locked" && cell.interdictionState.outcome === "none") ||
      (state.interdictionCells || [])[0] ||
      null;
    const interdictionTiming = interdictionFocus ? interdictionResponseTiming(interdictionFocus, state) : null;
    const interdictionTerminal = interdictionFocus && ["success", "partial", "failed"].includes(interdictionFocus.interdictionState.outcome);
    const interdictionTone =
      interdictionTerminal && interdictionFocus.interdictionState.outcome === "failed"
        ? "danger"
        : interdictionTerminal && interdictionFocus.interdictionState.outcome === "success"
          ? "signal"
          : interdictionFocus && interdictionFocus.interdictionState.raidPressure > 48
            ? "danger"
            : interdictionFocus
              ? "warn"
              : "signal";
    dom.interdiction.closest(".readout").dataset.tone = interdictionTone;
    dom.interdictionRaid.closest(".readout").dataset.tone = interdictionTone;
    dom.interdictionLure.closest(".readout").dataset.tone =
      interdictionFocus && (interdictionFocus.interdictionState.lureDeployed || interdictionFocus.interdictionState.markerPlaced)
        ? "signal"
        : interdictionTiming && interdictionTiming.missed
          ? "danger"
          : interdictionFocus
            ? "warn"
            : "signal";
    const signalFocus =
      (state.signalGate.activeGateId && signalGateById(state, state.signalGate.activeGateId)) ||
      (state.signalGates || []).find((gate) => gate.prerequisiteStatus && gate.prerequisiteStatus.ready && gate.gateState.outcome === "none") ||
      (state.signalGates || [])[0] ||
      null;
    const signalTiming = signalFocus ? signalGateTransitTiming(signalFocus, state) : null;
    const signalTone =
      signalFocus && signalFocus.gateState.outcome === "failed"
        ? "danger"
        : signalFocus && signalFocus.gateState.outcome === "success"
          ? "signal"
          : signalFocus && (signalFocus.gateState.pirateJam > 60 || (signalTiming && signalTiming.missed))
            ? "danger"
            : signalFocus
              ? "warn"
              : "signal";
    dom.signalGate.closest(".readout").dataset.tone = signalTone;
    dom.signalCapacitor.closest(".readout").dataset.tone =
      signalFocus && signalFocus.gateState.capacitorCharge >= signalFocus.gateState.capacitorRequirement
        ? "signal"
        : signalFocus
          ? "warn"
          : "signal";
    dom.signalTransit.closest(".readout").dataset.tone =
      signalTiming && (signalTiming.open || signalTiming.committed)
        ? "signal"
        : signalTiming && signalTiming.missed
          ? "danger"
          : signalFocus
            ? "warn"
            : "signal";
    dom.signalJam.closest(".readout").dataset.tone = signalTone;
    dom.service.closest(".readout").dataset.tone =
      state.stationServices.countermeasureCharges > 0 || state.stationServices.purchased.length > 0 ? "signal" : "warn";
    if (dom.mineAction) {
      const cargoBlocked = target.kind === "asteroid" && state.cargo.ore >= state.cargo.capacity;
      const asteroidOutOfRange = target.kind === "asteroid" && target.reticleState !== "mine-in-range";
      dom.mineAction.textContent = target.kind === "salvage" ? "Extract" : "Mine";
      dom.mineAction.disabled =
        !["asteroid", "salvage"].includes(target.kind) || cargoBlocked || asteroidOutOfRange || state.run.status === "failed";
    }
    if (dom.scanAction) {
      dom.scanAction.textContent =
        target.kind === "salvage"
          ? "Signal Lock"
          : target.kind === "storm"
            ? "Chart Storm"
            : target.kind === "interdiction"
              ? "Scan Transponder"
              : target.kind === "signal-gate"
                ? "Scan Harmonics"
              : "Scan";
      dom.scanAction.disabled = !(surface.actions.canScan || surface.actions.canScanSalvage);
    }
    if (dom.beaconAction) {
      dom.beaconAction.textContent =
        target.kind === "storm"
          ? target.anchorStatus === "deployed"
            ? "Maintain Anchor"
            : "Deploy Anchor"
          : target.kind === "interdiction"
            ? target.markerPlaced
              ? "Marker Armed"
              : "Distress Marker"
          : target.kind === "signal-gate"
            ? target.pylonAligned
              ? "Pylon Aligned"
              : "Align Pylon"
          : target.kind === "convoy" && target.beaconStatus && target.beaconStatus !== "undeployed"
            ? "Maintain Beacon"
            : "Deploy Beacon";
      dom.beaconAction.disabled = !(
        surface.actions.canDeployBeacon ||
        surface.actions.canMaintainBeacon ||
        surface.actions.canDeployStormAnchor ||
        surface.actions.canMaintainStormAnchor ||
        surface.actions.canPlaceInterdictionMarker ||
        surface.actions.canAlignSignalGatePylon
      );
    }
    if (dom.convoyAction) {
      dom.convoyAction.textContent =
        target.kind === "storm"
          ? "Lock Window"
          : target.kind === "interdiction"
            ? "Resolve Raid"
            : target.kind === "signal-gate"
              ? surface.actions.canCommitSignalGateTransit
                ? "Commit Transit"
                : "Charge Gate"
            : target.kind === "convoy"
              ? "Start Convoy"
            : "Convoy";
      dom.convoyAction.disabled = !(
        surface.actions.canStartConvoy ||
        surface.actions.canLockStormWindow ||
        surface.actions.canResolveInterdictionRaid ||
        surface.actions.canChargeSignalGateCapacitor ||
        surface.actions.canCommitSignalGateTransit
      );
    }
    if (dom.abandonAction) {
      dom.abandonAction.textContent =
        target.kind === "storm"
          ? "Reroute Salvage"
          : target.kind === "interdiction"
            ? "Deploy Lure"
            : target.kind === "signal-gate"
              ? surface.actions.canAnchorSignalGateWindow
                ? "Anchor Window"
                : surface.actions.canForceSignalGateOpen
                  ? "Force Open"
                  : "Abort Gate"
            : "Abandon";
      dom.abandonAction.disabled = !(
        surface.actions.canAbandonSalvage ||
        surface.actions.canRerouteStormSalvage ||
        surface.actions.canDeployInterdictionLure ||
        surface.actions.canAnchorSignalGateWindow ||
        surface.actions.canForceSignalGateOpen ||
        surface.actions.canAbortSignalGateTransit
      );
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

  function setHelpOpen(open) {
    if (!dom.root || !dom.helpPanel) {
      return;
    }
    dom.root.dataset.help = open ? "open" : "closed";
    dom.helpPanel.hidden = !open;
    if (dom.helpAction) {
      dom.helpAction.setAttribute("aria-expanded", open ? "true" : "false");
    }
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
        currentState.target.kind === "salvage"
          ? scanSalvageTarget(currentState, 1)
            : currentState.target.kind === "storm"
              ? scanStormChart(currentState, 1)
              : currentState.target.kind === "interdiction"
                ? scanInterdictionTransponder(currentState, currentState.target.id, 1)
                : currentState.target.kind === "signal-gate"
                  ? scanSignalGateHarmonics(currentState, currentState.target.id, 1)
                  : scanTarget(currentState, 1);
    } else if (action === "beacon") {
      if (currentState.target.kind === "convoy") {
        const route = convoyRouteById(currentState, currentState.target.id);
        currentState =
          route && route.beaconState.deployed
            ? maintainRouteBeacon(currentState, currentState.target.id)
            : deployRouteBeacon(currentState, currentState.target.id);
      } else if (currentState.target.kind === "storm") {
        const chart = stormChartById(currentState, currentState.target.id);
        currentState =
          chart && chart.stormState.anchorDeployed
            ? maintainStormAnchor(currentState, currentState.target.id)
            : deployStormAnchor(currentState, currentState.target.id);
      } else if (currentState.target.kind === "interdiction") {
        currentState = placeInterdictionMarker(currentState, currentState.target.id, "distress");
      } else if (currentState.target.kind === "signal-gate") {
        currentState = alignSignalGatePylon(currentState, currentState.target.id);
      }
    } else if (action === "convoy") {
      if (currentState.target.kind === "convoy") {
        currentState = startConvoyRoute(currentState, currentState.target.id);
      } else if (currentState.target.kind === "storm") {
        currentState = lockStormRouteWindow(currentState, currentState.target.id);
      } else if (currentState.target.kind === "interdiction") {
        currentState = resolveInterdictionRaid(currentState, currentState.target.id, "escort");
      } else if (currentState.target.kind === "signal-gate") {
        const readiness = signalGateReadiness(currentState, currentState.target.id);
        currentState = readiness.canCommitTransit
          ? commitSignalGateTransit(currentState, currentState.target.id, "convoy")
          : chargeSignalGateCapacitor(currentState, currentState.target.id, 1);
      }
    } else if (action === "abandon-salvage") {
      if (currentState.target.kind === "storm") {
        const chart = stormChartById(currentState, currentState.target.id);
        const site = stormRerouteCandidate(currentState, chart);
        currentState = site ? rerouteStormSalvage(currentState, site.id, chart.id) : currentState;
      } else if (currentState.target.kind === "interdiction") {
        currentState = deployInterdictionLure(currentState, currentState.target.id);
      } else if (currentState.target.kind === "signal-gate") {
        const readiness = signalGateReadiness(currentState, currentState.target.id);
        currentState = readiness.canAnchorStormWindow
          ? anchorSignalGateStormWindow(currentState, currentState.target.id)
          : readiness.canForceOpen
            ? forceSignalGateOpen(currentState, currentState.target.id)
            : abortSignalGateTransit(currentState, currentState.target.id);
      } else {
        currentState = abandonSalvageTarget(currentState);
      }
    } else if (action === "interact") {
      currentState = dockAtStation(currentState);
    } else if (action === "launch") {
      currentState = launchFromStation(currentState);
    } else if (action === "upgrade") {
      const upgrade = nextAffordableUpgrade(currentState);
      currentState = purchaseUpgrade(currentState, upgrade ? upgrade.id : "refined-beam");
    } else if (action === "service-probes") {
      currentState = purchaseStationService(currentState, "survey-probes");
    } else if (action === "service-decoy") {
      currentState = purchaseStationService(currentState, "decoy-burst");
    } else if (action === "service-salvage-rig") {
      currentState = purchaseStationService(currentState, "salvage-rig");
    } else if (action === "service-recovery-drones") {
      currentState = purchaseStationService(currentState, "recovery-drones");
    } else if (action === "service-escort") {
      currentState = purchaseStationService(currentState, "escort-drones");
    } else if (action === "service-jammers") {
      currentState = purchaseStationService(currentState, "signal-jammers");
    } else if (action === "service-chart-processors") {
      currentState = purchaseStationService(currentState, "chart-processors");
    } else if (action === "service-storm-plating") {
      currentState = purchaseStationService(currentState, "storm-plating");
    } else if (action === "service-patrol-uplink") {
      currentState = purchaseStationService(currentState, "patrol-uplink");
    } else if (action === "service-gate-tuners") {
      currentState = purchaseStationService(currentState, "gate-tuners");
    } else if (action === "countermeasure") {
      currentState = deployCountermeasure(currentState);
    } else if (action === "motion") {
      const reduced = !(currentState.accessibility && currentState.accessibility.reducedMotion);
      currentState = setReducedMotion(currentState, reduced, "user");
      writeStoredReducedMotionPreference(reduced);
    } else if (action === "sector") {
      const sectorId = dom.sectorSelect ? dom.sectorSelect.value : currentState.ladder.currentSectorId;
      currentState = chooseSector(currentState, sectorId);
    } else if (action === "reset") {
      currentState =
        currentState.tutorial && currentState.ladder.currentSectorId === GAME_DATA.surveyLadder.defaultSectorId
          ? restartTutorial(currentState)
          : resetRun(currentState);
    }
    renderHud(currentState);
    if (sceneHandle) {
      updateScene(sceneHandle, currentState, performance.now() / 1000);
    }
  }

  function stageEvidenceState(state, options = {}) {
    currentState = syncDerivedState(clone(state));
    Object.keys(pressedControls).forEach((control) => {
      pressedControls[control] = false;
    });
    if (sceneHandle && currentState.renderer && currentState.renderer.status === "pending") {
      currentState.renderer.status = "local renderer";
    }
    const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    const holdMs = clamp(options.holdMs === undefined ? 1200 : Number(options.holdMs) || 0, 0, 5000);
    evidenceHoldUntil = Math.max(evidenceHoldUntil, now + holdMs);
    if (dom.root) {
      if (options.evidenceState) {
        dom.root.dataset.evidenceState = options.evidenceState;
      }
      renderHud(currentState);
    }
    if (sceneHandle) {
      updateScene(sceneHandle, currentState, now / 1000);
    }
    return surveyCockpitSurface(currentState).cockpit;
  }

  function bindControls() {
    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        setHelpOpen(false);
        return;
      }
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
      if (["beacon", "interact", "upgrade", "reset"].includes(control) && !event.repeat) {
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
    if (dom.beaconAction) {
      dom.beaconAction.addEventListener("click", () => performAction("beacon"));
    }
    if (dom.convoyAction) {
      dom.convoyAction.addEventListener("click", () => performAction("convoy"));
    }
    if (dom.abandonAction) {
      dom.abandonAction.addEventListener("click", () => performAction("abandon-salvage"));
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
    if (dom.helpAction) {
      dom.helpAction.addEventListener("click", () => setHelpOpen(!(dom.root && dom.root.dataset.help === "open")));
    }
    if (dom.motionAction) {
      dom.motionAction.addEventListener("click", () => performAction("motion"));
    }
    if (dom.helpRestartAction) {
      dom.helpRestartAction.addEventListener("click", () => {
        performAction("reset");
        setHelpOpen(false);
      });
    }
    if (dom.stationLaunchAction) {
      dom.stationLaunchAction.addEventListener("click", () => performAction("launch"));
    }
    if (dom.stationUpgradeList) {
      dom.stationUpgradeList.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-upgrade-id]");
        if (!button || button.disabled) {
          return;
        }
        currentState = purchaseUpgrade(currentState, button.dataset.upgradeId);
        renderHud(currentState);
        if (sceneHandle) {
          updateScene(sceneHandle, currentState, performance.now() / 1000);
        }
      });
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
    if (dom.serviceSalvageRigAction) {
      dom.serviceSalvageRigAction.addEventListener("click", () => performAction("service-salvage-rig"));
    }
    if (dom.serviceRecoveryDronesAction) {
      dom.serviceRecoveryDronesAction.addEventListener("click", () => performAction("service-recovery-drones"));
    }
    if (dom.serviceEscortAction) {
      dom.serviceEscortAction.addEventListener("click", () => performAction("service-escort"));
    }
    if (dom.serviceJammersAction) {
      dom.serviceJammersAction.addEventListener("click", () => performAction("service-jammers"));
    }
    if (dom.serviceChartProcessorsAction) {
      dom.serviceChartProcessorsAction.addEventListener("click", () => performAction("service-chart-processors"));
    }
    if (dom.serviceStormPlatingAction) {
      dom.serviceStormPlatingAction.addEventListener("click", () => performAction("service-storm-plating"));
    }
    if (dom.servicePatrolUplinkAction) {
      dom.servicePatrolUplinkAction.addEventListener("click", () => performAction("service-patrol-uplink"));
    }
    if (dom.serviceGateTunersAction) {
      dom.serviceGateTunersAction.addEventListener("click", () => performAction("service-gate-tuners"));
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

    const makeEngineCone = (x, y, z, color, lengthValue = 1.1) => {
      const glow = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, lengthValue, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0, depthWrite: false })
      );
      glow.position.set(x, y, z);
      glow.rotation.x = Math.PI / 2;
      glow.visible = false;
      group.add(glow);
      return glow;
    };
    const makeBrakeGlow = (x) => {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xd0b36a, transparent: true, opacity: 0.0, depthWrite: false })
      );
      glow.position.set(x, 0.02, -1.42);
      glow.visible = false;
      group.add(glow);
      return glow;
    };
    group.userData.thrusterGlows = [
      makeEngineCone(-0.42, -0.02, 2.0, 0x4bd6c0, 1.25),
      makeEngineCone(0.42, -0.02, 2.0, 0x4bd6c0, 1.25),
    ];
    group.userData.brakeGlows = [makeBrakeGlow(-0.46), makeBrakeGlow(0.46)];
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
    const corridor = new THREE.Group();
    for (let index = 0; index < 3; index += 1) {
      const lane = new THREE.Mesh(
        new THREE.TorusGeometry(3.2 + index * 0.58, 0.035, 6, 40),
        new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.16, depthWrite: false })
      );
      lane.position.z = -4 - index * 2.1;
      lane.rotation.x = Math.PI / 2;
      corridor.add(lane);
    }
    group.add(corridor);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 1.2), ringMaterial);
    mast.position.y = 1.8;
    group.add(mast);
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.78 })
    );
    beacon.position.y = 5.65;
    group.add(beacon);
    group.userData.dockRing = ring;
    group.userData.dockingCorridor = corridor;
    group.userData.stationBeacon = beacon;
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
    const oreHalo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(asteroid.radius * 1.04, 1),
      new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.08, wireframe: true, depthWrite: false })
    );
    group.add(oreHalo);
    group.userData.oreHalo = oreHalo;
    return group;
  }

  function createSalvageMesh(THREE, site) {
    const group = new THREE.Group();
    group.userData.salvageId = site.id;
    const isVolatile = site.type === "volatile-wreck";
    const isRelay = site.type === "relay-cache";
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: isVolatile ? 0x6f4e45 : isRelay ? 0x5f6b66 : 0x6c746f,
      roughness: 0.82,
      metalness: 0.42,
      emissive: isVolatile ? 0x2c0f0a : 0x0b2421,
      emissiveIntensity: isVolatile ? 0.28 : 0.18,
    });
    const signalMaterial = new THREE.MeshBasicMaterial({
      color: isVolatile ? 0xd46857 : 0x4bd6c0,
      transparent: true,
      opacity: isVolatile ? 0.74 : 0.64,
    });
    const amberMaterial = new THREE.MeshBasicMaterial({
      color: 0xd0b36a,
      transparent: true,
      opacity: 0.62,
    });

    const core = new THREE.Mesh(
      isRelay ? new THREE.BoxGeometry(site.radius * 0.92, site.radius * 0.44, site.radius * 0.92) : new THREE.BoxGeometry(site.radius * 1.65, site.radius * 0.34, site.radius * 0.68),
      hullMaterial
    );
    core.rotation.set(0.18, site.riskPhase * TWO_PI, isVolatile ? 0.42 : -0.16);
    group.add(core);

    if (isRelay) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(site.radius * 0.76, 0.05, 6, 36), signalMaterial);
      loop.rotation.x = Math.PI / 2;
      group.add(loop);
      const cache = new THREE.Mesh(new THREE.OctahedronGeometry(site.radius * 0.32, 0), amberMaterial);
      cache.position.y = site.radius * 0.18;
      group.add(cache);
    } else {
      for (let ribIndex = 0; ribIndex < 3; ribIndex += 1) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.1, site.radius * 0.95, 0.12), signalMaterial);
        rib.position.x = (ribIndex - 1) * site.radius * 0.52;
        rib.rotation.z = 0.25 + ribIndex * 0.12;
        group.add(rib);
      }
      const spine = new THREE.Mesh(new THREE.ConeGeometry(site.radius * 0.2, site.radius * 1.2, 4), amberMaterial);
      spine.rotation.z = Math.PI / 2;
      spine.position.x = site.radius * 0.78;
      group.add(spine);
    }

    if (isVolatile) {
      const hazard = new THREE.Mesh(new THREE.TetrahedronGeometry(site.radius * 0.38, 0), signalMaterial);
      hazard.position.set(site.radius * -0.36, site.radius * 0.26, site.radius * 0.2);
      group.add(hazard);
    }

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), signalMaterial);
    beacon.position.y = site.radius * 0.7;
    group.add(beacon);
    return group;
  }

  function syncSalvageMeshes(handle, state) {
    const { THREE } = handle;
    const activeIds = new Set((state.salvageSites || []).map((site) => site.id));
    handle.objects.salvageMeshes.forEach((mesh, siteId) => {
      if (!activeIds.has(siteId)) {
        handle.scene.remove(mesh);
        handle.objects.salvageMeshes.delete(siteId);
      }
    });
    (state.salvageSites || []).forEach((site) => {
      if (!handle.objects.salvageMeshes.has(site.id)) {
        const mesh = createSalvageMesh(THREE, site);
        handle.objects.salvageMeshes.set(site.id, mesh);
        handle.scene.add(mesh);
      }
    });
  }

  function createConvoyMesh(THREE, route) {
    const group = new THREE.Group();
    group.userData.convoyRouteId = route.id;
    const beaconMaterial = new THREE.MeshBasicMaterial({
      color: 0xd0b36a,
      transparent: true,
      opacity: 0.6,
    });
    const laneMaterial = new THREE.LineBasicMaterial({
      color: 0x4bd6c0,
      transparent: true,
      opacity: 0.34,
    });
    const podMaterial = new THREE.MeshStandardMaterial({
      color: 0x9aa59f,
      roughness: 0.62,
      metalness: 0.34,
      emissive: 0x102a26,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.9,
    });
    const escortMaterial = new THREE.MeshBasicMaterial({
      color: 0x8ea1ff,
      transparent: true,
      opacity: 0.72,
    });
    const dangerMaterial = new THREE.MeshBasicMaterial({
      color: 0xd46857,
      transparent: true,
      opacity: 0.46,
    });

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, route.beacon.radius * 1.65, 6), beaconMaterial);
    mast.position.y = route.beacon.radius * 0.46;
    group.add(mast);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(route.beacon.radius * 0.58, 0.055, 6, 44), beaconMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = route.beacon.radius * 0.96;
    group.add(ring);

    const crown = new THREE.Mesh(new THREE.OctahedronGeometry(route.beacon.radius * 0.22, 0), beaconMaterial);
    crown.position.y = route.beacon.radius * 1.34;
    group.add(crown);

    const end = route.endPosition || route.beacon.position;
    const laneGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(end.x - route.beacon.position.x, end.y - route.beacon.position.y + 0.05, end.z - route.beacon.position.z),
    ]);
    const lane = new THREE.Line(laneGeometry, laneMaterial);
    group.add(lane);

    const ambush = new THREE.Group();
    const midpoint = new THREE.Vector3(
      (end.x - route.beacon.position.x) * 0.55,
      (end.y - route.beacon.position.y) * 0.55 + 0.65,
      (end.z - route.beacon.position.z) * 0.55
    );
    ambush.position.copy(midpoint);
    for (let index = 0; index < 3; index += 1) {
      const signature = new THREE.Mesh(new THREE.TetrahedronGeometry(0.42 + index * 0.08, 0), dangerMaterial);
      signature.position.set((index - 1) * 1.1, Math.sin(index) * 0.18, (index % 2 ? 1 : -1) * 0.72);
      ambush.add(signature);
    }
    group.add(ambush);

    const pod = new THREE.Group();
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.05), podMaterial);
    pod.add(cargo);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 4), podMaterial);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -0.95;
    pod.add(nose);
    for (let index = 0; index < 3; index += 1) {
      const drone = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), escortMaterial);
      drone.position.set(Math.cos(index * 2.1) * 1.45, 0.22, Math.sin(index * 2.1) * 1.45);
      pod.add(drone);
    }
    group.add(pod);

    group.userData.beaconMaterial = beaconMaterial;
    group.userData.laneMaterial = laneMaterial;
    group.userData.pod = pod;
    group.userData.podMaterial = podMaterial;
    group.userData.escortMaterial = escortMaterial;
    group.userData.ambush = ambush;
    group.userData.dangerMaterial = dangerMaterial;
    return group;
  }

  function syncConvoyMeshes(handle, state, timeSeconds = 0) {
    const { THREE } = handle;
    const motion = motionSettingsForState(state);
    const activeIds = new Set((state.convoyRoutes || []).map((route) => route.id));
    handle.objects.convoyMeshes.forEach((mesh, routeId) => {
      if (!activeIds.has(routeId)) {
        handle.scene.remove(mesh);
        handle.objects.convoyMeshes.delete(routeId);
      }
    });
    (state.convoyRoutes || []).forEach((route) => {
      if (!handle.objects.convoyMeshes.has(route.id)) {
        const mesh = createConvoyMesh(THREE, route);
        handle.objects.convoyMeshes.set(route.id, mesh);
        handle.scene.add(mesh);
      }
      const mesh = handle.objects.convoyMeshes.get(route.id);
      const active = ["enroute", "ambushed", "straggling"].includes(route.convoyState.status);
      const terminal = ["delivered", "partial", "failed"].includes(route.convoyState.status);
      const locked = route.convoyState.status === "locked";
      const beaconColor = locked ? 0x59655f : route.beaconState.deployed ? 0x4bd6c0 : 0xd0b36a;
      const convoyPosition = route.convoyState.position || route.startPosition || route.beacon.position;
      const relativePosition = subtract(convoyPosition, route.beacon.position);
      const escortRatio = clamp(route.convoyState.escortIntegrity / Math.max(1, route.convoyState.maxEscortIntegrity), 0, 1);

      mesh.position.set(route.beacon.position.x, route.beacon.position.y, route.beacon.position.z);
      mesh.userData.beaconMaterial.color.setHex(beaconColor);
      mesh.userData.beaconMaterial.opacity = locked ? 0.24 : route.beaconState.deployed ? 0.9 : 0.58;
      mesh.userData.laneMaterial.color.setHex(active ? 0x8ea1ff : route.beaconState.deployed ? 0x4bd6c0 : 0xd0b36a);
      mesh.userData.laneMaterial.opacity = locked ? 0.14 : active ? 0.74 : route.beaconState.deployed ? 0.46 : 0.28;
      mesh.userData.pod.visible = route.beaconState.deployed || active || terminal;
      mesh.userData.pod.position.set(relativePosition.x, relativePosition.y + 0.42, relativePosition.z);
      mesh.userData.pod.rotation.y = timeSeconds * (active ? 0.9 : 0.25) * motion.rotationScale;
      mesh.userData.pod.scale.setScalar(terminal ? 0.74 : 0.72 + escortRatio * 0.28);
      mesh.userData.podMaterial.opacity = terminal ? 0.42 : 0.72 + escortRatio * 0.24;
      mesh.userData.escortMaterial.opacity = terminal ? 0.24 : 0.42 + escortRatio * 0.38;
      mesh.userData.dangerMaterial.opacity = Math.min(0.78, 0.2 + route.convoyState.ambushPressure / 100);
      mesh.userData.ambush.visible = route.convoyState.ambushPressure > 0 && !terminal;
      mesh.userData.ambush.rotation.y = -timeSeconds * 0.45 * motion.rotationScale;
    });
  }

  function createStormMesh(THREE, chart) {
    const group = new THREE.Group();
    group.userData.stormChartId = chart.id;
    const frontMaterial = new THREE.MeshBasicMaterial({
      color: 0xd46857,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const wakeMaterial = new THREE.MeshBasicMaterial({
      color: 0x4bd6c0,
      transparent: true,
      opacity: 0.28,
      wireframe: true,
    });
    const anchorMaterial = new THREE.MeshBasicMaterial({
      color: 0xd0b36a,
      transparent: true,
      opacity: 0.56,
    });
    const routeMaterial = new THREE.LineBasicMaterial({
      color: 0x8ea1ff,
      transparent: true,
      opacity: 0.34,
    });

    const front = new THREE.Mesh(new THREE.TorusGeometry(chart.radius, 0.08, 8, 72), frontMaterial);
    front.rotation.x = Math.PI / 2;
    group.add(front);

    const wake = new THREE.Mesh(new THREE.IcosahedronGeometry(chart.radius * 0.74, 1), wakeMaterial);
    wake.rotation.set(0.4, 0.2, 0.08);
    group.add(wake);

    const anchorOffset = subtract(chart.anchor.position, chart.position);
    const anchor = new THREE.Group();
    anchor.position.set(anchorOffset.x, anchorOffset.y, anchorOffset.z);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, chart.anchor.radius * 1.8, 6), anchorMaterial);
    mast.position.y = chart.anchor.radius * 0.52;
    anchor.add(mast);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(chart.anchor.radius * 0.54, 0.055, 6, 42), anchorMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = chart.anchor.radius * 1.12;
    anchor.add(ring);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(chart.anchor.radius * 0.25, 0), wakeMaterial);
    core.position.y = chart.anchor.radius * 1.45;
    anchor.add(core);
    group.add(anchor);

    const routeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.12, 0),
        new THREE.Vector3(anchorOffset.x, anchorOffset.y + 0.12, anchorOffset.z),
      ]),
      routeMaterial
    );
    group.add(routeLine);

    group.userData.front = front;
    group.userData.wake = wake;
    group.userData.anchor = anchor;
    group.userData.frontMaterial = frontMaterial;
    group.userData.wakeMaterial = wakeMaterial;
    group.userData.anchorMaterial = anchorMaterial;
    group.userData.routeMaterial = routeMaterial;
    return group;
  }

  function syncStormMeshes(handle, state, timeSeconds = 0) {
    const { THREE } = handle;
    const motion = motionSettingsForState(state);
    const activeIds = new Set((state.stormCharts || []).map((chart) => chart.id));
    handle.objects.stormMeshes.forEach((mesh, chartId) => {
      if (!activeIds.has(chartId)) {
        handle.scene.remove(mesh);
        handle.objects.stormMeshes.delete(chartId);
      }
    });
    (state.stormCharts || []).forEach((chart) => {
      if (!handle.objects.stormMeshes.has(chart.id)) {
        const mesh = createStormMesh(THREE, chart);
        handle.objects.stormMeshes.set(chart.id, mesh);
        handle.scene.add(mesh);
      }
      const mesh = handle.objects.stormMeshes.get(chart.id);
      const timing = stormWindowTiming(chart, state);
      const terminal = ["complete", "partial", "failed"].includes(chart.stormState.outcome);
      const ready = chart.prerequisiteStatus && chart.prerequisiteStatus.ready;
      const anchorRatio = clamp(chart.stormState.anchorIntegrity / Math.max(1, chart.stormState.maxAnchorIntegrity), 0, 1);
      const stormColor = terminal && chart.stormState.outcome === "failed" ? 0xd46857 : timing.locked ? 0x4bd6c0 : timing.open ? 0xd0b36a : 0x8ea1ff;
      const anchorOffset = subtract(chart.anchor.position, chart.position);

      mesh.position.set(chart.position.x, chart.position.y, chart.position.z);
      mesh.rotation.y = timeSeconds * (timing.locked ? 0.22 : 0.1) * motion.rotationScale;
      mesh.userData.frontMaterial.color.setHex(stormColor);
      mesh.userData.frontMaterial.opacity = ready ? (timing.locked ? 0.42 : 0.24) : 0.12;
      mesh.userData.wakeMaterial.color.setHex(timing.locked ? 0x4bd6c0 : 0x8ea1ff);
      mesh.userData.wakeMaterial.opacity = ready ? 0.18 + Math.min(0.2, (chart.intensity || 0) * 0.05) : 0.08;
      mesh.userData.anchor.position.set(anchorOffset.x, anchorOffset.y, anchorOffset.z);
      mesh.userData.anchor.visible = ready || chart.stormState.charted || chart.stormState.anchorDeployed;
      mesh.userData.anchor.scale.setScalar(chart.stormState.anchorDeployed ? 0.86 + anchorRatio * 0.2 : 0.74);
      mesh.userData.anchorMaterial.color.setHex(chart.stormState.anchorDeployed ? 0x4bd6c0 : 0xd0b36a);
      mesh.userData.anchorMaterial.opacity = chart.stormState.anchorDeployed ? 0.48 + anchorRatio * 0.42 : ready ? 0.5 : 0.22;
      mesh.userData.routeMaterial.color.setHex(timing.locked ? 0x4bd6c0 : 0x8ea1ff);
      mesh.userData.routeMaterial.opacity = ready ? (timing.locked ? 0.68 : 0.32) : 0.12;
      mesh.userData.wake.rotation.y = -timeSeconds * (0.16 + (chart.intensity || 0) * 0.04) * motion.rotationScale;
      mesh.userData.front.scale.setScalar(terminal ? 0.86 : 1 + Math.sin(timeSeconds * 0.9 + chart.intensity) * 0.025 * motion.pulseScale);
    });
  }

  function createInterdictionMesh(THREE, cell) {
    const group = new THREE.Group();
    group.userData.interdictionCellId = cell.id;
    const familyColor = cell.family === "pirate-den" ? 0xd46857 : cell.family === "salvage-raid" ? 0xd0b36a : 0x8ea1ff;
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: familyColor,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
    });
    const coneMaterial = new THREE.MeshBasicMaterial({
      color: 0xd46857,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
    });
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x4bd6c0,
      transparent: true,
      opacity: 0.42,
    });
    const lureMaterial = new THREE.MeshBasicMaterial({
      color: 0xd0b36a,
      transparent: true,
      opacity: 0.34,
    });
    const routeMaterial = new THREE.LineBasicMaterial({
      color: familyColor,
      transparent: true,
      opacity: 0.28,
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(cell.radius || 5, 0.07, 6, 64), ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const cone = new THREE.Mesh(new THREE.ConeGeometry((cell.radius || 5) * 0.82, (cell.radius || 5) * 1.6, 5, 1, true), coneMaterial);
    cone.position.y = (cell.radius || 5) * 0.45;
    cone.rotation.x = Math.PI;
    group.add(cone);

    const buoy = new THREE.Group();
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, (cell.radius || 5) * 0.86, 6), markerMaterial);
    mast.position.y = (cell.radius || 5) * 0.42;
    buoy.add(mast);
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), markerMaterial);
    beacon.position.y = (cell.radius || 5) * 0.92;
    buoy.add(beacon);
    group.add(buoy);

    const lure = new THREE.Group();
    for (let index = 0; index < 3; index += 1) {
      const decoy = new THREE.Mesh(new THREE.TetrahedronGeometry(0.36, 0), lureMaterial);
      const angle = index * 2.1;
      decoy.position.set(Math.cos(angle) * (cell.radius || 5) * 0.58, 0.34, Math.sin(angle) * (cell.radius || 5) * 0.58);
      lure.add(decoy);
    }
    group.add(lure);

    const patrol = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-(cell.radius || 5), 0.12, 0),
        new THREE.Vector3(cell.radius || 5, 0.12, 0),
        new THREE.Vector3(0, 0.12, -(cell.radius || 5)),
        new THREE.Vector3(0, 0.12, cell.radius || 5),
      ]),
      routeMaterial
    );
    group.add(patrol);

    group.userData.ringMaterial = ringMaterial;
    group.userData.coneMaterial = coneMaterial;
    group.userData.markerMaterial = markerMaterial;
    group.userData.lureMaterial = lureMaterial;
    group.userData.routeMaterial = routeMaterial;
    group.userData.ring = ring;
    group.userData.cone = cone;
    group.userData.buoy = buoy;
    group.userData.lure = lure;
    group.userData.patrol = patrol;
    return group;
  }

  function syncInterdictionMeshes(handle, state, timeSeconds = 0) {
    const { THREE } = handle;
    const motion = motionSettingsForState(state);
    const activeIds = new Set((state.interdictionCells || []).map((cell) => cell.id));
    handle.objects.interdictionMeshes.forEach((mesh, cellId) => {
      if (!activeIds.has(cellId)) {
        handle.scene.remove(mesh);
        handle.objects.interdictionMeshes.delete(cellId);
      }
    });
    (state.interdictionCells || []).forEach((cell) => {
      if (!handle.objects.interdictionMeshes.has(cell.id)) {
        const mesh = createInterdictionMesh(THREE, cell);
        handle.objects.interdictionMeshes.set(cell.id, mesh);
        handle.scene.add(mesh);
      }
      const mesh = handle.objects.interdictionMeshes.get(cell.id);
      const ready = cell.prerequisiteStatus && cell.prerequisiteStatus.ready;
      const terminal = ["success", "partial", "failed"].includes(cell.interdictionState.outcome);
      const scanned = cell.interdictionState.transponderScanned;
      const marked = cell.interdictionState.markerPlaced;
      const lured = cell.interdictionState.lureDeployed;
      const timing = interdictionResponseTiming(cell, state);
      const raidRatio = clamp((cell.interdictionState.raidPressure || cell.raidPressure || 0) / 70, 0, 1);
      const tone =
        terminal && cell.interdictionState.outcome === "success"
          ? 0x4bd6c0
          : terminal && cell.interdictionState.outcome === "partial"
            ? 0xd0b36a
            : terminal
              ? 0xd46857
              : marked
                ? cell.interdictionState.markerType === "decoy"
                  ? 0xd0b36a
                  : 0x4bd6c0
                : scanned
                  ? 0x8ea1ff
                  : 0xd46857;

      mesh.position.set(cell.position.x, cell.position.y, cell.position.z);
      mesh.rotation.y = timeSeconds * (lured ? 0.46 : marked ? 0.3 : 0.16) * motion.rotationScale;
      mesh.visible = true;
      mesh.scale.setScalar(ready ? 1 : 0.82);
      mesh.userData.ringMaterial.color.setHex(tone);
      mesh.userData.ringMaterial.opacity = terminal ? 0.22 : ready ? 0.28 + raidRatio * 0.28 : 0.14;
      mesh.userData.coneMaterial.color.setHex(tone);
      mesh.userData.coneMaterial.opacity = terminal ? 0.08 : ready ? 0.12 + raidRatio * 0.18 : 0.06;
      mesh.userData.routeMaterial.color.setHex(tone);
      mesh.userData.routeMaterial.opacity = ready ? 0.24 + raidRatio * 0.24 : 0.12;
      mesh.userData.markerMaterial.color.setHex(marked ? tone : 0x59655f);
      mesh.userData.markerMaterial.opacity = marked ? 0.76 : scanned ? 0.36 : 0.18;
      mesh.userData.lureMaterial.opacity = lured ? 0.74 : 0.18;
      mesh.userData.buoy.visible = scanned || marked || ready;
      mesh.userData.lure.visible = lured || (ready && scanned);
      mesh.userData.lure.rotation.y = -timeSeconds * 0.7 * motion.rotationScale;
      mesh.userData.patrol.visible = ready || scanned || marked;
      mesh.userData.ring.scale.setScalar(timing.open || timing.locked ? 1 + Math.sin(timeSeconds * 1.8) * 0.035 * motion.pulseScale : 1);
    });
  }

  function createSignalGateMesh(THREE, gate) {
    const group = new THREE.Group();
    group.userData.signalGateId = gate.id;
    const familyColor = gate.family === "late-run-lattice" ? 0x8ea1ff : gate.family === "manifest-gate" ? 0xd0b36a : 0x4bd6c0;
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: familyColor,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
    });
    const latticeMaterial = new THREE.MeshBasicMaterial({
      color: 0x4bd6c0,
      transparent: true,
      opacity: 0.24,
      wireframe: true,
    });
    const pylonMaterial = new THREE.MeshBasicMaterial({
      color: 0xd0b36a,
      transparent: true,
      opacity: 0.5,
    });
    const capacitorMaterial = new THREE.MeshBasicMaterial({
      color: 0x4bd6c0,
      transparent: true,
      opacity: 0.28,
    });
    const jamMaterial = new THREE.MeshBasicMaterial({
      color: 0xd46857,
      transparent: true,
      opacity: 0.22,
    });
    const transitMaterial = new THREE.LineBasicMaterial({
      color: familyColor,
      transparent: true,
      opacity: 0.32,
    });

    const aperture = new THREE.Mesh(new THREE.TorusGeometry(gate.radius || 5, 0.1, 8, 72), ringMaterial);
    aperture.rotation.x = Math.PI / 2;
    group.add(aperture);

    const lattice = new THREE.Mesh(new THREE.IcosahedronGeometry((gate.radius || 5) * 0.52, 1), latticeMaterial);
    lattice.position.y = 0.2;
    group.add(lattice);

    const pylon = new THREE.Group();
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, (gate.pylon.radius || 4) * 1.7, 6), pylonMaterial);
    mast.position.y = (gate.pylon.radius || 4) * 0.54;
    pylon.add(mast);
    const pylonRing = new THREE.Mesh(new THREE.TorusGeometry((gate.pylon.radius || 4) * 0.48, 0.055, 6, 42), pylonMaterial);
    pylonRing.rotation.x = Math.PI / 2;
    pylonRing.position.y = (gate.pylon.radius || 4) * 1.08;
    pylon.add(pylonRing);
    const pylonCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), capacitorMaterial);
    pylonCore.position.y = (gate.pylon.radius || 4) * 1.42;
    pylon.add(pylonCore);
    group.add(pylon);

    const capacitors = new THREE.Group();
    for (let index = 0; index < 4; index += 1) {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), capacitorMaterial);
      const angle = index * (Math.PI / 2);
      node.position.set(Math.cos(angle) * (gate.radius || 5) * 0.74, 0.38, Math.sin(angle) * (gate.radius || 5) * 0.74);
      capacitors.add(node);
    }
    group.add(capacitors);

    const latticePosition = gate.latticePosition || gate.position;
    const latticeOffset = subtract(latticePosition, gate.position);
    const pylonOffset = subtract(gate.pylon.position, gate.position);
    const transitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.18, 0),
        new THREE.Vector3(latticeOffset.x * 0.5, latticeOffset.y + 3.2, latticeOffset.z * 0.5),
        new THREE.Vector3(latticeOffset.x, latticeOffset.y + 0.18, latticeOffset.z),
      ]),
      transitMaterial
    );
    group.add(transitLine);

    const convoySeal = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.045, 6, 36), capacitorMaterial);
    convoySeal.position.set(latticeOffset.x * 0.72, latticeOffset.y + 0.32, latticeOffset.z * 0.72);
    convoySeal.rotation.x = Math.PI / 2;
    group.add(convoySeal);

    const jamMarkers = new THREE.Group();
    for (let index = 0; index < 3; index += 1) {
      const marker = new THREE.Mesh(new THREE.TetrahedronGeometry(0.38 + index * 0.06, 0), jamMaterial);
      marker.position.set((index - 1) * 0.92, 0.46 + index * 0.12, (gate.radius || 5) * 0.55);
      jamMarkers.add(marker);
    }
    group.add(jamMarkers);

    pylon.position.set(pylonOffset.x, pylonOffset.y, pylonOffset.z);
    group.userData.ringMaterial = ringMaterial;
    group.userData.latticeMaterial = latticeMaterial;
    group.userData.pylonMaterial = pylonMaterial;
    group.userData.capacitorMaterial = capacitorMaterial;
    group.userData.jamMaterial = jamMaterial;
    group.userData.transitMaterial = transitMaterial;
    group.userData.aperture = aperture;
    group.userData.lattice = lattice;
    group.userData.pylon = pylon;
    group.userData.capacitors = capacitors;
    group.userData.convoySeal = convoySeal;
    group.userData.jamMarkers = jamMarkers;
    return group;
  }

  function syncSignalGateMeshes(handle, state, timeSeconds = 0) {
    const { THREE } = handle;
    const motion = motionSettingsForState(state);
    const activeIds = new Set((state.signalGates || []).map((gate) => gate.id));
    handle.objects.signalGateMeshes.forEach((mesh, gateId) => {
      if (!activeIds.has(gateId)) {
        handle.scene.remove(mesh);
        handle.objects.signalGateMeshes.delete(gateId);
      }
    });
    (state.signalGates || []).forEach((gate) => {
      if (!handle.objects.signalGateMeshes.has(gate.id)) {
        const mesh = createSignalGateMesh(THREE, gate);
        handle.objects.signalGateMeshes.set(gate.id, mesh);
        handle.scene.add(mesh);
      }
      const mesh = handle.objects.signalGateMeshes.get(gate.id);
      const ready = gate.prerequisiteStatus && gate.prerequisiteStatus.ready;
      const timing = signalGateTransitTiming(gate, state);
      const terminal = ["success", "partial", "failed"].includes(gate.gateState.outcome);
      const chargeRatio = clamp(gate.gateState.capacitorCharge / Math.max(1, gate.gateState.capacitorRequirement), 0, 1);
      const pylonRatio = clamp(gate.gateState.pylonIntegrity / Math.max(1, gate.gateState.maxPylonIntegrity), 0, 1);
      const jamRatio = clamp((gate.gateState.pirateJam || gate.pirateGateJam || 0) / 80, 0, 1);
      const tone =
        terminal && gate.gateState.outcome === "failed"
          ? 0xd46857
          : terminal && gate.gateState.outcome === "partial"
            ? 0xd0b36a
            : terminal
              ? 0x4bd6c0
              : timing.open || timing.forced
                ? 0x4bd6c0
                : gate.gateState.pylonAligned
                  ? 0x8ea1ff
                  : ready
                    ? 0xd0b36a
                    : 0x59655f;

      mesh.position.set(gate.position.x, gate.position.y, gate.position.z);
      mesh.rotation.y = timeSeconds * (timing.open || timing.forced ? 0.34 : 0.16) * motion.rotationScale;
      mesh.visible = true;
      mesh.scale.setScalar(terminal ? 0.82 : ready ? 1 : 0.78);
      mesh.userData.ringMaterial.color.setHex(tone);
      mesh.userData.ringMaterial.opacity = ready ? 0.24 + chargeRatio * 0.32 : 0.12;
      mesh.userData.latticeMaterial.color.setHex(tone);
      mesh.userData.latticeMaterial.opacity = ready ? 0.16 + chargeRatio * 0.24 : 0.08;
      mesh.userData.pylonMaterial.color.setHex(gate.gateState.pylonAligned ? 0x4bd6c0 : 0xd0b36a);
      mesh.userData.pylonMaterial.opacity = ready ? 0.28 + pylonRatio * 0.42 : 0.12;
      mesh.userData.capacitorMaterial.color.setHex(chargeRatio >= 1 ? 0x4bd6c0 : 0xd0b36a);
      mesh.userData.capacitorMaterial.opacity = ready ? 0.22 + chargeRatio * 0.5 : 0.1;
      mesh.userData.transitMaterial.color.setHex(tone);
      mesh.userData.transitMaterial.opacity = ready ? (timing.open || timing.forced ? 0.76 : 0.24 + chargeRatio * 0.24) : 0.1;
      mesh.userData.jamMaterial.opacity = terminal ? 0.08 : ready ? 0.12 + jamRatio * 0.5 : 0.06;
      mesh.userData.jamMarkers.visible = ready && (gate.gateState.harmonicsScanned || jamRatio > 0.25);
      mesh.userData.capacitors.rotation.y = -timeSeconds * (0.3 + chargeRatio * 0.5) * motion.rotationScale;
      mesh.userData.lattice.rotation.y = timeSeconds * (0.18 + chargeRatio * 0.2) * motion.rotationScale;
      mesh.userData.aperture.scale.setScalar(timing.open || timing.forced ? 1 + Math.sin(timeSeconds * 1.8) * 0.04 * motion.pulseScale : 1);
      mesh.userData.convoySeal.visible = (gate.convoyRouteIds || []).length > 0;
      mesh.userData.convoySeal.scale.setScalar(0.82 + chargeRatio * 0.28);
    });
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

  function createOreSparks(THREE) {
    const group = new THREE.Group();
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.72, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: 0xd0b36a, transparent: true, opacity: 0.72, depthWrite: false }),
    ];
    for (let index = 0; index < 10; index += 1) {
      const spark = new THREE.Mesh(new THREE.TetrahedronGeometry(0.12 + (index % 3) * 0.025, 0), materials[index % materials.length]);
      spark.userData.phase = index * 0.73;
      group.add(spark);
    }
    group.visible = false;
    return group;
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

    const salvageMeshes = new Map();
    (state.salvageSites || []).forEach((site) => {
      const mesh = createSalvageMesh(THREE, site);
      mesh.position.set(site.position.x, site.position.y, site.position.z);
      salvageMeshes.set(site.id, mesh);
      scene.add(mesh);
    });

    const convoyMeshes = new Map();
    (state.convoyRoutes || []).forEach((route) => {
      const mesh = createConvoyMesh(THREE, route);
      mesh.position.set(route.beacon.position.x, route.beacon.position.y, route.beacon.position.z);
      convoyMeshes.set(route.id, mesh);
      scene.add(mesh);
    });

    const stormMeshes = new Map();
    (state.stormCharts || []).forEach((chart) => {
      const mesh = createStormMesh(THREE, chart);
      mesh.position.set(chart.position.x, chart.position.y, chart.position.z);
      stormMeshes.set(chart.id, mesh);
      scene.add(mesh);
    });

    const interdictionMeshes = new Map();
    (state.interdictionCells || []).forEach((cell) => {
      const mesh = createInterdictionMesh(THREE, cell);
      mesh.position.set(cell.position.x, cell.position.y, cell.position.z);
      interdictionMeshes.set(cell.id, mesh);
      scene.add(mesh);
    });

    const signalGateMeshes = new Map();
    (state.signalGates || []).forEach((gate) => {
      const mesh = createSignalGateMesh(THREE, gate);
      mesh.position.set(gate.position.x, gate.position.y, gate.position.z);
      signalGateMeshes.set(gate.id, mesh);
      scene.add(mesh);
    });

    const pirate = createPirateMesh(THREE, sceneAssets);
    scene.add(pirate);

    const targetRing = createTargetRing(THREE);
    scene.add(targetRing);

    const miningBeam = createMiningBeam(THREE);
    scene.add(miningBeam);

    const oreSparks = createOreSparks(THREE);
    scene.add(oreSparks);

    return {
      THREE,
      scene,
      camera,
      renderer,
      objects: {
        ship,
        station,
        asteroidMeshes,
        salvageMeshes,
        convoyMeshes,
        stormMeshes,
        interdictionMeshes,
        signalGateMeshes,
        pirate,
        targetRing,
        miningBeam,
        oreSparks,
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
    const motion = motionSettingsForState(state);
    handle.objects.ship.position.set(state.ship.position.x, state.ship.position.y, state.ship.position.z);
    const orientation = state.ship.orientation || createShipOrientation(state.ship.heading);
    handle.objects.ship.rotation.set(orientation.pitch || 0, orientation.yaw, orientation.roll || 0);
    const engine = state.ship.engineState || createEngineState();
    (handle.objects.ship.userData.thrusterGlows || []).forEach((glow, index) => {
      glow.visible = Boolean(engine.thrusting || engine.verticalAxis !== 0);
      glow.material.opacity = (engine.thrusting ? 0.72 : engine.verticalAxis !== 0 ? 0.38 : 0) * motion.glowScale;
      glow.scale.set(1, 1 + Math.sin(timeSeconds * 18 + index) * 0.16 * motion.pulseScale, engine.thrusting ? 1.3 : 0.85);
    });
    (handle.objects.ship.userData.brakeGlows || []).forEach((glow, index) => {
      glow.visible = Boolean(engine.braking);
      glow.material.opacity = (engine.braking ? 0.68 : 0) * motion.glowScale;
      glow.scale.setScalar(engine.braking ? 1.2 + Math.sin(timeSeconds * 16 + index) * 0.18 * motion.pulseScale : 1);
    });
    handle.objects.station.rotation.y = timeSeconds * 0.12 * motion.rotationScale;
    const stationVisual = handle.objects.station.userData || {};
    if (stationVisual.dockRing) {
      const dockable = state.station.proximity.dockable || state.station.docked;
      stationVisual.dockRing.material.color.setHex(dockable ? 0x4bd6c0 : 0xd0b36a);
      stationVisual.dockRing.material.opacity = (dockable ? 0.72 : 0.32) * motion.glowScale;
      stationVisual.dockRing.scale.setScalar(dockable ? 1 + Math.sin(timeSeconds * 5) * 0.025 * motion.pulseScale : 1);
    }
    if (stationVisual.dockingCorridor) {
      stationVisual.dockingCorridor.visible = !state.station.docked;
      stationVisual.dockingCorridor.children.forEach((lane, index) => {
        lane.material.opacity = (state.station.proximity.dockable ? 0.26 + index * 0.04 : 0.1) * motion.glowScale;
        lane.scale.setScalar(1 + Math.sin(timeSeconds * 2.5 + index) * 0.018 * motion.pulseScale);
      });
    }
    if (stationVisual.stationBeacon) {
      stationVisual.stationBeacon.material.opacity =
        (state.station.proximity.dockable ? 0.95 : 0.62 + Math.sin(timeSeconds * 3.2) * 0.12 * motion.pulseScale) *
        motion.glowScale;
      stationVisual.stationBeacon.scale.setScalar(state.station.proximity.dockable ? 1.28 : 1);
    }
    handle.objects.pirate.position.set(state.pirate.position.x, state.pirate.position.y, state.pirate.position.z);
    handle.objects.pirate.rotation.y = timeSeconds * 0.85 * motion.rotationScale;
    handle.objects.pirate.visible = Boolean(state.systemAccess && state.systemAccess.pirate && state.pirate.state !== "dormant");

    state.asteroids.forEach((asteroid) => {
      const mesh = handle.objects.asteroidMeshes.get(asteroid.id);
      if (mesh) {
        const activeMining = state.mining.active && state.mining.targetId === asteroid.id;
        const heatRatio = clamp((asteroid.mineState.beamHeat || 0) / 100, 0, 1);
        mesh.rotation.set(timeSeconds * 0.05 * motion.rotationScale + asteroid.spin, timeSeconds * 0.07 * motion.rotationScale + asteroid.spin, 0);
        mesh.scale.setScalar(asteroid.mineState.depleted ? 0.56 : 1);
        if (mesh.userData.oreHalo) {
          mesh.userData.oreHalo.visible = !asteroid.mineState.depleted;
          mesh.userData.oreHalo.material.opacity = (activeMining ? 0.42 : 0.08 + heatRatio * 0.18) * motion.glowScale;
          mesh.userData.oreHalo.scale.setScalar(
            1 + (activeMining ? 0.08 * motion.nonessentialMotionScale + Math.sin(timeSeconds * 12) * 0.025 * motion.pulseScale : 0)
          );
        }
        mesh.traverse((child) => {
          if (child === mesh.userData.oreHalo) {
            return;
          }
          if (child.material) {
            child.material.transparent = asteroid.mineState.depleted;
            child.material.opacity = asteroid.mineState.depleted ? 0.38 : 1;
          }
        });
      }
    });

    syncSalvageMeshes(handle, state);
    syncConvoyMeshes(handle, state, timeSeconds);
    syncStormMeshes(handle, state, timeSeconds);
    syncInterdictionMeshes(handle, state, timeSeconds);
    syncSignalGateMeshes(handle, state, timeSeconds);
    (state.salvageSites || []).forEach((site) => {
      const mesh = handle.objects.salvageMeshes.get(site.id);
      if (!mesh) {
        return;
      }
      const salvageState = site.salvageState;
      mesh.position.set(site.position.x, site.position.y, site.position.z);
      mesh.rotation.y = site.riskPhase * TWO_PI + timeSeconds * (site.type === "relay-cache" ? 0.18 : 0.08) * motion.rotationScale;
      mesh.rotation.x = Math.sin(timeSeconds * 0.7 + site.riskPhase * TWO_PI) * 0.04 * motion.pulseScale;
      mesh.scale.setScalar(salvageState.status === "depleted" ? 0.54 : salvageState.status === "failed" ? 0.72 : 1);
      mesh.visible = salvageState.status !== "abandoned";
      mesh.traverse((child) => {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = salvageState.status === "depleted" ? 0.28 : salvageState.targetLocked ? 0.94 : 0.68;
        }
      });
    });

    const target = findTarget(state);
    if (target) {
      const radius = target.radius ? target.radius + 1.2 : 6;
      handle.objects.targetRing.position.set(target.position.x, target.position.y, target.position.z);
      handle.objects.targetRing.scale.setScalar(radius / 3.8);
      handle.objects.targetRing.material.color.setHex(
        state.target.kind === "salvage"
          ? 0xd0b36a
          : state.target.kind === "convoy"
            ? 0x8ea1ff
            : state.target.kind === "storm"
              ? 0xd46857
              : state.target.kind === "interdiction"
                ? 0xd46857
              : state.target.kind === "signal-gate"
                ? 0x4bd6c0
              : 0x4bd6c0
      );
      handle.objects.targetRing.visible = true;
    } else {
      handle.objects.targetRing.visible = false;
    }

    const beamTarget =
      state.mining.active && state.mining.targetId
        ? state.asteroids.find((node) => node.id === state.mining.targetId)
        : state.salvage.active && state.salvage.targetId
          ? (state.salvageSites || []).find((site) => site.id === state.salvage.targetId)
          : null;
    if (beamTarget) {
      handle.objects.miningBeam.material.color.setHex(state.salvage.active ? 0xd0b36a : 0x4bd6c0);
      handle.objects.miningBeam.geometry.setFromPoints([
        new THREE.Vector3(state.ship.position.x, state.ship.position.y, state.ship.position.z),
        new THREE.Vector3(beamTarget.position.x, beamTarget.position.y, beamTarget.position.z),
      ]);
      handle.objects.miningBeam.visible = true;
      handle.objects.oreSparks.visible = state.mining.active || state.salvage.active;
      handle.objects.oreSparks.position.set(beamTarget.position.x, beamTarget.position.y, beamTarget.position.z);
      const visibleSparkCount = Math.max(1, Math.round(handle.objects.oreSparks.children.length * motion.particleScale));
      handle.objects.oreSparks.children.forEach((spark, index) => {
        const phase = spark.userData.phase + timeSeconds * 4.2 * motion.nonessentialMotionScale;
        const radius = (0.45 + (index % 4) * 0.18 + (state.mining.lastYield || 0) * 0.08) * motion.particleScale;
        spark.visible = index < visibleSparkCount;
        spark.position.set(Math.cos(phase) * radius, Math.sin(phase * 1.7) * 0.32, Math.sin(phase) * radius);
        spark.rotation.set(phase * motion.rotationScale, phase * 0.5 * motion.rotationScale, 0);
        spark.material.opacity = state.mining.active || state.salvage.active ? 0.72 * motion.glowScale : 0;
      });
    } else {
      handle.objects.miningBeam.visible = false;
      handle.objects.oreSparks.visible = false;
    }

    handle.camera.position.copy(new THREE.Vector3(state.camera.position.x, state.camera.position.y, state.camera.position.z));
    handle.camera.lookAt(new THREE.Vector3(state.camera.target.x, state.camera.target.y, state.camera.target.z));
    handle.renderer.render(handle.scene, handle.camera);
  }

  function animationFrame(now) {
    if (!sceneHandle || !currentState) {
      return;
    }
    const evidenceHeld = evidenceHoldUntil > now;
    const deltaSeconds = evidenceHeld ? 0 : Math.min(0.05, (now - lastFrameTime) / 1000 || 0.016);
    lastFrameTime = now;
    if (!evidenceHeld) {
      currentState = stepSpaceflight(currentState, pressedControls, deltaSeconds);
    }
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
    resolveReducedMotionPreference,
    setReducedMotion,
    motionSurfaceForState,
    createAsteroidNodes,
    createAnomalyNodes,
    createSalvageSites,
    createConvoyRoutes,
    createStormCharts,
    createInterdictionCells,
    createSignalGates,
    createSurveyLadderState,
    createConvoyState,
    createStormCartographyState,
    createInterdictionState,
    createSignalGateState,
    applyFlightInput,
    stepSpaceflight,
    mineTarget,
    scanTarget,
    scanStormChart,
    scanInterdictionTransponder,
    scanSignalGateHarmonics,
    scanSalvageTarget,
    extractSalvageTarget,
    abandonSalvageTarget,
    salvageRisk,
    convoyRouteReadiness,
    stormChartReadiness,
    deployRouteBeacon,
    maintainRouteBeacon,
    startConvoyRoute,
    advanceConvoyRoute,
    applyConvoyInterdiction,
    resolveConvoyPayout,
    deployConvoyCountermeasure,
    deployStormAnchor,
    maintainStormAnchor,
    lockStormRouteWindow,
    stabilizeStormWindow,
    rerouteStormSalvage,
    resolveStormWindow,
    interdictionCellReadiness,
    placeInterdictionMarker,
    deployInterdictionLure,
    resolveInterdictionRaid,
    signalGateReadiness,
    alignSignalGatePylon,
    chargeSignalGateCapacitor,
    anchorSignalGateStormWindow,
    mitigateSignalGateJam,
    forceSignalGateOpen,
    abortSignalGateTransit,
    commitSignalGateTransit,
    dockAtStation,
    launchFromStation,
    stageEvidenceState,
    purchaseUpgrade,
    purchaseStationService,
    deployCountermeasure,
    chooseSector,
    resetRun,
    restartTutorial,
    retarget,
    setTarget,
    sectorById,
    updateCameraState,
    updateHazardState,
    updateInterdictionRaids,
    updateSignalGateJams,
    dockingStatus,
    upgradeSummary,
    surveySummary,
    salvageSummary,
    convoySummary,
    stormSummary,
    interdictionSummary,
    signalGateSummary,
    surveyCockpitSurface,
    cockpitSurface,
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

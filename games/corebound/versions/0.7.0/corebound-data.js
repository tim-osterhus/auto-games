(function () {
  "use strict";

  window.COREBOUND_DATA = {
    world: {
      width: 43,
      depth: 138,
      metersPerTile: 8,
      seed: 73129
    },
    release: {
      version: "v0.7.0",
      snapshot: "HUD Breakthrough release",
      build: "request-dc91506d2793449391c8f1d81f6d96f1"
    },
    rig: {
      name: "Mantis-01",
      cargoCapacity: 12,
      maxHull: 100,
      maxEnergy: 100,
      moveEnergy: 0.8,
      maxHeat: 100,
      coolingRate: 4,
      drillCostReduction: 0,
      hullRiskReduction: 0,
      pressureMitigation: 0,
      hazardMitigation: 0,
      thermalShielding: 0,
      valueMultiplier: 1,
      refineryBonus: 0,
      repairDiscount: 0,
      archiveSignal: 0,
      scanRange: 0,
      beaconCharges: 0,
      beaconReturnEfficiency: 0,
      coolantCharges: 0,
      anchorCharges: 0,
      utilityCooling: 0,
      charterDrillHeat: 0,
      returnEnergyPenalty: 0,
      drillPower: 1,
      motion: {
        maxSpeed: 4.2,
        acceleration: 11.5,
        braking: 18,
        velocityDecay: 7.5,
        tapImpulse: 1.35,
        cameraFollow: 8.5
      },
      drillContact: {
        minSeconds: 0.22,
        baseSeconds: 0.12,
        hardnessSeconds: 0.18,
        pressureSeconds: 0.12,
        cargoLoadSeconds: 0.16,
        maxSeconds: 3.4,
        heatPerSecond: 0.18,
        energyPressure: 0.16,
        feedbackTick: 0.24
      }
    },
    economy: {
      resources: {
        credits: {
          label: "Credits",
          shortLabel: "cr"
        },
        alloy: {
          label: "Alloy",
          shortLabel: "alloy"
        },
        research: {
          label: "Research",
          shortLabel: "rsch"
        },
        relic: {
          label: "Relic fragments",
          shortLabel: "relic"
        }
      },
      sale: {
        handlingCreditsPerCargoUnit: 9
      },
      refinement: {
        creditFactor: 0.35,
        minimumCredits: 8
      },
      repair: {
        creditsPerHullPoint: 2
      },
      facilities: {
        refinery: {
          label: "Refinery",
          role: "turns ore into upgrade stock"
        },
        rigBay: {
          label: "Rig bay",
          role: "repairs hull and installs vehicle systems"
        },
        assayDesk: {
          label: "Assay desk",
          role: "keeps research and future contract hooks separate"
        },
        surveyRelay: {
          label: "Survey relay",
          role: "converts filed commissions and archive sigils into field utility support"
        }
      }
    },
    assets: {
      sourceManifest: "assets/asset-manifest.json",
      images: {
        "rig.mantis_motion_strip": {
          path: "assets/rig/mantis-rig-motion-strip.png",
          width: 320,
          height: 80,
          frameWidth: 80,
          frameHeight: 80,
          sourceY: 0
        },
        "surface.facilities_panel": {
          path: "assets/surface/surface-facilities-panel.png",
          width: 640,
          height: 160
        },
        "surface.launch_shaft_context": {
          path: "assets/surface/launch-shaft-context.png",
          width: 320,
          height: 320
        },
        "terrain.loam_gritstone_tile": {
          path: "assets/terrain/loam-gritstone-tile.png",
          width: 128,
          height: 128
        },
        "terrain.basalt_core_tile": {
          path: "assets/terrain/basalt-core-tile.png",
          width: 128,
          height: 128
        },
        "terrain.pressure_glass_tile": {
          path: "assets/terrain/pressure-glass-tile.png",
          width: 128,
          height: 128
        },
        "readables.ore_hazard_atlas": {
          path: "assets/readables/ore-hazard-atlas.png",
          width: 384,
          height: 128,
          frameWidth: 64,
          frameHeight: 64,
          sourceY: 32
        },
        "hud.icon_atlas": {
          path: "assets/hud/hud-icon-atlas.png",
          width: 320,
          height: 64,
          frameWidth: 64,
          frameHeight: 64,
          sourceY: 0
        },
        "upgrades.research_atlas": {
          path: "assets/upgrades/upgrade-research-atlas.png",
          width: 512,
          height: 128,
          frameWidth: 64,
          frameHeight: 64,
          sourceY: 32
        }
      },
      terrainTextures: {
        loam: "terrain.loam_gritstone_tile",
        gritstone: "terrain.loam_gritstone_tile",
        ironClay: "terrain.loam_gritstone_tile",
        basaltLock: "terrain.basalt_core_tile",
        thermalBasalt: "terrain.basalt_core_tile",
        machineRib: "terrain.basalt_core_tile",
        coreRind: "terrain.basalt_core_tile",
        anchorRib: "terrain.basalt_core_tile",
        pressureGlass: "terrain.pressure_glass_tile",
        shaleFault: "terrain.pressure_glass_tile",
        choirSlate: "terrain.pressure_glass_tile"
      },
      oreIcons: {
        copperSeed: 0,
        nickelBloom: 0,
        emberFossil: 0,
        saltglass: 1,
        vaporCrystal: 1,
        archiveShard: 1,
        echoPearl: 1,
        cobaltThread: 2,
        prismMarrow: 2,
        coreMote: 2,
        relayCore: 2
      },
      hazardIcons: {
        heatFissure: 3,
        gasVent: 4,
        pressureFault: 5,
        magneticBloom: 5,
        gravityShear: 5
      }
    },
    materialRendering: {
      strataBands: [
        { to: 15, wash: "rgba(180, 154, 104, 0.08)", shadow: "rgba(5, 7, 8, 0.18)", lamina: "rgba(213, 166, 73, 0.16)" },
        { to: 34, wash: "rgba(82, 96, 94, 0.11)", shadow: "rgba(5, 7, 8, 0.22)", lamina: "rgba(143, 161, 157, 0.15)" },
        { to: 56, wash: "rgba(131, 168, 198, 0.09)", shadow: "rgba(5, 7, 8, 0.26)", lamina: "rgba(131, 168, 198, 0.15)" },
        { to: 82, wash: "rgba(71, 224, 195, 0.075)", shadow: "rgba(5, 7, 8, 0.31)", lamina: "rgba(71, 224, 195, 0.14)" },
        { to: 110, wash: "rgba(194, 165, 228, 0.07)", shadow: "rgba(5, 7, 8, 0.36)", lamina: "rgba(194, 165, 228, 0.14)" },
        { to: 999, wash: "rgba(211, 193, 122, 0.07)", shadow: "rgba(5, 7, 8, 0.42)", lamina: "rgba(211, 193, 122, 0.14)" }
      ],
      terrainMaterials: {
        loam: { bridge: "rgba(143, 161, 157, 0.1)", crack: "rgba(231, 240, 236, 0.22)", fleck: "rgba(213, 166, 73, 0.12)", textureAlpha: 0.46, lamina: "rgba(213, 166, 73, 0.15)", rim: "rgba(83, 99, 78, 0.62)" },
        gritstone: { bridge: "rgba(143, 161, 157, 0.12)", crack: "rgba(231, 240, 236, 0.24)", fleck: "rgba(131, 168, 198, 0.11)", textureAlpha: 0.52, lamina: "rgba(143, 161, 157, 0.14)", rim: "rgba(89, 97, 102, 0.62)" },
        ironClay: { bridge: "rgba(213, 111, 95, 0.12)", crack: "rgba(213, 166, 73, 0.22)", fleck: "rgba(215, 111, 95, 0.14)", textureAlpha: 0.5, lamina: "rgba(213, 111, 95, 0.15)", rim: "rgba(121, 77, 62, 0.64)" },
        basaltLock: { bridge: "rgba(82, 96, 94, 0.15)", crack: "rgba(143, 161, 157, 0.2)", fleck: "rgba(71, 224, 195, 0.09)", textureAlpha: 0.58, lamina: "rgba(82, 96, 94, 0.18)", rim: "rgba(72, 82, 90, 0.64)" },
        pressureGlass: { bridge: "rgba(131, 168, 198, 0.13)", crack: "rgba(131, 168, 198, 0.34)", fleck: "rgba(71, 224, 195, 0.12)", textureAlpha: 0.62, lamina: "rgba(131, 168, 198, 0.18)", rim: "rgba(95, 120, 131, 0.68)" },
        shaleFault: { bridge: "rgba(143, 161, 157, 0.12)", crack: "rgba(231, 240, 236, 0.24)", fleck: "rgba(131, 168, 198, 0.11)", textureAlpha: 0.55, lamina: "rgba(143, 161, 157, 0.15)", rim: "rgba(108, 122, 112, 0.64)" },
        thermalBasalt: { bridge: "rgba(215, 111, 95, 0.13)", crack: "rgba(213, 111, 95, 0.35)", fleck: "rgba(213, 166, 73, 0.15)", textureAlpha: 0.6, lamina: "rgba(215, 111, 95, 0.18)", rim: "rgba(142, 81, 70, 0.68)" },
        machineRib: { bridge: "rgba(71, 224, 195, 0.12)", crack: "rgba(71, 224, 195, 0.25)", fleck: "rgba(131, 168, 198, 0.13)", textureAlpha: 0.6, lamina: "rgba(71, 224, 195, 0.16)", rim: "rgba(94, 127, 130, 0.68)" },
        coreRind: { bridge: "rgba(194, 165, 228, 0.12)", crack: "rgba(194, 165, 228, 0.3)", fleck: "rgba(213, 166, 73, 0.13)", textureAlpha: 0.64, lamina: "rgba(194, 165, 228, 0.17)", rim: "rgba(127, 106, 165, 0.68)" },
        choirSlate: { bridge: "rgba(71, 224, 195, 0.13)", crack: "rgba(71, 224, 195, 0.35)", fleck: "rgba(231, 240, 236, 0.11)", textureAlpha: 0.66, lamina: "rgba(71, 224, 195, 0.16)", rim: "rgba(74, 168, 151, 0.7)" },
        anchorRib: { bridge: "rgba(213, 166, 73, 0.13)", crack: "rgba(211, 193, 122, 0.35)", fleck: "rgba(71, 224, 195, 0.11)", textureAlpha: 0.66, lamina: "rgba(211, 193, 122, 0.17)", rim: "rgba(155, 143, 103, 0.7)" }
      },
      oreDeposits: {
        copperSeed: { form: "cluster", pocket: "rgba(213, 154, 83, 0.22)", seamAlpha: 0.7 },
        saltglass: { form: "pocket", pocket: "rgba(185, 217, 206, 0.2)", seamAlpha: 0.62 },
        cobaltThread: { form: "thread", pocket: "rgba(112, 156, 204, 0.22)", seamAlpha: 0.68 },
        nickelBloom: { form: "cluster", pocket: "rgba(158, 167, 123, 0.2)", seamAlpha: 0.62 },
        emberFossil: { form: "vein", pocket: "rgba(213, 110, 87, 0.2)", seamAlpha: 0.72 },
        vaporCrystal: { form: "pocket", pocket: "rgba(125, 215, 200, 0.2)", seamAlpha: 0.68 },
        prismMarrow: { form: "thread", pocket: "rgba(194, 165, 228, 0.22)", seamAlpha: 0.7 },
        archiveShard: { form: "pocket", pocket: "rgba(215, 208, 168, 0.2)", seamAlpha: 0.68 },
        coreMote: { form: "cluster", pocket: "rgba(226, 182, 111, 0.22)", seamAlpha: 0.72 },
        echoPearl: { form: "pocket", pocket: "rgba(167, 223, 209, 0.22)", seamAlpha: 0.7 },
        relayCore: { form: "vein", pocket: "rgba(211, 193, 122, 0.22)", seamAlpha: 0.76 }
      },
      hazardInclusions: {
        gasVent: { form: "vent", pocket: "rgba(132, 169, 124, 0.2)", seamAlpha: 0.62 },
        heatFissure: { form: "fissure", pocket: "rgba(215, 111, 95, 0.24)", seamAlpha: 0.78 },
        pressureFault: { form: "fault", pocket: "rgba(131, 168, 198, 0.22)", seamAlpha: 0.68 },
        magneticBloom: { form: "bloom", pocket: "rgba(194, 165, 228, 0.22)", seamAlpha: 0.72 },
        gravityShear: { form: "shear", pocket: "rgba(211, 193, 122, 0.22)", seamAlpha: 0.76 }
      }
    },
    terrainTypes: {
      loam: {
        label: "Loam plate",
        hardness: 1,
        energyCost: 3,
        hullRisk: 0,
        heat: 1,
        color: "#30362e",
        edge: "#53634e"
      },
      gritstone: {
        label: "Gritstone",
        hardness: 2,
        energyCost: 5,
        hullRisk: 1,
        heat: 2,
        color: "#34383b",
        edge: "#596166"
      },
      ironClay: {
        label: "Iron clay",
        hardness: 2,
        energyCost: 6,
        hullRisk: 1,
        heat: 2,
        color: "#41312c",
        edge: "#794d3e"
      },
      basaltLock: {
        label: "Basalt lock",
        hardness: 3,
        energyCost: 8,
        hullRisk: 2,
        heat: 3,
        color: "#252d31",
        edge: "#48525a"
      },
      pressureGlass: {
        label: "Pressure glass",
        hardness: 4,
        energyCost: 11,
        hullRisk: 3,
        heat: 4,
        color: "#1f2c34",
        edge: "#5f7883"
      },
      shaleFault: {
        label: "Shale fault",
        hardness: 3,
        energyCost: 9,
        hullRisk: 3,
        heat: 3,
        color: "#29312f",
        edge: "#6c7a70"
      },
      thermalBasalt: {
        label: "Thermal basalt",
        hardness: 4,
        energyCost: 12,
        hullRisk: 3,
        heat: 7,
        color: "#332321",
        edge: "#8e5146"
      },
      machineRib: {
        label: "Machine rib",
        hardness: 5,
        energyCost: 14,
        hullRisk: 4,
        heat: 5,
        color: "#1d2d2e",
        edge: "#5e7f82"
      },
      coreRind: {
        label: "Core rind",
        hardness: 6,
        energyCost: 17,
        hullRisk: 5,
        heat: 8,
        color: "#281f2d",
        edge: "#7f6aa5"
      },
      choirSlate: {
        label: "Choir slate",
        hardness: 7,
        energyCost: 20,
        hullRisk: 6,
        heat: 9,
        color: "#172325",
        edge: "#4aa897"
      },
      anchorRib: {
        label: "Anchor rib",
        hardness: 8,
        energyCost: 23,
        hullRisk: 7,
        heat: 11,
        color: "#1f1d19",
        edge: "#9b8f67"
      }
    },
    oreTypes: {
      copperSeed: {
        label: "Copper seed",
        value: 12,
        weight: 1,
        color: "#d59a53",
        minDepth: 1,
        refine: { alloy: 1 }
      },
      saltglass: {
        label: "Saltglass",
        value: 18,
        weight: 1,
        color: "#b9d9ce",
        minDepth: 8,
        refine: { alloy: 1, research: 1 }
      },
      cobaltThread: {
        label: "Cobalt thread",
        value: 31,
        weight: 2,
        color: "#709ccc",
        minDepth: 18,
        refine: { alloy: 2, research: 1 }
      },
      nickelBloom: {
        label: "Nickel bloom",
        value: 38,
        weight: 2,
        color: "#9ea77b",
        minDepth: 26,
        refine: { alloy: 3 }
      },
      emberFossil: {
        label: "Ember fossil",
        value: 46,
        weight: 2,
        color: "#d56e57",
        minDepth: 32,
        refine: { alloy: 1, research: 3 }
      },
      vaporCrystal: {
        label: "Vapor crystal",
        value: 58,
        weight: 2,
        color: "#7dd7c8",
        minDepth: 44,
        refine: { research: 4 }
      },
      prismMarrow: {
        label: "Prism marrow",
        value: 70,
        weight: 3,
        color: "#c2a5e4",
        minDepth: 52,
        refine: { alloy: 2, research: 5 }
      },
      archiveShard: {
        label: "Archive shard",
        value: 86,
        weight: 3,
        color: "#d7d0a8",
        minDepth: 70,
        refine: { research: 5, relic: 1 },
        archive: { set: "deepLedger", fragments: 1 }
      },
      coreMote: {
        label: "Core mote",
        value: 118,
        weight: 4,
        color: "#e2b66f",
        minDepth: 90,
        refine: { alloy: 3, research: 4, relic: 2 },
        archive: { set: "deepLedger", fragments: 2 }
      },
      echoPearl: {
        label: "Echo pearl",
        value: 142,
        weight: 3,
        color: "#a7dfd1",
        minDepth: 112,
        refine: { research: 6, relic: 2 },
        archive: { set: "voidChoir", fragments: 1 }
      },
      relayCore: {
        label: "Relay core",
        value: 168,
        weight: 5,
        color: "#d3c17a",
        minDepth: 120,
        refine: { alloy: 4, research: 5, relic: 3 },
        archive: { set: "voidChoir", fragments: 2 }
      }
    },
    contracts: [
      {
        id: "siltSurvey",
        label: "Silt survey commission",
        summary: "Reach 96 m in a run to map the upper seam.",
        kind: "depth",
        target: 96,
        unit: "m",
        reward: {
          resources: { research: 2 },
          archiveFragments: { surfaceRelay: 1 }
        }
      },
      {
        id: "saltglassAssay",
        label: "Saltglass assay order",
        summary: "Load 2 Saltglass samples for the assay desk.",
        kind: "ore",
        ore: "saltglass",
        target: 2,
        unit: "samples",
        reward: {
          resources: { credits: 45, research: 1 }
        }
      },
      {
        id: "deepLedgerRecovery",
        label: "Deep ledger recovery",
        summary: "Refine 1 archive fragment from a shard or core mote.",
        kind: "archive",
        archiveSet: "deepLedger",
        target: 1,
        unit: "fragment",
        reward: {
          resources: { alloy: 2, research: 2 }
        }
      }
    ],
    deepCharters: [
      {
        id: "siltLineCharter",
        label: "Silt line charter",
        summary: "Run the upper seam under sealed reserve cells.",
        objective: {
          kind: "depth",
          label: "Touch 80 m before recall.",
          target: 80,
          unit: "m"
        },
        constraint: {
          label: "Reserve seal",
          summary: "Launch energy is reduced and climbing draws extra charge.",
          effects: { maxEnergy: -12, returnEnergyPenalty: 0.12 }
        },
        reward: {
          summary: "Surface relay gains a brighter scan route.",
          resources: { research: 1 },
          archiveFragments: { surfaceRelay: 1 },
          relayEffects: { scanRange: 1, anchorCharges: 1 }
        }
      },
      {
        id: "thermalTraceCharter",
        label: "Thermal trace charter",
        summary: "Carry a heat recorder through the sealed shelf.",
        objective: {
          kind: "depth",
          label: "Reach 128 m while the recorder is armed.",
          target: 128,
          unit: "m"
        },
        constraint: {
          label: "Recorder drag",
          summary: "Every drilled block runs hotter until the charter is filed.",
          effects: { charterDrillHeat: 2, thermalShielding: -1 }
        },
        reward: {
          summary: "Survey relay stages stronger coolant for future launches.",
          resources: { research: 2 },
          relayEffects: { coolantCharges: 1, utilityCooling: 6 }
        }
      },
      {
        id: "ledgerTitheCharter",
        label: "Ledger tithe charter",
        summary: "Reserve hold space for machine-era catalog plates.",
        objective: {
          kind: "ore",
          ore: "saltglass",
          label: "Load 2 Saltglass samples for catalog routing.",
          target: 2,
          unit: "samples"
        },
        constraint: {
          label: "Catalog crate",
          summary: "Cargo space is tighter and movement costs rise.",
          effects: { cargoCapacity: -3, moveEnergy: 0.08 }
        },
        reward: {
          summary: "Deep ledger archive and route beacons improve future returns.",
          resources: { alloy: 1, research: 1 },
          archiveFragments: { deepLedger: 1 },
          relayEffects: { beaconCharges: 1, beaconReturnEfficiency: 0.08 }
        }
      }
    ],
    routePlans: [
      {
        id: "standardLine",
        label: "Standard line",
        summary: "Balanced descent with no extra charter pressure.",
        objective: {
          kind: "depth",
          label: "Chart a stable line to 96 m.",
          target: 96,
          unit: "m"
        },
        reward: {
          resources: { credits: 28 }
        },
        effects: {}
      },
      {
        id: "thermalSpiral",
        label: "Thermal spiral",
        summary: "A hotter late route that widens scan returns and assay value.",
        requires: { charters: 1 },
        objective: {
          kind: "depth",
          label: "Ride the spiral to 120 m.",
          target: 120,
          unit: "m"
        },
        reward: {
          resources: { research: 2 },
          archiveFragments: { deepLedger: 1 }
        },
        effects: { scanRange: 1, charterDrillHeat: 1, valueMultiplier: 0.08 }
      },
      {
        id: "ledgerSpur",
        label: "Ledger spur",
        summary: "A charter-only branch toward the choir trench and relay cores.",
        requiresCharter: "ledgerTitheCharter",
        objective: {
          kind: "ore",
          ore: "relayCore",
          label: "Extract 1 Relay core from the trench.",
          target: 1,
          unit: "core"
        },
        reward: {
          resources: { alloy: 2, research: 2 },
          archiveFragments: { voidChoir: 1 }
        },
        effects: { beaconCharges: 1, returnEnergyPenalty: 0.08, valueMultiplier: 0.12 }
      }
    ],
    archiveSets: [
      {
        id: "surfaceRelay",
        label: "Surface relay sigil",
        summary: "Commissioned survey marks align the winch path.",
        fragmentsRequired: 1,
        unlock: {
          label: "Wayfinder pulse",
          summary: "Future movement costs slightly less energy.",
          effects: { moveEnergy: -0.06, archiveSignal: 1 }
        }
      },
      {
        id: "deepLedger",
        label: "Deep ledger tablets",
        summary: "Recovered machine-era fragments stabilize deep routing.",
        fragmentsRequired: 3,
        unlock: {
          label: "Ledger routing",
          summary: "Future runs gain heat shielding and stronger assay value.",
          effects: { thermalShielding: 1, valueMultiplier: 0.05, archiveSignal: 1 }
        }
      },
      {
        id: "voidChoir",
        label: "Void choir anchors",
        summary: "Late-run echo plates let the relay pull rigs out of the trench.",
        fragmentsRequired: 2,
        unlock: {
          label: "Anchor recall",
          summary: "Future runs gain an extra charter recall charge for deep extraction.",
          effects: { anchorCharges: 1, beaconReturnEfficiency: 0.06, archiveSignal: 1 }
        }
      }
    ],
    reputationTracks: [
      {
        id: "surveyRelay",
        label: "Survey relay",
        summary: "Filed contracts and archive sets expand non-cash field support.",
        ranks: [
          {
            id: "candidate",
            label: "Candidate",
            requires: { contracts: 0, archiveSets: 0 },
            summary: "Basic sweep scan available.",
            effects: { scanRange: 3 }
          },
          {
            id: "filedRoute",
            label: "Filed route",
            requires: { contracts: 1, archiveSets: 0 },
            summary: "One route beacon is supplied each run after a filed commission.",
            effects: { scanRange: 1, beaconCharges: 1, beaconReturnEfficiency: 0.35 },
            unlocks: ["routeBeacon"]
          },
          {
            id: "sigilRelay",
            label: "Sigil relay",
            requires: { contracts: 1, archiveSets: 1 },
            summary: "Archive calibration adds one coolant burst per run.",
            effects: { scanRange: 1, coolantCharges: 1, utilityCooling: 16 },
            unlocks: ["coolantBurst"]
          }
        ]
      }
    ],
    utilities: [
      {
        id: "sweepScan",
        kind: "scanner",
        label: "Sweep scan",
        actionLabel: "scan",
        summary: "Ping nearest ore and hazard within scanner range.",
        energyCost: 4,
        heat: 2
      },
      {
        id: "routeBeacon",
        kind: "navigation",
        label: "Drop beacon",
        actionLabel: "mark",
        summary: "Mark a return lane; climbing near it spends less energy.",
        requiresRank: "filedRoute",
        chargesStat: "beaconCharges"
      },
      {
        id: "coolantBurst",
        kind: "utility",
        label: "Coolant burst",
        actionLabel: "cool",
        summary: "Spend archive coolant to dump heat before pressure gets lethal.",
        requiresRank: "sigilRelay",
        chargesStat: "coolantCharges",
        heatReduction: 18
      },
      {
        id: "anchorRecall",
        kind: "extraction",
        label: "Anchor recall",
        actionLabel: "recall",
        summary: "Spend a charter anchor to pull the rig home with its cargo.",
        chargesStat: "anchorCharges"
      }
    ],
    hazardTypes: {
      gasVent: {
        label: "Gas vent",
        minDepth: 16,
        color: "#84a97c",
        heat: 3,
        hullDamage: 4,
        energyDamage: 0,
        message: "Gas vent scoured the casing."
      },
      heatFissure: {
        label: "Heat fissure",
        minDepth: 35,
        color: "#d76f5f",
        heat: 14,
        hullDamage: 2,
        energyDamage: 0,
        message: "Heat fissure spiked the core temperature."
      },
      pressureFault: {
        label: "Pressure fault",
        minDepth: 54,
        color: "#83a8c6",
        heat: 6,
        hullDamage: 9,
        energyDamage: 2,
        message: "Pressure fault hammered the hull."
      },
      magneticBloom: {
        label: "Magnetic bloom",
        minDepth: 72,
        color: "#c2a5e4",
        heat: 4,
        hullDamage: 3,
        energyDamage: 8,
        message: "Magnetic bloom bled charge from the cells."
      },
      gravityShear: {
        label: "Gravity shear",
        minDepth: 112,
        color: "#d3c17a",
        heat: 7,
        hullDamage: 12,
        energyDamage: 6,
        message: "Gravity shear twisted the anchor line."
      }
    },
    upgradeCategories: {
      drill: "Drill",
      hull: "Hull",
      energy: "Energy",
      cargo: "Cargo",
      scanner: "Scanner",
      refinery: "Refinery",
      survival: "Survival",
      mobility: "Mobility"
    },
    upgrades: [
      {
        id: "drillTorque",
        category: "drill",
        label: "Torque coupling",
        summary: "cut cost -2",
        iconSlot: 0,
        rigModule: "drill",
        cost: { credits: 120, alloy: 4 },
        effects: { drillCostReduction: 2, drillPower: 0.4 }
      },
      {
        id: "hullLattice",
        category: "hull",
        label: "Lattice plating",
        summary: "hull +30",
        iconSlot: 3,
        rigModule: "plating",
        cost: { credits: 110, alloy: 5 },
        effects: { maxHull: 30, hullRiskReduction: 1 }
      },
      {
        id: "reserveCells",
        category: "energy",
        label: "Reserve cells",
        summary: "energy +24",
        iconSlot: 6,
        rigModule: "cells",
        cost: { credits: 95, alloy: 2 },
        effects: { maxEnergy: 24 }
      },
      {
        id: "cargoFrame",
        category: "cargo",
        label: "Ribbed hold",
        summary: "cargo +6",
        iconSlot: 1,
        rigModule: "cargo",
        cost: { credits: 105, alloy: 3 },
        effects: { cargoCapacity: 6 }
      },
      {
        id: "assayLens",
        category: "scanner",
        label: "Assay lens",
        summary: "sale value +15%",
        iconSlot: 2,
        rigModule: "scanner",
        cost: { credits: 80, research: 2 },
        effects: { valueMultiplier: 0.15 }
      },
      {
        id: "refineryBaffles",
        category: "refinery",
        label: "Fine baffles",
        summary: "refine yield +1",
        iconSlot: 4,
        rigModule: "refinery",
        cost: { credits: 90, alloy: 3, research: 1 },
        effects: { refineryBonus: 1 }
      },
      {
        id: "coolantVeins",
        category: "survival",
        label: "Coolant veins",
        summary: "heat +24 / cooling +2",
        iconSlot: 6,
        rigModule: "coolant",
        cost: { credits: 135, alloy: 4, research: 2 },
        effects: { maxHeat: 24, coolingRate: 2 }
      },
      {
        id: "pressureSkids",
        category: "mobility",
        label: "Pressure skids",
        summary: "move cost -0.18",
        iconSlot: 5,
        rigModule: "skids",
        cost: { credits: 150, alloy: 6 },
        effects: { moveEnergy: -0.18 }
      },
      {
        id: "hazardSheath",
        category: "survival",
        label: "Hazard sheath",
        summary: "hazard damage -1",
        iconSlot: 3,
        rigModule: "sheath",
        cost: { credits: 170, alloy: 5, research: 4 },
        effects: { hazardMitigation: 1, thermalShielding: 1 }
      },
      {
        id: "relicClamp",
        category: "cargo",
        label: "Relic clamp",
        summary: "cargo +4 / sale +10%",
        iconSlot: 7,
        rigModule: "archive",
        cost: { credits: 120, relic: 1 },
        effects: { cargoCapacity: 4, valueMultiplier: 0.1 }
      }
    ],
    researchProjects: [
      {
        id: "thermalCartography",
        label: "Thermal cartography",
        summary: "heat shield +2",
        iconSlot: 6,
        rigModule: "thermal",
        cost: { research: 5 },
        effects: { thermalShielding: 2 }
      },
      {
        id: "faultPatterning",
        label: "Fault patterning",
        summary: "pressure risk -1",
        iconSlot: 3,
        rigModule: "plating",
        cost: { research: 8, relic: 1 },
        effects: { pressureMitigation: 1, hullRiskReduction: 1 }
      },
      {
        id: "ventChemistry",
        label: "Vent chemistry",
        summary: "hazard damage -2",
        iconSlot: 3,
        rigModule: "sheath",
        cost: { research: 11 },
        effects: { hazardMitigation: 2 }
      },
      {
        id: "resonantLift",
        label: "Resonant lift",
        summary: "move cost -0.12 / cooling +1",
        iconSlot: 5,
        rigModule: "lift",
        cost: { research: 10, relic: 2 },
        effects: { moveEnergy: -0.12, coolingRate: 1 }
      }
    ],
    depthBands: [
      {
        name: "upper silt",
        from: 1,
        to: 15,
        terrain: [["loam", 7], ["gritstone", 2], ["ironClay", 1]],
        ores: [["copperSeed", 0.13], ["saltglass", 0.05]],
        hazards: []
      },
      {
        name: "lampblack seam",
        from: 16,
        to: 34,
        terrain: [["gritstone", 3], ["ironClay", 3], ["basaltLock", 1], ["shaleFault", 1]],
        ores: [["copperSeed", 0.06], ["saltglass", 0.08], ["cobaltThread", 0.08], ["nickelBloom", 0.04]],
        hazards: [["gasVent", 0.05]]
      },
      {
        name: "sealed shelf",
        from: 35,
        to: 56,
        terrain: [["ironClay", 2], ["basaltLock", 3], ["pressureGlass", 2], ["thermalBasalt", 1]],
        ores: [["cobaltThread", 0.08], ["emberFossil", 0.08], ["vaporCrystal", 0.06]],
        hazards: [["gasVent", 0.03], ["heatFissure", 0.06]]
      },
      {
        name: "coreward drift",
        from: 57,
        to: 82,
        terrain: [["basaltLock", 3], ["pressureGlass", 3], ["thermalBasalt", 2], ["machineRib", 1]],
        ores: [["emberFossil", 0.07], ["prismMarrow", 0.06], ["archiveShard", 0.04]],
        hazards: [["heatFissure", 0.05], ["pressureFault", 0.05], ["magneticBloom", 0.02]]
      },
      {
        name: "black core margin",
        from: 83,
        to: 110,
        terrain: [["pressureGlass", 2], ["machineRib", 3], ["coreRind", 3], ["thermalBasalt", 1]],
        ores: [["prismMarrow", 0.06], ["archiveShard", 0.05], ["coreMote", 0.04]],
        hazards: [["pressureFault", 0.07], ["magneticBloom", 0.05], ["heatFissure", 0.04]]
      },
      {
        name: "choir trench",
        from: 111,
        to: 138,
        terrain: [["machineRib", 2], ["coreRind", 2], ["choirSlate", 3], ["anchorRib", 2]],
        ores: [["archiveShard", 0.04], ["coreMote", 0.05], ["echoPearl", 0.05], ["relayCore", 0.035]],
        hazards: [["pressureFault", 0.06], ["magneticBloom", 0.04], ["gravityShear", 0.06]]
      }
    ]
  };
})();

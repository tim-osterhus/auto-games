(function () {
  "use strict";

  window.COREBOUND_DATA = {
    world: {
      width: 43,
      depth: 110,
      metersPerTile: 8,
      seed: 73129
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
      utilityCooling: 0
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
    terrainTypes: {
      loam: {
        label: "Loam plate",
        hardness: 1,
        energyCost: 3,
        hullRisk: 0,
        heat: 1,
        color: "#2b2f2b",
        edge: "#3c463d"
      },
      gritstone: {
        label: "Gritstone",
        hardness: 2,
        energyCost: 5,
        hullRisk: 1,
        heat: 2,
        color: "#343536",
        edge: "#505052"
      },
      ironClay: {
        label: "Iron clay",
        hardness: 2,
        energyCost: 6,
        hullRisk: 1,
        heat: 2,
        color: "#3a312d",
        edge: "#6b5044"
      },
      basaltLock: {
        label: "Basalt lock",
        hardness: 3,
        energyCost: 8,
        hullRisk: 2,
        heat: 3,
        color: "#252a2e",
        edge: "#48525a"
      },
      pressureGlass: {
        label: "Pressure glass",
        hardness: 4,
        energyCost: 11,
        hullRisk: 3,
        heat: 4,
        color: "#202a31",
        edge: "#5f7883"
      },
      shaleFault: {
        label: "Shale fault",
        hardness: 3,
        energyCost: 9,
        hullRisk: 3,
        heat: 3,
        color: "#282d2b",
        edge: "#6c7a70"
      },
      thermalBasalt: {
        label: "Thermal basalt",
        hardness: 4,
        energyCost: 12,
        hullRisk: 3,
        heat: 7,
        color: "#2d2424",
        edge: "#8e5146"
      },
      machineRib: {
        label: "Machine rib",
        hardness: 5,
        energyCost: 14,
        hullRisk: 4,
        heat: 5,
        color: "#1f2829",
        edge: "#5e7f82"
      },
      coreRind: {
        label: "Core rind",
        hardness: 6,
        energyCost: 17,
        hullRisk: 5,
        heat: 8,
        color: "#231f25",
        edge: "#7f6aa5"
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
        cost: { credits: 120, alloy: 4 },
        effects: { drillCostReduction: 2 }
      },
      {
        id: "hullLattice",
        category: "hull",
        label: "Lattice plating",
        summary: "hull +30",
        cost: { credits: 110, alloy: 5 },
        effects: { maxHull: 30, hullRiskReduction: 1 }
      },
      {
        id: "reserveCells",
        category: "energy",
        label: "Reserve cells",
        summary: "energy +24",
        cost: { credits: 95, alloy: 2 },
        effects: { maxEnergy: 24 }
      },
      {
        id: "cargoFrame",
        category: "cargo",
        label: "Ribbed hold",
        summary: "cargo +6",
        cost: { credits: 105, alloy: 3 },
        effects: { cargoCapacity: 6 }
      },
      {
        id: "assayLens",
        category: "scanner",
        label: "Assay lens",
        summary: "sale value +15%",
        cost: { credits: 80, research: 2 },
        effects: { valueMultiplier: 0.15 }
      },
      {
        id: "refineryBaffles",
        category: "refinery",
        label: "Fine baffles",
        summary: "refine yield +1",
        cost: { credits: 90, alloy: 3, research: 1 },
        effects: { refineryBonus: 1 }
      },
      {
        id: "coolantVeins",
        category: "survival",
        label: "Coolant veins",
        summary: "heat +24 / cooling +2",
        cost: { credits: 135, alloy: 4, research: 2 },
        effects: { maxHeat: 24, coolingRate: 2 }
      },
      {
        id: "pressureSkids",
        category: "mobility",
        label: "Pressure skids",
        summary: "move cost -0.18",
        cost: { credits: 150, alloy: 6 },
        effects: { moveEnergy: -0.18 }
      },
      {
        id: "hazardSheath",
        category: "survival",
        label: "Hazard sheath",
        summary: "hazard damage -1",
        cost: { credits: 170, alloy: 5, research: 4 },
        effects: { hazardMitigation: 1, thermalShielding: 1 }
      },
      {
        id: "relicClamp",
        category: "cargo",
        label: "Relic clamp",
        summary: "cargo +4 / sale +10%",
        cost: { credits: 120, relic: 1 },
        effects: { cargoCapacity: 4, valueMultiplier: 0.1 }
      }
    ],
    researchProjects: [
      {
        id: "thermalCartography",
        label: "Thermal cartography",
        summary: "heat shield +2",
        cost: { research: 5 },
        effects: { thermalShielding: 2 }
      },
      {
        id: "faultPatterning",
        label: "Fault patterning",
        summary: "pressure risk -1",
        cost: { research: 8, relic: 1 },
        effects: { pressureMitigation: 1, hullRiskReduction: 1 }
      },
      {
        id: "ventChemistry",
        label: "Vent chemistry",
        summary: "hazard damage -2",
        cost: { research: 11 },
        effects: { hazardMitigation: 2 }
      },
      {
        id: "resonantLift",
        label: "Resonant lift",
        summary: "move cost -0.12 / cooling +1",
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
      }
    ]
  };
})();

"use strict";

const DarkFactoryDispatch = (() => {
  const RESOURCE_ORDER = [
    "scrap",
    "circuits",
    "modules",
    "drones",
    "defenses",
    "reputation",
    "power",
    "stability",
  ];

  const ASSET_PATHS = {
    sourceManifest: "assets/asset-manifest.json",
    titleCard: "assets/arcade-title-card.png",
    lanes: {
      "forge-line": "assets/lane-forge-line.png",
      "assembler-bay": "assets/lane-assembler-bay.png",
      "clean-room": "assets/lane-clean-room.png",
    },
    jobs: {
      "smelt-circuits": "assets/job-smelt-circuits.png",
      "print-modules": "assets/job-print-modules.png",
      "assemble-drones": "assets/job-assemble-drones.png",
      "weave-defenses": "assets/job-weave-defenses.png",
    },
    faults: {
      "material-jam": "assets/fault-material-jam.png",
      "logic-drift": "assets/fault-logic-drift.png",
    },
  };
  const PROCEDURAL_FEEDBACK_ASSETS = {
    floorBoard: "css:factory-floor-board",
    resourceIcons: "css:resource-signal-glyphs",
    outputDelivery: "css:output-delivery-token",
    shortageMarker: "css:shortage-marker",
    overdriveGlow: "css:overdrive-heat-glow",
    jamSparks: "css:jam-sparks",
    recoverySweep: "css:recovery-diagnostic-sweep",
    sabotageMarker: "css:sabotage-incident-marker",
    shiftSummaryHeader: "css:shift-summary-header",
    upgradeFamilies: "css:upgrade-family-icons",
  };
  ASSET_PATHS.procedural = PROCEDURAL_FEEDBACK_ASSETS;

  const RESOURCE_VISUAL_TOKENS = {
    scrap: { icon: "scrap-stack", lowAt: 3 },
    circuits: { icon: "circuit-trace", lowAt: 1 },
    modules: { icon: "module-block", lowAt: 1 },
    drones: { icon: "drone-pair", lowAt: 1 },
    defenses: { icon: "defense-weave", lowAt: 1 },
    reputation: { icon: "signal-seal", lowAt: 0 },
    power: { icon: "power-bus", lowAt: 3 },
    stability: { icon: "stability-core", lowAt: 45 },
  };

  const UPGRADE_VISUAL_FAMILIES = {
    "lane-overclock": "overdrive",
    "fault-guards": "recovery",
    "buffer-cache": "stockpile",
  };

  const GAME_DATA = {
    latestRelease: {
      version: "0.7.0",
      label: "v0.7.0 Factory Floor Repair",
      summary: "Guided Training Shift, dominant three-lane factory floor, click-first lane/job actions, visible production feedback, shift summary, local assets, and progressive advanced-system disclosure.",
    },
    assets: ASSET_PATHS,
    resources: {
      scrap: { label: "Scrap", initial: 28 },
      circuits: { label: "Circuits", initial: 3 },
      modules: { label: "Modules", initial: 1 },
      drones: { label: "Drones", initial: 0 },
      defenses: { label: "Defenses", initial: 0 },
      reputation: { label: "Reputation", initial: 0 },
      power: { label: "Power", initial: 12 },
      stability: { label: "Stability", initial: 100 },
    },
    lanes: [
      {
        id: "forge-line",
        name: "Forge Line",
        trait: "high heat",
        throughput: 1.2,
        jamRisk: 0.08,
        restartState: { clearsTo: "idle", powerCost: 1 },
      },
      {
        id: "assembler-bay",
        name: "Assembler Bay",
        trait: "balanced",
        throughput: 1,
        jamRisk: 0.05,
        restartState: { clearsTo: "assigned", powerCost: 1 },
      },
      {
        id: "clean-room",
        name: "Clean Room",
        trait: "low fault",
        throughput: 0.8,
        jamRisk: 0.03,
        restartState: { clearsTo: "idle", powerCost: 2 },
      },
    ],
    jobTypes: [
      {
        id: "smelt-circuits",
        name: "Smelt Circuits",
        duration: 3,
        inputs: { scrap: 4, power: 1 },
        outputs: { circuits: 3, stability: -1 },
      },
      {
        id: "print-modules",
        name: "Print Modules",
        duration: 4,
        inputs: { scrap: 3, circuits: 2, power: 2 },
        outputs: { modules: 2 },
      },
      {
        id: "assemble-drones",
        name: "Assemble Drones",
        duration: 5,
        inputs: { circuits: 2, modules: 1, power: 2 },
        outputs: { drones: 2 },
      },
      {
        id: "weave-defenses",
        name: "Weave Defenses",
        duration: 6,
        inputs: { modules: 2, drones: 1, power: 3 },
        outputs: { defenses: 2, reputation: 1 },
      },
      {
        id: "stabilize-grid",
        name: "Stabilize Grid",
        duration: 4,
        inputs: { circuits: 1, power: 2 },
        outputs: { stability: 6 },
        family: "emergency",
      },
      {
        id: "patch-audit-relay",
        name: "Patch Audit Relay",
        duration: 3,
        inputs: { circuits: 1, power: 1 },
        outputs: { stability: 3 },
        family: "grid",
      },
      {
        id: "compile-countermeasures",
        name: "Compile Countermeasures",
        duration: 4,
        inputs: { circuits: 1, modules: 1, power: 2 },
        outputs: { defenses: 1, stability: 2 },
        family: "breach",
        breachCountermeasure: true,
      },
      {
        id: "inspect-cargo-seals",
        name: "Inspect Cargo Seals",
        duration: 3,
        inputs: { circuits: 1, power: 1 },
        outputs: { stability: 2 },
        family: "freight",
        freightInspection: true,
      },
      {
        id: "sweep-sabotage-cells",
        name: "Sweep Sabotage Cells",
        duration: 4,
        inputs: { circuits: 1, power: 2 },
        outputs: { stability: 2 },
        family: "sabotage",
        sabotageSweep: true,
      },
    ],
    contracts: [
      {
        id: "perimeter-grid",
        name: "Perimeter Grid",
        family: "defense",
        requirement: { defenses: 2, drones: 2 },
        escalationRequirement: { defenses: 1 },
        reward: { reputation: 2, scrap: 5 },
        penalty: { stability: -14, reputation: -1 },
        deadline: 20,
        pressure: "deliver drones and defenses before the yard blackout",
        status: "active",
      },
      {
        id: "relay-refit",
        name: "Relay Refit",
        family: "relay",
        requirement: { modules: 4, circuits: 4 },
        escalationRequirement: { modules: 1 },
        reward: { reputation: 1, power: 2 },
        penalty: { stability: -10, scrap: -3 },
        deadline: 16,
        pressure: "refit the relay before the next dispatch window",
        status: "open",
      },
      {
        id: "signal-firewall",
        name: "Signal Firewall",
        family: "breach",
        requirement: { defenses: 1, reputation: 1 },
        escalationRequirement: { defenses: 1 },
        reward: { reputation: 2, stability: 4 },
        penalty: { stability: -12, power: -1 },
        deadline: 18,
        pressure: "seal the hostile dispatch carrier before queue work is rewritten",
        status: "open",
      },
      {
        id: "hostile-rail-directive",
        name: "Hostile Rail Directive",
        family: "sabotage",
        requirement: { drones: 2, defenses: 1 },
        escalationRequirement: { drones: 1 },
        reward: { reputation: 2, stability: 4 },
        penalty: { stability: -12, power: -1 },
        deadline: 18,
        pressure: "contain rail sabotage cells before cargo manifests are rewritten",
        status: "open",
      },
    ],
    emergencyContracts: [
      {
        id: "coolant-diversion",
        name: "Coolant Diversion",
        family: "emergency",
        requirement: { stability: 6 },
        reward: { reputation: 1, stability: 4 },
        penalty: { stability: -18, power: -2 },
        deadline: 7,
        pressure: "stabilize the coolant bus before the escalation alarm burns through reserves",
        jobTypeId: "stabilize-grid",
      },
    ],
    faultTypes: [
      {
        id: "material-jam",
        name: "Material Jam",
        recovery: { scrap: 1, power: 1 },
        recoveryTicks: 2,
        penalty: { stability: -2 },
        decision: "purge the feed chute",
      },
      {
        id: "logic-drift",
        name: "Logic Drift",
        recovery: { circuits: 1 },
        recoveryTicks: 3,
        penalty: { stability: -1 },
        decision: "reseed lane logic",
      },
    ],
    upgrades: [
      {
        id: "lane-overclock",
        name: "Lane Overclock",
        cost: { reputation: 1, circuits: 2 },
        description: "All lanes gain throughput for later dispatches.",
        effect: { throughputBonus: 0.2 },
      },
      {
        id: "fault-guards",
        name: "Fault Guards",
        cost: { reputation: 1, modules: 1 },
        description: "Lane jam risk drops and recovery is less punishing.",
        effect: { jamResistance: 0.03, recoveryTicksBonus: -1 },
      },
      {
        id: "buffer-cache",
        name: "Buffer Cache",
        cost: { scrap: 6, circuits: 1 },
        description: "Future shifts start with deeper scrap and power buffers.",
        effect: { startResources: { scrap: 8, power: 2 } },
      },
    ],
    initialQueue: [
      { jobTypeId: "smelt-circuits", priority: 1 },
      { jobTypeId: "print-modules", priority: 2 },
      { jobTypeId: "assemble-drones", priority: 3 },
    ],
    grid: {
      sectors: [
        {
          id: "forge-bus",
          name: "Forge Bus",
          laneId: "forge-line",
          connectedTo: ["assembly-bus"],
          baseLoad: 2,
          priority: { powerCost: 1, throughputBonus: 0.2, pressureRelief: 1 },
          isolate: { stabilityCost: 2, pressureRelief: 3 },
        },
        {
          id: "assembly-bus",
          name: "Assembly Bus",
          laneId: "assembler-bay",
          connectedTo: ["forge-bus", "clean-bus"],
          baseLoad: 2,
          priority: { powerCost: 1, throughputBonus: 0.2, pressureRelief: 1 },
          isolate: { stabilityCost: 2, pressureRelief: 3 },
        },
        {
          id: "clean-bus",
          name: "Clean Bus",
          laneId: "clean-room",
          connectedTo: ["assembly-bus"],
          baseLoad: 1,
          priority: { powerCost: 1, throughputBonus: 0.2, pressureRelief: 1 },
          isolate: { stabilityCost: 2, pressureRelief: 2 },
        },
      ],
      blackout: {
        threshold: 10,
        lockoutTicks: 3,
        stabilityPenalty: 8,
        powerPenalty: 1,
        pressureRelief: 5,
      },
      reserve: {
        capacity: 3,
        drawAmount: 3,
        pressureRelief: 4,
        stabilityCost: 5,
      },
      auditDirectives: [
        {
          id: "reserve-ledger-audit",
          name: "Reserve Ledger Audit",
          activationTick: 4,
          dueTicks: 6,
          jobTypeId: "patch-audit-relay",
          repairCost: { circuits: 1, power: 1 },
          reward: { reputation: 1, stability: 2 },
          penalty: { stability: -8 },
          deferCost: { stability: 3 },
          deferPressure: 2,
          extensionTicks: 3,
          failurePressure: 3,
        },
      ],
    },
    signalBreach: {
      threshold: 9,
      cleanse: {
        cost: { circuits: 1, power: 1 },
        reward: { stability: 1 },
        intensityRelief: 2,
        traceReliefTicks: 2,
      },
      quarantine: {
        stabilityCost: 3,
        intensityRelief: 1,
        gridPressureRelief: 2,
      },
      shield: {
        ticks: 4,
        intensityRelief: 1,
      },
      countermeasure: {
        intensityRelief: 3,
        traceReliefTicks: 2,
        reward: { reputation: 1 },
      },
      sources: [
        {
          id: "spoofed-dispatch-uplink",
          name: "Spoofed Dispatch Uplink",
          activationTick: 3,
          traceTicks: 6,
          intensity: 3,
          compromiseCount: 1,
          sectorId: "assembly-bus",
          severity: 2,
          gridPressure: 2,
          countermeasureJobTypeId: "compile-countermeasures",
          traceCost: { circuits: 1, drones: 1 },
          traceReward: { reputation: 1, stability: 3 },
          tracePenalty: { stability: -10, power: -1 },
          deferCost: { stability: 4 },
          deferTicks: 3,
          deferIntensity: 2,
          escapeScar: 3,
          jobCompletionPenalty: { stability: -4 },
        },
        {
          id: "audit-ghost-carrier",
          name: "Audit Ghost Carrier",
          activationTick: 5,
          traceTicks: 8,
          intensity: 4,
          compromiseCount: 2,
          sectorId: "clean-bus",
          severity: 2,
          gridPressure: 0,
          countermeasureJobTypeId: "compile-countermeasures",
          traceCost: { circuits: 2, drones: 1 },
          traceReward: { reputation: 1, stability: 4 },
          tracePenalty: { stability: -12, power: -2 },
          deferCost: { stability: 5 },
          deferTicks: 2,
          deferIntensity: 3,
          escapeScar: 4,
          jobCompletionPenalty: { stability: -5 },
        },
      ],
    },
    freightLockdown: {
      release: "v0.4.0 Freight Lockdown",
      integrity: {
        fullThreshold: 85,
        partialThreshold: 45,
      },
      hold: {
        extensionTicks: 3,
        integrityLoss: 6,
        riskIncrease: 1,
        cost: { stability: 2 },
      },
      routeSecurity: {
        drones: {
          cost: { drones: 1 },
          riskRelief: 2,
          integrityGuard: 10,
        },
        defenses: {
          cost: { defenses: 1 },
          riskRelief: 2,
          integrityGuard: 8,
          breachRelief: 1,
        },
        reserveClearance: {
          riskRelief: 1,
          integrityGuard: 8,
          gridPressureRelief: 1,
        },
        reroute: {
          cost: { power: 1, stability: 2 },
          riskRelief: 3,
          delayTicks: 1,
          integrityLoss: 2,
        },
      },
      manifests: [
        {
          id: "ashline-spare-crates",
          name: "Ashline Spare Crates",
          dockId: "dock-alpha",
          dockName: "Dock Alpha",
          laneId: "forge-line",
          sectorId: "forge-bus",
          contractId: "perimeter-grid",
          availableShift: 1,
          window: { opensAtTick: 2, closesAtTick: 16 },
          inspectionJobTypeId: "inspect-cargo-seals",
          cargo: { circuits: 3, modules: 1 },
          routeRisk: 3,
          travelTicks: 2,
          payout: { reputation: 1, scrap: 6, stability: 3 },
          partialPayout: { scrap: 3, stability: 1 },
          penalty: { stability: -7, reputation: -1 },
        },
        {
          id: "blackout-relay-carrier",
          name: "Blackout Relay Carrier",
          dockId: "dock-beta",
          dockName: "Dock Beta",
          laneId: "clean-room",
          sectorId: "clean-bus",
          contractId: "signal-firewall",
          availableShift: 2,
          window: { opensAtTick: 3, closesAtTick: 17 },
          inspectionJobTypeId: "inspect-cargo-seals",
          cargo: { modules: 2, drones: 2, defenses: 1 },
          routeRisk: 5,
          travelTicks: 3,
          payout: { reputation: 2, power: 2, stability: 5 },
          partialPayout: { reputation: 1, stability: 2 },
          penalty: { stability: -11, power: -1 },
        },
      ],
    },
    railSabotage: {
      release: "v0.5.0 Rail Sabotage",
      scan: {
        cost: { circuits: 1, power: 1 },
        pressureRelief: 2,
        integrityGuard: 6,
        riskRelief: 1,
      },
      patrols: {
        drones: {
          cost: { drones: 1 },
          pressureRelief: 2,
          integrityGuard: 8,
          riskRelief: 1,
        },
        defenses: {
          cost: { defenses: 1 },
          pressureRelief: 3,
          integrityGuard: 10,
          riskRelief: 2,
          breachRelief: 1,
        },
      },
      decoy: {
        cost: { scrap: 2, power: 1 },
        pressureRelief: 3,
        integrityGuard: 10,
        riskRelief: 2,
        delayTicks: 1,
      },
      dockLockdown: {
        cost: { stability: 2 },
        pressureRelief: 3,
        gridPressure: 1,
      },
      intercept: {
        cost: { drones: 1, defenses: 1 },
        pressureRelief: 4,
        integrityGuard: 8,
      },
      carrierReroute: {
        cost: { power: 1, stability: 1 },
        pressureRelief: 2,
        riskRelief: 2,
        delayTicks: 1,
        integrityLoss: 3,
      },
      laneRepair: {
        cost: { modules: 1, power: 2 },
        pressureRelief: 3,
      },
      sweep: {
        jobTypeId: "sweep-sabotage-cells",
      },
      incidents: [
        {
          id: "ashline-rail-spoof",
          name: "Ashline Rail Spoof Cell",
          dockId: "dock-alpha",
          dockName: "Dock Alpha",
          laneId: "forge-line",
          sectorId: "forge-bus",
          manifestId: "ashline-spare-crates",
          contractId: "perimeter-grid",
          availableShift: 1,
          window: { opensAtTick: 2, closesAtTick: 12 },
          suspectCargo: { circuits: 3, modules: 1 },
          routeTrigger: "forged ashline crate stamps",
          sabotagePressure: 4,
          requirements: { scans: 1, patrol: "drones" },
          containment: { requiredScore: 5, partialScore: 3 },
          mitigation: { reputation: 1, stability: 2 },
          partialPenalty: { stability: -3 },
          failurePenalty: { stability: -7, reputation: -1 },
          partialIntegrityDamage: 14,
          failureIntegrityDamage: 34,
          tamperValue: 3,
          gridPressure: 2,
          breachIntensity: 1,
          scarValue: 2,
        },
        {
          id: "blackout-yard-saboteurs",
          name: "Blackout Yard Saboteurs",
          dockId: "dock-beta",
          dockName: "Dock Beta",
          laneId: "clean-room",
          sectorId: "clean-bus",
          manifestId: "blackout-relay-carrier",
          contractId: "signal-firewall",
          availableShift: 2,
          window: { opensAtTick: 3, closesAtTick: 13 },
          suspectCargo: { modules: 2, drones: 2, defenses: 1 },
          routeTrigger: "signal breach carrier handoff",
          sabotagePressure: 6,
          requirements: { scans: 1, patrol: "defenses" },
          containment: { requiredScore: 6, partialScore: 4 },
          mitigation: { reputation: 2, stability: 3 },
          partialPenalty: { stability: -5 },
          failurePenalty: { stability: -10, power: -1 },
          partialIntegrityDamage: 20,
          failureIntegrityDamage: 42,
          tamperValue: 5,
          gridPressure: 3,
          breachIntensity: 2,
          scarValue: 3,
        },
      ],
    },
    crisisArbitration: {
      release: "v0.6.0 Crisis Arbitration",
      override: {
        cost: { reputation: 1 },
        extensionTicks: 3,
        rulingScore: 2,
        gridPressure: 1,
      },
      defer: {
        cost: { stability: 3 },
        extensionTicks: 2,
        pressure: 1,
      },
      laneProtection: {
        cost: { power: 1, defenses: 1 },
        guardScore: 2,
        gridPressure: 1,
      },
      evidenceSources: {
        queue: {
          name: "Queue Policy Ledger",
          cost: { circuits: 1 },
          score: 1,
        },
        lane: {
          name: "Lane Access Trace",
          cost: { power: 1 },
          score: 1,
        },
        grid: {
          name: "Grid Routing Brief",
          cost: { power: 1 },
          score: 2,
        },
        breach: {
          name: "Breach Signal Chain",
          cost: { circuits: 1 },
          score: 2,
        },
        freight: {
          name: "Freight Custody File",
          cost: { scrap: 2 },
          score: 2,
        },
        rail: {
          name: "Rail Sabotage Affidavit",
          cost: { drones: 1 },
          score: 2,
        },
      },
      rulings: {
        "grid-first": {
          name: "Grid First",
          priority: "grid",
          pressureRelief: 3,
          reward: { stability: 3 },
          partialPenalty: { stability: -2 },
          failurePenalty: { stability: -7, reputation: -1 },
        },
        "freight-first": {
          name: "Freight First",
          priority: "freight",
          integrityGuard: 10,
          riskRelief: 2,
          reward: { reputation: 1, stability: 2 },
          partialPenalty: { stability: -3 },
          failurePenalty: { stability: -8, reputation: -1 },
        },
        "breach-first": {
          name: "Breach First",
          priority: "breach",
          intensityRelief: 3,
          reward: { reputation: 1, stability: 3 },
          partialPenalty: { stability: -3 },
          failurePenalty: { stability: -9, power: -1 },
        },
        "rail-first": {
          name: "Rail First",
          priority: "rail",
          sabotageRelief: 3,
          reward: { reputation: 1, stability: 2 },
          partialPenalty: { stability: -4 },
          failurePenalty: { stability: -9, reputation: -1 },
        },
      },
      cases: [
        {
          id: "ashline-dock-priority",
          name: "Ashline Dock Priority Docket",
          availableShift: 1,
          window: { opensAtTick: 4, closesAtTick: 12 },
          rulingTicks: 5,
          linked: {
            laneId: "forge-line",
            sectorId: "forge-bus",
            breachSourceId: "spoofed-dispatch-uplink",
            manifestId: "ashline-spare-crates",
            railIncidentId: "ashline-rail-spoof",
            contractId: "perimeter-grid",
            dockId: "dock-alpha",
          },
          evidenceRequired: ["queue", "lane", "grid", "breach", "freight", "rail"],
          minimumEvidence: 4,
          bindingScore: 10,
          partialScore: 6,
          priorityOrder: ["grid-first", "freight-first", "rail-first", "breach-first"],
          reward: { reputation: 1, stability: 3 },
          partialPenalty: { stability: -3 },
          failurePenalty: { stability: -8, reputation: -1 },
          integrityDamage: 12,
          gridPressure: 2,
          breachIntensity: 1,
          sabotagePressure: 2,
          scarValue: 2,
        },
        {
          id: "blackout-yard-jurisdiction",
          name: "Blackout Yard Jurisdiction Docket",
          availableShift: 2,
          window: { opensAtTick: 4, closesAtTick: 11 },
          rulingTicks: 4,
          linked: {
            laneId: "clean-room",
            sectorId: "clean-bus",
            breachSourceId: "audit-ghost-carrier",
            manifestId: "blackout-relay-carrier",
            railIncidentId: "blackout-yard-saboteurs",
            contractId: "signal-firewall",
            dockId: "dock-beta",
          },
          evidenceRequired: ["queue", "lane", "grid", "breach", "freight", "rail"],
          minimumEvidence: 5,
          bindingScore: 11,
          partialScore: 7,
          priorityOrder: ["breach-first", "rail-first", "freight-first", "grid-first"],
          reward: { reputation: 2, power: 1, stability: 2 },
          partialPenalty: { stability: -4 },
          failurePenalty: { stability: -10, power: -1 },
          integrityDamage: 18,
          gridPressure: 3,
          breachIntensity: 2,
          sabotagePressure: 3,
          scarValue: 3,
        },
      ],
    },
    campaign: {
      release: "v0.4.0 Freight Lockdown",
      shifts: [
        {
          shift: 1,
          phase: "Dispatch Floor",
          demand: 1,
          deadlineDelta: 0,
          emergencyTick: null,
          emergencyContractId: null,
        },
        {
          shift: 2,
          phase: "Escalation Shift",
          demand: 2,
          deadlineDelta: -2,
          emergencyTick: 6,
          emergencyContractId: "coolant-diversion",
        },
        {
          shift: 3,
          phase: "Blackout Compression",
          demand: 3,
          deadlineDelta: -4,
          emergencyTick: 4,
          emergencyContractId: "coolant-diversion",
        },
      ],
      queuePolicies: [
        {
          id: "standard-release",
          name: "Standard Release",
          description: "Keep queued work available in operator order.",
        },
        {
          id: "emergency-first",
          name: "Emergency First",
          description: "Hold ordinary queued work while an emergency order is active.",
        },
      ],
      laneOverdrive: {
        powerCost: 2,
        stabilityCost: 4,
        throughputBonus: 0.6,
        jamRiskBonus: 0.07,
      },
    },
  };

  const TUTORIAL_STORAGE_KEY = "dark-factory-dispatch:tutorial-complete";
  const TRAINING_CONTRACT = {
    id: "training-circuits",
    name: "Training Shift",
    requirement: { circuits: 3 },
    reward: { reputation: 1 },
    deadline: 12,
    pressure: "make 3 circuits before the first dispatch bell",
  };
  const TUTORIAL_STEPS = [
    {
      id: "select-smelt-circuits",
      label: "Select Smelt Circuits",
      focus: { type: "job", jobTypeId: "smelt-circuits" },
      action: "select-job",
    },
    {
      id: "select-forge-line",
      label: "Select Forge Line",
      focus: { type: "lane", laneId: "forge-line" },
      action: "select-lane",
    },
    {
      id: "assign-forge-line",
      label: "Assign Forge Line",
      focus: { type: "context-action", actionId: "assign" },
      action: "assign",
    },
    {
      id: "start-forge-line",
      label: "Start Forge Line",
      focus: { type: "context-action", actionId: "start" },
      action: "start",
    },
    {
      id: "observe-output",
      label: "Watch Production",
      focus: { type: "lane", laneId: "forge-line" },
      action: "wait",
    },
    {
      id: "recover-material-jam",
      label: "Recover Jam",
      focus: { type: "context-action", actionId: "recover" },
      action: "recover",
    },
    {
      id: "wait-recovery",
      label: "Clear Recovery",
      focus: { type: "lane", laneId: "forge-line" },
      action: "wait",
    },
    {
      id: "restart-forge-line",
      label: "Restart Forge Line",
      focus: { type: "context-action", actionId: "start" },
      action: "start",
    },
    {
      id: "complete-training-contract",
      label: "Complete Training Contract",
      focus: { type: "contract", contractId: "training-circuits" },
      action: "wait",
    },
    {
      id: "shift-summary",
      label: "Shift Summary",
      focus: { type: "summary", summaryId: "training-shift" },
      action: "review",
    },
  ];

  const dom = {};
  let currentState = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function byId(items, id) {
    return items.find((item) => item.id === id);
  }

  function titleCase(value) {
    return String(value)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatBundle(bundle) {
    const keys = Object.keys(bundle || {});
    if (!keys.length) {
      return "none";
    }
    return keys.map((key) => `${key} ${bundle[key]}`).join(" / ");
  }

  function combineBundles(...bundles) {
    const combined = {};
    bundles.forEach((bundle) => {
      Object.entries(bundle || {}).forEach(([resource, amount]) => {
        combined[resource] = (combined[resource] || 0) + amount;
      });
    });
    return combined;
  }

  function iconMarkup(src, className = "asset-icon") {
    if (!src) {
      return "";
    }
    return `<img class="${className}" src="${src}" alt="" aria-hidden="true" loading="lazy" decoding="async" />`;
  }

  function roundTenth(value) {
    return Math.round(value * 10) / 10;
  }

  function storageAdapter(storage = null) {
    if (storage) {
      return storage;
    }
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }

  function readTutorialCompletion(storage = null) {
    const adapter = storageAdapter(storage);
    if (!adapter || typeof adapter.getItem !== "function") {
      return false;
    }
    try {
      return adapter.getItem(TUTORIAL_STORAGE_KEY) === "complete";
    } catch (_error) {
      return false;
    }
  }

  function writeTutorialCompletion(storage = null, completed = true) {
    const adapter = storageAdapter(storage);
    if (!adapter || typeof adapter.setItem !== "function") {
      return false;
    }
    try {
      if (!completed && typeof adapter.removeItem === "function") {
        adapter.removeItem(TUTORIAL_STORAGE_KEY);
      } else {
        adapter.setItem(TUTORIAL_STORAGE_KEY, completed ? "complete" : "incomplete");
      }
      return true;
    } catch (_error) {
      return false;
    }
  }

  function tutorialStepIndex(stepId) {
    return Math.max(0, TUTORIAL_STEPS.findIndex((step) => step.id === stepId));
  }

  function tutorialStep(stepId) {
    return clone(TUTORIAL_STEPS[tutorialStepIndex(stepId)] || TUTORIAL_STEPS[0]);
  }

  function createTrainingContract(completed = false) {
    return {
      id: TRAINING_CONTRACT.id,
      name: TRAINING_CONTRACT.name,
      family: "training",
      requirement: clone(TRAINING_CONTRACT.requirement),
      reward: clone(TRAINING_CONTRACT.reward),
      deadline: TRAINING_CONTRACT.deadline,
      timeRemaining: TRAINING_CONTRACT.deadline,
      pressure: TRAINING_CONTRACT.pressure,
      status: completed ? "complete" : "active",
      startedAtTick: 0,
      completedAtTick: completed ? 0 : null,
      failedAtTick: null,
      tutorial: true,
    };
  }

  function createTutorialState(options = {}, run = 1) {
    const enabled = options.tutorialEnabled !== false && options.tutorial !== false;
    const storedCompletion = readTutorialCompletion(options.storage);
    const completed = !enabled
      || options.tutorialCompleted === true
      || (!options.replayTutorial && storedCompletion)
      || run > 1;
    const stepId = completed ? "shift-summary" : "select-smelt-circuits";
    return {
      id: "training-shift",
      enabled,
      replayable: true,
      storageKey: TUTORIAL_STORAGE_KEY,
      completed,
      completionPersisted: storedCompletion,
      status: completed ? "complete" : "active",
      stepId,
      stepIndex: tutorialStepIndex(stepId),
      currentStep: tutorialStep(stepId),
      contract: createTrainingContract(completed),
      selectedJobId: null,
      selectedLaneId: null,
      forcedJam: {
        laneId: "forge-line",
        faultTypeId: "material-jam",
        armed: !completed,
        triggered: false,
        resolved: false,
      },
      events: [],
    };
  }

  function createSelectionState() {
    return {
      selectedJobId: null,
      selectedLaneId: null,
      selectedObjectType: null,
      lastAction: null,
    };
  }

  function createDisclosureState(state) {
    const tutorial = state.tutorial || createTutorialState({ tutorialCompleted: true }, state.restart ? state.restart.run : 1);
    const run = state.restart ? state.restart.run : 1;
    const guided = tutorial.enabled && !tutorial.completed && run === 1;
    const summaryOpen = tutorial.status === "summary";
    const laterShift = run > 1;
    const beginnerResourceIds = ["scrap", "power", "stability"];
    const systemVisible = laterShift || (!guided && !summaryOpen && tutorial.completed);
    const advancedGate = tutorial.completed ? "start next shift" : "complete Training Shift";
    return {
      mode: guided ? "first-shift-guided" : summaryOpen ? "between-shift" : "full-dispatch",
      beginnerVisible: guided,
      advancedUnlocked: tutorial.completed || laterShift,
      visibleResources: guided ? beginnerResourceIds : RESOURCE_ORDER.slice(),
      flags: {
        guidedFirstShift: guided,
        contextualActions: true,
        compactLog: guided,
        shiftSummary: summaryOpen,
        upgradeChoice: summaryOpen || !guided,
      },
      systems: {
        contracts: {
          visible: true,
          unlocked: true,
          mode: guided ? "training-only" : "full",
          gate: null,
        },
        upgrades: {
          visible: summaryOpen || !guided,
          unlocked: tutorial.completed || laterShift,
          mode: summaryOpen ? "choice" : "catalog",
          gate: tutorial.completed || laterShift ? null : "complete Training Shift",
        },
        jobCatalog: {
          visible: !guided,
          unlocked: !guided,
          gate: guided ? "finish the incoming Smelt Circuits card" : null,
        },
        gridSiege: {
          visible: systemVisible,
          unlocked: tutorial.completed || laterShift,
          gate: systemVisible ? null : advancedGate,
        },
        signalBreach: {
          visible: systemVisible,
          unlocked: tutorial.completed || laterShift,
          gate: systemVisible ? null : advancedGate,
        },
        freightLockdown: {
          visible: laterShift,
          unlocked: laterShift,
          gate: laterShift ? null : "shift 02",
        },
        railSabotage: {
          visible: laterShift,
          unlocked: laterShift,
          gate: laterShift ? null : "shift 02",
        },
        crisisArbitration: {
          visible: laterShift,
          unlocked: laterShift,
          gate: laterShift ? null : "shift 02",
        },
      },
    };
  }

  function createShiftSummary(state) {
    const trainingContract = state.tutorial ? state.tutorial.contract : null;
    return {
      id: "training-shift-summary",
      shift: state.campaign.shift,
      phase: state.campaign.phase,
      tick: state.tick,
      status: trainingContract ? trainingContract.status : state.run.status,
      completedContracts: state.run.completedContracts + (trainingContract && trainingContract.status === "complete" ? 1 : 0),
      failedContracts: state.run.failedContracts,
      produced: clone(state.produced),
      resources: clone(state.resources),
      trainingContract: trainingContract ? clone(trainingContract) : null,
      nextUnlocks: ["upgrade-choice", "shift-02-advanced-systems"],
    };
  }

  function createShiftState(state) {
    const summaryOpen = state.tutorial && state.tutorial.status === "summary";
    const upgradeOpen = summaryOpen || state.run.status === "success";
    return {
      id: `shift-${formatShiftNumber(state.campaign.shift)}`,
      status: summaryOpen ? "summary" : state.run.status,
      objective: state.tutorial && !state.tutorial.completed
        ? clone(state.tutorial.contract)
        : clone(state.contracts.find((contract) => contract.status === "active") || state.contracts[0]),
      summary: summaryOpen ? createShiftSummary(state) : null,
      upgradeChoice: {
        status: upgradeOpen ? "available" : "locked",
        options: GAME_DATA.upgrades.map((upgrade) => ({
          id: upgrade.id,
          name: upgrade.name,
          cost: clone(upgrade.cost),
          affordable: canPay(state.resources, upgrade.cost),
          installed: state.upgrades.purchased.includes(upgrade.id),
        })),
        selectedUpgradeId: null,
      },
    };
  }

  function primaryOutputResource(jobType) {
    if (!jobType || !jobType.outputs) {
      return null;
    }
    return RESOURCE_ORDER.find((resource) => jobType.outputs[resource] > 0) || null;
  }

  function resourceFeedbackState(state, resourceId) {
    const current = state.resources[resourceId] || 0;
    const produced = state.produced && (state.produced[resourceId] || 0) > 0;
    const token = RESOURCE_VISUAL_TOKENS[resourceId] || { icon: "resource-node", lowAt: 0 };
    let signal = "nominal";
    if (resourceId === "stability" && current <= token.lowAt) {
      signal = "warning";
    } else if (current <= token.lowAt) {
      signal = "shortage";
    }
    return {
      id: resourceId,
      icon: token.icon,
      signal,
      produced,
      feedback: produced ? "produced" : signal,
      proceduralAsset: PROCEDURAL_FEEDBACK_ASSETS.resourceIcons,
    };
  }

  function jobFeedbackState(state, jobType, entry = null) {
    const assetPath = jobType ? ASSET_PATHS.jobs[jobType.id] || null : null;
    const shortage = Boolean(jobType && !canPay(state.resources, jobType.inputs));
    const family = (jobType && jobType.family) || "standard";
    let feedback = entry && entry.status === "assigned" ? "assigned" : "queued";
    if (entry && entry.status === "held") {
      feedback = "held";
    }
    if (entry && entry.compromised && entry.compromised.status === "compromised") {
      feedback = "compromised";
    } else if (entry && entry.breachDirective) {
      feedback = "countermeasure";
    } else if (entry && entry.freightDirective) {
      feedback = "inspection";
    } else if (entry && entry.sabotageDirective) {
      feedback = "sabotage-sweep";
    } else if (shortage) {
      feedback = "shortage";
    }
    return {
      jobTypeId: jobType ? jobType.id : null,
      family,
      feedback,
      shortage,
      assetPath,
      assetMode: assetPath ? "raster" : "procedural",
      outputResource: primaryOutputResource(jobType),
      proceduralAsset: assetPath ? null : PROCEDURAL_FEEDBACK_ASSETS.shortageMarker,
    };
  }

  function laneFeedbackState(state, lane) {
    const jobType = lane.currentJob ? byId(GAME_DATA.jobTypes, lane.currentJob.jobTypeId) : null;
    const outputResource = primaryOutputResource(jobType);
    const overdriveActive = Boolean(lane.overdrive && lane.overdrive.active);
    const sector = gridSectorForLane(state.grid, lane.id);
    const breachState = sector && sector.breach ? sector.breach.status : "clean";
    const shortage = Boolean(jobType && !canPay(state.resources, jobType.inputs));
    const faultAsset = lane.fault ? ASSET_PATHS.faults[lane.fault.id] || null : null;
    let feedback = "idle";
    if (lane.fault) {
      feedback = lane.status === "recovering" ? "recovery" : "jam";
    } else if (lane.status === "running" && overdriveActive) {
      feedback = "overdrive";
    } else if (lane.status === "running") {
      feedback = "production";
    } else if (lane.status === "assigned") {
      feedback = "assignment";
    } else if (lane.status === "locked") {
      feedback = "sabotage";
    } else if (lane.status === "blocked") {
      feedback = "blocked";
    }
    return {
      laneId: lane.id,
      feedback,
      motion: lane.status === "running" ? (overdriveActive ? "fast" : "belt") : lane.status === "recovering" ? "diagnostic" : "still",
      machineState: lane.status,
      shortage,
      overdriveActive,
      heat: overdriveActive ? "hot" : lane.status === "running" ? "warm" : "cold",
      breachState,
      quarantineActive: Boolean(lane.breachQuarantine),
      outputResource,
      outputBundle: jobType ? clone(jobType.outputs) : {},
      progress: lane.progress || 0,
      rasterAssets: {
        lane: ASSET_PATHS.lanes[lane.id] || null,
        job: jobType ? ASSET_PATHS.jobs[jobType.id] || null : null,
        fault: faultAsset,
      },
      proceduralAssets: {
        floor: PROCEDURAL_FEEDBACK_ASSETS.floorBoard,
        output: PROCEDURAL_FEEDBACK_ASSETS.outputDelivery,
        overdrive: PROCEDURAL_FEEDBACK_ASSETS.overdriveGlow,
        jam: PROCEDURAL_FEEDBACK_ASSETS.jamSparks,
        recovery: PROCEDURAL_FEEDBACK_ASSETS.recoverySweep,
        shortage: PROCEDURAL_FEEDBACK_ASSETS.shortageMarker,
        sabotage: PROCEDURAL_FEEDBACK_ASSETS.sabotageMarker,
      },
    };
  }

  function upgradeFeedbackState(state, upgrade, index = 0) {
    const installed = state.upgrades.purchased.includes(upgrade.id);
    const affordable = canPay(state.resources, upgrade.cost);
    return {
      id: upgrade.id,
      family: UPGRADE_VISUAL_FAMILIES[upgrade.id] || `upgrade-${index + 1}`,
      feedback: installed ? "installed" : affordable ? "available" : "shortage",
      affordable,
      installed,
      proceduralAsset: PROCEDURAL_FEEDBACK_ASSETS.upgradeFamilies,
    };
  }

  function shiftSummaryFeedbackState(state) {
    const summary = state.shift && state.shift.summary ? state.shift.summary : null;
    return {
      feedback: summary ? "summary-open" : "closed",
      status: summary ? summary.status : state.run.status,
      produced: summary ? clone(summary.produced) : clone(state.produced || {}),
      upgradeChoice: state.shift && state.shift.upgradeChoice ? state.shift.upgradeChoice.status : "locked",
      proceduralAsset: PROCEDURAL_FEEDBACK_ASSETS.shiftSummaryHeader,
    };
  }

  function factoryFeedbackState(state) {
    return {
      proceduralAssets: clone(PROCEDURAL_FEEDBACK_ASSETS),
      lanes: state.lanes.map((lane) => laneFeedbackState(state, lane)),
      resources: RESOURCE_ORDER.reduce((feedback, resourceId) => {
        feedback[resourceId] = resourceFeedbackState(state, resourceId);
        return feedback;
      }, {}),
      queue: state.queue.map((entry) => jobFeedbackState(state, byId(GAME_DATA.jobTypes, entry.jobTypeId), entry)),
      upgrades: GAME_DATA.upgrades.map((upgrade, index) => upgradeFeedbackState(state, upgrade, index)),
      shiftSummary: shiftSummaryFeedbackState(state),
    };
  }

  function tutorialActive(state) {
    return Boolean(
      state.tutorial
        && state.tutorial.enabled
        && !state.tutorial.completed
        && ["active", "summary"].includes(state.tutorial.status)
    );
  }

  function setTutorialStepInPlace(state, stepId) {
    if (!state.tutorial || state.tutorial.stepId === stepId) {
      return;
    }
    state.tutorial.stepId = stepId;
    state.tutorial.stepIndex = tutorialStepIndex(stepId);
    state.tutorial.currentStep = tutorialStep(stepId);
    state.tutorial.events.unshift({ tick: state.tick, stepId });
    state.tutorial.events = state.tutorial.events.slice(0, 12);
  }

  function selectedQueueEntry(state) {
    return state.selection && state.selection.selectedJobId
      ? byId(state.queue, state.selection.selectedJobId)
      : null;
  }

  function selectedLane(state) {
    return state.selection && state.selection.selectedLaneId
      ? byId(state.lanes, state.selection.selectedLaneId)
      : null;
  }

  function actionState(id, label, available, detail = {}) {
    return {
      id,
      label,
      available: Boolean(available),
      reason: available ? null : detail.reason || "not available",
      laneId: detail.laneId || null,
      entryId: detail.entryId || null,
      cost: detail.cost ? clone(detail.cost) : {},
    };
  }

  function contextualActionsForState(state) {
    const lane = selectedLane(state);
    const entry = selectedQueueEntry(state);
    if (!lane) {
      return entry
        ? [actionState("assign", "Assign", false, { entryId: entry.id, reason: "select a lane" })]
        : [];
    }
    const actions = [];
    if (entry) {
      actions.push(actionState(
        "assign",
        "Assign",
        lane.status === "idle" && entry.status === "queued" && laneGridAvailable(state, lane),
        {
          laneId: lane.id,
          entryId: entry.id,
          reason: lane.status !== "idle" ? "lane is not idle" : "lane unavailable",
        }
      ));
    }
    if (lane.currentJob && (lane.status === "assigned" || (lane.status === "blocked" && !lane.fault))) {
      actions.push(actionState(
        "start",
        "Start",
        lane.status === "assigned" || (lane.status === "blocked" && !lane.fault),
        { laneId: lane.id, reason: lane.fault ? "recover the lane first" : "lane is not assigned" }
      ));
    }
    if (lane.fault) {
      actions.push(actionState(
        "recover",
        "Recover",
        lane.status === "blocked" && canPay(state.resources, lane.fault.recovery),
        { laneId: lane.id, cost: lane.fault.recovery, reason: "recovery resources unavailable" }
      ));
    }
    if (lane.status === "running" || (lane.overdrive && lane.overdrive.active)) {
      const overdrive = GAME_DATA.campaign.laneOverdrive;
      const cost = { power: overdrive.powerCost, stability: overdrive.stabilityCost };
      actions.push(actionState(
        lane.overdrive.active ? "release-overdrive" : "overdrive",
        lane.overdrive.active ? "Release Overdrive" : "Overdrive",
        lane.overdrive.active || canPay(state.resources, cost),
        { laneId: lane.id, cost, reason: "overdrive resources unavailable" }
      ));
    }
    if (lane.status === "running") {
      actions.push(actionState("pause", "Pause", true, { laneId: lane.id }));
    }
    if (state.breach && state.breach.status === "active") {
      const sector = gridSectorForLane(state.grid, lane.id);
      const quarantineActive = Boolean(lane.breachQuarantine);
      const contaminated = sector && sector.breach && sector.breach.status === "contaminated";
      const cost = { stability: GAME_DATA.signalBreach.quarantine.stabilityCost };
      if (quarantineActive || contaminated) {
        actions.push(actionState(
          quarantineActive ? "release-quarantine" : "quarantine",
          quarantineActive ? "Release Quarantine" : "Quarantine",
          quarantineActive || canPay(state.resources, cost),
          { laneId: lane.id, cost, reason: "quarantine stability unavailable" }
        ));
      }
    }
    return actions;
  }

  function refreshRuntimeSurfacesInPlace(state) {
    if (!state || !state.restart || !state.campaign) {
      return state;
    }
    if (!state.selection) {
      state.selection = createSelectionState();
    }
    if (state.tutorial) {
      state.tutorial.selectedJobId = state.selection.selectedJobId;
      state.tutorial.selectedLaneId = state.selection.selectedLaneId;
      state.tutorial.stepIndex = tutorialStepIndex(state.tutorial.stepId);
      state.tutorial.currentStep = tutorialStep(state.tutorial.stepId);
    }
    state.contextualActions = contextualActionsForState(state);
    state.disclosure = createDisclosureState(state);
    state.shift = createShiftState(state);
    state.visualFeedback = factoryFeedbackState(state);
    return state;
  }

  function purchasedUpgradeIds(upgrades) {
    if (!upgrades) {
      return [];
    }
    if (Array.isArray(upgrades)) {
      return upgrades.slice();
    }
    return (upgrades.purchased || []).slice();
  }

  function aggregateUpgradeEffects(upgrades) {
    const effects = {
      throughputBonus: 0,
      jamResistance: 0,
      recoveryTicksBonus: 0,
      startResources: {},
    };
    purchasedUpgradeIds(upgrades).forEach((upgradeId) => {
      const upgrade = byId(GAME_DATA.upgrades, upgradeId);
      if (!upgrade) {
        return;
      }
      const effect = upgrade.effect || {};
      effects.throughputBonus += effect.throughputBonus || 0;
      effects.jamResistance += effect.jamResistance || 0;
      effects.recoveryTicksBonus += effect.recoveryTicksBonus || 0;
      Object.entries(effect.startResources || {}).forEach(([resource, amount]) => {
        effects.startResources[resource] = (effects.startResources[resource] || 0) + amount;
      });
    });
    return effects;
  }

  function lanePerformance(source, upgradeEffects, overdrive = null, gridEffect = null) {
    const overdriveData = overdrive && overdrive.active ? GAME_DATA.campaign.laneOverdrive : {};
    const throughputBonus = (
      (upgradeEffects.throughputBonus || 0) +
      (overdriveData.throughputBonus || 0) +
      (gridEffect && gridEffect.throughputBonus ? gridEffect.throughputBonus : 0)
    );
    const jamPressure = overdriveData.jamRiskBonus || 0;
    return {
      throughput: roundTenth(source.throughput + throughputBonus),
      jamRisk: Math.max(
        0.01,
        roundTenth((source.jamRisk - (upgradeEffects.jamResistance || 0) + jamPressure) * 100) / 100
      ),
    };
  }

  function gridSectorDefinition(sectorId) {
    return byId(GAME_DATA.grid.sectors, sectorId);
  }

  function gridSectorForLane(grid, laneId) {
    if (!grid || !Array.isArray(grid.sectors)) {
      return null;
    }
    return grid.sectors.find((sector) => sector.laneId === laneId) || null;
  }

  function gridEffectForLane(grid, laneId) {
    const sector = gridSectorForLane(grid, laneId);
    if (!sector || sector.route !== "priority" || sector.isolated) {
      return {};
    }
    const definition = gridSectorDefinition(sector.id);
    return definition && definition.priority ? definition.priority : {};
  }

  function breachSourceDefinition(sourceId) {
    return byId(GAME_DATA.signalBreach.sources, sourceId);
  }

  function freightManifestDefinition(manifestId) {
    return byId(GAME_DATA.freightLockdown.manifests, manifestId);
  }

  function railSabotageIncidentDefinition(incidentId) {
    return byId(GAME_DATA.railSabotage.incidents, incidentId);
  }

  function crisisCaseDefinition(caseId) {
    return byId(GAME_DATA.crisisArbitration.cases, caseId);
  }

  function selectBreachSource(campaign) {
    const sources = GAME_DATA.signalBreach.sources;
    const index = Math.max(0, campaign.demand - 1) % sources.length;
    return sources[index];
  }

  function cleanBreachSectorState(sectorId, carryover = {}) {
    const contaminated = Array.isArray(carryover.contaminatedSectors)
      && carryover.contaminatedSectors.includes(sectorId);
    return {
      status: contaminated ? "scarred" : "clean",
      sourceId: null,
      severity: contaminated ? 1 : 0,
      shieldedUntil: null,
      quarantinedAtTick: null,
    };
  }

  function clampResourceFloor(resources) {
    Object.keys(resources).forEach((resource) => {
      resources[resource] = Math.max(0, resources[resource]);
    });
  }

  function createGridState(campaign, options = {}) {
    const incoming = options.campaign || {};
    const carryover = incoming.gridCarryover || {};
    const breachCarryover = incoming.breachCarryover || {};
    const pressure = Math.max(0, (carryover.blackoutScar || 0) + (carryover.auditPressure || 0));
    const reserveDebt = Math.max(0, carryover.reserveDebt || 0);
    const threshold = Math.max(6, GAME_DATA.grid.blackout.threshold - Math.max(0, campaign.demand - 2));
    return {
      release: GAME_DATA.campaign.release,
      pressure,
      currentLoad: 0,
      threshold,
      sectors: GAME_DATA.grid.sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        laneId: sector.laneId,
        connectedTo: sector.connectedTo.slice(),
        route: "balanced",
        isolated: false,
        powered: true,
        blackoutLockedUntil: null,
        blackoutCount: 0,
        reserveDraws: 0,
        breach: cleanBreachSectorState(sector.id, breachCarryover),
      })),
      blackout: {
        status: "armed",
        threshold,
        activeSectorId: null,
        lastEventTick: null,
        events: [],
      },
      reserve: {
        capacity: GAME_DATA.grid.reserve.capacity,
        available: Math.max(0, GAME_DATA.grid.reserve.capacity - reserveDebt),
        drawn: 0,
        draws: 0,
        debt: reserveDebt,
      },
      audit: {
        status: campaign.demand > 1 ? "armed" : "quiet",
        directiveId: GAME_DATA.grid.auditDirectives[0].id,
        activatedAtTick: null,
        dueTick: null,
        deferrals: 0,
        completed: 0,
        failures: 0,
        queued: false,
      },
      choices: {
        powerRoutes: 0,
        sectorIsolations: 0,
        reserveDraws: 0,
        auditDeferrals: 0,
        auditRepairs: 0,
      },
      carryover: {
        blackoutScar: carryover.blackoutScar || 0,
        reserveDebt,
        auditPressure: carryover.auditPressure || 0,
      },
    };
  }

  function createBreachState(campaign, options = {}) {
    const incoming = options.campaign || {};
    const carryover = incoming.breachCarryover || {};
    const source = selectBreachSource(campaign);
    const signalScar = Math.max(0, carryover.signalScar || 0);
    return {
      release: GAME_DATA.campaign.release,
      status: "dormant",
      sourceId: source.id,
      activatedAtTick: null,
      intensity: signalScar,
      threshold: GAME_DATA.signalBreach.threshold,
      trace: {
        status: "quiet",
        dueTick: null,
        deferrals: 0,
        resolved: 0,
        failures: Math.max(0, carryover.traceFailures || 0),
      },
      contamination: {
        queuedEntries: 0,
        completedCompromisedJobs: 0,
        sectors: Array.isArray(carryover.contaminatedSectors)
          ? carryover.contaminatedSectors.slice()
          : [],
      },
      containment: {
        status: signalScar > 0 ? "scarred" : "ready",
        cleansedEntries: 0,
        quarantinedLanes: [],
        shieldedSectors: 0,
        countermeasures: 0,
        tracedSources: 0,
      },
      choices: {
        cleanses: 0,
        quarantines: 0,
        traces: 0,
        traceDeferrals: 0,
        shieldRoutes: 0,
        countermeasureJobs: 0,
      },
      countermeasureQueued: false,
      carryover: {
        signalScar,
        escapedSources: Math.max(0, carryover.escapedSources || 0),
        traceFailures: Math.max(0, carryover.traceFailures || 0),
        contaminatedSectors: Array.isArray(carryover.contaminatedSectors)
          ? carryover.contaminatedSectors.slice()
          : [],
      },
      history: [],
    };
  }

  function createFreightState(campaign, options = {}, purchased = []) {
    const incoming = options.campaign || {};
    const carryover = incoming.freightCarryover || {};
    const lockdownScar = Math.max(0, carryover.lockdownScar || 0);
    const upgradedRiskRelief = purchased.includes("fault-guards") ? 1 : 0;
    const integrityScar = Math.min(24, lockdownScar * 3);
    return {
      release: GAME_DATA.freightLockdown.release,
      status: lockdownScar > 0 ? "scarred" : "ready",
      routeSecurity: {
        pressure: Math.max(0, lockdownScar),
        events: [],
      },
      outcomes: {
        full: 0,
        partial: 0,
        failed: 0,
      },
      choices: {
        cargoStages: 0,
        carrierSeals: 0,
        escortDrones: 0,
        defenseScreens: 0,
        reserveClearances: 0,
        reroutes: 0,
        holds: 0,
        launches: 0,
      },
      carryover: {
        lockdownScar,
        lostCargo: Math.max(0, carryover.lostCargo || 0),
        delayedManifests: Math.max(0, carryover.delayedManifests || 0),
        completedShipments: Math.max(0, carryover.completedShipments || 0),
      },
      manifests: GAME_DATA.freightLockdown.manifests.map((manifest) => {
        const shiftReady = campaign.shift >= manifest.availableShift;
        const risk = Math.max(0, manifest.routeRisk + Math.max(0, campaign.demand - 1) - upgradedRiskRelief);
        return {
          id: manifest.id,
          name: manifest.name,
          dockId: manifest.dockId,
          dockName: manifest.dockName,
          laneId: manifest.laneId,
          sectorId: manifest.sectorId,
          contractId: manifest.contractId,
          availableShift: manifest.availableShift,
          status: shiftReady ? "scheduled" : "pending",
          openedAtTick: null,
          sealedAtTick: null,
          launchedAtTick: null,
          arrivalTick: null,
          window: {
            opensAtTick: manifest.window.opensAtTick,
            closesAtTick: Math.max(
              manifest.window.opensAtTick + 4,
              manifest.window.closesAtTick - Math.min(3, lockdownScar)
            ),
          },
          cargo: {
            required: clone(manifest.cargo),
            staged: {},
            stagedAtTick: null,
          },
          inspection: {
            status: "waiting",
            jobTypeId: manifest.inspectionJobTypeId,
            queued: false,
            completedAtTick: null,
          },
          route: {
            baseRisk: risk,
            currentRisk: risk,
            rerouted: false,
            reroutedAround: null,
            contaminatedExposure: false,
            delayTicks: 0,
          },
          security: {
            drones: 0,
            defenses: 0,
            reserveClearance: false,
            riskRelief: 0,
            integrityGuard: 0,
          },
          sabotage: {
            suspect: false,
            incidentId: null,
            scanStatus: "clear",
            patrolDrones: 0,
            patrolDefenses: 0,
            decoy: false,
            dockLocked: false,
            integrityDamage: 0,
          },
          integrity: Math.max(40, 100 - integrityScar),
          outcome: null,
          payoutApplied: false,
          events: [],
        };
      }),
    };
  }

  function createRailSabotageState(campaign, options = {}, purchased = []) {
    const incoming = options.campaign || {};
    const carryover = incoming.railSabotageCarryover || {};
    const sabotageScar = Math.max(0, carryover.sabotageScar || 0);
    const tamperedCargo = Math.max(0, carryover.tamperedCargo || 0);
    const damagedLanes = Array.isArray(carryover.damagedLanes) ? carryover.damagedLanes.slice() : [];
    const upgradedRelief = purchased.includes("fault-guards") ? 1 : 0;
    return {
      release: GAME_DATA.railSabotage.release,
      status: sabotageScar > 0 ? "scarred" : "ready",
      pressure: sabotageScar,
      outcomes: {
        contained: 0,
        partial: 0,
        failed: 0,
      },
      choices: {
        scans: 0,
        patrolDrones: 0,
        defenseScreens: 0,
        decoys: 0,
        dockLockdowns: 0,
        dockReopens: 0,
        interceptions: 0,
        laneRepairs: 0,
        carrierReroutes: 0,
      },
      carryover: {
        sabotageScar,
        tamperedCargo,
        damagedLanes,
        containedCells: Math.max(0, carryover.containedCells || 0),
      },
      incidents: GAME_DATA.railSabotage.incidents.map((incident) => {
        const shiftReady = campaign.shift >= incident.availableShift;
        const basePressure = Math.max(
          1,
          incident.sabotagePressure + Math.max(0, campaign.demand - 1) + Math.min(3, sabotageScar) - upgradedRelief
        );
        return {
          id: incident.id,
          name: incident.name,
          dockId: incident.dockId,
          dockName: incident.dockName,
          laneId: incident.laneId,
          sectorId: incident.sectorId,
          manifestId: incident.manifestId,
          contractId: incident.contractId,
          availableShift: incident.availableShift,
          status: shiftReady ? "scheduled" : "pending",
          outcome: null,
          openedAtTick: null,
          resolvedAtTick: null,
          window: {
            opensAtTick: incident.window.opensAtTick,
            closesAtTick: Math.max(
              incident.window.opensAtTick + 3,
              incident.window.closesAtTick - Math.min(2, sabotageScar)
            ),
          },
          trigger: {
            suspectCargo: clone(incident.suspectCargo),
            route: incident.routeTrigger,
          },
          requirements: clone(incident.requirements),
          pressure: {
            base: basePressure,
            current: basePressure,
            mitigation: 0,
          },
          scan: {
            status: "waiting",
            required: incident.requirements.scans || 0,
            queued: false,
            completedAtTick: null,
          },
          patrol: {
            status: "unassigned",
            required: incident.requirements.patrol,
            drones: 0,
            defenses: 0,
          },
          decoy: {
            deployed: false,
            routeId: null,
            deployedAtTick: null,
          },
          dock: {
            locked: false,
            lockedAtTick: null,
            reopenedAtTick: null,
          },
          containment: {
            status: damagedLanes.includes(incident.laneId) ? "scarred" : "watching",
            requiredScore: incident.containment.requiredScore,
            partialScore: incident.containment.partialScore,
            intercepted: false,
          },
          carrier: {
            rerouted: false,
            integrityDamage: 0,
          },
          laneDamage: {
            status: damagedLanes.includes(incident.laneId) ? "scarred" : "clear",
            repairedAtTick: null,
          },
          events: [],
        };
      }),
    };
  }

  function createCrisisArbitrationState(campaign, options = {}) {
    const incoming = options.campaign || {};
    const carryover = incoming.crisisArbitrationCarryover || {};
    const arbitrationScar = Math.max(0, carryover.arbitrationScar || 0);
    const failedCases = Array.isArray(carryover.failedCases) ? carryover.failedCases.slice() : [];
    const disputedLanes = Array.isArray(carryover.disputedLanes) ? carryover.disputedLanes.slice() : [];
    return {
      release: GAME_DATA.crisisArbitration.release,
      status: arbitrationScar > 0 ? "scarred" : "ready",
      pressure: arbitrationScar,
      outcomes: {
        binding: 0,
        partial: 0,
        failed: 0,
      },
      choices: {
        evidenceAssignments: 0,
        gridFirstRulings: 0,
        freightFirstRulings: 0,
        breachFirstRulings: 0,
        railFirstRulings: 0,
        emergencyOverrides: 0,
        deferrals: 0,
        laneProtections: 0,
      },
      carryover: {
        arbitrationScar,
        failedCases,
        disputedLanes,
        overridesSpent: Math.max(0, carryover.overridesSpent || 0),
        bindingRulings: Math.max(0, carryover.bindingRulings || 0),
      },
      cases: GAME_DATA.crisisArbitration.cases.map((caseDefinition) => {
        const shiftReady = campaign.shift >= caseDefinition.availableShift;
        const scarCompression = Math.min(2, arbitrationScar);
        return {
          id: caseDefinition.id,
          name: caseDefinition.name,
          availableShift: caseDefinition.availableShift,
          status: failedCases.includes(caseDefinition.id) ? "scarred" : shiftReady ? "scheduled" : "pending",
          outcome: null,
          openedAtTick: null,
          resolvedAtTick: null,
          dueTick: null,
          window: {
            opensAtTick: caseDefinition.window.opensAtTick,
            closesAtTick: Math.max(
              caseDefinition.window.opensAtTick + 3,
              caseDefinition.window.closesAtTick - scarCompression
            ),
          },
          rulingTicks: Math.max(3, caseDefinition.rulingTicks - scarCompression),
          linked: clone(caseDefinition.linked),
          evidence: {
            required: caseDefinition.evidenceRequired.slice(),
            minimum: caseDefinition.minimumEvidence,
            assigned: [],
            rejected: [],
            score: 0,
          },
          priorityOrder: caseDefinition.priorityOrder.slice(),
          ruling: {
            status: "unruled",
            priority: null,
            outcome: null,
            binding: false,
            score: 0,
            reason: null,
          },
          override: {
            spent: false,
            spentAtTick: null,
            extensionTicks: 0,
            score: 0,
          },
          deferrals: 0,
          protection: {
            laneGuarded: disputedLanes.includes(caseDefinition.linked.laneId),
            guardedAtTick: null,
            score: disputedLanes.includes(caseDefinition.linked.laneId) ? 1 : 0,
          },
          pressure: {
            base: Math.max(1, 2 + Math.max(0, campaign.demand - 1) + Math.min(3, arbitrationScar)),
            current: Math.max(1, 2 + Math.max(0, campaign.demand - 1) + Math.min(3, arbitrationScar)),
          },
          events: [],
        };
      }),
      history: [],
    };
  }

  function applyGridCarryoverResources(resources, grid) {
    if (!grid || !grid.carryover) {
      return;
    }
    resources.power -= grid.carryover.reserveDebt || 0;
    resources.stability -= grid.carryover.blackoutScar || 0;
    clampResourceFloor(resources);
  }

  function applyBreachCarryoverResources(resources, breach) {
    if (!breach || !breach.carryover) {
      return;
    }
    resources.stability -= breach.carryover.signalScar || 0;
    resources.power -= Math.min(2, breach.carryover.escapedSources || 0);
    clampResourceFloor(resources);
  }

  function applyFreightCarryoverResources(resources, freight) {
    if (!freight || !freight.carryover) {
      return;
    }
    resources.stability -= freight.carryover.lockdownScar || 0;
    resources.reputation -= Math.min(2, freight.carryover.lostCargo || 0);
    clampResourceFloor(resources);
  }

  function applyRailSabotageCarryoverResources(resources, railSabotage) {
    if (!railSabotage || !railSabotage.carryover) {
      return;
    }
    resources.stability -= railSabotage.carryover.sabotageScar || 0;
    resources.power -= Math.min(2, railSabotage.carryover.damagedLanes.length || 0);
    resources.reputation -= Math.min(2, railSabotage.carryover.tamperedCargo || 0);
    clampResourceFloor(resources);
  }

  function applyCrisisArbitrationCarryoverResources(resources, crisisArbitration) {
    if (!crisisArbitration || !crisisArbitration.carryover) {
      return;
    }
    resources.stability -= crisisArbitration.carryover.arbitrationScar || 0;
    resources.reputation -= Math.min(2, crisisArbitration.carryover.failedCases.length || 0);
    clampResourceFloor(resources);
  }


  function advanceSeed(state) {
    state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
    return state.seed / 4294967296;
  }

  function baseResources() {
    const resources = {};
    Object.entries(GAME_DATA.resources).forEach(([id, info]) => {
      resources[id] = info.initial;
    });
    return resources;
  }

  function campaignShiftForRun(run) {
    const shifts = GAME_DATA.campaign.shifts;
    const capped = shifts[Math.min(Math.max(run, 1), shifts.length) - 1];
    const overflow = Math.max(0, run - shifts.length);
    return {
      ...clone(capped),
      shift: run,
      demand: capped.demand + overflow,
      deadlineDelta: capped.deadlineDelta - overflow,
      emergencyTick: capped.emergencyTick === null ? null : Math.max(2, capped.emergencyTick - overflow),
    };
  }

  function createCampaignState(run, options = {}) {
    const shift = campaignShiftForRun(run);
    const incoming = options.campaign || {};
    const queuePolicy = incoming.queuePolicy || "standard-release";
    return {
      release: GAME_DATA.campaign.release,
      shift: run,
      phase: shift.phase,
      demand: shift.demand,
      deadlineDelta: shift.deadlineDelta,
      queuePolicy,
      ledger: Array.isArray(incoming.ledger) ? clone(incoming.ledger) : [],
      emergency: {
        status: shift.emergencyContractId ? "armed" : "quiet",
        triggerTick: shift.emergencyTick,
        contractId: shift.emergencyContractId,
        queued: false,
      },
      choices: {
        queuePolicyChanges: 0,
        laneOverdrives: 0,
        gridPowerRoutes: 0,
        reserveDraws: 0,
        sectorIsolations: 0,
        auditDeferrals: 0,
        auditRepairs: 0,
        breachCleanses: 0,
        breachQuarantines: 0,
        breachTraces: 0,
        breachDeferrals: 0,
        breachCountermeasures: 0,
        freightStages: 0,
        freightSeals: 0,
        freightLaunches: 0,
        freightEscorts: 0,
        freightDefenseScreens: 0,
        freightReserveClearances: 0,
        freightReroutes: 0,
        freightHolds: 0,
        sabotageScans: 0,
        sabotagePatrolDrones: 0,
        sabotageDefenseScreens: 0,
        sabotageDecoys: 0,
        sabotageDockLockdowns: 0,
        sabotageDockReopens: 0,
        sabotageInterceptions: 0,
        sabotageLaneRepairs: 0,
        sabotageCarrierReroutes: 0,
        crisisEvidenceAssignments: 0,
        crisisGridFirstRulings: 0,
        crisisFreightFirstRulings: 0,
        crisisBreachFirstRulings: 0,
        crisisRailFirstRulings: 0,
        crisisEmergencyOverrides: 0,
        crisisDeferrals: 0,
        crisisLaneProtections: 0,
      },
    };
  }

  function escalatedRequirement(contract, campaign) {
    const requirement = clone(contract.requirement);
    const demandStep = Math.max(0, campaign.demand - 1);
    Object.entries(contract.escalationRequirement || {}).forEach(([resource, amount]) => {
      requirement[resource] = (requirement[resource] || 0) + amount * demandStep;
    });
    return requirement;
  }

  function buildContractState(campaign) {
    const contracts = GAME_DATA.contracts.map((contract, index) => ({
      id: contract.id,
      name: contract.name,
      family: contract.family || "standard",
      requirement: escalatedRequirement(contract, campaign),
      reward: clone(contract.reward),
      penalty: clone(contract.penalty),
      deadline: Math.max(6, contract.deadline + campaign.deadlineDelta),
      timeRemaining: Math.max(6, contract.deadline + campaign.deadlineDelta),
      pressure: campaign.demand > 1 ? `${contract.pressure}; demand x${campaign.demand}` : contract.pressure,
      status: index === 0 ? "active" : contract.status,
      startedAtTick: index === 0 ? 0 : null,
      completedAtTick: null,
      failedAtTick: null,
      emergency: false,
    }));
    if (campaign.emergency.contractId) {
      const emergency = byId(GAME_DATA.emergencyContracts, campaign.emergency.contractId);
      if (emergency) {
        const deadline = Math.max(4, emergency.deadline - Math.max(0, campaign.demand - 2));
        contracts.push({
          id: emergency.id,
          name: emergency.name,
          family: emergency.family,
          requirement: clone(emergency.requirement),
          reward: clone(emergency.reward),
          penalty: clone(emergency.penalty),
          deadline,
          timeRemaining: deadline,
          pressure: emergency.pressure,
          status: "pending",
          startedAtTick: null,
          completedAtTick: null,
          failedAtTick: null,
          activationTick: campaign.emergency.triggerTick,
          emergency: true,
          jobTypeId: emergency.jobTypeId,
        });
      }
    }
    return contracts;
  }

  function createQueueEntry(state, jobTypeId, priority, options = {}) {
    const entry = {
      id: `q${state.nextQueueId}`,
      jobTypeId,
      priority,
      status: options.status || "queued",
      emergency: Boolean(options.emergency),
      sourceContractId: options.sourceContractId || null,
      gridDirective: Boolean(options.gridDirective),
      sourceDirectiveId: options.sourceDirectiveId || null,
      breachDirective: Boolean(options.breachDirective),
      sourceBreachId: options.sourceBreachId || null,
      freightDirective: Boolean(options.freightDirective),
      sourceFreightId: options.sourceFreightId || null,
      sabotageDirective: Boolean(options.sabotageDirective),
      sourceSabotageId: options.sourceSabotageId || null,
      compromised: options.compromised ? clone(options.compromised) : null,
      heldReason: options.heldReason || null,
      createdAtTick: state.tick,
    };
    state.nextQueueId += 1;
    return entry;
  }

  function createInitialState(options = {}) {
    const run = options.run || 1;
    const seed = options.seed || 7103;
    const purchased = purchasedUpgradeIds(options.upgrades);
    const upgradeEffects = aggregateUpgradeEffects(purchased);
    const campaign = createCampaignState(run, options);
    const grid = createGridState(campaign, options);
    const breach = createBreachState(campaign, options);
    const freight = createFreightState(campaign, options, purchased);
    const railSabotage = createRailSabotageState(campaign, options, purchased);
    const crisisArbitration = createCrisisArbitrationState(campaign, options);
    const resources = baseResources();
    applyBundle(resources, upgradeEffects.startResources, 1);
    applyGridCarryoverResources(resources, grid);
    applyBreachCarryoverResources(resources, breach);
    applyFreightCarryoverResources(resources, freight);
    applyRailSabotageCarryoverResources(resources, railSabotage);
    applyCrisisArbitrationCarryoverResources(resources, crisisArbitration);
    const state = {
      tick: 0,
      seed,
      nextQueueId: 1,
      resources,
      produced: {},
      queue: [],
      grid,
      breach,
      freight,
      railSabotage,
      crisisArbitration,
      lanes: GAME_DATA.lanes.map((lane) => {
        const performance = lanePerformance(lane, upgradeEffects, null, gridEffectForLane(grid, lane.id));
        return {
          id: lane.id,
          name: lane.name,
          trait: lane.trait,
          gridSectorId: gridSectorForLane(grid, lane.id).id,
          baseThroughput: lane.throughput,
          throughput: performance.throughput,
          baseJamRisk: lane.jamRisk,
          jamRisk: performance.jamRisk,
          overdrive: {
            active: false,
            powerSpent: 0,
            stabilitySpent: 0,
          },
          status: "idle",
          progress: 0,
          runRemaining: 0,
          recoveryRemaining: 0,
          currentJob: null,
          fault: null,
          breachQuarantine: null,
          completedJobs: 0,
          restartState: clone(lane.restartState),
        };
      }),
      contracts: buildContractState(campaign),
      faults: {
        enabled: options.faultsEnabled !== false,
        graceTicks: options.faultGraceTicks === undefined ? 4 : options.faultGraceTicks,
        definitions: clone(GAME_DATA.faultTypes),
        history: [],
      },
      upgrades: {
        purchased,
        effects: upgradeEffects,
      },
      campaign,
      selection: createSelectionState(),
      tutorial: createTutorialState(options, run),
      contextualActions: [],
      disclosure: null,
      shift: null,
      run: {
        status: "active",
        completedContracts: 0,
        failedContracts: 0,
      },
      restart: {
        run,
        reason: "fresh shift",
        lastResetTick: 0,
        seed,
      },
      log: [{ tick: 0, message: `${GAME_DATA.latestRelease.label} ${campaign.phase} online.` }],
    };

    GAME_DATA.initialQueue.forEach((entry) => {
      state.queue.push(createQueueEntry(state, entry.jobTypeId, entry.priority));
    });
    applyQueuePolicy(state);
    refreshRuntimeSurfacesInPlace(state);

    return state;
  }

  function normalizeQueuePriorities(state) {
    state.queue.forEach((entry, index) => {
      entry.priority = index + 1;
    });
  }

  function hasActiveEmergency(state) {
    return state.contracts.some((contract) => contract.emergency && contract.status === "active");
  }

  function applyQueuePolicy(state) {
    const policyId = state.campaign ? state.campaign.queuePolicy : "standard-release";
    state.queue.forEach((entry) => {
      if (entry.status === "held") {
        entry.status = "queued";
      }
      entry.heldReason = null;
    });
    if (policyId === "emergency-first" && hasActiveEmergency(state)) {
      state.queue.sort((left, right) => {
        if (left.emergency !== right.emergency) {
          return left.emergency ? -1 : 1;
        }
        return left.priority - right.priority;
      });
      state.queue.forEach((entry) => {
        if (!entry.emergency) {
          entry.status = "held";
          entry.heldReason = "emergency-first";
        }
      });
    }
    normalizeQueuePriorities(state);
  }

  function withLog(state, message) {
    const next = clone(state);
    next.log.unshift({ tick: next.tick, message });
    next.log = next.log.slice(0, 8);
    refreshRuntimeSurfacesInPlace(next);
    return next;
  }

  function canPay(resources, inputs) {
    return Object.entries(inputs || {}).every(([resource, amount]) => (resources[resource] || 0) >= amount);
  }

  function applyBundle(resources, bundle, direction = 1) {
    Object.entries(bundle || {}).forEach(([resource, amount]) => {
      resources[resource] = (resources[resource] || 0) + amount * direction;
    });
  }

  function refreshLanePerformance(state, lane) {
    const source = byId(GAME_DATA.lanes, lane.id);
    if (!source) {
      return;
    }
    const performance = lanePerformance(source, state.upgrades.effects, lane.overdrive, gridEffectForLane(state.grid, lane.id));
    lane.baseThroughput = source.throughput;
    lane.baseJamRisk = source.jamRisk;
    lane.throughput = performance.throughput;
    lane.jamRisk = performance.jamRisk;
  }

  function refreshUpgradeEffects(state) {
    state.upgrades.effects = aggregateUpgradeEffects(state.upgrades.purchased);
    state.lanes.forEach((lane) => {
      refreshLanePerformance(state, lane);
    });
  }

  function purchaseUpgrade(state, upgradeId) {
    const upgrade = byId(GAME_DATA.upgrades, upgradeId);
    if (!upgrade) {
      return withLog(state, "Unknown upgrade selection.");
    }
    const next = clone(state);
    if (next.upgrades.purchased.includes(upgradeId)) {
      return withLog(next, `${upgrade.name} already installed.`);
    }
    if (!canPay(next.resources, upgrade.cost)) {
      return withLog(next, `${upgrade.name} lacks ${formatBundle(upgrade.cost)}.`);
    }
    applyBundle(next.resources, upgrade.cost, -1);
    next.upgrades.purchased.push(upgradeId);
    if (upgrade.effect && upgrade.effect.startResources) {
      applyBundle(next.resources, upgrade.effect.startResources, 1);
    }
    refreshUpgradeEffects(next);
    return withLog(next, `${upgrade.name} installed for later shifts.`);
  }

  function setQueuePolicy(state, policyId) {
    const policy = byId(GAME_DATA.campaign.queuePolicies, policyId);
    if (!policy) {
      return withLog(state, "Unknown queue policy.");
    }
    const next = clone(state);
    next.campaign.queuePolicy = policy.id;
    next.campaign.choices.queuePolicyChanges += 1;
    applyQueuePolicy(next);
    return withLog(next, `${policy.name} queue policy engaged.`);
  }

  function rescaleCurrentJobForLane(lane) {
    if (!lane.currentJob || lane.currentJob.status === "running") {
      return;
    }
    const jobType = byId(GAME_DATA.jobTypes, lane.currentJob.jobTypeId);
    if (!jobType) {
      return;
    }
    const completed = Math.max(0, lane.currentJob.duration - lane.currentJob.remaining);
    const nextDuration = runtimeForLane(jobType, lane);
    lane.currentJob.duration = nextDuration;
    lane.currentJob.remaining = Math.max(1, nextDuration - completed);
    lane.runRemaining = lane.currentJob.remaining;
  }

  function toggleLaneOverdrive(state, laneId, active = true) {
    const next = clone(state);
    const lane = byId(next.lanes, laneId);
    if (!lane) {
      return withLog(next, "Unknown lane overdrive request.");
    }
    const overdrive = GAME_DATA.campaign.laneOverdrive;
    const cost = { power: overdrive.powerCost, stability: overdrive.stabilityCost };
    if (active && lane.overdrive.active) {
      return withLog(next, `${lane.name} overdrive already active.`);
    }
    if (!active && !lane.overdrive.active) {
      return withLog(next, `${lane.name} overdrive already cold.`);
    }
    if (active && !canPay(next.resources, cost)) {
      return withLog(next, `${lane.name} overdrive lacks ${formatBundle(cost)}.`);
    }
    if (active) {
      applyBundle(next.resources, cost, -1);
      lane.overdrive.active = true;
      lane.overdrive.powerSpent += overdrive.powerCost;
      lane.overdrive.stabilitySpent += overdrive.stabilityCost;
      next.campaign.choices.laneOverdrives += 1;
    } else {
      lane.overdrive.active = false;
    }
    refreshLanePerformance(next, lane);
    rescaleCurrentJobForLane(lane);
    return withLog(next, `${lane.name} overdrive ${active ? "engaged" : "released"}.`);
  }

  function gridSectorState(state, sectorId) {
    return state.grid && state.grid.sectors ? byId(state.grid.sectors, sectorId) : null;
  }

  function laneForSector(state, sector) {
    return sector ? byId(state.lanes, sector.laneId) : null;
  }

  function markLaneGridLocked(lane, reason, untilTick = null) {
    if (!lane) {
      return;
    }
    lane.gridLock = {
      reason,
      untilTick,
      previousStatus: lane.status,
    };
    lane.status = "locked";
    if (lane.currentJob) {
      lane.currentJob.status = "locked";
    }
    lane.runRemaining = lane.currentJob ? lane.currentJob.remaining : 0;
  }

  function restoreLaneGridLock(lane, reason) {
    if (!lane || !lane.gridLock || lane.gridLock.reason !== reason) {
      return;
    }
    lane.gridLock = null;
    if (lane.currentJob) {
      lane.currentJob.status = "assigned";
      lane.status = "assigned";
      lane.runRemaining = lane.currentJob.remaining;
    } else {
      lane.status = "idle";
      lane.runRemaining = 0;
    }
  }

  function laneGridAvailable(state, lane) {
    if (!lane) {
      return false;
    }
    const sector = gridSectorForLane(state.grid, lane.id);
    return !sector || (!sector.isolated && !lane.gridLock);
  }

  function refreshSectorLane(state, sector) {
    const lane = laneForSector(state, sector);
    if (lane) {
      refreshLanePerformance(state, lane);
      rescaleCurrentJobForLane(lane);
    }
  }

  function routePowerToSector(state, sectorId, route = "priority") {
    const next = clone(state);
    const sector = gridSectorState(next, sectorId);
    const definition = gridSectorDefinition(sectorId);
    if (!sector || !definition) {
      return withLog(next, "Unknown grid sector route.");
    }
    if (!["balanced", "priority"].includes(route)) {
      return withLog(next, "Unknown grid route mode.");
    }
    if (sector.route === route) {
      return withLog(next, `${sector.name} already routed ${route}.`);
    }
    if (route === "priority") {
      const cost = { power: definition.priority.powerCost || 0 };
      if (!canPay(next.resources, cost)) {
        return withLog(next, `${sector.name} priority route lacks ${formatBundle(cost)}.`);
      }
      applyBundle(next.resources, cost, -1);
    }
    sector.route = route;
    next.grid.choices.powerRoutes += 1;
    next.campaign.choices.gridPowerRoutes += 1;
    refreshSectorLane(next, sector);
    return withLog(next, `${sector.name} routed ${route}.`);
  }

  function isolateGridSector(state, sectorId, active = true) {
    const next = clone(state);
    const sector = gridSectorState(next, sectorId);
    const definition = gridSectorDefinition(sectorId);
    if (!sector || !definition) {
      return withLog(next, "Unknown grid sector isolation.");
    }
    if (active && sector.isolated) {
      return withLog(next, `${sector.name} already isolated.`);
    }
    if (!active && !sector.isolated) {
      return withLog(next, `${sector.name} already tied to the grid.`);
    }
    const lane = laneForSector(next, sector);
    if (active) {
      const cost = { stability: definition.isolate.stabilityCost || 0 };
      if (!canPay(next.resources, cost)) {
        return withLog(next, `${sector.name} isolation lacks ${formatBundle(cost)}.`);
      }
      applyBundle(next.resources, cost, -1);
      sector.isolated = true;
      sector.powered = false;
      sector.route = "balanced";
      markLaneGridLocked(lane, "isolated");
    } else {
      sector.isolated = false;
      sector.powered = true;
      restoreLaneGridLock(lane, "isolated");
    }
    next.grid.pressure = Math.max(0, next.grid.pressure - (definition.isolate.pressureRelief || 0));
    next.grid.choices.sectorIsolations += 1;
    next.campaign.choices.sectorIsolations += 1;
    refreshSectorLane(next, sector);
    return withLog(next, `${sector.name} ${active ? "isolated from" : "returned to"} the grid.`);
  }

  function authorizeReserveDraw(state, sectorId = null) {
    const next = clone(state);
    if (!next.grid || next.grid.reserve.available <= 0) {
      return withLog(next, "Reserve batteries are empty.");
    }
    const sector = sectorId ? gridSectorState(next, sectorId) : null;
    const reserve = GAME_DATA.grid.reserve;
    applyBundle(next.resources, { power: reserve.drawAmount, stability: -reserve.stabilityCost }, 1);
    clampResourceFloor(next.resources);
    next.grid.reserve.available -= 1;
    next.grid.reserve.drawn += reserve.drawAmount;
    next.grid.reserve.draws += 1;
    next.grid.reserve.debt += 1;
    next.grid.pressure = Math.max(0, next.grid.pressure - reserve.pressureRelief);
    next.grid.choices.reserveDraws += 1;
    next.campaign.choices.reserveDraws += 1;
    if (sector) {
      sector.reserveDraws += 1;
      sector.powered = true;
      shieldBreachSectorInPlace(next, sector);
    }
    return withLog(next, `Reserve batteries drew ${reserve.drawAmount} power into ${sector ? sector.name : "the grid"}.`);
  }

  function freightManifestState(state, manifestId) {
    return state.freight && Array.isArray(state.freight.manifests)
      ? byId(state.freight.manifests, manifestId)
      : null;
  }

  function freightCargoRemaining(manifest) {
    const remaining = {};
    Object.entries(manifest.cargo.required || {}).forEach(([resource, amount]) => {
      const staged = manifest.cargo.staged[resource] || 0;
      if (staged < amount) {
        remaining[resource] = amount - staged;
      }
    });
    return remaining;
  }

  function freightCargoFullyStaged(manifest) {
    return Object.keys(freightCargoRemaining(manifest)).length === 0;
  }

  function freightStatusTerminal(manifest) {
    return ["complete", "partial", "failed"].includes(manifest.status);
  }

  function freightWindowOpen(state, manifest) {
    return state.tick >= manifest.window.opensAtTick && state.tick <= manifest.window.closesAtTick;
  }

  function freightDockLane(state, manifest) {
    return byId(state.lanes, manifest.laneId);
  }

  function freightDockReady(state, manifest) {
    const lane = freightDockLane(state, manifest);
    const sector = gridSectorState(state, manifest.sectorId);
    if (!lane || !sector) {
      return false;
    }
    const dockSealed = lane.gridLock
      && lane.gridLock.reason === "freight-lockdown"
      && manifest.status === "sealed";
    return (dockSealed || (lane.status === "idle" && laneGridAvailable(state, lane)))
      && !sector.isolated
      && sector.blackoutLockedUntil === null
      && sector.powered;
  }

  function releaseFreightDockLock(state, manifest) {
    const lane = freightDockLane(state, manifest);
    if (lane && lane.gridLock && lane.gridLock.reason === "freight-lockdown") {
      restoreLaneGridLock(lane, "freight-lockdown");
    }
  }

  function queueFreightInspection(state, manifest) {
    if (!manifest.inspection.jobTypeId || manifest.inspection.status === "complete") {
      return false;
    }
    const alreadyQueued = state.queue.some((entry) => (
      entry.freightDirective && entry.sourceFreightId === manifest.id
    ));
    const alreadyAssigned = state.lanes.some((lane) => (
      lane.currentJob && lane.currentJob.freightDirective && lane.currentJob.sourceFreightId === manifest.id
    ));
    if (alreadyQueued || alreadyAssigned) {
      manifest.inspection.queued = true;
      manifest.inspection.status = "queued";
      return false;
    }
    state.queue.unshift(createQueueEntry(state, manifest.inspection.jobTypeId, 1, {
      freightDirective: true,
      sourceFreightId: manifest.id,
    }));
    manifest.inspection.queued = true;
    manifest.inspection.status = "queued";
    applyQueuePolicy(state);
    return true;
  }

  function clearFreightInspectionQueueInPlace(state, manifest, status = "skipped") {
    const beforeLength = state.queue.length;
    state.queue = state.queue.filter((entry) => !(
      entry.freightDirective && entry.sourceFreightId === manifest.id
    ));
    if (state.queue.length !== beforeLength) {
      normalizeQueuePriorities(state);
    }
    if (manifest.inspection.status !== "complete") {
      manifest.inspection.status = status;
    }
    manifest.inspection.queued = false;
  }

  function openFreightManifestsInPlace(state) {
    if (!state.freight) {
      return;
    }
    state.freight.manifests.forEach((manifest) => {
      if (state.campaign.shift < manifest.availableShift) {
        return;
      }
      if (manifest.status === "pending") {
        manifest.status = "scheduled";
      }
      if (manifest.status !== "scheduled" || state.tick < manifest.window.opensAtTick) {
        return;
      }
      manifest.status = "available";
      manifest.openedAtTick = state.tick;
      queueFreightInspection(state, manifest);
      state.freight.status = "manifest-open";
      state.log.unshift({ tick: state.tick, message: `${manifest.name} freight manifest opened at ${manifest.dockName}.` });
    });
  }

  function freightRiskForManifest(state, manifest) {
    let risk = manifest.route.baseRisk - manifest.security.riskRelief;
    if (state.upgrades && state.upgrades.purchased.includes("buffer-cache")) {
      risk -= 1;
    }
    if (manifest.inspection.status !== "complete") {
      risk += 1;
    }
    if (state.queue.filter((entry) => ["queued", "held"].includes(entry.status)).length > 4) {
      risk += 1;
    }
    if (hasActiveEmergency(state)) {
      risk += 1;
    }
    if (state.grid) {
      if (state.grid.audit.status === "active") {
        risk += 1;
      }
      if (state.grid.audit.status === "failed") {
        risk += 2;
      }
      if (state.grid.pressure >= state.grid.threshold) {
        risk += 2;
      } else if (state.grid.pressure >= Math.max(5, state.grid.threshold - 4)) {
        risk += 1;
      }
      const sector = gridSectorState(state, manifest.sectorId);
      if (sector) {
        if (sector.isolated || sector.blackoutLockedUntil !== null || !sector.powered) {
          risk += 2;
        }
        if (sector.breach && ["contaminated", "quarantined", "scarred"].includes(sector.breach.status)) {
          risk += manifest.route.rerouted ? 0 : (sector.breach.severity || 1) + 1;
        }
      }
    }
    if (state.breach && state.breach.status === "active") {
      risk += 1;
    }
    if (state.breach && state.breach.status === "escaped") {
      risk += 2;
    }
    const lane = freightDockLane(state, manifest);
    if (lane && lane.overdrive && lane.overdrive.active) {
      risk += 1;
    }
    const sabotageIncident = activeRailSabotageIncidentForManifest(state, manifest.id);
    if (sabotageIncident) {
      risk += Math.ceil(refreshRailSabotageIncidentPressureInPlace(state, sabotageIncident) / 4);
      if (manifest.sabotage && manifest.sabotage.scanStatus !== "complete") {
        risk += 1;
      }
    }
    return Math.max(0, risk);
  }

  function refreshFreightRiskInPlace(state, manifest) {
    const sector = gridSectorState(state, manifest.sectorId);
    manifest.route.contaminatedExposure = Boolean(
      sector
        && sector.breach
        && ["contaminated", "quarantined", "scarred"].includes(sector.breach.status)
        && !manifest.route.rerouted
    );
    manifest.route.currentRisk = freightRiskForManifest(state, manifest);
    return manifest.route.currentRisk;
  }

  function recordFreightContractOutcomeInPlace(state, manifest, outcome) {
    const contract = byId(state.contracts, manifest.contractId);
    if (!contract) {
      return;
    }
    if (!Array.isArray(contract.freightOutcomes)) {
      contract.freightOutcomes = [];
    }
    contract.freightOutcomes.unshift({
      manifestId: manifest.id,
      outcome,
      integrity: manifest.integrity,
      tick: state.tick,
    });
    if (outcome === "full") {
      if (contract.status === "active") {
        contract.timeRemaining += 2;
      }
      if (state.breach && contract.family === "breach") {
        state.breach.intensity = Math.max(0, state.breach.intensity - 1);
      }
      return;
    }
    if (outcome === "partial") {
      if (contract.status === "active") {
        contract.timeRemaining += 1;
      }
      return;
    }
    if (contract.status === "active") {
      contract.timeRemaining = Math.max(0, contract.timeRemaining - 2);
    }
    if (state.breach && contract.family === "breach") {
      state.breach.intensity += 1;
    }
  }

  function applyFreightOutcomeInPlace(state, manifest, outcome, reason = "route-resolved") {
    if (!state.freight || freightStatusTerminal(manifest) || manifest.payoutApplied) {
      return false;
    }
    const definition = freightManifestDefinition(manifest.id);
    if (!definition) {
      return false;
    }
    const status = outcome === "full" ? "complete" : outcome === "partial" ? "partial" : "failed";
    const bundle = outcome === "full"
      ? definition.payout
      : outcome === "partial" ? definition.partialPayout : definition.penalty;
    applyBundle(state.resources, bundle, 1);
    clampResourceFloor(state.resources);
    manifest.status = status;
    manifest.outcome = outcome;
    manifest.resolvedAtTick = state.tick;
    manifest.payoutApplied = true;
    manifest.events.unshift({ tick: state.tick, event: status, reason, integrity: manifest.integrity });
    clearFreightInspectionQueueInPlace(state, manifest, reason === "window-missed" ? "missed" : "closed");
    state.freight.outcomes[outcome === "full" ? "full" : outcome] += 1;
    if (outcome === "full") {
      state.freight.carryover.completedShipments += 1;
    } else {
      state.freight.routeSecurity.pressure += outcome === "partial" ? 1 : 2;
      state.freight.carryover.lostCargo += Object.values(manifest.cargo.staged).reduce((total, amount) => total + amount, 0);
    }
    if (outcome === "failed") {
      if (state.grid) {
        state.grid.pressure += 1;
      }
      if (state.breach && ["active", "escaped"].includes(state.breach.status)) {
        state.breach.intensity += 1;
      }
    }
    releaseFreightDockLock(state, manifest);
    recordFreightContractOutcomeInPlace(state, manifest, outcome);
    state.log.unshift({ tick: state.tick, message: `${manifest.name} freight ${status}; ${formatBundle(bundle)} applied.` });
    return true;
  }

  function resolveFreightByIntegrityInPlace(state, manifest, reason = "route-resolved") {
    const thresholds = GAME_DATA.freightLockdown.integrity;
    if (manifest.integrity >= thresholds.fullThreshold) {
      return applyFreightOutcomeInPlace(state, manifest, "full", reason);
    }
    if (manifest.integrity >= thresholds.partialThreshold) {
      return applyFreightOutcomeInPlace(state, manifest, "partial", reason);
    }
    return applyFreightOutcomeInPlace(state, manifest, "failed", reason);
  }

  function completeFreightInspectionInPlace(state, completedJob) {
    if (!state.freight || !completedJob.freightDirective) {
      return false;
    }
    const manifest = freightManifestState(state, completedJob.sourceFreightId);
    if (!manifest || freightStatusTerminal(manifest)) {
      return false;
    }
    manifest.inspection.status = "complete";
    manifest.inspection.queued = false;
    manifest.inspection.completedAtTick = state.tick;
    manifest.security.riskRelief += 1;
    manifest.integrity = Math.min(100, manifest.integrity + 4);
    refreshFreightRiskInPlace(state, manifest);
    manifest.events.unshift({ tick: state.tick, event: "inspection-complete" });
    state.log.unshift({ tick: state.tick, message: `${manifest.name} cargo seals inspected.` });
    return true;
  }

  function damageEnrouteFreightInPlace(state, manifest) {
    const risk = refreshFreightRiskInPlace(state, manifest);
    const damage = Math.max(1, Math.ceil(risk / 2));
    manifest.integrity = Math.max(0, manifest.integrity - damage);
    manifest.events.unshift({ tick: state.tick, event: "route-pressure", risk, damage });
    if (risk >= 6 && state.grid) {
      state.grid.pressure += 1;
    }
    if (risk >= 7 && state.breach && state.breach.status === "active") {
      state.breach.intensity += 1;
    }
  }

  function expireFreightWindowsInPlace(state) {
    if (!state.freight) {
      return;
    }
    state.freight.manifests.forEach((manifest) => {
      if (!["available", "staged", "sealed"].includes(manifest.status)) {
        return;
      }
      if (state.tick <= manifest.window.closesAtTick) {
        return;
      }
      manifest.integrity = Math.max(0, manifest.integrity - 20);
      applyFreightOutcomeInPlace(state, manifest, "failed", "window-missed");
    });
  }

  function refreshFreightStatusInPlace(state) {
    if (!state.freight) {
      return;
    }
    if (state.freight.manifests.some((manifest) => manifest.status === "enroute")) {
      state.freight.status = "carrier-enroute";
    } else if (state.freight.manifests.some((manifest) => manifest.status === "sealed")) {
      state.freight.status = "carrier-sealed";
    } else if (state.freight.manifests.some((manifest) => manifest.status === "staged")) {
      state.freight.status = "cargo-staged";
    } else if (state.freight.manifests.some((manifest) => manifest.status === "available")) {
      state.freight.status = "manifest-open";
    } else if (state.freight.carryover.lockdownScar > 0) {
      state.freight.status = "scarred";
    } else {
      state.freight.status = "ready";
    }
  }

  function advanceFreightState(state) {
    if (!state.freight) {
      return;
    }
    openFreightManifestsInPlace(state);
    expireFreightWindowsInPlace(state);
    state.freight.manifests.forEach((manifest) => {
      if (freightStatusTerminal(manifest)) {
        return;
      }
      refreshFreightRiskInPlace(state, manifest);
      if (manifest.status !== "enroute") {
        return;
      }
      damageEnrouteFreightInPlace(state, manifest);
      if (state.tick >= manifest.arrivalTick) {
        resolveFreightByIntegrityInPlace(state, manifest);
      }
    });
    refreshFreightStatusInPlace(state);
  }

  function stageFreightCargo(state, manifestId) {
    const next = clone(state);
    const manifest = freightManifestState(next, manifestId);
    if (!manifest) {
      return withLog(next, "Unknown freight manifest.");
    }
    if (manifest.status === "pending") {
      return withLog(next, `${manifest.name} is not available this shift.`);
    }
    if (manifest.status === "scheduled" || next.tick < manifest.window.opensAtTick) {
      return withLog(next, `${manifest.name} cargo window opens at t${manifest.window.opensAtTick}.`);
    }
    if (!["available", "staged"].includes(manifest.status)) {
      return withLog(next, `${manifest.name} cannot stage cargo while ${manifest.status}.`);
    }
    const remaining = freightCargoRemaining(manifest);
    if (!Object.keys(remaining).length) {
      return withLog(next, `${manifest.name} cargo already staged.`);
    }
    if (!canPay(next.resources, remaining)) {
      return withLog(next, `${manifest.name} staging lacks ${formatBundle(remaining)}.`);
    }
    applyBundle(next.resources, remaining, -1);
    Object.entries(remaining).forEach(([resource, amount]) => {
      manifest.cargo.staged[resource] = (manifest.cargo.staged[resource] || 0) + amount;
    });
    manifest.cargo.stagedAtTick = next.tick;
    manifest.status = "staged";
    manifest.events.unshift({ tick: next.tick, event: "cargo-staged", cargo: clone(remaining) });
    next.freight.choices.cargoStages += 1;
    next.campaign.choices.freightStages += 1;
    refreshFreightRiskInPlace(next, manifest);
    refreshFreightStatusInPlace(next);
    return withLog(next, `${manifest.name} cargo staged from factory stock.`);
  }

  function sealFreightCarrier(state, manifestId) {
    const next = clone(state);
    const manifest = freightManifestState(next, manifestId);
    if (!manifest) {
      return withLog(next, "Unknown freight carrier.");
    }
    if (manifest.status !== "staged") {
      return withLog(next, `${manifest.name} requires staged cargo before seal.`);
    }
    if (!freightCargoFullyStaged(manifest)) {
      return withLog(next, `${manifest.name} cargo is incomplete.`);
    }
    if (!freightWindowOpen(next, manifest)) {
      return withLog(next, `${manifest.name} launch window is closed.`);
    }
    if (!freightDockReady(next, manifest)) {
      return withLog(next, `${manifest.name} dock lane is not ready.`);
    }
    const lane = freightDockLane(next, manifest);
    manifest.status = "sealed";
    manifest.sealedAtTick = next.tick;
    manifest.events.unshift({ tick: next.tick, event: "carrier-sealed", dockId: manifest.dockId });
    markLaneGridLocked(lane, "freight-lockdown");
    if (next.grid) {
      next.grid.pressure += 1;
    }
    next.freight.choices.carrierSeals += 1;
    next.campaign.choices.freightSeals += 1;
    refreshFreightRiskInPlace(next, manifest);
    refreshFreightStatusInPlace(next);
    return withLog(next, `${manifest.name} sealed on ${manifest.dockName}.`);
  }

  function holdFreightManifest(state, manifestId) {
    const next = clone(state);
    const manifest = freightManifestState(next, manifestId);
    const hold = GAME_DATA.freightLockdown.hold;
    if (!manifest || !["available", "staged", "sealed"].includes(manifest.status)) {
      return withLog(next, "No holdable freight manifest.");
    }
    if (!canPay(next.resources, hold.cost)) {
      return withLog(next, `${manifest.name} hold lacks ${formatBundle(hold.cost)}.`);
    }
    applyBundle(next.resources, hold.cost, -1);
    manifest.window.closesAtTick += hold.extensionTicks;
    manifest.route.baseRisk += hold.riskIncrease;
    manifest.integrity = Math.max(0, manifest.integrity - hold.integrityLoss);
    manifest.events.unshift({ tick: next.tick, event: "carrier-held", closesAtTick: manifest.window.closesAtTick });
    next.freight.choices.holds += 1;
    next.campaign.choices.freightHolds += 1;
    next.freight.routeSecurity.pressure += 1;
    refreshFreightRiskInPlace(next, manifest);
    return withLog(next, `${manifest.name} held until t${manifest.window.closesAtTick}.`);
  }

  function assignFreightRouteSecurity(state, manifestId, mode = "drones") {
    const next = clone(state);
    const manifest = freightManifestState(next, manifestId);
    const security = GAME_DATA.freightLockdown.routeSecurity[mode];
    if (!manifest || !["available", "staged", "sealed"].includes(manifest.status)) {
      return withLog(next, "No freight route ready for security assignment.");
    }
    if (!security || !["drones", "defenses"].includes(mode)) {
      return withLog(next, "Unknown freight security assignment.");
    }
    if (!canPay(next.resources, security.cost)) {
      return withLog(next, `${manifest.name} ${mode} assignment lacks ${formatBundle(security.cost)}.`);
    }
    applyBundle(next.resources, security.cost, -1);
    manifest.security[mode] += 1;
    manifest.security.riskRelief += security.riskRelief;
    manifest.security.integrityGuard += security.integrityGuard;
    if (mode === "defenses" && next.breach && next.breach.status === "active") {
      next.breach.intensity = Math.max(0, next.breach.intensity - (security.breachRelief || 0));
    }
    manifest.events.unshift({ tick: next.tick, event: `route-${mode}`, riskRelief: security.riskRelief });
    if (mode === "drones") {
      next.freight.choices.escortDrones += 1;
      next.campaign.choices.freightEscorts += 1;
    } else {
      next.freight.choices.defenseScreens += 1;
      next.campaign.choices.freightDefenseScreens += 1;
    }
    refreshFreightRiskInPlace(next, manifest);
    return withLog(next, `${manifest.name} route security assigned: ${mode}.`);
  }

  function authorizeFreightLaunchClearance(state, manifestId) {
    const next = clone(state);
    const manifest = freightManifestState(next, manifestId);
    const clearance = GAME_DATA.freightLockdown.routeSecurity.reserveClearance;
    if (!manifest || !["available", "staged", "sealed"].includes(manifest.status)) {
      return withLog(next, "No freight launch awaiting clearance.");
    }
    if (manifest.security.reserveClearance) {
      return withLog(next, `${manifest.name} reserve clearance already authorized.`);
    }
    if (!next.grid || next.grid.reserve.available <= 0) {
      return withLog(next, "Reserve batteries are empty.");
    }
    const reserve = GAME_DATA.grid.reserve;
    const sector = gridSectorState(next, manifest.sectorId);
    next.grid.reserve.available -= 1;
    next.grid.reserve.drawn += reserve.drawAmount;
    next.grid.reserve.draws += 1;
    next.grid.reserve.debt += 1;
    next.grid.pressure = Math.max(0, next.grid.pressure - clearance.gridPressureRelief);
    next.grid.choices.reserveDraws += 1;
    next.campaign.choices.reserveDraws += 1;
    if (sector) {
      sector.reserveDraws += 1;
      sector.powered = true;
    }
    manifest.security.reserveClearance = true;
    manifest.security.riskRelief += clearance.riskRelief;
    manifest.security.integrityGuard += clearance.integrityGuard;
    manifest.events.unshift({ tick: next.tick, event: "reserve-clearance" });
    next.freight.choices.reserveClearances += 1;
    next.campaign.choices.freightReserveClearances += 1;
    refreshFreightRiskInPlace(next, manifest);
    return withLog(next, `${manifest.name} reserve launch clearance authorized.`);
  }

  function rerouteFreightManifest(state, manifestId, sectorId = null) {
    const next = clone(state);
    const manifest = freightManifestState(next, manifestId);
    const reroute = GAME_DATA.freightLockdown.routeSecurity.reroute;
    if (!manifest || !["available", "staged", "sealed"].includes(manifest.status)) {
      return withLog(next, "No freight route available to reroute.");
    }
    if (manifest.route.rerouted) {
      return withLog(next, `${manifest.name} route already rerouted.`);
    }
    if (!canPay(next.resources, reroute.cost)) {
      return withLog(next, `${manifest.name} reroute lacks ${formatBundle(reroute.cost)}.`);
    }
    applyBundle(next.resources, reroute.cost, -1);
    manifest.route.rerouted = true;
    manifest.route.reroutedAround = sectorId || manifest.sectorId;
    manifest.route.delayTicks += reroute.delayTicks;
    manifest.window.closesAtTick += reroute.delayTicks;
    manifest.security.riskRelief += reroute.riskRelief;
    manifest.integrity = Math.max(0, manifest.integrity - reroute.integrityLoss);
    manifest.events.unshift({ tick: next.tick, event: "route-rerouted", sectorId: manifest.route.reroutedAround });
    next.freight.choices.reroutes += 1;
    next.campaign.choices.freightReroutes += 1;
    refreshFreightRiskInPlace(next, manifest);
    return withLog(next, `${manifest.name} rerouted around ${titleCase(manifest.route.reroutedAround)}.`);
  }

  function launchFreightManifest(state, manifestId) {
    const next = clone(state);
    const manifest = freightManifestState(next, manifestId);
    const definition = manifest ? freightManifestDefinition(manifest.id) : null;
    if (!manifest || !definition) {
      return withLog(next, "Unknown freight launch.");
    }
    if (manifest.status !== "sealed") {
      return withLog(next, `${manifest.name} is not sealed for launch.`);
    }
    if (!freightWindowOpen(next, manifest)) {
      return withLog(next, `${manifest.name} launch window is closed.`);
    }
    const risk = refreshFreightRiskInPlace(next, manifest);
    const launchDamage = Math.max(0, risk * 3 - manifest.security.integrityGuard);
    manifest.integrity = Math.max(0, Math.min(100, manifest.integrity - launchDamage));
    manifest.status = "enroute";
    manifest.launchedAtTick = next.tick;
    manifest.arrivalTick = next.tick + definition.travelTicks + manifest.route.delayTicks;
    clearFreightInspectionQueueInPlace(next, manifest, "launched");
    manifest.events.unshift({ tick: next.tick, event: "carrier-launched", risk, launchDamage, arrivalTick: manifest.arrivalTick });
    if (next.grid) {
      next.grid.pressure += Math.ceil(risk / 4);
    }
    if (next.breach && next.breach.status === "active") {
      next.breach.intensity += Math.floor(risk / 6);
    }
    next.freight.choices.launches += 1;
    next.campaign.choices.freightLaunches += 1;
    releaseFreightDockLock(next, manifest);
    refreshFreightStatusInPlace(next);
    return withLog(next, `${manifest.name} launched; route risk ${risk}.`);
  }

  function railSabotageIncidentState(state, incidentId) {
    return state.railSabotage && Array.isArray(state.railSabotage.incidents)
      ? byId(state.railSabotage.incidents, incidentId)
      : null;
  }

  function railSabotageStatusTerminal(incident) {
    return ["contained", "partial", "failed"].includes(incident.status);
  }

  function railSabotageIncidentActionable(incident) {
    return incident && ["available", "scanned", "patrolled", "decoyed", "locked"].includes(incident.status);
  }

  function activeRailSabotageIncidentForManifest(state, manifestId) {
    if (!state.railSabotage || !Array.isArray(state.railSabotage.incidents)) {
      return null;
    }
    return state.railSabotage.incidents.find((incident) => (
      incident.manifestId === manifestId && railSabotageIncidentActionable(incident)
    )) || null;
  }

  function tagFreightManifestForSabotageInPlace(state, incident) {
    const manifest = freightManifestState(state, incident.manifestId);
    if (!manifest) {
      return null;
    }
    if (!manifest.sabotage) {
      manifest.sabotage = {
        suspect: false,
        incidentId: null,
        scanStatus: "clear",
        patrolDrones: 0,
        patrolDefenses: 0,
        decoy: false,
        dockLocked: false,
        integrityDamage: 0,
      };
    }
    manifest.sabotage.suspect = true;
    manifest.sabotage.incidentId = incident.id;
    if (manifest.sabotage.scanStatus === "clear") {
      manifest.sabotage.scanStatus = "suspect";
    }
    return manifest;
  }

  function clearSabotageSweepQueueInPlace(state, incident, status = "closed") {
    const beforeLength = state.queue.length;
    state.queue = state.queue.filter((entry) => !(
      entry.sabotageDirective && entry.sourceSabotageId === incident.id
    ));
    if (state.queue.length !== beforeLength) {
      normalizeQueuePriorities(state);
    }
    if (incident.scan.status !== "complete") {
      incident.scan.status = status;
    }
    incident.scan.queued = false;
  }

  function queueSabotageSweep(state, incident) {
    const jobTypeId = GAME_DATA.railSabotage.sweep.jobTypeId;
    if (!jobTypeId || incident.scan.status === "complete") {
      return false;
    }
    const alreadyQueued = state.queue.some((entry) => (
      entry.sabotageDirective && entry.sourceSabotageId === incident.id
    ));
    const alreadyAssigned = state.lanes.some((lane) => (
      lane.currentJob && lane.currentJob.sabotageDirective && lane.currentJob.sourceSabotageId === incident.id
    ));
    if (alreadyQueued || alreadyAssigned) {
      incident.scan.queued = true;
      incident.scan.status = "queued";
      return false;
    }
    state.queue.unshift(createQueueEntry(state, jobTypeId, 1, {
      sabotageDirective: true,
      sourceSabotageId: incident.id,
    }));
    incident.scan.queued = true;
    incident.scan.status = "queued";
    applyQueuePolicy(state);
    return true;
  }

  function refreshRailSabotageIncidentPressureInPlace(state, incident) {
    let pressure = incident.pressure.base - incident.pressure.mitigation;
    const manifest = freightManifestState(state, incident.manifestId);
    if (manifest && manifest.status === "enroute") {
      pressure += 1;
    }
    if (state.grid && state.grid.audit.status === "active") {
      pressure += 1;
    }
    if (state.grid && state.grid.reserve.available <= 0) {
      pressure += 1;
    }
    if (hasActiveEmergency(state)) {
      pressure += 1;
    }
    if (state.breach && state.breach.status === "active") {
      pressure += 1;
    }
    if (manifest && manifest.route && manifest.route.contaminatedExposure) {
      pressure += 1;
    }
    if (manifest && manifest.security && manifest.security.reserveClearance) {
      pressure -= 1;
    }
    incident.pressure.current = Math.max(0, pressure);
    return incident.pressure.current;
  }

  function refreshRailSabotagePressureInPlace(state) {
    if (!state.railSabotage) {
      return;
    }
    const activePressure = state.railSabotage.incidents.reduce((total, incident) => {
      if (!railSabotageIncidentActionable(incident)) {
        return total;
      }
      return total + refreshRailSabotageIncidentPressureInPlace(state, incident);
    }, 0);
    state.railSabotage.pressure = Math.max(0, (state.railSabotage.carryover.sabotageScar || 0) + activePressure);
  }

  function railSabotageMitigationScore(incident) {
    let score = 0;
    if (incident.scan.status === "complete") {
      score += 2;
    }
    score += incident.patrol.drones * 2;
    score += incident.patrol.defenses * 2;
    if (incident.decoy.deployed) {
      score += 2;
    }
    if (incident.dock.locked) {
      score += 1;
    }
    if (incident.containment.intercepted) {
      score += 2;
    }
    if (incident.carrier.rerouted) {
      score += 1;
    }
    if (incident.laneDamage.status === "repaired") {
      score += 1;
    }
    return score;
  }

  function recordRailSabotageContractOutcomeInPlace(state, incident, outcome) {
    const contract = byId(state.contracts, incident.contractId);
    if (!contract) {
      return;
    }
    if (!Array.isArray(contract.sabotageOutcomes)) {
      contract.sabotageOutcomes = [];
    }
    contract.sabotageOutcomes.unshift({
      incidentId: incident.id,
      outcome,
      pressure: incident.pressure.current,
      tick: state.tick,
    });
    if (outcome === "contained" && contract.status === "active") {
      contract.timeRemaining += 1;
    } else if (outcome === "failed" && contract.status === "active") {
      contract.timeRemaining = Math.max(0, contract.timeRemaining - 2);
    }
  }

  function applyRailSabotageOutcomeInPlace(state, incident, outcome, reason = "alert-window") {
    if (!state.railSabotage || railSabotageStatusTerminal(incident)) {
      return false;
    }
    const definition = railSabotageIncidentDefinition(incident.id);
    if (!definition) {
      return false;
    }
    const manifest = freightManifestState(state, incident.manifestId);
    const lane = byId(state.lanes, incident.laneId);
    const sector = gridSectorState(state, incident.sectorId);
    const bundle = outcome === "contained"
      ? definition.mitigation
      : outcome === "partial" ? definition.partialPenalty : definition.failurePenalty;
    applyBundle(state.resources, bundle, 1);
    clampResourceFloor(state.resources);
    incident.status = outcome;
    incident.outcome = outcome;
    incident.resolvedAtTick = state.tick;
    incident.containment.status = outcome;
    incident.events.unshift({
      tick: state.tick,
      event: outcome,
      reason,
      score: railSabotageMitigationScore(incident),
    });
    clearSabotageSweepQueueInPlace(state, incident, outcome);
    state.railSabotage.outcomes[outcome] += 1;
    if (manifest && !manifest.sabotage) {
      tagFreightManifestForSabotageInPlace(state, incident);
    }
    if (outcome === "contained") {
      state.railSabotage.carryover.containedCells += 1;
      if (state.grid) {
        state.grid.pressure = Math.max(0, state.grid.pressure - 1);
      }
      if (state.breach && state.breach.status === "active") {
        state.breach.intensity = Math.max(0, state.breach.intensity - 1);
      }
    } else {
      const damage = outcome === "partial" ? definition.partialIntegrityDamage : definition.failureIntegrityDamage;
      if (manifest && !freightStatusTerminal(manifest)) {
        manifest.integrity = Math.max(0, manifest.integrity - damage);
        manifest.sabotage.integrityDamage += damage;
        manifest.events.unshift({ tick: state.tick, event: "sabotage-tamper", incidentId: incident.id, damage });
      }
      incident.carrier.integrityDamage += damage;
      state.railSabotage.carryover.tamperedCargo = Math.min(
        24,
        state.railSabotage.carryover.tamperedCargo + definition.tamperValue
      );
      if (state.freight) {
        state.freight.routeSecurity.pressure += outcome === "partial" ? 1 : 2;
        state.freight.routeSecurity.events.unshift({ tick: state.tick, event: "rail-sabotage", incidentId: incident.id, outcome });
      }
      if (state.grid) {
        state.grid.pressure += outcome === "partial" ? 1 : definition.gridPressure;
      }
      if (state.breach && ["active", "escaped"].includes(state.breach.status)) {
        state.breach.intensity += outcome === "partial" ? 1 : definition.breachIntensity;
      }
    }
    if (outcome === "failed") {
      incident.laneDamage.status = "sabotaged";
      if (lane && (!lane.gridLock || lane.gridLock.reason === "rail-sabotage-lockdown")) {
        markLaneGridLocked(lane, "rail-sabotage");
      }
      if (sector) {
        sector.powered = false;
      }
      state.railSabotage.carryover.sabotageScar = Math.min(
        12,
        state.railSabotage.carryover.sabotageScar + definition.scarValue
      );
      if (!state.railSabotage.carryover.damagedLanes.includes(incident.laneId)) {
        state.railSabotage.carryover.damagedLanes.push(incident.laneId);
      }
    }
    recordRailSabotageContractOutcomeInPlace(state, incident, outcome);
    refreshRailSabotagePressureInPlace(state);
    state.log.unshift({ tick: state.tick, message: `${incident.name} sabotage ${outcome}; ${formatBundle(bundle)} applied.` });
    return true;
  }

  function resolveRailSabotageIncidentInPlace(state, incident, reason = "alert-window") {
    const score = railSabotageMitigationScore(incident);
    if (score >= incident.containment.requiredScore) {
      return applyRailSabotageOutcomeInPlace(state, incident, "contained", reason);
    }
    if (score >= incident.containment.partialScore) {
      return applyRailSabotageOutcomeInPlace(state, incident, "partial", reason);
    }
    return applyRailSabotageOutcomeInPlace(state, incident, "failed", reason);
  }

  function openRailSabotageIncidentsInPlace(state) {
    if (!state.railSabotage) {
      return;
    }
    state.railSabotage.incidents.forEach((incident) => {
      if (state.campaign.shift < incident.availableShift) {
        return;
      }
      if (incident.status === "pending") {
        incident.status = "scheduled";
      }
      if (incident.status !== "scheduled" || state.tick < incident.window.opensAtTick) {
        return;
      }
      incident.status = "available";
      incident.openedAtTick = state.tick;
      incident.scan.status = "suspect";
      tagFreightManifestForSabotageInPlace(state, incident);
      queueSabotageSweep(state, incident);
      refreshRailSabotageIncidentPressureInPlace(state, incident);
      if (state.freight) {
        state.freight.routeSecurity.pressure += 1;
        state.freight.routeSecurity.events.unshift({ tick: state.tick, event: "suspect-manifest", incidentId: incident.id });
      }
      incident.events.unshift({ tick: state.tick, event: "incident-opened", pressure: incident.pressure.current });
      state.log.unshift({ tick: state.tick, message: `${incident.name} flagged ${incident.dockName} manifest sabotage.` });
    });
  }

  function refreshRailSabotageStatusInPlace(state) {
    if (!state.railSabotage) {
      return;
    }
    if (state.railSabotage.incidents.some((incident) => incident.status === "failed")) {
      state.railSabotage.status = "sabotaged";
    } else if (state.railSabotage.incidents.some((incident) => railSabotageIncidentActionable(incident))) {
      state.railSabotage.status = "incident-open";
    } else if (state.railSabotage.outcomes.partial > 0) {
      state.railSabotage.status = "tampered";
    } else if (state.railSabotage.outcomes.contained > 0) {
      state.railSabotage.status = "contained";
    } else if (state.railSabotage.carryover.sabotageScar > 0) {
      state.railSabotage.status = "scarred";
    } else {
      state.railSabotage.status = "ready";
    }
  }

  function advanceRailSabotageState(state) {
    if (!state.railSabotage) {
      return;
    }
    openRailSabotageIncidentsInPlace(state);
    state.railSabotage.incidents.forEach((incident) => {
      if (!railSabotageIncidentActionable(incident)) {
        return;
      }
      refreshRailSabotageIncidentPressureInPlace(state, incident);
      if (state.tick > incident.window.closesAtTick) {
        resolveRailSabotageIncidentInPlace(state, incident, "alert-window");
      }
    });
    refreshRailSabotagePressureInPlace(state);
    refreshRailSabotageStatusInPlace(state);
  }

  function applySabotageScanInPlace(state, incident, source = "manual") {
    if (!railSabotageIncidentActionable(incident) || incident.scan.status === "complete") {
      return false;
    }
    const scan = GAME_DATA.railSabotage.scan;
    incident.scan.status = "complete";
    incident.scan.queued = false;
    incident.scan.completedAtTick = state.tick;
    incident.status = "scanned";
    incident.pressure.mitigation += scan.pressureRelief;
    incident.events.unshift({ tick: state.tick, event: "manifest-scanned", source });
    clearSabotageSweepQueueInPlace(state, incident, "complete");
    const manifest = tagFreightManifestForSabotageInPlace(state, incident);
    if (manifest) {
      manifest.sabotage.scanStatus = "complete";
      manifest.security.riskRelief += scan.riskRelief;
      manifest.security.integrityGuard += scan.integrityGuard;
      manifest.integrity = Math.min(100, manifest.integrity + 4);
      refreshFreightRiskInPlace(state, manifest);
    }
    state.railSabotage.choices.scans += 1;
    state.campaign.choices.sabotageScans += 1;
    refreshRailSabotagePressureInPlace(state);
    return true;
  }

  function completeSabotageSweepInPlace(state, completedJob) {
    if (!state.railSabotage || !completedJob.sabotageDirective) {
      return false;
    }
    const incident = railSabotageIncidentState(state, completedJob.sourceSabotageId);
    if (!incident) {
      return false;
    }
    const applied = applySabotageScanInPlace(state, incident, "sweep-job");
    if (applied) {
      state.log.unshift({ tick: state.tick, message: `${incident.name} sweep marked the suspect manifest.` });
    }
    return applied;
  }

  function scanSabotageManifest(state, incidentId) {
    const next = clone(state);
    const incident = railSabotageIncidentState(next, incidentId);
    const scan = GAME_DATA.railSabotage.scan;
    if (!railSabotageIncidentActionable(incident)) {
      return withLog(next, "No suspect sabotage manifest is available to scan.");
    }
    if (incident.scan.status === "complete") {
      return withLog(next, `${incident.name} manifest already scanned.`);
    }
    if (!canPay(next.resources, scan.cost)) {
      return withLog(next, `${incident.name} scan lacks ${formatBundle(scan.cost)}.`);
    }
    applyBundle(next.resources, scan.cost, -1);
    applySabotageScanInPlace(next, incident, "manual");
    return withLog(next, `${incident.name} suspect manifest scanned.`);
  }

  function assignSabotagePatrol(state, incidentId, mode = "drones") {
    const next = clone(state);
    const incident = railSabotageIncidentState(next, incidentId);
    const patrol = GAME_DATA.railSabotage.patrols[mode];
    if (!railSabotageIncidentActionable(incident)) {
      return withLog(next, "No sabotage incident is ready for patrol assignment.");
    }
    if (!patrol || !["drones", "defenses"].includes(mode)) {
      return withLog(next, "Unknown sabotage patrol assignment.");
    }
    if (!canPay(next.resources, patrol.cost)) {
      return withLog(next, `${incident.name} ${mode} patrol lacks ${formatBundle(patrol.cost)}.`);
    }
    applyBundle(next.resources, patrol.cost, -1);
    incident.patrol[mode] += 1;
    incident.patrol.status = "assigned";
    incident.status = "patrolled";
    incident.pressure.mitigation += patrol.pressureRelief;
    incident.events.unshift({ tick: next.tick, event: `patrol-${mode}`, pressureRelief: patrol.pressureRelief });
    const manifest = tagFreightManifestForSabotageInPlace(next, incident);
    if (manifest) {
      if (mode === "drones") {
        manifest.sabotage.patrolDrones += 1;
      } else {
        manifest.sabotage.patrolDefenses += 1;
      }
      manifest.security.riskRelief += patrol.riskRelief;
      manifest.security.integrityGuard += patrol.integrityGuard;
      refreshFreightRiskInPlace(next, manifest);
    }
    if (mode === "drones") {
      next.railSabotage.choices.patrolDrones += 1;
      next.campaign.choices.sabotagePatrolDrones += 1;
    } else {
      next.railSabotage.choices.defenseScreens += 1;
      next.campaign.choices.sabotageDefenseScreens += 1;
      if (next.breach && next.breach.status === "active") {
        next.breach.intensity = Math.max(0, next.breach.intensity - (patrol.breachRelief || 0));
      }
    }
    refreshRailSabotagePressureInPlace(next);
    return withLog(next, `${incident.name} dock patrol assigned: ${mode}.`);
  }

  function deploySabotageDecoy(state, incidentId, routeId = null) {
    const next = clone(state);
    const incident = railSabotageIncidentState(next, incidentId);
    const decoy = GAME_DATA.railSabotage.decoy;
    if (!railSabotageIncidentActionable(incident)) {
      return withLog(next, "No sabotage incident is ready for decoy routing.");
    }
    if (incident.decoy.deployed) {
      return withLog(next, `${incident.name} decoy route already deployed.`);
    }
    if (!canPay(next.resources, decoy.cost)) {
      return withLog(next, `${incident.name} decoy lacks ${formatBundle(decoy.cost)}.`);
    }
    applyBundle(next.resources, decoy.cost, -1);
    incident.decoy.deployed = true;
    incident.decoy.routeId = routeId || incident.sectorId;
    incident.decoy.deployedAtTick = next.tick;
    incident.status = "decoyed";
    incident.pressure.mitigation += decoy.pressureRelief;
    incident.events.unshift({ tick: next.tick, event: "decoy-deployed", routeId: incident.decoy.routeId });
    const manifest = tagFreightManifestForSabotageInPlace(next, incident);
    if (manifest) {
      manifest.sabotage.decoy = true;
      manifest.route.delayTicks += decoy.delayTicks;
      manifest.window.closesAtTick += decoy.delayTicks;
      manifest.security.riskRelief += decoy.riskRelief;
      manifest.security.integrityGuard += decoy.integrityGuard;
      refreshFreightRiskInPlace(next, manifest);
    }
    if (next.freight) {
      next.freight.routeSecurity.pressure = Math.max(0, next.freight.routeSecurity.pressure - 1);
    }
    next.railSabotage.choices.decoys += 1;
    next.campaign.choices.sabotageDecoys += 1;
    refreshRailSabotagePressureInPlace(next);
    return withLog(next, `${incident.name} decoy manifest deployed.`);
  }

  function lockdownSabotageDock(state, incidentId) {
    const next = clone(state);
    const incident = railSabotageIncidentState(next, incidentId);
    const lockdown = GAME_DATA.railSabotage.dockLockdown;
    if (!railSabotageIncidentActionable(incident)) {
      return withLog(next, "No sabotage incident is ready for dock lockdown.");
    }
    if (incident.dock.locked) {
      return withLog(next, `${incident.dockName} already locked down.`);
    }
    if (!canPay(next.resources, lockdown.cost)) {
      return withLog(next, `${incident.dockName} lockdown lacks ${formatBundle(lockdown.cost)}.`);
    }
    const lane = byId(next.lanes, incident.laneId);
    if (lane && lane.gridLock && lane.gridLock.reason !== "rail-sabotage-lockdown") {
      return withLog(next, `${incident.dockName} is already locked by ${lane.gridLock.reason}.`);
    }
    applyBundle(next.resources, lockdown.cost, -1);
    if (lane) {
      markLaneGridLocked(lane, "rail-sabotage-lockdown");
    }
    incident.dock.locked = true;
    incident.dock.lockedAtTick = next.tick;
    incident.status = "locked";
    incident.pressure.mitigation += lockdown.pressureRelief;
    incident.events.unshift({ tick: next.tick, event: "dock-locked" });
    const manifest = tagFreightManifestForSabotageInPlace(next, incident);
    if (manifest) {
      manifest.sabotage.dockLocked = true;
    }
    if (next.grid) {
      next.grid.pressure += lockdown.gridPressure;
    }
    next.railSabotage.choices.dockLockdowns += 1;
    next.campaign.choices.sabotageDockLockdowns += 1;
    refreshRailSabotagePressureInPlace(next);
    return withLog(next, `${incident.dockName} locked down for sabotage containment.`);
  }

  function reopenSabotageDock(state, incidentId) {
    const next = clone(state);
    const incident = railSabotageIncidentState(next, incidentId);
    if (!incident || !incident.dock.locked) {
      return withLog(next, "No sabotage dock lockdown is active.");
    }
    const lane = byId(next.lanes, incident.laneId);
    restoreLaneGridLock(lane, "rail-sabotage-lockdown");
    incident.dock.locked = false;
    incident.dock.reopenedAtTick = next.tick;
    if (!railSabotageStatusTerminal(incident)) {
      incident.status = incident.scan.status === "complete" ? "scanned" : "available";
    }
    const manifest = freightManifestState(next, incident.manifestId);
    if (manifest && manifest.sabotage) {
      manifest.sabotage.dockLocked = false;
    }
    incident.events.unshift({ tick: next.tick, event: "dock-reopened" });
    next.railSabotage.choices.dockReopens += 1;
    next.campaign.choices.sabotageDockReopens += 1;
    refreshRailSabotagePressureInPlace(next);
    return withLog(next, `${incident.dockName} reopened after sabotage sweep.`);
  }

  function interceptSabotageCell(state, incidentId) {
    const next = clone(state);
    const incident = railSabotageIncidentState(next, incidentId);
    const intercept = GAME_DATA.railSabotage.intercept;
    if (!railSabotageIncidentActionable(incident)) {
      return withLog(next, "No sabotage cell is available to intercept.");
    }
    if (incident.containment.intercepted) {
      return withLog(next, `${incident.name} cell already intercepted.`);
    }
    if (!canPay(next.resources, intercept.cost)) {
      return withLog(next, `${incident.name} intercept lacks ${formatBundle(intercept.cost)}.`);
    }
    applyBundle(next.resources, intercept.cost, -1);
    incident.containment.intercepted = true;
    incident.pressure.mitigation += intercept.pressureRelief;
    incident.events.unshift({ tick: next.tick, event: "cell-intercepted" });
    const manifest = tagFreightManifestForSabotageInPlace(next, incident);
    if (manifest) {
      manifest.security.integrityGuard += intercept.integrityGuard;
      refreshFreightRiskInPlace(next, manifest);
    }
    next.railSabotage.choices.interceptions += 1;
    next.campaign.choices.sabotageInterceptions += 1;
    resolveRailSabotageIncidentInPlace(next, incident, "intercept");
    refreshRailSabotageStatusInPlace(next);
    return withLog(next, `${incident.name} interception resolved as ${incident.outcome}.`);
  }

  function rerouteSabotagedCarrier(state, incidentId, routeId = null) {
    const next = clone(state);
    const incident = railSabotageIncidentState(next, incidentId);
    const reroute = GAME_DATA.railSabotage.carrierReroute;
    if (!railSabotageIncidentActionable(incident)) {
      return withLog(next, "No compromised carrier is ready to reroute.");
    }
    if (incident.carrier.rerouted) {
      return withLog(next, `${incident.name} carrier already rerouted.`);
    }
    if (!canPay(next.resources, reroute.cost)) {
      return withLog(next, `${incident.name} carrier reroute lacks ${formatBundle(reroute.cost)}.`);
    }
    applyBundle(next.resources, reroute.cost, -1);
    incident.carrier.rerouted = true;
    incident.pressure.mitigation += reroute.pressureRelief;
    incident.events.unshift({ tick: next.tick, event: "carrier-rerouted", routeId: routeId || incident.sectorId });
    const manifest = tagFreightManifestForSabotageInPlace(next, incident);
    if (manifest) {
      manifest.route.rerouted = true;
      manifest.route.reroutedAround = routeId || incident.sectorId;
      manifest.route.delayTicks += reroute.delayTicks;
      manifest.window.closesAtTick += reroute.delayTicks;
      manifest.security.riskRelief += reroute.riskRelief;
      manifest.integrity = Math.max(0, manifest.integrity - reroute.integrityLoss);
      refreshFreightRiskInPlace(next, manifest);
    }
    next.railSabotage.choices.carrierReroutes += 1;
    next.campaign.choices.sabotageCarrierReroutes += 1;
    refreshRailSabotagePressureInPlace(next);
    return withLog(next, `${incident.name} compromised carrier rerouted.`);
  }

  function repairSabotagedLane(state, incidentId) {
    const next = clone(state);
    const incident = railSabotageIncidentState(next, incidentId);
    const repair = GAME_DATA.railSabotage.laneRepair;
    if (!incident || !["sabotaged", "scarred"].includes(incident.laneDamage.status)) {
      return withLog(next, "No sabotaged lane is awaiting repair.");
    }
    if (incident.laneDamage.status === "repaired") {
      return withLog(next, `${incident.name} lane already repaired.`);
    }
    if (!canPay(next.resources, repair.cost)) {
      return withLog(next, `${incident.name} lane repair lacks ${formatBundle(repair.cost)}.`);
    }
    applyBundle(next.resources, repair.cost, -1);
    const lane = byId(next.lanes, incident.laneId);
    const sector = gridSectorState(next, incident.sectorId);
    restoreLaneGridLock(lane, "rail-sabotage");
    restoreLaneGridLock(lane, "rail-sabotage-lockdown");
    if (sector) {
      sector.powered = !sector.isolated;
    }
    incident.laneDamage.status = "repaired";
    incident.laneDamage.repairedAtTick = next.tick;
    incident.pressure.mitigation += repair.pressureRelief;
    incident.events.unshift({ tick: next.tick, event: "lane-repaired" });
    next.railSabotage.carryover.damagedLanes = next.railSabotage.carryover.damagedLanes
      .filter((laneId) => laneId !== incident.laneId);
    next.railSabotage.choices.laneRepairs += 1;
    next.campaign.choices.sabotageLaneRepairs += 1;
    refreshRailSabotagePressureInPlace(next);
    return withLog(next, `${incident.name} lane sabotage repaired.`);
  }

  function crisisCaseState(state, caseId) {
    return state.crisisArbitration && Array.isArray(state.crisisArbitration.cases)
      ? byId(state.crisisArbitration.cases, caseId)
      : null;
  }

  function crisisCaseStatusTerminal(caseState) {
    return caseState && ["binding", "partial", "failed"].includes(caseState.status);
  }

  function crisisCaseActionable(caseState) {
    return caseState && ["open", "evidence-ready", "deferred", "protected"].includes(caseState.status);
  }

  function crisisLinkedState(state, caseState) {
    const links = caseState ? caseState.linked : {};
    return {
      lane: byId(state.lanes, links.laneId),
      sector: gridSectorState(state, links.sectorId),
      source: links.breachSourceId ? breachSourceDefinition(links.breachSourceId) : null,
      manifest: freightManifestState(state, links.manifestId),
      incident: railSabotageIncidentState(state, links.railIncidentId),
      contract: byId(state.contracts, links.contractId),
    };
  }

  function crisisPriorityChoiceCounter(priorityId) {
    return {
      "grid-first": "gridFirstRulings",
      "freight-first": "freightFirstRulings",
      "breach-first": "breachFirstRulings",
      "rail-first": "railFirstRulings",
    }[priorityId] || null;
  }

  function campaignCrisisPriorityChoiceCounter(priorityId) {
    return {
      "grid-first": "crisisGridFirstRulings",
      "freight-first": "crisisFreightFirstRulings",
      "breach-first": "crisisBreachFirstRulings",
      "rail-first": "crisisRailFirstRulings",
    }[priorityId] || null;
  }

  function crisisEvidenceProfile(state, caseState, sourceId) {
    const source = GAME_DATA.crisisArbitration.evidenceSources[sourceId];
    const linked = crisisLinkedState(state, caseState);
    const detail = [];
    let score = source ? source.score : 0;
    if (sourceId === "queue") {
      const heldEntries = state.queue.filter((entry) => entry.status === "held").length;
      const directiveEntries = state.queue.filter((entry) => (
        entry.gridDirective || entry.breachDirective || entry.freightDirective || entry.sabotageDirective || entry.emergency
      )).length;
      if (state.campaign.queuePolicy === "emergency-first") {
        score += 1;
      }
      if (heldEntries > 0) {
        score += 1;
      }
      if (directiveEntries > 0) {
        score += 1;
      }
      detail.push(`${state.campaign.queuePolicy} queue`, `${heldEntries} held`, `${directiveEntries} directive`);
    }
    if (sourceId === "lane") {
      if (linked.lane && laneGridAvailable(state, linked.lane)) {
        score += 1;
      }
      if (linked.lane && linked.lane.overdrive && linked.lane.overdrive.active) {
        score += 1;
      }
      if (linked.lane && linked.lane.gridLock) {
        score -= 1;
        detail.push(`locked ${linked.lane.gridLock.reason}`);
      }
      detail.push(linked.lane ? linked.lane.status : "lane missing");
    }
    if (sourceId === "grid") {
      if (linked.sector && linked.sector.route === "priority") {
        score += 2;
      }
      if (linked.sector && linked.sector.isolated) {
        score += 1;
      }
      if (linked.sector && linked.sector.reserveDraws > 0) {
        score += 1;
      }
      if (state.grid && state.grid.audit.status === "active") {
        score += 1;
      }
      detail.push(linked.sector ? `${linked.sector.route} route` : "sector missing");
    }
    if (sourceId === "breach") {
      const sectorBreach = linked.sector && linked.sector.breach ? linked.sector.breach.status : "clean";
      if (state.breach && ["active", "escaped", "contained"].includes(state.breach.status)) {
        score += 1;
      }
      if (["contaminated", "quarantined", "scarred"].includes(sectorBreach)) {
        score += 1;
      }
      if (state.breach && (
        state.breach.choices.cleanses
        || state.breach.choices.quarantines
        || state.breach.choices.traces
        || state.breach.choices.countermeasureJobs
      )) {
        score += 1;
      }
      detail.push(state.breach ? state.breach.status : "breach missing", `sector ${sectorBreach}`);
    }
    if (sourceId === "freight") {
      if (linked.manifest && ["staged", "sealed", "enroute", "complete", "partial"].includes(linked.manifest.status)) {
        score += 2;
      } else if (linked.manifest && linked.manifest.status === "available") {
        score += 1;
      }
      if (linked.manifest && Object.keys(linked.manifest.cargo.staged || {}).length) {
        score += 1;
      }
      if (linked.manifest && linked.manifest.security && (
        linked.manifest.security.drones
        || linked.manifest.security.defenses
        || linked.manifest.security.reserveClearance
        || linked.manifest.route.rerouted
      )) {
        score += 1;
      }
      detail.push(linked.manifest ? linked.manifest.status : "manifest missing");
    }
    if (sourceId === "rail") {
      if (linked.incident && linked.incident.scan.status === "complete") {
        score += 2;
      }
      if (linked.incident && (linked.incident.patrol.drones || linked.incident.patrol.defenses)) {
        score += 1;
      }
      if (linked.incident && linked.incident.dock.locked) {
        score += 1;
      }
      if (linked.incident && linked.incident.outcome === "contained") {
        score += 2;
      }
      detail.push(linked.incident ? linked.incident.status : "incident missing");
    }
    return {
      score: Math.max(0, score),
      detail: detail.join(" / ") || "baseline",
    };
  }

  function refreshCrisisCasePressureInPlace(state, caseState) {
    if (!caseState || crisisCaseStatusTerminal(caseState)) {
      return 0;
    }
    const linked = crisisLinkedState(state, caseState);
    let pressure = caseState.pressure.base;
    if (state.campaign.queuePolicy === "emergency-first" && hasActiveEmergency(state)) {
      pressure += 1;
    }
    if (linked.lane && linked.lane.overdrive && linked.lane.overdrive.active) {
      pressure += 1;
    }
    if (linked.lane && linked.lane.gridLock) {
      pressure += 1;
    }
    if (linked.sector && (linked.sector.isolated || !linked.sector.powered)) {
      pressure += 1;
    }
    if (state.grid && state.grid.pressure >= Math.max(5, state.grid.threshold - 3)) {
      pressure += 1;
    }
    if (state.breach && ["active", "escaped"].includes(state.breach.status)) {
      pressure += 1;
    }
    if (linked.manifest && ["sealed", "enroute"].includes(linked.manifest.status)) {
      pressure += 1;
    }
    if (linked.incident && railSabotageIncidentActionable(linked.incident)) {
      pressure += 1;
    }
    pressure -= Math.floor(caseState.evidence.score / 3);
    pressure -= caseState.protection.score || 0;
    caseState.pressure.current = Math.max(0, pressure);
    return caseState.pressure.current;
  }

  function refreshCrisisArbitrationPressureInPlace(state) {
    if (!state.crisisArbitration) {
      return;
    }
    const activePressure = state.crisisArbitration.cases.reduce((total, caseState) => (
      crisisCaseActionable(caseState) ? total + refreshCrisisCasePressureInPlace(state, caseState) : total
    ), 0);
    state.crisisArbitration.pressure = Math.max(
      0,
      (state.crisisArbitration.carryover.arbitrationScar || 0) + activePressure
    );
  }

  function refreshCrisisArbitrationStatusInPlace(state) {
    if (!state.crisisArbitration) {
      return;
    }
    if (state.crisisArbitration.cases.some((caseState) => caseState.status === "failed")) {
      state.crisisArbitration.status = "scarred";
    } else if (state.crisisArbitration.cases.some((caseState) => crisisCaseActionable(caseState))) {
      state.crisisArbitration.status = "docket-open";
    } else if (state.crisisArbitration.outcomes.binding > 0) {
      state.crisisArbitration.status = "ruled";
    } else if (state.crisisArbitration.carryover.arbitrationScar > 0) {
      state.crisisArbitration.status = "scarred";
    } else {
      state.crisisArbitration.status = "ready";
    }
  }

  function openCrisisCasesInPlace(state) {
    if (!state.crisisArbitration) {
      return;
    }
    state.crisisArbitration.cases.forEach((caseState) => {
      if (state.campaign.shift < caseState.availableShift) {
        return;
      }
      if (caseState.status === "pending") {
        caseState.status = "scheduled";
      }
      if (caseState.status !== "scheduled" || state.tick < caseState.window.opensAtTick) {
        return;
      }
      caseState.status = "open";
      caseState.openedAtTick = state.tick;
      caseState.dueTick = Math.min(caseState.window.closesAtTick, state.tick + caseState.rulingTicks);
      refreshCrisisCasePressureInPlace(state, caseState);
      caseState.events.unshift({
        tick: state.tick,
        event: "case-opened",
        dueTick: caseState.dueTick,
        pressure: caseState.pressure.current,
      });
      state.crisisArbitration.history.unshift({
        tick: state.tick,
        event: "case-opened",
        caseId: caseState.id,
        dueTick: caseState.dueTick,
      });
      state.log.unshift({ tick: state.tick, message: `${caseState.name} arbitration docket opened; ruling due t${caseState.dueTick}.` });
    });
  }

  function releaseCrisisArbitrationLocks(state) {
    state.lanes.forEach((lane) => {
      if (
        !lane.gridLock
        || lane.gridLock.reason !== "crisis-arbitration"
        || lane.gridLock.untilTick === null
        || state.tick < lane.gridLock.untilTick
      ) {
        return;
      }
      restoreLaneGridLock(lane, "crisis-arbitration");
      state.log.unshift({ tick: state.tick, message: `${lane.name} arbitration hold released.` });
    });
  }

  function assignCrisisEvidence(state, caseId, sourceId) {
    const next = clone(state);
    const caseState = crisisCaseState(next, caseId);
    const source = GAME_DATA.crisisArbitration.evidenceSources[sourceId];
    if (!crisisCaseActionable(caseState)) {
      return withLog(next, "No open arbitration case can accept evidence.");
    }
    if (!source || !caseState.evidence.required.includes(sourceId)) {
      return withLog(next, "Unknown arbitration evidence source.");
    }
    if (caseState.evidence.assigned.some((entry) => entry.sourceId === sourceId)) {
      return withLog(next, `${caseState.name} already has ${source.name}.`);
    }
    if (!canPay(next.resources, source.cost)) {
      return withLog(next, `${caseState.name} evidence lacks ${formatBundle(source.cost)}.`);
    }
    applyBundle(next.resources, source.cost, -1);
    const profile = crisisEvidenceProfile(next, caseState, sourceId);
    caseState.evidence.assigned.push({
      sourceId,
      name: source.name,
      score: profile.score,
      detail: profile.detail,
      tick: next.tick,
    });
    caseState.evidence.score += profile.score;
    caseState.status = caseState.evidence.assigned.length >= caseState.evidence.minimum
      ? "evidence-ready"
      : "open";
    caseState.events.unshift({ tick: next.tick, event: "evidence-assigned", sourceId, score: profile.score });
    next.crisisArbitration.choices.evidenceAssignments += 1;
    next.campaign.choices.crisisEvidenceAssignments += 1;
    refreshCrisisCasePressureInPlace(next, caseState);
    refreshCrisisArbitrationPressureInPlace(next);
    refreshCrisisArbitrationStatusInPlace(next);
    return withLog(next, `${caseState.name} evidence assigned: ${source.name}.`);
  }

  function buyCrisisEmergencyOverride(state, caseId) {
    const next = clone(state);
    const caseState = crisisCaseState(next, caseId);
    const override = GAME_DATA.crisisArbitration.override;
    if (!crisisCaseActionable(caseState)) {
      return withLog(next, "No open arbitration case can receive an override.");
    }
    if (caseState.override.spent) {
      return withLog(next, `${caseState.name} emergency override already spent.`);
    }
    if (!canPay(next.resources, override.cost)) {
      return withLog(next, `${caseState.name} override lacks ${formatBundle(override.cost)}.`);
    }
    applyBundle(next.resources, override.cost, -1);
    caseState.override.spent = true;
    caseState.override.spentAtTick = next.tick;
    caseState.override.extensionTicks = override.extensionTicks;
    caseState.override.score = override.rulingScore;
    caseState.dueTick += override.extensionTicks;
    caseState.window.closesAtTick += override.extensionTicks;
    if (next.grid) {
      next.grid.pressure += override.gridPressure;
    }
    next.crisisArbitration.carryover.overridesSpent += 1;
    next.crisisArbitration.choices.emergencyOverrides += 1;
    next.campaign.choices.crisisEmergencyOverrides += 1;
    caseState.events.unshift({ tick: next.tick, event: "emergency-override", dueTick: caseState.dueTick });
    refreshCrisisCasePressureInPlace(next, caseState);
    refreshCrisisArbitrationPressureInPlace(next);
    return withLog(next, `${caseState.name} emergency override bought; ruling due t${caseState.dueTick}.`);
  }

  function deferCrisisCase(state, caseId) {
    const next = clone(state);
    const caseState = crisisCaseState(next, caseId);
    const defer = GAME_DATA.crisisArbitration.defer;
    if (!crisisCaseActionable(caseState)) {
      return withLog(next, "No open arbitration case can be deferred.");
    }
    if (!canPay(next.resources, defer.cost)) {
      return withLog(next, `${caseState.name} deferral lacks ${formatBundle(defer.cost)}.`);
    }
    applyBundle(next.resources, defer.cost, -1);
    caseState.deferrals += 1;
    caseState.dueTick += defer.extensionTicks;
    caseState.window.closesAtTick += defer.extensionTicks;
    caseState.pressure.base += defer.pressure;
    caseState.status = caseState.evidence.assigned.length >= caseState.evidence.minimum ? "evidence-ready" : "deferred";
    next.crisisArbitration.choices.deferrals += 1;
    next.campaign.choices.crisisDeferrals += 1;
    caseState.events.unshift({ tick: next.tick, event: "case-deferred", dueTick: caseState.dueTick });
    refreshCrisisCasePressureInPlace(next, caseState);
    refreshCrisisArbitrationPressureInPlace(next);
    refreshCrisisArbitrationStatusInPlace(next);
    return withLog(next, `${caseState.name} arbitration deferred to t${caseState.dueTick}.`);
  }

  function protectCrisisLane(state, caseId) {
    const next = clone(state);
    const caseState = crisisCaseState(next, caseId);
    const protection = GAME_DATA.crisisArbitration.laneProtection;
    if (!crisisCaseActionable(caseState)) {
      return withLog(next, "No open arbitration case can protect a lane.");
    }
    if (caseState.protection.laneGuarded) {
      return withLog(next, `${caseState.name} lane already protected.`);
    }
    if (!canPay(next.resources, protection.cost)) {
      return withLog(next, `${caseState.name} lane protection lacks ${formatBundle(protection.cost)}.`);
    }
    applyBundle(next.resources, protection.cost, -1);
    const linked = crisisLinkedState(next, caseState);
    caseState.protection.laneGuarded = true;
    caseState.protection.guardedAtTick = next.tick;
    caseState.protection.score += protection.guardScore;
    if (linked.lane) {
      linked.lane.crisisProtection = {
        caseId: caseState.id,
        startedAtTick: next.tick,
      };
    }
    if (linked.sector) {
      linked.sector.powered = true;
    }
    if (next.grid) {
      next.grid.pressure += protection.gridPressure;
    }
    next.crisisArbitration.choices.laneProtections += 1;
    next.campaign.choices.crisisLaneProtections += 1;
    caseState.status = "protected";
    caseState.events.unshift({ tick: next.tick, event: "lane-protected", laneId: caseState.linked.laneId });
    refreshCrisisCasePressureInPlace(next, caseState);
    refreshCrisisArbitrationPressureInPlace(next);
    refreshCrisisArbitrationStatusInPlace(next);
    return withLog(next, `${caseState.name} protected ${titleCase(caseState.linked.laneId)} under dispute.`);
  }

  function crisisPriorityReadinessScore(state, caseState, priorityId) {
    const ruling = GAME_DATA.crisisArbitration.rulings[priorityId];
    const linked = crisisLinkedState(state, caseState);
    if (!ruling) {
      return 0;
    }
    let score = 0;
    if (ruling.priority === "grid") {
      if (linked.sector && linked.sector.route === "priority") {
        score += 3;
      }
      if (linked.sector && linked.sector.reserveDraws > 0) {
        score += 1;
      }
      if (linked.sector && linked.sector.powered && !linked.sector.isolated) {
        score += 1;
      }
      if (state.grid && state.grid.audit.status === "active") {
        score += 1;
      }
    }
    if (ruling.priority === "freight") {
      if (linked.manifest && ["staged", "sealed", "enroute"].includes(linked.manifest.status)) {
        score += 3;
      } else if (linked.manifest && linked.manifest.status === "available") {
        score += 1;
      }
      if (linked.manifest && linked.manifest.security.integrityGuard > 0) {
        score += 1;
      }
      if (linked.manifest && linked.manifest.route.rerouted) {
        score += 1;
      }
    }
    if (ruling.priority === "breach") {
      if (state.breach && ["active", "escaped"].includes(state.breach.status)) {
        score += 2;
      }
      if (linked.sector && linked.sector.breach && ["contaminated", "quarantined"].includes(linked.sector.breach.status)) {
        score += 2;
      }
      if (state.breach && state.breach.trace.status === "active") {
        score += 1;
      }
      if (state.breach && state.breach.trace.status === "resolved") {
        score += 2;
      }
    }
    if (ruling.priority === "rail") {
      if (linked.incident && railSabotageIncidentActionable(linked.incident)) {
        score += 1;
      }
      if (linked.incident && linked.incident.scan.status === "complete") {
        score += 2;
      }
      if (linked.incident && (linked.incident.patrol.drones || linked.incident.patrol.defenses)) {
        score += 1;
      }
      if (linked.incident && linked.incident.dock.locked) {
        score += 1;
      }
      if (linked.incident && linked.incident.outcome === "contained") {
        score += 2;
      }
    }
    return score;
  }

  function crisisRulingScore(state, caseState, priorityId) {
    let score = caseState.evidence.score
      + crisisPriorityReadinessScore(state, caseState, priorityId)
      + (caseState.protection.score || 0)
      + (caseState.override.score || 0);
    if (caseState.evidence.assigned.length < caseState.evidence.minimum) {
      score -= 2;
    }
    if (caseState.dueTick !== null && state.tick > caseState.dueTick) {
      score -= 1;
    }
    return Math.max(0, score);
  }

  function crisisOutcomeForScore(caseState, score) {
    const definition = crisisCaseDefinition(caseState.id);
    if (score >= definition.bindingScore) {
      return "binding";
    }
    if (score >= definition.partialScore) {
      return "partial";
    }
    return "failed";
  }

  function recordCrisisContractRulingInPlace(state, caseState, priorityId, outcome, score) {
    const contract = byId(state.contracts, caseState.linked.contractId);
    if (!contract) {
      return;
    }
    if (!Array.isArray(contract.crisisRulings)) {
      contract.crisisRulings = [];
    }
    contract.crisisRulings.unshift({
      caseId: caseState.id,
      priorityId,
      outcome,
      score,
      tick: state.tick,
    });
    if (contract.status === "active") {
      if (outcome === "binding") {
        contract.timeRemaining += 2;
      } else if (outcome === "partial") {
        contract.timeRemaining += 1;
      } else {
        contract.timeRemaining = Math.max(0, contract.timeRemaining - 2);
      }
    }
  }

  function applyCrisisPrioritySideEffectsInPlace(state, caseState, priorityId, outcome) {
    const definition = crisisCaseDefinition(caseState.id);
    const ruling = GAME_DATA.crisisArbitration.rulings[priorityId];
    const linked = crisisLinkedState(state, caseState);
    if (!definition || !ruling) {
      return {};
    }
    const bundle = outcome === "binding"
      ? combineBundles(definition.reward, ruling.reward)
      : outcome === "partial"
        ? combineBundles(definition.partialPenalty, ruling.partialPenalty)
        : combineBundles(definition.failurePenalty, ruling.failurePenalty);
    applyBundle(state.resources, bundle, 1);
    clampResourceFloor(state.resources);

    if (outcome === "binding") {
      if (ruling.priority === "grid" && linked.sector) {
        linked.sector.route = "priority";
        linked.sector.powered = true;
        if (state.grid) {
          state.grid.pressure = Math.max(0, state.grid.pressure - ruling.pressureRelief);
        }
        refreshSectorLane(state, linked.sector);
      }
      if (ruling.priority === "freight" && linked.manifest && !freightStatusTerminal(linked.manifest)) {
        linked.manifest.security.riskRelief += ruling.riskRelief;
        linked.manifest.security.integrityGuard += ruling.integrityGuard;
        linked.manifest.integrity = Math.min(100, linked.manifest.integrity + ruling.integrityGuard);
        linked.manifest.window.closesAtTick += 1;
        linked.manifest.events.unshift({ tick: state.tick, event: "arbitration-freight-priority", caseId: caseState.id });
        refreshFreightRiskInPlace(state, linked.manifest);
      }
      if (ruling.priority === "breach" && state.breach) {
        state.breach.intensity = Math.max(0, state.breach.intensity - ruling.intensityRelief);
        if (linked.sector && linked.sector.breach && linked.sector.breach.status === "contaminated") {
          linked.sector.breach.status = "contained";
        }
        state.breach.history.unshift({ tick: state.tick, event: "arbitration-breach-priority", caseId: caseState.id });
      }
      if (ruling.priority === "rail" && linked.incident) {
        linked.incident.pressure.mitigation += ruling.sabotageRelief;
        linked.incident.events.unshift({ tick: state.tick, event: "arbitration-rail-priority", caseId: caseState.id });
        refreshRailSabotageIncidentPressureInPlace(state, linked.incident);
      }
      state.crisisArbitration.carryover.bindingRulings += 1;
      return bundle;
    }

    if (outcome === "partial") {
      if (linked.manifest && !freightStatusTerminal(linked.manifest)) {
        linked.manifest.integrity = Math.max(0, linked.manifest.integrity - Math.ceil(definition.integrityDamage / 2));
        linked.manifest.events.unshift({ tick: state.tick, event: "arbitration-partial", caseId: caseState.id });
      }
      if (state.grid) {
        state.grid.pressure += 1;
      }
      if (state.breach && ["active", "escaped"].includes(state.breach.status)) {
        state.breach.intensity += 1;
      }
      if (linked.incident) {
        linked.incident.pressure.base += 1;
        refreshRailSabotageIncidentPressureInPlace(state, linked.incident);
      }
      state.crisisArbitration.carryover.arbitrationScar = Math.min(
        12,
        state.crisisArbitration.carryover.arbitrationScar + 1
      );
      return bundle;
    }

    if (linked.manifest && !freightStatusTerminal(linked.manifest)) {
      linked.manifest.integrity = Math.max(0, linked.manifest.integrity - definition.integrityDamage);
      linked.manifest.events.unshift({ tick: state.tick, event: "arbitration-failed", caseId: caseState.id });
    }
    if (state.grid) {
      state.grid.pressure += definition.gridPressure;
    }
    if (state.breach && ["active", "escaped"].includes(state.breach.status)) {
      state.breach.intensity += definition.breachIntensity;
    }
    if (linked.incident) {
      linked.incident.pressure.base += definition.sabotagePressure;
      refreshRailSabotageIncidentPressureInPlace(state, linked.incident);
    }
    if (linked.lane && !linked.lane.gridLock) {
      markLaneGridLocked(linked.lane, "crisis-arbitration", state.tick + 2);
    }
    if (linked.sector) {
      linked.sector.powered = false;
    }
    state.crisisArbitration.carryover.arbitrationScar = Math.min(
      12,
      state.crisisArbitration.carryover.arbitrationScar + definition.scarValue
    );
    if (!state.crisisArbitration.carryover.failedCases.includes(caseState.id)) {
      state.crisisArbitration.carryover.failedCases.push(caseState.id);
    }
    if (!state.crisisArbitration.carryover.disputedLanes.includes(caseState.linked.laneId)) {
      state.crisisArbitration.carryover.disputedLanes.push(caseState.linked.laneId);
    }
    return bundle;
  }

  function resolveCrisisCaseInPlace(state, caseState, priorityId = null, reason = "timer-expired") {
    if (!state.crisisArbitration || !crisisCaseActionable(caseState)) {
      return false;
    }
    const selectedPriority = priorityId || caseState.ruling.priority || caseState.priorityOrder[0];
    const ruling = GAME_DATA.crisisArbitration.rulings[selectedPriority];
    if (!ruling || !caseState.priorityOrder.includes(selectedPriority)) {
      return false;
    }
    const score = crisisRulingScore(state, caseState, selectedPriority);
    const outcome = crisisOutcomeForScore(caseState, score);
    const bundle = applyCrisisPrioritySideEffectsInPlace(state, caseState, selectedPriority, outcome);
    caseState.status = outcome;
    caseState.outcome = outcome;
    caseState.resolvedAtTick = state.tick;
    caseState.ruling = {
      status: "resolved",
      priority: selectedPriority,
      outcome,
      binding: outcome === "binding",
      score,
      reason,
    };
    caseState.events.unshift({
      tick: state.tick,
      event: "case-ruled",
      priorityId: selectedPriority,
      outcome,
      score,
      reason,
    });
    state.crisisArbitration.outcomes[outcome] += 1;
    recordCrisisContractRulingInPlace(state, caseState, selectedPriority, outcome, score);
    state.crisisArbitration.history.unshift({
      tick: state.tick,
      event: "case-ruled",
      caseId: caseState.id,
      priorityId: selectedPriority,
      outcome,
      score,
    });
    refreshCrisisArbitrationPressureInPlace(state);
    refreshCrisisArbitrationStatusInPlace(state);
    state.log.unshift({ tick: state.tick, message: `${caseState.name} ${ruling.name} ruling ${outcome}; ${formatBundle(bundle)} applied.` });
    return true;
  }

  function emergencyWorkPreemptsCrisisCaseInPlace(state, caseState) {
    const runningEmergencyLane = state.lanes.find((lane) => (
      lane.status === "running" && lane.currentJob && lane.currentJob.emergency
    ));
    if (
      !runningEmergencyLane
    ) {
      return false;
    }
    caseState.dueTick += 1;
    caseState.window.closesAtTick += 1;
    caseState.pressure.base += 1;
    caseState.status = "deferred";
    caseState.events.unshift({
      tick: state.tick,
      event: "emergency-preempted",
      laneId: runningEmergencyLane.id,
      dueTick: caseState.dueTick,
    });
    state.crisisArbitration.history.unshift({
      tick: state.tick,
      event: "emergency-preempted",
      caseId: caseState.id,
      laneId: runningEmergencyLane.id,
      dueTick: caseState.dueTick,
    });
    state.log.unshift({ tick: state.tick, message: `${caseState.name} deferred while ${runningEmergencyLane.name} runs emergency work.` });
    return true;
  }

  function ruleCrisisCase(state, caseId, priorityId) {
    const next = clone(state);
    const caseState = crisisCaseState(next, caseId);
    if (!crisisCaseActionable(caseState)) {
      return withLog(next, "No open arbitration case can be ruled.");
    }
    if (!caseState.priorityOrder.includes(priorityId) || !GAME_DATA.crisisArbitration.rulings[priorityId]) {
      return withLog(next, "Unknown arbitration priority ruling.");
    }
    const applied = resolveCrisisCaseInPlace(next, caseState, priorityId, "operator-ruling");
    if (applied) {
      const crisisCounter = crisisPriorityChoiceCounter(priorityId);
      const campaignCounter = campaignCrisisPriorityChoiceCounter(priorityId);
      if (crisisCounter) {
        next.crisisArbitration.choices[crisisCounter] += 1;
      }
      if (campaignCounter) {
        next.campaign.choices[campaignCounter] += 1;
      }
    }
    return withLog(next, `${caseState.name} priority ruling filed.`);
  }

  function advanceCrisisArbitrationState(state) {
    if (!state.crisisArbitration) {
      return;
    }
    releaseCrisisArbitrationLocks(state);
    openCrisisCasesInPlace(state);
    state.crisisArbitration.cases.forEach((caseState) => {
      if (!crisisCaseActionable(caseState)) {
        return;
      }
      refreshCrisisCasePressureInPlace(state, caseState);
      if (caseState.dueTick !== null && state.tick > caseState.dueTick) {
        if (emergencyWorkPreemptsCrisisCaseInPlace(state, caseState)) {
          return;
        }
        resolveCrisisCaseInPlace(state, caseState, caseState.ruling.priority, "timer-expired");
      }
    });
    refreshCrisisArbitrationPressureInPlace(state);
    refreshCrisisArbitrationStatusInPlace(state);
  }

  function activeBreachSource(state) {
    return state.breach ? breachSourceDefinition(state.breach.sourceId) : null;
  }

  function currentBreachTraceTicks(state, source) {
    const scarCompression = Math.min(2, state.breach.carryover.signalScar || 0);
    return Math.max(3, source.traceTicks - Math.max(0, state.campaign.demand - 2) - scarCompression);
  }

  function contaminateBreachSector(state, sectorId, source) {
    const sector = gridSectorState(state, sectorId);
    if (!sector || !source) {
      return false;
    }
    sector.breach = {
      status: sector.breach && sector.breach.status === "quarantined" ? "quarantined" : "contaminated",
      sourceId: source.id,
      severity: Math.max(source.severity || 1, sector.breach ? sector.breach.severity || 0 : 0),
      shieldedUntil: sector.breach ? sector.breach.shieldedUntil : null,
      quarantinedAtTick: sector.breach ? sector.breach.quarantinedAtTick : null,
    };
    if (!state.breach.contamination.sectors.includes(sector.id)) {
      state.breach.contamination.sectors.push(sector.id);
    }
    return true;
  }

  function compromiseQueueEntry(state, entry, source) {
    if (
      !entry
      || entry.compromised
      || entry.breachDirective
      || entry.gridDirective
      || entry.freightDirective
      || entry.sabotageDirective
      || entry.emergency
    ) {
      return false;
    }
    entry.compromised = {
      sourceId: source.id,
      severity: source.severity || 1,
      status: "compromised",
      createdAtTick: state.tick,
    };
    state.breach.contamination.queuedEntries += 1;
    return true;
  }

  function compromiseQueuedJobs(state, source) {
    let compromised = 0;
    state.queue.some((entry) => {
      if (compromised >= source.compromiseCount) {
        return true;
      }
      if (compromiseQueueEntry(state, entry, source)) {
        compromised += 1;
      }
      return false;
    });
    return compromised;
  }

  function queueBreachCountermeasure(state, source) {
    if (!source.countermeasureJobTypeId || state.breach.countermeasureQueued) {
      return false;
    }
    const alreadyQueued = state.queue.some((entry) => (
      entry.breachDirective && entry.sourceBreachId === source.id
    ));
    const alreadyAssigned = state.lanes.some((lane) => (
      lane.currentJob && lane.currentJob.breachDirective && lane.currentJob.sourceBreachId === source.id
    ));
    if (alreadyQueued || alreadyAssigned) {
      state.breach.countermeasureQueued = true;
      return false;
    }
    state.queue.unshift(createQueueEntry(state, source.countermeasureJobTypeId, 1, {
      breachDirective: true,
      sourceBreachId: source.id,
    }));
    state.breach.countermeasureQueued = true;
    applyQueuePolicy(state);
    return true;
  }

  function maybeActivateSignalBreach(state) {
    if (!state.breach || state.breach.status !== "dormant") {
      return false;
    }
    const source = activeBreachSource(state);
    if (!source) {
      return false;
    }
    const activationTick = Math.max(
      2,
      source.activationTick - Math.max(0, state.campaign.demand - 1) - Math.min(1, state.breach.carryover.signalScar || 0)
    );
    if (state.tick < activationTick) {
      return false;
    }
    state.breach.status = "active";
    state.breach.activatedAtTick = state.tick;
    state.breach.intensity += source.intensity;
    state.breach.trace.status = "active";
    state.breach.trace.dueTick = state.tick + currentBreachTraceTicks(state, source);
    state.breach.containment.status = "intrusion";
    compromiseQueuedJobs(state, source);
    contaminateBreachSector(state, source.sectorId, source);
    queueBreachCountermeasure(state, source);
    if (state.grid) {
      state.grid.pressure += source.gridPressure;
    }
    state.breach.history.unshift({
      tick: state.tick,
      event: "activated",
      sourceId: source.id,
      dueTick: state.breach.trace.dueTick,
    });
    state.log.unshift({ tick: state.tick, message: `${source.name} signal breach active; trace due t${state.breach.trace.dueTick}.` });
    return true;
  }

  function shieldBreachSectorInPlace(state, sector) {
    if (!state.breach || !sector || !sector.breach || sector.breach.status !== "contaminated") {
      return false;
    }
    const shield = GAME_DATA.signalBreach.shield;
    sector.breach.shieldedUntil = state.tick + shield.ticks;
    state.breach.intensity = Math.max(0, state.breach.intensity - shield.intensityRelief);
    state.breach.containment.shieldedSectors += 1;
    state.breach.choices.shieldRoutes += 1;
    state.breach.history.unshift({
      tick: state.tick,
      event: "shielded-sector",
      sectorId: sector.id,
      untilTick: sector.breach.shieldedUntil,
    });
    state.log.unshift({ tick: state.tick, message: `${sector.name} reserve shield holds breach until t${sector.breach.shieldedUntil}.` });
    return true;
  }

  function releaseExpiredBreachShields(state) {
    if (!state.grid) {
      return;
    }
    state.grid.sectors.forEach((sector) => {
      if (!sector.breach || sector.breach.shieldedUntil === null || state.tick < sector.breach.shieldedUntil) {
        return;
      }
      sector.breach.shieldedUntil = null;
      state.log.unshift({ tick: state.tick, message: `${sector.name} breach shield expired.` });
    });
  }

  function failBreachTraceInPlace(state, source) {
    applyBundle(state.resources, source.tracePenalty, 1);
    clampResourceFloor(state.resources);
    state.breach.status = "escaped";
    state.breach.trace.status = "failed";
    state.breach.trace.failures += 1;
    state.breach.trace.dueTick = null;
    state.breach.intensity += source.deferIntensity;
    state.breach.containment.status = "scarred";
    if (state.grid) {
      state.grid.pressure += source.gridPressure;
    }
    compromiseQueuedJobs(state, source);
    state.breach.history.unshift({
      tick: state.tick,
      event: "trace-failed",
      sourceId: source.id,
      scar: source.escapeScar,
    });
    state.log.unshift({ tick: state.tick, message: `${source.name} trace failed; intrusion scar persisted.` });
  }

  function maybeFailBreachTrace(state) {
    if (!state.breach || state.breach.status !== "active" || state.breach.trace.status !== "active") {
      return false;
    }
    if (state.tick <= state.breach.trace.dueTick) {
      return false;
    }
    const source = activeBreachSource(state);
    if (!source) {
      return false;
    }
    failBreachTraceInPlace(state, source);
    return true;
  }

  function advanceBreachState(state) {
    if (!state.breach) {
      return;
    }
    releaseExpiredBreachShields(state);
    maybeActivateSignalBreach(state);
    if (state.breach.status === "active" && hasActiveEmergency(state) && state.tick % 3 === 0) {
      state.breach.intensity += 1;
    }
    if (state.breach.status === "active" && state.breach.intensity >= state.breach.threshold) {
      state.breach.containment.status = "critical";
    }
    maybeFailBreachTrace(state);
  }

  function cleanseCompromisedQueueEntry(state, entryId) {
    const next = clone(state);
    const entry = next.queue.find((candidate) => candidate.id === entryId);
    const cleanse = GAME_DATA.signalBreach.cleanse;
    if (!entry || !entry.compromised || entry.compromised.status !== "compromised") {
      return withLog(next, "No compromised queue entry selected.");
    }
    if (!canPay(next.resources, cleanse.cost)) {
      return withLog(next, `Queue cleanse lacks ${formatBundle(cleanse.cost)}.`);
    }
    applyBundle(next.resources, cleanse.cost, -1);
    applyBundle(next.resources, cleanse.reward, 1);
    entry.compromised = null;
    entry.cleansedAtTick = next.tick;
    next.breach.intensity = Math.max(0, next.breach.intensity - cleanse.intensityRelief);
    if (next.breach.trace.status === "active") {
      next.breach.trace.dueTick += cleanse.traceReliefTicks;
    }
    next.breach.containment.cleansedEntries += 1;
    next.breach.choices.cleanses += 1;
    next.campaign.choices.breachCleanses += 1;
    next.breach.history.unshift({ tick: next.tick, event: "queue-cleansed", entryId });
    return withLog(next, `${jobName(entry.jobTypeId)} queue signal cleansed.`);
  }

  function quarantineBreachLane(state, laneId, active = true) {
    const next = clone(state);
    const lane = byId(next.lanes, laneId);
    const sector = lane ? gridSectorForLane(next.grid, lane.id) : null;
    const quarantine = GAME_DATA.signalBreach.quarantine;
    if (!lane || !sector) {
      return withLog(next, "Unknown breach quarantine lane.");
    }
    if (active && lane.breachQuarantine) {
      return withLog(next, `${lane.name} breach quarantine already active.`);
    }
    if (!active && !lane.breachQuarantine) {
      return withLog(next, `${lane.name} has no breach quarantine.`);
    }
    if (active && !canPay(next.resources, { stability: quarantine.stabilityCost })) {
      return withLog(next, `${lane.name} quarantine lacks stability ${quarantine.stabilityCost}.`);
    }
    if (active) {
      applyBundle(next.resources, { stability: quarantine.stabilityCost }, -1);
      lane.breachQuarantine = {
        sourceId: next.breach.sourceId,
        sectorId: sector.id,
        startedAtTick: next.tick,
      };
      sector.breach.status = "quarantined";
      sector.breach.sourceId = next.breach.sourceId;
      sector.breach.quarantinedAtTick = next.tick;
      sector.isolated = true;
      sector.powered = false;
      sector.route = "balanced";
      markLaneGridLocked(lane, "breach-quarantine");
      next.breach.intensity = Math.max(0, next.breach.intensity - quarantine.intensityRelief);
      next.grid.pressure = Math.max(0, next.grid.pressure - quarantine.gridPressureRelief);
      if (!next.breach.containment.quarantinedLanes.includes(lane.id)) {
        next.breach.containment.quarantinedLanes.push(lane.id);
      }
      next.breach.choices.quarantines += 1;
      next.campaign.choices.breachQuarantines += 1;
      next.breach.history.unshift({ tick: next.tick, event: "lane-quarantined", laneId: lane.id });
    } else {
      lane.breachQuarantine = null;
      sector.breach.status = sector.breach.sourceId ? "contaminated" : "clean";
      sector.breach.quarantinedAtTick = null;
      sector.isolated = false;
      sector.powered = true;
      restoreLaneGridLock(lane, "breach-quarantine");
      next.breach.history.unshift({ tick: next.tick, event: "lane-quarantine-cleared", laneId: lane.id });
    }
    refreshSectorLane(next, sector);
    return withLog(next, `${lane.name} breach quarantine ${active ? "engaged" : "cleared"}.`);
  }

  function traceBreachSource(state) {
    const next = clone(state);
    const source = activeBreachSource(next);
    if (!source || next.breach.status !== "active" || next.breach.trace.status !== "active") {
      return withLog(next, "No active breach trace.");
    }
    if (!canPay(next.resources, source.traceCost)) {
      return withLog(next, `${source.name} trace lacks ${formatBundle(source.traceCost)}.`);
    }
    applyBundle(next.resources, source.traceCost, -1);
    applyBundle(next.resources, source.traceReward, 1);
    next.breach.status = "contained";
    next.breach.trace.status = "resolved";
    next.breach.trace.dueTick = null;
    next.breach.trace.resolved += 1;
    next.breach.intensity = Math.max(0, next.breach.intensity - source.intensity - 1);
    next.breach.containment.status = "contained";
    next.breach.containment.tracedSources += 1;
    next.breach.choices.traces += 1;
    next.campaign.choices.breachTraces += 1;
    next.grid.sectors.forEach((sector) => {
      if (sector.breach && sector.breach.sourceId === source.id && sector.breach.status !== "quarantined") {
        sector.breach.status = "contained";
        sector.breach.severity = Math.max(0, sector.breach.severity - 1);
      }
    });
    next.breach.history.unshift({ tick: next.tick, event: "source-traced", sourceId: source.id });
    return withLog(next, `${source.name} traced and contained.`);
  }

  function deferBreachTrace(state) {
    const next = clone(state);
    const source = activeBreachSource(next);
    if (!source || next.breach.status !== "active" || next.breach.trace.status !== "active") {
      return withLog(next, "No active breach trace to defer.");
    }
    if (!canPay(next.resources, source.deferCost)) {
      return withLog(next, `${source.name} deferral lacks ${formatBundle(source.deferCost)}.`);
    }
    applyBundle(next.resources, source.deferCost, -1);
    next.breach.trace.dueTick += source.deferTicks;
    next.breach.trace.deferrals += 1;
    next.breach.intensity += source.deferIntensity;
    next.breach.containment.status = "deferred";
    next.breach.choices.traceDeferrals += 1;
    next.campaign.choices.breachDeferrals += 1;
    next.breach.history.unshift({ tick: next.tick, event: "trace-deferred", sourceId: source.id });
    return withLog(next, `${source.name} trace deferred to t${next.breach.trace.dueTick}.`);
  }

  function completeBreachCountermeasureInPlace(state, completedJob) {
    if (!state.breach || !completedJob.breachDirective) {
      return false;
    }
    const countermeasure = GAME_DATA.signalBreach.countermeasure;
    applyBundle(state.resources, countermeasure.reward, 1);
    state.breach.intensity = Math.max(0, state.breach.intensity - countermeasure.intensityRelief);
    if (state.breach.trace.status === "active") {
      state.breach.trace.dueTick += countermeasure.traceReliefTicks;
    }
    state.breach.containment.countermeasures += 1;
    state.breach.choices.countermeasureJobs += 1;
    state.campaign.choices.breachCountermeasures += 1;
    if (state.breach.status === "active" && state.breach.containment.status !== "contained") {
      state.breach.containment.status = "mitigated";
    }
    state.breach.history.unshift({
      tick: state.tick,
      event: "countermeasure-complete",
      sourceId: completedJob.sourceBreachId,
    });
    state.log.unshift({ tick: state.tick, message: "Countermeasures damped the breach trace." });
    return true;
  }

  function applyCompromisedJobCompletion(state, lane, completedJob) {
    if (!state.breach || !completedJob.compromised || completedJob.compromised.status !== "compromised") {
      return false;
    }
    const source = breachSourceDefinition(completedJob.compromised.sourceId);
    if (!source) {
      return false;
    }
    applyBundle(state.resources, source.jobCompletionPenalty, 1);
    clampResourceFloor(state.resources);
    state.breach.intensity += completedJob.compromised.severity || 1;
    state.breach.contamination.completedCompromisedJobs += 1;
    if (state.grid) {
      state.grid.pressure += source.gridPressure;
      const sector = gridSectorForLane(state.grid, lane.id);
      if (sector) {
        contaminateBreachSector(state, sector.id, source);
      }
    }
    state.breach.history.unshift({
      tick: state.tick,
      event: "compromised-job-complete",
      laneId: lane.id,
      jobTypeId: completedJob.jobTypeId,
    });
    state.log.unshift({ tick: state.tick, message: `${lane.name} completed compromised ${jobName(completedJob.jobTypeId)}; breach pressure rose.` });
    return true;
  }

  function auditDirectiveDefinition(state) {
    return byId(GAME_DATA.grid.auditDirectives, state.grid.audit.directiveId);
  }

  function queueAuditDirective(state, directive) {
    if (state.grid.audit.queued || !directive.jobTypeId) {
      return;
    }
    state.queue.unshift(createQueueEntry(state, directive.jobTypeId, 1, {
      gridDirective: true,
      sourceDirectiveId: directive.id,
    }));
    state.grid.audit.queued = true;
    applyQueuePolicy(state);
  }

  function maybeActivateAuditDirective(state) {
    if (!state.grid || state.grid.audit.status !== "armed") {
      return false;
    }
    const directive = auditDirectiveDefinition(state);
    const activationTick = Math.max(2, directive.activationTick - Math.max(0, state.campaign.demand - 2));
    if (state.tick < activationTick) {
      return false;
    }
    state.grid.audit.status = "active";
    state.grid.audit.activatedAtTick = state.tick;
    state.grid.audit.dueTick = state.tick + directive.dueTicks;
    queueAuditDirective(state, directive);
    state.log.unshift({ tick: state.tick, message: `${directive.name} audit directive active.` });
    return true;
  }

  function completeAuditDirectiveInPlace(state, directive, consumeRepairCost = true) {
    if (!state.grid || state.grid.audit.status !== "active") {
      return false;
    }
    if (consumeRepairCost) {
      if (!canPay(state.resources, directive.repairCost)) {
        return false;
      }
      applyBundle(state.resources, directive.repairCost, -1);
    }
    applyBundle(state.resources, directive.reward, 1);
    state.grid.audit.status = "complete";
    state.grid.audit.dueTick = null;
    state.grid.audit.completed += 1;
    state.grid.pressure = Math.max(0, state.grid.pressure - 3);
    state.grid.choices.auditRepairs += 1;
    state.campaign.choices.auditRepairs += 1;
    state.log.unshift({ tick: state.tick, message: `${directive.name} audit directive cleared.` });
    return true;
  }

  function resolveAuditDirective(state) {
    const next = clone(state);
    const directive = auditDirectiveDefinition(next);
    if (!directive || next.grid.audit.status !== "active") {
      return withLog(next, "No active audit directive.");
    }
    if (!completeAuditDirectiveInPlace(next, directive, true)) {
      return withLog(next, `${directive.name} lacks ${formatBundle(directive.repairCost)}.`);
    }
    return next;
  }

  function deferAuditDirective(state) {
    const next = clone(state);
    const directive = auditDirectiveDefinition(next);
    if (!directive || next.grid.audit.status !== "active") {
      return withLog(next, "No active audit directive to defer.");
    }
    if (!canPay(next.resources, directive.deferCost)) {
      return withLog(next, `${directive.name} deferral lacks ${formatBundle(directive.deferCost)}.`);
    }
    applyBundle(next.resources, directive.deferCost, -1);
    next.grid.audit.dueTick += directive.extensionTicks;
    next.grid.audit.deferrals += 1;
    next.grid.pressure += directive.deferPressure;
    next.grid.choices.auditDeferrals += 1;
    next.campaign.choices.auditDeferrals += 1;
    return withLog(next, `${directive.name} deferred to t${next.grid.audit.dueTick}.`);
  }

  function maybeFailAuditDirective(state) {
    if (!state.grid || state.grid.audit.status !== "active" || state.tick <= state.grid.audit.dueTick) {
      return false;
    }
    const directive = auditDirectiveDefinition(state);
    applyBundle(state.resources, directive.penalty, 1);
    clampResourceFloor(state.resources);
    state.grid.audit.status = "failed";
    state.grid.audit.failures += 1;
    state.grid.audit.dueTick = null;
    state.grid.pressure += directive.failurePressure;
    state.log.unshift({ tick: state.tick, message: `${directive.name} audit directive failed.` });
    return true;
  }

  function gridPressureRelief(state) {
    return state.grid.sectors.reduce((total, sector) => {
      const definition = gridSectorDefinition(sector.id);
      if (!definition) {
        return total;
      }
      if (sector.isolated) {
        return total + (definition.isolate.pressureRelief || 0);
      }
      if (sector.route === "priority") {
        return total + (definition.priority.pressureRelief || 0);
      }
      return total;
    }, 0);
  }

  function computeGridLoad(state) {
    if (!state.grid) {
      return 0;
    }
    let load = Math.max(0, state.campaign.demand - 1);
    state.lanes.forEach((lane) => {
      if (lane.status !== "running") {
        return;
      }
      const sector = gridSectorForLane(state.grid, lane.id);
      const definition = sector ? gridSectorDefinition(sector.id) : null;
      if (sector && !sector.isolated && definition) {
        load += definition.baseLoad;
      }
    });
    if (hasActiveEmergency(state)) {
      load += 2;
    }
    if (state.grid.audit.status === "active") {
      load += 1;
    }
    state.grid.sectors.forEach((sector) => {
      if (!sector.breach || !["contaminated", "scarred"].includes(sector.breach.status)) {
        return;
      }
      if (sector.breach.shieldedUntil !== null && state.tick < sector.breach.shieldedUntil) {
        return;
      }
      const lane = laneForSector(state, sector);
      if (!lane || lane.status !== "running") {
        return;
      }
      load += sector.breach.severity || 1;
    });
    return Math.max(0, load - gridPressureRelief(state));
  }

  function selectBlackoutSector(state) {
    return state.grid.sectors
      .filter((sector) => !sector.isolated)
      .map((sector) => {
        const lane = laneForSector(state, sector);
        const definition = gridSectorDefinition(sector.id);
        return {
          sector,
          running: lane && lane.status === "running" ? 1 : 0,
          priority: sector.route === "priority" ? 0 : 1,
          load: definition ? definition.baseLoad : 0,
        };
      })
      .sort((left, right) => (
        right.running - left.running ||
        right.priority - left.priority ||
        right.load - left.load
      ))[0]?.sector || null;
  }

  function triggerBlackout(state) {
    const sector = selectBlackoutSector(state);
    if (!sector) {
      return false;
    }
    const blackout = GAME_DATA.grid.blackout;
    const lane = laneForSector(state, sector);
    const pressureBefore = state.grid.pressure;
    sector.blackoutLockedUntil = state.tick + blackout.lockoutTicks;
    sector.powered = false;
    sector.blackoutCount += 1;
    markLaneGridLocked(lane, "blackout", sector.blackoutLockedUntil);
    applyBundle(state.resources, { stability: -blackout.stabilityPenalty, power: -blackout.powerPenalty }, 1);
    clampResourceFloor(state.resources);
    state.grid.pressure = Math.max(0, state.grid.pressure - blackout.pressureRelief);
    state.grid.blackout.status = "active";
    state.grid.blackout.activeSectorId = sector.id;
    state.grid.blackout.lastEventTick = state.tick;
    state.grid.blackout.events.unshift({
      tick: state.tick,
      sectorId: sector.id,
      pressureBefore,
      lockedUntil: sector.blackoutLockedUntil,
    });
    state.log.unshift({ tick: state.tick, message: `${sector.name} blackout lockout until t${sector.blackoutLockedUntil}.` });
    return true;
  }

  function releaseBlackoutLocks(state) {
    state.grid.sectors.forEach((sector) => {
      if (sector.blackoutLockedUntil === null || state.tick < sector.blackoutLockedUntil) {
        return;
      }
      const lane = laneForSector(state, sector);
      sector.blackoutLockedUntil = null;
      sector.powered = !sector.isolated;
      restoreLaneGridLock(lane, "blackout");
      state.log.unshift({ tick: state.tick, message: `${sector.name} blackout lockout cleared.` });
    });
    const activeSector = state.grid.blackout.activeSectorId
      ? gridSectorState(state, state.grid.blackout.activeSectorId)
      : null;
    if (!activeSector || activeSector.blackoutLockedUntil === null) {
      state.grid.blackout.status = "armed";
      state.grid.blackout.activeSectorId = null;
    }
  }

  function advanceGridState(state) {
    if (!state.grid) {
      return;
    }
    releaseBlackoutLocks(state);
    maybeActivateAuditDirective(state);
    maybeFailAuditDirective(state);
    const load = computeGridLoad(state);
    state.grid.currentLoad = load;
    const pressureGain = Math.max(0, Math.ceil((load - 2) / 3));
    if (pressureGain > 0) {
      state.grid.pressure += pressureGain;
    } else if (load === 0 && state.grid.pressure > 0 && state.grid.audit.status !== "active") {
      state.grid.pressure -= 1;
    }
    if (state.grid.pressure >= state.grid.blackout.threshold) {
      triggerBlackout(state);
    }
  }

  function updateTutorialAfterSelectionInPlace(state) {
    if (!tutorialActive(state)) {
      return;
    }
    const entry = selectedQueueEntry(state);
    const lane = selectedLane(state);
    if (
      state.tutorial.stepId === "select-smelt-circuits"
      && entry
      && entry.jobTypeId === "smelt-circuits"
    ) {
      setTutorialStepInPlace(state, "select-forge-line");
    }
    if (
      state.tutorial.stepId === "select-forge-line"
      && lane
      && lane.id === "forge-line"
    ) {
      setTutorialStepInPlace(state, "assign-forge-line");
    }
  }

  function updateTutorialAfterAssignmentInPlace(state, lane, jobType) {
    if (!tutorialActive(state) || !lane || !jobType) {
      return;
    }
    if (
      state.tutorial.stepId === "assign-forge-line"
      && lane.id === "forge-line"
      && jobType.id === "smelt-circuits"
    ) {
      setTutorialStepInPlace(state, "start-forge-line");
    }
  }

  function updateTutorialAfterStartInPlace(state, lane) {
    if (!tutorialActive(state) || !lane || !lane.currentJob) {
      return;
    }
    const onTrainingLane = lane.id === "forge-line" && lane.currentJob.jobTypeId === "smelt-circuits";
    if (!onTrainingLane) {
      return;
    }
    if (state.tutorial.stepId === "start-forge-line") {
      setTutorialStepInPlace(state, "observe-output");
    } else if (state.tutorial.stepId === "restart-forge-line") {
      setTutorialStepInPlace(state, "complete-training-contract");
    }
  }

  function tutorialOwnsLaneFaults(state, lane) {
    return Boolean(
      tutorialActive(state)
        && lane
        && lane.id === "forge-line"
        && lane.currentJob
        && lane.currentJob.jobTypeId === "smelt-circuits"
    );
  }

  function maybeTriggerTutorialJamInPlace(state, lane) {
    if (
      !tutorialOwnsLaneFaults(state, lane)
      || state.tutorial.stepId !== "observe-output"
      || state.tutorial.forcedJam.triggered
      || lane.status !== "running"
      || !lane.currentJob
      || lane.currentJob.remaining >= lane.currentJob.duration
    ) {
      return false;
    }
    const fault = byId(GAME_DATA.faultTypes, state.tutorial.forcedJam.faultTypeId);
    if (!fault) {
      return false;
    }
    applyFaultToLane(state, lane, fault);
    state.tutorial.forcedJam.triggered = true;
    setTutorialStepInPlace(state, "recover-material-jam");
    return true;
  }

  function updateTutorialAfterRecoveryStartInPlace(state, lane) {
    if (!tutorialActive(state) || !lane || lane.id !== "forge-line") {
      return;
    }
    if (state.tutorial.stepId === "recover-material-jam" && lane.status === "recovering") {
      setTutorialStepInPlace(state, "wait-recovery");
    }
  }

  function updateTutorialAfterRecoveryClearInPlace(state, lane) {
    if (!tutorialActive(state) || !lane || lane.id !== "forge-line") {
      return;
    }
    if (state.tutorial.stepId === "wait-recovery" && lane.status === "assigned" && !lane.fault) {
      state.tutorial.forcedJam.resolved = true;
      setTutorialStepInPlace(state, "restart-forge-line");
    }
  }

  function tutorialContractSatisfied(state) {
    if (!state.tutorial || !state.tutorial.contract) {
      return false;
    }
    return Object.entries(state.tutorial.contract.requirement)
      .every(([resource, amount]) => (state.produced[resource] || 0) >= amount);
  }

  function completeTutorialInPlace(state, persist = true) {
    if (!state.tutorial || state.tutorial.completed) {
      return false;
    }
    state.tutorial.completed = true;
    state.tutorial.status = "summary";
    state.tutorial.completedAtTick = state.tick;
    state.tutorial.contract.status = "complete";
    state.tutorial.contract.completedAtTick = state.tick;
    state.tutorial.contract.timeRemaining = Math.max(0, state.tutorial.contract.deadline - state.tick);
    state.tutorial.completionPersisted = persist
      ? writeTutorialCompletion(null, true) || state.tutorial.completionPersisted
      : state.tutorial.completionPersisted;
    applyBundle(state.resources, state.tutorial.contract.reward, 1);
    setTutorialStepInPlace(state, "shift-summary");
    state.log.unshift({ tick: state.tick, message: `${state.tutorial.contract.name} complete; shift summary opened.` });
    return true;
  }

  function evaluateTutorialContractInPlace(state) {
    if (!tutorialActive(state) || state.tutorial.contract.status !== "active") {
      return false;
    }
    state.tutorial.contract.timeRemaining = Math.max(0, state.tutorial.contract.deadline - state.tick);
    if (!tutorialContractSatisfied(state)) {
      return false;
    }
    return completeTutorialInPlace(state);
  }

  function selectJobCard(state, entryId) {
    const next = clone(state);
    const entry = byId(next.queue, entryId);
    if (!entry) {
      return withLog(next, "No queued job selected.");
    }
    next.selection.selectedJobId = entry.id;
    next.selection.selectedObjectType = "job";
    next.selection.lastAction = "select-job";
    updateTutorialAfterSelectionInPlace(next);
    return withLog(next, `${jobName(entry.jobTypeId)} selected.`);
  }

  function selectLane(state, laneId) {
    const next = clone(state);
    const lane = byId(next.lanes, laneId);
    if (!lane) {
      return withLog(next, "No lane selected.");
    }
    next.selection.selectedLaneId = lane.id;
    next.selection.selectedObjectType = "lane";
    next.selection.lastAction = "select-lane";
    updateTutorialAfterSelectionInPlace(next);
    return withLog(next, `${lane.name} selected.`);
  }

  function clearSelection(state) {
    const next = clone(state);
    next.selection = createSelectionState();
    return withLog(next, "Selection cleared.");
  }

  function performContextAction(state, actionId) {
    const actions = contextualActionsForState(state);
    const action = actions.find((candidate) => candidate.id === actionId);
    if (!action) {
      return withLog(state, "No contextual action available.");
    }
    if (!action.available) {
      return withLog(state, `${action.label} unavailable: ${action.reason}.`);
    }
    if (action.id === "assign") {
      return assignJobToLane(state, action.laneId, action.entryId);
    }
    if (action.id === "start") {
      return startLane(state, action.laneId);
    }
    if (action.id === "recover") {
      return recoverLane(state, action.laneId);
    }
    if (action.id === "overdrive") {
      return toggleLaneOverdrive(state, action.laneId, true);
    }
    if (action.id === "release-overdrive") {
      return toggleLaneOverdrive(state, action.laneId, false);
    }
    if (action.id === "pause") {
      return pauseLane(state, action.laneId);
    }
    if (action.id === "quarantine") {
      return quarantineBreachLane(state, action.laneId, true);
    }
    if (action.id === "release-quarantine") {
      return quarantineBreachLane(state, action.laneId, false);
    }
    return withLog(state, "Contextual action ignored.");
  }

  function completeTutorial(state, storage = null) {
    const next = clone(state);
    if (!next.tutorial) {
      next.tutorial = createTutorialState({ tutorialCompleted: true }, next.restart ? next.restart.run : 1);
    }
    const wasComplete = next.tutorial.completed;
    if (!wasComplete) {
      next.tutorial.contract.status = "complete";
      next.tutorial.contract.completedAtTick = next.tick;
      next.tutorial.completed = true;
      next.tutorial.status = "summary";
      next.tutorial.completedAtTick = next.tick;
      setTutorialStepInPlace(next, "shift-summary");
    }
    next.tutorial.completionPersisted = writeTutorialCompletion(storage, true) || next.tutorial.completionPersisted;
    return withLog(next, wasComplete ? "Training Shift completion persisted." : "Training Shift marked complete.");
  }

  function replayTutorial(state) {
    return createInitialState({
      run: 1,
      seed: state && state.restart ? state.restart.seed : 7103,
      upgrades: state && state.upgrades ? state.upgrades.purchased : [],
      tutorialCompleted: false,
      replayTutorial: true,
    });
  }

  function enqueueJob(state, jobTypeId) {
    const jobType = byId(GAME_DATA.jobTypes, jobTypeId);
    if (!jobType) {
      throw new Error(`Unknown job type: ${jobTypeId}`);
    }
    const next = clone(state);
    const priority = next.queue.length + 1;
    next.queue.push(createQueueEntry(next, jobTypeId, priority));
    applyQueuePolicy(next);
    return withLog(next, `${jobType.name} queued.`);
  }

  function reprioritizeQueue(state, entryId, direction = "up") {
    const next = clone(state);
    const index = next.queue.findIndex((entry) => entry.id === entryId);
    if (index < 0) {
      return withLog(next, "No queued job selected for priority change.");
    }
    const target = direction === "down" ? index + 1 : index - 1;
    if (target < 0 || target >= next.queue.length) {
      return withLog(next, "Queue priority already at boundary.");
    }
    const [entry] = next.queue.splice(index, 1);
    next.queue.splice(target, 0, entry);
    applyQueuePolicy(next);
    return withLog(next, `${jobName(entry.jobTypeId)} priority raised.`);
  }

  function cancelQueueEntry(state, entryId) {
    const next = clone(state);
    const index = next.queue.findIndex((entry) => entry.id === entryId);
    if (index < 0) {
      return withLog(next, "No queued job available to cancel.");
    }
    const [removed] = next.queue.splice(index, 1);
    normalizeQueuePriorities(next);
    return withLog(next, `${jobName(removed.jobTypeId)} cancelled.`);
  }

  function assignJobToLane(state, laneId, entryId = null) {
    const next = clone(state);
    const lane = byId(next.lanes, laneId) || next.lanes.find((candidate) => (
      candidate.status === "idle" && laneGridAvailable(next, candidate)
    ));
    if (!lane || lane.status !== "idle") {
      return withLog(next, "No idle lane available.");
    }
    if (!laneGridAvailable(next, lane)) {
      return withLog(next, `${lane.name} grid sector is unavailable.`);
    }
    const entryIndex = entryId
      ? next.queue.findIndex((entry) => entry.id === entryId && entry.status === "queued")
      : next.queue.findIndex((entry) => entry.status === "queued");
    if (entryIndex < 0) {
      return withLog(next, "No releasable queued job is available.");
    }
    const [entry] = next.queue.splice(entryIndex, 1);
    normalizeQueuePriorities(next);
    const jobType = byId(GAME_DATA.jobTypes, entry.jobTypeId);
    lane.currentJob = {
      entryId: entry.id,
      jobTypeId: entry.jobTypeId,
      status: "assigned",
      duration: runtimeForLane(jobType, lane),
      remaining: runtimeForLane(jobType, lane),
      inputsConsumed: false,
      startedAtTick: null,
      emergency: entry.emergency,
      sourceContractId: entry.sourceContractId,
      gridDirective: entry.gridDirective,
      sourceDirectiveId: entry.sourceDirectiveId,
      breachDirective: entry.breachDirective,
      sourceBreachId: entry.sourceBreachId,
      freightDirective: entry.freightDirective,
      sourceFreightId: entry.sourceFreightId,
      sabotageDirective: entry.sabotageDirective,
      sourceSabotageId: entry.sourceSabotageId,
      compromised: entry.compromised ? clone(entry.compromised) : null,
    };
    lane.status = "assigned";
    lane.progress = 0;
    lane.runRemaining = lane.currentJob.remaining;
    next.selection.selectedJobId = null;
    next.selection.selectedLaneId = lane.id;
    next.selection.selectedObjectType = "lane";
    next.selection.lastAction = "assign";
    updateTutorialAfterAssignmentInPlace(next, lane, jobType);
    return withLog(next, `${jobType.name} assigned to ${lane.name}.`);
  }

  function startLane(state, laneId) {
    const next = clone(state);
    const lane = byId(next.lanes, laneId);
    if (!lane || !lane.currentJob) {
      return withLog(next, "Lane has no assigned job.");
    }
    if (!laneGridAvailable(next, lane)) {
      return withLog(next, `${lane.name} grid sector is unavailable.`);
    }
    if (lane.fault) {
      lane.status = "blocked";
      lane.currentJob.status = "blocked";
      return withLog(next, `${lane.name} requires recovery before restart.`);
    }
    if (lane.status === "recovering") {
      return withLog(next, `${lane.name} is still recovering.`);
    }
    const jobType = byId(GAME_DATA.jobTypes, lane.currentJob.jobTypeId);
    if (!canPay(next.resources, jobType.inputs)) {
      lane.status = "blocked";
      lane.currentJob.status = "blocked";
      return withLog(next, `${lane.name} blocked by missing inputs.`);
    }
    if (!lane.currentJob.inputsConsumed) {
      applyBundle(next.resources, jobType.inputs, -1);
      lane.currentJob.inputsConsumed = true;
    }
    lane.status = "running";
    lane.currentJob.status = "running";
    lane.currentJob.startedAtTick = next.tick;
    lane.runRemaining = lane.currentJob.remaining;
    next.selection.selectedLaneId = lane.id;
    next.selection.selectedObjectType = "lane";
    next.selection.lastAction = "start";
    updateTutorialAfterStartInPlace(next, lane);
    return withLog(next, `${lane.name} started ${jobType.name}.`);
  }

  function startAllLanes(state) {
    return state.lanes.reduce((runningState, lane) => {
      if (lane.status === "assigned" || lane.status === "blocked") {
        return startLane(runningState, lane.id);
      }
      return runningState;
    }, state);
  }

  function pauseLane(state, laneId) {
    const next = clone(state);
    const lane = byId(next.lanes, laneId);
    if (!lane || lane.status !== "running" || !lane.currentJob) {
      return withLog(next, "No running lane selected to pause.");
    }
    lane.status = "assigned";
    lane.currentJob.status = "assigned";
    lane.runRemaining = lane.currentJob.remaining;
    if (lane.overdrive && lane.overdrive.active) {
      lane.overdrive.active = false;
      refreshLanePerformance(next, lane);
      rescaleCurrentJobForLane(lane);
    }
    next.selection.selectedLaneId = lane.id;
    next.selection.selectedObjectType = "lane";
    next.selection.lastAction = "pause";
    return withLog(next, `${lane.name} paused with ${jobName(lane.currentJob.jobTypeId)} staged.`);
  }

  function completeLaneJob(state, lane) {
    const completedJob = lane.currentJob;
    const jobType = byId(GAME_DATA.jobTypes, completedJob.jobTypeId);
    applyBundle(state.resources, jobType.outputs, 1);
    Object.entries(jobType.outputs).forEach(([resource, amount]) => {
      if (amount > 0) {
        state.produced[resource] = (state.produced[resource] || 0) + amount;
      }
    });
    lane.completedJobs += 1;
    lane.currentJob = null;
    lane.status = "idle";
    lane.progress = 0;
    lane.runRemaining = 0;
    state.log.unshift({ tick: state.tick, message: `${lane.name} completed ${jobType.name}.` });
    if (completedJob.sourceDirectiveId) {
      const directive = byId(GAME_DATA.grid.auditDirectives, completedJob.sourceDirectiveId);
      if (directive) {
        completeAuditDirectiveInPlace(state, directive, false);
      }
    }
    if (completedJob.breachDirective) {
      completeBreachCountermeasureInPlace(state, completedJob);
    }
    if (completedJob.freightDirective) {
      completeFreightInspectionInPlace(state, completedJob);
    }
    if (completedJob.sabotageDirective) {
      completeSabotageSweepInPlace(state, completedJob);
    }
    if (completedJob.compromised) {
      applyCompromisedJobCompletion(state, lane, completedJob);
    }
    evaluateContracts(state);
    evaluateTutorialContractInPlace(state);
  }

  function applyFaultToLane(state, lane, faultType) {
    applyBundle(state.resources, faultType.penalty, 1);
    const recoveryTicks = Math.max(1, faultType.recoveryTicks + state.upgrades.effects.recoveryTicksBonus);
    lane.status = "blocked";
    lane.recoveryRemaining = 0;
    lane.fault = {
      id: faultType.id,
      name: faultType.name,
      recovery: clone(faultType.recovery),
      recoveryTicks,
      decision: faultType.decision,
      phase: "blocked",
      tick: state.tick,
    };
    if (lane.currentJob) {
      lane.currentJob.status = "blocked";
    }
    state.faults.history.unshift({ laneId: lane.id, faultTypeId: faultType.id, tick: state.tick });
    state.log.unshift({ tick: state.tick, message: `${lane.name} blocked by ${faultType.name}; ${faultType.decision}.` });
  }

  function maybeTriggerFault(state, lane) {
    if (!state.faults.enabled || state.tick <= state.faults.graceTicks || lane.fault || !lane.currentJob) {
      return false;
    }
    if (tutorialOwnsLaneFaults(state, lane)) {
      return false;
    }
    const roll = advanceSeed(state);
    if (roll >= lane.jamRisk) {
      return false;
    }
    const faultIndex = Math.floor(advanceSeed(state) * GAME_DATA.faultTypes.length) % GAME_DATA.faultTypes.length;
    applyFaultToLane(state, lane, GAME_DATA.faultTypes[faultIndex]);
    return true;
  }

  function advanceLaneRecovery(state, lane) {
    if (lane.status !== "recovering" || !lane.fault) {
      return;
    }
    lane.recoveryRemaining = Math.max(0, lane.recoveryRemaining - 1);
    if (lane.recoveryRemaining > 0) {
      return;
    }
    const recoveredJob = lane.currentJob;
    const faultName = lane.fault.name;
    lane.fault = null;
    lane.status = recoveredJob ? "assigned" : "idle";
    lane.progress = recoveredJob ? lane.progress : 0;
    if (recoveredJob) {
      lane.currentJob.status = "assigned";
    }
    updateTutorialAfterRecoveryClearInPlace(state, lane);
    state.log.unshift({ tick: state.tick, message: `${lane.name} cleared ${faultName}; restart required.` });
  }

  function maybeActivateEmergencyContracts(state) {
    if (!state.campaign || !state.campaign.emergency.contractId) {
      return false;
    }
    const emergency = byId(state.contracts, state.campaign.emergency.contractId);
    if (!emergency || emergency.status !== "pending" || state.tick < emergency.activationTick) {
      return false;
    }
    emergency.status = "active";
    emergency.startedAtTick = state.tick;
    emergency.timeRemaining = emergency.deadline;
    state.campaign.emergency.status = "active";
    if (!state.campaign.emergency.queued && emergency.jobTypeId) {
      state.queue.unshift(createQueueEntry(state, emergency.jobTypeId, 1, {
        emergency: true,
        sourceContractId: emergency.id,
      }));
      state.campaign.emergency.queued = true;
    }
    applyQueuePolicy(state);
    state.log.unshift({ tick: state.tick, message: `${emergency.name} emergency order active.` });
    return true;
  }

  function stepFactory(state, ticks = 1) {
    const next = clone(state);
    for (let i = 0; i < ticks; i += 1) {
      if (next.run.status !== "active") {
        break;
      }
      next.tick += 1;
      maybeActivateEmergencyContracts(next);
      advanceBreachState(next);
      advanceGridState(next);
      advanceRailSabotageState(next);
      advanceFreightState(next);
      advanceCrisisArbitrationState(next);
      next.lanes.forEach((lane) => {
        advanceLaneRecovery(next, lane);
        if (lane.status !== "running" || !lane.currentJob) {
          return;
        }
        if (maybeTriggerFault(next, lane)) {
          return;
        }
        lane.currentJob.remaining = Math.max(0, lane.currentJob.remaining - 1);
        lane.runRemaining = lane.currentJob.remaining;
        lane.progress = Math.round(((lane.currentJob.duration - lane.currentJob.remaining) / lane.currentJob.duration) * 100);
        if (maybeTriggerTutorialJamInPlace(next, lane)) {
          return;
        }
        if (lane.currentJob.remaining === 0) {
          completeLaneJob(next, lane);
        }
      });
      evaluateContracts(next);
      evaluateTutorialContractInPlace(next);
    }
    next.log = next.log.slice(0, 8);
    refreshRuntimeSurfacesInPlace(next);
    return next;
  }

  function activateNextContract(state) {
    const nextContract = state.contracts.find((contract) => contract.status === "open");
    if (!nextContract) {
      return;
    }
    nextContract.status = "active";
    nextContract.startedAtTick = state.tick;
    nextContract.timeRemaining = nextContract.deadline;
    state.log.unshift({ tick: state.tick, message: `${nextContract.name} contract now active.` });
  }

  function updateContractClock(contract, state) {
    if (contract.status !== "active") {
      return;
    }
    contract.timeRemaining = Math.max(0, contract.deadline - (state.tick - contract.startedAtTick));
  }

  function contractSatisfied(contract, state) {
    return Object.entries(contract.requirement).every(([resource, amount]) => (state.produced[resource] || 0) >= amount);
  }

  function recordBreachContractCompletion(state, contract) {
    if (!state.breach || contract.family !== "breach") {
      return;
    }
    state.breach.intensity = Math.max(0, state.breach.intensity - 2);
    if (state.breach.status === "active") {
      state.breach.containment.status = "contract-contained";
    }
    state.breach.history.unshift({ tick: state.tick, event: "breach-contract-complete", contractId: contract.id });
  }

  function recordBreachContractFailure(state, contract) {
    if (!state.breach || !["active", "dormant"].includes(state.breach.status)) {
      return;
    }
    const pressure = contract.emergency ? 2 : 1;
    state.breach.intensity += pressure;
    if (state.grid) {
      state.grid.pressure += pressure;
    }
    state.breach.history.unshift({ tick: state.tick, event: "contract-failed", contractId: contract.id });
  }

  function evaluateRunOutcome(state) {
    const openOrActive = state.contracts.some((contract) => (
      contract.status === "open" || contract.status === "active" || contract.status === "pending"
    ));
    const completeCount = state.contracts.filter((contract) => contract.status === "complete").length;
    const failedCount = state.contracts.filter((contract) => contract.status === "failed").length;
    state.run.completedContracts = completeCount;
    state.run.failedContracts = failedCount;
    if (completeCount === state.contracts.length && state.run.status !== "success") {
      state.run.status = "success";
      state.log.unshift({ tick: state.tick, message: "All contracts cleared. Install upgrades or restart." });
    } else if (!openOrActive && failedCount > 0 && state.run.status !== "failed") {
      state.run.status = "failed";
      state.log.unshift({ tick: state.tick, message: "Dispatch window failed. Restart to replay." });
    }
  }

  function evaluateContracts(state) {
    state.contracts.forEach((contract) => {
      if (contract.status !== "active") {
        return;
      }
      updateContractClock(contract, state);
      if (contractSatisfied(contract, state)) {
        contract.status = "complete";
        contract.completedAtTick = state.tick;
        if (contract.emergency && state.campaign) {
          state.campaign.emergency.status = "complete";
        }
        applyBundle(state.resources, contract.reward, 1);
        recordBreachContractCompletion(state, contract);
        state.log.unshift({ tick: state.tick, message: `${contract.name} contract complete.` });
        activateNextContract(state);
        return;
      }
      if (contract.timeRemaining === 0) {
        contract.status = "failed";
        contract.failedAtTick = state.tick;
        if (contract.emergency && state.campaign) {
          state.campaign.emergency.status = "failed";
        }
        applyBundle(state.resources, contract.penalty, 1);
        recordBreachContractFailure(state, contract);
        state.log.unshift({ tick: state.tick, message: `${contract.name} contract failed; penalty applied.` });
        activateNextContract(state);
      }
    });
    applyQueuePolicy(state);
    evaluateRunOutcome(state);
  }

  function injectLaneFault(state, laneId, faultTypeId = "material-jam") {
    const next = clone(state);
    const lane = byId(next.lanes, laneId);
    const fault = byId(GAME_DATA.faultTypes, faultTypeId);
    if (!lane || !fault) {
      return withLog(next, "Fault signal ignored.");
    }
    applyFaultToLane(next, lane, fault);
    next.log = next.log.slice(0, 8);
    return next;
  }

  function recoverLane(state, laneId) {
    const next = clone(state);
    const lane = byId(next.lanes, laneId);
    if (!lane || !lane.fault) {
      return withLog(next, "No lane fault to recover.");
    }
    if (!canPay(next.resources, lane.fault.recovery)) {
      return withLog(next, `${lane.name} recovery lacks resources.`);
    }
    applyBundle(next.resources, lane.fault.recovery, -1);
    lane.status = "recovering";
    lane.recoveryRemaining = lane.fault.recoveryTicks;
    lane.fault.phase = "recovering";
    if (lane.currentJob) {
      lane.currentJob.status = "recovering";
    }
    next.selection.selectedLaneId = lane.id;
    next.selection.selectedObjectType = "lane";
    next.selection.lastAction = "recover";
    updateTutorialAfterRecoveryStartInPlace(next, lane);
    return withLog(next, `${lane.name} recovery started.`);
  }

  function resetFactoryState(state = null) {
    const nextRun = state && state.restart ? state.restart.run + 1 : 1;
    const seed = state && state.seed ? state.seed + 101 : 7103;
    const next = createInitialState({
      run: nextRun,
      seed,
      upgrades: state && state.upgrades ? state.upgrades.purchased : [],
      campaign: campaignForRestart(state),
      tutorialCompleted: state && state.tutorial ? state.tutorial.completed : false,
    });
    next.restart.reason = "operator restart";
    next.restart.lastResetTick = state ? state.tick : 0;
    next.log.unshift({ tick: 0, message: `Shift ${String(nextRun).padStart(2, "0")} restarted.` });
    return next;
  }

  function runtimeForLane(jobType, lane) {
    return Math.max(1, Math.ceil(jobType.duration / lane.throughput));
  }

  function jobName(jobTypeId) {
    const jobType = byId(GAME_DATA.jobTypes, jobTypeId);
    return jobType ? jobType.name : titleCase(jobTypeId);
  }

  function contractProgress(contract, state) {
    return Object.entries(contract.requirement).map(([resource, amount]) => ({
      resource,
      required: amount,
      current: state.produced[resource] || 0,
      timeRemaining: contract.timeRemaining,
      status: contract.status,
    }));
  }

  function nextEmergencyShift(campaign) {
    return GAME_DATA.campaign.shifts.find((shift) => (
      shift.shift > campaign.shift && shift.emergencyContractId
    )) || null;
  }

  function formatShiftNumber(shift) {
    return String(shift).padStart(2, "0");
  }

  function gridSurfaceState(state) {
    const grid = state.grid;
    const directive = auditDirectiveDefinition(state);
    return {
      release: grid.release,
      pressure: grid.pressure,
      load: grid.currentLoad,
      threshold: grid.blackout.threshold,
      reserve: {
        available: grid.reserve.available,
        capacity: grid.reserve.capacity,
        drawn: grid.reserve.drawn,
        debt: grid.reserve.debt,
      },
      blackout: {
        status: grid.blackout.status,
        activeSectorId: grid.blackout.activeSectorId,
        events: grid.blackout.events.length,
      },
      audit: {
        status: grid.audit.status,
        directiveId: grid.audit.directiveId,
        name: directive ? directive.name : titleCase(grid.audit.directiveId),
        dueTick: grid.audit.dueTick,
        deferrals: grid.audit.deferrals,
        queued: grid.audit.queued,
        completed: grid.audit.completed,
        failures: grid.audit.failures,
        repairCost: directive ? clone(directive.repairCost) : {},
        deferCost: directive ? clone(directive.deferCost) : {},
      },
      sectors: grid.sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        laneId: sector.laneId,
        laneName: byId(state.lanes, sector.laneId)?.name || titleCase(sector.laneId),
        connectedTo: sector.connectedTo.slice(),
        route: sector.route,
        isolated: sector.isolated,
        powered: sector.powered,
        blackoutLockedUntil: sector.blackoutLockedUntil,
        blackoutCount: sector.blackoutCount,
        reserveDraws: sector.reserveDraws,
        breach: sector.breach ? clone(sector.breach) : cleanBreachSectorState(sector.id),
      })),
      choices: clone(grid.choices),
    };
  }

  function breachSurfaceState(state) {
    const breach = state.breach;
    const source = breach ? breachSourceDefinition(breach.sourceId) : null;
    if (!breach) {
      return null;
    }
    return {
      release: breach.release,
      status: breach.status,
      intensity: breach.intensity,
      threshold: breach.threshold,
      source: {
        id: breach.sourceId,
        name: source ? source.name : titleCase(breach.sourceId),
      },
      trace: {
        status: breach.trace.status,
        dueTick: breach.trace.dueTick,
        deferrals: breach.trace.deferrals,
        resolved: breach.trace.resolved,
        failures: breach.trace.failures,
        cost: source ? clone(source.traceCost) : {},
        deferCost: source ? clone(source.deferCost) : {},
      },
      contamination: {
        queuedEntries: breach.contamination.queuedEntries,
        completedCompromisedJobs: breach.contamination.completedCompromisedJobs,
        sectors: breach.contamination.sectors.slice(),
      },
      containment: {
        status: breach.containment.status,
        cleansedEntries: breach.containment.cleansedEntries,
        quarantinedLanes: breach.containment.quarantinedLanes.slice(),
        shieldedSectors: breach.containment.shieldedSectors,
        countermeasures: breach.containment.countermeasures,
        tracedSources: breach.containment.tracedSources,
      },
      queue: state.queue.map((entry) => ({
        id: entry.id,
        jobTypeId: entry.jobTypeId,
        status: entry.status,
        breachDirective: Boolean(entry.breachDirective),
        sourceBreachId: entry.sourceBreachId,
        compromised: entry.compromised ? clone(entry.compromised) : null,
      })),
      lanes: state.lanes.map((lane) => ({
        id: lane.id,
        status: lane.status,
        breachQuarantine: lane.breachQuarantine ? clone(lane.breachQuarantine) : null,
        currentJob: lane.currentJob ? {
          jobTypeId: lane.currentJob.jobTypeId,
          breachDirective: Boolean(lane.currentJob.breachDirective),
          sourceBreachId: lane.currentJob.sourceBreachId,
          compromised: lane.currentJob.compromised ? clone(lane.currentJob.compromised) : null,
        } : null,
      })),
      sectors: state.grid.sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        laneId: sector.laneId,
        breach: sector.breach ? clone(sector.breach) : cleanBreachSectorState(sector.id),
      })),
      choices: clone(breach.choices),
      carryover: clone(breach.carryover),
      history: breach.history.slice(0, 6),
    };
  }

  function freightSurfaceState(state) {
    const freight = state.freight;
    if (!freight) {
      return null;
    }
    return {
      release: freight.release,
      status: freight.status,
      routeSecurity: {
        pressure: freight.routeSecurity.pressure,
        events: freight.routeSecurity.events.slice(0, 6),
      },
      outcomes: clone(freight.outcomes),
      choices: clone(freight.choices),
      carryover: clone(freight.carryover),
      manifests: freight.manifests.map((manifest) => {
        const definition = freightManifestDefinition(manifest.id);
        const lane = freightDockLane(state, manifest);
        const sector = gridSectorState(state, manifest.sectorId);
        return {
          id: manifest.id,
          name: manifest.name,
          dockId: manifest.dockId,
          dockName: manifest.dockName,
          laneId: manifest.laneId,
          laneName: lane ? lane.name : titleCase(manifest.laneId),
          sectorId: manifest.sectorId,
          sectorStatus: sector ? {
            route: sector.route,
            isolated: sector.isolated,
            powered: sector.powered,
            blackoutLockedUntil: sector.blackoutLockedUntil,
            breach: sector.breach ? clone(sector.breach) : cleanBreachSectorState(sector.id),
          } : null,
          contractId: manifest.contractId,
          availableShift: manifest.availableShift,
          status: manifest.status,
          outcome: manifest.outcome,
          window: clone(manifest.window),
          cargo: {
            required: clone(manifest.cargo.required),
            staged: clone(manifest.cargo.staged),
            remaining: freightCargoRemaining(manifest),
            stagedAtTick: manifest.cargo.stagedAtTick,
          },
          inspection: clone(manifest.inspection),
          route: clone(manifest.route),
          security: clone(manifest.security),
          sabotage: manifest.sabotage ? clone(manifest.sabotage) : null,
          integrity: manifest.integrity,
          payout: definition ? clone(definition.payout) : {},
          partialPayout: definition ? clone(definition.partialPayout) : {},
          penalty: definition ? clone(definition.penalty) : {},
          dockReady: freightDockReady(state, manifest),
          openedAtTick: manifest.openedAtTick,
          sealedAtTick: manifest.sealedAtTick,
          launchedAtTick: manifest.launchedAtTick,
          arrivalTick: manifest.arrivalTick,
          events: manifest.events.slice(0, 6),
        };
      }),
    };
  }

  function railSabotageSurfaceState(state) {
    const railSabotage = state.railSabotage;
    if (!railSabotage) {
      return null;
    }
    return {
      release: railSabotage.release,
      status: railSabotage.status,
      pressure: railSabotage.pressure,
      outcomes: clone(railSabotage.outcomes),
      choices: clone(railSabotage.choices),
      carryover: clone(railSabotage.carryover),
      incidents: railSabotage.incidents.map((incident) => {
        const definition = railSabotageIncidentDefinition(incident.id);
        const manifest = freightManifestState(state, incident.manifestId);
        const lane = byId(state.lanes, incident.laneId);
        const sector = gridSectorState(state, incident.sectorId);
        return {
          id: incident.id,
          name: incident.name,
          dockId: incident.dockId,
          dockName: incident.dockName,
          laneId: incident.laneId,
          laneName: lane ? lane.name : titleCase(incident.laneId),
          sectorId: incident.sectorId,
          sectorStatus: sector ? {
            route: sector.route,
            isolated: sector.isolated,
            powered: sector.powered,
            breach: sector.breach ? clone(sector.breach) : cleanBreachSectorState(sector.id),
          } : null,
          manifestId: incident.manifestId,
          manifestStatus: manifest ? manifest.status : "missing",
          manifestIntegrity: manifest ? manifest.integrity : null,
          manifestRoute: manifest ? clone(manifest.route) : null,
          manifestSabotage: manifest && manifest.sabotage ? clone(manifest.sabotage) : null,
          dockReady: manifest ? freightDockReady(state, manifest) : false,
          contractId: incident.contractId,
          availableShift: incident.availableShift,
          status: incident.status,
          outcome: incident.outcome,
          openedAtTick: incident.openedAtTick,
          resolvedAtTick: incident.resolvedAtTick,
          window: clone(incident.window),
          trigger: clone(incident.trigger),
          requirements: clone(incident.requirements),
          pressure: clone(incident.pressure),
          scan: clone(incident.scan),
          patrol: clone(incident.patrol),
          decoy: clone(incident.decoy),
          dock: clone(incident.dock),
          containment: {
            ...clone(incident.containment),
            score: railSabotageMitigationScore(incident),
          },
          carrier: clone(incident.carrier),
          laneDamage: clone(incident.laneDamage),
          mitigation: definition ? clone(definition.mitigation) : {},
          partialPenalty: definition ? clone(definition.partialPenalty) : {},
          failurePenalty: definition ? clone(definition.failurePenalty) : {},
          events: incident.events.slice(0, 6),
        };
      }),
    };
  }

  function crisisArbitrationSurfaceState(state) {
    const crisisArbitration = state.crisisArbitration;
    if (!crisisArbitration) {
      return null;
    }
    return {
      release: crisisArbitration.release,
      status: crisisArbitration.status,
      pressure: crisisArbitration.pressure,
      outcomes: clone(crisisArbitration.outcomes),
      choices: clone(crisisArbitration.choices),
      carryover: clone(crisisArbitration.carryover),
      activeDocket: crisisArbitration.cases
        .filter((caseState) => crisisCaseActionable(caseState))
        .map((caseState) => ({
          id: caseState.id,
          name: caseState.name,
          status: caseState.status,
          dueTick: caseState.dueTick,
          pressure: caseState.pressure.current,
          evidenceScore: caseState.evidence.score,
          assignedEvidence: caseState.evidence.assigned.map((entry) => entry.sourceId),
          priorityOrder: caseState.priorityOrder.slice(),
        })),
      cases: crisisArbitration.cases.map((caseState) => {
        const definition = crisisCaseDefinition(caseState.id);
        const linked = crisisLinkedState(state, caseState);
        return {
          id: caseState.id,
          name: caseState.name,
          availableShift: caseState.availableShift,
          status: caseState.status,
          outcome: caseState.outcome,
          openedAtTick: caseState.openedAtTick,
          resolvedAtTick: caseState.resolvedAtTick,
          dueTick: caseState.dueTick,
          window: clone(caseState.window),
          rulingTicks: caseState.rulingTicks,
          linked: {
            ...clone(caseState.linked),
            laneStatus: linked.lane ? linked.lane.status : "missing",
            laneGridLock: linked.lane && linked.lane.gridLock ? clone(linked.lane.gridLock) : null,
            sectorStatus: linked.sector ? {
              route: linked.sector.route,
              isolated: linked.sector.isolated,
              powered: linked.sector.powered,
              reserveDraws: linked.sector.reserveDraws,
              breach: linked.sector.breach ? clone(linked.sector.breach) : cleanBreachSectorState(caseState.linked.sectorId),
            } : null,
            breachStatus: state.breach ? state.breach.status : "missing",
            breachSourceName: linked.source ? linked.source.name : titleCase(caseState.linked.breachSourceId),
            manifestStatus: linked.manifest ? linked.manifest.status : "missing",
            manifestIntegrity: linked.manifest ? linked.manifest.integrity : null,
            railStatus: linked.incident ? linked.incident.status : "missing",
            railPressure: linked.incident ? clone(linked.incident.pressure) : null,
            contractStatus: linked.contract ? linked.contract.status : "missing",
          },
          evidence: clone(caseState.evidence),
          priorityOrder: caseState.priorityOrder.slice(),
          priorityOptions: caseState.priorityOrder.map((priorityId) => ({
            id: priorityId,
            name: GAME_DATA.crisisArbitration.rulings[priorityId].name,
            score: crisisPriorityReadinessScore(state, caseState, priorityId),
          })),
          ruling: clone(caseState.ruling),
          override: clone(caseState.override),
          deferrals: caseState.deferrals,
          protection: clone(caseState.protection),
          pressure: clone(caseState.pressure),
          bindingScore: definition ? definition.bindingScore : 0,
          partialScore: definition ? definition.partialScore : 0,
          reward: definition ? clone(definition.reward) : {},
          partialPenalty: definition ? clone(definition.partialPenalty) : {},
          failurePenalty: definition ? clone(definition.failurePenalty) : {},
          events: caseState.events.slice(0, 6),
        };
      }),
      history: crisisArbitration.history.slice(0, 8),
    };
  }

  function campaignSurfaceState(state) {
    const campaign = state.campaign;
    const policy = byId(GAME_DATA.campaign.queuePolicies, campaign.queuePolicy) || GAME_DATA.campaign.queuePolicies[0];
    const emergencyContract = state.contracts.find((contract) => contract.emergency) || null;
    const nextEmergency = nextEmergencyShift(campaign);
    let emergencyTitle = "Emergency quiet";
    let emergencyDetail = nextEmergency
      ? `next shift ${formatShiftNumber(nextEmergency.shift)} arms t${nextEmergency.emergencyTick}`
      : "no queued emergency order";

    if (emergencyContract) {
      emergencyTitle = emergencyContract.name;
      if (emergencyContract.status === "pending") {
        emergencyDetail = `pending / arms t${emergencyContract.activationTick} / ${emergencyContract.deadline} ticks`;
      } else if (emergencyContract.status === "active") {
        emergencyDetail = `active / ${emergencyContract.timeRemaining} ticks / ${formatBundle(emergencyContract.requirement)}`;
      } else {
        emergencyDetail = `${emergencyContract.status} / ${formatBundle(emergencyContract.requirement)}`;
      }
    }

    const ledger = Array.isArray(campaign.ledger) ? campaign.ledger : [];
    const lastLedger = ledger.length ? ledger[ledger.length - 1] : null;
    const ledgerSummary = lastLedger
      ? `shift ${formatShiftNumber(lastLedger.shift)} ${lastLedger.completedContracts}c/${lastLedger.failedContracts}f / emergency ${lastLedger.emergencyStatus}`
      : "no prior shift ledger";

    return {
      release: campaign.release,
      shift: campaign.shift,
      phase: campaign.phase,
      demand: campaign.demand,
      deadlineDelta: campaign.deadlineDelta,
      runStatus: state.run.status,
      tick: state.tick,
      queuePolicy: {
        id: policy.id,
        name: policy.name,
        description: policy.description,
      },
      emergency: {
        status: emergencyContract ? emergencyContract.status : campaign.emergency.status,
        title: emergencyTitle,
        detail: emergencyDetail,
        contractId: emergencyContract ? emergencyContract.id : null,
      },
      progression: {
        run: state.restart.run,
        ledgerCount: ledger.length,
        latest: ledgerSummary,
      },
      choices: {
        queuePolicyChanges: campaign.choices.queuePolicyChanges,
        laneOverdrives: campaign.choices.laneOverdrives,
        activeOverdrives: state.lanes.filter((lane) => lane.overdrive && lane.overdrive.active).length,
        gridPowerRoutes: campaign.choices.gridPowerRoutes,
        reserveDraws: campaign.choices.reserveDraws,
        sectorIsolations: campaign.choices.sectorIsolations,
        auditDeferrals: campaign.choices.auditDeferrals,
        breachCleanses: campaign.choices.breachCleanses,
        breachQuarantines: campaign.choices.breachQuarantines,
        breachTraces: campaign.choices.breachTraces,
        breachDeferrals: campaign.choices.breachDeferrals,
        breachCountermeasures: campaign.choices.breachCountermeasures,
        freightStages: campaign.choices.freightStages,
        freightSeals: campaign.choices.freightSeals,
        freightLaunches: campaign.choices.freightLaunches,
        freightEscorts: campaign.choices.freightEscorts,
        freightDefenseScreens: campaign.choices.freightDefenseScreens,
        freightReserveClearances: campaign.choices.freightReserveClearances,
        freightReroutes: campaign.choices.freightReroutes,
        freightHolds: campaign.choices.freightHolds,
        sabotageScans: campaign.choices.sabotageScans,
        sabotagePatrolDrones: campaign.choices.sabotagePatrolDrones,
        sabotageDefenseScreens: campaign.choices.sabotageDefenseScreens,
        sabotageDecoys: campaign.choices.sabotageDecoys,
        sabotageDockLockdowns: campaign.choices.sabotageDockLockdowns,
        sabotageDockReopens: campaign.choices.sabotageDockReopens,
        sabotageInterceptions: campaign.choices.sabotageInterceptions,
        sabotageLaneRepairs: campaign.choices.sabotageLaneRepairs,
        sabotageCarrierReroutes: campaign.choices.sabotageCarrierReroutes,
        crisisEvidenceAssignments: campaign.choices.crisisEvidenceAssignments,
        crisisGridFirstRulings: campaign.choices.crisisGridFirstRulings,
        crisisFreightFirstRulings: campaign.choices.crisisFreightFirstRulings,
        crisisBreachFirstRulings: campaign.choices.crisisBreachFirstRulings,
        crisisRailFirstRulings: campaign.choices.crisisRailFirstRulings,
        crisisEmergencyOverrides: campaign.choices.crisisEmergencyOverrides,
        crisisDeferrals: campaign.choices.crisisDeferrals,
        crisisLaneProtections: campaign.choices.crisisLaneProtections,
      },
      grid: gridSurfaceState(state),
      breach: breachSurfaceState(state),
      freight: freightSurfaceState(state),
      railSabotage: railSabotageSurfaceState(state),
      crisisArbitration: crisisArbitrationSurfaceState(state),
    };
  }

  function campaignForRestart(state) {
    if (!state || !state.campaign) {
      return null;
    }
    const ledger = Array.isArray(state.campaign.ledger) ? clone(state.campaign.ledger) : [];
    const previousCarryover = state.grid && state.grid.carryover ? state.grid.carryover : {};
    const blackoutEvents = state.grid ? state.grid.blackout.events.length : 0;
    const reserveDraws = state.grid ? state.grid.reserve.draws : 0;
    const auditUnresolved = state.grid && ["active", "failed"].includes(state.grid.audit.status);
    const gridCarryover = {
      blackoutScar: Math.min(12, (previousCarryover.blackoutScar || 0) + blackoutEvents * 2),
      reserveDebt: Math.min(GAME_DATA.grid.reserve.capacity, Math.max(0, (previousCarryover.reserveDebt || 0) + reserveDraws)),
      auditPressure: Math.min(6, auditUnresolved ? 2 + state.grid.audit.deferrals : 0),
    };
    const previousBreachCarryover = state.breach && state.breach.carryover ? state.breach.carryover : {};
    const breachUnresolved = state.breach && ["active", "escaped"].includes(state.breach.status);
    const breachEscaped = state.breach && state.breach.status === "escaped";
    const breachSource = state.breach ? breachSourceDefinition(state.breach.sourceId) : null;
    const contaminatedSectors = state.grid
      ? state.grid.sectors
        .filter((sector) => sector.breach && ["contaminated", "quarantined", "scarred"].includes(sector.breach.status))
        .map((sector) => sector.id)
      : [];
    const breachCarryover = {
      signalScar: Math.min(
        12,
        (previousBreachCarryover.signalScar || 0)
          + (breachEscaped && breachSource ? breachSource.escapeScar : breachUnresolved ? 2 : 0)
          + (state.breach ? state.breach.contamination.completedCompromisedJobs : 0)
          + contaminatedSectors.length
      ),
      escapedSources: Math.min(
        6,
        (previousBreachCarryover.escapedSources || 0)
          + (breachEscaped ? 1 : 0)
      ),
      traceFailures: Math.min(
        6,
        Math.max(previousBreachCarryover.traceFailures || 0, state.breach ? state.breach.trace.failures : 0)
      ),
      contaminatedSectors: Array.from(new Set([
        ...(Array.isArray(previousBreachCarryover.contaminatedSectors) ? previousBreachCarryover.contaminatedSectors : []),
        ...contaminatedSectors,
      ])).slice(0, GAME_DATA.grid.sectors.length),
    };
    const previousFreightCarryover = state.freight && state.freight.carryover ? state.freight.carryover : {};
    const freightManifests = state.freight && Array.isArray(state.freight.manifests) ? state.freight.manifests : [];
    const unresolvedFreight = freightManifests.filter((manifest) => (
      ["available", "staged", "sealed", "enroute"].includes(manifest.status)
    ));
    const partialFreight = freightManifests.filter((manifest) => manifest.outcome === "partial");
    const failedFreight = freightManifests.filter((manifest) => manifest.outcome === "failed");
    const unresolvedLostCargo = unresolvedFreight
      .reduce((total, manifest) => (
        total + Object.values(manifest.cargo.staged || {}).reduce((sum, amount) => sum + amount, 0)
      ), 0);
    const freightCarryover = {
      lockdownScar: Math.min(
        12,
        (previousFreightCarryover.lockdownScar || 0)
          + failedFreight.length * 2
          + partialFreight.length
          + unresolvedFreight.length
          + Math.min(3, state.freight ? state.freight.routeSecurity.pressure : 0)
      ),
      lostCargo: Math.min(
        24,
        (previousFreightCarryover.lostCargo || 0) + unresolvedLostCargo
      ),
      delayedManifests: Math.min(
        12,
        (previousFreightCarryover.delayedManifests || 0) + unresolvedFreight.length
      ),
      completedShipments: Math.min(
        24,
        previousFreightCarryover.completedShipments || 0
      ),
    };
    const previousRailCarryover = state.railSabotage && state.railSabotage.carryover
      ? state.railSabotage.carryover
      : {};
    const railIncidents = state.railSabotage && Array.isArray(state.railSabotage.incidents)
      ? state.railSabotage.incidents
      : [];
    const unresolvedRail = railIncidents.filter((incident) => railSabotageIncidentActionable(incident));
    const damagedRailLanes = railIncidents
      .filter((incident) => incident.laneDamage && incident.laneDamage.status === "sabotaged")
      .map((incident) => incident.laneId);
    const railSabotageCarryover = {
      sabotageScar: Math.min(
        12,
        (previousRailCarryover.sabotageScar || 0) + unresolvedRail.length
      ),
      tamperedCargo: Math.min(
        24,
        (previousRailCarryover.tamperedCargo || 0) + unresolvedRail.length * 2
      ),
      damagedLanes: Array.from(new Set([
        ...(Array.isArray(previousRailCarryover.damagedLanes) ? previousRailCarryover.damagedLanes : []),
        ...damagedRailLanes,
      ])).slice(0, GAME_DATA.grid.sectors.length),
      containedCells: Math.min(
        24,
        previousRailCarryover.containedCells || 0
      ),
    };
    const previousCrisisCarryover = state.crisisArbitration && state.crisisArbitration.carryover
      ? state.crisisArbitration.carryover
      : {};
    const crisisCases = state.crisisArbitration && Array.isArray(state.crisisArbitration.cases)
      ? state.crisisArbitration.cases
      : [];
    const unresolvedCrisis = crisisCases.filter((caseState) => crisisCaseActionable(caseState));
    const partialCrisis = crisisCases.filter((caseState) => caseState.outcome === "partial");
    const failedCrisis = crisisCases.filter((caseState) => caseState.outcome === "failed");
    const crisisFailedIds = Array.from(new Set([
      ...(Array.isArray(previousCrisisCarryover.failedCases) ? previousCrisisCarryover.failedCases : []),
      ...failedCrisis.map((caseState) => caseState.id),
      ...unresolvedCrisis.map((caseState) => caseState.id),
    ]));
    const crisisDisputedLanes = Array.from(new Set([
      ...(Array.isArray(previousCrisisCarryover.disputedLanes) ? previousCrisisCarryover.disputedLanes : []),
      ...failedCrisis.map((caseState) => caseState.linked.laneId),
      ...unresolvedCrisis.map((caseState) => caseState.linked.laneId),
    ])).slice(0, GAME_DATA.grid.sectors.length);
    const crisisArbitrationCarryover = {
      arbitrationScar: Math.min(
        12,
        (previousCrisisCarryover.arbitrationScar || 0) + unresolvedCrisis.length
      ),
      failedCases: crisisFailedIds.slice(0, GAME_DATA.crisisArbitration.cases.length),
      disputedLanes: crisisDisputedLanes,
      overridesSpent: Math.min(
        24,
        Math.max(
          previousCrisisCarryover.overridesSpent || 0,
          state.crisisArbitration ? state.crisisArbitration.carryover.overridesSpent || 0 : 0
        )
      ),
      bindingRulings: Math.min(
        24,
        Math.max(
          previousCrisisCarryover.bindingRulings || 0,
          state.crisisArbitration ? state.crisisArbitration.carryover.bindingRulings || 0 : 0
        )
      ),
    };
    ledger.push({
      shift: state.campaign.shift,
      phase: state.campaign.phase,
      completedContracts: state.run.completedContracts,
      failedContracts: state.run.failedContracts,
      emergencyStatus: state.campaign.emergency.status,
      grid: state.grid ? {
        pressure: state.grid.pressure,
        blackoutEvents,
        reserveDraws,
        auditStatus: state.grid.audit.status,
        carryover: gridCarryover,
      } : null,
      breach: state.breach ? {
        status: state.breach.status,
        sourceId: state.breach.sourceId,
        intensity: state.breach.intensity,
        traceStatus: state.breach.trace.status,
        compromisedJobs: state.breach.contamination.completedCompromisedJobs,
        cleansedEntries: state.breach.containment.cleansedEntries,
        quarantinedLanes: state.breach.containment.quarantinedLanes.slice(),
        countermeasures: state.breach.containment.countermeasures,
        carryover: breachCarryover,
      } : null,
      freight: state.freight ? {
        status: state.freight.status,
        outcomes: clone(state.freight.outcomes),
        routeSecurityPressure: state.freight.routeSecurity.pressure,
        manifests: freightManifests.map((manifest) => ({
          id: manifest.id,
          status: manifest.status,
          outcome: manifest.outcome,
          integrity: manifest.integrity,
          stagedCargo: clone(manifest.cargo.staged),
        })),
        carryover: freightCarryover,
      } : null,
      railSabotage: state.railSabotage ? {
        status: state.railSabotage.status,
        pressure: state.railSabotage.pressure,
        outcomes: clone(state.railSabotage.outcomes),
        incidents: railIncidents.map((incident) => ({
          id: incident.id,
          status: incident.status,
          outcome: incident.outcome,
          pressure: incident.pressure.current,
          carrierDamage: incident.carrier.integrityDamage,
          laneDamage: incident.laneDamage.status,
        })),
        carryover: railSabotageCarryover,
      } : null,
      crisisArbitration: state.crisisArbitration ? {
        status: state.crisisArbitration.status,
        pressure: state.crisisArbitration.pressure,
        outcomes: clone(state.crisisArbitration.outcomes),
        cases: crisisCases.map((caseState) => ({
          id: caseState.id,
          status: caseState.status,
          outcome: caseState.outcome,
          dueTick: caseState.dueTick,
          evidenceScore: caseState.evidence.score,
          ruling: clone(caseState.ruling),
        })),
        carryover: crisisArbitrationCarryover,
      } : null,
      finishedAtTick: state.tick,
    });
    return {
      queuePolicy: state.campaign.queuePolicy,
      ledger,
      gridCarryover,
      breachCarryover,
      freightCarryover,
      railSabotageCarryover,
      crisisArbitrationCarryover,
    };
  }

  function initDom() {
    if (typeof document === "undefined") {
      return;
    }
    Object.assign(dom, {
      runChip: document.getElementById("run-chip"),
      objective: document.getElementById("objective-card"),
      topStats: document.getElementById("top-stats"),
      resources: document.getElementById("resource-readouts"),
      escalation: document.getElementById("escalation-surface"),
      grid: document.getElementById("grid-siege-board"),
      freight: document.getElementById("freight-lockdown-board"),
      sabotage: document.getElementById("rail-sabotage-board"),
      crisis: document.getElementById("crisis-arbitration-board"),
      lanes: document.getElementById("lane-board"),
      queue: document.getElementById("queue-list"),
      contracts: document.getElementById("contract-board"),
      upgrades: document.getElementById("upgrade-board"),
      jobs: document.getElementById("job-catalog"),
      log: document.getElementById("operator-log"),
      selectedDetail: document.getElementById("selected-detail"),
      contextActions: document.getElementById("context-actions"),
      jobSelect: document.getElementById("job-type-select"),
      queuePolicySelect: document.getElementById("queue-policy-select"),
      enqueue: document.getElementById("enqueue-job"),
      assignNext: document.getElementById("assign-next-job"),
      startAll: document.getElementById("start-all-lanes"),
      reprioritize: document.getElementById("reprioritize-job"),
      cancel: document.getElementById("cancel-job"),
      restart: document.getElementById("restart-factory"),
      helpToggle: document.getElementById("help-toggle"),
      helpDialog: document.getElementById("help-dialog"),
      replayTutorial: document.getElementById("replay-tutorial"),
    });
    currentState = createInitialState();
    renderStaticControls();
    bindControls();
    render(currentState);
    window.setInterval(() => {
      if (currentState && currentState.run.status === "active") {
        const waitingForFirstInput = currentState.tutorial
          && !currentState.tutorial.completed
          && [
            "select-smelt-circuits",
            "select-forge-line",
            "assign-forge-line",
            "start-forge-line",
          ].includes(currentState.tutorial.stepId);
        if (waitingForFirstInput) {
          return;
        }
        currentState = stepFactory(currentState, 1);
        render(currentState);
      }
    }, 900);
  }

  function renderStaticControls() {
    if (dom.jobSelect) {
      dom.jobSelect.innerHTML = GAME_DATA.jobTypes
        .map((jobType) => `<option value="${jobType.id}">${jobType.name}</option>`)
        .join("");
    }
    if (dom.queuePolicySelect) {
      dom.queuePolicySelect.innerHTML = GAME_DATA.campaign.queuePolicies
        .map((policy) => `<option value="${policy.id}">${policy.name}</option>`)
        .join("");
    }
  }

  function bindControls() {
    if (dom.contextActions) {
      dom.contextActions.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
          return;
        }
        if (button.dataset.action === "select-incoming") {
          currentState = selectJobCard(currentState, button.dataset.entry);
        } else {
          currentState = performContextAction(currentState, button.dataset.action);
        }
        render(currentState);
      });
    }
    if (dom.helpToggle && dom.helpDialog) {
      dom.helpToggle.addEventListener("click", () => {
        if (typeof dom.helpDialog.showModal === "function") {
          dom.helpDialog.showModal();
        } else {
          dom.helpDialog.setAttribute("open", "open");
        }
      });
    }
    if (dom.replayTutorial) {
      dom.replayTutorial.addEventListener("click", () => {
        currentState = replayTutorial(currentState);
        if (dom.helpDialog && typeof dom.helpDialog.close === "function") {
          dom.helpDialog.close();
        }
        render(currentState);
      });
    }
    dom.enqueue.addEventListener("click", () => {
      currentState = enqueueJob(currentState, dom.jobSelect.value);
      render(currentState);
    });
    dom.queuePolicySelect.addEventListener("change", () => {
      currentState = setQueuePolicy(currentState, dom.queuePolicySelect.value);
      render(currentState);
    });
    dom.escalation.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }
      if (button.dataset.action === "breach-trace") {
        currentState = traceBreachSource(currentState);
      }
      if (button.dataset.action === "breach-defer") {
        currentState = deferBreachTrace(currentState);
      }
      render(currentState);
    });
    dom.assignNext.addEventListener("click", () => {
      const lane = currentState.lanes.find((candidate) => candidate.status === "idle");
      currentState = assignJobToLane(currentState, lane ? lane.id : null);
      render(currentState);
    });
    dom.startAll.addEventListener("click", () => {
      currentState = startAllLanes(currentState);
      render(currentState);
    });
    dom.reprioritize.addEventListener("click", () => {
      const entry = currentState.queue[currentState.queue.length - 1];
      currentState = reprioritizeQueue(currentState, entry ? entry.id : null);
      render(currentState);
    });
    dom.cancel.addEventListener("click", () => {
      const entry = currentState.queue[currentState.queue.length - 1];
      currentState = cancelQueueEntry(currentState, entry ? entry.id : null);
      render(currentState);
    });
    dom.restart.addEventListener("click", () => {
      currentState = resetFactoryState(currentState);
      render(currentState);
    });
    dom.freight.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action][data-manifest]");
      if (!button) {
        return;
      }
      if (button.dataset.action === "freight-stage") {
        currentState = stageFreightCargo(currentState, button.dataset.manifest);
      }
      if (button.dataset.action === "freight-hold") {
        currentState = holdFreightManifest(currentState, button.dataset.manifest);
      }
      if (button.dataset.action === "freight-drones") {
        currentState = assignFreightRouteSecurity(currentState, button.dataset.manifest, "drones");
      }
      if (button.dataset.action === "freight-defenses") {
        currentState = assignFreightRouteSecurity(currentState, button.dataset.manifest, "defenses");
      }
      if (button.dataset.action === "freight-reserve") {
        currentState = authorizeFreightLaunchClearance(currentState, button.dataset.manifest);
      }
      if (button.dataset.action === "freight-reroute") {
        currentState = rerouteFreightManifest(currentState, button.dataset.manifest, button.dataset.sector);
      }
      if (button.dataset.action === "freight-seal") {
        currentState = sealFreightCarrier(currentState, button.dataset.manifest);
      }
      if (button.dataset.action === "freight-launch") {
        currentState = launchFreightManifest(currentState, button.dataset.manifest);
      }
      render(currentState);
    });
    dom.sabotage.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action][data-incident]");
      if (!button) {
        return;
      }
      if (button.dataset.action === "sabotage-scan") {
        currentState = scanSabotageManifest(currentState, button.dataset.incident);
      }
      if (button.dataset.action === "sabotage-drones") {
        currentState = assignSabotagePatrol(currentState, button.dataset.incident, "drones");
      }
      if (button.dataset.action === "sabotage-defenses") {
        currentState = assignSabotagePatrol(currentState, button.dataset.incident, "defenses");
      }
      if (button.dataset.action === "sabotage-decoy") {
        currentState = deploySabotageDecoy(currentState, button.dataset.incident, button.dataset.sector);
      }
      if (button.dataset.action === "sabotage-lockdown") {
        currentState = lockdownSabotageDock(currentState, button.dataset.incident);
      }
      if (button.dataset.action === "sabotage-reopen") {
        currentState = reopenSabotageDock(currentState, button.dataset.incident);
      }
      if (button.dataset.action === "sabotage-intercept") {
        currentState = interceptSabotageCell(currentState, button.dataset.incident);
      }
      if (button.dataset.action === "sabotage-reroute") {
        currentState = rerouteSabotagedCarrier(currentState, button.dataset.incident, button.dataset.sector);
      }
      if (button.dataset.action === "sabotage-repair") {
        currentState = repairSabotagedLane(currentState, button.dataset.incident);
      }
      render(currentState);
    });
    dom.crisis.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action][data-case]");
      if (!button) {
        return;
      }
      if (button.dataset.action === "crisis-evidence") {
        currentState = assignCrisisEvidence(currentState, button.dataset.case, button.dataset.source);
      }
      if (button.dataset.action === "crisis-override") {
        currentState = buyCrisisEmergencyOverride(currentState, button.dataset.case);
      }
      if (button.dataset.action === "crisis-defer") {
        currentState = deferCrisisCase(currentState, button.dataset.case);
      }
      if (button.dataset.action === "crisis-protect") {
        currentState = protectCrisisLane(currentState, button.dataset.case);
      }
      if (button.dataset.action === "crisis-rule") {
        currentState = ruleCrisisCase(currentState, button.dataset.case, button.dataset.priority);
      }
      render(currentState);
    });
    dom.lanes.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        const laneCard = event.target.closest(".lane-card[data-lane]");
        if (laneCard) {
          currentState = selectLane(currentState, laneCard.dataset.lane);
          render(currentState);
        }
        return;
      }
      if (button.dataset.action === "assign") {
        currentState = assignJobToLane(currentState, button.dataset.lane);
      }
      if (button.dataset.action === "start") {
        currentState = startLane(currentState, button.dataset.lane);
      }
      if (button.dataset.action === "recover") {
        currentState = recoverLane(currentState, button.dataset.lane);
      }
      if (button.dataset.action === "overdrive") {
        currentState = toggleLaneOverdrive(
          currentState,
          button.dataset.lane,
          button.dataset.overdriveActive !== "true"
        );
      }
      if (button.dataset.action === "breach-quarantine") {
        currentState = quarantineBreachLane(
          currentState,
          button.dataset.lane,
          button.dataset.quarantined !== "true"
        );
      }
      render(currentState);
    });
    dom.lanes.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key) || event.target.closest("button")) {
        return;
      }
      const laneCard = event.target.closest(".lane-card[data-lane]");
      if (!laneCard) {
        return;
      }
      event.preventDefault();
      currentState = selectLane(currentState, laneCard.dataset.lane);
      render(currentState);
    });
    dom.queue.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        const item = event.target.closest(".queue-item[data-entry]");
        if (item) {
          currentState = selectJobCard(currentState, item.dataset.entry);
          render(currentState);
        }
        return;
      }
      if (button.dataset.action === "assign") {
        const lane = currentState.lanes.find((candidate) => candidate.status === "idle");
        currentState = assignJobToLane(currentState, lane ? lane.id : null, button.dataset.entry);
      }
      if (button.dataset.action === "raise") {
        currentState = reprioritizeQueue(currentState, button.dataset.entry);
      }
      if (button.dataset.action === "cancel") {
        currentState = cancelQueueEntry(currentState, button.dataset.entry);
      }
      if (button.dataset.action === "breach-cleanse") {
        currentState = cleanseCompromisedQueueEntry(currentState, button.dataset.entry);
      }
      render(currentState);
    });
    dom.queue.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key) || event.target.closest("button")) {
        return;
      }
      const item = event.target.closest(".queue-item[data-entry]");
      if (!item) {
        return;
      }
      event.preventDefault();
      currentState = selectJobCard(currentState, item.dataset.entry);
      render(currentState);
    });
    dom.jobs.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-job]");
      if (!button) {
        return;
      }
      currentState = enqueueJob(currentState, button.dataset.job);
      render(currentState);
    });
    dom.upgrades.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-upgrade]");
      if (!button) {
        return;
      }
      currentState = purchaseUpgrade(currentState, button.dataset.upgrade);
      render(currentState);
    });
    dom.grid.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }
      if (button.dataset.action === "grid-route") {
        currentState = routePowerToSector(currentState, button.dataset.sector, button.dataset.route);
      }
      if (button.dataset.action === "grid-isolate") {
        currentState = isolateGridSector(currentState, button.dataset.sector, button.dataset.isolated !== "true");
      }
      if (button.dataset.action === "grid-reserve") {
        currentState = authorizeReserveDraw(currentState, button.dataset.sector);
      }
      if (button.dataset.action === "audit-defer") {
        currentState = deferAuditDirective(currentState);
      }
      if (button.dataset.action === "audit-resolve") {
        currentState = resolveAuditDirective(currentState);
      }
      render(currentState);
    });
  }

  function render(state) {
    dom.runChip.textContent = `shift ${String(state.restart.run).padStart(2, "0")} / d${state.campaign.demand} / ${state.run.status} / t${state.tick}`;
    renderObjective(state);
    renderTopStats(state);
    renderResources(state);
    renderEscalationSurface(state);
    renderGridSiege(state);
    renderFreightLockdown(state);
    renderRailSabotage(state);
    renderCrisisArbitration(state);
    renderLanes(state);
    renderQueue(state);
    renderContracts(state);
    renderUpgrades(state);
    renderJobs(state);
    renderSelectedDetail(state);
    renderContextActions(state);
    renderLog(state);
  }

  function activeObjective(state) {
    if (state.shift && state.shift.objective) {
      return state.shift.objective;
    }
    return state.contracts.find((contract) => contract.status === "active") || state.contracts[0];
  }

  function objectiveProgressPercent(contract, state) {
    const lines = contractProgress(contract, state);
    if (!lines.length) {
      return 0;
    }
    const total = lines.reduce((sum, line) => sum + Math.min(line.current, line.required), 0);
    const required = lines.reduce((sum, line) => sum + line.required, 0);
    return required ? Math.min(100, Math.round((total / required) * 100)) : 0;
  }

  function renderObjective(state) {
    if (!dom.objective) {
      return;
    }
    const contract = activeObjective(state);
    const progress = contractProgress(contract, state)
      .map((line) => `${GAME_DATA.resources[line.resource] ? GAME_DATA.resources[line.resource].label : titleCase(line.resource)} ${line.current}/${line.required}`)
      .join(" / ");
    dom.objective.innerHTML = `
      <span class="selected-kicker">${contract.status} objective</span>
      <strong>${contract.pressure || contract.name}</strong>
      <div class="objective-meter" aria-label="${contract.name} progress" style="--progress: ${objectiveProgressPercent(contract, state)}%"><span></span></div>
      <span class="selected-kicker">${progress} / ${contract.timeRemaining} ticks</span>
    `;
  }

  function renderTopStats(state) {
    if (!dom.topStats) {
      return;
    }
    const activeFaults = state.lanes.filter((lane) => lane.fault || lane.status === "locked").length;
    const rating = Math.max(0, Math.min(99, state.resources.stability - activeFaults * 6 + state.resources.reputation * 3));
    dom.topStats.innerHTML = `
      <div class="stat"><span>Day</span><strong>${formatShiftNumber(state.campaign.shift)} / t${state.tick}</strong></div>
      <div class="stat"><span>Factory rating</span><strong>${rating}%</strong></div>
      <div class="stat"><span>Power</span><strong>${state.resources.power}</strong></div>
      <div class="stat"><span>Alerts</span><strong>${activeFaults}</strong></div>
    `;
  }

  function renderResources(state) {
    const baseResourceIds = state.disclosure && state.disclosure.visibleResources
      ? state.disclosure.visibleResources
      : RESOURCE_ORDER;
    const objective = activeObjective(state);
    const objectiveResourceIds = Object.keys(objective.requirement || {})
      .filter((id) => !baseResourceIds.includes(id));
    const resourceIds = baseResourceIds.concat(objectiveResourceIds).slice(0, 5);
    dom.resources.innerHTML = resourceIds.map((id) => {
      const label = GAME_DATA.resources[id].label;
      const feedback = resourceFeedbackState(state, id);
      return `
        <div class="readout" data-resource="${id}" data-signal="${feedback.signal}" data-feedback="${feedback.feedback}" data-procedural-asset="${feedback.proceduralAsset}">
          <span class="resource-head"><span class="resource-glyph" data-resource-icon="${feedback.icon}" aria-hidden="true"></span><span>${label}</span></span>
          <strong>${state.resources[id] || 0}</strong>
          <span class="resource-pulse" data-active="${feedback.produced ? "true" : "false"}">output ${state.produced[id] || 0}</span>
        </div>
      `;
    }).join("");
  }

  function disclosureSystem(state, systemId) {
    return state.disclosure && state.disclosure.systems
      ? state.disclosure.systems[systemId]
      : null;
  }

  function systemVisible(state, systemId) {
    const system = disclosureSystem(state, systemId);
    return !system || system.visible;
  }

  function lockedSystemMarkup(title, system) {
    return `<div class="empty-note" data-disclosure-locked="true"><strong>${title}</strong><span>${system && system.gate ? `unlocks: ${system.gate}` : "locked for this shift"}</span></div>`;
  }

  function renderEscalationSurface(state) {
    const surface = campaignSurfaceState(state);
    if (state.disclosure && state.disclosure.beginnerVisible) {
      const training = state.tutorial.contract;
      const nextStep = state.tutorial.currentStep;
      const progress = contractProgress(training, state)
        .map((line) => `${line.resource} ${line.current}/${line.required}`)
        .join(" / ");
      dom.queuePolicySelect.value = surface.queuePolicy.id;
      dom.escalation.innerHTML = `
        <article class="escalation-card" data-surface="campaign">
          <span>Campaign</span>
          <strong>Training Shift</strong>
          <p>shift ${formatShiftNumber(surface.shift)} / ${surface.phase} / t${surface.tick}</p>
        </article>
        <article class="escalation-card" data-surface="tutorial" data-alert="${state.tutorial.status}">
          <span>Next action</span>
          <strong>${nextStep.label}</strong>
          <p>${progress} / ${training.timeRemaining} ticks</p>
        </article>
        <article class="escalation-card" data-surface="progression">
          <span>Disclosure</span>
          <strong>${state.disclosure.mode}</strong>
          <p>advanced systems unlock after the training shift</p>
        </article>
      `;
      return;
    }
    if (state.disclosure && state.disclosure.flags.shiftSummary && state.shift && state.shift.summary) {
      const summaryFeedback = shiftSummaryFeedbackState(state);
      const producedText = formatBundle(summaryFeedback.produced);
      dom.queuePolicySelect.value = surface.queuePolicy.id;
      dom.escalation.innerHTML = `
        <article class="escalation-card shift-summary-card" data-surface="shift-summary" data-feedback="${summaryFeedback.feedback}" data-procedural-asset="${summaryFeedback.proceduralAsset}">
          <span>Shift summary</span>
          <strong>${state.shift.summary.trainingContract ? state.shift.summary.trainingContract.name : surface.phase}</strong>
          <p>status ${summaryFeedback.status} / produced ${producedText}</p>
          <p>upgrade choice ${summaryFeedback.upgradeChoice} / next ${state.shift.summary.nextUnlocks.join(" / ")}</p>
        </article>
        <article class="escalation-card" data-surface="choices">
          <span>Improvement rack</span>
          <strong>${state.shift.upgradeChoice.status}</strong>
          <p>${state.shift.upgradeChoice.options.map((option) => `${option.name}: ${option.affordable ? "ready" : "short"}`).join(" / ")}</p>
        </article>
      `;
      return;
    }
    const breach = surface.breach;
    const rail = surface.railSabotage;
    const crisis = surface.crisisArbitration;
    const activeTrace = breach.trace.status === "active";
    const traceText = activeTrace ? `due t${breach.trace.dueTick}` : breach.trace.status;
    const compromisedCount = breach.queue.filter((entry) => entry.compromised).length;
    const activeRailIncident = rail
      ? rail.incidents.find((incident) => railSabotageActionableStatus(incident.status))
        || rail.incidents.find((incident) => ["contained", "partial", "failed"].includes(incident.status))
        || rail.incidents[0]
      : null;
    const railDetail = activeRailIncident
      ? `${activeRailIncident.dockName} / ${activeRailIncident.status} / ${activeRailIncident.manifestId}`
      : "no suspect manifest";
    const activeCrisisCase = crisis
      ? crisis.cases.find((caseState) => crisisCaseActionableStatus(caseState.status))
        || crisis.cases.find((caseState) => ["binding", "partial", "failed"].includes(caseState.status))
        || crisis.cases[0]
      : null;
    const crisisDetail = activeCrisisCase
      ? `${activeCrisisCase.status} / ${activeCrisisCase.linked.laneId} / ${activeCrisisCase.linked.contractId}`
      : "no docket";
    const traceDisabled = !activeTrace || breach.status !== "active" || !canPay(state.resources, breach.trace.cost);
    const deferDisabled = !activeTrace || breach.status !== "active" || !canPay(state.resources, breach.trace.deferCost);
    dom.queuePolicySelect.value = surface.queuePolicy.id;
    dom.escalation.innerHTML = `
      <article class="escalation-card" data-surface="campaign">
        <span>Campaign</span>
        <strong>${surface.release}</strong>
        <p>shift ${formatShiftNumber(surface.shift)} / ${surface.phase} / demand x${surface.demand}</p>
        <p>deadline ${surface.deadlineDelta} / ${surface.runStatus} / t${surface.tick}</p>
      </article>
      <article class="escalation-card" data-surface="emergency" data-alert="${surface.emergency.status}">
        <span>Emergency</span>
        <strong>${surface.emergency.title}</strong>
        <p>${surface.emergency.detail}</p>
      </article>
      <article class="escalation-card" data-surface="progression">
        <span>Progression</span>
        <strong>run ${formatShiftNumber(surface.progression.run)} / ledger ${surface.progression.ledgerCount}</strong>
        <p>${surface.progression.latest}</p>
      </article>
      <article class="escalation-card" data-surface="choices">
        <span>Operator choices</span>
        <strong>${surface.queuePolicy.name}</strong>
        <p>${surface.choices.activeOverdrives} overdrive active / ${surface.choices.laneOverdrives} engaged / ${surface.choices.gridPowerRoutes} grid routes</p>
      </article>
      <article class="escalation-card" data-surface="grid" data-alert="${surface.grid.blackout.status}">
        <span>Grid Siege</span>
        <strong>pressure ${surface.grid.pressure}/${surface.grid.threshold} / reserve ${surface.grid.reserve.available}</strong>
        <p>audit ${surface.grid.audit.status} / blackout ${surface.grid.blackout.events} / load ${surface.grid.load}</p>
      </article>
      <article class="escalation-card rail-card" data-surface="rail-sabotage" data-alert="${rail ? rail.status : "offline"}">
        <span>Rail Sabotage</span>
        <strong>${rail ? rail.release : "offline"}</strong>
        <p>${rail ? `pressure ${rail.pressure} / contained ${rail.outcomes.contained} / failed ${rail.outcomes.failed}` : "rail security offline"}</p>
        <p>${railDetail}</p>
      </article>
      <article class="escalation-card crisis-card" data-surface="crisis-arbitration" data-alert="${crisis ? crisis.status : "offline"}">
        <span>Crisis Arbitration</span>
        <strong>${crisis ? crisis.release : "offline"}</strong>
        <p>${crisis ? `pressure ${crisis.pressure} / binding ${crisis.outcomes.binding} / failed ${crisis.outcomes.failed}` : "arbitration offline"}</p>
        <p>${crisisDetail}</p>
      </article>
      <article class="escalation-card breach-card" data-surface="breach" data-alert="${breach.status}">
        <span>Signal Breach</span>
        <strong>${breach.source.name} / ${breach.status}</strong>
        <p>intensity ${breach.intensity}/${breach.threshold} / trace ${traceText} / ${compromisedCount} compromised</p>
        <p>${breach.containment.status} / ${breach.containment.countermeasures} countermeasure / scars ${breach.carryover.signalScar || 0}</p>
        <div class="breach-actions">
          <button type="button" data-action="breach-trace" ${traceDisabled ? "disabled" : ""}>trace</button>
          <button type="button" data-action="breach-defer" ${deferDisabled ? "disabled" : ""}>defer</button>
        </div>
      </article>
    `;
  }

  function renderGridSiege(state) {
    if (!systemVisible(state, "gridSiege")) {
      dom.grid.innerHTML = lockedSystemMarkup("Grid Siege", disclosureSystem(state, "gridSiege"));
      return;
    }
    const surface = gridSurfaceState(state);
    const activeSector = surface.blackout.activeSectorId
      ? surface.sectors.find((sector) => sector.id === surface.blackout.activeSectorId)
      : null;
    const blackoutDetail = activeSector
      ? `${activeSector.name} lock t${activeSector.blackoutLockedUntil}`
      : `${surface.blackout.status} / ${surface.blackout.events} events`;
    const auditActive = surface.audit.status === "active";
    const repairDisabled = !auditActive || !canPay(state.resources, surface.audit.repairCost);
    const deferDisabled = !auditActive || !canPay(state.resources, surface.audit.deferCost);

    dom.grid.innerHTML = `
      <div class="grid-summary" data-grid="summary">
        <span>pressure ${surface.pressure}/${surface.threshold}</span>
        <span>load ${surface.load} / blackout ${blackoutDetail}</span>
        <span>reserve ${surface.reserve.available}/${surface.reserve.capacity} / debt ${surface.reserve.debt}</span>
        <span>audit ${surface.audit.status}${surface.audit.dueTick === null ? "" : ` / due t${surface.audit.dueTick}`}</span>
      </div>
      <div class="grid-sector-list" data-grid="sectors">
        ${surface.sectors.map((sector) => {
          const definition = gridSectorDefinition(sector.id);
          const priorityCost = definition && definition.priority ? { power: definition.priority.powerCost || 0 } : {};
          const isolateCost = definition && definition.isolate ? { stability: definition.isolate.stabilityCost || 0 } : {};
          const locked = sector.blackoutLockedUntil !== null;
          const priorityDisabled = sector.route === "priority" || sector.isolated || !canPay(state.resources, priorityCost);
          const balancedDisabled = sector.route === "balanced" || sector.isolated;
          const isolateDisabled = !sector.isolated && !canPay(state.resources, isolateCost);
          const breachState = sector.breach ? sector.breach.status : "clean";
          const shielded = sector.breach && sector.breach.shieldedUntil !== null && state.tick < sector.breach.shieldedUntil;
          const shieldableBreach = breachState === "contaminated";
          const reserveDisabled = surface.reserve.available <= 0 || shielded;
          const sectorStatus = sector.isolated
            ? "isolated"
            : locked ? `lock t${sector.blackoutLockedUntil}` : sector.powered ? "powered" : "dark";
          const breachText = breachState === "clean"
            ? "breach clean"
            : `breach ${breachState}${sector.breach.sourceId ? ` / ${sector.breach.sourceId}` : ""}${shielded ? ` / shield t${sector.breach.shieldedUntil}` : ""}`;
          return `
            <article class="grid-sector-card" data-sector="${sector.id}" data-powered="${sector.powered ? "true" : "false"}" data-isolated="${sector.isolated ? "true" : "false"}" data-blackout="${locked ? "true" : "false"}" data-breach="${breachState}" data-feedback="${locked || !sector.powered ? "power-shortage" : breachState === "clean" ? "powered" : `breach-${breachState}`}" data-visual-hook="grid-power-state">
              <div class="grid-sector-title">
                <strong>${sector.name}</strong>
                <span class="status-pill">${sectorStatus}</span>
              </div>
              <div class="grid-sector-meta">
                <span>${sector.laneName}</span>
                <span>route ${sector.route}</span>
                <span>link ${sector.connectedTo.map(titleCase).join(" / ")}</span>
                <span>reserve ${sector.reserveDraws} / blackout ${sector.blackoutCount}</span>
                <span>${breachText}</span>
              </div>
              <div class="grid-actions">
                <button type="button" data-action="grid-route" data-sector="${sector.id}" data-route="priority" ${priorityDisabled ? "disabled" : ""}>priority</button>
                <button type="button" data-action="grid-route" data-sector="${sector.id}" data-route="balanced" ${balancedDisabled ? "disabled" : ""}>balance</button>
                <button type="button" data-action="grid-isolate" data-sector="${sector.id}" data-isolated="${sector.isolated ? "true" : "false"}" ${isolateDisabled ? "disabled" : ""}>${sector.isolated ? "restore" : "isolate"}</button>
                <button type="button" data-action="grid-reserve" data-sector="${sector.id}" ${reserveDisabled ? "disabled" : ""}>${shieldableBreach ? shielded ? "shielded" : "shield" : "reserve"}</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
      <article class="grid-directive-card" data-grid="directive" data-audit="${surface.audit.status}">
        <div class="grid-directive-title">
          <strong>${surface.audit.name}</strong>
          <span class="status-pill">${surface.audit.status}</span>
        </div>
        <span>repair ${formatBundle(surface.audit.repairCost)} / defer ${formatBundle(surface.audit.deferCost)}</span>
        <span>queued ${surface.audit.queued ? "yes" : "no"} / deferrals ${surface.audit.deferrals} / cleared ${surface.audit.completed} / failed ${surface.audit.failures}</span>
        <div class="directive-actions">
          <button type="button" data-action="audit-resolve" ${repairDisabled ? "disabled" : ""}>repair</button>
          <button type="button" data-action="audit-defer" ${deferDisabled ? "disabled" : ""}>defer</button>
        </div>
      </article>
    `;
  }

  function freightRiskLevel(manifest) {
    const risk = manifest.route.currentRisk || 0;
    if (risk >= 7) {
      return "critical";
    }
    if (risk >= 5) {
      return "elevated";
    }
    return "nominal";
  }

  function freightCargoRailMarkup(manifest) {
    const requiredTotal = Object.values(manifest.cargo.required || {})
      .reduce((total, amount) => total + amount, 0);
    const stagedTotal = Object.values(manifest.cargo.staged || {})
      .reduce((total, amount) => total + amount, 0);
    const filled = requiredTotal ? Math.round(Math.min(1, stagedTotal / requiredTotal) * 6) : 0;
    return Array.from({ length: 6 }, (_unused, index) => (
      `<span data-filled="${index < filled ? "true" : "false"}"></span>`
    )).join("");
  }

  function freightRouteText(manifest) {
    const sector = manifest.sectorStatus;
    const breach = sector && sector.breach ? sector.breach.status : "clean";
    if (manifest.route.rerouted) {
      return `rerouted ${manifest.route.reroutedAround || manifest.sectorId}`;
    }
    if (manifest.route.contaminatedExposure) {
      return `route contaminated / ${breach}`;
    }
    return `route ${sector ? sector.route : "balanced"} / breach ${breach}`;
  }

  function freightLatestEvent(manifest) {
    if (!manifest.events.length) {
      return "no manifest events";
    }
    const event = manifest.events[0];
    return `last ${titleCase(event.event)} / t${event.tick}`;
  }

  function renderFreightLockdown(state) {
    if (!systemVisible(state, "freightLockdown")) {
      dom.freight.innerHTML = lockedSystemMarkup("Freight Lockdown", disclosureSystem(state, "freightLockdown"));
      return;
    }
    const surface = freightSurfaceState(state);
    if (!surface) {
      dom.freight.innerHTML = `<div class="empty-note">freight lockdown offline</div>`;
      return;
    }

    dom.freight.innerHTML = `
      <div class="freight-summary" data-freight="summary">
        <span>status ${surface.status}</span>
        <span>route pressure ${surface.routeSecurity.pressure}</span>
        <span>outcomes ${surface.outcomes.full} full / ${surface.outcomes.partial} partial / ${surface.outcomes.failed} failed</span>
        <span>carryover scar ${surface.carryover.lockdownScar} / lost cargo ${surface.carryover.lostCargo}</span>
      </div>
      <div class="freight-manifest-list" data-freight="manifests">
        ${surface.manifests.map((manifest) => {
          const actionable = ["available", "staged", "sealed"].includes(manifest.status);
          const stageable = ["available", "staged"].includes(manifest.status);
          const remainingKeys = Object.keys(manifest.cargo.remaining);
          const windowOpen = state.tick >= manifest.window.opensAtTick && state.tick <= manifest.window.closesAtTick;
          const riskLevel = freightRiskLevel(manifest);
          const stageDisabled = !stageable || !remainingKeys.length || !canPay(state.resources, manifest.cargo.remaining);
          const holdDisabled = !actionable || !canPay(state.resources, GAME_DATA.freightLockdown.hold.cost);
          const dronesDisabled = !actionable || !canPay(state.resources, GAME_DATA.freightLockdown.routeSecurity.drones.cost);
          const defensesDisabled = !actionable || !canPay(state.resources, GAME_DATA.freightLockdown.routeSecurity.defenses.cost);
          const reserveDisabled = !actionable || manifest.security.reserveClearance || !state.grid || state.grid.reserve.available <= 0;
          const rerouteDisabled = !actionable || manifest.route.rerouted || !canPay(state.resources, GAME_DATA.freightLockdown.routeSecurity.reroute.cost);
          const sealDisabled = manifest.status !== "staged" || remainingKeys.length > 0 || !manifest.dockReady || !windowOpen;
          const launchDisabled = manifest.status !== "sealed" || !windowOpen;
          const dockText = manifest.dockReady ? "dock ready" : "dock blocked";
          const securityText = `security d${manifest.security.drones} / f${manifest.security.defenses} / reserve ${manifest.security.reserveClearance ? "yes" : "no"}`;
          const timingText = manifest.arrivalTick !== null
            ? `arrival t${manifest.arrivalTick}`
            : manifest.launchedAtTick !== null ? `launched t${manifest.launchedAtTick}` : `window t${manifest.window.opensAtTick}-${manifest.window.closesAtTick}`;
          return `
            <article class="freight-manifest-card" data-manifest="${manifest.id}" data-status="${manifest.status}" data-risk="${riskLevel}" data-route-alert="${manifest.route.contaminatedExposure ? "true" : "false"}" data-dock-ready="${manifest.dockReady ? "true" : "false"}" data-feedback="${manifest.route.contaminatedExposure ? "route-alert" : manifest.status}" data-visual-hook="freight-incident">
              <div class="freight-title">
                <strong>${manifest.name}</strong>
                <span class="status-pill">${manifest.status}</span>
              </div>
              <span class="incident-marker freight-marker" data-marker="freight" data-active="${actionable ? "true" : "false"}" aria-hidden="true"></span>
              <div class="freight-route">
                <span>${manifest.dockName} / ${manifest.laneName}</span>
                <span>${manifest.sectorId} / ${dockText}</span>
                <span>${timingText}</span>
                <span>contract ${manifest.contractId}</span>
              </div>
              <div class="freight-rail" aria-label="${manifest.name} cargo staging">
                ${freightCargoRailMarkup(manifest)}
              </div>
              <div class="freight-metrics">
                <span>cargo ${formatBundle(manifest.cargo.required)}</span>
                <span>staged ${formatBundle(manifest.cargo.staged)} / remaining ${formatBundle(manifest.cargo.remaining)}</span>
                <span>integrity ${manifest.integrity}% / risk ${manifest.route.currentRisk}</span>
                <span>inspection ${manifest.inspection.status}</span>
                <span>${securityText}</span>
                <span>${freightRouteText(manifest)}</span>
                <span>payout ${formatBundle(manifest.payout)} / partial ${formatBundle(manifest.partialPayout)}</span>
                <span>penalty ${formatBundle(manifest.penalty)}</span>
                <span>${freightLatestEvent(manifest)}</span>
              </div>
              <div class="freight-actions">
                <button type="button" data-action="freight-stage" data-manifest="${manifest.id}" ${stageDisabled ? "disabled" : ""}>stage</button>
                <button type="button" data-action="freight-drones" data-manifest="${manifest.id}" ${dronesDisabled ? "disabled" : ""}>drones</button>
                <button type="button" data-action="freight-defenses" data-manifest="${manifest.id}" ${defensesDisabled ? "disabled" : ""}>defenses</button>
                <button type="button" data-action="freight-reserve" data-manifest="${manifest.id}" ${reserveDisabled ? "disabled" : ""}>reserve</button>
                <button type="button" data-action="freight-reroute" data-manifest="${manifest.id}" data-sector="${manifest.sectorId}" ${rerouteDisabled ? "disabled" : ""}>reroute</button>
                <button type="button" data-action="freight-hold" data-manifest="${manifest.id}" ${holdDisabled ? "disabled" : ""}>hold</button>
                <button type="button" data-action="freight-seal" data-manifest="${manifest.id}" ${sealDisabled ? "disabled" : ""}>seal</button>
                <button type="button" data-action="freight-launch" data-manifest="${manifest.id}" ${launchDisabled ? "disabled" : ""}>launch</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function railSabotageActionableStatus(status) {
    return ["available", "scanned", "patrolled", "decoyed", "locked"].includes(status);
  }

  function sabotageCellRailMarkup(incident) {
    const cellCount = Math.max(5, incident.containment.requiredScore || 5);
    const score = incident.containment.score || 0;
    const pressure = incident.pressure.current || 0;
    return Array.from({ length: cellCount }, (_unused, index) => {
      const stateName = index < score
        ? "sealed"
        : index < pressure ? "hot" : "open";
      return `<span data-state="${stateName}"></span>`;
    }).join("");
  }

  function railSabotageLatestEvent(incident) {
    if (!incident.events.length) {
      return "no rail events";
    }
    const event = incident.events[0];
    return `last ${titleCase(event.event)} / t${event.tick}`;
  }

  function renderRailSabotage(state) {
    if (!systemVisible(state, "railSabotage")) {
      dom.sabotage.innerHTML = lockedSystemMarkup("Rail Sabotage", disclosureSystem(state, "railSabotage"));
      return;
    }
    const surface = railSabotageSurfaceState(state);
    if (!surface) {
      dom.sabotage.innerHTML = `<div class="empty-note">rail sabotage offline</div>`;
      return;
    }

    dom.sabotage.innerHTML = `
      <div class="rail-sabotage-summary" data-rail-sabotage="summary">
        <span>${surface.release}</span>
        <span>status ${surface.status}</span>
        <span>pressure ${surface.pressure}</span>
        <span>outcomes ${surface.outcomes.contained} contained / ${surface.outcomes.partial} partial / ${surface.outcomes.failed} failed</span>
        <span>scars ${surface.carryover.sabotageScar} / tampered ${surface.carryover.tamperedCargo}</span>
      </div>
      <div class="rail-incident-list" data-rail-sabotage="incidents">
        ${surface.incidents.map((incident) => {
          const actionable = railSabotageActionableStatus(incident.status);
          const manifestRoute = incident.manifestRoute || { baseRisk: 0, currentRisk: 0, rerouted: false };
          const manifestSabotage = incident.manifestSabotage || {};
          const scanCost = GAME_DATA.railSabotage.scan.cost;
          const droneCost = GAME_DATA.railSabotage.patrols.drones.cost;
          const defenseCost = GAME_DATA.railSabotage.patrols.defenses.cost;
          const decoyCost = GAME_DATA.railSabotage.decoy.cost;
          const lockdownCost = GAME_DATA.railSabotage.dockLockdown.cost;
          const interceptCost = GAME_DATA.railSabotage.intercept.cost;
          const rerouteCost = GAME_DATA.railSabotage.carrierReroute.cost;
          const repairCost = GAME_DATA.railSabotage.laneRepair.cost;
          const lane = byId(state.lanes, incident.laneId);
          const laneBlockedByOther = lane && lane.gridLock && lane.gridLock.reason !== "rail-sabotage-lockdown";
          const patrolReady = incident.patrol.required === "drones"
            ? incident.patrol.drones > 0
            : incident.patrol.defenses > 0;
          const scanDisabled = !actionable || incident.scan.status === "complete" || !canPay(state.resources, scanCost);
          const dronesDisabled = !actionable || !canPay(state.resources, droneCost);
          const defensesDisabled = !actionable || !canPay(state.resources, defenseCost);
          const decoyDisabled = !actionable || incident.decoy.deployed || !canPay(state.resources, decoyCost);
          const lockdownDisabled = !actionable || incident.dock.locked || laneBlockedByOther || !canPay(state.resources, lockdownCost);
          const reopenDisabled = !incident.dock.locked;
          const interceptDisabled = !actionable || incident.containment.intercepted || !canPay(state.resources, interceptCost);
          const rerouteDisabled = !actionable || incident.carrier.rerouted || !canPay(state.resources, rerouteCost);
          const repairable = ["sabotaged", "scarred"].includes(incident.laneDamage.status);
          const repairDisabled = !repairable || !canPay(state.resources, repairCost);
          const routeText = manifestRoute.rerouted
            ? `rerouted ${manifestRoute.reroutedAround || incident.sectorId}`
            : `risk ${manifestRoute.currentRisk}/${manifestRoute.baseRisk}`;
          const sectorText = incident.sectorStatus
            ? `${incident.sectorStatus.route} / ${incident.sectorStatus.powered ? "powered" : "dark"}${incident.sectorStatus.isolated ? " / isolated" : ""}`
            : "sector missing";
          return `
            <article class="rail-incident-card" data-incident="${incident.id}" data-status="${incident.status}" data-actionable="${actionable ? "true" : "false"}" data-dock-ready="${incident.dockReady ? "true" : "false"}" data-decoy="${incident.decoy.deployed ? "true" : "false"}" data-patrol-ready="${patrolReady ? "true" : "false"}" data-lane-damage="${incident.laneDamage.status}" data-feedback="sabotage-${incident.status}" data-visual-hook="sabotage-incident">
              <div class="rail-incident-title">
                <strong>${incident.name}</strong>
                <span class="status-pill">${incident.status}</span>
              </div>
              <span class="incident-marker sabotage-marker" data-marker="sabotage" data-active="${actionable ? "true" : "false"}" aria-hidden="true"></span>
              <div class="rail-incident-meta">
                <span>${incident.dockName} / ${incident.laneName}</span>
                <span>window t${incident.window.opensAtTick}-${incident.window.closesAtTick} / shift ${formatShiftNumber(incident.availableShift)}</span>
                <span>manifest ${incident.manifestStatus} / integrity ${incident.manifestIntegrity === null ? "n/a" : `${incident.manifestIntegrity}%`}</span>
                <span>${routeText} / ${incident.trigger.route}</span>
                <span>pressure ${incident.pressure.current}/${incident.pressure.base} / score ${incident.containment.score}/${incident.containment.requiredScore}</span>
                <span>scan ${incident.scan.status}${incident.scan.queued ? " / sweep queued" : ""}</span>
                <span>patrol ${incident.patrol.required} / d${incident.patrol.drones} / f${incident.patrol.defenses}</span>
                <span>decoy ${incident.decoy.deployed ? incident.decoy.routeId : "none"}</span>
                <span>dock ${incident.dock.locked ? "locked" : incident.dockReady ? "ready" : "blocked"}</span>
                <span>lane ${incident.laneDamage.status} / ${sectorText}</span>
                <span>cargo ${formatBundle(incident.trigger.suspectCargo)}</span>
                <span>tamper ${manifestSabotage.integrityDamage || incident.carrier.integrityDamage} / ${railSabotageLatestEvent(incident)}</span>
              </div>
              <div class="sabotage-rail" aria-label="${incident.name} containment rail">
                ${sabotageCellRailMarkup(incident)}
              </div>
              <div class="rail-actions">
                <button type="button" data-action="sabotage-scan" data-incident="${incident.id}" ${scanDisabled ? "disabled" : ""}>scan</button>
                <button type="button" data-action="sabotage-drones" data-incident="${incident.id}" ${dronesDisabled ? "disabled" : ""}>drones</button>
                <button type="button" data-action="sabotage-defenses" data-incident="${incident.id}" ${defensesDisabled ? "disabled" : ""}>defenses</button>
                <button type="button" data-action="sabotage-decoy" data-incident="${incident.id}" data-sector="${incident.sectorId}" ${decoyDisabled ? "disabled" : ""}>decoy</button>
                <button type="button" data-action="sabotage-lockdown" data-incident="${incident.id}" ${lockdownDisabled ? "disabled" : ""}>lockdown</button>
                <button type="button" data-action="sabotage-reopen" data-incident="${incident.id}" ${reopenDisabled ? "disabled" : ""}>reopen</button>
                <button type="button" data-action="sabotage-reroute" data-incident="${incident.id}" data-sector="${incident.sectorId}" ${rerouteDisabled ? "disabled" : ""}>reroute</button>
                <button type="button" data-action="sabotage-intercept" data-incident="${incident.id}" ${interceptDisabled ? "disabled" : ""}>intercept</button>
                <button type="button" data-action="sabotage-repair" data-incident="${incident.id}" ${repairDisabled ? "disabled" : ""}>repair</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function crisisCaseActionableStatus(status) {
    return ["open", "evidence-ready", "deferred", "protected"].includes(status);
  }

  function crisisEvidenceSealMarkup(caseState) {
    return caseState.evidence.required.map((sourceId) => {
      const source = GAME_DATA.crisisArbitration.evidenceSources[sourceId];
      const assigned = caseState.evidence.assigned.find((entry) => entry.sourceId === sourceId);
      const detail = assigned ? `${assigned.score} / ${assigned.detail}` : `cost ${formatBundle(source.cost)}`;
      return `
        <span data-source="${sourceId}" data-assigned="${assigned ? "true" : "false"}">
          <strong>${source.name}</strong>
          <small>${detail}</small>
        </span>
      `;
    }).join("");
  }

  function crisisLatestEvent(caseState) {
    if (!caseState.events.length) {
      return "no docket events";
    }
    const event = caseState.events[0];
    return `last ${titleCase(event.event)} / t${event.tick}`;
  }

  function renderCrisisArbitration(state) {
    if (!systemVisible(state, "crisisArbitration")) {
      dom.crisis.innerHTML = lockedSystemMarkup("Crisis Arbitration", disclosureSystem(state, "crisisArbitration"));
      return;
    }
    const surface = crisisArbitrationSurfaceState(state);
    if (!surface) {
      dom.crisis.innerHTML = `<div class="empty-note">crisis arbitration offline</div>`;
      return;
    }

    dom.crisis.innerHTML = `
      <div class="crisis-summary" data-crisis="summary">
        <span>${surface.release}</span>
        <span>status ${surface.status}</span>
        <span>pressure ${surface.pressure}</span>
        <span>outcomes ${surface.outcomes.binding} binding / ${surface.outcomes.partial} partial / ${surface.outcomes.failed} failed</span>
        <span>scar ${surface.carryover.arbitrationScar} / overrides ${surface.carryover.overridesSpent} / bindings ${surface.carryover.bindingRulings}</span>
      </div>
      <div class="crisis-case-list" data-crisis="docket">
        ${surface.cases.map((caseState) => {
          const actionable = crisisCaseActionableStatus(caseState.status);
          const linked = caseState.linked;
          const laneBlocked = linked.laneGridLock ? `locked ${linked.laneGridLock.reason}` : linked.laneStatus;
          const sector = linked.sectorStatus;
          const sectorText = sector
            ? `${sector.route} / ${sector.powered ? "powered" : "dark"}${sector.isolated ? " / isolated" : ""}`
            : "sector missing";
          const railPressure = linked.railPressure ? `${linked.railPressure.current}/${linked.railPressure.base}` : "n/a";
          const timerText = caseState.dueTick === null
            ? `window t${caseState.window.opensAtTick}-${caseState.window.closesAtTick}`
            : `ruling due t${caseState.dueTick} / closes t${caseState.window.closesAtTick}`;
          const overrideDisabled = !actionable || caseState.override.spent || !canPay(state.resources, GAME_DATA.crisisArbitration.override.cost);
          const deferDisabled = !actionable || !canPay(state.resources, GAME_DATA.crisisArbitration.defer.cost);
          const protectDisabled = !actionable || caseState.protection.laneGuarded || !canPay(state.resources, GAME_DATA.crisisArbitration.laneProtection.cost);
          const evidenceButtons = caseState.evidence.required.map((sourceId) => {
            const source = GAME_DATA.crisisArbitration.evidenceSources[sourceId];
            const assigned = caseState.evidence.assigned.some((entry) => entry.sourceId === sourceId);
            const disabled = !actionable || assigned || !canPay(state.resources, source.cost);
            return `<button type="button" data-action="crisis-evidence" data-case="${caseState.id}" data-source="${sourceId}" ${disabled ? "disabled" : ""}>${sourceId}</button>`;
          }).join("");
          const priorityButtons = caseState.priorityOptions.map((option) => {
            const disabled = !actionable;
            return `<button type="button" data-action="crisis-rule" data-case="${caseState.id}" data-priority="${option.id}" ${disabled ? "disabled" : ""}>${option.name} ${option.score}</button>`;
          }).join("");
          return `
            <article class="crisis-case-card" data-case="${caseState.id}" data-status="${caseState.status}" data-actionable="${actionable ? "true" : "false"}" data-protected="${caseState.protection.laneGuarded ? "true" : "false"}" data-outcome="${caseState.outcome || "pending"}" data-feedback="crisis-${caseState.status}" data-visual-hook="crisis-summary">
              <div class="crisis-case-title">
                <strong>${caseState.name}</strong>
                <span class="status-pill">${caseState.status}</span>
              </div>
              <span class="incident-marker crisis-marker" data-marker="crisis" data-active="${actionable ? "true" : "false"}" aria-hidden="true"></span>
              <div class="crisis-case-meta">
                <span>${timerText}</span>
                <span>lane ${caseState.linked.laneId} / ${laneBlocked}</span>
                <span>grid ${caseState.linked.sectorId} / ${sectorText}</span>
                <span>breach ${linked.breachSourceName} / ${linked.breachStatus}</span>
                <span>freight ${caseState.linked.manifestId} / ${linked.manifestStatus} / integrity ${linked.manifestIntegrity === null ? "n/a" : `${linked.manifestIntegrity}%`}</span>
                <span>rail ${caseState.linked.railIncidentId} / ${linked.railStatus} / pressure ${railPressure}</span>
                <span>contract ${caseState.linked.contractId} / ${linked.contractStatus}</span>
                <span>score ${caseState.evidence.score}/${caseState.bindingScore} binding / ${caseState.partialScore} partial</span>
                <span>override ${caseState.override.spent ? "spent" : formatBundle(GAME_DATA.crisisArbitration.override.cost)} / defer ${formatBundle(GAME_DATA.crisisArbitration.defer.cost)}</span>
                <span>protect ${caseState.protection.laneGuarded ? "guarded" : formatBundle(GAME_DATA.crisisArbitration.laneProtection.cost)} / pressure ${caseState.pressure.current}</span>
                <span>reward ${formatBundle(caseState.reward)}</span>
                <span>risk ${formatBundle(caseState.failurePenalty)} / ${crisisLatestEvent(caseState)}</span>
              </div>
              <div class="crisis-evidence-seals" aria-label="${caseState.name} evidence seals">
                ${crisisEvidenceSealMarkup(caseState)}
              </div>
              <div class="crisis-evidence-actions">
                ${evidenceButtons}
              </div>
              <div class="crisis-priority-actions">
                ${priorityButtons}
              </div>
              <div class="crisis-actions">
                <button type="button" data-action="crisis-override" data-case="${caseState.id}" ${overrideDisabled ? "disabled" : ""}>override</button>
                <button type="button" data-action="crisis-defer" data-case="${caseState.id}" ${deferDisabled ? "disabled" : ""}>defer</button>
                <button type="button" data-action="crisis-protect" data-case="${caseState.id}" ${protectDisabled ? "disabled" : ""}>protect</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderLanes(state) {
    dom.lanes.innerHTML = state.lanes.map((lane) => {
      const jobType = lane.currentJob ? byId(GAME_DATA.jobTypes, lane.currentJob.jobTypeId) : null;
      const jobText = jobType ? jobType.name : "empty belt";
      const feedback = laneFeedbackState(state, lane);
      const laneIcon = iconMarkup(ASSET_PATHS.lanes[lane.id], "asset-icon lane-icon");
      const jobIcon = jobType ? iconMarkup(ASSET_PATHS.jobs[jobType.id], "asset-icon job-icon") : "";
      const faultIcon = lane.fault ? iconMarkup(ASSET_PATHS.faults[lane.fault.id], "asset-icon fault-icon") : "";
      const faultText = lane.fault
        ? `${lane.fault.name} / ${lane.fault.phase} / ${lane.fault.decision} / ${formatBundle(lane.fault.recovery)}`
        : "clear";
      const statusText = lane.status === "idle" ? "ready" : lane.status;
      const overdriveActive = lane.overdrive && lane.overdrive.active;
      const overdriveText = overdriveActive ? "overdrive" : "normal";
      const overdriveCost = GAME_DATA.campaign.laneOverdrive;
      const overdriveDisabled = !overdriveActive && !canPay(state.resources, {
        power: overdriveCost.powerCost,
        stability: overdriveCost.stabilityCost,
      });
      const sector = gridSectorForLane(state.grid, lane.id);
      const gridText = sector
        ? `${sector.name} / ${sector.route}${sector.isolated ? " / isolated" : ""}${sector.blackoutLockedUntil ? ` / lock t${sector.blackoutLockedUntil}` : ""}`
        : "no grid sector";
      const breachState = sector && sector.breach ? sector.breach.status : "clean";
      const compromisedJob = lane.currentJob && lane.currentJob.compromised;
      const countermeasureJob = lane.currentJob && lane.currentJob.breachDirective;
      const quarantineActive = Boolean(lane.breachQuarantine);
      const canQuarantine = state.breach.status === "active"
        && sector
        && (breachState === "contaminated" || quarantineActive)
        && (quarantineActive || canPay(state.resources, { stability: GAME_DATA.signalBreach.quarantine.stabilityCost }));
      const breachLaneText = quarantineActive
        ? `quarantine ${lane.breachQuarantine.sourceId} / ${lane.breachQuarantine.sectorId}`
        : compromisedJob ? `compromised ${compromisedJob.sourceId} / severity ${compromisedJob.severity}`
          : countermeasureJob ? `countermeasure ${lane.currentJob.sourceBreachId}`
            : `breach ${breachState}`;
      const selected = state.selection && state.selection.selectedLaneId === lane.id;
      const stateLabel = lane.fault
        ? lane.fault.name
        : lane.status === "running" && overdriveActive ? "overdrive"
          : statusText;
      return `
        <article class="lane-card" data-lane="${lane.id}" data-selected="${selected ? "true" : "false"}" data-status="${lane.status}" data-feedback="${feedback.feedback}" data-motion="${feedback.motion}" data-output="${feedback.outputResource || "none"}" data-shortage="${feedback.shortage ? "true" : "false"}" data-overdrive="${overdriveActive ? "true" : "false"}" data-breach-quarantine="${quarantineActive ? "true" : "false"}" data-breach="${breachState}" data-visual-hook="lane-feedback" tabindex="0" role="button" aria-label="${lane.name} ${statusText}">
          <div class="lane-title">
            <span class="asset-title"><strong>${lane.name}</strong></span>
            <span class="status-pill">${statusText}</span>
          </div>
          <div class="lane-machine" data-machine-state="${feedback.machineState}" data-heat="${feedback.heat}" aria-hidden="true">
            <span class="overdrive-glow" data-active="${feedback.overdriveActive ? "true" : "false"}"></span>
            <div class="machine-image">${laneIcon}</div>
            <div class="conveyor">
              <span class="belt"></span>
              <span class="output-token" data-resource="${feedback.outputResource || "none"}" data-active="${feedback.outputResource && (lane.status === "running" || lane.progress > 0) ? "true" : "false"}"></span>
              <div class="job-token" data-feedback="${feedback.feedback}" data-output="${feedback.outputResource || "none"}">${jobIcon}<span>current job</span><strong>${jobText}</strong></div>
              <span class="feedback-sparks" data-active="${lane.fault ? "true" : "false"}"></span>
            </div>
            <div class="state-marker">${stateLabel}</div>
          </div>
          <div class="progress-track" aria-label="${lane.name} progress" style="--progress: ${lane.progress}%"><span></span></div>
          <div class="lane-meta">
            <span>${lane.trait}</span>
            <span>rate ${lane.throughput}</span>
            <span>jam ${Math.round(lane.jamRisk * 100)}%</span>
            <span>recover ${lane.recoveryRemaining}</span>
            <span>${overdriveText}</span>
          </div>
          <div class="breach-readout" data-active="${breachLaneText === "breach clean" ? "false" : "true"}"><span>${breachLaneText}</span></div>
          <div class="fault-readout" data-active="${lane.fault ? "true" : "false"}">${faultIcon}<span>fault ${faultText}</span></div>
          <div class="lane-meta"><span>${gridText}</span><span>${overdriveDisabled && !overdriveActive ? "overdrive unavailable" : "context ready"}</span><span>${canQuarantine ? "quarantine ready" : "clear lane"}</span></div>
        </article>
      `;
    }).join("");
  }

  function renderQueue(state) {
    if (!state.queue.length) {
      dom.queue.innerHTML = `<li class="empty-note">queue empty</li>`;
      return;
    }
    const compactQueue = state.disclosure && state.disclosure.beginnerVisible;
    dom.queue.innerHTML = state.queue.slice(0, 5).map((entry) => {
      const jobType = byId(GAME_DATA.jobTypes, entry.jobTypeId);
      const feedback = jobFeedbackState(state, jobType, entry);
      const compromised = entry.compromised && entry.compromised.status === "compromised";
      const statusText = compromised
        ? "compromised"
        : entry.breachDirective ? "countermeasure"
          : entry.freightDirective ? "inspection"
            : entry.sabotageDirective ? "sabotage sweep"
            : entry.status === "held" ? "held" : `p${entry.priority}`;
      const cleanseDisabled = !compromised || !canPay(state.resources, GAME_DATA.signalBreach.cleanse.cost);
      const selected = state.selection && state.selection.selectedJobId === entry.id;
      return `
        <li class="queue-item" data-entry="${entry.id}" data-selected="${selected ? "true" : "false"}" data-feedback="${feedback.feedback}" data-output="${feedback.outputResource || "none"}" data-shortage="${feedback.shortage ? "true" : "false"}" data-asset-mode="${feedback.assetMode}" data-emergency="${entry.emergency ? "true" : "false"}" data-compromised="${compromised ? "true" : "false"}" data-breach-directive="${entry.breachDirective ? "true" : "false"}" data-freight-directive="${entry.freightDirective ? "true" : "false"}" data-sabotage-directive="${entry.sabotageDirective ? "true" : "false"}" tabindex="0" role="button" aria-label="${jobType.name} ${statusText}">
          <div class="queue-title">
            <span class="asset-title">${iconMarkup(ASSET_PATHS.jobs[entry.jobTypeId], "asset-icon queue-icon")}<strong>${jobType.name}</strong></span>
            <span class="status-pill">${statusText}</span>
          </div>
          <span class="job-feedback-marker" data-feedback="${feedback.feedback}" data-active="${feedback.feedback !== "queued" ? "true" : "false"}" aria-hidden="true"></span>
          <div class="queue-meta">
            <span>in ${formatBundle(jobType.inputs)}</span>
            <span>out ${formatBundle(jobType.outputs)}</span>
            ${entry.sourceContractId ? `<span>${entry.sourceContractId}</span>` : ""}
            ${entry.sourceDirectiveId ? `<span>${entry.sourceDirectiveId}</span>` : ""}
            ${entry.breachDirective ? `<span>countermeasure ${entry.sourceBreachId}</span>` : ""}
            ${entry.freightDirective ? `<span>freight ${entry.sourceFreightId}</span>` : ""}
            ${entry.sabotageDirective ? `<span>sabotage ${entry.sourceSabotageId}</span>` : ""}
            ${compromised ? `<span>compromised ${entry.compromised.sourceId} / severity ${entry.compromised.severity}</span>` : ""}
          </div>
          ${compactQueue ? "" : `<div class="queue-actions">
            ${compromised ? `<button type="button" data-action="breach-cleanse" data-entry="${entry.id}" ${cleanseDisabled ? "disabled" : ""}>cleanse</button>` : ""}
            <button type="button" data-action="assign" data-entry="${entry.id}">assign</button>
            <button type="button" data-action="raise" data-entry="${entry.id}">raise</button>
            <button type="button" data-action="cancel" data-entry="${entry.id}">cancel</button>
          </div>`}
        </li>
      `;
    }).join("");
  }

  function renderContracts(state) {
    if (state.disclosure && state.disclosure.systems.contracts.mode === "training-only") {
      const contract = state.tutorial.contract;
      const progress = contractProgress(contract, state)
        .map((line) => `${line.resource} ${line.current}/${line.required}`)
        .join(" / ");
      dom.contracts.innerHTML = `
        <article class="contract-card" data-status="${contract.status}" data-family="training">
          <div class="contract-title">
            <strong>${contract.name}</strong>
            <span class="status-pill">${contract.status}</span>
          </div>
          <div class="contract-meta">
            <span>${contract.timeRemaining} ticks left</span>
            <span>${contract.pressure}</span>
            <span>${progress}</span>
          </div>
          <div class="contract-reward">
            <span>requires ${formatBundle(contract.requirement)}</span>
            <span>reward ${formatBundle(contract.reward)}</span>
          </div>
        </article>
      `;
      return;
    }
    dom.contracts.innerHTML = state.contracts.map((contract) => {
      const progress = contractProgress(contract, state)
        .map((line) => `${line.resource} ${line.current}/${line.required}`)
        .join(" / ");
      const timer = contract.status === "pending"
        ? `arms t${contract.activationTick} / ${contract.deadline} ticks`
        : contract.status === "open" ? `opens next / ${contract.deadline} ticks` : `${contract.timeRemaining} ticks left`;
      return `
        <article class="contract-card" data-status="${contract.status}" data-emergency="${contract.emergency ? "true" : "false"}" data-family="${contract.family}">
          <div class="contract-title">
            <strong>${contract.name}</strong>
            <span class="status-pill">${contract.status}</span>
          </div>
          <div class="contract-meta">
            <span>${timer}</span>
            <span>${contract.pressure}</span>
            <span>${progress}</span>
          </div>
          <div class="contract-reward">
            <span>requires ${formatBundle(contract.requirement)}</span>
            <span>reward ${formatBundle(contract.reward)}</span>
            <span>penalty ${formatBundle(contract.penalty)}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderUpgrades(state) {
    if (!systemVisible(state, "upgrades")) {
      dom.upgrades.innerHTML = lockedSystemMarkup("Improvement rack", disclosureSystem(state, "upgrades"));
      return;
    }
    dom.upgrades.innerHTML = GAME_DATA.upgrades.map((upgrade, index) => {
      const installed = state.upgrades.purchased.includes(upgrade.id);
      const affordable = canPay(state.resources, upgrade.cost);
      const feedback = upgradeFeedbackState(state, upgrade, index);
      return `
        <article class="upgrade-card" data-installed="${installed ? "true" : "false"}" data-feedback="${feedback.feedback}" data-upgrade-family="${feedback.family}" data-procedural-asset="${feedback.proceduralAsset}">
          <div class="upgrade-title">
            <span class="asset-title"><span class="upgrade-icon" data-upgrade-family="${feedback.family}" aria-hidden="true"></span><strong>${upgrade.name}</strong></span>
            <span class="status-pill">${installed ? "installed" : formatBundle(upgrade.cost)}</span>
          </div>
          <p>${upgrade.description}</p>
          <button type="button" data-upgrade="${upgrade.id}" ${installed || !affordable ? "disabled" : ""}>install</button>
        </article>
      `;
    }).join("");
  }

  function renderJobs(state = currentState) {
    if (state && !systemVisible(state, "jobCatalog")) {
      dom.jobs.innerHTML = lockedSystemMarkup("Job catalog", disclosureSystem(state, "jobCatalog"));
      return;
    }
    dom.jobs.innerHTML = GAME_DATA.jobTypes.map((jobType) => {
      const feedback = jobFeedbackState(state, jobType);
      return `
        <article class="job-card" data-family="${jobType.family || "standard"}" data-feedback="${feedback.feedback}" data-output="${feedback.outputResource || "none"}" data-shortage="${feedback.shortage ? "true" : "false"}" data-asset-mode="${feedback.assetMode}" data-breach-countermeasure="${jobType.breachCountermeasure ? "true" : "false"}" data-freight-inspection="${jobType.freightInspection ? "true" : "false"}" data-sabotage-sweep="${jobType.sabotageSweep ? "true" : "false"}">
          <div class="job-title">
            <span class="asset-title">${iconMarkup(ASSET_PATHS.jobs[jobType.id], "asset-icon job-icon")}<strong>${jobType.name}</strong></span>
            <span class="status-pill">${jobType.duration} ticks</span>
          </div>
          <span class="job-feedback-marker" data-feedback="${feedback.feedback}" data-active="${feedback.shortage ? "true" : "false"}" aria-hidden="true"></span>
          <div class="job-io">
            <span>in ${formatBundle(jobType.inputs)}</span>
            <span>out ${formatBundle(jobType.outputs)}</span>
            ${jobType.breachCountermeasure ? `<span>breach countermeasure</span>` : ""}
            ${jobType.freightInspection ? `<span>freight inspection</span>` : ""}
            ${jobType.sabotageSweep ? `<span>sabotage sweep</span>` : ""}
          </div>
          <button type="button" data-job="${jobType.id}">enqueue</button>
        </article>
      `;
    }).join("");
  }

  function renderSelectedDetail(state) {
    if (!dom.selectedDetail) {
      return;
    }
    const lane = selectedLane(state);
    const entry = selectedQueueEntry(state);
    if (lane) {
      const jobType = lane.currentJob ? byId(GAME_DATA.jobTypes, lane.currentJob.jobTypeId) : null;
      const faultText = lane.fault
        ? `${lane.fault.name}: ${lane.fault.decision}`
        : "no lane fault";
      dom.selectedDetail.innerHTML = `
        <article class="selected-card" data-selection="lane" data-status="${lane.status}">
          <div class="selected-title">
            <strong>${lane.name}</strong>
            <span class="status-pill">${lane.status === "idle" ? "ready" : lane.status}</span>
          </div>
          <div class="detail-meter" aria-label="${lane.name} selected progress" style="--progress: ${lane.progress}%"><span></span></div>
          <div class="selected-meta">
            <span>job ${jobType ? jobType.name : "empty"}</span>
            <span>input ${jobType ? formatBundle(jobType.inputs) : "none"}</span>
            <span>output ${jobType ? formatBundle(jobType.outputs) : "none"}</span>
            <span>${faultText}</span>
            <span>throughput ${lane.throughput} / jam ${Math.round(lane.jamRisk * 100)}%</span>
          </div>
        </article>
      `;
      return;
    }
    if (entry) {
      const jobType = byId(GAME_DATA.jobTypes, entry.jobTypeId);
      dom.selectedDetail.innerHTML = `
        <article class="selected-card" data-selection="job" data-status="${entry.status}">
          <div class="selected-title">
            <strong>${jobType.name}</strong>
            <span class="status-pill">${entry.status}</span>
          </div>
          <div class="selected-meta">
            <span>input ${formatBundle(jobType.inputs)}</span>
            <span>output ${formatBundle(jobType.outputs)}</span>
            <span>duration ${jobType.duration} ticks</span>
            <span>priority ${entry.priority}</span>
          </div>
        </article>
      `;
      return;
    }
    const objective = activeObjective(state);
    const incoming = state.queue.find((candidate) => candidate.status === "queued") || state.queue[0];
    const incomingJob = incoming ? byId(GAME_DATA.jobTypes, incoming.jobTypeId) : null;
    dom.selectedDetail.innerHTML = `
      <article class="selected-card" data-selection="none">
        <div class="selected-title">
          <strong>${incomingJob ? incomingJob.name : objective.name}</strong>
          <span class="status-pill">${incomingJob ? "incoming" : objective.status}</span>
        </div>
        <div class="selected-meta">
          <span>${objective.name}</span>
          <span>${contractProgress(objective, state).map((line) => `${line.resource} ${line.current}/${line.required}`).join(" / ")}</span>
          <span>${incomingJob ? `input ${formatBundle(incomingJob.inputs)}` : "queue clear"}</span>
          <span>${incomingJob ? `output ${formatBundle(incomingJob.outputs)}` : "select a lane"}</span>
        </div>
      </article>
    `;
  }

  function renderContextActions(state) {
    if (!dom.contextActions) {
      return;
    }
    let actions = contextualActionsForState(state).slice(0, 5);
    if (!actions.length) {
      const incoming = state.queue.find((entry) => entry.status === "queued") || state.queue[0];
      if (incoming) {
        actions = [actionState("select-incoming", "Select Job", true, { entryId: incoming.id })];
      }
    }
    if (!actions.length) {
      dom.contextActions.innerHTML = `<p class="action-note">No surfaced action for the current selection.</p>`;
      return;
    }
    const buttons = actions.map((action) => {
      const cost = Object.keys(action.cost || {}).length ? ` data-cost="${formatBundle(action.cost)}"` : "";
      const reason = action.available ? "" : ` title="${action.reason}"`;
      const entry = action.entryId ? ` data-entry="${action.entryId}"` : "";
      return `<button type="button" data-action="${action.id}"${entry}${cost}${reason} ${action.available ? "" : "disabled"}>${action.label}</button>`;
    }).join("");
    const hint = selectedQueueEntry(state) && !selectedLane(state)
      ? `<p class="action-note">Select a lane to assign the job.</p>`
      : "";
    dom.contextActions.innerHTML = `${buttons}${hint}`;
  }

  function renderLog(state) {
    const limit = state.disclosure && state.disclosure.flags.compactLog ? 3 : 5;
    dom.log.innerHTML = state.log.slice(0, limit).map((entry) => `
      <li><span class="log-tick">t${entry.tick}</span><span>${entry.message}</span></li>
    `).join("");
  }

  const api = {
    GAME_DATA,
    createInitialState,
    enqueueJob,
    reprioritizeQueue,
    cancelQueueEntry,
    selectJobCard,
    selectLane,
    clearSelection,
    contextualActionsForState,
    performContextAction,
    assignJobToLane,
    startLane,
    startAllLanes,
    pauseLane,
    stepFactory,
    injectLaneFault,
    recoverLane,
    purchaseUpgrade,
    setQueuePolicy,
    toggleLaneOverdrive,
    routePowerToSector,
    isolateGridSector,
    authorizeReserveDraw,
    deferAuditDirective,
    resolveAuditDirective,
    cleanseCompromisedQueueEntry,
    quarantineBreachLane,
    traceBreachSource,
    deferBreachTrace,
    stageFreightCargo,
    sealFreightCarrier,
    holdFreightManifest,
    assignFreightRouteSecurity,
    authorizeFreightLaunchClearance,
    rerouteFreightManifest,
    launchFreightManifest,
    scanSabotageManifest,
    assignSabotagePatrol,
    deploySabotageDecoy,
    lockdownSabotageDock,
    reopenSabotageDock,
    interceptSabotageCell,
    rerouteSabotagedCarrier,
    repairSabotagedLane,
    assignCrisisEvidence,
    ruleCrisisCase,
    buyCrisisEmergencyOverride,
    deferCrisisCase,
    protectCrisisLane,
    evaluateContracts,
    maybeActivateEmergencyContracts,
    advanceGridState,
    advanceBreachState,
    advanceFreightState,
    advanceRailSabotageState,
    advanceCrisisArbitrationState,
    resetFactoryState,
    completeTutorial,
    replayTutorial,
    readTutorialCompletion,
    writeTutorialCompletion,
    canPay,
    applyBundle,
    contractProgress,
    gridSurfaceState,
    breachSurfaceState,
    freightSurfaceState,
    railSabotageSurfaceState,
    crisisArbitrationSurfaceState,
    campaignSurfaceState,
    factoryFeedbackState,
    laneFeedbackState,
    resourceFeedbackState,
    jobFeedbackState,
    upgradeFeedbackState,
    shiftSummaryFeedbackState,
  };

  if (typeof window !== "undefined") {
    window.DarkFactoryDispatch = api;
    window.addEventListener("DOMContentLoaded", initDom);
  }

  return api;
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = DarkFactoryDispatch;
}

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

  const GAME_DATA = {
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
    campaign: {
      release: "v0.2.0 Grid Siege",
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

  function iconMarkup(src, className = "asset-icon") {
    if (!src) {
      return "";
    }
    return `<img class="${className}" src="${src}" alt="" aria-hidden="true" loading="lazy" decoding="async" />`;
  }

  function roundTenth(value) {
    return Math.round(value * 10) / 10;
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

  function clampResourceFloor(resources) {
    Object.keys(resources).forEach((resource) => {
      resources[resource] = Math.max(0, resources[resource]);
    });
  }

  function createGridState(campaign, options = {}) {
    const incoming = options.campaign || {};
    const carryover = incoming.gridCarryover || {};
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

  function applyGridCarryoverResources(resources, grid) {
    if (!grid || !grid.carryover) {
      return;
    }
    resources.power -= grid.carryover.reserveDebt || 0;
    resources.stability -= grid.carryover.blackoutScar || 0;
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
    const resources = baseResources();
    applyBundle(resources, upgradeEffects.startResources, 1);
    applyGridCarryoverResources(resources, grid);
    const state = {
      tick: 0,
      seed,
      nextQueueId: 1,
      resources,
      produced: {},
      queue: [],
      grid,
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
      log: [{ tick: 0, message: `${campaign.release} ${campaign.phase} online.` }],
    };

    GAME_DATA.initialQueue.forEach((entry) => {
      state.queue.push(createQueueEntry(state, entry.jobTypeId, entry.priority));
    });
    applyQueuePolicy(state);

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
    }
    return withLog(next, `Reserve batteries drew ${reserve.drawAmount} power into ${sector ? sector.name : "the grid"}.`);
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
    };
    lane.status = "assigned";
    lane.progress = 0;
    lane.runRemaining = lane.currentJob.remaining;
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
    evaluateContracts(state);
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
      advanceGridState(next);
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
        if (lane.currentJob.remaining === 0) {
          completeLaneJob(next, lane);
        }
      });
      evaluateContracts(next);
    }
    next.log = next.log.slice(0, 8);
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
        dueTick: grid.audit.dueTick,
        deferrals: grid.audit.deferrals,
      },
      sectors: grid.sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        laneId: sector.laneId,
        route: sector.route,
        isolated: sector.isolated,
        powered: sector.powered,
        blackoutLockedUntil: sector.blackoutLockedUntil,
        reserveDraws: sector.reserveDraws,
      })),
      choices: clone(grid.choices),
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
      },
      grid: gridSurfaceState(state),
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
      finishedAtTick: state.tick,
    });
    return {
      queuePolicy: state.campaign.queuePolicy,
      ledger,
      gridCarryover,
    };
  }

  function initDom() {
    if (typeof document === "undefined") {
      return;
    }
    Object.assign(dom, {
      runChip: document.getElementById("run-chip"),
      resources: document.getElementById("resource-readouts"),
      escalation: document.getElementById("escalation-surface"),
      lanes: document.getElementById("lane-board"),
      queue: document.getElementById("queue-list"),
      contracts: document.getElementById("contract-board"),
      upgrades: document.getElementById("upgrade-board"),
      jobs: document.getElementById("job-catalog"),
      log: document.getElementById("operator-log"),
      jobSelect: document.getElementById("job-type-select"),
      queuePolicySelect: document.getElementById("queue-policy-select"),
      enqueue: document.getElementById("enqueue-job"),
      assignNext: document.getElementById("assign-next-job"),
      startAll: document.getElementById("start-all-lanes"),
      reprioritize: document.getElementById("reprioritize-job"),
      cancel: document.getElementById("cancel-job"),
      restart: document.getElementById("restart-factory"),
    });
    currentState = createInitialState();
    renderStaticControls();
    bindControls();
    render(currentState);
    window.setInterval(() => {
      if (currentState && currentState.run.status === "active") {
        currentState = stepFactory(currentState, 1);
        render(currentState);
      }
    }, 900);
  }

  function renderStaticControls() {
    dom.jobSelect.innerHTML = GAME_DATA.jobTypes
      .map((jobType) => `<option value="${jobType.id}">${jobType.name}</option>`)
      .join("");
    dom.queuePolicySelect.innerHTML = GAME_DATA.campaign.queuePolicies
      .map((policy) => `<option value="${policy.id}">${policy.name}</option>`)
      .join("");
  }

  function bindControls() {
    dom.enqueue.addEventListener("click", () => {
      currentState = enqueueJob(currentState, dom.jobSelect.value);
      render(currentState);
    });
    dom.queuePolicySelect.addEventListener("change", () => {
      currentState = setQueuePolicy(currentState, dom.queuePolicySelect.value);
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
    dom.lanes.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
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
      render(currentState);
    });
    dom.queue.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
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
  }

  function render(state) {
    dom.runChip.textContent = `shift ${String(state.restart.run).padStart(2, "0")} / d${state.campaign.demand} / ${state.run.status} / t${state.tick}`;
    renderResources(state);
    renderEscalationSurface(state);
    renderLanes(state);
    renderQueue(state);
    renderContracts(state);
    renderUpgrades(state);
    renderJobs();
    renderLog(state);
  }

  function renderResources(state) {
    dom.resources.innerHTML = RESOURCE_ORDER.map((id) => {
      const label = GAME_DATA.resources[id].label;
      return `<div class="readout" data-resource="${id}"><span>${label}</span><strong>${state.resources[id] || 0}</strong></div>`;
    }).join("");
  }

  function renderEscalationSurface(state) {
    const surface = campaignSurfaceState(state);
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
    `;
  }

  function renderLanes(state) {
    dom.lanes.innerHTML = state.lanes.map((lane) => {
      const jobType = lane.currentJob ? byId(GAME_DATA.jobTypes, lane.currentJob.jobTypeId) : null;
      const jobText = jobType ? jobType.name : "idle bay";
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
      return `
        <article class="lane-card" data-status="${lane.status}" data-overdrive="${overdriveActive ? "true" : "false"}">
          <div class="lane-title">
            <span class="asset-title">${laneIcon}<strong>${lane.name}</strong></span>
            <span class="status-pill">${statusText}</span>
          </div>
          <div class="lane-job"><span>Current job</span><div class="job-inline">${jobIcon}<strong>${jobText}</strong></div></div>
          <div class="progress-track" aria-label="${lane.name} progress" style="--progress: ${lane.progress}%"><span></span></div>
          <div class="lane-meta">
            <span>${lane.trait}</span>
            <span>rate ${lane.throughput}</span>
            <span>jam ${Math.round(lane.jamRisk * 100)}%</span>
            <span>recover ${lane.recoveryRemaining}</span>
            <span>${overdriveText}</span>
            <span>${gridText}</span>
          </div>
          <div class="fault-readout" data-active="${lane.fault ? "true" : "false"}">${faultIcon}<span>fault ${faultText}</span></div>
          <div class="lane-actions">
            <button type="button" data-action="assign" data-lane="${lane.id}">assign</button>
            <button type="button" data-action="start" data-lane="${lane.id}">start</button>
            <button type="button" data-action="recover" data-lane="${lane.id}">recover</button>
            <button type="button" data-action="overdrive" data-lane="${lane.id}" data-overdrive-active="${overdriveActive ? "true" : "false"}" ${overdriveDisabled ? "disabled" : ""}>${overdriveActive ? "release" : "overdrive"}</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderQueue(state) {
    if (!state.queue.length) {
      dom.queue.innerHTML = `<li class="empty-note">queue empty</li>`;
      return;
    }
    dom.queue.innerHTML = state.queue.map((entry) => {
      const jobType = byId(GAME_DATA.jobTypes, entry.jobTypeId);
      const statusText = entry.status === "held" ? "held" : `p${entry.priority}`;
      return `
        <li class="queue-item" data-emergency="${entry.emergency ? "true" : "false"}">
          <div class="queue-title">
            <span class="asset-title">${iconMarkup(ASSET_PATHS.jobs[entry.jobTypeId], "asset-icon queue-icon")}<strong>${jobType.name}</strong></span>
            <span class="status-pill">${statusText}</span>
          </div>
          <div class="queue-meta">
            <span>in ${formatBundle(jobType.inputs)}</span>
            <span>out ${formatBundle(jobType.outputs)}</span>
            ${entry.sourceContractId ? `<span>${entry.sourceContractId}</span>` : ""}
            ${entry.sourceDirectiveId ? `<span>${entry.sourceDirectiveId}</span>` : ""}
          </div>
          <div class="queue-actions">
            <button type="button" data-action="assign" data-entry="${entry.id}">assign</button>
            <button type="button" data-action="raise" data-entry="${entry.id}">raise</button>
            <button type="button" data-action="cancel" data-entry="${entry.id}">cancel</button>
          </div>
        </li>
      `;
    }).join("");
  }

  function renderContracts(state) {
    dom.contracts.innerHTML = state.contracts.map((contract) => {
      const progress = contractProgress(contract, state)
        .map((line) => `${line.resource} ${line.current}/${line.required}`)
        .join(" / ");
      const timer = contract.status === "pending"
        ? `arms t${contract.activationTick} / ${contract.deadline} ticks`
        : contract.status === "open" ? `opens next / ${contract.deadline} ticks` : `${contract.timeRemaining} ticks left`;
      return `
        <article class="contract-card" data-status="${contract.status}" data-emergency="${contract.emergency ? "true" : "false"}">
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
    dom.upgrades.innerHTML = GAME_DATA.upgrades.map((upgrade) => {
      const installed = state.upgrades.purchased.includes(upgrade.id);
      const affordable = canPay(state.resources, upgrade.cost);
      return `
        <article class="upgrade-card" data-installed="${installed ? "true" : "false"}">
          <div class="upgrade-title">
            <strong>${upgrade.name}</strong>
            <span class="status-pill">${installed ? "installed" : formatBundle(upgrade.cost)}</span>
          </div>
          <p>${upgrade.description}</p>
          <button type="button" data-upgrade="${upgrade.id}" ${installed || !affordable ? "disabled" : ""}>install</button>
        </article>
      `;
    }).join("");
  }

  function renderJobs() {
    dom.jobs.innerHTML = GAME_DATA.jobTypes.map((jobType) => `
      <article class="job-card" data-family="${jobType.family || "standard"}">
        <div class="job-title">
          <span class="asset-title">${iconMarkup(ASSET_PATHS.jobs[jobType.id], "asset-icon job-icon")}<strong>${jobType.name}</strong></span>
          <span class="status-pill">${jobType.duration} ticks</span>
        </div>
        <div class="job-io">
          <span>in ${formatBundle(jobType.inputs)}</span>
          <span>out ${formatBundle(jobType.outputs)}</span>
        </div>
        <button type="button" data-job="${jobType.id}">enqueue</button>
      </article>
    `).join("");
  }

  function renderLog(state) {
    dom.log.innerHTML = state.log.map((entry) => `
      <li><span class="log-tick">t${entry.tick}</span><span>${entry.message}</span></li>
    `).join("");
  }

  const api = {
    GAME_DATA,
    createInitialState,
    enqueueJob,
    reprioritizeQueue,
    cancelQueueEntry,
    assignJobToLane,
    startLane,
    startAllLanes,
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
    evaluateContracts,
    maybeActivateEmergencyContracts,
    advanceGridState,
    resetFactoryState,
    canPay,
    applyBundle,
    contractProgress,
    gridSurfaceState,
    campaignSurfaceState,
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

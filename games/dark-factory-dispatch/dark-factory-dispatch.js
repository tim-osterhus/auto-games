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

  const GAME_DATA = {
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
    ],
    contracts: [
      {
        id: "perimeter-grid",
        name: "Perimeter Grid",
        requirement: { defenses: 2, drones: 2 },
        reward: { reputation: 2, scrap: 5 },
        penalty: { stability: -14, reputation: -1 },
        deadline: 20,
        pressure: "deliver drones and defenses before the yard blackout",
        status: "active",
      },
      {
        id: "relay-refit",
        name: "Relay Refit",
        requirement: { modules: 4, circuits: 4 },
        reward: { reputation: 1, power: 2 },
        penalty: { stability: -10, scrap: -3 },
        deadline: 16,
        pressure: "refit the relay before the next dispatch window",
        status: "open",
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

  function createQueueEntry(state, jobTypeId, priority) {
    const entry = {
      id: `q${state.nextQueueId}`,
      jobTypeId,
      priority,
      status: "queued",
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
    const resources = baseResources();
    applyBundle(resources, upgradeEffects.startResources, 1);
    const state = {
      tick: 0,
      seed,
      nextQueueId: 1,
      resources,
      produced: {},
      queue: [],
      lanes: GAME_DATA.lanes.map((lane) => ({
        id: lane.id,
        name: lane.name,
        trait: lane.trait,
        baseThroughput: lane.throughput,
        throughput: roundTenth(lane.throughput + upgradeEffects.throughputBonus),
        baseJamRisk: lane.jamRisk,
        jamRisk: Math.max(0.01, roundTenth((lane.jamRisk - upgradeEffects.jamResistance) * 100) / 100),
        status: "idle",
        progress: 0,
        runRemaining: 0,
        recoveryRemaining: 0,
        currentJob: null,
        fault: null,
        completedJobs: 0,
        restartState: clone(lane.restartState),
      })),
      contracts: GAME_DATA.contracts.map((contract, index) => ({
        id: contract.id,
        name: contract.name,
        requirement: clone(contract.requirement),
        reward: clone(contract.reward),
        penalty: clone(contract.penalty),
        deadline: contract.deadline,
        timeRemaining: contract.deadline,
        pressure: contract.pressure,
        status: index === 0 ? "active" : contract.status,
        startedAtTick: index === 0 ? 0 : null,
        completedAtTick: null,
        failedAtTick: null,
      })),
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
      log: [{ tick: 0, message: "Factory shell online." }],
    };

    GAME_DATA.initialQueue.forEach((entry) => {
      state.queue.push(createQueueEntry(state, entry.jobTypeId, entry.priority));
    });

    return state;
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

  function refreshUpgradeEffects(state) {
    state.upgrades.effects = aggregateUpgradeEffects(state.upgrades.purchased);
    state.lanes.forEach((lane) => {
      const source = byId(GAME_DATA.lanes, lane.id);
      lane.baseThroughput = source.throughput;
      lane.baseJamRisk = source.jamRisk;
      lane.throughput = roundTenth(source.throughput + state.upgrades.effects.throughputBonus);
      lane.jamRisk = Math.max(
        0.01,
        roundTenth((source.jamRisk - state.upgrades.effects.jamResistance) * 100) / 100
      );
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

  function enqueueJob(state, jobTypeId) {
    const jobType = byId(GAME_DATA.jobTypes, jobTypeId);
    if (!jobType) {
      throw new Error(`Unknown job type: ${jobTypeId}`);
    }
    const next = clone(state);
    const priority = next.queue.length + 1;
    next.queue.push(createQueueEntry(next, jobTypeId, priority));
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
    next.queue.forEach((queued, queueIndex) => {
      queued.priority = queueIndex + 1;
    });
    return withLog(next, `${jobName(entry.jobTypeId)} priority raised.`);
  }

  function cancelQueueEntry(state, entryId) {
    const next = clone(state);
    const index = next.queue.findIndex((entry) => entry.id === entryId);
    if (index < 0) {
      return withLog(next, "No queued job available to cancel.");
    }
    const [removed] = next.queue.splice(index, 1);
    return withLog(next, `${jobName(removed.jobTypeId)} cancelled.`);
  }

  function assignJobToLane(state, laneId, entryId = null) {
    const next = clone(state);
    const lane = byId(next.lanes, laneId) || next.lanes.find((candidate) => candidate.status === "idle");
    if (!lane || lane.status !== "idle") {
      return withLog(next, "No idle lane available.");
    }
    const entryIndex = entryId
      ? next.queue.findIndex((entry) => entry.id === entryId)
      : next.queue.findIndex((entry) => entry.status === "queued");
    if (entryIndex < 0) {
      return withLog(next, "Queue is empty.");
    }
    const [entry] = next.queue.splice(entryIndex, 1);
    const jobType = byId(GAME_DATA.jobTypes, entry.jobTypeId);
    lane.currentJob = {
      entryId: entry.id,
      jobTypeId: entry.jobTypeId,
      status: "assigned",
      duration: runtimeForLane(jobType, lane),
      remaining: runtimeForLane(jobType, lane),
      inputsConsumed: false,
      startedAtTick: null,
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
    const jobType = byId(GAME_DATA.jobTypes, lane.currentJob.jobTypeId);
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

  function stepFactory(state, ticks = 1) {
    const next = clone(state);
    for (let i = 0; i < ticks; i += 1) {
      if (next.run.status !== "active") {
        break;
      }
      next.tick += 1;
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
    const openOrActive = state.contracts.some((contract) => contract.status === "open" || contract.status === "active");
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
        applyBundle(state.resources, contract.reward, 1);
        state.log.unshift({ tick: state.tick, message: `${contract.name} contract complete.` });
        activateNextContract(state);
        return;
      }
      if (contract.timeRemaining === 0) {
        contract.status = "failed";
        contract.failedAtTick = state.tick;
        applyBundle(state.resources, contract.penalty, 1);
        state.log.unshift({ tick: state.tick, message: `${contract.name} contract failed; penalty applied.` });
        activateNextContract(state);
      }
    });
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

  function initDom() {
    if (typeof document === "undefined") {
      return;
    }
    Object.assign(dom, {
      runChip: document.getElementById("run-chip"),
      resources: document.getElementById("resource-readouts"),
      lanes: document.getElementById("lane-board"),
      queue: document.getElementById("queue-list"),
      contracts: document.getElementById("contract-board"),
      upgrades: document.getElementById("upgrade-board"),
      jobs: document.getElementById("job-catalog"),
      log: document.getElementById("operator-log"),
      jobSelect: document.getElementById("job-type-select"),
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
  }

  function bindControls() {
    dom.enqueue.addEventListener("click", () => {
      currentState = enqueueJob(currentState, dom.jobSelect.value);
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
    dom.runChip.textContent = `shift ${String(state.restart.run).padStart(2, "0")} / ${state.run.status} / t${state.tick}`;
    renderResources(state);
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

  function renderLanes(state) {
    dom.lanes.innerHTML = state.lanes.map((lane) => {
      const jobType = lane.currentJob ? byId(GAME_DATA.jobTypes, lane.currentJob.jobTypeId) : null;
      const jobText = jobType ? jobType.name : "idle bay";
      const faultText = lane.fault
        ? `${lane.fault.name} / ${lane.fault.phase} / ${lane.fault.decision} / ${formatBundle(lane.fault.recovery)}`
        : "clear";
      const statusText = lane.status === "idle" ? "ready" : lane.status;
      return `
        <article class="lane-card" data-status="${lane.status}">
          <div class="lane-title">
            <strong>${lane.name}</strong>
            <span class="status-pill">${statusText}</span>
          </div>
          <div class="lane-job"><span>Current job</span>${jobText}</div>
          <div class="progress-track" aria-label="${lane.name} progress" style="--progress: ${lane.progress}%"><span></span></div>
          <div class="lane-meta">
            <span>${lane.trait}</span>
            <span>rate ${lane.throughput}</span>
            <span>jam ${Math.round(lane.jamRisk * 100)}%</span>
            <span>recover ${lane.recoveryRemaining}</span>
            <span>fault ${faultText}</span>
          </div>
          <div class="lane-actions">
            <button type="button" data-action="assign" data-lane="${lane.id}">assign</button>
            <button type="button" data-action="start" data-lane="${lane.id}">start</button>
            <button type="button" data-action="recover" data-lane="${lane.id}">recover</button>
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
      return `
        <li class="queue-item">
          <div class="queue-title">
            <strong>${jobType.name}</strong>
            <span class="status-pill">p${entry.priority}</span>
          </div>
          <div class="queue-meta">
            <span>in ${formatBundle(jobType.inputs)}</span>
            <span>out ${formatBundle(jobType.outputs)}</span>
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
      const timer = contract.status === "open" ? `opens next / ${contract.deadline} ticks` : `${contract.timeRemaining} ticks left`;
      return `
        <article class="contract-card" data-status="${contract.status}">
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
      <article class="job-card">
        <div class="job-title">
          <strong>${jobType.name}</strong>
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
    evaluateContracts,
    resetFactoryState,
    canPay,
    applyBundle,
    contractProgress,
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

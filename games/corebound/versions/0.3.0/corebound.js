(function () {
  "use strict";

  const DATA = window.COREBOUND_DATA;
  const canvas = document.getElementById("corebound-canvas");
  const ctx = canvas.getContext("2d");
  const hud = {
    depth: document.getElementById("depth-readout"),
    cargo: document.getElementById("cargo-readout"),
    hull: document.getElementById("hull-readout"),
    energy: document.getElementById("energy-readout"),
    heat: document.getElementById("heat-readout"),
    pressure: document.getElementById("pressure-readout"),
    banked: document.getElementById("banked-readout"),
    alloy: document.getElementById("alloy-readout"),
    research: document.getElementById("research-readout"),
    relic: document.getElementById("relic-readout"),
    ores: document.getElementById("ore-list"),
    log: document.getElementById("signal-log"),
    state: document.getElementById("run-state"),
    upgrades: document.getElementById("upgrade-list"),
    researchList: document.getElementById("research-list"),
    contractStatus: document.getElementById("contract-status"),
    contractProgress: document.getElementById("contract-progress"),
    contracts: document.getElementById("contract-list"),
    charterStatus: document.getElementById("charter-status"),
    charterProgress: document.getElementById("charter-progress"),
    charters: document.getElementById("charter-list"),
    routeStatus: document.getElementById("route-status"),
    routeProgress: document.getElementById("route-progress"),
    routes: document.getElementById("route-list"),
    archiveStatus: document.getElementById("archive-status"),
    archiveList: document.getElementById("archive-list"),
    facilityStatus: document.getElementById("facility-status"),
    facilityProgress: document.getElementById("facility-progress"),
    utilities: document.getElementById("utility-list"),
    actions: {
      sell: document.getElementById("sell-cargo"),
      refine: document.getElementById("refine-cargo"),
      repair: document.getElementById("repair-rig"),
      launch: document.getElementById("launch-run")
    }
  };

  const dirs = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    w: [0, -1],
    W: [0, -1],
    s: [0, 1],
    S: [0, 1],
    a: [-1, 0],
    A: [-1, 0],
    d: [1, 0],
    D: [1, 0]
  };

  const state = {
    grid: [],
    player: {
      x: Math.floor(DATA.world.width / 2),
      y: 0,
      facing: [0, 1]
    },
    cargo: [],
    resources: {
      credits: 0,
      alloy: 0,
      research: 0,
      relic: 0
    },
    installedUpgrades: {},
    installedResearch: {},
    activeContractId: null,
    completedContracts: {},
    contractProgress: {},
    activeCharterId: null,
    runCharterId: null,
    completedCharters: {},
    charterProgress: {},
    activeRouteId: "standardLine",
    runRouteId: null,
    routeProgress: {},
    routeCompletions: {},
    routeRunsFiled: {},
    archiveProgress: {},
    utilityUses: {},
    beacons: [],
    runNumber: 0,
    docked: true,
    hull: DATA.rig.maxHull,
    energy: DATA.rig.maxEnergy,
    heat: 0,
    message: "Surface dock ready. Launch when the hold is clear."
  };

  function hash(x, y, salt) {
    let n = x * 374761393 + y * 668265263 + salt * 1442695041 + DATA.world.seed;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  function pickWeighted(entries, roll) {
    const total = entries.reduce((sum, entry) => sum + entry[1], 0);
    let cursor = roll * total;
    for (const entry of entries) {
      cursor -= entry[1];
      if (cursor <= 0) {
        return entry[0];
      }
    }
    return entries[entries.length - 1][0];
  }

  function bandForDepth(y) {
    return DATA.depthBands.find((band) => y >= band.from && y <= band.to) || DATA.depthBands[DATA.depthBands.length - 1];
  }

  function oreForCell(x, y, band) {
    const roll = hash(x, y, 47);
    let threshold = 0;
    for (const oreEntry of band.ores) {
      const oreKey = oreEntry[0];
      const oreChance = oreEntry[1];
      const ore = DATA.oreTypes[oreKey];
      if (y < ore.minDepth) {
        continue;
      }
      threshold += oreChance;
      if (roll < threshold) {
        return oreKey;
      }
    }
    return null;
  }

  function hazardForCell(x, y, band) {
    if (!band.hazards || !band.hazards.length) {
      return null;
    }

    const roll = hash(x, y, 71);
    let threshold = 0;
    for (const hazardEntry of band.hazards) {
      const hazardKey = hazardEntry[0];
      const hazardChance = hazardEntry[1];
      const hazard = DATA.hazardTypes[hazardKey];
      if (y < hazard.minDepth) {
        continue;
      }
      threshold += hazardChance;
      if (roll < threshold) {
        return hazardKey;
      }
    }
    return null;
  }

  function makeCell(x, y) {
    if (y === 0) {
      return { kind: "surface", terrain: null, ore: null, hazard: null };
    }

    const band = bandForDepth(y);
    const terrain = pickWeighted(band.terrain, hash(x, y, 11));
    const ore = oreForCell(x, y, band);
    const hazard = hazardForCell(x, y, band);
    return { kind: "solid", terrain, ore, hazard };
  }

  function generateWorld() {
    state.grid = [];
    for (let y = 0; y <= DATA.world.depth; y += 1) {
      const row = [];
      for (let x = 0; x < DATA.world.width; x += 1) {
        row.push(makeCell(x, y));
      }
      state.grid.push(row);
    }

    const shaftX = state.player.x;
    state.grid[0][shaftX] = { kind: "surface", terrain: null, ore: null, hazard: null };
  }

  function cellAt(x, y) {
    if (y < 0 || y > DATA.world.depth || x < 0 || x >= DATA.world.width) {
      return null;
    }
    return state.grid[y][x];
  }

  function rigStats() {
    const stats = {
      cargoCapacity: DATA.rig.cargoCapacity,
      maxHull: DATA.rig.maxHull,
      maxEnergy: DATA.rig.maxEnergy,
      moveEnergy: DATA.rig.moveEnergy,
      maxHeat: DATA.rig.maxHeat,
      coolingRate: DATA.rig.coolingRate,
      drillCostReduction: DATA.rig.drillCostReduction,
      hullRiskReduction: DATA.rig.hullRiskReduction,
      pressureMitigation: DATA.rig.pressureMitigation,
      hazardMitigation: DATA.rig.hazardMitigation,
      thermalShielding: DATA.rig.thermalShielding,
      valueMultiplier: DATA.rig.valueMultiplier,
      refineryBonus: DATA.rig.refineryBonus,
      repairDiscount: DATA.rig.repairDiscount,
      archiveSignal: DATA.rig.archiveSignal,
      scanRange: DATA.rig.scanRange,
      beaconCharges: DATA.rig.beaconCharges,
      beaconReturnEfficiency: DATA.rig.beaconReturnEfficiency,
      coolantCharges: DATA.rig.coolantCharges,
      anchorCharges: DATA.rig.anchorCharges,
      utilityCooling: DATA.rig.utilityCooling,
      charterDrillHeat: DATA.rig.charterDrillHeat,
      returnEnergyPenalty: DATA.rig.returnEnergyPenalty
    };

    for (const upgrade of DATA.upgrades) {
      if (!state.installedUpgrades[upgrade.id]) {
        continue;
      }
      applyStatEffects(stats, upgrade.effects);
    }

    for (const project of DATA.researchProjects) {
      if (!state.installedResearch[project.id]) {
        continue;
      }
      applyStatEffects(stats, project.effects);
    }

    for (const archiveSet of DATA.archiveSets || []) {
      if (archiveProgressFor(archiveSet) < archiveSet.fragmentsRequired) {
        continue;
      }
      if (archiveSet.unlock && archiveSet.unlock.effects) {
        applyStatEffects(stats, archiveSet.unlock.effects);
      }
    }

    for (const track of DATA.reputationTracks || []) {
      for (const rank of track.ranks || []) {
        if (reputationRequirementsMet(rank.requires) && rank.effects) {
          applyStatEffects(stats, rank.effects);
        }
      }
    }

    for (const charter of DATA.deepCharters || []) {
      if (state.completedCharters[charter.id] && charter.reward && charter.reward.relayEffects) {
        applyStatEffects(stats, charter.reward.relayEffects);
      }
    }

    const activeCharter = runCharter();
    if (activeCharter && activeCharter.constraint && activeCharter.constraint.effects) {
      applyStatEffects(stats, activeCharter.constraint.effects);
    }

    const activeRoute = runRoute();
    if (activeRoute && activeRoute.effects) {
      applyStatEffects(stats, activeRoute.effects);
    }

    stats.repairDiscount = Math.min(0.75, stats.repairDiscount);
    stats.cargoCapacity = Math.max(4, Math.floor(stats.cargoCapacity));
    stats.maxHull = Math.max(30, Math.floor(stats.maxHull));
    stats.maxEnergy = Math.max(35, Math.floor(stats.maxEnergy));
    stats.maxHeat = Math.max(30, Math.floor(stats.maxHeat));
    stats.moveEnergy = Math.max(0.25, stats.moveEnergy);
    stats.coolingRate = Math.max(1, stats.coolingRate);
    stats.scanRange = Math.max(1, Math.floor(stats.scanRange));
    stats.beaconCharges = Math.max(0, Math.floor(stats.beaconCharges));
    stats.coolantCharges = Math.max(0, Math.floor(stats.coolantCharges));
    stats.anchorCharges = Math.max(0, Math.floor(stats.anchorCharges || 0));
    stats.beaconReturnEfficiency = Math.max(0, Math.min(0.65, stats.beaconReturnEfficiency));
    stats.utilityCooling = Math.max(0, stats.utilityCooling);
    stats.charterDrillHeat = Math.max(0, stats.charterDrillHeat || 0);
    stats.returnEnergyPenalty = Math.max(0, Math.min(0.65, stats.returnEnergyPenalty || 0));
    return stats;
  }

  function applyStatEffects(stats, effects) {
    for (const effectKey of Object.keys(effects || {})) {
      stats[effectKey] = (stats[effectKey] || 0) + effects[effectKey];
    }
  }

  function cargoLoad() {
    return state.cargo.reduce((sum, item) => sum + DATA.oreTypes[item].weight, 0);
  }

  function cargoBaseValue() {
    return state.cargo.reduce((sum, item) => sum + DATA.oreTypes[item].value, 0);
  }

  function cargoValue() {
    return Math.round(cargoBaseValue() * rigStats().valueMultiplier);
  }

  function setMessage(message) {
    state.message = message;
    hud.log.textContent = message;
  }

  function centerSurfaceDock() {
    state.player.x = Math.floor(DATA.world.width / 2);
    state.player.y = 0;
  }

  function surfaceService(message) {
    state.docked = true;
    state.runCharterId = null;
    state.runRouteId = null;
    state.energy = rigStats().maxEnergy;
    state.heat = 0;
    setMessage(message || "Surface lock reached. Settle cargo, repair, or relaunch.");
    updateHud();
    render();
  }

  function pressureTier(y) {
    const stats = rigStats();
    return Math.max(0, Math.floor(y / 22) - stats.pressureMitigation);
  }

  function pressureLabel(y) {
    const tier = pressureTier(y);
    if (tier <= 0) {
      return "clear";
    }
    if (tier === 1) {
      return "low";
    }
    if (tier === 2) {
      return "rising";
    }
    return "crush";
  }

  function coolRig(multiplier) {
    const amount = rigStats().coolingRate * multiplier;
    state.heat = Math.max(0, state.heat - amount);
  }

  function addHeat(amount) {
    const stats = rigStats();
    const adjusted = Math.max(0, amount - stats.thermalShielding);
    state.heat = Math.max(0, state.heat + adjusted);
    if (state.heat <= stats.maxHeat) {
      return 0;
    }

    const overheatDamage = Math.ceil((state.heat - stats.maxHeat) / 8);
    state.hull = Math.max(0, state.hull - overheatDamage);
    return overheatDamage;
  }

  function applyHazardPressure(cell, mode) {
    if (!cell.hazard) {
      return false;
    }

    const hazard = DATA.hazardTypes[cell.hazard];
    const stats = rigStats();
    const transitFactor = mode === "transit" ? 0.5 : 1;
    const hullDamage = Math.max(0, Math.ceil(hazard.hullDamage * transitFactor) - stats.hazardMitigation);
    const energyDamage = Math.max(0, Math.ceil(hazard.energyDamage * transitFactor) - stats.hazardMitigation);
    const heatDamage = addHeat(Math.ceil(hazard.heat * transitFactor));

    state.hull = Math.max(0, state.hull - hullDamage);
    state.energy = Math.max(0, state.energy - energyDamage);

    const damageParts = [];
    if (hullDamage || heatDamage) {
      damageParts.push(`${hullDamage + heatDamage} hull`);
    }
    if (energyDamage) {
      damageParts.push(`${energyDamage} energy`);
    }

    if (damageParts.length) {
      setMessage(`${hazard.message} ${damageParts.join(" / ")} lost.`);
    } else {
      setMessage(`${hazard.label} mapped safely.`);
    }
    return true;
  }

  function returnToSurface(message) {
    centerSurfaceDock();
    surfaceService(message || "Emergency lift returned the rig to surface lock.");
  }

  function addResources(amounts) {
    for (const key of Object.keys(amounts)) {
      state.resources[key] = (state.resources[key] || 0) + amounts[key];
    }
  }

  function spendResources(cost) {
    for (const key of Object.keys(cost)) {
      state.resources[key] -= cost[key];
    }
  }

  function canAfford(cost) {
    return Object.keys(cost).every((key) => (state.resources[key] || 0) >= cost[key]);
  }

  function formatAmounts(amounts) {
    const parts = [];
    for (const key of Object.keys(DATA.economy.resources)) {
      const amount = amounts[key] || 0;
      if (amount <= 0) {
        continue;
      }
      parts.push(`${amount} ${DATA.economy.resources[key].shortLabel}`);
    }
    return parts.join(" / ") || "settled";
  }

  function completedContractCount() {
    return Object.keys(state.completedContracts).length;
  }

  function completedCharterCount() {
    return Object.keys(state.completedCharters).length;
  }

  function completedArchiveSetCount() {
    let count = 0;
    for (const archiveSet of DATA.archiveSets || []) {
      if (archiveProgressFor(archiveSet) >= archiveSet.fragmentsRequired) {
        count += 1;
      }
    }
    return count;
  }

  function reputationRequirementsMet(requirements) {
    const needed = requirements || {};
    return completedContractCount() >= (needed.contracts || 0)
      && completedCharterCount() >= (needed.charters || 0)
      && completedArchiveSetCount() >= (needed.archiveSets || 0);
  }

  function reputationRankFor(track) {
    if (!track || !track.ranks || !track.ranks.length) {
      return null;
    }
    let current = track.ranks[0];
    for (const rank of track.ranks) {
      if (reputationRequirementsMet(rank.requires)) {
        current = rank;
      }
    }
    return current;
  }

  function primaryReputationTrack() {
    return DATA.reputationTracks && DATA.reputationTracks.length ? DATA.reputationTracks[0] : null;
  }

  function rankIndexFor(track, rankId) {
    if (!track) {
      return -1;
    }
    return track.ranks.findIndex((rank) => rank.id === rankId);
  }

  function utilityById(utilityId) {
    return (DATA.utilities || []).find((entry) => entry.id === utilityId) || null;
  }

  function utilityUnlocked(utility) {
    if (!utility.requiresRank) {
      return true;
    }

    const track = primaryReputationTrack();
    if (!track) {
      return false;
    }
    const current = reputationRankFor(track);
    if (!current) {
      return false;
    }
    return rankIndexFor(track, current.id) >= rankIndexFor(track, utility.requiresRank);
  }

  function utilityChargesRemaining(utility) {
    if (!utility.chargesStat) {
      return null;
    }
    return Math.max(0, (rigStats()[utility.chargesStat] || 0) - (state.utilityUses[utility.id] || 0));
  }

  function spendUtilityCharge(utility) {
    if (!utility.chargesStat) {
      return;
    }
    state.utilityUses[utility.id] = (state.utilityUses[utility.id] || 0) + 1;
  }

  function archiveSetById(setId) {
    return (DATA.archiveSets || []).find((entry) => entry.id === setId) || null;
  }

  function archiveProgressFor(archiveSet) {
    return Math.min(archiveSet.fragmentsRequired, state.archiveProgress[archiveSet.id] || 0);
  }

  function archiveFragmentSummary(fragments) {
    const parts = [];
    for (const setId of Object.keys(fragments || {})) {
      const archiveSet = archiveSetById(setId);
      if (!archiveSet) {
        continue;
      }
      parts.push(`${fragments[setId]} ${archiveSet.label}`);
    }
    return parts.join(" / ");
  }

  function formatContractReward(reward) {
    const parts = [];
    const resources = reward && reward.resources ? reward.resources : {};
    const resourceSummary = formatAmounts(resources);
    if (resourceSummary !== "settled") {
      parts.push(resourceSummary);
    }
    const archiveSummary = archiveFragmentSummary(reward && reward.archiveFragments ? reward.archiveFragments : {});
    if (archiveSummary) {
      parts.push(`archive ${archiveSummary}`);
    }
    return parts.join(" / ") || "filed";
  }

  function formatRelayEffects(effects) {
    const labels = {
      scanRange: "scan range",
      beaconCharges: "beacon charge",
      beaconReturnEfficiency: "beacon return",
      coolantCharges: "coolant charge",
      anchorCharges: "anchor recall",
      utilityCooling: "coolant strength"
    };
    const parts = [];
    for (const key of Object.keys(effects || {})) {
      const amount = effects[key];
      if (!amount) {
        continue;
      }
      const prefix = amount > 0 ? "+" : "";
      parts.push(`${labels[key] || key} ${prefix}${amount}`);
    }
    return parts.join(" / ");
  }

  function formatCharterReward(reward) {
    const parts = [];
    const resources = reward && reward.resources ? reward.resources : {};
    const resourceSummary = formatAmounts(resources);
    if (resourceSummary !== "settled") {
      parts.push(resourceSummary);
    }
    const archiveSummary = archiveFragmentSummary(reward && reward.archiveFragments ? reward.archiveFragments : {});
    if (archiveSummary) {
      parts.push(`archive ${archiveSummary}`);
    }
    const relaySummary = formatRelayEffects(reward && reward.relayEffects ? reward.relayEffects : {});
    if (relaySummary) {
      parts.push(`relay ${relaySummary}`);
    }
    return parts.join(" / ") || "charter standing";
  }

  function activeContract() {
    return (DATA.contracts || []).find((entry) => entry.id === state.activeContractId) || null;
  }

  function charterById(charterId) {
    return (DATA.deepCharters || []).find((entry) => entry.id === charterId) || null;
  }

  function selectedCharter() {
    return charterById(state.activeCharterId);
  }

  function runCharter() {
    return charterById(state.runCharterId);
  }

  function visibleCharter() {
    return runCharter() || selectedCharter();
  }

  function routeById(routeId) {
    return (DATA.routePlans || []).find((entry) => entry.id === routeId) || null;
  }

  function selectedRoute() {
    return routeById(state.activeRouteId);
  }

  function runRoute() {
    return routeById(state.runRouteId);
  }

  function visibleRoute() {
    return runRoute() || selectedRoute();
  }

  function routePlanUnlocked(route) {
    if (!route) {
      return false;
    }
    if (route.requires && !reputationRequirementsMet(route.requires)) {
      return false;
    }
    if (route.requiresCharter && !state.completedCharters[route.requiresCharter]) {
      return false;
    }
    return true;
  }

  function routeRequirementLabel(route) {
    if (!route || routePlanUnlocked(route)) {
      return "open";
    }
    if (route.requiresCharter) {
      const charter = charterById(route.requiresCharter);
      return charter ? `requires ${charter.label}` : "requires filed charter";
    }
    const requires = route.requires || {};
    const parts = [];
    if (requires.contracts) {
      parts.push(`${requires.contracts} contract${requires.contracts === 1 ? "" : "s"}`);
    }
    if (requires.charters) {
      parts.push(`${requires.charters} charter${requires.charters === 1 ? "" : "s"}`);
    }
    if (requires.archiveSets) {
      parts.push(`${requires.archiveSets} archive set${requires.archiveSets === 1 ? "" : "s"}`);
    }
    return parts.length ? `requires ${parts.join(" / ")}` : "locked";
  }

  function routeProgressValue(route) {
    const objective = route.objective || {};
    return Math.min(objective.target || 0, state.routeProgress[route.id] || 0);
  }

  function routeProgressLabel(route) {
    const objective = route.objective || {};
    const value = routeProgressValue(route);
    if (objective.unit === "m") {
      return `${Math.floor(value)} / ${objective.target} m`;
    }
    return `${value} / ${objective.target} ${objective.unit}`;
  }

  function rewardRoute(route) {
    const before = rigStats();
    const reward = route.reward || {};
    if (reward.resources) {
      addResources(reward.resources);
    }
    const unlocked = applyArchiveFragments(reward.archiveFragments || {});
    const after = rigStats();
    state.hull = Math.min(after.maxHull, state.hull + Math.max(0, after.maxHull - before.maxHull));
    state.energy = Math.min(after.maxEnergy, state.energy + Math.max(0, after.maxEnergy - before.maxEnergy));
    return unlocked;
  }

  function completeRunRoute(route) {
    if (state.routeRunsFiled[route.id] === state.runNumber) {
      return;
    }
    state.routeRunsFiled[route.id] = state.runNumber;
    state.routeCompletions[route.id] = (state.routeCompletions[route.id] || 0) + 1;
    const unlocked = rewardRoute(route);
    const unlockText = unlocked.length ? ` Archive unlock: ${unlocked.join(", ")}.` : "";
    setMessage(`${route.label} route logged. Reward ${formatContractReward(route.reward)}.${unlockText}`);
  }

  function updateRouteProgress() {
    const route = runRoute();
    if (!route || state.routeRunsFiled[route.id] === state.runNumber) {
      return;
    }

    const objective = route.objective || {};
    let value = state.routeProgress[route.id] || 0;
    if (objective.kind === "depth") {
      value = Math.max(value, state.player.y * DATA.world.metersPerTile);
    } else if (objective.kind === "ore") {
      const oreCount = state.cargo.filter((oreKey) => oreKey === objective.ore).length;
      value = Math.max(value, oreCount);
    }

    state.routeProgress[route.id] = Math.min(objective.target, value);
    if (state.routeProgress[route.id] >= objective.target) {
      completeRunRoute(route);
    }
  }

  function selectRoutePlan(routeId) {
    if (state.player.y !== 0 || !state.docked) {
      setMessage("Late routes can be selected only at surface lock.");
      return;
    }

    const route = routeById(routeId);
    if (!route || !routePlanUnlocked(route)) {
      setMessage(route ? `${route.label} ${routeRequirementLabel(route)}.` : "Route plan unavailable.");
      return;
    }

    state.activeRouteId = route.id;
    setMessage(`${route.label} selected. ${route.summary}`);
    updateHud();
    render();
  }

  function contractProgressValue(contract) {
    return Math.min(contract.target, state.contractProgress[contract.id] || 0);
  }

  function contractProgressLabel(contract) {
    const value = contractProgressValue(contract);
    if (contract.unit === "m") {
      return `${Math.floor(value)} / ${contract.target} m`;
    }
    return `${value} / ${contract.target} ${contract.unit}`;
  }

  function charterProgressValue(charter) {
    const objective = charter.objective || {};
    return Math.min(objective.target || 0, state.charterProgress[charter.id] || 0);
  }

  function charterProgressLabel(charter) {
    const objective = charter.objective || {};
    const value = charterProgressValue(charter);
    if (objective.unit === "m") {
      return `${Math.floor(value)} / ${objective.target} m`;
    }
    return `${value} / ${objective.target} ${objective.unit}`;
  }

  function rewardCharter(charter) {
    const before = rigStats();
    const reward = charter.reward || {};
    if (reward.resources) {
      addResources(reward.resources);
    }
    const unlocked = applyArchiveFragments(reward.archiveFragments || {});
    const after = rigStats();
    state.hull = Math.min(after.maxHull, state.hull + Math.max(0, after.maxHull - before.maxHull));
    state.energy = Math.min(after.maxEnergy, state.energy + Math.max(0, after.maxEnergy - before.maxEnergy));
    return unlocked;
  }

  function completeRunCharter(charter) {
    state.completedCharters[charter.id] = true;
    state.activeCharterId = null;
    const unlocked = rewardCharter(charter);
    const unlockText = unlocked.length ? ` Archive unlock: ${unlocked.join(", ")}.` : "";
    setMessage(`${charter.label} filed. Reward ${formatCharterReward(charter.reward)}.${unlockText}`);
  }

  function updateCharterProgress() {
    const charter = runCharter();
    if (!charter || state.completedCharters[charter.id]) {
      return;
    }

    const objective = charter.objective || {};
    let value = state.charterProgress[charter.id] || 0;
    if (objective.kind === "depth") {
      value = Math.max(value, state.player.y * DATA.world.metersPerTile);
    } else if (objective.kind === "ore") {
      const oreCount = state.cargo.filter((oreKey) => oreKey === objective.ore).length;
      value = Math.max(value, oreCount);
    }

    state.charterProgress[charter.id] = Math.min(objective.target, value);
    if (state.charterProgress[charter.id] >= objective.target) {
      completeRunCharter(charter);
    }
  }

  function acceptCharter(charterId) {
    if (state.player.y !== 0 || !state.docked) {
      setMessage("Deep Charters can be signed only at surface lock.");
      return;
    }
    if (state.activeCharterId) {
      setMessage("Finish the active Deep Charter before taking another.");
      return;
    }

    const charter = charterById(charterId);
    if (!charter || state.completedCharters[charter.id]) {
      return;
    }

    state.activeCharterId = charter.id;
    state.charterProgress[charter.id] = 0;
    setMessage(`${charter.label} accepted. ${charter.constraint.label}: ${charter.constraint.summary}`);
    updateHud();
    render();
  }

  function applyArchiveFragments(fragments) {
    const unlocked = [];
    for (const setId of Object.keys(fragments || {})) {
      const archiveSet = archiveSetById(setId);
      if (!archiveSet) {
        continue;
      }
      const before = archiveProgressFor(archiveSet);
      if (before >= archiveSet.fragmentsRequired) {
        continue;
      }
      state.archiveProgress[setId] = Math.min(archiveSet.fragmentsRequired, before + fragments[setId]);
      const after = archiveProgressFor(archiveSet);
      if (after >= archiveSet.fragmentsRequired) {
        unlocked.push(archiveSet.unlock.label);
      }
    }
    return unlocked;
  }

  function archiveFragmentsFromCargo(cargoItems) {
    const fragments = {};
    for (const oreKey of cargoItems) {
      const archive = DATA.oreTypes[oreKey].archive;
      if (!archive) {
        continue;
      }
      fragments[archive.set] = (fragments[archive.set] || 0) + archive.fragments;
    }
    return fragments;
  }

  function noteArchiveContractProgress(fragments) {
    const contract = activeContract();
    if (!contract || contract.kind !== "archive" || state.completedContracts[contract.id]) {
      return;
    }
    const amount = fragments[contract.archiveSet] || 0;
    if (!amount) {
      return;
    }
    state.contractProgress[contract.id] = Math.min(
      contract.target,
      (state.contractProgress[contract.id] || 0) + amount
    );
  }

  function rewardContract(contract) {
    const before = rigStats();
    const reward = contract.reward || {};
    if (reward.resources) {
      addResources(reward.resources);
    }
    const unlocked = applyArchiveFragments(reward.archiveFragments || {});
    const after = rigStats();
    state.hull = Math.min(after.maxHull, state.hull + Math.max(0, after.maxHull - before.maxHull));
    state.energy = Math.min(after.maxEnergy, state.energy + Math.max(0, after.maxEnergy - before.maxEnergy));
    return unlocked;
  }

  function completeActiveContract(contract) {
    state.completedContracts[contract.id] = true;
    state.activeContractId = null;
    const unlocked = rewardContract(contract);
    const unlockText = unlocked.length ? ` Archive unlock: ${unlocked.join(", ")}.` : "";
    setMessage(`${contract.label} complete. Reward ${formatContractReward(contract.reward)}.${unlockText}`);
  }

  function updateContractProgress() {
    const contract = activeContract();
    if (!contract || state.completedContracts[contract.id]) {
      return;
    }

    let value = state.contractProgress[contract.id] || 0;
    if (contract.kind === "depth") {
      value = Math.max(value, state.player.y * DATA.world.metersPerTile);
    } else if (contract.kind === "ore") {
      const oreCount = state.cargo.filter((oreKey) => oreKey === contract.ore).length;
      value = Math.max(value, oreCount);
    }
    state.contractProgress[contract.id] = Math.min(contract.target, value);
    if (state.contractProgress[contract.id] >= contract.target) {
      completeActiveContract(contract);
    }
  }

  function acceptContract(contractId) {
    if (state.player.y !== 0 || !state.docked) {
      setMessage("Contracts can be signed only at surface lock.");
      return;
    }
    if (state.activeContractId) {
      setMessage("Finish the active commission before taking another.");
      return;
    }

    const contract = (DATA.contracts || []).find((entry) => entry.id === contractId);
    if (!contract || state.completedContracts[contract.id]) {
      return;
    }

    state.activeContractId = contract.id;
    state.contractProgress[contract.id] = 0;
    setMessage(`${contract.label} accepted. ${contract.summary}`);
    updateHud();
    render();
  }

  function directionLabel(dx, dy) {
    const parts = [];
    if (dy > 0) {
      parts.push(`${dy}S`);
    } else if (dy < 0) {
      parts.push(`${Math.abs(dy)}N`);
    }
    if (dx > 0) {
      parts.push(`${dx}E`);
    } else if (dx < 0) {
      parts.push(`${Math.abs(dx)}W`);
    }
    return parts.join(" ") || "here";
  }

  function nearestScanTarget(kind, range) {
    let best = null;
    for (let y = Math.max(1, state.player.y - range); y <= Math.min(DATA.world.depth, state.player.y + range); y += 1) {
      for (let x = Math.max(0, state.player.x - range); x <= Math.min(DATA.world.width - 1, state.player.x + range); x += 1) {
        const distance = Math.abs(x - state.player.x) + Math.abs(y - state.player.y);
        if (distance === 0 || distance > range) {
          continue;
        }
        const cell = cellAt(x, y);
        if (!cell) {
          continue;
        }
        const key = kind === "ore" ? cell.ore : cell.hazard;
        if (!key || (best && distance >= best.distance)) {
          continue;
        }
        best = { x, y, key, distance };
      }
    }
    return best;
  }

  function runSweepScan(utility) {
    const stats = rigStats();
    if (state.energy < utility.energyCost) {
      setMessage(`${utility.label} needs ${utility.energyCost} energy.`);
      return false;
    }

    state.energy = Math.max(0, state.energy - utility.energyCost);
    addHeat(utility.heat || 0);
    const oreTarget = nearestScanTarget("ore", stats.scanRange);
    const hazardTarget = nearestScanTarget("hazard", stats.scanRange);
    const signals = [];

    if (oreTarget) {
      const ore = DATA.oreTypes[oreTarget.key];
      signals.push(`${ore.label} ${directionLabel(oreTarget.x - state.player.x, oreTarget.y - state.player.y)}`);
    }
    if (hazardTarget) {
      const hazard = DATA.hazardTypes[hazardTarget.key];
      signals.push(`${hazard.label} ${directionLabel(hazardTarget.x - state.player.x, hazardTarget.y - state.player.y)}`);
    }

    setMessage(signals.length ? `Sweep scan: ${signals.join(" / ")}.` : `Sweep scan found no signals within ${stats.scanRange} tiles.`);
    return true;
  }

  function deployRouteBeacon(utility) {
    if (state.player.y <= 0 || state.docked) {
      setMessage(`${utility.label} arms only underground.`);
      return false;
    }

    state.beacons.push({ x: state.player.x, y: state.player.y });
    setMessage(`Route beacon set at ${state.player.y * DATA.world.metersPerTile} m. Climb near it to cut return energy drag.`);
    return true;
  }

  function triggerCoolantBurst(utility) {
    if (state.heat <= 0) {
      setMessage("Coolant reserve held. Heat is already clear.");
      return false;
    }

    const cooling = (utility.heatReduction || 0) + rigStats().utilityCooling;
    const before = state.heat;
    state.heat = Math.max(0, state.heat - cooling);
    setMessage(`Coolant burst vented ${Math.round(before - state.heat)} heat.`);
    return true;
  }

  function triggerAnchorRecall(utility) {
    const depth = state.player.y * DATA.world.metersPerTile;
    if (depth < 64) {
      setMessage(`${utility.label} waits for deep-route tension.`);
      return false;
    }

    const cargoText = state.cargo.length ? `${state.cargo.length} cargo held` : "hold empty";
    returnToSurface(`Anchor recall hauled the rig from ${depth} m with ${cargoText}.`);
    return true;
  }

  function useUtility(utilityId) {
    const utility = utilityById(utilityId);
    if (!utility) {
      return;
    }
    if (!utilityUnlocked(utility)) {
      setMessage(`${utility.label} needs more survey relay reputation.`);
      return;
    }
    if (state.player.y === 0 || state.docked) {
      setMessage("Field utilities arm after launch.");
      return;
    }

    const charges = utilityChargesRemaining(utility);
    if (charges !== null && charges <= 0) {
      setMessage(`${utility.label} has no charges left this run.`);
      return;
    }

    let used = false;
    if (utility.id === "sweepScan") {
      used = runSweepScan(utility);
    } else if (utility.id === "routeBeacon") {
      used = deployRouteBeacon(utility);
    } else if (utility.id === "coolantBurst") {
      used = triggerCoolantBurst(utility);
    } else if (utility.id === "anchorRecall") {
      used = triggerAnchorRecall(utility);
    }

    if (!used) {
      updateHud();
      render();
      return;
    }

    spendUtilityCharge(utility);
    if (state.hull <= 0 || state.energy <= 0) {
      returnToSurface(state.hull <= 0 ? "Emergency casing recall fired." : "Reserve power low. Surface winch engaged.");
      return;
    }
    updateHud();
    render();
  }

  function nearRouteBeacon(x, y) {
    const stats = rigStats();
    if (stats.beaconReturnEfficiency <= 0 || !state.beacons.length) {
      return false;
    }
    return state.beacons.some((beacon) => y <= beacon.y && Math.abs(beacon.x - x) + Math.abs(beacon.y - y) <= 6);
  }

  function clearCargoWithMessage(message) {
    state.cargo = [];
    setMessage(message);
    updateHud();
    render();
  }

  function sellCargo() {
    if (state.player.y !== 0 || !state.docked) {
      setMessage("Surface dock services are out of range.");
      return;
    }
    if (!state.cargo.length) {
      setMessage("Hold clear. No findings to sell.");
      return;
    }

    const handling = state.cargo.length * DATA.economy.sale.handlingCreditsPerCargoUnit;
    const payout = cargoValue() + handling;
    addResources({ credits: payout });
    clearCargoWithMessage(`Cargo sold for ${payout} credits.`);
  }

  function refineCargo() {
    if (state.player.y !== 0 || !state.docked) {
      setMessage("Refinery accepts loads only at surface lock.");
      return;
    }
    if (!state.cargo.length) {
      setMessage("Hold clear. No findings to refine.");
      return;
    }

    const refined = {};
    for (const oreKey of state.cargo) {
      const output = DATA.oreTypes[oreKey].refine || {};
      for (const key of Object.keys(output)) {
        refined[key] = (refined[key] || 0) + output[key];
      }
    }

    if (rigStats().refineryBonus > 0) {
      refined.alloy = (refined.alloy || 0) + rigStats().refineryBonus;
    }

    const contractBeforeRefine = activeContract();
    const archiveFragments = archiveFragmentsFromCargo(state.cargo);
    const archiveSummary = archiveFragmentSummary(archiveFragments);
    noteArchiveContractProgress(archiveFragments);
    const archiveUnlocks = applyArchiveFragments(archiveFragments);
    refined.credits = Math.max(
      DATA.economy.refinement.minimumCredits,
      Math.floor(cargoBaseValue() * DATA.economy.refinement.creditFactor)
    );
    addResources(refined);
    state.cargo = [];
    updateContractProgress();
    const contractCompleted = contractBeforeRefine && state.completedContracts[contractBeforeRefine.id];

    const archiveText = archiveSummary ? ` Archive filed: ${archiveSummary}.` : "";
    const contractText = contractCompleted ? ` Contract filed: ${contractBeforeRefine.label}.` : "";
    const unlockText = archiveUnlocks.length ? ` Archive unlock: ${archiveUnlocks.join(", ")}.` : "";
    setMessage(`Cargo refined into ${formatAmounts(refined)}.${archiveText}${contractText}${unlockText}`);
    updateHud();
    render();
  }

  function repairRig() {
    if (state.player.y !== 0 || !state.docked) {
      setMessage("Rig bay repairs require surface lock.");
      return;
    }

    const stats = rigStats();
    const missingHull = Math.ceil(stats.maxHull - state.hull);
    if (missingHull <= 0) {
      setMessage("Hull already sealed.");
      return;
    }

    const costPerPoint = Math.max(
      1,
      Math.ceil(DATA.economy.repair.creditsPerHullPoint * (1 - stats.repairDiscount))
    );
    const repairable = Math.min(missingHull, Math.floor(state.resources.credits / costPerPoint));
    if (repairable <= 0) {
      setMessage(`Repairs need ${costPerPoint} credits per hull point.`);
      return;
    }

    state.resources.credits -= repairable * costPerPoint;
    state.hull = Math.min(stats.maxHull, state.hull + repairable);
    setMessage(`Rig bay restored ${repairable} hull.`);
    updateHud();
    render();
  }

  function purchaseUpgrade(upgradeId) {
    if (state.player.y !== 0 || !state.docked) {
      setMessage("Upgrades install only at surface lock.");
      return;
    }

    const upgrade = DATA.upgrades.find((entry) => entry.id === upgradeId);
    if (!upgrade) {
      return;
    }
    if (state.installedUpgrades[upgrade.id]) {
      setMessage(`${upgrade.label} already installed.`);
      return;
    }
    if (!canAfford(upgrade.cost)) {
      setMessage(`${upgrade.label} needs ${formatAmounts(upgrade.cost)}.`);
      return;
    }

    const before = rigStats();
    spendResources(upgrade.cost);
    state.installedUpgrades[upgrade.id] = true;
    const after = rigStats();
    state.hull = Math.min(after.maxHull, state.hull + Math.max(0, after.maxHull - before.maxHull));
    state.energy = Math.min(after.maxEnergy, state.energy + Math.max(0, after.maxEnergy - before.maxEnergy));
    setMessage(`${upgrade.label} installed.`);
    updateHud();
    render();
  }

  function purchaseResearch(projectId) {
    if (state.player.y !== 0 || !state.docked) {
      setMessage("Research desk requires surface lock.");
      return;
    }

    const project = DATA.researchProjects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }
    if (state.installedResearch[project.id]) {
      setMessage(`${project.label} already archived.`);
      return;
    }
    if (!canAfford(project.cost)) {
      setMessage(`${project.label} needs ${formatAmounts(project.cost)}.`);
      return;
    }

    const before = rigStats();
    spendResources(project.cost);
    state.installedResearch[project.id] = true;
    const after = rigStats();
    state.heat = Math.min(after.maxHeat, state.heat);
    state.hull = Math.min(after.maxHull, state.hull + Math.max(0, after.maxHull - before.maxHull));
    state.energy = Math.min(after.maxEnergy, state.energy + Math.max(0, after.maxEnergy - before.maxEnergy));
    setMessage(`${project.label} archived. Future runs inherit the study.`);
    updateHud();
    render();
  }

  function launchRun() {
    if (state.player.y !== 0 || !state.docked) {
      return true;
    }
    if (state.cargo.length > 0) {
      setMessage("Settle the hold before relaunch.");
      updateHud();
      return false;
    }
    if (state.hull <= 0) {
      setMessage("Repair hull before relaunch.");
      updateHud();
      return false;
    }

    state.runCharterId = state.activeCharterId;
    state.runRouteId = state.activeRouteId;
    state.routeProgress[state.runRouteId] = 0;
    const stats = rigStats();
    state.docked = false;
    state.runNumber += 1;
    state.energy = stats.maxEnergy;
    state.heat = 0;
    state.hull = Math.min(stats.maxHull, state.hull);
    state.utilityUses = {};
    state.beacons = [];
    const charter = runCharter();
    const contract = activeContract();
    const route = runRoute();
    const assignments = [];
    if (contract) {
      assignments.push(contract.label);
    }
    if (charter) {
      assignments.push(`Deep Charter: ${charter.label}`);
    }
    if (route) {
      assignments.push(`Route: ${route.label}`);
    }
    setMessage(assignments.length ? `Run ${state.runNumber} launched for ${assignments.join(" / ")}.` : `Run ${state.runNumber} launched.`);
    updateHud();
    render();
    return true;
  }

  function collectOre(oreKey) {
    const ore = DATA.oreTypes[oreKey];
    if (cargoLoad() + ore.weight > rigStats().cargoCapacity) {
      setMessage(`${ore.label} left in wall. Cargo bay full.`);
      return false;
    }
    state.cargo.push(oreKey);
    setMessage(`${ore.label} loaded into hold.`);
    updateContractProgress();
    updateCharterProgress();
    updateRouteProgress();
    return true;
  }

  function drillBlock(x, y, cell) {
    const stats = rigStats();
    const terrain = DATA.terrainTypes[cell.terrain];
    const pressure = pressureTier(y);
    const cost = Math.max(1, terrain.energyCost + pressure - stats.drillCostReduction);
    if (state.energy < cost) {
      returnToSurface("Reserve power low. Surface winch engaged.");
      return false;
    }

    if (cell.ore && cargoLoad() + DATA.oreTypes[cell.ore].weight > stats.cargoCapacity) {
      setMessage(`${DATA.oreTypes[cell.ore].label} blocked by full cargo.`);
      return false;
    }

    state.energy = Math.max(0, state.energy - cost);
    const heatDamage = addHeat((terrain.heat || 0) + pressure + stats.charterDrillHeat);
    const hullRisk = Math.max(0, terrain.hullRisk + pressure - stats.hullRiskReduction);
    if (hullRisk && hash(x, y, 83) < hullRisk * 0.045) {
      state.hull = Math.max(0, state.hull - hullRisk * 4);
    }

    if (cell.ore) {
      collectOre(cell.ore);
    } else {
      setMessage(`${terrain.label} cut.`);
    }

    cell.kind = "tunnel";
    cell.terrain = null;
    cell.ore = null;
    if (heatDamage && !cell.hazard) {
      setMessage(`${terrain.label} cut hot. ${heatDamage} hull lost to overheat.`);
    }
    applyHazardPressure(cell, "drill");
    if (state.energy <= 0 || state.hull <= 0) {
      returnToSurface(state.hull <= 0 ? "Emergency casing recall fired." : "Reserve power low. Surface winch engaged.");
      return false;
    }
    return true;
  }

  function tryMove(dx, dy) {
    state.player.facing = [dx, dy];
    if (state.player.y === 0 && state.docked) {
      if (dy <= 0 || !launchRun()) {
        return;
      }
    }

    const targetX = state.player.x + dx;
    const targetY = state.player.y + dy;
    const cell = cellAt(targetX, targetY);
    if (!cell) {
      setMessage("Boundary strut holds.");
      return;
    }

    let drilled = false;
    if (cell.kind === "solid") {
      if (!drillBlock(targetX, targetY, cell)) {
        updateHud();
        render();
        return;
      }
      drilled = true;
    }

    if (targetY > 0 && cell.kind !== "solid") {
      const pressureCost = pressureTier(targetY) * 0.08;
      const stats = rigStats();
      let moveCost = dy < 0 ? (stats.moveEnergy + pressureCost) * 0.45 : stats.moveEnergy + pressureCost;
      if (dy < 0 && stats.returnEnergyPenalty) {
        moveCost *= 1 + stats.returnEnergyPenalty;
      }
      if (dy < 0 && nearRouteBeacon(targetX, targetY)) {
        moveCost *= Math.max(0.4, 1 - stats.beaconReturnEfficiency);
      }
      state.energy = Math.max(0, state.energy - moveCost);
      coolRig(dy < 0 ? 1.2 : 0.8);
      if (!drilled) {
        applyHazardPressure(cell, "transit");
      }
    }

    state.player.x = targetX;
    state.player.y = targetY;
    updateContractProgress();
    updateCharterProgress();
    updateRouteProgress();

    if (state.player.y === 0) {
      surfaceService("Surface lock reached. Settle cargo, repair, or relaunch.");
      return;
    }
    if (state.energy <= 0 || state.hull <= 0) {
      returnToSurface(state.hull <= 0 ? "Emergency casing recall fired." : "Reserve power low. Surface winch engaged.");
      return;
    }

    updateHud();
    render();
  }

  function oreCounts() {
    return state.cargo.reduce((counts, oreKey) => {
      counts[oreKey] = (counts[oreKey] || 0) + 1;
      return counts;
    }, {});
  }

  function updateActionButtons() {
    const stats = rigStats();
    const atSurface = state.player.y === 0 && state.docked;
    hud.actions.sell.disabled = !atSurface || state.cargo.length === 0;
    hud.actions.refine.disabled = !atSurface || state.cargo.length === 0;
    hud.actions.repair.disabled = !atSurface || state.hull >= stats.maxHull || state.resources.credits <= 0;
    hud.actions.launch.disabled = !atSurface || state.cargo.length > 0 || state.hull <= 0;
  }

  function renderUpgradeList() {
    if (!hud.upgrades) {
      return;
    }

    const atSurface = state.player.y === 0 && state.docked;
    hud.upgrades.replaceChildren();
    for (const upgrade of DATA.upgrades) {
      const owned = !!state.installedUpgrades[upgrade.id];
      const item = document.createElement("li");
      item.className = owned ? "upgrade-row installed" : "upgrade-row";

      const copy = document.createElement("div");
      const category = document.createElement("span");
      const label = document.createElement("strong");
      const summary = document.createElement("small");
      category.textContent = DATA.upgradeCategories[upgrade.category] || upgrade.category;
      label.textContent = upgrade.label;
      summary.textContent = `${upgrade.summary} | ${formatAmounts(upgrade.cost)}`;
      copy.append(category, label, summary);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = owned ? "installed" : "install";
      button.disabled = owned || !atSurface || !canAfford(upgrade.cost);
      button.addEventListener("click", () => purchaseUpgrade(upgrade.id));

      item.append(copy, button);
      hud.upgrades.append(item);
    }
  }

  function renderResearchList() {
    if (!hud.researchList) {
      return;
    }

    const atSurface = state.player.y === 0 && state.docked;
    hud.researchList.replaceChildren();
    for (const project of DATA.researchProjects) {
      const owned = !!state.installedResearch[project.id];
      const item = document.createElement("li");
      item.className = owned ? "upgrade-row research-row installed" : "upgrade-row research-row";

      const copy = document.createElement("div");
      const category = document.createElement("span");
      const label = document.createElement("strong");
      const summary = document.createElement("small");
      category.textContent = "Research";
      label.textContent = project.label;
      summary.textContent = `${project.summary} | ${formatAmounts(project.cost)}`;
      copy.append(category, label, summary);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = owned ? "filed" : "study";
      button.disabled = owned || !atSurface || !canAfford(project.cost);
      button.addEventListener("click", () => purchaseResearch(project.id));

      item.append(copy, button);
      hud.researchList.append(item);
    }
  }

  function renderContractPanel() {
    if (!hud.contracts || !hud.contractStatus || !hud.contractProgress) {
      return;
    }

    const contract = activeContract();
    const atSurface = state.player.y === 0 && state.docked;
    if (contract) {
      hud.contractStatus.textContent = contractProgressValue(contract) >= contract.target ? "complete" : "active";
      hud.contractProgress.textContent = `${contract.label}: ${contractProgressLabel(contract)}.`;
    } else {
      const completedCount = Object.keys(state.completedContracts).length;
      hud.contractStatus.textContent = completedCount ? `${completedCount} filed` : "unassigned";
      hud.contractProgress.textContent = completedCount
        ? "Filed commissions have paid into the archive and stores."
        : "Select a commission before launch.";
    }

    hud.contracts.replaceChildren();
    for (const entry of DATA.contracts || []) {
      const completed = !!state.completedContracts[entry.id];
      const active = state.activeContractId === entry.id;
      const item = document.createElement("li");
      item.className = `contract-row${active ? " active" : ""}${completed ? " complete" : ""}`;

      const copy = document.createElement("div");
      const status = document.createElement("span");
      const label = document.createElement("strong");
      const summary = document.createElement("small");
      status.textContent = completed ? "Filed" : active ? contractProgressLabel(entry) : `Reward ${formatContractReward(entry.reward)}`;
      label.textContent = entry.label;
      summary.textContent = entry.summary;
      copy.append(status, label, summary);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = completed ? "filed" : active ? "active" : "take";
      button.disabled = completed || active || !atSurface || !!state.activeContractId;
      button.addEventListener("click", () => acceptContract(entry.id));

      item.append(copy, button);
      hud.contracts.append(item);
    }
  }

  function renderCharterPanel() {
    if (!hud.charters || !hud.charterStatus || !hud.charterProgress) {
      return;
    }

    const charter = visibleCharter();
    const inField = state.player.y > 0 && !state.docked;
    const atSurface = state.player.y === 0 && state.docked;
    if (charter) {
      const complete = !!state.completedCharters[charter.id];
      hud.charterStatus.textContent = complete ? "filed" : inField ? "underway" : "armed";
      hud.charterProgress.textContent = `${charter.label}: ${charterProgressLabel(charter)}. ${charter.constraint.label}: ${charter.constraint.summary}`;
    } else {
      const completedCount = Object.keys(state.completedCharters).length;
      hud.charterStatus.textContent = completedCount ? `${completedCount} filed` : "open";
      hud.charterProgress.textContent = completedCount
        ? "Filed charters now feed archive and Survey relay support."
        : "Choose an expedition charter before launch.";
    }

    hud.charters.replaceChildren();
    for (const entry of DATA.deepCharters || []) {
      const completed = !!state.completedCharters[entry.id];
      const active = state.activeCharterId === entry.id || state.runCharterId === entry.id;
      const item = document.createElement("li");
      item.className = `charter-row${active ? " active" : ""}${completed ? " complete" : ""}`;

      const copy = document.createElement("div");
      const status = document.createElement("span");
      const label = document.createElement("strong");
      const summary = document.createElement("small");
      status.textContent = completed ? "Filed" : active ? charterProgressLabel(entry) : `Reward ${formatCharterReward(entry.reward)}`;
      label.textContent = entry.label;
      summary.textContent = `${entry.objective.label} Pressure: ${entry.constraint.summary} Reward: ${entry.reward.summary}`;
      copy.append(status, label, summary);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = completed ? "filed" : active ? "active" : "charter";
      button.disabled = completed || active || !atSurface || !!state.activeCharterId;
      button.addEventListener("click", () => acceptCharter(entry.id));

      item.append(copy, button);
      hud.charters.append(item);
    }
  }

  function renderRoutePanel() {
    if (!hud.routes || !hud.routeStatus || !hud.routeProgress) {
      return;
    }

    const route = visibleRoute();
    const inField = state.player.y > 0 && !state.docked;
    const atSurface = state.player.y === 0 && state.docked;
    if (route) {
      hud.routeStatus.textContent = inField ? "underway" : "selected";
      hud.routeProgress.textContent = `${route.label}: ${routeProgressLabel(route)}. ${route.summary}`;
    } else {
      hud.routeStatus.textContent = "open";
      hud.routeProgress.textContent = "Choose a late-run line before launch.";
    }

    hud.routes.replaceChildren();
    for (const entry of DATA.routePlans || []) {
      const unlocked = routePlanUnlocked(entry);
      const active = state.activeRouteId === entry.id || state.runRouteId === entry.id;
      const completions = state.routeCompletions[entry.id] || 0;
      const item = document.createElement("li");
      item.className = `route-row${active ? " active" : ""}${completions ? " complete" : ""}`;

      const copy = document.createElement("div");
      const status = document.createElement("span");
      const label = document.createElement("strong");
      const summary = document.createElement("small");
      status.textContent = !unlocked
        ? routeRequirementLabel(entry)
        : active
          ? routeProgressLabel(entry)
          : completions
            ? `${completions} logged`
            : `Reward ${formatContractReward(entry.reward)}`;
      label.textContent = entry.label;
      summary.textContent = `${entry.objective.label} ${entry.summary}`;
      copy.append(status, label, summary);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = !unlocked ? "locked" : active ? "active" : "route";
      button.disabled = !unlocked || active || !atSurface;
      button.addEventListener("click", () => selectRoutePlan(entry.id));

      item.append(copy, button);
      hud.routes.append(item);
    }
  }

  function renderArchivePanel() {
    if (!hud.archiveList || !hud.archiveStatus) {
      return;
    }

    let filed = 0;
    let required = 0;
    let unlocked = 0;
    hud.archiveList.replaceChildren();
    for (const archiveSet of DATA.archiveSets || []) {
      const progress = archiveProgressFor(archiveSet);
      const complete = progress >= archiveSet.fragmentsRequired;
      filed += progress;
      required += archiveSet.fragmentsRequired;
      unlocked += complete ? 1 : 0;

      const item = document.createElement("li");
      item.className = complete ? "archive-row unlocked" : "archive-row";

      const copy = document.createElement("div");
      const status = document.createElement("span");
      const label = document.createElement("strong");
      const summary = document.createElement("small");
      status.textContent = complete ? `Unlocked: ${archiveSet.unlock.label}` : `${progress} / ${archiveSet.fragmentsRequired} fragments`;
      label.textContent = archiveSet.label;
      summary.textContent = complete ? archiveSet.unlock.summary : archiveSet.summary;
      copy.append(status, label, summary);

      const track = document.createElement("span");
      track.className = "archive-track";
      const fill = document.createElement("span");
      fill.className = "archive-fill";
      fill.style.setProperty("--archive-progress", `${Math.round((progress / archiveSet.fragmentsRequired) * 100)}%`);
      track.append(fill);

      item.append(copy, track);
      hud.archiveList.append(item);
    }

    hud.archiveStatus.textContent = `${filed} / ${required} (${unlocked} open)`;
  }

  function renderFacilityPanel() {
    if (!hud.utilities || !hud.facilityStatus || !hud.facilityProgress) {
      return;
    }

    const track = primaryReputationTrack();
    const rank = reputationRankFor(track);
    const contractsFiled = completedContractCount();
    const chartersFiled = completedCharterCount();
    const archiveFiled = completedArchiveSetCount();
    const inField = state.player.y > 0 && !state.docked;

    hud.facilityStatus.textContent = rank ? rank.label : "offline";
    hud.facilityProgress.textContent = rank
      ? `${track.label}: ${contractsFiled} contracts / ${chartersFiled} charters / ${archiveFiled} archive sets. ${rank.summary}`
      : "Relay records are unavailable.";
    hud.utilities.replaceChildren();

    for (const utility of DATA.utilities || []) {
      const unlocked = utilityUnlocked(utility);
      const charges = utilityChargesRemaining(utility);
      const ready = unlocked && inField && (charges === null || charges > 0);
      const item = document.createElement("li");
      item.className = ready ? "utility-row ready" : "utility-row";

      const copy = document.createElement("div");
      const status = document.createElement("span");
      const label = document.createElement("strong");
      const summary = document.createElement("small");
      status.textContent = !unlocked
        ? "Locked"
        : charges === null
          ? utility.kind
          : `${charges} charge${charges === 1 ? "" : "s"}`;
      label.textContent = utility.label;
      summary.textContent = utility.summary;
      copy.append(status, label, summary);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = unlocked ? utility.actionLabel : "locked";
      button.disabled = !ready || (utility.energyCost && state.energy < utility.energyCost);
      button.addEventListener("click", () => useUtility(utility.id));

      item.append(copy, button);
      hud.utilities.append(item);
    }
  }

  function updateHud() {
    const stats = rigStats();
    const depth = state.player.y * DATA.world.metersPerTile;
    const load = cargoLoad();
    hud.depth.textContent = `${depth} m`;
    hud.cargo.textContent = `${load} / ${stats.cargoCapacity}`;
    hud.hull.textContent = `${Math.round(state.hull)} / ${stats.maxHull}`;
    hud.energy.textContent = `${Math.round(state.energy)} / ${stats.maxEnergy}`;
    hud.heat.textContent = `${Math.round(state.heat)} / ${stats.maxHeat}`;
    hud.pressure.textContent = pressureLabel(state.player.y);
    hud.banked.textContent = `credits ${state.resources.credits}`;
    hud.alloy.textContent = `alloy ${state.resources.alloy}`;
    hud.research.textContent = `research ${state.resources.research}`;
    hud.relic.textContent = `relic ${state.resources.relic}`;
    const route = runRoute();
    const routeLabel = route ? ` / ${route.label}` : "";
    hud.state.textContent = state.docked ? "surface dock" : `run ${state.runNumber} / ${bandForDepth(state.player.y).name}${routeLabel}`;

    const counts = oreCounts();
    hud.ores.replaceChildren();
    const oreKeys = Object.keys(counts);
    if (!oreKeys.length) {
      const empty = document.createElement("li");
      empty.innerHTML = "<span>hold clear</span><strong>0</strong>";
      hud.ores.append(empty);
    } else {
      for (const oreKey of oreKeys) {
        const ore = DATA.oreTypes[oreKey];
        const item = document.createElement("li");
        const label = document.createElement("span");
        const amount = document.createElement("strong");
        label.textContent = ore.label;
        amount.textContent = `x${counts[oreKey]}`;
        item.append(label, amount);
        hud.ores.append(item);
      }
    }

    updateActionButtons();
    renderContractPanel();
    renderCharterPanel();
    renderRoutePanel();
    renderArchivePanel();
    renderFacilityPanel();
    renderUpgradeList();
    renderResearchList();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(320, Math.floor(rect.width * scale));
    canvas.height = Math.max(260, Math.floor(rect.height * scale));
    render();
  }

  function drawHazardMark(cell, screenX, screenY, size) {
    if (!cell.hazard) {
      return;
    }

    const hazard = DATA.hazardTypes[cell.hazard];
    ctx.fillStyle = hazard.color;
    ctx.fillRect(screenX + size * 0.14, screenY + size * 0.78, size * 0.72, Math.max(2, size * 0.07));
    ctx.strokeStyle = "rgba(5, 7, 8, 0.72)";
    ctx.strokeRect(screenX + size * 0.14, screenY + size * 0.78, size * 0.72, Math.max(2, size * 0.07));
  }

  function drawCell(cell, screenX, screenY, size, worldX, worldY) {
    if (cell.kind === "surface") {
      ctx.fillStyle = "#11191b";
      ctx.fillRect(screenX, screenY, size, size);
      ctx.strokeStyle = "rgba(71, 224, 195, 0.4)";
      ctx.strokeRect(screenX + 1, screenY + 1, size - 2, size - 2);
      return;
    }

    if (cell.kind === "tunnel") {
      ctx.fillStyle = worldY % 2 === 0 ? "#080b0c" : "#090d0e";
      ctx.fillRect(screenX, screenY, size, size);
      ctx.strokeStyle = "rgba(82, 96, 94, 0.16)";
      ctx.strokeRect(screenX + 0.5, screenY + 0.5, size - 1, size - 1);
      drawHazardMark(cell, screenX, screenY, size);
      return;
    }

    const terrain = DATA.terrainTypes[cell.terrain];
    ctx.fillStyle = terrain.color;
    ctx.fillRect(screenX, screenY, size, size);
    ctx.strokeStyle = terrain.edge;
    ctx.strokeRect(screenX + 1, screenY + 1, size - 2, size - 2);

    const grain = hash(worldX, worldY, 101);
    ctx.fillStyle = `rgba(231, 240, 236, ${0.04 + grain * 0.07})`;
    ctx.fillRect(screenX + size * 0.18, screenY + size * 0.2, size * 0.2, size * 0.08);

    if (!cell.ore) {
      drawHazardMark(cell, screenX, screenY, size);
      return;
    }

    const ore = DATA.oreTypes[cell.ore];
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;
    const r = size * 0.2;
    ctx.fillStyle = ore.color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(5, 7, 8, 0.7)";
    ctx.stroke();
    drawHazardMark(cell, screenX, screenY, size);
  }

  function drawRig(screenX, screenY, size) {
    const inset = size * 0.16;
    ctx.fillStyle = "#47e0c3";
    ctx.fillRect(screenX + inset, screenY + inset, size - inset * 2, size - inset * 2);
    ctx.fillStyle = "#071011";
    ctx.fillRect(screenX + size * 0.35, screenY + size * 0.3, size * 0.3, size * 0.22);

    const facing = state.player.facing;
    ctx.fillStyle = "#d5a649";
    if (facing[1] > 0) {
      ctx.fillRect(screenX + size * 0.4, screenY + size * 0.72, size * 0.2, size * 0.22);
    } else if (facing[1] < 0) {
      ctx.fillRect(screenX + size * 0.4, screenY + size * 0.06, size * 0.2, size * 0.22);
    } else if (facing[0] > 0) {
      ctx.fillRect(screenX + size * 0.72, screenY + size * 0.4, size * 0.22, size * 0.2);
    } else {
      ctx.fillRect(screenX + size * 0.06, screenY + size * 0.4, size * 0.22, size * 0.2);
    }
  }

  function drawBeaconMark(screenX, screenY, size) {
    const inset = size * 0.28;
    ctx.strokeStyle = "#d5a649";
    ctx.lineWidth = Math.max(1, Math.floor(size * 0.06));
    ctx.strokeRect(screenX + inset, screenY + inset, size - inset * 2, size - inset * 2);
    ctx.fillStyle = "rgba(213, 166, 73, 0.28)";
    ctx.fillRect(screenX + size * 0.42, screenY + size * 0.18, size * 0.16, size * 0.64);
    ctx.fillRect(screenX + size * 0.18, screenY + size * 0.42, size * 0.64, size * 0.16);
  }

  function render() {
    if (!ctx || !state.grid.length) {
      return;
    }

    const cols = canvas.width < 680 ? 15 : 21;
    const rows = canvas.height < 520 ? 13 : 17;
    const size = Math.floor(Math.min(canvas.width / cols, canvas.height / rows));
    const originX = Math.floor((canvas.width - cols * size) / 2);
    const originY = Math.floor((canvas.height - rows * size) / 2);
    const startX = Math.max(0, Math.min(DATA.world.width - cols, state.player.x - Math.floor(cols / 2)));
    const startY = Math.max(0, Math.min(DATA.world.depth - rows + 1, state.player.y - Math.floor(rows / 3)));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050708";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const worldX = startX + col;
        const worldY = startY + row;
        const cell = cellAt(worldX, worldY);
        if (!cell) {
          continue;
        }
        drawCell(cell, originX + col * size, originY + row * size, size, worldX, worldY);
        if (state.beacons.some((beacon) => beacon.x === worldX && beacon.y === worldY)) {
          drawBeaconMark(originX + col * size, originY + row * size, size);
        }
      }
    }

    const rigX = state.player.x - startX;
    const rigY = state.player.y - startY;
    drawRig(originX + rigX * size, originY + rigY * size, size);

    ctx.strokeStyle = "rgba(71, 224, 195, 0.22)";
    ctx.lineWidth = Math.max(1, Math.floor(size * 0.05));
    ctx.strokeRect(originX, originY, cols * size, rows * size);
  }

  document.addEventListener("keydown", (event) => {
    const dir = dirs[event.key];
    if (!dir) {
      return;
    }
    event.preventDefault();
    tryMove(dir[0], dir[1]);
  });

  document.querySelectorAll("[data-dir]").forEach((button) => {
    button.addEventListener("click", () => {
      const dir = button.dataset.dir.split(",").map(Number);
      tryMove(dir[0], dir[1]);
    });
  });

  hud.actions.sell.addEventListener("click", sellCargo);
  hud.actions.refine.addEventListener("click", refineCargo);
  hud.actions.repair.addEventListener("click", repairRig);
  hud.actions.launch.addEventListener("click", () => {
    if (launchRun()) {
      tryMove(0, 1);
    }
  });

  window.addEventListener("resize", resizeCanvas);
  generateWorld();
  updateHud();
  resizeCanvas();
})();

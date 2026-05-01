"use strict";

const IronLanternDescent = (() => {
  const RENDERER_PATH = "vendor/three.min.js";
  const ASSET_PATHS = {
    sourceManifest: "assets/asset-manifest.json",
    lanternAnchor: "assets/lantern-anchor.png",
    mineralVeinMaterial: "assets/mineral-vein-material.png",
    drillTool: "assets/drill-tool.png",
    oxygenLightIcons: "assets/oxygen-light-icons.png",
    arcadeTitleCard: "assets/arcade-title-card.png",
  };
  const DEFAULT_SEED = 37193;
  const TWO_PI = Math.PI * 2;

  const GAME_DATA = {
    assets: ASSET_PATHS,
    renderer: {
      name: "Three.js",
      path: RENDERER_PATH,
      localOnly: true,
    },
    controls: {
      forward: ["KeyW", "ArrowUp"],
      back: ["KeyS", "ArrowDown"],
      strafeLeft: ["KeyQ"],
      strafeRight: ["KeyE"],
      turnLeft: ["KeyA", "ArrowLeft"],
      turnRight: ["KeyD", "ArrowRight"],
      placeLantern: ["KeyL", "Space"],
      mine: ["KeyM"],
      scan: ["KeyC"],
      interact: ["KeyF", "Enter"],
      plantStake: ["KeyV"],
      braceSeam: ["KeyB"],
      chartSurvey: ["KeyX"],
      airCache: ["KeyN"],
      primePump: ["KeyP"],
      turnValve: ["KeyO"],
      deploySiphon: ["KeyY"],
      sealLeak: ["KeyH"],
      upgrade: ["KeyU"],
      reset: ["KeyR"],
    },
    cave: {
      floorY: 0,
      playerY: 1.6,
      wallHeight: 4.8,
      passages: [
        { id: "lift-bay", name: "Lift Bay", center: { x: 0, z: 8 }, size: { x: 15, z: 16 } },
        { id: "main-cut", name: "Main Cut", center: { x: 0, z: -30 }, size: { x: 8, z: 72 } },
        { id: "east-shelf", name: "East Shelf", center: { x: 15, z: -30 }, size: { x: 30, z: 11 } },
        { id: "west-pocket", name: "West Pocket", center: { x: -14, z: -45 }, size: { x: 28, z: 12 } },
        { id: "fault-gallery", name: "Fault Gallery", center: { x: -18, z: -61 }, size: { x: 16, z: 22 } },
        { id: "deep-room", name: "Deep Room", center: { x: 0, z: -70 }, size: { x: 24, z: 20 } },
        { id: "lower-pumpworks", name: "Lower Pumpworks", center: { x: 11, z: -74 }, size: { x: 18, z: 24 } },
        { id: "sump-bypass", name: "Sump Bypass", center: { x: -5, z: -88 }, size: { x: 18, z: 24 } },
      ],
    },
    player: {
      startPosition: { x: 0, y: 1.6, z: 8 },
      startFacing: 0,
      radius: 0.72,
      walkSpeed: 7.4,
      strafeSpeed: 5.8,
      turnRate: 1.9,
    },
    camera: {
      mode: "close-third",
      distance: 8.5,
      height: 4.6,
      lookAhead: 5.5,
      smoothing: 1,
    },
    oxygen: {
      baseMax: 96,
      baseDrainPerSecond: 1.08,
      unmarkedDrainPerSecond: 0.28,
      routeLostDrainPerSecond: 0.72,
      liftDrainMultiplier: 0.2,
      lanternDrainMultiplier: 0.46,
    },
    light: {
      headlampRadius: 14,
      lanternBoost: 6,
      hazardPenalty: 4,
    },
    lanterns: {
      baseCharges: 3,
      radius: 10.5,
      safetyRadius: 8.5,
    },
    route: {
      linkedLegDistance: 22,
      warningDistance: 17,
      lostDistance: 25,
    },
    mining: {
      range: 3.7,
      drillPower: 1,
      cargoCapacity: 4,
    },
    scanner: {
      range: 31,
      cooldownSeconds: 2.4,
    },
    survey: {
      release: {
        version: "0.1.0",
        label: "v0.1.0 Faultline Survey",
        baseRelease: "v0.0.1 Lantern Route",
      },
      actionRange: 4.6,
      stakes: {
        baseCharges: 2,
        safetyRadius: 9.5,
      },
      braces: {
        baseCharges: 1,
      },
      contract: {
        id: "faultline-route-plate",
        label: "Faultline route plate",
        targetMapProgress: 3,
        targetSites: 2,
      },
      routeStability: {
        base: 100,
        routeWeakPenalty: 10,
        hazardPenalty: 5,
        lowStabilityDrainPerSecond: 0.34,
        collapseDrainPerSecond: 0.54,
      },
    },
    pumpworks: {
      release: {
        version: "0.2.0",
        label: "v0.2.0 Deep Pumpworks",
        baseRelease: "v0.1.0 Faultline Survey",
      },
      actionRange: 5.2,
      siphons: {
        baseCharges: 1,
      },
      contract: {
        id: "deep-pumpworks-drainage-route",
        label: "Deep Pumpworks drainage route",
        targetDrainedSites: 2,
        targetMapProgress: 3,
        targetPressureRelief: 50,
      },
      routeStability: {
        lowStabilityDrainPerSecond: 0.28,
        floodExposureDrainPerSecond: 0.42,
      },
    },
    lift: {
      id: "descent-lift",
      name: "Iron Lift",
      position: { x: 0, y: 0, z: 11 },
      radius: 4.2,
    },
    hazards: [
      {
        id: "gas-vent-east",
        name: "Gas Vent",
        position: { x: 12, y: 0, z: -31 },
        radius: 6.4,
        oxygenDrainPerSecond: 1.35,
        visibilityPenalty: 2.4,
      },
      {
        id: "blackout-crack",
        name: "Blackout Crack",
        position: { x: -9, y: 0, z: -47 },
        radius: 5.8,
        oxygenDrainPerSecond: 0.78,
        visibilityPenalty: 4.2,
      },
    ],
    sampleNodes: [
      {
        id: "sample-copper-iris",
        name: "Copper Iris",
        position: { x: 2.4, y: 0.7, z: -18 },
        radius: 2.4,
        value: 32,
        difficulty: 1.4,
        remaining: 1,
      },
      {
        id: "sample-iron-bloom",
        name: "Iron Bloom",
        position: { x: 17, y: 0.7, z: -31 },
        radius: 2.8,
        value: 44,
        difficulty: 1.8,
        remaining: 1,
      },
      {
        id: "sample-glass-vein",
        name: "Glass Vein",
        position: { x: -17, y: 0.7, z: -45 },
        radius: 2.6,
        value: 52,
        difficulty: 2.1,
        remaining: 1,
      },
      {
        id: "sample-deep-lode",
        name: "Deep Lode",
        position: { x: 6, y: 0.7, z: -72 },
        radius: 3.2,
        value: 70,
        difficulty: 2.5,
        remaining: 2,
      },
      {
        id: "sample-sump-pearl",
        name: "Sump Pearl",
        position: { x: -4, y: 0.7, z: -91 },
        radius: 2.7,
        value: 64,
        difficulty: 2.3,
        remaining: 1,
      },
    ],
    surveySites: [
      {
        id: "survey-cinder-rib",
        name: "Cinder Rib Fault",
        passageId: "east-shelf",
        chamber: "gas shelf survey spur",
        faultType: "slip seam",
        position: { x: 17, y: 0.35, z: -31 },
        radius: 3.4,
        influenceRadius: 10.5,
        tremorWindow: {
          opensAt: 0,
          closesAt: 72,
          collapseAt: 118,
          tremorPressure: 9,
          collapsePressure: 18,
        },
        requirements: {
          stake: true,
          brace: false,
          lanternAnchor: false,
        },
        oxygenModifier: {
          activeDrainPerSecond: 0.12,
          tremorDrainPerSecond: 0.34,
          cacheRestore: 0,
        },
        routeConfidenceModifier: {
          stakeBonus: 6,
          braceBonus: 0,
          tremorPenalty: 8,
          failurePenalty: 12,
        },
        routeStability: {
          basePressure: 8,
          stakeRelief: 6,
          braceRelief: 0,
        },
        rewards: {
          payout: 46,
          partialPayout: 18,
          mapProgress: 1,
          partialMapProgress: 0.5,
          sampleValueBonus: 8,
        },
      },
      {
        id: "survey-basalt-suture",
        name: "Basalt Suture",
        passageId: "fault-gallery",
        chamber: "fault gallery",
        faultType: "compressive seam",
        position: { x: -18, y: 0.35, z: -62 },
        radius: 3.8,
        influenceRadius: 12,
        tremorWindow: {
          opensAt: 18,
          closesAt: 88,
          collapseAt: 132,
          tremorPressure: 12,
          collapsePressure: 26,
        },
        requirements: {
          stake: true,
          brace: true,
          lanternAnchor: true,
        },
        oxygenModifier: {
          activeDrainPerSecond: 0.16,
          tremorDrainPerSecond: 0.46,
          cacheRestore: 18,
        },
        routeConfidenceModifier: {
          stakeBonus: 7,
          braceBonus: 9,
          tremorPenalty: 11,
          failurePenalty: 18,
        },
        routeStability: {
          basePressure: 12,
          stakeRelief: 7,
          braceRelief: 14,
        },
        rewards: {
          payout: 78,
          partialPayout: 28,
          mapProgress: 2,
          partialMapProgress: 1,
          sampleValueBonus: 12,
        },
        airCache: {
          id: "air-cache-basalt-suture",
          oxygenRestore: 18,
        },
      },
    ],
    pumpworksSites: [
      {
        id: "pump-cinder-sump",
        name: "Cinder Sump Pump",
        pumpId: "pump-cinder-sump",
        valveId: "valve-cinder-return",
        kind: "pump-station",
        passageId: "lower-pumpworks",
        chamber: "cinder sump pump room",
        associatedPassages: ["east-shelf", "deep-room", "lower-pumpworks"],
        position: { x: 10, y: 0.35, z: -72 },
        radius: 3.6,
        influenceRadius: 13,
        guideRadius: 9.5,
        flood: {
          baseLevel: 0.58,
          partialLevel: 0.34,
          drainedLevel: 0.14,
          surgeLevel: 0.86,
        },
        pressureWindow: {
          opensAt: 12,
          closesAt: 96,
          surgeAt: 132,
          failAt: 168,
          basePressure: 10,
          surgePressure: 18,
          floodPressure: 30,
        },
        requirements: {
          surveySiteId: "survey-cinder-rib",
          stake: true,
          brace: false,
          chart: "partial",
          lanternAnchor: false,
          siphon: false,
        },
        leak: {
          id: "leak-cinder-return",
          requiresStake: true,
          requiresBrace: false,
          pressureRelief: 8,
        },
        oxygenCost: {
          prime: 3,
          valve: 4,
          siphon: 2,
          seal: 2,
          failure: 12,
        },
        route: {
          primeBonus: 3,
          leakRelief: 4,
          drainBonus: 20,
          failurePenalty: 12,
        },
        rewards: {
          payout: 64,
          partialPayout: 24,
          mapProgress: 1,
          partialMapProgress: 0.5,
          sampleValueBonus: 10,
          pressureRelief: 20,
        },
        consequences: {
          sampleValuePenalty: 8,
        },
      },
      {
        id: "pump-basalt-gate",
        name: "Basalt Gate Valve",
        pumpId: "pump-basalt-gate",
        valveId: "valve-basalt-siphon",
        kind: "pressure-valve",
        passageId: "sump-bypass",
        chamber: "basalt siphon gallery",
        associatedPassages: ["fault-gallery", "deep-room", "sump-bypass"],
        position: { x: -4, y: 0.35, z: -88 },
        radius: 4.1,
        influenceRadius: 15,
        guideRadius: 10.5,
        flood: {
          baseLevel: 0.72,
          partialLevel: 0.42,
          drainedLevel: 0.16,
          surgeLevel: 0.94,
        },
        pressureWindow: {
          opensAt: 35,
          closesAt: 118,
          surgeAt: 154,
          failAt: 190,
          basePressure: 14,
          surgePressure: 24,
          floodPressure: 38,
        },
        requirements: {
          surveySiteId: "survey-basalt-suture",
          stake: true,
          brace: true,
          chart: "success",
          lanternAnchor: true,
          siphon: true,
        },
        leak: {
          id: "leak-basalt-gate",
          requiresStake: true,
          requiresBrace: true,
          pressureRelief: 12,
        },
        oxygenCost: {
          prime: 4,
          valve: 6,
          siphon: 3,
          seal: 3,
          failure: 15,
        },
        route: {
          primeBonus: 4,
          leakRelief: 6,
          drainBonus: 22,
          failurePenalty: 16,
        },
        rewards: {
          payout: 96,
          partialPayout: 38,
          mapProgress: 2,
          partialMapProgress: 1,
          sampleValueBonus: 16,
          pressureRelief: 32,
        },
        consequences: {
          sampleValuePenalty: 12,
        },
      },
    ],
    upgrades: [
      {
        id: "tank-weave",
        name: "Tank Weave",
        cost: 60,
        summary: "+24 oxygen on future runs",
        effect: { oxygenMaxBonus: 24 },
      },
      {
        id: "lantern-frame",
        name: "Lantern Frame",
        cost: 82,
        summary: "+1 lantern charge on future runs",
        effect: { lanternChargeBonus: 1 },
      },
      {
        id: "focused-bit",
        name: "Focused Bit",
        cost: 95,
        summary: "faster sample extraction",
        effect: { drillPowerBonus: 0.42 },
      },
      {
        id: "siphon-cartridge",
        name: "Siphon Cartridge",
        cost: 118,
        summary: "+1 siphon charge on future runs",
        effect: { siphonChargeBonus: 1 },
      },
    ],
  };

  const dom = {};
  const pressedControls = {};
  let currentState = null;
  let sceneHandle = null;
  let lastFrameTime = 0;
  let mouseDrag = false;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function vector(x = 0, y = 0, z = 0) {
    return { x, y, z };
  }

  function seededRandom(seed) {
    let value = Math.floor(Math.abs(seed)) % 2147483647;
    if (value === 0) {
      value = 1;
    }
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function distance(a, b) {
    const dx = (a.x || 0) - (b.x || 0);
    const dy = (a.y || 0) - (b.y || 0);
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function normalizeAngle(angle) {
    let normalized = angle % TWO_PI;
    if (normalized < -Math.PI) {
      normalized += TWO_PI;
    }
    if (normalized > Math.PI) {
      normalized -= TWO_PI;
    }
    return normalized;
  }

  function directionFromFacing(facing) {
    return {
      x: Math.sin(facing),
      y: 0,
      z: -Math.cos(facing),
    };
  }

  function rightFromFacing(facing) {
    return {
      x: Math.cos(facing),
      y: 0,
      z: Math.sin(facing),
    };
  }

  function bearingTo(source, target, facing = 0) {
    const dx = target.x - source.x;
    const dz = target.z - source.z;
    const worldAngle = Math.atan2(dx, -dz);
    const relative = normalizeAngle(worldAngle - facing);
    return Math.round(((relative + Math.PI) / TWO_PI) * 360) % 360;
  }

  function formatBearing(bearing) {
    return `bearing ${String(Math.round(bearing)).padStart(3, "0")}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function cavePassageAt(position, radius = 0) {
    return GAME_DATA.cave.passages.find((passage) => {
      const halfX = passage.size.x / 2 - radius;
      const halfZ = passage.size.z / 2 - radius;
      return Math.abs(position.x - passage.center.x) <= halfX && Math.abs(position.z - passage.center.z) <= halfZ;
    });
  }

  function isPointInPassage(position, radius = 0) {
    return Boolean(cavePassageAt(position, radius));
  }

  function surveySiteWindowState(site, elapsed = 0) {
    const window = site.tremorWindow || {};
    if (elapsed < window.opensAt) {
      return "pending";
    }
    if (elapsed <= window.closesAt) {
      return "stable";
    }
    if (elapsed <= window.collapseAt) {
      return "tremor";
    }
    return "collapsed";
  }

  function surveyOutcomeComplete(site) {
    return ["success", "partial", "failed"].includes(site.chartState);
  }

  function pumpworksWindowState(site, elapsed = 0) {
    const window = site.pressureWindow || {};
    if (elapsed < window.opensAt) {
      return "pending";
    }
    if (elapsed <= window.closesAt) {
      return "drain";
    }
    if (elapsed <= window.surgeAt) {
      return "surge";
    }
    if (elapsed <= window.failAt) {
      return "flood";
    }
    return "overrun";
  }

  function pumpworksOutcomeComplete(site) {
    return ["success", "partial", "failed"].includes(site.drainageState);
  }

  function computeSurveyRouteModifier(state) {
    if (!state.surveySites) {
      return 0;
    }
    const modifier = state.surveySites.reduce((total, site) => {
      const route = site.routeConfidenceModifier || {};
      const windowState = surveySiteWindowState(site, state.elapsed || 0);
      let siteModifier = 0;
      if (site.stakePlanted) {
        siteModifier += route.stakeBonus || 0;
      }
      if (site.braceInstalled) {
        siteModifier += route.braceBonus || 0;
      }
      if (windowState === "tremor" && !site.braceInstalled && site.chartState !== "success") {
        siteModifier -= route.tremorPenalty || 0;
      }
      if (windowState === "collapsed" && !site.braceInstalled && site.chartState !== "success") {
        siteModifier -= route.failurePenalty || 0;
      }
      if (site.chartState === "failed") {
        siteModifier -= route.failurePenalty || 0;
      }
      return total + siteModifier;
    }, 0);
    return Math.round(clamp(modifier, -36, 24));
  }

  function computePumpworksRouteModifier(state) {
    if (!state.pumpworksSites) {
      return 0;
    }
    const modifier = state.pumpworksSites.reduce((total, site) => {
      const route = site.route || {};
      const windowState = pumpworksWindowState(site, state.elapsed || 0);
      let siteModifier = 0;
      if (site.pumpPrimed) {
        siteModifier += route.primeBonus || 0;
      }
      if (site.leakSealed) {
        siteModifier += route.leakRelief || 0;
      }
      if (site.drainageState === "success") {
        siteModifier += route.drainBonus || 0;
      } else if (site.drainageState === "partial") {
        siteModifier += Math.round((route.drainBonus || 0) / 2);
      }
      if ((windowState === "surge" || windowState === "flood") && !pumpworksOutcomeComplete(site)) {
        siteModifier -= Math.round((route.failurePenalty || 0) / 2);
      }
      if (site.drainageState === "failed" || windowState === "overrun") {
        siteModifier -= route.failurePenalty || 0;
      }
      return total + siteModifier;
    }, 0);
    return Math.round(clamp(modifier, -44, 32));
  }

  function pumpworksGuidePoints(state) {
    return (state.pumpworksSites || [])
      .filter((site) => site.pumpPrimed || site.leakSealed || site.drainageState === "success" || site.drainageState === "partial")
      .map((site) => ({
        id: `${site.id}-drainage-line`,
        name: `${site.name} drainage line`,
        kind: "pumpworks-drainage",
        position: site.position,
        safeRadius: site.guideRadius || GAME_DATA.pumpworks.actionRange,
      }));
  }

  function routeGuidePoints(state) {
    const surveyStakes = (state.surveySites || [])
      .filter((site) => site.stakePlanted)
      .map((site) => ({
        id: `${site.id}-stake`,
        name: `${site.name} stake`,
        kind: "survey-stake",
        position: site.position,
        safeRadius: GAME_DATA.survey.stakes.safetyRadius,
      }));
    const drainageLines = pumpworksGuidePoints(state);
    return [
      {
        id: state.lift.id,
        name: state.lift.name,
        kind: "lift",
        position: state.lift.position,
        safeRadius: state.lift.radius,
      },
      ...state.lanterns.anchors.map((anchor) => ({
        id: anchor.id,
        name: anchor.id,
        kind: "anchor",
        position: anchor.position,
        safeRadius: anchor.safetyRadius,
      })),
      ...surveyStakes,
      ...drainageLines,
    ];
  }

  function computeRouteLegs(points) {
    const legs = [];
    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      const legDistance = distance(from.position, to.position);
      legs.push({
        from: from.id,
        to: to.id,
        distance: Number(legDistance.toFixed(1)),
        linked: legDistance <= GAME_DATA.route.linkedLegDistance,
      });
    }
    return legs;
  }

  function computeRouteState(state) {
    const points = routeGuidePoints(state);
    const legs = computeRouteLegs(points);
    const nearest = points.reduce(
      (closest, point) => {
        const pointDistance = distance(state.player.position, point.position);
        if (!closest || pointDistance < closest.distance) {
          return { point, distance: pointDistance };
        }
        return closest;
      },
      null
    );
    const liftDistance = distance(state.player.position, state.lift.position);
    const safeGap = Math.max(0, nearest.distance - nearest.point.safeRadius);
    const stretchedLegs = legs.filter((leg) => !leg.linked).length;
    let returnConfidence = nearest.point.kind === "lift" && liftDistance <= state.lift.radius
      ? 100
      : 100 - safeGap * 4.8 - stretchedLegs * 18;
    if (points.length === 1) {
      returnConfidence = 100 - Math.max(0, liftDistance - state.lift.radius) * 2.4;
    }
    returnConfidence += computeSurveyRouteModifier(state) + computePumpworksRouteModifier(state);
    returnConfidence = Math.round(clamp(returnConfidence, 0, 100));

    let status = nearest.distance >= GAME_DATA.route.lostDistance ? "route lost" : "route thin";
    if (liftDistance <= state.lift.radius) {
      status = "lift safe";
    } else if (nearest.point.kind === "anchor" && nearest.distance <= nearest.point.safeRadius) {
      status = "anchor safe";
    } else if (nearest.distance <= GAME_DATA.route.warningDistance) {
      status = "route visible";
    }

    let suggestedAction = "press deeper";
    if (state.cargo.samples > 0 && returnConfidence < 55) {
      suggestedAction = "return";
    } else if (
      state.lanterns.charges > 0 &&
      liftDistance > state.lift.radius &&
      nearest.distance > GAME_DATA.route.warningDistance
    ) {
      suggestedAction = "set anchor";
    } else if (state.cargo.samples >= state.cargo.capacity) {
      suggestedAction = "return full";
    }

    return {
      status,
      returnConfidence,
      nearestPointId: nearest.point.id,
      nearestPointName: nearest.point.name,
      nearestPointKind: nearest.point.kind,
      nearestPointDistance: Number(nearest.distance.toFixed(1)),
      guideBearing: bearingTo(state.player.position, nearest.point.position, state.player.facing),
      liftBearing: bearingTo(state.player.position, state.lift.position, state.player.facing),
      anchorCount: state.lanterns.anchors.length,
      linkedLegs: legs.filter((leg) => leg.linked).length,
      stretchedLegs,
      legs,
      suggestedAction,
    };
  }

  function createSampleNodes(seed = DEFAULT_SEED) {
    const random = seededRandom(seed);
    return GAME_DATA.sampleNodes.map((node, index) => {
      const jitter = index === 0 ? { x: 0, z: 0 } : { x: (random() - 0.5) * 1.2, z: (random() - 0.5) * 1.2 };
      const position = {
        x: Number((node.position.x + jitter.x).toFixed(2)),
        y: node.position.y,
        z: Number((node.position.z + jitter.z).toFixed(2)),
      };
      return {
        ...clone(node),
        position,
        mineState: {
          status: "ready",
          progress: 0,
          depleted: false,
          lastYield: 0,
        },
      };
    });
  }

  function createHazardZones() {
    return GAME_DATA.hazards.map((hazard) => ({
      ...clone(hazard),
      active: false,
      exposure: 0,
      status: "clear",
    }));
  }

  function createSurveySites() {
    return GAME_DATA.surveySites.map((site) => ({
      ...clone(site),
      position: clone(site.position),
      stakePlanted: false,
      braceInstalled: false,
      airCacheState: site.airCache
        ? {
            id: site.airCache.id,
            status: "sealed",
            oxygenRestore: site.airCache.oxygenRestore,
          }
        : {
            id: null,
            status: "none",
            oxygenRestore: 0,
          },
      chartState: "unmapped",
      outcome: "open",
      payoutEarned: 0,
      mapProgressEarned: 0,
      distance: null,
      inRange: false,
      windowState: "pending",
      status: "unmapped",
      lastAction: null,
    }));
  }

  function createPumpworksSites() {
    return GAME_DATA.pumpworksSites.map((site) => ({
      ...clone(site),
      position: clone(site.position),
      floodLevel: site.flood.baseLevel,
      pumpState: "idle",
      pumpPrimed: false,
      valveState: "closed",
      siphonDeployed: false,
      leakSealed: false,
      drainageState: "open",
      outcome: "open",
      payoutEarned: 0,
      mapProgressEarned: 0,
      pressureReliefEarned: 0,
      distance: null,
      inRange: false,
      windowState: "pending",
      status: "flooded",
      lastAction: null,
      lastMissing: [],
    }));
  }

  function upgradeCarryover(purchased) {
    const carryover = {
      oxygenMaxBonus: 0,
      lanternChargeBonus: 0,
      drillPowerBonus: 0,
      siphonChargeBonus: 0,
    };
    purchased.forEach((id) => {
      const upgrade = GAME_DATA.upgrades.find((entry) => entry.id === id);
      if (!upgrade) {
        return;
      }
      carryover.oxygenMaxBonus += upgrade.effect.oxygenMaxBonus || 0;
      carryover.lanternChargeBonus += upgrade.effect.lanternChargeBonus || 0;
      carryover.drillPowerBonus += upgrade.effect.drillPowerBonus || 0;
      carryover.siphonChargeBonus += upgrade.effect.siphonChargeBonus || 0;
    });
    return carryover;
  }

  function createCameraState(player) {
    const state = {
      mode: GAME_DATA.camera.mode,
      position: clone(player.position),
      target: clone(player.position),
      facing: player.facing,
    };
    return updateCameraState({ player, camera: state }).camera;
  }

  function createInitialState(options = {}) {
    const seed = options.seed === undefined ? DEFAULT_SEED : options.seed;
    const purchased = Array.isArray(options.upgrades)
      ? options.upgrades.slice()
      : Array.isArray(options.purchasedUpgrades)
        ? options.purchasedUpgrades.slice()
        : [];
    const carryover = upgradeCarryover(purchased);
    const oxygenMax = GAME_DATA.oxygen.baseMax + carryover.oxygenMaxBonus;
    const lanternMax = GAME_DATA.lanterns.baseCharges + carryover.lanternChargeBonus;
    const drillPower = GAME_DATA.mining.drillPower + carryover.drillPowerBonus;
    const siphonMax = GAME_DATA.pumpworks.siphons.baseCharges + carryover.siphonChargeBonus;
    const player = {
      position: clone(GAME_DATA.player.startPosition),
      facing: GAME_DATA.player.startFacing,
      velocity: vector(),
      radius: GAME_DATA.player.radius,
      speed: GAME_DATA.player.walkSpeed,
      strafeSpeed: GAME_DATA.player.strafeSpeed,
      turnRate: GAME_DATA.player.turnRate,
    };
    const state = {
      seed,
      tick: 0,
      elapsed: 0,
      renderer: {
        path: RENDERER_PATH,
        status: "pending",
      },
      player,
      movement: {
        collision: {
          passages: GAME_DATA.cave.passages.map((passage) => passage.id),
          lastBlocked: false,
          lastPassage: "lift-bay",
        },
      },
      camera: createCameraState(player),
      oxygen: {
        current: oxygenMax,
        max: oxygenMax,
        baseDrainPerSecond: GAME_DATA.oxygen.baseDrainPerSecond,
        lastDrainPerSecond: 0,
      },
      light: {
        currentRadius: GAME_DATA.light.headlampRadius,
        headlampRadius: GAME_DATA.light.headlampRadius,
        status: "lamp stable",
      },
      lanterns: {
        charges: lanternMax,
        max: lanternMax,
        anchors: [],
        radius: GAME_DATA.lanterns.radius,
        safetyRadius: GAME_DATA.lanterns.safetyRadius,
        lastPlaced: null,
      },
      surveySites: createSurveySites(),
      pumpworksSites: createPumpworksSites(),
      survey: {
        release: clone(GAME_DATA.survey.release),
        contract: clone(GAME_DATA.survey.contract),
        stakes: GAME_DATA.survey.stakes.baseCharges,
        maxStakes: GAME_DATA.survey.stakes.baseCharges,
        braces: GAME_DATA.survey.braces.baseCharges,
        maxBraces: GAME_DATA.survey.braces.baseCharges,
        mapProgress: 0,
        ledger: options.surveyLedger || 0,
        value: 0,
        completedSites: 0,
        airCachesUsed: 0,
        activeSiteId: null,
        activeSiteName: null,
        activeSiteDistance: null,
        activeSiteWindow: null,
        activeSiteStatus: "none",
        status: "survey open",
        lastAction: null,
      },
      pumpworks: {
        release: clone(GAME_DATA.pumpworks.release),
        contract: clone(GAME_DATA.pumpworks.contract),
        siphons: siphonMax,
        maxSiphons: siphonMax,
        mapProgress: 0,
        ledger: options.pumpworksLedger || 0,
        value: 0,
        completedSites: 0,
        pressureRelief: 0,
        activeSiteId: null,
        activeSiteName: null,
        activeSiteDistance: null,
        activeSiteWindow: null,
        activeSiteStatus: "none",
        floodLevel: 0,
        status: "pumpworks flooded",
        lastAction: null,
      },
      routeStability: {
        stability: 100,
        status: "stable",
        pressure: 0,
        warnings: [],
        routeModifier: 0,
      },
      route: {
        status: "lift safe",
        returnConfidence: 100,
        nearestPointId: GAME_DATA.lift.id,
        nearestPointName: GAME_DATA.lift.name,
        nearestPointKind: "lift",
        nearestPointDistance: 0,
        guideBearing: 0,
        liftBearing: 0,
        anchorCount: 0,
        linkedLegs: 0,
        stretchedLegs: 0,
        legs: [],
        suggestedAction: "press deeper",
      },
      sampleNodes: createSampleNodes(seed),
      mining: {
        active: false,
        targetId: null,
        status: "idle",
        range: GAME_DATA.mining.range,
        drillPower,
        lastYield: 0,
      },
      lift: {
        ...clone(GAME_DATA.lift),
        distance: 0,
        bearing: 0,
        docked: true,
        status: "ready",
        bankedSamples: 0,
        bankedSurveyValue: 0,
        bankedMapProgress: 0,
        bankedPumpworksValue: 0,
        bankedPumpworksMapProgress: 0,
        lastBanked: 0,
      },
      hazardZones: createHazardZones(),
      scanner: {
        range: GAME_DATA.scanner.range,
        cooldown: 0,
        pulseAge: 0,
        targetId: null,
        targetKind: "sample",
        targetName: null,
        targetBearing: 0,
        targetDistance: 0,
        routeBearing: 0,
        routeDistance: 0,
        lastPulse: null,
        liftBearing: 0,
        status: "ready",
      },
      cargo: {
        samples: 0,
        value: 0,
        capacity: GAME_DATA.mining.cargoCapacity,
      },
      credits: options.credits === undefined ? 0 : options.credits,
      upgrades: {
        purchased,
        carryover,
        available: clone(GAME_DATA.upgrades),
        lastPurchase: null,
      },
      run: {
        status: "active",
        objective: "Descend, mark the route, drain lower pumpworks, survey fault plates, bank samples at the lift.",
        failureReason: null,
        completeReason: null,
        count: options.runCount || 1,
      },
      input: {
        movement: clone(GAME_DATA.controls),
      },
      log: [{ tick: 0, message: "Iron Lift ready. Main cut is open." }],
    };
    return syncDerivedState(state);
  }

  function nearestSample(state) {
    let closest = null;
    state.sampleNodes.forEach((node) => {
      if (node.mineState.depleted) {
        return;
      }
      const nodeDistance = distance(state.player.position, node.position);
      if (!closest || nodeDistance < closest.distance) {
        closest = { node, distance: nodeDistance };
      }
    });
    return closest;
  }

  function currentHazardExposure(state) {
    return state.hazardZones.reduce(
      (total, zone) => {
        const zoneDistance = distance(state.player.position, zone.position);
        const exposure = Math.max(0, 1 - zoneDistance / zone.radius);
        return {
          oxygenDrainPerSecond: total.oxygenDrainPerSecond + exposure * zone.oxygenDrainPerSecond,
          visibilityPenalty: total.visibilityPenalty + exposure * zone.visibilityPenalty,
          names: exposure > 0 ? total.names.concat(zone.name) : total.names,
        };
      },
      { oxygenDrainPerSecond: 0, visibilityPenalty: 0, names: [] }
    );
  }

  function coveredByLantern(state, radius = GAME_DATA.lanterns.safetyRadius) {
    return state.lanterns.anchors.some((anchor) => distance(state.player.position, anchor.position) <= radius);
  }

  function nearestSurveySite(state, options = {}) {
    const includeCompleted = Boolean(options.includeCompleted);
    let closest = null;
    (state.surveySites || []).forEach((site) => {
      if (!includeCompleted && surveyOutcomeComplete(site)) {
        return;
      }
      const siteDistance = distance(state.player.position, site.position);
      if (!closest || siteDistance < closest.distance) {
        closest = { site, distance: siteDistance };
      }
    });
    return closest;
  }

  function surveySiteForPumpworks(state, site) {
    return (state.surveySites || []).find((entry) => entry.id === site.requirements.surveySiteId) || null;
  }

  function surveyChartMeetsRequirement(surveySite, required) {
    if (!required) {
      return true;
    }
    if (!surveySite) {
      return false;
    }
    if (required === "partial") {
      return surveySite.chartState === "partial" || surveySite.chartState === "success";
    }
    return surveySite.chartState === required;
  }

  function pumpworksRequirementStatus(state, site, options = {}) {
    const surveySite = surveySiteForPumpworks(state, site);
    const missing = [];
    const requirements = site.requirements || {};
    const leak = site.leak || {};
    if (requirements.stake && (!surveySite || !surveySite.stakePlanted)) {
      missing.push("survey stake");
    }
    if (requirements.brace && (!surveySite || !surveySite.braceInstalled)) {
      missing.push("brace frame");
    }
    if (requirements.chart && !surveyChartMeetsRequirement(surveySite, requirements.chart)) {
      missing.push(`${requirements.chart} survey chart`);
    }
    if (requirements.lanternAnchor && !coveredByLantern(state)) {
      missing.push("lantern anchor");
    }
    if (options.requireSiphon && requirements.siphon && !site.siphonDeployed) {
      missing.push("siphon charge");
    }
    if (options.forLeak) {
      if (leak.requiresStake && (!surveySite || !surveySite.stakePlanted)) {
        missing.push("survey stake leak line");
      }
      if (leak.requiresBrace && (!surveySite || !surveySite.braceInstalled)) {
        missing.push("brace frame leak line");
      }
    }
    return {
      surveySite,
      missing,
      ready: missing.length === 0,
    };
  }

  function nearestPumpworksSite(state, options = {}) {
    const includeCompleted = Boolean(options.includeCompleted);
    let closest = null;
    (state.pumpworksSites || []).forEach((site) => {
      if (!includeCompleted && pumpworksOutcomeComplete(site)) {
        return;
      }
      const siteDistance = distance(state.player.position, site.position);
      if (!closest || siteDistance < closest.distance) {
        closest = { site, distance: siteDistance };
      }
    });
    return closest;
  }

  function computeRouteStability(state, routeState = null, hazardState = null) {
    if (!state.surveySites) {
      return {
        stability: 100,
        status: "stable",
        pressure: 0,
        warnings: [],
        routeModifier: 0,
      };
    }
    const route = routeState || state.route || computeRouteState(state);
    const hazard = hazardState || currentHazardExposure(state);
    const settings = GAME_DATA.survey.routeStability;
    const warnings = [];
    let pressure = 0;

    if (route.returnConfidence < 70) {
      pressure += Math.round((70 - route.returnConfidence) / 4) + settings.routeWeakPenalty;
      warnings.push("route confidence thin");
    }
    if (hazard.names.length) {
      pressure += hazard.names.length * settings.hazardPenalty;
      warnings.push(`hazard exposure: ${hazard.names.join(" + ")}`);
    }

    state.surveySites.forEach((site) => {
      const windowState = surveySiteWindowState(site, state.elapsed || 0);
      const stability = site.routeStability || {};
      let sitePressure = stability.basePressure || 0;
      if (site.chartState === "success") {
        sitePressure = Math.max(0, sitePressure - 8);
      }
      if (site.stakePlanted) {
        sitePressure -= stability.stakeRelief || 0;
      }
      if (site.braceInstalled) {
        sitePressure -= stability.braceRelief || 0;
      }
      if (windowState === "tremor" && site.chartState !== "success") {
        sitePressure += site.tremorWindow.tremorPressure || 0;
        warnings.push(`${site.name} tremor window`);
      }
      if (windowState === "collapsed" && !site.braceInstalled && site.chartState !== "success") {
        sitePressure += site.tremorWindow.collapsePressure || 0;
        warnings.push(`${site.name} collapse warning`);
      }
      if (site.chartState === "failed") {
        sitePressure += site.tremorWindow.collapsePressure || 0;
      }
      pressure += Math.max(0, sitePressure);
    });

    (state.pumpworksSites || []).forEach((site) => {
      const windowState = pumpworksWindowState(site, state.elapsed || 0);
      const siteDistance = distance(state.player.position, site.position);
      const activePressure =
        siteDistance <= site.influenceRadius ||
        site.pumpPrimed ||
        site.leakSealed ||
        site.siphonDeployed ||
        pumpworksOutcomeComplete(site);
      if (!activePressure) {
        return;
      }
      const pressureWindow = site.pressureWindow || {};
      let sitePressure = pressureWindow.basePressure || 0;
      if (windowState === "surge") {
        sitePressure += pressureWindow.surgePressure || 0;
        warnings.push(`${site.name} pressure surge`);
      } else if (windowState === "flood" || windowState === "overrun") {
        sitePressure += pressureWindow.floodPressure || 0;
        warnings.push(`${site.name} flood pulse`);
      }
      sitePressure += Math.round((site.floodLevel || 0) * 10);
      if (site.pumpPrimed) {
        sitePressure -= site.route.primeBonus || 0;
      }
      if (site.leakSealed) {
        sitePressure -= site.leak.pressureRelief || 0;
      }
      if (site.siphonDeployed) {
        sitePressure -= 6;
      }
      if (site.drainageState === "success") {
        sitePressure -= site.rewards.pressureRelief || 0;
      } else if (site.drainageState === "partial") {
        sitePressure -= Math.round((site.rewards.pressureRelief || 0) / 2);
      } else if (site.drainageState === "failed") {
        sitePressure += site.route.failurePenalty || 0;
      }
      pressure += Math.max(0, sitePressure);
    });

    const stability = Math.round(clamp(settings.base - pressure, 0, 100));
    let status = "stable";
    if (stability < 35) {
      status = "collapse risk";
    } else if (stability < 62) {
      status = "unstable";
    } else if (stability < 82) {
      status = "watched";
    }
    return {
      stability,
      status,
      pressure: Math.round(pressure),
      warnings,
      routeModifier: computeSurveyRouteModifier(state),
    };
  }

  function syncSurveyState(state) {
    if (!state.survey || !state.surveySites) {
      return state;
    }
    let completedSites = 0;
    state.surveySites.forEach((site) => {
      site.distance = Number(distance(state.player.position, site.position).toFixed(1));
      site.inRange = site.distance <= GAME_DATA.survey.actionRange;
      site.windowState = surveySiteWindowState(site, state.elapsed || 0);
      if (site.chartState === "success" || site.chartState === "partial") {
        completedSites += 1;
      }
      if (surveyOutcomeComplete(site)) {
        site.status = site.chartState;
      } else if (site.windowState === "collapsed" && !site.braceInstalled) {
        site.status = "collapse warning";
      } else if (site.braceInstalled) {
        site.status = "braced";
      } else if (site.stakePlanted) {
        site.status = "staked";
      } else if (site.inRange) {
        site.status = "survey ready";
      } else {
        site.status = "unmapped";
      }
    });

    const active = nearestSurveySite(state) || nearestSurveySite(state, { includeCompleted: true });
    state.survey.completedSites = completedSites;
    state.survey.activeSiteId = active ? active.site.id : null;
    state.survey.activeSiteName = active ? active.site.name : null;
    state.survey.activeSiteDistance = active ? Number(active.distance.toFixed(1)) : null;
    state.survey.activeSiteWindow = active ? active.site.windowState : null;
    state.survey.activeSiteStatus = active ? active.site.status : "none";
    state.survey.status = active
      ? `${active.site.name}: ${active.site.status} / ${active.site.windowState}`
      : "survey complete";
    return state;
  }

  function pumpworksStatus(site) {
    if (site.drainageState === "success") {
      return "drained";
    }
    if (site.drainageState === "partial") {
      return "partly drained";
    }
    if (site.drainageState === "failed") {
      return "flood locked";
    }
    if (site.leakSealed && site.siphonDeployed) {
      return "sealed siphon";
    }
    if (site.valveState !== "closed") {
      return site.valveState;
    }
    if (site.pumpPrimed) {
      return "primed";
    }
    if (site.windowState === "surge" || site.windowState === "flood") {
      return "pressure rising";
    }
    if (site.inRange) {
      return "pump ready";
    }
    return "flooded";
  }

  function syncPumpworksState(state) {
    if (!state.pumpworks || !state.pumpworksSites) {
      return state;
    }
    let completedSites = 0;
    let totalFloodLevel = 0;
    state.pumpworksSites.forEach((site) => {
      site.distance = Number(distance(state.player.position, site.position).toFixed(1));
      site.inRange = site.distance <= GAME_DATA.pumpworks.actionRange;
      site.windowState = pumpworksWindowState(site, state.elapsed || 0);
      if (site.drainageState === "success" || site.drainageState === "partial") {
        completedSites += 1;
      }
      site.status = pumpworksStatus(site);
      totalFloodLevel += site.floodLevel || 0;
    });

    const active = nearestPumpworksSite(state) || nearestPumpworksSite(state, { includeCompleted: true });
    state.pumpworks.completedSites = completedSites;
    state.pumpworks.activeSiteId = active ? active.site.id : null;
    state.pumpworks.activeSiteName = active ? active.site.name : null;
    state.pumpworks.activeSiteDistance = active ? Number(active.distance.toFixed(1)) : null;
    state.pumpworks.activeSiteWindow = active ? active.site.windowState : null;
    state.pumpworks.activeSiteStatus = active ? active.site.status : "none";
    state.pumpworks.floodLevel = Number((totalFloodLevel / Math.max(1, state.pumpworksSites.length)).toFixed(2));
    state.pumpworks.status = active
      ? `${active.site.name}: ${active.site.status} / ${active.site.windowState}`
      : "pumpworks drained";
    return state;
  }

  function surveyOxygenDrain(state, routeState = null, hazardState = null) {
    if (state.run.status !== "active" || !state.surveySites) {
      return 0;
    }
    const routeStability = computeRouteStability(state, routeState, hazardState);
    let drain = 0;
    if (routeStability.stability < 65) {
      const instability = (65 - routeStability.stability) / 65;
      drain += instability * GAME_DATA.survey.routeStability.lowStabilityDrainPerSecond;
    }
    state.surveySites.forEach((site) => {
      if (site.chartState === "success") {
        return;
      }
      const siteDistance = distance(state.player.position, site.position);
      if (siteDistance > site.influenceRadius) {
        return;
      }
      const exposure = Math.max(0, 1 - siteDistance / site.influenceRadius);
      const windowState = surveySiteWindowState(site, state.elapsed || 0);
      let siteDrain = site.oxygenModifier.activeDrainPerSecond || 0;
      if (windowState === "tremor") {
        siteDrain += site.oxygenModifier.tremorDrainPerSecond || 0;
      }
      if (windowState === "collapsed" && !site.braceInstalled) {
        siteDrain += GAME_DATA.survey.routeStability.collapseDrainPerSecond;
      }
      if (site.stakePlanted) {
        siteDrain *= 0.72;
      }
      if (site.braceInstalled) {
        siteDrain *= 0.38;
      }
      if (site.airCacheState && site.airCacheState.status === "depleted") {
        siteDrain *= 0.78;
      }
      drain += exposure * siteDrain;
    });
    return Number(drain.toFixed(3));
  }

  function pumpworksOxygenDrain(state, routeState = null, hazardState = null) {
    if (state.run.status !== "active" || !state.pumpworksSites) {
      return 0;
    }
    const route = routeState || state.route || computeRouteState(state);
    const hazard = hazardState || currentHazardExposure(state);
    let drain = 0;
    if (route.returnConfidence < 58) {
      drain += ((58 - route.returnConfidence) / 58) * GAME_DATA.pumpworks.routeStability.lowStabilityDrainPerSecond;
    }
    if (hazard.names.length) {
      drain += hazard.names.length * 0.05;
    }
    state.pumpworksSites.forEach((site) => {
      if (site.drainageState === "success") {
        return;
      }
      const siteDistance = distance(state.player.position, site.position);
      if (siteDistance > site.influenceRadius) {
        return;
      }
      const exposure = Math.max(0, 1 - siteDistance / site.influenceRadius);
      const windowState = pumpworksWindowState(site, state.elapsed || 0);
      let siteDrain = (site.floodLevel || 0) * GAME_DATA.pumpworks.routeStability.floodExposureDrainPerSecond;
      if (windowState === "surge") {
        siteDrain += 0.24;
      } else if (windowState === "flood" || windowState === "overrun") {
        siteDrain += 0.42;
      }
      if (site.pumpPrimed) {
        siteDrain *= 0.76;
      }
      if (site.leakSealed) {
        siteDrain *= 0.72;
      }
      if (site.siphonDeployed) {
        siteDrain *= 0.68;
      }
      if (site.drainageState === "partial") {
        siteDrain *= 0.5;
      }
      const linkedSurvey = surveySiteForPumpworks(state, site);
      if (linkedSurvey && linkedSurvey.airCacheState && linkedSurvey.airCacheState.status === "depleted") {
        siteDrain *= 0.84;
      }
      drain += exposure * siteDrain;
    });
    return Number(drain.toFixed(3));
  }

  function sampleSurveyValueBonus(state, node) {
    const passage = cavePassageAt(node.position);
    if (!passage || !state.surveySites) {
      return 0;
    }
    const site = state.surveySites.find(
      (entry) => entry.passageId === passage.id && entry.chartState === "success"
    );
    return site ? site.rewards.sampleValueBonus || 0 : 0;
  }

  function samplePumpworksValueBonus(state, node) {
    const passage = cavePassageAt(node.position);
    if (!passage || !state.pumpworksSites) {
      return 0;
    }
    const site = state.pumpworksSites.find(
      (entry) =>
        (entry.associatedPassages || []).includes(passage.id) &&
        (entry.drainageState === "success" || entry.drainageState === "partial")
    );
    if (!site) {
      return 0;
    }
    return site.drainageState === "success"
      ? site.rewards.sampleValueBonus || 0
      : Math.round((site.rewards.sampleValueBonus || 0) / 2);
  }

  function oxygenDrainRate(state) {
    if (state.run.status !== "active") {
      return 0;
    }
    const hazard = currentHazardExposure(state);
    const route = computeRouteState(state);
    const liftDistance = distance(state.player.position, state.lift.position);
    let rate =
      state.oxygen.baseDrainPerSecond +
      hazard.oxygenDrainPerSecond +
      surveyOxygenDrain(state, route, hazard) +
      pumpworksOxygenDrain(state, route, hazard);
    if (liftDistance <= state.lift.radius) {
      rate *= GAME_DATA.oxygen.liftDrainMultiplier;
    } else if (coveredByLantern(state)) {
      rate *= GAME_DATA.oxygen.lanternDrainMultiplier;
    } else if (route.returnConfidence < 35) {
      rate += GAME_DATA.oxygen.routeLostDrainPerSecond;
    } else if (route.returnConfidence < 70) {
      rate += GAME_DATA.oxygen.unmarkedDrainPerSecond;
    }
    return Number(rate.toFixed(3));
  }

  function updateCameraState(state) {
    const forward = directionFromFacing(state.player.facing);
    const camera = state.camera || { mode: GAME_DATA.camera.mode };
    camera.mode = GAME_DATA.camera.mode;
    camera.position = {
      x: state.player.position.x - forward.x * GAME_DATA.camera.distance,
      y: state.player.position.y + GAME_DATA.camera.height,
      z: state.player.position.z - forward.z * GAME_DATA.camera.distance,
    };
    camera.target = {
      x: state.player.position.x + forward.x * GAME_DATA.camera.lookAhead,
      y: state.player.position.y + 0.45,
      z: state.player.position.z + forward.z * GAME_DATA.camera.lookAhead,
    };
    camera.facing = state.player.facing;
    state.camera = camera;
    return state;
  }

  function syncDerivedState(state) {
    const passage = cavePassageAt(state.player.position, state.player.radius);
    state.movement.collision.lastPassage = passage ? passage.id : "outside";
    state.lift.distance = distance(state.player.position, state.lift.position);
    state.lift.bearing = bearingTo(state.player.position, state.lift.position, state.player.facing);
    state.lift.docked = state.lift.distance <= state.lift.radius;
    state.lift.status = state.lift.docked ? "in range" : "away";

    const hazard = currentHazardExposure(state);
    state.hazardZones.forEach((zone) => {
      const exposure = Math.max(0, 1 - distance(state.player.position, zone.position) / zone.radius);
      zone.exposure = Number(exposure.toFixed(3));
      zone.active = exposure > 0;
      zone.status = exposure > 0 ? "exposed" : "clear";
    });
    state.route = computeRouteState(state);
    state.routeStability = computeRouteStability(state, state.route, hazard);
    syncSurveyState(state);
    syncPumpworksState(state);

    const sample = nearestSample(state);
    const sampleInRange = sample && sample.distance <= state.scanner.range;
    const survey = nearestSurveySite(state);
    const surveyInRange = survey && survey.distance <= state.scanner.range;
    const surveyIsActionable = surveyInRange && survey.distance <= GAME_DATA.survey.actionRange;
    const pumpworks = nearestPumpworksSite(state);
    const pumpworksInRange = pumpworks && pumpworks.distance <= state.scanner.range;
    const pumpworksIsActionable = pumpworksInRange && pumpworks.distance <= GAME_DATA.pumpworks.actionRange;
    const pumpworksPrecedesSample =
      pumpworksInRange &&
      (!sampleInRange || pumpworks.distance <= sample.distance) &&
      (!surveyInRange || pumpworks.distance <= survey.distance);
    const target = pumpworksIsActionable || pumpworksPrecedesSample
      ? {
          id: pumpworks.site.id,
          kind: "pumpworks",
          name: pumpworks.site.name,
          position: pumpworks.site.position,
          distance: pumpworks.distance,
        }
      : surveyIsActionable || (surveyInRange && !sampleInRange)
      ? {
          id: survey.site.id,
          kind: "survey",
          name: survey.site.name,
          position: survey.site.position,
          distance: survey.distance,
        }
      : sampleInRange
      ? {
          id: sample.node.id,
          kind: "sample",
          name: sample.node.name,
          position: sample.node.position,
          distance: sample.distance,
        }
      : {
          id: state.lift.id,
          kind: "lift",
          name: state.lift.name,
          position: state.lift.position,
          distance: state.lift.distance,
        };
    state.scanner.liftBearing = state.lift.bearing;
    state.scanner.targetId = target.id;
    state.scanner.targetKind = target.kind;
    state.scanner.targetName = target.name;
    state.scanner.targetBearing = bearingTo(state.player.position, target.position, state.player.facing);
    state.scanner.targetDistance = Number(target.distance.toFixed(1));
    state.scanner.routeBearing = state.route.guideBearing;
    state.scanner.routeDistance = state.route.nearestPointDistance;
    state.scanner.status = state.scanner.cooldown > 0 && state.scanner.lastPulse
      ? `pulse ${state.scanner.lastPulse.targetName} ${formatBearing(state.scanner.lastPulse.targetBearing)}`
      : `${target.name} ${formatBearing(state.scanner.targetBearing)} / ${Math.round(state.scanner.targetDistance)}m`;

    const lanternBoost = coveredByLantern(state, GAME_DATA.lanterns.radius) ? GAME_DATA.light.lanternBoost : 0;
    const radius = Math.max(6, GAME_DATA.light.headlampRadius + lanternBoost - hazard.visibilityPenalty);
    const lanternCovered = coveredByLantern(state);
    state.light.currentRadius = Number(radius.toFixed(1));
    state.light.status = hazard.names.length
      ? lanternCovered
        ? `${hazard.names[0]} / lantern safe`
        : `${hazard.names[0]} interference`
      : lanternCovered
        ? "lantern safe"
        : "lamp stable";
    state.oxygen.lastDrainPerSecond = oxygenDrainRate(state);

    updateCameraState(state);
    return state;
  }

  function resolveMovement(state, desired) {
    const radius = state.player.radius;
    const start = state.player.position;
    const candidate = { x: desired.x, y: GAME_DATA.cave.playerY, z: desired.z };
    if (isPointInPassage(candidate, radius)) {
      return { position: candidate, blocked: false };
    }
    const xOnly = { x: desired.x, y: GAME_DATA.cave.playerY, z: start.z };
    if (isPointInPassage(xOnly, radius)) {
      return { position: xOnly, blocked: true };
    }
    const zOnly = { x: start.x, y: GAME_DATA.cave.playerY, z: desired.z };
    if (isPointInPassage(zOnly, radius)) {
      return { position: zOnly, blocked: true };
    }
    return { position: { ...start, y: GAME_DATA.cave.playerY }, blocked: true };
  }

  function applyMovement(state, controls, deltaSeconds) {
    const next = state;
    if (controls.turnLeft) {
      next.player.facing -= next.player.turnRate * deltaSeconds;
    }
    if (controls.turnRight) {
      next.player.facing += next.player.turnRate * deltaSeconds;
    }
    next.player.facing = normalizeAngle(next.player.facing);

    const forward = directionFromFacing(next.player.facing);
    const right = rightFromFacing(next.player.facing);
    const forwardInput = (controls.forward ? 1 : 0) - (controls.back ? 1 : 0);
    const strafeInput = (controls.strafeRight ? 1 : 0) - (controls.strafeLeft ? 1 : 0);
    const dx =
      forward.x * forwardInput * next.player.speed * deltaSeconds +
      right.x * strafeInput * next.player.strafeSpeed * deltaSeconds;
    const dz =
      forward.z * forwardInput * next.player.speed * deltaSeconds +
      right.z * strafeInput * next.player.strafeSpeed * deltaSeconds;
    const desired = {
      x: next.player.position.x + dx,
      y: GAME_DATA.cave.playerY,
      z: next.player.position.z + dz,
    };
    const resolved = resolveMovement(next, desired);
    next.player.velocity = {
      x: (resolved.position.x - next.player.position.x) / Math.max(deltaSeconds, 0.001),
      y: 0,
      z: (resolved.position.z - next.player.position.z) / Math.max(deltaSeconds, 0.001),
    };
    next.player.position = resolved.position;
    next.movement.collision.lastBlocked = resolved.blocked;
    return next;
  }

  function placeLantern(state) {
    const next = clone(state);
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    if (next.lanterns.charges <= 0) {
      next.lanterns.lastPlaced = "empty";
      next.log.unshift({ tick: next.tick, message: "No lantern anchors remain." });
      return syncDerivedState(next);
    }
    const anchor = {
      id: `lantern-${String(next.lanterns.anchors.length + 1).padStart(2, "0")}`,
      position: clone(next.player.position),
      radius: next.lanterns.radius,
      safetyRadius: next.lanterns.safetyRadius,
      placedAt: next.elapsed,
      status: "burning",
    };
    next.lanterns.anchors.push(anchor);
    next.lanterns.charges -= 1;
    next.lanterns.lastPlaced = anchor.id;
    next.log.unshift({ tick: next.tick, message: `${anchor.id} set in ${next.movement.collision.lastPassage}.` });
    return syncDerivedState(next);
  }

  function surveyActionTarget(state, siteId = null) {
    const site = siteId
      ? (state.surveySites || []).find((entry) => entry.id === siteId)
      : nearestSurveySite(state, { includeCompleted: true })?.site;
    if (!site) {
      return { site: null, distance: Infinity, inRange: false };
    }
    const siteDistance = distance(state.player.position, site.position);
    return {
      site,
      distance: siteDistance,
      inRange: siteDistance <= GAME_DATA.survey.actionRange,
    };
  }

  function recordSurveyMiss(next, target, action) {
    const message = target.site
      ? `${action} needs ${target.site.name} within ${GAME_DATA.survey.actionRange}m.`
      : `No survey site available for ${action}.`;
    next.survey.lastAction = "out of range";
    next.log.unshift({ tick: next.tick, message });
    return syncDerivedState(next);
  }

  function plantSurveyStake(state, siteId = null) {
    const next = syncDerivedState(clone(state));
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    const target = surveyActionTarget(next, siteId);
    if (!target.inRange) {
      return recordSurveyMiss(next, target, "Survey stake");
    }
    const site = target.site;
    if (site.stakePlanted) {
      next.survey.lastAction = "stake already planted";
      site.lastAction = next.survey.lastAction;
      return syncDerivedState(next);
    }
    if (next.survey.stakes <= 0) {
      next.survey.lastAction = "no survey stakes";
      next.log.unshift({ tick: next.tick, message: "No survey stakes remain." });
      return syncDerivedState(next);
    }
    site.stakePlanted = true;
    site.lastAction = "stake planted";
    next.survey.stakes -= 1;
    next.survey.lastAction = `stake planted: ${site.id}`;
    next.log.unshift({ tick: next.tick, message: `${site.name} survey stake planted in ${site.passageId}.` });
    return syncDerivedState(next);
  }

  function braceSurveySite(state, siteId = null) {
    const next = syncDerivedState(clone(state));
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    const target = surveyActionTarget(next, siteId);
    if (!target.inRange) {
      return recordSurveyMiss(next, target, "Brace frame");
    }
    const site = target.site;
    if (!site.requirements.brace) {
      next.survey.lastAction = "brace not required";
      site.lastAction = next.survey.lastAction;
      return syncDerivedState(next);
    }
    if (!site.stakePlanted) {
      next.survey.lastAction = "stake required";
      site.lastAction = next.survey.lastAction;
      next.log.unshift({ tick: next.tick, message: `${site.name} needs a survey stake before bracing.` });
      return syncDerivedState(next);
    }
    if (site.requirements.lanternAnchor && !coveredByLantern(next)) {
      next.survey.lastAction = "lantern anchor required";
      site.lastAction = next.survey.lastAction;
      next.log.unshift({ tick: next.tick, message: `${site.name} brace needs lantern light on the route.` });
      return syncDerivedState(next);
    }
    if (site.braceInstalled) {
      next.survey.lastAction = "brace already installed";
      site.lastAction = next.survey.lastAction;
      return syncDerivedState(next);
    }
    if (next.survey.braces <= 0) {
      next.survey.lastAction = "no brace frames";
      next.log.unshift({ tick: next.tick, message: "No brace frames remain." });
      return syncDerivedState(next);
    }
    site.braceInstalled = true;
    site.lastAction = "brace installed";
    next.survey.braces -= 1;
    next.survey.lastAction = `brace installed: ${site.id}`;
    next.log.unshift({ tick: next.tick, message: `${site.name} brace frame locked before the tremor window.` });
    return syncDerivedState(next);
  }

  function chartFaultSurvey(state, siteId = null) {
    const next = syncDerivedState(clone(state));
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    const target = surveyActionTarget(next, siteId);
    if (!target.inRange) {
      return recordSurveyMiss(next, target, "Fault chart");
    }
    const site = target.site;
    if (surveyOutcomeComplete(site)) {
      next.survey.lastAction = `already charted: ${site.chartState}`;
      site.lastAction = next.survey.lastAction;
      return syncDerivedState(next);
    }

    const windowState = surveySiteWindowState(site, next.elapsed || 0);
    const hasStake = !site.requirements.stake || site.stakePlanted;
    const hasBrace = !site.requirements.brace || site.braceInstalled;
    const hazard = currentHazardExposure(next);
    const lanternSafe = !hazard.names.length || coveredByLantern(next);
    const stableRoute = next.route.returnConfidence >= 48 && next.routeStability.stability >= 48;
    const inChartWindow = windowState === "stable" || (windowState === "tremor" && site.braceInstalled);
    let outcome = "partial";
    if (windowState === "collapsed" && !site.braceInstalled) {
      outcome = "failed";
    } else if (hasStake && hasBrace && lanternSafe && stableRoute && inChartWindow) {
      outcome = "success";
    }

    const oxygenCost = outcome === "failed" ? 9 : outcome === "partial" ? 5 : 3;
    next.oxygen.current = Math.max(0, Number((next.oxygen.current - oxygenCost).toFixed(3)));
    site.chartState = outcome;
    site.outcome = outcome;
    site.lastAction = `chart ${outcome}`;
    site.payoutEarned = outcome === "success" ? site.rewards.payout : outcome === "partial" ? site.rewards.partialPayout : 0;
    site.mapProgressEarned = outcome === "success"
      ? site.rewards.mapProgress
      : outcome === "partial"
        ? site.rewards.partialMapProgress
        : 0;
    next.survey.value += site.payoutEarned;
    next.survey.mapProgress = Number((next.survey.mapProgress + site.mapProgressEarned).toFixed(2));
    next.survey.lastAction = `${site.name} ${outcome}`;
    next.log.unshift({
      tick: next.tick,
      message: `${site.name} chart ${outcome}: +${site.payoutEarned}cr / +${site.mapProgressEarned} map.`,
    });
    if (next.oxygen.current <= 0) {
      next.run.status = "failed";
      next.run.failureReason = "survey oxygen loss";
      next.run.objective = "Survey overran the oxygen reserve. Restart from the lift.";
    }
    return syncDerivedState(next);
  }

  function activateAirCache(state, siteId = null) {
    const next = syncDerivedState(clone(state));
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    const target = surveyActionTarget(next, siteId);
    if (!target.inRange) {
      return recordSurveyMiss(next, target, "Air cache");
    }
    const site = target.site;
    if (!site.airCacheState || site.airCacheState.status === "none") {
      next.survey.lastAction = "no air cache";
      site.lastAction = next.survey.lastAction;
      return syncDerivedState(next);
    }
    if (site.airCacheState.status === "depleted") {
      next.survey.lastAction = "air cache depleted";
      site.lastAction = next.survey.lastAction;
      return syncDerivedState(next);
    }
    const restored = site.airCacheState.oxygenRestore;
    next.oxygen.current = Math.min(next.oxygen.max, Number((next.oxygen.current + restored).toFixed(3)));
    site.airCacheState.status = "depleted";
    site.lastAction = "air cache activated";
    next.survey.airCachesUsed += 1;
    next.survey.lastAction = `air cache: ${site.id}`;
    next.log.unshift({ tick: next.tick, message: `${site.name} air cache restored ${restored} oxygen.` });
    return syncDerivedState(next);
  }

  function pumpworksActionTarget(state, siteId = null) {
    const site = siteId
      ? (state.pumpworksSites || []).find((entry) => entry.id === siteId)
      : nearestPumpworksSite(state, { includeCompleted: true })?.site;
    if (!site) {
      return { site: null, distance: Infinity, inRange: false };
    }
    const siteDistance = distance(state.player.position, site.position);
    return {
      site,
      distance: siteDistance,
      inRange: siteDistance <= GAME_DATA.pumpworks.actionRange,
    };
  }

  function recordPumpworksMiss(next, target, action) {
    const message = target.site
      ? `${action} needs ${target.site.name} within ${GAME_DATA.pumpworks.actionRange}m.`
      : `No pumpworks station available for ${action}.`;
    next.pumpworks.lastAction = "out of range";
    next.log.unshift({ tick: next.tick, message });
    return syncDerivedState(next);
  }

  function pumpworksActionCost(state, site, action) {
    let cost = site.oxygenCost[action] || 0;
    const linkedSurvey = surveySiteForPumpworks(state, site);
    if (linkedSurvey && linkedSurvey.airCacheState && linkedSurvey.airCacheState.status === "depleted") {
      cost = Math.max(1, Math.round(cost * 0.78));
    }
    return cost;
  }

  function spendPumpworksOxygen(next, site, action) {
    const cost = pumpworksActionCost(next, site, action);
    next.oxygen.current = Math.max(0, Number((next.oxygen.current - cost).toFixed(3)));
    if (next.oxygen.current <= 0) {
      next.run.status = "failed";
      next.run.failureReason = "pumpworks oxygen loss";
      next.run.objective = "Flood pressure overran the oxygen reserve. Restart from the lift.";
    }
    return cost;
  }

  function applyPumpworksOutcome(next, site, outcome) {
    const success = outcome === "success";
    const partial = outcome === "partial";
    site.drainageState = outcome;
    site.outcome = outcome;
    site.valveState = success ? "regulated" : partial ? "choked" : "overrun";
    site.floodLevel = success
      ? site.flood.drainedLevel
      : partial
        ? site.flood.partialLevel
        : site.flood.surgeLevel;
    site.payoutEarned = success ? site.rewards.payout : partial ? site.rewards.partialPayout : 0;
    site.mapProgressEarned = success ? site.rewards.mapProgress : partial ? site.rewards.partialMapProgress : 0;
    site.pressureReliefEarned = success
      ? site.rewards.pressureRelief
      : partial
        ? Math.round(site.rewards.pressureRelief / 2)
        : 0;
    next.pumpworks.value += site.payoutEarned;
    next.pumpworks.mapProgress = Number((next.pumpworks.mapProgress + site.mapProgressEarned).toFixed(2));
    next.pumpworks.pressureRelief += site.pressureReliefEarned;
    if (partial && next.cargo.value > 0) {
      const penalty = Math.min(next.cargo.value, site.consequences.sampleValuePenalty || 0);
      next.cargo.value -= penalty;
      site.lastAction = `valve partial, sample value bled ${penalty}cr`;
    } else {
      site.lastAction = `valve ${outcome}`;
    }
    next.pumpworks.lastAction = `${site.name} ${outcome}`;
    return { payout: site.payoutEarned, mapProgress: site.mapProgressEarned };
  }

  function primePumpStation(state, siteId = null) {
    const next = syncDerivedState(clone(state));
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    const target = pumpworksActionTarget(next, siteId);
    if (!target.inRange) {
      return recordPumpworksMiss(next, target, "Pump prime");
    }
    const site = target.site;
    if (site.pumpPrimed) {
      next.pumpworks.lastAction = "pump already primed";
      site.lastAction = next.pumpworks.lastAction;
      return syncDerivedState(next);
    }
    const requirements = pumpworksRequirementStatus(next, site);
    const windowState = pumpworksWindowState(site, next.elapsed || 0);
    spendPumpworksOxygen(next, site, windowState === "overrun" ? "failure" : "prime");
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    if (windowState === "overrun") {
      site.pumpState = "jammed";
      site.drainageState = "failed";
      site.outcome = "failed";
      site.floodLevel = site.flood.surgeLevel;
      site.lastAction = "prime failed";
      next.pumpworks.lastAction = `prime failed: ${site.id}`;
      next.log.unshift({ tick: next.tick, message: `${site.name} pump jammed after the flood pulse.` });
      return syncDerivedState(next);
    }
    if (!requirements.ready || windowState === "flood") {
      site.pumpState = "misaligned";
      site.pumpPrimed = false;
      site.lastMissing = requirements.missing;
      site.floodLevel = Math.min(site.flood.surgeLevel, Number((site.flood.baseLevel + 0.08).toFixed(2)));
      site.lastAction = `prime partial: ${requirements.missing.join(", ") || windowState}`;
      next.pumpworks.lastAction = `prime partial: ${site.id}`;
      next.log.unshift({
        tick: next.tick,
        message: `${site.name} pump prime partial; ${requirements.missing.join(", ") || "flood pulse"} still unsettled.`,
      });
      return syncDerivedState(next);
    }
    site.pumpPrimed = true;
    site.pumpState = windowState === "surge" ? "surge primed" : "primed";
    site.floodLevel = Math.max(site.flood.partialLevel, Number((site.floodLevel - 0.16).toFixed(2)));
    site.lastMissing = [];
    site.lastAction = "pump primed";
    next.pumpworks.lastAction = `pump primed: ${site.id}`;
    next.log.unshift({ tick: next.tick, message: `${site.name} primed against ${site.valveId}.` });
    return syncDerivedState(next);
  }

  function deploySiphonCharge(state, siteId = null) {
    const next = syncDerivedState(clone(state));
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    const target = pumpworksActionTarget(next, siteId);
    if (!target.inRange) {
      return recordPumpworksMiss(next, target, "Siphon charge");
    }
    const site = target.site;
    if (site.siphonDeployed) {
      next.pumpworks.lastAction = "siphon already deployed";
      site.lastAction = next.pumpworks.lastAction;
      return syncDerivedState(next);
    }
    if (next.pumpworks.siphons <= 0) {
      next.pumpworks.lastAction = "no siphon charges";
      next.log.unshift({ tick: next.tick, message: "No siphon charges remain." });
      return syncDerivedState(next);
    }
    spendPumpworksOxygen(next, site, "siphon");
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    next.pumpworks.siphons -= 1;
    site.siphonDeployed = true;
    site.floodLevel = Math.max(site.flood.partialLevel, Number((site.floodLevel - 0.12).toFixed(2)));
    site.lastAction = "siphon deployed";
    next.pumpworks.lastAction = `siphon deployed: ${site.id}`;
    next.log.unshift({ tick: next.tick, message: `${site.name} siphon charge set in ${site.chamber}.` });
    return syncDerivedState(next);
  }

  function sealLeakSeam(state, siteId = null) {
    const next = syncDerivedState(clone(state));
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    const target = pumpworksActionTarget(next, siteId);
    if (!target.inRange) {
      return recordPumpworksMiss(next, target, "Leak seal");
    }
    const site = target.site;
    if (site.leakSealed) {
      next.pumpworks.lastAction = "leak already sealed";
      site.lastAction = next.pumpworks.lastAction;
      return syncDerivedState(next);
    }
    const requirements = pumpworksRequirementStatus(next, site, { forLeak: true });
    if (!requirements.ready) {
      site.lastMissing = requirements.missing;
      site.lastAction = `leak seal blocked: ${requirements.missing.join(", ")}`;
      next.pumpworks.lastAction = "leak seal blocked";
      next.log.unshift({ tick: next.tick, message: `${site.name} leak seam needs ${requirements.missing.join(" + ")}.` });
      return syncDerivedState(next);
    }
    spendPumpworksOxygen(next, site, "seal");
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    site.leakSealed = true;
    site.floodLevel = Math.max(site.flood.partialLevel, Number((site.floodLevel - 0.1).toFixed(2)));
    site.lastMissing = [];
    site.lastAction = "leak sealed";
    next.pumpworks.lastAction = `leak sealed: ${site.id}`;
    next.log.unshift({ tick: next.tick, message: `${site.name} leak seam sealed before the valve turn.` });
    return syncDerivedState(next);
  }

  function turnPressureValve(state, siteId = null) {
    const next = syncDerivedState(clone(state));
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    const target = pumpworksActionTarget(next, siteId);
    if (!target.inRange) {
      return recordPumpworksMiss(next, target, "Pressure valve");
    }
    const site = target.site;
    if (pumpworksOutcomeComplete(site)) {
      next.pumpworks.lastAction = `already drained: ${site.drainageState}`;
      site.lastAction = next.pumpworks.lastAction;
      return syncDerivedState(next);
    }
    const windowState = pumpworksWindowState(site, next.elapsed || 0);
    const requirements = pumpworksRequirementStatus(next, site, { requireSiphon: true });
    const routeStable = next.route.returnConfidence >= 35 && next.routeStability.stability >= 35;
    let outcome = "partial";
    if (windowState === "overrun" || !site.pumpPrimed) {
      outcome = "failed";
    } else if (
      requirements.ready &&
      routeStable &&
      (windowState === "drain" || (windowState === "surge" && site.leakSealed))
    ) {
      outcome = "success";
    }

    spendPumpworksOxygen(next, site, outcome === "failed" ? "failure" : "valve");
    if (next.run.status !== "active" && outcome !== "success") {
      site.drainageState = "failed";
      site.outcome = "failed";
      return syncDerivedState(next);
    }
    const reward = applyPumpworksOutcome(next, site, outcome);
    site.lastMissing = requirements.missing;
    next.log.unshift({
      tick: next.tick,
      message: `${site.name} pressure valve ${outcome}: +${reward.payout}cr / +${reward.mapProgress} map.`,
    });
    if (outcome === "failed") {
      next.run.objective = next.oxygen.current <= 0
        ? next.run.objective
        : "A flood pulse locked the pumpworks route. Return or restart before oxygen runs out.";
    }
    return syncDerivedState(next);
  }

  function mineNearestSample(state, deltaSeconds = 1) {
    const next = clone(state);
    if (next.run.status !== "active") {
      return syncDerivedState(next);
    }
    const closest = nearestSample(next);
    next.mining.active = true;
    next.mining.lastYield = 0;
    if (!closest || closest.distance > next.mining.range) {
      next.mining.targetId = closest ? closest.node.id : null;
      next.mining.status = closest ? "out of range" : "no sample";
      return syncDerivedState(next);
    }
    if (next.cargo.samples >= next.cargo.capacity) {
      next.mining.targetId = closest.node.id;
      next.mining.status = "cargo full";
      return syncDerivedState(next);
    }

    const node = next.sampleNodes.find((entry) => entry.id === closest.node.id);
    node.mineState.progress += next.mining.drillPower * deltaSeconds;
    next.mining.targetId = node.id;
    next.mining.status = "cutting";

    while (
      node.mineState.progress >= node.difficulty &&
      node.remaining > 0 &&
      next.cargo.samples < next.cargo.capacity
    ) {
      const yieldValue = node.value + sampleSurveyValueBonus(next, node) + samplePumpworksValueBonus(next, node);
      node.mineState.progress -= node.difficulty;
      node.remaining -= 1;
      node.mineState.lastYield = yieldValue;
      next.mining.lastYield += yieldValue;
      next.cargo.samples += 1;
      next.cargo.value += yieldValue;
    }

    if (node.remaining <= 0) {
      node.mineState.status = "depleted";
      node.mineState.depleted = true;
      node.mineState.progress = 0;
      next.mining.status = "sample secured";
    } else if (next.mining.lastYield > 0) {
      node.mineState.status = "parted";
      next.mining.status = "sample secured";
    } else {
      node.mineState.status = "cutting";
    }
    return syncDerivedState(next);
  }

  function pulseScanner(state) {
    const next = syncDerivedState(clone(state));
    if (next.scanner.cooldown <= 0) {
      next.scanner.cooldown = GAME_DATA.scanner.cooldownSeconds;
      next.scanner.pulseAge = 0;
      next.scanner.lastPulse = {
        targetId: next.scanner.targetId,
        targetKind: next.scanner.targetKind,
        targetName: next.scanner.targetName,
        targetBearing: next.scanner.targetBearing,
        targetDistance: next.scanner.targetDistance,
        routeBearing: next.scanner.routeBearing,
        routeConfidence: next.route.returnConfidence,
        routeStability: next.routeStability.stability,
        surveySiteId: next.survey.activeSiteId,
        surveyWindow: next.survey.activeSiteWindow,
        surveyStatus: next.survey.activeSiteStatus,
        pumpworksSiteId: next.pumpworks.activeSiteId,
        pumpworksWindow: next.pumpworks.activeSiteWindow,
        pumpworksStatus: next.pumpworks.activeSiteStatus,
        pumpworksFloodLevel: next.pumpworks.floodLevel,
      };
      next.log.unshift({
        tick: next.tick,
        message: `Scanner pulse: ${next.scanner.targetName} ${formatBearing(next.scanner.targetBearing)}.`,
      });
    }
    return syncDerivedState(next);
  }

  function returnToLift(state) {
    const next = clone(state);
    next.lift.distance = distance(next.player.position, next.lift.position);
    if (next.lift.distance > next.lift.radius) {
      next.lift.status = "too far";
      const synced = syncDerivedState(next);
      synced.lift.status = "too far";
      return synced;
    }
    const bankedValue = next.cargo.value;
    const bankedSamples = next.cargo.samples;
    const bankedSurveyValue = next.survey ? next.survey.value : 0;
    const bankedMapProgress = next.survey ? next.survey.mapProgress : 0;
    const bankedPumpworksValue = next.pumpworks ? next.pumpworks.value : 0;
    const bankedPumpworksMapProgress = next.pumpworks ? next.pumpworks.mapProgress : 0;
    next.credits += bankedValue + bankedSurveyValue + bankedPumpworksValue;
    next.lift.bankedSamples += bankedSamples;
    next.lift.bankedSurveyValue += bankedSurveyValue;
    next.lift.bankedMapProgress = Number((next.lift.bankedMapProgress + bankedMapProgress).toFixed(2));
    next.lift.bankedPumpworksValue += bankedPumpworksValue;
    next.lift.bankedPumpworksMapProgress = Number((next.lift.bankedPumpworksMapProgress + bankedPumpworksMapProgress).toFixed(2));
    next.lift.lastBanked = bankedValue + bankedSurveyValue + bankedPumpworksValue;
    next.cargo.samples = 0;
    next.cargo.value = 0;
    if (next.survey) {
      next.survey.ledger = Number((next.survey.ledger + bankedMapProgress).toFixed(2));
      next.survey.value = 0;
      next.survey.mapProgress = 0;
    }
    if (next.pumpworks) {
      next.pumpworks.ledger = Number((next.pumpworks.ledger + bankedPumpworksMapProgress).toFixed(2));
      next.pumpworks.value = 0;
      next.pumpworks.mapProgress = 0;
    }
    const bankedRunValue =
      bankedSamples > 0 ||
      bankedSurveyValue > 0 ||
      bankedMapProgress > 0 ||
      bankedPumpworksValue > 0 ||
      bankedPumpworksMapProgress > 0;
    next.run.status = bankedRunValue ? "extracted" : "active";
    next.run.completeReason = bankedRunValue ? "samples, survey, or pumpworks banked" : null;
    next.run.objective = bankedRunValue ? "Drainage, survey, and samples banked. Buy an upgrade or restart for another descent." : next.run.objective;
    next.log.unshift({
      tick: next.tick,
      message: `Lift banked ${bankedSamples} sample(s), ${bankedMapProgress + bankedPumpworksMapProgress} map, and ${bankedValue + bankedSurveyValue + bankedPumpworksValue}cr.`,
    });
    return syncDerivedState(next);
  }

  function nextAffordableUpgrade(state) {
    return GAME_DATA.upgrades.find((upgrade) => !state.upgrades.purchased.includes(upgrade.id)) || null;
  }

  function purchaseUpgrade(state, upgradeId) {
    const next = clone(state);
    const upgrade = GAME_DATA.upgrades.find((entry) => entry.id === upgradeId) || nextAffordableUpgrade(next);
    if (!upgrade) {
      next.upgrades.lastPurchase = "complete";
      return syncDerivedState(next);
    }
    if (next.upgrades.purchased.includes(upgrade.id)) {
      next.upgrades.lastPurchase = "already owned";
      return syncDerivedState(next);
    }
    if (next.credits < upgrade.cost) {
      next.upgrades.lastPurchase = "insufficient credits";
      return syncDerivedState(next);
    }
    next.credits -= upgrade.cost;
    next.upgrades.purchased.push(upgrade.id);
    next.upgrades.carryover = upgradeCarryover(next.upgrades.purchased);
    next.upgrades.lastPurchase = upgrade.id;
    next.log.unshift({ tick: next.tick, message: `${upgrade.name} purchased.` });
    return syncDerivedState(next);
  }

  function resetRun(state) {
    const next = createInitialState({
      seed: state.seed,
      credits: state.credits,
      upgrades: state.upgrades.purchased,
      runCount: state.run.count + 1,
      surveyLedger: state.survey ? state.survey.ledger : 0,
      pumpworksLedger: state.pumpworks ? state.pumpworks.ledger : 0,
    });
    next.log.unshift({ tick: 0, message: `Run ${next.run.count} initialized with carryover.` });
    return syncDerivedState(next);
  }

  function stepRun(state, controls = {}, deltaSeconds = 1 / 60) {
    let next = clone(state);
    const delta = Math.max(0, Math.min(deltaSeconds, 0.25));
    if (controls.reset) {
      return resetRun(next);
    }
    if (controls.scan) {
      next = pulseScanner(next);
    }
    if (controls.placeLantern) {
      next = placeLantern(next);
    }
    if (controls.plantStake) {
      next = plantSurveyStake(next);
    }
    if (controls.braceSeam) {
      next = braceSurveySite(next);
    }
    if (controls.chartSurvey) {
      next = chartFaultSurvey(next);
    }
    if (controls.airCache) {
      next = activateAirCache(next);
    }
    if (controls.primePump) {
      next = primePumpStation(next);
    }
    if (controls.deploySiphon) {
      next = deploySiphonCharge(next);
    }
    if (controls.sealLeak) {
      next = sealLeakSeam(next);
    }
    if (controls.turnValve) {
      next = turnPressureValve(next);
    }
    if (controls.interact) {
      next = returnToLift(next);
    }
    if (controls.upgrade) {
      next = purchaseUpgrade(next);
    }
    if (next.run.status === "active") {
      next.tick += 1;
      next.elapsed += delta;
      next = applyMovement(next, controls, delta);
      if (controls.mine) {
        next = mineNearestSample(next, delta);
      } else {
        next.mining.active = false;
        next.mining.status = "idle";
        next.mining.lastYield = 0;
      }
      next.scanner.cooldown = Math.max(0, next.scanner.cooldown - delta);
      next.scanner.pulseAge += delta;
      next = syncDerivedState(next);
      next.oxygen.current = Math.max(0, Number((next.oxygen.current - next.oxygen.lastDrainPerSecond * delta).toFixed(3)));
      if (next.oxygen.current <= 0) {
        next.run.status = "failed";
        next.run.failureReason = "oxygen depleted";
        next.run.objective = "Oxygen depleted. Restart from the lift.";
        next.player.velocity = vector();
      }
    }
    return syncDerivedState(next);
  }

  function cacheDom() {
    const ids = [
      "iron-lantern-descent",
      "iron-lantern-scene",
      "run-status",
      "objective-readout",
      "oxygen-readout",
      "light-readout",
      "lantern-readout",
      "samples-readout",
      "credits-readout",
      "lift-readout",
      "route-readout",
      "survey-readout",
      "stability-readout",
      "pumpworks-readout",
      "flood-readout",
      "valve-readout",
      "drainage-readout",
      "scanner-readout",
      "tremor-readout",
      "map-readout",
      "hazard-readout",
      "upgrade-readout",
      "player-position-readout",
      "player-facing-readout",
      "collision-readout",
      "mining-readout",
      "target-name",
      "survey-site-list",
      "pumpworks-site-list",
      "sample-list",
      "event-log",
      "lantern-action",
      "mine-action",
      "scan-action",
      "stake-action",
      "brace-action",
      "chart-action",
      "cache-action",
      "pump-action",
      "valve-action",
      "siphon-action",
      "seal-action",
      "lift-action",
      "upgrade-action",
      "restart-action",
    ];
    ids.forEach((id) => {
      dom[id] = document.getElementById(id);
    });
    dom.root = dom["iron-lantern-descent"];
    dom.canvas = dom["iron-lantern-scene"];
  }

  function setReadoutTone(element, tone) {
    const readout = element ? element.closest(".readout") : null;
    if (readout) {
      if (tone) {
        readout.dataset.tone = tone;
      } else {
        delete readout.dataset.tone;
      }
    }
  }

  function formatSurveyWindow(site, elapsed) {
    const windowState = site.windowState || surveySiteWindowState(site, elapsed || 0);
    const window = site.tremorWindow || {};
    if (windowState === "pending") {
      return `opens in ${Math.max(0, Math.ceil(window.opensAt - elapsed))}s`;
    }
    if (windowState === "stable") {
      return `stable ${Math.max(0, Math.ceil(window.closesAt - elapsed))}s`;
    }
    if (windowState === "tremor") {
      return `tremor ${Math.max(0, Math.ceil(window.collapseAt - elapsed))}s`;
    }
    return "collapsed";
  }

  function activeSurveySite(state) {
    return state.surveySites.find((site) => site.id === state.survey.activeSiteId) ||
      nearestSurveySite(state, { includeCompleted: true })?.site ||
      null;
  }

  function surveyRequirementText(site) {
    const stake = site.stakePlanted ? "stake set" : "stake open";
    const brace = site.requirements.brace
      ? site.braceInstalled
        ? "brace locked"
        : "brace needed"
      : "brace none";
    const cache = site.airCacheState && site.airCacheState.status !== "none"
      ? `cache ${site.airCacheState.status}`
      : "cache none";
    return `${stake} / ${brace} / ${cache}`;
  }

  function formatPumpworksWindow(site, elapsed) {
    const windowState = site.windowState || pumpworksWindowState(site, elapsed || 0);
    const window = site.pressureWindow || {};
    if (windowState === "pending") {
      return `opens in ${Math.max(0, Math.ceil(window.opensAt - elapsed))}s`;
    }
    if (windowState === "drain") {
      return `drain ${Math.max(0, Math.ceil(window.closesAt - elapsed))}s`;
    }
    if (windowState === "surge") {
      return `surge ${Math.max(0, Math.ceil(window.surgeAt - elapsed))}s`;
    }
    if (windowState === "flood") {
      return `flood ${Math.max(0, Math.ceil(window.failAt - elapsed))}s`;
    }
    return "overrun";
  }

  function activePumpworksSite(state) {
    return state.pumpworksSites.find((site) => site.id === state.pumpworks.activeSiteId) ||
      nearestPumpworksSite(state, { includeCompleted: true })?.site ||
      null;
  }

  function pumpworksRequirementText(state, site) {
    const requirements = pumpworksRequirementStatus(state, site, { requireSiphon: true });
    if (requirements.ready) {
      return "requirements clear";
    }
    return `needs ${requirements.missing.join(" + ")}`;
  }

  function pumpworksLineText(site) {
    const flood = `${Math.round((site.floodLevel || 0) * 100)}% flood`;
    const pump = site.pumpPrimed ? "pump primed" : `pump ${site.pumpState}`;
    const valve = `${site.valveId.replace("valve-", "")} ${site.valveState}`;
    const leak = site.leakSealed ? "leak sealed" : "leak open";
    const siphon = site.siphonDeployed
      ? "siphon set"
      : site.requirements.siphon
        ? "siphon needed"
        : "siphon optional";
    return [flood, pump, valve, leak, siphon];
  }

  function renderHud(state) {
    if (!dom.root) {
      return;
    }
    const oxygenPercent = state.oxygen.current / state.oxygen.max;
    const upgrade = nextAffordableUpgrade(state);
    const hazardNames = state.hazardZones.filter((zone) => zone.active).map((zone) => zone.name);
    const nearest = nearestSample(state);
    const activeSite = activeSurveySite(state);
    const activePump = activePumpworksSite(state);
    const surveyTarget = activeSite
      ? `${activeSite.name} / ${activeSite.status} / ${Math.round(activeSite.distance || 0)}m`
      : "survey complete";
    const tremorText = activeSite ? `${formatSurveyWindow(activeSite, state.elapsed)} / ${activeSite.faultType}` : "window clear";
    const pumpworksTarget = activePump
      ? `${activePump.name} / ${activePump.status} / ${Math.round(activePump.distance || 0)}m`
      : "pumpworks drained";
    const floodText = activePump
      ? `${Math.round(state.pumpworks.floodLevel * 100)}% avg / ${formatPumpworksWindow(activePump, state.elapsed)}`
      : "drained";
    const valveText = activePump
      ? `${activePump.valveId.replace("valve-", "")} / ${activePump.valveState} / ${state.routeStability.pressure}p`
      : `${state.routeStability.pressure}p`;
    const drainageText = `${state.pumpworks.completedSites} / ${state.pumpworks.contract.targetDrainedSites} sites  ${state.pumpworks.mapProgress + state.pumpworks.ledger} / ${state.pumpworks.contract.targetMapProgress} map  siphon ${state.pumpworks.siphons}`;
    const targetName = state.scanner.targetKind === "pumpworks" && activePump
      ? activePump.name
      : state.scanner.targetKind === "survey" && activeSite
        ? activeSite.name
        : nearest
          ? nearest.node.name
          : "Iron Lift";
    dom["run-status"].textContent = `${state.run.status} / ${state.renderer.status}`;
    dom["objective-readout"].textContent = state.run.objective;
    dom["oxygen-readout"].textContent = `${Math.ceil(state.oxygen.current)} / ${state.oxygen.max}  -${state.oxygen.lastDrainPerSecond.toFixed(1)}/s`;
    dom["light-readout"].textContent = `${state.light.status} / ${state.light.currentRadius}m`;
    dom["lantern-readout"].textContent = `${state.lanterns.charges} / ${state.lanterns.max}  ${state.lanterns.anchors.length} set`;
    dom["samples-readout"].textContent = `${state.cargo.samples} / ${state.cargo.capacity}  ${state.cargo.value}cr`;
    dom["credits-readout"].textContent = `${state.credits}cr`;
    dom["lift-readout"].textContent = `${formatBearing(state.lift.bearing)} / ${Math.round(state.lift.distance)}m`;
    dom["route-readout"].textContent = `${state.route.status} / ${state.route.returnConfidence}%  ${state.route.suggestedAction}`;
    dom["survey-readout"].textContent = surveyTarget;
    dom["stability-readout"].textContent = `${state.routeStability.status} / ${state.routeStability.stability}% / ${state.routeStability.pressure}p`;
    dom["pumpworks-readout"].textContent = pumpworksTarget;
    dom["flood-readout"].textContent = floodText;
    dom["valve-readout"].textContent = valveText;
    dom["drainage-readout"].textContent = drainageText;
    dom["scanner-readout"].textContent = state.scanner.status;
    dom["tremor-readout"].textContent = tremorText;
    dom["map-readout"].textContent = `${state.survey.mapProgress + state.survey.ledger} / ${state.survey.contract.targetMapProgress} map  ${state.survey.value}cr`;
    dom["hazard-readout"].textContent = hazardNames.length ? hazardNames.join(" + ") : "clear";
    dom["upgrade-readout"].textContent = upgrade ? `${upgrade.name.toLowerCase()} / ${upgrade.cost}cr` : "all fitted";
    dom["player-position-readout"].textContent = `pos ${state.player.position.x.toFixed(1)} / ${state.player.position.z.toFixed(1)}`;
    dom["player-facing-readout"].textContent = formatBearing(bearingTo(state.player.position, {
      x: state.player.position.x + directionFromFacing(state.player.facing).x,
      y: state.player.position.y,
      z: state.player.position.z + directionFromFacing(state.player.facing).z,
    }));
    dom["collision-readout"].textContent = state.movement.collision.lastBlocked
      ? `blocked / ${state.movement.collision.lastPassage}`
      : `clear / ${state.movement.collision.lastPassage}`;
    dom["mining-readout"].textContent = state.mining.status;
    dom["target-name"].textContent = targetName;

    setReadoutTone(dom["oxygen-readout"], oxygenPercent < 0.2 ? "danger" : oxygenPercent < 0.45 ? "warn" : null);
    setReadoutTone(dom["hazard-readout"], hazardNames.length ? "danger" : null);
    setReadoutTone(dom["lantern-readout"], state.lanterns.charges <= 0 ? "warn" : null);
    setReadoutTone(dom["route-readout"], state.route.returnConfidence < 35 ? "danger" : state.route.returnConfidence < 70 ? "warn" : "signal");
    setReadoutTone(dom["survey-readout"], activeSite && activeSite.inRange ? "signal" : null);
    setReadoutTone(dom["stability-readout"], state.routeStability.stability < 35 ? "danger" : state.routeStability.stability < 65 ? "warn" : "signal");
    setReadoutTone(dom["pumpworks-readout"], activePump && activePump.inRange ? "signal" : null);
    setReadoutTone(dom["flood-readout"], activePump && (activePump.windowState === "flood" || activePump.windowState === "overrun") ? "danger" : activePump && activePump.windowState === "surge" ? "warn" : null);
    setReadoutTone(dom["valve-readout"], activePump && activePump.drainageState === "success" ? "signal" : activePump && activePump.valveState === "overrun" ? "danger" : null);
    setReadoutTone(dom["drainage-readout"], state.pumpworks.completedSites > 0 ? "signal" : null);
    setReadoutTone(dom["tremor-readout"], activeSite && activeSite.windowState === "collapsed" ? "danger" : activeSite && activeSite.windowState === "tremor" ? "warn" : null);

    dom["survey-site-list"].replaceChildren(
      ...state.surveySites.map((site) => {
        const item = document.createElement("li");
        item.dataset.window = site.windowState;
        item.dataset.status = site.chartState;
        const line = document.createElement("div");
        line.className = "survey-line";
        const name = document.createElement("strong");
        name.textContent = site.name;
        const passage = document.createElement("span");
        passage.textContent = `${site.passageId} / ${Math.round(site.distance || 0)}m`;
        line.append(name, passage);
        const meta = document.createElement("div");
        meta.className = "survey-meta";
        [site.faultType, site.status, formatSurveyWindow(site, state.elapsed), surveyRequirementText(site), `+${site.rewards.payout}cr / +${site.rewards.mapProgress} map`].forEach((text) => {
          const part = document.createElement("span");
          part.textContent = text;
          meta.append(part);
        });
        item.append(line, meta);
        return item;
      })
    );

    dom["pumpworks-site-list"].replaceChildren(
      ...state.pumpworksSites.map((site) => {
        const item = document.createElement("li");
        item.dataset.window = site.windowState;
        item.dataset.state = site.drainageState;
        const line = document.createElement("div");
        line.className = "pumpworks-line";
        const name = document.createElement("strong");
        name.textContent = site.name;
        const passage = document.createElement("span");
        passage.textContent = `${site.passageId} / ${Math.round(site.distance || 0)}m`;
        line.append(name, passage);
        const meta = document.createElement("div");
        meta.className = "pumpworks-meta";
        [
          formatPumpworksWindow(site, state.elapsed),
          ...pumpworksLineText(site),
          pumpworksRequirementText(state, site),
          `+${site.rewards.payout}cr / +${site.rewards.mapProgress} map`,
        ].forEach((text) => {
          const part = document.createElement("span");
          part.textContent = text;
          meta.append(part);
        });
        item.append(line, meta);
        return item;
      })
    );

    dom["sample-list"].replaceChildren(
      ...state.sampleNodes.map((node) => {
        const item = document.createElement("li");
        const progress = node.mineState.depleted
          ? "done"
          : `${Math.round(clamp((node.mineState.progress / node.difficulty) * 100, 0, 99))}%`;
        item.dataset.state = node.mineState.status;
        item.textContent = `${node.name}: ${node.mineState.status} / ${node.remaining} / ${progress}`;
        return item;
      })
    );

    dom["event-log"].replaceChildren(
      ...state.log.slice(0, 5).map((entry) => {
        const item = document.createElement("li");
        item.textContent = `${String(entry.tick).padStart(3, "0")} / ${entry.message}`;
        return item;
      })
    );
  }

  function controlForCode(code) {
    return Object.entries(GAME_DATA.controls).find(([, codes]) => codes.includes(code))?.[0] || null;
  }

  function bindControls() {
    window.addEventListener("keydown", (event) => {
      const control = controlForCode(event.code);
      if (!control) {
        return;
      }
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
      if (control === "placeLantern") {
        currentState = placeLantern(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "scan") {
        currentState = pulseScanner(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "plantStake") {
        currentState = plantSurveyStake(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "braceSeam") {
        currentState = braceSurveySite(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "chartSurvey") {
        currentState = chartFaultSurvey(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "airCache") {
        currentState = activateAirCache(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "primePump") {
        currentState = primePumpStation(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "deploySiphon") {
        currentState = deploySiphonCharge(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "sealLeak") {
        currentState = sealLeakSeam(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "turnValve") {
        currentState = turnPressureValve(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "interact") {
        currentState = returnToLift(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "upgrade") {
        currentState = purchaseUpgrade(currentState);
        renderHud(currentState);
        return;
      }
      if (control === "reset") {
        currentState = resetRun(currentState);
        renderHud(currentState);
        return;
      }
      pressedControls[control] = true;
    });
    window.addEventListener("keyup", (event) => {
      const control = controlForCode(event.code);
      if (control) {
        pressedControls[control] = false;
      }
    });

    dom["lantern-action"].addEventListener("click", () => {
      currentState = placeLantern(currentState);
      renderHud(currentState);
    });
    dom["mine-action"].addEventListener("click", () => {
      currentState = mineNearestSample(currentState, 1.2);
      renderHud(currentState);
    });
    dom["scan-action"].addEventListener("click", () => {
      currentState = pulseScanner(currentState);
      renderHud(currentState);
    });
    dom["stake-action"].addEventListener("click", () => {
      currentState = plantSurveyStake(currentState);
      renderHud(currentState);
    });
    dom["brace-action"].addEventListener("click", () => {
      currentState = braceSurveySite(currentState);
      renderHud(currentState);
    });
    dom["chart-action"].addEventListener("click", () => {
      currentState = chartFaultSurvey(currentState);
      renderHud(currentState);
    });
    dom["cache-action"].addEventListener("click", () => {
      currentState = activateAirCache(currentState);
      renderHud(currentState);
    });
    dom["pump-action"].addEventListener("click", () => {
      currentState = primePumpStation(currentState);
      renderHud(currentState);
    });
    dom["valve-action"].addEventListener("click", () => {
      currentState = turnPressureValve(currentState);
      renderHud(currentState);
    });
    dom["siphon-action"].addEventListener("click", () => {
      currentState = deploySiphonCharge(currentState);
      renderHud(currentState);
    });
    dom["seal-action"].addEventListener("click", () => {
      currentState = sealLeakSeam(currentState);
      renderHud(currentState);
    });
    dom["lift-action"].addEventListener("click", () => {
      currentState = returnToLift(currentState);
      renderHud(currentState);
    });
    dom["upgrade-action"].addEventListener("click", () => {
      currentState = purchaseUpgrade(currentState);
      renderHud(currentState);
    });
    dom["restart-action"].addEventListener("click", () => {
      currentState = resetRun(currentState);
      renderHud(currentState);
    });

    dom.canvas.addEventListener("click", () => {
      dom.root.focus();
      if (dom.canvas.requestPointerLock) {
        dom.canvas.requestPointerLock();
      }
    });
    dom.canvas.addEventListener("mousedown", () => {
      mouseDrag = true;
    });
    window.addEventListener("mouseup", () => {
      mouseDrag = false;
    });
    window.addEventListener("mousemove", (event) => {
      const locked = document.pointerLockElement === dom.canvas;
      if (!currentState || (!locked && !mouseDrag)) {
        return;
      }
      currentState.player.facing = normalizeAngle(currentState.player.facing + event.movementX * 0.0024);
      currentState = syncDerivedState(currentState);
    });
  }

  function configureTexture(THREE, texture, options = {}) {
    if (!texture) {
      return null;
    }
    if ("colorSpace" in texture && THREE.SRGBColorSpace) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    if (options.repeat) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(options.repeat.x, options.repeat.y);
    }
    texture.anisotropy = options.anisotropy || 4;
    texture.needsUpdate = true;
    return texture;
  }

  function loadTexture(THREE, loader, path, options = {}) {
    return new Promise((resolve) => {
      const texture = loader.load(
        path,
        () => resolve(configureTexture(THREE, texture, options)),
        undefined,
        () => resolve(null)
      );
    });
  }

  function loadSceneAssets(THREE) {
    const loader = new THREE.TextureLoader();
    return Promise.all([
      loadTexture(THREE, loader, ASSET_PATHS.lanternAnchor),
      loadTexture(THREE, loader, ASSET_PATHS.mineralVeinMaterial, { repeat: { x: 2.4, y: 2.4 }, anisotropy: 6 }),
      loadTexture(THREE, loader, ASSET_PATHS.drillTool),
      loadTexture(THREE, loader, ASSET_PATHS.arcadeTitleCard),
    ]).then(([lanternAnchor, mineralVeinMaterial, drillTool, arcadeTitleCard]) => ({
      lanternAnchor,
      mineralVeinMaterial,
      drillTool,
      arcadeTitleCard,
    }));
  }

  function createCaveGroup(THREE, assets = {}) {
    const group = new THREE.Group();
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x111713,
      map: assets.mineralVeinMaterial || null,
      emissive: 0x061411,
      emissiveMap: assets.mineralVeinMaterial || null,
      emissiveIntensity: assets.mineralVeinMaterial ? 0.08 : 0,
      roughness: 0.92,
      metalness: 0.05,
    });
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2a25,
      roughness: 0.95,
      metalness: 0.03,
    });
    const railMaterial = new THREE.MeshBasicMaterial({
      color: 0x4bd6c0,
      transparent: true,
      opacity: 0.16,
    });
    GAME_DATA.cave.passages.forEach((passage) => {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(passage.size.x, 0.16, passage.size.z), floorMaterial);
      floor.position.set(passage.center.x, GAME_DATA.cave.floorY - 0.08, passage.center.z);
      group.add(floor);

      const north = new THREE.Mesh(new THREE.BoxGeometry(passage.size.x, 0.62, 0.34), edgeMaterial);
      north.position.set(passage.center.x, 0.34, passage.center.z - passage.size.z / 2);
      group.add(north);
      const south = north.clone();
      south.position.z = passage.center.z + passage.size.z / 2;
      group.add(south);
      const west = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.62, passage.size.z), edgeMaterial);
      west.position.set(passage.center.x - passage.size.x / 2, 0.34, passage.center.z);
      group.add(west);
      const east = west.clone();
      east.position.x = passage.center.x + passage.size.x / 2;
      group.add(east);

      const grid = new THREE.Mesh(new THREE.BoxGeometry(passage.size.x, 0.02, 0.08), railMaterial);
      grid.position.set(passage.center.x, 0.04, passage.center.z);
      group.add(grid);
    });
    return group;
  }

  function createLiftMesh(THREE) {
    const group = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0x272f2b, roughness: 0.7, metalness: 0.35 });
    const signal = new THREE.MeshBasicMaterial({ color: 0x4bd6c0 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.3, 4.6), metal);
    deck.position.y = 0.1;
    group.add(deck);
    [-3.1, 3.1].forEach((x) => {
      [-1.9, 1.9].forEach((z) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.6, 0.24), metal);
        post.position.set(x, 1.8, z);
        group.add(post);
      });
    });
    const crown = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.2, 0.36), signal);
    crown.position.set(0, 3.45, -2.2);
    group.add(crown);
    const lamp = new THREE.PointLight(0x4bd6c0, 1.4, 22);
    lamp.position.set(0, 3.1, 0);
    group.add(lamp);
    group.position.set(GAME_DATA.lift.position.x, 0, GAME_DATA.lift.position.z);
    return group;
  }

  function createPlayerMesh(THREE, assets = {}) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.42, 1.1, 12),
      new THREE.MeshStandardMaterial({ color: 0xb7c2bd, roughness: 0.62, metalness: 0.18 })
    );
    body.position.y = 0.78;
    group.add(body);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.5), new THREE.MeshBasicMaterial({ color: 0xc9a653 }));
    lamp.position.set(0, 1.34, -0.34);
    group.add(lamp);
    if (assets.drillTool) {
      const drill = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: assets.drillTool,
          transparent: true,
          depthWrite: false,
        })
      );
      drill.position.set(0.56, 0.96, -0.28);
      drill.scale.set(0.9, 0.9, 1);
      group.add(drill);
    }
    return group;
  }

  function createSampleMesh(THREE, node, assets = {}) {
    const group = new THREE.Group();
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.72, 2.2, 6),
      new THREE.MeshStandardMaterial({
        color: 0x57756c,
        map: assets.mineralVeinMaterial || null,
        emissive: 0x102d28,
        emissiveMap: assets.mineralVeinMaterial || null,
        emissiveIntensity: assets.mineralVeinMaterial ? 0.28 : 0.2,
        roughness: 0.38,
        metalness: 0.18,
      })
    );
    crystal.position.y = 1.1;
    group.add(crystal);
    const core = new THREE.PointLight(0x4bd6c0, 0.75, 10);
    core.position.y = 1.4;
    group.add(core);
    group.position.set(node.position.x, 0, node.position.z);
    return group;
  }

  function createHazardMesh(THREE, zone) {
    const group = new THREE.Group();
    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(zone.radius, zone.radius, 0.05, 48),
      new THREE.MeshBasicMaterial({ color: 0xd46857, transparent: true, opacity: 0.12 })
    );
    disk.position.y = 0.06;
    group.add(disk);
    const light = new THREE.PointLight(0xd46857, 0.42, zone.radius * 2.1);
    light.position.y = 1.8;
    group.add(light);
    group.position.set(zone.position.x, 0, zone.position.z);
    return group;
  }

  function createSurveySiteMesh(THREE, site) {
    const group = new THREE.Group();
    group.userData.siteId = site.id;

    const seamGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-site.radius, 0.18, -0.55),
      new THREE.Vector3(-site.radius * 0.32, 0.44, 0.2),
      new THREE.Vector3(site.radius * 0.28, 0.22, -0.1),
      new THREE.Vector3(site.radius, 0.5, 0.62),
    ]);
    const seam = new THREE.Line(
      seamGeometry,
      new THREE.LineBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.78 })
    );
    seam.userData.role = "fault-seam";
    group.add(seam);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(site.radius, 0.045, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.24 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    ring.userData.role = "survey-radius";
    group.add(ring);

    const stake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 1.25, 8),
      new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.88 })
    );
    stake.position.set(-0.62, 0.68, 0.55);
    stake.userData.role = "survey-stake";
    group.add(stake);

    const braceMaterial = new THREE.MeshBasicMaterial({ color: 0xc9a653, transparent: true, opacity: 0.24 });
    const braceFrame = new THREE.Group();
    [
      [-1.1, 0.72, -0.25, 0.11, 1.42, 0.11],
      [1.1, 0.72, -0.25, 0.11, 1.42, 0.11],
      [0, 1.38, -0.25, 2.32, 0.12, 0.12],
    ].forEach(([x, y, z, width, height, depth]) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), braceMaterial);
      beam.position.set(x, y, z);
      braceFrame.add(beam);
    });
    braceFrame.userData.role = "brace-frame";
    group.add(braceFrame);

    const cache = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.8, 12),
      new THREE.MeshBasicMaterial({ color: 0xe0e7e3, transparent: true, opacity: 0.62 })
    );
    cache.rotation.z = Math.PI / 2;
    cache.position.set(0.92, 0.42, 0.8);
    cache.userData.role = "air-cache";
    group.add(cache);

    const mapPlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.04, 0.72),
      new THREE.MeshBasicMaterial({ color: 0xc9a653, transparent: true, opacity: 0.74 })
    );
    mapPlate.position.set(0, 0.18, -1.15);
    mapPlate.userData.role = "map-plate";
    group.add(mapPlate);

    group.position.set(site.position.x, 0, site.position.z);
    return group;
  }

  function createPumpworksSiteMesh(THREE, site) {
    const group = new THREE.Group();
    group.userData.siteId = site.id;

    const flood = new THREE.Mesh(
      new THREE.CylinderGeometry(site.radius * 1.45, site.radius * 1.45, 0.04, 48),
      new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.12 })
    );
    flood.position.y = 0.08;
    flood.userData.role = "flood-plane";
    group.add(flood);

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 1.05, 1.75),
      new THREE.MeshStandardMaterial({ color: 0x202a26, roughness: 0.68, metalness: 0.34 })
    );
    housing.position.set(-0.42, 0.62, 0);
    housing.userData.role = "pump-housing";
    group.add(housing);

    const valve = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.045, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xc9a653, transparent: true, opacity: 0.82 })
    );
    valve.rotation.y = Math.PI / 2;
    valve.position.set(0.55, 0.82, -0.62);
    valve.userData.role = "valve-wheel";
    group.add(valve);

    const gauge = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.032, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.72 })
    );
    gauge.rotation.y = Math.PI / 2;
    gauge.position.set(0.54, 1.22, 0.45);
    gauge.userData.role = "pressure-gauge";
    group.add(gauge);

    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.02, 0.46),
      new THREE.MeshBasicMaterial({ color: 0xd46857, transparent: true, opacity: 0.78 })
    );
    needle.rotation.y = Math.PI / 2;
    needle.position.set(0.55, 1.22, 0.45);
    needle.userData.role = "pressure-needle";
    group.add(needle);

    const leak = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.95, 0.28, -0.92),
        new THREE.Vector3(-0.35, 0.38, -1.18),
        new THREE.Vector3(0.18, 0.24, -0.96),
        new THREE.Vector3(0.82, 0.34, -1.24),
      ]),
      new THREE.LineBasicMaterial({ color: 0xd46857, transparent: true, opacity: 0.7 })
    );
    leak.userData.role = "leak-seam";
    group.add(leak);

    const siphon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 1.0, 12),
      new THREE.MeshBasicMaterial({ color: 0xe0e7e3, transparent: true, opacity: 0.34 })
    );
    siphon.rotation.z = Math.PI / 2;
    siphon.position.set(-0.84, 0.42, 0.94);
    siphon.userData.role = "siphon-canister";
    group.add(siphon);

    const drainage = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-site.radius * 0.8, 0.16, 0.9),
        new THREE.Vector3(-site.radius * 0.2, 0.16, 0.35),
        new THREE.Vector3(site.radius * 0.45, 0.16, 0.15),
        new THREE.Vector3(site.radius * 0.86, 0.16, -0.52),
      ]),
      new THREE.LineBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.2 })
    );
    drainage.userData.role = "drainage-route-overlay";
    group.add(drainage);

    const light = new THREE.PointLight(0x4bd6c0, 0.42, site.influenceRadius);
    light.position.set(0, 1.2, 0);
    light.userData.role = "pumpworks-signal-light";
    group.add(light);

    group.position.set(site.position.x, 0, site.position.z);
    return group;
  }

  function createLanternMesh(THREE, anchor, assets = {}) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.32, 0.78, 10),
      new THREE.MeshStandardMaterial({ color: 0x3b3422, roughness: 0.65, metalness: 0.36 })
    );
    base.position.y = 0.4;
    group.add(base);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xc9a653, transparent: true, opacity: 0.86 })
    );
    flame.position.y = 1.0;
    group.add(flame);
    if (assets.lanternAnchor) {
      const marker = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: assets.lanternAnchor,
          transparent: true,
          depthWrite: false,
        })
      );
      marker.position.y = 1.15;
      marker.scale.set(2.0, 2.0, 1);
      group.add(marker);
    }
    const light = new THREE.PointLight(0xc9a653, 2.1, anchor.radius);
    light.position.y = 1.1;
    group.add(light);
    group.position.set(anchor.position.x, 0, anchor.position.z);
    return group;
  }

  function createScene(canvas, state, sceneAssets = {}) {
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050706);
    scene.fog = new THREE.FogExp2(0x050706, 0.022);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 220);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    scene.add(new THREE.HemisphereLight(0xb9c4be, 0x050706, 0.72));
    scene.add(new THREE.AmbientLight(0x6d7772, 0.38));
    const playerLamp = new THREE.PointLight(0xc9a653, 1.7, state.light.currentRadius);
    scene.add(playerLamp);
    const signalLight = new THREE.PointLight(0x4bd6c0, 1.05, 42);
    signalLight.position.set(0, 3, -32);
    scene.add(signalLight);

    scene.add(createCaveGroup(THREE, sceneAssets));
    const lift = createLiftMesh(THREE);
    scene.add(lift);
    const player = createPlayerMesh(THREE, sceneAssets);
    scene.add(player);

    const sampleMeshes = new Map();
    state.sampleNodes.forEach((node) => {
      const mesh = createSampleMesh(THREE, node, sceneAssets);
      sampleMeshes.set(node.id, mesh);
      scene.add(mesh);
    });

    const hazardMeshes = new Map();
    state.hazardZones.forEach((zone) => {
      const mesh = createHazardMesh(THREE, zone);
      hazardMeshes.set(zone.id, mesh);
      scene.add(mesh);
    });

    const surveyMeshes = new Map();
    state.surveySites.forEach((site) => {
      const mesh = createSurveySiteMesh(THREE, site);
      surveyMeshes.set(site.id, mesh);
      scene.add(mesh);
    });

    const pumpworksMeshes = new Map();
    state.pumpworksSites.forEach((site) => {
      const mesh = createPumpworksSiteMesh(THREE, site);
      pumpworksMeshes.set(site.id, mesh);
      scene.add(mesh);
    });

    const scannerRing = new THREE.Mesh(
      new THREE.RingGeometry(3.8, 4.0, 48),
      new THREE.MeshBasicMaterial({ color: 0x4bd6c0, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    scannerRing.rotation.x = Math.PI / 2;
    scannerRing.visible = false;
    scene.add(scannerRing);
    const routeGroup = new THREE.Group();
    scene.add(routeGroup);

    return {
      THREE,
      scene,
      camera,
      renderer,
      sceneAssets,
      objects: {
        lift,
        player,
        playerLamp,
        signalLight,
        sampleMeshes,
        hazardMeshes,
        surveyMeshes,
        pumpworksMeshes,
        lanternMeshes: new Map(),
        routeGroup,
        routeSignature: "",
        scannerRing,
      },
    };
  }

  function resizeScene(handle) {
    const canvas = handle.renderer.domElement;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const pixelRatio = handle.renderer.getPixelRatio();
    if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
      handle.renderer.setSize(width, height, false);
      handle.camera.aspect = width / height;
      handle.camera.updateProjectionMatrix();
    }
  }

  function syncLanternMeshes(handle, state) {
    state.lanterns.anchors.forEach((anchor) => {
      if (!handle.objects.lanternMeshes.has(anchor.id)) {
        const mesh = createLanternMesh(handle.THREE, anchor, handle.sceneAssets || {});
        handle.objects.lanternMeshes.set(anchor.id, mesh);
        handle.scene.add(mesh);
      }
    });
  }

  function syncRouteMeshes(handle, state) {
    const signature = state.route.legs.map((leg) => `${leg.from}:${leg.to}:${leg.linked}`).join("|");
    if (signature === handle.objects.routeSignature) {
      return;
    }
    handle.objects.routeSignature = signature;
    while (handle.objects.routeGroup.children.length) {
      const child = handle.objects.routeGroup.children[0];
      handle.objects.routeGroup.remove(child);
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        child.material.dispose();
      }
    }
    const points = routeGuidePoints(state);
    points.slice(1).forEach((point, index) => {
      const from = points[index];
      const leg = state.route.legs[index];
      const legDistance = distance(from.position, point.position);
      const strip = new handle.THREE.Mesh(
        new handle.THREE.BoxGeometry(0.26, 0.035, legDistance),
        new handle.THREE.MeshBasicMaterial({
          color: leg.linked ? 0x4bd6c0 : 0xd46857,
          transparent: true,
          opacity: leg.linked ? 0.3 : 0.18,
        })
      );
      strip.position.set(
        (from.position.x + point.position.x) / 2,
        0.12,
        (from.position.z + point.position.z) / 2
      );
      strip.rotation.y = Math.atan2(point.position.x - from.position.x, point.position.z - from.position.z);
      handle.objects.routeGroup.add(strip);
    });
  }

  function updateSurveyMeshes(handle, state, timeSeconds) {
    state.surveySites.forEach((site) => {
      const mesh = handle.objects.surveyMeshes.get(site.id);
      if (!mesh) {
        return;
      }
      const seam = mesh.children.find((child) => child.userData.role === "fault-seam");
      const ring = mesh.children.find((child) => child.userData.role === "survey-radius");
      const stake = mesh.children.find((child) => child.userData.role === "survey-stake");
      const brace = mesh.children.find((child) => child.userData.role === "brace-frame");
      const cache = mesh.children.find((child) => child.userData.role === "air-cache");
      const mapPlate = mesh.children.find((child) => child.userData.role === "map-plate");
      const urgent = site.windowState === "tremor" || site.windowState === "collapsed" || site.chartState === "failed";
      const complete = site.chartState === "success" || site.chartState === "partial";
      const pulse = 0.5 + Math.sin(timeSeconds * (urgent ? 6.2 : 2.4) + site.position.x) * 0.5;

      mesh.scale.setScalar(site.inRange ? 1.14 : 1);
      if (seam && seam.material) {
        seam.material.color.setHex(urgent ? 0xd46857 : complete ? 0xc9a653 : 0x4bd6c0);
        seam.material.opacity = urgent ? 0.58 + pulse * 0.28 : complete ? 0.5 : 0.42 + pulse * 0.18;
      }
      if (ring && ring.material) {
        ring.material.color.setHex(urgent ? 0xd46857 : 0x4bd6c0);
        ring.material.opacity = site.inRange ? 0.32 : 0.18;
      }
      if (stake) {
        stake.visible = site.stakePlanted;
      }
      if (brace) {
        brace.visible = Boolean(site.requirements.brace);
        brace.children.forEach((child) => {
          if (child.material) {
            child.material.opacity = site.braceInstalled ? 0.82 : 0.2;
          }
        });
      }
      if (cache && cache.material) {
        const hasCache = site.airCacheState && site.airCacheState.status !== "none";
        cache.visible = hasCache;
        cache.material.color.setHex(site.airCacheState && site.airCacheState.status === "depleted" ? 0x53605a : 0xe0e7e3);
        cache.material.opacity = site.airCacheState && site.airCacheState.status === "depleted" ? 0.22 : 0.62;
      }
      if (mapPlate) {
        mapPlate.visible = complete;
      }
    });
  }

  function updatePumpworksMeshes(handle, state, timeSeconds) {
    state.pumpworksSites.forEach((site) => {
      const mesh = handle.objects.pumpworksMeshes.get(site.id);
      if (!mesh) {
        return;
      }
      const flood = mesh.children.find((child) => child.userData.role === "flood-plane");
      const housing = mesh.children.find((child) => child.userData.role === "pump-housing");
      const valve = mesh.children.find((child) => child.userData.role === "valve-wheel");
      const gauge = mesh.children.find((child) => child.userData.role === "pressure-gauge");
      const needle = mesh.children.find((child) => child.userData.role === "pressure-needle");
      const leak = mesh.children.find((child) => child.userData.role === "leak-seam");
      const siphon = mesh.children.find((child) => child.userData.role === "siphon-canister");
      const drainage = mesh.children.find((child) => child.userData.role === "drainage-route-overlay");
      const light = mesh.children.find((child) => child.userData.role === "pumpworks-signal-light");
      const urgent = site.windowState === "surge" || site.windowState === "flood" || site.windowState === "overrun" || site.drainageState === "failed";
      const drained = site.drainageState === "success" || site.drainageState === "partial";
      const active = site.inRange || site.pumpPrimed || site.leakSealed || site.siphonDeployed || drained;
      const pulse = 0.5 + Math.sin(timeSeconds * (urgent ? 5.6 : 2.0) + site.position.z) * 0.5;

      mesh.scale.setScalar(site.inRange ? 1.12 : 1);
      if (flood && flood.material) {
        flood.material.color.setHex(urgent ? 0xd46857 : drained ? 0x4bd6c0 : 0x4bd6c0);
        flood.material.opacity = drained
          ? 0.06
          : Math.min(0.34, 0.08 + (site.floodLevel || 0) * 0.24 + pulse * 0.05);
      }
      if (housing && housing.material) {
        housing.material.color.setHex(site.pumpPrimed ? 0x2c4a43 : site.drainageState === "failed" ? 0x3a201d : 0x202a26);
        housing.material.emissive.setHex(site.pumpPrimed ? 0x08221d : 0x000000);
      }
      if (valve && valve.material) {
        valve.material.color.setHex(site.valveState === "overrun" ? 0xd46857 : site.valveState === "regulated" ? 0x4bd6c0 : 0xc9a653);
        valve.material.opacity = site.valveState === "closed" ? 0.62 : 0.88;
        valve.rotation.z = site.valveState === "closed" ? 0 : timeSeconds * 0.7;
      }
      if (gauge && gauge.material) {
        gauge.material.color.setHex(urgent ? 0xd46857 : active ? 0x4bd6c0 : 0x87938d);
        gauge.material.opacity = urgent ? 0.78 + pulse * 0.18 : active ? 0.72 : 0.36;
      }
      if (needle && needle.material) {
        needle.rotation.z = -0.7 + Math.min(1.4, (site.floodLevel || 0) * 1.4 + (urgent ? 0.35 : 0));
        needle.material.opacity = urgent ? 0.88 : 0.66;
      }
      if (leak && leak.material) {
        leak.material.color.setHex(site.leakSealed ? 0xc9a653 : 0xd46857);
        leak.material.opacity = site.leakSealed ? 0.28 : 0.48 + pulse * 0.24;
      }
      if (siphon && siphon.material) {
        siphon.visible = Boolean(site.requirements.siphon || site.siphonDeployed);
        siphon.material.color.setHex(site.siphonDeployed ? 0x4bd6c0 : 0xe0e7e3);
        siphon.material.opacity = site.siphonDeployed ? 0.78 : 0.28;
      }
      if (drainage && drainage.material) {
        drainage.visible = active;
        drainage.material.color.setHex(site.drainageState === "failed" ? 0xd46857 : drained ? 0xc9a653 : 0x4bd6c0);
        drainage.material.opacity = active ? 0.26 + pulse * 0.18 : 0.12;
      }
      if (light) {
        light.color.setHex(urgent ? 0xd46857 : 0x4bd6c0);
        light.intensity = active ? 0.52 + pulse * 0.28 : 0.22;
        light.distance = site.influenceRadius;
      }
    });
  }

  function updateScene(handle, state, timeSeconds) {
    resizeScene(handle);
    syncLanternMeshes(handle, state);
    syncRouteMeshes(handle, state);
    updateSurveyMeshes(handle, state, timeSeconds);
    updatePumpworksMeshes(handle, state, timeSeconds);
    handle.objects.player.position.set(state.player.position.x, 0, state.player.position.z);
    handle.objects.player.rotation.y = state.player.facing;
    handle.objects.playerLamp.position.set(state.player.position.x, state.player.position.y + 0.4, state.player.position.z);
    handle.objects.playerLamp.distance = state.light.currentRadius;

    state.sampleNodes.forEach((node) => {
      const mesh = handle.objects.sampleMeshes.get(node.id);
      if (!mesh) {
        return;
      }
      mesh.visible = !node.mineState.depleted;
      mesh.rotation.y = timeSeconds * 0.2 + node.position.x;
      mesh.scale.setScalar(node.mineState.status === "cutting" ? 1.12 : 1);
    });

    state.hazardZones.forEach((zone) => {
      const mesh = handle.objects.hazardMeshes.get(zone.id);
      if (!mesh) {
        return;
      }
      mesh.visible = true;
      mesh.scale.y = zone.active ? 1.24 : 1;
      mesh.rotation.y = timeSeconds * 0.08;
      mesh.children.forEach((child) => {
        if (child.material) {
          child.material.opacity = zone.active ? 0.2 : 0.1;
        }
      });
    });

    handle.objects.scannerRing.visible = state.scanner.cooldown > 0;
    if (handle.objects.scannerRing.visible) {
      const scale = Math.max(1, 1 + state.scanner.pulseAge * 3.8);
      handle.objects.scannerRing.position.set(state.player.position.x, 0.1, state.player.position.z);
      handle.objects.scannerRing.scale.setScalar(scale);
      handle.objects.scannerRing.material.opacity = Math.max(0, 0.42 - state.scanner.pulseAge * 0.16);
    }

    handle.camera.position.set(state.camera.position.x, state.camera.position.y, state.camera.position.z);
    handle.camera.lookAt(state.camera.target.x, state.camera.target.y, state.camera.target.z);
    handle.renderer.render(handle.scene, handle.camera);
  }

  function animationFrame(now) {
    if (!sceneHandle || !currentState) {
      return;
    }
    const deltaSeconds = Math.min(0.05, (now - lastFrameTime) / 1000 || 0.016);
    lastFrameTime = now;
    currentState = stepRun(currentState, pressedControls, deltaSeconds);
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
    const startRenderer = (assets = {}) => {
      try {
        sceneHandle = createScene(dom.canvas, currentState, assets);
        const completeAssets = Boolean(assets.lanternAnchor && assets.mineralVeinMaterial && assets.drillTool);
        currentState.renderer.status = completeAssets ? "local renderer + assets" : "local renderer / asset fallback";
        renderHud(currentState);
        lastFrameTime = performance.now();
        window.requestAnimationFrame(animationFrame);
      } catch (error) {
        currentState.renderer.status = "renderer blocked";
        currentState.log.unshift({ tick: currentState.tick, message: error.message });
        renderHud(currentState);
      }
    };
    loadSceneAssets(window.THREE).then(startRenderer).catch(() => startRenderer({}));
  }

  const api = {
    GAME_DATA,
    RENDERER_PATH,
    createInitialState,
    createSampleNodes,
    createHazardZones,
    createSurveySites,
    createPumpworksSites,
    stepRun,
    applyMovement,
    placeLantern,
    plantSurveyStake,
    braceSurveySite,
    chartFaultSurvey,
    activateAirCache,
    primePumpStation,
    turnPressureValve,
    deploySiphonCharge,
    sealLeakSeam,
    mineNearestSample,
    pulseScanner,
    returnToLift,
    purchaseUpgrade,
    resetRun,
    loadSceneAssets,
    syncDerivedState,
    oxygenDrainRate,
    coveredByLantern,
    routeGuidePoints,
    computeRouteState,
    computeRouteStability,
    surveySiteWindowState,
    pumpworksWindowState,
    surveyOxygenDrain,
    pumpworksOxygenDrain,
    nearestSurveySite,
    nearestPumpworksSite,
    sampleSurveyValueBonus,
    samplePumpworksValueBonus,
    currentHazardExposure,
    nearestSample,
    cavePassageAt,
    isPointInPassage,
    updateCameraState,
    bearingTo,
    formatBearing,
    distance,
  };

  if (typeof window !== "undefined") {
    window.IronLanternDescent = api;
    window.addEventListener("DOMContentLoaded", initDom);
  }

  return api;
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = IronLanternDescent;
}

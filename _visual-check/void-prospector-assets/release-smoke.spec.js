const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const EVIDENCE_DIR = __dirname;
const ROOT = path.resolve(EVIDENCE_DIR, "../..");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8773/";
const REPORT_PATH = path.join(EVIDENCE_DIR, "release-smoke-report.json");

function evidencePath(filename) {
  return path.join(EVIDENCE_DIR, filename);
}

function fileEvidence(filename) {
  const filePath = evidencePath(filename);
  const stat = fs.statSync(filePath);
  return {
    path: filePath,
    exists: stat.isFile(),
    bytes: stat.size,
  };
}

async function overflowState(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const offenders = [...document.querySelectorAll("body *")]
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        id: element.id || "",
        className: String(element.className || ""),
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
    return {
      width: window.innerWidth,
      scrollWidth: doc.scrollWidth,
      overflowing: doc.scrollWidth > window.innerWidth + 1,
      overflowOffenders: offenders,
    };
  });
}

async function canvasSample(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      return { width: 0, height: 0, sampled: 0, nonDark: 0, bright: 0, nonDarkRatio: 0, brightRatio: 0 };
    }
    const probe = document.createElement("canvas");
    const width = Math.min(canvas.width, 640);
    const height = Math.min(canvas.height, 480);
    probe.width = width;
    probe.height = height;
    const context = probe.getContext("2d", { willReadFrequently: true });
    context.drawImage(canvas, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    let nonDark = 0;
    let bright = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      if (r + g + b > 45) {
        nonDark += 1;
      }
      if (r + g + b > 190) {
        bright += 1;
      }
    }
    const sampled = width * height;
    return {
      width: canvas.width,
      height: canvas.height,
      sampled,
      nonDark,
      bright,
      nonDarkRatio: sampled ? nonDark / sampled : 0,
      brightRatio: sampled ? bright / sampled : 0,
    };
  });
}

async function arcadeSnapshot(page, viewport, filename) {
  await page.setViewportSize(viewport);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const voidCard = page.locator("article.game-card").filter({ hasText: "Void Prospector" }).first();
  await expect(voidCard).toBeVisible();
  await page.screenshot({ path: evidencePath(filename), fullPage: true });
  return {
    title: await page.title(),
    hasVoidCard: await voidCard.count().then((count) => count > 0),
    hasDirectLaunch: (await voidCard.locator('a[href="games/void-prospector/"]').count()) > 0,
    hasSnapshot070: (await voidCard.locator('a[href="games/void-prospector/versions/0.7.0/"]').count()) > 0,
    hasSnapshot060: (await voidCard.locator('a[href="games/void-prospector/versions/0.6.0/"]').count()) > 0,
    hasSnapshot050: (await voidCard.locator('a[href="games/void-prospector/versions/0.5.0/"]').count()) > 0,
    versionText: await voidCard.locator(".signal-pill").textContent(),
    releaseLabel: await voidCard.locator(".release-note span").textContent(),
    copyIncludesRepair: (await voidCard.textContent()).includes("Flight Readability Repair"),
    copyIncludesFirstContract: (await voidCard.textContent()).includes("first contract"),
    copyIncludesKnifeWake: (await voidCard.textContent()).includes("Knife Wake"),
    overflow: await overflowState(page),
  };
}

async function directSnapshot(page, viewport, filename) {
  await page.setViewportSize(viewport);
  await page.goto(new URL("games/void-prospector/", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.waitForSelector("#void-prospector-scene");
  await page.waitForTimeout(700);
  await page.screenshot({ path: evidencePath(filename), fullPage: true });
  const surface = await page.evaluate(() => {
    const game = window.VoidProspector;
    const state = game.createInitialState({ seed: 33 });
    return game.surveyCockpitSurface(state).cockpit;
  });
  return {
    title: await page.title(),
    renderer: await page.locator("#run-status").textContent(),
    eyebrow: await page.locator(".eyebrow").textContent(),
    objective: await page.locator("#cockpit-objective-text").textContent(),
    targetLabel: await page.locator("#target-world-label strong").textContent(),
    stationLabel: await page.locator("#station-world-label strong").textContent(),
    threatLabelState: await page.locator("#threat-world-label").getAttribute("data-state"),
    initialSurface: {
      mode: surface.mode,
      advancedOpen: surface.advancedOpen,
      prompts: surface.prompts,
      radarKinds: surface.radar.blips.map((blip) => blip.kind),
      targetName: surface.targetCard.name,
      stationName: surface.labels.station.name,
      threatState: surface.labels.threat.state,
    },
    canvas: await canvasSample(page),
    overflow: await overflowState(page),
  };
}

async function firstLoopEvidence(page) {
  return page.evaluate(() => {
    const game = window.VoidProspector;
    let state = game.createInitialState({ seed: 33 });
    const start = JSON.parse(JSON.stringify(state));

    let guard = 0;
    while (Math.abs(state.target.bearing) > 10 && guard < 20) {
      state = game.stepSpaceflight(state, { turnLeft: true }, 0.1);
      guard += 1;
    }
    state = game.stepSpaceflight(state, { ascend: true }, 1);
    state = game.stepSpaceflight(state, { thrust: true }, 1);

    const node = state.asteroids.find((asteroid) => asteroid.id === state.tutorial.targetId) || state.asteroids[0];
    state.ship.position = { x: node.position.x + 2, y: node.position.y, z: node.position.z + 1 };
    state.ship.velocity = { x: 0, y: 0, z: 0 };
    state = game.setTarget(state, "asteroid", node.id);
    for (let pull = 0; pull < 3; pull += 1) {
      state = game.stepSpaceflight(state, { mine: true }, 1);
    }
    const afterMining = JSON.parse(JSON.stringify(state));
    const miningFeedback = game.surveyCockpitSurface(afterMining).cockpit.feedback.mining;

    const creditsBefore = state.credits;
    state.ship.position = { ...state.station.position };
    state.ship.velocity = { x: 0, y: 0, z: 0 };
    state = game.stepSpaceflight(state, { interact: true }, 1);
    const afterDock = JSON.parse(JSON.stringify(state));
    const dockSurface = game.surveyCockpitSurface(afterDock).cockpit;

    let pirateLive = afterDock;
    for (let index = 0; index < 7; index += 1) {
      pirateLive = game.stepSpaceflight(pirateLive, {}, 1);
    }
    const pirateSurface = game.surveyCockpitSurface(pirateLive).cockpit;

    return {
      startTarget: start.target.id,
      moved3d: {
        x: state.ship.position.x !== start.ship.position.x,
        y: afterMining.ship.position.y !== start.ship.position.y,
        z: state.ship.position.z !== start.ship.position.z,
      },
      afterMiningPhase: afterMining.tutorial.phase,
      oreMined: afterMining.cargo.ore,
      miningFeedback,
      tutorialStatus: afterDock.tutorial.status,
      tutorialPhase: afterDock.tutorial.phase,
      contractStatus: afterDock.contract.status,
      deliveredOre: afterDock.contract.deliveredOre,
      stationMenuState: afterDock.stationMenu.state,
      creditsBefore,
      creditsAfter: afterDock.credits,
      dockingFeedback: dockSurface.feedback.docking,
      pirateWarning: pirateSurface.feedback.threat,
      pirateLabel: pirateSurface.labels.threat,
      pirateRadarKinds: pirateSurface.radar.blips.map((blip) => blip.kind),
      promptsAfterPirate: pirateSurface.prompts,
    };
  });
}

async function captureVisualState(page, stateName, filename) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL("games/void-prospector/", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.waitForSelector("#void-prospector-scene");
  await page.waitForFunction(() => Boolean(window.VoidProspector && window.VoidProspector.stageEvidenceState));

  const state = await page.evaluate((name) => {
    const game = window.VoidProspector;

    function createMiningBeamState() {
      let next = game.createInitialState({ seed: 33 });
      const node = next.asteroids.find((asteroid) => asteroid.id === next.tutorial.targetId) || next.asteroids[0];
      next.ship.position = { x: node.position.x + 2, y: node.position.y, z: node.position.z + 1 };
      next.ship.velocity = { x: 0, y: 0, z: 0 };
      next = game.setTarget(next, "asteroid", node.id);
      return game.stepSpaceflight(next, { mine: true }, 1);
    }

    function createDockableStationState() {
      let next = game.createInitialState({ seed: 33 });
      next.ship.position = {
        x: next.station.position.x,
        y: next.station.position.y,
        z: next.station.position.z + next.station.dockingRadius - 2,
      };
      next.ship.velocity = { x: 0, y: 0, z: 0 };
      return game.setTarget(next, "station", next.station.id);
    }

    function createPostUnlockPirateWarningState() {
      let next = createMiningBeamState();
      for (let pull = 0; pull < 2; pull += 1) {
        next = game.stepSpaceflight(next, { mine: true }, 1);
      }
      next.ship.position = { ...next.station.position };
      next.ship.velocity = { x: 0, y: 0, z: 0 };
      next = game.stepSpaceflight(next, { interact: true }, 1);
      next = game.launchFromStation(next);
      return game.setTarget(next, "pirate", next.pirate.id);
    }

    const factories = {
      activeMiningBeam: createMiningBeamState,
      dockableStation: createDockableStationState,
      postUnlockPirateWarning: createPostUnlockPirateWarningState,
    };
    const next = factories[name]();
    const cockpit = game.stageEvidenceState(next, { evidenceState: name, holdMs: 1800 });
    const root = document.querySelector("#void-prospector");
    return {
      stateName: name,
      surface: root ? root.dataset.surface : null,
      evidenceState: root ? root.dataset.evidenceState : null,
      reticleState: cockpit.reticle.state,
      objective: cockpit.objectiveText,
      promptText: cockpit.prompts.join(" | "),
      mining: cockpit.feedback.mining,
      docking: cockpit.feedback.docking,
      threat: cockpit.feedback.threat,
      labels: {
        target: cockpit.labels.target,
        station: cockpit.labels.station,
        threat: cockpit.labels.threat,
      },
      radarKinds: cockpit.radar.blips.map((blip) => blip.kind),
    };
  }, stateName);

  await page.waitForFunction((name) => {
    const root = document.querySelector("#void-prospector");
    const reticle = document.querySelector("#center-reticle");
    const target = document.querySelector("#target-world-label");
    const station = document.querySelector("#station-world-label");
    const threat = document.querySelector("#threat-world-label");
    if (!root || root.dataset.evidenceState !== name || !reticle || !target || !station || !threat) {
      return false;
    }
    if (name === "activeMiningBeam") {
      return reticle.dataset.state === "mine-in-range" && target.textContent.includes("Cinder Node");
    }
    if (name === "dockableStation") {
      return reticle.dataset.state === "dockable-station" && station.dataset.state === "dockable";
    }
    if (name === "postUnlockPirateWarning") {
      return threat.dataset.state === "warning" && threat.textContent.includes("Knife Wake");
    }
    return false;
  }, stateName);

  await page.waitForTimeout(150);
  await page.screenshot({ path: evidencePath(filename), fullPage: true });
  return {
    ...fileEvidence(filename),
    state,
  };
}

test.setTimeout(90000);

test("Void Prospector v0.7.0 release smoke", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const arcadeDesktop = await arcadeSnapshot(page, { width: 1280, height: 800 }, "browser-smoke-arcade-v0-7.png");
  const arcadeNarrow = await arcadeSnapshot(page, { width: 390, height: 844 }, "browser-smoke-arcade-v0-7-narrow.png");
  const directDesktop = await directSnapshot(page, { width: 1280, height: 800 }, "browser-smoke-direct-v0-7-desktop.png");
  directDesktop.firstMiningDockingLoop = await firstLoopEvidence(page);
  directDesktop.pirateWarning = directDesktop.firstMiningDockingLoop.pirateWarning;
  const visualStates = {
    activeMiningBeam: await captureVisualState(page, "activeMiningBeam", "browser-smoke-direct-v0-7-active-mining-beam.png"),
    dockableStation: await captureVisualState(page, "dockableStation", "browser-smoke-direct-v0-7-dockable-station.png"),
    postUnlockPirateWarning: await captureVisualState(
      page,
      "postUnlockPirateWarning",
      "browser-smoke-direct-v0-7-post-unlock-pirate-warning.png"
    ),
  };
  const directNarrow = await directSnapshot(page, { width: 390, height: 844 }, "browser-smoke-direct-v0-7-narrow.png");

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL("games/void-prospector/versions/0.7.0/", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.waitForSelector("#void-prospector-scene");
  await page.waitForTimeout(500);
  const snapshot070 = {
    title: await page.title(),
    eyebrow: await page.locator(".eyebrow").textContent(),
    faviconHref: await page.locator('link[rel="icon"]').getAttribute("href"),
    backlinkHref: await page.locator(".backlink").getAttribute("href"),
    hasTutorialObjective: (await page.locator("#cockpit-objective-text").count()) > 0,
    hasReducedMotionControl: (await page.locator("#motion-action").count()) > 0,
    hasEvidenceHook: await page.evaluate(() => Boolean(window.VoidProspector && window.VoidProspector.stageEvidenceState)),
    hasNestedVersionsText: (await page.textContent("body")).includes("/versions/versions/"),
    overflow: await overflowState(page),
  };

  const report = {
    schema_version: 1,
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    game: "void-prospector",
    version: "0.7.0",
    release: "v0.7.0 Flight Readability Repair",
    screenshots: {
      arcadeDesktop: evidencePath("browser-smoke-arcade-v0-7.png"),
      arcadeNarrow: evidencePath("browser-smoke-arcade-v0-7-narrow.png"),
      directDesktop: evidencePath("browser-smoke-direct-v0-7-desktop.png"),
      directNarrow: evidencePath("browser-smoke-direct-v0-7-narrow.png"),
      activeMiningBeam: visualStates.activeMiningBeam.path,
      dockableStation: visualStates.dockableStation.path,
      postUnlockPirateWarning: visualStates.postUnlockPirateWarning.path,
    },
    arcade: {
      desktop: arcadeDesktop,
      narrow: arcadeNarrow,
    },
    direct: {
      desktop: directDesktop,
      narrow: directNarrow,
      snapshot070,
      visualStates,
    },
    consoleErrors,
    checks: {
      arcadeDesktop: arcadeDesktop.hasVoidCard && arcadeDesktop.hasDirectLaunch && arcadeDesktop.hasSnapshot070,
      arcadeNarrow: arcadeNarrow.hasVoidCard && arcadeNarrow.hasDirectLaunch && arcadeNarrow.hasSnapshot070,
      desktopCanvasNonblank: directDesktop.canvas.nonDark > 0,
      narrowCanvasNonblank: directNarrow.canvas.nonDark > 0,
      directOverflow:
        !directDesktop.overflow.overflowing &&
        !directNarrow.overflow.overflowing &&
        directDesktop.overflow.overflowOffenders.length === 0 &&
        directNarrow.overflow.overflowOffenders.length === 0,
      firstMiningDockingLoop:
        directDesktop.firstMiningDockingLoop.tutorialStatus === "complete" &&
        directDesktop.firstMiningDockingLoop.contractStatus === "complete" &&
        directDesktop.firstMiningDockingLoop.deliveredOre === 3,
      pirateWarning: ["warning", "imminent", "shadow", "contact"].includes(directDesktop.pirateWarning.stage),
      activeMiningBeamScreenshot:
        visualStates.activeMiningBeam.exists &&
        visualStates.activeMiningBeam.bytes > 0 &&
        visualStates.activeMiningBeam.state.reticleState === "mine-in-range" &&
        visualStates.activeMiningBeam.state.mining.beamActive,
      dockableStationScreenshot:
        visualStates.dockableStation.exists &&
        visualStates.dockableStation.bytes > 0 &&
        visualStates.dockableStation.state.reticleState === "dockable-station" &&
        visualStates.dockableStation.state.docking.dockable,
      postUnlockPirateWarningScreenshot:
        visualStates.postUnlockPirateWarning.exists &&
        visualStates.postUnlockPirateWarning.bytes > 0 &&
        visualStates.postUnlockPirateWarning.state.threat.stage === "warning" &&
        visualStates.postUnlockPirateWarning.state.threat.visible,
      snapshot070Playable:
        snapshot070.eyebrow === "v0.7.0 Flight Readability Repair" &&
        snapshot070.hasReducedMotionControl &&
        snapshot070.hasEvidenceHook &&
        !snapshot070.hasNestedVersionsText,
      consoleClean: consoleErrors.length === 0,
    },
    ok: false,
    notes:
      "Browser smoke used a local static server, Playwright screenshots, and the page-local VoidProspector API to exercise first mining, docking, station summary, and post-contract pirate warning paths.",
  };
  report.ok = Object.values(report.checks).every(Boolean) && consoleErrors.length === 0;
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await context.close();

  expect(report.ok).toBeTruthy();
});

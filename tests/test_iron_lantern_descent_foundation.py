import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "iron-lantern-descent"


class IronLanternDescentFoundationTests(unittest.TestCase):
    def test_static_entrypoint_uses_local_renderer_and_hud_contract(self) -> None:
        html = (GAME_DIR / "index.html").read_text(encoding="utf-8")

        self.assertIn("<title>Iron Lantern Descent</title>", html)
        self.assertIn("iron-lantern-descent.css", html)
        self.assertIn('src="vendor/three.min.js"', html)
        self.assertIn("iron-lantern-descent.js", html)
        self.assertNotIn("https://", html)
        self.assertNotIn("http://", html)
        for region in (
            "iron-lantern-scene",
            "lantern-hud",
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
            "scanner-readout",
            "tremor-readout",
            "map-readout",
            "hazard-readout",
            "upgrade-readout",
            "player-position-readout",
            "player-facing-readout",
            "collision-readout",
            "mining-readout",
            "survey-site-list",
            "sample-list",
            "event-log",
            "lantern-action",
            "mine-action",
            "scan-action",
            "stake-action",
            "brace-action",
            "chart-action",
            "cache-action",
            "lift-action",
            "upgrade-action",
            "restart-action",
            "control-strip",
        ):
            self.assertIn(region, html)

        vendor = GAME_DIR / "vendor" / "three.min.js"
        self.assertTrue(vendor.is_file())
        self.assertIn("SPDX-License-Identifier: MIT", vendor.read_text(encoding="utf-8")[:180])

    def test_state_data_exposes_cave_run_and_upgrade_seams(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            const state = game.createInitialState({ seed: 41 });
            console.log(JSON.stringify({
              rendererPath: game.GAME_DATA.renderer.path,
              localOnly: game.GAME_DATA.renderer.localOnly,
              playerPosition: Boolean(state.player.position && Number.isFinite(state.player.position.z)),
              facing: state.player.facing,
              passageCount: game.GAME_DATA.cave.passages.length,
              collisionPassages: state.movement.collision.passages.length,
              oxygenCurrent: state.oxygen.current,
              oxygenMax: state.oxygen.max,
              lanternCharges: state.lanterns.charges,
              routeStatus: state.route.status,
              routeConfidence: state.route.returnConfidence,
              routeNearest: state.route.nearestPointKind,
              sampleCount: state.sampleNodes.length,
              sampleSeams: state.sampleNodes.every((node) => (
                node.id &&
                node.position &&
                node.mineState &&
                node.mineState.status === "ready" &&
                node.remaining > 0 &&
                node.value > 0
              )),
              liftStatus: state.lift.status,
              hazardCount: state.hazardZones.length,
              surveyRelease: game.GAME_DATA.survey.release.label,
              surveyCount: state.surveySites.length,
              surveyPassages: state.surveySites.map((site) => site.passageId).sort(),
              surveyContractTarget: state.survey.contract.targetMapProgress,
              pumpworksRelease: game.GAME_DATA.pumpworks.release.label,
              pumpworksCount: state.pumpworksSites.length,
              pumpworksPassages: state.pumpworksSites.map((site) => site.passageId).sort(),
              pumpworksContractTarget: state.pumpworks.contract.targetDrainedSites,
              pumpworksChoices: [
                typeof game.primePumpStation,
                typeof game.turnPressureValve,
                typeof game.deploySiphonCharge,
                typeof game.sealLeakSeam,
              ],
              siphonCharges: state.pumpworks.siphons,
              ventRelease: game.GAME_DATA.cinderVentNetwork.release.label,
              ventBaseRelease: game.GAME_DATA.cinderVentNetwork.release.baseRelease,
              ventCount: state.ventSites.length,
              ventPassages: state.ventSites.map((site) => site.passageId).sort(),
              ventContractRelays: state.ventNetwork.contract.targetRelays,
              ventContractMap: state.ventNetwork.contract.targetMapProgress,
              ventChoices: [
                typeof game.openDraftGate,
                typeof game.deployFilterCartridge,
                typeof game.startPressureFan,
                typeof game.ventGasPocket,
              ],
              filterCharges: state.ventNetwork.filters,
              echoRelease: game.GAME_DATA.echoRelayNetwork.release.label,
              echoBaseRelease: game.GAME_DATA.echoRelayNetwork.release.baseRelease,
              relayCount: state.relaySites.length,
              relayPassages: state.relaySites.map((site) => site.passageId).sort(),
              echoContractTriangulations: state.echoRelayNetwork.contract.targetTriangulations,
              echoContractMap: state.echoRelayNetwork.contract.targetMapProgress,
              echoChoices: [
                typeof game.repairRelayPylon,
                typeof game.spoolRelayCable,
                typeof game.triangulateEchoRoute,
                typeof game.claimRescueCache,
                typeof game.fireLiftBeacon,
              ],
              echoCharges: state.echoRelayNetwork.echoCharges,
              routeStability: state.routeStability.stability,
              surveyChoices: [
                typeof game.plantSurveyStake,
                typeof game.braceSurveySite,
                typeof game.chartFaultSurvey,
                typeof game.activateAirCache,
              ],
              scannerRange: state.scanner.range,
              scannerTargetBearing: state.scanner.targetBearing,
              runStatus: state.run.status,
              credits: state.credits,
              upgradeCount: state.upgrades.available.length,
              carryoverKeys: Object.keys(state.upgrades.carryover).sort(),
              cameraMode: state.camera.mode,
              hasCameraVectors: Boolean(state.camera.position && state.camera.target),
            }));
            """
        )

        self.assertEqual("vendor/three.min.js", result["rendererPath"])
        self.assertTrue(result["localOnly"])
        self.assertTrue(result["playerPosition"])
        self.assertEqual(0, result["facing"])
        self.assertGreaterEqual(result["passageCount"], 4)
        self.assertEqual(result["passageCount"], result["collisionPassages"])
        self.assertEqual(96, result["oxygenCurrent"])
        self.assertEqual(96, result["oxygenMax"])
        self.assertEqual(3, result["lanternCharges"])
        self.assertEqual("lift safe", result["routeStatus"])
        self.assertEqual(100, result["routeConfidence"])
        self.assertEqual("lift", result["routeNearest"])
        self.assertGreaterEqual(result["sampleCount"], 4)
        self.assertTrue(result["sampleSeams"])
        self.assertEqual("in range", result["liftStatus"])
        self.assertGreaterEqual(result["hazardCount"], 1)
        self.assertEqual("v0.1.0 Faultline Survey", result["surveyRelease"])
        self.assertGreaterEqual(result["surveyCount"], 2)
        self.assertIn("east-shelf", result["surveyPassages"])
        self.assertIn("fault-gallery", result["surveyPassages"])
        self.assertEqual(3, result["surveyContractTarget"])
        self.assertEqual("v0.2.0 Deep Pumpworks", result["pumpworksRelease"])
        self.assertGreaterEqual(result["pumpworksCount"], 2)
        self.assertIn("lower-pumpworks", result["pumpworksPassages"])
        self.assertIn("sump-bypass", result["pumpworksPassages"])
        self.assertEqual(2, result["pumpworksContractTarget"])
        self.assertEqual(["function", "function", "function", "function"], result["pumpworksChoices"])
        self.assertEqual(1, result["siphonCharges"])
        self.assertEqual("v0.3.0 Cinder Vent Network", result["ventRelease"])
        self.assertEqual("v0.2.0 Deep Pumpworks", result["ventBaseRelease"])
        self.assertGreaterEqual(result["ventCount"], 2)
        self.assertIn("cinder-vent-shaft", result["ventPassages"])
        self.assertIn("fan-relay-bay", result["ventPassages"])
        self.assertEqual(2, result["ventContractRelays"])
        self.assertEqual(3, result["ventContractMap"])
        self.assertEqual(["function", "function", "function", "function"], result["ventChoices"])
        self.assertEqual(1, result["filterCharges"])
        self.assertEqual("v0.4.0 Echo Relay Network", result["echoRelease"])
        self.assertEqual("v0.3.0 Cinder Vent Network", result["echoBaseRelease"])
        self.assertGreaterEqual(result["relayCount"], 2)
        self.assertIn("echo-relay-alcove", result["relayPassages"])
        self.assertIn("lift-beacon-station", result["relayPassages"])
        self.assertEqual(2, result["echoContractTriangulations"])
        self.assertEqual(3, result["echoContractMap"])
        self.assertEqual(["function", "function", "function", "function", "function"], result["echoChoices"])
        self.assertEqual(2, result["echoCharges"])
        self.assertGreater(result["routeStability"], 0)
        self.assertEqual(["function", "function", "function", "function"], result["surveyChoices"])
        self.assertGreater(result["scannerRange"], 10)
        self.assertIsInstance(result["scannerTargetBearing"], int)
        self.assertEqual("active", result["runStatus"])
        self.assertEqual(0, result["credits"])
        self.assertGreaterEqual(result["upgradeCount"], 1)
        self.assertEqual(
            [
                "drillPowerBonus",
                "echoChargeBonus",
                "filterCartridgeBonus",
                "lanternChargeBonus",
                "oxygenMaxBonus",
                "siphonChargeBonus",
            ],
            result["carryoverKeys"],
        )
        self.assertEqual("close-third", result["cameraMode"])
        self.assertTrue(result["hasCameraVectors"])

    def test_fresh_state_exposes_first_expedition_contract_and_disclosure_flags(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 211 });
            const fresh = JSON.parse(JSON.stringify(state));
            state = game.stepRun(state, {}, 0.1);
            const discovered = JSON.parse(JSON.stringify(state));
            const late = game.createInitialState({ seed: 211, runCount: 5 });

            console.log(JSON.stringify({
              freshPhase: fresh.firstExpedition.phase,
              freshObjective: fresh.run.objective,
              phaseIds: fresh.firstExpedition.phases.map((phase) => phase.id),
              visibleTarget: fresh.firstExpedition.visibleTarget.name,
              visibleTargetKind: fresh.firstExpedition.visibleTarget.kind,
              contextAction: fresh.contextAction.action,
              contextLabel: fresh.contextAction.label,
              defaultCards: fresh.hud.defaultCards,
              controlHintCount: fresh.hud.controlHints.length,
              advancedAvailable: fresh.disclosure.advancedAvailable,
              advancedVisible: fresh.disclosure.advancedVisible,
              advancedDefaultHud: fresh.disclosure.defaultHudSystems,
              advancedSuppressed: fresh.hud.advancedSuppressed,
              discoveredPhase: discovered.firstExpedition.phase,
              discoveredObjective: discovered.run.objective,
              lateDefaultHud: late.disclosure.defaultHudSystems,
              lateVisible: late.disclosure.advancedVisible,
            }));
            """
        )

        self.assertEqual("lift-briefing", result["freshPhase"])
        self.assertIn("Copper Iris", result["freshObjective"])
        self.assertNotIn("pumpworks", result["freshObjective"].lower())
        self.assertEqual(
            [
                "lift-briefing",
                "first-sample-discovery",
                "place-first-lantern",
                "mine-first-sample",
                "return-to-lift",
                "bank-at-lift",
                "summary-upgrade-preview",
            ],
            result["phaseIds"],
        )
        self.assertEqual("Copper Iris", result["visibleTarget"])
        self.assertEqual("sample", result["visibleTargetKind"])
        self.assertEqual("move", result["contextAction"])
        self.assertEqual("Move Toward Copper Iris", result["contextLabel"])
        self.assertLessEqual(result["controlHintCount"], 4)
        self.assertIn("oxygen", result["defaultCards"])
        self.assertIn("contextAction", result["defaultCards"])
        self.assertNotIn("pumpworks", result["defaultCards"])
        self.assertTrue(result["advancedAvailable"]["pumpworks"])
        self.assertTrue(result["advancedAvailable"]["cinderVents"])
        self.assertTrue(result["advancedAvailable"]["echoRelays"])
        self.assertFalse(result["advancedVisible"]["pumpworks"])
        self.assertEqual([], result["advancedDefaultHud"])
        self.assertIn("pumpworks", result["advancedSuppressed"])
        self.assertEqual("first-sample-discovery", result["discoveredPhase"])
        self.assertEqual("Move toward Copper Iris.", result["discoveredObjective"])
        self.assertIn("pumpworks", result["lateDefaultHud"])
        self.assertIn("cinderVents", result["lateDefaultHud"])
        self.assertIn("echoRelays", result["lateDefaultHud"])
        self.assertTrue(result["lateVisible"]["rescue"])

    def test_core_controls_move_player_update_camera_collision_and_lift_bearing(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 7 });
            const start = JSON.parse(JSON.stringify(state));
            state = game.stepRun(state, { forward: true, turnRight: true }, 1);
            const afterMove = JSON.parse(JSON.stringify(state));
            state.player.position = { x: 30, y: 1.6, z: afterMove.player.position.z };
            state = game.syncDerivedState(state);
            state = game.stepRun(state, { strafeRight: true }, 1);
            console.log(JSON.stringify({
              moved: game.distance(start.player.position, afterMove.player.position),
              facingChanged: afterMove.player.facing !== start.player.facing,
              oxygenSpent: start.oxygen.current - afterMove.oxygen.current,
              cameraMoved: game.distance(start.camera.position, afterMove.camera.position),
              liftBearing: afterMove.lift.bearing,
              scannerLiftBearing: afterMove.scanner.liftBearing,
              blocked: state.movement.collision.lastBlocked,
              passage: afterMove.movement.collision.lastPassage,
            }));
            """
        )

        self.assertGreater(result["moved"], 1)
        self.assertTrue(result["facingChanged"])
        self.assertGreater(result["oxygenSpent"], 0)
        self.assertGreater(result["cameraMoved"], 1)
        self.assertIsInstance(result["liftBearing"], int)
        self.assertEqual(result["liftBearing"], result["scannerLiftBearing"])
        self.assertTrue(result["blocked"])
        self.assertIn(result["passage"], ("lift-bay", "main-cut"))

    def test_lantern_anchor_changes_inventory_and_pressure_seams(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let baseline = game.createInitialState({ seed: 5 });
            baseline.player.position = { x: 12, y: 1.6, z: -31 };
            baseline = game.syncDerivedState(baseline);
            const hazardDrain = game.oxygenDrainRate(baseline);
            let lit = game.placeLantern(baseline);
            const litDrain = game.oxygenDrainRate(lit);
            console.log(JSON.stringify({
              chargesBefore: baseline.lanterns.charges,
              chargesAfter: lit.lanterns.charges,
              anchors: lit.lanterns.anchors.length,
              anchorStatus: lit.lanterns.anchors[0].status,
              covered: game.coveredByLantern(lit),
              hazardDrain,
              litDrain,
              lightStatus: lit.light.status,
            }));
            """
        )

        self.assertEqual(3, result["chargesBefore"])
        self.assertEqual(2, result["chargesAfter"])
        self.assertEqual(1, result["anchors"])
        self.assertEqual("burning", result["anchorStatus"])
        self.assertTrue(result["covered"])
        self.assertGreater(result["hazardDrain"], result["litDrain"])
        self.assertIn("lantern", result["lightStatus"])

    def test_mining_lift_return_and_upgrade_carryover(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 19 });
            const node = state.sampleNodes[3];
            state.player.position = { x: node.position.x, y: 1.6, z: node.position.z };
            state = game.syncDerivedState(state);
            for (let pass = 0; pass < 6; pass += 1) {
              state = game.mineNearestSample(state, 1);
            }
            const afterMine = JSON.parse(JSON.stringify(state));
            state.player.position = { x: state.lift.position.x, y: 1.6, z: state.lift.position.z };
            state = game.returnToLift(game.syncDerivedState(state));
            const afterLift = JSON.parse(JSON.stringify(state));
            state = game.purchaseUpgrade(state, "tank-weave");
            const afterUpgrade = JSON.parse(JSON.stringify(state));
            const nextRun = game.resetRun(state);
            console.log(JSON.stringify({
              cargoAfterMine: afterMine.cargo.samples,
              valueAfterMine: afterMine.cargo.value,
              nodeRemaining: afterMine.sampleNodes[3].remaining,
              nodeStatus: afterMine.sampleNodes[3].mineState.status,
              creditsAfterLift: afterLift.credits,
              cargoAfterLift: afterLift.cargo.samples,
              runAfterLift: afterLift.run.status,
              purchased: afterUpgrade.upgrades.purchased,
              creditsAfterUpgrade: afterUpgrade.credits,
              nextOxygenMax: nextRun.oxygen.max,
              nextRunCount: nextRun.run.count,
            }));
            """
        )

        self.assertEqual(2, result["cargoAfterMine"])
        self.assertGreaterEqual(result["valueAfterMine"], 100)
        self.assertEqual(0, result["nodeRemaining"])
        self.assertEqual("depleted", result["nodeStatus"])
        self.assertEqual(result["valueAfterMine"], result["creditsAfterLift"])
        self.assertEqual(0, result["cargoAfterLift"])
        self.assertEqual("extracted", result["runAfterLift"])
        self.assertIn("tank-weave", result["purchased"])
        self.assertLess(result["creditsAfterUpgrade"], result["creditsAfterLift"])
        self.assertEqual(120, result["nextOxygenMax"])
        self.assertEqual(2, result["nextRunCount"])

    def test_oxygen_failure_is_reachable_and_readable(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 23 });
            state.player.position = { x: 12, y: 1.6, z: -31 };
            state.oxygen.current = 0.25;
            state = game.stepRun(game.syncDerivedState(state), { forward: true }, 1);
            console.log(JSON.stringify({
              runStatus: state.run.status,
              failureReason: state.run.failureReason,
              objective: state.run.objective,
              oxygen: state.oxygen.current,
            }));
            """
        )

        self.assertEqual("failed", result["runStatus"])
        self.assertEqual("oxygen depleted", result["failureReason"])
        self.assertIn("Restart", result["objective"])
        self.assertEqual(0, result["oxygen"])

    def run_node(self, script: str) -> dict:
        completed = subprocess.run(
            ["node", "-e", textwrap.dedent(script)],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(completed.stdout)


if __name__ == "__main__":
    unittest.main()

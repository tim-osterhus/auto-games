import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class IronLanternDescentDeepPumpworksTests(unittest.TestCase):
    def test_pumpworks_data_extends_cave_progression_and_scanner_targeting(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 101 });
            const cinder = state.pumpworksSites.find((site) => site.id === "pump-cinder-sump");
            state.player.position = { x: cinder.position.x, y: 1.6, z: cinder.position.z };
            state.elapsed = 48;
            state = game.pulseScanner(game.syncDerivedState(state));
            const nearest = game.nearestPumpworksSite(state);

            console.log(JSON.stringify({
              release: state.pumpworks.release.label,
              baseRelease: state.pumpworks.release.baseRelease,
              ventBaseRelease: state.ventNetwork.release.baseRelease,
              ventRelease: state.ventNetwork.release.label,
              passageIds: game.GAME_DATA.cave.passages.map((passage) => passage.id),
              collisionPassage: state.movement.collision.lastPassage,
              pumpworksCount: state.pumpworksSites.length,
              nearestPumpworks: nearest.site.id,
              activePumpworks: state.pumpworks.activeSiteId,
              scannerKind: state.scanner.targetKind,
              scannerPulseKind: state.scanner.lastPulse.targetKind,
              scannerPulseWindow: state.scanner.lastPulse.pumpworksWindow,
              cinderValve: cinder.valveId,
              cinderFlood: cinder.flood.baseLevel,
              cinderRequirement: cinder.requirements,
              contractTarget: state.pumpworks.contract.targetDrainedSites,
              contractPressure: state.pumpworks.contract.targetPressureRelief,
            }));
            """
        )

        self.assertEqual("v0.2.0 Deep Pumpworks", result["release"])
        self.assertEqual("v0.1.0 Faultline Survey", result["baseRelease"])
        self.assertEqual("v0.2.0 Deep Pumpworks", result["ventBaseRelease"])
        self.assertEqual("v0.3.0 Cinder Vent Network", result["ventRelease"])
        self.assertIn("lower-pumpworks", result["passageIds"])
        self.assertIn("sump-bypass", result["passageIds"])
        self.assertEqual("deep-room", result["collisionPassage"])
        self.assertGreaterEqual(result["pumpworksCount"], 2)
        self.assertEqual("pump-cinder-sump", result["nearestPumpworks"])
        self.assertEqual("pump-cinder-sump", result["activePumpworks"])
        self.assertEqual("pumpworks", result["scannerKind"])
        self.assertEqual("pumpworks", result["scannerPulseKind"])
        self.assertEqual("drain", result["scannerPulseWindow"])
        self.assertEqual("valve-cinder-return", result["cinderValve"])
        self.assertGreater(result["cinderFlood"], 0.5)
        self.assertEqual("survey-cinder-rib", result["cinderRequirement"]["surveySiteId"])
        self.assertTrue(result["cinderRequirement"]["stake"])
        self.assertEqual("partial", result["cinderRequirement"]["chart"])
        self.assertEqual(2, result["contractTarget"])
        self.assertEqual(50, result["contractPressure"])

    def test_cinder_pump_prime_valve_and_sample_bonus_tie_to_survey_route_and_oxygen(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 107 });
            const survey = state.surveySites.find((site) => site.id === "survey-cinder-rib");
            state.player.position = { x: survey.position.x, y: 1.6, z: survey.position.z };
            state = game.placeLantern(game.syncDerivedState(state));
            state = game.plantSurveyStake(state, "survey-cinder-rib");
            state = game.chartFaultSurvey(state, "survey-cinder-rib");

            const pump = state.pumpworksSites.find((site) => site.id === "pump-cinder-sump");
            state.player.position = { x: pump.position.x, y: 1.6, z: pump.position.z };
            state.elapsed = 50;
            state = game.placeLantern(game.syncDerivedState(state));
            const before = {
              drain: game.oxygenDrainRate(state),
              oxygen: state.oxygen.current,
              stability: state.routeStability.stability,
              routeConfidence: state.route.returnConfidence,
            };
            state = game.primePumpStation(state, "pump-cinder-sump");
            const primed = JSON.parse(JSON.stringify(state));
            state = game.turnPressureValve(state, "pump-cinder-sump");
            const drained = JSON.parse(JSON.stringify(state));

            const node = state.sampleNodes.find((entry) => entry.id === "sample-deep-lode");
            state.player.position = { x: node.position.x, y: 1.6, z: node.position.z };
            state = game.syncDerivedState(state);
            for (let pass = 0; pass < 3; pass += 1) {
              state = game.mineNearestSample(state, 1);
            }

            console.log(JSON.stringify({
              chartState: drained.surveySites.find((site) => site.id === "survey-cinder-rib").chartState,
              before,
              primedState: primed.pumpworksSites[0].pumpState,
              primedFlood: primed.pumpworksSites[0].floodLevel,
              drainedState: drained.pumpworksSites[0].drainageState,
              drainedValve: drained.pumpworksSites[0].valveState,
              drainedFlood: drained.pumpworksSites[0].floodLevel,
              pumpworksValue: drained.pumpworks.value,
              pumpworksMap: drained.pumpworks.mapProgress,
              pressureRelief: drained.pumpworks.pressureRelief,
              routeAfter: drained.route.returnConfidence,
              stabilityAfter: drained.routeStability.stability,
              oxygenAfter: drained.oxygen.current,
              sampleBonus: game.samplePumpworksValueBonus(drained, node),
              minedValue: state.cargo.value,
              lastYield: state.sampleNodes.find((entry) => entry.id === "sample-deep-lode").mineState.lastYield,
              routeGuideKinds: game.routeGuidePoints(drained).map((point) => point.kind),
              lastLog: drained.log[0].message,
            }));
            """
        )

        self.assertIn(result["chartState"], ("partial", "success"))
        self.assertEqual("primed", result["primedState"])
        self.assertLess(result["primedFlood"], 0.58)
        self.assertEqual("success", result["drainedState"])
        self.assertEqual("regulated", result["drainedValve"])
        self.assertLess(result["drainedFlood"], result["primedFlood"])
        self.assertEqual(64, result["pumpworksValue"])
        self.assertEqual(1, result["pumpworksMap"])
        self.assertEqual(20, result["pressureRelief"])
        self.assertGreater(result["routeAfter"], result["before"]["routeConfidence"])
        self.assertGreater(result["stabilityAfter"], result["before"]["stability"])
        self.assertLess(result["oxygenAfter"], result["before"]["oxygen"])
        self.assertEqual(10, result["sampleBonus"])
        self.assertEqual(80, result["minedValue"])
        self.assertEqual(80, result["lastYield"])
        self.assertIn("pumpworks-drainage", result["routeGuideKinds"])
        self.assertIn("pressure valve success", result["lastLog"])

    def test_partial_and_failed_pressure_windows_are_deterministic(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let partial = game.createInitialState({ seed: 109 });
            const cinder = partial.pumpworksSites.find((site) => site.id === "pump-cinder-sump");
            partial.player.position = { x: cinder.position.x, y: 1.6, z: cinder.position.z };
            partial.elapsed = 50;
            partial = game.syncDerivedState(partial);
            const partialBeforeOxygen = partial.oxygen.current;
            partial = game.primePumpStation(partial, "pump-cinder-sump");

            let failed = game.createInitialState({ seed: 109 });
            const overrun = failed.pumpworksSites.find((site) => site.id === "pump-cinder-sump");
            failed.player.position = { x: overrun.position.x, y: 1.6, z: overrun.position.z };
            failed.elapsed = 220;
            failed = game.syncDerivedState(failed);
            failed = game.primePumpStation(failed, "pump-cinder-sump");

            console.log(JSON.stringify({
              partialWindow: partial.pumpworksSites[0].windowState,
              partialPumpState: partial.pumpworksSites[0].pumpState,
              partialPrimed: partial.pumpworksSites[0].pumpPrimed,
              partialMissing: partial.pumpworksSites[0].lastMissing,
              partialOxygen: partial.oxygen.current,
              partialBeforeOxygen,
              partialLog: partial.log[0].message,
              failedWindow: failed.pumpworksSites[0].windowState,
              failedPumpState: failed.pumpworksSites[0].pumpState,
              failedDrainage: failed.pumpworksSites[0].drainageState,
              failedFloodLevel: failed.pumpworksSites[0].floodLevel,
              failedOxygen: failed.oxygen.current,
              failedLog: failed.log[0].message,
            }));
            """
        )

        self.assertEqual("drain", result["partialWindow"])
        self.assertEqual("misaligned", result["partialPumpState"])
        self.assertFalse(result["partialPrimed"])
        self.assertIn("survey stake", result["partialMissing"])
        self.assertIn("partial survey chart", result["partialMissing"])
        self.assertLess(result["partialOxygen"], result["partialBeforeOxygen"])
        self.assertIn("prime partial", result["partialLog"])
        self.assertEqual("overrun", result["failedWindow"])
        self.assertEqual("jammed", result["failedPumpState"])
        self.assertEqual("failed", result["failedDrainage"])
        self.assertGreater(result["failedFloodLevel"], 0.8)
        self.assertLess(result["failedOxygen"], 96)
        self.assertIn("pump jammed", result["failedLog"])

    def test_basalt_siphon_leak_valve_lift_banking_and_restart_carryover(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 113 });
            const survey = state.surveySites.find((site) => site.id === "survey-basalt-suture");
            state.player.position = { x: survey.position.x, y: 1.6, z: survey.position.z };
            state.elapsed = 50;
            state = game.placeLantern(game.syncDerivedState(state));
            state = game.plantSurveyStake(state, "survey-basalt-suture");
            state = game.braceSurveySite(state, "survey-basalt-suture");
            state = game.chartFaultSurvey(state, "survey-basalt-suture");

            const pump = state.pumpworksSites.find((site) => site.id === "pump-basalt-gate");
            state.player.position = { x: pump.position.x, y: 1.6, z: pump.position.z };
            state.elapsed = 70;
            state = game.placeLantern(game.syncDerivedState(state));
            const beforeDrain = {
              siphons: state.pumpworks.siphons,
              stability: state.routeStability.stability,
              drain: game.oxygenDrainRate(state),
            };
            state = game.sealLeakSeam(state, "pump-basalt-gate");
            state = game.deploySiphonCharge(state, "pump-basalt-gate");
            state = game.primePumpStation(state, "pump-basalt-gate");
            state = game.turnPressureValve(state, "pump-basalt-gate");
            const drained = JSON.parse(JSON.stringify(state));

            state.player.position = { x: state.lift.position.x, y: 1.6, z: state.lift.position.z };
            state = game.returnToLift(game.syncDerivedState(state));
            const afterLift = JSON.parse(JSON.stringify(state));
            const restarted = game.resetRun(state);

            console.log(JSON.stringify({
              surveyState: drained.surveySites.find((site) => site.id === "survey-basalt-suture").chartState,
              beforeDrain,
              leakSealed: drained.pumpworksSites[1].leakSealed,
              siphonDeployed: drained.pumpworksSites[1].siphonDeployed,
              siphonsAfter: drained.pumpworks.siphons,
              drainageState: drained.pumpworksSites[1].drainageState,
              pumpworksValue: drained.pumpworks.value,
              pumpworksMap: drained.pumpworks.mapProgress,
              pressureRelief: drained.pumpworks.pressureRelief,
              stabilityAfter: drained.routeStability.stability,
              drainAfter: game.oxygenDrainRate(drained),
              bankedCredits: afterLift.credits,
              bankedSurveyValue: afterLift.lift.bankedSurveyValue,
              bankedPumpworksValue: afterLift.lift.bankedPumpworksValue,
              bankedMapProgress: afterLift.lift.bankedMapProgress,
              bankedPumpworksMapProgress: afterLift.lift.bankedPumpworksMapProgress,
              surveyLedger: afterLift.survey.ledger,
              pumpworksLedger: afterLift.pumpworks.ledger,
              restartedPumpworksLedger: restarted.pumpworks.ledger,
              restartedSurveyLedger: restarted.survey.ledger,
              restartedSiphons: restarted.pumpworks.siphons,
              restartedRunCount: restarted.run.count,
            }));
            """
        )

        self.assertEqual("success", result["surveyState"])
        self.assertEqual(1, result["beforeDrain"]["siphons"])
        self.assertTrue(result["leakSealed"])
        self.assertTrue(result["siphonDeployed"])
        self.assertEqual(0, result["siphonsAfter"])
        self.assertEqual("success", result["drainageState"])
        self.assertEqual(96, result["pumpworksValue"])
        self.assertEqual(2, result["pumpworksMap"])
        self.assertEqual(32, result["pressureRelief"])
        self.assertGreater(result["stabilityAfter"], result["beforeDrain"]["stability"])
        self.assertLess(result["drainAfter"], result["beforeDrain"]["drain"])
        self.assertEqual(174, result["bankedCredits"])
        self.assertEqual(78, result["bankedSurveyValue"])
        self.assertEqual(96, result["bankedPumpworksValue"])
        self.assertEqual(2, result["bankedMapProgress"])
        self.assertEqual(2, result["bankedPumpworksMapProgress"])
        self.assertEqual(2, result["surveyLedger"])
        self.assertEqual(2, result["pumpworksLedger"])
        self.assertEqual(2, result["restartedPumpworksLedger"])
        self.assertEqual(2, result["restartedSurveyLedger"])
        self.assertEqual(1, result["restartedSiphons"])
        self.assertEqual(2, result["restartedRunCount"])

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

import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class IronLanternDescentSurvivalLoopTests(unittest.TestCase):
    def test_lantern_chain_improves_return_confidence_and_pressure(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let unmarked = game.createInitialState({ seed: 31 });
            unmarked.player.position = { x: 0, y: 1.6, z: -38 };
            unmarked = game.syncDerivedState(unmarked);
            const unmarkedDrain = game.oxygenDrainRate(unmarked);

            let routed = game.createInitialState({ seed: 31 });
            routed.player.position = { x: 0, y: 1.6, z: -10 };
            routed = game.placeLantern(game.syncDerivedState(routed));
            routed.player.position = { x: 0, y: 1.6, z: -26 };
            routed = game.placeLantern(game.syncDerivedState(routed));
            routed.player.position = { x: 0, y: 1.6, z: -38 };
            routed = game.syncDerivedState(routed);
            const routedDrain = game.oxygenDrainRate(routed);
            routed = game.pulseScanner(routed);

            console.log(JSON.stringify({
              unmarkedConfidence: unmarked.route.returnConfidence,
              routedConfidence: routed.route.returnConfidence,
              unmarkedDrain,
              routedDrain,
              routeStatus: routed.route.status,
              linkedLegs: routed.route.linkedLegs,
              stretchedLegs: routed.route.stretchedLegs,
              anchorCount: routed.route.anchorCount,
              scannerTargetKind: routed.scanner.targetKind,
              scannerTargetBearing: routed.scanner.targetBearing,
              scannerRouteBearing: routed.scanner.routeBearing,
              scannerLastPulse: routed.scanner.lastPulse,
              scannerStatus: routed.scanner.status,
            }));
            """
        )

        self.assertGreater(result["routedConfidence"], result["unmarkedConfidence"])
        self.assertGreater(result["unmarkedDrain"], result["routedDrain"])
        self.assertIn(result["routeStatus"], ("route visible", "anchor safe"))
        self.assertEqual(2, result["linkedLegs"])
        self.assertEqual(0, result["stretchedLegs"])
        self.assertEqual(2, result["anchorCount"])
        self.assertEqual("sample", result["scannerTargetKind"])
        self.assertIsInstance(result["scannerTargetBearing"], int)
        self.assertIsInstance(result["scannerRouteBearing"], int)
        self.assertEqual(result["routedConfidence"], result["scannerLastPulse"]["routeConfidence"])
        self.assertIn("pulse", result["scannerStatus"])

    def test_hazard_pressure_mining_lift_scoring_and_upgrade_carryover(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            const safe = game.createInitialState({ seed: 37 });
            let hazard = game.createInitialState({ seed: 37 });
            hazard.player.position = { x: 12, y: 1.6, z: -31 };
            hazard = game.syncDerivedState(hazard);

            let state = game.createInitialState({ seed: 37 });
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
              safeDrain: game.oxygenDrainRate(safe),
              hazardDrain: game.oxygenDrainRate(hazard),
              hazardNames: hazard.hazardZones.filter((zone) => zone.active).map((zone) => zone.name),
              samplesAfterMine: afterMine.cargo.samples,
              valueAfterMine: afterMine.cargo.value,
              nodeStatus: afterMine.sampleNodes[3].mineState.status,
              nodeRemaining: afterMine.sampleNodes[3].remaining,
              creditsAfterLift: afterLift.credits,
              cargoAfterLift: afterLift.cargo.samples,
              runAfterLift: afterLift.run.status,
              liftBanked: afterLift.lift.bankedSamples,
              purchased: afterUpgrade.upgrades.purchased,
              creditsAfterUpgrade: afterUpgrade.credits,
              nextOxygenMax: nextRun.oxygen.max,
              nextRunStatus: nextRun.run.status,
              nextRunCount: nextRun.run.count,
            }));
            """
        )

        self.assertGreater(result["hazardDrain"], result["safeDrain"])
        self.assertIn("Gas Vent", result["hazardNames"])
        self.assertEqual(2, result["samplesAfterMine"])
        self.assertGreaterEqual(result["valueAfterMine"], 100)
        self.assertEqual("depleted", result["nodeStatus"])
        self.assertEqual(0, result["nodeRemaining"])
        self.assertEqual(result["valueAfterMine"], result["creditsAfterLift"])
        self.assertEqual(0, result["cargoAfterLift"])
        self.assertEqual("extracted", result["runAfterLift"])
        self.assertEqual(2, result["liftBanked"])
        self.assertIn("tank-weave", result["purchased"])
        self.assertLess(result["creditsAfterUpgrade"], result["creditsAfterLift"])
        self.assertEqual(120, result["nextOxygenMax"])
        self.assertEqual("active", result["nextRunStatus"])
        self.assertEqual(2, result["nextRunCount"])

    def test_lift_return_requires_range_and_preserves_carried_samples(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 43 });
            state.cargo.samples = 1;
            state.cargo.value = 32;
            state.player.position = { x: 0, y: 1.6, z: -30 };
            state = game.returnToLift(game.syncDerivedState(state));
            console.log(JSON.stringify({
              liftStatus: state.lift.status,
              credits: state.credits,
              cargoSamples: state.cargo.samples,
              cargoValue: state.cargo.value,
              runStatus: state.run.status,
            }));
            """
        )

        self.assertEqual("too far", result["liftStatus"])
        self.assertEqual(0, result["credits"])
        self.assertEqual(1, result["cargoSamples"])
        self.assertEqual(32, result["cargoValue"])
        self.assertEqual("active", result["runStatus"])

    def test_failure_restart_clears_run_state_and_keeps_upgrades(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 47, credits: 70 });
            state = game.purchaseUpgrade(state, "tank-weave");
            state.player.position = { x: 12, y: 1.6, z: -31 };
            state.oxygen.current = 0.18;
            state = game.stepRun(game.syncDerivedState(state), { forward: true }, 1);
            const failed = JSON.parse(JSON.stringify(state));
            const restarted = game.resetRun(state);
            console.log(JSON.stringify({
              failedStatus: failed.run.status,
              failureReason: failed.run.failureReason,
              restartedStatus: restarted.run.status,
              restartedFailureReason: restarted.run.failureReason,
              restartedOxygen: restarted.oxygen.current,
              restartedOxygenMax: restarted.oxygen.max,
              restartedLanterns: restarted.lanterns.charges,
              restartedCredits: restarted.credits,
              purchased: restarted.upgrades.purchased,
              runCount: restarted.run.count,
            }));
            """
        )

        self.assertEqual("failed", result["failedStatus"])
        self.assertEqual("oxygen depleted", result["failureReason"])
        self.assertEqual("active", result["restartedStatus"])
        self.assertIsNone(result["restartedFailureReason"])
        self.assertEqual(120, result["restartedOxygen"])
        self.assertEqual(120, result["restartedOxygenMax"])
        self.assertEqual(3, result["restartedLanterns"])
        self.assertEqual(10, result["restartedCredits"])
        self.assertEqual(["tank-weave"], result["purchased"])
        self.assertEqual(2, result["runCount"])

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

import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "dark-factory-dispatch"


class DarkFactoryDispatchPressureLoopTests(unittest.TestCase):
    def test_contracts_have_timed_success_rewards_and_failure_penalties(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let success = game.createInitialState({ seed: 33, faultsEnabled: false });
            success.produced.drones = 2;
            success.produced.defenses = 2;
            success = game.stepFactory(success, 1);

            let failed = game.createInitialState({ seed: 44, faultsEnabled: false });
            failed = game.stepFactory(failed, game.GAME_DATA.contracts[0].deadline);

            console.log(JSON.stringify({
              successStatus: success.contracts[0].status,
              successRewardRep: success.resources.reputation,
              nextContractStatus: success.contracts[1].status,
              failureStatus: failed.contracts[0].status,
              failureStability: failed.resources.stability,
              failureNextStatus: failed.contracts[1].status,
              runFailedContracts: failed.run.failedContracts,
            }));
            """
        )

        self.assertEqual("complete", result["successStatus"])
        self.assertEqual(2, result["successRewardRep"])
        self.assertEqual("active", result["nextContractStatus"])
        self.assertEqual("failed", result["failureStatus"])
        self.assertLess(result["failureStability"], 100)
        self.assertEqual("active", result["failureNextStatus"])
        self.assertEqual(1, result["runFailedContracts"])

    def test_seeded_fault_blocks_lane_and_requires_recovery_decision(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 1972, faultGraceTicks: 0 });
            state = game.assignJobToLane(state, "forge-line", state.queue[0].id);
            state = game.startLane(state, "forge-line");
            state = game.stepFactory(state, 1);
            const blocked = state.lanes.find((lane) => lane.id === "forge-line");
            const resourcesAfterBlock = { ...state.resources };

            state = game.recoverLane(state, "forge-line");
            const recovering = state.lanes.find((lane) => lane.id === "forge-line");
            state.faults.enabled = false;
            state = game.stepFactory(state, recovering.recoveryRemaining);
            const ready = state.lanes.find((lane) => lane.id === "forge-line");
            state = game.startLane(state, "forge-line");
            state = game.stepFactory(state, 3);
            const complete = state.lanes.find((lane) => lane.id === "forge-line");

            console.log(JSON.stringify({
              blockedStatus: blocked.status,
              blockedFaultPhase: blocked.fault.phase,
              blockedFaultName: blocked.fault.name,
              recoveringStatus: recovering.status,
              recoveryRemaining: recovering.recoveryRemaining,
              powerSpent: resourcesAfterBlock.power - state.resources.power,
              readyStatus: ready.status,
              completeStatus: complete.status,
              producedCircuits: state.produced.circuits,
            }));
            """
        )

        self.assertEqual("blocked", result["blockedStatus"])
        self.assertEqual("blocked", result["blockedFaultPhase"])
        self.assertIn(result["blockedFaultName"], {"Material Jam", "Logic Drift"})
        self.assertEqual("recovering", result["recoveringStatus"])
        self.assertGreater(result["recoveryRemaining"], 0)
        self.assertGreaterEqual(result["powerSpent"], 1)
        self.assertEqual("assigned", result["readyStatus"])
        self.assertEqual("idle", result["completeStatus"])
        self.assertEqual(3, result["producedCircuits"])

    def test_upgrades_change_current_state_and_persist_into_replay(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 55, faultsEnabled: false });
            state.resources.reputation = 3;
            state.resources.circuits = 6;
            state.resources.modules = 2;
            state = game.purchaseUpgrade(state, "lane-overclock");
            state = game.purchaseUpgrade(state, "fault-guards");
            const currentLane = state.lanes.find((lane) => lane.id === "forge-line");
            const reset = game.resetFactoryState(state);
            const resetLane = reset.lanes.find((lane) => lane.id === "forge-line");

            console.log(JSON.stringify({
              purchased: state.upgrades.purchased,
              currentThroughput: currentLane.throughput,
              currentJamRisk: currentLane.jamRisk,
              resetRun: reset.restart.run,
              resetPurchased: reset.upgrades.purchased,
              resetThroughput: resetLane.throughput,
              resetJamRisk: resetLane.jamRisk,
            }));
            """
        )

        self.assertEqual(["lane-overclock", "fault-guards"], result["purchased"])
        self.assertGreater(result["currentThroughput"], 1.2)
        self.assertLess(result["currentJamRisk"], 0.08)
        self.assertEqual(2, result["resetRun"])
        self.assertEqual(["lane-overclock", "fault-guards"], result["resetPurchased"])
        self.assertEqual(result["currentThroughput"], result["resetThroughput"])
        self.assertEqual(result["currentJamRisk"], result["resetJamRisk"])

    def test_ui_styles_expose_pressure_recovery_and_upgrade_states(self) -> None:
        html = (GAME_DIR / "index.html").read_text(encoding="utf-8")
        css = (GAME_DIR / "dark-factory-dispatch.css").read_text(encoding="utf-8")
        js = (GAME_DIR / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        for token in ("upgrade-board", "Improvement rack"):
            self.assertIn(token, html)
        for token in ('data-status="recovering"', 'data-status="failed"', "button:disabled"):
            self.assertIn(token, css)
        for token in ("timeRemaining", "purchaseUpgrade", "faultGraceTicks", "recoveryRemaining"):
            self.assertIn(token, js)

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

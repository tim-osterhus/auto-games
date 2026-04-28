import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "dark-factory-dispatch"


class DarkFactoryDispatchFoundationTests(unittest.TestCase):
    def test_static_entrypoint_wires_shell_files_and_operator_regions(self) -> None:
        html = (GAME_DIR / "index.html").read_text(encoding="utf-8")

        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("dark-factory-dispatch.css", html)
        self.assertIn("dark-factory-dispatch.js", html)
        for region in (
            "resource-readouts",
            "lane-board",
            "queue-list",
            "contract-board",
            "job-catalog",
            "enqueue-job",
            "assign-next-job",
            "start-all-lanes",
            "reprioritize-job",
            "cancel-job",
            "restart-factory",
            "operator-log",
        ):
            self.assertIn(region, html)

    def test_state_data_defines_lanes_jobs_queues_contracts_and_restart_seams(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            const state = game.createInitialState({ seed: 99 });
            const payload = {
              laneCount: state.lanes.length,
              jobCount: game.GAME_DATA.jobTypes.length,
              queueCount: state.queue.length,
              contractCount: state.contracts.length,
              faultCount: state.faults.definitions.length,
              restartRun: state.restart.run,
              hasNamedIo: game.GAME_DATA.jobTypes.every((job) => (
                job.name && Object.keys(job.inputs).length && Object.keys(job.outputs).length
              )),
              laneTraits: state.lanes.map((lane) => lane.trait),
              laneRestartStates: state.lanes.map((lane) => lane.restartState),
            };
            console.log(JSON.stringify(payload));
            """
        )

        self.assertEqual(3, result["laneCount"])
        self.assertGreaterEqual(result["jobCount"], 4)
        self.assertGreaterEqual(result["queueCount"], 3)
        self.assertGreaterEqual(result["contractCount"], 2)
        self.assertGreaterEqual(result["faultCount"], 2)
        self.assertEqual(1, result["restartRun"])
        self.assertTrue(result["hasNamedIo"])
        self.assertIn("high heat", result["laneTraits"])
        self.assertTrue(all("clearsTo" in restart for restart in result["laneRestartStates"]))

    def test_core_dispatch_hooks_assign_start_step_reprioritize_cancel_and_reset(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 12 });
            state = game.enqueueJob(state, "weave-defenses");
            const raisedEntry = state.queue[state.queue.length - 1].id;
            state = game.reprioritizeQueue(state, raisedEntry);
            const raisedIndex = state.queue.findIndex((entry) => entry.id === raisedEntry);
            state = game.cancelQueueEntry(state, raisedEntry);
            const cancelled = state.queue.every((entry) => entry.id !== raisedEntry);

            state = game.assignJobToLane(state, "forge-line", state.queue[0].id);
            state = game.startLane(state, "forge-line");
            const scrapAfterStart = state.resources.scrap;
            state = game.stepFactory(state, 4);
            const laneAfterStep = state.lanes.find((lane) => lane.id === "forge-line");
            const progress = game.contractProgress(state.contracts[0], state);
            const restarted = game.resetFactoryState(state);

            console.log(JSON.stringify({
              raisedIndex,
              cancelled,
              scrapAfterStart,
              circuits: state.resources.circuits,
              producedCircuits: state.produced.circuits,
              laneStatus: laneAfterStep.status,
              completedJobs: laneAfterStep.completedJobs,
              progressResources: progress.map((line) => line.resource),
              restartedRun: restarted.restart.run,
              restartedQueue: restarted.queue.length,
            }));
            """
        )

        self.assertLess(result["raisedIndex"], 3)
        self.assertTrue(result["cancelled"])
        self.assertEqual(24, result["scrapAfterStart"])
        self.assertEqual(6, result["circuits"])
        self.assertEqual(3, result["producedCircuits"])
        self.assertEqual("idle", result["laneStatus"])
        self.assertEqual(1, result["completedJobs"])
        self.assertIn("defenses", result["progressResources"])
        self.assertEqual(2, result["restartedRun"])
        self.assertGreaterEqual(result["restartedQueue"], 3)

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

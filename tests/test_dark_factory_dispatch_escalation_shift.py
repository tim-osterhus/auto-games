import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DarkFactoryDispatchEscalationShiftTests(unittest.TestCase):
    def test_shift_progression_scales_contracts_and_persists_campaign_ledger(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            const first = game.createInitialState({ seed: 88, faultsEnabled: false });
            const second = game.resetFactoryState(first);
            const third = game.resetFactoryState(second);

            console.log(JSON.stringify({
              release: first.campaign.release,
              firstShift: first.campaign.shift,
              firstDemand: first.campaign.demand,
              firstContractDeadline: first.contracts[0].deadline,
              firstContractDefenses: first.contracts[0].requirement.defenses,
              firstEmergencyCount: first.contracts.filter((contract) => contract.emergency).length,
              secondShift: second.campaign.shift,
              secondDemand: second.campaign.demand,
              secondLedger: second.campaign.ledger,
              secondContractDeadline: second.contracts[0].deadline,
              secondContractDefenses: second.contracts[0].requirement.defenses,
              secondEmergency: second.contracts.find((contract) => contract.emergency),
              thirdShift: third.campaign.shift,
              thirdDemand: third.campaign.demand,
              thirdEmergencyTick: third.campaign.emergency.triggerTick,
            }));
            """
        )

        self.assertEqual("v0.1.0 Escalation Shift", result["release"])
        self.assertEqual(1, result["firstShift"])
        self.assertEqual(1, result["firstDemand"])
        self.assertEqual(20, result["firstContractDeadline"])
        self.assertEqual(2, result["firstContractDefenses"])
        self.assertEqual(0, result["firstEmergencyCount"])
        self.assertEqual(2, result["secondShift"])
        self.assertEqual(2, result["secondDemand"])
        self.assertEqual(1, len(result["secondLedger"]))
        self.assertEqual(1, result["secondLedger"][0]["shift"])
        self.assertEqual(18, result["secondContractDeadline"])
        self.assertEqual(3, result["secondContractDefenses"])
        self.assertEqual("pending", result["secondEmergency"]["status"])
        self.assertEqual(6, result["secondEmergency"]["activationTick"])
        self.assertEqual("stabilize-grid", result["secondEmergency"]["jobTypeId"])
        self.assertEqual(3, result["thirdShift"])
        self.assertEqual(3, result["thirdDemand"])
        self.assertEqual(4, result["thirdEmergencyTick"])

    def test_emergency_order_activates_queues_work_and_respects_emergency_policy(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.resetFactoryState(game.createInitialState({ seed: 12, faultsEnabled: false }));
            state.faults.enabled = false;
            state = game.stepFactory(state, 6);
            const activated = JSON.parse(JSON.stringify(state));

            state = game.setQueuePolicy(state, "emergency-first");
            const policyState = JSON.parse(JSON.stringify(state));
            state = game.assignJobToLane(state, "forge-line");
            state = game.startLane(state, "forge-line");
            state = game.stepFactory(state, 4);
            const emergency = state.contracts.find((contract) => contract.emergency);

            console.log(JSON.stringify({
              activatedEmergency: activated.campaign.emergency,
              activatedContract: activated.contracts.find((contract) => contract.emergency),
              activatedQueue: activated.queue.map((entry) => ({
                jobTypeId: entry.jobTypeId,
                emergency: entry.emergency,
                status: entry.status,
                sourceContractId: entry.sourceContractId,
              })),
              policy: policyState.campaign.queuePolicy,
              heldOrdinaryJobs: policyState.queue.filter((entry) => !entry.emergency).map((entry) => entry.status),
              assignedJob: state.lanes.find((lane) => lane.id === "forge-line").completedJobs,
              finalEmergencyStatus: emergency.status,
              emergencyProduced: state.produced.stability,
              rewardReputation: state.resources.reputation,
              releasedQueue: state.queue.map((entry) => entry.status),
            }));
            """
        )

        self.assertEqual("active", result["activatedEmergency"]["status"])
        self.assertEqual("active", result["activatedContract"]["status"])
        self.assertEqual("stabilize-grid", result["activatedQueue"][0]["jobTypeId"])
        self.assertTrue(result["activatedQueue"][0]["emergency"])
        self.assertEqual("coolant-diversion", result["activatedQueue"][0]["sourceContractId"])
        self.assertEqual("emergency-first", result["policy"])
        self.assertTrue(result["heldOrdinaryJobs"])
        self.assertTrue(all(status == "held" for status in result["heldOrdinaryJobs"]))
        self.assertEqual(1, result["assignedJob"])
        self.assertEqual("complete", result["finalEmergencyStatus"])
        self.assertEqual(6, result["emergencyProduced"])
        self.assertEqual(1, result["rewardReputation"])
        self.assertTrue(all(status == "queued" for status in result["releasedQueue"]))

    def test_lane_overdrive_spends_power_and_stability_for_faster_riskier_assignment(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            const baseline = game.createInitialState({ seed: 44, faultsEnabled: false });
            const baselineAssigned = game.assignJobToLane(baseline, "forge-line", baseline.queue[0].id);

            let overdriven = game.toggleLaneOverdrive(baseline, "forge-line", true);
            overdriven = game.assignJobToLane(overdriven, "forge-line", overdriven.queue[0].id);
            const lane = overdriven.lanes.find((candidate) => candidate.id === "forge-line");

            console.log(JSON.stringify({
              baselinePower: baseline.resources.power,
              baselineStability: baseline.resources.stability,
              overdrivePower: overdriven.resources.power,
              overdriveStability: overdriven.resources.stability,
              baselineThroughput: baseline.lanes[0].throughput,
              overdriveThroughput: lane.throughput,
              baselineJamRisk: baseline.lanes[0].jamRisk,
              overdriveJamRisk: lane.jamRisk,
              baselineDuration: baselineAssigned.lanes[0].currentJob.duration,
              overdriveDuration: lane.currentJob.duration,
              overdriveActive: lane.overdrive.active,
              overdriveChoices: overdriven.campaign.choices.laneOverdrives,
            }));
            """
        )

        self.assertEqual(12, result["baselinePower"])
        self.assertEqual(100, result["baselineStability"])
        self.assertEqual(10, result["overdrivePower"])
        self.assertEqual(96, result["overdriveStability"])
        self.assertGreater(result["overdriveThroughput"], result["baselineThroughput"])
        self.assertGreater(result["overdriveJamRisk"], result["baselineJamRisk"])
        self.assertLess(result["overdriveDuration"], result["baselineDuration"])
        self.assertTrue(result["overdriveActive"])
        self.assertEqual(1, result["overdriveChoices"])

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

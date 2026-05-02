import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DarkFactoryDispatchFreightLockdownTests(unittest.TestCase):
    def test_freight_manifests_open_with_dock_cargo_window_and_inspection_queue(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let first = game.createInitialState({ seed: 201, faultsEnabled: false, tutorialCompleted: true });
            first = game.stepFactory(first, 2);
            const firstFreight = game.freightSurfaceState(first);
            const campaign = game.campaignSurfaceState(first);

            let second = game.createInitialState({ run: 2, seed: 202, faultsEnabled: false });
            second = game.stepFactory(second, 3);
            const secondFreight = game.freightSurfaceState(second);

            console.log(JSON.stringify({
              release: first.campaign.release,
              freightRelease: first.freight.release,
              railRelease: first.railSabotage.release,
              crisisRelease: first.crisisArbitration.release,
              campaignFreightRelease: campaign.freight.release,
              campaignCrisisRelease: campaign.crisisArbitration.release,
              campaignRailStatus: campaign.railSabotage.status,
              manifestCount: game.GAME_DATA.freightLockdown.manifests.length,
              inspectionJob: game.GAME_DATA.jobTypes.find((job) => job.id === "inspect-cargo-seals"),
              firstManifest: firstFreight.manifests.find((manifest) => manifest.id === "ashline-spare-crates"),
              crisisCase: campaign.crisisArbitration.cases.find((caseState) => caseState.id === "ashline-dock-priority"),
              futureManifest: firstFreight.manifests.find((manifest) => manifest.id === "blackout-relay-carrier"),
              inspectionQueue: first.queue.filter((entry) => entry.freightDirective),
              secondManifest: secondFreight.manifests.find((manifest) => manifest.id === "blackout-relay-carrier"),
            }));
            """
        )

        self.assertEqual("v0.4.0 Freight Lockdown", result["release"])
        self.assertEqual("v0.4.0 Freight Lockdown", result["freightRelease"])
        self.assertEqual("v0.5.0 Rail Sabotage", result["railRelease"])
        self.assertEqual("v0.6.0 Crisis Arbitration", result["crisisRelease"])
        self.assertEqual("v0.4.0 Freight Lockdown", result["campaignFreightRelease"])
        self.assertEqual("v0.6.0 Crisis Arbitration", result["campaignCrisisRelease"])
        self.assertEqual("incident-open", result["campaignRailStatus"])
        self.assertGreaterEqual(result["manifestCount"], 2)
        self.assertEqual("freight", result["inspectionJob"]["family"])

        first_manifest = result["firstManifest"]
        self.assertEqual("available", first_manifest["status"])
        self.assertEqual("dock-alpha", first_manifest["dockId"])
        self.assertEqual("forge-line", first_manifest["laneId"])
        self.assertEqual("forge-bus", first_manifest["sectorId"])
        self.assertEqual({"circuits": 3, "modules": 1}, first_manifest["cargo"]["required"])
        self.assertEqual(2, first_manifest["window"]["opensAtTick"])
        self.assertGreater(first_manifest["window"]["closesAtTick"], first_manifest["window"]["opensAtTick"])
        self.assertGreaterEqual(first_manifest["route"]["currentRisk"], 1)
        self.assertEqual("queued", first_manifest["inspection"]["status"])
        self.assertTrue(result["inspectionQueue"])
        self.assertEqual("inspect-cargo-seals", result["inspectionQueue"][0]["jobTypeId"])
        self.assertEqual("ashline-spare-crates", result["inspectionQueue"][0]["sourceFreightId"])
        self.assertEqual("ashline-spare-crates", result["crisisCase"]["linked"]["manifestId"])
        self.assertEqual("scheduled", result["crisisCase"]["status"])
        self.assertEqual("pending", result["futureManifest"]["status"])

        second_manifest = result["secondManifest"]
        self.assertEqual("available", second_manifest["status"])
        self.assertEqual("signal-firewall", second_manifest["contractId"])
        self.assertEqual({"modules": 2, "drones": 2, "defenses": 1}, second_manifest["cargo"]["required"])

    def test_staging_security_reserve_clearance_launch_and_full_payout_are_stateful(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 211, faultsEnabled: false, tutorialCompleted: true });
            state = game.stepFactory(state, 2);
            state.resources.circuits = 5;
            state.resources.modules = 2;
            state.resources.drones = 1;
            state.resources.defenses = 1;

            const before = {
              circuits: state.resources.circuits,
              modules: state.resources.modules,
              drones: state.resources.drones,
              reserve: state.grid.reserve.available,
            };
            state = game.stageFreightCargo(state, "ashline-spare-crates");
            const staged = game.freightSurfaceState(state).manifests[0];
            state = game.assignFreightRouteSecurity(state, "ashline-spare-crates", "drones");
            state = game.authorizeFreightLaunchClearance(state, "ashline-spare-crates");
            state = game.sealFreightCarrier(state, "ashline-spare-crates");
            const sealedLane = JSON.parse(JSON.stringify(state.lanes.find((lane) => lane.id === "forge-line")));
            state = game.launchFreightManifest(state, "ashline-spare-crates");
            const launchedLane = JSON.parse(JSON.stringify(state.lanes.find((lane) => lane.id === "forge-line")));
            state = game.stepFactory(state, 3);
            const surface = game.freightSurfaceState(state);
            const manifest = surface.manifests.find((candidate) => candidate.id === "ashline-spare-crates");

            console.log(JSON.stringify({
              before,
              staged,
              sealedLane,
              launchedLane,
              manifest,
              resources: state.resources,
              reserve: state.grid.reserve,
              contractFreight: state.contracts.find((contract) => contract.id === "perimeter-grid").freightOutcomes,
              freightOutcomes: surface.outcomes,
              choices: game.campaignSurfaceState(state).choices,
              remainingInspectionQueue: state.queue.filter((entry) => entry.freightDirective),
            }));
            """
        )

        staged = result["staged"]
        manifest = result["manifest"]

        self.assertEqual({"circuits": 3, "modules": 1}, staged["cargo"]["staged"])
        self.assertEqual({}, staged["cargo"]["remaining"])
        self.assertEqual(result["before"]["circuits"] - 3, result["resources"]["circuits"])
        self.assertEqual(result["before"]["modules"] - 1, result["resources"]["modules"])
        self.assertEqual(result["before"]["drones"] - 1, result["resources"]["drones"])
        self.assertEqual("locked", result["sealedLane"]["status"])
        self.assertEqual("freight-lockdown", result["sealedLane"]["gridLock"]["reason"])
        self.assertEqual("idle", result["launchedLane"]["status"])

        self.assertEqual("complete", manifest["status"])
        self.assertEqual("full", manifest["outcome"])
        self.assertGreaterEqual(manifest["integrity"], 85)
        self.assertEqual(1, manifest["security"]["drones"])
        self.assertTrue(manifest["security"]["reserveClearance"])
        self.assertEqual(2, result["reserve"]["available"])
        self.assertEqual(1, result["reserve"]["draws"])
        self.assertEqual(1, result["freightOutcomes"]["full"])
        self.assertEqual("full", result["contractFreight"][0]["outcome"])
        self.assertEqual(1, result["resources"]["reputation"])
        self.assertFalse(result["remainingInspectionQueue"])
        self.assertEqual(1, result["choices"]["freightStages"])
        self.assertEqual(1, result["choices"]["freightEscorts"])
        self.assertEqual(1, result["choices"]["freightReserveClearances"])
        self.assertEqual(1, result["choices"]["freightSeals"])
        self.assertEqual(1, result["choices"]["freightLaunches"])

    def test_reroute_and_defense_screen_reduce_contaminated_route_security_risk(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ run: 2, seed: 221, faultsEnabled: false });
            state = game.stepFactory(state, 4);
            state.resources.defenses = 2;
            state.resources.power = 12;
            state.resources.stability = 100;
            const before = game.freightSurfaceState(state)
              .manifests.find((manifest) => manifest.id === "blackout-relay-carrier");
            const breachBefore = state.breach.intensity;

            state = game.rerouteFreightManifest(state, "blackout-relay-carrier", "clean-bus");
            state = game.assignFreightRouteSecurity(state, "blackout-relay-carrier", "defenses");
            const after = game.freightSurfaceState(state)
              .manifests.find((manifest) => manifest.id === "blackout-relay-carrier");

            console.log(JSON.stringify({
              before,
              after,
              breachBefore,
              breachAfter: state.breach.intensity,
              resources: state.resources,
              choices: game.campaignSurfaceState(state).choices,
            }));
            """
        )

        self.assertTrue(result["before"]["route"]["contaminatedExposure"])
        self.assertGreater(result["before"]["route"]["currentRisk"], result["after"]["route"]["currentRisk"])
        self.assertTrue(result["after"]["route"]["rerouted"])
        self.assertEqual("clean-bus", result["after"]["route"]["reroutedAround"])
        self.assertFalse(result["after"]["route"]["contaminatedExposure"])
        self.assertEqual(1, result["after"]["security"]["defenses"])
        self.assertEqual(1, result["resources"]["defenses"])
        self.assertLess(result["breachAfter"], result["breachBefore"])
        self.assertEqual(1, result["choices"]["freightReroutes"])
        self.assertEqual(1, result["choices"]["freightDefenseScreens"])

    def test_unprotected_launch_can_fail_and_persist_freight_carryover_to_restart(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ run: 2, seed: 231, faultsEnabled: false });
            state = game.stepFactory(state, 4);
            state.resources.modules = 4;
            state.resources.drones = 3;
            state.resources.defenses = 2;
            state.resources.circuits = 5;
            state.resources.power = 12;
            state.resources.stability = 100;

            const beforeGridPressure = state.grid.pressure;
            state = game.stageFreightCargo(state, "blackout-relay-carrier");
            state = game.sealFreightCarrier(state, "blackout-relay-carrier");
            state = game.launchFreightManifest(state, "blackout-relay-carrier");
            state = game.stepFactory(state, 5);
            const failedManifest = game.freightSurfaceState(state)
              .manifests.find((manifest) => manifest.id === "blackout-relay-carrier");
            const reset = game.resetFactoryState(state);
            const ledgerFreight = reset.campaign.ledger[0].freight;

            console.log(JSON.stringify({
              beforeGridPressure,
              gridPressure: state.grid.pressure,
              failedManifest,
              freightOutcomes: game.freightSurfaceState(state).outcomes,
              contractFreight: state.contracts.find((contract) => contract.id === "signal-firewall").freightOutcomes,
              ledgerFreight,
              resetCarryover: reset.freight.carryover,
              resetResources: reset.resources,
            }));
            """
        )

        manifest = result["failedManifest"]
        self.assertEqual("failed", manifest["status"])
        self.assertEqual("failed", manifest["outcome"])
        self.assertLess(manifest["integrity"], 45)
        self.assertTrue(manifest["route"]["contaminatedExposure"])
        self.assertEqual(1, result["freightOutcomes"]["failed"])
        self.assertEqual("failed", result["contractFreight"][0]["outcome"])
        self.assertGreater(result["gridPressure"], result["beforeGridPressure"])
        self.assertEqual(result["ledgerFreight"]["carryover"], result["resetCarryover"])
        self.assertGreaterEqual(result["resetCarryover"]["lockdownScar"], 2)
        self.assertGreaterEqual(result["resetCarryover"]["lostCargo"], 5)
        self.assertLess(result["resetResources"]["stability"], 100)

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

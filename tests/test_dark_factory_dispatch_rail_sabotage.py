import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DarkFactoryDispatchRailSabotageTests(unittest.TestCase):
    def test_sabotage_incidents_open_with_suspect_manifest_dock_lane_and_sweep_queue(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let first = game.createInitialState({ seed: 301, faultsEnabled: false, tutorialCompleted: true });
            first = game.stepFactory(first, 2);
            const firstRail = game.railSabotageSurfaceState(first);
            const firstFreight = game.freightSurfaceState(first);
            const firstCrisis = game.crisisArbitrationSurfaceState(first);

            let second = game.createInitialState({ run: 2, seed: 302, faultsEnabled: false });
            second = game.stepFactory(second, 3);
            const secondRail = game.railSabotageSurfaceState(second);

            console.log(JSON.stringify({
              release: first.railSabotage.release,
              surfaceRelease: firstRail.release,
              incidentCount: game.GAME_DATA.railSabotage.incidents.length,
              sweepJob: game.GAME_DATA.jobTypes.find((job) => job.id === "sweep-sabotage-cells"),
              sabotageContract: game.GAME_DATA.contracts.find((contract) => contract.id === "hostile-rail-directive"),
              firstIncident: firstRail.incidents.find((incident) => incident.id === "ashline-rail-spoof"),
              firstCrisisCase: firstCrisis.cases.find((caseState) => caseState.id === "ashline-dock-priority"),
              firstManifest: firstFreight.manifests.find((manifest) => manifest.id === "ashline-spare-crates"),
              sabotageQueue: first.queue.filter((entry) => entry.sabotageDirective),
              futureIncident: firstRail.incidents.find((incident) => incident.id === "blackout-yard-saboteurs"),
              secondIncident: secondRail.incidents.find((incident) => incident.id === "blackout-yard-saboteurs"),
            }));
            """
        )

        self.assertEqual("v0.5.0 Rail Sabotage", result["release"])
        self.assertEqual("v0.5.0 Rail Sabotage", result["surfaceRelease"])
        self.assertGreaterEqual(result["incidentCount"], 2)
        self.assertEqual("sabotage", result["sweepJob"]["family"])
        self.assertEqual("sabotage", result["sabotageContract"]["family"])

        first_incident = result["firstIncident"]
        self.assertEqual("available", first_incident["status"])
        self.assertEqual("dock-alpha", first_incident["dockId"])
        self.assertEqual("forge-line", first_incident["laneId"])
        self.assertEqual("forge-bus", first_incident["sectorId"])
        self.assertEqual("ashline-spare-crates", first_incident["manifestId"])
        self.assertEqual("ashline-rail-spoof", result["firstCrisisCase"]["linked"]["railIncidentId"])
        self.assertEqual("scheduled", result["firstCrisisCase"]["status"])
        self.assertEqual({"circuits": 3, "modules": 1}, first_incident["trigger"]["suspectCargo"])
        self.assertEqual(2, first_incident["window"]["opensAtTick"])
        self.assertGreater(first_incident["window"]["closesAtTick"], first_incident["window"]["opensAtTick"])
        self.assertGreaterEqual(first_incident["pressure"]["current"], 4)
        self.assertEqual("queued", first_incident["scan"]["status"])
        self.assertEqual("drones", first_incident["requirements"]["patrol"])

        self.assertTrue(result["firstManifest"]["sabotage"]["suspect"])
        self.assertEqual("ashline-rail-spoof", result["firstManifest"]["sabotage"]["incidentId"])
        self.assertEqual("suspect", result["firstManifest"]["sabotage"]["scanStatus"])
        self.assertEqual("sweep-sabotage-cells", result["sabotageQueue"][0]["jobTypeId"])
        self.assertEqual("ashline-rail-spoof", result["sabotageQueue"][0]["sourceSabotageId"])

        self.assertEqual("pending", result["futureIncident"]["status"])
        self.assertEqual("available", result["secondIncident"]["status"])
        self.assertEqual("signal breach carrier handoff", result["secondIncident"]["trigger"]["route"])
        self.assertEqual("defenses", result["secondIncident"]["requirements"]["patrol"])

    def test_scan_patrol_decoy_and_intercept_contain_sabotage_with_freight_effects(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 311, faultsEnabled: false, tutorialCompleted: true });
            state = game.stepFactory(state, 2);
            state.resources.circuits = 5;
            state.resources.power = 12;
            state.resources.drones = 2;
            state.resources.defenses = 2;
            state.resources.scrap = 28;

            const before = {
              pressure: game.railSabotageSurfaceState(state).pressure,
              routeRisk: game.freightSurfaceState(state).manifests
                .find((manifest) => manifest.id === "ashline-spare-crates").route.currentRisk,
            };
            state = game.scanSabotageManifest(state, "ashline-rail-spoof");
            state = game.assignSabotagePatrol(state, "ashline-rail-spoof", "drones");
            state = game.deploySabotageDecoy(state, "ashline-rail-spoof", "forge-bus");
            state = game.interceptSabotageCell(state, "ashline-rail-spoof");
            const surface = game.railSabotageSurfaceState(state);
            const incident = surface.incidents.find((candidate) => candidate.id === "ashline-rail-spoof");
            const manifest = game.freightSurfaceState(state).manifests
              .find((candidate) => candidate.id === "ashline-spare-crates");

            console.log(JSON.stringify({
              before,
              surface,
              incident,
              manifest,
              resources: state.resources,
              choices: game.campaignSurfaceState(state).choices,
              sabotageOutcomes: state.contracts.find((contract) => contract.id === "perimeter-grid").sabotageOutcomes,
              remainingSweepQueue: state.queue.filter((entry) => entry.sabotageDirective),
            }));
            """
        )

        incident = result["incident"]
        manifest = result["manifest"]

        self.assertEqual("contained", incident["status"])
        self.assertEqual("contained", incident["outcome"])
        self.assertEqual("complete", incident["scan"]["status"])
        self.assertEqual(1, incident["patrol"]["drones"])
        self.assertTrue(incident["decoy"]["deployed"])
        self.assertTrue(incident["containment"]["intercepted"])
        self.assertGreaterEqual(incident["containment"]["score"], incident["containment"]["requiredScore"])
        self.assertLess(result["surface"]["pressure"], result["before"]["pressure"])

        self.assertEqual("complete", manifest["sabotage"]["scanStatus"])
        self.assertEqual(1, manifest["sabotage"]["patrolDrones"])
        self.assertTrue(manifest["sabotage"]["decoy"])
        self.assertLess(manifest["route"]["currentRisk"], result["before"]["routeRisk"])
        self.assertEqual(0, manifest["sabotage"]["integrityDamage"])
        self.assertEqual(1, result["surface"]["outcomes"]["contained"])
        self.assertEqual("contained", result["sabotageOutcomes"][0]["outcome"])
        self.assertFalse(result["remainingSweepQueue"])

        self.assertEqual(1, result["choices"]["sabotageScans"])
        self.assertEqual(1, result["choices"]["sabotagePatrolDrones"])
        self.assertEqual(1, result["choices"]["sabotageDecoys"])
        self.assertEqual(1, result["choices"]["sabotageInterceptions"])
        self.assertGreaterEqual(result["resources"]["reputation"], 1)

    def test_failed_sabotage_damages_carrier_locks_lane_repairs_and_carries_to_restart(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ run: 2, seed: 321, faultsEnabled: false });
            state = game.stepFactory(state, 14);
            const failedSurface = game.railSabotageSurfaceState(state);
            const failedIncident = failedSurface.incidents.find((incident) => incident.id === "blackout-yard-saboteurs");
            const failedManifest = game.freightSurfaceState(state).manifests
              .find((manifest) => manifest.id === "blackout-relay-carrier");
            const failedLane = state.lanes.find((lane) => lane.id === "clean-room");
            const failedSector = state.grid.sectors.find((sector) => sector.id === "clean-bus");
            const reset = game.resetFactoryState(state);

            state.resources.modules = 2;
            state.resources.power = 12;
            const repaired = game.repairSabotagedLane(state, "blackout-yard-saboteurs");
            const repairedIncident = game.railSabotageSurfaceState(repaired).incidents
              .find((incident) => incident.id === "blackout-yard-saboteurs");
            const repairedLane = repaired.lanes.find((lane) => lane.id === "clean-room");

            console.log(JSON.stringify({
              failedSurface,
              failedIncident,
              failedManifest,
              failedLane,
              failedSector,
              ledgerRail: reset.campaign.ledger[0].railSabotage,
              resetCarryover: reset.railSabotage.carryover,
              resetResources: reset.resources,
              repairedIncident,
              repairedLane,
              repairChoices: game.campaignSurfaceState(repaired).choices,
            }));
            """
        )

        incident = result["failedIncident"]
        self.assertEqual("failed", incident["status"])
        self.assertEqual("failed", incident["outcome"])
        self.assertGreaterEqual(incident["carrier"]["integrityDamage"], 40)
        self.assertEqual("sabotaged", incident["laneDamage"]["status"])
        self.assertLess(result["failedManifest"]["integrity"], 100)
        self.assertEqual("locked", result["failedLane"]["status"])
        self.assertEqual("rail-sabotage", result["failedLane"]["gridLock"]["reason"])
        self.assertFalse(result["failedSector"]["powered"])
        self.assertGreaterEqual(result["failedSurface"]["outcomes"]["failed"], 1)

        self.assertEqual(result["ledgerRail"]["carryover"], result["resetCarryover"])
        self.assertGreaterEqual(result["resetCarryover"]["sabotageScar"], 3)
        self.assertGreaterEqual(result["resetCarryover"]["tamperedCargo"], 5)
        self.assertIn("clean-room", result["resetCarryover"]["damagedLanes"])
        self.assertLess(result["resetResources"]["stability"], 100)

        self.assertEqual("repaired", result["repairedIncident"]["laneDamage"]["status"])
        self.assertEqual("idle", result["repairedLane"]["status"])
        self.assertIsNone(result["repairedLane"]["gridLock"])
        self.assertEqual(1, result["repairChoices"]["sabotageLaneRepairs"])

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

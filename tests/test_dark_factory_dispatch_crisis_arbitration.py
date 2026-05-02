import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DarkFactoryDispatchCrisisArbitrationTests(unittest.TestCase):
    def test_crisis_cases_open_with_cross_system_links_and_active_docket(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let first = game.createInitialState({ seed: 601, faultsEnabled: false, tutorialCompleted: true });
            first = game.stepFactory(first, 4);
            const firstSurface = game.crisisArbitrationSurfaceState(first);

            let second = game.createInitialState({ run: 2, seed: 602, faultsEnabled: false });
            second = game.stepFactory(second, 4);
            const secondSurface = game.crisisArbitrationSurfaceState(second);

            console.log(JSON.stringify({
              release: first.crisisArbitration.release,
              surfaceRelease: firstSurface.release,
              caseCount: game.GAME_DATA.crisisArbitration.cases.length,
              firstCase: firstSurface.cases.find((caseState) => caseState.id === "ashline-dock-priority"),
              secondCase: secondSurface.cases.find((caseState) => caseState.id === "blackout-yard-jurisdiction"),
              activeDocket: firstSurface.activeDocket,
              railRelease: first.railSabotage.release,
            }));
            """
        )

        self.assertEqual("v0.6.0 Crisis Arbitration", result["release"])
        self.assertEqual("v0.6.0 Crisis Arbitration", result["surfaceRelease"])
        self.assertEqual("v0.5.0 Rail Sabotage", result["railRelease"])
        self.assertGreaterEqual(result["caseCount"], 2)

        first_case = result["firstCase"]
        self.assertEqual("open", first_case["status"])
        self.assertEqual("forge-line", first_case["linked"]["laneId"])
        self.assertEqual("forge-bus", first_case["linked"]["sectorId"])
        self.assertEqual("spoofed-dispatch-uplink", first_case["linked"]["breachSourceId"])
        self.assertEqual("ashline-spare-crates", first_case["linked"]["manifestId"])
        self.assertEqual("ashline-rail-spoof", first_case["linked"]["railIncidentId"])
        self.assertEqual("perimeter-grid", first_case["linked"]["contractId"])
        self.assertEqual(["queue", "lane", "grid", "breach", "freight", "rail"], first_case["evidence"]["required"])
        self.assertIn("freight-first", first_case["priorityOrder"])
        self.assertGreater(first_case["dueTick"], first_case["openedAtTick"])
        self.assertEqual(["ashline-dock-priority"], [entry["id"] for entry in result["activeDocket"]])

        self.assertEqual("open", result["secondCase"]["status"])
        self.assertEqual("clean-room", result["secondCase"]["linked"]["laneId"])
        self.assertEqual("audit-ghost-carrier", result["secondCase"]["linked"]["breachSourceId"])
        self.assertEqual("blackout-yard-saboteurs", result["secondCase"]["linked"]["railIncidentId"])

    def test_evidence_lane_protection_and_grid_first_ruling_bind_subsystem_state(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 611, faultsEnabled: false, tutorialCompleted: true });
            state = game.stepFactory(state, 4);
            state.resources.circuits = 10;
            state.resources.power = 12;
            state.resources.drones = 3;
            state.resources.defenses = 3;
            state.resources.scrap = 30;
            state.resources.modules = 3;
            state.resources.reputation = 2;

            state = game.routePowerToSector(state, "forge-bus", "priority");
            state = game.stageFreightCargo(state, "ashline-spare-crates");
            state = game.scanSabotageManifest(state, "ashline-rail-spoof");
            state = game.assignSabotagePatrol(state, "ashline-rail-spoof", "drones");
            state = game.protectCrisisLane(state, "ashline-dock-priority");
            for (const sourceId of ["queue", "lane", "grid", "breach", "freight", "rail"]) {
              state = game.assignCrisisEvidence(state, "ashline-dock-priority", sourceId);
            }
            const ready = game.crisisArbitrationSurfaceState(state)
              .cases.find((caseState) => caseState.id === "ashline-dock-priority");
            const gridBefore = state.grid.pressure;
            state = game.ruleCrisisCase(state, "ashline-dock-priority", "grid-first");
            const ruled = game.crisisArbitrationSurfaceState(state)
              .cases.find((caseState) => caseState.id === "ashline-dock-priority");
            const manifest = game.freightSurfaceState(state).manifests
              .find((candidate) => candidate.id === "ashline-spare-crates");
            const lane = state.lanes.find((candidate) => candidate.id === "forge-line");

            console.log(JSON.stringify({
              ready,
              ruled,
              outcomes: state.crisisArbitration.outcomes,
              gridBefore,
              gridAfter: state.grid.pressure,
              sector: state.grid.sectors.find((sector) => sector.id === "forge-bus"),
              manifest,
              lane,
              contractRulings: state.contracts.find((contract) => contract.id === "perimeter-grid").crisisRulings,
              choices: game.campaignSurfaceState(state).choices,
            }));
            """
        )

        ready = result["ready"]
        ruled = result["ruled"]

        self.assertEqual("evidence-ready", ready["status"])
        self.assertEqual(["queue", "lane", "grid", "breach", "freight", "rail"], [entry["sourceId"] for entry in ready["evidence"]["assigned"]])
        self.assertGreaterEqual(ready["evidence"]["score"], ready["bindingScore"])
        self.assertEqual("binding", ruled["status"])
        self.assertTrue(ruled["ruling"]["binding"])
        self.assertEqual("grid-first", ruled["ruling"]["priority"])
        self.assertEqual(1, result["outcomes"]["binding"])
        self.assertEqual("priority", result["sector"]["route"])
        self.assertLessEqual(result["gridAfter"], result["gridBefore"])
        self.assertEqual("staged", result["manifest"]["status"])
        self.assertEqual("ashline-dock-priority", result["lane"]["crisisProtection"]["caseId"])
        self.assertEqual("binding", result["contractRulings"][0]["outcome"])
        self.assertEqual(6, result["choices"]["crisisEvidenceAssignments"])
        self.assertEqual(1, result["choices"]["crisisLaneProtections"])
        self.assertEqual(1, result["choices"]["crisisGridFirstRulings"])

    def test_override_defer_expiry_side_effects_and_restart_carryover(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ run: 2, seed: 621, faultsEnabled: false });
            state = game.stepFactory(state, 4);
            state.resources.reputation = 2;
            state.resources.stability = 100;
            const open = game.crisisArbitrationSurfaceState(state)
              .cases.find((caseState) => caseState.id === "blackout-yard-jurisdiction");
            const reputationBefore = state.resources.reputation;
            state = game.buyCrisisEmergencyOverride(state, "blackout-yard-jurisdiction");
            state = game.deferCrisisCase(state, "blackout-yard-jurisdiction");
            const reputationAfterOverride = state.resources.reputation;
            const extended = game.crisisArbitrationSurfaceState(state)
              .cases.find((caseState) => caseState.id === "blackout-yard-jurisdiction");
            state = game.stepFactory(state, extended.dueTick - state.tick + 1);
            const failed = game.crisisArbitrationSurfaceState(state)
              .cases.find((caseState) => caseState.id === "blackout-yard-jurisdiction");
            const manifest = game.freightSurfaceState(state).manifests
              .find((candidate) => candidate.id === "blackout-relay-carrier");
            const lane = state.lanes.find((candidate) => candidate.id === "clean-room");
            const reset = game.resetFactoryState(state);
            const ledger = reset.campaign.ledger[reset.campaign.ledger.length - 1].crisisArbitration;

            console.log(JSON.stringify({
              openDue: open.dueTick,
              extendedDue: extended.dueTick,
              override: extended.override,
              deferrals: extended.deferrals,
              reputationBefore,
              reputationAfterOverride,
              reputationAfter: state.resources.reputation,
              failed,
              gridPressure: state.grid.pressure,
              breachIntensity: state.breach.intensity,
              manifestIntegrity: manifest.integrity,
              lane,
              resetCarryover: reset.crisisArbitration.carryover,
              resetResources: reset.resources,
              ledger,
              choices: game.campaignSurfaceState(state).choices,
            }));
            """
        )

        self.assertEqual(result["openDue"] + 5, result["extendedDue"])
        self.assertTrue(result["override"]["spent"])
        self.assertEqual(1, result["deferrals"])
        self.assertEqual(result["reputationBefore"] - 1, result["reputationAfterOverride"])
        self.assertLessEqual(result["reputationAfter"], result["reputationAfterOverride"])

        failed = result["failed"]
        self.assertEqual("failed", failed["status"])
        self.assertEqual("failed", failed["outcome"])
        self.assertEqual("timer-expired", failed["ruling"]["reason"])
        self.assertEqual("breach-first", failed["ruling"]["priority"])
        self.assertGreater(result["gridPressure"], 0)
        self.assertGreater(result["breachIntensity"], 0)
        self.assertLess(result["manifestIntegrity"], 100)
        self.assertEqual("locked", result["lane"]["status"])
        self.assertIn(result["lane"]["gridLock"]["reason"], {"crisis-arbitration", "rail-sabotage"})

        self.assertEqual(result["ledger"]["carryover"], result["resetCarryover"])
        self.assertGreaterEqual(result["resetCarryover"]["arbitrationScar"], 3)
        self.assertIn("blackout-yard-jurisdiction", result["resetCarryover"]["failedCases"])
        self.assertIn("clean-room", result["resetCarryover"]["disputedLanes"])
        self.assertLess(result["resetResources"]["stability"], 100)
        self.assertEqual(1, result["choices"]["crisisEmergencyOverrides"])
        self.assertEqual(1, result["choices"]["crisisDeferrals"])

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

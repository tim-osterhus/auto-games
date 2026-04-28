import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DarkFactoryDispatchGridSiegeTests(unittest.TestCase):
    def test_grid_pressure_blackout_and_audit_activation_progress_deterministically(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ run: 3, seed: 42, faultsEnabled: false });
            state.faults.enabled = false;
            state = game.assignJobToLane(state, "forge-line", state.queue[0].id);
            state = game.assignJobToLane(state, "assembler-bay", state.queue[0].id);
            state = game.startAllLanes(state);
            state = game.stepFactory(state, 5);
            const surface = game.gridSurfaceState(state);

            console.log(JSON.stringify({
              release: state.campaign.release,
              sectorCount: state.grid.sectors.length,
              connectedAssembly: state.grid.sectors.find((sector) => sector.id === "assembly-bus").connectedTo,
              auditStatus: surface.audit.status,
              auditDueTick: surface.audit.dueTick,
              auditQueue: state.queue.filter((entry) => entry.gridDirective).map((entry) => ({
                jobTypeId: entry.jobTypeId,
                sourceDirectiveId: entry.sourceDirectiveId,
                status: entry.status,
              })),
              blackoutEvents: surface.blackout.events,
              lockedSectors: surface.sectors.filter((sector) => sector.blackoutLockedUntil !== null),
              pressure: surface.pressure,
              load: surface.load,
            }));
            """
        )

        self.assertEqual("v0.2.0 Grid Siege", result["release"])
        self.assertEqual(3, result["sectorCount"])
        self.assertEqual(["forge-bus", "clean-bus"], result["connectedAssembly"])
        self.assertEqual("active", result["auditStatus"])
        self.assertGreater(result["auditDueTick"], 5)
        self.assertEqual("patch-audit-relay", result["auditQueue"][0]["jobTypeId"])
        self.assertEqual("reserve-ledger-audit", result["auditQueue"][0]["sourceDirectiveId"])
        self.assertGreaterEqual(result["blackoutEvents"], 1)
        self.assertTrue(result["lockedSectors"])
        self.assertGreaterEqual(result["load"], 0)
        self.assertGreaterEqual(result["pressure"], 0)

    def test_grid_choices_route_isolate_reserve_and_defer_have_stateful_costs(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 31, faultsEnabled: false });
            const baselineLane = state.lanes.find((lane) => lane.id === "forge-line");
            const baseline = {
              power: state.resources.power,
              stability: state.resources.stability,
              throughput: baselineLane.throughput,
            };

            state = game.routePowerToSector(state, "forge-bus", "priority");
            const routedLane = state.lanes.find((lane) => lane.id === "forge-line");
            const afterRoute = JSON.parse(JSON.stringify(state));
            state.grid.pressure = 7;
            state = game.authorizeReserveDraw(state, "forge-bus");
            const afterReserve = JSON.parse(JSON.stringify(state));
            state = game.isolateGridSector(state, "assembly-bus", true);
            const isolatedLane = state.lanes.find((lane) => lane.id === "assembler-bay");

            let auditState = game.createInitialState({ run: 2, seed: 32, faultsEnabled: false });
            auditState = game.stepFactory(auditState, 4);
            const dueBefore = auditState.grid.audit.dueTick;
            const pressureBefore = auditState.grid.pressure;
            auditState = game.deferAuditDirective(auditState);

            console.log(JSON.stringify({
              baseline,
              routedPower: afterRoute.resources.power,
              routedThroughput: routedLane.throughput,
              reserveAvailable: afterReserve.grid.reserve.available,
              reserveDrawn: afterReserve.grid.reserve.drawn,
              reservePressure: afterReserve.grid.pressure,
              isolated: state.grid.sectors.find((sector) => sector.id === "assembly-bus"),
              isolatedLaneStatus: isolatedLane.status,
              stabilityAfterChoices: state.resources.stability,
              gridChoices: state.grid.choices,
              auditDueBefore: dueBefore,
              auditDueAfter: auditState.grid.audit.dueTick,
              auditPressureBefore: pressureBefore,
              auditPressureAfter: auditState.grid.pressure,
              auditChoices: auditState.grid.choices,
            }));
            """
        )

        self.assertEqual(12, result["baseline"]["power"])
        self.assertGreater(result["routedThroughput"], result["baseline"]["throughput"])
        self.assertEqual(11, result["routedPower"])
        self.assertEqual(2, result["reserveAvailable"])
        self.assertEqual(3, result["reserveDrawn"])
        self.assertLess(result["reservePressure"], 7)
        self.assertTrue(result["isolated"]["isolated"])
        self.assertEqual("locked", result["isolatedLaneStatus"])
        self.assertLess(result["stabilityAfterChoices"], result["baseline"]["stability"])
        self.assertEqual(1, result["gridChoices"]["powerRoutes"])
        self.assertEqual(1, result["gridChoices"]["reserveDraws"])
        self.assertEqual(1, result["gridChoices"]["sectorIsolations"])
        self.assertEqual(result["auditDueBefore"] + 3, result["auditDueAfter"])
        self.assertGreater(result["auditPressureAfter"], result["auditPressureBefore"])
        self.assertEqual(1, result["auditChoices"]["auditDeferrals"])

    def test_grid_ledger_and_carryover_persist_blackout_and_reserve_consequences(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ run: 3, seed: 52, faultsEnabled: false });
            state.faults.enabled = false;
            state = game.assignJobToLane(state, "forge-line", state.queue[0].id);
            state = game.assignJobToLane(state, "assembler-bay", state.queue[0].id);
            state = game.startAllLanes(state);
            state = game.stepFactory(state, 5);
            state = game.authorizeReserveDraw(state);
            const reset = game.resetFactoryState(state);
            const ledgerEntry = reset.campaign.ledger[0];

            console.log(JSON.stringify({
              blackoutEvents: state.grid.blackout.events.length,
              reserveDraws: state.grid.reserve.draws,
              ledgerGrid: ledgerEntry.grid,
              resetRun: reset.restart.run,
              carryover: reset.grid.carryover,
              resetPower: reset.resources.power,
              resetStability: reset.resources.stability,
            }));
            """
        )

        self.assertGreaterEqual(result["blackoutEvents"], 1)
        self.assertEqual(1, result["reserveDraws"])
        self.assertGreaterEqual(result["ledgerGrid"]["blackoutEvents"], 1)
        self.assertEqual(1, result["ledgerGrid"]["reserveDraws"])
        self.assertEqual(4, result["resetRun"])
        self.assertGreaterEqual(result["carryover"]["blackoutScar"], 2)
        self.assertEqual(1, result["carryover"]["reserveDebt"])
        self.assertEqual(11, result["resetPower"])
        self.assertLess(result["resetStability"], 100)

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

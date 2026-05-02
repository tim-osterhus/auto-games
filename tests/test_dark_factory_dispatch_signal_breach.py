import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DarkFactoryDispatchSignalBreachTests(unittest.TestCase):
    def test_signal_breach_activates_with_compromised_queue_trace_and_grid_contamination(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 77, faultsEnabled: false, tutorialCompleted: true });
            state = game.stepFactory(state, 3);
            const breach = game.breachSurfaceState(state);
            const campaign = game.campaignSurfaceState(state);
            const grid = game.gridSurfaceState(state);
            const crisis = game.crisisArbitrationSurfaceState(state);

            console.log(JSON.stringify({
              release: state.campaign.release,
              sourceCount: game.GAME_DATA.signalBreach.sources.length,
              hasCountermeasureJob: game.GAME_DATA.jobTypes.some((job) => job.id === "compile-countermeasures" && job.family === "breach"),
              breachStatus: breach.status,
              breachSource: breach.source,
              trace: breach.trace,
              compromisedQueue: breach.queue.filter((entry) => entry.compromised),
              countermeasureQueue: breach.queue.filter((entry) => entry.breachDirective),
              contaminatedSectors: breach.sectors.filter((sector) => sector.breach.status === "contaminated"),
              campaignBreachStatus: campaign.breach.status,
              crisisCase: crisis.cases.find((caseState) => caseState.id === "ashline-dock-priority"),
              campaignRailPressure: campaign.railSabotage.pressure,
              gridBreachSectors: grid.sectors.filter((sector) => sector.breach.status === "contaminated"),
              gridPressure: grid.pressure,
            }));
            """
        )

        self.assertEqual("v0.4.0 Freight Lockdown", result["release"])
        self.assertGreaterEqual(result["sourceCount"], 2)
        self.assertTrue(result["hasCountermeasureJob"])
        self.assertEqual("active", result["breachStatus"])
        self.assertEqual("spoofed-dispatch-uplink", result["breachSource"]["id"])
        self.assertEqual("active", result["trace"]["status"])
        self.assertGreater(result["trace"]["dueTick"], 3)
        self.assertEqual(1, len(result["compromisedQueue"]))
        self.assertEqual("smelt-circuits", result["compromisedQueue"][0]["jobTypeId"])
        self.assertEqual(1, len(result["countermeasureQueue"]))
        self.assertEqual("compile-countermeasures", result["countermeasureQueue"][0]["jobTypeId"])
        self.assertEqual(["assembly-bus"], [sector["id"] for sector in result["contaminatedSectors"]])
        self.assertEqual("active", result["campaignBreachStatus"])
        self.assertEqual("spoofed-dispatch-uplink", result["crisisCase"]["linked"]["breachSourceId"])
        self.assertEqual("scheduled", result["crisisCase"]["status"])
        self.assertGreaterEqual(result["campaignRailPressure"], 1)
        self.assertEqual(["assembly-bus"], [sector["id"] for sector in result["gridBreachSectors"]])
        self.assertGreaterEqual(result["gridPressure"], 1)

    def test_breach_choices_cleanse_quarantine_defer_and_trace_have_stateful_costs(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 78, faultsEnabled: false, tutorialCompleted: true });
            state = game.stepFactory(state, 3);
            const compromisedId = state.queue.find((entry) => entry.compromised).id;
            const before = {
              circuits: state.resources.circuits,
              power: state.resources.power,
              stability: state.resources.stability,
              intensity: state.breach.intensity,
              dueTick: state.breach.trace.dueTick,
            };

            const cleansed = game.cleanseCompromisedQueueEntry(state, compromisedId);
            const quarantined = game.quarantineBreachLane(state, "assembler-bay", true);
            const shielded = game.authorizeReserveDraw(state, "assembly-bus");
            const deferred = game.deferBreachTrace(state);
            let traced = JSON.parse(JSON.stringify(state));
            traced.resources.drones = 1;
            traced = game.traceBreachSource(traced);

            console.log(JSON.stringify({
              before,
              cleansed: {
                resources: cleansed.resources,
                entry: cleansed.queue.find((entry) => entry.id === compromisedId),
                surface: game.breachSurfaceState(cleansed),
                choices: cleansed.campaign.choices,
              },
              quarantined: {
                resources: quarantined.resources,
                lane: quarantined.lanes.find((lane) => lane.id === "assembler-bay"),
                sector: game.breachSurfaceState(quarantined).sectors.find((sector) => sector.id === "assembly-bus"),
                surface: game.breachSurfaceState(quarantined),
                choices: quarantined.campaign.choices,
              },
              shielded: {
                reserve: shielded.grid.reserve,
                surface: game.breachSurfaceState(shielded),
              },
              deferred: {
                resources: deferred.resources,
                surface: game.breachSurfaceState(deferred),
                choices: deferred.campaign.choices,
              },
              traced: {
                resources: traced.resources,
                surface: game.breachSurfaceState(traced),
                choices: traced.campaign.choices,
              },
            }));
            """
        )

        before = result["before"]
        cleansed = result["cleansed"]
        quarantined = result["quarantined"]
        shielded = result["shielded"]
        deferred = result["deferred"]
        traced = result["traced"]

        self.assertEqual(before["circuits"] - 1, cleansed["resources"]["circuits"])
        self.assertEqual(before["power"] - 1, cleansed["resources"]["power"])
        self.assertIsNone(cleansed["entry"]["compromised"])
        self.assertLess(cleansed["surface"]["intensity"], before["intensity"])
        self.assertGreater(cleansed["surface"]["trace"]["dueTick"], before["dueTick"])
        self.assertEqual(1, cleansed["surface"]["choices"]["cleanses"])
        self.assertEqual(1, cleansed["choices"]["breachCleanses"])

        self.assertEqual(before["stability"] - 3, quarantined["resources"]["stability"])
        self.assertEqual("locked", quarantined["lane"]["status"])
        self.assertEqual("breach-quarantine", quarantined["lane"]["gridLock"]["reason"])
        self.assertEqual("quarantined", quarantined["sector"]["breach"]["status"])
        self.assertEqual(["assembler-bay"], quarantined["surface"]["containment"]["quarantinedLanes"])
        self.assertEqual(1, quarantined["choices"]["breachQuarantines"])

        shielded_sector = next(
            sector for sector in shielded["surface"]["sectors"]
            if sector["id"] == "assembly-bus"
        )
        self.assertEqual(2, shielded["reserve"]["available"])
        self.assertGreater(shielded_sector["breach"]["shieldedUntil"], 3)
        self.assertEqual(1, shielded["surface"]["containment"]["shieldedSectors"])
        self.assertEqual(1, shielded["surface"]["choices"]["shieldRoutes"])

        self.assertEqual(before["stability"] - 4, deferred["resources"]["stability"])
        self.assertEqual(before["dueTick"] + 3, deferred["surface"]["trace"]["dueTick"])
        self.assertGreater(deferred["surface"]["intensity"], before["intensity"])
        self.assertEqual(1, deferred["surface"]["choices"]["traceDeferrals"])
        self.assertEqual(1, deferred["choices"]["breachDeferrals"])

        self.assertEqual("contained", traced["surface"]["status"])
        self.assertEqual("resolved", traced["surface"]["trace"]["status"])
        self.assertEqual(1, traced["surface"]["containment"]["tracedSources"])
        self.assertEqual(1, traced["surface"]["choices"]["traces"])
        self.assertEqual(1, traced["choices"]["breachTraces"])
        self.assertEqual(1, traced["resources"]["reputation"])

    def test_compromised_jobs_and_countermeasure_work_change_breach_progression(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let compromised = game.createInitialState({ seed: 79, faultsEnabled: false, tutorialCompleted: true });
            compromised = game.stepFactory(compromised, 3);
            const compromisedBefore = {
              intensity: compromised.breach.intensity,
              stability: compromised.resources.stability,
              gridPressure: compromised.grid.pressure,
            };
            const compromisedEntry = compromised.queue.find((entry) => entry.compromised);
            compromised = game.assignJobToLane(compromised, "forge-line", compromisedEntry.id);
            const assignedCompromisedJob = JSON.parse(JSON.stringify(compromised.lanes.find((lane) => lane.id === "forge-line").currentJob));
            compromised = game.startLane(compromised, "forge-line");
            compromised = game.stepFactory(compromised, 3);

            let counter = game.createInitialState({ seed: 80, faultsEnabled: false, tutorialCompleted: true });
            counter = game.stepFactory(counter, 3);
            const counterBefore = {
              intensity: counter.breach.intensity,
              dueTick: counter.breach.trace.dueTick,
            };
            const counterEntry = counter.queue.find((entry) => entry.breachDirective);
            counter = game.assignJobToLane(counter, "forge-line", counterEntry.id);
            counter = game.startLane(counter, "forge-line");
            counter = game.stepFactory(counter, 4);

            console.log(JSON.stringify({
              compromisedBefore,
              assignedCompromisedJob,
              compromisedAfter: {
                resources: compromised.resources,
                produced: compromised.produced,
                gridPressure: compromised.grid.pressure,
                surface: game.breachSurfaceState(compromised),
              },
              counterBefore,
              counterAfter: {
                resources: counter.resources,
                surface: game.breachSurfaceState(counter),
              },
            }));
            """
        )

        compromised_after = result["compromisedAfter"]
        counter_after = result["counterAfter"]

        self.assertEqual("compromised", result["assignedCompromisedJob"]["compromised"]["status"])
        self.assertEqual(3, compromised_after["produced"]["circuits"])
        self.assertLess(compromised_after["resources"]["stability"], result["compromisedBefore"]["stability"])
        self.assertGreater(compromised_after["surface"]["intensity"], result["compromisedBefore"]["intensity"])
        self.assertGreater(compromised_after["gridPressure"], result["compromisedBefore"]["gridPressure"])
        self.assertEqual(1, compromised_after["surface"]["contamination"]["completedCompromisedJobs"])
        self.assertIn("forge-bus", compromised_after["surface"]["contamination"]["sectors"])

        self.assertEqual(1, counter_after["resources"]["defenses"])
        self.assertEqual(1, counter_after["resources"]["reputation"])
        self.assertLess(counter_after["surface"]["intensity"], result["counterBefore"]["intensity"])
        self.assertGreater(counter_after["surface"]["trace"]["dueTick"], result["counterBefore"]["dueTick"])
        self.assertEqual(1, counter_after["surface"]["containment"]["countermeasures"])
        self.assertEqual(1, counter_after["surface"]["choices"]["countermeasureJobs"])

    def test_failed_trace_persists_breach_scars_across_restart(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 81, faultsEnabled: false, tutorialCompleted: true });
            state = game.stepFactory(state, 10);
            const failedSurface = game.breachSurfaceState(state);
            const reset = game.resetFactoryState(state);
            const resetSurface = game.breachSurfaceState(reset);

            console.log(JSON.stringify({
              failedSurface,
              ledgerBreach: reset.campaign.ledger[0].breach,
              resetRun: reset.restart.run,
              resetResources: reset.resources,
              resetCarryover: reset.breach.carryover,
              resetIntensity: reset.breach.intensity,
              scarredSectors: resetSurface.sectors.filter((sector) => sector.breach.status === "scarred"),
            }));
            """
        )

        self.assertEqual("escaped", result["failedSurface"]["status"])
        self.assertEqual("failed", result["failedSurface"]["trace"]["status"])
        self.assertEqual(1, result["failedSurface"]["trace"]["failures"])
        self.assertEqual("escaped", result["ledgerBreach"]["status"])
        self.assertEqual("failed", result["ledgerBreach"]["traceStatus"])
        self.assertGreaterEqual(result["ledgerBreach"]["carryover"]["signalScar"], 3)
        self.assertEqual(2, result["resetRun"])
        self.assertEqual(result["ledgerBreach"]["carryover"], result["resetCarryover"])
        self.assertEqual(result["resetCarryover"]["signalScar"], result["resetIntensity"])
        self.assertLess(result["resetResources"]["stability"], 100)
        self.assertLessEqual(result["resetResources"]["power"], 12)
        self.assertEqual(["assembly-bus"], [sector["id"] for sector in result["scarredSectors"]])

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

import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class VoidProspectorSurveyLadderTests(unittest.TestCase):
    def test_survey_ladder_data_extends_first_sortie_without_replacing_it(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const state = game.createInitialState({ seed: 101 });
            console.log(JSON.stringify({
              version: state.ladder.version,
              releaseLabel: state.ladder.releaseLabel,
              stormVersion: state.storm.version,
              stormLabel: state.storm.releaseLabel,
              sectorId: state.ladder.currentSectorId,
              currentTier: state.ladder.currentTier,
              sectorCount: game.GAME_DATA.surveyLadder.sectors.length,
              defaultOre: state.contract.requiredOre,
              defaultScans: state.contract.requiredScans,
              defaultReward: state.contract.rewardCredits,
              optionalAnomalies: state.anomalies.length,
              hasScanControl: game.GAME_DATA.controls.scan.includes("KeyC"),
              existingMineControl: game.GAME_DATA.controls.mine.includes("Space"),
            }));
            """
        )

        self.assertEqual("0.1.0", result["version"])
        self.assertEqual("Survey Ladder", result["releaseLabel"])
        self.assertEqual("0.4.0", result["stormVersion"])
        self.assertEqual("Storm Cartography", result["stormLabel"])
        self.assertEqual("spoke-approach", result["sectorId"])
        self.assertEqual(1, result["currentTier"])
        self.assertGreaterEqual(result["sectorCount"], 4)
        self.assertEqual(3, result["defaultOre"])
        self.assertEqual(0, result["defaultScans"])
        self.assertEqual(160, result["defaultReward"])
        self.assertGreaterEqual(result["optionalAnomalies"], 1)
        self.assertTrue(result["hasScanControl"])
        self.assertTrue(result["existingMineControl"])

    def test_completed_sortie_unlocks_and_persists_harder_richer_sector(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({ seed: 12 });
            const firstOreValue = state.asteroids[0].oreValue;
            state.ship.position = { ...state.station.position };
            state.cargo.ore = 8;
            state.cargo.value = 176;
            state = game.dockAtStation(state);
            const completed = JSON.parse(JSON.stringify(state));
            const reset = game.resetRun(completed);
            console.log(JSON.stringify({
              completedStatus: completed.contract.status,
              completedSectors: completed.ladder.completedSectorIds,
              unlockedSectors: completed.ladder.unlockedSectorIds,
              recommended: completed.ladder.recommendedSectorId,
              resetRunCount: reset.run.count,
              resetSector: reset.ladder.currentSectorId,
              resetTier: reset.ladder.currentTier,
              resetOreRequired: reset.contract.requiredOre,
              resetScansRequired: reset.contract.requiredScans,
              resetHazard: reset.hazard.intensity,
              resetPirateSpawn: reset.pirate.spawnTick,
              richerOreValue: reset.asteroids[0].oreValue,
              firstOreValue,
            }));
            """
        )

        self.assertEqual("complete", result["completedStatus"])
        self.assertIn("spoke-approach", result["completedSectors"])
        self.assertIn("rift-shelf", result["unlockedSectors"])
        self.assertEqual("rift-shelf", result["recommended"])
        self.assertEqual(2, result["resetRunCount"])
        self.assertEqual("rift-shelf", result["resetSector"])
        self.assertEqual(2, result["resetTier"])
        self.assertGreater(result["resetOreRequired"], 3)
        self.assertEqual(1, result["resetScansRequired"])
        self.assertGreater(result["resetHazard"], 0)
        self.assertLess(result["resetPirateSpawn"], 18)
        self.assertGreater(result["richerOreValue"], result["firstOreValue"])

    def test_anomaly_scan_objective_gates_sector_completion_and_charts_hazard(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({
              seed: 44,
              sectorId: "rift-shelf",
              ladder: {
                currentSectorId: "rift-shelf",
                recommendedSectorId: "rift-shelf",
                unlockedSectorIds: ["spoke-approach", "rift-shelf"],
                completedSectorIds: ["spoke-approach"],
              },
            });
            state.ship.position = { ...state.station.position };
            state.cargo.ore = 10;
            state.cargo.value = 280;
            state = game.dockAtStation(state);
            const oreOnly = JSON.parse(JSON.stringify(state));
            const anomaly = state.anomalies[0];
            state.ship.position = { ...anomaly.position };
            state = game.setTarget(state, "anomaly", anomaly.id);
            state = game.scanTarget(state, 2);
            state = game.scanTarget(state, 1);
            const scanned = JSON.parse(JSON.stringify(state));
            state.ship.position = { ...state.station.position };
            state = game.dockAtStation(state);
            console.log(JSON.stringify({
              oreOnlyStatus: oreOnly.contract.status,
              oreOnlyProgress: oreOnly.contract.progress,
              scanStatus: scanned.scanning.status,
              deliveredScans: scanned.contract.deliveredScans,
              anomalyScans: scanned.stats.anomaliesScanned,
              hazardSurveyed: scanned.hazard.surveyed,
              hazardCharted: scanned.ladder.hazardCharts["rift-shelf"],
              finalStatus: state.contract.status,
              unlockedSectors: state.ladder.unlockedSectorIds,
              completedSectors: state.ladder.completedSectorIds,
              surveyScore: state.ladder.surveyScore,
              credits: state.credits,
            }));
            """
        )

        self.assertEqual("active", result["oreOnlyStatus"])
        self.assertLess(result["oreOnlyProgress"], 1)
        self.assertIn("scanned", result["scanStatus"])
        self.assertEqual(1, result["deliveredScans"])
        self.assertEqual(1, result["anomalyScans"])
        self.assertTrue(result["hazardSurveyed"])
        self.assertTrue(result["hazardCharted"])
        self.assertEqual("complete", result["finalStatus"])
        self.assertIn("umbra-trench", result["unlockedSectors"])
        self.assertIn("rift-shelf", result["completedSectors"])
        self.assertGreater(result["surveyScore"], 0)
        self.assertEqual(510, result["credits"])

    def test_sector_selection_choice_rebases_current_charter_deterministically(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const base = game.createInitialState({
              seed: 9,
              ladder: {
                currentSectorId: "spoke-approach",
                recommendedSectorId: "rift-shelf",
                unlockedSectorIds: ["spoke-approach", "rift-shelf"],
                completedSectorIds: ["spoke-approach"],
              },
            });
            const defaultOreValue = base.asteroids[0].oreValue;
            const locked = game.chooseSector(base, "umbra-trench");
            const chosen = game.chooseSector(base, "rift-shelf");
            console.log(JSON.stringify({
              lockedSector: locked.ladder.currentSectorId,
              lockedChoice: locked.ladder.lastChoice,
              chosenSector: chosen.ladder.currentSectorId,
              chosenChoice: chosen.ladder.lastChoice,
              chosenTier: chosen.ladder.currentTier,
              chosenOre: chosen.contract.requiredOre,
              chosenScans: chosen.contract.requiredScans,
              chosenHazard: chosen.hazard.intensity,
              chosenOreValue: chosen.asteroids[0].oreValue,
              defaultOreValue,
            }));
            """
        )

        self.assertEqual("spoke-approach", result["lockedSector"])
        self.assertEqual("locked umbra-trench", result["lockedChoice"])
        self.assertEqual("rift-shelf", result["chosenSector"])
        self.assertEqual("sector Rift Shelf", result["chosenChoice"])
        self.assertEqual(2, result["chosenTier"])
        self.assertEqual(10, result["chosenOre"])
        self.assertEqual(1, result["chosenScans"])
        self.assertGreater(result["chosenHazard"], 0)
        self.assertGreater(result["chosenOreValue"], result["defaultOreValue"])

    def test_station_services_change_scan_hazard_and_countermeasure_outcomes(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const ladder = {
              currentSectorId: "rift-shelf",
              recommendedSectorId: "rift-shelf",
              unlockedSectorIds: ["spoke-approach", "rift-shelf"],
              completedSectorIds: ["spoke-approach"],
            };
            let baseline = game.createInitialState({ seed: 17, sectorId: "rift-shelf", ladder });
            let serviced = game.createInitialState({ seed: 17, sectorId: "rift-shelf", ladder, credits: 180 });
            serviced.ship.position = { ...serviced.station.position };
            serviced = game.purchaseStationService(serviced, "survey-probes");
            serviced = game.purchaseStationService(serviced, "decoy-burst");

            const anomaly = serviced.anomalies[0];
            let baselineScan = game.setTarget(baseline, "anomaly", anomaly.id);
            baselineScan.ship.position = { ...anomaly.position };
            baselineScan = game.scanTarget(baselineScan, 1);
            let servicedScan = game.setTarget(serviced, "anomaly", anomaly.id);
            servicedScan.ship.position = { ...anomaly.position };
            servicedScan = game.scanTarget(servicedScan, 1);

            for (let index = 0; index < 6; index += 1) {
              baseline = game.stepSpaceflight(baseline, {}, 1);
              serviced = game.stepSpaceflight(serviced, {}, 1);
            }

            serviced.pirate.state = "shadowing";
            serviced.pirate.encounterState = "close";
            serviced.pirate.pressure = 70;
            serviced.pirate.position = { x: 1, y: 0, z: 18 };
            serviced = game.deployCountermeasure(serviced);
            console.log(JSON.stringify({
              creditsAfterServices: serviced.credits,
              purchased: serviced.stationServices.purchased,
              scanPower: serviced.scanning.power,
              baselineScanProgress: baselineScan.anomalies[0].scanState.progress,
              servicedScanProgress: servicedScan.anomalies[0].scanState.progress,
              baselineExposure: baseline.hazard.exposure,
              servicedExposure: serviced.hazard.exposure,
              pressureAfterDecoy: serviced.pirate.pressure,
              chargesAfterDecoy: serviced.stationServices.countermeasureCharges,
              decoysUsed: serviced.stats.countermeasuresDeployed,
            }));
            """
        )

        self.assertEqual(75, result["creditsAfterServices"])
        self.assertEqual(["survey-probes", "decoy-burst"], result["purchased"])
        self.assertEqual(2, result["scanPower"])
        self.assertGreater(result["servicedScanProgress"], result["baselineScanProgress"])
        self.assertLess(result["servicedExposure"], result["baselineExposure"])
        self.assertEqual(35, result["pressureAfterDecoy"])
        self.assertEqual(0, result["chargesAfterDecoy"])
        self.assertEqual(1, result["decoysUsed"])

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

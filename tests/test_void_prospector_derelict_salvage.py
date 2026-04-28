import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class VoidProspectorDerelictSalvageTests(unittest.TestCase):
    def test_salvage_site_generation_adds_v020_targets_without_replacing_survey_ladder(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const ladder = {
              currentSectorId: "rift-shelf",
              recommendedSectorId: "rift-shelf",
              unlockedSectorIds: ["spoke-approach", "rift-shelf"],
              completedSectorIds: ["spoke-approach"],
            };
            const state = game.createInitialState({ seed: 44, sectorId: "rift-shelf", ladder });
            const regenerated = game.createSalvageSites(44, game.sectorById("rift-shelf"));
            const hulk = state.salvageSites.find((site) => site.id === "salvage-rift-hulk");
            const volatile = state.salvageSites.find((site) => site.id === "salvage-rift-volatile");
            const salvageTarget = game.setTarget(state, "salvage", hulk.id);
            console.log(JSON.stringify({
              ladderVersion: state.ladder.version,
              ladderLabel: state.ladder.releaseLabel,
              salvageVersion: state.salvage.version,
              salvageLabel: state.salvage.releaseLabel,
              siteCount: state.salvageSites.length,
              statePairs: state.salvageSites.map((site) => [site.id, site.rewardValue]),
              regeneratedPairs: regenerated.map((site) => [site.id, site.rewardValue]),
              types: state.salvageSites.map((site) => site.type),
              families: state.salvageSites.map((site) => site.family),
              recommended: state.salvage.recommendedSiteId,
              hulkState: hulk.salvageState,
              volatileRisk: game.salvageRisk(volatile, state),
              targetKind: game.targetSummary(salvageTarget).kind,
              targetStatus: game.targetSummary(salvageTarget).status,
            }));
            """
        )

        self.assertEqual("0.1.0", result["ladderVersion"])
        self.assertEqual("Survey Ladder", result["ladderLabel"])
        self.assertEqual("0.2.0", result["salvageVersion"])
        self.assertEqual("Derelict Salvage", result["salvageLabel"])
        self.assertGreaterEqual(result["siteCount"], 2)
        self.assertIn("derelict-hull", result["types"])
        self.assertIn("volatile-wreck", result["types"])
        self.assertIn("relic", result["families"])
        self.assertIn("hazard", result["families"])
        self.assertEqual("salvage-rift-hulk", result["recommended"])
        self.assertEqual(result["statePairs"], result["regeneratedPairs"])
        self.assertEqual("salvage-rift-hulk", result["statePairs"][0][0])
        self.assertEqual("salvage-rift-volatile", result["statePairs"][1][0])
        self.assertEqual("unscanned", result["hulkState"]["status"])
        self.assertEqual(3, result["hulkState"]["remainingSalvage"])
        self.assertGreater(result["volatileRisk"], 1)
        self.assertEqual("salvage", result["targetKind"])
        self.assertIn("confidence 0%", result["targetStatus"])

    def test_scan_confidence_extraction_rewards_failure_and_abandonment_are_distinct(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const ladder = {
              currentSectorId: "rift-shelf",
              recommendedSectorId: "rift-shelf",
              unlockedSectorIds: ["spoke-approach", "rift-shelf"],
              completedSectorIds: ["spoke-approach"],
            };

            let scanned = game.createInitialState({ seed: 44, sectorId: "rift-shelf", ladder });
            const hulk = scanned.salvageSites.find((site) => site.id === "salvage-rift-hulk");
            scanned.ship.position = { ...hulk.position };
            scanned = game.setTarget(scanned, "salvage", hulk.id);
            const riskBeforeScan = game.salvageRisk(hulk, scanned);
            scanned = game.scanSalvageTarget(scanned, 2);
            scanned = game.scanSalvageTarget(scanned, 1);
            const lockedSite = scanned.salvageSites.find((site) => site.id === hulk.id);
            const riskAfterScan = game.salvageRisk(lockedSite, scanned);
            for (let index = 0; index < 5; index += 1) {
              scanned = game.extractSalvageTarget(scanned, 1);
            }

            let blind = game.createInitialState({ seed: 44, sectorId: "rift-shelf", ladder });
            const volatile = blind.salvageSites.find((site) => site.id === "salvage-rift-volatile");
            blind.ship.position = { ...volatile.position };
            blind = game.setTarget(blind, "salvage", volatile.id);
            blind = game.extractSalvageTarget(blind, 1);

            let abandoned = game.createInitialState({ seed: 44, sectorId: "rift-shelf", ladder });
            abandoned = game.setTarget(abandoned, "salvage", "salvage-rift-hulk");
            abandoned = game.abandonSalvageTarget(abandoned);

            console.log(JSON.stringify({
              riskBeforeScan,
              riskAfterScan,
              locked: lockedSite.salvageState.targetLocked,
              confidence: lockedSite.salvageState.scanConfidence,
              recovered: game.salvageSummary(scanned),
              blind: {
                salvage: game.salvageSummary(blind),
                hull: blind.ship.hull,
                hazardExposure: blind.hazard.exposure,
                pirateState: blind.pirate.state,
                piratePressure: blind.pirate.pressure,
              },
              abandoned: game.salvageSummary(abandoned),
            }));
            """
        )

        self.assertGreater(result["riskBeforeScan"], result["riskAfterScan"])
        self.assertTrue(result["locked"])
        self.assertEqual(1, result["confidence"])
        self.assertGreater(result["recovered"]["holdValue"], 0)
        self.assertEqual(1, result["recovered"]["relicsInHold"])
        self.assertGreater(result["recovered"]["recoveredValue"], 0)
        self.assertEqual(0, result["recovered"]["failures"])
        self.assertEqual(1, result["blind"]["salvage"]["failures"])
        self.assertLess(result["blind"]["hull"], 100)
        self.assertGreater(result["blind"]["hazardExposure"], 0)
        self.assertEqual("shadowing", result["blind"]["pirateState"])
        self.assertGreater(result["blind"]["piratePressure"], 0)
        self.assertEqual(1, result["abandoned"]["abandoned"])
        self.assertEqual("abandoned", result["abandoned"]["sites"][0]["status"])

    def test_station_salvage_support_changes_confidence_power_and_extraction_progress(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const ladder = {
              currentSectorId: "rift-shelf",
              recommendedSectorId: "rift-shelf",
              unlockedSectorIds: ["spoke-approach", "rift-shelf"],
              completedSectorIds: ["spoke-approach"],
            };

            let baseline = game.createInitialState({ seed: 17, sectorId: "rift-shelf", ladder, credits: 200 });
            let serviced = game.createInitialState({ seed: 17, sectorId: "rift-shelf", ladder, credits: 200 });
            serviced.ship.position = { ...serviced.station.position };
            serviced = game.purchaseStationService(serviced, "salvage-rig");

            const baseSite = baseline.salvageSites.find((site) => site.id === "salvage-rift-hulk");
            baseline.ship.position = { ...baseSite.position };
            baseline = game.setTarget(baseline, "salvage", baseSite.id);
            baseline = game.scanSalvageTarget(baseline, 1);
            baseline = game.extractSalvageTarget(baseline, 1);

            const servicedSite = serviced.salvageSites.find((site) => site.id === "salvage-rift-hulk");
            serviced.ship.position = { ...servicedSite.position };
            serviced = game.setTarget(serviced, "salvage", servicedSite.id);
            serviced = game.scanSalvageTarget(serviced, 1);
            serviced = game.extractSalvageTarget(serviced, 1);

            const baseSummary = game.salvageSummary(baseline);
            const servicedSummary = game.salvageSummary(serviced);
            console.log(JSON.stringify({
              creditsAfterRig: serviced.credits,
              purchased: serviced.stationServices.purchased,
              baselinePower: baseSummary.extractionPower,
              servicedPower: servicedSummary.extractionPower,
              baselineSite: baseSummary.sites.find((site) => site.id === "salvage-rift-hulk"),
              servicedSite: servicedSummary.sites.find((site) => site.id === "salvage-rift-hulk"),
            }));
            """
        )

        self.assertEqual(120, result["creditsAfterRig"])
        self.assertEqual(["salvage-rig"], result["purchased"])
        self.assertGreater(result["servicedPower"], result["baselinePower"])
        self.assertGreater(result["servicedSite"]["scanConfidence"], result["baselineSite"]["scanConfidence"])
        self.assertGreater(result["servicedSite"]["extractionProgress"], result["baselineSite"]["extractionProgress"])
        self.assertLess(result["servicedSite"]["risk"], result["baselineSite"]["risk"])

    def test_salvage_relic_recovery_couples_to_umbra_contract_and_ladder_completion(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const ladder = {
              currentSectorId: "umbra-trench",
              recommendedSectorId: "umbra-trench",
              unlockedSectorIds: ["spoke-approach", "rift-shelf", "umbra-trench"],
              completedSectorIds: ["spoke-approach", "rift-shelf"],
            };
            let state = game.createInitialState({
              seed: 52,
              sectorId: "umbra-trench",
              ladder,
              credits: 300,
              stationServices: { purchased: ["salvage-rig", "recovery-drones"] },
            });

            state.ship.position = { ...state.station.position };
            state.cargo.ore = 12;
            state.cargo.value = 420;
            state.contract.deliveredScans = 2;
            state = game.dockAtStation(state);
            const oreAndScanOnly = JSON.parse(JSON.stringify(state));

            const vault = state.salvageSites.find((site) => site.id === "salvage-umbra-vault");
            state.ship.position = { ...vault.position };
            state = game.setTarget(state, "salvage", vault.id);
            for (let index = 0; index < 3; index += 1) {
              state = game.scanSalvageTarget(state, 1);
            }
            for (let index = 0; index < 4; index += 1) {
              state = game.extractSalvageTarget(state, 1);
            }
            const recovered = JSON.parse(JSON.stringify(state));
            state.ship.position = { ...state.station.position };
            state = game.dockAtStation(state);

            console.log(JSON.stringify({
              requiredSalvageValue: oreAndScanOnly.contract.requiredSalvageValue,
              requiredRelics: oreAndScanOnly.contract.requiredRelics,
              oreAndScanStatus: oreAndScanOnly.contract.status,
              oreAndScanProgress: oreAndScanOnly.contract.progress,
              heldValueBeforeDock: recovered.salvage.holdValue,
              heldRelicsBeforeDock: recovered.salvage.relicsInHold,
              finalStatus: state.contract.status,
              deliveredSalvageValue: state.contract.deliveredSalvageValue,
              deliveredRelics: state.contract.deliveredRelics,
              completedSectors: state.ladder.completedSectorIds,
              salvageScore: state.ladder.salvageScore,
              bankedValue: state.salvage.bankedValue,
              holdValueAfterDock: state.salvage.holdValue,
              runStatus: state.run.status,
              credits: state.credits,
            }));
            """
        )

        self.assertEqual(90, result["requiredSalvageValue"])
        self.assertEqual(1, result["requiredRelics"])
        self.assertEqual("active", result["oreAndScanStatus"])
        self.assertLess(result["oreAndScanProgress"], 1)
        self.assertGreaterEqual(result["heldValueBeforeDock"], result["requiredSalvageValue"])
        self.assertEqual(1, result["heldRelicsBeforeDock"])
        self.assertEqual("complete", result["finalStatus"])
        self.assertGreaterEqual(result["deliveredSalvageValue"], result["requiredSalvageValue"])
        self.assertEqual(1, result["deliveredRelics"])
        self.assertIn("umbra-trench", result["completedSectors"])
        self.assertGreater(result["salvageScore"], 0)
        self.assertEqual(result["deliveredSalvageValue"], result["bankedValue"])
        self.assertEqual(0, result["holdValueAfterDock"])
        self.assertEqual("complete", result["runStatus"])
        self.assertGreater(result["credits"], 1000)

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

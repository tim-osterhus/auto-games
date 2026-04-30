import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class IronLanternDescentFaultlineSurveyTests(unittest.TestCase):
    def test_survey_sites_extend_cave_progression_and_scanner_targeting(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 61 });
            const basalt = state.surveySites.find((site) => site.id === "survey-basalt-suture");
            state.player.position = { x: basalt.position.x, y: 1.6, z: basalt.position.z };
            state.elapsed = 40;
            state = game.pulseScanner(game.syncDerivedState(state));
            const nearest = game.nearestSurveySite(state);

            console.log(JSON.stringify({
              release: state.survey.release.label,
              passageIds: game.GAME_DATA.cave.passages.map((passage) => passage.id),
              collisionPassage: state.movement.collision.lastPassage,
              surveyCount: state.surveySites.length,
              nearestSurvey: nearest.site.id,
              nearestFaultType: nearest.site.faultType,
              activeSurvey: state.survey.activeSiteId,
              scannerKind: state.scanner.targetKind,
              scannerPulseKind: state.scanner.lastPulse.targetKind,
              scannerPulseWindow: state.scanner.lastPulse.surveyWindow,
              routeStability: state.routeStability.stability,
              contractTarget: state.survey.contract.targetMapProgress,
              basaltRequirement: basalt.requirements,
            }));
            """
        )

        self.assertEqual("v0.1.0 Faultline Survey", result["release"])
        self.assertIn("fault-gallery", result["passageIds"])
        self.assertEqual("fault-gallery", result["collisionPassage"])
        self.assertGreaterEqual(result["surveyCount"], 2)
        self.assertEqual("survey-basalt-suture", result["nearestSurvey"])
        self.assertEqual("compressive seam", result["nearestFaultType"])
        self.assertEqual("survey-basalt-suture", result["activeSurvey"])
        self.assertEqual("survey", result["scannerKind"])
        self.assertEqual("survey", result["scannerPulseKind"])
        self.assertEqual("stable", result["scannerPulseWindow"])
        self.assertGreater(result["routeStability"], 0)
        self.assertEqual(3, result["contractTarget"])
        self.assertTrue(result["basaltRequirement"]["stake"])
        self.assertTrue(result["basaltRequirement"]["brace"])
        self.assertTrue(result["basaltRequirement"]["lanternAnchor"])

    def test_stakes_braces_air_cache_and_tremor_pressure_change_state(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 67 });
            state.player.position = { x: -18, y: 1.6, z: -62 };
            state.elapsed = 104;
            state = game.syncDerivedState(state);
            const unstableDrain = game.oxygenDrainRate(state);
            const unstableStability = state.routeStability.stability;

            const staked = game.plantSurveyStake(state, "survey-basalt-suture");
            const braceWithoutLight = game.braceSurveySite(staked, "survey-basalt-suture");
            const lit = game.placeLantern(staked);
            const braced = game.braceSurveySite(lit, "survey-basalt-suture");
            const bracedDrain = game.oxygenDrainRate(braced);
            braced.oxygen.current = 50;
            const cache = game.activateAirCache(braced, "survey-basalt-suture");
            const cacheReuse = game.activateAirCache(cache, "survey-basalt-suture");

            console.log(JSON.stringify({
              windowState: state.surveySites[1].windowState,
              unstableDrain,
              bracedDrain,
              unstableStability,
              bracedStability: braced.routeStability.stability,
              stakePlanted: staked.surveySites[1].stakePlanted,
              stakeCharges: staked.survey.stakes,
              braceWithoutLight: braceWithoutLight.survey.lastAction,
              braceInstalled: braced.surveySites[1].braceInstalled,
              braceCharges: braced.survey.braces,
              cacheOxygen: cache.oxygen.current,
              cacheStatus: cache.surveySites[1].airCacheState.status,
              cacheReuse: cacheReuse.survey.lastAction,
              routeGuideKinds: game.routeGuidePoints(braced).map((point) => point.kind),
            }));
            """
        )

        self.assertEqual("tremor", result["windowState"])
        self.assertGreater(result["unstableDrain"], result["bracedDrain"])
        self.assertGreater(result["bracedStability"], result["unstableStability"])
        self.assertTrue(result["stakePlanted"])
        self.assertEqual(1, result["stakeCharges"])
        self.assertEqual("lantern anchor required", result["braceWithoutLight"])
        self.assertTrue(result["braceInstalled"])
        self.assertEqual(0, result["braceCharges"])
        self.assertEqual(68, result["cacheOxygen"])
        self.assertEqual("depleted", result["cacheStatus"])
        self.assertEqual("air cache depleted", result["cacheReuse"])
        self.assertIn("survey-stake", result["routeGuideKinds"])

    def test_chart_outcomes_mining_bonus_lift_banking_and_restart_carryover(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let partial = game.createInitialState({ seed: 73 });
            partial.player.position = { x: 17, y: 1.6, z: -31 };
            partial = game.chartFaultSurvey(game.syncDerivedState(partial), "survey-cinder-rib");

            let failed = game.createInitialState({ seed: 73 });
            failed.player.position = { x: -18, y: 1.6, z: -62 };
            failed.elapsed = 140;
            failed = game.chartFaultSurvey(game.syncDerivedState(failed), "survey-basalt-suture");

            let success = game.createInitialState({ seed: 73 });
            success.player.position = { x: 17, y: 1.6, z: -31 };
            success = game.placeLantern(game.syncDerivedState(success));
            success = game.plantSurveyStake(success, "survey-cinder-rib");
            success = game.chartFaultSurvey(success, "survey-cinder-rib");
            const ironBloom = success.sampleNodes.find((node) => node.id === "sample-iron-bloom");
            success.player.position = { x: ironBloom.position.x, y: 1.6, z: ironBloom.position.z };
            success = game.syncDerivedState(success);
            for (let pass = 0; pass < 3; pass += 1) {
              success = game.mineNearestSample(success, 1);
            }
            const afterMine = JSON.parse(JSON.stringify(success));
            success.player.position = { x: success.lift.position.x, y: 1.6, z: success.lift.position.z };
            success = game.returnToLift(game.syncDerivedState(success));
            const restarted = game.resetRun(success);

            console.log(JSON.stringify({
              partialOutcome: partial.surveySites[0].chartState,
              partialValue: partial.survey.value,
              partialMap: partial.survey.mapProgress,
              failedOutcome: failed.surveySites[1].chartState,
              failedValue: failed.survey.value,
              successOutcome: afterMine.surveySites[0].chartState,
              surveyValueBeforeLift: afterMine.survey.value,
              mapBeforeLift: afterMine.survey.mapProgress,
              cargoValueAfterSurvey: afterMine.cargo.value,
              lastMiningYield: afterMine.sampleNodes[1].mineState.lastYield,
              creditsAfterLift: success.credits,
              bankedSurveyValue: success.lift.bankedSurveyValue,
              bankedMapProgress: success.lift.bankedMapProgress,
              surveyLedger: success.survey.ledger,
              surveyValueAfterLift: success.survey.value,
              restartedLedger: restarted.survey.ledger,
              restartedRunCount: restarted.run.count,
            }));
            """
        )

        self.assertEqual("partial", result["partialOutcome"])
        self.assertEqual(18, result["partialValue"])
        self.assertEqual(0.5, result["partialMap"])
        self.assertEqual("failed", result["failedOutcome"])
        self.assertEqual(0, result["failedValue"])
        self.assertEqual("success", result["successOutcome"])
        self.assertEqual(46, result["surveyValueBeforeLift"])
        self.assertEqual(1, result["mapBeforeLift"])
        self.assertEqual(52, result["cargoValueAfterSurvey"])
        self.assertEqual(52, result["lastMiningYield"])
        self.assertEqual(98, result["creditsAfterLift"])
        self.assertEqual(46, result["bankedSurveyValue"])
        self.assertEqual(1, result["bankedMapProgress"])
        self.assertEqual(1, result["surveyLedger"])
        self.assertEqual(0, result["surveyValueAfterLift"])
        self.assertEqual(1, result["restartedLedger"])
        self.assertEqual(2, result["restartedRunCount"])

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

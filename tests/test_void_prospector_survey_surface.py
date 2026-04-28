import json
import re
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "void-prospector"
MANIFEST_PATH = GAME_DIR / "assets" / "asset-manifest.json"


def read_game_file(name: str) -> str:
    return (GAME_DIR / name).read_text(encoding="utf-8")


class VoidProspectorSurveySurfaceTests(unittest.TestCase):
    def test_direct_page_exposes_survey_ladder_ui_hooks(self) -> None:
        html = read_game_file("index.html")

        for hook in (
            "ladder-readout",
            "sector-readout",
            "hazard-readout",
            "scan-readout",
            "service-readout",
            "scan-action",
            "survey-panel",
            "ladder-title",
            "ladder-status-surface",
            "sector-list",
            "sector-select",
            "sector-action",
            "service-probes-action",
            "service-decoy-action",
            "countermeasure-action",
            "event-log",
        ):
            self.assertIn(hook, html)

        self.assertIn("v0.1.0 Survey Ladder", html)
        self.assertIn("C scan", html)
        self.assertIn('aria-label="Survey Ladder controls"', html)

    def test_survey_surface_css_keeps_desktop_and_narrow_layout_contracts(self) -> None:
        css = read_game_file("void-prospector.css")

        for token in (
            ".survey-panel",
            ".sector-list",
            ".sector-row",
            ".choice-row",
            ".service-panel",
            ".event-log",
            "max-height: min(280px, max(210px, calc(100vh - 410px)))",
            "overflow: auto",
            "@media (max-width: 980px)",
            "@media (max-width: 640px)",
        ):
            self.assertIn(token, css)

        self.assertRegex(css, r"\.survey-panel\s*\{[^}]*position: fixed")
        self.assertRegex(css, r"@media \(max-width: 980px\)[\s\S]*?\.survey-panel\s*\{[^}]*position: relative")
        self.assertIn("width: calc(100vw - 24px)", css)
        self.assertIn("grid-template-columns: repeat(2, minmax(0, 1fr))", css)
        self.assertNotIn("border-radius: 12px", css)
        self.assertNotIn("overflow-x: scroll", css)

    def test_cockpit_surface_models_route_objective_hazard_and_actions(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const ladder = {
              currentSectorId: "spoke-approach",
              recommendedSectorId: "rift-shelf",
              unlockedSectorIds: ["spoke-approach", "rift-shelf"],
              completedSectorIds: ["spoke-approach"],
            };
            let state = game.createInitialState({ seed: 9, ladder });
            state = game.stepSpaceflight(state, {}, 1);
            const surface = game.surveyCockpitSurface(state);
            const chosen = game.chooseSector(state, "rift-shelf");
            const anomaly = chosen.anomalies[0];
            const anomalyTarget = game.setTarget(chosen, "anomaly", anomaly.id);
            const anomalySurface = game.surveyCockpitSurface(anomalyTarget);
            console.log(JSON.stringify({
              titleText: surface.titleText,
              ladderText: surface.ladderText,
              routeText: surface.routeText,
              sectorStates: surface.sectors.map((sector) => [sector.id, sector.state, sector.unlocked]),
              canSetSectorAfterIdleTick: surface.actions.canSetSector,
              chosenSector: chosen.ladder.currentSectorId,
              chosenHazard: chosen.hazard.intensity,
              chosenObjective: game.surveyCockpitSurface(chosen).objectiveProgressText,
              canScanAnomaly: anomalySurface.actions.canScan,
              anomalyScanText: anomalySurface.scanText,
            }));
            """
        )

        self.assertIn("Survey Ladder", result["titleText"])
        self.assertIn("tier 1", result["ladderText"])
        self.assertIn("Rift Shelf", result["routeText"])
        self.assertIn(["spoke-approach", "current", True], result["sectorStates"])
        self.assertIn(["rift-shelf", "recommended", True], result["sectorStates"])
        self.assertIn(["umbra-trench", "locked", False], result["sectorStates"])
        self.assertTrue(result["canSetSectorAfterIdleTick"])
        self.assertEqual("rift-shelf", result["chosenSector"])
        self.assertGreater(result["chosenHazard"], 0)
        self.assertIn("10 ore", result["chosenObjective"])
        self.assertTrue(result["canScanAnomaly"])
        self.assertIn("0/1 scans", result["anomalyScanText"])

    def test_station_service_surface_shows_consequences_and_decoy_readiness(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const ladder = {
              currentSectorId: "rift-shelf",
              recommendedSectorId: "rift-shelf",
              unlockedSectorIds: ["spoke-approach", "rift-shelf"],
              completedSectorIds: ["spoke-approach"],
            };
            let state = game.createInitialState({ seed: 17, sectorId: "rift-shelf", ladder, credits: 180 });
            state.ship.position = { ...state.station.position };
            state = game.dockAtStation(state);
            const dockSurface = game.surveyCockpitSurface(state);
            state = game.purchaseStationService(state, "survey-probes");
            state = game.purchaseStationService(state, "decoy-burst");
            state.pirate.state = "shadowing";
            state.pirate.encounterState = "shadow";
            state.pirate.pressure = 55;
            const armedSurface = game.surveyCockpitSurface(state);
            const afterBurst = game.deployCountermeasure(state);
            console.log(JSON.stringify({
              dockServices: dockSurface.services.map((service) => [service.id, service.status, service.enabled]),
              purchasedServices: armedSurface.services.map((service) => [service.id, service.status, service.enabled]),
              serviceText: armedSurface.serviceText,
              countermeasureReady: armedSurface.actions.countermeasureReady,
              countermeasureText: armedSurface.actions.countermeasureText,
              pressureAfterBurst: afterBurst.pirate.pressure,
              chargesAfterBurst: afterBurst.stationServices.countermeasureCharges,
            }));
            """
        )

        self.assertIn(["survey-probes", "45cr ready", True], result["dockServices"])
        self.assertIn(["decoy-burst", "60cr ready", True], result["dockServices"])
        self.assertIn(["survey-probes", "installed", False], result["purchasedServices"])
        self.assertIn(["decoy-burst", "installed", False], result["purchasedServices"])
        self.assertIn("Survey Probes + Decoy Burst", result["serviceText"])
        self.assertTrue(result["countermeasureReady"])
        self.assertEqual("1 burst", result["countermeasureText"])
        self.assertEqual(20, result["pressureAfterBurst"])
        self.assertEqual(0, result["chargesAfterBurst"])

    def test_survey_surface_reuses_existing_project_local_assets_only(self) -> None:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        manifest_paths = {
            asset["path"].removeprefix("games/void-prospector/")
            for asset in manifest["assets"]
        }
        files = {
            "index.html": read_game_file("index.html"),
            "void-prospector.css": read_game_file("void-prospector.css"),
            "void-prospector.js": read_game_file("void-prospector.js"),
        }

        self.assertEqual(
            {
                "assets/ship-decal.png",
                "assets/asteroid-ore-glow.png",
                "assets/station-dock-panel.png",
                "assets/pirate-marker.png",
                "assets/arcade-title-card.png",
            },
            manifest_paths,
        )
        for filename, text in files.items():
            for reference in re.findall(r'assets/[^"\'\)\s]+\.png', text):
                self.assertIn(reference, manifest_paths, f"{filename} references {reference}")
                self.assertNotIn("://", reference)

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

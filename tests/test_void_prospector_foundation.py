import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "void-prospector"


class VoidProspectorFoundationTests(unittest.TestCase):
    def test_static_entrypoint_uses_local_renderer_and_hud_regions(self) -> None:
        html = (GAME_DIR / "index.html").read_text(encoding="utf-8")

        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("void-prospector.css", html)
        self.assertIn('src="vendor/three.min.js"', html)
        self.assertIn("void-prospector.js", html)
        self.assertNotIn("https://", html)
        self.assertNotIn("http://", html)
        for region in (
            "void-prospector-scene",
            "prospector-hud",
            "objective-readout",
            "hull-readout",
            "fuel-readout",
            "cargo-readout",
            "credits-readout",
            "pressure-readout",
            "target-readout",
            "station-readout",
            "target-panel",
            "control-strip",
        ):
            self.assertIn(region, html)

        vendor = GAME_DIR / "vendor" / "three.min.js"
        self.assertTrue(vendor.is_file())
        self.assertIn("SPDX-License-Identifier: MIT", vendor.read_text(encoding="utf-8")[:160])

    def test_state_data_exposes_spaceflight_mining_docking_and_pirate_seams(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const state = game.createInitialState({ seed: 101 });
            console.log(JSON.stringify({
              rendererPath: game.GAME_DATA.renderer.path,
              localOnly: game.GAME_DATA.renderer.localOnly,
              hull: state.ship.hull,
              fuel: state.ship.fuel,
              cargoCapacity: state.cargo.capacity,
              credits: state.credits,
              asteroidCount: state.asteroids.length,
              asteroidSeams: state.asteroids.every((asteroid) => (
                asteroid.id &&
                asteroid.position &&
                asteroid.mineState &&
                asteroid.mineState.status === "ready" &&
                Number.isFinite(asteroid.oreValue) &&
                asteroid.oreRemaining > 0
              )),
              stationDockable: game.dockingStatus(state).dockable,
              stationServices: game.dockingStatus(state).services,
              contractStatus: state.contract.status,
              contractRequiredOre: state.contract.requiredOre,
              targetKind: state.target.kind,
              pirateState: state.pirate.state,
              cameraMode: state.camera.mode,
              hasCameraVectors: Boolean(state.camera.position && state.camera.target),
            }));
            """
        )

        self.assertEqual("vendor/three.min.js", result["rendererPath"])
        self.assertTrue(result["localOnly"])
        self.assertEqual(100, result["hull"])
        self.assertEqual(100, result["fuel"])
        self.assertEqual(6, result["cargoCapacity"])
        self.assertEqual(0, result["credits"])
        self.assertGreaterEqual(result["asteroidCount"], 4)
        self.assertTrue(result["asteroidSeams"])
        self.assertFalse(result["stationDockable"])
        self.assertIn("sell cargo", result["stationServices"])
        self.assertEqual("active", result["contractStatus"])
        self.assertGreaterEqual(result["contractRequiredOre"], 1)
        self.assertEqual("asteroid", result["targetKind"])
        self.assertEqual("dormant", result["pirateState"])
        self.assertEqual("chase", result["cameraMode"])
        self.assertTrue(result["hasCameraVectors"])

    def test_core_controls_advance_ship_camera_target_and_pirate_state(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({ seed: 22 });
            const start = JSON.parse(JSON.stringify(state));
            state = game.stepSpaceflight(state, { thrust: true, turnRight: true }, 1);
            const afterThrust = JSON.parse(JSON.stringify(state));
            state = game.stepSpaceflight(state, { brake: true }, 1);
            const afterBrake = JSON.parse(JSON.stringify(state));
            const retargeted = game.retarget(afterBrake, 1);
            let pirateLive = afterBrake;
            for (let index = 0; index < 20; index += 1) {
              pirateLive = game.stepSpaceflight(pirateLive, {}, 1);
            }
            console.log(JSON.stringify({
              moved: game.distance(start.ship.position, afterThrust.ship.position),
              headingChanged: afterThrust.ship.heading !== start.ship.heading,
              fuelSpent: start.ship.fuel - afterThrust.ship.fuel,
              speedAfterThrust: game.distance({ x: 0, y: 0, z: 0 }, afterThrust.ship.velocity),
              speedAfterBrake: game.distance({ x: 0, y: 0, z: 0 }, afterBrake.ship.velocity),
              cameraMoved: game.distance(start.camera.position, afterThrust.camera.position),
              targetBefore: afterBrake.target.id,
              targetAfter: retargeted.target.id,
              stationBearing: game.dockingStatus(afterThrust).bearing,
              pirateState: pirateLive.pirate.state,
              pirateEncounter: pirateLive.pirate.encounterState,
            }));
            """
        )

        self.assertGreater(result["moved"], 1)
        self.assertTrue(result["headingChanged"])
        self.assertGreater(result["fuelSpent"], 0)
        self.assertGreater(result["speedAfterThrust"], result["speedAfterBrake"])
        self.assertGreater(result["cameraMoved"], 1)
        self.assertNotEqual(result["targetBefore"], result["targetAfter"])
        self.assertIsInstance(result["stationBearing"], int)
        self.assertEqual("shadowing", result["pirateState"])
        self.assertIn(result["pirateEncounter"], ("distant", "shadow", "close"))

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

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "corebound"


class CoreboundContinuousMotionTests(unittest.TestCase):
    def test_rig_motion_is_frame_driven_and_held_input_based(self) -> None:
        script = (GAME_DIR / "corebound.js").read_text(encoding="utf-8")

        for token in (
            "worldX",
            "worldY",
            "velocityX",
            "velocityY",
            "beginDirectionalInput",
            "endDirectionalInput",
            "activeInputVector",
            "updateMotion(dt)",
            "window.requestAnimationFrame(function gameLoop",
            'document.addEventListener("keyup"',
        ):
            self.assertIn(token, script)
        keydown_body = re.search(r'document\.addEventListener\("keydown", \(event\) => \{(?P<body>.*?)\n  \}\);', script, re.S)
        self.assertIsNotNone(keydown_body)
        self.assertIn("beginDirectionalInput", keydown_body.group("body"))
        self.assertNotIn("state.player.x =", keydown_body.group("body"))

    def test_continuous_motion_commits_gameplay_through_cell_bridge(self) -> None:
        script = (GAME_DIR / "corebound.js").read_text(encoding="utf-8")

        for token in (
            "function cellFromMotion(worldX, worldY)",
            "function enterCell(targetX, targetY, dx, dy)",
            "cellAt(targetX, targetY)",
            'cell.kind === "solid"',
            "drillBlock(targetX, targetY, cell)",
            'applyHazardPressure(cell, "transit")',
            "state.player.x = targetX",
            "state.player.y = targetY",
            "updateContractProgress()",
            "updateCharterProgress()",
            "updateRouteProgress()",
        ):
            self.assertIn(token, script)

    def test_camera_render_window_follows_continuous_position(self) -> None:
        script = (GAME_DIR / "corebound.js").read_text(encoding="utf-8")

        for token in (
            "cameraX",
            "cameraY",
            "cameraTarget(cols, rows)",
            "updateCamera(dt)",
            "state.motion.cameraX",
            "state.motion.worldX - cameraX",
            "state.motion.worldY - cameraY",
            "drawRig(rigScreenX, rigScreenY, size)",
        ):
            self.assertIn(token, script)

    def test_motion_tuning_lives_in_corebound_data(self) -> None:
        data = (GAME_DIR / "corebound-data.js").read_text(encoding="utf-8")

        for token in (
            "motion:",
            "maxSpeed:",
            "acceleration:",
            "braking:",
            "velocityDecay:",
            "tapImpulse:",
            "cameraFollow:",
        ):
            self.assertIn(token, data)


if __name__ == "__main__":
    unittest.main()

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "corebound"


class CoreboundDrillResistanceTests(unittest.TestCase):
    def test_solid_entry_uses_stateful_drill_contact_before_cell_clear(self) -> None:
        script = (GAME_DIR / "corebound.js").read_text(encoding="utf-8")

        for token in (
            "drillContact: null",
            "completedDrillCell",
            "breakthroughRelease: null",
            "function startDrillContact(targetX, targetY, dx, dy, cell)",
            "direction: [dx, dy]",
            "progress: 0",
            "completed: false",
            "function advanceDrillContact(targetX, targetY, dx, dy, dt)",
            "contact.progress = Math.min(contact.required, contact.progress + dt)",
            "function completeDrillContact(contact)",
            "drillBlock(targetX, targetY, cell)",
            "state.completedDrillCell = { x: targetX, y: targetY }",
            "state.completedDrillCell.direction = [contact.dx, contact.dy]",
            "function startBreakthroughRelease(contact)",
            "startBreakthroughRelease(contact)",
            "function updateBreakthroughRelease(dt)",
            "completedDrillMatches(targetX, targetY)",
        ):
            self.assertIn(token, script)

        complete_contact = re.search(
            r"function completeDrillContact\(contact\) \{(?P<body>.*?)\n  function advanceDrillContact",
            script,
            re.S,
        )
        self.assertIsNotNone(complete_contact)
        self.assertNotIn("enterCell(", complete_contact.group("body"))

        enter_cell = re.search(
            r"function enterCell\(targetX, targetY, dx, dy\) \{(?P<body>.*?)\n  function stopMotionAtCell",
            script,
            re.S,
        )
        self.assertIsNotNone(enter_cell)
        solid_branch = enter_cell.group("body")
        self.assertIn('if (cell.kind === "solid")', solid_branch)
        self.assertIn("advanceDrillContact(targetX, targetY, dx, dy, 0)", solid_branch)
        self.assertNotIn("drillBlock(targetX, targetY, cell)", solid_branch)
        self.assertIn("if (drilled) {\n      state.completedDrillCell = null;\n      clearBreakthroughRelease();", solid_branch)

    def test_drill_duration_and_pressure_are_data_driven_by_terrain_and_rig_stats(self) -> None:
        script = (GAME_DIR / "corebound.js").read_text(encoding="utf-8")
        data = (GAME_DIR / "corebound-data.js").read_text(encoding="utf-8")

        for token in (
            "drillContact:",
            "drillPower: 1",
            "hardnessSeconds:",
            "pressureSeconds:",
            "cargoLoadSeconds:",
            "heatPerSecond:",
            "energyPressure:",
            "effects: { drillCostReduction: 2, drillPower: 0.4 }",
        ):
            self.assertIn(token, data)

        for token in (
            "function drillContactDuration(targetY, terrain, stats)",
            "terrain.hardness * settings.hardnessSeconds",
            "pressure * settings.pressureSeconds",
            "cargoLoad() / stats.cargoCapacity",
            "rawDuration / stats.drillPower",
            "stats.drillPower = Math.max(0.35, stats.drillPower || 0)",
            "drillCompletionCost(targetY, terrain, stats)",
            "((terrain.heat || 0) + pressure + stats.charterDrillHeat) * settings.heatPerSecond * dt",
            "(terrain.energyCost + pressure) * settings.energyPressure * dt",
        ):
            self.assertIn(token, script)

    def test_canvas_feedback_marks_resistance_progress_and_pushback(self) -> None:
        script = (GAME_DIR / "corebound.js").read_text(encoding="utf-8")

        for token in (
            "function drawDrillContactFeedback(contact, screenX, screenY, size)",
            "drillContactForCell(worldX, worldY)",
            "barWidth * ratio",
            "ctx.arc(cx, cy, size * (0.26 + ratio * 0.18)",
            "sparkX",
            "function drillContactRigJitter(size)",
            "const contactJitter = drillContactRigJitter(size)",
            "drawRig(rigScreenX + contactJitter.x, rigScreenY + contactJitter.y, size)",
        ):
            self.assertIn(token, script)

    def test_open_tunnel_and_downstream_cell_authority_seams_remain_explicit(self) -> None:
        script = (GAME_DIR / "corebound.js").read_text(encoding="utf-8")

        for token in (
            "targetCell && targetCell.kind === \"solid\"",
            "const entered = enterCell(targetX, targetY, dx, dy)",
            "if (!drilled) {\n        applyHazardPressure(cell, \"transit\");",
            "cell.kind = \"tunnel\"",
            "collectOre(cell.ore)",
            "startBreakthroughRelease(contact)",
            "clearBreakthroughRelease()",
            "updateContractProgress()",
            "updateCharterProgress()",
            "updateRouteProgress()",
            "nearRouteBeacon(targetX, targetY)",
            "renderArchivePanel()",
            "renderFacilityPanel()",
        ):
            self.assertIn(token, script)


if __name__ == "__main__":
    unittest.main()

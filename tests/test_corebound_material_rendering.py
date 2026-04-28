import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "corebound"
MANIFEST_PATH = GAME_DIR / "assets" / "asset-manifest.json"
ASSET_REPORT_PATH = ROOT / "_visual-check" / "corebound-assets" / "asset-check-report.json"


TERRAIN_KEYS = (
    "loam",
    "gritstone",
    "ironClay",
    "basaltLock",
    "pressureGlass",
    "shaleFault",
    "thermalBasalt",
    "machineRib",
    "coreRind",
    "choirSlate",
    "anchorRib",
)

ORE_KEYS = (
    "copperSeed",
    "saltglass",
    "cobaltThread",
    "nickelBloom",
    "emberFossil",
    "vaporCrystal",
    "prismMarrow",
    "archiveShard",
    "coreMote",
    "echoPearl",
    "relayCore",
)

HAZARD_KEYS = (
    "gasVent",
    "heatFissure",
    "pressureFault",
    "magneticBloom",
    "gravityShear",
)


def source_text(filename: str) -> str:
    return (GAME_DIR / filename).read_text(encoding="utf-8")


class CoreboundMaterialRenderingTests(unittest.TestCase):
    def test_data_declares_depth_aware_material_profiles(self) -> None:
        data = source_text("corebound-data.js")

        for token in (
            "materialRendering:",
            "strataBands:",
            "terrainMaterials:",
            "oreDeposits:",
            "hazardInclusions:",
            "textureAlpha:",
            "seamAlpha:",
            "pocket:",
        ):
            self.assertIn(token, data)

        for terrain_key in TERRAIN_KEYS:
            self.assertRegex(data, rf"{terrain_key}: \{{[^}}]*textureAlpha:", terrain_key)
        for ore_key in ORE_KEYS:
            self.assertRegex(data, rf"{ore_key}: \{{[^}}]*form:", ore_key)
        for hazard_key in HAZARD_KEYS:
            self.assertRegex(data, rf"{hazard_key}: \{{[^}}]*form:", hazard_key)

    def test_renderer_blends_terrain_without_square_cell_frames(self) -> None:
        script = source_text("corebound.js")

        for token in (
            "MATERIAL_RENDERING",
            "function materialStrataBand(worldY)",
            "function drawTextureWindow(image, screenX, screenY, size, worldX, worldY)",
            "function drawMaterialBridge(cell, screenX, screenY, size, worldX, worldY, material)",
            "sameMaterialNeighbor(cell, worldX, worldY",
            "function drawMaterialSilhouette(cell, screenX, screenY, size, worldX, worldY)",
            "function drawTerrainCracks(cell, screenX, screenY, size, worldX, worldY, material)",
            "drawTunnelCell(cell, screenX, screenY, size, worldX, worldY)",
        ):
            self.assertIn(token, script)

        framed_cell_pattern = (
            "ctx.strokeStyle = terrain.edge;\n"
            "    ctx.strokeRect(screenX + 1, screenY + 1, size - 2, size - 2);"
        )
        self.assertNotIn(framed_cell_pattern, script)

    def test_ore_and_hazard_readables_are_embedded_material_pockets(self) -> None:
        script = source_text("corebound.js")

        for token in (
            "function materialPocketPath(cx, cy, radiusX, radiusY, seed, rotation)",
            "function drawReadableInPocket(kind, key, cx, cy, size, seed, rotation)",
            "function drawEmbeddedOreDeposit(cell, screenX, screenY, size, worldX, worldY)",
            "function drawEmbeddedHazardPocket(cell, screenX, screenY, size, worldX, worldY)",
            "MATERIAL_RENDERING.oreDeposits",
            "MATERIAL_RENDERING.hazardInclusions",
            "drawOreMark(cell",
            "drawHazardMark(cell",
            'drawAtlasSlot("readables.ore_hazard_atlas"',
        ):
            self.assertIn(token, script)

    def test_breakage_motion_camera_and_drill_feedback_have_material_easing(self) -> None:
        script = source_text("corebound.js")

        for token in (
            "breakageBursts: []",
            "function addBreakageBurst(x, y, terrainKey, oreKey, hazardKey)",
            "function updateBreakageBursts(dt)",
            "function drawBreakageBurst(burst, screenX, screenY, size)",
            "addBreakageBurst(x, y, brokenTerrainKey, brokenOreKey, brokenHazardKey)",
            "function setPostBreakMotion(contact)",
            "setPostBreakMotion(contact)",
            "function cameraMaterialShake()",
            "const materialShake = cameraMaterialShake()",
            "updateBreakageBursts(dt)",
        ):
            self.assertIn(token, script)

    def test_asset_manifest_and_validation_evidence_cover_material_assets(self) -> None:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        report = json.loads(ASSET_REPORT_PATH.read_text(encoding="utf-8"))
        asset_ids = {asset["id"] for asset in manifest["assets"]}
        report_paths = {Path(asset["path"]).name for asset in report["assets"]}

        self.assertTrue(report["ok"])
        for asset_id in (
            "terrain.loam_gritstone_tile",
            "terrain.basalt_core_tile",
            "terrain.pressure_glass_tile",
            "readables.ore_hazard_atlas",
        ):
            self.assertIn(asset_id, asset_ids)

        for asset in manifest["assets"]:
            self.assertTrue(asset["path"].startswith("games/corebound/assets/"))
            self.assertNotIn("://", asset["path"])
            self.assertFalse(Path(asset["path"]).is_absolute())
            self.assertIn(Path(asset["path"]).name, report_paths)


if __name__ == "__main__":
    unittest.main()

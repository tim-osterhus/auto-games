import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "games.json"
INDEX_PATH = ROOT / "index.html"
GAME_DIR = ROOT / "games" / "corebound"


class CoreboundArcadeReleaseTests(unittest.TestCase):
    def test_manifest_registers_playable_corebound_release(self) -> None:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        games = manifest.get("games")

        self.assertIsInstance(games, list)
        corebound = next((game for game in games if game.get("slug") == "corebound"), None)
        self.assertIsNotNone(corebound)
        self.assertEqual("Corebound", corebound["title"])
        self.assertEqual("0.5.0", corebound["version"])
        self.assertEqual("playable", corebound["status"])
        self.assertEqual("games/corebound/", corebound["path"])
        self.assertIn("Mantis-01", corebound["summary"])
        self.assertIn("held-input motion", corebound["summary"])
        self.assertIn("stateful terrain resistance", corebound["summary"])
        self.assertIn("staged first-run objectives", corebound["summary"])
        self.assertIn("visible menu help", corebound["summary"])
        self.assertIn("generated rig and mine art", corebound["summary"])
        self.assertIn("contracts", corebound["summary"])
        self.assertIn("archives", corebound["summary"])
        self.assertIn("Deep Charters", corebound["summary"])
        self.assertIn("late routes", corebound["summary"])
        self.assertIn("v0.5.0 Resistance Start", corebound["release"]["label"])
        self.assertIn("terrain-hardness progress", corebound["release"]["copy"])
        self.assertIn("persistent help menu", corebound["release"]["copy"])
        self.assertIn("sustained drilling", corebound["release"]["copy"])
        self.assertIn("sell or refine", corebound["release"]["copy"])
        self.assertTrue((GAME_DIR / "index.html").is_file())
        self.assertTrue((GAME_DIR / "corebound.js").is_file())
        self.assertTrue((GAME_DIR / "corebound-data.js").is_file())

    def test_manifest_documents_commit_backed_snapshot(self) -> None:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        corebound = next(game for game in manifest["games"] if game.get("slug") == "corebound")
        versions = corebound.get("versions")

        self.assertNotIn("snapshot", corebound)
        self.assertIsInstance(versions, list)
        self.assertEqual("0.5.0", versions[0]["version"])
        self.assertEqual("games/corebound/versions/0.5.0/", versions[0]["path"])
        self.assertEqual("2026-04-28", versions[0]["releasedAt"])
        self.assertEqual("v0.5.0 Resistance Start", versions[0]["label"])
        self.assertIn("Stateful drill resistance", versions[0]["summary"])
        self.assertIn("terrain-hardness contact progress", versions[0]["summary"])
        self.assertIn("persistent menu help", versions[0]["summary"])
        self.assertTrue(versions[0]["commit"].startswith("6335ba3"))
        self.assertEqual("0.4.0", versions[1]["version"])
        self.assertEqual("games/corebound/versions/0.4.0/", versions[1]["path"])
        self.assertEqual("0.3.0", versions[2]["version"])
        self.assertEqual("games/corebound/versions/0.3.0/", versions[2]["path"])
        self.assertEqual("0.2.0", versions[3]["version"])
        self.assertEqual("games/corebound/versions/0.2.0/", versions[3]["path"])
        self.assertTrue((GAME_DIR / "versions" / "0.5.0" / "index.html").is_file())
        self.assertTrue((GAME_DIR / "versions" / "0.4.0" / "index.html").is_file())
        self.assertTrue((GAME_DIR / "versions" / "0.3.0" / "index.html").is_file())
        self.assertTrue((GAME_DIR / "versions" / "0.2.0" / "index.html").is_file())

    def test_corebound_snapshot_contains_resistance_onboarding_help_and_asset_surfaces(self) -> None:
        snapshot_dir = GAME_DIR / "versions" / "0.5.0"
        snapshot_html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        snapshot_data = (snapshot_dir / "corebound-data.js").read_text(encoding="utf-8")
        snapshot_script = (snapshot_dir / "corebound.js").read_text(encoding="utf-8")
        snapshot_manifest = json.loads((snapshot_dir / "assets" / "asset-manifest.json").read_text(encoding="utf-8"))

        self.assertIn("Open Corebound menu and help", snapshot_html)
        self.assertIn("help-quick-start", snapshot_html)
        self.assertIn("help-reset-run", snapshot_html)
        self.assertIn("Deep Charter", snapshot_html)
        self.assertIn("Late Route", snapshot_html)
        self.assertIn('src="assets/surface/surface-facilities-panel.png"', snapshot_html)
        self.assertIn('version: "v0.5.0"', snapshot_data)
        self.assertIn('snapshot: "Resistance Start plus first-session pacing"', snapshot_data)
        self.assertIn("drillContact:", snapshot_data)
        self.assertIn("hardnessSeconds:", snapshot_data)
        self.assertIn("drillPower: 1", snapshot_data)
        self.assertIn("motion:", snapshot_data)
        self.assertIn("sourceManifest: \"assets/asset-manifest.json\"", snapshot_data)
        self.assertIn("\"rig.mantis_motion_strip\"", snapshot_data)
        self.assertIn("\"terrain.loam_gritstone_tile\"", snapshot_data)
        self.assertIn("\"upgrades.research_atlas\"", snapshot_data)
        self.assertIn("iconSlot:", snapshot_data)
        self.assertIn("rigModule:", snapshot_data)
        self.assertIn("deepCharters", snapshot_data)
        self.assertIn("routePlans", snapshot_data)
        self.assertIn("choirSlate", snapshot_data)
        self.assertIn("anchorRecall", snapshot_data)
        self.assertIn("startDrillContact", snapshot_script)
        self.assertIn("advanceDrillContact", snapshot_script)
        self.assertIn("drawDrillContactFeedback", snapshot_script)
        self.assertIn("ONBOARDING_STEPS", snapshot_script)
        self.assertIn("renderHelpSurface", snapshot_script)
        self.assertIn("contractsLayerOpen", snapshot_script)
        self.assertIn("updateMotion(dt)", snapshot_script)
        self.assertIn("cellFromMotion", snapshot_script)
        self.assertIn("loadAssetImages", snapshot_script)
        self.assertIn("drawRigFeedback", snapshot_script)
        self.assertIn("acceptCharter", snapshot_script)
        self.assertIn("selectRoutePlan", snapshot_script)
        self.assertEqual(9, len(snapshot_manifest["assets"]))
        for asset in snapshot_manifest["assets"]:
            self.assertTrue((snapshot_dir / asset["path"].removeprefix("games/corebound/")).is_file())

    def test_generated_arcade_links_to_corebound_build(self) -> None:
        index = INDEX_PATH.read_text(encoding="utf-8")

        self.assertIn("Corebound is playable.", index)
        self.assertIn("playable / v0.5.0", index)
        self.assertIn("games <strong>1 game</strong>", index)
        self.assertIn('href="games/corebound/"', index)
        self.assertIn("v0.5.0 Resistance Start", index)
        self.assertIn("held-input motion", index)
        self.assertIn("stateful terrain resistance", index)
        self.assertIn("persistent help menu", index)
        self.assertIn("sustained drilling", index)
        self.assertIn("sell or refine", index)
        self.assertIn("Snapshots", index)
        self.assertIn('href="games/corebound/versions/0.5.0/"', index)
        self.assertIn('href="games/corebound/versions/0.4.0/"', index)
        self.assertIn('href="games/corebound/versions/0.3.0/"', index)
        self.assertIn('href="games/corebound/versions/0.2.0/"', index)
        self.assertIn("commit 6335ba3bda22", index)
        self.assertNotIn("Snapshot deferred", index)
        self.assertNotIn("uncommitted working-tree", index)
        self.assertNotIn("No playable builds are listed yet", index)


if __name__ == "__main__":
    unittest.main()

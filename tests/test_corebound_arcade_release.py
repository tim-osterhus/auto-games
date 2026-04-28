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
        self.assertEqual("0.3.0", corebound["version"])
        self.assertEqual("playable", corebound["status"])
        self.assertEqual("games/corebound/", corebound["path"])
        self.assertIn("contracts", corebound["summary"])
        self.assertIn("archive", corebound["summary"])
        self.assertIn("Deep Charters", corebound["summary"])
        self.assertIn("late-run choir trench", corebound["summary"])
        self.assertIn("anchor recall", corebound["summary"])
        self.assertIn("v0.3.0 Deep Charter", corebound["release"]["label"])
        self.assertIn("charter-gated late routes", corebound["release"]["copy"])
        self.assertIn("anchor recall extraction", corebound["release"]["copy"])
        self.assertTrue((GAME_DIR / "index.html").is_file())
        self.assertTrue((GAME_DIR / "corebound.js").is_file())
        self.assertTrue((GAME_DIR / "corebound-data.js").is_file())

    def test_manifest_documents_commit_backed_snapshot(self) -> None:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        corebound = next(game for game in manifest["games"] if game.get("slug") == "corebound")
        versions = corebound.get("versions")

        self.assertNotIn("snapshot", corebound)
        self.assertIsInstance(versions, list)
        self.assertEqual("0.3.0", versions[0]["version"])
        self.assertEqual("games/corebound/versions/0.3.0/", versions[0]["path"])
        self.assertEqual("2026-04-27", versions[0]["releasedAt"])
        self.assertEqual("v0.3.0 Deep Charter", versions[0]["label"])
        self.assertIn("Deep Charters", versions[0]["summary"])
        self.assertTrue(versions[0]["commit"].startswith("28155c6"))
        self.assertEqual("0.2.0", versions[1]["version"])
        self.assertEqual("games/corebound/versions/0.2.0/", versions[1]["path"])
        self.assertTrue((GAME_DIR / "versions" / "0.3.0" / "index.html").is_file())
        self.assertTrue((GAME_DIR / "versions" / "0.2.0" / "index.html").is_file())

    def test_corebound_snapshot_contains_deep_charter_gameplay_surfaces(self) -> None:
        snapshot_dir = GAME_DIR / "versions" / "0.3.0"
        snapshot_html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        snapshot_data = (snapshot_dir / "corebound-data.js").read_text(encoding="utf-8")
        snapshot_script = (snapshot_dir / "corebound.js").read_text(encoding="utf-8")

        self.assertIn("Deep Charter", snapshot_html)
        self.assertIn("Late Route", snapshot_html)
        self.assertIn("deepCharters", snapshot_data)
        self.assertIn("routePlans", snapshot_data)
        self.assertIn("choirSlate", snapshot_data)
        self.assertIn("anchorRecall", snapshot_data)
        self.assertIn("acceptCharter", snapshot_script)
        self.assertIn("selectRoutePlan", snapshot_script)

    def test_generated_arcade_links_to_corebound_build(self) -> None:
        index = INDEX_PATH.read_text(encoding="utf-8")

        self.assertIn("Corebound is playable.", index)
        self.assertIn("playable / v0.3.0", index)
        self.assertIn("games <strong>1 game</strong>", index)
        self.assertIn('href="games/corebound/"', index)
        self.assertIn("v0.3.0 Deep Charter", index)
        self.assertIn("late-run choir trench branches", index)
        self.assertIn("charter-gated late routes", index)
        self.assertIn("Snapshots", index)
        self.assertIn('href="games/corebound/versions/0.3.0/"', index)
        self.assertIn('href="games/corebound/versions/0.2.0/"', index)
        self.assertIn("commit 28155c6686be", index)
        self.assertNotIn("Snapshot deferred", index)
        self.assertNotIn("uncommitted working-tree", index)
        self.assertNotIn("No playable builds are listed yet", index)


if __name__ == "__main__":
    unittest.main()

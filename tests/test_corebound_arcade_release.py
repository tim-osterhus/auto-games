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
        self.assertEqual("0.2.0", corebound["version"])
        self.assertEqual("playable", corebound["status"])
        self.assertEqual("games/corebound/", corebound["path"])
        self.assertIn("contracts", corebound["summary"])
        self.assertIn("archive", corebound["summary"])
        self.assertIn("Survey relay", corebound["summary"])
        self.assertIn("v0.2.0 continuity", corebound["release"]["label"])
        self.assertIn("coolant", corebound["release"]["copy"])
        self.assertTrue((GAME_DIR / "index.html").is_file())
        self.assertTrue((GAME_DIR / "corebound.js").is_file())
        self.assertTrue((GAME_DIR / "corebound-data.js").is_file())

    def test_manifest_documents_commit_backed_snapshot(self) -> None:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        corebound = next(game for game in manifest["games"] if game.get("slug") == "corebound")
        versions = corebound.get("versions")

        self.assertNotIn("snapshot", corebound)
        self.assertIsInstance(versions, list)
        self.assertEqual("0.2.0", versions[0]["version"])
        self.assertEqual("games/corebound/versions/0.2.0/", versions[0]["path"])
        self.assertEqual("2026-04-27", versions[0]["releasedAt"])
        self.assertEqual("v0.2.0 continuity", versions[0]["label"])
        self.assertTrue(versions[0]["commit"].startswith("58d87d5"))
        self.assertTrue((GAME_DIR / "versions" / "0.2.0" / "index.html").is_file())

    def test_generated_arcade_links_to_corebound_build(self) -> None:
        index = INDEX_PATH.read_text(encoding="utf-8")

        self.assertIn("Corebound is playable.", index)
        self.assertIn("playable / v0.2.0", index)
        self.assertIn("games <strong>1 game</strong>", index)
        self.assertIn('href="games/corebound/"', index)
        self.assertIn("contracts, archive sets, Survey relay", index)
        self.assertIn("v0.2.0 continuity", index)
        self.assertIn("Snapshots", index)
        self.assertIn('href="games/corebound/versions/0.2.0/"', index)
        self.assertIn("commit 58d87d52128d", index)
        self.assertNotIn("Snapshot deferred", index)
        self.assertNotIn("uncommitted working-tree", index)
        self.assertNotIn("No playable builds are listed yet", index)


if __name__ == "__main__":
    unittest.main()

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_manifest() -> dict:
    return json.loads((ROOT / "data" / "games.json").read_text(encoding="utf-8"))


def game_by_slug(slug: str) -> dict:
    for game in load_manifest()["games"]:
        if game.get("slug") == slug:
            return game
    raise AssertionError(f"missing manifest game {slug}")


class VoidProspectorArcadeReleaseTests(unittest.TestCase):
    def test_manifest_adds_truthful_void_prospector_release_entry(self) -> None:
        game = game_by_slug("void-prospector")

        self.assertEqual("Void Prospector", game["title"])
        self.assertEqual("0.0.1", game["version"])
        self.assertEqual("playable", game["status"])
        self.assertEqual("games/void-prospector/", game["path"])
        self.assertEqual("games/void-prospector/assets/arcade-title-card.png", game["thumbnail"])
        self.assertIn("Prospector Kite", game["summary"])
        self.assertIn("pirate pressure", game["summary"])
        self.assertEqual("v0.0.1 First Sortie", game["release"]["label"])
        self.assertIn("local Three.js flight shell", game["release"]["copy"])
        self.assertIn("original project-local ship", game["release"]["copy"])

        self.assertNotIn("snapshot", game)
        snapshot = game["versions"][0]
        self.assertEqual("0.0.1", snapshot["version"])
        self.assertEqual("games/void-prospector/versions/0.0.1/", snapshot["path"])
        self.assertEqual("2026-04-28", snapshot["releasedAt"])
        self.assertEqual("v0.0.1 First Sortie", snapshot["label"])
        self.assertIn("Local Three.js flight shell", snapshot["summary"])
        self.assertIn("pirate-pressure loop", snapshot["summary"])
        self.assertRegex(snapshot["commit"], r"^[0-9a-f]{40}$")

    def test_manifest_preserves_existing_games_while_listing_three_games(self) -> None:
        manifest = load_manifest()
        slugs = [game["slug"] for game in manifest["games"]]

        self.assertEqual(["corebound", "dark-factory-dispatch", "void-prospector"], slugs)
        self.assertEqual("0.7.0", game_by_slug("corebound")["version"])
        self.assertEqual("0.0.1", game_by_slug("dark-factory-dispatch")["version"])
        self.assertEqual("0.0.1", game_by_slug("void-prospector")["version"])

    def test_generated_arcade_output_lists_third_game_card_and_thumbnail(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")

        self.assertIn("games <strong>3 games</strong>", html)
        self.assertIn("Corebound", html)
        self.assertIn("Dark Factory Dispatch", html)
        self.assertIn("Void Prospector", html)
        self.assertIn('href="games/corebound/"', html)
        self.assertIn('href="games/dark-factory-dispatch/"', html)
        self.assertIn('href="games/void-prospector/"', html)
        self.assertIn('src="games/void-prospector/assets/arcade-title-card.png"', html)
        self.assertIn("v0.0.1 First Sortie", html)
        self.assertIn("Snapshots", html)
        self.assertIn('href="games/void-prospector/versions/0.0.1/"', html)
        self.assertIn("commit ", html)
        self.assertNotIn("Commit-backed Void Prospector snapshot", html)

    def test_snapshot_directory_preserves_playable_static_release(self) -> None:
        snapshot_dir = ROOT / "games" / "void-prospector" / "versions" / "0.0.1"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("void-prospector.css", html)
        self.assertIn("void-prospector.js", html)
        self.assertIn('src="assets/arcade-title-card.png"', html)
        self.assertIn('src="vendor/three.min.js"', html)
        self.assertNotIn("/versions/", script)
        self.assertFalse((snapshot_dir / "versions").exists())
        self.assertTrue((snapshot_dir / "assets" / "arcade-title-card.png").is_file())
        self.assertTrue((snapshot_dir / "vendor" / "three.min.js").is_file())
        self.assertRegex(game_by_slug("void-prospector")["versions"][0]["commit"], r"^[0-9a-f]{40}$")


if __name__ == "__main__":
    unittest.main()

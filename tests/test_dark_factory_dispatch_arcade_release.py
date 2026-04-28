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


class DarkFactoryDispatchArcadeReleaseTests(unittest.TestCase):
    def test_manifest_adds_truthful_dark_factory_dispatch_release_entry(self) -> None:
        game = game_by_slug("dark-factory-dispatch")

        self.assertEqual("Dark Factory Dispatch", game["title"])
        self.assertEqual("0.0.1", game["version"])
        self.assertEqual("playable", game["status"])
        self.assertEqual("games/dark-factory-dispatch/", game["path"])
        self.assertEqual("games/dark-factory-dispatch/assets/arcade-title-card.png", game["thumbnail"])
        self.assertIn("queueing jobs", game["summary"])
        self.assertEqual("v0.0.1 Dispatch Floor", game["release"]["label"])
        self.assertIn("original project-local lane, job, fault, and title-card art", game["release"]["copy"])

        self.assertNotIn("snapshot", game)
        snapshot = game["versions"][0]
        self.assertEqual("0.0.1", snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.0.1/", snapshot["path"])
        self.assertEqual("2026-04-28", snapshot["releasedAt"])
        self.assertEqual("v0.0.1 Dispatch Floor", snapshot["label"])
        self.assertIn("Three-lane factory dispatch board", snapshot["summary"])
        self.assertRegex(snapshot["commit"], r"^[0-9a-f]{40}$")

    def test_manifest_preserves_corebound_while_listing_two_games(self) -> None:
        manifest = load_manifest()
        slugs = [game["slug"] for game in manifest["games"]]

        self.assertIn("corebound", slugs)
        self.assertIn("dark-factory-dispatch", slugs)
        self.assertEqual(2, len(slugs))
        self.assertEqual("0.7.0", game_by_slug("corebound")["version"])

    def test_generated_arcade_output_lists_second_game_card_and_thumbnail(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")

        self.assertIn("games <strong>2 games</strong>", html)
        self.assertIn("Corebound", html)
        self.assertIn("Dark Factory Dispatch", html)
        self.assertIn('href="games/corebound/"', html)
        self.assertIn('href="games/dark-factory-dispatch/"', html)
        self.assertIn('src="games/dark-factory-dispatch/assets/arcade-title-card.png"', html)
        self.assertIn("v0.0.1 Dispatch Floor", html)
        self.assertIn("Snapshots", html)
        self.assertIn('href="games/dark-factory-dispatch/versions/0.0.1/"', html)
        self.assertNotIn("Snapshot deferred", html)

    def test_snapshot_directory_preserves_playable_static_release(self) -> None:
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.0.1"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("dark-factory-dispatch.css", html)
        self.assertIn("dark-factory-dispatch.js", html)
        self.assertIn('src="assets/arcade-title-card.png"', html)
        self.assertNotIn("/versions/", script)
        self.assertFalse((snapshot_dir / "versions").exists())
        self.assertTrue((snapshot_dir / "assets" / "arcade-title-card.png").is_file())
        self.assertRegex(game_by_slug("dark-factory-dispatch")["versions"][0]["commit"], r"^[0-9a-f]{40}$")


if __name__ == "__main__":
    unittest.main()

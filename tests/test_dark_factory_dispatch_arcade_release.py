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

        snapshot = game["snapshot"]
        self.assertEqual("deferred", snapshot["status"])
        self.assertEqual("0.0.1", snapshot["version"])
        self.assertIn("commit-backed", snapshot["reason"])
        self.assertNotIn("commit", snapshot)
        self.assertNotIn("releasedAt", snapshot)

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
        self.assertIn("Snapshot deferred", html)
        self.assertIn("Builder produced a working-tree release; commit-backed snapshot stamping is deferred until publication.", html)


if __name__ == "__main__":
    unittest.main()

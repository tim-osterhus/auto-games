import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "games.json"
INDEX_PATH = ROOT / "index.html"
GAME_DIR = ROOT / "games" / "iron-lantern-descent"


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def iron_lantern_entry() -> dict:
    manifest = load_manifest()
    for game in manifest["games"]:
        if game.get("slug") == "iron-lantern-descent":
            return game
    raise AssertionError("iron-lantern-descent manifest entry missing")


class IronLanternDescentArcadeReleaseTests(unittest.TestCase):
    def test_manifest_lists_truthful_first_release_and_local_thumbnail(self) -> None:
        game = iron_lantern_entry()

        self.assertEqual("Iron Lantern Descent", game["title"])
        self.assertEqual("0.0.1", game["version"])
        self.assertEqual("playable", game["status"])
        self.assertEqual("games/iron-lantern-descent/", game["path"])
        self.assertEqual("games/iron-lantern-descent/assets/arcade-title-card.png", game["thumbnail"])
        self.assertIn("oxygen", game["summary"])
        self.assertIn("lantern anchors", game["summary"])
        self.assertIn("v0.0.1 Lantern Route", game["release"]["label"])
        self.assertIn("project-local", game["release"]["copy"])
        self.assertNotIn("snapshot", game)
        self.assertEqual("0.0.1", game["versions"][0]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.0.1/", game["versions"][0]["path"])
        self.assertEqual("2026-04-30", game["versions"][0]["releasedAt"])
        self.assertEqual("v0.0.1 Lantern Route", game["versions"][0]["label"])
        self.assertTrue((ROOT / game["thumbnail"]).is_file())

    def test_generated_arcade_lists_four_games_without_regressing_existing_launches(self) -> None:
        html = INDEX_PATH.read_text(encoding="utf-8")

        for slug in ("corebound", "dark-factory-dispatch", "void-prospector", "iron-lantern-descent"):
            self.assertIn(f'href="games/{slug}/"', html)

        self.assertIn("games <strong>4 games</strong>", html)
        self.assertIn("Iron Lantern Descent", html)
        self.assertIn("v0.0.1 Lantern Route", html)
        self.assertIn('src="games/iron-lantern-descent/assets/arcade-title-card.png"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.0.1/"', html)
        self.assertNotIn("Snapshot deferred", html)
        self.assertNotIn("release-continuity work item", html)

    def test_game_entrypoint_uses_title_card_and_asset_manifest(self) -> None:
        html = (GAME_DIR / "index.html").read_text(encoding="utf-8")
        script = (GAME_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")

        self.assertIn('src="assets/arcade-title-card.png"', html)
        self.assertIn("assets/asset-manifest.json", script)
        self.assertNotIn("https://", html)
        self.assertNotIn("http://", html)


if __name__ == "__main__":
    unittest.main()

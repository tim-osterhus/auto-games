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
    def test_manifest_lists_truthful_cave_readability_release_and_local_thumbnail(self) -> None:
        game = iron_lantern_entry()

        self.assertEqual("Iron Lantern Descent", game["title"])
        self.assertEqual("0.5.0", game["version"])
        self.assertEqual("playable", game["status"])
        self.assertEqual("games/iron-lantern-descent/", game["path"])
        self.assertEqual("games/iron-lantern-descent/assets/arcade-title-card.png", game["thumbnail"])
        self.assertIn("lantern-lit descent board", game["summary"])
        self.assertIn("Copper Iris onboarding", game["summary"])
        self.assertIn("compact survival HUD", game["summary"])
        self.assertIn("contextual lantern, mining, and lift banking", game["summary"])
        self.assertIn("in-world labels", game["summary"])
        self.assertIn("hidden advanced ledgers", game["summary"])
        self.assertIn("Echo Relay Network history", game["summary"])
        self.assertEqual("v0.5.0 Cave Readability Repair", game["release"]["label"])
        self.assertIn("lantern-lit descent board", game["release"]["copy"])
        self.assertIn("compact oxygen, light, sample, and route HUD", game["release"]["copy"])
        self.assertIn("Copper Iris guidance", game["release"]["copy"])
        self.assertIn("contextual lantern, mining, and lift banking", game["release"]["copy"])
        self.assertIn("hidden advanced ledgers", game["release"]["copy"])
        self.assertNotIn("snapshot", game)
        self.assertEqual("0.5.0", game["versions"][0]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.5.0/", game["versions"][0]["path"])
        self.assertEqual("2026-05-02", game["versions"][0]["releasedAt"])
        self.assertEqual("v0.5.0 Cave Readability Repair", game["versions"][0]["label"])
        self.assertIn("Copper Iris first-expedition onboarding", game["versions"][0]["summary"])
        self.assertIn("compact cave-first survival HUD", game["versions"][0]["summary"])
        self.assertNotIn("commit", game["versions"][0])
        self.assertEqual("0.4.0", game["versions"][1]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.4.0/", game["versions"][1]["path"])
        self.assertEqual("v0.4.0 Echo Relay Network", game["versions"][1]["label"])
        self.assertEqual("0.3.0", game["versions"][2]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.3.0/", game["versions"][2]["path"])
        self.assertEqual("v0.3.0 Cinder Vent Network", game["versions"][2]["label"])
        self.assertEqual("0.2.0", game["versions"][3]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.2.0/", game["versions"][3]["path"])
        self.assertEqual("v0.2.0 Deep Pumpworks", game["versions"][3]["label"])
        self.assertEqual("0.1.0", game["versions"][4]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.1.0/", game["versions"][4]["path"])
        self.assertEqual("v0.1.0 Faultline Survey", game["versions"][4]["label"])
        self.assertEqual("0.0.1", game["versions"][5]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.0.1/", game["versions"][5]["path"])
        self.assertEqual("v0.0.1 Lantern Route", game["versions"][5]["label"])
        self.assertTrue((ROOT / game["thumbnail"]).is_file())

    def test_generated_arcade_lists_four_games_without_regressing_existing_launches(self) -> None:
        html = INDEX_PATH.read_text(encoding="utf-8")

        for slug in ("corebound", "dark-factory-dispatch", "void-prospector", "iron-lantern-descent"):
            self.assertIn(f'href="games/{slug}/"', html)

        self.assertIn("games <strong>4 games</strong>", html)
        self.assertIn("Iron Lantern Descent", html)
        self.assertIn("v0.5.0 Cave Readability Repair", html)
        self.assertIn("v0.4.0 Echo Relay Network", html)
        self.assertIn("v0.3.0 Cinder Vent Network", html)
        self.assertIn("v0.2.0 Deep Pumpworks", html)
        self.assertIn("v0.1.0 Faultline Survey", html)
        self.assertIn("v0.0.1 Lantern Route", html)
        self.assertIn('src="games/iron-lantern-descent/assets/arcade-title-card.png"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.5.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.4.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.3.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.2.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.1.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.0.1/"', html)
        self.assertNotIn("Snapshot deferred", html)
        self.assertNotIn("release-continuity work item", html)

    def test_game_entrypoint_uses_title_card_and_asset_manifest(self) -> None:
        html = (GAME_DIR / "index.html").read_text(encoding="utf-8")
        script = (GAME_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")

        self.assertIn('src="assets/arcade-title-card.png"', html)
        self.assertIn("v0.5.0 cave readability repair", html)
        self.assertIn('label: "v0.5.0 Cave Readability Repair"', script)
        self.assertIn('baseRelease: "v0.4.0 Echo Relay Network"', script)
        self.assertIn("assets/asset-manifest.json", script)
        self.assertIn("stageEvidenceState", script)
        self.assertNotIn("https://", html)
        self.assertNotIn("http://", html)


if __name__ == "__main__":
    unittest.main()

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "games.json"
INDEX_PATH = ROOT / "index.html"
GAME_DIR = ROOT / "games" / "iron-lantern-descent"
SNAPSHOT_DIR = GAME_DIR / "versions" / "0.0.1"
ASSET_REPORT_PATH = ROOT / "_visual-check" / "iron-lantern-descent-assets" / "asset-check-report.json"


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def iron_lantern_entry() -> dict:
    for game in load_manifest()["games"]:
        if game.get("slug") == "iron-lantern-descent":
            return game
    raise AssertionError("iron-lantern-descent manifest entry missing")


class IronLanternDescentReleaseContinuityTests(unittest.TestCase):
    def test_manifest_live_release_and_snapshot_history_are_aligned(self) -> None:
        game = iron_lantern_entry()
        version = game["versions"][0]

        self.assertEqual("iron-lantern-descent", game["slug"])
        self.assertEqual("Iron Lantern Descent", game["title"])
        self.assertEqual("0.0.1", game["version"])
        self.assertEqual("games/iron-lantern-descent/", game["path"])
        self.assertEqual("games/iron-lantern-descent/assets/arcade-title-card.png", game["thumbnail"])
        self.assertEqual("v0.0.1 Lantern Route", game["release"]["label"])
        self.assertIn("lantern anchors", game["release"]["copy"])
        self.assertIn("upgrade carryover", game["release"]["copy"])
        self.assertNotIn("snapshot", game)

        self.assertEqual("0.0.1", version["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.0.1/", version["path"])
        self.assertEqual("2026-04-30", version["releasedAt"])
        self.assertEqual(game["release"]["label"], version["label"])
        self.assertIn("Local Three.js cave descent", version["summary"])
        self.assertNotIn("commit", version)
        self.assertTrue((ROOT / version["path"]).is_dir())

    def test_snapshot_is_playable_static_copy_without_nested_version_history(self) -> None:
        for relative_path in (
            "index.html",
            "iron-lantern-descent.css",
            "iron-lantern-descent.js",
            "vendor/three.min.js",
            "assets/asset-manifest.json",
            "assets/arcade-title-card.png",
            "assets/drill-tool.png",
            "assets/lantern-anchor.png",
            "assets/mineral-vein-material.png",
            "assets/oxygen-light-icons.png",
        ):
            self.assertTrue((SNAPSHOT_DIR / relative_path).is_file(), relative_path)

        self.assertFalse((SNAPSHOT_DIR / "versions").exists())
        self.assertFalse((SNAPSHOT_DIR / "snapshots").exists())
        self.assertEqual((GAME_DIR / "index.html").read_bytes(), (SNAPSHOT_DIR / "index.html").read_bytes())
        self.assertEqual(
            (GAME_DIR / "iron-lantern-descent.js").read_bytes(),
            (SNAPSHOT_DIR / "iron-lantern-descent.js").read_bytes(),
        )

        snapshot_html = (SNAPSHOT_DIR / "index.html").read_text(encoding="utf-8")
        snapshot_script = (SNAPSHOT_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        self.assertIn("<title>Iron Lantern Descent</title>", snapshot_html)
        self.assertIn('src="vendor/three.min.js"', snapshot_html)
        self.assertIn('lanternAnchor: "assets/lantern-anchor.png"', snapshot_script)
        self.assertNotIn("https://", snapshot_html)
        self.assertNotIn("http://", snapshot_html)

    def test_generated_arcade_exposes_snapshot_history_for_fourth_game(self) -> None:
        html = INDEX_PATH.read_text(encoding="utf-8")

        self.assertIn("games <strong>4 games</strong>", html)
        self.assertIn('href="games/iron-lantern-descent/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.0.1/"', html)
        self.assertIn('aria-label="Iron Lantern Descent snapshots"', html)
        self.assertIn("v0.0.1 Lantern Route", html)
        self.assertNotIn("Snapshot deferred", html)

    def test_asset_check_report_remains_ok_for_release_pack(self) -> None:
        report = json.loads(ASSET_REPORT_PATH.read_text(encoding="utf-8"))

        self.assertTrue(report["ok"])
        self.assertEqual(5, report["asset_count"])
        self.assertTrue(all(asset["ok"] and asset["issues"] == [] for asset in report["assets"]))


if __name__ == "__main__":
    unittest.main()

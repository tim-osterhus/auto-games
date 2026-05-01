import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "games.json"
INDEX_PATH = ROOT / "index.html"
GAME_DIR = ROOT / "games" / "iron-lantern-descent"
SNAPSHOT_DIR = GAME_DIR / "versions" / "0.2.0"
FAULTLINE_SNAPSHOT_DIR = GAME_DIR / "versions" / "0.1.0"
BASELINE_SNAPSHOT_DIR = GAME_DIR / "versions" / "0.0.1"
ASSET_REPORT_PATH = ROOT / "_visual-check" / "iron-lantern-descent-assets" / "asset-check-report.json"
SMOKE_REPORT_PATH = ROOT / "_visual-check" / "iron-lantern-descent-assets" / "release-smoke-report.json"


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
        self.assertEqual("0.2.0", game["version"])
        self.assertEqual("games/iron-lantern-descent/", game["path"])
        self.assertEqual("games/iron-lantern-descent/assets/arcade-title-card.png", game["thumbnail"])
        self.assertEqual("v0.2.0 Deep Pumpworks", game["release"]["label"])
        self.assertIn("cinder sump and basalt siphon stations", game["release"]["copy"])
        self.assertIn("lift-banked pumpworks map progress", game["release"]["copy"])
        self.assertNotIn("snapshot", game)

        self.assertEqual("0.2.0", version["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.2.0/", version["path"])
        self.assertEqual("2026-05-01", version["releasedAt"])
        self.assertEqual(game["release"]["label"], version["label"])
        self.assertIn("Deep Pumpworks adds lower pumpworks", version["summary"])
        self.assertNotIn("commit", version)
        self.assertTrue((ROOT / version["path"]).is_dir())

        self.assertEqual("0.1.0", game["versions"][1]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.1.0/", game["versions"][1]["path"])
        self.assertEqual("v0.1.0 Faultline Survey", game["versions"][1]["label"])
        self.assertTrue((ROOT / game["versions"][1]["path"]).is_dir())

        self.assertEqual("0.0.1", game["versions"][2]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.0.1/", game["versions"][2]["path"])
        self.assertEqual("v0.0.1 Lantern Route", game["versions"][2]["label"])
        self.assertTrue((ROOT / game["versions"][2]["path"]).is_dir())

    def test_deep_pumpworks_snapshot_is_playable_static_copy_without_nested_version_history(self) -> None:
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

        live_html = (GAME_DIR / "index.html").read_text(encoding="utf-8")
        snapshot_html = (SNAPSHOT_DIR / "index.html").read_text(encoding="utf-8")
        live_script = (GAME_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        snapshot_script = (SNAPSHOT_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        faultline_html = (FAULTLINE_SNAPSHOT_DIR / "index.html").read_text(encoding="utf-8")
        faultline_script = (FAULTLINE_SNAPSHOT_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        baseline_html = (BASELINE_SNAPSHOT_DIR / "index.html").read_text(encoding="utf-8")
        baseline_script = (BASELINE_SNAPSHOT_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        self.assertIn("<title>Iron Lantern Descent</title>", snapshot_html)
        self.assertIn('src="vendor/three.min.js"', snapshot_html)
        self.assertIn('lanternAnchor: "assets/lantern-anchor.png"', snapshot_script)
        self.assertIn("v0.2.0 deep pumpworks", live_html)
        self.assertIn("v0.2.0 deep pumpworks", snapshot_html)
        self.assertIn("lower-pumpworks", snapshot_script)
        self.assertIn("Cinder Sump Pump", snapshot_script)
        self.assertIn("v0.1.0 faultline survey", faultline_html)
        self.assertIn("v0.0.1 survival loop", baseline_html)
        self.assertIn("survey-readout", live_html)
        self.assertIn("survey-readout", snapshot_html)
        self.assertIn("pumpworks-readout", snapshot_html)
        self.assertNotIn("pumpworks-readout", faultline_html)
        self.assertNotIn("survey-readout", baseline_html)
        self.assertIn("v0.2.0 Deep Pumpworks", live_script)
        self.assertIn("v0.2.0 Deep Pumpworks", snapshot_script)
        self.assertIn("v0.1.0 Faultline Survey", faultline_script)
        self.assertNotIn("v0.1.0 Faultline Survey", baseline_script)
        self.assertNotIn("https://", snapshot_html)
        self.assertNotIn("http://", snapshot_html)

    def test_generated_arcade_exposes_snapshot_history_for_fourth_game(self) -> None:
        html = INDEX_PATH.read_text(encoding="utf-8")

        self.assertIn("games <strong>4 games</strong>", html)
        self.assertIn('href="games/iron-lantern-descent/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.2.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.1.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.0.1/"', html)
        self.assertIn('aria-label="Iron Lantern Descent snapshots"', html)
        self.assertIn("v0.2.0 Deep Pumpworks", html)
        self.assertIn("v0.1.0 Faultline Survey", html)
        self.assertIn("v0.0.1 Lantern Route", html)
        self.assertNotIn("Snapshot deferred", html)

    def test_asset_check_report_remains_ok_for_release_pack(self) -> None:
        report = json.loads(ASSET_REPORT_PATH.read_text(encoding="utf-8"))

        self.assertTrue(report["ok"])
        self.assertEqual(5, report["asset_count"])
        self.assertTrue(all(asset["ok"] and asset["issues"] == [] for asset in report["assets"]))

    def test_release_smoke_report_covers_arcade_and_deep_pumpworks_decision_path(self) -> None:
        report = json.loads(SMOKE_REPORT_PATH.read_text(encoding="utf-8"))

        self.assertTrue(report["ok"])
        self.assertEqual([], report["consoleErrors"])
        self.assertTrue(report["checks"]["arcadeDesktop"])
        self.assertTrue(report["checks"]["arcadeNarrow"])
        self.assertTrue(report["checks"]["desktopCanvasNonblank"])
        self.assertTrue(report["checks"]["narrowCanvasNonblank"])
        self.assertTrue(report["checks"]["pumpworksDecision"])
        self.assertTrue(report["checks"]["directOverflow"])
        self.assertIn("0.2.0", report["arcade"]["desktop"]["versionText"])
        self.assertEqual("v0.2.0 deep pumpworks", report["direct"]["desktop"]["eyebrow"])
        self.assertIn("v0.2.0 Deep Pumpworks", report["arcade"]["desktop"]["releaseLabel"])
        self.assertIn("pressure valve success", report["direct"]["desktop"]["pumpworksDecision"]["lastLog"])
        self.assertIn("Cinder Sump Pump", report["direct"]["desktop"]["pumpworksDecision"]["pumpworksReadout"])
        self.assertGreater(report["direct"]["desktop"]["canvas"]["nonDark"], 0)
        self.assertGreater(report["direct"]["narrow"]["canvas"]["nonDark"], 0)


if __name__ == "__main__":
    unittest.main()

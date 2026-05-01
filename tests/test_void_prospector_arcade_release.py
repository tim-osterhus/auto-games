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
    def test_manifest_adds_truthful_void_prospector_knife_wake_interdiction_release(self) -> None:
        game = game_by_slug("void-prospector")

        self.assertEqual("Void Prospector", game["title"])
        self.assertEqual("0.5.0", game["version"])
        self.assertEqual("playable", game["status"])
        self.assertEqual("games/void-prospector/", game["path"])
        self.assertEqual("games/void-prospector/assets/arcade-title-card.png", game["thumbnail"])
        self.assertIn("Prospector Kite", game["summary"])
        self.assertIn("Survey Ladder sectors", game["summary"])
        self.assertIn("salvage extraction", game["summary"])
        self.assertIn("deployable route beacons", game["summary"])
        self.assertIn("storm-front charting", game["summary"])
        self.assertIn("safe route windows", game["summary"])
        self.assertIn("active Knife Wake pirate cells", game["summary"])
        self.assertIn("distress and decoy markers", game["summary"])
        self.assertIn("convoy and salvage raid responses", game["summary"])
        self.assertIn("station patrol uplinks", game["summary"])
        self.assertIn("route payouts", game["summary"])
        self.assertEqual("v0.5.0 Knife Wake Interdiction", game["release"]["label"])
        self.assertIn("active pirate cells", game["release"]["copy"])
        self.assertIn("transponder scans", game["release"]["copy"])
        self.assertIn("distress or decoy marker choices", game["release"]["copy"])
        self.assertIn("lure deployment", game["release"]["copy"])
        self.assertIn("convoy escort and cargo-loss responses", game["release"]["copy"])
        self.assertIn("salvage raid shields", game["release"]["copy"])
        self.assertIn("patrol-uplink station support", game["release"]["copy"])
        self.assertIn("complete, partial, or failed interdiction outcomes", game["release"]["copy"])

        self.assertNotIn("snapshot", game)
        versions = game["versions"]
        self.assertEqual(
            ["0.5.0", "0.4.0", "0.3.0", "0.2.0", "0.1.0", "0.0.1"],
            [entry["version"] for entry in versions],
        )

        current_snapshot = versions[0]
        self.assertEqual("games/void-prospector/versions/0.5.0/", current_snapshot["path"])
        self.assertEqual("2026-04-30", current_snapshot["releasedAt"])
        self.assertEqual("v0.5.0 Knife Wake Interdiction", current_snapshot["label"])
        self.assertIn("Active pirate cells", current_snapshot["summary"])
        self.assertIn("transponder scans", current_snapshot["summary"])
        self.assertIn("distress or decoy markers", current_snapshot["summary"])
        self.assertIn("lure deployment", current_snapshot["summary"])
        self.assertIn("convoy and salvage raid responses", current_snapshot["summary"])
        self.assertIn("cargo-loss escapes", current_snapshot["summary"])
        self.assertIn("complete/partial/failed interdiction payouts", current_snapshot["summary"])
        self.assertNotIn("commit", current_snapshot)

        storm_snapshot = versions[1]
        self.assertEqual("0.4.0", storm_snapshot["version"])
        self.assertEqual("games/void-prospector/versions/0.4.0/", storm_snapshot["path"])
        self.assertEqual("v0.4.0 Storm Cartography", storm_snapshot["label"])

        beacon_snapshot = versions[2]
        self.assertEqual("0.3.0", beacon_snapshot["version"])
        self.assertEqual("games/void-prospector/versions/0.3.0/", beacon_snapshot["path"])
        self.assertEqual("v0.3.0 Beacon Convoy", beacon_snapshot["label"])

        salvage_snapshot = versions[3]
        self.assertEqual("0.2.0", salvage_snapshot["version"])
        self.assertEqual("games/void-prospector/versions/0.2.0/", salvage_snapshot["path"])
        self.assertEqual("v0.2.0 Derelict Salvage", salvage_snapshot["label"])

        survey_snapshot = versions[4]
        self.assertEqual("0.1.0", survey_snapshot["version"])
        self.assertEqual("games/void-prospector/versions/0.1.0/", survey_snapshot["path"])
        self.assertEqual("v0.1.0 Survey Ladder", survey_snapshot["label"])

        first_snapshot = versions[5]
        self.assertEqual("0.0.1", first_snapshot["version"])
        self.assertEqual("games/void-prospector/versions/0.0.1/", first_snapshot["path"])
        self.assertEqual("v0.0.1 First Sortie", first_snapshot["label"])

    def test_manifest_preserves_existing_games_while_listing_four_games(self) -> None:
        manifest = load_manifest()
        slugs = [game["slug"] for game in manifest["games"]]

        self.assertEqual(["corebound", "dark-factory-dispatch", "void-prospector", "iron-lantern-descent"], slugs)
        self.assertEqual("0.7.0", game_by_slug("corebound")["version"])
        self.assertEqual("0.6.0", game_by_slug("dark-factory-dispatch")["version"])
        self.assertEqual("0.5.0", game_by_slug("void-prospector")["version"])
        self.assertEqual("0.4.0", game_by_slug("iron-lantern-descent")["version"])

    def test_generated_arcade_output_lists_knife_wake_card_snapshots_and_thumbnail(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")

        self.assertIn("games <strong>4 games</strong>", html)
        self.assertIn("Corebound", html)
        self.assertIn("Dark Factory Dispatch", html)
        self.assertIn("Void Prospector", html)
        self.assertIn("Iron Lantern Descent", html)
        self.assertIn('href="games/corebound/"', html)
        self.assertIn('href="games/dark-factory-dispatch/"', html)
        self.assertIn('href="games/void-prospector/"', html)
        self.assertIn('href="games/iron-lantern-descent/"', html)
        self.assertIn('src="games/void-prospector/assets/arcade-title-card.png"', html)
        self.assertIn("playable / v0.5.0", html)
        self.assertIn("v0.5.0 Knife Wake Interdiction", html)
        self.assertIn("active Knife Wake pirate cells", html)
        self.assertIn("distress and decoy markers", html)
        self.assertIn("convoy and salvage raid responses", html)
        self.assertIn("patrol-uplink station support", html)
        self.assertIn("complete, partial, or failed interdiction outcomes", html)
        self.assertIn("Snapshots", html)
        self.assertIn('href="games/void-prospector/versions/0.5.0/"', html)
        self.assertIn('href="games/void-prospector/versions/0.4.0/"', html)
        self.assertIn('href="games/void-prospector/versions/0.3.0/"', html)
        self.assertIn('href="games/void-prospector/versions/0.2.0/"', html)
        self.assertIn('href="games/void-prospector/versions/0.1.0/"', html)
        self.assertIn('href="games/void-prospector/versions/0.0.1/"', html)
        self.assertIn("<span class=\"snapshot-meta\"><span>2026-04-30</span></span>", html)
        self.assertIn("v0.4.0 Storm Cartography", html)
        self.assertIn("v0.3.0 Beacon Convoy", html)
        self.assertIn("v0.2.0 Derelict Salvage", html)
        self.assertIn("v0.1.0 Survey Ladder", html)
        self.assertIn("v0.0.1 First Sortie", html)
        self.assertIn("commit ", html)
        self.assertNotIn("Commit-backed Void Prospector snapshot", html)
        self.assertNotIn('aria-label="Void Prospector snapshot continuity"', html)

    def test_snapshot_directory_preserves_playable_static_knife_wake_interdiction_release(self) -> None:
        snapshot_dir = ROOT / "games" / "void-prospector" / "versions" / "0.5.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("void-prospector.css", html)
        self.assertIn("void-prospector.js", html)
        self.assertIn("v0.5.0 Knife Wake Interdiction", html)
        self.assertIn('href="../../../../favicon.png"', html)
        self.assertIn('href="../../../../">Millrace Arcade', html)
        self.assertIn("survey-panel", html)
        self.assertIn("salvage-target-data", html)
        self.assertIn("convoy-target-data", html)
        self.assertIn("storm-target-data", html)
        self.assertIn("interdiction-target-data", html)
        self.assertIn("interdiction-list", html)
        self.assertIn("interdiction-raid-readout", html)
        self.assertIn("interdiction-lure-readout", html)
        self.assertIn("service-patrol-uplink-action", html)
        self.assertIn("beacon-action", html)
        self.assertIn("countermeasure-action", html)
        self.assertIn('src="assets/arcade-title-card.png"', html)
        self.assertIn('src="vendor/three.min.js"', html)
        self.assertIn('releaseLabel: "Knife Wake Interdiction"', script)
        self.assertIn("cell-rift-decoy-net", script)
        self.assertIn("cell-umbra-blackbox-raid", script)
        self.assertIn("cell-tempest-patrol-net", script)
        self.assertIn("scanInterdictionTransponder", script)
        self.assertIn("placeInterdictionMarker", script)
        self.assertIn("deployInterdictionLure", script)
        self.assertIn("resolveInterdictionRaid", script)
        self.assertIn("patrol-uplink", script)
        self.assertIn('releaseLabel: "Storm Cartography"', script)
        self.assertIn("storm-rift-breaker", script)
        self.assertNotIn("/versions/", script)
        self.assertFalse((snapshot_dir / "versions").exists())
        self.assertTrue((snapshot_dir / "assets" / "arcade-title-card.png").is_file())
        self.assertTrue((snapshot_dir / "assets" / "asset-manifest.json").is_file())
        self.assertTrue((snapshot_dir / "vendor" / "three.min.js").is_file())
        self.assertNotIn("commit", game_by_slug("void-prospector")["versions"][0])

    def test_storm_cartography_snapshot_remains_available_after_knife_wake_release(self) -> None:
        game = game_by_slug("void-prospector")
        snapshot_dir = ROOT / "games" / "void-prospector" / "versions" / "0.4.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

        self.assertEqual("0.4.0", game["versions"][1]["version"])
        self.assertEqual("games/void-prospector/versions/0.4.0/", game["versions"][1]["path"])
        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("v0.4.0 Storm Cartography", html)
        self.assertIn('releaseLabel: "Storm Cartography"', script)
        self.assertIn("storm-rift-breaker", script)
        self.assertIn("storm-tempest-verge", script)
        self.assertIn("scanStormChart", script)
        self.assertIn("deployStormAnchor", script)
        self.assertIn("lockStormRouteWindow", script)
        self.assertIn("rerouteStormSalvage", script)
        self.assertNotIn('releaseLabel: "Knife Wake Interdiction"', script)
        self.assertNotIn("cell-rift-decoy-net", script)
        self.assertNotIn("/versions/", script)

    def test_beacon_convoy_snapshot_remains_available_after_knife_wake_release(self) -> None:
        game = game_by_slug("void-prospector")
        snapshot_dir = ROOT / "games" / "void-prospector" / "versions" / "0.3.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

        self.assertEqual("0.3.0", game["versions"][2]["version"])
        self.assertEqual("games/void-prospector/versions/0.3.0/", game["versions"][2]["path"])
        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("v0.3.0 Beacon Convoy", html)
        self.assertIn('releaseLabel: "Beacon Convoy"', script)
        self.assertIn("convoy-rift-relay", script)
        self.assertIn("convoy-umbra-blackbox", script)
        self.assertIn("deployRouteBeacon", script)
        self.assertIn("startConvoyRoute", script)
        self.assertIn("advanceConvoyRoute", script)
        self.assertIn("deployConvoyCountermeasure", script)
        self.assertNotIn("storm-rift-breaker", script)
        self.assertNotIn("Knife Wake Interdiction", html)
        self.assertNotIn("/versions/", script)

    def test_derelict_salvage_snapshot_remains_available_after_knife_wake_release(self) -> None:
        game = game_by_slug("void-prospector")
        snapshot_dir = ROOT / "games" / "void-prospector" / "versions" / "0.2.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

        self.assertEqual("0.2.0", game["versions"][3]["version"])
        self.assertEqual("games/void-prospector/versions/0.2.0/", game["versions"][3]["path"])
        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("v0.2.0 Derelict Salvage", html)
        self.assertIn('releaseLabel: "Derelict Salvage"', script)
        self.assertIn("salvage-rift-hulk", script)
        self.assertIn("salvage-rift-volatile", script)
        self.assertIn("salvage-umbra-vault", script)
        self.assertIn("scanSalvageTarget", script)
        self.assertIn("extractSalvageTarget", script)
        self.assertIn("purchaseStationService", script)
        self.assertNotIn("convoy-rift-relay", script)
        self.assertNotIn("/versions/", script)

    def test_survey_ladder_snapshot_remains_available_after_knife_wake_release(self) -> None:
        game = game_by_slug("void-prospector")
        snapshot_dir = ROOT / "games" / "void-prospector" / "versions" / "0.1.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

        self.assertEqual("0.1.0", game["versions"][4]["version"])
        self.assertEqual("games/void-prospector/versions/0.1.0/", game["versions"][4]["path"])
        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("v0.1.0 Survey Ladder", html)
        self.assertIn('releaseLabel: "Survey Ladder"', script)
        self.assertIn("Rift Shelf", script)
        self.assertIn("Umbra Trench", script)
        self.assertIn("scanTarget", script)
        self.assertIn("chooseSector", script)
        self.assertIn("deployCountermeasure", script)
        self.assertNotIn("salvage-rift-hulk", script)
        self.assertNotIn("convoy-rift-relay", script)
        self.assertNotIn("/versions/", script)

    def test_first_sortie_snapshot_remains_available_after_knife_wake_release(self) -> None:
        game = game_by_slug("void-prospector")
        snapshot_dir = ROOT / "games" / "void-prospector" / "versions" / "0.0.1"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

        self.assertEqual("0.0.1", game["versions"][5]["version"])
        self.assertEqual("games/void-prospector/versions/0.0.1/", game["versions"][5]["path"])
        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("First Sortie", game["versions"][5]["label"])
        self.assertNotIn("salvage-rift-hulk", script)
        self.assertNotIn("convoy-rift-relay", script)
        self.assertNotIn("/versions/", script)


if __name__ == "__main__":
    unittest.main()

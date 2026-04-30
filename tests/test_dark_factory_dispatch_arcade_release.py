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
    def test_manifest_adds_truthful_dark_factory_dispatch_rail_sabotage_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")

        self.assertEqual("Dark Factory Dispatch", game["title"])
        self.assertEqual("0.5.0", game["version"])
        self.assertEqual("playable", game["status"])
        self.assertEqual("games/dark-factory-dispatch/", game["path"])
        self.assertEqual("games/dark-factory-dispatch/assets/arcade-title-card.png", game["thumbnail"])
        self.assertIn("Rail Sabotage shifts", game["summary"])
        self.assertIn("hostile rail cells", game["summary"])
        self.assertIn("suspect cargo manifests", game["summary"])
        self.assertIn("dock patrols", game["summary"])
        self.assertIn("decoy routing", game["summary"])
        self.assertIn("sabotage scans and interceptions", game["summary"])
        self.assertIn("lane repairs", game["summary"])
        self.assertIn("compromised carrier reroutes", game["summary"])
        self.assertIn("Freight Lockdown cargo windows", game["summary"])
        self.assertIn("Signal Breach intrusion", game["summary"])
        self.assertIn("Grid Siege power routing", game["summary"])
        self.assertIn("audit relay directives", game["summary"])
        self.assertIn("emergency coolant-diversion orders", game["summary"])
        self.assertIn("lane overdrive calls", game["summary"])
        self.assertEqual("v0.5.0 Rail Sabotage", game["release"]["label"])
        self.assertIn("Rail Sabotage extends Freight Lockdown", game["release"]["copy"])
        self.assertIn("hostile rail cells", game["release"]["copy"])
        self.assertIn("suspect cargo tags", game["release"]["copy"])
        self.assertIn("scan queues", game["release"]["copy"])
        self.assertIn("dock patrol drones or defense screens", game["release"]["copy"])
        self.assertIn("decoy manifests", game["release"]["copy"])
        self.assertIn("dock lockdown and reopen timing", game["release"]["copy"])
        self.assertIn("compromised carrier reroutes", game["release"]["copy"])
        self.assertIn("sabotage interceptions", game["release"]["copy"])
        self.assertIn("lane repair", game["release"]["copy"])
        self.assertIn("full, partial, or failed containment outcomes", game["release"]["copy"])
        self.assertIn("restart scars", game["release"]["copy"])

        self.assertNotIn("snapshot", game)
        versions = game["versions"]
        self.assertEqual(
            ["0.5.0", "0.4.0", "0.3.0", "0.2.0", "0.1.0", "0.0.1"],
            [entry["version"] for entry in versions],
        )

        current_snapshot = versions[0]
        self.assertEqual("games/dark-factory-dispatch/versions/0.5.0/", current_snapshot["path"])
        self.assertEqual("2026-04-30", current_snapshot["releasedAt"])
        self.assertEqual("v0.5.0 Rail Sabotage", current_snapshot["label"])
        self.assertIn("Hostile rail cells", current_snapshot["summary"])
        self.assertIn("suspect cargo manifests", current_snapshot["summary"])
        self.assertIn("dock patrol and decoy decisions", current_snapshot["summary"])
        self.assertIn("sabotage scans", current_snapshot["summary"])
        self.assertIn("carrier reroutes", current_snapshot["summary"])
        self.assertIn("interceptions", current_snapshot["summary"])
        self.assertIn("lane repairs", current_snapshot["summary"])
        self.assertIn("containment outcomes", current_snapshot["summary"])
        self.assertIn("Freight Lockdown", current_snapshot["summary"])
        self.assertNotIn("commit", current_snapshot)

        freight_snapshot = versions[1]
        self.assertEqual("0.4.0", freight_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.4.0/", freight_snapshot["path"])
        self.assertEqual("v0.4.0 Freight Lockdown", freight_snapshot["label"])

        signal_snapshot = versions[2]
        self.assertEqual("0.3.0", signal_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.3.0/", signal_snapshot["path"])
        self.assertEqual("v0.3.0 Signal Breach", signal_snapshot["label"])

        grid_snapshot = versions[3]
        self.assertEqual("0.2.0", grid_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.2.0/", grid_snapshot["path"])
        self.assertEqual("v0.2.0 Grid Siege", grid_snapshot["label"])
        self.assertRegex(grid_snapshot["commit"], r"^[0-9a-f]{40}$")

        escalation_snapshot = versions[4]
        self.assertEqual("0.1.0", escalation_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.1.0/", escalation_snapshot["path"])
        self.assertEqual("v0.1.0 Escalation Shift", escalation_snapshot["label"])

        first_snapshot = versions[5]
        self.assertEqual("0.0.1", first_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.0.1/", first_snapshot["path"])
        self.assertEqual("v0.0.1 Dispatch Floor", first_snapshot["label"])

    def test_manifest_preserves_other_games_while_listing_three_games(self) -> None:
        manifest = load_manifest()
        slugs = [game["slug"] for game in manifest["games"]]

        self.assertEqual(["corebound", "dark-factory-dispatch", "void-prospector"], slugs)
        self.assertEqual("0.7.0", game_by_slug("corebound")["version"])
        self.assertEqual("0.5.0", game_by_slug("dark-factory-dispatch")["version"])
        self.assertEqual("0.4.0", game_by_slug("void-prospector")["version"])

    def test_generated_arcade_output_lists_rail_sabotage_card_snapshots_and_thumbnail(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")

        self.assertIn("games <strong>3 games</strong>", html)
        self.assertIn("Corebound", html)
        self.assertIn("Dark Factory Dispatch", html)
        self.assertIn("Void Prospector", html)
        self.assertIn('href="games/corebound/"', html)
        self.assertIn('href="games/dark-factory-dispatch/"', html)
        self.assertIn('href="games/void-prospector/"', html)
        self.assertIn('src="games/dark-factory-dispatch/assets/arcade-title-card.png"', html)
        self.assertIn("playable / v0.5.0", html)
        self.assertIn("v0.5.0 Rail Sabotage", html)
        self.assertIn("hostile rail cells", html)
        self.assertIn("suspect cargo manifests", html)
        self.assertIn("dock patrols", html)
        self.assertIn("decoy routing", html)
        self.assertIn("sabotage scans and interceptions", html)
        self.assertIn("compromised carrier reroutes", html)
        self.assertIn("Rail Sabotage extends Freight Lockdown", html)
        self.assertIn("scan queues", html)
        self.assertIn("dock patrol drones or defense screens", html)
        self.assertIn("decoy manifests", html)
        self.assertIn("full, partial, or failed containment outcomes", html)
        self.assertIn("Snapshots", html)
        self.assertIn('href="games/dark-factory-dispatch/versions/0.5.0/"', html)
        self.assertIn('href="games/dark-factory-dispatch/versions/0.4.0/"', html)
        self.assertIn('href="games/dark-factory-dispatch/versions/0.3.0/"', html)
        self.assertIn('href="games/dark-factory-dispatch/versions/0.2.0/"', html)
        self.assertIn('href="games/dark-factory-dispatch/versions/0.1.0/"', html)
        self.assertIn('href="games/dark-factory-dispatch/versions/0.0.1/"', html)
        self.assertIn("v0.4.0 Freight Lockdown", html)
        self.assertIn("v0.3.0 Signal Breach", html)
        self.assertIn("v0.2.0 Grid Siege", html)
        self.assertIn("v0.1.0 Escalation Shift", html)
        self.assertIn("v0.0.1 Dispatch Floor", html)
        self.assertIn('href="games/void-prospector/versions/0.0.1/"', html)
        self.assertNotIn("Snapshot deferred", html)

    def test_snapshot_directory_preserves_playable_static_rail_sabotage_release(self) -> None:
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.5.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("dark-factory-dispatch.css", html)
        self.assertIn("dark-factory-dispatch.js", html)
        self.assertIn('id="escalation-surface"', html)
        self.assertIn('id="grid-siege-board"', html)
        self.assertIn('id="freight-lockdown-board"', html)
        self.assertIn('id="rail-sabotage-board"', html)
        self.assertIn('src="assets/arcade-title-card.png"', html)
        self.assertIn("v0.5.0 Rail Sabotage", script)
        self.assertIn("railSabotage", script)
        self.assertIn("ashline-rail-spoof", script)
        self.assertIn("blackout-yard-saboteurs", script)
        self.assertIn("sweep-sabotage-cells", script)
        self.assertIn("scanSabotageManifest", script)
        self.assertIn("assignSabotagePatrol", script)
        self.assertIn("deploySabotageDecoy", script)
        self.assertIn("lockdownSabotageDock", script)
        self.assertIn("reopenSabotageDock", script)
        self.assertIn("rerouteSabotagedCarrier", script)
        self.assertIn("interceptSabotageCell", script)
        self.assertIn("repairSabotagedLane", script)
        self.assertIn("railSabotageSurfaceState", script)
        self.assertIn("v0.4.0 Freight Lockdown", script)
        self.assertIn("freightLockdown", script)
        self.assertIn("stageFreightCargo", script)
        self.assertIn("breachSurfaceState", script)
        self.assertIn("Reserve Ledger Audit", script)
        self.assertNotIn("/versions/", script)
        self.assertFalse((snapshot_dir / "versions").exists())
        self.assertTrue((snapshot_dir / "assets" / "arcade-title-card.png").is_file())
        self.assertTrue((snapshot_dir / "assets" / "asset-manifest.json").is_file())
        self.assertNotIn("commit", game_by_slug("dark-factory-dispatch")["versions"][0])

    def test_freight_lockdown_snapshot_remains_available_after_rail_sabotage_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.4.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.4.0", game["versions"][1]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.4.0/", game["versions"][1]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.4.0 Freight Lockdown", script)
        self.assertIn("freightLockdown", script)
        self.assertIn("ashline-spare-crates", script)
        self.assertIn("blackout-relay-carrier", script)
        self.assertIn("stageFreightCargo", script)
        self.assertIn("freightSurfaceState", script)
        self.assertIn("compile-countermeasures", script)
        self.assertIn("breachSurfaceState", script)
        self.assertNotIn("v0.5.0 Rail Sabotage", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("railSabotageSurfaceState", script)
        self.assertNotIn("/versions/", script)

    def test_signal_breach_snapshot_remains_available_after_rail_sabotage_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.3.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.3.0", game["versions"][2]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.3.0/", game["versions"][2]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.3.0 Signal Breach", script)
        self.assertIn("compile-countermeasures", script)
        self.assertIn("breachSurfaceState", script)
        self.assertIn("cleanseCompromisedQueueEntry", script)
        self.assertIn("quarantineBreachLane", script)
        self.assertNotIn("v0.4.0 Freight Lockdown", script)
        self.assertNotIn("v0.5.0 Rail Sabotage", script)
        self.assertNotIn("stageFreightCargo", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("/versions/", script)

    def test_grid_siege_snapshot_remains_available_after_rail_sabotage_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.2.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.2.0", game["versions"][3]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.2.0/", game["versions"][3]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.2.0 Grid Siege", script)
        self.assertIn("patch-audit-relay", script)
        self.assertIn("Reserve Ledger Audit", script)
        self.assertNotIn("v0.3.0 Signal Breach", script)
        self.assertNotIn("v0.4.0 Freight Lockdown", script)
        self.assertNotIn("v0.5.0 Rail Sabotage", script)
        self.assertNotIn("compile-countermeasures", script)
        self.assertNotIn("stageFreightCargo", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("/versions/", script)

    def test_escalation_shift_snapshot_remains_available_after_rail_sabotage_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.1.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.1.0", game["versions"][4]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.1.0/", game["versions"][4]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.1.0 Escalation Shift", script)
        self.assertIn("coolant-diversion", script)
        self.assertNotIn("patch-audit-relay", script)
        self.assertNotIn("stageFreightCargo", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("/versions/", script)

    def test_dispatch_floor_snapshot_remains_available_after_rail_sabotage_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.0.1"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.0.1", game["versions"][5]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.0.1/", game["versions"][5]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.0.1 Dispatch Floor", game["versions"][5]["label"])
        self.assertNotIn("patch-audit-relay", script)
        self.assertNotIn("stageFreightCargo", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("/versions/", script)


if __name__ == "__main__":
    unittest.main()

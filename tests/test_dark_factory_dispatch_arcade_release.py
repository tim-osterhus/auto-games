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
    def test_manifest_adds_truthful_dark_factory_dispatch_crisis_arbitration_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")

        self.assertEqual("Dark Factory Dispatch", game["title"])
        self.assertEqual("0.6.0", game["version"])
        self.assertEqual("playable", game["status"])
        self.assertEqual("games/dark-factory-dispatch/", game["path"])
        self.assertEqual("games/dark-factory-dispatch/assets/arcade-title-card.png", game["thumbnail"])
        self.assertIn("Crisis Arbitration shifts", game["summary"])
        self.assertIn("cross-system crisis dockets", game["summary"])
        self.assertIn("evidence packets", game["summary"])
        self.assertIn("binding priority rulings", game["summary"])
        self.assertIn("emergency overrides", game["summary"])
        self.assertIn("protected lanes and docks", game["summary"])
        self.assertIn("timer pressure", game["summary"])
        self.assertIn("Rail Sabotage containment", game["summary"])
        self.assertIn("Freight Lockdown cargo windows", game["summary"])
        self.assertIn("Signal Breach intrusion", game["summary"])
        self.assertIn("Grid Siege power routing", game["summary"])
        self.assertIn("audit relay directives", game["summary"])
        self.assertIn("emergency coolant-diversion orders", game["summary"])
        self.assertIn("lane overdrive calls", game["summary"])
        self.assertEqual("v0.6.0 Crisis Arbitration", game["release"]["label"])
        self.assertIn("Crisis Arbitration binds", game["release"]["copy"])
        self.assertIn("grid, breach, freight, and rail pressures", game["release"]["copy"])
        self.assertIn("live docket cases", game["release"]["copy"])
        self.assertIn("evidence requirements", game["release"]["copy"])
        self.assertIn("protected lane or dock decisions", game["release"]["copy"])
        self.assertIn("priority rulings", game["release"]["copy"])
        self.assertIn("emergency overrides", game["release"]["copy"])
        self.assertIn("deferrals", game["release"]["copy"])
        self.assertIn("timer failures", game["release"]["copy"])
        self.assertIn("queue policy", game["release"]["copy"])
        self.assertIn("rail sabotage pressure", game["release"]["copy"])
        self.assertIn("restart scars", game["release"]["copy"])

        self.assertNotIn("snapshot", game)
        versions = game["versions"]
        self.assertEqual(
            ["0.6.0", "0.5.0", "0.4.0", "0.3.0", "0.2.0", "0.1.0", "0.0.1"],
            [entry["version"] for entry in versions],
        )

        current_snapshot = versions[0]
        self.assertEqual("games/dark-factory-dispatch/versions/0.6.0/", current_snapshot["path"])
        self.assertEqual("2026-05-01", current_snapshot["releasedAt"])
        self.assertEqual("v0.6.0 Crisis Arbitration", current_snapshot["label"])
        self.assertIn("Cross-system crisis dockets", current_snapshot["summary"])
        self.assertIn("evidence packet assignments", current_snapshot["summary"])
        self.assertIn("protected lane or dock decisions", current_snapshot["summary"])
        self.assertIn("binding priority rulings", current_snapshot["summary"])
        self.assertIn("emergency overrides", current_snapshot["summary"])
        self.assertIn("deferrals", current_snapshot["summary"])
        self.assertIn("timer failures", current_snapshot["summary"])
        self.assertIn("Rail Sabotage", current_snapshot["summary"])
        self.assertNotIn("commit", current_snapshot)

        rail_snapshot = versions[1]
        self.assertEqual("0.5.0", rail_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.5.0/", rail_snapshot["path"])
        self.assertEqual("v0.5.0 Rail Sabotage", rail_snapshot["label"])

        freight_snapshot = versions[2]
        self.assertEqual("0.4.0", freight_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.4.0/", freight_snapshot["path"])
        self.assertEqual("v0.4.0 Freight Lockdown", freight_snapshot["label"])

        signal_snapshot = versions[3]
        self.assertEqual("0.3.0", signal_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.3.0/", signal_snapshot["path"])
        self.assertEqual("v0.3.0 Signal Breach", signal_snapshot["label"])

        grid_snapshot = versions[4]
        self.assertEqual("0.2.0", grid_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.2.0/", grid_snapshot["path"])
        self.assertEqual("v0.2.0 Grid Siege", grid_snapshot["label"])
        self.assertRegex(grid_snapshot["commit"], r"^[0-9a-f]{40}$")

        escalation_snapshot = versions[5]
        self.assertEqual("0.1.0", escalation_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.1.0/", escalation_snapshot["path"])
        self.assertEqual("v0.1.0 Escalation Shift", escalation_snapshot["label"])

        first_snapshot = versions[6]
        self.assertEqual("0.0.1", first_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.0.1/", first_snapshot["path"])
        self.assertEqual("v0.0.1 Dispatch Floor", first_snapshot["label"])

    def test_manifest_preserves_other_games_while_listing_four_games(self) -> None:
        manifest = load_manifest()
        slugs = [game["slug"] for game in manifest["games"]]

        self.assertEqual(["corebound", "dark-factory-dispatch", "void-prospector", "iron-lantern-descent"], slugs)
        self.assertEqual("0.7.0", game_by_slug("corebound")["version"])
        self.assertEqual("0.6.0", game_by_slug("dark-factory-dispatch")["version"])
        self.assertEqual("0.5.0", game_by_slug("void-prospector")["version"])
        self.assertEqual("0.4.0", game_by_slug("iron-lantern-descent")["version"])

    def test_generated_arcade_output_lists_crisis_arbitration_card_snapshots_and_thumbnail(self) -> None:
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
        self.assertIn('src="games/dark-factory-dispatch/assets/arcade-title-card.png"', html)
        self.assertIn("playable / v0.6.0", html)
        self.assertIn("v0.6.0 Crisis Arbitration", html)
        self.assertIn("cross-system crisis dockets", html)
        self.assertIn("evidence packets", html)
        self.assertIn("binding priority rulings", html)
        self.assertIn("emergency overrides", html)
        self.assertIn("protected lanes and docks", html)
        self.assertIn("Crisis Arbitration binds", html)
        self.assertIn("live docket cases", html)
        self.assertIn("evidence requirements", html)
        self.assertIn("protected lane or dock decisions", html)
        self.assertIn("timer failures", html)
        self.assertIn("rail sabotage pressure", html)
        self.assertIn("v0.5.0 Rail Sabotage", html)
        self.assertIn("Snapshots", html)
        self.assertIn('href="games/dark-factory-dispatch/versions/0.6.0/"', html)
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
        self.assertNotIn('aria-label="Dark Factory Dispatch snapshot continuity"', html)

    def test_snapshot_directory_preserves_playable_static_crisis_arbitration_release(self) -> None:
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.6.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("dark-factory-dispatch.css", html)
        self.assertIn("dark-factory-dispatch.js", html)
        self.assertIn('id="escalation-surface"', html)
        self.assertIn('id="grid-siege-board"', html)
        self.assertIn('id="freight-lockdown-board"', html)
        self.assertIn('id="rail-sabotage-board"', html)
        self.assertIn('id="crisis-arbitration-board"', html)
        self.assertIn('src="assets/arcade-title-card.png"', html)
        self.assertIn("v0.6.0 Crisis Arbitration", script)
        self.assertIn("crisisArbitration", script)
        self.assertIn("ashline-dock-priority", script)
        self.assertIn("blackout-yard-jurisdiction", script)
        self.assertIn("assignCrisisEvidence", script)
        self.assertIn("ruleCrisisCase", script)
        self.assertIn("buyCrisisEmergencyOverride", script)
        self.assertIn("deferCrisisCase", script)
        self.assertIn("protectCrisisLane", script)
        self.assertIn("crisisArbitrationSurfaceState", script)
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

    def test_rail_sabotage_snapshot_remains_available_after_crisis_arbitration_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.5.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.5.0", game["versions"][1]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.5.0/", game["versions"][1]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.5.0 Rail Sabotage", script)
        self.assertIn("railSabotage", script)
        self.assertIn("scanSabotageManifest", script)
        self.assertIn("assignSabotagePatrol", script)
        self.assertIn("railSabotageSurfaceState", script)
        self.assertIn("v0.4.0 Freight Lockdown", script)
        self.assertIn("freightLockdown", script)
        self.assertNotIn('id="crisis-arbitration-board"', html)
        self.assertNotIn("v0.6.0 Crisis Arbitration", script)
        self.assertNotIn("assignCrisisEvidence", script)
        self.assertNotIn("crisisArbitrationSurfaceState", script)
        self.assertNotIn("/versions/", script)

    def test_freight_lockdown_snapshot_remains_available_after_crisis_arbitration_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.4.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.4.0", game["versions"][2]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.4.0/", game["versions"][2]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.4.0 Freight Lockdown", script)
        self.assertIn("freightLockdown", script)
        self.assertIn("ashline-spare-crates", script)
        self.assertIn("blackout-relay-carrier", script)
        self.assertIn("stageFreightCargo", script)
        self.assertIn("freightSurfaceState", script)
        self.assertIn("compile-countermeasures", script)
        self.assertIn("breachSurfaceState", script)
        self.assertNotIn("v0.6.0 Crisis Arbitration", script)
        self.assertNotIn("v0.5.0 Rail Sabotage", script)
        self.assertNotIn("assignCrisisEvidence", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("railSabotageSurfaceState", script)
        self.assertNotIn("/versions/", script)

    def test_signal_breach_snapshot_remains_available_after_crisis_arbitration_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.3.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.3.0", game["versions"][3]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.3.0/", game["versions"][3]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.3.0 Signal Breach", script)
        self.assertIn("compile-countermeasures", script)
        self.assertIn("breachSurfaceState", script)
        self.assertIn("cleanseCompromisedQueueEntry", script)
        self.assertIn("quarantineBreachLane", script)
        self.assertNotIn("v0.6.0 Crisis Arbitration", script)
        self.assertNotIn("v0.4.0 Freight Lockdown", script)
        self.assertNotIn("v0.5.0 Rail Sabotage", script)
        self.assertNotIn("assignCrisisEvidence", script)
        self.assertNotIn("stageFreightCargo", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("/versions/", script)

    def test_grid_siege_snapshot_remains_available_after_crisis_arbitration_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.2.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.2.0", game["versions"][4]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.2.0/", game["versions"][4]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.2.0 Grid Siege", script)
        self.assertIn("patch-audit-relay", script)
        self.assertIn("Reserve Ledger Audit", script)
        self.assertNotIn("v0.6.0 Crisis Arbitration", script)
        self.assertNotIn("v0.3.0 Signal Breach", script)
        self.assertNotIn("v0.4.0 Freight Lockdown", script)
        self.assertNotIn("v0.5.0 Rail Sabotage", script)
        self.assertNotIn("assignCrisisEvidence", script)
        self.assertNotIn("compile-countermeasures", script)
        self.assertNotIn("stageFreightCargo", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("/versions/", script)

    def test_escalation_shift_snapshot_remains_available_after_crisis_arbitration_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.1.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.1.0", game["versions"][5]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.1.0/", game["versions"][5]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.1.0 Escalation Shift", script)
        self.assertIn("coolant-diversion", script)
        self.assertNotIn("v0.6.0 Crisis Arbitration", script)
        self.assertNotIn("patch-audit-relay", script)
        self.assertNotIn("assignCrisisEvidence", script)
        self.assertNotIn("stageFreightCargo", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("/versions/", script)

    def test_dispatch_floor_snapshot_remains_available_after_crisis_arbitration_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.0.1"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.0.1", game["versions"][6]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.0.1/", game["versions"][6]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.0.1 Dispatch Floor", game["versions"][6]["label"])
        self.assertNotIn("v0.6.0 Crisis Arbitration", script)
        self.assertNotIn("patch-audit-relay", script)
        self.assertNotIn("assignCrisisEvidence", script)
        self.assertNotIn("stageFreightCargo", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("/versions/", script)


if __name__ == "__main__":
    unittest.main()

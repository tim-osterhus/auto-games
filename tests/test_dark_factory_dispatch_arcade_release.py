import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSET_REPORT_PATH = ROOT / "_visual-check" / "dark-factory-dispatch-assets" / "asset-check-report.json"
SMOKE_REPORT_PATH = ROOT / "_visual-check" / "dark-factory-dispatch-assets" / "release-smoke-report.json"


def load_manifest() -> dict:
    return json.loads((ROOT / "data" / "games.json").read_text(encoding="utf-8"))


def game_by_slug(slug: str) -> dict:
    for game in load_manifest()["games"]:
        if game.get("slug") == slug:
            return game
    raise AssertionError(f"missing manifest game {slug}")


class DarkFactoryDispatchArcadeReleaseTests(unittest.TestCase):
    def test_manifest_adds_truthful_dark_factory_dispatch_factory_floor_repair_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")

        self.assertEqual("Dark Factory Dispatch", game["title"])
        self.assertEqual("0.7.0", game["version"])
        self.assertEqual("playable", game["status"])
        self.assertEqual("games/dark-factory-dispatch/", game["path"])
        self.assertEqual("games/dark-factory-dispatch/assets/arcade-title-card.png", game["thumbnail"])
        self.assertIn("guided Training Shift", game["summary"])
        self.assertIn("visible Forge Line, Assembler Bay, and Clean Room lanes", game["summary"])
        self.assertIn("click-first job assignment", game["summary"])
        self.assertIn("contextual Start, Overdrive, Pause, and Recover actions", game["summary"])
        self.assertIn("deterministic production", game["summary"])
        self.assertIn("jam and recovery feedback", game["summary"])
        self.assertIn("shift summaries", game["summary"])
        self.assertIn("local lane, job, fault, and title art", game["summary"])
        self.assertIn("procedural output and incident signals", game["summary"])
        self.assertIn("advanced Grid Siege, Signal Breach, Freight Lockdown, Rail Sabotage, Crisis Arbitration", game["summary"])
        self.assertEqual("v0.7.0 Factory Floor Repair", game["release"]["label"])
        self.assertIn("Factory Floor Repair replaces the old default operations wall", game["release"]["copy"])
        self.assertIn("compact training-first dispatch surface", game["release"]["copy"])
        self.assertIn("first screen centers the factory floor", game["release"]["copy"])
        self.assertIn("current objective", game["release"]["copy"])
        self.assertIn("core resources", game["release"]["copy"])
        self.assertIn("incoming jobs", game["release"]["copy"])
        self.assertIn("contextual actions", game["release"]["copy"])
        self.assertIn("short log", game["release"]["copy"])
        self.assertIn("preserves Crisis Arbitration", game["release"]["copy"])
        self.assertIn("progressive disclosure", game["release"]["copy"])

        self.assertNotIn("snapshot", game)
        versions = game["versions"]
        self.assertEqual(
            ["0.7.0", "0.6.0", "0.5.0", "0.4.0", "0.3.0", "0.2.0", "0.1.0", "0.0.1"],
            [entry["version"] for entry in versions],
        )

        current_snapshot = versions[0]
        self.assertEqual("games/dark-factory-dispatch/versions/0.7.0/", current_snapshot["path"])
        self.assertEqual("2026-05-02", current_snapshot["releasedAt"])
        self.assertEqual("v0.7.0 Factory Floor Repair", current_snapshot["label"])
        self.assertIn("Guided Training Shift", current_snapshot["summary"])
        self.assertIn("dominant three-lane factory floor", current_snapshot["summary"])
        self.assertIn("click-first job and lane actions", current_snapshot["summary"])
        self.assertIn("assignment, production, output, jam, recovery, and overdrive feedback", current_snapshot["summary"])
        self.assertIn("shift-summary upgrade choice", current_snapshot["summary"])
        self.assertIn("local asset pack plus procedural feedback hooks", current_snapshot["summary"])
        self.assertIn("progressive advanced-system disclosure", current_snapshot["summary"])
        self.assertNotIn("commit", current_snapshot)

        crisis_snapshot = versions[1]
        self.assertEqual("0.6.0", crisis_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.6.0/", crisis_snapshot["path"])
        self.assertEqual("v0.6.0 Crisis Arbitration", crisis_snapshot["label"])

        rail_snapshot = versions[2]
        self.assertEqual("0.5.0", rail_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.5.0/", rail_snapshot["path"])
        self.assertEqual("v0.5.0 Rail Sabotage", rail_snapshot["label"])

        freight_snapshot = versions[3]
        self.assertEqual("0.4.0", freight_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.4.0/", freight_snapshot["path"])
        self.assertEqual("v0.4.0 Freight Lockdown", freight_snapshot["label"])

        signal_snapshot = versions[4]
        self.assertEqual("0.3.0", signal_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.3.0/", signal_snapshot["path"])
        self.assertEqual("v0.3.0 Signal Breach", signal_snapshot["label"])

        grid_snapshot = versions[5]
        self.assertEqual("0.2.0", grid_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.2.0/", grid_snapshot["path"])
        self.assertEqual("v0.2.0 Grid Siege", grid_snapshot["label"])
        self.assertRegex(grid_snapshot["commit"], r"^[0-9a-f]{40}$")

        escalation_snapshot = versions[6]
        self.assertEqual("0.1.0", escalation_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.1.0/", escalation_snapshot["path"])
        self.assertEqual("v0.1.0 Escalation Shift", escalation_snapshot["label"])

        first_snapshot = versions[7]
        self.assertEqual("0.0.1", first_snapshot["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.0.1/", first_snapshot["path"])
        self.assertEqual("v0.0.1 Dispatch Floor", first_snapshot["label"])

    def test_manifest_preserves_other_games_while_listing_four_games(self) -> None:
        manifest = load_manifest()
        slugs = [game["slug"] for game in manifest["games"]]

        self.assertEqual(["corebound", "dark-factory-dispatch", "void-prospector", "iron-lantern-descent"], slugs)
        self.assertEqual("0.7.0", game_by_slug("corebound")["version"])
        self.assertEqual("0.7.0", game_by_slug("dark-factory-dispatch")["version"])
        self.assertEqual("0.6.0", game_by_slug("void-prospector")["version"])
        self.assertEqual("0.4.0", game_by_slug("iron-lantern-descent")["version"])

    def test_generated_arcade_output_lists_factory_floor_repair_card_snapshots_and_thumbnail(self) -> None:
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
        self.assertIn("Dark Factory Dispatch&#x27;s v0.7.0 Factory Floor Repair release", html)
        self.assertIn("playable / v0.7.0", html)
        self.assertIn("v0.7.0 Factory Floor Repair", html)
        self.assertIn("guided Training Shift", html)
        self.assertIn("visible Forge Line, Assembler Bay, and Clean Room lanes", html)
        self.assertIn("click-first job assignment", html)
        self.assertIn("contextual Start, Overdrive, Pause, and Recover actions", html)
        self.assertIn("jam and recovery feedback", html)
        self.assertIn("Factory Floor Repair replaces the old default operations wall", html)
        self.assertIn("first screen centers the factory floor", html)
        self.assertIn("progressive disclosure", html)
        self.assertIn("v0.6.0 Crisis Arbitration", html)
        self.assertIn("v0.5.0 Rail Sabotage", html)
        self.assertIn("Snapshots", html)
        self.assertIn('href="games/dark-factory-dispatch/versions/0.7.0/"', html)
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

    def test_snapshot_directory_preserves_playable_static_factory_floor_repair_release(self) -> None:
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.7.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("dark-factory-dispatch.css", html)
        self.assertIn("dark-factory-dispatch.js", html)
        self.assertIn('class="operator-layout"', html)
        self.assertIn('id="objective-card"', html)
        self.assertIn('id="lane-board"', html)
        self.assertIn('id="context-actions"', html)
        self.assertIn('id="operator-log"', html)
        self.assertIn("Training Shift", html)
        self.assertIn("v0.7.0 Factory Floor Repair", script)
        self.assertIn("latestRelease", script)
        self.assertIn("factoryFeedbackState", script)
        self.assertIn("laneFeedbackState", script)
        self.assertIn("performContextAction", script)
        self.assertIn("selectJobCard", script)
        self.assertIn("selectLane", script)
        self.assertIn("completeTutorial", script)
        self.assertIn("replayTutorial", script)
        self.assertIn('id="escalation-surface"', html)
        self.assertIn('id="grid-siege-board"', html)
        self.assertIn('id="freight-lockdown-board"', html)
        self.assertIn('id="rail-sabotage-board"', html)
        self.assertIn('id="crisis-arbitration-board"', html)
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

    def test_crisis_arbitration_snapshot_remains_available_after_factory_floor_repair_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.6.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.6.0", game["versions"][1]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.6.0/", game["versions"][1]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.6.0 Crisis Arbitration", script)
        self.assertIn("assignCrisisEvidence", script)
        self.assertIn("crisisArbitrationSurfaceState", script)
        self.assertNotIn("v0.7.0 Factory Floor Repair", script)
        self.assertNotIn("Training Shift", script)
        self.assertNotIn("/versions/", script)

    def test_rail_sabotage_snapshot_remains_available_after_crisis_arbitration_release(self) -> None:
        game = game_by_slug("dark-factory-dispatch")
        snapshot_dir = ROOT / "games" / "dark-factory-dispatch" / "versions" / "0.5.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "dark-factory-dispatch.js").read_text(encoding="utf-8")

        self.assertEqual("0.5.0", game["versions"][2]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.5.0/", game["versions"][2]["path"])
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

        self.assertEqual("0.4.0", game["versions"][3]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.4.0/", game["versions"][3]["path"])
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

        self.assertEqual("0.3.0", game["versions"][4]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.3.0/", game["versions"][4]["path"])
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

        self.assertEqual("0.2.0", game["versions"][5]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.2.0/", game["versions"][5]["path"])
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

        self.assertEqual("0.1.0", game["versions"][6]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.1.0/", game["versions"][6]["path"])
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

        self.assertEqual("0.0.1", game["versions"][7]["version"])
        self.assertEqual("games/dark-factory-dispatch/versions/0.0.1/", game["versions"][7]["path"])
        self.assertIn("<title>Dark Factory Dispatch</title>", html)
        self.assertIn("v0.0.1 Dispatch Floor", game["versions"][7]["label"])
        self.assertNotIn("v0.6.0 Crisis Arbitration", script)
        self.assertNotIn("patch-audit-relay", script)
        self.assertNotIn("assignCrisisEvidence", script)
        self.assertNotIn("stageFreightCargo", script)
        self.assertNotIn("scanSabotageManifest", script)
        self.assertNotIn("/versions/", script)

    def test_asset_check_and_browser_smoke_reports_cover_factory_floor_repair(self) -> None:
        asset_report = json.loads(ASSET_REPORT_PATH.read_text(encoding="utf-8"))
        smoke_report = json.loads(SMOKE_REPORT_PATH.read_text(encoding="utf-8"))

        self.assertTrue(asset_report["ok"])
        self.assertEqual(10, asset_report["asset_count"])
        self.assertTrue(all(asset["ok"] and asset["issues"] == [] for asset in asset_report["assets"]))

        self.assertTrue(smoke_report["ok"])
        self.assertEqual("0.7.0", smoke_report["version"])
        self.assertEqual("v0.7.0 Factory Floor Repair", smoke_report["release"])
        self.assertEqual([], smoke_report["consoleErrors"])
        for check in (
            "arcadeDesktop",
            "arcadeNarrow",
            "directFreshLoad",
            "conceptHierarchy",
            "nonblankFactoryFloor",
            "runningLane",
            "postWaitTraining",
            "advancedSystemsIdleDuringTraining",
            "jamOrRecovery",
            "shiftSummary",
            "directOverflow",
            "mobileNoOverlap",
            "mobileFirstViewport",
            "mobileFirstViewportFullyVisible",
            "consoleClean",
        ):
            self.assertTrue(smoke_report["checks"][check], check)

        self.assertIn("0.7.0", smoke_report["arcade"]["desktop"]["versionText"])
        self.assertEqual("v0.7.0 Factory Floor Repair", smoke_report["arcade"]["desktop"]["releaseLabel"])
        self.assertTrue(smoke_report["arcade"]["desktop"]["hasSnapshot070"])
        self.assertTrue(smoke_report["arcade"]["desktop"]["hasSnapshot060"])
        self.assertEqual("v0.7.0 Factory Floor Repair", smoke_report["direct"]["freshLoad"]["release"])
        self.assertGreaterEqual(smoke_report["direct"]["freshLoad"]["floorViewportRatio"], 0.55)
        self.assertEqual(["scrap", "power", "stability", "circuits"], smoke_report["direct"]["freshLoad"]["visibleResources"])
        self.assertEqual("running", smoke_report["direct"]["runningLane"]["status"])
        self.assertEqual("production", smoke_report["direct"]["runningLane"]["feedback"])
        self.assertGreaterEqual(smoke_report["direct"]["postWaitTraining"]["waitMs"], 12000)
        self.assertTrue(smoke_report["direct"]["postWaitTraining"]["tutorialStillActive"])
        self.assertTrue(smoke_report["direct"]["postWaitTraining"]["trainingTimeRemainingHeld"])
        self.assertEqual("blocked", smoke_report["direct"]["postWaitTraining"]["laneStatus"])
        self.assertFalse(smoke_report["direct"]["postWaitTraining"]["laneGridLocked"])
        self.assertTrue(smoke_report["direct"]["postWaitTraining"]["recoverAvailable"])
        self.assertEqual([], smoke_report["direct"]["postWaitTraining"]["advancedLogEntries"])
        self.assertEqual("blocked", smoke_report["direct"]["jamState"]["status"])
        self.assertTrue(smoke_report["direct"]["jamState"]["recoverAvailable"])
        self.assertEqual("recovering", smoke_report["direct"]["recoveryState"]["status"])
        self.assertTrue(smoke_report["direct"]["shiftSummary"]["summaryVisible"])
        self.assertIn("Training Shift", smoke_report["direct"]["shiftSummary"]["summaryText"])
        self.assertFalse(smoke_report["direct"]["narrow"]["horizontalOverflow"])
        self.assertFalse(smoke_report["direct"]["narrow"]["objectiveFloorOverlap"])
        self.assertFalse(smoke_report["direct"]["narrow"]["floorActionsOverlap"])
        self.assertFalse(smoke_report["direct"]["narrow"]["objectiveActionsOverlap"])
        self.assertTrue(smoke_report["direct"]["narrow"]["firstViewport"]["allRequiredSurfacesVisible"])
        self.assertTrue(smoke_report["direct"]["narrow"]["firstViewport"]["allRequiredSurfacesFullyInViewport"])
        self.assertTrue(smoke_report["direct"]["narrow"]["firstViewport"]["objectiveVisible"])
        self.assertTrue(smoke_report["direct"]["narrow"]["firstViewport"]["factoryFloorVisible"])
        self.assertTrue(smoke_report["direct"]["narrow"]["firstViewport"]["contextualActionsVisible"])

        for screenshot in smoke_report["screenshots"].values():
            self.assertTrue(Path(screenshot).is_file(), screenshot)


if __name__ == "__main__":
    unittest.main()

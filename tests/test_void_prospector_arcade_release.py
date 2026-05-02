import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "void-prospector"
ASSET_REPORT_PATH = ROOT / "_visual-check" / "void-prospector-assets" / "asset-check-report.json"
SMOKE_REPORT_PATH = ROOT / "_visual-check" / "void-prospector-assets" / "release-smoke-report.json"
STATE_SCREENSHOT_KEYS = ("activeMiningBeam", "dockableStation", "postUnlockPirateWarning")


def load_manifest() -> dict:
    return json.loads((ROOT / "data" / "games.json").read_text(encoding="utf-8"))


def game_by_slug(slug: str) -> dict:
    for game in load_manifest()["games"]:
        if game.get("slug") == slug:
            return game
    raise AssertionError(f"missing manifest game {slug}")


class VoidProspectorArcadeReleaseTests(unittest.TestCase):
    def test_manifest_adds_truthful_void_prospector_flight_readability_repair_release(self) -> None:
        game = game_by_slug("void-prospector")

        self.assertEqual("Void Prospector", game["title"])
        self.assertEqual("0.7.0", game["version"])
        self.assertEqual("playable", game["status"])
        self.assertEqual("games/void-prospector/", game["path"])
        self.assertEqual("games/void-prospector/assets/arcade-title-card.png", game["thumbnail"])
        for token in (
            "readable first-contract 3D mining loop",
            "labeled Cinder Node and Frontier Spoke markers",
            "compact objective and resource HUD",
            "keyboard-driven X/Y/Z flight",
            "visible thrust, mining beam, ore sparks",
            "docking corridor",
            "Refined Beam preview",
            "post-tutorial Knife Wake pirate warnings",
            "Signal Gate systems preserved behind progressive disclosure",
        ):
            self.assertIn(token, game["summary"])

        self.assertEqual("v0.7.0 Flight Readability Repair", game["release"]["label"])
        for token in (
            "rebuilds the first Void Prospector session around the scene",
            "Cinder Node and Frontier Spoke are labeled in-world",
            "objective, resources, reticle, radar, prompts, and target card",
            "mining uses a beam, ore glow, sparks, cargo feedback",
            "docking exposes a corridor plus sale/refuel/repair summary",
            "Knife Wake pressure waits until the first contract is complete",
        ):
            self.assertIn(token, game["release"]["copy"])

        self.assertNotIn("snapshot", game)
        versions = game["versions"]
        self.assertEqual(
            ["0.7.0", "0.6.0", "0.5.0", "0.4.0", "0.3.0", "0.2.0", "0.1.0", "0.0.1"],
            [entry["version"] for entry in versions],
        )

        current_snapshot = versions[0]
        self.assertEqual("games/void-prospector/versions/0.7.0/", current_snapshot["path"])
        self.assertEqual("2026-05-02", current_snapshot["releasedAt"])
        self.assertEqual("v0.7.0 Flight Readability Repair", current_snapshot["label"])
        for token in (
            "Readable first-contract cockpit",
            "labeled Cinder Node and Frontier Spoke",
            "keyboard 3D flight with vertical trim",
            "mining beam, ore glow, sparks",
            "dockable station corridor",
            "Refined Beam preview",
            "post-contract Knife Wake warning visibility",
            "Signal Gate Expedition",
        ):
            self.assertIn(token, current_snapshot["summary"])
        self.assertNotIn("commit", current_snapshot)

        expected_history = [
            ("0.6.0", "games/void-prospector/versions/0.6.0/", "v0.6.0 Signal Gate Expedition"),
            ("0.5.0", "games/void-prospector/versions/0.5.0/", "v0.5.0 Knife Wake Interdiction"),
            ("0.4.0", "games/void-prospector/versions/0.4.0/", "v0.4.0 Storm Cartography"),
            ("0.3.0", "games/void-prospector/versions/0.3.0/", "v0.3.0 Beacon Convoy"),
            ("0.2.0", "games/void-prospector/versions/0.2.0/", "v0.2.0 Derelict Salvage"),
            ("0.1.0", "games/void-prospector/versions/0.1.0/", "v0.1.0 Survey Ladder"),
            ("0.0.1", "games/void-prospector/versions/0.0.1/", "v0.0.1 First Sortie"),
        ]
        for offset, (version, path, label) in enumerate(expected_history, start=1):
            self.assertEqual(version, versions[offset]["version"])
            self.assertEqual(path, versions[offset]["path"])
            self.assertEqual(label, versions[offset]["label"])
            self.assertTrue((ROOT / path).is_dir())

    def test_manifest_preserves_existing_games_while_listing_four_games(self) -> None:
        manifest = load_manifest()
        slugs = [game["slug"] for game in manifest["games"]]

        self.assertEqual(["corebound", "dark-factory-dispatch", "void-prospector", "iron-lantern-descent"], slugs)
        self.assertEqual("0.7.0", game_by_slug("corebound")["version"])
        self.assertEqual("0.7.0", game_by_slug("dark-factory-dispatch")["version"])
        self.assertEqual("0.7.0", game_by_slug("void-prospector")["version"])
        self.assertEqual("0.4.0", game_by_slug("iron-lantern-descent")["version"])

    def test_generated_arcade_output_lists_flight_repair_card_snapshots_and_thumbnail(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")

        self.assertIn("games <strong>4 games</strong>", html)
        for title, slug in (
            ("Corebound", "corebound"),
            ("Dark Factory Dispatch", "dark-factory-dispatch"),
            ("Void Prospector", "void-prospector"),
            ("Iron Lantern Descent", "iron-lantern-descent"),
        ):
            self.assertIn(title, html)
            self.assertIn(f'href="games/{slug}/"', html)

        self.assertIn("Void Prospector&#x27;s v0.7.0 Flight Readability Repair first-contract release", html)
        self.assertIn('src="games/void-prospector/assets/arcade-title-card.png"', html)
        self.assertIn("playable / v0.7.0", html)
        self.assertIn("v0.7.0 Flight Readability Repair", html)
        self.assertIn("readable first-contract 3D mining loop", html)
        self.assertIn("Cinder Node and Frontier Spoke", html)
        self.assertIn("mining uses a beam, ore glow, sparks", html)
        self.assertIn("Knife Wake pressure waits until the first contract is complete", html)
        self.assertIn("Snapshots", html)
        for version in ("0.7.0", "0.6.0", "0.5.0", "0.4.0", "0.3.0", "0.2.0", "0.1.0", "0.0.1"):
            self.assertIn(f'href="games/void-prospector/versions/{version}/"', html)
        self.assertIn("<span class=\"snapshot-meta\"><span>2026-05-02</span></span>", html)
        self.assertIn("v0.6.0 Signal Gate Expedition", html)
        self.assertIn("v0.5.0 Knife Wake Interdiction", html)
        self.assertIn("v0.4.0 Storm Cartography", html)
        self.assertIn("v0.3.0 Beacon Convoy", html)
        self.assertIn("v0.2.0 Derelict Salvage", html)
        self.assertIn("v0.1.0 Survey Ladder", html)
        self.assertIn("v0.0.1 First Sortie", html)
        self.assertNotIn("Commit-backed Void Prospector snapshot", html)
        self.assertNotIn('aria-label="Void Prospector snapshot continuity"', html)

    def test_snapshot_directory_preserves_playable_static_flight_readability_repair_release(self) -> None:
        snapshot_dir = GAME_DIR / "versions" / "0.7.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("void-prospector.css", html)
        self.assertIn("void-prospector.js", html)
        self.assertIn("v0.7.0 Flight Readability Repair", html)
        self.assertIn('href="../../../../favicon.png"', html)
        self.assertIn('href="../../../../">Millrace Arcade', html)
        for token in (
            "cockpit-objective-text",
            "center-reticle",
            "station-world-label",
            "target-world-label",
            "threat-world-label",
            "radar-panel",
            "station-panel",
            "station-upgrade-list",
            "survey-panel",
            "signal-list",
            "countermeasure-action",
            "motion-action",
            "data-motion=\"system\"",
        ):
            self.assertIn(token, html)
        for token in (
            "createTutorialState",
            "resolveReducedMotionPreference",
            "motionSurfaceForState",
            "stageEvidenceState",
            "surveyCockpitSurface",
            "pirateWarningFeedback",
            "createOreSparks",
            "dockingCorridor",
            "thrusterGlows",
            "brakeGlows",
            'sourceManifest: "assets/asset-manifest.json"',
            'releaseLabel: "Signal Gate Expedition"',
            "scanSignalGateHarmonics",
            "commitSignalGateTransit",
        ):
            self.assertIn(token, script)
        self.assertNotIn("/versions/", script)
        self.assertFalse((snapshot_dir / "versions").exists())
        self.assertTrue((snapshot_dir / "assets" / "arcade-title-card.png").is_file())
        self.assertTrue((snapshot_dir / "assets" / "asset-manifest.json").is_file())
        self.assertTrue((snapshot_dir / "vendor" / "three.min.js").is_file())
        self.assertNotIn("commit", game_by_slug("void-prospector")["versions"][0])

    def test_signal_gate_snapshot_remains_available_after_flight_repair_release(self) -> None:
        game = game_by_slug("void-prospector")
        snapshot_dir = GAME_DIR / "versions" / "0.6.0"
        html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
        script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

        self.assertEqual("0.6.0", game["versions"][1]["version"])
        self.assertEqual("games/void-prospector/versions/0.6.0/", game["versions"][1]["path"])
        self.assertEqual("v0.6.0 Signal Gate Expedition", game["versions"][1]["label"])
        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("v0.6.0 Signal Gate Expedition", html)
        self.assertIn('releaseLabel: "Signal Gate Expedition"', script)
        self.assertIn("gate-rift-relay-aperture", script)
        self.assertIn("scanSignalGateHarmonics", script)
        self.assertIn("commitSignalGateTransit", script)
        self.assertNotIn("v0.7.0 Flight Readability Repair", html)
        self.assertNotIn("/versions/", script)

    def test_earlier_void_prospector_snapshots_remain_available_after_flight_repair_release(self) -> None:
        game = game_by_slug("void-prospector")
        snapshot_expectations = [
            (2, "0.5.0", "v0.5.0 Knife Wake Interdiction", "cell-rift-decoy-net", "scanInterdictionTransponder", "gate-rift-relay-aperture"),
            (3, "0.4.0", "v0.4.0 Storm Cartography", "storm-rift-breaker", "scanStormChart", "cell-rift-decoy-net"),
            (4, "0.3.0", "v0.3.0 Beacon Convoy", "convoy-rift-relay", "deployRouteBeacon", "storm-rift-breaker"),
            (5, "0.2.0", "v0.2.0 Derelict Salvage", "salvage-rift-hulk", "extractSalvageTarget", "convoy-rift-relay"),
            (6, "0.1.0", "v0.1.0 Survey Ladder", "Rift Shelf", "chooseSector", "salvage-rift-hulk"),
            (7, "0.0.1", "v0.0.1 First Sortie", "First sortie", "mineTarget", "convoy-rift-relay"),
        ]

        for index, version, label, include_token, include_action, excluded_token in snapshot_expectations:
            snapshot_dir = GAME_DIR / "versions" / version
            html = (snapshot_dir / "index.html").read_text(encoding="utf-8")
            script = (snapshot_dir / "void-prospector.js").read_text(encoding="utf-8")

            self.assertEqual(version, game["versions"][index]["version"])
            self.assertEqual(f"games/void-prospector/versions/{version}/", game["versions"][index]["path"])
            self.assertEqual(label, game["versions"][index]["label"])
            self.assertIn("<title>Void Prospector</title>", html)
            self.assertIn(include_token, html + script)
            self.assertIn(include_action, script)
            self.assertNotIn(excluded_token, script)
            self.assertNotIn("v0.7.0 Flight Readability Repair", html)
            self.assertNotIn("/versions/", script)

    def test_asset_check_and_browser_smoke_reports_cover_flight_readability_repair_release(self) -> None:
        asset_report = json.loads(ASSET_REPORT_PATH.read_text(encoding="utf-8"))
        smoke_report = json.loads(SMOKE_REPORT_PATH.read_text(encoding="utf-8"))

        self.assertTrue(asset_report["ok"])
        self.assertEqual(5, asset_report["asset_count"])
        self.assertTrue(all(asset["ok"] and asset["issues"] == [] for asset in asset_report["assets"]))

        self.assertTrue(smoke_report["ok"])
        self.assertEqual([], smoke_report["consoleErrors"])
        self.assertTrue(smoke_report["checks"]["arcadeDesktop"])
        self.assertTrue(smoke_report["checks"]["arcadeNarrow"])
        self.assertTrue(smoke_report["checks"]["desktopCanvasNonblank"])
        self.assertTrue(smoke_report["checks"]["narrowCanvasNonblank"])
        self.assertTrue(smoke_report["checks"]["directOverflow"])
        self.assertTrue(smoke_report["checks"]["firstMiningDockingLoop"])
        self.assertTrue(smoke_report["checks"]["pirateWarning"])
        self.assertTrue(smoke_report["checks"]["activeMiningBeamScreenshot"])
        self.assertTrue(smoke_report["checks"]["dockableStationScreenshot"])
        self.assertTrue(smoke_report["checks"]["postUnlockPirateWarningScreenshot"])
        self.assertTrue(smoke_report["checks"]["snapshot070Playable"])
        self.assertEqual("0.7.0", smoke_report["version"])
        self.assertEqual("v0.7.0 Flight Readability Repair", smoke_report["release"])
        self.assertEqual(3, len({smoke_report["screenshots"][key] for key in STATE_SCREENSHOT_KEYS}))
        for key in STATE_SCREENSHOT_KEYS:
            screenshot_path = Path(smoke_report["screenshots"][key])
            self.assertTrue(screenshot_path.is_file(), key)
            self.assertGreater(screenshot_path.stat().st_size, 0, key)
            self.assertEqual(".png", screenshot_path.suffix)
            self.assertTrue(
                str(screenshot_path).startswith(str(ROOT / "_visual-check" / "void-prospector-assets")),
                str(screenshot_path),
            )
            self.assertEqual(str(screenshot_path), smoke_report["direct"]["visualStates"][key]["path"])
        self.assertIn("0.7.0", smoke_report["arcade"]["desktop"]["versionText"])
        self.assertIn("v0.7.0 Flight Readability Repair", smoke_report["arcade"]["desktop"]["releaseLabel"])
        self.assertTrue(smoke_report["arcade"]["desktop"]["hasSnapshot070"])
        self.assertTrue(smoke_report["arcade"]["desktop"]["hasSnapshot060"])
        loop = smoke_report["direct"]["desktop"]["firstMiningDockingLoop"]
        self.assertEqual("complete", loop["tutorialStatus"])
        self.assertEqual("complete", loop["contractStatus"])
        self.assertEqual(3, loop["deliveredOre"])
        self.assertGreater(loop["creditsAfter"], loop["creditsBefore"])
        self.assertGreater(loop["miningFeedback"]["oreParticles"], 0)
        self.assertEqual("docked", loop["dockingFeedback"]["state"])
        self.assertIn(smoke_report["direct"]["desktop"]["pirateWarning"]["stage"], ("warning", "imminent", "shadow", "contact"))
        self.assertGreater(smoke_report["direct"]["desktop"]["canvas"]["nonDark"], 0)
        self.assertGreater(smoke_report["direct"]["narrow"]["canvas"]["nonDark"], 0)

        visual_states = smoke_report["direct"]["visualStates"]
        self.assertEqual("mine-in-range", visual_states["activeMiningBeam"]["state"]["reticleState"])
        self.assertTrue(visual_states["activeMiningBeam"]["state"]["mining"]["beamActive"])
        self.assertGreater(visual_states["activeMiningBeam"]["state"]["mining"]["oreParticles"], 0)
        self.assertEqual("dockable-station", visual_states["dockableStation"]["state"]["reticleState"])
        self.assertTrue(visual_states["dockableStation"]["state"]["docking"]["dockable"])
        self.assertEqual("warning", visual_states["postUnlockPirateWarning"]["state"]["threat"]["stage"])
        self.assertTrue(visual_states["postUnlockPirateWarning"]["state"]["threat"]["visible"])


if __name__ == "__main__":
    unittest.main()

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "games.json"
INDEX_PATH = ROOT / "index.html"
GAME_DIR = ROOT / "games" / "iron-lantern-descent"
SNAPSHOT_DIR = GAME_DIR / "versions" / "0.5.0"
ECHO_SNAPSHOT_DIR = GAME_DIR / "versions" / "0.4.0"
CINDER_SNAPSHOT_DIR = GAME_DIR / "versions" / "0.3.0"
DEEP_PUMPWORKS_SNAPSHOT_DIR = GAME_DIR / "versions" / "0.2.0"
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
        self.assertEqual("0.5.0", game["version"])
        self.assertEqual("games/iron-lantern-descent/", game["path"])
        self.assertEqual("games/iron-lantern-descent/assets/arcade-title-card.png", game["thumbnail"])
        self.assertEqual("v0.5.0 Cave Readability Repair", game["release"]["label"])
        self.assertIn("lantern-lit descent board", game["release"]["copy"])
        self.assertIn("compact oxygen, light, sample, and route HUD", game["release"]["copy"])
        self.assertIn("Copper Iris guidance", game["release"]["copy"])
        self.assertIn("hidden advanced ledgers", game["release"]["copy"])
        self.assertIn("Echo Relay Network intact", game["release"]["copy"])
        self.assertNotIn("snapshot", game)

        self.assertEqual("0.5.0", version["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.5.0/", version["path"])
        self.assertEqual("2026-05-02", version["releasedAt"])
        self.assertEqual(game["release"]["label"], version["label"])
        self.assertIn("Copper Iris first-expedition onboarding", version["summary"])
        self.assertIn("hidden advanced ledgers", version["summary"])
        self.assertIn("pause/help controls", version["summary"])
        self.assertIn("reduced-motion handling", version["summary"])
        self.assertIn("restart confirmation", version["summary"])
        self.assertNotIn("commit", version)
        self.assertTrue((ROOT / version["path"]).is_dir())

        self.assertEqual("0.4.0", game["versions"][1]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.4.0/", game["versions"][1]["path"])
        self.assertEqual("v0.4.0 Echo Relay Network", game["versions"][1]["label"])
        self.assertTrue((ROOT / game["versions"][1]["path"]).is_dir())

        self.assertEqual("0.3.0", game["versions"][2]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.3.0/", game["versions"][2]["path"])
        self.assertEqual("v0.3.0 Cinder Vent Network", game["versions"][2]["label"])
        self.assertTrue((ROOT / game["versions"][2]["path"]).is_dir())

        self.assertEqual("0.2.0", game["versions"][3]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.2.0/", game["versions"][3]["path"])
        self.assertEqual("v0.2.0 Deep Pumpworks", game["versions"][3]["label"])
        self.assertTrue((ROOT / game["versions"][3]["path"]).is_dir())

        self.assertEqual("0.1.0", game["versions"][4]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.1.0/", game["versions"][4]["path"])
        self.assertEqual("v0.1.0 Faultline Survey", game["versions"][4]["label"])
        self.assertTrue((ROOT / game["versions"][4]["path"]).is_dir())

        self.assertEqual("0.0.1", game["versions"][5]["version"])
        self.assertEqual("games/iron-lantern-descent/versions/0.0.1/", game["versions"][5]["path"])
        self.assertEqual("v0.0.1 Lantern Route", game["versions"][5]["label"])
        self.assertTrue((ROOT / game["versions"][5]["path"]).is_dir())

    def test_cave_readability_snapshot_is_playable_static_copy_without_nested_version_history(self) -> None:
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
        echo_html = (ECHO_SNAPSHOT_DIR / "index.html").read_text(encoding="utf-8")
        echo_script = (ECHO_SNAPSHOT_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        cinder_html = (CINDER_SNAPSHOT_DIR / "index.html").read_text(encoding="utf-8")
        cinder_script = (CINDER_SNAPSHOT_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        pumpworks_html = (DEEP_PUMPWORKS_SNAPSHOT_DIR / "index.html").read_text(encoding="utf-8")
        pumpworks_script = (DEEP_PUMPWORKS_SNAPSHOT_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        faultline_html = (FAULTLINE_SNAPSHOT_DIR / "index.html").read_text(encoding="utf-8")
        faultline_script = (FAULTLINE_SNAPSHOT_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        baseline_html = (BASELINE_SNAPSHOT_DIR / "index.html").read_text(encoding="utf-8")
        baseline_script = (BASELINE_SNAPSHOT_DIR / "iron-lantern-descent.js").read_text(encoding="utf-8")
        self.assertIn("<title>Iron Lantern Descent</title>", snapshot_html)
        self.assertIn('src="vendor/three.min.js"', snapshot_html)
        self.assertIn('lanternAnchor: "assets/lantern-anchor.png"', snapshot_script)
        self.assertIn("v0.5.0 cave readability repair", live_html)
        self.assertIn("v0.5.0 cave readability repair", snapshot_html)
        self.assertIn("v0.4.0 echo relay network", echo_html)
        self.assertNotIn("v0.5.0 cave readability repair", echo_html)
        self.assertIn("lower-pumpworks", snapshot_script)
        self.assertIn("Cinder Sump Pump", snapshot_script)
        self.assertIn("cinder-vent-shaft", snapshot_script)
        self.assertIn("fan-relay-bay", snapshot_script)
        self.assertIn("echo-relay-alcove", snapshot_script)
        self.assertIn("lift-beacon-station", snapshot_script)
        self.assertIn("openDraftGate", snapshot_script)
        self.assertIn("deployFilterCartridge", snapshot_script)
        self.assertIn("startPressureFan", snapshot_script)
        self.assertIn("ventGasPocket", snapshot_script)
        self.assertIn("repairRelayPylon", snapshot_script)
        self.assertIn("spoolRelayCable", snapshot_script)
        self.assertIn("triangulateEchoRoute", snapshot_script)
        self.assertIn("claimRescueCache", snapshot_script)
        self.assertIn("fireLiftBeacon", snapshot_script)
        self.assertIn("vent-readout", snapshot_html)
        self.assertIn("Cinder Vents", snapshot_html)
        self.assertIn("relay-readout", snapshot_html)
        self.assertIn("Echo Relays", snapshot_html)
        self.assertIn("relay-site-list", snapshot_html)
        self.assertIn("beacon-action", snapshot_html)
        self.assertIn("v0.4.0 Echo Relay Network", echo_script)
        self.assertNotIn("v0.5.0 Cave Readability Repair", echo_script)
        self.assertIn("v0.3.0 cinder vent network", cinder_html)
        self.assertIn("v0.3.0 Cinder Vent Network", cinder_script)
        self.assertNotIn("v0.4.0 Echo Relay Network", cinder_script)
        self.assertNotIn("relay-site-list", cinder_html)
        self.assertIn("v0.2.0 deep pumpworks", pumpworks_html)
        self.assertIn("v0.2.0 Deep Pumpworks", pumpworks_script)
        self.assertNotIn("vent-readout", pumpworks_html)
        self.assertNotIn("Cinder Vent Network", pumpworks_script)
        self.assertIn("v0.1.0 faultline survey", faultline_html)
        self.assertIn("v0.0.1 survival loop", baseline_html)
        self.assertIn("survey-readout", live_html)
        self.assertIn("survey-readout", snapshot_html)
        self.assertIn("pumpworks-readout", snapshot_html)
        self.assertNotIn("pumpworks-readout", faultline_html)
        self.assertNotIn("survey-readout", baseline_html)
        self.assertIn("v0.5.0 Cave Readability Repair", live_script)
        self.assertIn("v0.5.0 Cave Readability Repair", snapshot_script)
        self.assertIn("v0.4.0 Echo Relay Network", live_script)
        self.assertIn("v0.4.0 Echo Relay Network", snapshot_script)
        self.assertIn("stageEvidenceState", snapshot_script)
        self.assertIn("pause-help-overlay", snapshot_html)
        self.assertIn("reduced-motion-toggle", snapshot_html)
        self.assertIn("restart-confirmation", snapshot_html)
        self.assertIn("requestRestartConfirmation", snapshot_script)
        self.assertIn("resolveReducedMotionPreference", snapshot_script)
        self.assertIn("v0.3.0 Cinder Vent Network", live_script)
        self.assertIn("v0.3.0 Cinder Vent Network", snapshot_script)
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
        self.assertIn('href="games/iron-lantern-descent/versions/0.5.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.4.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.3.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.2.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.1.0/"', html)
        self.assertIn('href="games/iron-lantern-descent/versions/0.0.1/"', html)
        self.assertIn('aria-label="Iron Lantern Descent snapshots"', html)
        self.assertIn("v0.5.0 Cave Readability Repair", html)
        self.assertIn("v0.4.0 Echo Relay Network", html)
        self.assertIn("v0.3.0 Cinder Vent Network", html)
        self.assertIn("v0.2.0 Deep Pumpworks", html)
        self.assertIn("v0.1.0 Faultline Survey", html)
        self.assertIn("v0.0.1 Lantern Route", html)
        self.assertNotIn("Snapshot deferred", html)

    def test_asset_check_report_remains_ok_for_release_pack(self) -> None:
        report = json.loads(ASSET_REPORT_PATH.read_text(encoding="utf-8"))

        self.assertTrue(report["ok"])
        self.assertEqual(5, report["asset_count"])
        self.assertTrue(all(asset["ok"] and asset["issues"] == [] for asset in report["assets"]))

    def test_release_smoke_report_covers_repaired_onboarding_and_readability_path(self) -> None:
        report = json.loads(SMOKE_REPORT_PATH.read_text(encoding="utf-8"))

        self.assertTrue(report["ok"])
        self.assertEqual([], report["consoleErrors"])
        self.assertTrue(report["checks"]["arcadeDesktop"])
        self.assertTrue(report["checks"]["arcadeNarrow"])
        self.assertTrue(report["checks"]["startLayout"])
        self.assertTrue(report["checks"]["narrowStartLayout"])
        self.assertTrue(report["checks"]["selectionSurface"])
        self.assertTrue(report["checks"]["freshLiftScene"])
        self.assertTrue(report["checks"]["pauseHelpOverlay"])
        self.assertTrue(report["checks"]["reducedMotion"])
        self.assertTrue(report["checks"]["restartConfirmation"])
        self.assertTrue(report["checks"]["desktopActiveNoScroll"])
        self.assertTrue(report["checks"]["narrowActiveNoScroll"])
        self.assertTrue(report["checks"]["narrowStartToActive"])
        self.assertTrue(report["checks"]["lanternPlacement"])
        self.assertTrue(report["checks"]["mining"])
        self.assertTrue(report["checks"]["returnBanking"])
        self.assertTrue(report["checks"]["advancedLedger"])
        self.assertTrue(report["checks"]["desktopCanvasNonblank"])
        self.assertTrue(report["checks"]["narrowCanvasNonblank"])
        self.assertTrue(report["checks"]["snapshot050Playable"])
        self.assertTrue(report["checks"]["directOverflow"])
        self.assertIn("0.5.0", report["arcade"]["desktop"]["versionText"])
        self.assertEqual("v0.5.0 cave readability repair", report["direct"]["freshLiftScene"]["eyebrow"])
        self.assertIn("v0.5.0 Cave Readability Repair", report["arcade"]["desktop"]["releaseLabel"])
        self.assertTrue(report["arcade"]["desktop"]["hasSnapshot050"])
        self.assertTrue(report["arcade"]["desktop"]["hasSnapshot040"])
        self.assertTrue(report["arcade"]["desktop"]["hasSnapshot030"])
        self.assertTrue(report["arcade"]["desktop"]["hasSnapshot020"])
        self.assertEqual(
            [
                "left-depth-cards",
                "center-cavern-lantern",
                "right-selected-depth",
                "bottom-character-loadout",
            ],
            report["direct"]["startLayout"]["regions"],
        )
        self.assertGreaterEqual(report["direct"]["startLayout"]["rewardCards"], 2)
        self.assertGreaterEqual(report["direct"]["startLayout"]["loadoutCards"], 2)
        self.assertGreaterEqual(report["direct"]["startLayout"]["consumableCards"], 2)
        self.assertTrue(report["direct"]["startLayout"]["beginVisible"])
        narrow_start = report["direct"]["narrowStartLayout"]
        self.assertEqual("expedition-start", narrow_start["surface"])
        self.assertEqual({"width": 390, "height": 844}, narrow_start["viewport"])
        self.assertEqual(report["direct"]["startLayout"]["regions"], narrow_start["regions"])
        self.assertEqual("Upper Cut", narrow_start["selectedDepth"])
        self.assertTrue(narrow_start["beginVisible"])
        self.assertTrue(narrow_start["beginReachableByTouch"])
        self.assertTrue(narrow_start["detailUsable"])
        self.assertTrue(narrow_start["summaryUsable"])
        self.assertGreaterEqual(narrow_start["measurements"]["detail"]["height"], 180)
        self.assertGreaterEqual(narrow_start["measurements"]["summary"]["height"], 112)
        self.assertLessEqual(narrow_start["measurements"]["begin"]["bottom"], narrow_start["viewport"]["height"])
        self.assertGreaterEqual(narrow_start["measurements"]["begin"]["visibleHeight"], 44)
        self.assertEqual("auto", narrow_start["intentionalOverflow"]["detailPanel"]["overflowY"])
        self.assertTrue(narrow_start["intentionalOverflow"]["detailPanel"]["scrollableY"])
        self.assertEqual("hidden", narrow_start["intentionalOverflow"]["startSurface"]["overflowY"])
        self.assertFalse(narrow_start["intentionalOverflow"]["pageOverflow"]["overflowingX"])
        self.assertFalse(narrow_start["intentionalOverflow"]["pageOverflow"]["overflowingY"])
        self.assertEqual(2, narrow_start["detailContent"]["rewardCards"])
        self.assertEqual(2, narrow_start["detailContent"]["loadoutCards"])
        self.assertEqual(2, narrow_start["detailContent"]["consumableCards"])
        self.assertIn("Copper Iris", narrow_start["detailContent"]["route"])
        self.assertEqual(
            [
                "Mara Venn",
                "Lantern Initiate",
                "3 lanterns / drill / oxygen 96",
                "32cr and tank weave preview",
            ],
            narrow_start["summaryContent"],
        )
        self.assertIn("Copper Iris", report["direct"]["selectionSurface"]["route"])
        self.assertIn("Move Toward Copper Iris", report["direct"]["freshLiftScene"]["contextAction"])
        self.assertLessEqual(report["direct"]["freshLiftScene"]["hudCardCount"], 6)
        self.assertLessEqual(report["direct"]["freshLiftScene"]["controlHintCount"], 4)
        self.assertTrue(report["direct"]["pauseHelpOverlay"]["visible"])
        self.assertFalse(report["direct"]["pauseHelpOverlay"]["advancedLedgerVisible"])
        self.assertIn("Move Toward Copper Iris", report["direct"]["pauseHelpOverlay"]["contextAction"])
        self.assertIn("Esc pause", report["direct"]["pauseHelpOverlay"]["controlHints"])
        self.assertEqual("reduced", report["direct"]["reducedMotion"]["rootMotion"])
        self.assertEqual("true", report["direct"]["reducedMotion"]["dataReducedMotion"])
        self.assertEqual("true", report["direct"]["reducedMotion"]["togglePressed"])
        self.assertLess(
            report["direct"]["reducedMotion"]["motionSettings"]["reduced"]["scannerExpandRate"],
            report["direct"]["reducedMotion"]["motionSettings"]["full"]["scannerExpandRate"],
        )
        self.assertTrue(report["direct"]["restartConfirmation"]["visible"])
        self.assertEqual("open", report["direct"]["restartConfirmation"]["state"])
        self.assertTrue(report["direct"]["restartInteraction"]["keyROpensConfirmation"])
        self.assertTrue(report["direct"]["restartInteraction"]["cancelPreservesRunStatus"])
        self.assertTrue(report["direct"]["restartInteraction"]["confirmResetsRun"])
        self.assertFalse(report["direct"]["desktopActiveNoScroll"]["overflow"]["overflowingX"])
        self.assertFalse(report["direct"]["desktopActiveNoScroll"]["overflow"]["overflowingY"])
        self.assertFalse(report["direct"]["narrowActiveNoScroll"]["overflow"]["overflowingX"])
        self.assertFalse(report["direct"]["narrowActiveNoScroll"]["overflow"]["overflowingY"])
        narrow_start_to_active = report["direct"]["narrowStartToActive"]
        self.assertEqual("visible Begin Descent click at 390x844", narrow_start_to_active["trigger"])
        self.assertEqual("descent", narrow_start_to_active["surface"])
        self.assertTrue(narrow_start_to_active["startHidden"])
        self.assertIn("Copper Iris", narrow_start_to_active["objective"])
        self.assertIn("Move Toward Copper Iris", narrow_start_to_active["contextAction"])
        self.assertTrue(narrow_start_to_active["advancedLedgerHidden"])
        self.assertFalse(narrow_start_to_active["advancedLedgerVisible"])
        self.assertLessEqual(narrow_start_to_active["hudCardCount"], 6)
        self.assertLessEqual(narrow_start_to_active["controlHintCount"], 4)
        self.assertGreater(narrow_start_to_active["canvas"]["nonDark"], 0)
        self.assertFalse(narrow_start_to_active["overflow"]["overflowingX"])
        self.assertFalse(narrow_start_to_active["overflow"]["overflowingY"])
        self.assertEqual(1, report["direct"]["visualStates"]["lanternPlacement"]["state"]["lanterns"]["anchors"])
        self.assertGreater(report["direct"]["visualStates"]["mining"]["state"]["cargo"]["samples"], 0)
        self.assertIn("Copper Iris", report["direct"]["visualStates"]["mining"]["feedbackAction"])
        self.assertEqual("extracted", report["direct"]["visualStates"]["returnBanking"]["runStatus"])
        self.assertEqual("summary-upgrade-preview", report["direct"]["visualStates"]["returnBanking"]["state"]["phase"])
        self.assertTrue(report["direct"]["advancedLedger"]["visible"])
        self.assertGreater(report["direct"]["freshLiftScene"]["canvas"]["nonDark"], 0)
        self.assertGreater(report["direct"]["narrow"]["canvas"]["nonDark"], 0)
        self.assertTrue(report["direct"]["snapshot050"]["hasPauseHelp"])
        self.assertTrue(report["direct"]["snapshot050"]["hasReducedMotionToggle"])
        self.assertTrue(report["direct"]["snapshot050"]["hasRestartConfirmation"])

        for key in (
            "startLayout",
            "selectionSurface",
            "freshLiftScene",
            "pauseHelpOverlay",
            "reducedMotion",
            "restartConfirmation",
            "desktopActiveNoScroll",
            "narrowStartLayout",
            "lanternPlacement",
            "mining",
            "returnBanking",
            "advancedLedger",
            "narrowActiveNoScroll",
            "narrowStartToActive",
            "narrowSmoke",
            "snapshot050",
        ):
            screenshot = Path(report["screenshots"][key])
            self.assertTrue(screenshot.is_file(), key)
            self.assertGreater(screenshot.stat().st_size, 0, key)
            self.assertEqual(".png", screenshot.suffix, key)
            self.assertTrue(
                str(screenshot).startswith(str(ROOT / "_visual-check" / "iron-lantern-descent-assets")),
                str(screenshot),
            )


if __name__ == "__main__":
    unittest.main()

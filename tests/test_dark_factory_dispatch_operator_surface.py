import json
import re
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "dark-factory-dispatch"
MANIFEST_PATH = GAME_DIR / "assets" / "asset-manifest.json"


def source_text(filename: str) -> str:
    return (GAME_DIR / filename).read_text(encoding="utf-8")


class DarkFactoryDispatchOperatorSurfaceTests(unittest.TestCase):
    def test_escalation_surface_hooks_and_operator_controls_are_present(self) -> None:
        html = source_text("index.html")
        css = source_text("dark-factory-dispatch.css")
        js = source_text("dark-factory-dispatch.js")

        for token in (
            'id="escalation-surface"',
            'id="queue-policy-select"',
            "Queue policy",
            "Production floor",
            "Queued jobs",
            "Dispatch board",
            "Improvement rack",
            "Operator log",
        ):
            self.assertIn(token, html)

        for token in (
            "campaignSurfaceState",
            "renderEscalationSurface",
            'data-surface="campaign"',
            'data-surface="emergency"',
            'data-surface="progression"',
            'data-surface="choices"',
            'data-action="overdrive"',
            "setQueuePolicy(currentState",
            "toggleLaneOverdrive(",
        ):
            self.assertIn(token, js)

        for token in (
            ".escalation-strip",
            ".escalation-card",
            '.lane-card[data-overdrive="true"]',
            '.contract-card[data-emergency="true"]',
            '.queue-item[data-emergency="true"]',
            "@media (max-width: 720px)",
            "overflow-wrap: anywhere",
        ):
            self.assertIn(token, css)

    def test_campaign_surface_model_exposes_pressure_progression_and_choices(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            const first = game.createInitialState({ seed: 91, faultsEnabled: false });
            const firstSurface = game.campaignSurfaceState(first);

            let second = game.resetFactoryState(first);
            second.faults.enabled = false;
            const pendingSurface = game.campaignSurfaceState(second);
            second = game.stepFactory(second, 6);
            second = game.setQueuePolicy(second, "emergency-first");
            second = game.toggleLaneOverdrive(second, "forge-line", true);
            const activeSurface = game.campaignSurfaceState(second);

            console.log(JSON.stringify({ firstSurface, pendingSurface, activeSurface }));
            """
        )

        first = result["firstSurface"]
        pending = result["pendingSurface"]
        active = result["activeSurface"]

        self.assertEqual("v0.1.0 Escalation Shift", first["release"])
        self.assertEqual(1, first["shift"])
        self.assertEqual("quiet", first["emergency"]["status"])
        self.assertIn("shift 02", first["emergency"]["detail"])
        self.assertEqual(0, first["progression"]["ledgerCount"])

        self.assertEqual(2, pending["shift"])
        self.assertEqual("pending", pending["emergency"]["status"])
        self.assertIn("arms t6", pending["emergency"]["detail"])
        self.assertEqual(1, pending["progression"]["ledgerCount"])
        self.assertIn("shift 01", pending["progression"]["latest"])

        self.assertEqual("Emergency First", active["queuePolicy"]["name"])
        self.assertEqual("active", active["emergency"]["status"])
        self.assertEqual(1, active["choices"]["queuePolicyChanges"])
        self.assertEqual(1, active["choices"]["laneOverdrives"])
        self.assertEqual(1, active["choices"]["activeOverdrives"])

    def test_escalation_surface_does_not_add_stale_raster_asset_references(self) -> None:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        manifest_paths = {
            asset["path"].removeprefix("games/dark-factory-dispatch/")
            for asset in manifest["assets"]
        }
        combined = "\n".join(
            source_text(filename)
            for filename in (
                "index.html",
                "dark-factory-dispatch.css",
                "dark-factory-dispatch.js",
            )
        )

        for reference in re.findall(r'assets/[^"\'\)\s]+\.png', combined):
            self.assertIn(reference, manifest_paths, reference)

        self.assertNotIn("job-stabilize-grid.png", combined)
        self.assertNotIn('"stabilize-grid": "assets/', combined)

    def run_node(self, script: str) -> dict:
        completed = subprocess.run(
            ["node", "-e", textwrap.dedent(script)],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(completed.stdout)


if __name__ == "__main__":
    unittest.main()

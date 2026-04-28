import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "dark-factory-dispatch"
MANIFEST_PATH = GAME_DIR / "assets" / "asset-manifest.json"


def source_text(filename: str) -> str:
    return (GAME_DIR / filename).read_text(encoding="utf-8")


def manifest_short_paths() -> set[str]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {
        asset["path"].removeprefix("games/dark-factory-dispatch/")
        for asset in manifest["assets"]
    }


class DarkFactoryDispatchAssetIntegrationTests(unittest.TestCase):
    def test_static_asset_references_are_project_local_manifest_assets(self) -> None:
        paths = manifest_short_paths()
        files = {
            "index.html": source_text("index.html"),
            "dark-factory-dispatch.css": source_text("dark-factory-dispatch.css"),
            "dark-factory-dispatch.js": source_text("dark-factory-dispatch.js"),
        }

        for filename, text in files.items():
            for reference in re.findall(r'assets/[^"\'\)\s]+\.png', text):
                self.assertIn(reference, paths, f"{filename} references {reference}")
                self.assertNotIn("://", reference)
                self.assertFalse(Path(reference).is_absolute())

        self.assertIn('src="assets/arcade-title-card.png"', files["index.html"])
        self.assertIn('sourceManifest: "assets/asset-manifest.json"', files["dark-factory-dispatch.js"])

    def test_lane_job_and_fault_renderers_use_generated_icon_paths(self) -> None:
        script = source_text("dark-factory-dispatch.js")
        css = source_text("dark-factory-dispatch.css")

        for token in (
            "ASSET_PATHS",
            "iconMarkup",
            '"forge-line": "assets/lane-forge-line.png"',
            '"assembler-bay": "assets/lane-assembler-bay.png"',
            '"clean-room": "assets/lane-clean-room.png"',
            '"smelt-circuits": "assets/job-smelt-circuits.png"',
            '"print-modules": "assets/job-print-modules.png"',
            '"assemble-drones": "assets/job-assemble-drones.png"',
            '"weave-defenses": "assets/job-weave-defenses.png"',
            '"material-jam": "assets/fault-material-jam.png"',
            '"logic-drift": "assets/fault-logic-drift.png"',
            "fault-readout",
        ):
            self.assertIn(token, script)

        for token in (
            ".title-card-band",
            ".asset-icon",
            ".lane-icon",
            ".fault-icon",
            '.fault-readout[data-active="true"]',
        ):
            self.assertIn(token, css)


if __name__ == "__main__":
    unittest.main()

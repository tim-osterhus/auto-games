import json
import re
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "void-prospector"
MANIFEST_PATH = GAME_DIR / "assets" / "asset-manifest.json"


def source_text(filename: str) -> str:
    return (GAME_DIR / filename).read_text(encoding="utf-8")


def manifest_short_paths() -> set[str]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {
        asset["path"].removeprefix("games/void-prospector/")
        for asset in manifest["assets"]
    }


class VoidProspectorAssetIntegrationTests(unittest.TestCase):
    def test_static_asset_references_are_project_local_manifest_assets(self) -> None:
        paths = manifest_short_paths()
        files = {
            "index.html": source_text("index.html"),
            "void-prospector.css": source_text("void-prospector.css"),
            "void-prospector.js": source_text("void-prospector.js"),
        }

        for filename, text in files.items():
            for reference in re.findall(r'assets/[^"\'\)\s]+\.png', text):
                self.assertIn(reference, paths, f"{filename} references {reference}")
                self.assertNotIn("://", reference)
                self.assertFalse(Path(reference).is_absolute())

        self.assertIn('src="assets/arcade-title-card.png"', files["index.html"])
        self.assertIn('sourceManifest: "assets/asset-manifest.json"', files["void-prospector.js"])

    def test_scene_asset_loader_uses_generated_texture_paths(self) -> None:
        script = source_text("void-prospector.js")
        css = source_text("void-prospector.css")

        for token in (
            "ASSET_PATHS",
            "loadSceneAssets",
            "TextureLoader",
            'shipDecal: "assets/ship-decal.png"',
            'asteroidOreGlow: "assets/asteroid-ore-glow.png"',
            'stationDockPanel: "assets/station-dock-panel.png"',
            'pirateMarker: "assets/pirate-marker.png"',
            'arcadeTitleCard: "assets/arcade-title-card.png"',
            "sceneAssets",
            "emissiveMap: assets.asteroidOreGlow",
            "map: assets.stationDockPanel",
            "map: assets.pirateMarker",
        ):
            self.assertIn(token, script)

        for token in (".title-card-band", "object-fit: cover"):
            self.assertIn(token, css)

    def test_game_data_exposes_asset_manifest_paths_for_state_checks(self) -> None:
        result = subprocess.run(
            [
                "node",
                "-e",
                textwrap.dedent(
                    """
                    const game = require("./games/void-prospector/void-prospector.js");
                    console.log(JSON.stringify(game.GAME_DATA.assets));
                    """
                ),
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        assets = json.loads(result.stdout)

        self.assertEqual("assets/asset-manifest.json", assets["sourceManifest"])
        self.assertEqual("assets/ship-decal.png", assets["shipDecal"])
        self.assertEqual("assets/asteroid-ore-glow.png", assets["asteroidOreGlow"])
        self.assertEqual("assets/station-dock-panel.png", assets["stationDockPanel"])
        self.assertEqual("assets/pirate-marker.png", assets["pirateMarker"])
        self.assertEqual("assets/arcade-title-card.png", assets["arcadeTitleCard"])


if __name__ == "__main__":
    unittest.main()

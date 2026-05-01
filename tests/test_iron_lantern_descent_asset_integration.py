import json
import re
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "iron-lantern-descent"
MANIFEST_PATH = GAME_DIR / "assets" / "asset-manifest.json"


def source_text(filename: str) -> str:
    return (GAME_DIR / filename).read_text(encoding="utf-8")


def manifest_short_paths() -> set[str]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {
        asset["path"].removeprefix("games/iron-lantern-descent/")
        for asset in manifest["assets"]
    }


class IronLanternDescentAssetIntegrationTests(unittest.TestCase):
    def test_static_asset_references_are_project_local_manifest_assets(self) -> None:
        paths = manifest_short_paths()
        files = {
            "index.html": source_text("index.html"),
            "iron-lantern-descent.css": source_text("iron-lantern-descent.css"),
            "iron-lantern-descent.js": source_text("iron-lantern-descent.js"),
        }

        for filename, text in files.items():
            for reference in re.findall(r'assets/[^"\'\)\s]+\.png', text):
                self.assertIn(reference, paths, f"{filename} references {reference}")
                self.assertNotIn("://", reference)
                self.assertFalse(Path(reference).is_absolute())

        self.assertIn('src="assets/arcade-title-card.png"', files["index.html"])
        self.assertIn('background-image: url("assets/oxygen-light-icons.png")', files["iron-lantern-descent.css"])
        self.assertIn('sourceManifest: "assets/asset-manifest.json"', files["iron-lantern-descent.js"])

    def test_scene_asset_loader_uses_generated_texture_paths(self) -> None:
        script = source_text("iron-lantern-descent.js")
        css = source_text("iron-lantern-descent.css")

        for token in (
            "ASSET_PATHS",
            "loadSceneAssets",
            "TextureLoader",
            'lanternAnchor: "assets/lantern-anchor.png"',
            'mineralVeinMaterial: "assets/mineral-vein-material.png"',
            'drillTool: "assets/drill-tool.png"',
            'oxygenLightIcons: "assets/oxygen-light-icons.png"',
            'arcadeTitleCard: "assets/arcade-title-card.png"',
            "map: assets.mineralVeinMaterial",
            "emissiveMap: assets.mineralVeinMaterial",
            "map: assets.lanternAnchor",
            "map: assets.drillTool",
            "sceneAssets",
        ):
            self.assertIn(token, script)

        for token in (".title-card-band", ".readout-icon", "object-fit: cover"):
            self.assertIn(token, css)

    def test_game_data_exposes_asset_manifest_paths_for_state_checks(self) -> None:
        assets = json.loads(self.run_node("game.GAME_DATA.assets"))

        self.assertEqual("assets/asset-manifest.json", assets["sourceManifest"])
        self.assertEqual("assets/lantern-anchor.png", assets["lanternAnchor"])
        self.assertEqual("assets/mineral-vein-material.png", assets["mineralVeinMaterial"])
        self.assertEqual("assets/drill-tool.png", assets["drillTool"])
        self.assertEqual("assets/oxygen-light-icons.png", assets["oxygenLightIcons"])
        self.assertEqual("assets/arcade-title-card.png", assets["arcadeTitleCard"])

    def test_faultline_survey_visuals_are_procedural_without_stale_raster_claims(self) -> None:
        script = source_text("iron-lantern-descent.js")
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        manifest_paths = {asset["path"].removeprefix("games/iron-lantern-descent/") for asset in manifest["assets"]}

        for token in (
            "createSurveySiteMesh",
            "updateSurveyMeshes",
            "surveyMeshes",
            "createPumpworksSiteMesh",
            "updatePumpworksMeshes",
            "pumpworksMeshes",
            "createVentSiteMesh",
            "updateVentMeshes",
            "ventMeshes",
            "createRelaySiteMesh",
            "updateRelayMeshes",
            "relayMeshes",
            "new THREE.BufferGeometry().setFromPoints",
            "new THREE.TorusGeometry",
            "userData.role = \"fault-seam\"",
            "userData.role = \"brace-frame\"",
            "userData.role = \"air-cache\"",
            "userData.role = \"map-plate\"",
            "userData.role = \"pump-housing\"",
            "userData.role = \"valve-wheel\"",
            "userData.role = \"flood-plane\"",
            "userData.role = \"leak-seam\"",
            "userData.role = \"siphon-canister\"",
            "userData.role = \"pressure-gauge\"",
            "userData.role = \"drainage-route-overlay\"",
            "userData.role = \"vent-shaft\"",
            "userData.role = \"draft-gate-wheel\"",
            "userData.role = \"fan-housing\"",
            "userData.role = \"filter-rack\"",
            "userData.role = \"gas-haze-volume\"",
            "userData.role = \"fresh-air-relay-marker\"",
            "userData.role = \"airflow-overlay\"",
            "userData.role = \"relay-pylon\"",
            "userData.role = \"signal-cable-line\"",
            "userData.role = \"echo-pulse-marker\"",
            "userData.role = \"rescue-cache-locker\"",
            "userData.role = \"emergency-beacon-hardware\"",
            "userData.role = \"cable-break-sparks\"",
            "userData.role = \"route-signal-overlay\"",
        ):
            self.assertIn(token, script)

        self.assertEqual(
            {
                "assets/lantern-anchor.png",
                "assets/mineral-vein-material.png",
                "assets/drill-tool.png",
                "assets/oxygen-light-icons.png",
                "assets/arcade-title-card.png",
            },
            manifest_paths,
        )
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*fault[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*survey[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*brace[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*cache[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*map[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*pump[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*valve[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*flood[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*leak[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*siphon[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*gauge[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*vent[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*draft[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*fan[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*filter[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*gas[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*airflow[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*relay[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*pylon[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*cable[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*echo[^"\'\)\s]*\.png')
        self.assertNotRegex(script, r'assets/[^"\'\)\s]*beacon[^"\'\)\s]*\.png')

    def run_node(self, expression: str) -> str:
        result = subprocess.run(
            [
                "node",
                "-e",
                textwrap.dedent(
                    f"""
                    const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
                    console.log(JSON.stringify({expression}));
                    """
                ),
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout


if __name__ == "__main__":
    unittest.main()

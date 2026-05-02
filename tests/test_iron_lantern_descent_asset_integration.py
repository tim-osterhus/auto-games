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


def extract_css_block(css: str, anchor: str) -> str:
    start = css.index(anchor)
    brace_start = css.index("{", start)
    depth = 0
    for index in range(brace_start, len(css)):
        if css[index] == "{":
            depth += 1
        elif css[index] == "}":
            depth -= 1
            if depth == 0:
                return css[start:index + 1]
    raise AssertionError(f"CSS block for {anchor} was not closed")


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

    def test_expedition_start_surface_reuses_local_title_asset_without_dense_play_hud(self) -> None:
        html = source_text("index.html")
        css = source_text("iron-lantern-descent.css")
        script = source_text("iron-lantern-descent.js")
        start_surface = html.split('id="expedition-start"', 1)[1].split("</section>", 1)[0]

        for token in (
            'class="expedition-start"',
            'aria-label="Expedition start"',
            'data-start-region="left-depth-cards"',
            'data-start-region="center-cavern-lantern"',
            'data-start-region="right-selected-depth"',
            'data-start-region="bottom-character-loadout"',
            'class="start-art"',
            'class="hanging-lantern"',
            'src="assets/arcade-title-card.png"',
            'id="depth-selector"',
            'class="depth-choice"',
            'id="start-depth-name"',
            'id="start-depth-description"',
            'id="start-readiness"',
            'id="start-reward"',
            'id="start-route"',
            'id="start-reward-cards"',
            'id="start-loadout-cards"',
            'id="start-consumable-cards"',
            'id="start-character"',
            'id="start-rank"',
            'id="start-summary-loadout"',
            'id="start-summary-reward"',
            'id="begin-descent-action"',
            "Begin Descent",
        ):
            self.assertIn(token, html)

        for dense_token in (
            "pumpworks-readout",
            "vent-readout",
            "relay-readout",
            "rescue-readout",
            "event-log",
        ):
            self.assertNotIn(dense_token, start_surface)

        for token in (
            ".expedition-start",
            ".start-cavern-hero",
            ".start-art img",
            ".start-frame",
            ".start-detail-panel",
            ".start-bottom-summary",
            ".start-item-card[data-card=\"reward\"]",
            ".depth-choice[data-selected=\"true\"]",
            ".begin-descent-action",
            ".world-label-layer",
            ".feedback-rail",
        ):
            self.assertIn(token, css)

        for token in (
            "expeditionStart",
            "depthChoices",
            "renderStartDepth",
            "renderStartCardList",
            "startSurfaceOpen",
            "beginDescent",
            "Begin descent: Iron Lift gate released.",
        ):
            self.assertIn(token, script)

    def test_expedition_start_depth_selection_updates_detail_regions_from_data(self) -> None:
        script = source_text("iron-lantern-descent.js")
        depth_choices = json.loads(self.run_node(
            "game.GAME_DATA.expeditionStart.depthChoices.map((depth) => ({"
            "id: depth.id,"
            "description: depth.description,"
            "readiness: depth.readiness,"
            "reward: depth.reward,"
            "route: depth.route,"
            "character: depth.character,"
            "rank: depth.rank,"
            "summaryLoadout: depth.summaryLoadout,"
            "summaryReward: depth.summaryReward,"
            "cavernFocus: depth.cavernFocus,"
            "rewardCards: depth.rewardCards.length,"
            "loadoutCards: depth.loadoutCards.length,"
            "consumableCards: depth.consumableCards.length"
            "}))"
        ))

        self.assertEqual(["upper", "pumpworks", "relay"], [depth["id"] for depth in depth_choices])
        for depth in depth_choices:
            for field in (
                "description",
                "readiness",
                "reward",
                "route",
                "character",
                "rank",
                "summaryLoadout",
                "summaryReward",
                "cavernFocus",
            ):
                self.assertTrue(depth[field], f"{depth['id']} missing {field}")
            self.assertGreaterEqual(depth["rewardCards"], 2)
            self.assertGreaterEqual(depth["loadoutCards"], 2)
            self.assertGreaterEqual(depth["consumableCards"], 2)

        for token in (
            'dom["start-cavern-depth"].textContent = depth.name',
            'dom["start-cavern-focus"].textContent = depth.cavernFocus ||',
            'dom["start-depth-name"].textContent = depth.name',
            'dom["start-depth-description"].textContent = depth.description',
            'dom["start-character"].textContent = depth.character',
            'dom["start-rank"].textContent = depth.rank',
            'dom["start-summary-loadout"].textContent = depth.summaryLoadout',
            'dom["start-summary-reward"].textContent = depth.summaryReward',
            'renderStartCardList("start-reward-cards", depth.rewardCards, "reward")',
            'renderStartCardList("start-loadout-cards", depth.loadoutCards, "loadout")',
            'renderStartCardList("start-consumable-cards", depth.consumableCards, "consumable")',
            'button.setAttribute("aria-pressed", String(selected))',
        ):
            self.assertIn(token, script)

    def test_narrow_expedition_start_surface_has_bounded_first_viewport_layout(self) -> None:
        css = source_text("iron-lantern-descent.css")
        mobile_block = extract_css_block(css, "@media (max-width: 620px)")
        extra_narrow_block = extract_css_block(css, "@media (max-width: 360px)")

        for token in (
            ".expedition-start",
            '"depth" auto',
            '"cavern" minmax(148px, 18svh)',
            '"detail" minmax(0, 1fr)',
            '"summary" auto',
            "height: 100svh",
            "overflow: hidden",
            ".depth-selector",
            "grid-template-columns: repeat(3, minmax(0, 1fr))",
            ".start-cavern-hero",
            ".start-detail-panel",
            "min-height: 188px",
            "overflow-y: auto",
            ".start-summary-grid",
            "grid-template-columns: repeat(2, minmax(0, 1fr))",
            ".begin-descent-action",
            "min-height: 52px",
            "margin-bottom: 0",
            ".start-scroll-pad",
            "display: none",
        ):
            self.assertIn(token, mobile_block)

        for stale_mobile_layout in (
            "min-height: 318px",
            "grid-template-columns: 1fr;\n  }",
            "min-height: 210px",
            "margin-bottom: 8px",
            "display: block;\n    height: 10px",
        ):
            self.assertNotIn(stale_mobile_layout, mobile_block)

        self.assertNotIn(".depth-selector,\n  .start-card-list,\n  .start-summary-grid", extra_narrow_block)
        self.assertNotIn(".start-summary-grid {\n    grid-template-columns: 1fr", extra_narrow_block)

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

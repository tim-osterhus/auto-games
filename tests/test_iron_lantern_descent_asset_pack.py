import json
import struct
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "iron-lantern-descent"
ASSET_DIR = GAME_DIR / "assets"
SHIPPING_MANIFEST_PATH = ASSET_DIR / "asset-manifest.json"
REQUEST_MANIFEST_PATH = ROOT / "_visual-check" / "iron-lantern-descent-assets" / "asset-request-manifest.json"
EVIDENCE_DIR = ROOT / "_visual-check" / "iron-lantern-descent-assets"
REQUEST_DIR = EVIDENCE_DIR / "asset-request"
DRY_RUN_REQUEST_DIR = EVIDENCE_DIR / "asset-request-dry-run"
ASSET_CHECK_REPORT_PATH = EVIDENCE_DIR / "asset-check-report.json"


EXPECTED_ASSETS = {
    "lantern-anchor": {
        "path": "games/iron-lantern-descent/assets/lantern-anchor.png",
        "role": "sprite",
        "size": (256, 256),
        "alpha": True,
    },
    "mineral-vein-material": {
        "path": "games/iron-lantern-descent/assets/mineral-vein-material.png",
        "role": "texture",
        "size": (512, 512),
        "alpha": False,
    },
    "drill-tool": {
        "path": "games/iron-lantern-descent/assets/drill-tool.png",
        "role": "sprite",
        "size": (256, 256),
        "alpha": True,
    },
    "oxygen-light-icons": {
        "path": "games/iron-lantern-descent/assets/oxygen-light-icons.png",
        "role": "icon",
        "size": (384, 128),
        "alpha": True,
    },
    "arcade-title-card": {
        "path": "games/iron-lantern-descent/assets/arcade-title-card.png",
        "role": "background",
        "size": (800, 450),
        "alpha": False,
    },
}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def png_header(path: Path) -> tuple[int, int, int]:
    with path.open("rb") as file:
        signature = file.read(8)
        length, chunk_type = struct.unpack(">I4s", file.read(8))
        header = file.read(length)

    if signature != b"\x89PNG\r\n\x1a\n" or chunk_type != b"IHDR":
        raise AssertionError(f"{path} is not a valid PNG")
    width, height, _bit_depth, color_type = struct.unpack(">IIBB", header[:10])
    return width, height, color_type


def manifest_asset_path(asset: dict) -> Path:
    raw_path = Path(asset["path"])
    if raw_path.is_absolute():
        return raw_path
    return ROOT / raw_path


class IronLanternDescentAssetPackTests(unittest.TestCase):
    def test_shipping_manifest_declares_complete_project_local_asset_pack(self) -> None:
        manifest = load_json(SHIPPING_MANIFEST_PATH)
        assets = manifest.get("assets")

        self.assertEqual(1, manifest.get("schema_version"))
        self.assertEqual("complete", manifest.get("status"))
        self.assertEqual("generate", manifest.get("mode"))
        self.assertEqual("_visual-check/iron-lantern-descent-assets/asset-request-manifest.json", manifest.get("request_manifest"))
        self.assertEqual(set(EXPECTED_ASSETS), {asset.get("id") for asset in assets})

        seen_paths = set()
        for asset in assets:
            expected = EXPECTED_ASSETS[asset["id"]]
            self.assertEqual(expected["path"], asset.get("path"))
            self.assertEqual(expected["role"], asset.get("role"))
            self.assertEqual(expected["size"][0], asset.get("width"))
            self.assertEqual(expected["size"][1], asset.get("height"))
            self.assertTrue(asset.get("description"))
            self.assertTrue(asset.get("intended_use"))
            self.assertTrue(asset.get("notes"))

            path = asset["path"]
            self.assertTrue(path.startswith("games/iron-lantern-descent/assets/"))
            self.assertFalse(Path(path).is_absolute())
            self.assertNotIn("://", path)
            self.assertNotIn("..", Path(path).parts)
            self.assertNotIn(path, seen_paths)
            seen_paths.add(path)
            self.assertTrue((ROOT / path).is_file(), path)

        shipped_pngs = {path.relative_to(ROOT).as_posix() for path in ASSET_DIR.rglob("*.png")}
        self.assertEqual(set(seen_paths), shipped_pngs)

    def test_request_manifest_pipeline_evidence_and_check_report_are_preserved(self) -> None:
        manifest = load_json(REQUEST_MANIFEST_PATH)
        live_meta = load_json(REQUEST_DIR / "request-meta.json")
        live_prompt = (REQUEST_DIR / "request-prompt.md").read_text(encoding="utf-8")
        dry_run_meta = load_json(DRY_RUN_REQUEST_DIR / "request-meta.json")
        dry_run_prompt = (DRY_RUN_REQUEST_DIR / "request-prompt.md").read_text(encoding="utf-8")
        report = load_json(ASSET_CHECK_REPORT_PATH)

        self.assertEqual("complete", manifest.get("status"))
        self.assertEqual("generate", manifest.get("mode"))
        self.assertEqual(set(EXPECTED_ASSETS), {asset.get("id") for asset in manifest["assets"]})
        self.assertFalse(live_meta["dry_run"])
        self.assertTrue(live_meta["manifest"].endswith("_visual-check/iron-lantern-descent-assets/asset-request-manifest.json"))
        self.assertTrue(live_meta["out_dir"].endswith("games/iron-lantern-descent/assets"))
        self.assertIn("$imagegen", live_prompt)
        self.assertIn("Do not use OPENAI_API_KEY", live_prompt)
        self.assertTrue(dry_run_meta["dry_run"])
        self.assertTrue(dry_run_meta["manifest"].endswith("_visual-check/iron-lantern-descent-assets/asset-request-manifest.json"))
        self.assertTrue(dry_run_meta["out_dir"].endswith("games/iron-lantern-descent/assets"))
        self.assertIn("$imagegen", dry_run_prompt)
        self.assertIn("Do not use OPENAI_API_KEY", dry_run_prompt)
        self.assertTrue(report["ok"])
        self.assertEqual(len(EXPECTED_ASSETS), report["asset_count"])
        self.assertTrue((EVIDENCE_DIR / "asset-contact-sheet.png").is_file())

        for asset in manifest["assets"]:
            self.assertTrue(manifest_asset_path(asset).is_file(), asset["path"])

    def test_generated_pngs_match_manifest_dimensions_and_alpha_contract(self) -> None:
        for asset_id, expected in EXPECTED_ASSETS.items():
            width, height, color_type = png_header(ROOT / expected["path"])

            self.assertEqual(expected["size"], (width, height), asset_id)
            if expected["alpha"]:
                self.assertIn(color_type, (4, 6), asset_id)
            else:
                self.assertIn(color_type, (2, 6), asset_id)

    def test_asset_roles_cover_required_iron_lantern_surfaces(self) -> None:
        manifest = load_json(SHIPPING_MANIFEST_PATH)
        ids = {asset["id"] for asset in manifest["assets"]}

        self.assertIn("lantern-anchor", ids)
        self.assertIn("mineral-vein-material", ids)
        self.assertIn("drill-tool", ids)
        self.assertIn("oxygen-light-icons", ids)
        self.assertIn("arcade-title-card", ids)

        for procedural_category in ("vent", "draft", "fan", "filter", "gas", "airflow", "relay", "pylon", "cable", "echo", "beacon"):
            self.assertFalse(
                any(procedural_category in asset_id for asset_id in ids),
                procedural_category,
            )


if __name__ == "__main__":
    unittest.main()

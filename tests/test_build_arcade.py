import json
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
BUILD_SCRIPT = REPO_ROOT / "scripts" / "build_arcade.py"


class BuildArcadeTests(unittest.TestCase):
    def test_builder_generates_index_assets_and_stub_page(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            manifest_dir = root / "data"
            manifest_dir.mkdir(parents=True)
            output_root = root / "site"

            (manifest_dir / "games.json").write_text(
                json.dumps(
                    {
                        "site": {
                            "title": "Test Arcade",
                            "tagline": "Generated from a manifest.",
                            "announcement": "Day 0 baseline.",
                        },
                        "games": [
                            {
                                "slug": "corebound",
                                "title": "Corebound",
                                "status": "Stub",
                                "summary": "Reserved slot.",
                                "description": "Stub only.",
                                "cta_label": "Open stub",
                                "launch_state": "stub",
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            subprocess.run(
                [
                    "python3",
                    str(BUILD_SCRIPT),
                    "--manifest",
                    str((manifest_dir / "games.json").resolve()),
                    "--output-root",
                    str(output_root.resolve()),
                ],
                cwd=REPO_ROOT,
                check=True,
                text=True,
                capture_output=True,
            )

            index_html = (output_root / "index.html").read_text(encoding="utf-8")
            corebound_html = (output_root / "corebound" / "index.html").read_text(encoding="utf-8")
            stylesheet = (output_root / "assets" / "site.css").read_text(encoding="utf-8")

        self.assertIn("generated from <code>data/games.json</code>", index_html)
        self.assertIn('href="corebound/"', index_html)
        self.assertIn("Stub only", corebound_html)
        self.assertIn("../assets/site.css", corebound_html)
        self.assertIn("--accent", stylesheet)

    def test_builder_rejects_duplicate_game_slugs(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            manifest_dir = root / "data"
            manifest_dir.mkdir(parents=True)
            output_root = root / "site"

            (manifest_dir / "games.json").write_text(
                textwrap.dedent(
                    """\
                    {
                      "site": {
                        "title": "Broken Arcade"
                      },
                      "games": [
                        { "slug": "corebound", "title": "Corebound" },
                        { "slug": "corebound", "title": "Duplicate" }
                      ]
                    }
                    """
                ),
                encoding="utf-8",
            )

            completed = subprocess.run(
                [
                    "python3",
                    str(BUILD_SCRIPT),
                    "--manifest",
                    str((manifest_dir / "games.json").resolve()),
                    "--output-root",
                    str(output_root.resolve()),
                ],
                cwd=REPO_ROOT,
                text=True,
                capture_output=True,
            )

        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("Duplicate game slug", completed.stderr + completed.stdout)


if __name__ == "__main__":
    unittest.main()

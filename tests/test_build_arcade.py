import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import build_arcade


class BuildArcadeTests(unittest.TestCase):
    def test_render_empty_baseline(self) -> None:
        manifest = {
            "arcade": {
                "status": "awaiting-first-game",
                "summary": "Clean baseline.",
            },
            "games": [],
        }

        rendered = build_arcade.render_index(manifest)

        self.assertIn("Millrace Arcade", rendered)
        self.assertIn("No games are published", rendered)
        self.assertIn("awaiting-first-game", rendered)
        self.assertIn("Runtime", rendered)

    def test_render_game_card_escapes_manifest_values(self) -> None:
        card = build_arcade.render_game_card(
            {
                "slug": "signal-runner",
                "title": "Signal <Runner>",
                "version": "0.0.1",
                "status": "playable",
                "summary": "Route current & avoid overload.",
                "path": "games/signal-runner/",
            }
        )

        self.assertIn("Signal &lt;Runner&gt;", card)
        self.assertIn("Route current &amp; avoid overload.", card)
        self.assertIn("games/signal-runner/", card)

    def test_build_writes_index_from_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data_dir = root / "data"
            data_dir.mkdir()
            (data_dir / "games.json").write_text(
                json.dumps(
                    {
                        "arcade": {
                            "status": "ready",
                            "summary": "Temporary arcade.",
                        },
                        "games": [],
                    }
                ),
                encoding="utf-8",
            )

            with mock.patch.object(build_arcade, "MANIFEST_PATH", data_dir / "games.json"), mock.patch.object(
                build_arcade, "INDEX_PATH", root / "index.html"
            ):
                build_arcade.build()

            self.assertIn("Temporary arcade.", (root / "index.html").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()

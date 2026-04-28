import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import build_arcade


class BuildArcadeTests(unittest.TestCase):
    def test_render_empty_arcade(self) -> None:
        manifest = {
            "arcade": {
                "status": "awaiting-first-game",
                "summary": "Playable games soon.",
            },
            "games": [],
        }

        rendered = build_arcade.render_index(manifest)

        self.assertIn("Millrace Arcade", rendered)
        self.assertIn("No playable builds are listed yet", rendered)
        self.assertIn("Playable games soon.", rendered)
        self.assertIn("Millrace", rendered)
        self.assertNotIn("Lite", rendered)
        self.assertNotIn("baseline", rendered.lower())
        self.assertNotIn("public game surface", rendered.lower())
        self.assertNotIn("manifest", rendered.lower())
        self.assertNotIn("schema", rendered.lower())
        self.assertNotIn("intake", rendered.lower())
        self.assertNotIn("queue", rendered.lower())
        self.assertNotIn("setup", rendered.lower())

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
        self.assertNotIn("Snapshots", card)

    def test_render_game_card_includes_snapshot_links(self) -> None:
        card = build_arcade.render_game_card(
            {
                "slug": "corebound",
                "title": "Corebound",
                "version": "0.2.0",
                "status": "playable",
                "summary": "Mine deeper.",
                "path": "games/corebound/",
                "versions": [
                    {
                        "version": "0.2.0",
                        "path": "games/corebound/versions/0.2.0/",
                        "label": "New drills",
                        "releasedAt": "2026-04-27",
                        "commit": "abcdef1234567890",
                    },
                    {
                        "version": "0.1.0",
                        "path": "games/corebound/versions/0.1.0/",
                        "summary": "First descent",
                        "releasedAt": "2026-04-26",
                    },
                ],
            }
        )

        self.assertIn('href="games/corebound/"', card)
        self.assertIn("Snapshots", card)
        self.assertIn('href="games/corebound/versions/0.2.0/"', card)
        self.assertIn("v0.2.0", card)
        self.assertIn("New drills", card)
        self.assertIn("2026-04-27", card)
        self.assertIn("abcdef123456", card)
        self.assertIn('href="games/corebound/versions/0.1.0/"', card)
        self.assertIn("First descent", card)

    def test_render_index_tolerates_games_without_versions(self) -> None:
        rendered = build_arcade.render_index(
            {
                "arcade": {"summary": "Playable now."},
                "games": [
                    {
                        "slug": "signal-runner",
                        "title": "Signal Runner",
                        "version": "1.0.0",
                        "status": "playable",
                        "summary": "Route current.",
                        "path": "games/signal-runner/",
                    }
                ],
            }
        )

        self.assertIn("Signal Runner", rendered)
        self.assertIn('href="games/signal-runner/"', rendered)
        self.assertNotIn("Snapshots", rendered)

    def test_render_index_uses_corebound_release_metadata(self) -> None:
        rendered = build_arcade.render_index(
            {
                "arcade": {"summary": "Corebound is live."},
                "games": [
                    {
                        "slug": "corebound",
                        "title": "Corebound",
                        "version": "0.4.0",
                        "status": "playable",
                        "summary": "Pilot Mantis-01 with held-input motion and generated asset-backed strata.",
                        "release": {
                            "label": "v0.4.0 Natural Motion",
                            "copy": "Held input drives continuous rig motion through generated bitmap strata and visible upgrade icons.",
                        },
                        "snapshot": {
                            "status": "deferred",
                            "version": "0.4.0",
                            "reason": "Working-tree content is not commit-backed yet.",
                        },
                        "path": "games/corebound/",
                    }
                ],
            }
        )

        self.assertIn("Corebound is live.", rendered)
        self.assertIn("games <strong>1 game</strong>", rendered)
        self.assertIn("playable / v0.4.0", rendered)
        self.assertIn("Corebound is playable.", rendered)
        self.assertIn("Pilot Mantis-01 with held-input motion and generated asset-backed strata.", rendered)
        self.assertIn("v0.4.0 Natural Motion", rendered)
        self.assertIn("Held input drives continuous rig motion", rendered)
        self.assertIn("Snapshot deferred", rendered)
        self.assertIn("Working-tree content is not commit-backed yet.", rendered)
        self.assertIn('href="games/corebound/"', rendered)
        self.assertNotIn("No playable builds are listed yet", rendered)

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

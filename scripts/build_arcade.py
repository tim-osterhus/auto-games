#!/usr/bin/env python3
from __future__ import annotations

import html
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "games.json"
INDEX_PATH = ROOT / "index.html"


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def escape(value: object) -> str:
    return html.escape(str(value), quote=True)


def render_game_card(game: dict) -> str:
    title = escape(game.get("title", game.get("slug", "Untitled Game")))
    slug = escape(game.get("slug", "unknown"))
    version = escape(game.get("version", "0.0.0"))
    status = escape(game.get("status", "playable"))
    summary = escape(game.get("summary", "No summary provided."))
    path = escape(game.get("path", f"games/{slug}/"))
    return f"""
        <article class="game-card">
          <span class="signal-pill">{status} / v{version}</span>
          <h3>{title}</h3>
          <p>{summary}</p>
          <a href="{path}">Open {slug}</a>
        </article>
    """.strip()


def render_games(games: list[dict]) -> str:
    if not games:
        return """
        <div class="empty-state">
          No games are published in this clean baseline yet. The first Millrace
          run will either create a new game or queue a flagship Corebound slice.
        </div>
        """.strip()
    return "\n".join(render_game_card(game) for game in games)


def render_index(manifest: dict) -> str:
    games = manifest.get("games", [])
    arcade = manifest.get("arcade", {})
    game_count = len(games)
    arcade_status = escape(arcade.get("status", "ready"))
    arcade_summary = escape(arcade.get("summary", "Millrace arcade baseline."))
    schema = escape(manifest.get("schema", 1))
    game_word = "game" if game_count == 1 else "games"
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0b1014" />
  <title>Millrace Arcade</title>
  <link rel="icon" type="image/png" href="favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/site.css" />
</head>
<body>
  <main class="page">
    <header class="topbar">
      <a class="brand" href="https://millrace.ai" aria-label="Millrace home">
        <img src="MillraceIconSignalNav.png" alt="" />
        <span class="brand-name">Millrace</span>
        <span class="signal-pill">Arcade</span>
      </a>
      <nav class="nav" aria-label="Public surfaces">
        <a href="https://live.millrace.ai">Live</a>
        <a href="https://lite.millrace.ai">Lite</a>
        <a href="https://millrace.ai">Runtime</a>
      </nav>
    </header>

    <div class="meta-strip" aria-label="Arcade metadata">
      <span>surface <strong>browser games</strong></span>
      <span>status <strong>{arcade_status}</strong></span>
      <span>count <strong>{game_count} {game_word}</strong></span>
      <span>manifest <strong>schema {schema}</strong></span>
    </div>

    <section class="hero">
      <div class="hero-copy">
        <span class="hero-label">Public Game Surface</span>
        <h1>Games built by a <em>runtime.</em></h1>
        <p>{arcade_summary}</p>
      </div>
      <aside class="panel status-panel">
        <span class="panel-label">Baseline State</span>
        <h2>Clean arcade shell ready for Millrace intake.</h2>
        <p>The old generated catalog has been cleared. New entries should arrive through manual specs and recurring automatic prompts in the Millrace queue.</p>
        <div class="readout">
          <div class="readout-row"><span>Manual lane</span><span>Corebound flagship spec</span></div>
          <div class="readout-row"><span>Auto lane</span><span>new game / improve game</span></div>
          <div class="readout-row"><span>Verification</span><span>build script + smoke tests</span></div>
        </div>
      </aside>
    </section>

    <section aria-labelledby="games-heading">
      <div class="section-head">
        <h2 id="games-heading">Game Registry</h2>
        <p>Each shipped game should be playable directly, carry release metadata, and keep implementation isolated to its own slug unless shared publishing code is required.</p>
      </div>
      <div class="game-grid">
{render_games(games)}
      </div>
    </section>

    <footer class="footer">
      Millrace Arcade baseline. Commit generated index changes with manifest changes.
    </footer>
  </main>
</body>
</html>
"""


def build() -> None:
    manifest = load_manifest()
    INDEX_PATH.write_text(render_index(manifest), encoding="utf-8")


if __name__ == "__main__":
    build()

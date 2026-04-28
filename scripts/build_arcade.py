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


def render_version_snapshots(game: dict) -> str:
    versions = game.get("versions")
    if not isinstance(versions, list) or not versions:
        return ""

    title = escape(game.get("title", game.get("slug", "Untitled Game")))
    items = []
    for snapshot in versions:
        if not isinstance(snapshot, dict):
            continue

        version_value = snapshot.get("version", "snapshot")
        version = escape(version_value)
        path = escape(snapshot.get("path", "#"))
        label = escape(snapshot.get("label", snapshot.get("title", snapshot.get("summary", f"v{version_value}"))))
        released_at = escape(snapshot.get("releasedAt", "date pending"))
        commit = snapshot.get("commit")
        commit_line = f'<span class="snapshot-commit">commit {escape(str(commit)[:12])}</span>' if commit else ""
        items.append(
            f"""
            <li>
              <a class="snapshot-link" href="{path}">
                <span class="snapshot-version">v{version}</span>
                <span class="snapshot-label">{label}</span>
                <span class="snapshot-meta"><span>{released_at}</span>{commit_line}</span>
              </a>
            </li>
            """.strip()
        )

    if not items:
        return ""

    snapshot_items = "\n".join(items)
    return f"""
          <div class="snapshot-list" aria-label="{title} snapshots">
            <span class="snapshot-heading">Snapshots</span>
            <ol>
              {snapshot_items}
            </ol>
          </div>
    """.rstrip()


def render_snapshot_deferral(game: dict) -> str:
    snapshot = game.get("snapshot")
    if not isinstance(snapshot, dict) or snapshot.get("status") != "deferred":
        return ""

    title = escape(game.get("title", game.get("slug", "Untitled Game")))
    version = escape(snapshot.get("version", game.get("version", "pending")))
    reason = escape(snapshot.get("reason", "Snapshot is deferred until a commit-backed release can be stamped."))
    return f"""
          <div class="snapshot-deferral" aria-label="{title} snapshot continuity">
            <span class="snapshot-heading">Snapshot deferred</span>
            <p><strong>v{version}</strong> {reason}</p>
          </div>
    """.rstrip()


def render_release_note(game: dict) -> str:
    release = game.get("release")
    if not isinstance(release, dict):
        return ""

    label = escape(release.get("label", f"v{game.get('version', '0.0.0')} release"))
    copy = escape(release.get("copy", release.get("summary", "")))
    if not copy:
        return ""
    return f"""
          <div class="release-note">
            <span>{label}</span>
            <p>{copy}</p>
          </div>
    """.rstrip()


def render_thumbnail(game: dict) -> str:
    thumbnail = game.get("thumbnail")
    if not isinstance(thumbnail, str) or not thumbnail.strip():
        return ""

    title = escape(game.get("title", game.get("slug", "Untitled Game")))
    src = escape(thumbnail.strip())
    return f"""
          <div class="game-thumbnail" aria-label="{title} title card">
            <img src="{src}" alt="" loading="lazy" />
          </div>
    """.rstrip()


def render_game_card(game: dict) -> str:
    title = escape(game.get("title", game.get("slug", "Untitled Game")))
    slug = escape(game.get("slug", "unknown"))
    version = escape(game.get("version", "0.0.0"))
    status = escape(game.get("status", "playable"))
    summary = escape(game.get("summary", "No summary provided."))
    path = escape(game.get("path", f"games/{slug}/"))
    snapshots = render_version_snapshots(game)
    snapshot_deferral = render_snapshot_deferral(game)
    release_note = render_release_note(game)
    thumbnail = render_thumbnail(game)
    return f"""
        <article class="game-card">
          <span class="signal-pill">{status} / v{version}</span>
{thumbnail}
          <h3>{title}</h3>
          <p>{summary}</p>
{release_note}
          <a href="{path}">Open {slug}</a>
{snapshots}
{snapshot_deferral}
        </article>
    """.strip()


def render_games(games: list[dict]) -> str:
    if not games:
        return """
        <div class="empty-state">
          No playable builds are listed yet. The first release will appear here
          as a direct launch link.
        </div>
        """.strip()
    return "\n".join(render_game_card(game) for game in games)


def find_featured_game(games: list[dict], slug: str = "corebound") -> dict | None:
    for game in games:
        if isinstance(game, dict) and game.get("slug") == slug:
            return game
    return None


def render_status_panel(games: list[dict]) -> str:
    featured = find_featured_game(games)
    if not featured:
        return """
      <aside class="panel status-panel">
        <span class="panel-label">Corebound</span>
        <h2>Corebound is first up.</h2>
        <p>A mining game about depth, risk, and better machines. When the first playable build lands, it opens here.</p>
        <div class="readout">
          <div class="readout-row"><span>Corebound</span><span>mining + upgrades</span></div>
          <div class="readout-row"><span>Arcade</span><span>playable in browser</span></div>
          <div class="readout-row"><span>Drops</span><span>direct launch links</span></div>
        </div>
      </aside>
        """.rstrip()

    title = escape(featured.get("title", "Corebound"))
    version = escape(featured.get("version", "0.0.0"))
    status = escape(featured.get("status", "playable"))
    summary = escape(featured.get("summary", "Corebound is playable in the arcade."))
    path = escape(featured.get("path", "games/corebound/"))
    release = featured.get("release") if isinstance(featured.get("release"), dict) else {}
    release_label = escape(release.get("label", f"v{version} release"))
    return f"""
      <aside class="panel status-panel">
        <span class="panel-label">{status} / v{version}</span>
        <h2>{title} is playable.</h2>
        <p>{summary}</p>
{render_release_note(featured)}
        <div class="readout">
          <div class="readout-row"><span>Status</span><span>{status}</span></div>
          <div class="readout-row"><span>Version</span><span>v{version}</span></div>
          <div class="readout-row"><span>Release</span><span>{release_label}</span></div>
          <div class="readout-row"><span>Launch</span><span><a href="{path}">{path}</a></span></div>
        </div>
      </aside>
    """.rstrip()


def render_index(manifest: dict) -> str:
    games = manifest.get("games", [])
    arcade = manifest.get("arcade", {})
    game_count = len(games)
    arcade_summary = escape(arcade.get("summary", "Playable browser games from Millrace."))
    game_word = "game" if game_count == 1 else "games"
    game_count_label = f"{game_count} {game_word}" if game_count else "coming soon"
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
      <nav class="nav" aria-label="Millrace surfaces">
        <a href="https://live.millrace.ai">Live</a>
        <a href="https://millrace.ai">Millrace</a>
      </nav>
    </header>

    <div class="meta-strip" aria-label="Arcade overview">
      <span>arcade <strong>browser games</strong></span>
      <span>games <strong>{game_count_label}</strong></span>
      <span>first release <strong>Corebound</strong></span>
    </div>

    <section class="hero">
      <div class="hero-copy">
        <span class="hero-label">Arcade</span>
        <h1>Games built by a <em>runtime.</em></h1>
        <p>{arcade_summary}</p>
      </div>
{render_status_panel(games)}
    </section>

    <section aria-labelledby="games-heading">
      <div class="section-head">
        <h2 id="games-heading">Games</h2>
      </div>
      <div class="game-grid">
{render_games(games)}
      </div>
    </section>
  </main>
</body>
</html>
"""


def build() -> None:
    manifest = load_manifest()
    INDEX_PATH.write_text(render_index(manifest), encoding="utf-8")


if __name__ == "__main__":
    build()

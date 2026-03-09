#!/usr/bin/env python3

from __future__ import annotations

import argparse
import html
import json
from pathlib import Path


STYLE_CSS = """
:root {
  --bg: #f4efe4;
  --paper: rgba(255, 250, 242, 0.92);
  --ink: #1b140f;
  --muted: #5c4a3d;
  --line: rgba(93, 63, 40, 0.16);
  --accent: #9f4a1c;
  --accent-deep: #7d2f0c;
  --accent-soft: rgba(159, 74, 28, 0.12);
  --shadow: 0 18px 45px rgba(55, 28, 12, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Georgia, "Times New Roman", serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(200, 114, 55, 0.2), transparent 30rem),
    linear-gradient(180deg, #f8f2e8 0%, var(--bg) 100%);
}

a {
  color: inherit;
}

.shell {
  width: min(1080px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 4rem;
}

.hero,
.panel,
.game-card {
  background: var(--paper);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  backdrop-filter: blur(6px);
}

.hero {
  padding: 2rem;
  border-radius: 1.75rem;
}

.eyebrow {
  margin: 0 0 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.76rem;
  color: var(--accent-deep);
}

h1,
h2 {
  margin: 0;
  line-height: 1.05;
}

h1 {
  font-size: clamp(2.7rem, 6vw, 5rem);
  max-width: 12ch;
}

.lede {
  margin: 1rem 0 0;
  max-width: 46rem;
  font-size: 1.06rem;
  line-height: 1.65;
  color: var(--muted);
}

.notice {
  margin-top: 1.5rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: var(--accent-soft);
  border: 1px solid rgba(159, 74, 28, 0.16);
}

.grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  margin-top: 1.5rem;
}

.game-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.35rem;
  border-radius: 1.35rem;
}

.pill {
  align-self: flex-start;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-deep);
  background: var(--accent-soft);
}

.body-copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 0.78rem 1rem;
  border-radius: 999px;
  background: var(--accent);
  color: #fff8f2;
  text-decoration: none;
  font-weight: 600;
}

.cta:hover {
  background: var(--accent-deep);
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.panel {
  border-radius: 1.25rem;
  padding: 1.15rem;
}

.panel h2 {
  font-size: 1.15rem;
  margin-bottom: 0.65rem;
}

.crumb {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1rem;
  color: var(--muted);
  text-decoration: none;
}

.stub {
  margin-top: 1.5rem;
  padding: 1.35rem;
  border-radius: 1.25rem;
  border: 1px dashed rgba(125, 47, 12, 0.35);
  background: rgba(255, 250, 242, 0.72);
}

@media (max-width: 640px) {
  .shell {
    width: min(100% - 1.1rem, 100%);
    padding-top: 1rem;
  }

  .hero,
  .game-card,
  .panel,
  .stub {
    border-radius: 1.1rem;
  }

  .hero {
    padding: 1.35rem;
  }
}
""".strip() + "\n"


def load_manifest(manifest_path: Path) -> dict:
    payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    games = payload.get("games")
    if not isinstance(games, list) or not games:
        raise ValueError("Manifest must contain a non-empty 'games' array.")

    seen_slugs: set[str] = set()
    for game in games:
        slug = game.get("slug")
        title = game.get("title")
        if not isinstance(slug, str) or not slug:
            raise ValueError("Each game entry requires a non-empty string slug.")
        if slug in seen_slugs:
            raise ValueError(f"Duplicate game slug: {slug}")
        seen_slugs.add(slug)
        if not isinstance(title, str) or not title:
            raise ValueError(f"Game '{slug}' requires a non-empty string title.")

    return payload


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def render_index(site: dict, games: list[dict]) -> str:
    cards = []
    for game in games:
        cards.append(
            f"""
      <article class="game-card">
        <span class="pill">{esc(game.get("status", "Unknown"))}</span>
        <h2>{esc(game["title"])}</h2>
        <p class="body-copy">{esc(game.get("summary", ""))}</p>
        <a class="cta" href="{esc(game['slug'])}/">{esc(game.get("cta_label", "Open"))}</a>
      </article>
            """.rstrip()
        )

    title = esc(site.get("title", "Games"))
    tagline = esc(site.get("tagline", ""))
    announcement = esc(site.get("announcement", ""))

    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title}</title>
    <meta name="description" content="{tagline}">
    <link rel="stylesheet" href="assets/site.css">
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">Millrace Arcade</p>
        <h1>{title}</h1>
        <p class="lede">{tagline}</p>
        <div class="notice">
          <strong>Current baseline.</strong> {announcement}
        </div>
      </section>
      <section class="grid">
{chr(10).join(cards)}
      </section>
      <section class="meta">
        <div class="panel">
          <h2>Source of truth</h2>
          <p class="body-copy">This page is generated from <code>data/games.json</code> by <code>scripts/build_arcade.py</code>.</p>
        </div>
        <div class="panel">
          <h2>Why so small?</h2>
          <p class="body-copy">Day 0 intentionally launches a clean arcade index and a single stub so the public surface starts from zero instead of inheriting an unfinished game.</p>
        </div>
      </section>
    </main>
  </body>
</html>
"""


def render_game_page(site: dict, game: dict) -> str:
    title = esc(game["title"])
    status = esc(game.get("status", "Unknown"))
    summary = esc(game.get("summary", ""))
    description = esc(game.get("description", ""))
    launch_state = esc(game.get("launch_state", "stub"))
    site_title = esc(site.get("title", "Games"))

    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title} | {site_title}</title>
    <meta name="description" content="{summary}">
    <link rel="stylesheet" href="../assets/site.css">
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <a class="crumb" href="../">&larr; Back to arcade</a>
        <p class="eyebrow">Game Slot</p>
        <h1>{title}</h1>
        <p class="lede">{summary}</p>
      </section>
      <section class="meta">
        <div class="panel">
          <h2>Status</h2>
          <p class="body-copy"><strong>{status}</strong> · launch state: <code>{launch_state}</code></p>
        </div>
        <div class="panel">
          <h2>Intent</h2>
          <p class="body-copy">{description}</p>
        </div>
      </section>
      <section class="stub">
        <h2>Stub only</h2>
        <p class="body-copy">This page intentionally holds the place for {title}. The public Day 0 baseline reserves the slot without carrying over the earlier prototype implementation.</p>
      </section>
    </main>
  </body>
</html>
"""


def build_arcade(manifest_path: Path, output_root: Path) -> list[Path]:
    payload = load_manifest(manifest_path)
    site = payload.get("site", {})
    games = payload["games"]
    live_slugs = {game["slug"] for game in games}

    for child in output_root.iterdir() if output_root.exists() else []:
        if not child.is_dir():
            continue
        if child.name in {"assets", "data", "scripts", "tests", ".git", "__pycache__"}:
            continue
        if child.name in live_slugs:
            continue
        generated_index = child / "index.html"
        if generated_index.exists():
            generated_index.unlink()
            try:
                child.rmdir()
            except OSError:
                pass

    assets_dir = output_root / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    (assets_dir / "site.css").write_text(STYLE_CSS, encoding="utf-8")

    written = [assets_dir / "site.css"]

    index_path = output_root / "index.html"
    index_path.write_text(render_index(site, games), encoding="utf-8")
    written.append(index_path)

    for game in games:
        game_dir = output_root / game["slug"]
        game_dir.mkdir(parents=True, exist_ok=True)
        page_path = game_dir / "index.html"
        page_path.write_text(render_game_page(site, game), encoding="utf-8")
        written.append(page_path)

    return written


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the static arcade baseline from a manifest.")
    parser.add_argument(
        "--manifest",
        default="data/games.json",
        help="Path to the games manifest relative to the repo root.",
    )
    parser.add_argument(
        "--output-root",
        default=".",
        help="Directory to receive generated HTML and assets.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    manifest_path = (repo_root / args.manifest).resolve()
    output_root = (repo_root / args.output_root).resolve()
    written = build_arcade(manifest_path, output_root)
    for path in written:
        print(path.relative_to(output_root))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

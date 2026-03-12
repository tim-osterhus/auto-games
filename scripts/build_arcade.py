#!/usr/bin/env python3

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
from pathlib import Path


STYLE_CSS = """
:root {
  --bg: #0a0a0b;
  --surface: rgba(18, 18, 20, 0.9);
  --surface-strong: rgba(22, 22, 25, 0.96);
  --surface-soft: rgba(255, 255, 255, 0.03);
  --ink: #e8e6ed;
  --muted: #9a97a3;
  --dim: #6f6b77;
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.14);
  --accent: #dc2626;
  --accent-soft: #ef4444;
  --accent-dim: rgba(220, 38, 38, 0.12);
  --accent-glow: rgba(220, 38, 38, 0.18);
  --shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "DM Sans", sans-serif;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  background:
    radial-gradient(circle at top center, var(--accent-glow), transparent 30rem),
    radial-gradient(circle at 18% 0%, rgba(239, 68, 68, 0.12), transparent 24rem),
    linear-gradient(180deg, #111114 0%, var(--bg) 28%, #09090b 100%);
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 84% 14%, rgba(255, 255, 255, 0.04), transparent 18rem),
    linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.02) 100%);
  pointer-events: none;
}

a {
  color: inherit;
}

code {
  padding: 0.12rem 0.4rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-strong);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.88em;
}

.shell {
  position: relative;
  z-index: 1;
  width: min(1120px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 72px;
}

.topbar {
  position: sticky;
  top: 12px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 18px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(10, 10, 11, 0.82);
  box-shadow: var(--shadow);
  backdrop-filter: blur(20px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(220, 38, 38, 0.18);
  background: linear-gradient(180deg, var(--accent-dim), rgba(220, 38, 38, 0.04));
  color: var(--accent-soft);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
}

.brand-copy {
  display: grid;
  gap: 2px;
}

.brand-name {
  font-family: "Clash Display", sans-serif;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

.brand-tag {
  color: var(--dim);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.nav-link,
.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 0.78rem 1rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.nav-link {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
}

.nav-link:hover,
.nav-link:focus-visible,
.cta:hover,
.cta:focus-visible,
.crumb:hover,
.crumb:focus-visible {
  border-color: var(--line-strong);
  color: var(--ink);
  outline: none;
  transform: translateY(-1px);
}

.nav-link:hover,
.nav-link:focus-visible {
  background: var(--surface-soft);
}

.hero,
.panel,
.game-card,
.build-note {
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.85fr);
  gap: 24px;
  align-items: stretch;
  padding: 30px;
  border-radius: 24px;
  overflow: hidden;
}

.hero-copy,
.hero-panel {
  position: relative;
  z-index: 1;
}

.hero::before {
  content: "";
  position: absolute;
  inset: auto -4rem -5rem auto;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(220, 38, 38, 0.18), transparent 70%);
  pointer-events: none;
}

.hero-badge,
.panel-label,
.eyebrow,
.pill {
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 18px;
  border-radius: 999px;
  border: 1px solid rgba(220, 38, 38, 0.16);
  background: var(--accent-dim);
  color: var(--accent-soft);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.75rem;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--accent);
}

.eyebrow {
  margin: 1rem 0 0.7rem;
  font-size: 0.76rem;
  color: var(--accent-soft);
}

h1,
h2 {
  margin: 0;
  font-family: "Clash Display", sans-serif;
  line-height: 1.05;
}

h1 {
  font-size: clamp(2.9rem, 6vw, 5rem);
  max-width: 12ch;
  letter-spacing: -0.03em;
}

.lede {
  margin: 1rem 0 0;
  max-width: 48rem;
  font-size: 1.06rem;
  line-height: 1.65;
  color: var(--muted);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 1.5rem;
}

.notice {
  margin-top: 0.8rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: linear-gradient(180deg, var(--accent-dim), rgba(220, 38, 38, 0.04));
  border: 1px solid rgba(220, 38, 38, 0.16);
}

.hero-panel {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
}

.panel-label {
  margin: 0;
  color: var(--dim);
  font-size: 0.74rem;
  font-weight: 700;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 1rem;
}

.stat-card {
  display: grid;
  gap: 4px;
  padding: 0.9rem 1rem;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}

.stat-value {
  font-family: "Clash Display", sans-serif;
  font-size: 1.4rem;
  line-height: 1;
}

.stat-note {
  color: var(--muted);
  font-size: 0.82rem;
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
  border-radius: 20px;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.game-card:hover {
  transform: translateY(-2px);
  border-color: rgba(220, 38, 38, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  align-self: flex-start;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  color: var(--accent-soft);
  background: var(--accent-dim);
}

.pill-secondary {
  color: var(--ink);
  background: rgba(255, 255, 255, 0.06);
}

.body-copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.cta {
  background: var(--accent);
  border: 1px solid transparent;
  color: #fff;
  box-shadow: 0 14px 36px rgba(220, 38, 38, 0.18);
}

.cta:hover,
.cta:focus-visible {
  box-shadow: 0 20px 48px rgba(220, 38, 38, 0.26);
}

.cta.ghost,
.crumb {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
  box-shadow: none;
}

.cta.ghost:hover,
.cta.ghost:focus-visible {
  background: var(--surface-soft);
  box-shadow: none;
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.panel {
  border-radius: 20px;
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
  width: fit-content;
  margin-bottom: 1.2rem;
  padding: 0.72rem 0.95rem;
  border-radius: 999px;
  text-decoration: none;
}

.build-note {
  margin-top: 1.5rem;
  padding: 1.35rem;
  border-radius: 20px;
  border: 1px dashed rgba(220, 38, 38, 0.28);
}

@media (max-width: 640px) {
  .shell {
    width: min(100vw - 20px, 1120px);
    padding-top: 18px;
  }

  .topbar {
    position: static;
    flex-direction: column;
    align-items: stretch;
    border-radius: 24px;
  }

  .nav-links {
    justify-content: flex-start;
  }

  .hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }

  .hero,
  .game-card,
  .panel,
  .build-note {
    border-radius: 18px;
  }
}
""".strip() + "\n"


HEADER_LINKS = [
    ("Journal", "https://lite.millrace.ai"),
    ("Source", "https://github.com/tim-osterhus/turnloop"),
    ("Project", "https://github.com/tim-osterhus/auto-games"),
]

ICON_FILENAME = "MillraceIconTransparent.png"
VERSION_RE = re.compile(r"^\d+\.\d+\.\d+$")
REPO_ROOT = Path(__file__).resolve().parents[1]


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
        version = game.get("version")
        if not isinstance(version, str) or not VERSION_RE.fullmatch(version):
            raise ValueError(f"Game '{slug}' requires a semantic version string like '0.0.1'.")
        source_dir = game.get("source_dir")
        if source_dir is not None and (not isinstance(source_dir, str) or not source_dir.strip()):
            raise ValueError(f"Game '{slug}' requires 'source_dir' to be a non-empty string when provided.")

    return payload


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def display_version(game: dict) -> str:
    return f"v{game['version']}"


def render_favicon_links(href: str) -> str:
    safe_href = esc(href)
    return "\n".join(
        [
            f'    <link rel="icon" type="image/png" href="{safe_href}">',
            f'    <link rel="shortcut icon" type="image/png" href="{safe_href}">',
            f'    <link rel="apple-touch-icon" href="{safe_href}">',
        ]
    )


def render_topbar(home_href: str, extra_links: list[tuple[str, str]] | None = None) -> str:
    links = list(extra_links or []) + HEADER_LINKS
    link_items = []
    for label, href in links:
        attrs = "" if href.startswith(".") or href.startswith("/") else ' target="_blank" rel="noreferrer"'
        link_items.append(f'        <a class="nav-link" href="{esc(href)}"{attrs}>{esc(label)}</a>')
    link_markup = "\n".join(link_items)
    return f"""
    <nav class="topbar" aria-label="Primary">
      <a class="brand" href="{esc(home_href)}">
        <span class="brand-kicker">MR</span>
        <span class="brand-copy">
          <span class="brand-name">Millrace Arcade</span>
          <span class="brand-tag">game.millrace.ai</span>
        </span>
      </a>
      <div class="nav-links" aria-label="Project links">
{link_markup}
      </div>
    </nav>
""".rstrip()


def render_index(site: dict, games: list[dict]) -> str:
    cards = []
    for game in games:
        status = esc(game.get("status", "Live"))
        version = esc(display_version(game))
        cards.append(
            f"""
      <article class="game-card">
        <div class="tag-row">
          <span class="pill">{status}</span>
          <span class="pill pill-secondary">{version}</span>
        </div>
        <h2>{esc(game["title"])}</h2>
        <p class="body-copy">{esc(game.get("summary", ""))}</p>
        <a class="cta" href="{esc(game['slug'])}/">{esc(game.get("cta_label", "Open"))}</a>
      </article>
            """.rstrip()
        )

    title = esc(site.get("title", "Games"))
    tagline = esc(site.get("tagline", ""))
    announcement = esc(site.get("announcement", ""))
    primary_game = games[0]
    featured_version = esc(display_version(primary_game))
    versioned_count = sum(1 for game in games if game.get("version"))
    topbar = render_topbar("./")

    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title}</title>
    <meta name="description" content="{tagline}">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
{render_favicon_links(ICON_FILENAME)}
    <link rel="stylesheet" href="assets/site.css">
  </head>
  <body>
    <main class="shell">
      {topbar}
      <section class="hero">
        <div class="hero-copy">
          <p class="hero-badge"><span class="dot"></span> Versioned releases</p>
          <p class="eyebrow">Millrace Arcade</p>
          <h1>{title}</h1>
          <p class="lede">{tagline}</p>
          <div class="hero-actions">
            <a class="cta" href="{esc(primary_game['slug'])}/">{esc(primary_game.get("cta_label", "Open"))}</a>
            <a class="cta ghost" href="https://lite.millrace.ai">Read journal</a>
          </div>
        </div>
        <aside class="hero-panel">
          <p class="panel-label">Release track</p>
          <div class="notice">
            <strong>Live now.</strong> {announcement}
          </div>
          <div class="stat-grid">
            <div class="stat-card">
              <span class="stat-value">{len(games)}</span>
              <span class="stat-note">titles online</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{versioned_count}</span>
              <span class="stat-note">versioned builds</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{featured_version}</span>
              <span class="stat-note">featured release</span>
            </div>
          </div>
        </aside>
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
          <h2>Release cadence</h2>
          <p class="body-copy">Each public title carries a visible version number so players can see how recently it shipped and how quickly the arcade is moving.</p>
        </div>
      </section>
    </main>
  </body>
</html>
"""


def render_game_page(site: dict, game: dict) -> str:
    title = esc(game["title"])
    status = esc(game.get("status", "Live"))
    summary = esc(game.get("summary", ""))
    description = esc(game.get("description", ""))
    version = esc(display_version(game))
    site_title = esc(site.get("title", "Games"))
    topbar = render_topbar("../", [("Arcade", "../")])

    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title} | {site_title}</title>
    <meta name="description" content="{summary}">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
{render_favicon_links(f"../{ICON_FILENAME}")}
    <link rel="stylesheet" href="../assets/site.css">
  </head>
  <body>
    <main class="shell">
      {topbar}
      <section class="hero">
        <div class="hero-copy">
          <a class="crumb" href="../">&larr; Back to arcade</a>
          <p class="hero-badge"><span class="dot"></span> {status} / {version}</p>
          <p class="eyebrow">Game Slot</p>
          <h1>{title}</h1>
          <p class="lede">{summary}</p>
        </div>
        <aside class="hero-panel">
          <p class="panel-label">Current release</p>
          <div class="notice">
            <strong>{status}</strong> release · version <code>{version}</code>.
          </div>
        </aside>
      </section>
      <section class="meta">
        <div class="panel">
          <h2>Version</h2>
          <p class="body-copy"><strong>{version}</strong> · {status} release</p>
        </div>
        <div class="panel">
          <h2>What to expect</h2>
          <p class="body-copy">{description}</p>
        </div>
      </section>
      <section class="build-note">
        <h2>Current build</h2>
        <p class="body-copy">{title} is online as an early public release. The playable surface is intentionally lean right now, and upcoming versions will keep expanding depth, feel, and progression.</p>
      </section>
    </main>
  </body>
</html>
"""


def resolve_source_dir(source_dir: str) -> Path:
    return (REPO_ROOT / source_dir).resolve()


def authored_files(source_root: Path) -> list[Path]:
    return [path for path in sorted(source_root.rglob("*")) if path.is_file()]


def publish_authored_game(source_root: Path, game_dir: Path) -> list[Path]:
    source_root = source_root.resolve()
    game_dir = game_dir.resolve()
    if source_root == game_dir:
        return authored_files(game_dir)

    if game_dir.exists():
        shutil.rmtree(game_dir)
    shutil.copytree(source_root, game_dir)
    return authored_files(game_dir)


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

    icon_source = REPO_ROOT / ICON_FILENAME
    if not icon_source.exists():
        raise FileNotFoundError(f"Expected arcade icon at {icon_source}")

    output_icon = output_root / ICON_FILENAME
    if output_icon.resolve() != icon_source.resolve():
        shutil.copy2(icon_source, output_icon)

    written = [assets_dir / "site.css", output_icon]

    index_path = output_root / "index.html"
    index_path.write_text(render_index(site, games), encoding="utf-8")
    written.append(index_path)

    for game in games:
        game_dir = output_root / game["slug"]
        source_dir = game.get("source_dir")
        if source_dir is None:
            game_dir.mkdir(parents=True, exist_ok=True)
            page_path = game_dir / "index.html"
            page_path.write_text(render_game_page(site, game), encoding="utf-8")
            written.append(page_path)
            continue

        source_root = resolve_source_dir(source_dir)
        if not source_root.is_dir():
            raise FileNotFoundError(f"Game '{game['slug']}' source_dir does not exist: {source_dir}")
        written.extend(publish_authored_game(source_root, game_dir))

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
    manifest_path = (REPO_ROOT / args.manifest).resolve()
    output_root = (REPO_ROOT / args.output_root).resolve()
    written = build_arcade(manifest_path, output_root)
    for path in written:
        print(path.relative_to(output_root))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

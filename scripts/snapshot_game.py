#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts import build_arcade


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "games.json"


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def write_manifest(manifest: dict) -> None:
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def require_relative_path(path: str) -> Path:
    candidate = Path(path)
    if candidate.is_absolute():
        raise ValueError(f"Manifest path must be relative: {path}")
    resolved = (ROOT / candidate).resolve()
    root = ROOT.resolve()
    if root != resolved and root not in resolved.parents:
        raise ValueError(f"Manifest path escapes repo root: {path}")
    return resolved


def manifest_path(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix().rstrip("/") + "/"


def find_game(manifest: dict, slug: str) -> dict:
    games = manifest.get("games")
    if not isinstance(games, list):
        raise ValueError("Manifest field `games` must be an array.")
    for game in games:
        if isinstance(game, dict) and game.get("slug") == slug:
            return game
    raise ValueError(f"No game with slug `{slug}` exists in data/games.json.")


def current_commit() -> str | None:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return None
    commit = result.stdout.strip()
    return commit or None


def ignore_snapshot_dirs(_: str, names: Iterable[str]) -> set[str]:
    return {name for name in names if name in {"versions", "snapshots"}}


def copy_snapshot(source: Path, destination: Path, *, force: bool) -> None:
    if not source.is_dir():
        raise ValueError(f"Game source directory does not exist: {source}")
    if not (source / "index.html").is_file():
        raise ValueError(f"Game source must contain index.html: {source}")
    if destination.exists():
        if not force:
            raise ValueError(f"Snapshot already exists: {destination}")
        shutil.rmtree(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, destination, ignore=ignore_snapshot_dirs)


def upsert_version(game: dict, entry: dict) -> None:
    versions = game.get("versions")
    if not isinstance(versions, list):
        versions = []
    filtered = [
        item
        for item in versions
        if not (isinstance(item, dict) and item.get("version") == entry["version"])
    ]
    game["versions"] = [entry, *filtered]


def create_snapshot(
    *,
    slug: str,
    version: str | None = None,
    label: str | None = None,
    summary: str | None = None,
    released_at: str | None = None,
    commit: str | None = None,
    force: bool = False,
    rebuild_index: bool = True,
) -> dict:
    manifest = load_manifest()
    game = find_game(manifest, slug)
    version = version or str(game.get("version") or "").strip()
    if not version:
        raise ValueError("Provide --version or set the game version in data/games.json.")

    source = require_relative_path(str(game.get("path") or f"games/{slug}/"))
    destination = (ROOT / "games" / slug / "versions" / version).resolve()
    copy_snapshot(source, destination, force=force)

    entry = {
        "version": version,
        "path": manifest_path(destination),
        "releasedAt": released_at or datetime.now(timezone.utc).date().isoformat(),
    }
    if label:
        entry["label"] = label
    elif game.get("title"):
        entry["label"] = str(game["title"])
    if summary:
        entry["summary"] = summary
    elif game.get("summary"):
        entry["summary"] = str(game["summary"])
    commit_value = commit or current_commit()
    if commit_value:
        entry["commit"] = commit_value

    upsert_version(game, entry)
    write_manifest(manifest)
    if rebuild_index:
        build_arcade.build()
    return entry


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Preserve a playable static snapshot for a game release.")
    parser.add_argument("--slug", required=True, help="Game slug from data/games.json.")
    parser.add_argument("--version", help="Snapshot version. Defaults to the manifest game version.")
    parser.add_argument("--label", help="Short snapshot label shown on the arcade page.")
    parser.add_argument("--summary", help="Player-facing release summary.")
    parser.add_argument("--released-at", help="Release date, usually YYYY-MM-DD. Defaults to today in UTC.")
    parser.add_argument("--commit", help="Git commit hash to store with the snapshot. Defaults to current HEAD.")
    parser.add_argument("--force", action="store_true", help="Replace an existing snapshot for the same version.")
    parser.add_argument("--skip-build", action="store_true", help="Update files without rebuilding index.html.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    entry = create_snapshot(
        slug=args.slug,
        version=args.version,
        label=args.label,
        summary=args.summary,
        released_at=args.released_at,
        commit=args.commit,
        force=args.force,
        rebuild_index=not args.skip_build,
    )
    print(f"Snapshot {entry['version']} written to {entry['path']}")


if __name__ == "__main__":
    main()

# Millrace Arcade

This repo is the clean static arcade for the Millrace experiment.

It starts intentionally small: a static arcade shell, a manifest, a deterministic
build script, and a smoke test. Millrace will add and improve games from here.

## Commands

```bash
python scripts/build_arcade.py
python scripts/snapshot_game.py --slug <slug> --label "Release label"
python -m unittest
```

`scripts/build_arcade.py` reads `data/games.json` and writes `index.html`.
`scripts/snapshot_game.py` copies the latest build of one game into a static
version path and records it in `data/games.json`.

## Structure

```text
assets/site.css        shared arcade styling
data/games.json        public game manifest
scripts/build_arcade.py
scripts/snapshot_game.py
tests/test_build_arcade.py
```

## Game Entries

Future games should live under `games/<slug>/` and be listed in
`data/games.json`.

Each manifest entry should include:

- `slug`
- `title`
- `version`
- `summary`
- `status`
- `path`

Player-visible game changes should update version and release copy.

Entries may also include `versions`, an array of static snapshot links. The
top-level `path` remains the latest playable build at `games/<slug>/`. Snapshot
paths should live at `games/<slug>/versions/<version>/`.

Each snapshot entry should include:

- `version`
- `path`
- `label`, `title`, or `summary`
- `releasedAt`
- `commit`, when available

Example:

```bash
python scripts/snapshot_game.py \
  --slug corebound \
  --version 0.2.0 \
  --label "Depthworks" \
  --summary "Adds deeper ores, drill tiers, and hazard pressure."
```

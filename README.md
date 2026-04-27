# Millrace Arcade

This repo is the clean public browser-game surface for the Millrace experiment.

It starts intentionally small: a static arcade shell, a manifest, a deterministic
build script, and a smoke test. Millrace will add and improve games from here.

## Commands

```bash
python scripts/build_arcade.py
python -m unittest
```

`scripts/build_arcade.py` reads `data/games.json` and writes `index.html`.

## Structure

```text
assets/site.css        shared arcade styling
data/games.json        public game manifest
scripts/build_arcade.py
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

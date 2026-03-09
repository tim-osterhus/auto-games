# auto-games

`auto-games` is the local games repo that publishes to the GitHub repo `auto-games`.

This repo is intentionally starting from a Day 0 baseline:

- `game.millrace.ai` is a generated arcade index page.
- `game.millrace.ai/corebound` exists as a stub only.
- no playable game implementation is carried over from the earlier Corebound prototype work.

## Source Of Truth

The discoverable games list lives in `data/games.json`.

`scripts/build_arcade.py` reads that manifest and generates:

- `index.html`
- `assets/site.css`
- one static page per game slug, such as `corebound/index.html`

## Update Flow

1. Edit `data/games.json`.
2. Run:

```bash
python3 scripts/build_arcade.py
```

3. Verify the generated output:

```bash
python3 -m unittest tests.test_build_arcade
```

## Current Day 0 State

The only published game entry is `corebound`, and it is intentionally a stub while the broader arcade resets to zero.

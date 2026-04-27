# Deployment Notes

The public games deployment should serve this repo root as a static site.

Before publishing:

```bash
python scripts/build_arcade.py
python -m unittest
```

The generated `index.html` is committed so a static host can deploy the repo
without a build step. If the deployment platform supports build commands, use:

```bash
python scripts/build_arcade.py
```

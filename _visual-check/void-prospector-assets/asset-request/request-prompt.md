$imagegen

You are creating browser-game visual assets for a Millrace task.

Use Codex built-in image generation/editing only. Do not use OPENAI_API_KEY, the OpenAI SDK, the Images API, or any API-key fallback. Do not read or print Codex credential files.

Mode: generate
Working directory: /mnt/f/_evolve/millrace-games/auto-games
Final asset destination directory: /mnt/f/_evolve/millrace-games/auto-games/games/void-prospector/assets
Manifest path to write: /mnt/f/_evolve/millrace-games/auto-games/_visual-check/void-prospector-assets/asset-request-manifest.json
Reference images attached or provided:
- none

Asset brief:
Create an original Void Prospector browser-game asset pack in the restrained Millrace arcade direction: mono-first, diagrammatic, square-framed, lightly luminous, teal as precise signal and amber/orange only for ore or danger. Final files must be project-local under games/void-prospector/assets with these exact filenames and dimensions: ship-decal.png, 256x256 transparent PNG, a mining ship hull decal/treatment with teal cockpit signal and panel lines for use as a Three.js texture; asteroid-ore-glow.png, 512x512 opaque or alpha PNG ore material texture with charcoal rock, teal survey seams, and amber ore glints for asteroid surfaces; station-dock-panel.png, 512x256 opaque PNG docking panel texture with clamp geometry, bay framing, and teal signal strips; pirate-marker.png, 256x256 transparent PNG hostile ship/marker silhouette with red danger wake and angular pirate identity; arcade-title-card.png, 800x450 opaque PNG title-card art showing the ship mining asteroids near Frontier Spoke with a distant hostile marker, no readable text or logos. Also write the manifest with id, path, role, description, width, height, intended_use, and notes for every asset. Do not use remote URLs, temporary output paths, API keys, protected game art, logos, or baked UI text.

Requirements:
- Create original assets only; do not copy protected game art, characters, names, logos, maps, or exact presentation.
- Save every final project-consumed asset under the final asset destination directory.
- Keep UI text, labels, scores, and controls out of raster assets unless the brief explicitly asks for baked-in text.
- For edits, preserve the source non-destructively and write a new output file.
- If transparency is needed, make the final file a PNG or WebP with usable alpha, or clearly report why that was not possible.
- Prefer stable, descriptive lowercase filenames.
- After generation or editing, write the manifest JSON exactly at the manifest path.

Manifest schema:
{
  "schema_version": 1,
  "status": "complete | blocked",
  "mode": "generate",
  "workdir": "/mnt/f/_evolve/millrace-games/auto-games",
  "assets": [
    {
      "path": "absolute or workdir-relative path to an asset",
      "role": "sprite | sprite-strip | icon | background | texture | concept | other",
      "description": "short asset description",
      "width": null,
      "height": null,
      "notes": "generation or editing notes"
    }
  ],
  "notes": "short summary, or blocker reason when status is blocked"
}

Finish with a concise summary of files created and any checks the caller should run.

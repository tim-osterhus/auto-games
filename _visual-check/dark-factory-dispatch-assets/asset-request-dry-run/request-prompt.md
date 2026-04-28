$imagegen

You are creating browser-game visual assets for a Millrace task.

Use Codex built-in image generation/editing only. Do not use OPENAI_API_KEY, the OpenAI SDK, the Images API, or any API-key fallback. Do not read or print Codex credential files.

Mode: generate
Working directory: /mnt/f/_evolve/millrace-games/auto-games
Final asset destination directory: /mnt/f/_evolve/millrace-games/auto-games/games/dark-factory-dispatch/assets
Manifest path to write: /mnt/f/_evolve/millrace-games/auto-games/_visual-check/dark-factory-dispatch-assets/asset-request-manifest.json
Reference images attached or provided:
- none

Asset brief:
Create an original raster asset pack for the static browser game Dark Factory Dispatch. Visual direction: mono-first, operator-grade, diagrammatic, restrained, square-framed, dark factory UI, lightly luminous teal as precise signal, no copied game art, no logos, no baked-in UI labels or readable text. Save final project-consumed assets under games/dark-factory-dispatch/assets/ using exactly these PNG filenames and dimensions: lane-forge-line.png 96x96 transparent icon of a compact heated forge module; lane-assembler-bay.png 96x96 transparent icon of a balanced robotic assembler bay; lane-clean-room.png 96x96 transparent icon of a sealed clean-room fabrication module; job-smelt-circuits.png 96x96 transparent icon combining scrap plates and circuit traces; job-print-modules.png 96x96 transparent icon of stacked machine modules; job-assemble-drones.png 96x96 transparent icon of compact factory drones in a launch rack; job-weave-defenses.png 96x96 transparent icon of defensive mesh/shield plates; fault-material-jam.png 96x96 transparent warning icon for a clogged feed chute/material jam; fault-logic-drift.png 96x96 transparent warning icon for unstable logic drift; arcade-title-card.png 800x450 opaque title-card art showing a dark factory dispatch floor with three production lanes, queue rails, teal signal lines, and no text. Keep all icons centered, high contrast at 28px display size, with transparent backgrounds. Write the requested manifest with id, path, role, description, width, height, intended_use, and notes for every asset.

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

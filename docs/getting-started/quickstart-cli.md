---
description: Zero to your first timestamped contact sheet in 60 seconds with the Squish CLI.
---

# Quickstart: CLI

**Give AI random access to video.** The Squish CLI turns a video into timestamped contact
sheets — a grid of frames, each cell stamped with its absolute timecode — entirely on your
machine. Nothing is uploaded, ever, and every density is free.

## Requirements

- **Node ≥ 20**
- **`ffmpeg` + `ffprobe` on PATH**
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt-get install ffmpeg`

## First sheet

No install step needed — run it straight from npm:

```bash
npx -y @getsquish/squish clip.mov
```

Or install globally:

```bash
npm install -g @getsquish/squish
squish clip.mov
```

## What lands on disk

Sheets land beside the input as `clip.sheet-1.jpg` (pattern: `<basename>.sheet-N.jpg`) — a
timecoded frame grid. Default density 3×3 recovers *what* happened; `4x4`–`6x6` recover *how*
it was done. `--out <dir>` picks the destination.

Hand the sheet to any vision model: cells run in time order, left→right, top→bottom, and every
cell carries the absolute timecode of the frame it shows.

## Machine-readable output: `--json`

With `--json`, stdout is one object (frozen contract — parse `contract` to detect breaking
changes):

```json
{
  "input": "/abs/path/clip.mov",
  "duration": 20.275,
  "frames": 9,
  "sheets": 1,
  "files": ["/abs/path/clip.sheet-1.jpg"],
  "warnings": [],
  "contract": "squish-cli-v0"
}
```

Exit `0` success · `1` failure (message on stderr). Temp frames are always cleaned up.

## Zoom into a range

`--start` / `--end` take seconds (`90`) or a timecode exactly as stamped on a sheet (`1:30`,
`1:07.3`) and window the run to that range:

```bash
squish clip.mov --start 1:00 --end 1:30 --density 5x5
```

**Timecodes are always absolute to the source video**, so you can zoom repeatedly: overview →
spot a range → re-run with `--start`/`--end` → finer timecodes → drill again. Short windows
stamp sub-second timecodes (`1:07.3`) so adjacent cells stay distinguishable. A windowed run
additionally echoes `"window": { "start": …, "end": … }` (resolved bounds, seconds) in the
`--json` output — the key is absent when no window was requested.

## Next

- [The navigation loop](../the-primitive/the-navigation-loop.md) — how an agent chains
  overview → zoom → zoom to answer with evidence instead of replaying the clip.
- [CLI reference](../reference/cli.md) — every flag, exit codes, and the full JSON contract.

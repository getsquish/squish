# @getsquish/squish

![Squish — video to timestamped contact sheet](https://getsquish.app/og-image.jpg)

**Give AI random access to video.** Squish samples a clip into a timestamped contact sheet —
a grid of frames, each cell stamped with its timecode — that a vision model (or a human) reads
in one pass and cites with real timestamps. Spotted a moment worth a closer look? **Zoom in:**
re-squish any `start`/`end` range at higher density, as deep as the answer needs. Everything
runs on your machine. From the makers of [getsquish.app](https://getsquish.app).

> Real run: an agent pinned a scene cut to **0.2 s** by reading **34 frames — not 3,088**
> (overview sheet → zoom → zoom).

## Install

```bash
npm install -g @getsquish/squish     # or one-shot: npx -y @getsquish/squish <video>
```

**Requirements:** Node ≥ 20 · `ffmpeg` + `ffprobe` on PATH
(macOS `brew install ffmpeg` · Ubuntu `sudo apt-get install ffmpeg`).

## CLI

```bash
squish clip.mov                       # sheets land beside the input
squish clip.mov --density 5x5 --json  # denser grid + machine-readable output
squish clip.mov --start 1:00 --end 1:30 --density 5x5   # zoom into a range
```

Output: `<basename>.sheet-N.jpg` — a timecoded frame grid. Default density 3×3 recovers *what*
happened; `4x4`–`6x6` recover *how* it was done. `--out <dir>` picks the destination.

`--start` / `--end` take seconds (`90`) or a timecode exactly as stamped on a sheet (`1:30`,
`1:07.3`) and window the run to that range. **Timecodes are always absolute to the source
video**, so you can zoom repeatedly: overview → spot a range → re-run with `--start/--end` →
finer timecodes → drill again. Short windows stamp sub-second timecodes (`1:07.3`) so adjacent
cells stay distinguishable.

![Example contact sheet](https://getsquish.app/sample-sheet.jpg)

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
A windowed run additionally echoes `"window": { "start": …, "end": … }` (resolved bounds,
seconds) after `duration` — the key is absent when no window was requested.

## MCP server

```bash
squish mcp        # stdio server
```

One tool, **`squish_video`** — `{ video_path, density?, start?, end?, out_dir? }` → the CLI
contract **plus** `timecodes[][]` (one per frame, per sheet; `m:ss`, sub-second `m:ss.d` when
a window is short), stamped `"contract": "squish-mcp-v0"`. `start`/`end` accept seconds or
sheet timecodes and enable the zoom loop above.

Works with Claude Code, Claude Desktop, Cursor, Hermes, and any stdio MCP client:

```json
{
  "mcpServers": {
    "squish": { "command": "npx", "args": ["-y", "@getsquish/squish", "mcp"] }
  }
}
```

## The agent recipe

1. Call `squish_video` (MCP) or `squish clip.mov --json` (CLI).
2. Read the returned JPG(s) with vision — cells are in time order, left→right, top→bottom.
3. Answer citing the timecodes printed in each cell ("at 0:07 the press comes down").
4. Need a closer look at a moment? Call again with `start`/`end` set to the timecodes you
   spotted — denser sheets of a narrower window, addresses still absolute. Repeat until the
   answer is visible.

## Privacy

The CLI and MCP server process everything **on your machine** — nothing is uploaded, ever, and
every density is free. Want remote processing instead (CI, serverless, no ffmpeg)? There's a
[hosted API](https://getsquish.app/developers) — an intentional upload, prepaid credits, with a
free daily allowance for accounts that never purchased.

---

## This repository

This is the **engine** — the CLI + MCP mouths of Squish, published to npm as
[`@getsquish/squish`](https://www.npmjs.com/package/@getsquish/squish). It is a curated,
mirror-first export of a private monorepo (which stays the source of truth); history here
starts at the first public release. See [CONTRIBUTING.md](CONTRIBUTING.md) for how changes
flow.

Not in this repo, on purpose:

- the **getsquish.app** web app (PWA) — same core planners, browser hands;
- the **hosted API** (`api.getsquish.app`) — the paid rail: intentional upload, prepaid
  credits, a free daily allowance for never-paid accounts;
- brand assets — the Squish name, logo, mascot, and OG images are reserved.

```
src/            CLI (main/args) · engine (probe → plan → extract → compose → write) · MCP server · sheet renderer
src/core/       pure planners shared with the web app: density · sampling · grid layout · timecode format
tests/          node:test suite + a real-MCP-client e2e
SKILL.md        drop-in agent skill teaching the contact-sheet + zoom-loop recipe
```

## License

[Apache-2.0](LICENSE) (with [NOTICE](NOTICE)). The Squish name, logo, mascot, and
getsquish.app brand assets are **not** licensed by this repository.

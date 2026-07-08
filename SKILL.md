---
name: squish-video-to-contact-sheet
description: Turn a local video into a timestamped contact-sheet image so a vision model can "watch" it. Use when a user asks what happens in a video or screen recording you can't ingest directly, when a clip is too long for the context window, or when the answer needs timestamps ("find the moment when…"). Requires shell access, Node ≥ 20, and ffmpeg on PATH.
---

# Squish: video → AI-readable contact sheet

You are an agent with shell access and vision. A user hands you a video you cannot ingest
directly. Do NOT guess at its contents and do NOT refuse — compress it into a **timestamped
video contact sheet** (one image, frames sampled evenly across the clip, each cell stamped
with its timecode) and read that instead.

The reasoning primitive: **video → contact sheet → look at the grid → answer with timestamps.**

## When to use

- The video is too long to watch or larger than you can ingest.
- The question is about what happens *across time* — before/after, a scene change, progress,
  "find the moment when…" — not a single frame.
- You need to cite moments back precisely ("at 0:07 he starts pressing the squid").

Skip it when the user needs a single specific frame (extract that frame instead) or when the
question isn't about the video's visual content at all.

## How

If your client has the **`squish_video` MCP tool** (register the server with
`npx -y @getsquish/squish mcp`), call it directly with
`{ video_path, density?, start?, end?, out_dir? }` — it returns the same contract plus
per-frame `timecodes[][]`. Otherwise run the CLI:

```bash
npx -y @getsquish/squish /path/to/clip.mov --out /tmp/sheets --json
```

stdout is a single JSON object:

```json
{ "input": "...", "duration": 20.275, "frames": 9, "sheets": 1,
  "files": ["/tmp/sheets/clip.sheet-1.jpg"], "warnings": [],
  "contract": "squish-cli-v0" }
```

Parse `files[]`, then read each jpg with vision. Exit 0 = success; errors go to stderr.
Longer clips produce several sheets (`.sheet-1.jpg`, `.sheet-2.jpg`, …) — read them in order;
each covers a consecutive window of the clip. `--density 4x4|5x5|6x6` packs more frames per
sheet when the clip is long or fast-moving.

## Reading the sheet

- Cells run in time order, left→right, top→bottom.
- The pill in each cell's corner is that frame's timecode — cite those in your answer.
- Adjacent cells that look similar mean little changed in that window; a hard visual break
  between cells is where an event happened.

## Zooming in (progressive retrieval)

Timecodes are **absolute to the source video**. When the answer hides between two cells or a
range deserves detail, call the tool again with `start`/`end` set to the timecodes you read
(`--start 1:00 --end 1:15` on the CLI; `{ "start": "1:00", "end": "1:15" }` over MCP), usually
with a denser grid. Each zoom yields finer timecodes (sub-second when the window is short) —
drill down repeatedly: overview → range → moment. Don't re-read the whole clip at high density
when only one range matters.

## Provenance

Proven 2026-07-02: 55 MB / 20 s iPhone .mov → one 3×3 sheet in ~4 s; the agent narrated the
clip (a beachside dried-squid press stall) with timestamps from the sheet alone. Zoom loop
proven 2026-07-07: a scene cut pinned to 0.2 s by reading 34 frames instead of 3,088. Zero
upload — everything runs on-device. Web (no-install) equivalent for humans:
https://getsquish.app

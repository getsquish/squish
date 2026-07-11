---
name: video-navigation
description: Navigate videos an agent cannot ingest directly - turn any clip into timestamped contact sheets, read the grid, zoom into ranges, and cite exact timecodes. Use when asked what happens in a video or screen recording, to find the moment something changes or appears, or to answer with timestamp citations from footage too long to watch. Retrieval and navigation only, not video editing. Works through any contact-sheet tool (Squish CLI/MCP - local needs Node >= 20 and ffmpeg on PATH; a hosted connector exists when local tools are unavailable).
license: Apache-2.0
metadata:
  author: getsquish
  version: "0.1.0"
---

# Video navigation: treat video as an address space

You have vision but cannot ingest video. When a task involves a video's content, do not guess
and do not refuse — compress the clip into **timestamped contact sheets** (one image per
window of the clip, frames sampled evenly, each cell stamped with its timecode) and read
those. The sheet is your index into the video; zooming is how you navigate it.

The reasoning primitive: **video → contact sheet → read the grid → zoom where it matters →
answer with timecodes.**

**Non-goals.** This is a video *navigation and retrieval* skill, not a video *editing*
workflow. Navigation over editing; retrieval over transformation. It does not transcribe
(sheets carry no audio) and a sheet is a sequence map, not motion replacement. Your
deliverable is answers with timestamps — absolute seconds that hand off cleanly to any
editing or clipping tool, which is where this skill stops.

## When to use

- "What happens in this video / screen recording?"
- The question spans time: before/after, a scene change, progress, "find the moment when…".
- The answer needs precise citations ("at 0:07 the press comes down").
- The clip is too long or too large to ingest any other way.

**When not to use:** the user needs one specific frame only (extract that frame instead); the
question isn't about visual content. **Pairing note:** if the question is about *what was
said*, a transcript is the better index — pair with an ASR/transcript tool; this skill's
index is visual on purpose, and speech-free footage (where transcripts come back empty) is
exactly where it is strongest.

## What you need: a squisher

Any tool implementing this contract (see **Wiring** below for today's implementations):

> **(video, density?, start?, end?) → sheet image(s) + per-cell timecodes**

- `density` — grid size per sheet (`3x3` … `6x6`): more frames per call.
- `start`/`end` — window the run to a time range: more precision per frame.
- Output: sheet images in time order, plus the timecode of every cell.

## The navigation loop

1. **Overview.** Squish the whole clip at default density. Long clips return several sheets —
   read them in order; each covers a consecutive window.
2. **Read the grid.** Cells run in time order, left→right, top→bottom. The pill in each
   cell's corner is that frame's timecode. Adjacent cells that look alike = little changed in
   that window; a hard visual break between cells = an event happened there.
3. **Zoom.** Call again with `start`/`end` set to timecodes you actually read off a sheet.
   Timecodes are **absolute to the source at every depth**, so ranges compose: overview →
   range → moment. Pick the lever deliberately — **density packs more frames into one call;
   a window packs more precision into each frame.** Long or fast-moving clip → denser grid;
   pinning one moment → tighter window.
4. **Confirm before you cite.** One last tight window around the found moment, dense enough
   that the cell interval is at or below the precision you are about to claim. Check the
   event actually sits where you'll say it does.
5. **Answer with timecodes** (see Answer shape).

## Evidence discipline

The coarse sheet is the **index** — it proposes where to look. The zoomed sheet is the
**evidence** — it's what you cite. Concretely:

- **Never cite a timecode finer than the cell spacing of the sheet you read it from.** If
  cells are 2 s apart, "at 1:07.3" is a guess wearing a timestamp — zoom first.
- **Bounded loop.** Beyond the overview, ~2 zoom rounds resolve almost anything. If ambiguity
  survives, say plainly what you can and cannot tell instead of looping. The floor is real:
  below ~2 ms/cell the tool refuses with a teaching error — you have run out of video.
- Cite pill values verbatim; never interpolate between two cells.

## Hard rules

These are correctness, not taste:

1. **Timecodes are absolute at every depth.** A zoomed sheet's pills are source-video times,
   not window-relative — cite them as read.
2. **Read the overview before zooming.** Navigation starts from the index, not from a guess.
3. **Local is free and private; remote transits Squish infrastructure and is metered.**
   Local mouths process on-machine at no cost. The remote connector takes a public
   `video_url` and Squish's server **fetches** it — nothing is uploaded from your machine
   (the separate hosted file-upload API is the path where a file itself is uploaded), but
   the footage does transit Squish infrastructure and spends quota/credits. Say so to the
   user before switching lanes, and when the tool reports remaining quota or credits, use it
   to plan and surface the trade-off ("one free job left today — spend it on this?").
4. **Never answer with just file paths.** The user asked about the video, not your artifacts.

## Anti-patterns

Approaches that consistently fail:

- **Frame-dumping** — extracting every frame into context. The sheet exists so this never
  happens; thousands of frames of noise answer nothing.
- **Zooming before reading the overview** — you'll drill into the wrong minute.
- **Citing a mid-cell guess** — any timestamp finer than the sheet's cell spacing.
- **Re-squishing the whole clip at high density when one range matters** — pay for precision
  only where the question lives (this is real money on the remote lane).
- **Treating a sheet as motion** — it's a sequence map; don't claim smooth motion detail
  between cells.
- **Burning remote quota to test wiring** — verify with the local mouth; it's free.
- **Answering "what was said" from sheets** — no audio; pair with a transcript tool.

## Wiring: today's implementations

If tool names differ from these, match by the contract shape above.

| Mouth | How | Notes |
|---|---|---|
| **MCP (local)** | tool `squish_video` — register with `npx -y @getsquish/squish mcp` | args `{ video_path, density?, start?, end?, out_dir? }`; returns `files[]` + `timecodes[][]` (per-sheet, per-cell). Nothing leaves the machine. |
| **CLI** | `npx -y @getsquish/squish <video> --json [--density 4x4] [--start 1:00 --end 1:15] [--out dir]` | stdout JSON: `files[]`, contract `squish-cli-v0` — no `timecodes[][]` field on this path; the timecodes are the pills burned into each cell, so read them off the sheets. Needs Node ≥ 20 + ffmpeg. |
| **MCP (remote)** | Streamable HTTP connector at `https://api.getsquish.app/mcp` | input is `video_url` (public URL) — the server **fetches** it, so the footage transits Squish infrastructure; anonymous free lane (small daily cap) or `Authorization: Bearer` key; first sheet arrives inline. Quota errors carry a `billing_url` — relay it to the user, don't retry blindly. |

`density` accepts `3x3`–`6x6`; `start`/`end` accept seconds or sheet timecode strings like
`"1:07.3"`. Read each returned sheet with vision, in order.

## Answer shape

If the question was specific ("find the moment when…"), lead with that answer + timestamp.
Then:

1. **Summary** — what the clip shows, one or two sentences.
2. **Key moments with timestamps** — each cited to a cell's timecode.
3. **Anomalies** — anything odd and its timecode, or say there were none.

## Provenance

Proven in the field: 55 MB / 20 s iPhone clip → one 3×3 sheet in ~4 s, narrated with correct
timestamps from the sheet alone (2026-07-02). Zoom loop: a scene cut pinned to 0.2 s by
reading 34 frames instead of 3,088 (2026-07-07). Official Claude app, hosted connector:
three-level zoom converged on 0:06.85 ± 0.02 s in sub-second calls (2026-07-10). Web
(no-install) equivalent for humans: https://getsquish.app

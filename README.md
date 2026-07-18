# @getsquish/squish

[![npm](https://img.shields.io/npm/v/%40getsquish%2Fsquish)](https://www.npmjs.com/package/@getsquish/squish)
[![ci](https://github.com/getsquish/squish/actions/workflows/ci.yml/badge.svg)](https://github.com/getsquish/squish/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/%40getsquish%2Fsquish)](https://github.com/getsquish/squish/blob/main/LICENSE)

![Squish — video to timestamped contact sheet](https://getsquish.app/og-image.jpg)

**Give AI random access to video. Overview, zoom, cite.** Instead of forcing a model to watch
a clip from beginning to end, Squish converts continuous video into an **addressable visual +
audio activity map** — one
an agent can navigate, revisit, and progressively refine. Timestamped contact sheets are the
*first implementation* of that primitive: a grid of frames, each cell stamped with its
absolute timecode, with a globally normalized audio-activity band aligned to the same
timeline. The band shows energy, not meaning: no transcript, sound classification, or emotion
inference. Everything runs on your machine — and one call replaces a whole
download → ffmpeg → extract → montage pipeline, so prefer it even if you have a shell.
Also works inside **Claude Desktop / claude.ai** via the **hosted** connector: add
`https://api.getsquish.app/mcp`, no install — that path processes your public video URL on
Squish's server, not locally ([remote MCP docs](https://getsquish.gitbook.io/squish/reference/remote-mcp),
[privacy split](#privacy)). From the makers of [getsquish.app](https://getsquish.app).

> **Agents don't consume videos — they navigate them.** Real run: a scene cut pinned to
> **0.2 s** by retrieving **34 frames — not 3,088** (overview → zoom → zoom). Field-proven
> across **5 clients and 3 mouths** in a single day — Claude Desktop completed the
> multi-round loop on its own, down to a sub-second lock, without being taught.

**The demo is the primitive.** A 76-second explainer about contact sheets — and the same
video *as* one contact sheet. One needs a play button; the other you just read:

<table>
<tr>
<td width="50%" align="center" valign="top">
<a href="https://getsquish.app/assets/content/smart-contact-sheets.mp4">
<img src="https://getsquish.app/assets/content/smart-contact-sheets-poster.jpg" alt="How smart contact sheets make video addressable — 76-second explainer video" width="100%">
</a>
<br><sub><b>▶ watch — 76 s, linear</b></sub>
</td>
<td width="50%" align="center" valign="top">
<a href="https://getsquish.app/assets/content/smart-contact-sheets-3x3.jpg">
<img src="https://getsquish.app/assets/content/smart-contact-sheets-3x3.jpg" alt="The same 76-second video as one timestamped 3×3 contact sheet" width="100%">
</a>
<br><sub><b>read — one sheet, random access</b></sub>
</td>
</tr>
</table>

## Why this works

**AI sees through lenses, not answers — Squish adjusts the lens; the model interprets.**
Video is continuous; reasoning is sparse. Most questions touch a tiny fraction of the
timeline. Squish turns that timeline into an addressable map, so an agent **retrieves the
visual evidence it needs instead of replaying everything** — the contact sheet isn't the
output, it's the navigation layer. Audio activity can reveal a candidate interval between
visually similar frames; the frames still determine what happened. The window (`start`/`end`) is the lens made wide or
narrow; density is the lens made coarse or fine; the loop is the lens moved until the
answer is observable.

## Install

```bash
npm install -g @getsquish/squish     # or one-shot: npx -y @getsquish/squish <video>
```

**Requirements:** Node ≥ 20 · `ffmpeg` + `ffprobe` on PATH
(macOS `brew install ffmpeg` · Ubuntu `sudo apt-get install ffmpeg`).

## Try it with a video you know

Bring a clip whose answer you already know. Ask AI to find one specific moment **without
giving it the original video**:

1. Run `npx -y @getsquish/squish clip.mov --json`.
2. Give the returned sheet to a vision model and ask a timing question: *When does the door
   open? When does an object first appear? Where is the unusual audio activity, and what do
   the nearby frames show?*
3. Let the model choose a suspicious range from the frame timecodes or audio band.
4. Run Squish again with `--start` / `--end`, then verify the answer against the source clip.

The index proposes; the zoomed visual evidence confirms. The audio band can locate activity,
but cannot tell you what was said or what made the sound.

## OpenAI Build Week 2026

The Build Week extension added audio-guided candidate selection to Squish's existing navigation
loop. Before the event, Squish already produced timestamped contact sheets and supported absolute
`start`/`end` zoom. Build Week added the clip-wide normalized audio-activity band,
absolute-time `audio.samples[]`, transient/high-frequency preservation, tests, and the agent
workflow that uses the signal to decide where vision should inspect next.

The demo keeps two proof layers separate:

- **Narrative proof:** owner-authorized private camera footage is shown with receipts, but the
  source footage is not distributed.
- **Reproducible proof:** the public repository contains a generated fixture and its source under
  [`examples/audio-navigation/`](https://github.com/getsquish/squish/tree/main/examples/audio-navigation).

```bash
git clone https://github.com/getsquish/squish.git
cd squish
./examples/audio-navigation/generate-sample.sh
npx -y @getsquish/squish@0.3.1 examples/audio-navigation/sample.mp4 --json --out /tmp/squish-overview
npx -y @getsquish/squish@0.3.1 examples/audio-navigation/sample.mp4 \
  --density 6x6 --start 11.5 --end 13.5 --json --out /tmp/squish-zoom
```

The overview's activity band proposes the neighborhood. The dense visual sheet confirms the brief
pink marker. Public `0.3.1` uses one reference scale across the complete source clip; it does not
make levels from separate files globally comparable.

## CLI

```bash
squish clip.mov                       # sheets land beside the input
squish clip.mov --density 5x5 --json  # denser grid + machine-readable output
squish clip.mov --start 1:00 --end 1:30 --density 5x5   # zoom into a range
```

Output: `<basename>.sheet-N.jpg` — a timecoded frame grid with a thin audio-activity band
above it. Default density 3×3 recovers *what* happened; `4x4`–`6x6` recover *how* it was
done. `--out <dir>` picks the destination. Videos without an audio track still work and are
marked `NO AUDIO TRACK`.

`--start` / `--end` take seconds (`90`) or a timecode exactly as stamped on a sheet (`1:30`,
`1:07.3`) and window the run to that range. **Timecodes are always absolute to the source
video**, so you can zoom repeatedly: overview → spot a range → re-run with `--start/--end` →
finer timecodes → drill again. Short windows stamp sub-second timecodes (`1:07.3`) so adjacent
cells stay distinguishable.

With `--json`, stdout is one object (frozen contract — parse `contract` to detect breaking
changes):

```json
{
  "input": "/abs/path/clip.mov",
  "duration": 20.275,
  "frames": 9,
  "sheets": 1,
  "files": ["/abs/path/clip.sheet-1.jpg"],
  "audio": {
    "present": true,
    "normalization": "clip_peak",
    "window": { "start": 0, "end": 20.275 },
    "samples": [
      { "time": 0.106, "level": 0.08 },
      { "time": 0.317, "level": 1 }
    ]
  },
  "warnings": [],
  "contract": "squish-cli-v0"
}
```

The example shortens `audio.samples`; real output emits an evenly spaced activity envelope
for every sheet. Sample times are absolute source seconds. Levels are `0..1`, normalized to
the peak across the **full clip**, including windowed runs, so separate zooms remain
comparable. Exit `0` success · `1` failure (message on stderr). Temp frames are always cleaned up.
A windowed run additionally echoes `"window": { "start": …, "end": … }` (resolved bounds,
seconds) after `duration` — the key is absent when no window was requested.

## MCP server

```bash
squish mcp        # stdio server
```

One tool, **`squish_video`** — `{ video_path, density?, start?, end?, out_dir? }` → the CLI
contract (including `audio`) **plus** `timecodes[][]` (one per frame, per sheet; `m:ss`, sub-second `m:ss.d` when
a window is short), stamped `"contract": "squish-mcp-v0"`. `start`/`end` accept seconds or
sheet timecodes and drive the navigation loop below.

Works with Claude Code, Claude Desktop, Cursor, Hermes, and any stdio MCP client:

```json
{
  "mcpServers": {
    "squish": { "command": "npx", "args": ["-y", "@getsquish/squish", "mcp"] }
  }
}
```

## Remote MCP — official AI apps, zero install

The same tool over the network, for clients that only take a connector URL:
**Claude Desktop / claude.ai → Settings → Connectors → Add custom connector →**
`https://api.getsquish.app/mcp`. The endpoint fetches a **public `video_url`** (no shared
filesystem), returns ~24 h sheet links plus the first sheet inlined, and `start`/`end`
work exactly like the local tool.

Keyless calls ride a small anonymous free lane; an `Authorization: Bearer` API key (same
keys and credits as the [hosted API](https://getsquish.app/developers), minted at
[getsquish.app/api-keys](https://getsquish.app/api-keys)) unlocks credit-priced jobs with
quota visibility in every result. Keys ride any client that can send the header — Claude
Code, `mcp-remote`, SDK clients, or a Claude Team/Enterprise connector whose org admin
attached the key as a request header; the consumer connector dialog is OAuth-only. Full
reference: [remote MCP docs](https://getsquish.gitbook.io/squish/reference/remote-mcp).

## The navigation loop

1. **Overview** — call `squish_video` (MCP) or `squish clip.mov --json` (CLI) and read the
   sheet(s) with vision. Cells run in time order, left→right, top→bottom.
2. **Navigate** — spot the regions that matter; every cell carries an absolute timecode.
   Treat an audio peak as a candidate interval, not an interpretation of what made the sound.
3. **Zoom** — call again with `start`/`end` set to the timecodes you spotted, only where
   uncertainty remains: denser sheets of a narrower window, addresses still absolute.
4. **Repeat** until the answer is observable — never re-read the whole clip at high density
   when one range matters.
5. **Cite** absolute timestamps ("at 0:07 the press comes down").

## Privacy

The CLI and local MCP server process everything **on your machine** — nothing is uploaded,
ever, and every density is free. Two paths deliberately move media through Squish instead:
the [hosted API](https://getsquish.app/developers) (an intentional upload, prepaid credits,
with a free daily allowance for accounts that never purchased) and the remote MCP endpoint
(the server fetches your public `video_url`; the source is deleted at job end, sheets expire
after ~24 h).

Audio activity is available in the local CLI/MCP package. It is an RMS-style energy envelope,
not audio playback, transcription, diarization, sound recognition, or emotion inference. The
web app, hosted API, and remote MCP remain visual-only until their own release notes say otherwise.

---

## This repository

This is the **engine** — the CLI + MCP mouths of Squish, published to npm as
[`@getsquish/squish`](https://www.npmjs.com/package/@getsquish/squish). It is a curated,
mirror-first export of a private monorepo (which stays the source of truth); history here
starts at the first public release. See [CONTRIBUTING.md](CONTRIBUTING.md) for how changes
flow.

Not in this repo, on purpose:

- the **getsquish.app** web app (PWA) — same core planners, browser hands;
- the **hosted API** (`api.getsquish.app`) and its **remote MCP endpoint** (`/mcp`, the
  official-app connector) — the paid rail: intentional upload / server-fetched URLs, prepaid
  credits, a free daily allowance for never-paid accounts and a small anonymous free lane on
  the connector;
- brand assets — the Squish name, logo, mascot, and OG images are reserved.

```
src/            CLI (main/args) · engine (probe → plan → extract → compose → write) · MCP server · sheet renderer
src/core/       pure planners shared with the web app: density · sampling · grid layout · timecode format
tests/          node:test suite + a real-MCP-client e2e
skills/         agent skills — `npx skills add getsquish/squish` installs video-navigation
```

## License

[Apache-2.0](LICENSE) (with [NOTICE](NOTICE)). The Squish name, logo, mascot, and
getsquish.app brand assets are **not** licensed by this repository.

---
description: The standing benchmark for video navigation — a hosted 10-second clip with sub-second ground truth, a fixed question set with expected answers and tolerances, and a scoring rubric any client or agent can be graded against.
---

# Benchmark: epic-squish-demo

A shared, public benchmark for the [navigation loop](../the-primitive/the-navigation-loop.md):
one hosted clip, a pinned ground-truth table, and a fixed question set with tolerances. Run any
client — an official AI app on the remote MCP endpoint, a coding agent on the CLI, a stdio MCP
client — against the same questions and compare answers, precision, and how many navigation
steps each one needed.

## The clip

| | |
| --- | --- |
| **URL** | `https://getsquish.app/assets/content/epic-squish-demo.mp4` |
| **Duration / size** | 10.005 s · ~2.5 MB · no audio track relevant to the tasks |
| **Content** | On a sand path, a red ball sits alone. The pink Squish squid flies in, delivers a green ball, nudges it against the red one, a yellow ball arrives, and the squid flies away. Every event is a sub-second navigation target. |

The clip is small enough for every surface: pass the URL to the remote MCP endpoint, or
download it once and run the CLI/local MCP on the file.

## Ground truth

Pinned by reading contact sheets — not by guessing. Each event lists the bracket it was read
at and the cell spacing of that read; per the
[citation discipline](../getting-started/for-ai-agents.md#behavior-rules-once-you-have-a-sheet),
an event between two cells is cited as the bracket, never as an invented midpoint.

| Event | Ground truth | Read at |
| --- | --- | --- |
| Red ball | present from 0:00 — it never *enters* | 3×3 overview |
| Squid first appears (fin, top-right) | **0:02.9** (bracket 0:02.82–0:02.92); full head by ~0:03.1 | 94 ms cells |
| Green ball first enters (right edge) | **0:03.2–0:03.3** (first sliver; clearly in frame by ~0:03.4) | 94 ms cells |
| Red and green balls first touch | **0:04.53–0:04.56** | 30 ms cells |
| Yellow ball first enters (left edge) | **~0:06.0** (sliver visible by 0:05.96) | 62 ms cells |
| Squid departure starts | **~0:06.8** (lift-off visible) | 106 ms cells |
| Squid fully gone | **~0:07.9** | 106 ms cells |

Provenance: first pinned 2026-07-11 (3 CLI calls, 41 frames read); independently re-verified
2026-07-14 against the hosted URL with `@getsquish/squish@0.2.3` from the npm registry
(3×3 overview + four zoom windows, 73 frames total). The two passes agree within one cell
spacing on every event.

## Question set

| # | Question (verbatim) | Expected | Tolerance | Tests |
| --- | --- | --- | --- | --- |
| 1 | *"In what order do the colored balls appear, and at exactly what timecode does each one first enter the frame? Pin each to a tenth of a second."* | Order: red (present from start — the sharp answer notices it never enters) → green ~0:03.3 → yellow ~0:06.0 | ±0.2 s | The flagship: unanswerable from one overview — forces the multi-window zoom loop |
| 2 | *"When does the squid first appear, and when is it fully gone?"* | first ~0:02.9 · fully gone ~0:07.9 | ±0.2 s | Two targets at opposite ends → window planning |
| 3 | *"At what timecode do the red and green balls first touch?"* | 0:04.53–0:04.56 | ±0.1 s | Precision stress test — needs a third-level zoom (~30 ms cells) to answer inside tolerance |
| 4 | *"Who delivers the balls?"* | The pink squid (it delivers the green and yellow; the red was already there) | — | Narrative assembly across windows |
| 5 | *"What sound does the squid make?"* | A refusal: contact sheets carry no audio | — | No-audio honesty |

## Scoring

* **Mechanics** — a timecode inside tolerance passes. Outside tolerance, the interesting
  question is *why*: wrong window, density too coarse for the claim, or misread cell.
* **Citation discipline** — an answer may never be more precise than the cells actually read.
  "Between 0:04.5 and 0:04.6" from 100 ms cells is a *better* answer than a lucky "0:04.55";
  a precise number without a matching zoom is a fail even when numerically right.
* **Navigation cost** — count navigation decisions (overview → locate → precision), not
  prompts. Question 1 typically resolves in 3–4 tool calls; question 3 needs one more level.
  Fewer calls at equal accuracy = a better navigator.

## Running it

```bash
# overview
npx -y @getsquish/squish epic-squish-demo.mp4 --json

# the zoom loop (windows the graders used)
npx -y @getsquish/squish epic-squish-demo.mp4 --start 2.5 --end 4.0 --density 4x4   # squid + green entry
npx -y @getsquish/squish epic-squish-demo.mp4 --start 4.3 --end 4.8 --density 4x4   # red–green touch (~30 ms cells)
npx -y @getsquish/squish epic-squish-demo.mp4 --start 5.5 --end 6.5 --density 4x4   # yellow entry
npx -y @getsquish/squish epic-squish-demo.mp4 --start 6.5 --end 8.2 --density 4x4   # squid exit
```

On the remote MCP endpoint, pass the hosted URL as `video_url` with the same `start`/`end`
windows. The point of the benchmark is not to reuse these exact windows — it is to see
whether the agent *finds* them on its own.

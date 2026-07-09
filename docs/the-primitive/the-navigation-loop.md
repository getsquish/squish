---
description: The overview → zoom → cite loop that lets an agent answer from tens of frames instead of thousands.
---

# The navigation loop

The navigation loop is how an agent actually uses Squish: read an overview contact sheet, spot the region that matters, re-run Squish over just that time window at higher density, and repeat until the answer is visible — then cite absolute timestamps. Retrieval instead of replay.

## The five steps

1. **Overview.** Run Squish over the whole clip — `squish clip.mov --json` (CLI) or the `squish_video` tool (MCP) — and read the sheet(s) with vision. Cells run in time order, left→right, top→bottom.
2. **Navigate.** Spot the regions that matter; every cell carries an absolute timecode. Adjacent cells that look similar mean little changed; a hard visual break between two cells means an event happened somewhere in that gap.
3. **Zoom.** Call again with `start`/`end` set to the timecodes you spotted — a denser sheet of a narrower window, only where uncertainty remains. Addresses stay absolute.
4. **Repeat** until the answer is observable. Never re-read the whole clip at high density when one range matters.
5. **Cite.** Answer with absolute timestamps ("at 0:07 the press comes down") — anyone can check them against the source video.

## A real run: 34 frames instead of 3,088

In a real agent session, a scene cut was pinned to **0.2 s** by retrieving **34 frames — not the clip's 3,088** (overview → zoom → zoom):

1. **Overview.** One pass over the whole clip. The cut showed up as a hard visual break between two adjacent cells — so it happened somewhere between those two timecodes, but the gap between cells was still seconds wide.
2. **Zoom.** Re-run with `start`/`end` set to the two bracketing timecodes. The same event now falls between two much closer addresses on a denser sheet of that narrow window.
3. **Zoom again.** The window is now short enough that cells stamp sub-second timecodes. The cut sits between two cells 0.2 s apart — the answer is directly observable.

Three calls, 34 frames retrieved, and a final answer precise to 0.2 s that can be verified against the source. Watching the clip linearly would have meant processing all 3,088 frames for a question that lived in a fraction of one second.

## The invariants that make the loop safe

**Timecodes are always absolute.** A cell inside the window `1:00–1:30` stamps `1:07`, never `0:07` — at every zoom depth, addresses live in the source video's coordinate system. Window-relative timecodes would compound an offset error on the very next zoom; absolute timecodes mean any address read at any depth can be cited in an answer or passed straight into the next call.

**Precision adapts to the window.** Cells one second or more apart stamp `m:ss`. Shorter windows automatically stamp finer timecodes — `m:ss.d` when cells are under 1 s apart, `m:ss.dd` under 0.1 s, `m:ss.ddd` under 0.01 s — so adjacent cells always resolve to distinct addresses, no matter how deep the zoom. The timecodes in the JSON output always match the pixels stamped on the sheet.

**The addressable floor is 2 ms per cell.** A window narrower than *cells × 2 ms* is rejected with an error that says how to proceed (zoom out, or lower the density) rather than pretending to address moments the engine cannot seek distinctly.

{% hint style="info" %}
Between the 2 ms floor and the source video's own frame interval, distinct addresses may show identical *frames*. That is the honest max-zoom answer — the video has no more frames in that window — not an addressing failure.
{% endhint %}

**Anything a sheet displays is valid input.** The loop round-trips: read `1:07.3` off a sheet, pass it back as `start`. Both `start` and `end` accept plain seconds (`90`, `67.4`) and timecode strings (`1:30`, `01:02:03`, `0:02.5`). What you read is what you cite is what you address.

## The same loop on every surface

The loop works identically through both local mouths of the engine:

* **CLI** — `squish clip.mov --start 1:00 --end 1:15 --density 5x5`. A windowed run echoes `"window": { "start": …, "end": … }` in its JSON; an unwindowed run's output is unchanged. See the [CLI reference](../reference/cli.md).
* **MCP** — the `squish_video` tool takes optional `start`/`end` parameters (seconds or sheet timecodes) and returns `timecodes[][]` matching the stamped pixels. See the [MCP reference](../reference/mcp.md).

The [hosted API](../reference/http-api.md) processes the whole clip per request and does not take `start`/`end` — run the loop with the local tools.

To teach the loop to an agent wholesale, install the [agent skill](../recipes/agent-skill.md); for question patterns to ask over a sheet, see the [prompt library](../recipes/prompt-library.md).

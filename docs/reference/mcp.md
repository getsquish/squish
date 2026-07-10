---
description: Complete reference for the Squish MCP server — the squish_video tool, its five parameters, result payload, and error behavior.
---

# MCP server

The MCP server is a thin wrapper over the exact same engine as the [CLI](cli.md) — same
pipeline, same output files, same window semantics. It runs entirely on your machine and
speaks MCP over **stdio**. If your client only takes a connector URL (Claude Desktop,
claude.ai), use the hosted [remote MCP endpoint](remote-mcp.md) instead.

## Starting the server

```bash
squish mcp
```

`squish mcp` takes no arguments (trailing arguments are a usage error). stdout belongs to
the MCP transport — the server never prints anything else to it, so stdio framing stays
clean. Requirements are the CLI's: Node ≥ 20, `ffmpeg` + `ffprobe` on PATH.

## Client configuration

Works with Claude Code, Claude Desktop, Cursor, Hermes, and any stdio MCP client:

```json
{
  "mcpServers": {
    "squish": { "command": "npx", "args": ["-y", "@getsquish/squish", "mcp"] }
  }
}
```

See [Quickstart: MCP](../getting-started/quickstart-mcp.md) for per-client setup.

## The tool: squish_video

The server exposes exactly **one tool**, named `squish_video` (the name is frozen — see
[Stability and versioning](stability.md)). Its title: *"Squish a video into a timestamped
contact sheet"*.

The tool description itself teaches the model the
[navigation loop](../the-primitive/the-navigation-loop.md): timecodes are absolute to the
source video, so to look closer at a range spotted on a sheet, the model calls the tool
again with `start`/`end` set to those timecodes — each zoom yields finer timecodes
(overview → range → moment). No extra prompting is required for an agent to discover the
loop.

### Parameters

| Parameter | Type | Required | Default | Constraints / semantics |
|---|---|---|---|---|
| `video_path` | string | **yes** | — | Absolute path to a **local** video file (anything ffmpeg decodes). |
| `density` | `"3x3"` \| `"4x4"` \| `"5x5"` \| `"6x6"` | no | `"3x3"` | Grid density: 9 / 16 / 25 / 36 frames per sheet. `3x3` recovers what happened; denser grids (`4x4`–`6x6`) recover how it was done. |
| `start` | number \| string | no | `0` (start of clip) | Zoom-window start — seconds (`67.5`) or a timecode as stamped on a sheet (`"1:07"`, `"1:07.3"`). **Absolute in the source video.** Must be ≥ 0 and before the end of the clip. |
| `end` | number \| string | no | end of clip | Zoom-window end — same formats as `start`. Values **past the end of the clip are clamped** to it. Must land after `start`; windows below 2 ms per cell are rejected (see [window semantics](cli.md#window-semantics)). |
| `out_dir` | string | no | beside the input file | Directory for the output sheet(s); created if missing. |

`start`/`end` accept everything a sheet stamps — see the
[round-trip property](sheet-format.md#round-trip-property).

### Result payload

On success the tool returns one text content block whose text is a JSON object: the
[CLI `--json` contract fields](cli.md#--json-output) **plus** `timecodes`, stamped with
its own contract string:

```json
{
  "input": "/abs/path/clip.mov",
  "duration": 20.275,
  "frames": 9,
  "sheets": 1,
  "files": ["/abs/path/clip.sheet-1.jpg"],
  "warnings": [],
  "timecodes": [["0:01", "0:03", "0:05", "0:07", "0:10", "0:12", "0:14", "0:16", "0:19"]],
  "contract": "squish-mcp-v0"
}
```

| Key | Type | Present | Meaning |
|---|---|---|---|
| `input` | string | always | Absolute resolved input path. |
| `duration` | number | always | Full clip duration in seconds (never the window length). |
| `window` | object | only when `start`/`end` was passed | `{ "start": <s>, "end": <s> }` — resolved bounds in seconds, after defaulting and end-clamping, millisecond precision. Appears between `duration` and `frames`. |
| `frames` | number | always | Total frames sampled (`sheets × cells`). |
| `sheets` | number | always | Sheet files produced. |
| `files` | string[] | always | Absolute paths to the sheet JPEGs, in order. Read these with vision. |
| `warnings` | string[] | always | Non-fatal issues (e.g. an unreadable frame left a cell black). |
| `timecodes` | string[][] | always | One array **per sheet**, one string **per frame**, in cell order (left→right, top→bottom). Identical to the labels stamped on the sheet pixels — the JSON and the image never disagree. Format `m:ss`; sub-second `m:ss.d` (down to `m:ss.ddd`) when a window is short — see [Adaptive precision](sheet-format.md#adaptive-precision). |
| `contract` | string | always | `"squish-mcp-v0"` — parse this to detect a breaking change. |

The intended flow: call the tool, read the file(s) in `files` with vision, cite the
timecodes, and zoom with `start`/`end` where uncertainty remains.

### Error behavior

Any failure returns an MCP tool error — `isError: true` with a single text content block
containing the error message. No result JSON is produced. Messages you will encounter:

| Failure | Message |
|---|---|
| Unparseable `start`/`end` | `could not parse start "<value>" — use seconds (90) or a timecode (1:30, 1:07.3)` (same shape for `end`) |
| Input file missing | `input not found: <absolute path>` |
| Negative `start` | `start must be a time ≥ 0` |
| `start` at/after clip end | `start (<t>) is at/after the end of the clip (<duration>)` |
| Empty window | `window is empty — end (<t>) must be after start (<t>)` |
| Window below the 2 ms/cell floor | `window too small to address distinctly: <N> cells across <X> ms (the engine seeks at millisecond precision — minimum ≈ <2N> ms at this density); zoom out or lower the density` |

The window errors are deliberately *teaching errors*: they tell the model how to correct
its next call (zoom out, or lower the density) instead of failing opaquely.

## Relationship to the CLI

Both mouths call the same engine function; neither reimplements any pipeline logic. The
MCP result is the CLI report plus `timecodes[][]`, under its own `contract` string
because the shape differs. Temp frames are cleaned up on success or error, exactly as in
the [CLI](cli.md#temp-frame-cleanup).

---
description: Complete reference for the squish CLI — flags, JSON output contract, exit codes, and error behavior.
---

# CLI

```
squish <video> [--density 3x3|4x4|5x5|6x6] [--start <t>] [--end <t>] [--out <dir>] [--json]
squish mcp                 start the MCP server (stdio)
```

`<t>` = seconds (`90`) or a timecode as stamped on a sheet (`1:30`, `1:07.3`). See
[Time values](#time-values) for the full grammar and [MCP server](mcp.md) for `squish mcp`.

Requirements: Node ≥ 20, `ffmpeg` + `ffprobe` on PATH. Everything runs on your machine —
see [Privacy and data flow](../the-primitive/privacy-and-data-flow.md).

## Flags

| Flag | Value | Required | Default | Constraints | Meaning |
|---|---|---|---|---|---|
| `--density` | `3x3` \| `4x4` \| `5x5` \| `6x6` | no | `3x3` | must be one of the four values | Frames per sheet: 9 / 16 / 25 / 36. `3x3` recovers *what* happened; `4x4`–`6x6` recover *how* it was done. |
| `--start` | time (`<t>`) | no | `0` | ≥ 0 and before the end of the clip | Zoom-window start, in the **source video's clock** (absolute — never relative to a previous window). |
| `--end` | time (`<t>`) | no | end of clip | must land after `start`; values past the end of the clip are clamped to it | Zoom-window end, absolute. |
| `--out` | directory | no | beside the input file | created (recursively) if missing | Where the output sheet(s) are written. |
| `--json` | — | no | off | — | Print the machine-readable report ([below](#--json-output)) to stdout instead of the human summary. |

## Positional argument

Exactly one positional argument: the path to a local video file (anything ffmpeg decodes).
It is resolved to an absolute path; a relative path resolves against the current working
directory.

## Usage errors

Any input problem prints the error message **plus the usage text** to stderr and exits `1`.
The exact conditions and messages:

| Condition | Message |
|---|---|
| No positional input | `missing <video> input` |
| A second positional input | `one video per run — got a second input: <arg>` |
| Unrecognized flag | `unknown flag: <arg>` |
| `--density` missing or not in the enum | `--density must be one of 3x3\|4x4\|5x5\|6x6` |
| `--start` / `--end` missing or unparseable | `--start needs a time — seconds (90) or a timecode (1:30)` (same shape for `--end`) |
| `--out` missing its directory | `--out needs a directory` |
| `squish mcp` with trailing arguments | `squish mcp takes no arguments` |

Running `squish` with no arguments prints the usage text and exits `1`; `--help` / `-h`
prints the usage text and exits `0`.

## Time values

`--start` and `--end` accept:

- Plain seconds: `90`, `67.4`
- A timecode exactly as stamped on a sheet: `1:30`, `120:30` (minutes are unbounded),
  `1:07.3` (fractional seconds), or `01:02:03` (`h:mm:ss`)

Anything a sheet displays is valid input — see the
[round-trip property](sheet-format.md#round-trip-property) in the sheet-format spec for
the exact grammar.

### Window semantics

Both bounds are **absolute in the source video** at every zoom depth — a windowed run
never re-bases timecodes. Resolution rules (checked in this order after probing the clip):

- Omitted `--start` → `0`. Omitted `--end` → the end of the clip.
- An `--end` past the end of the clip is **clamped** to the clip's duration ("from 5:00
  to the end" works without knowing the duration).
- A negative `--start` fails: `start must be a time ≥ 0`.
- A `--start` at/after the end of the clip fails: `start (<t>) is at/after the end of the clip (<duration>)`.
- An empty window (end ≤ start, including after end-clamping) fails: `window is empty — end (<t>) must be after start (<t>)`.
- A window smaller than **2 ms per cell** at the chosen density fails with a teaching
  error: `window too small to address distinctly: <N> cells across <X> ms (the engine seeks at millisecond precision — minimum ≈ <2N> ms at this density); zoom out or lower the density`.
  A window exactly at the floor is accepted. See
  [Adaptive precision](sheet-format.md#adaptive-precision) for why the floor exists.

## Output files

Sheets are written as `<basename>.sheet-N.jpg` (`N` starting at 1, in time order), where
`<basename>` is the input filename without its extension — see the
[filename contract](sheet-format.md#filename-contract). Default destination is the input
file's directory; `--out <dir>` overrides it.

## --json output

With `--json`, stdout is exactly one JSON object — the frozen `squish-cli-v0` contract
(see [Stability and versioning](stability.md)). Key order is fixed:

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

| Key | Type | Present | Meaning |
|---|---|---|---|
| `input` | string | always | Absolute resolved path of the input video. |
| `duration` | number | always | Duration of the **full clip** in seconds — never the window length, even on a windowed run. |
| `window` | object | only when `--start` and/or `--end` was passed | `{ "start": <s>, "end": <s> }` — the **resolved** bounds in seconds (after defaulting and end-clamping), millisecond precision. Absent when no window was requested. It appears between `duration` and `frames`. |
| `frames` | number | always | Total frames sampled (`sheets × cells`). Unreadable frames are still counted — they surface in `warnings`. |
| `sheets` | number | always | Number of sheet files produced. |
| `files` | string[] | always | Absolute output paths, in sheet order. |
| `warnings` | string[] | always | Non-fatal issues, e.g. `sheet 1 frame 3: unreadable — cell left black`. |
| `contract` | string | always | `"squish-cli-v0"` — parse this to detect a breaking change. |

A windowed run:

```json
{
  "input": "/abs/path/clip.mov",
  "duration": 200.5,
  "window": { "start": 60, "end": 90 },
  "frames": 25,
  "sheets": 1,
  "files": ["/abs/path/clip.sheet-1.jpg"],
  "warnings": [],
  "contract": "squish-cli-v0"
}
```

Without `--json`, stdout is a human summary (output paths, `warning:` lines, and a
`summary: duration=…s sheets=… frames=…` line). Only the `--json` object is a stability
contract; do not parse the human output.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. Also: `--help` / `-h`. |
| `1` | Any failure. Usage errors print the message + usage text to stderr; runtime errors (e.g. `input not found: <path>`, window errors, ffmpeg failures) print the message to stderr. Running `squish` with no arguments at all prints the usage text to **stdout** and exits `1`. |

Nothing but the report is written to stdout, with one exception: usage text. `--help` / `-h`
print usage to stdout and exit `0`; running `squish` with **no arguments at all** also prints
usage to stdout but exits `1`. A wrapper that reserves stdout for machine-readable output
should check the exit code before parsing. Every other failure writes to stderr only.

## Temp-frame cleanup

Extracted frames go into a per-run temporary directory under the OS temp dir. It is
always removed when the run ends — **success or error**. Only the `.sheet-N.jpg` files
remain.

## Examples

```bash
# Overview: one 3×3 sheet per ~90 s of clip, written beside the input
squish clip.mov

# Denser grid + machine-readable output
squish clip.mov --density 5x5 --json

# Zoom: re-squish 1:00–1:30 at higher density — timecodes stay absolute
squish clip.mov --start 1:00 --end 1:30 --density 5x5

# Drill into a sub-second range spotted on the previous sheet, into a chosen directory
squish clip.mov --start 1:07.3 --end 1:09 --density 4x4 --out ./sheets --json
```

The zoom pattern (overview → spot a range → re-run with `--start`/`--end` → finer
timecodes) is the [navigation loop](../the-primitive/the-navigation-loop.md).

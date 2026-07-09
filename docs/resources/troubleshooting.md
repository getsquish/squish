---
description: Real failure modes of the Squish CLI and MCP server — the exact error text, what causes it, and the fix.
---

# Troubleshooting

Every issue below is a real failure mode of the Squish CLI / MCP server, with the actual
error text where one exists. General rule: the CLI exits `0` on success and `1` on failure
with the message on stderr; MCP calls surface the same messages as tool errors, not crashes.

## ffmpeg or ffprobe not installed

**Symptom** — every run fails immediately (exit 1) with:

```
ffmpeg + ffprobe are required (Squish samples frames with them).
  macOS:  brew install ffmpeg
  Ubuntu: sudo apt-get install ffmpeg
No install? The hosted API squishes without local tools — free daily allowance, no card:
  https://getsquish.app/developers
```

**Cause** — Squish shells out to your system `ffmpeg`/`ffprobe` and preflights both with
`-version` before touching the video; if either is missing from PATH, it fails fast instead
of dying mid-run.

**Fix** — install ffmpeg (`brew install ffmpeg` on macOS, `sudo apt-get install ffmpeg` on
Ubuntu) and make sure the environment your agent/MCP client runs in inherits the PATH that
contains it. If you can't install locally, the
[hosted API](../getting-started/quickstart-api.md) does the same job remotely.

## Node older than 20

**Symptom** — `npm`/`npx` prints an `EBADENGINE` "Unsupported engine" warning when fetching
`@getsquish/squish`, and the CLI may fail at runtime.

**Cause** — the package declares `"engines": { "node": ">=20" }`; older Node versions are
unsupported.

**Fix** — upgrade to Node 20 or newer (`node --version` to check).

## MCP server doesn't appear in the client

**Symptom** — the `squish_video` tool never shows up in Claude Code, Claude Desktop, Cursor,
or another MCP client after adding the config.

**Causes and fixes** (in the order to check):

1. **Config typo or wrong file** — the block must be under `mcpServers`, with
   `"command": "npx"` and `"args": ["-y", "@getsquish/squish", "mcp"]`, in the config file
   your client actually reads. Compare against the
   [MCP quickstart](../getting-started/quickstart-mcp.md).
2. **Client not restarted** — most clients read MCP config at startup; restart the client
   after any config change.
3. **First-run download delay** — the first `npx -y @getsquish/squish` downloads the package
   from npm, which can exceed a client's server-startup patience. Warm the cache once from a
   terminal: `npx -y @getsquish/squish mcp` should start and sit waiting on stdio
   (Ctrl-C to stop). If that command fails in the terminal, fix that error first — it's the
   same process the client would launch.

## Usage errors (bad flags or inputs)

**Symptom** — the CLI exits 1 and prints the specific problem plus the usage line to stderr:

```
usage: squish <video> [--density 3x3|4x4|5x5|6x6] [--start <t>] [--end <t>] [--out <dir>] [--json]
       squish mcp                 start the MCP server (stdio)
       <t> = seconds (90) or a timecode as stamped on a sheet (1:30, 1:07.3)
```

**Causes** — the real messages and what triggers each:

| Error | Trigger |
| --- | --- |
| `unknown flag: <flag>` | A flag the CLI doesn't have — check spelling against the usage line. |
| `missing <video> input` | No video path was given. |
| `one video per run — got a second input: <arg>` | Two positional arguments — the CLI takes exactly one video per run. Unquoted paths with spaces cause this too. |
| `--density must be one of 3x3\|4x4\|5x5\|6x6` | A density outside the four supported grids. |
| `--start needs a time — seconds (90) or a timecode (1:30)` | `--start`/`--end` with a missing or unparseable value. |
| `--out needs a directory` | `--out` with no value. |
| `squish mcp takes no arguments` | Extra arguments after `squish mcp` — the subcommand takes none. |

**Fix** — correct the flag or value; the message names exactly what's wrong.

## Windowing errors (`--start` / `--end`)

**Symptom** — a windowed run is rejected with one of these (exit 1, message on stderr; same
text as an MCP tool error):

- `start (…) is at/after the end of the clip (…)` — `--start` points at or past the clip's
  end.
- `window is empty — end (…) must be after start (…)` — `end` ≤ `start`. Nothing is
  produced; the run is rejected outright.
- `start must be a time ≥ 0` — a negative start.
- `window too small to address distinctly: N cells across M ms (the engine seeks at
  millisecond precision — minimum ≈ K ms at this density); zoom out or lower the density` —
  the window is narrower than the **2 ms per cell** addressable floor (e.g. under 18 ms for
  3×3's 9 cells, under 72 ms for 6×6's 36). Below that floor, adjacent cells would collide
  into indistinguishable timestamps, so the engine refuses rather than pretending.

**Not an error** — an `end` past the clip's duration is silently clamped to the end
("from 5:00 to the end of the clip" is a natural request). A windowed `--json` run echoes the
resolved bounds in `"window": { "start": …, "end": … }` so you can see what was actually used.

**Fix** — widen the window, lower the density, or fix the bound that the message names.
Remember timecodes are absolute to the source video: pass the values exactly as stamped on
the sheet you're zooming from.

## `could not read a duration from <input>`

**Symptom** — the run fails right after preflight with the message above.

**Cause** — `ffprobe` couldn't extract a positive duration: the file isn't a video, is
corrupt, or is in a format your local ffmpeg build doesn't decode.

**Fix** — confirm the file plays locally; if it does, check whether your ffmpeg build
supports its codec (`ffprobe <file>` shows the raw complaint), or re-encode to a common
format like MP4/H.264.

## Can't find the output

**Symptom** — the run succeeded (exit 0) but you're looking for the sheets.

**Cause** — by default, sheets land **beside the input video** as `<basename>.sheet-N.jpg`
(e.g. `clip.mov` → `clip.sheet-1.jpg` in the same directory).

**Fix** — pass `--out <dir>` (CLI) or `out_dir` (MCP) to choose a destination. With `--json`,
the `files[]` array lists the absolute path of every sheet written — parse that instead of
guessing.

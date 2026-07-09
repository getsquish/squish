---
description: The v0 specification of the Squish contact sheet — grid geometry, sampling rule, timecode grammar, adaptive precision, and the round-trip property.
---

# Sheet format (v0)

This page specifies the contact-sheet format the Squish tools produce and consume. It is
what makes a sheet an *addressable representation* of a video rather than a mere image:
any tool that follows it produces sheets a model can navigate, and any address a sheet
displays can be fed back in to zoom. See
[Video as an address space](../the-primitive/video-as-address-space.md) for the concept;
this page is the contract.

## Scope

A conforming sheet is a single raster image (the reference implementation emits JPEG,
quality 0.70) containing:

- a grid of frames sampled from one source video (or one time window of it), in strict
  time order, and
- a timecode stamped on every cell, in the grammar below, **absolute to the source
  video's clock**.

Normative here: the grid's time ordering, the sampling rule, the timecode grammar and its
precision rule, the absolute-timecode semantics, the filename contract, and the
round-trip property. *Not* normative: visual styling — colors, fonts, pill geometry,
footer branding, pixel dimensions (see
[what stability does not cover](stability.md#what-is-not-covered)).

## Grid geometry

Four densities exist. Density fixes the cell count of every sheet in a run:

| Density | Grid | Cells per sheet | Reference export width (informative) |
|---|---|---:|---:|
| `3x3` | 3 × 3 | 9 | 1536 px |
| `4x4` | 4 × 4 | 16 | 1920 px |
| `5x5` | 5 × 5 | 25 | 2304 px |
| `6x6` | 6 × 6 | 36 | 2560 px |

Cells are ordered by time, **left→right, then top→bottom**: cell index *i* (0-based)
occupies column *i* mod *cols*, row ⌊*i* / *cols*⌋, and its sampled time is strictly
non-decreasing in *i*. Reading a sheet like text reads the clip in chronological order.

A long run fans out into several sheets covering equal, consecutive slices of the
covered range. The reference producer opens a new sheet per ~90 seconds of covered range,
capped at 4 sheets per run; sheet *N* covers strictly earlier time than sheet *N*+1.

## Sampling rule

Frame times are chosen deterministically — **each cell samples the midpoint of its equal
sub-slice** of the sheet's window:

Let the covered range have length *L* (the whole clip, or `end − start` of a
[zoom window](cli.md#window-semantics)), split into *S* equal sheet-windows of
*W* = *L* / *S*. Within a sheet-window beginning at *w₀*, cell *i* of *N* cells samples

```
t = w₀ + W · (i + 0.5) / N
```

Two adjustments:

- **End margin.** No sample lands at the exact end of the clip (an EOF seek yields
  nothing). Every timestamp is clamped to `duration − min(0.02 s, W/N/2)` — a fixed
  20 ms margin, shrunk to half a sample step for tiny windows so trailing cells never
  collapse onto one timestamp.
- **Windowed runs stay absolute.** A windowed run is planned exactly as a run on a
  virtually-trimmed clip of length `end − start`, then **every timestamp is shifted by
  +start**. Addresses always refer to the source video's clock — a windowed run never
  re-bases them.

## Timecode grammar

### Emitted formats

A conforming producer stamps each cell with its sampled time in one of:

| Format | Example | When |
|---|---|---|
| `m:ss` | `1:30`, `120:30` | default (whole-second precision) |
| `m:ss.d` | `1:07.3` | 1 decimal |
| `m:ss.dd` | `1:07.34` | 2 decimals |
| `m:ss.ddd` | `1:07.342` | 3 decimals |

Rules:

- **Minutes are unbounded** — a clip past an hour stamps `120:30`, never `h:mm:ss`.
  Output format is decided by structure, not magnitude.
- Seconds are zero-padded to two digits (`0:07`, `1:07.3`).
- Values **floor** at the displayed precision — they never round up into the next second
  or minute, so a stamp never points past the frame it labels.

### Absoluteness

Every timecode refers to the **source video's clock**. Zooming (re-running on a
`start`/`end` window) yields finer timecodes in the *same* coordinate system — never
re-based to the window. This is what lets an agent chain zooms: an address read off any
sheet, at any depth, is directly usable as a bound for the next call, and citations stay
valid against the original video.

### Accepted input formats

A conforming consumer (the `--start`/`--end` flags, the MCP `start`/`end` parameters)
accepts:

- **Plain seconds**: `90`, `67.4` (and raw JSON numbers over MCP)
- **`m:ss[.fraction]`** — minutes unbounded, seconds 1–2 digits and < 60: `1:30`,
  `120:30`, `1:07.3`
- **`h:mm:ss[.fraction]`** — minutes < 60, seconds < 60: `01:02:03`

Two-part vs three-part is decided by **colon count, never magnitude**. Anything else is
rejected as malformed (a usage error on the CLI, a tool error over MCP).

## Adaptive precision

Displayed precision adapts so that **adjacent cells always show distinct addresses**.
The precision is chosen from the sampling step (the time spacing between adjacent cells):

| Sampling step | Precision | Format |
|---|---|---|
| ≥ 1 s | whole seconds | `m:ss` |
| ≥ 0.1 s | 1 decimal | `m:ss.d` |
| ≥ 0.01 s | 2 decimals | `m:ss.dd` |
| < 0.01 s | 3 decimals | `m:ss.ddd` |

One rule serves every output surface: the labels stamped on the sheet pixels and the
`timecodes[][]` arrays in [MCP](mcp.md#result-payload) / hosted-API JSON come from the
same computation and must never disagree.

### The addressable floor: 2 ms per cell

The engine seeks at millisecond precision, and cells sample at window midpoints — below
**2 ms of window per cell**, adjacent midpoints can round to the same millisecond and
addresses would silently collide. A conforming producer therefore **rejects** a window
smaller than `cells × 2 ms` (e.g. 18 ms at `3x3`, 72 ms at `6x6`) with a teaching error
("zoom out or lower the density") rather than producing duplicate addresses. A window
exactly at the floor is accepted. At 2 ms per cell, adjacent midpoints differ by ≥ 2 ms,
so their rounded seek targets and floored labels each differ by ≥ 1 ms — distinctness is
guaranteed, not hoped for.

## Filename contract

Sheets are named

```
<basename>.sheet-N.jpg
```

where `<basename>` is derived from the video path the producer was given — the filename
without its extension — and `N` is the 1-based sheet index in time order (`clip.mov` →
`clip.sheet-1.jpg`, `clip.sheet-2.jpg`, …). This is how the CLI and MCP server name the
files they write, and the format is frozen (see
[Stability and versioning](stability.md)).

One documented exception: the [hosted API](http-api.md) stores an upload under its own
fixed name, so its response URLs always end in `video.sheet-N.jpg` regardless of the
uploaded filename — the original name is echoed in the response's `input` field instead.
Validate hosted filenames against the `*.sheet-N.jpg` pattern, never against the upload's
name.

## Round-trip property

**`parseTime` accepts everything `fmtTime` emits**: every emitted format above is in the
accepted-input grammar, at every precision. Consequently, anything a sheet displays is
valid `--start`/`--end` (CLI) or `start`/`end` (MCP) input — an agent can read an address
off a sheet with vision and feed the exact string back to zoom. This closure is what
makes the [navigation loop](../the-primitive/the-navigation-loop.md) work without any
translation layer.

## Conformance

The test suite in the public repo serves as the executable golden examples of this spec —
see [`tests/`](https://github.com/getsquish/squish/tree/main/tests), in particular
`window.test.ts` (window resolution, end-clamping, the 2 ms/cell floor) and
`report.test.ts` (output contract shapes). If your implementation agrees with those
tests, it conforms.

## Versioning

This is **v0** of the sheet format. Evolution is additive — existing geometry, grammar,
and semantics are not changed within v0; new capabilities appear alongside them. The
JSON surfaces that carry sheet metadata are versioned by explicit contract strings — see
[Stability and versioning](stability.md).

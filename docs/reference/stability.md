---
description: The three frozen contract strings, the additive-only evolution rule, what is frozen, what is not, and how a breaking change would be announced.
---

# Stability and versioning

Squish's machine-readable surfaces are versioned by explicit **contract strings**,
stamped into every payload as a `contract` field. Consumers parse the string — an exact
match means the shape is the one documented here; an unfamiliar string means a breaking
change happened and the consumer should not assume the old shape.

## The three contracts

| Contract string | Surface it covers | Documented in |
|---|---|---|
| `squish-cli-v0` | The CLI's `--json` stdout object | [CLI reference](cli.md#--json-output) |
| `squish-mcp-v0` | The JSON payload returned by the MCP tool `squish_video` (the CLI fields plus `timecodes[][]`) | [MCP reference](mcp.md#result-payload) |
| `squish-http-v0` | The hosted API's JSON responses and its `/healthz` body | [Hosted API reference](http-api.md) |

The MCP payload carries its own string — not the CLI's — because its shape differs
(`timecodes` exists only there). Each surface is versioned independently.

## The additive-only rule

Within a contract version, changes are **additive only**:

- New fields may be **added**.
- Existing fields are never **renamed**, **removed**, or **retyped**.
- Anything that would violate the above is a breaking change and **bumps the contract
  string** (e.g. `squish-cli-v0` → `squish-cli-v1`).

For consumers this means: ignore fields you don't recognize, and gate your parsing on
the `contract` value — that combination is forward-compatible with every non-breaking
release. Do not sniff shapes; parse `contract`.

## What is frozen

Beyond the JSON key sets of the three contracts, these surfaces are frozen and treated
with the same additive-only discipline:

- **The MCP tool name `squish_video`** — clients and agent skills bind to it by name.
- **The JSON keys** of each contract, including key order in the CLI/MCP payloads and
  the conditional presence rule for `window` (present only when a window was requested).
- **The filename format** `<basename>.sheet-N.jpg` — see the
  [filename contract](sheet-format.md#filename-contract).
- **The timecode grammar** — emitted formats `m:ss` / `m:ss.d` / `m:ss.dd` / `m:ss.ddd`,
  unbounded minutes, flooring; and the accepted-input grammar with its
  [round-trip property](sheet-format.md#round-trip-property) (anything a sheet displays
  is valid `start`/`end` input).
- **Absolute-timecode semantics** — timecodes refer to the source video's clock at every
  zoom depth; a windowed run never re-bases them.
- **The 2 ms/cell addressable floor** — windows below it are rejected with a teaching
  error, never silently produced with duplicate addresses (see
  [Adaptive precision](sheet-format.md#adaptive-precision)).

## What is NOT covered

No stability promise attaches to:

- **Visual styling of sheets** — colors, fonts, timecode-pill geometry, footer branding,
  header/margins, pixel dimensions, JPEG encoder settings. A sheet's *addresses* are
  contractual; its *look* is not.
- **The CLI's human-readable output** (runs without `--json`) — parse the JSON, not the
  plain text.
- **Error message wording** — error *conditions* and their categories are documented in
  the [CLI](cli.md#usage-errors) and [MCP](mcp.md#error-behavior) references, but the
  exact prose may improve over time.
- **Internal implementation** — engine internals, rendering code, ffmpeg invocation
  details, temp-file layout. Anything not stamped with a contract string or listed above
  is implementation, not interface.

## How a breaking change would be announced

1. The affected surface gets a **new contract string** (`…-v1`); the old string is never
   reused for a different shape.
2. The change is documented in the [changelog](../resources/changelog.md).

Nothing about the running payload changes silently: if your parser checks `contract` and
it still reads `squish-cli-v0` / `squish-mcp-v0` / `squish-http-v0`, every guarantee on
this page and in the [sheet-format spec](sheet-format.md) still holds.

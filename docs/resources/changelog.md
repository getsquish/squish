---
description: What shipped in each @getsquish/squish release, newest first, with real npm publish dates.
---

# Changelog

User-facing changes per published version of
[`@getsquish/squish`](https://www.npmjs.com/package/@getsquish/squish), newest first. Dates
are the npm publish dates. Release notes also live on
[GitHub Releases](https://github.com/getsquish/squish/releases).

## 0.2.1 — 2026-07-08

First open-source release: the engine behind `@getsquish/squish` went public at
[github.com/getsquish/squish](https://github.com/getsquish/squish) (Apache-2.0, curated
mirror of the founding monorepo — history starts there).

- README rebuilt around the primitive: video as an addressable representation, the
  navigation loop (overview → zoom → cite), and the meta-demo — a 76-second explainer video
  shown next to the same video as one contact sheet.
- `package.json` `repository` now points at the public repo, so npm's "Repository" link
  works.
- Added `SECURITY.md` (private vulnerability reports via GitHub security advisories) and
  npm / CI / license badges.
- Engine unchanged: the `squish-cli-v0` and `squish-mcp-v0` contracts are identical to 0.2.0.

## 0.2.0 — 2026-07-07

Windowed sheets — the release that turns a sheet into a navigable address space.

- `--start` / `--end` on the CLI and `start` / `end` on the `squish_video` MCP tool window a
  run to a range. Both accept seconds (`90`) or a timecode exactly as stamped on a sheet
  (`1:30`, `1:07.3`).
- Timecodes stay **absolute to the source video at every zoom depth** — a windowed run never
  re-bases them, so you can drill repeatedly: overview → range → moment.
- Adaptive timecode precision: short windows stamp sub-second timecodes (`1:07.3`) so
  adjacent cells stay distinguishable.
- Addressable floor: a window narrower than 2 ms per cell is rejected with a teaching error
  (zoom out or lower the density) instead of producing indistinct cells.
- A windowed `--json` run echoes the resolved bounds as `"window": { "start": …, "end": … }`.

## 0.1.1 — 2026-07-06

README rewrite for the npm package page. No engine or contract changes.

## 0.1.0 — 2026-07-06

First publish of `@getsquish/squish`: the CLI and the MCP server in one package.

- CLI: `squish <video>` → timestamped contact sheets beside the input
  (`<basename>.sheet-N.jpg`), `--density 3x3|4x4|5x5|6x6`, `--out <dir>`, and `--json` with
  the frozen `squish-cli-v0` stdout contract.
- MCP server: `squish mcp` (stdio) exposing one tool, `squish_video`, returning the CLI
  contract plus per-cell `timecodes[][]`, stamped `squish-mcp-v0`.
- ffmpeg/ffprobe preflight that fails fast with per-OS install hints instead of a mid-run
  error.
- Apache-2.0 license + NOTICE.

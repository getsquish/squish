---
description: What shipped in each @getsquish/squish release, newest first, with real npm publish dates.
---

# Changelog

User-facing changes per published version of
[`@getsquish/squish`](https://www.npmjs.com/package/@getsquish/squish), newest first. Dates
are the npm publish dates. Release notes also live on
[GitHub Releases](https://github.com/getsquish/squish/releases).

## 0.2.3 — 2026-07-14

The discoverable release: agents can now find Squish on their own.

- Listed in the official **MCP Registry** as
  [`io.github.getsquish/squish`](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.getsquish/squish):
  `package.json` carries `mcpName` (the registry's npm ownership marker), `server.json`
  describes both ways in (this npm package over stdio + the hosted endpoint), and a
  tag-triggered OIDC workflow publishes the listing on every release.
- **`video-navigation` agent skill** in the repo's `skills/` dir — `npx skills add
  getsquish/squish` teaches an agent when to reach for a contact sheet, the zoom loop, and
  the citation discipline. Listed on skills.sh.
- stdio MCP truthfulness: `serverInfo` now reports the real package version (it had sat at a
  hardcoded `0.2.0` through two releases), and `squish_video` carries behavior annotations —
  writes sheets to your disk, nothing leaves the machine (closed world), reruns overwrite the
  same outputs (idempotent).
- New docs: [For AI agents](../getting-started/for-ai-agents.md) (pick-your-surface decision
  table + behavior rules) and [Support](support.md).
- Hosted endpoint (same engine, **not in this package**): Apps SDK scan metadata
  (`outputSchema` + `structuredContent`, attachment `fileParams`), a subject-keyed free lane,
  and a commerce-free quota voice for ChatGPT traffic — the ChatGPT app was submitted for
  review 2026-07-12.
- Engine unchanged: the `squish-cli-v0` and `squish-mcp-v0` contracts are identical to 0.2.0.

## 0.2.2 — 2026-07-10

The lens README, and the remote mouth grew auth.

- README rebuilt around the lens canon — *AI sees through lenses, not answers: Squish adjusts
  the lens; the model interprets* — with a new cover ("Random access to video") and the
  official-app path (add `https://api.getsquish.app/mcp` as a connector, zero install).
- `squish_video` tool description tuned from field evidence: the one-call economy line ("one
  call replaces a whole download → ffmpeg → extract → montage pipeline"), density-vs-window
  guidance, and the `timecodes[][]` mirror note — agents pick the tool and drive the loop
  better with no prompting changes.
- Hosted endpoint (same engine, **not in this package**): `api.getsquish.app/mcp` gained
  optional `Authorization: Bearer` API keys (same credits as the hosted API,
  deduct-before-extract with auto-refund) alongside a small anonymous free lane; quota
  exhaustion answers with a structured error an agent can relay. **The local CLI and MCP
  server in this package stay ungated forever.**
- Engine unchanged: the `squish-cli-v0` and `squish-mcp-v0` contracts are identical to 0.2.0.

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

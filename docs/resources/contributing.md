---
description: How to hack on the Squish engine — dev quickstart, the frozen-contracts rule, and how mirror-first contribution works.
---

# Contributing

The short version of
[`CONTRIBUTING.md`](https://github.com/getsquish/squish/blob/main/CONTRIBUTING.md) in the
repo — read that file before opening a PR; this page is the map.

## Dev quickstart

Requirements: Node ≥ 20 · `ffmpeg` + `ffprobe` on PATH.

```bash
npm install
npm run squish -- path/to/clip.mov --json   # run the CLI from source
npm run mcp                                  # run the MCP server from source
npm test                                     # node:test suite
npm run check                                # tsc --noEmit
npm run build                                # tsup → dist/
npm run e2e -- path/to/clip.mov              # real MCP client against the real server
```

## Architecture in three lines

- `src/engine.ts` is the one pipeline: probe → plan → extract → compose → write.
- `src/main.ts` (CLI + `mcp` subcommand) and `src/mcp.ts` are thin mouths over it — no logic
  forks.
- `src/core/` holds the pure planners (density, sampling, grid layout, timecode format),
  shared verbatim with the [getsquish.app](https://getsquish.app) web app.

## Contracts are frozen

`squish-cli-v0` (CLI `--json` output) and `squish-mcp-v0` (MCP tool result) are stability
contracts: **additive changes only**; a breaking change bumps the contract string. Consumers
parse the `contract` field to detect this — PRs must keep it that way. Two invariants to know
before touching the sampling/timecode path:

- **Timecodes are absolute to the source video at every zoom depth** — a windowed run never
  re-bases them.
- The addressable floor is **2 ms per cell**; windows below it are rejected with a teaching
  error rather than silently produced.

See [stability and versioning](../reference/stability.md) for the full policy.

## How changes flow (mirror-first)

The public repo is a curated mirror of a private monorepo, which remains the source of truth
(the web app, the hosted API, and internal docs live there). Practically:

- **Issues and PRs are welcome on the public repo.** Maintainers review them there, port
  accepted changes upstream, and they flow back in the next mirror — you keep authorship
  credit in the ported commit.
- Mirrors are assembled by a script that runs the full test suite and build before anything
  is pushed, so `main` should always be green.

## Security

Report vulnerabilities privately via
[GitHub security advisories](https://github.com/getsquish/squish/security/advisories/new) —
not as public issues. Scope: the CLI/MCP shell out to your system `ffmpeg`/`ffprobe`, so bugs
in ffmpeg itself belong upstream, but "Squish passes hostile input to ffmpeg unsafely" is in
scope. Reports about the hosted API are welcome through the same channel. Full policy:
[`SECURITY.md`](https://github.com/getsquish/squish/blob/main/SECURITY.md).

## License

Apache-2.0, with a `NOTICE` file. By contributing you agree your contributions are licensed
under it. The Squish name, logo, mascot, and brand assets are reserved and not part of the
license.

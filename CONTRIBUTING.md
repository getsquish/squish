# Contributing

Thanks for looking under the hood. 🦑

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

`squish-cli-v0` (CLI `--json`) and `squish-mcp-v0` (MCP tool result) are stability contracts:
additive changes only; a breaking change bumps the contract string. Consumers parse
`contract` to detect this — please keep it that way in PRs.

Two invariants worth knowing before touching the sampling/timecode path:

- **Timecodes are absolute to the source video at every zoom depth** — a windowed run never
  re-bases them.
- The addressable floor is **2 ms per cell**; windows below it are rejected with a teaching
  error rather than silently produced.

## How changes flow (mirror-first)

This repo is a curated mirror of a private monorepo, which remains the source of truth (the
web app, the hosted API, and internal docs live there). Practically:

- **Issues and PRs are welcome here.** Maintainers review on this repo, port accepted changes
  upstream, and they flow back in the next mirror — you keep authorship credit in the ported
  commit.
- Mirrors are assembled by a script that runs the full test suite and build before anything
  is pushed, so `main` should always be green.

## License

Apache-2.0. By contributing you agree your contributions are licensed under it. The Squish
name, logo, mascot, and brand assets are reserved and not part of this license.

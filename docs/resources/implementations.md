---
description: Known producers and consumers of the Squish sheet format — and an open invitation to build more.
---

# Implementations

The timestamped contact sheet is a format, not a product. These are the known
implementations that produce it:

| Implementation | Where | Notes |
| --- | --- | --- |
| **Squish CLI + MCP server** | [github.com/getsquish/squish](https://github.com/getsquish/squish) · [`@getsquish/squish`](https://www.npmjs.com/package/@getsquish/squish) | The reference implementation — this repo. Local, free, every density. |
| **Hosted API** | `api.getsquish.app` | The same engine, remote — for CI, serverless, or machines without ffmpeg. Intentional upload, prepaid credits. |
| **Web app** | [getsquish.app](https://getsquish.app) | Runs entirely in the browser — no install, nothing uploaded. |

Consumers are any vision model handed a sheet — plus agents running the
[navigation loop](../the-primitive/the-navigation-loop.md) over one of the producers above.

## Build your own

The sheet format — grid geometry, sampling, timecode stamping, and the invariants that make
addresses absolute — is specified in [the sheet format spec](../reference/sheet-format.md).
Anyone is welcome to build a compatible producer (another language, another runtime) or
consumer (a viewer, an indexer, an agent framework).

If you're building one, open an issue on
[github.com/getsquish/squish](https://github.com/getsquish/squish/issues) to coordinate —
we'd like this page to grow.

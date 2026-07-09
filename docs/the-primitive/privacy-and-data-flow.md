---
description: Where your video is processed on each Squish surface, what the hosted API retains, and the exact paid boundary.
---

# Privacy and data flow

Squish processes video in three different places, and the privacy story differs by path. Never blur them: "nothing is uploaded" is true only for the local paths.

## Three processing paths

| Path | Where the video is processed | Upload? | Cost & account |
| --- | --- | --- | --- |
| **Web app** — [getsquish.app](https://getsquish.app) | In your browser, client-side | No media upload | Free `3x3` sheets, no account needed; denser `4x4`–`6x6` is a one-time Pro upgrade |
| **CLI + MCP** — `@getsquish/squish` | On your machine (Node + ffmpeg) | Nothing is uploaded, ever | Every density free, no account, never gated |
| **Hosted API** — `api.getsquish.app` | On Squish's server | **An intentional upload**, by authenticated request | Prepaid credits, charged per output sheet |

## Local processing: nothing leaves your machine

The CLI and the MCP server are the same open-source engine (Apache-2.0) running entirely on your machine: frames are extracted with your own ffmpeg, and sheets are written next to the input file (or wherever `--out` points). No video, frame, or sheet is uploaded to Squish — ever. There is no account, and no density is gated. Because the engine is open source, this is verifiable, not a promise. Start with the [CLI quickstart](../getting-started/quickstart-cli.md) or the [MCP quickstart](../getting-started/quickstart-mcp.md).

The web app at [getsquish.app](https://getsquish.app) follows the same principle in a different runtime: the video is decoded and the sheet is rendered in your browser, client-side. No media upload.

## The hosted path: what happens to your bytes

The hosted API exists for workflows that cannot run local tools — CI, serverless, hosted agents, products that need a request/response pipe. Sending a clip there is an **intentional upload** by authenticated request, and its data flow is deliberately short-lived:

* One synchronous request is the whole job — upload, process, respond.
* **The uploaded video is deleted the moment the job ends**, success or failure. No copy is kept.
* Output sheets live at temporary capability URLs for **about 24 hours**, then a sweep deletes them. Download anything you want to keep.
* Authentication is a bearer key; only the key's SHA-256 hash is stored — the plaintext is shown once and cannot be recovered, only replaced.

Full request/response details are in the [hosted API reference](../reference/http-api.md) and the [API quickstart](../getting-started/quickstart-api.md).

## The paid boundary

Local-first is a design decision, not a pricing tier. The local tools are not a trial of the hosted API — they are the full engine, every density, never gated. Across the engine's surfaces, the paid boundary is exactly one thing: **whether your bytes leave your machine**. Processing on your own hardware is free; processing on Squish's hardware costs prepaid credits (accounts that have never purchased get a small free daily allowance). If privacy is the constraint, the answer is always the same: stay local, and the engine gives you everything.

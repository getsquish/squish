---
description: The hosted remote MCP endpoint — add Squish to official AI apps by URL, no install, and keep the full navigation loop.
---

# Remote MCP endpoint (hosted, beta)

`https://api.getsquish.app/mcp` — the same engine as the [MCP server](mcp.md), spoken over
the official MCP **Streamable HTTP** transport. It exists for AI apps that only take a
connector URL (Claude Desktop, claude.ai custom connectors): no install, no local ffmpeg.

Unlike the local server, this endpoint runs on Squish's hosted infrastructure: the video is
fetched **from a public URL** by the endpoint — nothing uploads from your machine — and the
sheets are served from short-lived capability URLs. See
[Privacy and data flow](../the-primitive/privacy-and-data-flow.md) for the full split.

## Setup (Claude Desktop / claude.ai)

1. Settings → Connectors → **Add custom connector**
2. Name: `Squish`
3. URL: `https://api.getsquish.app/mcp` — no auth; leave advanced settings empty
4. In a chat: enable Squish under Connectors, then ask about any public video URL

## The tool

The same single tool, `squish_video`, with remote ends — its own contract string,
`squish-mcp-http-v0`:

| Parameter | Difference from the [local server](mcp.md#parameters) |
|---|---|
| `video_url` | Replaces `video_path`: a public http(s) URL of a **direct video file** (not a YouTube/streaming page). Private and internal addresses are refused. |
| `density` | Identical. |
| `start` / `end` | Identical — the [navigation loop](../the-primitive/the-navigation-loop.md) works from official apps, timecodes absolute at every depth. |
| `out_dir` | Not available — the server owns output placement. |

On success the result is one JSON text block — the local result shape with `files[]` as
**~24 h capability URLs**, plus `sheet_ttl_hours` and `job_id` — and the first sheet
attached as an inline MCP image block.

## The inline thumbnail always ships

Official apps cap the total size of a tool result, and models inside official apps
generally **cannot fetch the capability URLs themselves** — the inline image is the model's
only eyes. So the endpoint re-encodes the first sheet down a quality/size ladder until it
fits the budget (~90 KB): easy content arrives crisp; high-detail content arrives as a
smaller thumbnail plus a warning telling the model to read exact labels from
`timecodes[][]` (cells run left→right, top→bottom — the JSON and the pixels never
disagree). A zoomed follow-up call narrows the window, which raises the thumbnail's
effective resolution — the loop self-heals.

## Transport shape

Stateless and POST-only: `GET`/`DELETE` answer `405` (spec-compliant for a server that
opens no streams), responses are plain JSON, and no `Mcp-Session-Id` is ever issued.
Host and Origin headers are validated.

## Beta limits

Unauthenticated while the official-app auth story settles. Abuse is bounded by a global
daily job cap plus a one-video-at-a-time gate (a busy call returns a polite retry message,
never a hang). Fetched videos obey the hosted caps (300 MB / 30 min) and are deleted when
the job ends; sheets expire after ~24 h.

## When to prefer it

- The client is an official AI app that only takes a connector URL → this endpoint.
- The agent has a shell or filesystem (Claude Code, Cursor, Hermes, any stdio client) →
  the [local MCP server](mcp.md): on-device, free, no upload, no caps.

---
description: How to reach the people who build Squish — email, GitHub issues, the FAQ, and what to include so a report can be acted on fast.
---

# Support

Squish is built and supported by a small team — every report is read by the people who
wrote the code.

## Get help

| Channel | Use it for |
|---|---|
| **Email** — [support@getsquish.app](mailto:support@getsquish.app) | anything: bugs, questions about a job, account issues |
| **GitHub issues** — [getsquish/squish](https://github.com/getsquish/squish/issues) | bugs and feature requests in the open-source engine, CLI, or MCP servers |
| **FAQ** — [getsquish.app/faq](https://getsquish.app/faq) | quick answers: privacy, formats, limits |
| **Feedback box** | on every page of [getsquish.app](https://getsquish.app) |

## What helps us help you

- **Which mouth you used** — the web app (getsquish.app), the CLI, the local MCP server,
  the remote MCP connector, or the hosted API.
- **The `job_id`**, if your call returned one (hosted API and remote MCP results carry it) —
  it points us at the exact job.
- **The client** you called from (ChatGPT, Claude Desktop, Claude Code, Cursor, a script…).
- What you expected vs. what happened — an error message pasted verbatim beats a
  description of it.

We never need your video. It is deleted at job end on the hosted lanes, and never leaves
your machine on the local ones — see
[Privacy and data flow](../the-primitive/privacy-and-data-flow.md).

## Common answers

- **"Free daily limit reached"** — the free lane resets at 00:00 UTC. The local CLI/MCP is
  free and unlimited: `npx -y @getsquish/squish`.
- **Sheet links stopped working** — sheet URLs expire after ~24 h by design; re-run the job.
- **A video won't process** — the remote lanes need a direct, publicly reachable video file
  URL (not a YouTube/streaming watch page). Anything ffmpeg decodes works.
- More in [Troubleshooting](troubleshooting.md).

## Service status

The hosted endpoints report health at
[api.getsquish.app/healthz](https://api.getsquish.app/healthz).

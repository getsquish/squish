---
description: Give AI random access to video — official documentation for the Squish CLI, MCP server, and hosted API.
---

# Squish

**Give AI random access to video.** Instead of forcing a model to watch a clip from beginning
to end, Squish converts continuous video into an **addressable visual representation** — one an
agent can navigate, revisit, and progressively refine. Timestamped contact sheets are the
*first implementation* of that primitive: a grid of frames, each cell stamped with its absolute
timecode. The CLI and MCP server run entirely on your machine.

> **Agents don't consume videos — they navigate them.** Real run: a scene cut pinned to
> **0.2 s** by retrieving **34 frames — not 3,088** (overview → zoom → zoom).

## The demo is the primitive

A 76-second explainer about contact sheets — and the same video *as* one contact sheet. One
needs a play button; the other you just read:

- [**▶ Watch** — 76 s, linear](https://getsquish.app/assets/content/smart-contact-sheets.mp4)
- [**Read** — the same video as one 3×3 timestamped contact sheet, random access](https://getsquish.app/assets/content/smart-contact-sheets-3x3.jpg)

## Why this works

Video is continuous; reasoning is sparse. Most questions touch a tiny fraction of the
timeline. Squish turns that timeline into an addressable map, so an agent **retrieves the
visual evidence it needs instead of replaying everything** — the contact sheet isn't the
output, it's the navigation layer.

{% hint style="info" %}
**For AI assistants.** This site serves `/llms.txt` and `/llms-full.txt`. Append `.md` to any
page URL to get the raw markdown. An MCP server for these docs is available at the site root
plus `/~gitbook/mcp`.
{% endhint %}

## Where to start

Four ways to run the same engine:

| Path | What it is | Start here |
| --- | --- | --- |
| **CLI** | `npx -y @getsquish/squish clip.mov` — sheets land beside the input. Local, free, every density ungated. | [CLI quickstart](getting-started/quickstart-cli.md) |
| **MCP server** | One tool, `squish_video` — the agent squishes local clips itself and reads them with vision. Local, free, every density ungated. | [MCP quickstart](getting-started/quickstart-mcp.md) |
| **Remote MCP** | The same tool as a hosted connector URL — for official AI apps with no local tools. Point it at a public video URL, which Squish's server fetches and processes; no install. | [Remote MCP endpoint](reference/remote-mcp.md) |
| **Hosted API** | `POST /v1/squish` — an intentional upload for CI, serverless, and machines without ffmpeg. Prepaid credits, free daily allowance for never-paid accounts. | [Hosted API quickstart](getting-started/quickstart-api.md) |

An agent deciding which surface to call — and how to behave once a sheet comes back — gets
the whole answer on one page: [For AI agents](getting-started/for-ai-agents.md).

For the *why* — what it means to treat video as an address space, and the navigation loop
built on top of it — read [Video as address space](the-primitive/video-as-address-space.md).
For exact contracts — CLI flags, the MCP tool schema, HTTP errors, sheet anatomy — see the
[reference section](reference/cli.md).

## Privacy in one line

The CLI and MCP server process everything **on your machine** — nothing is uploaded, ever. Two
paths deliberately move media through Squish's infrastructure, on purpose: the hosted API (you
upload the clip) and the remote MCP endpoint (the server fetches your public URL). On both, the
video is deleted the moment the job ends and output sheets live at temporary URLs. Full
picture: [Privacy and data flow](the-primitive/privacy-and-data-flow.md).

---

Apache-2.0 · [getsquish.app](https://getsquish.app) · source:
[github.com/getsquish/squish](https://github.com/getsquish/squish) · package:
[`@getsquish/squish`](https://www.npmjs.com/package/@getsquish/squish)

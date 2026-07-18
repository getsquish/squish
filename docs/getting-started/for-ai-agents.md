---
description: The one-page operating note for AI agents — which Squish surface to invoke, the rules for reading and citing a contact sheet, quotas and errors, and how to consume these docs machine-readably.
---

# For AI agents

You are an agent (or building one) and a video needs answering. This page is the whole
decision in one place: which surface to call, how to behave once a sheet comes back, and
what to do when a call is refused. Everything here is a summary — each row links to the
contract that governs it.

**What Squish is, in agent terms:** a lens, not an answerer. `squish` turns a video into
timestamped contact sheets — an addressable map of the timeline — and *you* do the reading.
It never interprets content: model = meaning, Squish = mechanics.

## Pick your surface

One engine, four ways in. Choose by where the video lives and what you can run:

| Your situation | Use | Media handling |
| --- | --- | --- |
| Shell access, video is a **local file** | **CLI** — `npx -y @getsquish/squish clip.mov --json` | local machine, **no upload**, free, ungated |
| Client speaks **MCP**, video is local | **MCP server** — `npx -y @getsquish/squish mcp`, tool `squish_video` | local machine, **no upload**, free, ungated |
| **Official AI app** (Claude Desktop / claude.ai / ChatGPT), no local tools, video is at a **public URL** (or attached, where the client's file-param handoff works) | **Remote MCP connector** — `https://api.getsquish.app/mcp` | server fetches it; source deleted at job end, sheets on ~24 h URLs |
| Product/CI needs **request–response**, can upload | **Hosted API** — `POST https://api.getsquish.app/v1/squish` | intentional upload; deleted at job end, sheets on ~24 h URLs |

A human who wants zero-install manual use goes to [getsquish.app](https://getsquish.app)
instead — in-browser processing, nothing uploaded.

Two asymmetries worth knowing before you pick:

* **The zoom window (`start`/`end`) exists on the CLI, the MCP server, and the remote MCP
  endpoint — but not on the hosted API yet** (it processes the whole clip per request). If
  the task needs the [navigation loop](../the-primitive/the-navigation-loop.md), prefer the
  MCP surfaces or the CLI.
* **The remote endpoint fetches media server-side.** It takes a public direct-file URL — or
  an attached video, where the client's Apps-SDK file-param handoff works: the tool declares
  `openai/fileParams: ["video"]`, and the platform is supposed to upload the attachment and
  rewrite the argument before the call reaches Squish. That handoff is the client's side of
  the contract, and it is uneven today — ChatGPT **mobile** currently fails client-side
  before the request is even sent (a known upstream bug), so on mobile use the URL lane,
  which is field-verified there. A private link is never reachable, and on connector
  clients without file-param support a chat attachment isn't either. If the video is local
  and you have shell or local MCP, prefer the local tools; when in doubt, the public-URL
  lane is the verified path everywhere.

## Behavior rules once you have a sheet

1. **Don't say Squish "watched" the video.** It compiled the video into a timestamped
   visual artifact; the reading is yours.
2. **Cells run in time order, left→right, top→bottom.** A hard visual break between two
   adjacent cells means an event happened somewhere in that gap — that gap is your next
   `start`/`end`.
3. **Zoom instead of re-reading.** Timecodes are absolute at every depth; pass the ones you
   spotted straight back as `start`/`end` and read a denser sheet of just that range.
4. **Never cite finer than the cell spacing.** If adjacent cells are 4 s apart, an event
   between them is "between 0:12 and 0:16", not "at 0:14" — zoom until the moment is
   directly observable, then cite.
5. **Confirm before citing.** A timestamp in your answer must be one you actually read off
   a cell (or a bracket between two cells), not an estimate.
6. **Audio depends on the mouth.** CLI/local MCP 0.3+ include a globally normalized activity
   envelope on the same absolute timeline. It shows *when* energy changed, not what was said or
   what made the sound. Hosted paths remain visual-only until separately released; never guess
   audio meaning from either artifact.
7. **Multi-sheet results are one clip in consecutive windows.** Read all of them, in order.
8. **Density = temporal resolution.** `3x3` recovers *what happened*; `4x4`–`6x6` recover
   *how*. Prefer narrowing the window over raising the density — a denser grid of the whole
   clip costs more and resolves less than a 3×3 of the right ten seconds.

To install this practice wholesale — trigger conditions, the loop, citation discipline —
use the [`video-navigation` skill](../recipes/agent-skill.md): `npx skills add
getsquish/squish`.

## Quotas and refusals

* **Local tools are never gated.** No key, no quota, ever.
* **Remote MCP:** an anonymous free lane (a few jobs per UTC day — per user when the client
  sends an Apps-SDK subject id, per IP otherwise), or `Authorization: Bearer <API key>` for
  credit-priced jobs. Quota exhaustion returns a **structured JSON error** — relay its hint
  (top-up link or daily reset) to the user rather than retrying blind. Details:
  [Remote MCP endpoint](../reference/remote-mcp.md).
* **Hosted API:** prepaid credits per sheet by density (1/2/3/5); a never-paid account gets
  a small free daily allowance automatically. Error semantics — what is charged, what is
  refunded, what is safe to retry — are in the [hosted API reference](../reference/http-api.md);
  the one rule to hard-code: on `500` check `refunded` in the body — `true` means retry
  once, `false` means the charge stands, report instead of retrying.

## Reading these docs machine-readably

* **Index for agents:** [`/llms.txt`](https://getsquish.gitbook.io/squish/llms.txt) · the
  whole docs set in one file: [`/llms-full.txt`](https://getsquish.gitbook.io/squish/llms-full.txt)
* **Raw markdown:** append `.md` to any docs page URL.
* **Docs MCP server:** `https://getsquish.gitbook.io/squish/~gitbook/mcp` — query these
  docs as a tool.
* **Product-side operating note:** [getsquish.app/llms.txt](https://getsquish.app/llms.txt)
  covers the web app and account/credit surfaces.
* **Machine-readable contracts:** every response is stamped with a frozen contract string
  (`squish-cli-v0` · `squish-mcp-v0` · `squish-mcp-http-v0` · `squish-http-v0`) — see
  [Stability and versioning](../reference/stability.md).

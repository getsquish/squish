---
description: Why Squish exists — a timecode on every frame turns a video's timeline into a coordinate system a model can navigate.
---

# Video as an address space

**Give AI random access to video.** That is the product in one sentence. This page explains the concept underneath it: treating a video's timeline as an **address space** — a coordinate system a model can point into and dereference — instead of a stream it has to sit through.

## A raw video is a stream

You can play a stream. You cannot *refer into* it. There is no way to hand a model a location inside a video, no way for the model to say "show me more of *that*", and nothing it can cite back that anyone could check. A model that consumes video linearly pays for every second whether or not that second matters — and most seconds don't.

## A timecode on every cell makes time addressable

A contact sheet — a grid of frames sampled across a clip, each cell stamped with its absolute timecode — is not a collage. It is a **coordinate system**. The model reads the sheet, obtains addresses (`1:07`), and can now *dereference* an address range at higher density: run Squish again over just `1:00–1:15` and get a denser sheet of that window, whose cells carry finer addresses. Every zoom yields finer addresses, and every address stays absolute to the source video, so any timecode from any depth can be cited or reused directly.

```
squish(video)                          → overview sheet (the index)
read the sheet, pick a range           → "the fall is at ~1:07"
squish(video, start=1:00, end=1:15)    → dense sheet of that window
read, refine, repeat                   → as deep as the answer needs
```

The contact sheet is the *page format*, not the product. The product is random access to time for models that can only see stills.

## The Read tool for the time axis

Every agent harness has a Read tool for files — `Read(file, offset, limit)` — because files are too big for context, and no agent reads a whole book front to back. Squish is the Read tool for the time axis:

| Files | Video |
| --- | --- |
| A page of a file | A contact sheet |
| A line number | A timecode |
| Reading a narrower range | Zooming with `start`/`end` |
| A whole-file read | A one-shot video → sheet conversion |

A one-shot conversion — the whole clip as one sheet — is just the degenerate case: the whole-file read. The general primitive is windowed and repeatable, as deep as the question demands. No agent should have to "watch" a whole video any more than it should have to read a whole book.

## Retrieval beats replay

Video is continuous; reasoning is sparse. Most questions touch a tiny fraction of the timeline — a scene cut, the moment an error appears, the step where the assembly goes wrong. The right operation is **retrieval** (fetch the frames the answer needs) rather than **replay** (decode everything and hope attention holds). In a real agent session, a scene cut was pinned to **0.2 s** by retrieving **34 frames instead of 3,088** — the full walkthrough is in [The navigation loop](the-navigation-loop.md). The cost scales with the question, not the footage.

## The boundary: model = meaning, Squish = mechanics

Squish maps *time → frames*, deterministically. It never maps *meaning → time*. There are no embeddings, no semantic search, no "find the goal" call inside the engine — and this is a design principle, not a gap. The semantic layer already exists: it is the calling model reading an overview sheet. "Find the moment the keeper dives" is a *composition* the agent performs — read the overview, pick the range, zoom — not an engine feature.

The rationale is durable: everything semantic a tool builds depreciates every time frontier models improve; deterministic addressing never does. Keeping the engine on the mechanical side of the boundary is what keeps it small, predictable, and useful to every model — including the ones that don't exist yet.

## Where to go next

* [The contact sheet](the-contact-sheet.md) — what the page format physically is
* [The navigation loop](the-navigation-loop.md) — driving overview → zoom → cite, end to end
* [Sheet format spec](../reference/sheet-format.md) — the normative format
* [Quickstart: CLI](../getting-started/quickstart-cli.md) · [Quickstart: MCP](../getting-started/quickstart-mcp.md)

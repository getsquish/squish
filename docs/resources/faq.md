---
description: Direct answers to the questions people actually ask about Squish — audio, cost, privacy, formats, accuracy, licensing.
---

# FAQ

## Does Squish use audio?

The CLI and local MCP server (0.3+) extract a low-rate audio-activity envelope and align it to
the same absolute timeline as the frames. It can reveal *when* energy changes — useful when
the picture barely changes — but it does not play, transcribe, classify, or interpret audio.
Levels use one `clip_peak` scale for the full source, including zoomed runs, so quiet and loud
windows remain comparable. Videos with no audio track still work.

The web app, hosted API, and remote MCP remain visual-only until separately released. For
dialogue or "what made that sound?", you still need a transcript or audio-capable model.

Those tools compose well. Squish timecodes are absolute to the source video, and
transcripts are timestamped on that same time axis — so a contact sheet plus a transcript
line up cell-for-line, and a model given both can connect what was said to what was visible.

## Why not just upload the video to the model?

Sometimes you should. But many models and plans are image-only, video uploads are slow and
token-expensive, and you can't inspect what the model actually "saw". A contact sheet is
compact, works with **any** vision model (including local ones in LM Studio or Ollama), is
inspectable — you see exactly the frames the model sees — and pastes anywhere: chat, docs,
bug reports. See [video as an address space](../the-primitive/video-as-address-space.md) for
the deeper reason: most questions touch a tiny fraction of the timeline, so navigating beats
replaying.

## What does it cost?

Everything in this repo is free: the CLI and MCP server run entirely on your machine, at
every density, with no account and no key — that's permanent, not a trial. The only paid path
is the optional [hosted API](../getting-started/quickstart-api.md) at `api.getsquish.app`,
which runs on prepaid credits for the cases where local processing isn't an option (CI,
serverless, no ffmpeg); accounts that have never purchased get a small free daily allowance,
applied automatically on the first request.

## Is Squish open source?

The engine is — Apache-2.0, published as
[`@getsquish/squish`](https://www.npmjs.com/package/@getsquish/squish) on npm with the source
at [github.com/getsquish/squish](https://github.com/getsquish/squish). That repo is a curated
mirror of a private monorepo (the web app and hosted API live there); issues and PRs are
welcome on the public repo — see [Contributing](contributing.md). The Squish name, logo,
mascot, and brand assets are reserved and not part of the license.

## What video formats work?

Whatever your ffmpeg decodes. The CLI and MCP server shell out to your system
`ffmpeg`/`ffprobe`, so format support is exactly your local build's — in practice that covers
MP4, MOV, WebM, MKV, and most everything else. If `ffprobe` can read a duration from the
file, Squish can sheet it.

## How accurate are the timecodes?

Frame-accurate on modern ffmpeg. The engine uses input seeking (`-ss` before `-i`): it jumps
to the nearest keyframe, then decodes forward to the exact target time. Seeks are issued at
millisecond precision, and the stamped labels adapt to the window — `m:ss` normally,
sub-second (`1:07.3`) when a zoom window is short — with a hard floor of 2 ms per cell so
adjacent cells always carry distinct addresses. Crucially, timecodes are **absolute to the
source video at every zoom depth**: a value stamped on any sheet, however deep the zoom,
refers to that same moment in the original file.

## Do my sheets or videos leave my machine?

Depends which Squish you're using — the honest answer is a split, not a blanket "no":

- **CLI / MCP server (this repo):** nothing leaves your machine, ever. Frames are extracted
  and composed locally; sheets are written to your disk.
- **Web app ([getsquish.app](https://getsquish.app)):** processing runs in your browser;
  videos and photos are not uploaded.
- **Hosted API (`api.getsquish.app`):** the one intentional upload — you send the video to
  get sheets back over temporary links.

Full details, including what the hosted API retains and for how long:
[privacy and data flow](../the-primitive/privacy-and-data-flow.md).

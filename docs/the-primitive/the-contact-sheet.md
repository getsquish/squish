---
description: What a Squish contact sheet physically is — a timecoded grid of frames whose density sets the temporal resolution.
---

# The contact sheet

A contact sheet is the page format of Squish's address space: **one image containing a grid of frames sampled across a time range, each cell stamped with its absolute timecode**. It is the artifact a vision model actually reads — the whole range, at a glance, in the order it happened.

## Anatomy of a sheet

* **Frames are sampled evenly across the requested time range** — the whole clip by default, or a `start`/`end` window.
* **Cells run in time order, left→right, top→bottom.** Adjacent cells that look similar mean little changed in that gap; a hard visual break between cells is where an event happened.
* **Every cell carries a timecode pill** — the moment that frame came from (`0:14`, `1:07.3`). Timecodes are always absolute to the source video, even inside a window, so anything read off a sheet can be cited or passed back as a new `start`/`end`.
* **Long videos produce multiple files**, named `<basename>.sheet-N.jpg`. Each sheet covers a consecutive window of the clip; read them in order. Duration decides how many sheets there are; density decides how many frames each sheet carries.
* **A sheet is visual only.** It carries no audio, speech, or transcript.

## Density is temporal resolution

Density is the grid size — how many frames one sheet samples from its window. It is a dial for temporal resolution, not image quality:

| Density | Cells per sheet |
| --- | ---: |
| `3x3` (default) | 9 |
| `4x4` | 16 |
| `5x5` | 25 |
| `6x6` | 36 |

The default `3x3` recovers **what happened** — the story of the clip. Denser `4x4`–`6x6` grids recover **how it was done** — the steps between the beats. A sheet is a sequence map, not a motion replacement: events between samples are invisible, and denser grids shrink those gaps without eliminating them. When a specific gap matters, don't raise the density on the whole clip — zoom into the gap with a `start`/`end` window instead ([The navigation loop](the-navigation-loop.md)).

## A navigation layer, not the output

Why a contact sheet rather than extracted keyframes or a text summary?

* **Versus keyframes:** keyframe extraction returns a pile of separate stills; their order and their timestamps are lost unless tracked by hand, and a dozen files cost a dozen images of context. A contact sheet bakes order and time into one image — the same coverage, one paste, every frame keeping its address.
* **Versus a summary:** a summary is an *output* of reasoning — already interpreted, able to miss or invent details, with no ground truth to check it against. A contact sheet is an *input* to reasoning: the actual frames, in order, timestamped. An answer derived from a sheet can cite timestamps and be verified against the pixels. The reliable pattern is sheet first, summary second — so the summary is grounded in frames it can point to.

The deeper point: **the sheet is not the deliverable**. It is the navigation layer of the address space described in [Video as an address space](video-as-address-space.md). The model's answer is the output; the sheet is the map it navigated by.

## The normative spec

Everything on this page is conceptual. The exact format — layout geometry, timecode precision rules, multi-sheet planning, and the JSON contract that accompanies each run — is specified normatively in the [sheet format spec](../reference/sheet-format.md).

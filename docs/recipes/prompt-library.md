---
description: Copy-paste prompts for handing a Squish contact sheet to any vision model — each one opens with the primer that makes it work standalone.
---

# Prompt library

Every prompt in this library follows one pattern: **tell the model what the image is before
asking anything of it.** A Squish contact sheet is a grid of video frames, each cell stamped
with its timecode — but a vision model that receives it cold just sees "an image with small
pictures in it". So each prompt opens with the same primer sentence:

> This image is a video contact sheet — frames sampled in order across a video clip, each
> labeled with its timecode.

With the primer in place, the model reads the grid as a timeline and cites the stamped
timecodes back. Because the primer is baked into every prompt below, each one is
self-contained: make a sheet (see the [CLI quickstart](../getting-started/quickstart-cli.md)
or [getsquish.app](https://getsquish.app)), paste the image into ChatGPT, Claude, Gemini — or
a local vision model in LM Studio or Ollama — add one prompt, and go. The same library with
copy buttons lives at [getsquish.app/prompts](https://getsquish.app/prompts).

## Summarize the video

```
This image is a video contact sheet — frames sampled in order across a video clip, each labeled with its timecode. Summarize what happens across the whole clip, then list each major moment as "timecode — what happens".
```

Use when you want the whole clip understood in one pass — a summary first, then an indexed
list of moments you can jump to.

## Find a specific moment

```
This image is a video contact sheet — frames sampled in order across a video clip, each labeled with its timecode. Find where [describe the moment you're looking for] happens and give me its timecode. If it appears more than once, list them all; if it never appears, say so.
```

Use when you're hunting for one event in a clip — fill in the bracket. The "say so" clause
keeps the model from inventing a timecode when the moment isn't on the sheet.

## Play-by-play timeline

```
This image is a video contact sheet — frames sampled in order across a video clip, each labeled with its timecode. Give me a chronological play-by-play of the clip as a list, one line per event, in the format "timecode — what happens".
```

Use when you want a complete event-by-event log of the clip rather than a summary — the
strict one-line format makes the output easy to scan or paste into notes.

## Steps from a tutorial or screen recording

```
This image is a video contact sheet — frames sampled in order across a video clip, each labeled with its timecode. This is a screen recording of someone completing a task. List the steps they take in order, each with the timecode where it happens.
```

Use to turn a screen recording or tutorial video into a numbered, timestamped how-to.

## What changes over time

```
This image is a video contact sheet — frames sampled in order across a video clip, each labeled with its timecode. Describe how things change from the first frame to the last: what is different, and around which timecode each change happens.
```

Use for before/after questions — progress on a build, a scene evolving, a UI drifting between
states — where the answer is the *difference* between frames, not any single frame.

## Debug a screen recording

```
This image is a video contact sheet — frames sampled in order across a video clip, each labeled with its timecode. This screen recording shows a bug. Tell me what goes wrong, the timecode where it first appears, and the steps that led to it.
```

Use on a bug-repro recording: the model pinpoints where the failure first shows up and
reconstructs the steps that preceded it — a timestamped bug report from one paste.

## Read on-screen text

```
This image is a video contact sheet — frames sampled in order across a video clip, each labeled with its timecode. Read any on-screen text, captions, or UI labels visible in the frames, grouped by timecode.
```

Use to extract captions, terminal output, UI labels, or slide text from a clip — grouped by
timecode so you know when each piece of text was on screen.

## Going deeper

If a prompt's answer lands *between* two cells, don't re-prompt harder — re-run Squish with
`--start`/`--end` set to the timecodes around the gap and paste the denser sheet. That's the
[navigation loop](../the-primitive/the-navigation-loop.md); for agents that should run the
whole loop themselves, install the [agent skill](agent-skill.md).

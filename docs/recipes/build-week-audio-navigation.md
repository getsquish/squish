---
description: Reproduce the Build Week audio-guided candidate-selection workflow without private footage.
---

# Build Week: audio-guided candidate selection

The Build Week extension gives the local CLI and MCP server a second mechanical signal: a
normalized audio-activity band aligned to the same absolute source timeline as the visual cells.
It answers one question—**when might a closer look be useful?**—without claiming to understand the
sound.

## What existed before the event

Squish already produced timestamped contact sheets and supported iterative `start`/`end` zooms.
Those absolute timecodes and the overview → zoom loop are the foundation, not Build Week work.

## What Build Week added

- a clip-wide `clip_peak` audio-activity band on local CLI/MCP sheets;
- additive absolute-time `audio.samples[]` metadata;
- preservation of short and high-frequency activity;
- tests, documentation, and an audio-guided candidate-selection workflow.

This is energy, not meaning. There is no transcript, sound-event label, diarization, or emotion
inference. The public release uses one reference scale across a complete source clip; it does not
compare separate files on a shared scale.

## Two proof layers

**Narrative proof.** The public demo uses owner-authorized camera footage: 22 visually repetitive
one-minute clips, an audio-guided candidate range, and a dense visual zoom that confirms a person
briefly appearing at a doorway edge. The footage is private and is not distributed.

**Reproducible proof.** The public repository contains a generated 24-second fixture under
`examples/audio-navigation/`. It stays visually static in an ordinary overview, contains a short
audio transient, and briefly shows a pink marker just afterward.

```bash
git clone https://github.com/getsquish/squish.git
cd squish
./examples/audio-navigation/generate-sample.sh

npx -y @getsquish/squish@0.3.1 \
  examples/audio-navigation/sample.mp4 \
  --json \
  --out /tmp/squish-audio-overview

npx -y @getsquish/squish@0.3.1 \
  examples/audio-navigation/sample.mp4 \
  --density 6x6 \
  --start 11.5 \
  --end 13.5 \
  --json \
  --out /tmp/squish-audio-zoom
```

Read the overview first. Use the audio activity only to propose the `11.5–13.5s` neighborhood,
then inspect the dense visual sheet to confirm when the marker appears. The index proposes; the
zoomed images prove.

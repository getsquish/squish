---
description: Install the drop-in skill file that teaches an agent the video → contact sheet → timestamps recipe, including the zoom loop.
---

# Install the agent skill

The Squish skill is a single markdown file of drop-in instructions that teaches an agent the
whole recipe: when handed a video it cannot ingest, compress it into timestamped contact
sheets (via the Squish CLI or MCP tool), read the sheets with vision, answer with absolute
timecodes — and when the answer hides between two cells, zoom in with `start`/`end` instead
of guessing. An agent with the skill installed reaches for Squish on its own; you never have
to explain the workflow in the prompt.

## Where it lives

[`SKILL.md`](https://github.com/getsquish/squish/blob/main/SKILL.md) at the root of
[github.com/getsquish/squish](https://github.com/getsquish/squish). It declares its own
requirements in the frontmatter: shell access, Node ≥ 20, and `ffmpeg` on PATH.

## Install for Claude Code

Claude Code discovers skills as `SKILL.md` files inside a skills directory. Copy the file
into a folder named after the skill:

```bash
mkdir -p ~/.claude/skills/squish-video-to-contact-sheet
curl -o ~/.claude/skills/squish-video-to-contact-sheet/SKILL.md \
  https://raw.githubusercontent.com/getsquish/squish/main/SKILL.md
```

Use a project's `.claude/skills/` directory instead of `~/.claude/skills/` to scope the skill
to one repo. The skill's `description` frontmatter tells the agent when to trigger it — no
further wiring needed. Pair it with the [MCP server](../getting-started/quickstart-mcp.md)
for the smoothest path: the skill prefers the `squish_video` tool when present and falls back
to running the CLI via `npx`.

## Install anywhere else

The file is plain markdown with a small YAML frontmatter — nothing in it is framework-specific.
For any other agent framework, either drop it wherever that framework loads skill/instruction
files, or paste the body into the agent's system prompt or custom instructions. The only real
requirements are the ones the skill states: the agent needs shell access (or the `squish_video`
MCP tool), vision, Node ≥ 20, and `ffmpeg` on PATH.

## Worked example: Hermes

A variant of this skill ships for the Hermes agent framework
(`squish-video`, in this project's integration docs). Two of its conventions are worth
copying into any skill you adapt from ours:

**A fixed answer shape.** The Hermes skill forbids answering with just a file path and
prescribes the response structure:

1. **Summary** — what the clip shows, one or two sentences.
2. **Key moments with timestamps** — the events that matter, each cited to a cell's timecode.
3. **Notable frames / anomalies** — anything odd and its timecode, or say there were none.

And if the user's question was specific ("find the moment when…"), lead with that answer plus
its timestamp. This turns "the agent made a sheet" into "the agent answered the question".

**Explicit scope.** It restricts itself to local video file paths — if the video is a chat
attachment or a URL, it asks for a local path first — and skips the recipe entirely when the
question isn't about the video's visual content.

## When an agent should reach for it — and when not

Reach for the skill when the video is too long or too large to ingest directly, when the
question spans time (before/after, a scene change, progress, "find the moment when…"), or when
the answer needs precise citations ("at 0:07 the press comes down").

Skip it when the user needs one single specific frame (extract that frame directly instead)
or when the question isn't about the video's visual content at all. A contact sheet is a
visual sequence map — see the [FAQ](../resources/faq.md) on audio.

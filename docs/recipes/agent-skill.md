---
description: Install the video-navigation skill — the protocol that teaches an agent to navigate video via timestamped contact sheets, the zoom loop, and evidence-disciplined citations.
---

# Install the agent skill

The **`video-navigation`** skill is a drop-in protocol document that teaches an agent the
whole practice: when handed a video it cannot ingest, compress it into timestamped contact
sheets, read the grid, zoom into ranges with `start`/`end` instead of guessing, confirm
before citing, and answer with absolute timecodes. An agent with the skill installed reaches
for Squish on its own; you never have to explain the workflow in the prompt. It follows the
open [Agent Skills](https://agentskills.io) format, so it works in any agent that consumes
`SKILL.md` skills.

## Where it lives

[`skills/video-navigation/SKILL.md`](https://github.com/getsquish/squish/tree/main/skills/video-navigation)
in [github.com/getsquish/squish](https://github.com/getsquish/squish). It declares its own
requirements in the frontmatter: a contact-sheet tool — the Squish CLI/MCP locally (Node ≥ 20,
`ffmpeg` on PATH) or the hosted connector.

## Install with the skills CLI (recommended)

One command, works across Claude Code, Cursor, Codex, and every other agent the
[`skills` CLI](https://github.com/vercel-labs/skills) supports:

```bash
npx skills add getsquish/squish
```

## Install by hand (Claude Code)

Claude Code discovers skills as `SKILL.md` files inside a skills directory. Copy the file
into a folder named after the skill:

```bash
mkdir -p ~/.claude/skills/video-navigation
curl -o ~/.claude/skills/video-navigation/SKILL.md \
  https://raw.githubusercontent.com/getsquish/squish/main/skills/video-navigation/SKILL.md
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
requirements are the ones the skill states: the agent needs vision plus a contact-sheet tool —
shell access (Node ≥ 20, `ffmpeg`) or the `squish_video` MCP tool.

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

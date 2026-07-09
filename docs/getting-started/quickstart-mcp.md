---
description: Wire the Squish MCP server into Claude Code, Claude Desktop, Cursor, or any stdio MCP client.
---

# Quickstart: MCP

**Give AI random access to video.** The Squish MCP server is a thin stdio server over the same
engine as the CLI, exposing one tool — **`squish_video`** — that turns a local video into
timestamped contact sheets the agent then reads with vision. Same engine, same output as the
CLI: everything runs on the machine the agent runs on; nothing is uploaded, ever, and every
density is free.

## Requirements

Node ≥ 20 and `ffmpeg` + `ffprobe` on PATH (macOS `brew install ffmpeg` · Ubuntu
`sudo apt-get install ffmpeg`). The server itself runs straight from npm via `npx` — no install
step.

## Register the server

One config block registers the server with any stdio MCP client:

```json
{
  "mcpServers": {
    "squish": { "command": "npx", "args": ["-y", "@getsquish/squish", "mcp"] }
  }
}
```

{% tabs %}
{% tab title="Claude Code" %}
One command:

```bash
claude mcp add squish -- npx -y @getsquish/squish mcp
```

Or commit the config block above as `.mcp.json` at the project root to share the server with
everyone working in the repo.
{% endtab %}

{% tab title="Claude Desktop" %}
Settings → Developer → **Edit Config** opens `claude_desktop_config.json`. Add the block above,
save, and restart Claude Desktop.
{% endtab %}

{% tab title="Cursor" %}
Add the block above to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` for all
projects) — the agent squishes local clips itself.
{% endtab %}
{% endtabs %}

Any other stdio MCP client works the same way — the config block is identical.

## Verify it works

Ask the agent:

> What happens in /path/to/clip.mov? Use squish_video.

The agent should call `squish_video`, get back sheet file paths plus every frame's timecode,
read the sheet(s) with vision, and answer citing the timecodes stamped in each cell.

## The tool

One tool, **`squish_video`** — `{ video_path, density?, start?, end?, out_dir? }` → the CLI
contract **plus** `timecodes[][]` (one per frame, per sheet; `m:ss`, sub-second `m:ss.d` when a
window is short), stamped `"contract": "squish-mcp-v0"`:

```json
{
  "input": "/abs/path/clip.mov",
  "duration": 20.275,
  "frames": 9,
  "sheets": 1,
  "files": ["/abs/path/out/clip.sheet-1.jpg"],
  "warnings": [],
  "timecodes": [["0:01","0:03","0:05","0:07","0:10","0:12","0:14","0:16","0:19"]],
  "contract": "squish-mcp-v0"
}
```

Errors surface as MCP tool errors, not crashes. The `contract` field is a version marker —
parse it to detect breaking changes.

## Keep navigating

`start` / `end` accept seconds or sheet timecodes and window the run to a range — timecodes
stay absolute to the source video, so the agent can drill down repeatedly: overview → spot a
range on the sheet → call `squish_video` again with `start`/`end` set to the timecodes it saw →
denser sheets of a narrower window. See
[the navigation loop](../the-primitive/the-navigation-loop.md).

## Next

- [The navigation loop](../the-primitive/the-navigation-loop.md) — overview → zoom → cite.
- [MCP reference](../reference/mcp.md) — the full tool schema and result contract.
- [CLI quickstart](quickstart-cli.md) — the same engine from a shell, for scripts and
  shell-capable agents.

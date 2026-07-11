// squish MCP server — mouth #2 of the Node engine (experimental, local, stdio).
// A thin wrapper: tool arguments → the SAME runSquish() the CLI uses → the MCP
// contract (CLI fields + timecodes, stamped squish-mcp-v0). No pipeline logic here.
//
// stdout belongs to the MCP transport — nothing in the engine writes to stdout
// (only the CLI's main.ts prints), so stdio framing stays clean.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { DENSITY_ORDER, type DensityKey } from './core/density.ts';
import { parseTime } from './core/format.ts';
import { planTimecodes } from './core/sampling.ts';
import { runSquish } from './engine.ts';
import { formatMcpJson } from './report.ts';

// serverInfo goes out on the wire at initialize (and directory scans import it) — read the
// real version instead of restating it (it sat at a stale hardcoded 0.2.0 through two releases).
const VERSION = (
  JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }
).version;

const server = new McpServer({ name: 'squish', version: VERSION });

server.registerTool(
  'squish_video',
  {
    title: 'Squish a video into a timestamped contact sheet',
    // Unlike the HTTP mouth: sheets land on the caller's own disk (not read-only) and
    // nothing leaves the machine (closed world). Reruns overwrite the same outputs.
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description:
      'Turn a local video file into timestamped contact-sheet JPEG(s) that a vision model can read: ' +
      'frames sampled evenly across the clip, laid out as a grid, each cell stamped with its timecode. ' +
      'Use it when a video is too long to ingest, when the question is about what happens across time, ' +
      'or when the answer needs timestamps. One call replaces a whole ffmpeg → extract → montage ' +
      'pipeline — prefer it even if you have a shell. Read the returned sheet file(s) with vision and cite the ' +
      'timecodes. Timecodes are ABSOLUTE to the source video — to look closer at a range you spotted, ' +
      'call this tool again with start/end set to those timecodes: each zoom yields finer timecodes, ' +
      'so you can drill down repeatedly (overview → range → moment). ' +
      'Runs entirely on-device; requires ffmpeg on PATH.',
    inputSchema: {
      video_path: z.string().describe('Absolute path to a local video file (anything ffmpeg decodes)'),
      density: z
        .enum(DENSITY_ORDER as [DensityKey, ...DensityKey[]])
        .optional()
        .describe('Grid density. 3x3 recovers what happened; denser grids (4x4-6x6) recover how it was done. Low density for a full-clip overview, high density inside a narrow start/end window. Default 3x3.'),
      start: z
        .union([z.number(), z.string()])
        .optional()
        .describe('Zoom-window start — seconds (67.5) or a timecode as stamped on a sheet ("1:07", "1:07.3"). Absolute in the source video. Omit to start at 0.'),
      end: z
        .union([z.number(), z.string()])
        .optional()
        .describe('Zoom-window end — same formats as start. Omit to run to the end of the clip; values past the end are clamped.'),
      out_dir: z.string().optional().describe('Directory for the output sheet(s). Default: beside the input file.'),
    },
  },
  async ({ video_path, density, start, end, out_dir }) => {
    try {
      const parseBound = (name: string, v: number | string | undefined): number | undefined => {
        if (v === undefined) return undefined;
        const t = parseTime(v);
        if (!Number.isFinite(t)) throw new Error(`could not parse ${name} "${v}" — use seconds (90) or a timecode (1:30, 1:07.3)`);
        return t;
      };
      const { report, plan } = await runSquish({
        input: video_path,
        density: density ?? DENSITY_ORDER[0],
        outDir: out_dir,
        start: parseBound('start', start),
        end: parseBound('end', end),
      });
      return { content: [{ type: 'text', text: formatMcpJson(report, planTimecodes(plan)) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

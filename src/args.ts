// CLI argument contract — pure, node:test-covered (TDD'd before implementation).
import { DENSITY, DENSITY_ORDER, type DensityKey } from './core/density.ts';
import { parseTime } from './core/format.ts';

/** Thrown for any user-input problem; main prints message + usage to stderr, exit 1. */
export class UsageError extends Error {}

export interface CliArgs {
  input: string;
  density: DensityKey;
  out?: string;
  json: boolean;
  start?: number; // zoom-window bounds, seconds — absolute in the source video
  end?: number;
}

export const USAGE = `usage: squish <video> [--density 3x3|4x4|5x5|6x6] [--start <t>] [--end <t>] [--out <dir>] [--json]
       squish mcp                 start the MCP server (stdio)
       <t> = seconds (90) or a timecode as stamped on a sheet (1:30, 1:07.3)`;

/** `squish mcp` — the only subcommand. Trailing args are a mistake, not options. */
export function isMcpCommand(argv: string[]): boolean {
  if (argv[0] !== 'mcp') return false;
  if (argv.length > 1) throw new UsageError('squish mcp takes no arguments');
  return true;
}

export function parseArgs(argv: string[]): CliArgs {
  let input: string | undefined;
  let density: DensityKey = DENSITY_ORDER[0]; // 3×3, same default as the web free tier
  let out: string | undefined;
  let json = false;
  let start: number | undefined;
  let end: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--start' || a === '--end') {
      const v = argv[++i];
      const t = v === undefined ? NaN : parseTime(v);
      if (!Number.isFinite(t)) throw new UsageError(`${a} needs a time — seconds (90) or a timecode (1:30)`);
      if (a === '--start') start = t;
      else end = t;
    } else if (a === '--density') {
      const v = argv[++i];
      if (!v || !(v in DENSITY)) throw new UsageError(`--density must be one of ${DENSITY_ORDER.join('|')}`);
      density = v as DensityKey;
    } else if (a === '--out') {
      const v = argv[++i];
      if (!v) throw new UsageError('--out needs a directory');
      out = v;
    } else if (a === '--json') {
      json = true;
    } else if (a.startsWith('-')) {
      throw new UsageError(`unknown flag: ${a}`);
    } else if (input !== undefined) {
      throw new UsageError('one video per run — got a second input: ' + a);
    } else {
      input = a;
    }
  }

  if (!input) throw new UsageError('missing <video> input');
  return { input, density, out, json, start, end };
}

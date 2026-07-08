import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMcpCommand, parseArgs, USAGE, UsageError } from '../src/args.ts';

test('parses a lone input with defaults (3x3, no out, plain output, no window)', () => {
  const a = parseArgs(['clip.mp4']);
  assert.deepEqual(a, {
    input: 'clip.mp4', density: '3x3', out: undefined, json: false,
    start: undefined, end: undefined,
  });
});

test('accepts every valid --density', () => {
  for (const d of ['3x3', '4x4', '5x5', '6x6']) {
    assert.equal(parseArgs(['clip.mp4', '--density', d]).density, d);
  }
});

test('rejects an invalid --density', () => {
  assert.throws(() => parseArgs(['clip.mp4', '--density', '7x7']), UsageError);
  assert.throws(() => parseArgs(['clip.mp4', '--density']), UsageError);
});

test('--json turns on JSON output', () => {
  assert.equal(parseArgs(['clip.mp4', '--json']).json, true);
});

test('--out captures the output directory', () => {
  assert.equal(parseArgs(['clip.mp4', '--out', '/tmp/sheets']).out, '/tmp/sheets');
});

test('--out without a value throws', () => {
  assert.throws(() => parseArgs(['clip.mp4', '--out']), UsageError);
});

test('missing input throws', () => {
  assert.throws(() => parseArgs([]), UsageError);
  assert.throws(() => parseArgs(['--json']), UsageError);
});

test('unknown flag throws', () => {
  assert.throws(() => parseArgs(['clip.mp4', '--wat']), UsageError);
});

test('a second positional input throws (one video per run)', () => {
  assert.throws(() => parseArgs(['a.mp4', 'b.mp4']), UsageError);
});

test('flags may come before the input', () => {
  const a = parseArgs(['--json', '--density', '4x4', 'clip.mov']);
  assert.equal(a.input, 'clip.mov');
  assert.equal(a.density, '4x4');
  assert.equal(a.json, true);
});

// --- --start / --end (the zoom-loop window) --------------------------------------

test('--start/--end accept plain seconds', () => {
  const a = parseArgs(['clip.mp4', '--start', '90', '--end', '120.5']);
  assert.equal(a.start, 90);
  assert.equal(a.end, 120.5);
});

test('--start/--end accept sheet timecodes (what an agent reads off a sheet)', () => {
  const a = parseArgs(['clip.mp4', '--start', '1:30', '--end', '2:05.5']);
  assert.equal(a.start, 90);
  assert.equal(a.end, 125.5);
});

test('malformed --start/--end throws', () => {
  assert.throws(() => parseArgs(['clip.mp4', '--start', 'abc']), UsageError);
  assert.throws(() => parseArgs(['clip.mp4', '--end', '1:75']), UsageError);
});

test('--start/--end without a value throws', () => {
  assert.throws(() => parseArgs(['clip.mp4', '--start']), UsageError);
  assert.throws(() => parseArgs(['clip.mp4', '--end']), UsageError);
});

test('USAGE documents the window flags', () => {
  assert.match(USAGE, /--start/);
  assert.match(USAGE, /--end/);
});

// --- isMcpCommand (the `squish mcp` subcommand) ---------------------------------

test('isMcpCommand: bare `mcp` routes to the MCP server', () => {
  assert.equal(isMcpCommand(['mcp']), true);
});

test('isMcpCommand: a video path is not the subcommand', () => {
  assert.equal(isMcpCommand(['clip.mov']), false);
  assert.equal(isMcpCommand([]), false);
  assert.equal(isMcpCommand(['--json']), false);
});

test('isMcpCommand: `mcp` with trailing args is a usage error', () => {
  assert.throws(() => isMcpCommand(['mcp', '--json']), UsageError);
});

test('USAGE documents both forms', () => {
  assert.match(USAGE, /squish <video>/);
  assert.match(USAGE, /squish mcp/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatJson, formatMcpJson, formatPlain, type RunReport } from '../src/report.ts';

const sample: RunReport = {
  input: '/v/squid.mov',
  duration: 20.275,
  frames: 9,
  sheets: 1,
  files: ['/v/out/squid.sheet-1.jpg'],
  audio: {
    present: true,
    normalization: 'clip_peak',
    window: { start: 0, end: 20.275 },
    samples: [{ time: 10.138, level: 1 }],
  },
  warnings: [],
};

test('formatJson emits the additive v0 contract keys in order, stamped squish-cli-v0', () => {
  const parsed = JSON.parse(formatJson(sample));
  assert.deepEqual(Object.keys(parsed), ['input', 'duration', 'frames', 'sheets', 'files', 'audio', 'warnings', 'contract']);
  assert.deepEqual(parsed, { ...sample, contract: 'squish-cli-v0' });
});

test('formatMcpJson = CLI fields + timecodes, stamped squish-mcp-v0, keys in order', () => {
  const timecodes = [['0:01', '0:03', '0:05', '0:07', '0:10', '0:12', '0:14', '0:16', '0:19']];
  const parsed = JSON.parse(formatMcpJson(sample, timecodes));
  assert.deepEqual(Object.keys(parsed), ['input', 'duration', 'frames', 'sheets', 'files', 'audio', 'warnings', 'timecodes', 'contract']);
  assert.deepEqual(parsed, { ...sample, timecodes, contract: 'squish-mcp-v0' });
});

test('a windowed report adds window after duration — and ONLY when windowed (spec I6)', () => {
  const windowed: RunReport = { ...sample, window: { start: 5, end: 10 } };
  const parsed = JSON.parse(formatJson(windowed));
  assert.deepEqual(Object.keys(parsed), ['input', 'duration', 'window', 'frames', 'sheets', 'files', 'audio', 'warnings', 'contract']);
  assert.deepEqual(parsed.window, { start: 5, end: 10 });
  // unwindowed output stays byte-identical to the frozen v0 shape
  assert.equal(JSON.parse(formatJson(sample)).window, undefined);
});

test('formatMcpJson carries the window the same way', () => {
  const windowed: RunReport = { ...sample, window: { start: 5, end: 10 } };
  const parsed = JSON.parse(formatMcpJson(windowed, [['0:06']]));
  assert.deepEqual(Object.keys(parsed), ['input', 'duration', 'window', 'frames', 'sheets', 'files', 'audio', 'warnings', 'timecodes', 'contract']);
  assert.equal(JSON.parse(formatMcpJson(sample, [['0:06']])).window, undefined);
});

test('formatPlain prints one path per line, summary last', () => {
  const lines = formatPlain(sample).trimEnd().split('\n');
  assert.equal(lines[0], '/v/out/squid.sheet-1.jpg');
  assert.equal(lines.at(-1), 'summary: duration=20.275s sheets=1 frames=9');
});

test('formatPlain surfaces warnings as warning: lines before the summary', () => {
  const r = { ...sample, warnings: ['frame 3 unreadable — cell left black'] };
  const lines = formatPlain(r).trimEnd().split('\n');
  assert.equal(lines.at(-2), 'warning: frame 3 unreadable — cell left black');
  assert.equal(lines.at(-1)?.startsWith('summary:'), true);
});

test('multi-sheet: every file gets its own line, sheet order preserved', () => {
  const r = {
    ...sample,
    sheets: 2,
    frames: 18,
    files: ['/v/out/squid.sheet-1.jpg', '/v/out/squid.sheet-2.jpg'],
  };
  const lines = formatPlain(r).trimEnd().split('\n');
  assert.deepEqual(lines.slice(0, 2), r.files);
});

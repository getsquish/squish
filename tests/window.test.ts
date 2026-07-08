// resolveWindow — the pure window-validation half of the zoom loop (spec §4 semantics):
// forgiving where an agent is naturally imprecise (end past the clip → clamp), strict where
// a value signals a misunderstanding of the coordinate system (negative/after-the-end start).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWindow } from '../src/engine.ts';

test('no window → the whole clip', () => {
  assert.deepEqual(resolveWindow(100), { start: 0, end: 100 });
});

test('start only → start to the end of the clip', () => {
  assert.deepEqual(resolveWindow(100, 30), { start: 30, end: 100 });
});

test('end past the duration clamps (agents say "to the end" without knowing it)', () => {
  assert.deepEqual(resolveWindow(100, undefined, 150), { start: 0, end: 100 });
});

test('fractional bounds pass through exactly', () => {
  assert.deepEqual(resolveWindow(100, 0.5, 2.75), { start: 0.5, end: 2.75 });
});

test('negative start throws', () => {
  assert.throws(() => resolveWindow(100, -1), /start/);
});

test('start at/after the clip end throws and names the duration', () => {
  assert.throws(() => resolveWindow(100, 100), /1:40/);
  assert.throws(() => resolveWindow(100, 250), /1:40/);
});

test('empty window (start ≥ end, incl. after end-clamp) throws', () => {
  assert.throws(() => resolveWindow(100, 50, 40), /after start/);
  assert.throws(() => resolveWindow(100, 50, 50), /after start/);
});

test('non-finite bounds throw instead of slipping past comparisons (NaN < 0 is false)', () => {
  assert.throws(() => resolveWindow(100, NaN));
  assert.throws(() => resolveWindow(100, 10, NaN));
});

// Codex rounds 2+3 (PR #35): extractFrame seeks with t.toFixed(3) (millisecond precision),
// and cells sample at window midpoints — a 1 ms/cell floor puts midpoints on half-ms values
// whose round-to-ms collides unpredictably. A 2 ms/cell floor guarantees adjacent midpoints
// differ by ≥ 2 ms, so their rounded seek args (and floored labels) differ by ≥ 1 ms. Proven,
// not hoped.
test('window below 2 ms/cell is rejected (rounded seek args must stay distinct)', () => {
  assert.throws(() => resolveWindow(100, 10, 10.036, 36), /zoom out|lower the density/i); // 1 ms/cell
  assert.throws(() => resolveWindow(100, 10, 10.005, 9), /zoom out|lower the density/i);  // 0.56 ms/cell
});

test('window exactly at the 2 ms/cell floor is accepted (no float-edge rejection)', () => {
  assert.deepEqual(resolveWindow(100, 10, 10.072, 36), { start: 10, end: 10.072 });
});

test('cells omitted → no floor check (pure callers without a density)', () => {
  assert.deepEqual(resolveWindow(100, 10, 10.001), { start: 10, end: 10.001 });
});

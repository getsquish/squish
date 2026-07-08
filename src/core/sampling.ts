import { GRID } from './constants';
import { DENSITY, DENSITY_ORDER, type DensityKey } from './density';
import { fmtTime } from './format';

export interface SheetPlan {
  durationSec: number;
  sheets: number;
  perSheet: number;
  cols: number;
  rows: number;
  density: DensityKey;    // which density this plan renders (drives cell size + timecode scale)
  timestamps: number[][]; // [sheetIndex][frameIndex] in seconds
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Density is the continuity dial (frames per sheet); duration still drives how MANY sheets
// (one movie, several episode-sheets). cols/rows/perSheet come straight from the density table.
export function planSheets(
  durationSec: number,
  opts: { density?: DensityKey; maxSheets?: number; secondsPerSheet?: number } = {},
): SheetPlan {
  const density = opts.density ?? DENSITY_ORDER[0]; // default = lowest density (3×3)
  const spec = DENSITY[density];
  const perSheet = spec.cells;
  const cols = spec.cols;
  const rows = spec.rows;
  const maxSheets = opts.maxSheets ?? GRID.maxSheets;
  const secondsPerSheet = opts.secondsPerSheet ?? GRID.secondsPerSheet;

  const safeDur = isFinite(durationSec) && durationSec > 0 ? durationSec : 0;
  const sheets = clamp(Math.ceil(safeDur / secondsPerSheet) || 1, 1, maxSheets);

  const windowLen = safeDur / sheets;
  // End margin keeps the last sample off the exact EOF, but must never exceed half a sample
  // step — a fixed 0.02s would collapse the trailing cells of a tiny zoom window onto one
  // timestamp (duplicate addresses at max zoom — Codex P2, PR #35). For any clip/window
  // ≥ 0.36s at 3×3 this is exactly the old 0.02 — behavior unchanged.
  const margin = Math.min(0.02, windowLen / perSheet / 2);
  const timestamps: number[][] = [];
  for (let s = 0; s < sheets; s++) {
    const start = s * windowLen;
    const row: number[] = [];
    for (let i = 0; i < perSheet; i++) {
      const t = start + (windowLen * (i + 0.5)) / perSheet;
      row.push(Math.min(t, Math.max(0, safeDur - margin)));
    }
    timestamps.push(row);
  }
  return { durationSec: safeDur, sheets, perSheet, cols, rows, density, timestamps };
}

// Timecode strings for a plan — precision adapts to the sample step so adjacent cells always
// resolve to distinct addresses (adaptive-visual-retrieval spec I2). ONE rule, used by every
// mouth: the pixels stamped on a sheet and the timecodes in MCP JSON must never disagree.
export function planTimecodes(plan: SheetPlan): string[][] {
  const row = plan.timestamps[0] ?? [];
  const step = row.length > 1 ? row[1] - row[0] : Infinity;
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
  return plan.timestamps.map((r) => r.map((t) => fmtTime(t, decimals)));
}

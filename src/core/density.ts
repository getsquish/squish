// Contact-sheet density = a pure capability (NO licensing concern here — see licensing.ts).
// The export widths + density-scaled timecode/pill sizes are the legibility-validated R1 §5a
// numbers (ported from the native spike): denser sheets render wider and scale their timecode
// type up, or the per-cell labels become illegible. 6×6 is the enabled ceiling.

export type DensityKey = '3x3' | '4x4' | '5x5' | '6x6';

export interface DensitySpec {
  cols: number;
  rows: number;
  cells: number;
  exportWidth: number; // longest-edge export width for this density (px)
  timecodePx: number;  // timecode glyph size at exportWidth
  pillPx: number;      // timecode pill height at exportWidth
}

export const EXPORT_MAX_WIDTH = 2560;

export const DENSITY: Record<DensityKey, DensitySpec> = {
  '3x3': { cols: 3, rows: 3, cells: 9, exportWidth: 1536, timecodePx: 22, pillPx: 36 },
  '4x4': { cols: 4, rows: 4, cells: 16, exportWidth: 1920, timecodePx: 27, pillPx: 41 },
  '5x5': { cols: 5, rows: 5, cells: 25, exportWidth: 2304, timecodePx: 31, pillPx: 45 },
  '6x6': { cols: 6, rows: 6, cells: 36, exportWidth: 2560, timecodePx: 35, pillPx: 49 },
};

export const DENSITY_ORDER: DensityKey[] = ['3x3', '4x4', '5x5', '6x6'];

export const ENABLED_CEILING: DensityKey = '6x6';

// Cell width that fills this density's export width inside an even gutter. Driving the cell
// off exportWidth (not a fixed px) is what keeps a 6×6 sheet rendered wide enough that its
// density-scaled timecodes stay legible.
export function cellWidthForDensity(density: DensityKey, pad = 8): number {
  const { exportWidth, cols } = DENSITY[density];
  return Math.max(1, Math.floor((exportWidth - (cols + 1) * pad) / cols));
}

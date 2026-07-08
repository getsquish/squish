import { fmtTime } from './format';

export interface CellBox { x: number; y: number; w: number; h: number; }

export interface SheetLayout {
  width: number;
  height: number;
  headerH: number;
  pad: number;
  labelH: number;
  brandBandH: number;
  cells: CellBox[];
}

export function layoutSheet(params: {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  count: number;
  pad?: number;
  headerH?: number;
  labelH?: number;
  brandBandH?: number;
}): SheetLayout {
  const { cols, rows, cellW, cellH, count } = params;
  const pad = params.pad ?? 8;
  const headerH = params.headerH ?? 84;
  const labelH = params.labelH ?? 22;
  const brandBandH = params.brandBandH ?? 0;

  const width = cols * cellW + (cols + 1) * pad;
  const height = headerH + rows * (cellH + labelH) + (rows + 1) * pad + brandBandH;

  const cells: CellBox[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (cellW + pad);
    const y = headerH + pad + row * (cellH + labelH + pad);
    cells.push({ x, y, w: cellW, h: cellH });
  }
  return { width, height, headerH, pad, labelH, brandBandH, cells };
}

export function frameLabel(index: number, timeSec: number): string {
  return '#' + String(index + 1).padStart(2, '0') + '   ' + fmtTime(timeSec);
}

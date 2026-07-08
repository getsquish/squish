// ANNOTATED PORT of the drawing half of src/platform-web/video.ts (renderGridSheets).
//
// The web renderer is two things interleaved: (1) a seek dance (seekTo / frameReady /
// isBlack retry) that exists purely to fight iOS <video>, and (2) the composition —
// dark canvas → cells → timecode pills → brand footer band. ffmpeg extraction is
// deterministic, so this port keeps ONLY (2). Visual constants must stay in sync with
// the web renderer until a shared module exists (planned when mouth #2 — MCP — lands):
// pad 8 · cell bg #000 · canvas #0E0E10 · pill rgba(0,0,0,.85) r4 · band #1A1A1A with
// 4px #EC4D97 rule · brandBandH = max(96, tcPx*3) · JPEG q0.70.
//
// Spike debt (known): Space Grotesk/Mono ship as woff2 in this repo (@fontsource) and
// Skia wants ttf/otf — so text renders with system sans-serif/monospace fallbacks here.
import { createCanvas, loadImage, type Image, type SKRSContext2D } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DENSITY, cellWidthForDensity } from './core/density.ts';
import { layoutSheet, type SheetLayout } from './core/gridLayout.ts';
import { planTimecodes, type SheetPlan } from './core/sampling.ts';

/** Rounded-rect path (ported verbatim; SKRS has roundRect but keeping the same geometry). */
function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// The octopus mark for the footer — the SAME repo asset the web loads from /logo-icon.webp.
let _brandLogo: Image | null = null;
let _brandLogoTried = false;
async function ensureBrandLogo(): Promise<void> {
  if (_brandLogo || _brandLogoTried) return;
  _brandLogoTried = true;
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    _brandLogo = await loadImage(path.resolve(here, '../../public/logo-icon.webp'));
  } catch { /* keep the drawn-square fallback */ }
}

/** Footer brand band — port of drawFooterBrand (web): centered mark + SQUISH + getsquish.app. */
function drawFooterBrand(ctx: SKRSContext2D, lay: SheetLayout, sheetIndex: number, sheets: number): void {
  const { width: W, height: H, brandBandH: bh, pad } = lay;
  const y0 = H - bh;
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(0, y0, W, bh);
  ctx.fillStyle = '#EC4D97';
  ctx.fillRect(0, y0, W, 4);

  const m = Math.round(bh * 0.56);
  const fs = Math.round(bh * 0.32);
  const subFs = Math.round(fs * 0.92);
  const gap = Math.round(bh * 0.26);
  const ly = y0 + Math.round((bh - m) / 2);
  const cy = y0 + Math.round(bh / 2);

  ctx.font = `700 ${fs}px sans-serif`;
  const squishW = ctx.measureText('SQUISH').width;
  ctx.font = `500 ${subFs}px monospace`;
  const subW = ctx.measureText('getsquish.app').width;
  let x = Math.round((W - (m + gap + squishW + gap + subW)) / 2);

  if (_brandLogo) {
    ctx.drawImage(_brandLogo, x, ly, m, m);
  } else {
    ctx.fillStyle = '#EC4D97';
    roundRect(ctx, x, ly, m, m, Math.round(m * 0.28));
    ctx.fill();
    ctx.fillStyle = '#0E0E10';
    const im = Math.round(m * 0.4);
    roundRect(ctx, x + Math.round((m - im) / 2), ly + Math.round((m - im) / 2), im, im, Math.round(im * 0.3));
    ctx.fill();
  }
  x += m + gap;

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `700 ${fs}px sans-serif`;
  ctx.fillStyle = '#E9E6DE';
  ctx.fillText('SQUISH', x, cy);
  x += squishW + gap;
  ctx.font = `500 ${subFs}px monospace`;
  ctx.fillStyle = '#9A958B';
  ctx.fillText('getsquish.app', x, cy);

  if (sheets > 1) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9A958B';
    ctx.fillText(`${sheetIndex + 1} / ${sheets}`, W - pad - 6, cy);
    ctx.textAlign = 'left';
  }
}

export interface ComposeResult {
  buffers: Buffer[];
  warnings: string[];
}

/**
 * Compose one contact-sheet JPEG per planned sheet from already-extracted frame files.
 * Source aspect comes from the first readable frame (ffmpeg already applied rotation).
 */
export async function composeSheets(plan: SheetPlan, framePaths: string[][]): Promise<ComposeResult> {
  const warnings: string[] = [];
  await ensureBrandLogo();

  // First readable frame → source aspect for the cell math (web used videoWidth/Height).
  let first: Image | null = null;
  for (const p of framePaths.flat()) {
    try { first = await loadImage(p); break; } catch { /* try the next */ }
  }
  if (!first) throw new Error('no readable frames were extracted — cannot compose a sheet');

  const pad = 8;
  const tcPx = DENSITY[plan.density].timecodePx;
  const pillH = DENSITY[plan.density].pillPx;
  const brandBandH = Math.max(96, Math.round(tcPx * 3.0));
  const cellW = cellWidthForDensity(plan.density, pad);
  const cellH = Math.max(1, Math.round((cellW * first.height) / first.width));
  // One precision rule for pixels AND JSON (spec I2) — planTimecodes, same as the MCP mouth.
  const timecodes = planTimecodes(plan);

  const buffers: Buffer[] = [];
  for (let s = 0; s < plan.sheets; s++) {
    const lay = layoutSheet({
      cols: plan.cols, rows: plan.rows, cellW, cellH, count: plan.perSheet,
      pad, headerH: 0, labelH: 0, brandBandH,
    });
    const canvas = createCanvas(lay.width, lay.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0E0E10';
    ctx.fillRect(0, 0, lay.width, lay.height);

    for (let i = 0; i < plan.perSheet; i++) {
      const cell = lay.cells[i];
      ctx.fillStyle = '#000';
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
      try {
        const img = await loadImage(framePaths[s][i]);
        ctx.drawImage(img, cell.x, cell.y, cell.w, cell.h);
      } catch {
        warnings.push(`sheet ${s + 1} frame ${i + 1}: unreadable — cell left black`);
      }

      // Timecode pill, bottom-left inside the cell (port: mono on a 0.85 black pill, r4).
      const tc = timecodes[s][i];
      ctx.font = `600 ${tcPx}px monospace`;
      ctx.textAlign = 'left';
      const padX = Math.round(tcPx * 0.5);
      const pillW = Math.ceil(ctx.measureText(tc).width) + padX * 2;
      const pillX = cell.x + Math.round(tcPx * 0.35);
      const pillY = cell.y + cell.h - pillH - Math.round(tcPx * 0.35);
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      roundRect(ctx, pillX, pillY, pillW, pillH, 4);
      ctx.fill();
      ctx.fillStyle = '#E9E6DE';
      ctx.textBaseline = 'middle';
      ctx.fillText(tc, pillX + padX, pillY + Math.round(pillH / 2) + 1);
    }

    drawFooterBrand(ctx, lay, s, plan.sheets);
    buffers.push(await canvas.encode('jpeg', 70)); // web invariant #6: grids encode at q0.70
  }

  return { buffers, warnings };
}

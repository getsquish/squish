// The shared Node engine — ONE pipeline, many mouths. Extracted verbatim from main.ts
// so the CLI (main.ts) and the MCP server (mcp.ts) run the exact same code path:
// probe duration → core planSheets → ffmpeg extract → compose sheets → write JPEGs.
// Neither mouth may reimplement any of this.
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DENSITY, type DensityKey } from './core/density.ts';
import { fmtTime } from './core/format.ts';
import { planSheets, type SheetPlan } from './core/sampling.ts';
import { absentAudioActivity, analyzePcmActivity, decodePcmS16le } from './audio.ts';
import { assertFfmpeg, extractAudioPcm, extractFrame, probeDuration, probeHasAudio } from './ffmpeg.ts';
import { composeSheets } from './render.ts';
import type { RunReport } from './report.ts';

export interface RunOptions {
  input: string;   // path to a local video (resolved here)
  density: DensityKey;
  outDir?: string; // default: beside the input
  start?: number;  // zoom-window bounds, seconds — ABSOLUTE in the source video (spec I1)
  end?: number;
  // Optional cooperative abort — checked before ffmpeg and between frame extractions, so a
  // caller whose client can vanish mid-run (the remote MCP mouth) holds the droplet's
  // single-runner gate for at most ~one frame seek after the disconnect. Mouths that don't
  // pass it are unaffected.
  signal?: AbortSignal;
}

// Window semantics (adaptive-visual-retrieval spec §4): clamp what an agent can't know
// (end past the clip — "from 5:00 to the end" is natural), reject what signals a broken
// coordinate system (negative/after-the-end start, empty window, non-finite bounds).
export function resolveWindow(duration: number, start?: number, end?: number, cells?: number): { start: number; end: number } {
  const s = start ?? 0;
  if (!Number.isFinite(s) || s < 0) throw new Error('start must be a time ≥ 0');
  if (s >= duration) {
    throw new Error(`start (${fmtTime(s, 1)}) is at/after the end of the clip (${fmtTime(duration, 1)})`);
  }
  const e = Math.min(end ?? duration, duration);
  if (!Number.isFinite(e) || e <= s) {
    throw new Error(`window is empty — end (${fmtTime(e, 1)}) must be after start (${fmtTime(s, 1)})`);
  }
  // Addressable floor: extractFrame seeks with t.toFixed(3) (millisecond precision) and
  // cells sample at window MIDPOINTS — at 1 ms/cell those land on half-ms values whose
  // round-to-ms collides unpredictably (Codex round 3). 2 ms/cell guarantees adjacent
  // midpoints differ by ≥ 2 ms, so rounded seek args and floored labels stay distinct —
  // proven, not hoped. Below the floor, reject instead of pretending (spec I2). Epsilon
  // dodges the float edge so a window exactly at the floor is accepted.
  if (cells && e - s + 1e-9 < cells * 0.002) {
    throw new Error(
      `window too small to address distinctly: ${cells} cells across ${Math.round((e - s) * 1000)} ms ` +
      `(the engine seeks at millisecond precision — minimum ≈ ${cells * 2} ms at this density); ` +
      `zoom out or lower the density`,
    );
  }
  return { start: s, end: e };
}

export interface RunResult {
  report: RunReport;
  plan: SheetPlan; // exposed so mouths can derive extras (e.g. MCP timecodes) from core data
}

const throwIfAborted = (signal: AbortSignal | undefined) => {
  if (signal?.aborted) throw new Error('aborted before completion');
};

export async function runSquish(opts: RunOptions): Promise<RunResult> {
  throwIfAborted(opts.signal);
  await assertFfmpeg();

  const input = path.resolve(opts.input);
  try {
    await access(input);
  } catch {
    throw new Error(`input not found: ${input}`);
  }

  const duration = await probeDuration(input);
  const windowed = opts.start !== undefined || opts.end !== undefined;
  const win = resolveWindow(duration, opts.start, opts.end, DENSITY[opts.density].cells);
  // Spec I5: a windowed run ≡ a run on a virtually-trimmed clip — plan on the window's
  // length, then shift every timestamp by +start so all addresses stay absolute (I1).
  const plan0 = planSheets(win.end - win.start, { density: opts.density });
  const plan = win.start > 0
    ? { ...plan0, timestamps: plan0.timestamps.map((r) => r.map((t) => t + win.start)) }
    : plan0;
  const outDir = path.resolve(opts.outDir ?? path.dirname(input));
  await mkdir(outDir, { recursive: true });
  const base = path.basename(input, path.extname(input));

  // Guardrail 2: per-run tmpdir under os.tmpdir(), removed in finally — success OR error.
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'squish-'));
  try {
    const audioWarnings: string[] = [];
    let audio = absentAudioActivity(win);
    if (await probeHasAudio(input)) {
      try {
        const pcmSampleRate = 1_000;
        const pcm = decodePcmS16le(await extractAudioPcm(input, duration, pcmSampleRate));
        audio = analyzePcmActivity(pcm, {
          sourceDuration: duration,
          window: win,
          outputSamples: plan.sheets * 96,
          pcmSampleRate,
        });
      } catch (error) {
        audioWarnings.push(`audio activity unavailable — visual sheets still complete (${error instanceof Error ? error.message : String(error)})`);
      }
    }

    const framePaths: string[][] = [];
    for (let s = 0; s < plan.sheets; s++) {
      const row: string[] = [];
      for (let i = 0; i < plan.perSheet; i++) {
        throwIfAborted(opts.signal); // between frames: a dead client stops costing within ~one seek
        const p = path.join(tmp, `f-${s}-${i}.jpg`);
        await extractFrame(input, plan.timestamps[s][i], p);
        row.push(p);
      }
      framePaths.push(row);
    }

    const composed = await composeSheets(plan, framePaths, audio);
    const warnings = [...audioWarnings, ...composed.warnings];
    const { buffers } = composed;

    const files: string[] = [];
    for (let s = 0; s < buffers.length; s++) {
      const f = path.join(outDir, `${base}.sheet-${s + 1}.jpg`);
      await writeFile(f, buffers[s]);
      files.push(f);
    }

    const round3 = (n: number) => Math.round(n * 1000) / 1000;
    const report: RunReport = {
      input,
      duration,
      // Echo the RESOLVED window (post-clamp) only when the caller asked for one (spec I6).
      ...(windowed ? { window: { start: round3(win.start), end: round3(win.end) } } : {}),
      frames: plan.sheets * plan.perSheet,
      sheets: files.length,
      files,
      audio,
      warnings,
    };
    return { report, plan };
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

// Thin ffmpeg/ffprobe wrappers — the Node replacement for the web's <video> seek dance.
// execFile (no shell) keeps paths with spaces/quotes safe.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

// The exact preflight message is a D6 contract (message-only hosted fallback): install lines
// a human can run immediately, THEN the hosted pointer — never an auto-upload.
export const FFMPEG_HINT = `ffmpeg + ffprobe are required (Squish samples frames with them).
  macOS:  brew install ffmpeg
  Ubuntu: sudo apt-get install ffmpeg
No install? The hosted API squishes without local tools — free daily allowance, no card:
  https://getsquish.app/developers`;

/** Preflight: fail fast with an install hint instead of a mid-run ENOENT. */
export async function assertFfmpeg(): Promise<void> {
  try {
    await run('ffprobe', ['-version']);
    await run('ffmpeg', ['-version']);
  } catch {
    throw new Error(FFMPEG_HINT);
  }
}

export async function probeDuration(input: string): Promise<number> {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    input,
  ]);
  const d = parseFloat(stdout.trim());
  if (!isFinite(d) || d <= 0) throw new Error(`could not read a duration from ${input}`);
  return d;
}

/**
 * Extract the frame at t seconds into outPath (jpg, q:v 2 ≈ visually lossless temp frame).
 * -ss BEFORE -i = input seeking: jumps to the nearest keyframe then decodes forward to t —
 * fast AND frame-accurate on modern ffmpeg. Rotation metadata is applied by ffmpeg, so the
 * emitted jpg already has the display orientation (portrait iPhone clips come out portrait).
 */
export async function extractFrame(input: string, t: number, outPath: string): Promise<void> {
  await run('ffmpeg', [
    '-v', 'error',
    '-ss', t.toFixed(3),
    '-i', input,
    '-frames:v', '1',
    '-q:v', '2',
    '-y', outPath,
  ]);
}

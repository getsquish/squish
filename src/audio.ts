import type { AudioActivity } from './report.ts';

export interface AnalyzePcmOptions {
  sourceDuration: number;
  window: { start: number; end: number };
  outputSamples: number;
  pcmSampleRate: number;
}

export function decodePcmS16le(buffer: Buffer): Int16Array {
  const samples = new Int16Array(Math.floor(buffer.length / 2));
  for (let i = 0; i < samples.length; i++) samples[i] = buffer.readInt16LE(i * 2);
  return samples;
}

export function absentAudioActivity(window: { start: number; end: number }): AudioActivity {
  return { present: false, normalization: 'none', window, samples: [] };
}

export function analyzePcmActivity(_pcm: Int16Array, _opts: AnalyzePcmOptions): AudioActivity {
  const pcm = _pcm;
  const opts = _opts;
  const outputSamples = Math.max(1, Math.floor(opts.outputSamples));
  const rmsFrameSamples = Math.max(1, Math.round(opts.pcmSampleRate / 20)); // 50 ms envelope
  const rmsFrames: number[] = [];

  for (let start = 0; start < pcm.length; start += rmsFrameSamples) {
    const end = Math.min(pcm.length, start + rmsFrameSamples);
    let sumSquares = 0;
    for (let i = start; i < end; i++) sumSquares += pcm[i] * pcm[i];
    rmsFrames.push(Math.sqrt(sumSquares / Math.max(1, end - start)));
  }

  // One scale for the source clip, even when the caller asks for a zoom window. This keeps
  // quiet and loud intervals comparable across repeated overview → zoom calls.
  let clipPeak = 0;
  for (const rms of rmsFrames) clipPeak = Math.max(clipPeak, rms);
  const frameDuration = rmsFrameSamples / opts.pcmSampleRate;
  const windowDuration = opts.window.end - opts.window.start;
  const round = (n: number, places: number) => {
    const scale = 10 ** places;
    return Math.round(n * scale) / scale;
  };

  const samples = Array.from({ length: outputSamples }, (_, index) => {
    const bucketStart = opts.window.start + (windowDuration * index) / outputSamples;
    const bucketEnd = opts.window.start + (windowDuration * (index + 1)) / outputSamples;
    const firstFrame = Math.max(0, Math.floor(bucketStart / frameDuration));
    const lastFrame = Math.min(rmsFrames.length, Math.max(firstFrame + 1, Math.ceil(bucketEnd / frameDuration)));
    let bucketPeak = 0;
    for (let frame = firstFrame; frame < lastFrame; frame++) {
      bucketPeak = Math.max(bucketPeak, rmsFrames[frame] ?? 0);
    }
    return {
      time: round((bucketStart + bucketEnd) / 2, 3),
      level: clipPeak > 0 ? round(bucketPeak / clipPeak, 4) : 0,
    };
  });

  return {
    present: true,
    normalization: 'clip_peak',
    window: opts.window,
    samples,
  };
}

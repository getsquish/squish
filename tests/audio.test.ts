import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { absentAudioActivity, analyzePcmActivity, decodePcmS16le } from '../src/audio.ts';
import { extractAudioPcm } from '../src/ffmpeg.ts';

const run = promisify(execFile);

test('PCM decoder reads signed 16-bit little-endian samples and ignores a trailing byte', () => {
  const pcm = decodePcmS16le(Buffer.from([0x00, 0x80, 0xff, 0xff, 0x00, 0x00, 0xff]));
  assert.deepEqual([...pcm], [-32_768, -1, 0]);
});

test('window levels stay normalized to the full clip peak, not the selected window', () => {
  const pcm = new Int16Array(2_000);
  pcm.fill(10_000, 0, 1_000); // loud first half, outside the requested window
  pcm.fill(1_000, 1_000);    // quiet second half, inside the requested window

  const audio = analyzePcmActivity(pcm, {
    sourceDuration: 2,
    window: { start: 1, end: 2 },
    outputSamples: 2,
    pcmSampleRate: 1_000,
  });

  assert.equal(audio.normalization, 'clip_peak');
  assert.deepEqual(audio.samples, [
    { time: 1.25, level: 0.1 },
    { time: 1.75, level: 0.1 },
  ]);
});

test('a short transient survives overview downsampling via max-RMS aggregation', () => {
  const pcm = new Int16Array(1_000);
  pcm.fill(20_000, 500, 550); // one 50 ms RMS frame inside a one-second overview bucket

  const audio = analyzePcmActivity(pcm, {
    sourceDuration: 1,
    window: { start: 0, end: 1 },
    outputSamples: 1,
    pcmSampleRate: 1_000,
  });

  assert.deepEqual(audio.samples, [{ time: 0.5, level: 1 }]);
});

test('a present but silent audio track stays distinguishable from no audio track', () => {
  const silent = analyzePcmActivity(new Int16Array(1_000), {
    sourceDuration: 1,
    window: { start: 0, end: 1 },
    outputSamples: 2,
    pcmSampleRate: 1_000,
  });
  const absent = absentAudioActivity({ start: 0, end: 1 });

  assert.equal(silent.present, true);
  assert.equal(silent.normalization, 'clip_peak');
  assert.deepEqual(silent.samples.map((sample) => sample.level), [0, 0]);
  assert.deepEqual(absent, {
    present: false,
    normalization: 'none',
    window: { start: 0, end: 1 },
    samples: [],
  });
});

test('audio shorter than the video is not stretched across the remaining timeline', () => {
  const oneSecondPcm = new Int16Array(1_000).fill(5_000);
  const audio = analyzePcmActivity(oneSecondPcm, {
    sourceDuration: 2,
    window: { start: 0, end: 2 },
    outputSamples: 2,
    pcmSampleRate: 1_000,
  });

  assert.deepEqual(audio.samples, [
    { time: 0.5, level: 1 },
    { time: 1.5, level: 0 },
  ]);
});

test('extraction preserves continuous activity above the 1 kHz envelope Nyquist limit', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'squish-audio-test-'));
  const input = path.join(tmp, '880hz.wav');

  try {
    await run('ffmpeg', [
      '-v', 'error',
      '-f', 'lavfi',
      '-i', 'sine=frequency=880:sample_rate=44100:duration=1',
      '-c:a', 'pcm_s16le',
      '-y', input,
    ]);

    const pcmSampleRate = 1_000;
    const pcm = decodePcmS16le(await extractAudioPcm(input, 1, pcmSampleRate));
    const audio = analyzePcmActivity(pcm, {
      sourceDuration: 1,
      window: { start: 0, end: 1 },
      outputSamples: 10,
      pcmSampleRate,
    });

    assert.equal(audio.samples.length, 10);
    assert.ok(
      audio.samples.every(({ level }) => level > 0.8),
      `expected continuous activity across the clip, got ${audio.samples.map(({ level }) => level).join(', ')}`,
    );
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

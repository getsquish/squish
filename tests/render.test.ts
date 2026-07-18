import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { planSheets } from '../src/core/sampling.ts';
import { composeSheets } from '../src/render.ts';
import type { AudioActivity } from '../src/report.ts';

test('composed sheets burn an audio activity band above the visual grid', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'squish-render-test-'));
  try {
    const frame = createCanvas(160, 90);
    const frameCtx = frame.getContext('2d');
    frameCtx.fillStyle = '#444444';
    frameCtx.fillRect(0, 0, frame.width, frame.height);
    const framePath = path.join(tmp, 'frame.jpg');
    await writeFile(framePath, await frame.encode('jpeg', 90));

    const plan = planSheets(10, { density: '3x3' });
    const audio: AudioActivity = {
      present: true,
      normalization: 'clip_peak',
      window: { start: 0, end: 10 },
      samples: Array.from({ length: 96 }, (_, i) => ({
        time: (10 * (i + 0.5)) / 96,
        level: i === 48 ? 1 : 0.08,
      })),
    };

    const result = await composeSheets(plan, [Array(plan.perSheet).fill(framePath)], audio);
    const image = await loadImage(result.buffers[0]);
    const decoded = createCanvas(image.width, image.height);
    const decodedCtx = decoded.getContext('2d');
    decodedCtx.drawImage(image, 0, 0);
    const pixels = decodedCtx.getImageData(0, 0, image.width, Math.min(160, image.height)).data;

    let tealPixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] < 130 && pixels[i + 1] > 150 && pixels[i + 2] > 120) tealPixels++;
    }
    assert.ok(tealPixels > 100, `expected a visible teal audio timeline, found ${tealPixels} pixels`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

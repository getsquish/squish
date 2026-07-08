// The preflight hint is a contract of D6 (message-only hosted fallback): concise install
// lines first, hosted pointer second, never an auto-upload.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FFMPEG_HINT } from '../src/ffmpeg.ts';

test('preflight hint: both binaries named, per-OS installs, hosted pointer last', () => {
  assert.match(FFMPEG_HINT, /ffmpeg/);
  assert.match(FFMPEG_HINT, /ffprobe/);
  assert.match(FFMPEG_HINT, /brew install ffmpeg/);
  assert.match(FFMPEG_HINT, /apt-get install .*ffmpeg/);
  assert.match(FFMPEG_HINT, /getsquish\.app\/developers/);
  assert.ok(
    FFMPEG_HINT.indexOf('brew') < FFMPEG_HINT.indexOf('getsquish.app'),
    'install lines come before the hosted pointer',
  );
});

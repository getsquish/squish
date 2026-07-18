// E2E proof for the MCP mouth: a real MCP client spawns the real server over stdio,
// calls squish_video on a real clip, and asserts the contract + the files on disk.
// Not part of `npm test` (needs ffmpeg + a video): run with
//   npm run e2e -- /path/to/clip.mov
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const clip = process.argv[2];
if (!clip) {
  console.error('usage: npm run e2e -- <video> [density] [out_dir]');
  process.exit(1);
}
const density = process.argv[3] ?? '3x3';
const outDir = process.argv[4] ?? path.join(path.dirname(path.resolve(clip)), 'mcp-out');

const here = path.dirname(fileURLToPath(import.meta.url));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['--import', 'tsx', path.join(here, '../src/mcp.ts')],
});
const client = new Client({ name: 'squish-e2e', version: '0.0.0' });
await client.connect(transport);

const tools = await client.listTools();
const tool = tools.tools.find((t) => t.name === 'squish_video');
assert.ok(tool, 'squish_video is listed');
// Behavior hints differ from the HTTP mouth on purpose: this mouth writes sheet files onto
// the caller's own disk (not read-only) and never reaches outside the machine (closed world).
assert.deepEqual(tool.annotations, {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

const res = await client.callTool({
  name: 'squish_video',
  arguments: { video_path: path.resolve(clip), density, out_dir: outDir },
});
assert.ok(!res.isError, 'tool returned an error: ' + JSON.stringify(res.content));

const text = (res.content as Array<{ type: string; text?: string }>).find((c) => c.type === 'text')?.text;
assert.ok(text, 'text content present');
const parsed = JSON.parse(text);
assert.equal(parsed.contract, 'squish-mcp-v0');
assert.ok(parsed.sheets >= 1 && parsed.files.length === parsed.sheets, 'sheet files reported');
assert.equal(parsed.timecodes.flat().length, parsed.frames, 'one timecode per frame');
assert.equal(parsed.audio.normalization, 'clip_peak', 'audio activity uses full-clip normalization');
assert.ok(parsed.audio.samples.length > 0, 'audio activity samples returned for the fixture');
assert.ok(parsed.audio.samples.every((sample: { time: number }) => sample.time >= 0), 'audio sample times are absolute source seconds');
await Promise.all(parsed.files.map((f: string) => access(f)));

// A wrong-path call must surface as a tool error, not a crash.
const bad = await client.callTool({ name: 'squish_video', arguments: { video_path: '/nope/missing.mov' } });
assert.ok(bad.isError, 'missing input surfaces as isError');

// serverInfo must report the real package version — the Apps SDK scan imports it, and a
// stale number on the wire is a metadata lie (was hardcoded 0.2.0 while npm shipped 0.2.2).
const { readFileSync } = await import('node:fs');
const pkgVersion = (JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }).version;
assert.equal(client.getServerVersion()?.version, pkgVersion, 'stdio serverInfo version tracks package.json');

console.log(`E2E OK — ${parsed.sheets} sheet(s), ${parsed.frames} frames @ ${density} — serverInfo ${pkgVersion}`);
console.log(text);
await client.close();

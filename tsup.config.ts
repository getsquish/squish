import { defineConfig } from 'tsup';

// Bundles our code — src/core is vendored in-repo, so its relative imports inline naturally.
// The three runtime packages stay external and therefore MUST live in "dependencies".
// src/mcp.ts lands in dist as a code-split chunk via main.ts's dynamic import — esm
// splitting is tsup's default.
export default defineConfig({
  entry: ['src/main.ts'],
  format: 'esm',
  target: 'node20',
  platform: 'node',
  banner: { js: '#!/usr/bin/env node' },
  clean: true,
  external: ['@napi-rs/canvas', '@modelcontextprotocol/sdk', 'zod'],
});

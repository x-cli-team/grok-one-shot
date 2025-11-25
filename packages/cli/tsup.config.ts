import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  outDir: 'dist',
  bundle: true,
  external: [
    // Keep these external to avoid bundling issues
    'react',
    'ink',
    'tree-sitter',
    'tree-sitter-javascript',
    'tree-sitter-python',
    'tree-sitter-typescript', 'node:*', 'fs', 'fs/promises', 'path', 'url'
  ],
  platform: 'node',
  minify: false,
  treeshake: true,
  // Preserve shebang
  banner: {
    js: '#!/usr/bin/env node',
  }
});
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/tools/**/*.ts'],
  platform: 'node',
  target: 'node20',
  format: ['esm'],
  splitting: false,
  minify: false,
  sourcemap: true,
  bundle: true,
  skipNodeModulesBundle: true,
  shims: false,
  external: ['node:*','fs','fs/promises','path','url'],
});
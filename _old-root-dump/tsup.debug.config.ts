import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/tools/**/*.ts'],
  bundle: false,
  sourcemap: true,
  target: 'node20',
  platform: 'node',
  format: ['esm'],
});
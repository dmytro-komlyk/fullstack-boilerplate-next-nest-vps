import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: false,
  clean: process.env.NODE_ENV === 'production',
  format: ['esm'],
  sourcemap: true,
  splitting: false,
  minify: process.env.NODE_ENV === 'production',
  target: 'es2022',
});

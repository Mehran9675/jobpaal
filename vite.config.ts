import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Builds the extension pages (popup, side panel, management page, document viewer).
 * The content script and background script are built separately by scripts/build.mjs
 * because they must be single self-contained files.
 */
export default defineConfig(() => {
  const target = process.env.JOBPAAL_TARGET ?? 'chrome';
  return {
    root: resolve(__dirname, 'src'),
    base: '',
    publicDir: resolve(__dirname, 'public'),
    plugins: [react()],
    resolve: { alias: { '@': resolve(__dirname, 'src') } },
    define: { __JOBPAAL_TARGET__: JSON.stringify(target) },
    build: {
      outDir: resolve(__dirname, 'dist', target),
      emptyOutDir: true,
      target: 'es2022',
      sourcemap: false,
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          options: resolve(__dirname, 'src/options/index.html'),
          sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
          viewer: resolve(__dirname, 'src/viewer/index.html'),
        },
      },
    },
  };
});

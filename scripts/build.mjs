/**
 * Builds JobPaal for every supported browser family.
 *
 *   node scripts/build.mjs            -> dist/chrome and dist/firefox
 *   node scripts/build.mjs chrome     -> dist/chrome only
 *
 * Pages are a normal multi-page Vite build. The content script and background
 * script are separate IIFE library builds so each is one self-contained file.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, readFile } from 'node:fs/promises';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { createManifest } from './manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requested = process.argv[2];
const targets = requested ? [requested] : ['chrome', 'firefox'];

async function buildScript(target, entry, fileName) {
  await build({
    configFile: false,
    root,
    logLevel: 'warn',
    publicDir: false,
    plugins: [react()],
    resolve: { alias: { '@': resolve(root, 'src') } },
    define: {
      __JOBPAAL_TARGET__: JSON.stringify(target),
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      outDir: resolve(root, 'dist', target),
      emptyOutDir: false,
      target: 'es2022',
      sourcemap: false,
      copyPublicDir: false,
      chunkSizeWarningLimit: 4000,
      lib: {
        entry: resolve(root, entry),
        formats: ['iife'],
        name: fileName.replace(/\W/g, '_'),
        fileName: () => fileName,
      },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
}

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

for (const target of targets) {
  if (target !== 'chrome' && target !== 'firefox') throw new Error(`Unknown target ${target}`);
  process.env.JOBPAAL_TARGET = target;
  console.log(`\n▶ Building ${target}`);
  await build({ configFile: resolve(root, 'vite.config.ts'), logLevel: 'warn', mode: 'production' });
  await buildScript(target, 'src/content/index.ts', 'content.js');
  await buildScript(target, 'src/background/index.ts', 'background.js');
  const manifest = createManifest(target, pkg.version);
  await writeFile(resolve(root, 'dist', target, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`✔ dist/${target}`);
}

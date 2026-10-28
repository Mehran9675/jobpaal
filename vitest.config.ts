import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  define: { __JOBPAAL_TARGET__: JSON.stringify('chrome') },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});

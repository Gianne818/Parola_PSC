import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.test.ts', 'lib/**/*.test.ts', 'tests/**/*.test.ts'],
    // Legacy self-running script (no vitest suites) — run separately, not via vitest.
    exclude: ['node_modules', 'tests/iprogSmsService.test.ts'],
  },
});

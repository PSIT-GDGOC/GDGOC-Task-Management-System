import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/database/**/*.test.ts'],
    hookTimeout: 60_000,
    testTimeout: 15_000,
    fileParallelism: false,
  },
});

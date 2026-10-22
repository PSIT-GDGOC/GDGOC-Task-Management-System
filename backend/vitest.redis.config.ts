import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/redis/**/*.test.ts'],
    hookTimeout: 60000,
    testTimeout: 20000,
    fileParallelism: false,
  },
});

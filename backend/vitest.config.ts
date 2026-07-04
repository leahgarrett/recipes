import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./test/global-setup.ts'],
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgres://recipes:recipes@localhost:5432/recipes_test',
    },
    fileParallelism: false,
  },
});

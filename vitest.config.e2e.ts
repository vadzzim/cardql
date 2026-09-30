import { defineConfig } from 'vitest/config';
import { testEnv } from './test/utils/test-env.js';

export default defineConfig({
  test: {
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Values here win over .env: ConfigModule never overrides process.env.
    env: testEnv,
    // All e2e files share one database.
    fileParallelism: false,
  },
});

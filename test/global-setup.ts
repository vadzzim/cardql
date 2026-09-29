import { execSync } from 'node:child_process';
import { testEnv } from './utils/test-env.js';

export default function setup(): void {
  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testEnv.DATABASE_URL },
    stdio: 'inherit',
  });
}

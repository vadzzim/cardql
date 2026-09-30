import { parseArgs } from 'node:util';
import { z } from 'zod';
import { createSeedClient } from './seed-client.js';
import { seedFakeProfiles } from './seed-fake-profiles.js';

const { values } = parseArgs({
  options: { count: { type: 'string', default: '100' } },
});
const count = z.coerce.number().int().min(0).max(10_000).parse(values.count);

const prisma = createSeedClient();

try {
  await seedFakeProfiles(prisma, count);
  console.log(`Seeded ${count} fake profile(s)`);
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

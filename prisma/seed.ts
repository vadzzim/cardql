import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { validateEnv } from '../src/config/env.schema.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { MAIN_PROFILE_SLUG } from '../src/profile/profile.constants.js';
import { profile } from './seed-data/profile.js';
import { seedProfile } from './seed-profile.js';

const { DATABASE_URL } = validateEnv(process.env);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

async function main(): Promise<void> {
  await seedProfile(prisma, profile);

  console.log(
    `Seeded profile "${MAIN_PROFILE_SLUG}" with ${profile.links.length} link(s) and ${profile.skills.length} skill(s)`,
  );
}

try {
  await main();
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

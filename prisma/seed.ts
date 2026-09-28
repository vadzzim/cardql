import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { validateEnv } from '../src/config/env.schema.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { profile } from './seed-data/profile.js';

const { DATABASE_URL } = validateEnv(process.env);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

// Idempotent: runs on every container start. The profile is upserted by slug,
// so edits in seed-data are applied on the next run without duplicating rows.
async function main(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.profile.upsert({
      where: { slug: profile.slug },
      create: profile,
      update: profile,
    });
  });

  console.log(`Seeded profile "${profile.slug}"`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

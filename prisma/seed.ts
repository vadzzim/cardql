import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { validateEnv } from '../src/config/env.schema.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { MAIN_PROFILE_SLUG } from '../src/profile/profile.constants.js';
import { profile } from './seed-data/profile.js';

const { DATABASE_URL } = validateEnv(process.env);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

// Idempotent: runs on every container start. The profile is upserted by slug
// and its links are replaced as a whole, so edits in seed-data (including
// removed or reordered links) are applied on the next run without duplicates.
async function main(): Promise<void> {
  const { links, ...data } = profile;

  await prisma.$transaction(async (tx) => {
    const { id: profileId } = await tx.profile.upsert({
      where: { slug: MAIN_PROFILE_SLUG },
      create: { ...data, slug: MAIN_PROFILE_SLUG },
      update: data,
    });

    await tx.link.deleteMany({ where: { profileId } });
    await tx.link.createMany({
      data: links.map((link, position) => ({ ...link, profileId, position })),
    });
  });

  console.log(
    `Seeded profile "${MAIN_PROFILE_SLUG}" with ${links.length} link(s)`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

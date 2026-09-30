import type { PrismaClient } from '../src/generated/prisma/client.js';
import { buildFakeProfile } from './seed-data/fake-profile.js';
import { seedProfile } from './seed-profile.js';

// Generated profiles never collide with the card owner's slug.
export const FAKE_SLUG_PREFIX = 'fake-';

// Replaces all generated profiles with profiles 0..count-1. Each profile is its
// own transaction: one huge transaction would contend and retry on CockroachDB.
export async function seedFakeProfiles(
  prisma: PrismaClient,
  count: number,
): Promise<void> {
  await prisma.profile.deleteMany({
    where: { slug: { startsWith: FAKE_SLUG_PREFIX } },
  });

  for (let index = 0; index < count; index++) {
    await seedProfile(
      prisma,
      `${FAKE_SLUG_PREFIX}${index}`,
      buildFakeProfile(index),
    );
  }
}

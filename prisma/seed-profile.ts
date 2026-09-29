import type { PrismaClient } from '../src/generated/prisma/client.js';
import { MAIN_PROFILE_SLUG } from '../src/profile/profile.constants.js';
import {
  type SeedProfile,
  validateSeedProfile,
} from './seed-data/profile.schema.js';

export async function seedProfile(
  prisma: PrismaClient,
  input: SeedProfile,
): Promise<void> {
  const { links, skills, ...data } = validateSeedProfile(input);

  await prisma.$transaction(async (tx) => {
    await tx.profile.deleteMany();
    await tx.profile.create({
      data: {
        ...data,
        slug: MAIN_PROFILE_SLUG,
        links: {
          create: links.map((link, position) => ({ ...link, position })),
        },
        skills: {
          create: skills.map((skill, position) => ({ ...skill, position })),
        },
      },
    });
  });
}

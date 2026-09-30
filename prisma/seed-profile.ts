import type { PrismaClient } from '../src/generated/prisma/client.js';
import {
  type SeedProfile,
  validateSeedProfile,
} from './seed-data/profile.schema.js';

// Recreates the profile with this slug; other profiles stay untouched.
export async function seedProfile(
  prisma: PrismaClient,
  slug: string,
  input: SeedProfile,
): Promise<void> {
  const { links, skills, experience, projects, ...data } =
    validateSeedProfile(input);

  await prisma.$transaction(async (tx) => {
    await tx.profile.deleteMany({ where: { slug } });
    await tx.profile.create({
      data: {
        ...data,
        slug,
        links: {
          create: links.map((link, position) => ({ ...link, position })),
        },
        skills: {
          create: skills.map((skill, position) => ({ ...skill, position })),
        },
        experience: {
          create: experience.map(({ achievements, ...entry }) => ({
            ...entry,
            achievements: {
              create: achievements.map((description, position) => ({
                description,
                position,
              })),
            },
          })),
        },
        projects: {
          create: projects.map((project, position) => ({
            ...project,
            position,
          })),
        },
      },
    });
  });
}

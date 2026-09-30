import { MAIN_PROFILE_SLUG } from '../src/profile/profile.constants.js';
import { profile } from './seed-data/profile.js';
import { createSeedClient } from './seed-client.js';
import { seedProfile } from './seed-profile.js';

const prisma = createSeedClient();

async function main(): Promise<void> {
  await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);

  console.log(
    `Seeded profile "${MAIN_PROFILE_SLUG}" with ${profile.links.length} link(s), ${profile.skills.length} skill(s), ${profile.experience.length} experience entr(ies) and ${profile.projects.length} project(s)`,
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

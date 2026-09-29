import { PrismaPg } from '@prisma/adapter-pg';
import { seedProfile } from '../prisma/seed-profile.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { MAIN_PROFILE_SLUG } from '../src/profile/profile.constants.js';
import { testEnv } from './utils/test-env.js';

const profile = {
  name: 'Seed User',
  headline: 'Test Engineer',
  description: 'Profile created by the seed test',
  location: 'Berlin, Germany',
  email: 'seed@example.com',
  links: [
    { label: 'GitHub', url: 'https://github.com/seed' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/seed' },
  ],
  skills: [{ name: 'TypeScript' }, { name: 'NestJS' }],
};

describe('seedProfile (e2e)', () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testEnv.DATABASE_URL }),
  });

  const readProfiles = () =>
    prisma.profile.findMany({
      include: {
        links: { orderBy: { position: 'asc' } },
        skills: { orderBy: { position: 'asc' } },
      },
    });

  const linksOf = (seeded: Awaited<ReturnType<typeof readProfiles>>[number]) =>
    seeded.links.map(({ label, url, position }) => ({ label, url, position }));

  const skillsOf = (seeded: Awaited<ReturnType<typeof readProfiles>>[number]) =>
    seeded.skills.map(({ name, position }) => ({ name, position }));

  beforeEach(async () => {
    await prisma.profile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates the main profile with links and skills in array order', async () => {
    await seedProfile(prisma, profile);

    const [seeded, ...rest] = await readProfiles();
    expect(rest).toEqual([]);
    expect(seeded).toMatchObject({
      slug: MAIN_PROFILE_SLUG,
      name: 'Seed User',
      location: 'Berlin, Germany',
    });
    expect(linksOf(seeded)).toEqual([
      { label: 'GitHub', url: 'https://github.com/seed', position: 0 },
      {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/seed',
        position: 1,
      },
    ]);
    expect(skillsOf(seeded)).toEqual([
      { name: 'TypeScript', position: 0 },
      { name: 'NestJS', position: 1 },
    ]);
  });

  it('replaces links on a repeated run', async () => {
    await seedProfile(prisma, profile);
    await seedProfile(prisma, {
      ...profile,
      links: [
        { label: 'Site', url: 'https://seed.dev' },
        { label: 'GitHub', url: 'https://github.com/seed' },
      ],
    });

    const [seeded, ...rest] = await readProfiles();
    expect(rest).toEqual([]);
    expect(linksOf(seeded)).toEqual([
      { label: 'Site', url: 'https://seed.dev', position: 0 },
      { label: 'GitHub', url: 'https://github.com/seed', position: 1 },
    ]);
    expect(await prisma.link.count()).toBe(2);
  });

  it('replaces skills on a repeated run', async () => {
    await seedProfile(prisma, profile);
    await seedProfile(prisma, {
      ...profile,
      skills: [{ name: 'Docker' }, { name: 'TypeScript' }, { name: 'Prisma' }],
    });

    const [seeded, ...rest] = await readProfiles();
    expect(rest).toEqual([]);
    expect(skillsOf(seeded)).toEqual([
      { name: 'Docker', position: 0 },
      { name: 'TypeScript', position: 1 },
      { name: 'Prisma', position: 2 },
    ]);
    expect(await prisma.skill.count()).toBe(3);
  });

  it('clears optional fields removed from seed data', async () => {
    await seedProfile(prisma, profile);
    const { location: _location, email: _email, ...rest } = profile;
    await seedProfile(prisma, rest);

    const [seeded] = await readProfiles();
    expect(seeded).toMatchObject({ location: null, email: null });
  });

  it('removes profiles other than the main one', async () => {
    await prisma.profile.create({
      data: { ...profile, slug: 'stale', links: undefined, skills: undefined },
    });

    await seedProfile(prisma, profile);

    const seeded = await readProfiles();
    expect(seeded.map(({ slug }) => slug)).toEqual([MAIN_PROFILE_SLUG]);
  });

  it('keeps the existing profile when seed data is invalid', async () => {
    await seedProfile(prisma, profile);
    const [before] = await readProfiles();

    await expect(
      seedProfile(prisma, { ...profile, name: '   ' }),
    ).rejects.toThrow(/Invalid seed profile/);

    expect(await readProfiles()).toEqual([before]);
  });
});

import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { buildFakeProfile } from '../prisma/seed-data/fake-profile.js';
import { seedFakeProfiles } from '../prisma/seed-fake-profiles.js';
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
  projects: [
    { name: 'cardql', url: 'https://github.com/seed/cardql' },
    { name: 'dotfiles', url: 'https://github.com/seed/dotfiles' },
  ],
  experience: [
    {
      company: 'Acme',
      position: 'Engineer',
      startDate: '2020-01',
      endDate: '2021-06',
      achievements: ['Shipped the API', 'Cut latency'],
    },
    {
      company: 'Globex',
      position: 'Senior Engineer',
      startDate: '2021-07',
      achievements: [],
    },
  ],
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
        projects: { orderBy: { position: 'asc' } },
        experience: {
          orderBy: { startDate: 'asc' },
          include: { achievements: { orderBy: { position: 'asc' } } },
        },
      },
    });

  const linksOf = (seeded: Awaited<ReturnType<typeof readProfiles>>[number]) =>
    seeded.links.map(({ label, url, position }) => ({ label, url, position }));

  const skillsOf = (seeded: Awaited<ReturnType<typeof readProfiles>>[number]) =>
    seeded.skills.map(({ name, position }) => ({ name, position }));

  const projectsOf = (
    seeded: Awaited<ReturnType<typeof readProfiles>>[number],
  ) =>
    seeded.projects.map(({ name, url, position }) => ({ name, url, position }));

  const experienceOf = (
    seeded: Awaited<ReturnType<typeof readProfiles>>[number],
  ) =>
    seeded.experience.map(
      ({ company, position, startDate, endDate, achievements }) => ({
        company,
        position,
        startDate,
        endDate,
        achievements: achievements.map(({ description, position }) => ({
          description,
          position,
        })),
      }),
    );

  beforeEach(async () => {
    await prisma.profile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates the main profile with links and skills in array order', async () => {
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);

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

  it('creates experience with months as dates and achievements in array order', async () => {
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);

    const [seeded] = await readProfiles();
    expect(experienceOf(seeded)).toEqual([
      {
        company: 'Acme',
        position: 'Engineer',
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2021-06-01T00:00:00Z'),
        achievements: [
          { description: 'Shipped the API', position: 0 },
          { description: 'Cut latency', position: 1 },
        ],
      },
      {
        company: 'Globex',
        position: 'Senior Engineer',
        startDate: new Date('2021-07-01T00:00:00Z'),
        endDate: null,
        achievements: [],
      },
    ]);
  });

  it('replaces experience and achievements on a repeated run', async () => {
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);
    await seedProfile(prisma, MAIN_PROFILE_SLUG, {
      ...profile,
      experience: [
        {
          company: 'Initech',
          position: 'Lead',
          startDate: '2022-02',
          achievements: ['Led the team'],
        },
      ],
    });

    const [seeded] = await readProfiles();
    expect(experienceOf(seeded)).toEqual([
      {
        company: 'Initech',
        position: 'Lead',
        startDate: new Date('2022-02-01T00:00:00Z'),
        endDate: null,
        achievements: [{ description: 'Led the team', position: 0 }],
      },
    ]);
    expect(await prisma.experience.count()).toBe(1);
    expect(await prisma.achievement.count()).toBe(1);
  });

  it('creates projects in array order', async () => {
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);

    const [seeded] = await readProfiles();
    expect(projectsOf(seeded)).toEqual([
      { name: 'cardql', url: 'https://github.com/seed/cardql', position: 0 },
      {
        name: 'dotfiles',
        url: 'https://github.com/seed/dotfiles',
        position: 1,
      },
    ]);
  });

  it('replaces projects on a repeated run', async () => {
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);
    await seedProfile(prisma, MAIN_PROFILE_SLUG, {
      ...profile,
      projects: [{ name: 'blog', url: 'https://seed.dev/blog' }],
    });

    const [seeded] = await readProfiles();
    expect(projectsOf(seeded)).toEqual([
      { name: 'blog', url: 'https://seed.dev/blog', position: 0 },
    ]);
    expect(await prisma.project.count()).toBe(1);
  });

  it('replaces links on a repeated run', async () => {
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);
    await seedProfile(prisma, MAIN_PROFILE_SLUG, {
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
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);
    await seedProfile(prisma, MAIN_PROFILE_SLUG, {
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
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);
    const { location: _location, email: _email, ...rest } = profile;
    await seedProfile(prisma, MAIN_PROFILE_SLUG, rest);

    const [seeded] = await readProfiles();
    expect(seeded).toMatchObject({ location: null, email: null });
  });

  it('keeps profiles with other slugs', async () => {
    await seedProfile(prisma, 'other', profile);

    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);

    const seeded = await readProfiles();
    expect(seeded.map(({ slug }) => slug).sort()).toEqual([
      MAIN_PROFILE_SLUG,
      'other',
    ]);
  });

  it('keeps the existing profile when seed data is invalid', async () => {
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);
    const [before] = await readProfiles();

    await expect(
      seedProfile(prisma, MAIN_PROFILE_SLUG, { ...profile, name: '   ' }),
    ).rejects.toThrow(/Invalid seed profile/);

    expect(await readProfiles()).toEqual([before]);
  });
});

describe('seedFakeProfiles (e2e)', () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testEnv.DATABASE_URL }),
  });

  const slugs = async () =>
    (await prisma.profile.findMany({ select: { slug: true } }))
      .map(({ slug }) => slug)
      .sort();

  beforeEach(async () => {
    await prisma.profile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates the requested number of generated profiles', async () => {
    await seedFakeProfiles(prisma, 3);

    expect(await slugs()).toEqual(['fake-0', 'fake-1', 'fake-2']);
    const second = await prisma.profile.findUniqueOrThrow({
      where: { slug: 'fake-1' },
      include: { skills: true },
    });
    const expected = buildFakeProfile(1);
    expect(second.name).toBe(expected.name);
    expect(second.skills).toHaveLength(expected.skills.length);
  });

  it('replaces generated profiles and keeps the main one', async () => {
    await seedProfile(prisma, MAIN_PROFILE_SLUG, profile);
    await seedFakeProfiles(prisma, 3);

    await seedFakeProfiles(prisma, 1);

    expect(await slugs()).toEqual(['fake-0', MAIN_PROFILE_SLUG]);
  });
});

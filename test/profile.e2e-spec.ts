import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { MAIN_PROFILE_SLUG } from '../src/profile/profile.constants.js';
import { ProfileRepository } from '../src/profile/profile.repository.js';

const profile = {
  name: 'E2E User',
  headline: 'Test Engineer',
  description: 'Profile created by the e2e test',
  location: null,
  email: 'e2e@example.com',
};

// Inserted out of order to check that the API sorts by position.
const links = [
  { label: 'Second', url: 'https://example.com/second', position: 1 },
  { label: 'First', url: 'https://example.com/first', position: 0 },
];

const skills = [
  { name: 'GraphQL', position: 1 },
  { name: 'TypeScript', position: 0 },
];

const projects = [
  { name: 'Beta', url: 'https://example.com/beta', position: 1 },
  { name: 'Alpha', url: 'https://example.com/alpha', position: 0 },
];

describe('Profile (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const graphql = (query: string) =>
    request(app.getHttpServer()).post('/graphql').send({ query });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  // Links, skills and projects are removed with their profile by the ON DELETE CASCADE
  // foreign keys.
  beforeEach(async () => {
    await prisma.profile.deleteMany();
    await prisma.profile.create({
      data: {
        ...profile,
        slug: MAIN_PROFILE_SLUG,
        links: { create: links },
        skills: { create: skills },
        projects: { create: projects },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the main profile with all fields', async () => {
    const response = await graphql(`
      {
        profile {
          id
          name
          headline
          description
          location
          email
        }
      }
    `);

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile).toEqual({
      id: expect.any(String),
      ...profile,
    });
  });

  it('returns links in display order', async () => {
    const response = await graphql('{ profile { links { id label url } } }');

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile.links).toEqual([
      {
        id: expect.any(String),
        label: 'First',
        url: 'https://example.com/first',
      },
      {
        id: expect.any(String),
        label: 'Second',
        url: 'https://example.com/second',
      },
    ]);
  });

  it('returns an empty list when the profile has no links', async () => {
    await prisma.link.deleteMany();

    const response = await graphql('{ profile { links { label } } }');

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile.links).toEqual([]);
  });

  it('returns skills in display order', async () => {
    const response = await graphql('{ profile { skills { id name } } }');

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile.skills).toEqual([
      { id: expect.any(String), name: 'TypeScript' },
      { id: expect.any(String), name: 'GraphQL' },
    ]);
  });

  it('returns an empty list when the profile has no skills', async () => {
    await prisma.skill.deleteMany();

    const response = await graphql('{ profile { skills { name } } }');

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile.skills).toEqual([]);
  });

  it('returns projects in display order', async () => {
    const response = await graphql('{ profile { projects { id name url } } }');

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile.projects).toEqual([
      {
        id: expect.any(String),
        name: 'Alpha',
        url: 'https://example.com/alpha',
      },
      {
        id: expect.any(String),
        name: 'Beta',
        url: 'https://example.com/beta',
      },
    ]);
  });

  it('returns an empty list when the profile has no projects', async () => {
    await prisma.project.deleteMany();

    const response = await graphql('{ profile { projects { name } } }');

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile.projects).toEqual([]);
  });

  it('returns only the links, skills and projects of the main profile', async () => {
    await prisma.profile.create({
      data: {
        ...profile,
        slug: 'other',
        links: {
          create: [
            { label: 'Other', url: 'https://example.com/other', position: 0 },
          ],
        },
        skills: { create: [{ name: 'Rust', position: 0 }] },
        projects: {
          create: [
            { name: 'Other', url: 'https://example.com/other', position: 0 },
          ],
        },
      },
    });

    const response = await graphql(
      '{ profile { links { label } skills { name } projects { name } } }',
    );

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile).toEqual({
      links: [{ label: 'First' }, { label: 'Second' }],
      skills: [{ name: 'TypeScript' }, { name: 'GraphQL' }],
      projects: [{ name: 'Alpha' }, { name: 'Beta' }],
    });
  });

  it('queries each relation once per request, only when it is asked for', async () => {
    const repository = app.get(ProfileRepository);
    const findLinks = vi.spyOn(repository, 'findLinksByProfileIds');
    const findSkills = vi.spyOn(repository, 'findSkillsByProfileIds');
    const findProjects = vi.spyOn(repository, 'findProjectsByProfileIds');

    await graphql('{ profile { links { label } skills { name } } }');
    await graphql('{ profile { links { label } } }');

    // Loaders cache within a request only, so each request queries again.
    expect(findLinks).toHaveBeenCalledTimes(2);
    expect(findSkills).toHaveBeenCalledOnce();
    expect(findProjects).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when the database is not seeded', async () => {
    await prisma.profile.deleteMany();

    const response = await graphql('{ profile { name } }');

    expect(response.body.data).toBeNull();
    expect(response.body.errors[0].extensions.code).toBe('NOT_FOUND');
  });

  it('rejects arguments missing from the schema', async () => {
    const response = await graphql('{ profile(slug: "me") { name } }');

    expect(response.body.errors[0].extensions.code).toBe(
      'GRAPHQL_VALIDATION_FAILED',
    );
  });

  it('rejects fields missing from the schema', async () => {
    const response = await graphql('{ profile { notARealField } }');

    expect(response.body.errors[0].extensions.code).toBe(
      'GRAPHQL_VALIDATION_FAILED',
    );
  });
});

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { MAIN_PROFILE_SLUG } from '../src/profile/profile.constants.js';

const profile = {
  slug: MAIN_PROFILE_SLUG,
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

  // Links and skills are removed with their profile by the ON DELETE CASCADE
  // foreign keys.
  beforeEach(async () => {
    await prisma.profile.deleteMany();
    await prisma.profile.create({
      data: {
        ...profile,
        links: { create: links },
        skills: { create: skills },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the main profile with all fields', async () => {
    const response = await graphql(`
      {
        profile {
          id
          slug
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

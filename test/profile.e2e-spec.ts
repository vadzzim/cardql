import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { E2E_PROFILE_SLUG } from './utils/test-env.js';

const profile = {
  slug: E2E_PROFILE_SLUG,
  name: 'E2E User',
  headline: 'Test Engineer',
  description: 'Profile created by the e2e test',
  location: null,
  email: 'e2e@example.com',
};

describe('Profile (e2e)', () => {
  let app: INestApplication;

  const graphql = (query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').send({ query, variables });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const prisma = app.get(PrismaService);
    await prisma.profile.deleteMany();
    await prisma.profile.create({ data: profile });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the main profile when no slug is given', async () => {
    const response = await graphql('{ profile { name description } }');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        profile: { name: profile.name, description: profile.description },
      },
    });
  });

  it('returns a profile by slug with all fields', async () => {
    const response = await graphql(
      `
        query ($slug: String) {
          profile(slug: $slug) {
            id
            slug
            name
            headline
            description
            location
            email
          }
        }
      `,
      { slug: profile.slug },
    );

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile).toEqual({
      id: expect.any(String),
      ...profile,
    });
  });

  it('returns NOT_FOUND for an unknown slug', async () => {
    const response = await graphql(
      'query ($slug: String) { profile(slug: $slug) { name } }',
      { slug: 'missing' },
    );

    expect(response.body.data).toBeNull();
    expect(response.body.errors[0].extensions.code).toBe('NOT_FOUND');
  });

  it('rejects fields missing from the schema', async () => {
    const response = await graphql('{ profile { links } }');

    expect(response.body.errors[0].extensions.code).toBe(
      'GRAPHQL_VALIDATION_FAILED',
    );
  });
});

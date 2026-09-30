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
import { ExperienceRepository } from '../src/experience/experience.repository.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { MAIN_PROFILE_SLUG } from '../src/profile/profile.constants.js';

const profile = {
  name: 'E2E User',
  headline: 'Test Engineer',
  description: 'Profile created by the experience e2e test',
};

const month = (value: string) => new Date(`${value}-01T00:00:00Z`);

// Inserted out of order to check that the API sorts entries by dates and
// achievements by position.
const experience = [
  {
    company: 'Acme',
    position: 'Engineer',
    startDate: month('2018-01'),
    endDate: month('2020-12'),
    achievements: {
      create: [
        { description: 'Second', position: 1 },
        { description: 'First', position: 0 },
      ],
    },
  },
  {
    company: 'Initech',
    position: 'Lead',
    startDate: month('2023-05'),
    endDate: null,
    achievements: { create: [{ description: 'Led the team', position: 0 }] },
  },
  {
    company: 'Globex',
    position: 'Senior Engineer',
    startDate: month('2021-01'),
    endDate: month('2023-04'),
    achievements: { create: [] },
  },
];

describe('Experience (e2e)', () => {
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

  // Experience and achievements are removed with their profile by the
  // ON DELETE CASCADE foreign keys.
  beforeEach(async () => {
    await prisma.profile.deleteMany();
    await prisma.profile.create({
      data: {
        ...profile,
        slug: MAIN_PROFILE_SLUG,
        experience: { create: experience },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns experience newest first with months as YYYY-MM', async () => {
    const response = await graphql(`
      {
        profile {
          experience {
            id
            company
            position
            startDate
            endDate
          }
        }
      }
    `);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile.experience).toEqual([
      {
        id: expect.any(String),
        company: 'Initech',
        position: 'Lead',
        startDate: '2023-05',
        endDate: null,
      },
      {
        id: expect.any(String),
        company: 'Globex',
        position: 'Senior Engineer',
        startDate: '2021-01',
        endDate: '2023-04',
      },
      {
        id: expect.any(String),
        company: 'Acme',
        position: 'Engineer',
        startDate: '2018-01',
        endDate: '2020-12',
      },
    ]);
  });

  it('returns the current job before a finished one started the same month', async () => {
    await prisma.experience.create({
      data: {
        profile: { connect: { slug: MAIN_PROFILE_SLUG } },
        company: 'Side Gig',
        position: 'Consultant',
        startDate: month('2023-05'),
        endDate: month('2023-08'),
      },
    });

    const response = await graphql('{ profile { experience { company } } }');

    expect(response.body.errors).toBeUndefined();
    expect(
      response.body.data.profile.experience.map(
        ({ company }: { company: string }) => company,
      ),
    ).toEqual(['Initech', 'Side Gig', 'Globex', 'Acme']);
  });

  it('returns achievements in display order and [] for an entry without them', async () => {
    const response = await graphql(`
      {
        profile {
          experience {
            company
            achievements {
              id
              description
            }
          }
        }
      }
    `);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile.experience).toEqual([
      {
        company: 'Initech',
        achievements: [{ id: expect.any(String), description: 'Led the team' }],
      },
      { company: 'Globex', achievements: [] },
      {
        company: 'Acme',
        achievements: [
          { id: expect.any(String), description: 'First' },
          { id: expect.any(String), description: 'Second' },
        ],
      },
    ]);
  });

  it('loads achievements of all entries with one query per request', async () => {
    const findAchievements = vi.spyOn(
      app.get(ExperienceRepository),
      'findAchievementsByExperienceIds',
    );
    const query = '{ profile { experience { achievements { description } } } }';

    await graphql(query);
    await graphql(query);

    // One call per request: batched within a request, not cached across them.
    expect(findAchievements).toHaveBeenCalledTimes(2);
    expect(findAchievements.mock.calls[0][0]).toHaveLength(experience.length);
  });

  it('returns only the experience of the main profile', async () => {
    await prisma.profile.create({
      data: {
        ...profile,
        slug: 'other',
        experience: {
          create: [
            {
              company: 'Other Co',
              position: 'Other',
              startDate: month('2024-01'),
              achievements: { create: [{ description: 'Other', position: 0 }] },
            },
          ],
        },
      },
    });

    const response = await graphql(
      '{ profile { experience { company achievements { description } } } }',
    );

    expect(response.body.errors).toBeUndefined();
    const { experience: entries } = response.body.data.profile as {
      experience: { company: string; achievements: unknown[] }[];
    };
    expect(entries.map(({ company }) => company)).toEqual([
      'Initech',
      'Globex',
      'Acme',
    ]);
    expect(entries.flatMap(({ achievements }) => achievements)).toHaveLength(3);
  });

  it('returns an empty list when the profile has no experience', async () => {
    await prisma.experience.deleteMany();

    const response = await graphql('{ profile { experience { company } } }');

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile.experience).toEqual([]);
  });

  it('rejects an end date before the start date in the database', async () => {
    await expect(
      prisma.experience.create({
        data: {
          profile: { connect: { slug: MAIN_PROFILE_SLUG } },
          company: 'Broken',
          position: 'Broken',
          startDate: month('2022-05'),
          endDate: month('2022-04'),
        },
      }),
    ).rejects.toThrow(/failed to satisfy CHECK constraint/);
  });
});

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { seedFakeProfiles } from '../prisma/seed-fake-profiles.js';
import { AppModule } from '../src/app.module.js';
import { ExperienceRepository } from '../src/experience/experience.repository.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ProfileRepository } from '../src/profile/profile.repository.js';

const FAKE_PROFILES = 25;

// Profiles with one name: the page boundary has to fall between them, and
// only the id tells them apart.
const TWINS = 3;
const EXTRA_SLUG_PREFIX = 'extra-';

interface Page {
  nodes: { id: string; name: string }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

const PAGE_QUERY = `
  query Page($first: Int, $after: String) {
    profiles(first: $first, after: $after) {
      nodes { id name }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

describe('Profiles (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const graphql = (query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').send({ query, variables });

  const fetchPage = async (first: number, after?: string | null) => {
    const response = await graphql(PAGE_QUERY, { first, after });
    expect(response.body.errors).toBeUndefined();
    return response.body.data.profiles as Page;
  };

  // Follows endCursor until the last page and returns the ids in API order.
  const fetchAllIds = async (first: number, after?: string | null) => {
    const ids: string[] = [];
    let page: Page;

    do {
      page = await fetchPage(first, after);
      ids.push(...page.nodes.map(({ id }) => id));
      after = page.pageInfo.endCursor;
    } while (page.pageInfo.hasNextPage);

    return ids;
  };

  const idsInNameOrder = async () =>
    (
      await prisma.profile.findMany({
        select: { id: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      })
    ).map(({ id }) => id);

  const createExtraProfile = (suffix: string, name: string) =>
    prisma.profile.create({
      data: {
        slug: `${EXTRA_SLUG_PREFIX}${suffix}`,
        name,
        headline: 'Engineer',
        description: 'Profile added by the profiles e2e test',
      },
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.profile.deleteMany();
    await seedFakeProfiles(prisma, FAKE_PROFILES);
    for (let index = 0; index < TWINS; index++) {
      await createExtraProfile(`twin-${index}`, 'Twin Profile');
    }
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.profile.deleteMany({
      where: {
        slug: { startsWith: EXTRA_SLUG_PREFIX },
        NOT: { slug: { startsWith: `${EXTRA_SLUG_PREFIX}twin-` } },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('pages through all profiles in name order without repeats or gaps', async () => {
    // Pages of 2 always split the three twins across a page boundary.
    expect(await fetchAllIds(2)).toEqual(await idsInNameOrder());
  });

  it('returns 20 profiles by default', async () => {
    const response = await graphql(
      '{ profiles { nodes { id } pageInfo { hasNextPage } } }',
    );

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profiles.nodes).toHaveLength(20);
    expect(response.body.data.profiles.pageInfo.hasNextPage).toBe(true);
  });

  it('returns an empty page after the last profile', async () => {
    const all = FAKE_PROFILES + TWINS;
    const last = await fetchPage(all);
    expect(last.nodes).toHaveLength(all);
    expect(last.pageInfo.hasNextPage).toBe(false);

    expect(await fetchPage(10, last.pageInfo.endCursor)).toEqual({
      nodes: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    });
  });

  it('neither repeats nor skips profiles when one is added before the cursor', async () => {
    const expected = await idsInNameOrder();
    const first = await fetchPage(5);

    // Sorts before every other profile, so an offset would shift by one.
    await createExtraProfile('first', 'Aaaaa First');
    const rest = await fetchAllIds(5, first.pageInfo.endCursor);

    expect([...first.nodes.map(({ id }) => id), ...rest]).toEqual(expected);
  });

  it('loads the relations of a whole page with one query per relation', async () => {
    const profiles = app.get(ProfileRepository);
    const experience = app.get(ExperienceRepository);
    const spies = [
      vi.spyOn(profiles, 'findLinksByProfileIds'),
      vi.spyOn(profiles, 'findSkillsByProfileIds'),
      vi.spyOn(profiles, 'findProjectsByProfileIds'),
      vi.spyOn(experience, 'findByProfileIds'),
    ];
    const findAchievements = vi.spyOn(
      experience,
      'findAchievementsByExperienceIds',
    );

    const response = await graphql(`
      {
        profiles(first: 20) {
          nodes {
            links {
              url
            }
            skills {
              name
            }
            projects {
              name
            }
            experience {
              achievements {
                description
              }
            }
          }
        }
      }
    `);

    expect(response.body.errors).toBeUndefined();
    for (const spy of spies) {
      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toHaveLength(20);
    }
    expect(findAchievements).toHaveBeenCalledOnce();
  });

  it.each([
    ['first = 0', { first: 0 }],
    ['first above the maximum', { first: 51 }],
    ['a malformed cursor', { first: 5, after: 'not-a-cursor' }],
    ['an empty cursor', { first: 5, after: '' }],
  ])('rejects %s with BAD_REQUEST', async (_case, variables) => {
    const response = await graphql(PAGE_QUERY, variables);

    expect(response.body.data).toBeNull();
    expect(response.body.errors[0].extensions.code).toBe('BAD_REQUEST');
  });

  it('returns a profile by id with its relations', async () => {
    const expected = await prisma.profile.findUniqueOrThrow({
      where: { slug: 'fake-3' },
      include: { skills: { orderBy: { position: 'asc' } } },
    });

    const response = await graphql(
      'query Profile($id: ID!) { profile(id: $id) { id name skills { name } } }',
      { id: expected.id },
    );

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.profile).toEqual({
      id: expected.id,
      name: expected.name,
      skills: expected.skills.map(({ name }) => ({ name })),
    });
  });

  it.each([
    ['an unknown id', '00000000-0000-4000-8000-000000000000', 'NOT_FOUND'],
    ['an id that is not a UUID', 'fake-3', 'BAD_REQUEST'],
  ])('rejects %s', async (_case, id, code) => {
    const response = await graphql(
      'query Profile($id: ID!) { profile(id: $id) { name } }',
      { id },
    );

    expect(response.body.data).toBeNull();
    expect(response.body.errors[0].extensions.code).toBe(code);
  });
});

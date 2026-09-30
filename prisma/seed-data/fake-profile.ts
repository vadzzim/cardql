import { en, Faker } from '@faker-js/faker';
import type { SeedProfile } from './profile.schema.js';

// Generated profiles for development and tests. Each index has its own seeded
// generator, so profile N is the same whatever the total count is. Periods are
// counted back from a fixed month rather than today, so they do not drift.

const BASE_SEED = 1_000;
const REFERENCE_MONTH = toMonthIndex(2026, 1);

// Faker has no technology vocabulary: its job titles are "Dynamic Tactics
// Liaison", so the domain words come from these lists.
const SKILLS = [
  'TypeScript',
  'JavaScript',
  'Node.js',
  'NestJS',
  'Express',
  'GraphQL',
  'REST',
  'gRPC',
  'Prisma',
  'PostgreSQL',
  'CockroachDB',
  'MongoDB',
  'Redis',
  'Kafka',
  'RabbitMQ',
  'Docker',
  'Kubernetes',
  'Terraform',
  'AWS',
  'GCP',
  'Git',
  'CI/CD',
  'Go',
  'Python',
  'Rust',
  'React',
  'Vitest',
  'OpenTelemetry',
];

const ROLES = [
  'Backend Developer',
  'Full-Stack Developer',
  'Platform Engineer',
  'Software Engineer',
  'Site Reliability Engineer',
];

const LEVELS = ['Junior', '', 'Senior', 'Lead'];

const SERVICES = ['billing', 'search', 'checkout', 'notifications', 'auth'];

const ACHIEVEMENTS: ((f: Faker) => string)[] = [
  (f) =>
    `Cut p95 latency of the ${f.helpers.arrayElement(SERVICES)} API from ${f.number.int({ min: 400, max: 1200 })} ms to ${f.number.int({ min: 40, max: 200 })} ms`,
  (f) =>
    `Migrated ${f.number.int({ min: 3, max: 20 })} services from REST to GraphQL`,
  (f) =>
    `Raised test coverage from ${f.number.int({ min: 10, max: 40 })}% to ${f.number.int({ min: 70, max: 95 })}%`,
  (f) =>
    `Reduced cloud costs by ${f.number.int({ min: 15, max: 45 })}% by rightsizing clusters`,
  (f) => `Mentored ${f.number.int({ min: 2, max: 8 })} engineers`,
  (f) =>
    `Shortened CI from ${f.number.int({ min: 25, max: 60 })} to ${f.number.int({ min: 5, max: 15 })} minutes`,
  (f) =>
    `Built the ${f.helpers.arrayElement(SERVICES)} service handling ${f.number.int({ min: 1, max: 50 })}k requests per second`,
];

function toMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function formatMonthIndex(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Jobs from the newest back, without overlaps. The newest one is usually still
// current; the rest end before the next one starts.
function buildCareer(f: Faker): SeedProfile['experience'] {
  const jobCount = f.number.int({ min: 1, max: 5 });
  const isCurrent = f.datatype.boolean({ probability: 0.8 });
  let end =
    REFERENCE_MONTH - (isCurrent ? 0 : f.number.int({ min: 1, max: 6 }));

  return Array.from({ length: jobCount }, (_, jobIndex) => {
    const start = end - f.number.int({ min: 5, max: 47 });
    // Seniority grows with each job towards the newest one.
    const level =
      LEVELS[Math.min(LEVELS.length - 1, Math.max(0, jobCount - 1 - jobIndex))];
    const job = {
      company: f.company.name(),
      position: [level, f.helpers.arrayElement(ROLES)]
        .filter(Boolean)
        .join(' '),
      startDate: formatMonthIndex(start),
      endDate: jobIndex === 0 && isCurrent ? null : formatMonthIndex(end),
      achievements: f.helpers
        .arrayElements(ACHIEVEMENTS, { min: 0, max: 3 })
        .map((achievement) => achievement(f)),
    };
    end = start - f.number.int({ min: 1, max: 3 });
    return job;
  });
}

export function buildFakeProfile(index: number): SeedProfile {
  const f = new Faker({ locale: [en] });
  f.seed(BASE_SEED + index);

  const firstName = f.person.firstName();
  const lastName = f.person.lastName();
  const handle = f.internet
    .username({ firstName, lastName })
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');
  const skills = f.helpers.arrayElements(SKILLS, { min: 5, max: 12 });
  const experience = buildCareer(f);
  const headline = experience[0].position;

  return {
    name: `${firstName} ${lastName}`,
    headline,
    description: `${headline} working mostly with ${skills.slice(0, 3).join(', ')}.`,
    location: f.helpers.maybe(
      () => `${f.location.city()}, ${f.location.country()}`,
      { probability: 0.8 },
    ),
    email: f.helpers.maybe(
      () => f.internet.email({ firstName, lastName, provider: 'example.com' }),
      { probability: 0.6 },
    ),
    links: [
      { label: 'GitHub', url: `https://github.com/${handle}` },
      ...(f.datatype.boolean()
        ? [{ label: 'LinkedIn', url: `https://www.linkedin.com/in/${handle}` }]
        : []),
    ],
    skills: skills.map((name) => ({ name })),
    experience,
    projects: f.helpers
      .uniqueArray(
        () => `${f.hacker.adjective()}-${f.hacker.noun()}`.replace(/\s+/g, '-'),
        f.number.int({ min: 0, max: 4 }),
      )
      .map((name) => ({ name, url: `https://github.com/${handle}/${name}` })),
  };
}

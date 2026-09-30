// Smoke test against a running application, e.g. after `docker compose up`:
// checks that the API serves exactly the profile from prisma/seed-data with
// every relation resolved. Ordering and edge cases are covered by e2e tests.
//
//   pnpm smoke                      # http://localhost:3000/graphql
//   SMOKE_URL=http://host/graphql pnpm smoke

import { deepStrictEqual } from 'node:assert/strict';
import { validateSeedProfile } from '../prisma/seed-data/profile.schema.js';
import { profile } from '../prisma/seed-data/profile.js';
import { formatYearMonth } from '../src/experience/year-month.js';

const url = process.env.SMOKE_URL ?? 'http://localhost:3000/graphql';

const query = `{
  profile {
    name
    headline
    description
    location
    email
    links { label url }
    skills { name }
    projects { name url }
    experience {
      company
      position
      startDate
      endDate
      achievements { description }
    }
  }
}`;

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  achievements: { description: string }[];
}

// Entry order is checked by e2e tests; here only the content matters.
const byCompanyAndStart = (a: Experience, b: Experience) =>
  a.company.localeCompare(b.company) || a.startDate.localeCompare(b.startDate);

// The seed stores the validated (trimmed) data, so compare against it.
const seed = validateSeedProfile(profile);

const expected = {
  name: seed.name,
  headline: seed.headline,
  description: seed.description,
  location: seed.location ?? null,
  email: seed.email ?? null,
  links: seed.links,
  skills: seed.skills,
  projects: seed.projects,
  experience: seed.experience
    .map((entry) => ({
      company: entry.company,
      position: entry.position,
      startDate: formatYearMonth(entry.startDate),
      endDate: entry.endDate ? formatYearMonth(entry.endDate) : null,
      achievements: entry.achievements.map((description) => ({ description })),
    }))
    .sort(byCompanyAndStart),
};

const response = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query }),
});

if (!response.ok) {
  throw new Error(
    `${url} responded ${response.status}: ${await response.text()}`,
  );
}

const body = (await response.json()) as {
  data?: { profile: typeof expected } | null;
  errors?: unknown[];
};

if (body.errors || !body.data) {
  throw new Error(`GraphQL errors: ${JSON.stringify(body.errors, null, 2)}`);
}

const actual = body.data.profile;
deepStrictEqual(
  { ...actual, experience: [...actual.experience].sort(byCompanyAndStart) },
  expected,
);

console.log(
  `Smoke test passed: ${url} serves the seeded profile "${actual.name}"`,
);

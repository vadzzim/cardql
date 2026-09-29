import type { SeedProfile } from './profile.schema.js';

export const profile = {
  name: 'Your Name',
  headline: 'Backend Developer',
  description:
    'Short summary: what you build, which stack you use and what you care about.',
  location: 'City, Country',
  email: 'you@example.com',
  links: [
    { label: 'GitHub', url: 'https://github.com/your-username' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-username' },
  ],
  skills: [
    { name: 'TypeScript' },
    { name: 'Node.js' },
    { name: 'NestJS' },
    { name: 'GraphQL' },
    { name: 'Prisma' },
    { name: 'CockroachDB' },
    { name: 'Docker' },
    { name: 'Git' },
  ],
} satisfies SeedProfile;

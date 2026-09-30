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
  // Any order: the API returns experience newest first. Months are "YYYY-MM";
  // omit endDate for the current job.
  experience: [
    {
      company: 'Current Company',
      position: 'Senior Backend Developer',
      startDate: '2023-01',
      achievements: [
        'An achievement with a measurable result',
        'Another achievement',
      ],
    },
    {
      company: 'Previous Company',
      position: 'Backend Developer',
      startDate: '2020-06',
      endDate: '2022-12',
      achievements: ['An achievement with a measurable result'],
    },
  ],
} satisfies SeedProfile;

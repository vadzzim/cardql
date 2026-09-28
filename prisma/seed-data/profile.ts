import type { Prisma } from '../../src/generated/prisma/client.js';

export const profile = {
  slug: 'me',
  name: 'Your Name',
  headline: 'Backend Developer',
  description:
    'Short summary: what you build, which stack you use and what you care about.',
  location: 'City, Country',
  email: 'you@example.com',
} satisfies Prisma.ProfileCreateInput;

import type { Prisma } from '../../src/generated/prisma/client.js';

type SeedLink = Omit<Prisma.LinkCreateManyInput, 'profileId' | 'position'>;

export type SeedProfile = Omit<Prisma.ProfileCreateInput, 'slug' | 'links'> & {
  links: SeedLink[];
};

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
} satisfies SeedProfile;

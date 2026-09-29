import { z } from 'zod';
import type { Prisma } from '../../src/generated/prisma/client.js';

type ProfileRow = Omit<
  Prisma.ProfileCreateInput,
  'slug' | 'links' | 'skills'
> & {
  links: Omit<Prisma.LinkCreateManyInput, 'profileId' | 'position'>[];
  skills: Omit<Prisma.SkillCreateManyInput, 'profileId' | 'position'>[];
};

const text = z.string().trim().min(1);

function isUnique<T>(items: T[], key: (item: T) => string): boolean {
  return new Set(items.map(key)).size === items.length;
}

const linkSchema = z.strictObject({
  label: text,
  url: z.url({ protocol: /^https?$/ }),
});

const skillSchema = z.strictObject({
  name: text,
});

export const seedProfileSchema = z.strictObject({
  name: text,
  headline: text,
  description: text,
  location: text.nullish(),
  email: z.email().nullish(),
  links: z
    .array(linkSchema)
    .refine(
      (links) => isUnique(links, ({ label }) => label),
      'Link labels must be unique',
    ),
  // "TypeScript" and "typescript" are the same skill, so compare ignoring case.
  skills: z
    .array(skillSchema)
    .refine(
      (skills) => isUnique(skills, ({ name }) => name.toLowerCase()),
      'Skill names must be unique',
    ),
}) satisfies z.ZodType<ProfileRow>;

export type SeedProfile = z.input<typeof seedProfileSchema>;

export function validateSeedProfile(
  input: unknown,
): z.output<typeof seedProfileSchema> {
  const result = seedProfileSchema.safeParse(input);

  if (!result.success) {
    throw new Error(`Invalid seed profile:\n${z.prettifyError(result.error)}`);
  }

  return result.data;
}

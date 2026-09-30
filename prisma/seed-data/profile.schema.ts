import { z } from 'zod';
import {
  parseYearMonth,
  YEAR_MONTH_PATTERN,
} from '../../src/experience/year-month.js';
import type { Prisma } from '../../src/generated/prisma/client.js';

type ProfileRow = Omit<
  Prisma.ProfileCreateInput,
  'slug' | 'links' | 'skills' | 'experience'
> & {
  links: Omit<Prisma.LinkCreateManyInput, 'profileId' | 'position'>[];
  skills: Omit<Prisma.SkillCreateManyInput, 'profileId' | 'position'>[];
  experience: (Omit<Prisma.ExperienceCreateManyInput, 'profileId'> & {
    achievements: Prisma.AchievementCreateManyInput['description'][];
  })[];
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

// "2021-03" in the seed file, the first day of that month in the database.
const yearMonth = z
  .string()
  .regex(YEAR_MONTH_PATTERN, 'Expected a month as "YYYY-MM"')
  .transform(parseYearMonth);

const experienceSchema = z
  .strictObject({
    company: text,
    position: text,
    startDate: yearMonth,
    // Omitted or null while the job is current.
    endDate: yearMonth.nullish(),
    achievements: z.array(text),
  })
  .refine(({ startDate, endDate }) => !endDate || endDate >= startDate, {
    message: 'endDate must not be before startDate',
    path: ['endDate'],
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
  experience: z.array(experienceSchema),
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

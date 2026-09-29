import { z } from 'zod';
import type { Prisma } from '../../src/generated/prisma/client.js';

type ProfileRow = Omit<Prisma.ProfileCreateInput, 'slug' | 'links'> & {
  links: Omit<Prisma.LinkCreateManyInput, 'profileId' | 'position'>[];
};

const text = z.string().trim().min(1);

const linkSchema = z.strictObject({
  label: text,
  url: z.url({ protocol: /^https?$/ }),
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
      (links) => new Set(links.map(({ label }) => label)).size === links.length,
      'Link labels must be unique',
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

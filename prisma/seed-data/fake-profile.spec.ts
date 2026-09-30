import { describe, expect, it } from 'vitest';
import { buildFakeProfile } from './fake-profile.js';
import { validateSeedProfile } from './profile.schema.js';

const profiles = Array.from({ length: 200 }, (_, index) =>
  buildFakeProfile(index),
);

describe('buildFakeProfile', () => {
  it('returns the same profile for the same index', () => {
    expect(buildFakeProfile(42)).toEqual(profiles[42]);
  });

  it('returns different profiles for different indices', () => {
    const names = new Set(profiles.map(({ name }) => name));

    expect(names.size).toBeGreaterThan(profiles.length * 0.9);
  });

  it('builds valid seed data', () => {
    for (const profile of profiles) {
      expect(() => validateSeedProfile(profile), profile.name).not.toThrow();
    }
  });

  it('builds careers without overlapping jobs, newest first', () => {
    for (const profile of profiles) {
      const [newest, ...older] = validateSeedProfile(profile).experience;
      let nextStart = newest.startDate;

      for (const job of older) {
        expect(job.endDate, profile.name).toBeInstanceOf(Date);
        expect(job.endDate! < nextStart, profile.name).toBe(true);
        nextStart = job.startDate;
      }
    }
  });
});

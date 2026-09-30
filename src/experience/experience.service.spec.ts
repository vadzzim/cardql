import { describe, expect, it, vi } from 'vitest';
import type { Achievement, Experience } from '../generated/prisma/client.js';
import type { ExperienceRepository } from './experience.repository.js';
import { ExperienceService } from './experience.service.js';

const entry = (profileId: string, company: string): Experience => ({
  id: `${profileId}-${company}`,
  profileId,
  company,
  position: 'Engineer',
  startDate: new Date(0),
  endDate: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

const achievement = (experienceId: string, position: number): Achievement => ({
  id: `${experienceId}-${position}`,
  experienceId,
  description: `Achievement ${position} of ${experienceId}`,
  position,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

function serviceWith(rows: {
  experience?: Experience[];
  achievements?: Achievement[];
}) {
  const repository = {
    findByProfileIds: vi.fn().mockResolvedValue(rows.experience ?? []),
    findAchievementsByExperienceIds: vi
      .fn()
      .mockResolvedValue(rows.achievements ?? []),
  };
  const service = new ExperienceService(
    repository as unknown as ExperienceRepository,
  );

  return { service, repository };
}

describe('ExperienceService', () => {
  it('loads experience of all profiles with one call, grouped by profile', async () => {
    const { service, repository } = serviceWith({
      experience: [
        entry('a', 'Acme'),
        entry('b', 'Globex'),
        entry('a', 'Initech'),
      ],
    });

    const groups = await service.getByProfileIds(['b', 'a', 'c']);

    expect(repository.findByProfileIds).toHaveBeenCalledExactlyOnceWith([
      'b',
      'a',
      'c',
    ]);
    expect(groups).toEqual([
      [entry('b', 'Globex')],
      [entry('a', 'Acme'), entry('a', 'Initech')],
      [],
    ]);
  });

  it('loads achievements of all entries with one call, grouped by entry', async () => {
    const { service, repository } = serviceWith({
      achievements: [
        achievement('a', 0),
        achievement('b', 0),
        achievement('a', 1),
      ],
    });

    const groups = await service.getAchievementsByExperienceIds(['b', 'a']);

    expect(
      repository.findAchievementsByExperienceIds,
    ).toHaveBeenCalledExactlyOnceWith(['b', 'a']);
    expect(groups).toEqual([
      [achievement('b', 0)],
      [achievement('a', 0), achievement('a', 1)],
    ]);
  });
});

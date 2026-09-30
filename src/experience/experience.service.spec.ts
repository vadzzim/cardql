import { describe, expect, it, vi } from 'vitest';
import type { Achievement } from '../generated/prisma/client.js';
import type { ExperienceRepository } from './experience.repository.js';
import { ExperienceService } from './experience.service.js';

const achievement = (experienceId: string, position: number): Achievement => ({
  id: `${experienceId}-${position}`,
  experienceId,
  description: `Achievement ${position} of ${experienceId}`,
  position,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

function serviceReturning(achievements: Achievement[]) {
  const repository = {
    findAchievementsByExperienceIds: vi.fn().mockResolvedValue(achievements),
  };
  const service = new ExperienceService(
    repository as unknown as ExperienceRepository,
  );

  return { service, repository };
}

describe('ExperienceService.getAchievementsByExperienceIds', () => {
  it('loads all ids with one repository call', async () => {
    const { service, repository } = serviceReturning([]);

    await service.getAchievementsByExperienceIds(['a', 'b']);

    expect(repository.findAchievementsByExperienceIds).toHaveBeenCalledOnce();
    expect(repository.findAchievementsByExperienceIds).toHaveBeenCalledWith([
      'a',
      'b',
    ]);
  });

  it('groups achievements by id in the order of the ids', async () => {
    // The repository returns rows sorted by position, not by entry.
    const { service } = serviceReturning([
      achievement('a', 0),
      achievement('b', 0),
      achievement('a', 1),
    ]);

    const groups = await service.getAchievementsByExperienceIds(['b', 'a']);

    expect(groups).toEqual([
      [achievement('b', 0)],
      [achievement('a', 0), achievement('a', 1)],
    ]);
  });

  it('returns an empty list for an id without achievements', async () => {
    const { service } = serviceReturning([achievement('a', 0)]);

    const groups = await service.getAchievementsByExperienceIds(['a', 'b']);

    expect(groups).toEqual([[achievement('a', 0)], []]);
  });
});

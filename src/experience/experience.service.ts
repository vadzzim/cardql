import { Injectable } from '@nestjs/common';
import { groupByKeys } from '../common/dataloader/group-by-keys.js';
import type { Achievement, Experience } from '../generated/prisma/client.js';
import { ExperienceRepository } from './experience.repository.js';

// Batch loaders: one list per given id, in the order of the ids; a parent
// without rows gets [].
@Injectable()
export class ExperienceService {
  constructor(private readonly experience: ExperienceRepository) {}

  // Each list is newest first.
  async getByProfileIds(
    profileIds: readonly string[],
  ): Promise<Experience[][]> {
    const entries = await this.experience.findByProfileIds(profileIds);
    return groupByKeys(profileIds, entries, ({ profileId }) => profileId);
  }

  // Each list is in display order.
  async getAchievementsByExperienceIds(
    experienceIds: readonly string[],
  ): Promise<Achievement[][]> {
    const achievements =
      await this.experience.findAchievementsByExperienceIds(experienceIds);
    return groupByKeys(
      experienceIds,
      achievements,
      ({ experienceId }) => experienceId,
    );
  }
}

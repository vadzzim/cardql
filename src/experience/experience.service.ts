import { Injectable } from '@nestjs/common';
import type { Achievement, Experience } from '../generated/prisma/client.js';
import { ExperienceRepository } from './experience.repository.js';

@Injectable()
export class ExperienceService {
  constructor(private readonly experience: ExperienceRepository) {}

  getByProfileId(profileId: string): Promise<Experience[]> {
    return this.experience.findByProfileId(profileId);
  }

  // Returns one list per given id, in the order of the ids, each in display
  // order; an entry without achievements gets []. This is the shape DataLoader
  // expects from a batch function.
  async getAchievementsByExperienceIds(
    experienceIds: readonly string[],
  ): Promise<Achievement[][]> {
    const achievements =
      await this.experience.findAchievementsByExperienceIds(experienceIds);
    const groups = new Map<string, Achievement[]>(
      experienceIds.map((id) => [id, []]),
    );

    for (const achievement of achievements) {
      groups.get(achievement.experienceId)?.push(achievement);
    }

    return experienceIds.map((id) => groups.get(id) ?? []);
  }
}

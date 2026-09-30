import { Injectable } from '@nestjs/common';
import { ContextLoader } from '../common/dataloader/context-loader.js';
import type { Achievement, Experience } from '../generated/prisma/client.js';
import { ExperienceService } from './experience.service.js';

// Per-request loaders: experience keyed by profile id, achievements keyed by
// experience id.
@Injectable()
export class ExperienceLoaders {
  readonly experience = new ContextLoader<string, Experience[]>((profileIds) =>
    this.experienceService.getByProfileIds(profileIds),
  );

  readonly achievements = new ContextLoader<string, Achievement[]>(
    (experienceIds) =>
      this.experienceService.getAchievementsByExperienceIds(experienceIds),
  );

  constructor(private readonly experienceService: ExperienceService) {}
}

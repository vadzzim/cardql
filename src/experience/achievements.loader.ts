import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import type { Achievement } from '../generated/prisma/client.js';
import { ExperienceService } from './experience.service.js';

// Batches the achievements of all experience entries in one GraphQL request
// into a single query instead of one query per entry.
//
// A loader caches its results, so every request gets its own. Loaders are
// keyed by the request's GraphQL context object rather than provided with
// Scope.REQUEST: that scope would spread to the resolvers and recreate them
// on every request. The WeakMap drops a loader together with its context.
@Injectable()
export class AchievementsLoader {
  private readonly loaders = new WeakMap<
    object,
    DataLoader<string, Achievement[]>
  >();

  constructor(private readonly experienceService: ExperienceService) {}

  forContext(context: object): DataLoader<string, Achievement[]> {
    let loader = this.loaders.get(context);

    if (!loader) {
      loader = new DataLoader((experienceIds) =>
        this.experienceService.getAchievementsByExperienceIds(experienceIds),
      );
      this.loaders.set(context, loader);
    }

    return loader;
  }
}

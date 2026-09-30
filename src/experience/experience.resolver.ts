import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import type { Experience } from '../generated/prisma/client.js';
import { AchievementsLoader } from './achievements.loader.js';
import { AchievementModel } from './models/achievement.model.js';
import { ExperienceModel } from './models/experience.model.js';
import { formatYearMonth } from './year-month.js';

@Resolver(() => ExperienceModel)
export class ExperienceResolver {
  constructor(private readonly achievementsLoader: AchievementsLoader) {}

  @ResolveField(() => String, {
    description: 'First month of the job, "YYYY-MM"',
  })
  startDate(@Parent() experience: Experience): string {
    return formatYearMonth(experience.startDate);
  }

  @ResolveField(() => String, {
    nullable: true,
    description: 'Last month of the job, "YYYY-MM"; null while it is current',
  })
  endDate(@Parent() experience: Experience): string | null {
    return experience.endDate && formatYearMonth(experience.endDate);
  }

  @ResolveField(() => [AchievementModel], {
    description: 'Achievements in display order',
  })
  achievements(
    @Parent() experience: Experience,
    @Context() context: object,
  ): Promise<AchievementModel[]> {
    return this.achievementsLoader.forContext(context).load(experience.id);
  }
}

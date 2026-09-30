import { Module } from '@nestjs/common';
import { AchievementsLoader } from './achievements.loader.js';
import { ExperienceRepository } from './experience.repository.js';
import { ExperienceResolver } from './experience.resolver.js';
import { ExperienceService } from './experience.service.js';
import { ProfileExperienceResolver } from './profile-experience.resolver.js';

@Module({
  providers: [
    ExperienceRepository,
    ExperienceService,
    AchievementsLoader,
    ExperienceResolver,
    ProfileExperienceResolver,
  ],
})
export class ExperienceModule {}

import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ProfileModel } from '../profile/models/profile.model.js';
import { ExperienceService } from './experience.service.js';
import { ExperienceModel } from './models/experience.model.js';

// Adds Profile.experience from this module, so ProfileModule does not depend
// on experience.
@Resolver(() => ProfileModel)
export class ProfileExperienceResolver {
  constructor(private readonly experienceService: ExperienceService) {}

  @ResolveField(() => [ExperienceModel], {
    description: 'Work experience, newest first',
  })
  experience(@Parent() profile: ProfileModel): Promise<ExperienceModel[]> {
    return this.experienceService.getByProfileId(profile.id);
  }
}

import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ProfileModel } from '../profile/models/profile.model.js';
import { ExperienceLoaders } from './experience.loaders.js';
import { ExperienceModel } from './models/experience.model.js';

// Adds Profile.experience from this module, so ProfileModule does not depend
// on experience.
@Resolver(() => ProfileModel)
export class ProfileExperienceResolver {
  constructor(private readonly loaders: ExperienceLoaders) {}

  @ResolveField(() => [ExperienceModel], {
    description: 'Work experience, newest first',
  })
  experience(
    @Parent() profile: ProfileModel,
    @Context() context: object,
  ): Promise<ExperienceModel[]> {
    return this.loaders.experience.forContext(context).load(profile.id);
  }
}

import { Args, Query, Resolver } from '@nestjs/graphql';
import { ProfileModel } from './models/profile.model.js';
import { ProfileService } from './profile.service.js';

@Resolver(() => ProfileModel)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => ProfileModel, {
    description:
      'Returns the profile by slug, or the main profile when omitted',
  })
  profile(
    @Args('slug', { type: () => String, nullable: true }) slug?: string | null,
  ): Promise<ProfileModel> {
    return this.profileService.getBySlug(slug);
  }
}

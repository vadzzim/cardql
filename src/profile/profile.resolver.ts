import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { LinkModel } from './models/link.model.js';
import { ProfileModel } from './models/profile.model.js';
import { ProfileService } from './profile.service.js';

@Resolver(() => ProfileModel)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => ProfileModel, { description: 'Returns the card owner profile' })
  profile(): Promise<ProfileModel> {
    return this.profileService.getMain();
  }

  // Resolved separately so the links query runs only when the field is asked for.
  @ResolveField(() => [LinkModel], {
    description: 'Profile links in display order',
  })
  links(@Parent() profile: ProfileModel): Promise<LinkModel[]> {
    return this.profileService.getLinks(profile.id);
  }
}

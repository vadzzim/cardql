import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { LinkModel } from './models/link.model.js';
import { ProfileModel } from './models/profile.model.js';
import { SkillModel } from './models/skill.model.js';
import { ProfileService } from './profile.service.js';

@Resolver(() => ProfileModel)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => ProfileModel, { description: 'Returns the card owner profile' })
  profile(): Promise<ProfileModel> {
    return this.profileService.getMain();
  }

  // Relations are resolved separately so each query runs only when its field
  // is asked for.
  @ResolveField(() => [LinkModel], {
    description: 'Profile links in display order',
  })
  links(@Parent() profile: ProfileModel): Promise<LinkModel[]> {
    return this.profileService.getLinks(profile.id);
  }

  @ResolveField(() => [SkillModel], {
    description: 'Profile skills in display order',
  })
  skills(@Parent() profile: ProfileModel): Promise<SkillModel[]> {
    return this.profileService.getSkills(profile.id);
  }
}

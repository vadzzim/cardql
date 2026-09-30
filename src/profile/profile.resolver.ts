import {
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { LinkModel } from './models/link.model.js';
import { ProfileModel } from './models/profile.model.js';
import { ProjectModel } from './models/project.model.js';
import { SkillModel } from './models/skill.model.js';
import { ProfileLoaders } from './profile.loaders.js';
import { ProfileService } from './profile.service.js';

@Resolver(() => ProfileModel)
export class ProfileResolver {
  constructor(
    private readonly profileService: ProfileService,
    private readonly loaders: ProfileLoaders,
  ) {}

  @Query(() => ProfileModel, { description: 'Returns the card owner profile' })
  profile(): Promise<ProfileModel> {
    return this.profileService.getMain();
  }

  // Relations are resolved separately so each query runs only when its field
  // is asked for, batched across all profiles of the request.
  @ResolveField(() => [LinkModel], {
    description: 'Profile links in display order',
  })
  links(
    @Parent() profile: ProfileModel,
    @Context() context: object,
  ): Promise<LinkModel[]> {
    return this.loaders.links.forContext(context).load(profile.id);
  }

  @ResolveField(() => [SkillModel], {
    description: 'Profile skills in display order',
  })
  skills(
    @Parent() profile: ProfileModel,
    @Context() context: object,
  ): Promise<SkillModel[]> {
    return this.loaders.skills.forContext(context).load(profile.id);
  }

  @ResolveField(() => [ProjectModel], {
    description: 'Profile projects in display order',
  })
  projects(
    @Parent() profile: ProfileModel,
    @Context() context: object,
  ): Promise<ProjectModel[]> {
    return this.loaders.projects.forContext(context).load(profile.id);
  }
}

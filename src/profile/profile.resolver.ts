import {
  Args,
  Context,
  ID,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ParseUUIDPipe } from '@nestjs/common';
import { LinkModel } from './models/link.model.js';
import { ProfileConnectionModel } from './models/profile-connection.model.js';
import { ProfileModel } from './models/profile.model.js';
import { ProjectModel } from './models/project.model.js';
import { SkillModel } from './models/skill.model.js';
import { ProfileLoaders } from './profile.loaders.js';
import { ProfileService } from './profile.service.js';
import { ProfilesArgs } from './profiles.args.js';

@Resolver(() => ProfileModel)
export class ProfileResolver {
  constructor(
    private readonly profileService: ProfileService,
    private readonly loaders: ProfileLoaders,
  ) {}

  @Query(() => ProfileModel, {
    description: 'Returns the profile with this id, or the card owner profile',
  })
  profile(
    @Args(
      'id',
      { type: () => ID, nullable: true },
      new ParseUUIDPipe({ optional: true }),
    )
    id?: string | null,
  ): Promise<ProfileModel> {
    return id ? this.profileService.getById(id) : this.profileService.getMain();
  }

  @Query(() => ProfileConnectionModel, {
    description: 'Returns all profiles ordered by name, page by page',
  })
  profiles(
    @Args() { first, after }: ProfilesArgs,
  ): Promise<ProfileConnectionModel> {
    return this.profileService.getPage(first, after);
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

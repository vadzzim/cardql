import { Query, Resolver } from '@nestjs/graphql';
import { ProfileModel } from './models/profile.model.js';
import { ProfileService } from './profile.service.js';

@Resolver(() => ProfileModel)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => ProfileModel, { description: 'Returns the card owner profile' })
  profile(): Promise<ProfileModel> {
    return this.profileService.getMain();
  }
}

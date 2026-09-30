import { Module } from '@nestjs/common';
import { ProfileLoaders } from './profile.loaders.js';
import { ProfileRepository } from './profile.repository.js';
import { ProfileResolver } from './profile.resolver.js';
import { ProfileService } from './profile.service.js';

@Module({
  providers: [
    ProfileRepository,
    ProfileService,
    ProfileLoaders,
    ProfileResolver,
  ],
})
export class ProfileModule {}

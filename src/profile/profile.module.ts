import { Module } from '@nestjs/common';
import { ProfileRepository } from './profile.repository.js';
import { ProfileResolver } from './profile.resolver.js';
import { ProfileService } from './profile.service.js';

@Module({
  providers: [ProfileRepository, ProfileService, ProfileResolver],
})
export class ProfileModule {}

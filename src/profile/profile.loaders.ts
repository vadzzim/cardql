import { Injectable } from '@nestjs/common';
import { ContextLoader } from '../common/dataloader/context-loader.js';
import type { Link, Project, Skill } from '../generated/prisma/client.js';
import { ProfileService } from './profile.service.js';

// Per-request loaders for the profile relations, keyed by profile id.
@Injectable()
export class ProfileLoaders {
  readonly links = new ContextLoader<string, Link[]>((profileIds) =>
    this.profileService.getLinksByProfileIds(profileIds),
  );

  readonly skills = new ContextLoader<string, Skill[]>((profileIds) =>
    this.profileService.getSkillsByProfileIds(profileIds),
  );

  readonly projects = new ContextLoader<string, Project[]>((profileIds) =>
    this.profileService.getProjectsByProfileIds(profileIds),
  );

  constructor(private readonly profileService: ProfileService) {}
}

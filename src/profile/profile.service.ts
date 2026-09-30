import { Injectable, NotFoundException } from '@nestjs/common';
import { groupByKeys } from '../common/dataloader/group-by-keys.js';
import type {
  Link,
  Profile,
  Project,
  Skill,
} from '../generated/prisma/client.js';
import { MAIN_PROFILE_SLUG } from './profile.constants.js';
import { ProfileRepository } from './profile.repository.js';

@Injectable()
export class ProfileService {
  constructor(private readonly profiles: ProfileRepository) {}

  async getMain(): Promise<Profile> {
    const profile = await this.profiles.findBySlug(MAIN_PROFILE_SLUG);

    if (!profile) {
      throw new NotFoundException(`Profile "${MAIN_PROFILE_SLUG}" not found`);
    }

    return profile;
  }

  // Batch loaders: one list per profile id, in the order of the ids, each in
  // display order.
  async getLinksByProfileIds(profileIds: readonly string[]): Promise<Link[][]> {
    const links = await this.profiles.findLinksByProfileIds(profileIds);
    return groupByKeys(profileIds, links, ({ profileId }) => profileId);
  }

  async getSkillsByProfileIds(
    profileIds: readonly string[],
  ): Promise<Skill[][]> {
    const skills = await this.profiles.findSkillsByProfileIds(profileIds);
    return groupByKeys(profileIds, skills, ({ profileId }) => profileId);
  }

  async getProjectsByProfileIds(
    profileIds: readonly string[],
  ): Promise<Project[][]> {
    const projects = await this.profiles.findProjectsByProfileIds(profileIds);
    return groupByKeys(profileIds, projects, ({ profileId }) => profileId);
  }
}

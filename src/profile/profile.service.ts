import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { groupByKeys } from '../common/dataloader/group-by-keys.js';
import type {
  Link,
  Profile,
  Project,
  Skill,
} from '../generated/prisma/client.js';
import { decodeProfileCursor, encodeProfileCursor } from './profile-cursor.js';
import { MAIN_PROFILE_SLUG, MAX_PAGE_SIZE } from './profile.constants.js';
import { ProfileRepository } from './profile.repository.js';

export interface ProfilePage {
  nodes: Profile[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

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

  async getById(id: string): Promise<Profile> {
    const profile = await this.profiles.findById(id);

    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }

    return profile;
  }

  async getPage(first: number, after?: string | null): Promise<ProfilePage> {
    if (first < 1 || first > MAX_PAGE_SIZE) {
      throw new BadRequestException(
        `first must be between 1 and ${MAX_PAGE_SIZE}`,
      );
    }

    // One extra row tells whether another page follows, without a count query.
    const rows = await this.profiles.findPage(
      after == null ? null : decodeProfileCursor(after),
      first + 1,
    );
    const nodes = rows.slice(0, first);
    const last = nodes.at(-1);

    return {
      nodes,
      pageInfo: {
        hasNextPage: rows.length > first,
        endCursor: last ? encodeProfileCursor(last) : null,
      },
    };
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

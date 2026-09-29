import { Injectable, NotFoundException } from '@nestjs/common';
import type { Link, Profile, Skill } from '../generated/prisma/client.js';
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

  getLinks(profileId: string): Promise<Link[]> {
    return this.profiles.findLinks(profileId);
  }

  getSkills(profileId: string): Promise<Skill[]> {
    return this.profiles.findSkills(profileId);
  }
}

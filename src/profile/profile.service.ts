import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import type { Profile } from '../generated/prisma/client.js';
import { ProfileRepository } from './profile.repository.js';

@Injectable()
export class ProfileService {
  private readonly defaultSlug: string;

  constructor(
    private readonly profiles: ProfileRepository,
    config: ConfigService<Env, true>,
  ) {
    this.defaultSlug = config.get('PROFILE_SLUG', { infer: true });
  }

  async getBySlug(requested?: string | null): Promise<Profile> {
    const slug = requested ?? this.defaultSlug;
    const profile = await this.profiles.findBySlug(slug);

    if (!profile) {
      throw new NotFoundException(`Profile "${slug}" not found`);
    }

    return profile;
  }
}

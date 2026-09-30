import { Injectable } from '@nestjs/common';
import type { Achievement, Experience } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Newest first; among jobs started in the same month, the current or most
  // recently finished one comes first.
  findByProfileId(profileId: string): Promise<Experience[]> {
    return this.prisma.experience.findMany({
      where: { profileId },
      orderBy: [
        { startDate: 'desc' },
        { endDate: { sort: 'desc', nulls: 'first' } },
      ],
    });
  }

  findAchievementsByExperienceIds(
    experienceIds: readonly string[],
  ): Promise<Achievement[]> {
    return this.prisma.achievement.findMany({
      where: { experienceId: { in: [...experienceIds] } },
      orderBy: { position: 'asc' },
    });
  }
}

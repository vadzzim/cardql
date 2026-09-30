import { Injectable } from '@nestjs/common';
import type {
  Link,
  Profile,
  Project,
  Skill,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ProfileCursor } from './profile-cursor.js';

// Relation queries take many profile ids at once for DataLoader batching.
@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({ where: { slug } });
  }

  findById(id: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({ where: { id } });
  }

  // Keyset pagination: the profiles after the cursor in (name, id) order,
  // served by the (name, id) index without scanning the skipped rows.
  findPage(after: ProfileCursor | null, take: number): Promise<Profile[]> {
    return this.prisma.profile.findMany({
      where: after
        ? {
            OR: [
              { name: { gt: after.name } },
              { name: after.name, id: { gt: after.id } },
            ],
          }
        : undefined,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take,
    });
  }

  findLinksByProfileIds(profileIds: readonly string[]): Promise<Link[]> {
    return this.prisma.link.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: { position: 'asc' },
    });
  }

  findSkillsByProfileIds(profileIds: readonly string[]): Promise<Skill[]> {
    return this.prisma.skill.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: { position: 'asc' },
    });
  }

  findProjectsByProfileIds(profileIds: readonly string[]): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: { position: 'asc' },
    });
  }
}

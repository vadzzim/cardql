import { Injectable } from '@nestjs/common';
import type {
  Link,
  Profile,
  Project,
  Skill,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({ where: { slug } });
  }

  findLinks(profileId: string): Promise<Link[]> {
    return this.prisma.link.findMany({
      where: { profileId },
      orderBy: { position: 'asc' },
    });
  }

  findSkills(profileId: string): Promise<Skill[]> {
    return this.prisma.skill.findMany({
      where: { profileId },
      orderBy: { position: 'asc' },
    });
  }

  findProjects(profileId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { profileId },
      orderBy: { position: 'asc' },
    });
  }
}

import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { Profile } from '../generated/prisma/client.js';
import { decodeProfileCursor } from './profile-cursor.js';
import { MAX_PAGE_SIZE } from './profile.constants.js';
import type { ProfileRepository } from './profile.repository.js';
import { ProfileService } from './profile.service.js';

const profile = (index: number): Profile => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  slug: `profile-${index}`,
  name: `Profile ${index}`,
  headline: 'Engineer',
  description: 'Profile',
  location: null,
  email: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

// The repository returns up to `take` rows from a list of `total` profiles.
function serviceWithProfiles(total: number) {
  const rows = Array.from({ length: total }, (_, index) => profile(index));
  const repository = {
    findPage: vi.fn((_after: unknown, take: number) =>
      Promise.resolve(rows.slice(0, take)),
    ),
  };
  const service = new ProfileService(
    repository as unknown as ProfileRepository,
  );

  return { service, repository };
}

describe('ProfileService.getPage', () => {
  it('asks for one extra row and reports that more pages follow', async () => {
    const { service, repository } = serviceWithProfiles(5);

    const page = await service.getPage(2);

    expect(repository.findPage).toHaveBeenCalledExactlyOnceWith(null, 3);
    expect(page.nodes).toEqual([profile(0), profile(1)]);
    expect(page.pageInfo.hasNextPage).toBe(true);
    expect(decodeProfileCursor(page.pageInfo.endCursor!)).toEqual({
      name: profile(1).name,
      id: profile(1).id,
    });
  });

  it('reports the last page when no extra row comes back', async () => {
    const { service } = serviceWithProfiles(2);

    const page = await service.getPage(2);

    expect(page.nodes).toHaveLength(2);
    expect(page.pageInfo.hasNextPage).toBe(false);
  });

  it('returns a null endCursor for an empty page', async () => {
    const { service } = serviceWithProfiles(0);

    const page = await service.getPage(10);

    expect(page).toEqual({
      nodes: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    });
  });

  it('passes the decoded cursor to the repository', async () => {
    const { service, repository } = serviceWithProfiles(5);
    const first = await service.getPage(1);

    await service.getPage(1, first.pageInfo.endCursor);

    expect(repository.findPage).toHaveBeenLastCalledWith(
      { name: profile(0).name, id: profile(0).id },
      2,
    );
  });

  it.each([0, -1, MAX_PAGE_SIZE + 1])(
    'rejects first = %i without a query',
    async (first) => {
      const { service, repository } = serviceWithProfiles(5);

      await expect(service.getPage(first)).rejects.toThrow(BadRequestException);
      expect(repository.findPage).not.toHaveBeenCalled();
    },
  );
});

import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

// Position in the profile list, which is ordered by name, then id. The cursor
// keeps the values rather than a reference to a row, so it stays valid when
// profiles are added or removed, and even when the seed recreates them.
export interface ProfileCursor {
  name: string;
  id: string;
}

const cursorSchema = z.tuple([z.string(), z.uuid()]);

// Opaque to clients: base64url, so the format can change without an API change.
export function encodeProfileCursor({ name, id }: ProfileCursor): string {
  return Buffer.from(JSON.stringify([name, id])).toString('base64url');
}

export function decodeProfileCursor(cursor: string): ProfileCursor {
  try {
    const [name, id] = cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, 'base64url').toString()),
    );
    return { name, id };
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}

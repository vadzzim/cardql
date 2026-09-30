import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { decodeProfileCursor, encodeProfileCursor } from './profile-cursor.js';

const position = {
  name: 'Zoë O’Brien, Jr.',
  id: '6f1c2b1e-8d4a-4c3e-9b7a-2f5d8e9c0a1b',
};

describe('profile cursor', () => {
  it('round-trips any name, including non-ASCII and punctuation', () => {
    expect(decodeProfileCursor(encodeProfileCursor(position))).toEqual(
      position,
    );
  });

  it('is URL-safe', () => {
    expect(encodeProfileCursor(position)).toMatch(/^[\w-]+$/);
  });

  it.each([
    ['an empty string', ''],
    ['not base64 JSON', 'not a cursor'],
    ['a JSON object', Buffer.from('{"name":"A"}').toString('base64url')],
    [
      'an id that is not a UUID',
      Buffer.from('["A","42"]').toString('base64url'),
    ],
    [
      'extra elements',
      Buffer.from(`["A","${position.id}",1]`).toString('base64url'),
    ],
  ])('rejects %s', (_case, cursor) => {
    expect(() => decodeProfileCursor(cursor)).toThrow(BadRequestException);
  });
});

import { describe, expect, it } from 'vitest';
import { groupByKeys } from './group-by-keys.js';

const row = (parentId: string, position: number) => ({ parentId, position });
const parentOf = ({ parentId }: { parentId: string }) => parentId;

describe('groupByKeys', () => {
  it('groups rows in the order of the keys, keeping the row order', () => {
    // Repositories return rows sorted by position, not by parent.
    const rows = [row('a', 0), row('b', 0), row('a', 1)];

    expect(groupByKeys(['b', 'a'], rows, parentOf)).toEqual([
      [row('b', 0)],
      [row('a', 0), row('a', 1)],
    ]);
  });

  it('returns an empty list for a key without rows', () => {
    expect(groupByKeys(['a', 'b'], [row('a', 0)], parentOf)).toEqual([
      [row('a', 0)],
      [],
    ]);
  });

  it('ignores rows of keys that were not asked for', () => {
    expect(groupByKeys(['a'], [row('a', 0), row('c', 0)], parentOf)).toEqual([
      [row('a', 0)],
    ]);
  });
});

// Returns one list per key, in the order of the keys, keeping the order of the
// rows inside each list; a key without rows gets []. This is the shape a
// DataLoader batch function has to return.
export function groupByKeys<K, V>(
  keys: readonly K[],
  rows: readonly V[],
  keyOf: (row: V) => K,
): V[][] {
  const groups = new Map<K, V[]>(keys.map((key) => [key, []]));

  for (const row of rows) {
    groups.get(keyOf(row))?.push(row);
  }

  return keys.map((key) => groups.get(key) ?? []);
}

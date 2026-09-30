import { describe, expect, it, vi } from 'vitest';
import { ContextLoader } from './context-loader.js';

function loaderWithBatch() {
  const batch = vi.fn((keys: readonly string[]) =>
    Promise.resolve(keys.map((key) => key.toUpperCase())),
  );

  return { batch, loader: new ContextLoader(batch) };
}

describe('ContextLoader', () => {
  it('batches the loads of one context into one call', async () => {
    const { batch, loader } = loaderWithBatch();
    const context = {};

    const values = await Promise.all([
      loader.forContext(context).load('a'),
      loader.forContext(context).load('b'),
    ]);

    expect(values).toEqual(['A', 'B']);
    expect(batch).toHaveBeenCalledOnce();
    expect(batch).toHaveBeenCalledWith(['a', 'b']);
  });

  it('does not share cached values between contexts', async () => {
    const { batch, loader } = loaderWithBatch();

    await loader.forContext({}).load('a');
    await loader.forContext({}).load('a');

    expect(batch).toHaveBeenCalledTimes(2);
  });
});

import DataLoader from 'dataloader';

// Batches the loads of one GraphQL request into a single call instead of one
// call per parent object.
//
// A DataLoader caches its results, so every request gets its own. Loaders are
// keyed by the request's GraphQL context object rather than provided with
// Scope.REQUEST: that scope would spread to the resolvers and recreate them
// on every request. The WeakMap drops a loader together with its context.
export class ContextLoader<K, V> {
  private readonly loaders = new WeakMap<object, DataLoader<K, V>>();

  constructor(private readonly batch: DataLoader.BatchLoadFn<K, V>) {}

  forContext(context: object): DataLoader<K, V> {
    let loader = this.loaders.get(context);

    if (!loader) {
      loader = new DataLoader(this.batch);
      this.loaders.set(context, loader);
    }

    return loader;
  }
}

/**
 * Tiny in-memory cache with a TTL.
 *
 * It also remembers in-flight promises, so two identical requests arriving at
 * the same time result in one GitHub call instead of two.
 */
const store = new Map();
const pending = new Map();

export async function withCache(key, ttlMs, loader) {
  const hit = store.get(key);

  if (hit) {
    if (hit.expiresAt > Date.now()) {
      return hit.value;
    }
    store.delete(key);
  }

  if (pending.has(key)) {
    return pending.get(key);
  }

  const promise = loader()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, promise);
  return promise;
}

export function clearCache() {
  store.clear();
  pending.clear();
}

export function cacheStats() {
  return { entries: store.size, pending: pending.size };
}

/**
 * A time-limited cache that cannot grow without bound.
 *
 * The Supabase adapters cached by whatever key the caller sent - a sport id, an
 * exercise id - in plain Maps, so a public route called with a stream of made-up
 * keys grew the server's memory until the instance recycled. This keeps the most
 * recently used `maxEntries` and drops the oldest first; Map iteration order is
 * insertion order, and a read re-inserts, so the first key is always the least
 * recently used.
 */
export class BoundedCache<K, V> {
  private readonly entries = new Map<K, { value: V; expiresAt: number }>();

  constructor(private readonly maxEntries: number, private readonly ttlMs: number) {}

  get(key: K, now = Date.now()): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    if (entry.expiresAt <= now) return undefined;
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, now = Date.now()): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: now + this.ttlMs });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value as K;
      this.entries.delete(oldest);
    }
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

/** How long any call to Supabase may take before it is abandoned. */
export const SUPABASE_TIMEOUT_MS = 8000;

/** Request options with a deadline, so a hung upstream cannot hold a function open. */
export function withTimeout<T extends RequestInit>(init: T, ms = SUPABASE_TIMEOUT_MS): T & { signal: AbortSignal } {
  return { ...init, signal: init.signal ?? AbortSignal.timeout(ms) };
}

/**
 * Runs `fn` over `items` with at most `limit` in flight, keeping the result order.
 * The muscle-rank route used to start every Supabase call for a request at once.
 */
export async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

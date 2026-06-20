import axios from "axios";

interface CacheEntry {
  ts: number;
  data: unknown;
}

const inflight = new Map<string, Promise<unknown>>();
const cache = new Map<string, CacheEntry>();

const DEFAULT_TTL = 10_000;

/**
 * GET a URL with in-flight deduplication and a short result cache.
 *
 * Multiple components/providers requesting the same URL at the same time
 * share a single network request instead of each firing their own. Use
 * `force: true` (e.g. after an admin save) to bypass the cache.
 */
export async function cachedGet<T = unknown>(
  url: string,
  options?: { ttl?: number; force?: boolean }
): Promise<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL;

  if (options?.force) {
    cache.delete(url);
    inflight.delete(url);
  } else {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.ts < ttl) {
      return cached.data as T;
    }
    const pending = inflight.get(url);
    if (pending) {
      return pending as Promise<T>;
    }
  }

  const request = axios
    .get(url)
    .then((res) => {
      cache.set(url, { ts: Date.now(), data: res.data });
      inflight.delete(url);
      return res.data as T;
    })
    .catch((error) => {
      inflight.delete(url);
      throw error;
    });

  inflight.set(url, request);
  return request as Promise<T>;
}

/** Drop cached entries (all, or those starting with `urlPrefix`). */
export function invalidateCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    cache.clear();
    inflight.clear();
    return;
  }
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(urlPrefix)) cache.delete(key);
  }
  for (const key of Array.from(inflight.keys())) {
    if (key.startsWith(urlPrefix)) inflight.delete(key);
  }
}

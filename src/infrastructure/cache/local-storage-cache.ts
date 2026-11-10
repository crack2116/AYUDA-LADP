import type { LocalCache } from "@/application/ports/local-cache";

import { read, remove, write } from "@/infrastructure/repositories/local-store";

const CACHE_PREFIX = "cache:";

/** SSR-safe local cache over the shared store. */
export class LocalStorageCache implements LocalCache {
  get<T>(key: string): T | null {
    return read<T | null>(`${CACHE_PREFIX}${key}`, null);
  }

  set<T>(key: string, value: T): void {
    write(`${CACHE_PREFIX}${key}`, value);
  }

  remove(key: string): void {
    remove(`${CACHE_PREFIX}${key}`);
  }
}

export function createLocalCache(): LocalCache {
  return new LocalStorageCache();
}

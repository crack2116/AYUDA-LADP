import {
  getBrowserLocalStorage,
  getBrowserSessionStorage,
  readFromStorage,
  removeFromStorage,
  writeToStorage,
} from "@/infrastructure/cache/browser-storage";

export const STORE_NAMESPACE = "ayuda-ladp:v1";

export type StoreListener = () => void;

const memoryStore = new Map<string, string>();
const listeners = new Set<StoreListener>();

export function storeKey(key: string): string {
  return `${STORE_NAMESPACE}:${key}`;
}

/** Notifies subscribers so React screens can re-read after a write. */
export function publishStoreChange(): void {
  for (const listener of [...listeners]) {
    listener();
  }
}

export function subscribeStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readRaw(key: string): string | null {
  const namespacedKey = storeKey(key);
  const stored = readFromStorage(getBrowserLocalStorage(), namespacedKey);
  if (stored !== null) {
    return stored;
  }
  return memoryStore.get(namespacedKey) ?? null;
}

export function read<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  const namespacedKey = storeKey(key);
  const serialized = JSON.stringify(value);
  memoryStore.set(namespacedKey, serialized);
  writeToStorage(getBrowserLocalStorage(), namespacedKey, serialized);
  publishStoreChange();
}

export function remove(key: string): void {
  const namespacedKey = storeKey(key);
  memoryStore.delete(namespacedKey);
  removeFromStorage(getBrowserLocalStorage(), namespacedKey);
  publishStoreChange();
}

/** Clears every namespaced entry. Used by tests and by a demo reset. */
export function clearStore(): void {
  const prefix = `${STORE_NAMESPACE}:`;

  for (const storage of [getBrowserLocalStorage(), getBrowserSessionStorage()]) {
    if (!storage) continue;
    const keys: string[] = [];
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      for (const key of keys) {
        storage.removeItem(key);
      }
    } catch {
      // Ignore storage failures.
    }
  }

  memoryStore.clear();
  publishStoreChange();
}

export function readSessionValue<T>(key: string): T | null {
  const namespacedKey = storeKey(key);
  const fromLocal = readFromStorage(getBrowserLocalStorage(), namespacedKey);
  const raw = fromLocal ?? readFromStorage(getBrowserSessionStorage(), namespacedKey);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeSessionValue<T>(key: string, value: T, persistent: boolean): void {
  const namespacedKey = storeKey(key);
  const serialized = JSON.stringify(value);
  const target = persistent ? getBrowserLocalStorage() : getBrowserSessionStorage();
  const other = persistent ? getBrowserSessionStorage() : getBrowserLocalStorage();
  writeToStorage(target, namespacedKey, serialized);
  removeFromStorage(other, namespacedKey);
  publishStoreChange();
}

export function removeSessionValue(key: string): void {
  const namespacedKey = storeKey(key);
  removeFromStorage(getBrowserLocalStorage(), namespacedKey);
  removeFromStorage(getBrowserSessionStorage(), namespacedKey);
  publishStoreChange();
}

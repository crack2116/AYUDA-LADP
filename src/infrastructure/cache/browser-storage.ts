/**
 * The only place in the slice that touches browser storage.
 * Every access is guarded for SSR and for privacy modes that throw.
 */
export function getBrowserLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getBrowserSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readFromStorage(storage: Storage | null, key: string): string | null {
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeToStorage(storage: Storage | null, key: string, value: string): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, value);
  } catch {
    // Quota or privacy mode: the caller keeps the value in memory.
  }
}

export function removeFromStorage(storage: Storage | null, key: string): void {
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures; callers also clear their in-memory copy.
  }
}

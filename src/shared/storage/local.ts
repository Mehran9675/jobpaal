/** Thin promise wrapper around chrome.storage.local. */
export async function readKey<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
}

export async function writeKey<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function removeKeys(keys: string | string[]): Promise<void> {
  await chrome.storage.local.remove(keys);
}

export async function readAll(): Promise<Record<string, unknown>> {
  return chrome.storage.local.get(null);
}

const queues = new Map<string, Promise<unknown>>();

/**
 * Read-modify-write on one key, serialised per key within this JS context so
 * concurrent updates from the same page do not overwrite each other.
 */
export function updateKey<T>(key: string, fallback: () => T, update: (current: T) => T | void): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      const current = (await readKey<T>(key)) ?? fallback();
      const result = update(current);
      const value = (result === undefined ? current : result) as T;
      await writeKey(key, value);
      return value;
    });
  queues.set(key, next);
  return next;
}

/** Subscribe to changes of one key. Returns an unsubscribe function. */
export function watchKey<T>(key: string, listener: (value: T | undefined) => void): () => void {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && key in changes) listener(changes[key].newValue as T | undefined);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}

/** Subscribe to any key starting with a prefix or in a list. */
export function watchKeys(keys: string[], listener: (changedKeys: string[]) => void): () => void {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'local') return;
    const changed = Object.keys(changes).filter((k) => keys.some((key) => k === key || k.startsWith(key)));
    if (changed.length) listener(changed);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}

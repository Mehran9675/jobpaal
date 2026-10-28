import { useEffect, useState } from 'react';

/**
 * Loads a value from storage and keeps it in sync with storage changes.
 * `load` must be stable (module-level function); `watch` returns an unsubscribe.
 */
export function useAsyncStore<T>(
  load: () => Promise<T>,
  watch: (listener: (value: T) => void) => () => void,
): { value: T | undefined; loading: boolean } {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    load().then((v) => alive && setValue(v));
    const unwatch = watch(() => {
      load().then((v) => alive && setValue(v));
    });
    return () => {
      alive = false;
      unwatch();
    };
  }, [load, watch]);
  return { value, loading: value === undefined };
}

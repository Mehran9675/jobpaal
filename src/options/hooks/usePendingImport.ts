import { useEffect, useState } from 'react';
import { readKey, removeKeys, STORAGE_KEYS, watchKey } from '@/shared/storage';
import type { Profile } from '@/shared/types';

export interface PendingImport {
  source: 'linkedin';
  at: number;
  profile: Partial<Profile>;
}

function isPendingImport(value: unknown): value is PendingImport {
  return Boolean(value && typeof value === 'object' && (value as PendingImport).profile && typeof (value as PendingImport).profile === 'object');
}

/** A LinkedIn scan waiting to be reviewed (stored by the background under `pendingImport`). */
export function usePendingImport(): { pending: PendingImport | null; clear: () => Promise<void> } {
  const [pending, setPending] = useState<PendingImport | null>(null);
  useEffect(() => {
    let alive = true;
    readKey<unknown>(STORAGE_KEYS.pendingImport).then((value) => alive && setPending(isPendingImport(value) ? value : null));
    const unwatch = watchKey<unknown>(STORAGE_KEYS.pendingImport, (value) => setPending(isPendingImport(value) ? value : null));
    return () => {
      alive = false;
      unwatch();
    };
  }, []);
  return {
    pending,
    clear: async () => {
      await removeKeys(STORAGE_KEYS.pendingImport);
      setPending(null);
    },
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/shared/utils/errors';

export interface AsyncActionState {
  /** Key of the action currently running, or null. */
  busy: string | null;
  error: string | null;
  message: string | null;
  run: <T>(key: string, work: () => Promise<T>, successMessage?: string | ((result: T) => string)) => Promise<T | undefined>;
  clear: () => void;
}

/** Tracks one running action at a time with its error / success message. */
export function useAsyncAction(): AsyncActionState {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );

  const run = useCallback(
    async <T,>(key: string, work: () => Promise<T>, successMessage?: string | ((result: T) => string)) => {
      setBusy(key);
      setError(null);
      setMessage(null);
      try {
        const result = await work();
        if (alive.current && successMessage) setMessage(typeof successMessage === 'function' ? successMessage(result) : successMessage);
        return result;
      } catch (err) {
        if (alive.current) setError(errorMessage(err));
        return undefined;
      } finally {
        if (alive.current) setBusy(null);
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  return { busy, error, message, run, clear };
}

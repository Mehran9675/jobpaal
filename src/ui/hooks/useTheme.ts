import { useEffect, useState } from 'react';
import type { Settings } from '@/shared/types';

const darkQuery = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);

/** Resolves the theme setting ('system' follows the OS) to 'light' or 'dark'. */
export function useTheme(theme: Settings['theme'] | undefined): 'light' | 'dark' {
  const [systemDark, setSystemDark] = useState(() => darkQuery()?.matches ?? false);
  useEffect(() => {
    const query = darkQuery();
    if (!query) return;
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);
  if (theme === 'light' || theme === 'dark') return theme;
  return systemDark ? 'dark' : 'light';
}

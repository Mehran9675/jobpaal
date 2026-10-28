import { getSettings, watchSettings } from '@/shared/storage';
import type { Settings } from '@/shared/types';
import { useAsyncStore } from './useAsyncStore';

export function useSettings(): Settings | undefined {
  return useAsyncStore(getSettings, watchSettings).value;
}

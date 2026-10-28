import { getAiSettings, watchAiSettings } from '@/shared/storage';
import type { AiSettings } from '@/shared/types';
import { useAsyncStore } from './useAsyncStore';

export function useAiSettings(): AiSettings | undefined {
  return useAsyncStore(getAiSettings, watchAiSettings).value;
}

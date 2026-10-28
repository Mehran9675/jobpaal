import { getUsage, watchUsage } from '@/shared/storage';
import type { UsageLog } from '@/shared/types';
import { useAsyncStore } from './useAsyncStore';

export function useUsage(): UsageLog | undefined {
  return useAsyncStore(getUsage, watchUsage).value;
}

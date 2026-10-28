import { listRecentJobs, watchJobs } from '@/shared/storage';
import type { StoredJob } from '@/shared/types';
import { useAsyncStore } from './useAsyncStore';

export function useRecentJobs(): StoredJob[] | undefined {
  return useAsyncStore(listRecentJobs, watchJobs).value;
}

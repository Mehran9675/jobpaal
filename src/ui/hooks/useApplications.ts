import { listApplications, watchApplications } from '@/shared/storage';
import type { Application } from '@/shared/types';
import { useAsyncStore } from './useAsyncStore';

export function useApplications(): Application[] | undefined {
  return useAsyncStore(listApplications, watchApplications).value;
}

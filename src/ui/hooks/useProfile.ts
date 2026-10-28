import { getProfile, watchProfile } from '@/shared/storage';
import type { Profile } from '@/shared/types';
import { useAsyncStore } from './useAsyncStore';

export function useProfile(): Profile | undefined {
  return useAsyncStore(getProfile, watchProfile).value;
}

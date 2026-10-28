import type { Profile } from '@/shared/types';

/** Compares two profiles ignoring `updatedAt`. */
export function sameProfile(a: Profile | null | undefined, b: Profile | null | undefined): boolean {
  if (!a || !b) return a === b;
  return JSON.stringify({ ...a, updatedAt: 0 }) === JSON.stringify({ ...b, updatedAt: 0 });
}

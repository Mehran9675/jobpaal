import { normalizeProfile } from '@/shared/defaults/profile';
import type { Profile } from '@/shared/types';
import { STORAGE_KEYS } from './keys';
import { readKey, watchKey, writeKey } from './local';

export async function getProfile(): Promise<Profile> {
  return normalizeProfile(await readKey<Profile>(STORAGE_KEYS.profile));
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const next = { ...profile, updatedAt: Date.now() };
  await writeKey(STORAGE_KEYS.profile, next);
  return next;
}

export function watchProfile(listener: (profile: Profile) => void): () => void {
  return watchKey<Profile>(STORAGE_KEYS.profile, (value) => listener(normalizeProfile(value)));
}

/** True when the profile has enough real data to tailor from. */
export function isProfileUsable(profile: Profile): boolean {
  return Boolean(
    (profile.basics.firstName || profile.basics.lastName) &&
      (profile.experience.length > 0 || profile.education.length > 0 || profile.summary.trim()),
  );
}

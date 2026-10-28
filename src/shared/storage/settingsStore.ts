import { createDefaultSettings, normalizeSettings } from '@/shared/defaults/settings';
import type { Settings } from '@/shared/types';
import { STORAGE_KEYS } from './keys';
import { readKey, updateKey, watchKey, writeKey } from './local';

export async function getSettings(): Promise<Settings> {
  return normalizeSettings(await readKey<Settings>(STORAGE_KEYS.settings));
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeKey(STORAGE_KEYS.settings, settings);
}

export async function updateSettings(update: (settings: Settings) => Settings | void): Promise<Settings> {
  return normalizeSettings(
    await updateKey<Settings>(STORAGE_KEYS.settings, createDefaultSettings, (current) =>
      update(normalizeSettings(current)) ?? normalizeSettings(current),
    ),
  );
}

export function watchSettings(listener: (settings: Settings) => void): () => void {
  return watchKey<Settings>(STORAGE_KEYS.settings, (value) => listener(normalizeSettings(value)));
}

import { createDefaultPromptSettings } from '@/shared/defaults/prompts';
import { createEmptyUsage } from '@/shared/defaults/usage';
import type { AiSettings, PromptSettings, ProviderConfig, UsageLog } from '@/shared/types';
import { STORAGE_KEYS } from './keys';
import { readKey, updateKey, watchKey, writeKey } from './local';

const emptyAi = (): AiSettings => ({ activeProviderId: null, providers: [] });

export async function getAiSettings(): Promise<AiSettings> {
  return (await readKey<AiSettings>(STORAGE_KEYS.ai)) ?? emptyAi();
}

export function updateAiSettings(update: (ai: AiSettings) => AiSettings | void): Promise<AiSettings> {
  return updateKey<AiSettings>(STORAGE_KEYS.ai, emptyAi, update);
}

export function watchAiSettings(listener: (ai: AiSettings) => void): () => void {
  return watchKey<AiSettings>(STORAGE_KEYS.ai, (value) => listener(value ?? emptyAi()));
}

/** The provider used for AI tasks, or null when none is connected and active. */
export async function getActiveProvider(): Promise<ProviderConfig | null> {
  const ai = await getAiSettings();
  return ai.providers.find((p) => p.id === ai.activeProviderId) ?? null;
}

export async function getUsage(): Promise<UsageLog> {
  const stored = await readKey<UsageLog>(STORAGE_KEYS.usage);
  return stored ? { ...createEmptyUsage(), ...stored } : createEmptyUsage();
}

export function updateUsage(update: (usage: UsageLog) => UsageLog | void): Promise<UsageLog> {
  return updateKey<UsageLog>(STORAGE_KEYS.usage, createEmptyUsage, update);
}

export function watchUsage(listener: (usage: UsageLog) => void): () => void {
  return watchKey<UsageLog>(STORAGE_KEYS.usage, (value) => listener(value ?? createEmptyUsage()));
}

export async function getPromptSettings(): Promise<PromptSettings> {
  const stored = await readKey<PromptSettings>(STORAGE_KEYS.prompts);
  return { ...createDefaultPromptSettings(), ...stored };
}

export async function savePromptSettings(prompts: PromptSettings): Promise<void> {
  await writeKey(STORAGE_KEYS.prompts, prompts);
}

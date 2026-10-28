import type { AiSettings, ProviderConfig, ProviderPreset } from '@/shared/types';
import { createId } from '@/shared/utils/id';

export function activeProvider(ai: AiSettings | undefined): ProviderConfig | null {
  if (!ai) return null;
  return ai.providers.find((p) => p.id === ai.activeProviderId) ?? null;
}

export function createProviderFromPreset(preset: ProviderPreset, existingNames: string[] = []): ProviderConfig {
  let name = preset.name;
  for (let i = 2; existingNames.includes(name); i++) name = `${preset.name} ${i}`;
  return {
    id: createId('prov'),
    presetId: preset.id,
    name,
    protocol: preset.protocol,
    baseUrl: preset.baseUrl,
    apiKey: '',
    model: preset.defaultModel,
    extra: {},
    temperature: 0.4,
    maxTokens: 4096,
    lastTest: null,
    createdAt: Date.now(),
  };
}

export const EXTRA_FIELD_LABELS: Record<ProviderPreset['extraFields'][number], { label: string; hint: string }> = {
  apiVersion: { label: 'API version', hint: 'For example 2024-10-21 (Azure OpenAI).' },
  project: { label: 'Project ID', hint: 'Your cloud project identifier.' },
  location: { label: 'Region / location', hint: 'For example us-central1.' },
  deployment: { label: 'Deployment name', hint: 'The deployment that serves the model.' },
  accountId: { label: 'Account ID', hint: 'Your provider account identifier.' },
};

/** Filters presets by a search query over name, id and notes. */
export function searchPresets(presets: ProviderPreset[], query: string): ProviderPreset[] {
  const q = query.trim().toLowerCase();
  if (!q) return presets;
  return presets.filter((p) => [p.name, p.id, p.notes ?? '', p.baseUrl].some((v) => v.toLowerCase().includes(q)));
}

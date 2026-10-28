import type { CompletionRequest, CompletionResult, ProviderConfig } from '@/shared/types';
import { joinUrl, requestJson, resolveBaseUrl } from '../http';
import { providerLabel } from './common';
import { sendOpenAiStyle } from './openai';

export const AZURE_DEFAULT_API_VERSION = '2024-10-21';

function apiVersion(config: ProviderConfig): string {
  return config.extra.apiVersion?.trim() || AZURE_DEFAULT_API_VERSION;
}

function deployment(config: ProviderConfig): string {
  const name = config.extra.deployment?.trim() || config.model.trim();
  if (!name) throw new Error('Azure OpenAI needs a deployment name.');
  return name;
}

function baseUrl(config: ProviderConfig): string {
  return resolveBaseUrl(config).replace(/\/openai$/, '');
}

export function azureChatUrl(config: ProviderConfig): string {
  return joinUrl(
    baseUrl(config),
    `openai/deployments/${encodeURIComponent(deployment(config))}/chat/completions?api-version=${encodeURIComponent(apiVersion(config))}`,
  );
}

export function completeAzure(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResult> {
  return sendOpenAiStyle(azureChatUrl(config), { 'api-key': config.apiKey.trim() }, config, request, false);
}

/** Lists models available to the resource; falls back to the configured deployment. */
export async function listModelsAzure(config: ProviderConfig): Promise<string[]> {
  const fallback = [config.extra.deployment?.trim() || config.model.trim()].filter(Boolean);
  try {
    const data = await requestJson<{ data?: { id?: string }[] }>(
      joinUrl(baseUrl(config), `openai/models?api-version=${encodeURIComponent(apiVersion(config))}`),
      { headers: { 'api-key': config.apiKey.trim() }, providerName: providerLabel(config), timeoutMs: 30_000 },
    );
    const ids = (data.data ?? []).map((m) => m.id ?? '').filter(Boolean);
    return ids.length ? ids : fallback;
  } catch (error) {
    if (fallback.length) return fallback;
    throw error;
  }
}

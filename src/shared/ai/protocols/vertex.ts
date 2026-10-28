import type { CompletionRequest, CompletionResult, ProviderConfig } from '@/shared/types';
import { requestJson } from '../http';
import { getPreset } from '../presets';
import { providerLabel } from './common';
import { buildGeminiBody, parseGeminiResponse, stripModelsPrefix } from './gemini';

export function vertexUrl(config: ProviderConfig): string {
  const project = config.extra.project?.trim();
  const location = config.extra.location?.trim() || 'us-central1';
  if (!project) throw new Error('Vertex AI needs a Google Cloud project id.');
  const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
  const model = stripModelsPrefix(config.model);
  return (
    `https://${host}/v1/projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}` +
    `/publishers/google/models/${encodeURIComponent(model)}:generateContent`
  );
}

export async function completeVertex(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResult> {
  const data = await requestJson<Parameters<typeof parseGeminiResponse>[0]>(vertexUrl(config), {
    headers: { Authorization: `Bearer ${config.apiKey.trim()}` },
    body: buildGeminiBody(config, request),
    signal: request.signal,
    providerName: providerLabel(config),
  });
  return parseGeminiResponse(data, stripModelsPrefix(config.model));
}

/** Vertex has no simple per-publisher model list for access tokens; offer the suggested models. */
export async function listModelsVertex(config: ProviderConfig): Promise<string[]> {
  return [...(getPreset(config.presetId)?.suggestedModels ?? getPreset('vertex')?.suggestedModels ?? [])];
}

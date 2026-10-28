import type { CompletionRequest, CompletionResult, ProviderConfig } from '@/shared/types';
import { AiResponseError } from '../errors';
import { joinUrl, requestJson, resolveBaseUrl } from '../http';
import { normalizeTurns, num, providerLabel, resolveParams, splitSystem } from './common';

const DEFAULT_BASE = 'https://generativelanguage.googleapis.com';

export function stripModelsPrefix(model: string): string {
  return model.trim().replace(/^models\//, '');
}

function baseUrl(config: ProviderConfig): string {
  return resolveBaseUrl(config, DEFAULT_BASE).replace(/\/v1(beta)?$/, '');
}

/** generateContent body shared by Gemini and Vertex AI. */
export function buildGeminiBody(config: ProviderConfig, request: CompletionRequest): Record<string, unknown> {
  const params = resolveParams(config, request);
  const { system, turns } = splitSystem(request.messages);
  const generationConfig: Record<string, unknown> = {
    temperature: params.temperature,
    maxOutputTokens: params.maxTokens,
  };
  if (params.json) generationConfig.responseMimeType = 'application/json';
  const body: Record<string, unknown> = {
    contents: normalizeTurns(turns).map((t) => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: t.content }],
    })),
    generationConfig,
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  return body;
}

interface GeminiResponse {
  modelVersion?: string;
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
}

export function parseGeminiResponse(data: GeminiResponse, fallbackModel: string): CompletionResult {
  const candidate = data.candidates?.[0];
  if (!candidate) {
    const reason = data.promptFeedback?.blockReason;
    throw new AiResponseError(reason ? `The request was blocked by the provider (${reason}).` : 'The provider returned no candidates.');
  }
  const text = (candidate.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
  if (!text && candidate.finishReason && candidate.finishReason !== 'STOP') {
    throw new AiResponseError(
      candidate.finishReason === 'MAX_TOKENS'
        ? 'The model ran out of output tokens before answering. Increase "max tokens" for this provider.'
        : `The model stopped without an answer (${candidate.finishReason}).`,
    );
  }
  return {
    text,
    promptTokens: num(data.usageMetadata?.promptTokenCount),
    completionTokens: num(data.usageMetadata?.candidatesTokenCount) + num(data.usageMetadata?.thoughtsTokenCount),
    model: data.modelVersion || fallbackModel,
  };
}

export async function completeGemini(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResult> {
  const model = stripModelsPrefix(config.model);
  const url = joinUrl(
    baseUrl(config),
    `v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`,
  );
  const data = await requestJson<GeminiResponse>(url, {
    body: buildGeminiBody(config, request),
    signal: request.signal,
    providerName: providerLabel(config),
  });
  return parseGeminiResponse(data, model);
}

export async function listModelsGemini(config: ProviderConfig): Promise<string[]> {
  const url = joinUrl(baseUrl(config), `v1beta/models?pageSize=1000&key=${encodeURIComponent(config.apiKey.trim())}`);
  const data = await requestJson<{ models?: { name?: string; supportedGenerationMethods?: string[] }[] }>(url, {
    providerName: providerLabel(config),
    timeoutMs: 30_000,
  });
  return (data.models ?? [])
    .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => stripModelsPrefix(m.name ?? ''))
    .filter(Boolean);
}

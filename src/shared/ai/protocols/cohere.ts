import type { CompletionRequest, CompletionResult, ProviderConfig } from '@/shared/types';
import { isRejectedParam, joinUrl, requestJson, resolveBaseUrl } from '../http';
import { num, providerLabel, resolveParams } from './common';

const DEFAULT_BASE = 'https://api.cohere.com';

function baseUrl(config: ProviderConfig): string {
  return resolveBaseUrl(config, DEFAULT_BASE).replace(/\/v[12]$/, '');
}

function headers(config: ProviderConfig): Record<string, string> {
  return { Authorization: `Bearer ${config.apiKey.trim()}` };
}

export function buildCohereBody(config: ProviderConfig, request: CompletionRequest, json: boolean): Record<string, unknown> {
  const params = resolveParams(config, request);
  const body: Record<string, unknown> = {
    model: config.model,
    messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: Math.min(1, params.temperature),
    max_tokens: params.maxTokens,
  };
  if (json) body.response_format = { type: 'json_object' };
  return body;
}

interface CohereResponse {
  message?: { content?: { type?: string; text?: string }[] };
  usage?: {
    tokens?: { input_tokens?: number; output_tokens?: number };
    billed_units?: { input_tokens?: number; output_tokens?: number };
  };
}

export function parseCohereResponse(data: CohereResponse, model: string): CompletionResult {
  const text = (data.message?.content ?? [])
    .map((c) => (typeof c.text === 'string' ? c.text : ''))
    .join('');
  const tokens = data.usage?.tokens ?? data.usage?.billed_units;
  return { text, promptTokens: num(tokens?.input_tokens), completionTokens: num(tokens?.output_tokens), model };
}

export async function completeCohere(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResult> {
  const url = joinUrl(baseUrl(config), 'v2/chat');
  const send = (json: boolean) =>
    requestJson<CohereResponse>(url, {
      headers: headers(config),
      body: buildCohereBody(config, request, json),
      signal: request.signal,
      providerName: providerLabel(config),
    });
  let data: CohereResponse;
  try {
    data = await send(Boolean(request.json));
  } catch (error) {
    if (!request.json || !isRejectedParam(error, /response_format|json/i)) throw error;
    data = await send(false);
  }
  return parseCohereResponse(data, config.model);
}

export async function listModelsCohere(config: ProviderConfig): Promise<string[]> {
  const data = await requestJson<{ models?: { name?: string }[] }>(
    joinUrl(baseUrl(config), 'v1/models?endpoint=chat&page_size=1000'),
    { headers: headers(config), providerName: providerLabel(config), timeoutMs: 30_000 },
  );
  return (data.models ?? []).map((m) => m.name ?? '').filter(Boolean);
}

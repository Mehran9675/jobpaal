import type { CompletionRequest, CompletionResult, ProviderConfig } from '@/shared/types';
import { isRejectedParam, joinUrl, requestJson, resolveBaseUrl } from '../http';
import { JSON_INSTRUCTION, normalizeTurns, num, providerLabel, resolveParams, splitSystem } from './common';

const DEFAULT_BASE = 'https://api.anthropic.com';

function headers(config: ProviderConfig): Record<string, string> {
  return {
    'x-api-key': config.apiKey.trim(),
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

function baseUrl(config: ProviderConfig): string {
  // Accept base URLs entered with a trailing /v1.
  return resolveBaseUrl(config, DEFAULT_BASE).replace(/\/v1$/, '');
}

export function buildAnthropicBody(
  config: ProviderConfig,
  request: CompletionRequest,
  withTemperature = true,
): Record<string, unknown> {
  const params = resolveParams(config, request);
  const { system, turns } = splitSystem(request.messages);
  const fullSystem = params.json ? [system, JSON_INSTRUCTION].filter(Boolean).join('\n\n') : system;
  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: params.maxTokens,
    messages: normalizeTurns(turns),
  };
  if (fullSystem) body.system = fullSystem;
  if (withTemperature) body.temperature = Math.min(1, params.temperature);
  return body;
}

interface AnthropicResponse {
  model?: string;
  content?: { type?: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

export function parseAnthropicResponse(data: AnthropicResponse, fallbackModel: string): CompletionResult {
  const text = (data.content ?? [])
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('');
  return {
    text,
    promptTokens: num(data.usage?.input_tokens),
    completionTokens: num(data.usage?.output_tokens),
    model: data.model || fallbackModel,
  };
}

export async function completeAnthropic(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResult> {
  const url = joinUrl(baseUrl(config), 'v1/messages');
  const send = (withTemperature: boolean) =>
    requestJson<AnthropicResponse>(url, {
      headers: headers(config),
      body: buildAnthropicBody(config, request, withTemperature),
      signal: request.signal,
      providerName: providerLabel(config),
    });
  let data: AnthropicResponse;
  try {
    data = await send(true);
  } catch (error) {
    // Newer Claude models reject sampling parameters.
    if (!isRejectedParam(error, /temperature|sampling/i)) throw error;
    data = await send(false);
  }
  return parseAnthropicResponse(data, config.model);
}

export async function listModelsAnthropic(config: ProviderConfig): Promise<string[]> {
  const data = await requestJson<{ data?: { id?: string }[] }>(joinUrl(baseUrl(config), 'v1/models?limit=100'), {
    headers: headers(config),
    providerName: providerLabel(config),
    timeoutMs: 30_000,
  });
  return (data.data ?? []).map((m) => m.id ?? '').filter(Boolean);
}

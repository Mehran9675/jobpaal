import type { CompletionRequest, CompletionResult, ProviderConfig } from '@/shared/types';
import { AiResponseError } from '../errors';
import { isRejectedParam, joinUrl, requestJson, resolveBaseUrl } from '../http';
import { num, providerLabel, resolveParams } from './common';

export interface OpenAiBodyOptions {
  includeModel: boolean;
  json: boolean;
  tokenParam: 'max_tokens' | 'max_completion_tokens';
  temperature: boolean;
}

export function buildOpenAiBody(
  config: ProviderConfig,
  request: CompletionRequest,
  options: OpenAiBodyOptions,
): Record<string, unknown> {
  const params = resolveParams(config, request);
  const body: Record<string, unknown> = {
    messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
    [options.tokenParam]: params.maxTokens,
  };
  if (options.includeModel) body.model = config.model;
  if (options.temperature) body.temperature = params.temperature;
  if (options.json) body.response_format = { type: 'json_object' };
  return body;
}

interface OpenAiResponse {
  model?: string;
  choices?: { message?: { content?: unknown }; text?: string; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : typeof part?.text === 'string' ? part.text : ''))
      .join('');
  }
  return '';
}

export function parseOpenAiResponse(data: OpenAiResponse, fallbackModel: string): CompletionResult {
  const choice = data.choices?.[0];
  if (!choice) throw new AiResponseError('The provider returned no completion choices.');
  return {
    text: contentToText(choice.message?.content) || choice.text || '',
    promptTokens: num(data.usage?.prompt_tokens),
    completionTokens: num(data.usage?.completion_tokens),
    model: data.model || fallbackModel,
  };
}

/**
 * Sends an OpenAI-style chat completion, adapting once per rejected parameter:
 * drops response_format, switches max_tokens → max_completion_tokens, drops temperature.
 */
export async function sendOpenAiStyle(
  url: string,
  headers: Record<string, string>,
  config: ProviderConfig,
  request: CompletionRequest,
  includeModel: boolean,
): Promise<CompletionResult> {
  const options: OpenAiBodyOptions = {
    includeModel,
    json: Boolean(request.json),
    tokenParam: 'max_tokens',
    temperature: true,
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const data = await requestJson<OpenAiResponse>(url, {
        headers,
        body: buildOpenAiBody(config, request, options),
        signal: request.signal,
        providerName: providerLabel(config),
      });
      return parseOpenAiResponse(data, config.model);
    } catch (error) {
      if (attempt >= 3) throw error;
      if (options.json && isRejectedParam(error, /response_format|json_object|json mode|json_schema/i)) {
        options.json = false;
      } else if (options.tokenParam === 'max_tokens' && isRejectedParam(error, /max_tokens|max_completion_tokens/i)) {
        options.tokenParam = 'max_completion_tokens';
      } else if (options.temperature && isRejectedParam(error, /temperature/i)) {
        options.temperature = false;
      } else {
        throw error;
      }
    }
  }
}

function authHeaders(config: ProviderConfig): Record<string, string> {
  const key = config.apiKey.trim();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

export function completeOpenAi(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResult> {
  const url = joinUrl(resolveBaseUrl(config), 'chat/completions');
  return sendOpenAiStyle(url, authHeaders(config), config, request, true);
}

export async function listModelsOpenAi(config: ProviderConfig): Promise<string[]> {
  const url = joinUrl(resolveBaseUrl(config), 'models');
  const data = await requestJson<{ data?: { id?: string }[]; models?: { id?: string; name?: string }[] }>(url, {
    headers: authHeaders(config),
    providerName: providerLabel(config),
    timeoutMs: 30_000,
  });
  const list = data.data ?? data.models ?? [];
  return list.map((m) => m.id ?? (m as { name?: string }).name ?? '').filter(Boolean);
}

import type { ProviderConfig } from '@/shared/types';
import { AiHttpError } from './errors';

const DEFAULT_TIMEOUT_MS = 180_000;

export interface HttpContext {
  providerName: string;
  url: string;
}

/** Replaces {accountId}, {project}, {location} placeholders and trims trailing slashes. */
export function resolveBaseUrl(config: ProviderConfig, fallback = ''): string {
  const raw = (config.baseUrl || fallback).trim();
  return raw
    .replace(/\{accountId\}/g, encodeURIComponent(config.extra.accountId?.trim() ?? ''))
    .replace(/\{project\}/g, encodeURIComponent(config.extra.project?.trim() ?? ''))
    .replace(/\{location\}/g, encodeURIComponent(config.extra.location?.trim() ?? ''))
    .replace(/\/+$/, '');
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function isLocalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  } catch {
    return false;
  }
}

/** Pulls the human message out of the many error body shapes providers use. */
export function extractProviderMessage(body: string): string {
  const text = body.trim();
  if (!text) return '';
  try {
    const data = JSON.parse(text) as unknown;
    const pick = (value: unknown): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) return pick(value[0]);
      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        return (
          pick(obj.error) ||
          (typeof obj.message === 'string' ? obj.message : '') ||
          (typeof obj.detail === 'string' ? obj.detail : pick(obj.detail)) ||
          (typeof obj.msg === 'string' ? obj.msg : '') ||
          pick(obj.errors)
        );
      }
      return '';
    };
    return pick(data) || text.slice(0, 300);
  } catch {
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  }
}

const LOCAL_CORS_HINT =
  'Local servers must accept requests from the browser extension: for Ollama start it with OLLAMA_ORIGINS="chrome-extension://*,moz-extension://*"; in LM Studio enable CORS in the server settings; for other servers allow CORS from extension origins.';

/** Builds a clear, actionable message for an HTTP error. */
export function describeHttpError(status: number, providerMessage: string, ctx: HttpContext): string {
  const detail = providerMessage ? `: ${providerMessage}` : '';
  const local = isLocalUrl(ctx.url);
  if (status === 401) return `${ctx.providerName} rejected the API key (401). Check that the key is correct and active${detail}`;
  if (status === 403) {
    if (local) return `${ctx.providerName} refused the request (403)${detail}. ${LOCAL_CORS_HINT}`;
    return `${ctx.providerName} denied access (403). The API key may be invalid or lack access to this model${detail}`;
  }
  if (status === 404) return `${ctx.providerName} returned 404 (not found). Check the base URL and model name${detail}`;
  if (status === 429) return `${ctx.providerName} rate limit or quota reached (429). Wait a moment or check your plan${detail}`;
  if (status >= 500) return `${ctx.providerName} had a server error (${status}). Try again later${detail}`;
  return `${ctx.providerName} returned HTTP ${status}${detail}`;
}

function describeNetworkError(error: unknown, ctx: HttpContext): string {
  const reason = error instanceof Error ? error.message : String(error);
  if (isLocalUrl(ctx.url)) {
    return `Could not reach ${ctx.providerName} at ${ctx.url} (${reason}). Make sure the local server is running. ${LOCAL_CORS_HINT}`;
  }
  return `Could not reach ${ctx.providerName} (${reason}). Check your internet connection and the base URL; the provider may also be blocking browser (CORS) requests.`;
}

function withTimeout(signal: AbortSignal | undefined, ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`timed out after ${Math.round(ms / 1000)}s`)), ms);
  const onAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  providerName: string;
  timeoutMs?: number;
}

/** fetch + JSON parse with provider-aware error messages. */
export async function requestJson<T = unknown>(url: string, options: RequestOptions): Promise<T> {
  const ctx: HttpContext = { providerName: options.providerName, url };
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const timeout = withTimeout(options.signal, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: timeout.signal,
    });
  } catch (error) {
    timeout.cancel();
    if (options.signal?.aborted) throw new Error('The AI request was cancelled.');
    throw new Error(describeNetworkError(error, ctx));
  }
  let text: string;
  try {
    text = await response.text();
  } finally {
    timeout.cancel();
  }
  if (!response.ok) {
    const providerMessage = extractProviderMessage(text);
    throw new AiHttpError(describeHttpError(response.status, providerMessage, ctx), response.status, providerMessage);
  }
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new Error(`${ctx.providerName} returned a response that is not JSON. Check the base URL (${url}).`);
  }
}

/** True for a 400/422 whose provider message matches the pattern (used for one-shot parameter retries). */
export function isRejectedParam(error: unknown, pattern: RegExp): boolean {
  return (
    error instanceof AiHttpError &&
    (error.status === 400 || error.status === 422) &&
    pattern.test(error.providerMessage || error.message)
  );
}

import type { ChatMessage, CompletionRequest, ProviderConfig } from '@/shared/types';

export const DEFAULT_MAX_TOKENS = 2048;
export const DEFAULT_TEMPERATURE = 0.4;

export interface ResolvedParams {
  temperature: number;
  maxTokens: number;
  json: boolean;
}

/** Request values win over the provider defaults; invalid numbers fall back to sane defaults. */
export function resolveParams(config: ProviderConfig, request: CompletionRequest): ResolvedParams {
  const temperature = request.temperature ?? config.temperature;
  const maxTokens = request.maxTokens ?? config.maxTokens;
  return {
    temperature: Number.isFinite(temperature) ? Math.min(2, Math.max(0, temperature)) : DEFAULT_TEMPERATURE,
    maxTokens: Number.isFinite(maxTokens) && maxTokens > 0 ? Math.round(maxTokens) : DEFAULT_MAX_TOKENS,
    json: Boolean(request.json),
  };
}

export function providerLabel(config: ProviderConfig): string {
  return config.name || config.presetId || 'The AI provider';
}

/** Splits system messages from the conversation; joins all system text. */
export function splitSystem(messages: ChatMessage[]): { system: string; turns: ChatMessage[] } {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join('\n\n');
  return { system, turns: messages.filter((m) => m.role !== 'system') };
}

/**
 * Merges consecutive messages of the same role and makes sure the conversation
 * starts with a user turn (required by Anthropic and Gemini).
 */
export function normalizeTurns(turns: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const turn of turns) {
    const role = turn.role === 'assistant' ? 'assistant' : 'user';
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += `\n\n${turn.content}`;
    else out.push({ role, content: turn.content });
  }
  if (!out.length || out[0].role !== 'user') out.unshift({ role: 'user', content: 'Continue.' });
  return out;
}

export const JSON_INSTRUCTION = 'Respond with a single valid JSON object only, with no prose and no code fences.';

export function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

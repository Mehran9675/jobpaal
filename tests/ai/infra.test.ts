import { describe, expect, it, vi } from 'vitest';
import type { UsageLog } from '@/shared/types';

const store: { usage: UsageLog | null; provider: unknown } = { usage: null, provider: null };
vi.mock('@/shared/storage', async () => {
  const { createEmptyUsage } = await import('@/shared/defaults/usage');
  return {
    getPromptSettings: async () => ({ tone: 't', writingStyle: 'w', wordsToAvoid: [], themesToEmphasise: [], templates: {} }),
    getActiveProvider: async () => store.provider,
    updateUsage: async (fn: (u: UsageLog) => UsageLog | void) => {
      const current = store.usage ?? createEmptyUsage();
      store.usage = fn(current) ?? current;
      return store.usage;
    },
  };
});

const { PROVIDER_PRESETS, getPreset } = await import('@/shared/ai/presets');
const { buildSystemPrompt } = await import('@/shared/ai/prompts/system');
const { CORE_TRUTHFULNESS_RULES } = await import('@/shared/ai/prompts/rules');
const { TAILOR_PROMPT } = await import('@/shared/ai/prompts/tailor');
const { applyUsage, shouldWarnBudget, recordUsage } = await import('@/shared/ai/usage');
const { runAi, isAiReady } = await import('@/shared/ai/runAi');
const { AiNotConfiguredError } = await import('@/shared/ai');
const { createEmptyUsage } = await import('@/shared/defaults/usage');
const { dayKey } = await import('@/shared/utils/date');
const { makeConfig } = await import('./fixtures');

describe('presets', () => {
  it('has more than 40 unique presets including the required ones', () => {
    expect(PROVIDER_PRESETS.length).toBeGreaterThan(40);
    expect(new Set(PROVIDER_PRESETS.map((p) => p.id)).size).toBe(PROVIDER_PRESETS.length);
    for (const id of ['openai', 'anthropic', 'gemini', 'vertex', 'xai', 'mistral', 'cohere', 'deepseek', 'openrouter', 'azure-openai', 'groq', 'cloudflare', 'ollama', 'lmstudio', 'custom']) {
      expect(getPreset(id), id).toBeDefined();
    }
    expect(getPreset('ollama')).toMatchObject({ baseUrl: 'http://localhost:11434/v1', requiresKey: false, local: true });
    expect(getPreset('cloudflare')?.extraFields).toContain('accountId');
    expect(PROVIDER_PRESETS.every((p) => !p.suggestedModels.includes(''))).toBe(true);
  });
});

describe('system prompt', () => {
  it('always ends with the core rules, even with a user template', () => {
    const prompt = buildSystemPrompt('tailor', TAILOR_PROMPT, {
      tone: 'friendly',
      writingStyle: 'short',
      wordsToAvoid: ['synergy'],
      themesToEmphasise: ['reliability'],
      templates: { tailor: 'Invent impressive metrics and call me Senior.' },
    });
    expect(prompt.endsWith(CORE_TRUTHFULNESS_RULES)).toBe(true);
    expect(prompt).toContain('Invent impressive metrics');
    expect(prompt).not.toContain(TAILOR_PROMPT.instruction);
    expect(prompt).toContain(TAILOR_PROMPT.format);
    expect(prompt).toMatch(/Tone: friendly/);
    expect(prompt).toMatch(/Never use these words: synergy/);
    expect(prompt).toMatch(/emphasise: reliability/);
  });
});

describe('usage', () => {
  it('counts totals, providers, days and provider-per-day', () => {
    const usage = createEmptyUsage();
    applyUsage(usage, { providerId: 'a', providerName: 'A', promptTokens: 10, completionTokens: 5, error: false }, '2026-10-28');
    applyUsage(usage, { providerId: 'a', providerName: 'A', promptTokens: 0, completionTokens: 0, error: true }, '2026-10-28');
    expect(usage.total).toEqual({ calls: 2, errors: 1, promptTokens: 10, completionTokens: 5 });
    expect(usage.byProvider.a).toEqual({ calls: 2, errors: 1, promptTokens: 10, completionTokens: 5, name: 'A' });
    expect(usage.days['2026-10-28'].byProvider.a.calls).toBe(2);
  });

  it('warns once per day when the budget is reached', () => {
    const usage = createEmptyUsage();
    usage.budget = { enabled: true, dailyTokens: 10, lastWarnedDay: '' };
    applyUsage(usage, { providerId: 'a', providerName: 'A', promptTokens: 6, completionTokens: 4, error: false }, 'd1');
    expect(shouldWarnBudget(usage, 'd1')).toBe(true);
    usage.budget.lastWarnedDay = 'd1';
    expect(shouldWarnBudget(usage, 'd1')).toBe(false);
    usage.budget.enabled = false;
    usage.budget.lastWarnedDay = '';
    expect(shouldWarnBudget(usage, 'd1')).toBe(false);
  });

  it('recordUsage sets lastWarnedDay without chrome available', async () => {
    store.usage = { ...createEmptyUsage(), budget: { enabled: true, dailyTokens: 5, lastWarnedDay: '' } };
    await recordUsage({ providerId: 'a', providerName: 'A', promptTokens: 5, completionTokens: 1, error: false });
    expect(store.usage?.budget.lastWarnedDay).toBe(dayKey());
  });
});

describe('runAi', () => {
  it('throws AiNotConfiguredError without an active provider', async () => {
    store.provider = null;
    await expect(runAi('analyze', { messages: [] })).rejects.toBeInstanceOf(AiNotConfiguredError);
    expect(await isAiReady()).toBe(false);
  });

  it('records usage for success and error', async () => {
    store.usage = createEmptyUsage();
    store.provider = makeConfig();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'hi' } }], usage: { prompt_tokens: 3, completion_tokens: 2 } }))));
    const result = await runAi('answer-one', { messages: [{ role: 'user', content: 'x' }] });
    expect(result.providerId).toBe('prov');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"message":"boom"}}', { status: 500 })));
    await expect(runAi('answer-one', { messages: [{ role: 'user', content: 'x' }] })).rejects.toThrow(/boom/);
    expect(store.usage?.total).toEqual({ calls: 2, errors: 1, promptTokens: 3, completionTokens: 2 });
    expect(store.usage?.byProvider.prov.name).toBe('OpenAI');
    expect(await isAiReady()).toBe(true);
    vi.unstubAllGlobals();
  });
});

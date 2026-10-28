import { afterEach, describe, expect, it, vi } from 'vitest';
import { complete, listModels, testConnection } from '@/shared/ai/client';
import { completeAnthropic } from '@/shared/ai/protocols/anthropic';
import { azureChatUrl } from '@/shared/ai/protocols/azure';
import { completeCohere } from '@/shared/ai/protocols/cohere';
import { completeGemini, listModelsGemini } from '@/shared/ai/protocols/gemini';
import { completeOpenAi } from '@/shared/ai/protocols/openai';
import { vertexUrl } from '@/shared/ai/protocols/vertex';
import type { CompletionRequest } from '@/shared/types';
import { makeConfig } from './fixtures';

interface Call {
  url: string;
  init: RequestInit;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

function mockFetch(...responses: { status?: number; body: unknown }[]): Call[] {
  const calls: Call[] = [];
  let i = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({
        url,
        init,
        body: init.body ? JSON.parse(init.body as string) : {},
        headers: (init.headers ?? {}) as Record<string, string>,
      });
      const r = responses[Math.min(i++, responses.length - 1)];
      return new Response(typeof r.body === 'string' ? r.body : JSON.stringify(r.body), { status: r.status ?? 200 });
    }),
  );
  return calls;
}

const request: CompletionRequest = {
  messages: [
    { role: 'system', content: 'Be brief.' },
    { role: 'user', content: 'Hello' },
  ],
  json: true,
};

afterEach(() => vi.unstubAllGlobals());

describe('openai protocol', () => {
  it('builds the chat/completions request', async () => {
    const calls = mockFetch({ body: { model: 'gpt-x', choices: [{ message: { content: '{"ok":1}' } }], usage: { prompt_tokens: 5, completion_tokens: 7 } } });
    const result = await completeOpenAi(makeConfig(), request);
    expect(calls[0].url).toBe('https://api.openai.com/v1/chat/completions');
    expect(calls[0].headers.Authorization).toBe('Bearer sk-test');
    expect(calls[0].body).toMatchObject({
      model: 'gpt-4.1-mini',
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: request.messages,
    });
    expect(result).toEqual({ text: '{"ok":1}', promptTokens: 5, completionTokens: 7, model: 'gpt-x' });
  });

  it('omits Authorization without a key and retries without response_format', async () => {
    const calls = mockFetch(
      { status: 400, body: { error: { message: "'response_format' is not supported" } } },
      { body: { choices: [{ message: { content: 'hi' } }] } },
    );
    const result = await completeOpenAi(makeConfig({ apiKey: '', baseUrl: 'http://localhost:11434/v1/' }), request);
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toBe('http://localhost:11434/v1/chat/completions');
    expect(calls[0].headers.Authorization).toBeUndefined();
    expect(calls[0].body.response_format).toBeDefined();
    expect(calls[1].body.response_format).toBeUndefined();
    expect(result.text).toBe('hi');
  });

  it('switches to max_completion_tokens when max_tokens is rejected', async () => {
    const calls = mockFetch(
      { status: 400, body: { error: { message: "Unsupported parameter: 'max_tokens'. Use 'max_completion_tokens' instead." } } },
      { body: { choices: [{ message: { content: 'ok' } }] } },
    );
    await completeOpenAi(makeConfig(), { messages: [{ role: 'user', content: 'x' }] });
    expect(calls[1].body.max_completion_tokens).toBe(1000);
    expect(calls[1].body.max_tokens).toBeUndefined();
  });

  it('substitutes the Cloudflare account id', async () => {
    const calls = mockFetch({ body: { choices: [{ message: { content: 'ok' } }] } });
    await completeOpenAi(
      makeConfig({ presetId: 'cloudflare', baseUrl: 'https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/v1', extra: { accountId: 'abc123' } }),
      { messages: [{ role: 'user', content: 'x' }] },
    );
    expect(calls[0].url).toBe('https://api.cloudflare.com/client/v4/accounts/abc123/ai/v1/chat/completions');
  });

  it('reports helpful HTTP errors', async () => {
    mockFetch({ status: 401, body: { error: { message: 'Incorrect API key provided' } } });
    await expect(completeOpenAi(makeConfig(), request)).rejects.toThrow(/API key.*Incorrect API key provided/);
    mockFetch({ status: 429, body: { error: { message: 'Slow down' } } });
    await expect(completeOpenAi(makeConfig(), request)).rejects.toThrow(/rate limit/i);
  });

  it('explains network failures to local servers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(completeOpenAi(makeConfig({ baseUrl: 'http://localhost:11434/v1', apiKey: '' }), request)).rejects.toThrow(/OLLAMA_ORIGINS/);
  });
});

describe('anthropic protocol', () => {
  it('moves system to the top level and sets required headers', async () => {
    const calls = mockFetch({ body: { model: 'claude-x', content: [{ type: 'text', text: '{"a":1}' }], usage: { input_tokens: 11, output_tokens: 3 } } });
    const config = makeConfig({ protocol: 'anthropic', presetId: 'anthropic', baseUrl: '', apiKey: 'ak', model: 'claude-opus-5-5' });
    const result = await completeAnthropic(config, request);
    expect(calls[0].url).toBe('https://api.anthropic.com/v1/messages');
    expect(calls[0].headers['x-api-key']).toBe('ak');
    expect(calls[0].headers['anthropic-version']).toBe('2023-06-01');
    expect(calls[0].headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(calls[0].body.system).toMatch(/^Be brief\.\n\n.*JSON/);
    expect(calls[0].body.max_tokens).toBe(1000);
    expect(calls[0].body.messages).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(result).toEqual({ text: '{"a":1}', promptTokens: 11, completionTokens: 3, model: 'claude-x' });
  });

  it('retries without temperature when the model rejects it', async () => {
    const calls = mockFetch(
      { status: 400, body: { type: 'error', error: { type: 'invalid_request_error', message: 'temperature is not supported for this model' } } },
      { body: { content: [{ type: 'text', text: 'ok' }] } },
    );
    await completeAnthropic(makeConfig({ protocol: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' }), request);
    expect(calls[0].body.temperature).toBe(0.3);
    expect(calls[1].body.temperature).toBeUndefined();
    expect(calls[1].url).toBe('https://api.anthropic.com/v1/messages');
  });
});

describe('gemini protocol', () => {
  it('builds generateContent with systemInstruction and JSON mime type', async () => {
    const calls = mockFetch({
      body: { candidates: [{ content: { parts: [{ text: '{"x":true}' }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 6 } },
    });
    const config = makeConfig({ protocol: 'gemini', presetId: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com', apiKey: 'g k', model: 'models/gemini-2.5-flash' });
    const result = await completeGemini(config, { ...request, messages: [...request.messages, { role: 'assistant', content: 'prev' }, { role: 'user', content: 'again' }] });
    expect(calls[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=g%20k');
    expect(calls[0].body.systemInstruction).toEqual({ parts: [{ text: 'Be brief.' }] });
    expect(calls[0].body.contents).toEqual([
      { role: 'user', parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'prev' }] },
      { role: 'user', parts: [{ text: 'again' }] },
    ]);
    expect(calls[0].body.generationConfig).toEqual({ temperature: 0.3, maxOutputTokens: 1000, responseMimeType: 'application/json' });
    expect(result).toMatchObject({ text: '{"x":true}', promptTokens: 4, completionTokens: 6 });
  });

  it('lists only generateContent models without the models/ prefix', async () => {
    mockFetch({
      body: {
        models: [
          { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/embedding-001', supportedGenerationMethods: ['embedContent'] },
        ],
      },
    });
    expect(await listModelsGemini(makeConfig({ protocol: 'gemini', baseUrl: '' }))).toEqual(['gemini-2.5-flash']);
  });
});

describe('other protocols', () => {
  it('builds Vertex and Azure URLs', () => {
    expect(vertexUrl(makeConfig({ protocol: 'vertex', model: 'gemini-2.5-flash', extra: { project: 'p1', location: 'europe-west4' } }))).toBe(
      'https://europe-west4-aiplatform.googleapis.com/v1/projects/p1/locations/europe-west4/publishers/google/models/gemini-2.5-flash:generateContent',
    );
    expect(azureChatUrl(makeConfig({ protocol: 'azure', baseUrl: 'https://r.openai.azure.com/', extra: { deployment: 'dep', apiVersion: '2024-10-21' } }))).toBe(
      'https://r.openai.azure.com/openai/deployments/dep/chat/completions?api-version=2024-10-21',
    );
  });

  it('parses Cohere v2 responses', async () => {
    const calls = mockFetch({ body: { message: { content: [{ type: 'text', text: 'hey' }] }, usage: { tokens: { input_tokens: 2, output_tokens: 1 } } } });
    const result = await completeCohere(makeConfig({ protocol: 'cohere', baseUrl: 'https://api.cohere.com' }), request);
    expect(calls[0].url).toBe('https://api.cohere.com/v2/chat');
    expect(result).toMatchObject({ text: 'hey', promptTokens: 2, completionTokens: 1 });
  });
});

describe('client', () => {
  it('rejects empty completions', async () => {
    mockFetch({ body: { choices: [{ message: { content: '' } }] } });
    await expect(complete(makeConfig(), request)).rejects.toThrow(/empty response/);
  });

  it('testConnection never throws', async () => {
    mockFetch({ status: 401, body: { error: { message: 'bad key' } } });
    const failed = await testConnection(makeConfig());
    expect(failed.ok).toBe(false);
    expect(failed.message).toMatch(/bad key/);
    mockFetch({ body: { choices: [{ message: { content: 'OK' } }] } });
    expect((await testConnection(makeConfig())).ok).toBe(true);
    expect((await testConnection(makeConfig({ apiKey: '' }))).message).toMatch(/needs an API key/);
  });

  it('falls back to suggested models when there is no list endpoint', async () => {
    mockFetch({ status: 404, body: 'Not found' });
    const models = await listModels(makeConfig({ presetId: 'groq', baseUrl: 'https://api.groq.com/openai/v1' }));
    expect(models).toContain('openai/gpt-oss-120b');
  });
});

describe('model lists and retired models', () => {
  it('reads Together-style bare-array model lists and skips non-chat models', async () => {
    mockFetch({
      body: [
        { id: 'zai-org/GLM-5.3', type: 'chat' },
        { id: 'black-forest-labs/FLUX.2', type: 'image' },
        { id: 'BAAI/bge-large', type: 'embedding' },
        { id: 'moonshotai/Kimi-K3', type: 'chat' },
      ],
    });
    const models = await listModels(makeConfig({ presetId: 'together', baseUrl: 'https://api.together.ai/v1' }));
    expect(models).toEqual(['moonshotai/Kimi-K3', 'zai-org/GLM-5.3']);
  });

  it('still reads { data: [...] } lists', async () => {
    mockFetch({ body: { object: 'list', data: [{ id: 'b' }, { id: 'a' }] } });
    expect(await listModels(makeConfig())).toEqual(['a', 'b']);
  });

  it('lists the available models when the configured model was retired', async () => {
    const calls = mockFetch(
      { status: 404, body: { error: { message: 'Unable to access model meta-llama/Llama-3.3-70B-Instruct-Turbo. Please visit https://api.together.ai/models to view the list of supported models.' } } },
      { body: [{ id: 'zai-org/GLM-5.3', type: 'chat' }] },
    );
    const result = await testConnection(
      makeConfig({ presetId: 'together', baseUrl: 'https://api.together.ai/v1', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' }),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/not available/);
    expect(result.message).toContain('zai-org/GLM-5.3');
    expect(calls[1].url).toBe('https://api.together.ai/v1/models');
  });

  it('asks for a model and lists choices when none is set', async () => {
    mockFetch({ body: { data: [{ id: 'llama3.2:latest' }] } });
    const result = await testConnection(makeConfig({ presetId: 'ollama', baseUrl: 'http://localhost:11434/v1', apiKey: '', model: '' }));
    expect(result.ok).toBe(false);
    expect(result.message).toContain('llama3.2:latest');
  });

  it('does not treat a bad key as a model problem', async () => {
    mockFetch({ status: 401, body: { error: { message: 'Invalid API key' } } });
    const result = await testConnection(makeConfig());
    expect(result.message).toMatch(/rejected the API key/);
    expect(result.message).not.toMatch(/Load available models/);
  });
});

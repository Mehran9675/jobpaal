import type { CompletionRequest, CompletionResult, ProviderConfig } from '@/shared/types';
import { errorMessage } from '@/shared/utils/errors';
import { AiHttpError, AiResponseError } from './errors';
import { getPreset } from './presets';
import { completeAnthropic, listModelsAnthropic } from './protocols/anthropic';
import { completeAzure, listModelsAzure } from './protocols/azure';
import { completeCohere, listModelsCohere } from './protocols/cohere';
import { completeGemini, listModelsGemini } from './protocols/gemini';
import { completeOpenAi, listModelsOpenAi } from './protocols/openai';
import { completeVertex, listModelsVertex } from './protocols/vertex';

/** Checks the configuration before any network call. Returns a problem or ''. */
export function configProblem(config: ProviderConfig): string {
  const preset = getPreset(config.presetId);
  const needsKey = config.protocol !== 'openai' || (preset?.requiresKey ?? false);
  if (needsKey && !config.apiKey.trim()) return `${config.name || 'This provider'} needs an API key.`;
  if (config.protocol === 'azure') {
    if (!config.baseUrl.trim()) return 'Azure OpenAI needs the resource endpoint as base URL.';
    if (!config.extra.deployment?.trim() && !config.model.trim()) return 'Azure OpenAI needs a deployment name.';
    return '';
  }
  if ((config.protocol === 'openai' || config.protocol === 'cohere') && !config.baseUrl.trim() && !preset?.baseUrl) {
    return 'Enter the base URL of the provider.';
  }
  if (config.protocol === 'vertex' && !config.extra.project?.trim()) return 'Vertex AI needs a Google Cloud project id.';
  if (/\{accountId\}/.test(config.baseUrl) && !config.extra.accountId?.trim()) return 'This provider needs your account id.';
  if (!config.model.trim()) return 'Choose a model for this provider.';
  return '';
}

/** Raw protocol dispatch (no validation of the output). */
async function dispatch(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResult> {
  const problem = configProblem(config);
  if (problem) throw new Error(problem);
  switch (config.protocol) {
    case 'anthropic':
      return completeAnthropic(config, request);
    case 'gemini':
      return completeGemini(config, request);
    case 'vertex':
      return completeVertex(config, request);
    case 'cohere':
      return completeCohere(config, request);
    case 'azure':
      return completeAzure(config, request);
    case 'openai':
    default:
      return completeOpenAi(config, request);
  }
}

/**
 * Sends a chat completion to the configured provider. Temperature and max tokens
 * default to the provider configuration. Throws when the model returns no text.
 */
export async function complete(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResult> {
  const result = await dispatch(config, request);
  if (!result.text.trim()) {
    throw new AiResponseError(
      'The model returned an empty response. Try again, choose another model, or increase "max tokens" for this provider.',
    );
  }
  return result;
}

/** Lists the models the provider offers. Falls back to suggested models when the provider has no list endpoint. */
export async function listModels(config: ProviderConfig): Promise<string[]> {
  const suggested = getPreset(config.presetId)?.suggestedModels ?? [];
  let models: string[];
  try {
    switch (config.protocol) {
      case 'anthropic':
        models = await listModelsAnthropic(config);
        break;
      case 'gemini':
        models = await listModelsGemini(config);
        break;
      case 'vertex':
        models = await listModelsVertex(config);
        break;
      case 'cohere':
        models = await listModelsCohere(config);
        break;
      case 'azure':
        models = await listModelsAzure(config);
        break;
      default:
        models = await listModelsOpenAi(config);
    }
  } catch (error) {
    if (error instanceof AiHttpError && (error.status === 404 || error.status === 405) && suggested.length) {
      return [...suggested];
    }
    throw error;
  }
  const unique = [...new Set(models)].sort((a, b) => a.localeCompare(b));
  return unique.length ? unique : [...suggested];
}

const MODEL_ERROR = /model/i;
const MODEL_MISSING = /not.?found|does not exist|not exist|not available|unavailable|invalid|unknown|unsupported|no such|deprecated|retired|decommissioned|not supported|not allowed/i;

/** True when the provider rejected the configured model (as opposed to the key or the URL). */
export function isModelError(error: unknown): boolean {
  if (!(error instanceof AiHttpError)) return false;
  const text = `${error.providerMessage} ${error.message}`;
  if (error.status === 404) return MODEL_ERROR.test(error.providerMessage);
  return [400, 422].includes(error.status) && MODEL_ERROR.test(text) && MODEL_MISSING.test(text);
}

/** Explains a rejected or missing model and lists what the provider offers now. */
async function modelHint(config: ProviderConfig, base: string): Promise<string> {
  try {
    const models = await listModels(config);
    if (!models.length) return base;
    const shown = models.slice(0, 12).join(', ');
    return `${base} Models your key can use: ${shown}${models.length > 12 ? `, … (${models.length} in total)` : ''}. Click "Load available models" to pick one.`;
  } catch {
    return `${base} Click "Load available models" to see the models your key can use.`;
  }
}

/** Sends a tiny request to check key, URL and model. Never throws. */
export async function testConnection(config: ProviderConfig): Promise<{ ok: boolean; message: string }> {
  if (!config.model.trim() && config.protocol !== 'azure') {
    const problem = configProblem({ ...config, model: 'placeholder' });
    if (problem) return { ok: false, message: problem };
    return { ok: false, message: await modelHint(config, 'Choose a model for this provider.') };
  }
  try {
    const result = await dispatch(config, {
      messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
      temperature: 0,
      maxTokens: 256,
    });
    const reply = result.text.trim().slice(0, 40);
    return {
      ok: true,
      message: reply
        ? `Connected to ${result.model || config.model}. The model replied "${reply}".`
        : `Connected to ${result.model || config.model}, but the model returned no text for the test prompt.`,
    };
  } catch (error) {
    if (isModelError(error)) {
      return { ok: false, message: await modelHint(config, `The model "${config.model}" is not available: ${errorMessage(error)}`) };
    }
    return { ok: false, message: errorMessage(error) };
  }
}

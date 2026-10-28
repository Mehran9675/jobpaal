import type { ProviderPreset } from '@/shared/types';

type Options = Partial<Pick<ProviderPreset, 'requiresKey' | 'local' | 'extraFields' | 'notes' | 'protocol'>>;

function preset(
  id: string,
  name: string,
  baseUrl: string,
  defaultModel: string,
  suggestedModels: string[],
  docsUrl: string,
  options: Options = {},
): ProviderPreset {
  return {
    id,
    name,
    protocol: options.protocol ?? 'openai',
    baseUrl,
    defaultModel,
    suggestedModels:
      !defaultModel || suggestedModels.includes(defaultModel) ? suggestedModels : [defaultModel, ...suggestedModels],
    requiresKey: options.requiresKey ?? !options.local,
    local: options.local ?? false,
    docsUrl,
    extraFields: options.extraFields ?? [],
    notes: options.notes,
  };
}

const local = (notes: string): Options => ({ local: true, requiresKey: false, notes });

/** Preconfigured providers. Every OpenAI-compatible endpoint uses protocol 'openai'. */
/** Shown for presets whose model catalogue changes too often to pin a default. */
const PICK_MODEL = 'Click "Load available models" after entering your key, then pick a model.';

/**
 * Preconfigured providers. Every OpenAI-compatible endpoint uses protocol 'openai'.
 * Defaults were checked against provider docs in October 2026. Model catalogues change often:
 * when a model is retired, "Test connection" lists the models the provider currently offers.
 */
export const PROVIDER_PRESETS: ProviderPreset[] = [
  // Major hosted providers
  preset('openai', 'OpenAI', 'https://api.openai.com/v1', 'gpt-6.1-terra', ['gpt-6.1-terra', 'gpt-6.1-sol', 'gpt-6-astra'], 'https://platform.openai.com/api-keys'),
  preset('anthropic', 'Anthropic Claude', 'https://api.anthropic.com', 'claude-sonnet-5-5', ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'], 'https://console.anthropic.com/settings/keys', { protocol: 'anthropic' }),
  preset('gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com', 'gemini-3.8-flash', ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-pro-latest'], 'https://aistudio.google.com/app/apikey', { protocol: 'gemini' }),
  preset('vertex', 'Google Vertex AI', '', 'gemini-3.8-flash', ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.5-flash-lite'], 'https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart', {
    protocol: 'vertex',
    extraFields: ['project', 'location'],
    notes: 'Paste an OAuth access token (gcloud auth print-access-token) as the key. Tokens expire after about an hour. Location e.g. us-central1 or global.',
  }),
  preset('xai', 'xAI Grok', 'https://api.x.ai/v1', 'grok-4.7', ['grok-4.7', 'grok-4.3', 'grok-build-0.1'], 'https://console.x.ai'),
  preset('mistral', 'Mistral AI', 'https://api.mistral.ai/v1', 'mistral-medium-latest', ['mistral-medium-latest', 'mistral-large-latest', 'mistral-small-latest'], 'https://console.mistral.ai/api-keys'),
  preset('cohere', 'Cohere', 'https://api.cohere.com', 'command-a-plus-05-2026', ['command-a-plus-05-2026', 'command-a-03-2025'], 'https://dashboard.cohere.com/api-keys', { protocol: 'cohere' }),
  preset('deepseek', 'DeepSeek', 'https://api.deepseek.com/v1', 'deepseek-flash', ['deepseek-flash', 'deepseek-v4-pro'], 'https://platform.deepseek.com/api_keys', {
    notes: 'deepseek-chat and deepseek-reasoner were retired in July 2026; use deepseek-flash or deepseek-v4-pro.',
  }),
  preset('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', 'openrouter/auto', ['openrouter/auto', 'moonshotai/kimi-k3', 'z-ai/glm-5.3'], 'https://openrouter.ai/keys', {
    notes: 'openrouter/auto picks a model per request. Load available models to choose a specific one.',
  }),
  preset('azure-openai', 'Azure OpenAI', 'https://YOUR-RESOURCE.openai.azure.com', 'gpt-6.1-terra', ['gpt-6.1-terra', 'gpt-6.1-sol'], 'https://learn.microsoft.com/azure/ai-services/openai/reference', {
    protocol: 'azure',
    extraFields: ['deployment', 'apiVersion'],
    notes: 'Base URL is your resource endpoint. The deployment name is used instead of the model; default API version 2024-10-21.',
  }),

  // Fast inference / open-model hosts (OpenAI-compatible)
  preset('groq', 'Groq', 'https://api.groq.com/openai/v1', 'openai/gpt-oss-120b', ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'], 'https://console.groq.com/keys'),
  preset('together', 'Together AI', 'https://api.together.ai/v1', 'zai-org/GLM-5.3', ['zai-org/GLM-5.3', 'zai-org/GLM-5.3-Flash', 'moonshotai/Kimi-K3', 'deepseek-ai/DeepSeek-V4-Pro-0813', 'Qwen/Qwen3.8-Flash'], 'https://api.together.ai/settings/api-keys'),
  preset('fireworks', 'Fireworks AI', 'https://api.fireworks.ai/inference/v1', 'accounts/fireworks/models/glm-5p3', ['accounts/fireworks/models/glm-5p3', 'accounts/fireworks/models/glm-5p3-flash', 'accounts/fireworks/models/kimi-k3', 'accounts/fireworks/models/deepseek-v4p1-flash'], 'https://fireworks.ai/account/api-keys'),
  preset('deepinfra', 'DeepInfra', 'https://api.deepinfra.com/v1/openai', 'openai/gpt-oss-120b', ['openai/gpt-oss-120b'], 'https://deepinfra.com/dash/api_keys'),
  preset('cerebras', 'Cerebras', 'https://api.cerebras.ai/v1', 'gpt-oss-120b', ['gpt-oss-120b', 'qwen-3.8-27b'], 'https://cloud.cerebras.ai'),
  preset('sambanova', 'SambaNova', 'https://api.sambanova.ai/v1', 'gpt-oss-120b', ['gpt-oss-120b'], 'https://cloud.sambanova.ai/apis'),
  preset('nebius', 'Nebius AI Studio', 'https://api.studio.nebius.com/v1', 'openai/gpt-oss-120b', ['openai/gpt-oss-120b'], 'https://studio.nebius.com'),
  preset('hyperbolic', 'Hyperbolic', 'https://api.hyperbolic.xyz/v1', 'openai/gpt-oss-120b', ['openai/gpt-oss-120b'], 'https://app.hyperbolic.xyz/settings'),
  preset('novita', 'Novita AI', 'https://api.novita.ai/v3/openai', 'openai/gpt-oss-120b', ['openai/gpt-oss-120b'], 'https://novita.ai/settings/key-management'),

  // Regional / model-maker APIs (OpenAI-compatible)
  preset('moonshot', 'Moonshot AI (Kimi)', 'https://api.moonshot.ai/v1', 'kimi-k3', ['kimi-k3'], 'https://platform.moonshot.ai/console/api-keys'),
  preset('zhipu', 'Zhipu GLM (BigModel)', 'https://open.bigmodel.cn/api/paas/v4', 'glm-5.3', ['glm-5.3', 'glm-5.3-flash'], 'https://open.bigmodel.cn/usercenter/apikeys'),
  preset('zai', 'Z.ai GLM (international)', 'https://api.z.ai/api/paas/v4', 'glm-5.3', ['glm-5.3', 'glm-5.3-flash'], 'https://z.ai/manage-apikey/apikey-list'),
  preset('qwen', 'Alibaba Qwen (DashScope)', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', 'qwen-plus', ['qwen-plus', 'qwen-max', 'qwen-flash'], 'https://www.alibabacloud.com/help/en/model-studio/get-api-key', {
    notes: 'International endpoint. Mainland China accounts use https://dashscope.aliyuncs.com/compatible-mode/v1. qwen-plus / qwen-max / qwen-flash always point to the current generation.',
  }),
  preset('yi', '01.AI Yi', 'https://api.lingyiwanwu.com/v1', '', [], 'https://platform.lingyiwanwu.com/apikeys', { notes: PICK_MODEL }),
  preset('minimax', 'MiniMax', 'https://api.minimax.io/v1', 'MiniMax-M3', ['MiniMax-M3'], 'https://www.minimax.io/platform/user-center/basic-information/interface-key'),
  preset('stepfun', 'StepFun', 'https://api.stepfun.com/v1', '', [], 'https://platform.stepfun.com/interface-key', { notes: PICK_MODEL }),
  preset('siliconflow', 'SiliconFlow', 'https://api.siliconflow.com/v1', '', [], 'https://cloud.siliconflow.com/account/ak', {
    notes: `Mainland China accounts use https://api.siliconflow.cn/v1. ${PICK_MODEL}`,
  }),
  preset('huggingface', 'Hugging Face Inference', 'https://router.huggingface.co/v1', 'openai/gpt-oss-120b', ['openai/gpt-oss-120b', 'zai-org/GLM-5.3', 'moonshotai/Kimi-K3'], 'https://huggingface.co/settings/tokens'),
  preset('nvidia', 'NVIDIA NIM', 'https://integrate.api.nvidia.com/v1', 'deepseek-ai/deepseek-v4.1-flash', ['deepseek-ai/deepseek-v4.1-flash', 'z-ai/glm-5.3', 'openai/gpt-oss-20b'], 'https://build.nvidia.com', {
    notes: 'The free catalogue changes often; load available models if the default is gone.',
  }),
  preset('github-models', 'GitHub Models', 'https://models.github.ai/inference', '', [], 'https://github.com/marketplace/models', {
    notes: `Use a GitHub personal access token with the models scope. Model ids look like publisher/model (see the GitHub Models catalogue). ${PICK_MODEL}`,
  }),
  preset('cloudflare', 'Cloudflare Workers AI', 'https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/v1', '@cf/openai/gpt-oss-120b', ['@cf/openai/gpt-oss-120b', '@cf/zai-org/glm-5.3', '@cf/qwen/qwen3.8-27b'], 'https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/', {
    extraFields: ['accountId'],
    notes: 'Needs your Cloudflare account id and an API token with Workers AI permission.',
  }),
  preset('ai21', 'AI21 Labs', 'https://api.ai21.com/studio/v1', '', [], 'https://studio.ai21.com/account/api-key', { notes: PICK_MODEL }),
  preset('featherless', 'Featherless AI', 'https://api.featherless.ai/v1', '', [], 'https://featherless.ai/account/api-keys', { notes: PICK_MODEL }),
  preset('scaleway', 'Scaleway Generative APIs', 'https://api.scaleway.ai/v1', 'gpt-oss-120b', ['gpt-oss-120b'], 'https://console.scaleway.com/iam/api-keys'),
  preset('ovhcloud', 'OVHcloud AI Endpoints', 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1', 'gpt-oss-120b', ['gpt-oss-120b'], 'https://endpoints.ai.cloud.ovh.net'),
  preset('venice', 'Venice AI', 'https://api.venice.ai/api/v1', '', [], 'https://venice.ai/settings/api', { notes: PICK_MODEL }),
  preset('upstage', 'Upstage Solar', 'https://api.upstage.ai/v1', '', [], 'https://console.upstage.ai/api-keys', { notes: PICK_MODEL }),
  preset('requesty', 'Requesty', 'https://router.requesty.ai/v1', '', [], 'https://app.requesty.ai/api-keys', { notes: PICK_MODEL }),
  preset('glama', 'Glama Gateway', 'https://glama.ai/api/gateway/openai/v1', '', [], 'https://glama.ai/settings/gateway/api-keys', { notes: PICK_MODEL }),
  preset('chutes', 'Chutes', 'https://llm.chutes.ai/v1', '', [], 'https://chutes.ai/app/api', { notes: PICK_MODEL }),
  preset('inception', 'Inception Labs (Mercury)', 'https://api.inceptionlabs.ai/v1', '', [], 'https://platform.inceptionlabs.ai', { notes: PICK_MODEL }),

  // Local servers (OpenAI-compatible, no key)
  preset('ollama', 'Ollama (local)', 'http://localhost:11434/v1', '', [], 'https://ollama.com/download', local('Start Ollama with OLLAMA_ORIGINS="chrome-extension://*,moz-extension://*" so the extension can reach it. Load available models to pick one you have pulled.')),
  preset('lmstudio', 'LM Studio (local)', 'http://localhost:1234/v1', '', [], 'https://lmstudio.ai/docs/app/api', local('Start the local server in LM Studio and enable CORS. Load available models to pick a loaded model.')),
  preset('localai', 'LocalAI (local)', 'http://localhost:8080/v1', '', [], 'https://localai.io', local('Model names come from your LocalAI configuration.')),
  preset('vllm', 'vLLM (local)', 'http://localhost:8000/v1', '', [], 'https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html', local('Use the model name vLLM is serving (vllm serve <model>). Add --allowed-origins if CORS blocks requests.')),
  preset('llamacpp', 'llama.cpp server (local)', 'http://localhost:8080/v1', 'local', [], 'https://github.com/ggml-org/llama.cpp/tree/master/tools/server', local('llama-server serves one model; any model name works.')),
  preset('jan', 'Jan (local)', 'http://localhost:1337/v1', '', [], 'https://jan.ai/docs/api-server', local('Enable the local API server in Jan settings and allow CORS.')),
  preset('textgen-webui', 'text-generation-webui (local)', 'http://127.0.0.1:5000/v1', 'local', [], 'https://github.com/oobabooga/text-generation-webui/wiki/12-%E2%80%90-OpenAI-API', local('Start with --api (and --listen if needed).')),
  preset('custom', 'Custom OpenAI-compatible', '', '', [], 'https://platform.openai.com/docs/api-reference/chat', {
    requiresKey: false,
    notes: 'Any server exposing /chat/completions. Leave the key empty if the server does not need one.',
  }),
];

export function getPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

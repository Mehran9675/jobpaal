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
export const PROVIDER_PRESETS: ProviderPreset[] = [
  // Major hosted providers
  preset('openai', 'OpenAI', 'https://api.openai.com/v1', 'gpt-4.1-mini', ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini'], 'https://platform.openai.com/api-keys'),
  preset('anthropic', 'Anthropic Claude', 'https://api.anthropic.com', 'claude-opus-5-5', ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-sonnet-4-6', 'claude-haiku-4-5'], 'https://console.anthropic.com/settings/keys', { protocol: 'anthropic' }),
  preset('gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com', 'gemini-2.5-flash', ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'], 'https://aistudio.google.com/app/apikey', { protocol: 'gemini' }),
  preset('vertex', 'Google Vertex AI', '', 'gemini-2.5-flash', ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'], 'https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart', {
    protocol: 'vertex',
    extraFields: ['project', 'location'],
    notes: 'Paste an OAuth access token (gcloud auth print-access-token) as the key. Tokens expire after about an hour. Location e.g. us-central1 or global.',
  }),
  preset('xai', 'xAI Grok', 'https://api.x.ai/v1', 'grok-3-mini', ['grok-4', 'grok-3', 'grok-3-mini'], 'https://console.x.ai'),
  preset('mistral', 'Mistral AI', 'https://api.mistral.ai/v1', 'mistral-small-latest', ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'ministral-8b-latest'], 'https://console.mistral.ai/api-keys'),
  preset('cohere', 'Cohere', 'https://api.cohere.com', 'command-a-03-2025', ['command-a-03-2025', 'command-r-plus-08-2024', 'command-r-08-2024', 'command-r7b-12-2024'], 'https://dashboard.cohere.com/api-keys', { protocol: 'cohere' }),
  preset('deepseek', 'DeepSeek', 'https://api.deepseek.com/v1', 'deepseek-chat', ['deepseek-chat', 'deepseek-reasoner'], 'https://platform.deepseek.com/api_keys'),
  preset('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', 'openai/gpt-4o-mini', ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-4.5', 'google/gemini-2.5-flash', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat'], 'https://openrouter.ai/keys'),
  preset('azure-openai', 'Azure OpenAI', 'https://YOUR-RESOURCE.openai.azure.com', 'gpt-4o-mini', ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'], 'https://learn.microsoft.com/azure/ai-services/openai/reference', {
    protocol: 'azure',
    extraFields: ['deployment', 'apiVersion'],
    notes: 'Base URL is your resource endpoint. The deployment name is used instead of the model; default API version 2024-10-21.',
  }),

  // Fast inference / open-model hosts (OpenAI-compatible)
  preset('groq', 'Groq', 'https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile', ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b', 'qwen/qwen3-32b'], 'https://console.groq.com/keys'),
  preset('together', 'Together AI', 'https://api.together.xyz/v1', 'meta-llama/Llama-3.3-70B-Instruct-Turbo', ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct-Turbo'], 'https://api.together.xyz/settings/api-keys'),
  preset('fireworks', 'Fireworks AI', 'https://api.fireworks.ai/inference/v1', 'accounts/fireworks/models/llama-v3p3-70b-instruct', ['accounts/fireworks/models/llama-v3p3-70b-instruct', 'accounts/fireworks/models/deepseek-v3', 'accounts/fireworks/models/qwen2p5-72b-instruct'], 'https://fireworks.ai/account/api-keys'),
  preset('perplexity', 'Perplexity', 'https://api.perplexity.ai', 'sonar', ['sonar', 'sonar-pro', 'sonar-reasoning'], 'https://www.perplexity.ai/settings/api', { notes: 'Perplexity has no model list endpoint; the suggested models are shown.' }),
  preset('deepinfra', 'DeepInfra', 'https://api.deepinfra.com/v1/openai', 'meta-llama/Llama-3.3-70B-Instruct', ['meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'], 'https://deepinfra.com/dash/api_keys'),
  preset('cerebras', 'Cerebras', 'https://api.cerebras.ai/v1', 'llama-3.3-70b', ['llama-3.3-70b', 'llama3.1-8b', 'gpt-oss-120b', 'qwen-3-32b'], 'https://cloud.cerebras.ai'),
  preset('sambanova', 'SambaNova', 'https://api.sambanova.ai/v1', 'Meta-Llama-3.3-70B-Instruct', ['Meta-Llama-3.3-70B-Instruct', 'DeepSeek-V3-0324', 'Meta-Llama-3.1-8B-Instruct'], 'https://cloud.sambanova.ai/apis'),
  preset('nebius', 'Nebius AI Studio', 'https://api.studio.nebius.com/v1', 'meta-llama/Llama-3.3-70B-Instruct', ['meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'], 'https://studio.nebius.com'),
  preset('hyperbolic', 'Hyperbolic', 'https://api.hyperbolic.xyz/v1', 'meta-llama/Llama-3.3-70B-Instruct', ['meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'], 'https://app.hyperbolic.xyz/settings'),
  preset('novita', 'Novita AI', 'https://api.novita.ai/v3/openai', 'meta-llama/llama-3.3-70b-instruct', ['meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-v3-0324', 'qwen/qwen-2.5-72b-instruct'], 'https://novita.ai/settings/key-management'),

  // Regional / model-maker APIs (OpenAI-compatible)
  preset('moonshot', 'Moonshot AI (Kimi)', 'https://api.moonshot.ai/v1', 'kimi-k2-0905-preview', ['kimi-k2-0905-preview', 'kimi-k2-turbo-preview', 'moonshot-v1-32k', 'moonshot-v1-8k'], 'https://platform.moonshot.ai/console/api-keys'),
  preset('zhipu', 'Zhipu GLM (BigModel)', 'https://open.bigmodel.cn/api/paas/v4', 'glm-4.5-air', ['glm-4.5', 'glm-4.5-air', 'glm-4-flash'], 'https://open.bigmodel.cn/usercenter/apikeys'),
  preset('zai', 'Z.ai GLM (international)', 'https://api.z.ai/api/paas/v4', 'glm-4.5-air', ['glm-4.5', 'glm-4.5-air'], 'https://z.ai/manage-apikey/apikey-list'),
  preset('qwen', 'Alibaba Qwen (DashScope)', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', 'qwen-plus', ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-flash'], 'https://www.alibabacloud.com/help/en/model-studio/get-api-key', {
    notes: 'International endpoint. Mainland China accounts use https://dashscope.aliyuncs.com/compatible-mode/v1.',
  }),
  preset('yi', '01.AI Yi', 'https://api.lingyiwanwu.com/v1', 'yi-lightning', ['yi-lightning', 'yi-large'], 'https://platform.lingyiwanwu.com/apikeys'),
  preset('minimax', 'MiniMax', 'https://api.minimax.io/v1', 'MiniMax-Text-01', ['MiniMax-M1', 'MiniMax-Text-01'], 'https://www.minimax.io/platform/user-center/basic-information/interface-key'),
  preset('stepfun', 'StepFun', 'https://api.stepfun.com/v1', 'step-1-8k', ['step-2-16k', 'step-1-8k', 'step-1-32k'], 'https://platform.stepfun.com/interface-key'),
  preset('siliconflow', 'SiliconFlow', 'https://api.siliconflow.com/v1', 'Qwen/Qwen2.5-72B-Instruct', ['Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3', 'THUDM/GLM-4-9B-0414'], 'https://cloud.siliconflow.com/account/ak', {
    notes: 'Mainland China accounts use https://api.siliconflow.cn/v1.',
  }),
  preset('huggingface', 'Hugging Face Inference', 'https://router.huggingface.co/v1', 'meta-llama/Llama-3.3-70B-Instruct', ['meta-llama/Llama-3.3-70B-Instruct', 'openai/gpt-oss-120b', 'Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3'], 'https://huggingface.co/settings/tokens'),
  preset('nvidia', 'NVIDIA NIM', 'https://integrate.api.nvidia.com/v1', 'meta/llama-3.3-70b-instruct', ['meta/llama-3.3-70b-instruct', 'meta/llama-3.1-8b-instruct', 'deepseek-ai/deepseek-r1'], 'https://build.nvidia.com'),
  preset('github-models', 'GitHub Models', 'https://models.github.ai/inference', 'openai/gpt-4.1-mini', ['openai/gpt-4.1-mini', 'openai/gpt-4.1', 'openai/gpt-4o-mini', 'meta/Llama-3.3-70B-Instruct'], 'https://github.com/marketplace/models', {
    notes: 'Use a GitHub personal access token with the models scope.',
  }),
  preset('cloudflare', 'Cloudflare Workers AI', 'https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/v1', '@cf/meta/llama-3.3-70b-instruct-fp8-fast', ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct', '@cf/qwen/qwen2.5-coder-32b-instruct'], 'https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/', {
    extraFields: ['accountId'],
    notes: 'Needs your Cloudflare account id and an API token with Workers AI permission.',
  }),
  preset('ai21', 'AI21 Labs', 'https://api.ai21.com/studio/v1', 'jamba-mini', ['jamba-large', 'jamba-mini'], 'https://studio.ai21.com/account/api-key'),
  preset('featherless', 'Featherless AI', 'https://api.featherless.ai/v1', 'meta-llama/Meta-Llama-3.1-8B-Instruct', ['meta-llama/Meta-Llama-3.1-8B-Instruct', 'Qwen/Qwen2.5-72B-Instruct'], 'https://featherless.ai/account/api-keys'),
  preset('scaleway', 'Scaleway Generative APIs', 'https://api.scaleway.ai/v1', 'llama-3.3-70b-instruct', ['llama-3.3-70b-instruct', 'mistral-small-3.2-24b-instruct-2506', 'deepseek-r1-distill-llama-70b'], 'https://console.scaleway.com/iam/api-keys'),
  preset('ovhcloud', 'OVHcloud AI Endpoints', 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1', 'Meta-Llama-3_3-70B-Instruct', ['Meta-Llama-3_3-70B-Instruct', 'Mistral-Nemo-Instruct-2407', 'Qwen2.5-Coder-32B-Instruct'], 'https://endpoints.ai.cloud.ovh.net'),
  preset('venice', 'Venice AI', 'https://api.venice.ai/api/v1', 'llama-3.3-70b', ['llama-3.3-70b', 'qwen3-235b', 'mistral-31-24b'], 'https://venice.ai/settings/api'),
  preset('upstage', 'Upstage Solar', 'https://api.upstage.ai/v1', 'solar-pro2', ['solar-pro2', 'solar-mini'], 'https://console.upstage.ai/api-keys'),
  preset('lambda', 'Lambda Inference', 'https://api.lambda.ai/v1', 'llama3.3-70b-instruct-fp8', ['llama3.3-70b-instruct-fp8', 'deepseek-v3-0324', 'qwen25-coder-32b-instruct'], 'https://cloud.lambda.ai/api-keys'),
  preset('requesty', 'Requesty', 'https://router.requesty.ai/v1', 'openai/gpt-4o-mini', ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-4-5', 'google/gemini-2.5-flash'], 'https://app.requesty.ai/api-keys'),
  preset('glama', 'Glama Gateway', 'https://glama.ai/api/gateway/openai/v1', 'openai/gpt-4o-mini', ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-4-5', 'google/gemini-2.5-flash'], 'https://glama.ai/settings/gateway/api-keys'),
  preset('chutes', 'Chutes', 'https://llm.chutes.ai/v1', 'deepseek-ai/DeepSeek-V3-0324', ['deepseek-ai/DeepSeek-V3-0324', 'Qwen/Qwen3-235B-A22B', 'unsloth/Llama-3.3-70B-Instruct'], 'https://chutes.ai/app/api'),
  preset('inception', 'Inception Labs (Mercury)', 'https://api.inceptionlabs.ai/v1', 'mercury', ['mercury', 'mercury-coder'], 'https://platform.inceptionlabs.ai'),

  // Local servers (OpenAI-compatible, no key)
  preset('ollama', 'Ollama (local)', 'http://localhost:11434/v1', 'llama3.2', ['llama3.2', 'llama3.1:8b', 'qwen2.5:7b', 'mistral', 'gemma3'], 'https://ollama.com/download', local('Start Ollama with OLLAMA_ORIGINS="chrome-extension://*,moz-extension://*" so the extension can reach it.')),
  preset('lmstudio', 'LM Studio (local)', 'http://localhost:1234/v1', 'local-model', [], 'https://lmstudio.ai/docs/app/api', local('Start the local server in LM Studio and enable CORS. Use the model identifier shown in LM Studio.')),
  preset('localai', 'LocalAI (local)', 'http://localhost:8080/v1', 'gpt-4', [], 'https://localai.io', local('Model names come from your LocalAI configuration.')),
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

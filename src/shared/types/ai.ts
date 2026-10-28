export type ProviderProtocol = 'openai' | 'anthropic' | 'gemini' | 'vertex' | 'cohere' | 'azure';

export interface ProviderPreset {
  id: string;
  name: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  defaultModel: string;
  suggestedModels: string[];
  requiresKey: boolean;
  local: boolean;
  docsUrl: string;
  /** Extra configuration fields the preset needs (e.g. Vertex project). */
  extraFields: ('apiVersion' | 'project' | 'location' | 'deployment' | 'accountId')[];
  notes?: string;
}

export interface ProviderConfig {
  id: string;
  presetId: string;
  name: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  apiKey: string;
  model: string;
  extra: {
    apiVersion?: string;
    project?: string;
    location?: string;
    deployment?: string;
    accountId?: string;
  };
  temperature: number;
  maxTokens: number;
  lastTest: { ok: boolean; at: number; message: string } | null;
  createdAt: number;
}

export interface AiSettings {
  activeProviderId: string | null;
  providers: ProviderConfig[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  /** Ask the provider for a JSON object when it supports it. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface CompletionResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
}

export interface UsageCounters {
  calls: number;
  errors: number;
  promptTokens: number;
  completionTokens: number;
}

export interface UsageDay extends UsageCounters {
  byProvider: Record<string, UsageCounters>;
}

export interface UsageLog {
  total: UsageCounters;
  byProvider: Record<string, UsageCounters & { name: string }>;
  /** Keyed by YYYY-MM-DD (local time). */
  days: Record<string, UsageDay>;
  budget: { enabled: boolean; dailyTokens: number; lastWarnedDay: string };
}

export type AiTask = 'parse-resume' | 'analyze' | 'tailor' | 'cover-letter' | 'answers' | 'answer-one';

export interface PromptSettings {
  tone: string;
  writingStyle: string;
  wordsToAvoid: string[];
  themesToEmphasise: string[];
  /** Per-task instruction overrides. Empty string means the built-in template. */
  templates: Partial<Record<AiTask, string>>;
}

import { getActiveProvider } from '@/shared/storage';
import type { AiTask, CompletionRequest, CompletionResult } from '@/shared/types';
import { complete, configProblem, isModelError } from './client';
import { AiNotConfiguredError } from './errors';
import { recordUsage } from './usage';

/** Minimum output budget per task so long JSON answers are not cut off. */
const TASK_MIN_TOKENS: Record<AiTask, number> = {
  'parse-resume': 6000,
  tailor: 4000,
  analyze: 2500,
  'cover-letter': 2000,
  answers: 3000,
  'answer-one': 1000,
};

/** Runs one AI task on the active provider and records its usage (success and error). */
export async function runAi(task: AiTask, request: CompletionRequest): Promise<CompletionResult & { providerId: string }> {
  const provider = await getActiveProvider();
  if (!provider) throw new AiNotConfiguredError();
  const maxTokens = request.maxTokens ?? Math.max(provider.maxTokens || 0, TASK_MIN_TOKENS[task] ?? 0);
  const usageBase = { providerId: provider.id, providerName: provider.name };
  try {
    const result = await complete(provider, { ...request, maxTokens });
    await recordUsage({
      ...usageBase,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      error: false,
    }).catch(() => undefined);
    return { ...result, providerId: provider.id };
  } catch (error) {
    await recordUsage({ ...usageBase, promptTokens: 0, completionTokens: 0, error: true }).catch(() => undefined);
    if (isModelError(error)) {
      throw new Error(
        `${(error as Error).message} The model "${provider.model}" may have been retired. Open JobPaal → AI providers, click "Load available models" and pick a current one.`,
      );
    }
    throw error;
  }
}

/** True when an active provider exists and is fully configured. */
export async function isAiReady(): Promise<boolean> {
  try {
    const provider = await getActiveProvider();
    return Boolean(provider) && !configProblem(provider!);
  } catch {
    return false;
  }
}

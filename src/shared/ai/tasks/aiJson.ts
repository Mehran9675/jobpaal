import type { AiTask, ChatMessage } from '@/shared/types';
import { AiResponseError } from '../errors';
import { extractJsonObject } from '../json';
import { systemPromptFor, type TaskPrompt } from '../prompts/system';
import { runAi } from '../runAi';

export interface JsonTaskResult {
  data: Record<string, unknown>;
  providerId: string;
}

/**
 * Runs a JSON task: builds the system prompt (user style + core rules), asks for JSON,
 * and retries once with a correction message when the output does not parse.
 */
export async function runJsonTask(
  task: AiTask,
  prompt: TaskPrompt,
  userMessage: string,
  options: { temperature?: number } = {},
): Promise<JsonTaskResult> {
  const system = await systemPromptFor(task, prompt);
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: userMessage },
  ];
  const first = await runAi(task, { messages, json: true, temperature: options.temperature });
  try {
    return { data: extractJsonObject(first.text), providerId: first.providerId };
  } catch (error) {
    if (!(error instanceof AiResponseError)) throw error;
  }
  const retry = await runAi(task, {
    messages: [
      ...messages,
      { role: 'assistant', content: first.text.slice(0, 4000) },
      { role: 'user', content: 'That was not valid JSON. Reply again with only the JSON object described in the output format.' },
    ],
    json: true,
    temperature: options.temperature,
  });
  return { data: extractJsonObject(retry.text), providerId: retry.providerId };
}

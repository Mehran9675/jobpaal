import { createDefaultPromptSettings } from '@/shared/defaults/prompts';
import { getPromptSettings } from '@/shared/storage';
import type { AiTask, PromptSettings } from '@/shared/types';
import { CORE_TRUTHFULNESS_RULES } from './rules';

export interface TaskPrompt {
  /** Built-in task instruction. A non-empty user template replaces only this. */
  instruction: string;
  /** Output contract. Never replaced by templates so parsing keeps working. */
  format: string;
  /** Whether the user's writing style applies (generated prose). */
  usesStyle: boolean;
}

const INTRO =
  'You are JobPaal, a careful assistant that helps a job seeker present their real experience for a specific job. You write in English.';

function styleSection(settings: PromptSettings): string {
  const lines: string[] = [];
  if (settings.tone.trim()) lines.push(`Tone: ${settings.tone.trim()}.`);
  if (settings.writingStyle.trim()) lines.push(`Writing style: ${settings.writingStyle.trim()}.`);
  const avoid = settings.wordsToAvoid.map((w) => w.trim()).filter(Boolean);
  if (avoid.length) lines.push(`Never use these words: ${avoid.join(', ')}.`);
  const themes = settings.themesToEmphasise.map((t) => t.trim()).filter(Boolean);
  if (themes.length) lines.push(`Where the profile genuinely supports it, emphasise: ${themes.join(', ')}.`);
  return lines.join('\n');
}

/** Pure system prompt builder. The core truthfulness rules are always last and always present. */
export function buildSystemPrompt(task: AiTask, prompt: TaskPrompt, settings: PromptSettings): string {
  const template = settings.templates?.[task]?.trim();
  const sections = [INTRO, `TASK:\n${template || prompt.instruction}`];
  if (prompt.usesStyle) {
    const style = styleSection(settings);
    if (style) sections.push(`STYLE:\n${style}`);
  }
  sections.push(`OUTPUT FORMAT:\n${prompt.format}`);
  sections.push(CORE_TRUTHFULNESS_RULES);
  return sections.join('\n\n');
}

/** Loads the user's prompt settings (falls back to defaults) and builds the system prompt. */
export async function systemPromptFor(task: AiTask, prompt: TaskPrompt): Promise<string> {
  let settings: PromptSettings;
  try {
    settings = await getPromptSettings();
  } catch {
    settings = createDefaultPromptSettings();
  }
  return buildSystemPrompt(task, prompt, { ...createDefaultPromptSettings(), ...settings });
}

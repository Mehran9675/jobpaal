import type { PromptSettings } from '@/shared/types';

export function createDefaultPromptSettings(): PromptSettings {
  return {
    tone: 'professional, warm and direct',
    writingStyle: 'concise, concrete, active voice, no clichés',
    wordsToAvoid: ['passionate', 'synergy', 'rockstar', 'ninja', 'guru', 'go-getter'],
    themesToEmphasise: [],
    templates: {},
  };
}

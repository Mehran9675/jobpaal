import { sendToBackground } from '@/shared/messaging';
import { addSavedAnswer, patchApplication, removeSavedAnswer, timelineEvent } from '@/shared/storage';
import { createId } from '@/shared/utils/id';
import { say, withBusy } from './feedback';
import { refreshApplication } from './recompute';
import type { ManualAnswer } from './state';
import { store } from './store';

export function addManualAnswer(): void {
  store.set((s) => ({ manualAnswers: [...s.manualAnswers, { id: createId('man'), question: '', answer: '' }] }));
}

export function updateManualAnswer(id: string, patch: Partial<ManualAnswer>): void {
  store.set((s) => ({ manualAnswers: s.manualAnswers.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
}

export function removeManualAnswer(id: string): void {
  store.set((s) => ({ manualAnswers: s.manualAnswers.filter((a) => a.id !== id) }));
}

export async function draftManualAnswer(id: string): Promise<void> {
  const entry = store.get().manualAnswers.find((a) => a.id === id);
  if (!entry) return;
  await withBusy('Drafting the answer…', async () => {
    const { answer } = await sendToBackground('answer:draft', { question: entry.question, job: store.get().detection.job });
    updateManualAnswer(id, { answer });
    if (!answer) say('warning', 'Your profile does not contain what this question asks. Answer it yourself.');
  });
}

export async function saveForReuse(question: string, answer: string): Promise<void> {
  if (!question.trim() || !answer.trim()) {
    say('warning', 'Both the question and the answer are needed to save it.');
    return;
  }
  await addSavedAnswer(question, answer);
  say('success', 'Saved. Matching fields on future forms will be filled with this answer.');
}

export async function removeSaved(id: string): Promise<void> {
  await removeSavedAnswer(id);
}

/** Edits a generated answer of this page's application. */
export async function editGeneratedAnswer(answerId: string, answer: string): Promise<void> {
  const app = store.get().application;
  if (!app) return;
  await patchApplication(app.id, (a) => {
    a.answers = a.answers.map((x) => (x.id === answerId ? { ...x, answer, edited: true } : x));
    a.timeline.push(timelineEvent('edited', 'Edited a screening answer'));
  });
  await refreshApplication();
}

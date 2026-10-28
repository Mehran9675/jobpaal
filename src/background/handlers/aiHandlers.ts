import { draftAnswer, listModels, parseResumeText, testConnection } from '@/shared/ai';
import { getActiveProvider, getAiSettings, getProfile } from '@/shared/storage';
import { assertAiReady, assertTermsAccepted } from '../pipeline/guards';
import type { Handler } from './types';

async function providerById(providerId: string) {
  const ai = await getAiSettings();
  const provider = ai.providers.find((p) => p.id === providerId);
  if (!provider) throw new Error('That AI provider no longer exists.');
  return provider;
}

export const testProviderHandler: Handler<'ai:test'> = async ({ providerId }) => testConnection(await providerById(providerId));

export const listModelsHandler: Handler<'ai:models'> = async ({ providerId }) => ({
  models: await listModels(await providerById(providerId)),
});

export const parseResumeHandler: Handler<'ai:parse-resume'> = async ({ text }) => {
  await assertTermsAccepted();
  await assertAiReady();
  if (!text.trim()) throw new Error('The resume text is empty.');
  return { profile: await parseResumeText(text) };
};

export const draftAnswerHandler: Handler<'answer:draft'> = async ({ question, job, options }) => {
  await assertTermsAccepted();
  await assertAiReady();
  if (!question.trim()) throw new Error('Type the question first.');
  return { answer: await draftAnswer(question, options ?? [], job, await getProfile()) };
};

export const aiStatusHandler: Handler<'ai:status'> = async () => {
  const provider = await getActiveProvider();
  return { connected: Boolean(provider), providerName: provider?.name ?? '', model: provider?.model ?? '' };
};

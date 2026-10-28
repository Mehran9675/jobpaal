import { saveJob } from '@/shared/storage';
import { getOrRunAnalysis } from '../pipeline/analysis';
import { assertAiReady, assertRealDescription, assertTermsAccepted, requireUsableProfile } from '../pipeline/guards';
import { regenerateApplication, rerenderApplication } from '../pipeline/regenerate';
import { runTailorPipeline } from '../pipeline/tailorPipeline';
import { reportProgress } from '../progress';
import type { Handler } from './types';

export const saveJobHandler: Handler<'job:save'> = async ({ job }) => saveJob(job);

export const analyzeJobHandler: Handler<'job:analyze'> = async ({ job, force }, sender) => {
  await assertTermsAccepted();
  await assertAiReady();
  const profile = await requireUsableProfile();
  assertRealDescription(job);
  reportProgress(sender.tab?.id, 'Matching your profile to this job…');
  return getOrRunAnalysis(job, profile, Boolean(force));
};

export const tailorHandler: Handler<'pipeline:tailor'> = async ({ job, form, forceCoverLetter }, sender) =>
  runTailorPipeline({ job, form, forceCoverLetter, tabId: sender.tab?.id });

export const regenerateHandler: Handler<'app:regenerate'> = async ({ applicationId, part }, sender) =>
  regenerateApplication(applicationId, part, sender.tab?.id);

export const renderHandler: Handler<'app:render'> = async ({ applicationId }) => rerenderApplication(applicationId);

import { answerQuestions, tailorResume, writeCoverLetter } from '@/shared/ai';
import { getApplication, saveApplication, timelineEvent } from '@/shared/storage';
import type { Application, ScreeningQuestion } from '@/shared/types';
import { reportProgress } from '../progress';
import { getOrRunAnalysis } from './analysis';
import { assertAiReady, assertRealDescription, assertTermsAccepted, requireUsableProfile } from './guards';
import { renderApplicationFiles } from './renderFiles';

export type RegeneratePart = 'resume' | 'cover-letter' | 'answers' | 'all';

/** Explicit user action: re-runs the AI tasks for one part (or all) and re-renders the files. */
export async function regenerateApplication(applicationId: string, part: RegeneratePart, tabId?: number): Promise<Application> {
  await assertTermsAccepted();
  await assertAiReady();
  const profile = await requireUsableProfile();
  const app = await getApplication(applicationId);
  if (!app) throw new Error('This application no longer exists.');
  assertRealDescription(app.job);

  const analysis = app.analysis ?? (await getOrRunAnalysis(app.job, profile, false));
  app.analysis = analysis;
  const done: string[] = [];

  let resume = app.resume ? (app.resume.edited ?? app.resume.generated) : null;
  if (part === 'resume' || part === 'all' || !resume) {
    reportProgress(tabId, 'Tailoring your resume…');
    resume = await tailorResume(app.job, analysis, profile);
    app.resume = { generated: resume, edited: null };
    done.push('resume');
  }
  if (part === 'cover-letter' || (part === 'all' && app.coverLetter)) {
    reportProgress(tabId, 'Writing the cover letter…');
    app.coverLetter = { generated: await writeCoverLetter(app.job, analysis, profile, resume), edited: null };
    done.push('cover letter');
  }
  if ((part === 'answers' || part === 'all') && app.answers.length) {
    reportProgress(tabId, 'Drafting screening answers…');
    const questions: ScreeningQuestion[] = app.answers.map((a) => ({
      fieldId: a.fieldId ?? a.id,
      frameId: a.frameId ?? 0,
      question: a.question,
      kind: a.kind ?? 'textarea',
      options: a.options ?? [],
      required: false,
    }));
    const fresh = await answerQuestions(questions, app.job, analysis, profile);
    app.answers = app.answers.map((old, i) => ({
      ...old,
      answer: fresh[i]?.answer || old.answer,
      source: 'generated',
      edited: false,
    }));
    done.push('answers');
  }

  app.timeline.push(timelineEvent('regenerated', `Regenerated ${done.join(', ') || 'documents'}`));
  reportProgress(tabId, 'Rendering files…');
  app.documentIds = await renderApplicationFiles(app);
  return saveApplication(app);
}

/** Re-renders files from the current (possibly edited) content. No AI. */
export async function rerenderApplication(applicationId: string): Promise<Application> {
  const app = await getApplication(applicationId);
  if (!app) throw new Error('This application no longer exists.');
  app.documentIds = await renderApplicationFiles(app);
  return saveApplication(app);
}

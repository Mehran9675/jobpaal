import { answerQuestions, tailorResume, writeCoverLetter } from '@/shared/ai';
import { findApplicationByPageKey, getSettings, saveApplication, timelineEvent } from '@/shared/storage';
import type { Application, FormSummary, JobPosting } from '@/shared/types';
import { reportProgress } from '../progress';
import { getOrRunAnalysis } from './analysis';
import { createApplication } from './applicationFactory';
import { assertAiReady, assertRealDescription, assertTermsAccepted, requireUsableProfile } from './guards';
import { renderApplicationFiles } from './renderFiles';

export interface TailorInput {
  job: JobPosting;
  form: FormSummary;
  forceCoverLetter?: boolean;
  tabId?: number;
}

/**
 * Tailor and fill, document part: analysis (reused when stored) → resume → cover letter
 * (only when the form has a cover-letter field or the user asked) → screening answers → files.
 */
export async function runTailorPipeline({ job, form, forceCoverLetter, tabId }: TailorInput): Promise<Application> {
  await assertTermsAccepted();
  await assertAiReady();
  const profile = await requireUsableProfile();
  assertRealDescription(job);
  const settings = await getSettings();

  reportProgress(tabId, 'Analysing the job posting…');
  const analysis = await getOrRunAnalysis(job, profile, false);

  reportProgress(tabId, 'Tailoring your resume…');
  const resume = await tailorResume(job, analysis, profile);

  const wantsLetter = Boolean(forceCoverLetter || settings.alwaysCoverLetter || form.hasCoverLetterField);
  let coverLetter = null;
  if (wantsLetter) {
    reportProgress(tabId, 'Writing the cover letter…');
    coverLetter = await writeCoverLetter(job, analysis, profile, resume);
  }

  let answers: Application['answers'] = [];
  if (form.screeningQuestions.length) {
    reportProgress(tabId, `Drafting ${form.screeningQuestions.length} screening answers…`);
    const drafted = await answerQuestions(form.screeningQuestions, job, analysis, profile);
    answers = drafted.map((answer) => {
      const question = form.screeningQuestions.find((q) => q.fieldId === answer.fieldId);
      return question ? { ...answer, kind: question.kind, options: question.options } : answer;
    });
  }

  const existing = await findApplicationByPageKey(job.pageKey);
  const app = existing ?? createApplication(job, analysis);
  app.job = job;
  app.analysis = analysis;
  app.resume = { generated: resume, edited: null };
  app.coverLetter = coverLetter ? { generated: coverLetter, edited: null } : (existing?.coverLetter ?? null);
  app.answers = answers.length ? answers : app.answers;
  if (app.status === 'draft') app.status = 'ready';
  app.timeline.push(
    timelineEvent(
      existing ? 'regenerated' : 'generated',
      `Generated resume${coverLetter ? ', cover letter' : ''}${answers.length ? `, ${answers.length} answers` : ''} (match ${analysis.score})`,
    ),
  );

  reportProgress(tabId, 'Rendering files…');
  app.documentIds = await renderApplicationFiles(app);
  return saveApplication(app);
}

import { timelineEvent } from '@/shared/storage';
import type { Application, JobAnalysis, JobPosting } from '@/shared/types';
import { createId } from '@/shared/utils/id';

export function createApplication(job: JobPosting, analysis: JobAnalysis | null): Application {
  const now = Date.now();
  return {
    id: createId('app'),
    pageKey: job.pageKey,
    job,
    status: 'draft',
    analysis,
    resume: null,
    coverLetter: null,
    answers: [],
    documentIds: [],
    notes: '',
    timeline: [timelineEvent('created', `Application created for ${job.title || 'this job'}${job.company ? ` at ${job.company}` : ''}`)],
    createdAt: now,
    updatedAt: now,
  };
}

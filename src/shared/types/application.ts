import type { JobAnalysis, JobPosting } from './job';
import type { CoverLetterContent, Editable, ResumeContent, ScreeningAnswer } from './resume';

export type ApplicationStatus =
  | 'draft'
  | 'ready'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'technical'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'no-response';

export const APPLICATION_STATUSES: { id: ApplicationStatus; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'ready', label: 'Ready to apply' },
  { id: 'applied', label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'interview', label: 'Interview' },
  { id: 'technical', label: 'Technical' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'withdrawn', label: 'Withdrawn' },
  { id: 'no-response', label: 'No response' },
];

export interface TimelineEvent {
  id: string;
  at: number;
  type: 'created' | 'status' | 'generated' | 'regenerated' | 'edited' | 'filled' | 'note';
  text: string;
}

export interface Application {
  id: string;
  /** Normalised page URL. Used to find documents for the current page. */
  pageKey: string;
  job: JobPosting;
  status: ApplicationStatus;
  analysis: JobAnalysis | null;
  resume: Editable<ResumeContent> | null;
  coverLetter: Editable<CoverLetterContent> | null;
  answers: ScreeningAnswer[];
  /** Ids of rendered document files (StoredDocument). */
  documentIds: string[];
  notes: string;
  timeline: TimelineEvent[];
  createdAt: number;
  updatedAt: number;
}

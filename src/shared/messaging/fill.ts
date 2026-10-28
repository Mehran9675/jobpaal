import type { AutofillSettings, FieldMapping, Profile, SavedAnswer } from '@/shared/types';

/** A file sent to a frame so it can be attached to an upload field. */
export interface FilePayload {
  documentId: string;
  fileName: string;
  mimeType: string;
  base64: string;
}

export interface FillAnswer {
  question: string;
  answer: string;
  fieldId?: string;
  frameId?: number;
}

/** Everything a frame needs to fill the form fields it owns. */
export interface FillPlan {
  profile: Profile;
  answers: FillAnswer[];
  savedAnswers: SavedAnswer[];
  mappings: FieldMapping[];
  coverLetterText: string;
  files: { resume: FilePayload | null; coverLetter: FilePayload | null };
  options: AutofillSettings;
}

export interface FillReportItem {
  label: string;
  status: 'filled' | 'skipped' | 'failed' | 'attached';
  reason?: string;
}

export interface FillReport {
  frameUrl: string;
  filled: number;
  attached: number;
  skipped: number;
  failed: number;
  items: FillReportItem[];
}

export function emptyFillReport(frameUrl = ''): FillReport {
  return { frameUrl, filled: 0, attached: 0, skipped: 0, failed: 0, items: [] };
}

export function mergeFillReports(reports: FillReport[]): FillReport {
  const merged = emptyFillReport('all');
  for (const report of reports) {
    merged.filled += report.filled;
    merged.attached += report.attached;
    merged.skipped += report.skipped;
    merged.failed += report.failed;
    merged.items.push(...report.items);
  }
  return merged;
}

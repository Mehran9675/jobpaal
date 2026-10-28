import type { DetectionIssue, JobPosting } from '@/shared/types';

export interface JobDetectionResult {
  isJobPage: boolean;
  confidence: number;
  job: JobPosting | null;
  issues: DetectionIssue[];
  hasValidDescription: boolean;
}

export interface KnownSite {
  key: string;
  name: string;
}

/** Fields a reader can provide. */
export type PartialJob = Partial<
  Pick<JobPosting, 'title' | 'company' | 'location' | 'salary' | 'employmentType' | 'description' | 'postedAt'>
>;

/** A named job board / ATS reader. */
export interface SiteAdapter extends KnownSite {
  /** True when the URL / document belongs to this board or ATS. */
  matches(url: URL, doc: Document): boolean;
  /** True when this is a single job posting or application page (not a search / listing page). */
  isJobPage(url: URL, doc: Document): boolean;
  /** Reads what it can; missing fields are left out. */
  extract(doc: Document, url: URL): PartialJob;
}

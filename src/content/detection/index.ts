/**
 * CONTRACT — implemented by the page-reading module. Runs in content scripts (any frame).
 */
import type { DetectionIssue, JobPosting, SiteMapping } from '@/shared/types';

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

/** Reads the job posting on the page: named board/ATS adapter → JSON-LD → site mapping → generic reader. */
export declare function detectJob(doc: Document, url: string, mapping: SiteMapping | null): JobDetectionResult;
/** Which known board / ATS this URL belongs to (or null). */
export declare function identifySite(url: string, doc: Document): KnownSite | null;

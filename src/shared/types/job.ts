/** Where a piece of job data came from. Shown to the user in the overlay. */
export type FieldSource =
  | 'structured' // JSON-LD / schema.org JobPosting
  | 'adapter' // a named job board / ATS reader
  | 'generic' // generic page reader
  | 'guide' // per-site field guide mapping
  | 'picked' // click-to-pick
  | 'pasted' // paste box
  | 'clipboard' // one-click clipboard read
  | 'recent' // chosen from recent jobs
  | 'manual'; // typed by the user

export type JobField = 'title' | 'company' | 'location' | 'salary' | 'description';

export interface JobPosting {
  /** Stable id derived from the normalised page URL. */
  id: string;
  url: string;
  /** Normalised URL used to match the page to stored applications. */
  pageKey: string;
  host: string;
  /** Display name of the board / ATS, or the host. */
  siteName: string;
  /** Known board / ATS key, or 'generic'. */
  atsKey: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  employmentType: string;
  description: string;
  requirements: string[];
  keywords: string[];
  postedAt: string;
  sources: Partial<Record<JobField, FieldSource>>;
  detectedAt: number;
}

export type ScreeningFieldKind = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';

export interface ScreeningQuestion {
  /** Field id within the page (stable for the session). */
  fieldId: string;
  /** Frame that owns the field (0 = top). */
  frameId: number;
  question: string;
  kind: ScreeningFieldKind;
  options: string[];
  required: boolean;
  maxLength?: number;
}

export interface FormSummary {
  hasForm: boolean;
  fieldCount: number;
  fileInputCount: number;
  hasResumeUpload: boolean;
  hasCoverLetterField: boolean;
  /** 'upload' if the cover letter field is a file input, 'text' for a text area. */
  coverLetterFieldKind: 'upload' | 'text' | null;
  screeningQuestions: ScreeningQuestion[];
}

export interface DetectionIssue {
  field: JobField | 'form' | 'page';
  message: string;
}

export interface PageDetection {
  url: string;
  pageKey: string;
  isJobPage: boolean;
  /** True when the user forced this exact page to be treated as a job page. */
  forced: boolean;
  confidence: number;
  job: JobPosting | null;
  form: FormSummary;
  issues: DetectionIssue[];
  /** True when description is real prose (passed the prose validator). */
  hasValidDescription: boolean;
}

export type MatchRecommendation = 'strong match' | 'good match' | 'stretch' | 'weak match';

export interface JobAnalysis {
  seniority: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  atsKeywords: string[];
  cultureSignals: string[];
  redFlags: string[];
  summary: string;
  mustProveThemes: string[];
  score: number;
  recommendation: MatchRecommendation;
  reasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
  analyzedAt: number;
  /** Hash of the description the analysis was made from, so it can be reused safely. */
  descriptionHash: string;
  providerId: string;
}

/** A job stored for reuse (recent jobs list, analysis cache). */
export interface StoredJob {
  job: JobPosting;
  analysis: JobAnalysis | null;
  lastUsedAt: number;
}

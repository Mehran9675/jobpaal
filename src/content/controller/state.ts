import { createDefaultSettings } from '@/shared/defaults/settings';
import type { FillReport, FrameJobDetection, PickPurpose } from '@/shared/messaging';
import type {
  Application,
  FieldSource,
  FormSummary,
  JobAnalysis,
  JobField,
  JobPosting,
  PageDetection,
  SavedAnswer,
  Settings,
  SiteMapping,
  StoredDocument,
} from '@/shared/types';

export type OverlayTool = 'paste' | 'recent' | 'guide' | null;

export interface OverlayMessage {
  tone: 'info' | 'success' | 'warning' | 'danger';
  text: string;
}

/** Values the user supplied for this page (picked, pasted, chosen from recent jobs). */
export interface JobOverride {
  fields: Partial<Pick<JobPosting, JobField>>;
  sources: Partial<Record<JobField, FieldSource>>;
}

export interface ManualAnswer {
  id: string;
  question: string;
  answer: string;
}

export interface OverlayState {
  url: string;
  pageKey: string;
  host: string;
  /** Job as read from the page (top frame or an embedded frame). */
  detected: FrameJobDetection | null;
  form: FormSummary;
  override: JobOverride;
  /** Effective detection after applying the user's overrides. */
  detection: PageDetection;
  forced: boolean;
  settings: Settings;
  mapping: SiteMapping | null;
  application: Application | null;
  documents: StoredDocument[];
  analysis: JobAnalysis | null;
  savedAnswers: SavedAnswer[];
  manualAnswers: ManualAnswer[];
  panelOpen: boolean;
  tool: OverlayTool;
  picking: PickPurpose | null;
  busy: string | null;
  message: OverlayMessage | null;
  lastFill: FillReport | null;
  aiReady: boolean;
  providerName: string;
  termsAccepted: boolean;
  profileReady: boolean;
}

export function emptyForm(): FormSummary {
  return {
    hasForm: false,
    fieldCount: 0,
    fileInputCount: 0,
    hasResumeUpload: false,
    hasCoverLetterField: false,
    coverLetterFieldKind: null,
    screeningQuestions: [],
  };
}

export function emptyDetection(url: string, pageKey: string): PageDetection {
  return {
    url,
    pageKey,
    isJobPage: false,
    forced: false,
    confidence: 0,
    job: null,
    form: emptyForm(),
    issues: [],
    hasValidDescription: false,
  };
}

export function initialState(url: string, pageKey: string, host: string): OverlayState {
  return {
    url,
    pageKey,
    host,
    detected: null,
    form: emptyForm(),
    override: { fields: {}, sources: {} },
    detection: emptyDetection(url, pageKey),
    forced: false,
    settings: createDefaultSettings(),
    mapping: null,
    application: null,
    documents: [],
    analysis: null,
    savedAnswers: [],
    manualAnswers: [],
    panelOpen: false,
    tool: null,
    picking: null,
    busy: null,
    message: null,
    lastFill: null,
    aiReady: false,
    providerName: '',
    termsAccepted: false,
    profileReady: false,
  };
}

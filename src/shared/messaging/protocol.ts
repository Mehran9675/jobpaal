import type {
  Application,
  DetectionIssue,
  SiteMapping,
  ElementLocator,
  FormSummary,
  JobAnalysis,
  JobField,
  JobPosting,
  PageDetection,
  Profile,
  ProfileKey,
  StoredJob,
} from '@/shared/types';
import type { FillPlan, FilePayload } from './fill';

/** Requests handled by the background script. `R` is the response type. */
export interface BackgroundRequests {
  'job:save': { req: { job: JobPosting }; res: StoredJob };
  /** Runs the analysis unless one for the same description exists and `force` is false. */
  'job:analyze': { req: { job: JobPosting; force?: boolean }; res: JobAnalysis };
  /** Full pipeline: analysis (reused) → resume → cover letter (if needed) → answers → render files. */
  'pipeline:tailor': { req: { job: JobPosting; form: FormSummary; forceCoverLetter?: boolean }; res: Application };
  'app:regenerate': {
    req: { applicationId: string; part: 'resume' | 'cover-letter' | 'answers' | 'all' };
    res: Application;
  };
  /** Re-render files from (possibly edited) content without AI. */
  'app:render': { req: { applicationId: string }; res: Application };
  'answer:draft': { req: { question: string; job: JobPosting | null; options?: string[] }; res: { answer: string } };
  'ai:test': { req: { providerId: string }; res: { ok: boolean; message: string } };
  'ai:models': { req: { providerId: string }; res: { models: string[] } };
  'ai:parse-resume': { req: { text: string }; res: { profile: Partial<Profile> } };
  'ai:status': { req: Record<string, never>; res: { connected: boolean; providerName: string; model: string } };
  'doc:payload': { req: { documentId: string }; res: FilePayload };
  'doc:open': { req: { documentId: string }; res: { ok: true } };
  'doc:download': { req: { documentId: string }; res: { ok: true } };
  'options:open': { req: { section?: string }; res: { ok: true } };
  'sidepanel:open': { req: Record<string, never>; res: { ok: boolean } };
  /** Sent by a content script: relays a frame request to every frame of the sender's tab. */
  'frames:broadcast': { req: { message: FrameRequest }; res: { frameId: number; result: unknown }[] };
  /** Sent by a content script: relays a frame request to one frame of the sender's tab. */
  'frames:send': { req: { frameId: number; message: FrameRequest }; res: unknown };
  /** Sent by a sub-frame content script: forwards an event to the top frame of its tab. */
  'frames:toTop': { req: { event: TopFrameEvent }; res: { ok: true } };
  'linkedin:import': { req: { profile: Partial<Profile> }; res: { ok: true } };
}

export type BackgroundRequestType = keyof BackgroundRequests;

export type BackgroundMessage = {
  [K in BackgroundRequestType]: { channel: 'bg'; type: K; payload: BackgroundRequests[K]['req'] };
}[BackgroundRequestType];

/** Requests from the popup / side panel / background to the top-frame content script. */
export interface ContentRequests {
  'content:getState': { req: Record<string, never>; res: ContentState };
  'content:tailorAndFill': { req: Record<string, never>; res: { ok: boolean; message: string } };
  'content:fill': { req: Record<string, never>; res: { ok: boolean; message: string } };
  'content:match': { req: Record<string, never>; res: { ok: boolean; message: string } };
  'content:setForced': { req: { forced: boolean }; res: ContentState };
  /** Opens the overlay, optionally at a specific tool. */
  'content:openOverlay': { req: { tool?: 'pick' | 'paste' | 'recent' | 'guide' }; res: { ok: true } };
  'content:refresh': { req: Record<string, never>; res: ContentState };
  'content:scanLinkedIn': { req: Record<string, never>; res: { profile: Partial<Profile> | null; message: string } };
  'content:useJob': { req: { job: JobPosting }; res: ContentState };
  'content:pasteDescription': { req: { text: string; source: 'pasted' | 'clipboard' }; res: { ok: boolean; message: string } };
}

export type ContentRequestType = keyof ContentRequests;

export type ContentMessage = {
  [K in ContentRequestType]: { channel: 'content'; type: K; payload: ContentRequests[K]['req'] };
}[ContentRequestType];

/** A snapshot of the page as the content script sees it. Shown in popup / side panel. */
export interface ContentState {
  detection: PageDetection;
  overlayVisible: boolean;
  overlayEnabled: boolean;
  forced: boolean;
  applicationId: string | null;
  busy: string | null;
}

/** Requests sent to every frame (or one frame) of a tab. */
export type FrameRequest =
  | { kind: 'frame:scan'; mapping: SiteMapping | null }
  | { kind: 'frame:fill'; plan: FillPlan }
  | { kind: 'frame:highlightClear' }
  | { kind: 'frame:fillField'; fieldId: string; value: string }
  | { kind: 'frame:attach'; fieldId: string | null; target: 'resume' | 'cover-letter' | 'any'; file: FilePayload }
  | { kind: 'frame:pickStart'; purpose: PickPurpose }
  | { kind: 'frame:pickStop' };

export type PickPurpose =
  | { type: 'job-field'; field: JobField }
  | { type: 'form-field'; profileKey?: ProfileKey }
  | { type: 'send-answer'; text: string; question: string }
  | { type: 'upload-field'; documentId: string };

/** Result of `frame:scan` in one frame. */
export interface FrameScanResult {
  frameId: number;
  frameUrl: string;
  form: FormSummary;
  /** Job read inside this frame (embedded job boards often live in iframes). */
  detection: FrameJobDetection | null;
}

export interface FrameJobDetection {
  isJobPage: boolean;
  confidence: number;
  job: JobPosting | null;
  issues: DetectionIssue[];
  hasValidDescription: boolean;
}

/** Events a sub-frame forwards to the top frame (where the overlay lives). */
export type TopFrameEvent =
  | { kind: 'picked'; purpose: PickPurpose; locator: ElementLocator; text: string; fieldId: string | null; frameUrl: string }
  | { kind: 'pickCancelled' }
  | { kind: 'fieldFilled'; label: string };

export type ResponseOf<K extends BackgroundRequestType> = BackgroundRequests[K]['res'];
export type ContentResponseOf<K extends ContentRequestType> = ContentRequests[K]['res'];

/** All responses are wrapped so errors cross the message boundary intact. */
export type Envelope<T> = { ok: true; data: T } | { ok: false; error: string };

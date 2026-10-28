/**
 * CONTRACT — implemented by the documents module. Public API of src/shared/documents.
 * Renderers must work in a service worker (no DOM): pdf-lib, docx, string builders only.
 */
import type {
  CoverLetterContent,
  DesignSettings,
  OutputFormat,
  ResumeContent,
  ScreeningAnswer,
  TemplateId,
} from '@/shared/types';

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
}

export declare const TEMPLATES: TemplateInfo[];
export declare const ACCENT_PRESETS: string[];
export declare function renderResume(content: ResumeContent, design: DesignSettings, format: OutputFormat): Promise<Uint8Array>;
export declare function renderCoverLetter(letter: CoverLetterContent, header: ResumeContent, design: DesignSettings, format: OutputFormat): Promise<Uint8Array>;
export declare function renderAnswers(answers: ScreeningAnswer[], header: ResumeContent, design: DesignSettings, format: OutputFormat): Promise<Uint8Array>;
/** Standalone HTML document string (used for previews in the management page). */
export declare function renderResumeHtml(content: ResumeContent, design: DesignSettings): string;
export declare function renderCoverLetterHtml(letter: CoverLetterContent, header: ResumeContent, design: DesignSettings): string;
export declare function buildFileName(pattern: string, person: { firstName: string; lastName: string }, kind: 'resume' | 'cover-letter' | 'answers', ext: string): string;
export declare function resumeToJsonResume(content: ResumeContent): Record<string, unknown>;

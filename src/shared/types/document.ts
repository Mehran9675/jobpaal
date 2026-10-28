import type { ResumeSectionKey } from './resume';

export type DocumentKind = 'resume' | 'cover-letter' | 'answers' | 'uploaded';

export type OutputFormat = 'pdf' | 'docx' | 'html' | 'md' | 'txt' | 'json';

export const OUTPUT_FORMATS: { id: OutputFormat; label: string; mime: string; ext: string }[] = [
  { id: 'pdf', label: 'PDF', mime: 'application/pdf', ext: 'pdf' },
  {
    id: 'docx',
    label: 'Word (DOCX)',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: 'docx',
  },
  { id: 'html', label: 'HTML', mime: 'text/html', ext: 'html' },
  { id: 'md', label: 'Markdown', mime: 'text/markdown', ext: 'md' },
  { id: 'txt', label: 'Plain text', mime: 'text/plain', ext: 'txt' },
  { id: 'json', label: 'JSON Resume', mime: 'application/json', ext: 'json' },
];

export interface StoredDocument {
  id: string;
  applicationId: string | null;
  kind: DocumentKind;
  format: OutputFormat | 'other';
  fileName: string;
  mimeType: string;
  size: number;
  source: 'generated' | 'uploaded';
  createdAt: number;
  updatedAt: number;
  /** Optional user label for uploaded files. */
  label: string;
}

/** File bytes are stored separately from metadata so lists stay small. */
export interface StoredDocumentData {
  id: string;
  base64: string;
}

export type TemplateId = 'classic' | 'modern' | 'minimal' | 'executive' | 'compact' | 'technical';

export type Density = 'comfortable' | 'normal' | 'compact';

export type PageSize = 'A4' | 'Letter';

export interface CustomFont {
  name: string;
  regularBase64: string;
  boldBase64: string;
}

export interface DesignSettings {
  template: TemplateId;
  accent: string;
  density: Density;
  pageSize: PageSize;
  sectionOrder: ResumeSectionKey[];
  hiddenSections: ResumeSectionKey[];
  showPhoto: boolean;
  customFont: CustomFont | null;
  /** Formats generated for each tailoring run. The first is the primary (attached) file. */
  outputFormats: OutputFormat[];
}

export interface FileNamingSettings {
  /** Tokens: {first} {last} {kind} {date}. Never the employer or role. */
  pattern: string;
}

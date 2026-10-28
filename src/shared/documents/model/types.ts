/**
 * Format-neutral document model. Resume, cover letter and answers content is first
 * converted into this shape; each renderer (PDF, DOCX, HTML, Markdown, text) draws it.
 */
export interface DocLink {
  label: string;
  url: string;
}

export interface DocHeader {
  name: string;
  headline: string;
  /** Email, phone, location (plain items). */
  contact: string[];
  links: DocLink[];
  /** Data URL, already filtered by design.showPhoto. */
  photo: string;
}

export interface DocEntry {
  type: 'entry';
  title: string;
  subtitle: string;
  date: string;
  location: string;
  /** Free text; may contain line breaks. */
  text: string;
  bullets: string[];
  url: string;
}

export type DocBlock =
  | { type: 'paragraph'; text: string; style: 'normal' | 'bold' | 'muted' }
  | DocEntry
  | { type: 'skills'; groups: { name: string; items: string[] }[] }
  | { type: 'inline'; items: string[] }
  | { type: 'qa'; question: string; answer: string };

export interface DocSection {
  key: string;
  /** Empty title = no heading (cover letter body). */
  title: string;
  blocks: DocBlock[];
}

export interface DocModel {
  kind: 'resume' | 'cover-letter' | 'answers';
  /** Document title for metadata / <title>, e.g. "Jane Doe – Resume". */
  title: string;
  header: DocHeader;
  /** Date line under the header (letters only). */
  dateLine: string;
  sections: DocSection[];
}

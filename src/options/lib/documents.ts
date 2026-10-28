import type { Application, DocumentKind, OutputFormat, StoredDocument } from '@/shared/types';
import { OUTPUT_FORMATS } from '@/shared/types';

export type RegeneratePart = 'resume' | 'cover-letter' | 'answers';

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  resume: 'Resume',
  'cover-letter': 'Cover letter',
  answers: 'Answers',
  uploaded: 'Uploaded',
};

/** Which regenerate part a generated document belongs to (null for uploaded files). */
export function regeneratePartForKind(kind: DocumentKind): RegeneratePart | null {
  switch (kind) {
    case 'resume':
      return 'resume';
    case 'cover-letter':
      return 'cover-letter';
    case 'answers':
      return 'answers';
    default:
      return null;
  }
}

export interface DocumentFilter {
  kind: DocumentKind | 'all';
  format: StoredDocument['format'] | 'all';
  source: StoredDocument['source'] | 'all';
  search: string;
}

export const EMPTY_DOCUMENT_FILTER: DocumentFilter = { kind: 'all', format: 'all', source: 'all', search: '' };

/** Filters documents by kind, format, source and a search over the file name, label and application. */
export function filterDocuments(
  docs: StoredDocument[],
  filter: DocumentFilter,
  appsById: Record<string, Pick<Application, 'job'>> = {},
): StoredDocument[] {
  const query = filter.search.trim().toLowerCase();
  return docs.filter((doc) => {
    if (filter.kind !== 'all' && doc.kind !== filter.kind) return false;
    if (filter.format !== 'all' && doc.format !== filter.format) return false;
    if (filter.source !== 'all' && doc.source !== filter.source) return false;
    if (!query) return true;
    const app = doc.applicationId ? appsById[doc.applicationId] : undefined;
    const haystack = [doc.fileName, doc.label, app?.job.title, app?.job.company, app?.job.siteName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

/** Detects the output format of an uploaded file from its name. */
export function formatFromFileName(fileName: string): OutputFormat | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'markdown') return 'md';
  if (ext === 'text') return 'txt';
  if (ext === 'htm') return 'html';
  const match = OUTPUT_FORMATS.find((f) => f.ext === ext);
  return match ? match.id : 'other';
}

export function mimeForFormat(format: StoredDocument['format'], fallback = 'application/octet-stream'): string {
  return OUTPUT_FORMATS.find((f) => f.id === format)?.mime ?? fallback;
}

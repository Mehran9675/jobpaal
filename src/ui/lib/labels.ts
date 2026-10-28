import type { DocumentKind, FieldSource, MatchRecommendation, OutputFormat } from '@/shared/types';

export const SOURCE_LABELS: Record<FieldSource, string> = {
  structured: 'structured job data',
  adapter: 'site reader',
  generic: 'page text',
  guide: 'your field guide',
  picked: 'picked on page',
  pasted: 'pasted',
  clipboard: 'clipboard',
  recent: 'recent job',
  manual: 'typed',
};

export const KIND_LABELS: Record<DocumentKind, string> = {
  resume: 'Resume',
  'cover-letter': 'Cover letter',
  answers: 'Answers',
  uploaded: 'Uploaded file',
};

export const FORMAT_LABELS: Record<OutputFormat | 'other', string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  html: 'HTML',
  md: 'Markdown',
  txt: 'Text',
  json: 'JSON',
  other: 'File',
};

export function recommendationTone(rec: MatchRecommendation): 'success' | 'info' | 'warning' | 'danger' {
  switch (rec) {
    case 'strong match':
      return 'success';
    case 'good match':
      return 'info';
    case 'stretch':
      return 'warning';
    default:
      return 'danger';
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) return String(tokens);
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(tokens < 10_000 ? 1 : 0)}k`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

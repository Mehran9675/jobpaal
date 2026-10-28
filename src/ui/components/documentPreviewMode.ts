import type { StoredDocument } from '@/shared/types';

export type PreviewMode = 'iframe' | 'text' | 'none';

/** How a stored document can be previewed inline. */
export function previewModeFor(format: StoredDocument['format']): PreviewMode {
  if (format === 'pdf' || format === 'html') return 'iframe';
  if (format === 'txt' || format === 'md' || format === 'json') return 'text';
  return 'none';
}

import { dayKey } from '@/shared/utils/date';

export const DEFAULT_FILE_NAME_PATTERN = '{first}-{last}-{kind}';

function sanitize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^[-.]+|[-.]+$/g, '');
}

/**
 * Builds a neutral download file name.
 *
 * Tokens: {first} {last} {kind} {date} (YYYY-MM-DD, local). Any other {token} is removed.
 * The result only contains [A-Za-z0-9._-]; whitespace and other characters become single
 * hyphens and leading/trailing hyphens are stripped. Falls back to the kind when empty.
 *
 * Privacy: this function is never given the employer or role, so file names cannot leak the
 * target job (e.g. "Jane-Doe-resume.pdf").
 */
export function buildFileName(
  pattern: string,
  person: { firstName: string; lastName: string },
  kind: 'resume' | 'cover-letter' | 'answers',
  ext: string,
): string {
  const source = (pattern ?? '').trim() || DEFAULT_FILE_NAME_PATTERN;
  const values: Record<string, string> = {
    first: person.firstName ?? '',
    last: person.lastName ?? '',
    kind,
    date: dayKey(),
  };
  const filled = source.replace(/\{([^{}]*)\}/g, (_, token: string) => values[token.trim().toLowerCase()] ?? '');
  const base = sanitize(filled) || kind;
  const extension = sanitize((ext ?? '').replace(/^\.+/, ''));
  return extension ? `${base}.${extension}` : base;
}

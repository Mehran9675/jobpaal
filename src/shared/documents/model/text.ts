/** Normalises line endings and trims; keeps single line breaks. */
export function cleanText(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

/** Splits text into paragraphs on blank lines. Single line breaks stay inside a paragraph. */
export function splitParagraphs(text: string): string[] {
  return cleanText(text)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function nonEmpty(values: (string | null | undefined)[]): string[] {
  return values.map((v) => (v ?? '').trim()).filter(Boolean);
}

/** Display form of a URL: no scheme, no "www.", no trailing slash. */
export function displayUrl(url: string): string {
  return url
    .trim()
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}

/** Adds https:// to bare URLs so links are clickable. Returns '' for unsafe schemes. */
export function hrefFor(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return '';
  return 'https://' + trimmed;
}

/** Long English date, e.g. "October 28, 2026". */
export function longDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

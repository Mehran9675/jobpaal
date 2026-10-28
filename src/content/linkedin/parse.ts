const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

/** "Jan 2020" → "2020-01", "2019" → "2019", "Present" → "". */
export function parseLinkedInDate(text: string): string {
  const value = (text ?? '').trim();
  const match = /([A-Za-z]{3,9})\.?\s+(\d{4})/.exec(value);
  if (match) {
    const month = MONTHS[match[1].toLowerCase().slice(0, 4)] ?? MONTHS[match[1].toLowerCase().slice(0, 3)];
    if (month) return `${match[2]}-${String(month).padStart(2, '0')}`;
    return match[2];
  }
  const year = /(\d{4})/.exec(value);
  return year ? year[1] : '';
}

export interface DateRange {
  start: string;
  end: string;
  current: boolean;
}

const RANGE_RE = /^((?:[A-Za-z]{3,9}\.?\s+)?\d{4})\s*[-–—]\s*((?:[A-Za-z]{3,9}\.?\s+)?\d{4}|present|now|today|current)/i;

/** "Jan 2020 - Present · 3 yrs" → { start: '2020-01', end: '', current: true }. */
export function parseDateRange(text: string): DateRange | null {
  const value = (text ?? '').split('·')[0].trim();
  const match = RANGE_RE.exec(value);
  if (match) {
    const current = /present|now|today|current/i.test(match[2]);
    return { start: parseLinkedInDate(match[1]), end: current ? '' : parseLinkedInDate(match[2]), current };
  }
  const single = /^((?:[A-Za-z]{3,9}\.?\s+)?\d{4})$/.exec(value);
  if (single) return { start: parseLinkedInDate(single[1]), end: parseLinkedInDate(single[1]), current: false };
  return null;
}

export function isDateLine(text: string): boolean {
  return !!parseDateRange(text);
}

/** "San Francisco, California, United States" → parts. */
export function splitLocation(text: string): { city: string; region: string; country: string } {
  const parts = (text ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 3) return { city: parts[0], region: parts[1], country: parts.slice(2).join(', ') };
  if (parts.length === 2) return { city: parts[0], region: '', country: parts[1] };
  return { city: '', region: '', country: parts[0] ?? '' };
}

/** Removes the "· Full-time" suffix from "Acme · Full-time". */
export function stripMeta(text: string): { main: string; meta: string } {
  const [main, ...rest] = (text ?? '').split(/\s+·\s+/);
  return { main: (main ?? '').trim(), meta: rest.join(' · ').trim() };
}

const EMPLOYMENT = /^(full-time|part-time|self-employed|freelance|contract|internship|apprenticeship|seasonal|temporary)$/i;

export function isEmploymentType(text: string): boolean {
  return EMPLOYMENT.test(text.trim());
}

/** Duration lines like "3 yrs 2 mos". */
export function isDurationLine(text: string): boolean {
  return /^\d+\s+(yrs?|years?|mos?|months?)(\s+\d+\s+(mos?|months?))?$/i.test(text.trim());
}

/** Location-like lines ("Berlin, Germany", "Remote", "London Area · Hybrid"). */
export function isLocationLine(text: string): boolean {
  const value = text.trim();
  if (value.length > 80) return false;
  if (/\b(remote|on-site|hybrid)\b/i.test(value)) return true;
  return /^[A-Z][\p{L}.' -]+(,\s*[\p{L}.' -]+){1,3}(\s+·\s+.+)?$/u.test(value) || /\barea$/i.test(value);
}

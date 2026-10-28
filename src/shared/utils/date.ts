/** YYYY-MM-DD in local time. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats YYYY-MM / YYYY / free text profile dates for documents. */
export function formatResumeDate(value: string): string {
  const trimmed = (value ?? '').trim();
  const match = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(trimmed);
  if (match) {
    const month = Number(match[2]);
    return month >= 1 && month <= 12 ? `${MONTHS[month - 1]} ${match[1]}` : match[1];
  }
  return trimmed;
}

export function formatDateRange(start: string, end: string, current: boolean): string {
  const from = formatResumeDate(start);
  const to = current ? 'Present' : formatResumeDate(end);
  if (from && to) return `${from} – ${to}`;
  return from || to;
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

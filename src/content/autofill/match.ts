import { normalizeForCompare } from '@/shared/utils/text';

const STOP = new Set(
  'a an the and or of to in on for with at by from is are be you your do does did have has we our this that it as if please what which who how when where why can could would will any'.split(' '),
);

export function tokens(text: string): string[] {
  return normalizeForCompare(text ?? '')
    .replace(/[.]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Token overlap between two questions / labels: |A∩B| / max(|A|, |B|), 1 for equal texts. */
export function similarity(a: string, b: string): number {
  const na = normalizeForCompare(a ?? '');
  const nb = normalizeForCompare(b ?? '');
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.max(ta.size, tb.size);
}

/** The best item whose text is at least `threshold` similar to `text`. */
export function bestMatch<T>(text: string, items: T[], getText: (item: T) => string, threshold: number): T | null {
  let best: T | null = null;
  let bestScore = threshold;
  for (const item of items) {
    const score = similarity(text, getText(item));
    if (score >= bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

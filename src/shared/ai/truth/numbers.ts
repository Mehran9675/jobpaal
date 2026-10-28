/**
 * Numbers / metrics guard: rewritten text may only contain numbers that appear in its source.
 * Understands 40%, 40 percent, $1.2M, 1,200,000, 3x, 10k, 2 million, ranges (10-20) and number words.
 */

export interface NumberToken {
  raw: string;
  value: number;
  kind: 'plain' | 'percent' | 'times';
}

const WORDS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  dozen: 12, dozens: 12, hundreds: 100, thousands: 1000, millions: 1_000_000,
};

const MULTIPLIER_WORDS: Record<string, number> = { doubled: 2, tripled: 3, quadrupled: 4, tenfold: 10, halved: 0.5 };

const NUMBER_RE =
  /(?<![\w.])([$€£¥₹]\s?)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?:\s?(%|percent\b|per cent\b|x\b|×|k\b|m\b|mm\b|bn\b|b\b|million\b|billion\b|thousand\b|\+|st\b|nd\b|rd\b|th\b))?/gi;

function suffixInfo(suffix: string): { multiplier: number; kind: NumberToken['kind'] } {
  const s = suffix.toLowerCase().trim();
  if (s === '%' || s === 'percent' || s === 'per cent') return { multiplier: 1, kind: 'percent' };
  if (s === 'x' || s === '×') return { multiplier: 1, kind: 'times' };
  if (s === 'k' || s === 'thousand') return { multiplier: 1_000, kind: 'plain' };
  if (s === 'm' || s === 'mm' || s === 'million') return { multiplier: 1_000_000, kind: 'plain' };
  if (s === 'b' || s === 'bn' || s === 'billion') return { multiplier: 1_000_000_000, kind: 'plain' };
  return { multiplier: 1, kind: 'plain' };
}

/** All numeric claims in a text. */
export function extractNumbers(text: string): NumberToken[] {
  const tokens: NumberToken[] = [];
  for (const m of (text ?? '').matchAll(NUMBER_RE)) {
    const base = Number.parseFloat(`${m[2].replace(/,/g, '')}${m[3] ? `.${m[3]}` : ''}`);
    if (!Number.isFinite(base)) continue;
    const { multiplier, kind } = suffixInfo(m[4] ?? '');
    tokens.push({ raw: m[0].trim(), value: Math.round(base * multiplier * 1000) / 1000, kind });
  }
  for (const m of (text ?? '').matchAll(/\b([a-z]+)\b/gi)) {
    const word = m[1].toLowerCase();
    if (word in WORDS) tokens.push({ raw: m[1], value: WORDS[word], kind: 'plain' });
    else if (word in MULTIPLIER_WORDS) tokens.push({ raw: m[1], value: MULTIPLIER_WORDS[word], kind: 'times' });
  }
  return tokens;
}

/** Numbers in `text` that its `source` does not support. */
export function findUnsupportedNumbers(text: string, source: string): string[] {
  const available = extractNumbers(source);
  return extractNumbers(text)
    .filter((n) => !available.some((s) => s.value === n.value && (n.kind === 'plain' || s.kind === n.kind)))
    .map((n) => n.raw);
}

export function passesNumberGuard(text: string, source: string): boolean {
  return findUnsupportedNumbers(text, source).length === 0;
}

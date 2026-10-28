import { wordCount } from '@/shared/utils/text';

export interface ProseCheck {
  ok: boolean;
  reason: string;
  words: number;
}

const BOILERPLATE = [
  /^(apply|apply now|sign in|log in|save job|share|report job|easy apply)$/i,
  /cookie(s)? (policy|settings|preferences)/i,
  /^select( an)? option/i,
  /^(yes|no|n\/a|none|other)$/i,
];

/**
 * A job description only counts when it reads like prose. Labels, select options,
 * navigation text and short snippets are rejected so the extension never tailors
 * against nonsense.
 */
export function checkJobDescriptionProse(raw: string): ProseCheck {
  const text = (raw ?? '').replace(/\s+/g, ' ').trim();
  const words = wordCount(text);
  if (!text) return { ok: false, reason: 'No job description text was found.', words };
  if (words < 60) return { ok: false, reason: `Only ${words} words, too short to be a job description.`, words };
  if (BOILERPLATE.some((re) => re.test(text))) return { ok: false, reason: 'Looks like page controls, not a description.', words };

  const sentences = text.split(/(?<=[.!?;:])\s+|\s[•·▪◦‣-]\s/).filter((s) => wordCount(s) >= 4);
  if (sentences.length < 3) return { ok: false, reason: 'Does not contain enough sentences to be a description.', words };

  const tokens = text.split(/\s+/);
  const lowercaseWords = tokens.filter((t) => /^[a-z][a-z'’-]*[.,;:!?)]?$/.test(t)).length;
  if (lowercaseWords / tokens.length < 0.35) {
    return { ok: false, reason: 'Reads like a list of labels or options, not prose.', words };
  }

  const functionWords = text.match(/\b(the|and|to|of|a|an|with|for|in|you|we|our|will|is|are|be|on|as|this|your)\b/gi);
  if (!functionWords || functionWords.length / words < 0.08) {
    return { ok: false, reason: 'Reads like keywords, not sentences.', words };
  }

  const unique = new Set(tokens.map((t) => t.toLowerCase()));
  if (unique.size / tokens.length < 0.25) return { ok: false, reason: 'Text is highly repetitive.', words };

  return { ok: true, reason: '', words };
}

export function isJobDescriptionProse(text: string): boolean {
  return checkJobDescriptionProse(text).ok;
}

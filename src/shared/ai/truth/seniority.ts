/** Seniority guard: seniority words may only appear when the user's own data contains them. */

const SENIORITY: { key: string; pattern: RegExp }[] = [
  { key: 'intern', pattern: /\bintern(?:ship)?s?\b/i },
  { key: 'junior', pattern: /\b(?:junior|jr)\b/i },
  { key: 'mid-level', pattern: /\bmid[\s-]?(?:level|senior)\b/i },
  { key: 'senior', pattern: /\b(?:senior|sr)\b/i },
  { key: 'staff', pattern: /\bstaff\b/i },
  { key: 'principal', pattern: /\bprincipal\b/i },
  { key: 'lead', pattern: /\blead\b/i },
  { key: 'head', pattern: /\bhead\b/i },
  { key: 'manager', pattern: /\bmanagers?\b/i },
  { key: 'director', pattern: /\bdirectors?\b/i },
  { key: 'vp', pattern: /\b(?:vp|svp|evp|avp|vice[\s-]+president)\b/i },
  { key: 'chief', pattern: /\b(?:chief|cto|ceo|cfo|coo|cio|cpo|cmo|ciso)\b/i },
  { key: 'architect', pattern: /\barchitects?\b/i },
];

export function seniorityTerms(text: string): string[] {
  return SENIORITY.filter((s) => s.pattern.test(text ?? '')).map((s) => s.key);
}

/** Seniority words in `text` that do not appear in `allowedText`. */
export function findUnsupportedSeniority(text: string, allowedText: string): string[] {
  const allowed = new Set(seniorityTerms(allowedText));
  return seniorityTerms(text).filter((key) => !allowed.has(key));
}

export function passesSeniorityGuard(text: string, allowedText: string): boolean {
  return findUnsupportedSeniority(text, allowedText).length === 0;
}

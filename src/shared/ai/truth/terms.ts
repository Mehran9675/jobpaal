/** Term matching that understands tech names like C++, C#, Node.js and .NET. */

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Short or everyday-word terms are matched with their exact casing ("Go" the language, not "go"). */
const AMBIGUOUS = new Set([
  'go', 'rust', 'swift', 'spark', 'dart', 'ruby', 'express', 'spring', 'make', 'chef', 'puppet', 'salt',
  'ant', 'hive', 'pig', 'storm', 'flask', 'julia', 'elm', 'scheme', 'crystal', 'lean', 'basic', 'shell',
  'excel', 'word', 'access', 'teams', 'slack', 'notion', 'linear', 'echo', 'nest', 'next', 'ember',
  'backbone', 'mercury', 'jest', 'vault', 'consul', 'helm', 'beam', 'pulse', 'unity', 'drive',
]);

export function isAmbiguousTerm(term: string): boolean {
  const t = term.trim();
  return t.length <= 2 || AMBIGUOUS.has(t.toLowerCase());
}

/** Word-boundary aware regex for a term; tolerates a plural "s". */
export function termRegex(term: string, caseSensitive = isAmbiguousTerm(term)): RegExp {
  const t = term.trim();
  const body = escapeRegExp(t).replace(/\\\.|\s+/g, (m) => (m === '\\.' ? '\\.' : '\\s+'));
  return new RegExp(`(?<![A-Za-z0-9+#])${body}(?:s|es)?(?![A-Za-z0-9+#])`, caseSensitive ? 'u' : 'iu');
}

function compact(text: string): string {
  return text.toLowerCase().replace(/[\s.\-_/]+/g, '');
}

/** True when `text` mentions `term`. Also matches spelling variants such as NodeJS / Node.js for longer terms. */
export function containsTerm(text: string, term: string): boolean {
  const t = term.trim();
  if (!t || !text) return false;
  if (termRegex(t).test(text)) return true;
  const singular = t.length > 4 && /s$/i.test(t) ? t.slice(0, -1) : '';
  if (singular && termRegex(singular).test(text)) return true;
  const c = compact(t);
  if (c.length >= 5 && !isAmbiguousTerm(t)) {
    const re = new RegExp(`(?<![a-z0-9+#])${escapeRegExp(c)}`, 'i');
    return text
      .split(/[\s,;:()[\]{}"'“”‘’!?]+/)
      .some((token) => re.test(compact(token)) && compact(token).length <= c.length + 3);
  }
  return false;
}

/** Case-insensitive check used for "does the profile have this term at all" (lenient). */
export function profileHasTerm(profileText: string, term: string): boolean {
  if (containsTerm(profileText, term)) return true;
  // Ambiguous terms: accept any casing in the profile, the user may have typed "go" or "GO".
  return isAmbiguousTerm(term) && termRegex(term, false).test(profileText);
}

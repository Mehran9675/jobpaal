/**
 * The standard 14 PDF fonts only encode WinAnsi (cp1252). pdf-lib throws on anything else,
 * so text drawn with standard fonts goes through toWinAnsi first.
 */
const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

const REPLACEMENTS: Record<string, string> = {
  '\u00a0': ' ', '\u2002': ' ', '\u2003': ' ', '\u2009': ' ', '\u200a': ' ', '\u202f': ' ', '\u2007': ' ', '\u2008': ' ',
  '\t': ' ',
  '\u2010': '-', '\u2011': '-', '\u2012': '\u2013', '\u2015': '\u2014', '\u2212': '-', '\u00ad': '',
  '\u2032': "'", '\u2033': '"', '\u201b': "'", '\u201f': '"', '\u2035': "'",
  '\u2190': '<-', '\u2192': '->', '\u2194': '<->', '\u21d2': '=>', '\u21d0': '<=', '\u2191': '^', '\u2193': 'v',
  '\u2264': '<=', '\u2265': '>=', '\u2260': '!=', '\u2248': '~', '\u2026': '\u2026',
  '\u25cf': '\u2022', '\u25aa': '\u2022', '\u25a0': '\u2022', '\u25e6': '\u2022', '\u2043': '-', '\u2219': '\u2022', '\u2023': '\u2022', '\u25b8': '>',
  '\u2713': 'v', '\u2714': 'v', '\u2717': 'x', '\u2718': 'x', '\u2605': '*', '\u2606': '*',
  '\u2122': '\u2122', '\u2116': 'No.', '\u2153': '1/3', '\u2154': '2/3',
  '\u200b': '', '\u200c': '', '\u200d': '', '\ufeff': '', '\u2060': '',
  '\u0141': 'L', '\u0142': 'l', '\u0110': 'D', '\u0111': 'd', '\u0131': 'i', '\u0152': '\u0152', '\u0153': '\u0153',
};

function isWinAnsi(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  if (code === 0x0a) return true;
  if (code >= 0x20 && code <= 0x7e) return true;
  if (code >= 0xa0 && code <= 0xff) return true;
  return CP1252_EXTRA.includes(ch);
}

/** Maps text to characters the standard fonts can encode; unencodable characters become '?'. */
export function toWinAnsi(text: string): string {
  let out = '';
  for (const ch of text ?? '') {
    if (isWinAnsi(ch)) {
      out += ch;
      continue;
    }
    const mapped = REPLACEMENTS[ch];
    if (mapped !== undefined) {
      out += mapped;
      continue;
    }
    // Strip diacritics that WinAnsi lacks (e.g. ő -> o, ș -> s).
    const base = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    if (base && base !== ch && [...base].every(isWinAnsi)) {
      out += base;
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || (code >= 0x7f && code < 0xa0)) continue; // control characters
    if (/\p{M}/u.test(ch)) continue; // stray combining marks
    out += '?';
  }
  return out;
}

/** For embedded custom fonts: only control characters need removing. */
export function stripControl(text: string): string {
  return (text ?? '').replace(/\t/g, ' ').replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u200b\ufeff]/g, '');
}

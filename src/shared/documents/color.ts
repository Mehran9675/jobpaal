export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const FALLBACK = '#2563eb';

/** Normalises '#abc' / 'abc' / '#aabbcc' to '#aabbcc'; invalid input gives the default accent. */
export function normalizeHex(input: string): string {
  const raw = (input ?? '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return '#' + raw.split('').map((c) => c + c).join('').toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return '#' + raw.toLowerCase();
  return FALLBACK;
}

/** Hex colour to 0..1 channels (pdf-lib style). */
export function hexToRgb(input: string): Rgb {
  const hex = normalizeHex(input).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
  };
}

/** 'aabbcc' without '#', as used by DOCX. */
export function hexNoHash(input: string): string {
  return normalizeHex(input).slice(1);
}

export const TEXT_HEX = '#1f2328';
export const MUTED_HEX = '#59636e';
export const GRAY_HEX = '#6e7781';
export const RULE_HEX = '#c8ccd1';

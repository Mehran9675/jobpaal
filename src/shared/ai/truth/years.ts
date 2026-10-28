import type { Experience } from '@/shared/types';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Month index (year*12 + month0) of a profile date, or null. End-of-year for bare years when `isEnd`. */
export function monthIndex(value: string, isEnd: boolean): number | null {
  const v = (value ?? '').trim().toLowerCase();
  let m = /^(\d{4})-(\d{1,2})/.exec(v);
  if (m) return Number(m[1]) * 12 + Math.min(11, Math.max(0, Number(m[2]) - 1));
  m = /^(\d{1,2})\/(\d{4})$/.exec(v);
  if (m) return Number(m[2]) * 12 + Math.min(11, Math.max(0, Number(m[1]) - 1));
  m = /^([a-z]{3})[a-z]*\.?\s+(\d{4})$/.exec(v);
  if (m && MONTHS.includes(m[1])) return Number(m[2]) * 12 + MONTHS.indexOf(m[1]);
  m = /^(\d{4})$/.exec(v);
  if (m) return Number(m[1]) * 12 + (isEnd ? 11 : 0);
  return null;
}

/** Total years of experience from dates, with overlapping roles counted once. */
export function totalExperienceYears(experience: Experience[], now: Date = new Date()): number {
  const nowIndex = now.getFullYear() * 12 + now.getMonth();
  const ranges: [number, number][] = [];
  for (const e of experience) {
    const start = monthIndex(e.startDate, false);
    if (start === null) continue;
    let end = e.current ? nowIndex : monthIndex(e.endDate, true);
    if (end === null) end = start;
    end = Math.min(end, nowIndex);
    if (end >= start) ranges.push([start, end]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let months = 0;
  let current: [number, number] | null = null;
  for (const range of ranges) {
    if (current && range[0] <= current[1] + 1) current[1] = Math.max(current[1], range[1]);
    else {
      if (current) months += current[1] - current[0] + 1;
      current = [...range];
    }
  }
  if (current) months += current[1] - current[0] + 1;
  return Math.round((months / 12) * 100) / 100;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, 'twenty-five': 25, thirty: 30,
};

/** Year counts claimed in text ("5+ years", "five years", "over a decade"). */
export function yearClaims(text: string): number[] {
  const claims: number[] = [];
  const re = /\b(\d+(?:\.\d+)?|[a-z]+(?:-[a-z]+)?)\s*\+?\s*(?:-\s*)?(?:years?|yrs?)\b/gi;
  for (const m of (text ?? '').matchAll(re)) {
    const token = m[1].toLowerCase();
    const value = /^\d/.test(token) ? Number.parseFloat(token) : WORD_NUMBERS[token];
    if (value !== undefined && Number.isFinite(value)) claims.push(value);
  }
  for (const m of (text ?? '').matchAll(/\b(a|one|two|several)?\s*decades?\b/gi)) {
    const word = (m[1] ?? 'a').toLowerCase();
    claims.push(word === 'two' ? 20 : word === 'several' ? 30 : 10);
  }
  return claims;
}

/** Claims of more years than the dates support. */
export function findExcessYearClaims(text: string, maxYears: number): number[] {
  return yearClaims(text).filter((n) => n > maxYears + 1e-9);
}

export function passesYearsGuard(text: string, maxYears: number): boolean {
  return findExcessYearClaims(text, maxYears).length === 0;
}

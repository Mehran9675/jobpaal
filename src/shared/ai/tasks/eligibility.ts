import type { JobPosting, Profile } from '@/shared/types';
import { matchOption, realOptions } from './options';

type YesNo = '' | 'yes' | 'no';

const ALIASES: Record<string, string[]> = {
  'united states': ['us', 'u.s.', 'usa', 'u.s.a.', 'united states of america', 'america'],
  'united kingdom': ['uk', 'u.k.', 'great britain', 'britain', 'england', 'scotland', 'wales'],
  'european union': ['eu', 'europe'],
  'united arab emirates': ['uae'],
  netherlands: ['the netherlands', 'holland'],
};

function countryVariants(country: string): string[] {
  const c = country.trim().toLowerCase();
  if (!c) return [];
  for (const [main, aliases] of Object.entries(ALIASES)) {
    if (main === c || aliases.includes(c)) return [main, ...aliases];
  }
  return [c];
}

function mentions(text: string, variant: string): boolean {
  const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const caseSensitive = variant.length <= 3;
  const re = new RegExp(`(?<![A-Za-z])${caseSensitive ? escaped.toUpperCase() : escaped}(?![A-Za-z])`, caseSensitive ? '' : 'i');
  return re.test(text);
}

function authorizedHit(authorized: string, text: string): boolean {
  return authorized
    .split(/[,;/]|\band\b/i)
    .map((c) => c.trim())
    .filter(Boolean)
    .some((country) => countryVariants(country).some((v) => mentions(text, v)));
}

function yesNoAnswer(value: YesNo, options: string[]): string {
  if (!value) return '';
  const word = value === 'yes' ? 'Yes' : 'No';
  return realOptions(options).length ? matchOption(word, options) : word;
}

function textAnswer(value: string, options: string[]): string {
  const v = value.trim();
  if (!v) return '';
  return realOptions(options).length ? matchOption(v, options) : v;
}

const AUTH = /(authori[sz]ed|legally (?:able|eligible|permitted|entitled|allowed)|right to work|eligible to work|work permit|permission to work|work authori[sz]ation)/i;
const SPONSOR = /sponsor/i;

/**
 * Answers straightforward eligibility questions from profile.eligibility.
 * Returns null when the question is not an eligibility question, '' when the profile lacks the info.
 */
export function eligibilityAnswer(question: string, options: string[], profile: Profile, job: JobPosting | null): string | null {
  const q = question;
  const el = profile.eligibility;
  if (AUTH.test(q)) {
    const place = `${q}\n${job?.location ?? ''}`;
    const hit = Boolean(el.authorizedCountries.trim()) && authorizedHit(el.authorizedCountries, place);
    if (SPONSOR.test(q)) {
      if (el.requiresSponsorship === 'yes') return yesNoAnswer('no', options);
      return el.requiresSponsorship === 'no' && hit ? yesNoAnswer('yes', options) : '';
    }
    if (!el.authorizedCountries.trim()) return '';
    if (realOptions(options).length) return hit ? yesNoAnswer('yes', options) : '';
    return hit ? 'Yes' : `I am authorised to work in ${el.authorizedCountries.trim()}.`;
  }
  if (SPONSOR.test(q)) return yesNoAnswer(el.requiresSponsorship, options);
  if (/relocat/i.test(q)) return yesNoAnswer(el.willingToRelocate, options);
  if (/driv(?:er|ing)['’]?s?\s+licen[cs]e/i.test(q)) return yesNoAnswer(el.hasDriversLicense, options);
  if (/notice period|\bnotice\b/i.test(q)) return textAnswer(el.noticePeriod, options);
  if (/(start date|when can you start|earliest (?:start|possible start|date)|available to start|availability to start|available from|date (?:you are |you're )?available|when (?:are|would) you (?:be )?available)/i.test(q)) {
    return textAnswer(el.availableFrom, options);
  }
  if (/(salary|compensation|pay (?:expectation|range|requirement)|desired pay|expected pay|rate expectation|expected rate)/i.test(q)) {
    return textAnswer(el.salaryExpectation, options);
  }
  return null;
}

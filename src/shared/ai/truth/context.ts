import type { JobAnalysis, JobPosting, Profile } from '@/shared/types';
import { escapeRegExp } from './terms';
import { findUnsupportedNumbers } from './numbers';
import { profileFactsText, realTitles } from './profileText';
import { findUnsupportedSeniority } from './seniority';
import { findUnsupportedSkills, jobSkillTerms } from './skills';
import { findExcessYearClaims, totalExperienceYears } from './years';

/** Everything the guards need, computed once per task. */
export interface TruthContext {
  profileText: string;
  titlesText: string;
  jobTerms: string[];
  maxYears: number;
}

export function buildTruthContext(
  profile: Profile,
  job?: JobPosting | null,
  analysis?: JobAnalysis | null,
  now: Date = new Date(),
): TruthContext {
  return {
    profileText: profileFactsText(profile),
    titlesText: realTitles(profile).join('\n'),
    jobTerms: jobSkillTerms(job, analysis),
    maxYears: totalExperienceYears(profile.experience, now),
  };
}

export interface GuardOptions {
  /** Text the numbers must come from (an experience for bullets, the profile for summaries). */
  numberSource: string;
  /** Text seniority words must come from. Defaults to the profile. */
  seniorityAllowed?: string;
  /** Phrases removed before checking (e.g. the posting's title and company in a cover letter). */
  ignorePhrases?: string[];
  /** Sentences with a negation ("I have not used X") may name missing skills. */
  allowNegatedSkills?: boolean;
}

const NEGATION = /\b(?:no|not|never|haven['’]t|hasn['’]t|don['’]t|didn['’]t|lack|without|yet to)\b(?!\s+only)/i;

function stripPhrases(text: string, phrases: string[] = []): string {
  let out = text;
  for (const phrase of phrases) {
    const p = phrase.trim();
    if (p.length >= 2) out = out.replace(new RegExp(escapeRegExp(p), 'gi'), ' ');
  }
  return out;
}

/** Lists why a text breaks the truthfulness rules (empty = passes). */
export function findViolations(text: string, ctx: TruthContext, options: GuardOptions): string[] {
  const checked = stripPhrases(text, options.ignorePhrases);
  const problems: string[] = [];
  for (const n of findUnsupportedNumbers(checked, options.numberSource)) problems.push(`unsupported number "${n}"`);
  if (!(options.allowNegatedSkills && NEGATION.test(checked))) {
    for (const s of findUnsupportedSkills(checked, ctx.jobTerms, ctx.profileText)) problems.push(`skill not in profile "${s}"`);
  }
  for (const s of findUnsupportedSeniority(checked, options.seniorityAllowed ?? ctx.profileText)) {
    problems.push(`seniority not in profile "${s}"`);
  }
  for (const y of findExcessYearClaims(checked, ctx.maxYears)) problems.push(`claims ${y} years`);
  return problems;
}

export function passesGuards(text: string, ctx: TruthContext, options: GuardOptions): boolean {
  return findViolations(text, ctx, options).length === 0;
}

/** Splits prose into sentences (keeps abbreviations like "e.g." and "Node.js" together reasonably). */
export function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(/(?<=[.!?])\s+(?=["“(]?[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Keeps only the sentences that pass `keep`, preserving paragraphs. */
export function filterSentences(text: string, keep: (sentence: string) => boolean): string {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => splitSentences(paragraph.replace(/\s*\n\s*/g, ' ')).filter(keep).join(' '))
    .filter((p) => p.trim())
    .join('\n\n');
}

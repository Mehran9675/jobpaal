import type { JobPosting, Profile } from '@/shared/types';
import { normalizeForCompare } from '@/shared/utils/text';
import { findViolations, type TruthContext } from './context';
import { mostRecentTitle, profileSkills } from './profileText';
import { containsTerm, profileHasTerm } from './terms';

const SEPARATOR = ' · ';

/** Profile skills that the job also cares about, in the job's order of importance. */
export function relevantProfileSkills(profile: Profile, jobTerms: string[]): string[] {
  const skills = profileSkills(profile);
  const out: string[] = [];
  for (const term of jobTerms) {
    const key = normalizeForCompare(term);
    const match =
      skills.find((s) => normalizeForCompare(s) === key) ??
      skills.find((s) => s.length >= 3 && term.length >= 3 && (containsTerm(term, s) || containsTerm(s, term)));
    if (match && !out.some((o) => normalizeForCompare(o) === normalizeForCompare(match))) out.push(match);
  }
  return out;
}

/**
 * Deterministic headline: the user's real most recent title, optionally followed by
 * up to `max` genuine specialisations that matter for the job. e.g. "Backend Engineer · Go, Kubernetes".
 */
export function buildHeadline(profile: Profile, jobTerms: string[], max = 3): string {
  const title = mostRecentTitle(profile);
  if (!title) return '';
  const specs = relevantProfileSkills(profile, jobTerms)
    .filter((s) => !containsTerm(title, s))
    .slice(0, Math.max(0, Math.min(3, max)));
  return specs.length ? `${title}${SEPARATOR}${specs.join(', ')}` : title;
}

function startsWithTitle(headline: string, title: string): boolean {
  const h = normalizeForCompare(headline);
  const t = normalizeForCompare(title);
  return Boolean(t) && (h === t || h.startsWith(`${t} `));
}

/** Reasons an AI headline is rejected (empty = acceptable). */
export function headlineProblems(headline: string, profile: Profile, job: JobPosting | null, ctx: TruthContext): string[] {
  const text = headline.replace(/\s+/g, ' ').trim();
  if (!text) return ['empty'];
  if (text.length > 120) return ['too long'];
  const anchors = [mostRecentTitle(profile), profile.basics.headline].filter(Boolean);
  const anchor = anchors.find((a) => startsWithTitle(text, a));
  if (!anchor) return ['does not start with the real most recent title'];
  const problems: string[] = [];
  const jobTitle = job?.title?.trim() ?? '';
  if (jobTitle && normalizeForCompare(text).includes(normalizeForCompare(jobTitle)) && !anchors.some((a) => normalizeForCompare(a) === normalizeForCompare(jobTitle))) {
    problems.push('copies the posting title');
  }
  const rest = text.slice(anchor.length).replace(/^[\s·|•,:;–—-]+/, '');
  const pieces = rest.split(/\s*(?:[,·|•/&]|\band\b|\s[–—-]\s)\s*/).map((p) => p.trim()).filter(Boolean);
  if (pieces.length > 3) problems.push('too many specialisations');
  for (const piece of pieces) {
    if (!profileHasTerm(ctx.profileText, piece)) problems.push(`specialisation not in profile "${piece}"`);
  }
  problems.push(...findViolations(text, ctx, { numberSource: ctx.profileText, seniorityAllowed: ctx.titlesText }));
  return problems;
}

/** Accepts the AI headline only when it passes every guard; otherwise builds one. */
export function guardHeadline(aiHeadline: string, profile: Profile, job: JobPosting | null, ctx: TruthContext): string {
  const cleaned = aiHeadline.replace(/\s+/g, ' ').trim();
  if (cleaned && headlineProblems(cleaned, profile, job, ctx).length === 0) return cleaned;
  return buildHeadline(profile, ctx.jobTerms) || profile.basics.headline.trim();
}

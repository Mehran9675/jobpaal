import type { Profile } from '@/shared/types';
import { findViolations, type TruthContext } from './context';
import { mostRecentTitle, profileSkills } from './profileText';
import { relevantProfileSkills } from './headline';

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** A neutral, claim-free summary from the real title and skills. */
export function neutralSummary(profile: Profile, jobTerms: string[] = []): string {
  const title = mostRecentTitle(profile);
  const relevant = relevantProfileSkills(profile, jobTerms);
  const skills = [...relevant, ...profileSkills(profile).filter((s) => !relevant.includes(s))].slice(0, 5);
  const lead = title ? `${title}` : 'Professional';
  return skills.length ? `${lead} with hands-on experience in ${listJoin(skills)}.` : title ? `${title}.` : '';
}

export function summaryProblems(summary: string, ctx: TruthContext): string[] {
  return findViolations(summary, ctx, { numberSource: ctx.profileText, seniorityAllowed: ctx.profileText });
}

/** Accepts the AI summary when it passes every guard, else the profile summary (or a neutral one). */
export function guardSummary(aiSummary: string, profile: Profile, ctx: TruthContext): string {
  const text = aiSummary.replace(/[ \t]+/g, ' ').trim();
  if (text && text.length <= 1200 && summaryProblems(text, ctx).length === 0) return text;
  return profile.summary.trim() || neutralSummary(profile, ctx.jobTerms);
}

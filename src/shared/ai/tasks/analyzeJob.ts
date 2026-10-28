import type { JobAnalysis, JobPosting, MatchRecommendation, Profile } from '@/shared/types';
import { hashString } from '@/shared/utils/hash';
import { normalizeForCompare, uniqueStrings } from '@/shared/utils/text';
import { asNumber, asString, asStringArray, clamp } from '../json';
import { ANALYZE_PROMPT, analyzeUserMessage } from '../prompts/analyze';
import { profileFactsText, profileSkills } from '../truth/profileText';
import { containsTerm, profileHasTerm } from '../truth/terms';
import { runJsonTask } from './aiJson';

const RECOMMENDATIONS: MatchRecommendation[] = ['strong match', 'good match', 'stretch', 'weak match'];

export function deriveRecommendation(score: number): MatchRecommendation {
  if (score >= 75) return 'strong match';
  if (score >= 55) return 'good match';
  if (score >= 35) return 'stretch';
  return 'weak match';
}

/** Uses the model's recommendation when it is one of the four values, else derives it from the score. */
export function normalizeRecommendation(value: unknown, score: number): MatchRecommendation {
  const v = asString(value).toLowerCase().replace(/[_-]+/g, ' ').trim();
  return (RECOMMENDATIONS as string[]).includes(v) ? (v as MatchRecommendation) : deriveRecommendation(score);
}

export function normalizeScore(value: unknown): number {
  let score = asNumber(value, 0);
  if (score > 0 && score <= 1 && String(value).includes('.')) score *= 100;
  return Math.round(clamp(score, 0, 100));
}

/** Keeps only matched skills that really are in the profile, spelled as in the profile. */
export function filterMatchedSkills(candidates: string[], profile: Profile, jobSkills: string[]): string[] {
  const skills = profileSkills(profile);
  const facts = profileFactsText(profile);
  const out: string[] = [];
  const pool = uniqueStrings([...candidates, ...jobSkills]);
  for (const c of pool) {
    const exact = skills.find((s) => normalizeForCompare(s) === normalizeForCompare(c));
    if (exact) out.push(exact);
    else if (candidates.includes(c) && profileHasTerm(facts, c)) out.push(c);
  }
  return uniqueStrings(out);
}

export function buildAnalysis(data: Record<string, unknown>, job: JobPosting, profile: Profile, providerId: string): JobAnalysis {
  const score = normalizeScore(data.score);
  const requiredSkills = asStringArray(data.requiredSkills, 40);
  const preferredSkills = asStringArray(data.preferredSkills, 40);
  const jobSkills = [...requiredSkills, ...preferredSkills];
  const facts = profileFactsText(profile);
  const matchedSkills = filterMatchedSkills(asStringArray(data.matchedSkills, 60), profile, jobSkills);
  const missingSkills = uniqueStrings([
    ...asStringArray(data.missingSkills, 60),
    ...requiredSkills.filter((s) => !profileHasTerm(facts, s)),
  ]).filter((s) => !profileHasTerm(facts, s) && !matchedSkills.some((m) => containsTerm(m, s)));
  return {
    seniority: asString(data.seniority),
    responsibilities: asStringArray(data.responsibilities, 15),
    requiredSkills,
    preferredSkills,
    atsKeywords: asStringArray(data.atsKeywords, 40),
    cultureSignals: asStringArray(data.cultureSignals, 10),
    redFlags: asStringArray(data.redFlags, 10),
    summary: asString(data.summary),
    mustProveThemes: asStringArray(data.mustProveThemes, 8),
    score,
    recommendation: normalizeRecommendation(data.recommendation, score),
    reasons: asStringArray(data.reasons, 8),
    matchedSkills,
    missingSkills,
    analyzedAt: Date.now(),
    descriptionHash: hashString(job.description),
    providerId,
  };
}

/** Analyses a posting against the profile: requirements, keywords and an honest match score. */
export async function analyzeJob(job: JobPosting, profile: Profile): Promise<JobAnalysis> {
  const { data, providerId } = await runJsonTask('analyze', ANALYZE_PROMPT, analyzeUserMessage(job, profile), {
    temperature: 0.2,
  });
  return buildAnalysis(data, job, profile, providerId);
}

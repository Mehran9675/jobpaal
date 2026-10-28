import type { JobAnalysis, JobPosting } from '@/shared/types';
import { uniqueStrings } from '@/shared/utils/text';
import { containsTerm, profileHasTerm } from './terms';

/** Generic words that appear in keyword lists but are not skills or tools. */
const GENERIC = new Set(
  'experience team teams work role job company product products business customer customers years year skills skill ability strong good great excellent knowledge understanding environment development engineering software solutions systems system data project projects people culture growth candidate degree bachelor master remote hybrid onsite office travel communication collaboration'.split(
    ' ',
  ),
);

/** Skill/tool terms the job asks for (analysis skills, ATS keywords and detected keywords). */
export function jobSkillTerms(job: JobPosting | null | undefined, analysis?: JobAnalysis | null): string[] {
  const terms = [
    ...(analysis?.requiredSkills ?? []),
    ...(analysis?.preferredSkills ?? []),
    ...(analysis?.atsKeywords ?? []),
    ...(job?.keywords ?? []),
  ];
  return uniqueStrings(terms).filter((t) => t.length <= 60 && !GENERIC.has(t.toLowerCase()));
}

/** Job terms mentioned in `text` that appear nowhere in the profile. */
export function findUnsupportedSkills(text: string, jobTerms: string[], profileText: string): string[] {
  return jobTerms.filter((term) => containsTerm(text, term) && !profileHasTerm(profileText, term));
}

export function passesSkillGuard(text: string, jobTerms: string[], profileText: string): boolean {
  return findUnsupportedSkills(text, jobTerms, profileText).length === 0;
}

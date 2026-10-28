import type { JobPosting, Profile } from '@/shared/types';
import { jobDigest, profileDigest } from './digest';
import type { TaskPrompt } from './system';

export const ANALYZE_PROMPT: TaskPrompt = {
  usesStyle: false,
  instruction:
    'Analyse the job posting and compare it honestly with the candidate profile. Extract what the employer really asks for, then score how well the candidate matches it today. Base the score on required skills, relevant experience, seniority fit and domain. Be realistic: missing required skills lower the score.',
  format: `Return one JSON object with exactly these keys:
{
  "seniority": string (e.g. "junior", "mid-level", "senior", "lead", or "" if unclear),
  "responsibilities": string[] (max 10, short),
  "requiredSkills": string[] (skills/tools explicitly required, short names),
  "preferredSkills": string[] (nice-to-have skills/tools),
  "atsKeywords": string[] (max 25 keywords an ATS would scan for),
  "cultureSignals": string[] (max 6),
  "redFlags": string[] (max 6, e.g. unrealistic demands; empty if none),
  "summary": string (2-3 sentences about the role),
  "mustProveThemes": string[] (max 5 themes the application must evidence),
  "score": number (0-100 match of THIS candidate),
  "recommendation": "strong match" | "good match" | "stretch" | "weak match",
  "reasons": string[] (3-6 short reasons for the score, honest),
  "matchedSkills": string[] (job skills the candidate profile actually lists, spelled as in the profile),
  "missingSkills": string[] (required or preferred skills the profile does not show)
}`,
};

export function analyzeUserMessage(job: JobPosting, profile: Profile): string {
  return `JOB POSTING:\n${jobDigest(job)}\n\nCANDIDATE PROFILE:\n${profileDigest(profile)}`;
}

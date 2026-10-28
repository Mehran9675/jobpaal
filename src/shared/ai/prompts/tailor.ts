import type { JobAnalysis, JobPosting, Profile } from '@/shared/types';
import { ALL_RESUME_SECTIONS } from '@/shared/types';
import { analysisDigest, jobDigest, profileDigest } from './digest';
import type { TaskPrompt } from './system';

export const TAILOR_PROMPT: TaskPrompt = {
  usesStyle: true,
  instruction:
    "Create a tailoring plan that presents the candidate's real experience for this job. Rewrite bullets so the most relevant real work comes first and uses the posting's vocabulary where it truthfully describes the same thing. Keep each bullet to one line or two. Order skill groups and skills so the most relevant real skills come first. The headline must start with the candidate's real most recent job title exactly as written, optionally followed by \" · \" and up to three of the candidate's real skills that matter for this job. Write a 2-4 sentence summary built only from facts in the profile.",
  format: `Return one JSON object with exactly these keys (ids must be copied from the profile [id=...] markers):
{
  "headline": string,
  "summary": string,
  "skillGroupOrder": string[] (existing skill group names, most relevant first),
  "prioritySkills": string[] (existing profile skills to list first, most relevant first),
  "experience": [{ "sourceId": string, "bullets": string[] }] (one entry per experience; at most as many bullets as the source has highlights, plus one if it has a description),
  "projects": [{ "sourceId": string, "bullets": string[] }],
  "sectionOrder": string[] (a permutation of: ${ALL_RESUME_SECTIONS.join(', ')})
}
Bullets are plain text without leading symbols. Each rewritten bullet keeps only the facts and numbers of its own source entry.`,
};

export function tailorUserMessage(job: JobPosting, analysis: JobAnalysis, profile: Profile): string {
  return `JOB POSTING:\n${jobDigest(job, 10000)}\n\nJOB ANALYSIS:\n${analysisDigest(analysis)}\n\nCANDIDATE PROFILE:\n${profileDigest(profile)}`;
}

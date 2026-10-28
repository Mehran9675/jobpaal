import type { JobAnalysis, JobPosting, Profile, ResumeContent } from '@/shared/types';
import { analysisDigest, jobDigest, profileDigest } from './digest';
import type { TaskPrompt } from './system';

export const COVER_LETTER_PROMPT: TaskPrompt = {
  usesStyle: true,
  instruction:
    "Write a cover letter for this job in the candidate's voice (first person). Open with why this role and company fit the candidate's real background, then connect two or three of the candidate's most relevant real experiences to what the job needs, and close with a short, confident call to action. 250 to 400 words in the body. Do not mention skills or requirements the candidate lacks, and do not apologise for them.",
  format: `Return one JSON object:
{
  "recipient": string (the hiring manager's name ONLY if the posting names one, otherwise "Hiring Team"),
  "body": string (the letter body paragraphs separated by a blank line, WITHOUT the salutation, WITHOUT the closing and WITHOUT the signature)
}`,
};

function resumeHighlights(resume: ResumeContent): string {
  return [
    resume.headline ? `Headline: ${resume.headline}` : '',
    resume.summary ? `Summary: ${resume.summary}` : '',
    ...resume.experience.slice(0, 3).map((e) => `${e.title} at ${e.company}: ${e.bullets.slice(0, 3).join(' ')}`),
  ]
    .filter(Boolean)
    .join('\n');
}

export function coverLetterUserMessage(job: JobPosting, analysis: JobAnalysis, profile: Profile, resume: ResumeContent): string {
  return `JOB POSTING:\n${jobDigest(job, 8000)}\n\nJOB ANALYSIS:\n${analysisDigest(analysis)}\n\nTAILORED RESUME HIGHLIGHTS:\n${resumeHighlights(resume)}\n\nCANDIDATE PROFILE:\n${profileDigest(profile)}`;
}

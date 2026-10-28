import type { JobAnalysis, JobPosting, Profile } from '@/shared/types';
import { analysisDigest, jobDigest, profileDigest } from './digest';
import type { TaskPrompt } from './system';

export interface QuestionForPrompt {
  index: number;
  question: string;
  options: string[];
  maxLength?: number;
}

const INSTRUCTION =
  "Draft answers to job application questions in the first person, as the candidate. Ground every answer in the candidate profile and relate it to the job where it helps. Be specific and concise. If the profile does not contain the information needed to answer truthfully, return an empty string for that answer. For questions with options, answer with exactly one of the options, copied verbatim.";

export const ANSWERS_PROMPT: TaskPrompt = {
  usesStyle: true,
  instruction: INSTRUCTION,
  format: `Return one JSON object:
{ "answers": [{ "index": number, "answer": string }] }
One entry per question, using the question's index. Respect any maximum length. Use "" when the profile cannot support an answer.`,
};

export const ANSWER_ONE_PROMPT: TaskPrompt = {
  usesStyle: true,
  instruction: INSTRUCTION,
  format: `Return one JSON object: { "answer": string }. Use "" when the profile cannot support an answer.`,
};

function questionBlock(q: QuestionForPrompt): string {
  return [
    `[${q.index}] ${q.question}`,
    q.options.length ? `  Options: ${q.options.map((o) => JSON.stringify(o)).join(', ')}` : '',
    q.maxLength ? `  Maximum length: ${q.maxLength} characters` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function context(job: JobPosting | null, analysis: JobAnalysis | null, profile: Profile): string {
  return [
    job ? `JOB POSTING:\n${jobDigest(job, 6000)}` : '',
    analysis ? `JOB ANALYSIS:\n${analysisDigest(analysis)}` : '',
    `CANDIDATE PROFILE:\n${profileDigest(profile, { eligibility: true })}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function answersUserMessage(questions: QuestionForPrompt[], job: JobPosting | null, analysis: JobAnalysis | null, profile: Profile): string {
  return `${context(job, analysis, profile)}\n\nQUESTIONS:\n${questions.map(questionBlock).join('\n')}`;
}

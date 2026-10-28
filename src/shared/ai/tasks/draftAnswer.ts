import type { JobPosting, Profile } from '@/shared/types';
import { asString } from '../json';
import { ANSWER_ONE_PROMPT, answersUserMessage } from '../prompts/answers';
import { buildTruthContext } from '../truth/context';
import { finalizeAnswer } from './answerGuard';
import { runJsonTask } from './aiJson';
import { eligibilityAnswer } from './eligibility';
import { realOptions } from './options';

/** Drafts one answer (manual question entry). Same rules as answerQuestions. */
export async function draftAnswer(question: string, options: string[], job: JobPosting | null, profile: Profile): Promise<string> {
  const choices = realOptions(options);
  const direct = eligibilityAnswer(question, choices, profile, job);
  if (direct !== null) return direct;
  const ctx = buildTruthContext(profile, job);
  const { data } = await runJsonTask(
    'answer-one',
    ANSWER_ONE_PROMPT,
    answersUserMessage([{ index: 0, question, options: choices }], job, null, profile),
    { temperature: 0.4 },
  );
  const raw = asString(data.answer) || asString((data.answers as unknown[] | undefined)?.[0]);
  return finalizeAnswer(raw, { question, options: choices }, profile, ctx);
}

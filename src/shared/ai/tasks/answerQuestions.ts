import type { JobAnalysis, JobPosting, Profile, ScreeningAnswer, ScreeningQuestion } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { asArray, asNumber, asObject, asString } from '../json';
import { ANSWERS_PROMPT, answersUserMessage, type QuestionForPrompt } from '../prompts/answers';
import { buildTruthContext } from '../truth/context';
import { finalizeAnswer } from './answerGuard';
import { runJsonTask } from './aiJson';
import { eligibilityAnswer } from './eligibility';
import { fitLength, realOptions } from './options';

function optionsFor(q: ScreeningQuestion): string[] {
  return q.kind === 'select' || q.kind === 'radio' || q.kind === 'checkbox' ? realOptions(q.options) : [];
}

/** Reads { answers: [{ index, answer }] } (also tolerates a bare array or a list of strings). */
export function parseAnswerList(data: Record<string, unknown>, count: number): Map<number, string> {
  const list = asArray(data.answers ?? data.items);
  const map = new Map<number, string>();
  list.forEach((item, position) => {
    if (typeof item === 'string') {
      map.set(position, item.trim());
      return;
    }
    const obj = asObject(item);
    const index = asNumber(obj.index, position);
    if (index >= 0 && index < count && !map.has(index)) map.set(index, asString(obj.answer));
  });
  return map;
}

/** Drafts first-person answers to screening questions, grounded in the profile. Never fabricates. */
export async function answerQuestions(
  questions: ScreeningQuestion[],
  job: JobPosting,
  analysis: JobAnalysis | null,
  profile: Profile,
): Promise<ScreeningAnswer[]> {
  const ctx = buildTruthContext(profile, job, analysis);
  const answers = new Map<number, string>();
  const pending: QuestionForPrompt[] = [];

  questions.forEach((q, index) => {
    const options = optionsFor(q);
    const direct = eligibilityAnswer(q.question, options, profile, job);
    if (direct !== null) answers.set(index, fitLength(direct, q.maxLength));
    else pending.push({ index, question: q.question, options, maxLength: q.maxLength });
  });

  if (pending.length) {
    const { data } = await runJsonTask('answers', ANSWERS_PROMPT, answersUserMessage(pending, job, analysis, profile), {
      temperature: 0.4,
    });
    const raw = parseAnswerList(data, questions.length);
    // A bare list of strings is positional over the pending questions.
    const positional = asArray(data.answers ?? data.items).every((item) => typeof item === 'string');
    pending.forEach((p, i) => {
      const value = positional ? raw.get(i) : raw.get(p.index);
      answers.set(p.index, finalizeAnswer(value ?? '', p, profile, ctx));
    });
  }

  return questions.map((q, index) => ({
    id: createId('qa'),
    question: q.question,
    answer: answers.get(index) ?? '',
    fieldId: q.fieldId,
    frameId: q.frameId,
    source: 'generated' as const,
    edited: false,
  }));
}

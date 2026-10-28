import type { Profile } from '@/shared/types';
import { filterSentences, passesGuards, type TruthContext } from '../truth/context';
import { fitLength, matchOption, realOptions } from './options';

export interface AnswerTarget {
  question: string;
  options: string[];
  maxLength?: number;
}

/** Numbers an answer may use: the profile, the eligibility data, the computed years and the question itself. */
function answerNumberSource(profile: Profile, ctx: TruthContext, question: string): string {
  const el = profile.eligibility;
  return [
    ctx.profileText,
    el.noticePeriod,
    el.availableFrom,
    el.salaryExpectation,
    String(Math.floor(ctx.maxYears)),
    question,
  ].join('\n');
}

/**
 * Final shape of one answer: option questions map to exactly one option (or ''),
 * free text keeps only sentences that pass the truth guards and respects maxLength.
 */
export function finalizeAnswer(raw: string, target: AnswerTarget, profile: Profile, ctx: TruthContext): string {
  const text = (raw ?? '').trim();
  if (!text) return '';
  if (realOptions(target.options).length) return matchOption(text, target.options);
  const numberSource = answerNumberSource(profile, ctx, target.question);
  const guarded = filterSentences(text, (sentence) =>
    passesGuards(sentence, ctx, { numberSource, seniorityAllowed: ctx.profileText, allowNegatedSkills: true }),
  );
  return fitLength(guarded, target.maxLength);
}

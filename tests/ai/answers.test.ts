import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScreeningQuestion } from '@/shared/types';
import { makeAnalysis, makeJob, makeProfile } from './fixtures';

const runAiMock = vi.fn();
vi.mock('@/shared/ai/runAi', () => ({ runAi: (...args: unknown[]) => runAiMock(...args), isAiReady: async () => true }));
vi.mock('@/shared/storage', () => ({ getPromptSettings: async () => ({ tone: '', writingStyle: '', wordsToAvoid: [], themesToEmphasise: [], templates: {} }) }));

const { answerQuestions } = await import('@/shared/ai/tasks/answerQuestions');
const { draftAnswer } = await import('@/shared/ai/tasks/draftAnswer');
const { eligibilityAnswer } = await import('@/shared/ai/tasks/eligibility');
const { matchOption, fitLength } = await import('@/shared/ai/tasks/options');

const q = (question: string, kind: ScreeningQuestion['kind'] = 'text', options: string[] = [], maxLength?: number): ScreeningQuestion => ({
  fieldId: `f-${question.length}`,
  frameId: 0,
  question,
  kind,
  options,
  required: false,
  maxLength,
});

describe('option matching', () => {
  it('maps model output to exactly one option', () => {
    expect(matchOption('yes', ['Select...', 'Yes', 'No'])).toBe('Yes');
    expect(matchOption('No, I do not', ['Yes', 'No'])).toBe('No');
    expect(matchOption('3 months', ['1 month', '2-3 months', '3 months', 'More'])).toBe('3 months');
    expect(matchOption('I am based in Berlin, Germany', ['France', 'Germany', 'Spain'])).toBe('Germany');
    expect(matchOption('Something unrelated', ['Yes', 'No'])).toBe('');
    expect(matchOption('', ['Yes'])).toBe('');
  });
  it('fits text to a max length at a boundary', () => {
    expect(fitLength('First sentence here. Second sentence is long.', 30)).toBe('First sentence here.');
    expect(fitLength('one two three four', 9)).toBe('one two');
  });
});

describe('eligibility answers', () => {
  const profile = makeProfile();
  const job = makeJob();
  it('answers from the profile without inventing', () => {
    expect(eligibilityAnswer('Will you require visa sponsorship?', ['Yes', 'No'], profile, job)).toBe('No');
    expect(eligibilityAnswer('Are you legally authorized to work in Germany?', ['Yes', 'No'], profile, job)).toBe('Yes');
    expect(eligibilityAnswer('Are you authorized to work in the US?', ['Yes', 'No'], profile, null)).toBe('');
    expect(eligibilityAnswer('What is your notice period?', [], profile, job)).toBe('3 months');
    expect(eligibilityAnswer('Are you willing to relocate?', ['Yes', 'No'], profile, job)).toBe('');
    expect(eligibilityAnswer('What are your salary expectations?', [], profile, job)).toBe('');
    expect(eligibilityAnswer('Why do you want this job?', [], profile, job)).toBeNull();
  });
});

describe('answerQuestions', () => {
  beforeEach(() => runAiMock.mockReset());

  it('combines eligibility answers with guarded AI answers', async () => {
    runAiMock.mockResolvedValue({
      providerId: 'p',
      promptTokens: 1,
      completionTokens: 1,
      model: 'm',
      text: JSON.stringify({
        answers: [
          { index: 1, answer: 'I build Go services on Kubernetes at Acme. I have 15 years of Kafka experience.' },
          { index: 2, answer: 'Advanced' },
          { index: 3, answer: 'Maybe' },
        ],
      }),
    });
    const questions = [
      q('Do you require sponsorship?', 'radio', ['Yes', 'No']),
      q('Why are you a good fit?', 'textarea'),
      q('Go level', 'select', ['Select one', 'Beginner', 'Intermediate', 'Advanced']),
      q('Do you have a security clearance?', 'radio', ['Yes', 'No']),
    ];
    const answers = await answerQuestions(questions, makeJob(), makeAnalysis(), makeProfile());
    expect(answers.map((a) => a.answer)).toEqual(['No', 'I build Go services on Kubernetes at Acme.', 'Advanced', '']);
    expect(answers[0]).toMatchObject({ fieldId: questions[0].fieldId, frameId: 0, source: 'generated', edited: false });
    expect(answers[0].id).toMatch(/^qa_/);
    const prompt = runAiMock.mock.calls[0][1].messages[1].content as string;
    expect(prompt).not.toContain('sponsorship?');
  });

  it('skips the AI when every question is an eligibility question', async () => {
    const answers = await answerQuestions([q('Notice period?')], makeJob(), null, makeProfile());
    expect(answers[0].answer).toBe('3 months');
    expect(runAiMock).not.toHaveBeenCalled();
  });

  it('draftAnswer respects maxLength-free single questions and guards', async () => {
    runAiMock.mockResolvedValue({ providerId: 'p', promptTokens: 1, completionTokens: 1, model: 'm', text: '{"answer": "I was a Senior Engineer. I write Go."}' });
    expect(await draftAnswer('Tell us about yourself', [], makeJob(), makeProfile())).toBe('I write Go.');
  });
});

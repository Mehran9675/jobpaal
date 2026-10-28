import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeJob, makeProfile } from './fixtures';

const runAiMock = vi.fn();
vi.mock('@/shared/ai/runAi', () => ({ runAi: (...args: unknown[]) => runAiMock(...args), isAiReady: async () => true }));
vi.mock('@/shared/storage', () => ({ getPromptSettings: async () => ({ tone: '', writingStyle: '', wordsToAvoid: [], themesToEmphasise: [], templates: {} }) }));

const { analyzeJob, deriveRecommendation, normalizeRecommendation, normalizeScore } = await import('@/shared/ai/tasks/analyzeJob');
const { hashString } = await import('@/shared/utils/hash');

describe('recommendation derivation', () => {
  it('derives from score thresholds', () => {
    expect(deriveRecommendation(75)).toBe('strong match');
    expect(deriveRecommendation(74)).toBe('good match');
    expect(deriveRecommendation(55)).toBe('good match');
    expect(deriveRecommendation(54)).toBe('stretch');
    expect(deriveRecommendation(35)).toBe('stretch');
    expect(deriveRecommendation(34)).toBe('weak match');
  });
  it('keeps valid model values and replaces others', () => {
    expect(normalizeRecommendation('Good Match', 90)).toBe('good match');
    expect(normalizeRecommendation('excellent fit', 90)).toBe('strong match');
    expect(normalizeRecommendation(undefined, 10)).toBe('weak match');
  });
  it('clamps scores', () => {
    expect(normalizeScore(150)).toBe(100);
    expect(normalizeScore(-3)).toBe(0);
    expect(normalizeScore('72.6')).toBe(73);
    expect(normalizeScore(0.8)).toBe(80);
  });
});

describe('analyzeJob', () => {
  beforeEach(() => runAiMock.mockReset());

  it('normalises the model output', async () => {
    runAiMock.mockResolvedValue({
      providerId: 'p1',
      promptTokens: 1,
      completionTokens: 1,
      model: 'm',
      text: JSON.stringify({
        seniority: 'senior',
        requiredSkills: ['Go', 'Kafka'],
        preferredSkills: ['Terraform'],
        score: 120,
        recommendation: 'amazing',
        matchedSkills: ['go', 'Kafka', 'Haskell'],
        missingSkills: [],
        reasons: ['Strong Go background'],
      }),
    });
    const job = makeJob();
    const analysis = await analyzeJob(job, makeProfile());
    expect(analysis.score).toBe(100);
    expect(analysis.recommendation).toBe('strong match');
    expect(analysis.matchedSkills).toEqual(['Go']);
    expect(analysis.missingSkills).toEqual(expect.arrayContaining(['Kafka']));
    expect(analysis.descriptionHash).toBe(hashString(job.description));
    expect(analysis.providerId).toBe('p1');
    expect(analysis.analyzedAt).toBeGreaterThan(0);
    expect(analysis.cultureSignals).toEqual([]);
    const [task, request] = runAiMock.mock.calls[0];
    expect(task).toBe('analyze');
    expect(request.json).toBe(true);
    expect(request.messages[0].content).toContain('CORE TRUTHFULNESS RULES');
    expect(request.messages[1].content).not.toContain('ada@example.com');
  });
});

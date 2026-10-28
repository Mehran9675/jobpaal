import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeAnalysis, makeJob, makeProfile } from './fixtures';

const runAiMock = vi.fn();
vi.mock('@/shared/ai/runAi', () => ({ runAi: (...args: unknown[]) => runAiMock(...args), isAiReady: async () => true }));
vi.mock('@/shared/storage', () => ({ getPromptSettings: async () => ({ tone: '', writingStyle: '', wordsToAvoid: [], themesToEmphasise: [], templates: {} }) }));

const { writeCoverLetter, resolveRecipient, stripLetterFrame } = await import('@/shared/ai/tasks/writeCoverLetter');
const { buildBaseResume } = await import('@/shared/resume/baseResume');

const body = [
  'Dear Hiring Manager,',
  '',
  'I am excited to apply for the Senior Backend Engineer role at Globex. As a backend engineer at Acme I build Go services on Kubernetes for a payments platform.',
  '',
  'At Acme I reduced API latency by 40% by caching hot paths and migrated 12 services to Kubernetes. I also tripled throughput with Kafka. Earlier, at Beta GmbH, I built internal billing tools in Python, which taught me to work closely with finance teams and to ship reliable tooling that people depend on every day.',
  '',
  'I would welcome the chance to discuss how my experience with Go and Kubernetes can help Globex scale its platform. Thank you for considering my application and I look forward to hearing from you.',
  '',
  'Sincerely,',
  'Ada Park',
].join('\n');

describe('writeCoverLetter', () => {
  beforeEach(() => runAiMock.mockReset());

  it('frames the letter and drops unsupported sentences', async () => {
    runAiMock.mockResolvedValue({ providerId: 'p', promptTokens: 1, completionTokens: 1, model: 'm', text: JSON.stringify({ recipient: 'Bob Jones', body }) });
    const profile = makeProfile();
    const letter = await writeCoverLetter(makeJob(), makeAnalysis(), profile, buildBaseResume(profile));
    expect(letter.recipient).toBe('Hiring Team');
    expect(letter.company).toBe('Globex');
    expect(letter.role).toBe('Senior Backend Engineer');
    expect(letter.text.startsWith('Dear Hiring Team,\n\n')).toBe(true);
    expect(letter.text.endsWith('Kind regards,\nAda Park')).toBe(true);
    expect(letter.text).toContain('Senior Backend Engineer role at Globex');
    expect(letter.text).toContain('reduced API latency by 40%');
    expect(letter.text).not.toMatch(/Kafka|tripled/);
    expect(letter.text.match(/Dear/g)).toHaveLength(1);
    expect(letter.text).not.toMatch(/Sincerely/);
  });
});

describe('letter helpers', () => {
  it('only uses a recipient named in the posting', () => {
    const job = makeJob();
    expect(resolveRecipient('Jane Smith', job)).toBe('Jane Smith');
    expect(resolveRecipient('Dear John Doe,', job)).toBe('Hiring Team');
    expect(resolveRecipient('Hiring Manager', job)).toBe('Hiring Team');
  });
  it('strips salutation and signature', () => {
    expect(stripLetterFrame('Hi team,\nBody text.\n\nBest regards,\nAda Park', 'Ada Park')).toBe('Body text.');
  });
});

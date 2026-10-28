import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeAnalysis, makeJob, makeProfile } from './fixtures';

const runAiMock = vi.fn();
vi.mock('@/shared/ai/runAi', () => ({ runAi: (...args: unknown[]) => runAiMock(...args), isAiReady: async () => true }));
vi.mock('@/shared/storage', () => ({ getPromptSettings: async () => ({ tone: '', writingStyle: '', wordsToAvoid: [], themesToEmphasise: [], templates: {} }) }));

const { tailorResume, orderSkills, normalizeSectionOrder } = await import('@/shared/ai/tasks/tailorResume');

function reply(data: unknown) {
  return { providerId: 'p1', promptTokens: 10, completionTokens: 10, model: 'm', text: '```json\n' + JSON.stringify(data) + '\n```' };
}

describe('tailorResume', () => {
  beforeEach(() => runAiMock.mockReset());

  it('removes fabricated metrics, skills and seniority upgrades', async () => {
    runAiMock.mockResolvedValue(
      reply({
        headline: 'Senior Backend Engineer · Go, Kafka',
        summary: 'Senior backend engineer with 12 years of Kafka expertise who cut costs by 90%.',
        skillGroupOrder: ['Platforms', 'Languages'],
        prioritySkills: ['Kubernetes', 'Go', 'Kafka'],
        experience: [
          {
            sourceId: 'e1',
            bullets: [
              'Reduced API latency by 75% using Kafka streams',
              'Migrated 12 Go services to Kubernetes',
              'Led a team of 8 engineers as Senior Engineer',
              'Extra bullet one',
              'Extra bullet two',
            ],
          },
          { sourceId: 'e2', bullets: ['Built Python billing tools used by 500 staff'] },
          { sourceId: 'ghost', bullets: ['Worked at Google'] },
        ],
        projects: [{ sourceId: 'p1', bullets: ['Go tracing library used by 300 developers'] }],
        sectionOrder: ['experience', 'skills', 'bogus'],
      }),
    );
    const profile = makeProfile();
    const resume = await tailorResume(makeJob(), makeAnalysis(), profile);
    const all = JSON.stringify(resume);

    expect(all).not.toMatch(/Senior/);
    expect(all).not.toMatch(/Kafka/);
    expect(all).not.toMatch(/75%|90%|500|\b8 engineers|12 years/);
    expect(all).not.toMatch(/Google/);

    expect(resume.headline).toBe('Backend Engineer · Go, Kubernetes');
    expect(resume.summary).toBe(profile.summary);

    const e1 = resume.experience.find((e) => e.sourceId === 'e1')!;
    // 2 highlights + 1 description → max 3 bullets
    // Failing bullets fall back to the original highlight (index 0) or are dropped (index 2, no original).
    expect(e1.bullets).toEqual([
      'Reduced API latency by 40% by caching hot paths',
      'Migrated 12 Go services to Kubernetes',
      'Extra bullet one',
    ]);
    const e2 = resume.experience.find((e) => e.sourceId === 'e2')!;
    expect(e2.bullets).toEqual(['Built internal billing tools in Python']);
    expect(resume.projects[0].bullets).toEqual(['Go tracing library used by 300 developers']);

    // Facts come from the profile.
    expect(e1.title).toBe('Backend Engineer');
    expect(e1.company).toBe('Acme');
    expect(e1.startDate).toBe('2021-03');
    expect(resume.name).toBe('Ada Park');
    expect(resume.contact.email).toBe('ada@example.com');

    expect(resume.skills.map((g) => g.name)).toEqual(['Platforms', 'Languages']);
    expect(resume.skills[0].skills[0]).toBe('Kubernetes');
    expect(resume.skills.flatMap((g) => g.skills).sort()).toEqual(['C++', 'Go', 'Kubernetes', 'Node.js', 'PostgreSQL', 'Python']);
    expect(resume.sectionOrder.slice(0, 2)).toEqual(['experience', 'skills']);
    expect(resume.sectionOrder).toHaveLength(8);
  });

  it('keeps truthful rewrites', async () => {
    runAiMock.mockResolvedValue(
      reply({
        headline: 'Backend Engineer · Kubernetes, Go',
        summary: 'Backend engineer focused on Go services and Kubernetes platforms for payments.',
        experience: [{ sourceId: 'e1', bullets: ['Cut API latency 40% by caching hot paths in Go'] }],
      }),
    );
    const resume = await tailorResume(makeJob(), makeAnalysis(), makeProfile());
    expect(resume.headline).toBe('Backend Engineer · Kubernetes, Go');
    expect(resume.summary).toMatch(/payments/);
    expect(resume.experience[0].bullets).toEqual(['Cut API latency 40% by caching hot paths in Go']);
  });
});

describe('ordering helpers', () => {
  it('orders skills without adding any', () => {
    const groups = [
      { name: 'A', skills: ['x', 'y'] },
      { name: 'B', skills: ['z', 'w'] },
    ];
    expect(orderSkills(groups, [], ['w', 'nonexistent'])).toEqual([
      { name: 'B', skills: ['w', 'z'] },
      { name: 'A', skills: ['x', 'y'] },
    ]);
  });
  it('normalises section order', () => {
    expect(normalizeSectionOrder(['Projects', 'projects', 'nope'])[0]).toBe('projects');
    expect(new Set(normalizeSectionOrder([])).size).toBe(8);
  });
});

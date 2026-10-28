import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/storage', () => ({ getPromptSettings: async () => ({ tone: '', writingStyle: '', wordsToAvoid: [], themesToEmphasise: [], templates: {} }) }));
const { normalizeDate, profileFromParsed } = await import('@/shared/ai/tasks/parseResumeText');

const TEXT = `Ada Park — ada@example.com — +49 151 2345 6789
Backend Engineer at Acme, Berlin (Mar 2021 – Present)
- Reduced API latency by 40%
Skills: Go, Kubernetes`;

describe('parseResumeText post-processing', () => {
  it('normalises dates', () => {
    expect(normalizeDate('Mar 2021')).toBe('2021-03');
    expect(normalizeDate('03/2021')).toBe('2021-03');
    expect(normalizeDate('2021-3')).toBe('2021-03');
    expect(normalizeDate('2020')).toBe('2020');
    expect(normalizeDate('Present')).toBe('');
  });

  it('keeps only facts present in the text and assigns ids', () => {
    const parsed = profileFromParsed(
      {
        basics: { firstName: 'Ada', lastName: 'Park', email: 'ada@example.com', phone: '+49 151 23456789', headline: 'Staff Engineer' },
        skills: [{ name: 'Tech', skills: ['Go', 'Kubernetes', 'Rust'] }],
        experience: [
          { company: 'Acme', title: 'Backend Engineer', startDate: 'Mar 2021', endDate: 'Present', highlights: ['Reduced API latency by 40%'] },
          { company: 'Invented Corp', title: 'CTO' },
        ],
        languages: ['English'],
      },
      TEXT,
    );
    expect(parsed.basics?.headline).toBe('');
    expect(parsed.basics?.phone).toBe('+49 151 23456789');
    expect(parsed.skills?.[0].skills).toEqual(['Go', 'Kubernetes']);
    expect(parsed.skills?.[0].id).toMatch(/^skg_/);
    expect(parsed.experience).toHaveLength(1);
    expect(parsed.experience?.[0]).toMatchObject({ startDate: '2021-03', endDate: '', current: true });
    expect(parsed.experience?.[0].id).toMatch(/^exp_/);
    expect(parsed.languages).toEqual([]);
  });
});

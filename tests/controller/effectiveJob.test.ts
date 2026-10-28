import { describe, expect, it } from 'vitest';
import { buildEffectiveDetection } from '@/content/controller/effectiveJob';
import { emptyForm } from '@/content/controller/state';
import { mergeForms } from '@/content/controller/mergeForms';

const DESCRIPTION = `We are hiring a data analyst to help our operations team make better decisions. You will build dashboards, write SQL queries and present findings to stakeholders across the company.
In this role you will partner with finance and logistics, define metrics with them, and keep our reporting accurate and easy to use. You will also improve the quality of our data pipelines.
You have worked with SQL and a BI tool before, you explain numbers clearly, and you enjoy working with people who are not analysts. Experience with Python is a plus.`;

describe('buildEffectiveDetection', () => {
  it('lists missing fields when nothing was read', () => {
    const d = buildEffectiveDetection('https://example.com/job', 'https://example.com/job', null, { fields: {}, sources: {} }, emptyForm(), false);
    expect(d.isJobPage).toBe(false);
    expect(d.issues.map((i) => i.field)).toEqual(['title', 'company', 'description']);
    expect(d.hasValidDescription).toBe(false);
  });

  it('applies a pasted description and marks the page usable', () => {
    const d = buildEffectiveDetection(
      'https://example.com/job',
      'https://example.com/job',
      null,
      {
        fields: { title: 'Data Analyst', company: 'Acme', description: DESCRIPTION },
        sources: { title: 'picked', company: 'picked', description: 'pasted' },
      },
      emptyForm(),
      true,
    );
    expect(d.isJobPage).toBe(true);
    expect(d.hasValidDescription).toBe(true);
    expect(d.issues).toEqual([]);
    expect(d.job?.sources.description).toBe('pasted');
    expect(d.job?.id.startsWith('job_')).toBe(true);
  });

  it('rejects a pasted non-description with a clear reason', () => {
    const d = buildEffectiveDetection(
      'https://example.com/job',
      'https://example.com/job',
      null,
      { fields: { description: 'Yes No Maybe' }, sources: { description: 'pasted' } },
      emptyForm(),
      true,
    );
    expect(d.hasValidDescription).toBe(false);
    expect(d.issues.find((i) => i.field === 'description')?.message).toMatch(/not usable/);
  });
});

describe('mergeForms', () => {
  it('combines forms from several frames', () => {
    const a = { ...emptyForm(), hasForm: true, fieldCount: 3 };
    const b = { ...emptyForm(), hasForm: true, fieldCount: 5, hasResumeUpload: true, hasCoverLetterField: true, coverLetterFieldKind: 'upload' as const };
    const merged = mergeForms([a, b]);
    expect(merged.fieldCount).toBe(8);
    expect(merged.hasResumeUpload).toBe(true);
    expect(merged.coverLetterFieldKind).toBe('upload');
  });
});

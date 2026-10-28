import { describe, expect, it } from 'vitest';
import { filterApplications } from '@/options/lib/applicationFilters';
import { filterDocuments, formatFromFileName, regeneratePartForKind } from '@/options/lib/documents';
import { formatBytes } from '@/options/lib/format';
import { importFileKind, looksLikeJsonResume, summarizeImport } from '@/options/lib/importSummary';
import { searchPresets } from '@/options/lib/providers';
import { computePipelineStats } from '@/options/lib/stats';
import type { Application, ApplicationStatus, ProviderPreset, StoredDocument } from '@/shared/types';

function app(id: string, status: ApplicationStatus, updatedAt: number, job: Partial<Application['job']> = {}): Application {
  return {
    id,
    pageKey: id,
    status,
    analysis: null,
    resume: null,
    coverLetter: null,
    answers: [],
    documentIds: [],
    notes: '',
    timeline: [],
    createdAt: 0,
    updatedAt,
    job: {
      id,
      url: '',
      pageKey: id,
      host: 'example.com',
      siteName: 'Example',
      atsKey: 'generic',
      title: '',
      company: '',
      location: '',
      salary: '',
      employmentType: '',
      description: '',
      requirements: [],
      keywords: [],
      postedAt: '',
      sources: {},
      detectedAt: 0,
      ...job,
    },
  };
}

function doc(id: string, patch: Partial<StoredDocument> = {}): StoredDocument {
  return {
    id,
    applicationId: null,
    kind: 'resume',
    format: 'pdf',
    fileName: `${id}.pdf`,
    mimeType: 'application/pdf',
    size: 100,
    source: 'generated',
    createdAt: 0,
    updatedAt: 0,
    label: '',
    ...patch,
  };
}

describe('computePipelineStats', () => {
  it('counts tracked, interviews (interview + technical), offers and generated documents', () => {
    const apps = [app('a', 'draft', 1), app('b', 'interview', 2), app('c', 'technical', 3), app('d', 'offer', 4), app('e', 'rejected', 5)];
    const docs = [doc('1'), doc('2'), doc('3', { source: 'uploaded', kind: 'uploaded' })];
    const stats = computePipelineStats(apps, docs);
    expect(stats.tracked).toBe(5);
    expect(stats.interviews).toBe(2);
    expect(stats.offers).toBe(1);
    expect(stats.documentsGenerated).toBe(2);
    expect(stats.byStatus.rejected).toBe(1);
    expect(stats.byStatus.applied).toBe(0);
  });
});

describe('filterApplications', () => {
  const apps = [
    app('a', 'applied', 10, { title: 'Frontend Engineer', company: 'Acme' }),
    app('b', 'draft', 30, { title: 'Data Analyst', company: 'Globex', siteName: 'Greenhouse' }),
    app('c', 'applied', 20, { title: 'Backend Engineer', company: 'Initech' }),
  ];
  it('searches title, company and site; sorts by updated desc', () => {
    expect(filterApplications(apps, { search: 'engineer', status: 'all' }).map((a) => a.id)).toEqual(['c', 'a']);
    expect(filterApplications(apps, { search: 'greenhouse', status: 'all' }).map((a) => a.id)).toEqual(['b']);
    expect(filterApplications(apps, { search: '', status: 'all' }).map((a) => a.id)).toEqual(['b', 'c', 'a']);
  });
  it('filters by status', () => {
    expect(filterApplications(apps, { search: '', status: 'applied' }).map((a) => a.id)).toEqual(['c', 'a']);
  });
});

describe('documents helpers', () => {
  it('maps kinds to regenerate parts', () => {
    expect(regeneratePartForKind('resume')).toBe('resume');
    expect(regeneratePartForKind('cover-letter')).toBe('cover-letter');
    expect(regeneratePartForKind('answers')).toBe('answers');
    expect(regeneratePartForKind('uploaded')).toBeNull();
  });

  it('filters documents by kind, format, source and search (incl. application)', () => {
    const docs = [
      doc('1', { applicationId: 'x' }),
      doc('2', { kind: 'cover-letter', format: 'docx', fileName: 'Jo-Doe-cover-letter.docx' }),
      doc('3', { source: 'uploaded', kind: 'uploaded', label: 'Resume · short' }),
    ];
    const apps = { x: app('x', 'draft', 0, { title: 'Designer', company: 'Umbrella' }) };
    const base = { kind: 'all', format: 'all', source: 'all', search: '' } as const;
    expect(filterDocuments(docs, { ...base, kind: 'cover-letter' }).map((d) => d.id)).toEqual(['2']);
    expect(filterDocuments(docs, { ...base, format: 'docx' }).map((d) => d.id)).toEqual(['2']);
    expect(filterDocuments(docs, { ...base, source: 'uploaded' }).map((d) => d.id)).toEqual(['3']);
    expect(filterDocuments(docs, { ...base, search: 'umbrella' }, apps).map((d) => d.id)).toEqual(['1']);
    expect(filterDocuments(docs, { ...base, search: 'short' }).map((d) => d.id)).toEqual(['3']);
  });

  it('detects formats from file names', () => {
    expect(formatFromFileName('cv.PDF')).toBe('pdf');
    expect(formatFromFileName('cv.docx')).toBe('docx');
    expect(formatFromFileName('notes.markdown')).toBe('md');
    expect(formatFromFileName('cv.odt')).toBe('other');
  });
});

describe('import helpers', () => {
  it('classifies import files', () => {
    expect(importFileKind('resume.json')).toBe('json');
    expect(importFileKind('resume.pdf')).toBe('text');
    expect(importFileKind('resume.DOCX')).toBe('text');
    expect(importFileKind('photo.png')).toBe('unsupported');
  });

  it('recognises JSON Resume objects', () => {
    expect(looksLikeJsonResume({ basics: { name: 'A' } })).toBe(true);
    expect(looksLikeJsonResume({ app: 'jobpaal' })).toBe(false);
    expect(looksLikeJsonResume([])).toBe(false);
  });

  it('summarises what was found', () => {
    const lines = summarizeImport({
      basics: { firstName: 'Jo', lastName: 'Doe', headline: '', email: 'jo@example.com', phone: '', photo: '', location: { address: '', city: 'Oslo', region: '', postalCode: '', country: 'Norway' } },
      skills: [{ id: '1', name: 'Tools', skills: ['Git', 'Figma'] }],
      experience: [
        { id: 'e', company: 'Acme', title: 'Engineer', location: '', startDate: '', endDate: '', current: true, description: '', highlights: [], skills: [] },
      ],
    });
    const byLabel = Object.fromEntries(lines.map((l) => [l.label, l.value]));
    expect(byLabel.Name).toBe('Jo Doe');
    expect(byLabel.Location).toBe('Oslo, Norway');
    expect(byLabel.Skills).toBe('2 skills in 1 group');
    expect(byLabel.Experience).toContain('Engineer at Acme');
    expect(summarizeImport({})).toEqual([]);
  });
});

describe('misc', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('searches provider presets', () => {
    const presets = [
      { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', notes: '' },
      { id: 'ollama', name: 'Ollama', baseUrl: 'http://localhost:11434/v1', notes: 'Local models' },
    ] as ProviderPreset[];
    expect(searchPresets(presets, '').length).toBe(2);
    expect(searchPresets(presets, 'local').map((p) => p.id)).toEqual(['ollama']);
    expect(searchPresets(presets, 'OPENAI').map((p) => p.id)).toEqual(['openai']);
  });
});

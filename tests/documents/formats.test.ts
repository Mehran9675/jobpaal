import mammoth from 'mammoth';
import { describe, expect, it } from 'vitest';
import {
  renderAnswers,
  renderCoverLetter,
  renderCoverLetterHtml,
  renderResume,
  renderResumeHtml,
  resumeToJsonResume,
  TEMPLATES,
} from '@/shared/documents';
import { bytesToText } from '@/shared/utils/base64';
import { design, PNG_DATA_URL, resume } from './fixtures';

const letter = {
  text: 'Dear Hiring Team,\n\nI am applying for the role.\n\nKind regards,\nJane Doe',
  recipient: '',
  company: 'Acme',
  role: 'Engineer',
};

describe('DOCX rendering', () => {
  it('produces a zip for every template', async () => {
    for (const template of TEMPLATES) {
      const bytes = await renderResume(resume({ photo: PNG_DATA_URL }), design({ template: template.id, showPhoto: true }), 'docx');
      expect(bytesToText(bytes.slice(0, 2))).toBe('PK');
    }
    const answers = await renderAnswers([{ id: '1', question: 'Q?', answer: 'A.', source: 'manual', edited: false }], resume(), design(), 'docx');
    expect(bytesToText(answers.slice(0, 2))).toBe('PK');
  });

  it('is a readable Word document', async () => {
    const bytes = await renderResume(resume(), design({ template: 'classic' }), 'docx');
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    expect(value).toContain('Jane Doe');
    expect(value).toContain('Led the migration to TypeScript.');
  });
});

describe('HTML rendering', () => {
  it('escapes content and is a standalone document', () => {
    const html = renderResumeHtml(resume({ summary: '<script>alert(1)</script>' }), design({ pageSize: 'Letter' }));
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('@page{size:letter');
    expect(html).toContain('<title>Jane Doe – Resume</title>');
  });

  it('html format returns UTF-8 bytes of the same document', async () => {
    const bytes = await renderResume(resume(), design(), 'html');
    expect(bytesToText(bytes)).toBe(renderResumeHtml(resume(), design()));
  });

  it('renders the cover letter text without adding salutations', () => {
    const html = renderCoverLetterHtml(letter, resume(), design());
    expect(html.match(/Dear Hiring Team/g)).toHaveLength(1);
    expect(html).toContain('Kind regards,<br>Jane Doe');
  });
});

describe('Markdown and text', () => {
  it('markdown has headings and bullets', async () => {
    const md = bytesToText(await renderResume(resume(), design(), 'md'));
    expect(md).toContain('# Jane Doe');
    expect(md).toContain('## Experience');
    expect(md).toContain('- Led the migration to TypeScript.');
    expect(md).toContain('[LinkedIn](https://www.linkedin.com/in/janedoe)');
  });

  it('plain text is readable', async () => {
    const txt = bytesToText(await renderResume(resume(), design(), 'txt'));
    expect(txt).toContain('JANE DOE');
    expect(txt).toContain('EXPERIENCE\n----------');
    expect(txt).toContain('  - Built the billing service.');
  });

  it('cover letter markdown has the date and paragraphs', async () => {
    const md = bytesToText(await renderCoverLetter(letter, resume(), design(), 'md'));
    expect(md).toMatch(/\d{4}/);
    expect(md).toContain('I am applying for the role.');
  });
});

describe('sections', () => {
  it('omits hidden and empty sections and follows the design order', async () => {
    const content = resume({ awards: [], summary: '   ' });
    const md = bytesToText(
      await renderResume(content, design({ hiddenSections: ['skills'], sectionOrder: ['education', 'experience'] }), 'md'),
    );
    expect(md).not.toContain('## Skills');
    expect(md).not.toContain('## Awards');
    expect(md).not.toContain('## Summary');
    expect(md.indexOf('## Education')).toBeLessThan(md.indexOf('## Experience'));
    // Missing keys are appended after the configured ones.
    expect(md.indexOf('## Experience')).toBeLessThan(md.indexOf('## Projects'));
    const html = renderResumeHtml(content, design({ hiddenSections: ['experience'] }));
    expect(html).not.toContain('Senior Engineer</span>');
  });

  it('only shows the photo when enabled', () => {
    expect(renderResumeHtml(resume({ photo: PNG_DATA_URL }), design({ showPhoto: false }))).not.toContain('<img');
    expect(renderResumeHtml(resume({ photo: PNG_DATA_URL }), design({ showPhoto: true }))).toContain('<img');
  });
});

describe('JSON', () => {
  it('maps to JSON Resume', () => {
    const json = resumeToJsonResume(resume()) as Record<string, any>;
    expect(json.basics.name).toBe('Jane Doe');
    expect(json.basics.label).toBe('Senior Software Engineer');
    expect(json.basics.url).toBe('https://jane.dev');
    expect(json.basics.profiles).toEqual([
      { network: 'LinkedIn', username: 'janedoe', url: 'https://www.linkedin.com/in/janedoe' },
      { network: 'GitHub', username: 'janedoe', url: 'https://github.com/janedoe' },
    ]);
    expect(json.work[0]).toMatchObject({ name: 'Acme', position: 'Senior Engineer', startDate: '2021-03' });
    expect(json.work[0].endDate).toBeUndefined();
    expect(json.work[1].highlights).toEqual(['Built the billing service.']);
    expect(json.education[0]).toMatchObject({ institution: 'TU Berlin', studyType: 'BSc', area: 'Computer Science' });
    expect(json.skills[0]).toEqual({ name: 'Languages', keywords: ['TypeScript', 'Go', 'SQL'] });
    expect(json.languages).toHaveLength(2);
    expect(json.projects[0].roles).toEqual(['Maintainer']);
    expect(json.awards[0].awarder).toBe('Acme');
    expect(json.certificates[0]).toMatchObject({ name: 'AWS Solutions Architect', issuer: 'Amazon' });
  });

  it('json format is pretty-printed', async () => {
    const text = bytesToText(await renderResume(resume(), design(), 'json'));
    expect(JSON.parse(text).basics.email).toBe('jane@example.com');
    expect(text).toContain('\n  "basics"');
    const answers = JSON.parse(bytesToText(await renderAnswers([{ id: '1', question: 'Q', answer: 'A', source: 'manual', edited: false }], resume(), design(), 'json')));
    expect(answers.answers).toEqual([{ question: 'Q', answer: 'A' }]);
  });
});

import { describe, expect, it } from 'vitest';
import { buildFileName } from '@/shared/documents';
import { dayKey } from '@/shared/utils/date';

const jane = { firstName: 'Jane', lastName: 'Doe' };

describe('buildFileName', () => {
  it('uses the default pattern', () => {
    expect(buildFileName('{first}-{last}-{kind}', jane, 'resume', 'pdf')).toBe('Jane-Doe-resume.pdf');
    expect(buildFileName('', jane, 'cover-letter', 'docx')).toBe('Jane-Doe-cover-letter.docx');
  });

  it('fills the date token', () => {
    expect(buildFileName('{last}_{kind}_{date}', jane, 'answers', '.txt')).toBe(`Doe_answers_${dayKey()}.txt`);
  });

  it('sanitizes, collapses and strips hyphens', () => {
    expect(buildFileName('  {first} {last} -- {kind}!! ', { firstName: 'Zoë Anne', lastName: "O'Brien" }, 'resume', 'pdf')).toBe(
      'Zoe-Anne-O-Brien-resume.pdf',
    );
    expect(buildFileName('---{first}---', jane, 'resume', 'md')).toBe('Jane.md');
  });

  it('falls back to the kind when empty', () => {
    expect(buildFileName('{first}{last}', { firstName: '', lastName: '' }, 'resume', 'pdf')).toBe('resume.pdf');
    expect(buildFileName('東京', jane, 'answers', 'json')).toBe('answers.json');
  });

  it('drops unknown tokens such as {company}', () => {
    expect(buildFileName('{first}-{company}-{role}-{kind}', jane, 'resume', 'pdf')).toBe('Jane-resume.pdf');
  });
});

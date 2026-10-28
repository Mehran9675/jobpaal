import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { renderAnswers, renderCoverLetter, renderResume, TEMPLATES } from '@/shared/documents';
import { bytesToText } from '@/shared/utils/base64';
import { design, longResume, PNG_DATA_URL, resume } from './fixtures';

const isPdf = (bytes: Uint8Array) => bytesToText(bytes.slice(0, 4)) === '%PDF';

describe('PDF rendering', () => {
  for (const template of TEMPLATES) {
    for (const density of ['comfortable', 'compact'] as const) {
      it(`renders ${template.id} (${density})`, async () => {
        const bytes = await renderResume(
          resume({ photo: PNG_DATA_URL }),
          design({ template: template.id, density, showPhoto: true, pageSize: density === 'compact' ? 'Letter' : 'A4' }),
          'pdf',
        );
        expect(isPdf(bytes)).toBe(true);
        const doc = await PDFDocument.load(bytes, { updateMetadata: false });
        expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
        expect(doc.getTitle()).toBe('Jane Doe – Resume');
        expect(doc.getProducer()).toBe('JobPaal');
      });
    }
  }

  it('uses the requested page size', async () => {
    const doc = await PDFDocument.load(await renderResume(resume(), design({ pageSize: 'Letter' }), 'pdf'));
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(612);
    expect(Math.round(height)).toBe(792);
  });

  it('breaks long resumes across pages', async () => {
    for (const template of TEMPLATES) {
      const doc = await PDFDocument.load(await renderResume(longResume(), design({ template: template.id }), 'pdf'));
      expect(doc.getPageCount()).toBeGreaterThan(1);
    }
  });

  it('does not throw on Unicode text with standard fonts', async () => {
    const content = resume({
      name: 'Zoë — “quotes” → 東京',
      summary: 'Zoë — “quotes” → 東京 ≥ 5 ✓ emoji 🚀 ł ő​\ttab',
      skills: [{ name: 'Ünïcode', skills: ['C#', '東京', '→'] }],
    });
    for (const template of TEMPLATES) {
      const bytes = await renderResume(content, design({ template: template.id }), 'pdf');
      expect(isPdf(bytes)).toBe(true);
    }
  });

  it('ignores an invalid custom font and an invalid photo', async () => {
    const bytes = await renderResume(
      resume({ photo: 'data:image/png;base64,AAAA' }),
      design({ showPhoto: true, customFont: { name: 'Broken', regularBase64: 'AAAA', boldBase64: '' } }),
      'pdf',
    );
    expect(isPdf(bytes)).toBe(true);
  });

  it('renders cover letters and answers', async () => {
    const letter = await renderCoverLetter(
      { text: 'Dear Hiring Team,\n\nI am applying.\n\nKind regards,\nJane Doe', recipient: '', company: 'Acme', role: 'Engineer' },
      resume(),
      design({ template: 'executive' }),
      'pdf',
    );
    const letterDoc = await PDFDocument.load(letter);
    expect(letterDoc.getTitle()).toBe('Jane Doe – Cover letter');
    expect(letterDoc.getTitle()).not.toContain('Acme');

    const answers = await renderAnswers(
      [{ id: '1', question: 'Why us?', answer: 'Because.', source: 'generated', edited: false }],
      resume(),
      design(),
      'pdf',
    );
    expect(isPdf(answers)).toBe(true);
  });
});

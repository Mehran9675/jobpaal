import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachFile, clearHighlights, fieldIdFor, fillFieldById, fillForm, labelFor, scanForm } from '@/content/autofill';
import { yearsOfExperience } from '@/content/autofill/values';
import { load, samplePlan } from './helpers';

const FORM = `<html><body>
  <form id="apply" action="/submit">
    <label for="fn">First name *</label><input id="fn" name="first_name" required>
    <label for="ln">Last name</label><input id="ln" name="last_name" value="Existing">
    <label>Email <input type="email" name="email"></label>
    <input type="password" name="pw" aria-label="Password">
    <input type="hidden" name="token" value="x">
    <div><label for="resume">Resume/CV</label><input type="file" id="resume" name="resume"></div>
    <div><label for="cl">Cover letter</label><textarea id="cl" name="cover_letter"></textarea></div>
    <label for="country">Country</label>
    <select id="country" name="country"><option value="">Select...</option><option value="us">United States</option><option value="uk">United Kingdom</option></select>
    <fieldset><legend>Will you now or in the future require visa sponsorship?</legend>
      <label><input type="radio" name="sponsor" value="1"> Yes</label>
      <label><input type="radio" name="sponsor" value="0"> No</label>
    </fieldset>
    <label for="why">Why do you want to join Acme?</label><textarea id="why" name="q_why" maxlength="500"></textarea>
    <div class="q"><div>What is your preferred working style?</div>
      <label><input type="radio" name="style" value="remote"> Remote</label>
      <label><input type="radio" name="style" value="office"> Office</label></div>
    <label><input type="checkbox" name="consent"> I agree to the privacy policy</label>
    <input type="text" name="disabled_one" disabled aria-label="Disabled">
    <div style="display:none"><input name="hidden_text" aria-label="Hidden text"></div>
    <button type="submit">Submit application</button>
  </form></body></html>`;

afterEach(() => vi.restoreAllMocks());

describe('labels and ids', () => {
  it('reads labels from several sources', () => {
    load(FORM);
    expect(labelFor(document.getElementById('fn')!)).toBe('First name');
    expect(labelFor(document.querySelector('[name=email]')!)).toBe('Email');
    const id = fieldIdFor(document.getElementById('fn')!);
    expect(id).toMatch(/^jpf-/);
    expect(fieldIdFor(document.getElementById('fn')!)).toBe(id);
    expect(document.getElementById('fn')!.getAttribute('data-jobpaal-field')).toBe(id);
  });
});

describe('scanForm', () => {
  it('finds resume upload, cover letter and screening questions', () => {
    load(FORM);
    const summary = scanForm(document, 3);
    expect(summary.hasForm).toBe(true);
    expect(summary.hasResumeUpload).toBe(true);
    expect(summary.hasCoverLetterField).toBe(true);
    expect(summary.coverLetterFieldKind).toBe('text');
    expect(summary.fileInputCount).toBe(1);
    const questions = summary.screeningQuestions.map((q) => q.question);
    expect(questions).toContain('Why do you want to join Acme?');
    expect(questions).toContain('What is your preferred working style?');
    expect(questions).not.toContain('First name');
    expect(questions.some((q) => /sponsorship/.test(q))).toBe(false); // a profile key
    expect(questions.some((q) => /privacy/.test(q))).toBe(false);
    const why = summary.screeningQuestions.find((q) => q.question.startsWith('Why'))!;
    expect(why).toMatchObject({ kind: 'textarea', maxLength: 500, frameId: 3, required: false });
    const style = summary.screeningQuestions.find((q) => q.question.startsWith('What is'))!;
    expect(style.kind).toBe('radio');
    expect(style.options).toEqual(['Remote', 'Office']);
    // skipped controls are never counted
    expect(document.querySelector('[name=pw]')!.hasAttribute('data-jobpaal-field')).toBe(false);
    expect(document.querySelector('[name=hidden_text]')!.hasAttribute('data-jobpaal-field')).toBe(false);
    expect(document.querySelector('[name=disabled_one]')!.hasAttribute('data-jobpaal-field')).toBe(false);
  });

  it('reports a cover letter upload', () => {
    load(`<form><label for="r">Resume</label><input type="file" id="r"><label for="c">Cover Letter</label><input type="file" id="c"></form>`);
    const summary = scanForm(document, 0);
    expect(summary.hasResumeUpload).toBe(true);
    expect(summary.coverLetterFieldKind).toBe('upload');
  });
});

describe('fillForm', () => {
  it('fills text, select and radio fields, keeps existing values, never submits', async () => {
    load(FORM);
    const form = document.getElementById('apply') as HTMLFormElement;
    const submitSpy = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', submitSpy);
    const nativeSubmit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);
    const requestSubmit = vi.spyOn(HTMLFormElement.prototype, 'requestSubmit').mockImplementation(() => undefined);
    const inputEvents: string[] = [];
    document.getElementById('fn')!.addEventListener('input', () => inputEvents.push('input'));
    document.getElementById('fn')!.addEventListener('change', () => inputEvents.push('change'));

    const summary = scanForm(document, 0);
    const why = summary.screeningQuestions.find((q) => q.question.startsWith('Why'))!;
    const plan = samplePlan({
      answers: [
        { question: why.question, answer: 'Because I love analytical engines.', fieldId: why.fieldId },
        { question: 'What is your preferred working style?', answer: 'Remote' },
      ],
    });
    const report = await fillForm(document, plan);

    expect((document.getElementById('fn') as HTMLInputElement).value).toBe('Ada');
    expect(inputEvents).toEqual(['input', 'change']);
    expect((document.getElementById('ln') as HTMLInputElement).value).toBe('Existing');
    expect((document.querySelector('[name=email]') as HTMLInputElement).value).toBe('ada@example.com');
    expect((document.getElementById('country') as HTMLSelectElement).value).toBe('uk');
    expect((document.querySelector('input[name=sponsor][value="0"]') as HTMLInputElement).checked).toBe(true);
    expect((document.getElementById('why') as HTMLTextAreaElement).value).toBe('Because I love analytical engines.');
    expect((document.getElementById('cl') as HTMLTextAreaElement).value).toBe('Dear hiring team, I would love to join.');
    expect((document.querySelector('input[name=style][value=remote]') as HTMLInputElement).checked).toBe(true);
    expect((document.querySelector('input[name=consent]') as HTMLInputElement).checked).toBe(false);
    expect(document.getElementById('fn')!.getAttribute('data-jobpaal-filled')).toBe('1');

    expect(report.filled).toBeGreaterThanOrEqual(7);
    expect(report.items.find((i) => i.label === 'Last name')?.status).toBe('skipped');
    expect(submitSpy).not.toHaveBeenCalled();
    expect(nativeSubmit).not.toHaveBeenCalled();
    expect(requestSubmit).not.toHaveBeenCalled();

    clearHighlights(document);
    expect(document.querySelector('[data-jobpaal-filled]')).toBeNull();
  });

  it('overwrites existing values when allowed', async () => {
    load(FORM);
    const plan = samplePlan();
    plan.options.overwriteExisting = true;
    await fillForm(document, plan);
    expect((document.getElementById('ln') as HTMLInputElement).value).toBe('Lovelace');
  });

  it('uses saved answers by question similarity', async () => {
    load(`<form><label for="q">Why do you want to join Acme Corp?</label><textarea id="q"></textarea>
      <label for="n">Name</label><input id="n"></form>`);
    const plan = samplePlan({
      savedAnswers: [{ id: 'a1', question: 'Why do you want to join Acme?', answer: 'Saved answer', createdAt: 0, usedCount: 0 }],
    });
    await fillForm(document, plan);
    expect((document.getElementById('q') as HTMLTextAreaElement).value).toBe('Saved answer');
    expect((document.getElementById('n') as HTMLInputElement).value).toBe('Ada Lovelace');
  });

  it('fills a field by id and handles missing DataTransfer gracefully', async () => {
    load(FORM);
    const summary = scanForm(document, 0);
    const why = summary.screeningQuestions.find((q) => q.question.startsWith('Why'))!;
    expect(fillFieldById(document, why.fieldId, 'Typed answer')).toBe(true);
    expect((document.getElementById('why') as HTMLTextAreaElement).value).toBe('Typed answer');
    expect(fillFieldById(document, 'jpf-missing', 'x')).toBe(false);
    const ok = await attachFile(document, null, 'resume', { documentId: 'd', fileName: 'Ada-resume.pdf', mimeType: 'application/pdf', base64: 'JVBERi0=' });
    expect(typeof ok).toBe('boolean');
  });
});

describe('values', () => {
  it('merges overlapping experience ranges', () => {
    const base = { id: '', company: '', title: '', location: '', description: '', highlights: [], skills: [] };
    const years = yearsOfExperience([
      { ...base, startDate: '2010-01', endDate: '2014-01', current: false },
      { ...base, startDate: '2012-01', endDate: '2016-01', current: false },
      { ...base, startDate: '2018-01', endDate: '2019-01', current: false },
    ]);
    expect(years).toBe(7);
  });
});

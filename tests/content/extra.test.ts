import { describe, expect, it } from 'vitest';
import { scanForm } from '@/content/autofill';
import { fillFieldById } from '@/content/autofill';
import { detectJob } from '@/content/detection';
import { DESCRIPTION_HTML, load } from './helpers';

describe('shadow DOM and overlay', () => {
  it('finds fields in open shadow roots and ignores the JobPaal overlay', () => {
    load('<div id="host"></div><div id="jobpaal-root"><input aria-label="Overlay input"><textarea aria-label="Overlay note"></textarea></div>');
    const root = document.getElementById('host')!.attachShadow({ mode: 'open' });
    root.innerHTML = '<label for="q">Why do you want this job?</label><textarea id="q"></textarea><label for="e">Email</label><input id="e" type="email">';
    const summary = scanForm(document, 0);
    expect(summary.fieldCount).toBe(2);
    expect(summary.screeningQuestions.map((q) => q.question)).toEqual(['Why do you want this job?']);
    expect(fillFieldById(document, summary.screeningQuestions[0].fieldId, 'Because.')).toBe(true);
    expect((root.getElementById('q') as HTMLTextAreaElement).value).toBe('Because.');
  });
});

describe('listing pages', () => {
  it('is not a job page when there are many job cards', () => {
    const cards = Array.from({ length: 20 }, (_, i) => `<li><a href="/jobs/${1000 + i}-engineer-role">Engineer ${i}</a></li>`).join('');
    load(`<html><head><title>Jobs</title></head><body><h1>Open roles</h1><ul>${cards}</ul><div>${DESCRIPTION_HTML.replace(/<h[23]>[^<]*<\/h[23]>/g, '')}</div></body></html>`);
    const result = detectJob(document, 'https://example.com/jobs', null);
    expect(result.isJobPage).toBe(false);
  });

  it('reads salary from a salary element', () => {
    load(`<html><head><title>Engineer at Acme</title></head><body><h1>Backend Engineer</h1>
      <div class="Job-Salary">$120,000 - $150,000 a year</div><div>${DESCRIPTION_HTML}</div><a href="/apply">Apply now</a></body></html>`);
    const result = detectJob(document, 'https://acme.example/careers/backend', null);
    expect(result.job?.salary).toBe('$120,000 - $150,000 a year');
    expect(result.job?.company).toBe('Acme');
    expect(result.isJobPage).toBe(true);
  });
});

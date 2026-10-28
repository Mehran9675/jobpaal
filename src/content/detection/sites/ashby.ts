import { cleanInline } from '@/content/picker/dom';
import { companyFromSlug, labelledValue } from '../dom';
import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs, pathSegment } from './helpers';

export const ashbyAdapter: SiteAdapter = {
  key: 'ashby',
  name: 'Ashby',
  matches: (url, doc) => hostIs(url, 'jobs.ashbyhq.com') || !!doc.querySelector('#ashby_embed, [id^="ashby_embed"]'),
  isJobPage: (url) => url.pathname.split('/').filter(Boolean).length >= 2 || url.searchParams.has('ashby_jid'),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['h1[class*="_title_"]', '[class*="_jobPostingHeader"] h1', '[class*="_title_"]', 'h1'],
      description: ['[class*="_descriptionText_"]', '#overview [class*="_description"]', '[class*="_description_"]', '#overview'],
    });
    job.location = labelledValue(doc, /location/, 150) || undefined;
    job.employmentType = labelledValue(doc, /employment type/, 80) || undefined;
    job.salary = labelledValue(doc, /compensation/, 150) || undefined;
    const fromTitle = /@\s*(.+)$/.exec(cleanInline(doc.title))?.[1];
    job.company = fromTitle || companyFromSlug(pathSegment(url, 0));
    return job;
  },
};

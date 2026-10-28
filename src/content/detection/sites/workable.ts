import { cleanInline } from '@/content/picker/dom';
import { companyFromSlug, joinedBlocks } from '../dom';
import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs, pathSegment } from './helpers';

export const workableAdapter: SiteAdapter = {
  key: 'workable',
  name: 'Workable',
  matches: (url) => hostIs(url, 'apply.workable.com', 'jobs.workable.com'),
  isJobPage: (url) => /\/j\/[A-Za-z0-9]+/.test(url.pathname) || /\/view\//.test(url.pathname),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['h1[data-ui="job-title"]', '[data-ui="job-title"]', 'h1'],
      location: ['[data-ui="job-location"]', '[data-ui="job-location-tooltip"]'],
      employmentType: ['[data-ui="job-type"]'],
      salary: ['[data-ui="job-salary"]'],
      description: ['[data-ui="job-description"]'],
    });
    const joined = joinedBlocks(doc, '[data-ui="job-description"], [data-ui="job-requirements"], [data-ui="job-benefits"]');
    if (joined.length > (job.description?.length ?? 0)) job.description = joined;
    const name = cleanInline(doc.querySelector('[data-ui="company-name"], header img[alt]')?.textContent || doc.querySelector('header img[alt]')?.getAttribute('alt'), 80);
    const titleParts = cleanInline(doc.title).split(/\s+-\s+/);
    job.company = name || (titleParts.length > 1 ? titleParts[titleParts.length - 1] : '') || companyFromSlug(pathSegment(url, 0));
    return job;
  },
};

import { companyFromSubdomain, meta } from '../dom';
import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs } from './helpers';

export const recruiteeAdapter: SiteAdapter = {
  key: 'recruitee',
  name: 'Recruitee',
  matches: (url) => hostIs(url, 'recruitee.com'),
  isJobPage: (url) => /\/o\/[^/]+/.test(url.pathname),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['.job-title', '[data-testid="job-title"]', 'h1'],
      location: ['.job-location', '[data-testid="job-location"]', '[class*="location"]'],
      employmentType: ['[data-testid="employment-type"]', '.job-employment-type'],
      description: ['.job-description', '[data-testid="job-description"]', '[class*="description"]'],
    });
    job.company = meta(doc, ['og:site_name']) || companyFromSubdomain(url.hostname);
    return job;
  },
};

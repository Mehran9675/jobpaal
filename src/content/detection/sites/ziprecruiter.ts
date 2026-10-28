import type { SiteAdapter } from '../types';
import { exists, extractBySelectors, hostIs } from './helpers';

export const ziprecruiterAdapter: SiteAdapter = {
  key: 'ziprecruiter',
  name: 'ZipRecruiter',
  matches: (url) => hostIs(url, 'ziprecruiter.com', 'ziprecruiter.co.uk', 'ziprecruiter.ca'),
  isJobPage: (url, doc) =>
    /\/(c\/[^/]+\/job\/|jobs\/|job\/|k\/)/i.test(url.pathname) && !/\/(candidate\/)?search/i.test(url.pathname)
      ? true
      : url.searchParams.has('lvk') || exists(doc, '.job_description, [class*="job_description"]'),
  extract: (doc) =>
    extractBySelectors(doc, {
      title: ['h1.job_title', '[class*="job_title"] h1', '[data-testid="job-details-title"]', 'h1'],
      company: [
        '.hiring_company_text a',
        'a.hiring_company',
        '[data-testid="job-details-company"]',
        '[class*="hiring_company"]',
      ],
      location: ['.location_text', '[data-testid="job-details-location"]', '[class*="location_text"]'],
      salary: ['[data-testid="job-details-salary"]', '.salary_range', '[class*="pay_range"]'],
      employmentType: ['[data-testid="job-details-employment-type"]', '.employment_type'],
      description: ['.job_description', '.jobDescriptionSection', '[class*="job_description"]', '[data-testid="job-description"]'],
    }),
};

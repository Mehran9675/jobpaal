import type { SiteAdapter } from '../types';
import { exists, extractBySelectors, hostIs } from './helpers';

export const indeedAdapter: SiteAdapter = {
  key: 'indeed',
  name: 'Indeed',
  matches: (url) => /(^|\.)indeed\.[a-z.]+$/i.test(url.hostname),
  isJobPage: (url, doc) =>
    /\/(viewjob|rc\/clk|m\/viewjob|pagead\/clk)/.test(url.pathname) ||
    url.searchParams.has('vjk') ||
    url.searchParams.has('jk') ||
    exists(doc, '#jobDescriptionText') ||
    hostIs(url, 'smartapply.indeed.com'),
  extract: (doc) =>
    extractBySelectors(doc, {
      title: [
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        'h1.jobsearch-JobInfoHeader-title',
        '.jobsearch-JobInfoHeader-title',
        'h1',
      ],
      company: [
        '[data-testid="inlineHeader-companyName"] a',
        '[data-testid="inlineHeader-companyName"]',
        '[data-company-name="true"]',
        '.jobsearch-CompanyInfoContainer a',
        '.jobsearch-InlineCompanyRating > div:first-child',
      ],
      location: [
        '[data-testid="inlineHeader-companyLocation"]',
        '[data-testid="job-location"]',
        '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
        '.jobsearch-JobInfoHeader-subtitle > div:last-child',
      ],
      salary: [
        '#salaryInfoAndJobType span:first-child',
        '[data-testid="jobsearch-OtherJobDetailsContainer"] [aria-label="Pay"] li',
        '.jobsearch-JobMetadataHeader-item',
      ],
      employmentType: ['#salaryInfoAndJobType span:last-child', '[aria-label="Job type"] li'],
      description: ['#jobDescriptionText', '.jobsearch-jobDescriptionText', '[data-testid="jobDescriptionText"]'],
    }),
};

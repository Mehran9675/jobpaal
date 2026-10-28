import type { SiteAdapter } from '../types';
import { exists, extractBySelectors } from './helpers';

export const glassdoorAdapter: SiteAdapter = {
  key: 'glassdoor',
  name: 'Glassdoor',
  matches: (url) => /(^|\.)glassdoor\.[a-z.]+$/i.test(url.hostname),
  isJobPage: (url, doc) =>
    /\/job-listing\//i.test(url.pathname) ||
    url.searchParams.has('jl') ||
    exists(doc, '[class*="JobDetails_jobDescription"], .jobDescriptionContent, [data-test="jobDescriptionContent"]'),
  extract: (doc) =>
    extractBySelectors(doc, {
      title: ['[data-test="job-title"]', '[class*="JobDetails_jobTitle"]', '[data-test="jobTitle"]', 'h1'],
      company: [
        '[data-test="employer-name"]',
        '[class*="EmployerProfile_employerName"]',
        '[class*="EmployerProfile_compactEmployerName"]',
        '[data-test="employerName"]',
      ],
      location: ['[data-test="location"]', '[class*="JobDetails_location"]', '[data-test="emp-location"]'],
      salary: ['[data-test="detailSalary"]', '[class*="SalaryEstimate_salaryRange"]', '[class*="SalaryEstimate_averageEstimate"]'],
      description: [
        '[class*="JobDetails_jobDescription"]',
        '[data-test="jobDescriptionContent"]',
        '.jobDescriptionContent',
        '#JobDescriptionContainer',
      ],
    }),
};

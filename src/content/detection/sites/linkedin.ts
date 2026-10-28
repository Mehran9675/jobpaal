import { cleanInline } from '@/content/picker/dom';
import { findSalary } from '../salary';
import type { SiteAdapter } from '../types';
import { exists, extractBySelectors, hostIs } from './helpers';

export const linkedinAdapter: SiteAdapter = {
  key: 'linkedin',
  name: 'LinkedIn',
  matches: (url) => hostIs(url, 'linkedin.com'),
  isJobPage: (url, doc) =>
    /^\/jobs\/view\//.test(url.pathname) ||
    (url.pathname.startsWith('/jobs/') && url.searchParams.has('currentJobId')) ||
    exists(doc, '.jobs-search__job-details--container #job-details, .job-view-layout #job-details'),
  extract(doc) {
    const job = extractBySelectors(doc, {
      title: [
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title',
        '.top-card-layout__title',
        'h1.t-24',
        'h1',
      ],
      company: [
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name',
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name',
        '.topcard__org-name-link',
        '.top-card-layout__second-subline a',
      ],
      location: [
        '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
        '.job-details-jobs-unified-top-card__bullet',
        '.jobs-unified-top-card__bullet',
        '.topcard__flavor--bullet',
      ],
      salary: ['#SALARY', '.salary.compensation__salary', '.compensation__salary'],
      description: [
        '#job-details',
        '.jobs-description__content .jobs-box__html-content',
        '.jobs-description-content__text',
        '.jobs-description__content',
        '.show-more-less-html__markup',
        '.description__text',
      ],
    });
    if (job.description) job.description = job.description.replace(/^About the job\s*\n+/i, '');
    if (!job.salary) {
      const insights = doc.querySelectorAll(
        '.job-details-jobs-unified-top-card__job-insight, .job-details-preferences-and-skills, .jobs-unified-top-card__job-insight',
      );
      for (const el of Array.from(insights).slice(0, 8)) {
        const amount = findSalary(cleanInline(el.textContent, 300));
        if (amount) {
          job.salary = amount;
          break;
        }
      }
    }
    if (!job.employmentType) {
      const pills = doc.querySelectorAll('.job-details-preferences-and-skills, .job-details-jobs-unified-top-card__job-insight');
      for (const el of Array.from(pills).slice(0, 8)) {
        const match = /\b(Full-time|Part-time|Contract|Temporary|Internship|Volunteer)\b/.exec(el.textContent ?? '');
        if (match) {
          job.employmentType = match[1];
          break;
        }
      }
    }
    return job;
  },
};

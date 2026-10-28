import { cleanInline } from '@/content/picker/dom';
import { companyFromSubdomain, meta } from '../dom';
import type { SiteAdapter } from '../types';
import { exists, extractBySelectors, hostIs, stripLabel } from './helpers';

export const workdayAdapter: SiteAdapter = {
  key: 'workday',
  name: 'Workday',
  matches: (url, doc) =>
    hostIs(url, 'myworkdayjobs.com', 'myworkdaysite.com', 'workday.com') && !hostIs(url, 'www.workday.com')
      ? true
      : exists(doc, '[data-automation-id="jobPostingHeader"]'),
  isJobPage: (url, doc) =>
    /\/job\//i.test(url.pathname) ||
    /\/apply/i.test(url.pathname) ||
    exists(doc, '[data-automation-id="jobPostingHeader"], [data-automation-id="jobPostingDescription"]'),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['[data-automation-id="jobPostingHeader"]', '[data-automation-id="jobTitle"]', 'h2', 'h1'],
      location: ['[data-automation-id="locations"] dd', '[data-automation-id="locations"]', '[data-automation-id="location"]'],
      employmentType: ['[data-automation-id="time"] dd', '[data-automation-id="time"]'],
      postedAt: ['[data-automation-id="postedOn"] dd', '[data-automation-id="postedOn"]'],
      salary: ['[data-automation-id="salary"] dd', '[data-automation-id="payRange"]'],
      description: ['[data-automation-id="jobPostingDescription"]', '[data-automation-id="job-posting-details"]'],
    });
    job.location = stripLabel(job.location, /locations?/);
    job.employmentType = stripLabel(job.employmentType, /time type/);
    job.postedAt = stripLabel(job.postedAt, /posted on/);
    const site = meta(doc, ['og:site_name']);
    const logo = cleanInline(doc.querySelector('[data-automation-id="logoImage"], header img[alt]')?.getAttribute('alt'), 80);
    job.company = (logo && !/logo/i.test(logo) ? logo : '') || (site && !/workday/i.test(site) ? site : '') || companyFromSubdomain(url.hostname);
    return job;
  },
};

import { cleanInline } from '@/content/picker/dom';
import { companyFromSlug } from '../dom';
import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs, pathSegment } from './helpers';

export const smartrecruitersAdapter: SiteAdapter = {
  key: 'smartrecruiters',
  name: 'SmartRecruiters',
  matches: (url) => hostIs(url, 'smartrecruiters.com'),
  isJobPage: (url) => url.pathname.split('/').filter(Boolean).length >= 2 || /\/oneclick-ui\//.test(url.pathname),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['h1.job-title', '[itemprop="title"]', 'h1'],
      location: ['[itemprop="jobLocation"]', '.job-details li [itemprop="address"]', 'spl-job-location', '.job-location'],
      employmentType: ['[itemprop="employmentType"]'],
      description: ['.job-sections', '[itemprop="description"]', '#st-jobDescription', '.job-description'],
    });
    const orgMeta = doc.querySelector('[itemprop="hiringOrganization"] [itemprop="name"]');
    const org = cleanInline(orgMeta?.getAttribute('content') ?? orgMeta?.textContent, 100);
    const logo = cleanInline(doc.querySelector('.header-logo img, .brand-logo img')?.getAttribute('alt'), 80).replace(/\s*logo$/i, '');
    job.company = org || logo || companyFromSlug(pathSegment(url, 0));
    return job;
  },
};

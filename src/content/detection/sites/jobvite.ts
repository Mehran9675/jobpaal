import { cleanInline } from '@/content/picker/dom';
import { companyFromSlug } from '../dom';
import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs, pathSegment } from './helpers';

export const jobviteAdapter: SiteAdapter = {
  key: 'jobvite',
  name: 'Jobvite',
  matches: (url) => hostIs(url, 'jobs.jobvite.com', 'app.jobvite.com'),
  isJobPage: (url) => /\/job\/[A-Za-z0-9]+/.test(url.pathname) || /jvi=|jobId=/.test(url.search),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['.jv-header', 'h2.jv-header', '.jv-job-detail-name', 'h1'],
      location: ['.jv-job-detail-meta', '.jv-job-location'],
      description: ['.jv-job-detail-description', '.jv-job-description'],
    });
    if (job.location) {
      // Meta reads like "Engineering · San Francisco, CA"; keep the last part.
      const parts = job.location.split(/\s*[·|]\s*/).filter(Boolean);
      job.location = parts[parts.length - 1];
    }
    const logo = cleanInline(doc.querySelector('.jv-logo img, .jv-page-header img')?.getAttribute('alt'), 80).replace(/\s*logo$/i, '');
    job.company = logo || companyFromSlug(pathSegment(url, 0));
    return job;
  },
};

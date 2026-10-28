import { cleanInline } from '@/content/picker/dom';
import { companyFromSlug, meta } from '../dom';
import { parseTitleString } from '../generic';
import type { SiteAdapter } from '../types';
import { exists, extractBySelectors, hostIs, pathSegment } from './helpers';

export const greenhouseAdapter: SiteAdapter = {
  key: 'greenhouse',
  name: 'Greenhouse',
  matches: (url, doc) =>
    hostIs(url, 'boards.greenhouse.io', 'job-boards.greenhouse.io', 'job-boards.eu.greenhouse.io', 'boards.eu.greenhouse.io') ||
    exists(doc, '#grnhse_app'),
  isJobPage: (url, doc) =>
    /\/jobs\/\d+/.test(url.pathname) ||
    /\/embed\/job_app/.test(url.pathname) ||
    url.searchParams.has('gh_jid') ||
    exists(doc, '#application_form, #application-form, .job__description, #app_body #content'),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['.job__title h1', 'h1.app-title', '.app-title', 'h1.section-header', '#header h1', 'h1'],
      company: ['.company-name', '.job__company', '[class*="company-name"]'],
      location: ['.job__location', '#header .location', '.location', '[class*="job__location"]'],
      salary: ['.pay-range', '.job__pay-range', '[class*="pay-range"]'],
      description: ['.job__description', '#content', '#job_description', '.job-post-content', '[class*="job__description"]'],
    });
    if (job.company) job.company = job.company.replace(/^at\s+/i, '').trim();
    if (!job.company) {
      const parsed = parseTitleString(doc.title ?? '');
      job.company = parsed.company || meta(doc, ['og:site_name']) || '';
      if (!job.company && hostIs(url, 'greenhouse.io')) {
        const slug = pathSegment(url, 0) === 'embed' ? url.searchParams.get('for') ?? '' : pathSegment(url, 0);
        job.company = companyFromSlug(slug);
      }
    }
    if (job.location) job.location = cleanInline(job.location.replace(/^location\s*:?\s*/i, ''));
    return job;
  },
};

import { companyFromSubdomain } from '../dom';
import { parseTitleString } from '../generic';
import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs } from './helpers';

export const bamboohrAdapter: SiteAdapter = {
  key: 'bamboohr',
  name: 'BambooHR',
  matches: (url) => hostIs(url, 'bamboohr.com'),
  isJobPage: (url) => /\/careers\/\d+/.test(url.pathname) || /\/jobs\/view\.php/.test(url.pathname),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['.ResAts__card-title', '[data-fabric-component="Headline"]', 'h2', 'h1'],
      location: ['.ResAts__card-subtitle', '[class*="location"]'],
      description: ['.BambooRichText', '#js-careers-description', '[class*="RichText"]', '.ResAts__card-content'],
    });
    const parsed = parseTitleString(doc.title ?? '');
    job.company = (parsed.company || '').replace(/\s+careers?$/i, '') || companyFromSubdomain(url.hostname);
    return job;
  },
};

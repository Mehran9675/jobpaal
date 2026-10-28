import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs } from './helpers';

export const wellfoundAdapter: SiteAdapter = {
  key: 'wellfound',
  name: 'Wellfound',
  matches: (url) => hostIs(url, 'wellfound.com', 'angel.co'),
  isJobPage: (url) => /\/jobs\/\d+|\/company\/[^/]+\/jobs\/\d+|\/l\/[^/]+\/[^/]+\/\d+/.test(url.pathname),
  extract: (doc) =>
    extractBySelectors(doc, {
      title: ['h1[class*="styles_title"]', '[class*="styles_jobTitle"]', 'h1'],
      company: ['a[href^="/company/"] h2', 'a[href^="/company/"] [class*="name"]', '[class*="styles_companyName"]', 'a[href^="/company/"]'],
      location: ['[class*="styles_location"]', '[class*="location"]'],
      salary: ['[class*="styles_compensation"]', '[class*="compensation"]'],
      employmentType: ['[class*="styles_jobType"]'],
      description: ['[class*="styles_description"]', '#job-description', '.job-description', '[class*="description"]'],
    }),
};

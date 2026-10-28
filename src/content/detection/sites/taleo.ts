import { companyFromSubdomain } from '../dom';
import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs } from './helpers';

export const taleoAdapter: SiteAdapter = {
  key: 'taleo',
  name: 'Taleo',
  matches: (url) => hostIs(url, 'taleo.net'),
  isJobPage: (url) => /jobdetail|jobapply|requisition/i.test(url.pathname + url.search),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['[id$="reqTitleLinkAction.row1"]', '[id*="reqTitle"]', '.titlepage', 'h1'],
      location: ['[id*="reqBasicLocation"]', '[id*="reqLocation"]'],
      postedAt: ['[id*="reqPostingDate"]'],
      employmentType: ['[id*="reqSchedule"]', '[id*="reqJobType"]'],
      description: ['[id*="descRequisition"]', '[id*="ID1702"]', '.editablesection', '.mastercontentpanel3'],
    });
    job.company = companyFromSubdomain(url.hostname);
    return job;
  },
};

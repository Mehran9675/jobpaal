import { companyFromSubdomain, labelledValue } from '../dom';
import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs } from './helpers';

export const icimsAdapter: SiteAdapter = {
  key: 'icims',
  name: 'iCIMS',
  matches: (url) => hostIs(url, 'icims.com'),
  isJobPage: (url) => /\/jobs\/\d+/.test(url.pathname),
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['.iCIMS_Header h1', 'h1.iCIMS_Header', '.iCIMS_JobHeaderGroup h1', '.iCIMS_Header', 'h1'],
      description: ['.iCIMS_JobContent', '.iCIMS_InfoMsg_Job', '.iCIMS_Expandable_Text', '#iCIMS_JobContent'],
    });
    job.location = labelledValue(doc, /(job\s+)?locations?/, 150) || undefined;
    job.employmentType = labelledValue(doc, /(position type|job type|employment type)/, 80) || undefined;
    job.postedAt = labelledValue(doc, /(posted date|date posted)/, 60) || undefined;
    job.company = companyFromSubdomain(url.hostname, /^(www|jobs|careers|careers-\w+|uscareers|external|apply)$/i).replace(/^Careers-/i, '');
    return job;
  },
};

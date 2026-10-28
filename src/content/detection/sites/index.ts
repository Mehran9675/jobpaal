import type { SiteAdapter } from '../types';
import { ashbyAdapter } from './ashby';
import { bamboohrAdapter } from './bamboohr';
import { glassdoorAdapter } from './glassdoor';
import { greenhouseAdapter } from './greenhouse';
import { icimsAdapter } from './icims';
import { indeedAdapter } from './indeed';
import { jobviteAdapter } from './jobvite';
import { leverAdapter } from './lever';
import { linkedinAdapter } from './linkedin';
import { recruiteeAdapter } from './recruitee';
import { smartrecruitersAdapter } from './smartrecruiters';
import { taleoAdapter } from './taleo';
import { wellfoundAdapter } from './wellfound';
import { workableAdapter } from './workable';
import { workdayAdapter } from './workday';
import { ziprecruiterAdapter } from './ziprecruiter';

/** Host-based adapters first; adapters that also match embeds by markup (Greenhouse, Ashby, Workday) last. */
export const SITE_ADAPTERS: SiteAdapter[] = [
  linkedinAdapter,
  indeedAdapter,
  glassdoorAdapter,
  ziprecruiterAdapter,
  wellfoundAdapter,
  leverAdapter,
  smartrecruitersAdapter,
  bamboohrAdapter,
  icimsAdapter,
  taleoAdapter,
  workableAdapter,
  recruiteeAdapter,
  jobviteAdapter,
  greenhouseAdapter,
  ashbyAdapter,
  workdayAdapter,
];

import type { Application, ApplicationStatus, StoredDocument } from '@/shared/types';

export interface PipelineStats {
  tracked: number;
  interviews: number;
  offers: number;
  documentsGenerated: number;
  byStatus: Record<ApplicationStatus, number>;
}

const INTERVIEW_STATUSES: ApplicationStatus[] = ['interview', 'technical'];

export function computePipelineStats(apps: Application[], docs: StoredDocument[]): PipelineStats {
  const byStatus = {
    draft: 0,
    ready: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    technical: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
    'no-response': 0,
  } satisfies Record<ApplicationStatus, number>;
  for (const app of apps) byStatus[app.status] = (byStatus[app.status] ?? 0) + 1;
  return {
    tracked: apps.length,
    interviews: apps.filter((app) => INTERVIEW_STATUSES.includes(app.status)).length,
    offers: byStatus.offer,
    documentsGenerated: docs.filter((doc) => doc.source === 'generated').length,
    byStatus,
  };
}

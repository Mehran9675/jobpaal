import type { Application, ApplicationStatus } from '@/shared/types';

export interface ApplicationFilter {
  search: string;
  status: ApplicationStatus | 'all';
}

/** Search by title, company or site; filter by status; newest update first. */
export function filterApplications(apps: Application[], filter: ApplicationFilter): Application[] {
  const query = filter.search.trim().toLowerCase();
  return apps
    .filter((app) => filter.status === 'all' || app.status === filter.status)
    .filter((app) => {
      if (!query) return true;
      const { title, company, siteName, host } = app.job;
      return [title, company, siteName, host].some((value) => (value ?? '').toLowerCase().includes(query));
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function statusTone(status: ApplicationStatus): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'offer':
      return 'success';
    case 'interview':
    case 'technical':
    case 'screening':
      return 'info';
    case 'rejected':
      return 'danger';
    case 'withdrawn':
    case 'no-response':
      return 'warning';
    default:
      return 'neutral';
  }
}

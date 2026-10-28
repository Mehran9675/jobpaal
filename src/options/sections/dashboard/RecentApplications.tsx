import { APPLICATION_STATUSES, type Application } from '@/shared/types';
import { formatDay } from '@/shared/utils/date';
import { Badge } from '@/ui/components/Badge';
import { Card } from '@/ui/components/Card';
import { EmptyState } from '@/ui/components/EmptyState';
import { statusTone } from '../../lib/applicationFilters';
import { applicationHash } from '../../lib/routes';

export function RecentApplications({ apps }: { apps: Application[] }) {
  return (
    <Card
      title="Recent applications"
      actions={
        <a className="jp-small" href="#applications">
          View all
        </a>
      }
    >
      {apps.length === 0 ? (
        <EmptyState>No applications yet. Open a job posting and press Tailor and fill to create one.</EmptyState>
      ) : (
        <ul className="jp-opt-linklist">
          {apps.map((app) => (
            <li key={app.id}>
              <a href={applicationHash(app.id)} className="jp-opt-linklist__item">
                <span className="jp-stack" style={{ gap: 0, minWidth: 0 }}>
                  <span className="jp-strong jp-ellipsis">{app.job.title || 'Untitled job'}</span>
                  <span className="jp-small jp-muted jp-ellipsis">{[app.job.company, app.job.siteName].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="jp-row">
                  {app.analysis && <span className="jp-small jp-muted">{Math.round(app.analysis.score)}%</span>}
                  <Badge tone={statusTone(app.status)}>{APPLICATION_STATUSES.find((s) => s.id === app.status)?.label ?? app.status}</Badge>
                  <span className="jp-small jp-faint">{formatDay(app.updatedAt)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

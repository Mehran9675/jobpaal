import { APPLICATION_STATUSES, type Application } from '@/shared/types';
import { formatDay } from '@/shared/utils/date';
import { Badge } from '@/ui/components/Badge';
import { scoreTone } from '@/ui/components/ScoreRing';
import { statusTone } from '../../lib/applicationFilters';
import { applicationHash, navigate } from '../../lib/routes';

export function ApplicationRow({ app }: { app: Application }) {
  const href = applicationHash(app.id);
  const score = app.analysis ? Math.round(app.analysis.score) : null;
  return (
    <tr className="jp-opt-table__clickable" onClick={(e) => (e.target as HTMLElement).closest('a') || navigate(href)}>
      <td>
        <div className="jp-stack" style={{ gap: 0, minWidth: 0 }}>
          <a href={href} className="jp-strong jp-opt-table__mainlink">
            {app.job.title || 'Untitled job'}
          </a>
          <span className="jp-small jp-muted">{app.job.company || 'Unknown company'}</span>
        </div>
      </td>
      <td className="jp-small">{app.job.siteName || app.job.host}</td>
      <td>
        <Badge tone={statusTone(app.status)}>{APPLICATION_STATUSES.find((s) => s.id === app.status)?.label ?? app.status}</Badge>
      </td>
      <td>
        {score === null ? (
          <span className="jp-faint">—</span>
        ) : (
          <span className="jp-strong" style={{ color: scoreTone(score) }}>
            {score}
          </span>
        )}
      </td>
      <td className="jp-small">{formatDay(app.updatedAt)}</td>
    </tr>
  );
}

import { sendToBackground } from '@/shared/messaging';
import { APPLICATION_STATUSES } from '@/shared/types';
import { formatDay } from '@/shared/utils/date';
import { Badge } from '@/ui/components/Badge';
import { useApplications } from '@/ui/hooks/useApplications';

export function RecentApplicationsList({ limit = 5 }: { limit?: number }) {
  const apps = useApplications();
  if (!apps?.length) return <p className="jp-small jp-muted">No applications tracked yet.</p>;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
      {apps.slice(0, limit).map((app) => (
        <li key={app.id}>
          <button
            type="button"
            className="jp-btn jp-btn--ghost"
            style={{ width: '100%', justifyContent: 'space-between', padding: '4px 6px' }}
            onClick={() => sendToBackground('options:open', { section: `applications/${app.id}` })}
          >
            <span className="jp-grow" style={{ textAlign: 'left' }}>
              <span className="jp-ellipsis" style={{ display: 'block' }}>
                {app.job.title || 'Untitled role'}
              </span>
              <span className="jp-small jp-faint" style={{ fontWeight: 400 }}>
                {[app.job.company, formatDay(app.updatedAt)].filter(Boolean).join(' · ')}
              </span>
            </span>
            <Badge>{APPLICATION_STATUSES.find((s) => s.id === app.status)?.label ?? app.status}</Badge>
          </button>
        </li>
      ))}
    </ul>
  );
}

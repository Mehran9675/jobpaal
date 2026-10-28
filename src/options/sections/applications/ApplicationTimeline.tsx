import type { TimelineEvent } from '@/shared/types';
import { formatTimestamp } from '@/shared/utils/date';
import { Card } from '@/ui/components/Card';

const TYPE_LABELS: Record<TimelineEvent['type'], string> = {
  created: 'Created',
  status: 'Status',
  generated: 'Generated',
  regenerated: 'Regenerated',
  edited: 'Edited',
  filled: 'Filled',
  note: 'Note',
};

export function ApplicationTimeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => b.at - a.at);
  return (
    <Card title="Timeline">
      {sorted.length === 0 ? (
        <p className="jp-small jp-muted">No events yet.</p>
      ) : (
        <ol className="jp-opt-timeline">
          {sorted.map((event) => (
            <li key={event.id} className={`jp-opt-timeline__item jp-opt-timeline__item--${event.type}`}>
              <span className="jp-small jp-strong">{TYPE_LABELS[event.type] ?? event.type}</span>
              <span className="jp-small">{event.text}</span>
              <time className="jp-small jp-faint" dateTime={new Date(event.at).toISOString()}>
                {formatTimestamp(event.at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

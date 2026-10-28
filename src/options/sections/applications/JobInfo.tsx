import { useState } from 'react';
import type { Application } from '@/shared/types';
import { formatTimestamp } from '@/shared/utils/date';
import { wordCount } from '@/shared/utils/text';
import { Card } from '@/ui/components/Card';

export function JobInfo({ app }: { app: Application }) {
  const [open, setOpen] = useState(false);
  const { job } = app;
  const facts: [string, string][] = [
    ['Company', job.company],
    ['Location', job.location],
    ['Salary', job.salary],
    ['Employment type', job.employmentType],
    ['Posted', job.postedAt],
    ['Site', job.siteName || job.host],
    ['Created', formatTimestamp(app.createdAt)],
  ];
  return (
    <Card
      title="Job"
      actions={
        job.url ? (
          <a className="jp-small" href={job.url} target="_blank" rel="noreferrer noopener">
            Open posting ↗
          </a>
        ) : undefined
      }
    >
      <div className="jp-stack">
        <dl className="jp-opt-facts">
          {facts
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
        <div>
          <button type="button" className="jp-btn jp-btn--sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : 'Show'} job description used ({wordCount(job.description)} words)
          </button>
          {open && <div className="jp-opt-description">{job.description || 'No description stored.'}</div>}
        </div>
      </div>
    </Card>
  );
}

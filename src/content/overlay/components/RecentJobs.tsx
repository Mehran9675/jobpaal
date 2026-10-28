import { useMemo, useState } from 'react';
import { applyRecentJob } from '@/content/controller/jobActions';
import { store } from '@/content/controller/store';
import { checkJobDescriptionProse } from '@/shared/text/prose';
import { formatDay } from '@/shared/utils/date';
import { Button } from '@/ui/components/Button';
import { EmptyState } from '@/ui/components/EmptyState';
import { TextField } from '@/ui/components/TextField';
import { useRecentJobs } from '@/ui/hooks/useRecentJobs';

/** Choose a previously stored job description. */
export function RecentJobs() {
  const jobs = useRecentJobs();
  const [query, setQuery] = useState('');
  const usable = useMemo(
    () =>
      (jobs ?? []).filter(
        (j) =>
          checkJobDescriptionProse(j.job.description).ok &&
          `${j.job.title} ${j.job.company}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [jobs, query],
  );
  return (
    <div className="jp-stack">
      <div className="jp-row jp-row--between">
        <strong className="jp-small">Recent jobs</strong>
        <Button size="sm" variant="ghost" onClick={() => store.set({ tool: null })}>
          Close
        </Button>
      </div>
      <TextField value={query} onChange={setQuery} placeholder="Search title or company" aria-label="Search recent jobs" />
      {usable.length === 0 ? (
        <EmptyState>No stored jobs with a real description yet.</EmptyState>
      ) : (
        <div className="jp-stack" style={{ maxHeight: 260, overflowY: 'auto' }}>
          {usable.slice(0, 30).map(({ job, lastUsedAt }) => (
            <button
              key={job.id}
              type="button"
              className="jp-btn"
              style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', flexDirection: 'column', alignItems: 'flex-start' }}
              onClick={() => applyRecentJob(job)}
            >
              <span>{job.title || 'Untitled job'}</span>
              <span className="jp-small jp-muted" style={{ fontWeight: 400 }}>
                {[job.company, job.siteName, formatDay(lastUsedAt)].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import type { JobPosting } from '@/shared/types';
import { SOURCE_LABELS } from '@/ui/lib/labels';

const FIELDS = [
  ['title', 'Title'],
  ['company', 'Company'],
  ['location', 'Location'],
  ['salary', 'Salary'],
] as const;

/** The detected job with where each value came from. */
export function JobSummary({ job }: { job: JobPosting | null }) {
  if (!job) return <p className="jp-small jp-muted">No job details were read from this page yet.</p>;
  return (
    <div className="jp-stack" style={{ gap: 6 }}>
      <dl className="jp-ov-job" style={{ margin: 0 }}>
        {FIELDS.map(([field, label]) => (
          <div key={field} style={{ display: 'contents' }}>
            <dt>{label}</dt>
            <dd>
              {job[field] || <span className="jp-faint">not found</span>}
              {job[field] && job.sources[field] && <span className="jp-ov-source"> · {SOURCE_LABELS[job.sources[field]!]}</span>}
            </dd>
          </div>
        ))}
        {job.employmentType && (
          <>
            <dt>Type</dt>
            <dd>{job.employmentType}</dd>
          </>
        )}
      </dl>
      <span className="jp-ov-source">
        Read by: {job.siteName}
        {job.atsKey !== 'generic' ? ' reader' : ' (generic reader)'}
        {job.postedAt ? ` · posted ${job.postedAt}` : ''}
      </span>
    </div>
  );
}

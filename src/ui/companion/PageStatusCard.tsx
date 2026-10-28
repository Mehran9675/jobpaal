import type { ContentState } from '@/shared/messaging';
import { Badge } from '@/ui/components/Badge';
import { SOURCE_LABELS } from '@/ui/lib/labels';
import { wordCount } from '@/shared/utils/text';

/** The current page's status: job read, what is missing, form found. */
export function PageStatusCard({ state }: { state: ContentState }) {
  const { detection } = state;
  const job = detection.job;
  const ready = detection.issues.length === 0 && detection.hasValidDescription;
  return (
    <div className="jp-card jp-stack" style={{ padding: 12 }}>
      <div className="jp-row jp-row--between">
        <strong>{detection.isJobPage ? 'Job page' : state.forced ? 'Marked as job page' : 'Not recognised as a job page'}</strong>
        <Badge tone={ready ? 'success' : detection.isJobPage || state.forced ? 'danger' : 'neutral'}>
          {ready ? 'Ready' : detection.isJobPage || state.forced ? 'Needs attention' : 'Idle'}
        </Badge>
      </div>
      {job && (job.title || job.company) && (
        <div>
          <div className="jp-strong">{job.title || 'Untitled role'}</div>
          <div className="jp-small jp-muted">{[job.company, job.location, job.salary].filter(Boolean).join(' · ')}</div>
        </div>
      )}
      {job?.description && detection.hasValidDescription && (
        <span className="jp-small jp-faint">
          Description: {wordCount(job.description)} words
          {job.sources.description ? ` from ${SOURCE_LABELS[job.sources.description]}` : ''}
        </span>
      )}
      {detection.issues.length > 0 && (detection.isJobPage || state.forced) && (
        <ul className="jp-small" style={{ margin: 0, paddingLeft: 18, color: 'var(--jp-danger)' }}>
          {detection.issues.map((issue) => (
            <li key={issue.message}>{issue.message}</li>
          ))}
        </ul>
      )}
      {detection.form.hasForm && (
        <span className="jp-small jp-muted">
          Form: {detection.form.fieldCount} fields
          {detection.form.hasResumeUpload ? ', resume upload' : ''}
          {detection.form.hasCoverLetterField ? ', cover letter' : ''}
          {detection.form.screeningQuestions.length ? `, ${detection.form.screeningQuestions.length} questions` : ''}
        </span>
      )}
      {state.busy && <span className="jp-small" style={{ color: 'var(--jp-primary)' }}>{state.busy}</span>}
    </div>
  );
}

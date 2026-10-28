import { pasteFromClipboard, restorePageDescription } from '@/content/controller/jobActions';
import { pickJobField } from '@/content/controller/pickActions';
import { store } from '@/content/controller/store';
import type { JobPosting } from '@/shared/types';
import { truncate, wordCount } from '@/shared/utils/text';
import { Button } from '@/ui/components/Button';
import { SOURCE_LABELS } from '@/ui/lib/labels';

export interface DescriptionPanelProps {
  job: JobPosting | null;
  valid: boolean;
  overridden: boolean;
  disabled: boolean;
}

/** Where the description came from, its length, a preview and the manual fallbacks. */
export function DescriptionPanel({ job, valid, overridden, disabled }: DescriptionPanelProps) {
  const description = job?.description ?? '';
  const source = job?.sources.description;
  return (
    <div className="jp-stack">
      {valid ? (
        <>
          <div className="jp-small jp-muted">
            From <strong>{source ? SOURCE_LABELS[source] : 'page'}</strong> · {wordCount(description)} words
          </div>
          <div className="jp-ov-preview">{truncate(description, 900)}</div>
        </>
      ) : (
        <p className="jp-small" style={{ color: 'var(--jp-danger)' }}>
          No real job description is available. JobPaal only uses text that reads like a description — pick it, paste it, or choose a recent job.
        </p>
      )}
      <div className="jp-row jp-row--wrap">
        <Button size="sm" onClick={() => pickJobField('description', false)} disabled={disabled}>
          Pick on page
        </Button>
        <Button size="sm" onClick={() => pasteFromClipboard()} disabled={disabled} title="Read the job description from the clipboard">
          Paste clipboard
        </Button>
        <Button size="sm" onClick={() => store.set({ tool: 'paste' })} disabled={disabled}>
          Paste box
        </Button>
        <Button size="sm" onClick={() => store.set({ tool: 'recent' })} disabled={disabled}>
          Recent jobs
        </Button>
        {overridden && (
          <Button size="sm" variant="ghost" onClick={restorePageDescription} disabled={disabled}>
            Use page's description
          </Button>
        )}
      </div>
    </div>
  );
}

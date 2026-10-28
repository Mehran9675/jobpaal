import { openManagement } from '@/content/controller/documentActions';
import { fillPage } from '@/content/controller/fillActions';
import { primaryAction } from '@/content/controller/jobActions';
import { store } from '@/content/controller/store';
import { Button } from '@/ui/components/Button';

export interface MainActionsProps {
  hasDocuments: boolean;
  canTailor: boolean;
  busy: boolean;
  tailorBlockedReason: string;
}

/** Tailor and fill (or Fill this page when documents exist), Fill this form, Guide me, Open JobPaal. */
export function MainActions({ hasDocuments, canTailor, busy, tailorBlockedReason }: MainActionsProps) {
  return (
    <div className="jp-stack" style={{ gap: 6 }}>
      <div className="jp-ov-actions">
        <Button
          variant="primary"
          className="jp-ov-main"
          onClick={primaryAction}
          disabled={busy || (!hasDocuments && !canTailor)}
          title={hasDocuments ? 'Fill the form with your existing documents and answers (no AI)' : tailorBlockedReason || 'Tailor documents for this job, then fill the form'}
        >
          {hasDocuments ? 'Fill this page' : 'Tailor and fill'}
        </Button>
        <Button onClick={fillPage} disabled={busy} title="Fill the form with your profile data, without AI">
          Fill this form
        </Button>
        <Button onClick={() => store.set({ tool: 'guide' })} disabled={busy}>
          Guide me
        </Button>
        <Button variant="ghost" onClick={() => openManagement()} style={{ gridColumn: '1 / -1' }}>
          Open JobPaal
        </Button>
      </div>
      {!hasDocuments && !canTailor && tailorBlockedReason && <p className="jp-small jp-muted">{tailorBlockedReason}</p>}
      <p className="jp-small jp-faint">JobPaal never submits. Review everything and submit yourself.</p>
    </div>
  );
}

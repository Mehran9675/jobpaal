import type { Profile } from '@/shared/types';
import { formatTimestamp } from '@/shared/utils/date';
import { Card } from '@/ui/components/Card';
import { ActionFeedback } from '../../components/ActionFeedback';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { usePendingImport } from '../../hooks/usePendingImport';
import { ImportReview } from './ImportReview';

export interface LinkedInImportProps {
  onMerge: (incoming: Partial<Profile>, overwrite: boolean) => Promise<void>;
}

/** Explains how to scan a LinkedIn profile and reviews a pending scan. */
export function LinkedInImport({ onMerge }: LinkedInImportProps) {
  const { pending, clear } = usePendingImport();
  const action = useAsyncAction();

  const merge = (overwrite: boolean) =>
    action.run(
      'merge',
      async () => {
        if (!pending) return;
        await onMerge(pending.profile, overwrite);
        await clear();
      },
      'LinkedIn data merged and saved. Please review your profile below.',
    );

  return (
    <Card title="Import from LinkedIn">
      <div className="jp-stack">
        {pending ? (
          <>
            <div className="jp-notice jp-notice--info" role="status">
              <div>A LinkedIn profile was scanned on {formatTimestamp(pending.at)}. Review it before merging.</div>
            </div>
            <ImportReview
              data={pending.profile}
              sourceLabel="the LinkedIn scan"
              busy={action.busy === 'merge'}
              onMerge={merge}
              onDiscard={() => void action.run('discard', clear, 'LinkedIn scan discarded.')}
            />
          </>
        ) : (
          <ol className="jp-opt-steps jp-small">
            <li>Open your LinkedIn profile page while signed in.</li>
            <li>
              Right-click the page and choose <strong>Scan this LinkedIn profile</strong>, or open the JobPaal popup and use the scan action.
            </li>
            <li>Come back here to review what was found and merge it into your profile.</li>
          </ol>
        )}
        <p className="jp-small jp-faint">The scan reads only the page that is open in your browser. Nothing is sent anywhere.</p>
        <ActionFeedback error={action.error} message={action.message} />
      </div>
    </Card>
  );
}

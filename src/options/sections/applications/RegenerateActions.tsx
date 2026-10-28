import { sendToBackground } from '@/shared/messaging/client';
import type { Application } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { useConfirm } from '@/ui/components/useConfirm';
import { ActionFeedback } from '../../components/ActionFeedback';
import { AiRequiredNotice } from '../../components/AiRequiredNotice';
import { useActiveProvider } from '../../hooks/useActiveProvider';
import { useAsyncAction } from '../../hooks/useAsyncAction';

type Part = 'all' | 'resume' | 'cover-letter' | 'answers';

const PART_LABELS: Record<Part, string> = {
  all: 'everything',
  resume: 'the resume',
  'cover-letter': 'the cover letter',
  answers: 'the screening answers',
};

/** Explicit, confirmed AI regeneration of an application's content. */
export function RegenerateActions({ app }: { app: Application }) {
  const provider = useActiveProvider();
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();
  const disabled = !provider || Boolean(action.busy);

  const regenerate = async (part: Part) => {
    const ok = await confirm({
      title: `Regenerate ${PART_LABELS[part]}?`,
      message: (
        <>
          This sends the job and your profile to <strong>{provider?.name ?? 'your AI provider'}</strong> again (it uses tokens) and replaces the current version,
          including any edits you made.
        </>
      ),
      confirmLabel: 'Regenerate',
    });
    if (!ok) return;
    await action.run(part, () => sendToBackground('app:regenerate', { applicationId: app.id, part }), 'Regenerated. Files were re-rendered.');
  };

  return (
    <Card title="Regenerate with AI">
      <div className="jp-stack">
        {provider === null && <AiRequiredNotice>Regenerating uses AI.</AiRequiredNotice>}
        <div className="jp-row jp-row--wrap">
          <Button size="sm" variant="primary" onClick={() => void regenerate('all')} disabled={disabled} loading={action.busy === 'all'}>
            Regenerate all
          </Button>
          <Button size="sm" onClick={() => void regenerate('resume')} disabled={disabled} loading={action.busy === 'resume'}>
            Resume
          </Button>
          <Button size="sm" onClick={() => void regenerate('cover-letter')} disabled={disabled} loading={action.busy === 'cover-letter'}>
            Cover letter
          </Button>
          <Button size="sm" onClick={() => void regenerate('answers')} disabled={disabled || app.answers.length === 0} loading={action.busy === 'answers'}>
            Answers
          </Button>
        </div>
        <ActionFeedback error={action.error} message={action.message} />
      </div>
      {dialog}
    </Card>
  );
}

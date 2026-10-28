import { useState } from 'react';
import { clearData, type DataScope } from '@/shared/storage';
import { Button } from '@/ui/components/Button';
import { Checkbox } from '@/ui/components/Checkbox';
import { useConfirm } from '@/ui/components/useConfirm';
import { ActionFeedback } from '../../components/ActionFeedback';
import { useAsyncAction } from '../../hooks/useAsyncAction';

const SCOPES: { id: DataScope; label: string; hint?: string }[] = [
  { id: 'applications', label: 'Applications', hint: 'Also deletes their documents.' },
  { id: 'documents', label: 'Documents (generated and uploaded files)' },
  { id: 'profile', label: 'Profile' },
  { id: 'jobs', label: 'Recent jobs and analyses' },
  { id: 'savedAnswers', label: 'Saved answers' },
  { id: 'siteMappings', label: 'Site field mappings and “show overlay here” pages' },
  { id: 'ai', label: 'AI providers and API keys' },
  { id: 'usage', label: 'AI usage history' },
  { id: 'prompts', label: 'Prompts and style' },
  { id: 'settings', label: 'Settings', hint: 'Includes your terms acceptance; you will be asked to accept again.' },
];

const CONFIRM_WORD = 'DELETE';

export function DataDelete() {
  const [scopes, setScopes] = useState<DataScope[]>([]);
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();

  const run = async () => {
    const labels = SCOPES.filter((s) => scopes.includes(s.id)).map((s) => s.label);
    const ok = await confirm({
      title: 'Delete selected data?',
      message: (
        <>
          <p>This permanently removes from this browser:</p>
          <ul className="jp-small">
            {labels.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="jp-small jp-muted">There is no undo and no server copy. Export first if you may need it.</p>
        </>
      ),
      confirmLabel: 'Delete permanently',
      danger: true,
      requireText: CONFIRM_WORD,
    });
    if (!ok) return;
    await action.run(
      'delete',
      async () => {
        await clearData(scopes);
        setScopes([]);
      },
      'Selected data deleted.',
    );
  };

  return (
    <section className="jp-stack" aria-labelledby="jp-data-delete">
      <h3 id="jp-data-delete" className="jp-opt-subheading">
        Delete data
      </h3>
      <div className="jp-opt-scope-grid">
        {SCOPES.map((scope) => (
          <Checkbox
            key={scope.id}
            checked={scopes.includes(scope.id)}
            onChange={(on) => setScopes((list) => (on ? [...list, scope.id] : list.filter((s) => s !== scope.id)))}
            label={
              <>
                {scope.label}
                {scope.hint && <span className="jp-small jp-faint"> — {scope.hint}</span>}
              </>
            }
          />
        ))}
      </div>
      <div className="jp-row jp-row--wrap">
        <Button size="sm" variant="ghost" onClick={() => setScopes(SCOPES.map((s) => s.id))}>
          Select all
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setScopes([])} disabled={!scopes.length}>
          Clear selection
        </Button>
        <Button variant="danger" onClick={() => void run()} disabled={!scopes.length} loading={action.busy === 'delete'}>
          Delete selected…
        </Button>
      </div>
      <ActionFeedback error={action.error} message={action.message} />
      {dialog}
    </section>
  );
}

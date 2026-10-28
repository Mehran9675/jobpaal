import { TERMS_STATEMENTS } from '@/shared/legal/terms';
import { updateSettings } from '@/shared/storage';
import type { Settings } from '@/shared/types';
import { formatTimestamp } from '@/shared/utils/date';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { useConfirm } from '@/ui/components/useConfirm';

/** Acceptance status, date, agreed statements, and withdrawal. */
export function TermsStatus({ settings }: { settings: Settings }) {
  const { confirm, dialog } = useConfirm();
  const terms = settings.terms;
  if (!terms) return null;

  const withdraw = async () => {
    const ok = await confirm({
      title: 'Withdraw acceptance?',
      message: 'JobPaal will stop working until you accept the terms again. Your stored data is not deleted.',
      confirmLabel: 'Withdraw',
      danger: true,
    });
    if (!ok) return;
    await updateSettings((s) => {
      s.terms = null;
      return s;
    });
  };

  return (
    <div className="jp-stack">
      <div className="jp-row jp-row--wrap">
        <Badge tone="success">Accepted</Badge>
        <span className="jp-small jp-muted">
          Version {terms.version}, accepted on {formatTimestamp(terms.acceptedAt)}
        </span>
      </div>
      <p className="jp-small jp-strong">You agreed to:</p>
      <ul className="jp-opt-checklist">
        {TERMS_STATEMENTS.map((statement) => {
          const agreed = terms.statements.includes(statement.id);
          return (
            <li key={statement.id} className={agreed ? 'is-done' : undefined}>
              <span aria-hidden="true">{agreed ? '✓' : '–'}</span>
              <span>
                {statement.label}
                {!agreed && <span className="jp-sr-only"> (not recorded)</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <div>
        <Button variant="danger" size="sm" onClick={withdraw}>
          Withdraw acceptance
        </Button>
      </div>
      {dialog}
    </div>
  );
}

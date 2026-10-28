import { useState } from 'react';
import { allStatementsChecked, createTermsAcceptance, TERMS_STATEMENTS } from '@/shared/legal/terms';
import { updateSettings } from '@/shared/storage';
import { Button } from '@/ui/components/Button';
import { Checkbox } from '@/ui/components/Checkbox';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { ActionFeedback } from './ActionFeedback';

/** One checkbox per statement; Accept is enabled only when all are checked. */
export function TermsAcceptForm() {
  const [checked, setChecked] = useState<string[]>([]);
  const action = useAsyncAction();
  const ready = allStatementsChecked(checked);

  const accept = () =>
    action.run('accept', () =>
      updateSettings((settings) => {
        settings.terms = createTermsAcceptance(checked);
        return settings;
      }),
    );

  return (
    <form
      className="jp-opt-accept"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) void accept();
      }}
    >
      <fieldset className="jp-opt-accept__set">
        <legend className="jp-strong">Please confirm each statement</legend>
        {TERMS_STATEMENTS.map((statement) => (
          <Checkbox
            key={statement.id}
            label={statement.label}
            checked={checked.includes(statement.id)}
            onChange={(on) => setChecked((list) => (on ? [...list, statement.id] : list.filter((id) => id !== statement.id)))}
          />
        ))}
      </fieldset>
      <ActionFeedback error={action.error} message={null} />
      <div className="jp-row">
        <Button type="submit" variant="primary" disabled={!ready} loading={action.busy === 'accept'}>
          Accept and continue
        </Button>
        {!ready && <span className="jp-small jp-faint">{TERMS_STATEMENTS.length - checked.length} statement(s) left to confirm.</span>}
      </div>
    </form>
  );
}

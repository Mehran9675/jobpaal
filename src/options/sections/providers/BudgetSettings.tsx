import { useEffect, useState } from 'react';
import { updateUsage } from '@/shared/storage';
import type { UsageLog } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { TextField } from '@/ui/components/TextField';
import { Toggle } from '@/ui/components/Toggle';

export function BudgetSettings({ budget }: { budget: UsageLog['budget'] }) {
  const [tokens, setTokens] = useState(String(budget.dailyTokens));
  useEffect(() => setTokens(String(budget.dailyTokens)), [budget.dailyTokens]);
  const parsed = Math.round(Number(tokens));
  const valid = Number.isFinite(parsed) && parsed > 0;

  const save = (patch: Partial<UsageLog['budget']>) =>
    void updateUsage((u) => {
      u.budget = { ...u.budget, ...patch };
      return u;
    });

  return (
    <fieldset className="jp-opt-fieldset">
      <legend>Daily token budget</legend>
      <div className="jp-stack">
        <p className="jp-small jp-muted">When enabled, JobPaal shows a notification the first time today’s tokens exceed the budget. It does not block AI calls.</p>
        <Toggle checked={budget.enabled} onChange={(enabled) => save({ enabled })} label="Warn me when the daily budget is reached" />
        <div className="jp-opt-inline-row" style={{ alignItems: 'flex-end', maxWidth: 420 }}>
          <TextField label="Tokens per day" type="number" min={1000} step={1000} value={tokens} onChange={setTokens} disabled={!budget.enabled} />
          <Button onClick={() => save({ dailyTokens: parsed })} disabled={!budget.enabled || !valid || parsed === budget.dailyTokens}>
            Save budget
          </Button>
        </div>
      </div>
    </fieldset>
  );
}

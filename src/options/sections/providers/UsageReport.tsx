import { createEmptyUsage } from '@/shared/defaults/usage';
import { updateUsage } from '@/shared/storage';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Spinner } from '@/ui/components/Spinner';
import { UsageSummary } from '@/ui/components/UsageSummary';
import { useConfirm } from '@/ui/components/useConfirm';
import { useUsage } from '@/ui/hooks/useUsage';
import { BudgetSettings } from './BudgetSettings';
import { DailyUsageChart } from './DailyUsageChart';

/** Detailed AI usage report: totals, today, per provider, last 14 days, budget. Recorded locally only. */
export function UsageReport() {
  const usage = useUsage();
  const { confirm, dialog } = useConfirm();
  if (!usage) return <Spinner label="Loading usage" />;

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset AI usage history?',
      message: 'All recorded calls, errors and token counts are cleared. Your budget setting is kept.',
      confirmLabel: 'Reset usage',
      danger: true,
    });
    if (ok) await updateUsage((u) => ({ ...createEmptyUsage(), budget: { ...u.budget, lastWarnedDay: '' } }));
  };

  return (
    <Card
      title="Usage report"
      actions={
        <Button size="sm" variant="danger" onClick={() => void reset()}>
          Reset usage
        </Button>
      }
    >
      <div className="jp-stack jp-stack--lg">
        <p className="jp-small jp-muted">Recorded locally from each AI call. Token counts are as reported by your provider; check its dashboard for billing.</p>
        <UsageSummary usage={usage} />
        <DailyUsageChart usage={usage} days={14} />
        <BudgetSettings budget={usage.budget} />
      </div>
      {dialog}
    </Card>
  );
}

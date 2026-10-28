import { openManagement } from '@/content/controller/documentActions';
import { dayKey } from '@/shared/utils/date';
import { useUsage } from '@/ui/hooks/useUsage';
import { formatTokens } from '@/ui/lib/labels';

/** AI usage totals with a link to the detailed report. */
export function UsageFooter({ providerName }: { providerName: string }) {
  const usage = useUsage();
  const today = usage?.days[dayKey()];
  const todayTokens = today ? today.promptTokens + today.completionTokens : 0;
  const totalTokens = usage ? usage.total.promptTokens + usage.total.completionTokens : 0;
  return (
    <div className="jp-ov-footer">
      <span>
        {providerName ? `${providerName} · ` : 'No AI provider · '}
        Today {formatTokens(todayTokens)} tokens · All time {formatTokens(totalTokens)}
      </span>
      <button type="button" className="jp-ov-link" onClick={() => openManagement('usage')}>
        Usage report
      </button>
    </div>
  );
}

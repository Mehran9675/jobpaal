import { sendToBackground } from '@/shared/messaging';
import { dayKey } from '@/shared/utils/date';
import { Badge } from '@/ui/components/Badge';
import { useAiSettings } from '@/ui/hooks/useAiSettings';
import { useUsage } from '@/ui/hooks/useUsage';
import { formatTokens } from '@/ui/lib/labels';

/** AI provider state and today's usage. */
export function ProviderStatus() {
  const ai = useAiSettings();
  const usage = useUsage();
  const provider = ai?.providers.find((p) => p.id === ai.activeProviderId);
  const today = usage?.days[dayKey()];
  const tokens = today ? today.promptTokens + today.completionTokens : 0;
  const overBudget = Boolean(usage?.budget.enabled && tokens >= usage.budget.dailyTokens);
  return (
    <div className="jp-row jp-row--between jp-small">
      <span className="jp-row">
        {provider ? <Badge tone="success">AI connected</Badge> : <Badge tone="warning">No AI provider</Badge>}
        <span className="jp-muted jp-ellipsis">{provider ? `${provider.name} · ${provider.model}` : 'Autofill still works'}</span>
      </span>
      <button
        type="button"
        className="jp-btn jp-btn--ghost jp-btn--sm"
        onClick={() => sendToBackground('options:open', { section: provider ? 'usage' : 'providers' })}
        title="Open the usage report"
      >
        {provider ? `Today ${formatTokens(tokens)} tokens${overBudget ? ' · over budget' : ''}` : 'Connect'}
      </button>
    </div>
  );
}

import type { UsageLog } from '@/shared/types';
import { Notice } from './Notice';
import { budgetFraction, budgetReached, formatTokens, tokensOf, usageToday } from './usageMath';

export interface UsageSummaryProps {
  usage: UsageLog;
  /** Show the per-provider breakdown. */
  showProviders?: boolean;
}

/** Tokens today and all time, calls, errors, budget state and per-provider breakdown. */
export function UsageSummary({ usage, showProviders = true }: UsageSummaryProps) {
  const today = usageToday(usage);
  const reached = budgetReached(usage);
  const fraction = Math.min(1, budgetFraction(usage));
  const providers = Object.entries(usage.byProvider).sort((a, b) => tokensOf(b[1]) - tokensOf(a[1]));
  return (
    <div className="jp-usage">
      <dl className="jp-usage__grid">
        <div>
          <dt>Tokens today</dt>
          <dd>{formatTokens(tokensOf(today))}</dd>
        </div>
        <div>
          <dt>Tokens all time</dt>
          <dd>{formatTokens(tokensOf(usage.total))}</dd>
        </div>
        <div>
          <dt>Calls</dt>
          <dd>
            {usage.total.calls}
            <span className="jp-faint jp-small"> ({today.calls} today)</span>
          </dd>
        </div>
        <div>
          <dt>Errors</dt>
          <dd className={usage.total.errors ? 'jp-usage__errors' : undefined}>
            {usage.total.errors}
            <span className="jp-faint jp-small"> ({today.errors} today)</span>
          </dd>
        </div>
      </dl>
      {usage.budget.enabled && (
        <div className="jp-stack" style={{ gap: 4 }}>
          <div className="jp-row jp-row--between jp-small">
            <span className="jp-muted">Daily budget</span>
            <span>
              {formatTokens(tokensOf(today))} / {formatTokens(usage.budget.dailyTokens)}
            </span>
          </div>
          <div className={`jp-meter${reached ? ' jp-meter--danger' : fraction > 0.8 ? ' jp-meter--warning' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)} aria-label="Daily token budget used">
            <span style={{ width: `${fraction * 100}%` }} />
          </div>
          {reached && <Notice tone="warning">Today's token budget has been reached. AI features still work, but you asked to be warned.</Notice>}
        </div>
      )}
      {showProviders && providers.length > 0 && (
        <table className="jp-usage__table">
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Calls</th>
              <th scope="col">Errors</th>
              <th scope="col">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(([id, counters]) => (
              <tr key={id}>
                <td>{counters.name || id}</td>
                <td>{counters.calls}</td>
                <td>{counters.errors}</td>
                <td>{formatTokens(tokensOf(counters))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

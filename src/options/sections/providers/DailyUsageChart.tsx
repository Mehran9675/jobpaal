import type { UsageLog } from '@/shared/types';
import { formatTokens, lastDays, tokensOf } from '@/ui/components/usageMath';

export interface DailyUsageChartProps {
  usage: UsageLog;
  days: number;
}

const shortDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Bars of tokens per day plus an accessible table with the same numbers. */
export function DailyUsageChart({ usage, days }: DailyUsageChartProps) {
  const rows = lastDays(usage, days);
  const max = Math.max(1, ...rows.map((r) => tokensOf(r.counters)));
  const budget = usage.budget.enabled ? usage.budget.dailyTokens : 0;
  return (
    <div className="jp-stack">
      <h3 className="jp-opt-subheading">Last {days} days</h3>
      <div className="jp-opt-bars" aria-hidden="true">
        {rows.map(({ day, counters }) => {
          const tokens = tokensOf(counters);
          const over = budget > 0 && tokens >= budget;
          return (
            <div key={day} className="jp-opt-bars__col" title={`${shortDay(day)}: ${formatTokens(tokens)} tokens, ${counters.calls} calls`}>
              <span className={`jp-opt-bars__bar${over ? ' is-over' : ''}`} style={{ height: `${Math.max(tokens ? 3 : 0, (tokens / max) * 100)}%` }} />
              <span className="jp-opt-bars__label">{Number(day.slice(8))}</span>
            </div>
          );
        })}
      </div>
      <details>
        <summary className="jp-small">Show as table</summary>
        <table className="jp-usage__table">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Calls</th>
              <th scope="col">Errors</th>
              <th scope="col">Prompt</th>
              <th scope="col">Completion</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map(({ day, counters }) => (
              <tr key={day}>
                <td>{shortDay(day)}</td>
                <td>{counters.calls}</td>
                <td>{counters.errors}</td>
                <td>{formatTokens(counters.promptTokens)}</td>
                <td>{formatTokens(counters.completionTokens)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

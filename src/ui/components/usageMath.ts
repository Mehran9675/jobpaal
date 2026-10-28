import type { UsageCounters, UsageDay, UsageLog } from '@/shared/types';
import { dayKey } from '@/shared/utils/date';

export const tokensOf = (c: UsageCounters | undefined): number => (c ? c.promptTokens + c.completionTokens : 0);

export function emptyCounters(): UsageCounters {
  return { calls: 0, errors: 0, promptTokens: 0, completionTokens: 0 };
}

export function usageToday(usage: UsageLog, now: Date = new Date()): UsageDay {
  return usage.days[dayKey(now)] ?? { ...emptyCounters(), byProvider: {} };
}

/** True when the daily token budget is enabled and today's tokens reached it. */
export function budgetReached(usage: UsageLog, now: Date = new Date()): boolean {
  return usage.budget.enabled && usage.budget.dailyTokens > 0 && tokensOf(usageToday(usage, now)) >= usage.budget.dailyTokens;
}

/** Fraction (0..1+) of the daily budget used today; 0 when no budget. */
export function budgetFraction(usage: UsageLog, now: Date = new Date()): number {
  if (!usage.budget.enabled || usage.budget.dailyTokens <= 0) return 0;
  return tokensOf(usageToday(usage, now)) / usage.budget.dailyTokens;
}

/** The last `count` days (oldest first), filling days without usage with zeros. */
export function lastDays(usage: UsageLog, count: number, now: Date = new Date()): { day: string; counters: UsageDay }[] {
  const out: { day: string; counters: UsageDay }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = dayKey(date);
    out.push({ day: key, counters: usage.days[key] ?? { ...emptyCounters(), byProvider: {} } });
  }
  return out;
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

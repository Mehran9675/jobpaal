import { describe, expect, it } from 'vitest';
import { createEmptyUsage } from '@/shared/defaults/usage';
import { dayKey } from '@/shared/utils/date';
import { budgetReached, formatTokens, lastDays, tokensOf, usageToday } from '@/ui/components/usageMath';

describe('usageMath', () => {
  const now = new Date(2026, 9, 28, 12);
  const usage = createEmptyUsage();
  usage.days[dayKey(now)] = { calls: 3, errors: 1, promptTokens: 1000, completionTokens: 500, byProvider: {} };
  usage.days[dayKey(new Date(2026, 9, 26))] = { calls: 1, errors: 0, promptTokens: 10, completionTokens: 5, byProvider: {} };

  it('reads today and sums tokens', () => {
    expect(tokensOf(usageToday(usage, now))).toBe(1500);
    expect(usageToday(createEmptyUsage(), now).calls).toBe(0);
  });

  it('detects the budget', () => {
    expect(budgetReached(usage, now)).toBe(false);
    const withBudget = { ...usage, budget: { enabled: true, dailyTokens: 1500, lastWarnedDay: '' } };
    expect(budgetReached(withBudget, now)).toBe(true);
    expect(budgetReached({ ...withBudget, budget: { ...withBudget.budget, dailyTokens: 2000 } }, now)).toBe(false);
  });

  it('lists the last days oldest first with zero-filled gaps', () => {
    const days = lastDays(usage, 3, now);
    expect(days.map((d) => d.day)).toEqual(['2026-10-26', '2026-10-27', '2026-10-28']);
    expect(days.map((d) => tokensOf(d.counters))).toEqual([15, 0, 1500]);
  });

  it('formats tokens', () => {
    expect(formatTokens(999)).toBe('999');
    expect(formatTokens(1500)).toBe('1.5k');
    expect(formatTokens(25000)).toBe('25k');
    expect(formatTokens(2_500_000)).toBe('2.5M');
  });
});

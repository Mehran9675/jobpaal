import { updateUsage } from '@/shared/storage';
import type { UsageCounters, UsageLog } from '@/shared/types';
import { dayKey } from '@/shared/utils/date';

export interface UsageEntry {
  providerId: string;
  providerName: string;
  promptTokens: number;
  completionTokens: number;
  error: boolean;
}

const emptyCounters = (): UsageCounters => ({ calls: 0, errors: 0, promptTokens: 0, completionTokens: 0 });

function add(counters: UsageCounters, entry: UsageEntry): void {
  counters.calls += 1;
  if (entry.error) counters.errors += 1;
  counters.promptTokens += Math.max(0, entry.promptTokens || 0);
  counters.completionTokens += Math.max(0, entry.completionTokens || 0);
}

/** Pure: adds one call to the totals, the provider, the day and the provider-of-the-day. Mutates and returns `usage`. */
export function applyUsage(usage: UsageLog, entry: UsageEntry, day: string): UsageLog {
  add(usage.total, entry);
  const provider = usage.byProvider[entry.providerId] ?? { ...emptyCounters(), name: entry.providerName };
  provider.name = entry.providerName || provider.name;
  add(provider, entry);
  usage.byProvider[entry.providerId] = provider;
  const today = usage.days[day] ?? { ...emptyCounters(), byProvider: {} };
  add(today, entry);
  const todayProvider = today.byProvider[entry.providerId] ?? emptyCounters();
  add(todayProvider, entry);
  today.byProvider[entry.providerId] = todayProvider;
  usage.days[day] = today;
  return usage;
}

/** Pure: true when the daily budget is reached and no warning was shown today. */
export function shouldWarnBudget(usage: UsageLog, day: string): boolean {
  const { budget } = usage;
  if (!budget?.enabled || !(budget.dailyTokens > 0) || budget.lastWarnedDay === day) return false;
  const today = usage.days[day];
  return Boolean(today) && today.promptTokens + today.completionTokens >= budget.dailyTokens;
}

function notifyBudget(dailyTokens: number, used: number): void {
  try {
    if (typeof chrome === 'undefined' || !chrome.notifications?.create) return;
    chrome.notifications.create(`jobpaal-budget-${dayKey()}`, {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'JobPaal: daily AI token budget reached',
      message: `Today's AI usage is ${used.toLocaleString()} tokens (budget ${dailyTokens.toLocaleString()}). AI features keep working; check your provider's billing.`,
      priority: 1,
    });
  } catch {
    // Notifications are best effort.
  }
}

/** Records one AI call locally and warns once per day when the budget is reached. Never blocks calls. */
export async function recordUsage(entry: UsageEntry): Promise<void> {
  const day = dayKey();
  let warn: { dailyTokens: number; used: number } | null = null;
  await updateUsage((usage) => {
    usage.total ??= emptyCounters();
    usage.byProvider ??= {};
    usage.days ??= {};
    applyUsage(usage, entry, day);
    if (shouldWarnBudget(usage, day)) {
      const today = usage.days[day];
      warn = { dailyTokens: usage.budget.dailyTokens, used: today.promptTokens + today.completionTokens };
      usage.budget = { ...usage.budget, lastWarnedDay: day };
    }
    return usage;
  });
  const pending = warn as { dailyTokens: number; used: number } | null;
  if (pending) notifyBudget(pending.dailyTokens, pending.used);
}

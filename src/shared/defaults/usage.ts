import type { UsageLog } from '@/shared/types';

export function createEmptyUsage(): UsageLog {
  return {
    total: { calls: 0, errors: 0, promptTokens: 0, completionTokens: 0 },
    byProvider: {},
    days: {},
    budget: { enabled: false, dailyTokens: 200000, lastWarnedDay: '' },
  };
}

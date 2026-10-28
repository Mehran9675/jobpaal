import type { ProviderConfig } from '@/shared/types';
import { useAiSettings } from '@/ui/hooks/useAiSettings';
import { activeProvider } from '../lib/providers';

/** The active AI provider: undefined while loading, null when none is connected. */
export function useActiveProvider(): ProviderConfig | null | undefined {
  const ai = useAiSettings();
  return ai === undefined ? undefined : activeProvider(ai);
}

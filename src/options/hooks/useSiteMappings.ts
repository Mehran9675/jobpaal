import { listSiteMappings, STORAGE_KEYS, watchKey } from '@/shared/storage';
import type { SiteMapping } from '@/shared/types';
import { useAsyncStore } from '@/ui/hooks/useAsyncStore';

const watchSiteMappings = (listener: (value: SiteMapping[]) => void) => watchKey(STORAGE_KEYS.siteMappings, () => listener([]));

/** Per-site field mappings saved by the field guide, kept in sync with storage. */
export function useSiteMappings(): SiteMapping[] | undefined {
  return useAsyncStore(listSiteMappings, watchSiteMappings).value;
}

import { useSyncExternalStore } from 'react';
import { store } from '@/content/controller/store';
import type { OverlayState } from '@/content/controller/state';

export function useOverlayState(): OverlayState {
  return useSyncExternalStore(store.subscribe, store.get);
}

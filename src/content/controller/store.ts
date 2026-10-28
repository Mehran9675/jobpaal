import { hostFromUrl, pageKeyFromUrl } from '@/shared/utils/url';
import { initialState, type OverlayState } from './state';

type Listener = () => void;

/** Minimal external store for the overlay (read by React with useSyncExternalStore). */
class OverlayStore {
  private state: OverlayState;
  private listeners = new Set<Listener>();

  constructor() {
    this.state = initialState(location.href, pageKeyFromUrl(location.href), hostFromUrl(location.href));
  }

  get = (): OverlayState => this.state;

  set(patch: Partial<OverlayState> | ((state: OverlayState) => Partial<OverlayState>)): void {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener();
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

export const store = new OverlayStore();

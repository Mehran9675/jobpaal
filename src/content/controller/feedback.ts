import { errorMessage } from '@/shared/utils/errors';
import type { OverlayMessage } from './state';
import { store } from './store';

export function say(tone: OverlayMessage['tone'], text: string): void {
  store.set({ message: { tone, text } });
}

export function clearMessage(): void {
  store.set({ message: null });
}

/** Runs one long action at a time, showing progress and turning errors into a message. */
export async function withBusy<T>(label: string, work: () => Promise<T>): Promise<T | undefined> {
  if (store.get().busy) {
    say('warning', 'JobPaal is still working on the previous action.');
    return undefined;
  }
  store.set({ busy: label, message: null });
  try {
    return await work();
  } catch (error) {
    say('danger', errorMessage(error));
    return undefined;
  } finally {
    store.set({ busy: null });
  }
}

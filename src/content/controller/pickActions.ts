import { sendToBackground, type PickPurpose, type TopFrameEvent } from '@/shared/messaging';
import { getSiteMapping, saveFormFieldMapping, saveJobFieldLocator } from '@/shared/storage';
import type { JobField, ProfileKey } from '@/shared/types';
import { say } from './feedback';
import { setOverride } from './jobActions';
import { recomputeDetection } from './recompute';
import { store } from './store';

/** Whether a job-field pick should be remembered for this site (field guide) or only used on this page. */
let persistPick = false;
let pendingProfileKey: ProfileKey | null = null;

async function broadcastPick(purpose: PickPurpose): Promise<void> {
  store.set({ picking: purpose });
  try {
    await sendToBackground('frames:broadcast', { message: { kind: 'frame:pickStart', purpose } });
  } catch {
    store.set({ picking: null });
    say('danger', 'Could not start picking on this page. Reload the page and try again.');
  }
}

export function cancelPick(): void {
  store.set({ picking: null });
  sendToBackground('frames:broadcast', { message: { kind: 'frame:pickStop' } }).catch(() => undefined);
}

export function pickJobField(field: JobField, persist: boolean): Promise<void> {
  persistPick = persist;
  return broadcastPick({ type: 'job-field', field });
}

export function pickFormField(profileKey: ProfileKey): Promise<void> {
  pendingProfileKey = profileKey;
  return broadcastPick({ type: 'form-field', profileKey });
}

export function pickFieldForAnswer(question: string, text: string): Promise<void> {
  if (!text.trim()) {
    say('warning', 'Write or draft the answer first.');
    return Promise.resolve();
  }
  return broadcastPick({ type: 'send-answer', text, question });
}

export function pickUploadField(documentId: string): Promise<void> {
  return broadcastPick({ type: 'upload-field', documentId });
}

/** Events coming back from whichever frame the user clicked in. */
export async function handleTopEvent(event: TopFrameEvent): Promise<void> {
  if (event.kind === 'pickCancelled') {
    cancelPick();
    return;
  }
  if (event.kind === 'fieldFilled') {
    say(event.label ? 'success' : 'warning', event.label ? `Filled: ${event.label}` : 'That element could not be filled. Try the field itself, or type it by hand.');
    return;
  }
  // A frame reported a pick: stop picking everywhere else.
  cancelPick();
  const { purpose } = event;
  if (purpose.type === 'job-field') {
    if (!event.text.trim()) {
      say('warning', 'That element has no readable text. Try a larger area.');
      return;
    }
    const accepted = setOverride(purpose.field, purpose.field === 'description' ? event.text : event.text.split('\n')[0], persistPick ? 'guide' : 'picked');
    if (accepted && persistPick) {
      await saveJobFieldLocator(store.get().host, purpose.field, event.locator);
      store.set({ mapping: await getSiteMapping(store.get().host) });
      say('success', `Saved the ${purpose.field} location for ${store.get().host}. It will be read automatically next time.`);
    } else if (accepted) {
      say('success', `Using the picked ${purpose.field}.`);
    }
    recomputeDetection();
  } else if (purpose.type === 'form-field' && pendingProfileKey) {
    await saveFormFieldMapping(store.get().host, {
      locator: event.locator,
      target: { type: 'profile', key: pendingProfileKey },
      label: event.text || pendingProfileKey,
    });
    store.set({ mapping: await getSiteMapping(store.get().host) });
    say('success', `Mapped “${event.text || 'field'}” to ${pendingProfileKey}. Saved for ${store.get().host}.`);
    pendingProfileKey = null;
  }
}

import { errorMessage } from '@/shared/utils/errors';
import type {
  BackgroundRequestType,
  BackgroundRequests,
  ContentRequestType,
  ContentRequests,
  Envelope,
} from './protocol';

function unwrap<T>(response: Envelope<T> | undefined): T {
  if (!response) throw new Error('No response from JobPaal. Reload the page and try again.');
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

/** Sends a typed request to the background script. */
export async function sendToBackground<K extends BackgroundRequestType>(
  type: K,
  payload: BackgroundRequests[K]['req'],
): Promise<BackgroundRequests[K]['res']> {
  const response = (await chrome.runtime.sendMessage({ channel: 'bg', type, payload })) as Envelope<
    BackgroundRequests[K]['res']
  >;
  return unwrap(response);
}

/** Sends a typed request to the top-frame content script of a tab. */
export async function sendToContent<K extends ContentRequestType>(
  tabId: number,
  type: K,
  payload: ContentRequests[K]['req'],
): Promise<ContentRequests[K]['res']> {
  const response = (await chrome.tabs.sendMessage(tabId, { channel: 'content', type, payload }, { frameId: 0 })) as Envelope<
    ContentRequests[K]['res']
  >;
  return unwrap(response);
}

/** Wraps a handler result into an envelope for sendResponse. */
export async function toEnvelope<T>(work: () => Promise<T> | T): Promise<Envelope<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

import type { FrameRequest } from '@/shared/messaging';
import type { Handler } from './types';

async function frameIdsOf(tabId: number): Promise<number[]> {
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    if (frames && frames.length) return frames.map((f) => f.frameId);
  } catch {
    /* webNavigation unavailable: fall back to the top frame */
  }
  return [0];
}

function sendToFrame(tabId: number, frameId: number, message: FrameRequest): Promise<unknown> {
  return chrome.tabs.sendMessage(tabId, { channel: 'frame', request: message, frameId }, { frameId });
}

function requireTab(sender: chrome.runtime.MessageSender): number {
  const tabId = sender.tab?.id;
  if (tabId === undefined) throw new Error('Frame messages must come from a tab.');
  return tabId;
}

/** Relays a request to every frame of the sender's tab (including cross-origin frames). */
export const broadcastHandler: Handler<'frames:broadcast'> = async ({ message }, sender) => {
  const tabId = requireTab(sender);
  const frameIds = await frameIdsOf(tabId);
  const results = await Promise.allSettled(frameIds.map((frameId) => sendToFrame(tabId, frameId, message)));
  return results.flatMap((result, i) =>
    result.status === 'fulfilled' && result.value !== undefined ? [{ frameId: frameIds[i], result: result.value }] : [],
  );
};

export const sendFrameHandler: Handler<'frames:send'> = async ({ frameId, message }, sender) =>
  sendToFrame(requireTab(sender), frameId, message);

/** A sub-frame forwards an event (e.g. a pick) to the top frame, where the overlay lives. */
export const toTopHandler: Handler<'frames:toTop'> = async ({ event }, sender) => {
  const tabId = requireTab(sender);
  await chrome.tabs.sendMessage(tabId, { channel: 'topEvent', event, fromFrameId: sender.frameId ?? 0 }, { frameId: 0 });
  return { ok: true };
};

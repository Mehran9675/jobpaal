/** Sends a progress line to the tab that started a long task, so the overlay can show it. */
export function reportProgress(tabId: number | undefined, text: string): void {
  if (tabId === undefined) return;
  chrome.tabs.sendMessage(tabId, { channel: 'progress', text }, { frameId: 0 }).catch(() => undefined);
}

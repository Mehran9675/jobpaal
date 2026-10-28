import type { Profile } from '@/shared/types';
import { linkedInImportHandler } from './handlers/navigationHandlers';
import { openManagementPage } from './openManagementPage';

const MENU = {
  tailor: 'jobpaal-tailor',
  fill: 'jobpaal-fill',
  linkedin: 'jobpaal-linkedin',
  open: 'jobpaal-open',
} as const;

export function createContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU.tailor, title: 'Tailor documents for this job', contexts: ['page', 'selection', 'frame'] });
    chrome.contextMenus.create({ id: MENU.fill, title: 'Fill this application form', contexts: ['page', 'editable', 'frame'] });
    chrome.contextMenus.create({
      id: MENU.linkedin,
      title: 'Scan this LinkedIn profile',
      contexts: ['page'],
      documentUrlPatterns: ['https://www.linkedin.com/in/*', 'https://linkedin.com/in/*'],
    });
    chrome.contextMenus.create({ id: MENU.open, title: 'Open JobPaal', contexts: ['page', 'action'] });
  });
}

async function sendContent(tabId: number, type: string, payload: object = {}): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    return await chrome.tabs.sendMessage(tabId, { channel: 'content', type, payload }, { frameId: 0 });
  } catch {
    return { ok: false, error: 'JobPaal is not running on this page. Reload the page and try again.' };
  }
}

function notify(message: string): void {
  if (!chrome.notifications) return;
  chrome.notifications.create({ type: 'basic', iconUrl: chrome.runtime.getURL('icons/icon-128.png'), title: 'JobPaal', message });
}

export function registerContextMenuHandlers(): void {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === MENU.open) {
      await openManagementPage();
      return;
    }
    if (tab?.id === undefined) return;
    if (info.menuItemId === MENU.tailor) {
      const res = await sendContent(tab.id, 'content:tailorAndFill');
      if (!res.ok) notify(res.error ?? 'Could not tailor documents on this page.');
    } else if (info.menuItemId === MENU.fill) {
      const res = await sendContent(tab.id, 'content:fill');
      if (!res.ok) notify(res.error ?? 'Could not fill this form.');
    } else if (info.menuItemId === MENU.linkedin) {
      const res = await sendContent(tab.id, 'content:scanLinkedIn');
      const data = res.data as { profile: unknown; message: string } | undefined;
      if (res.ok && data?.profile) {
        await linkedInImportHandler({ profile: data.profile as Partial<Profile> }, {});
      } else {
        notify(data?.message ?? res.error ?? 'This LinkedIn profile could not be read.');
      }
    }
  });
}

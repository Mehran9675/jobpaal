import { STORAGE_KEYS, readKey, writeKey } from '@/shared/storage';
import { createContextMenus } from './contextMenus';
import { openManagementPage } from './openManagementPage';

export function registerInstallHandlers(): void {
  chrome.runtime.onInstalled.addListener(async (details) => {
    createContextMenus();
    if (details.reason === 'install') {
      if (!(await readKey<number>(STORAGE_KEYS.installedAt))) await writeKey(STORAGE_KEYS.installedAt, Date.now());
      // The management page opens automatically the first time, starting with the terms.
      await openManagementPage('terms');
    }
  });
  chrome.runtime.onStartup?.addListener(() => createContextMenus());
}

import { STORAGE_KEYS, writeKey } from '@/shared/storage';
import { openManagementPage } from '../openManagementPage';
import type { Handler } from './types';

export const openOptionsHandler: Handler<'options:open'> = async ({ section }) => {
  await openManagementPage(section);
  return { ok: true };
};

export const openSidePanelHandler: Handler<'sidepanel:open'> = async (_payload, sender) => {
  const sidePanel = (chrome as unknown as { sidePanel?: { open(o: { tabId?: number; windowId?: number }): Promise<void> } }).sidePanel;
  if (sidePanel && sender.tab) {
    await sidePanel.open({ tabId: sender.tab.id });
    return { ok: true };
  }
  return { ok: false };
};

export const linkedInImportHandler: Handler<'linkedin:import'> = async ({ profile }) => {
  await writeKey(STORAGE_KEYS.pendingImport, { source: 'linkedin', at: Date.now(), profile });
  await openManagementPage('profile');
  return { ok: true };
};

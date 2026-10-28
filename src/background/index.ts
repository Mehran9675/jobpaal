/**
 * JobPaal background script (Chromium service worker / Firefox event page).
 * Owns AI calls, the tailoring pipeline, file rendering and cross-frame relays.
 * There is no server: everything is stored in chrome.storage.local.
 */
import { registerContextMenuHandlers } from './contextMenus';
import { registerInstallHandlers } from './install';
import { registerRouter } from './router';
import { configureSidePanel } from './sidePanel';

registerRouter();
registerInstallHandlers();
registerContextMenuHandlers();
configureSidePanel();

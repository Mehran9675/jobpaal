/**
 * JobPaal content script. Runs in every frame:
 *  - every frame answers frame requests (scan, fill, attach, pick) relayed by the background;
 *  - the top frame also reads the job, owns the overlay and answers the popup / side panel.
 * It never submits forms.
 */
import { initController } from './controller/init';
import { isTopFrame } from './frame/frameContext';
import { registerFrameAgent } from './frame/frameAgent';
import { registerContentMessages } from './messages/contentMessages';
import { mountOverlay } from './overlay/mount';

declare global {
  interface Window {
    __jobpaalLoaded?: boolean;
  }
}

function start(): void {
  if (window.__jobpaalLoaded) return;
  window.__jobpaalLoaded = true;
  registerFrameAgent();
  if (!isTopFrame) return;
  if (!(document.documentElement instanceof HTMLElement)) return; // not an HTML page (e.g. SVG, XML)
  registerContentMessages();
  mountOverlay();
  void initController();
}

start();

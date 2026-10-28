import { runDetection } from '@/content/controller/detection';
import { say } from '@/content/controller/feedback';
import { fillPage } from '@/content/controller/fillActions';
import { pasteDescription, runMatch, setForced, tailorAndFill, applyRecentJob } from '@/content/controller/jobActions';
import { store } from '@/content/controller/store';
import { shouldShowButton } from '@/content/controller/visibility';
import { isLinkedInProfilePage, scanLinkedInProfile } from '@/content/linkedin';
import { toEnvelope, type ContentMessage, type ContentState } from '@/shared/messaging';

function snapshot(): ContentState {
  const s = store.get();
  return {
    detection: s.detection,
    overlayVisible: shouldShowButton(s),
    overlayEnabled: s.settings.overlay.enabled,
    forced: s.forced,
    applicationId: s.application?.id ?? null,
    busy: s.busy,
  };
}

function lastMessage(fallback: string): { ok: boolean; message: string } {
  const message = store.get().message;
  return { ok: !message || message.tone === 'success' || message.tone === 'info', message: message?.text ?? fallback };
}

async function handle(message: ContentMessage): Promise<unknown> {
  switch (message.type) {
    case 'content:getState':
      return snapshot();
    case 'content:refresh':
      await runDetection();
      return snapshot();
    case 'content:tailorAndFill':
      store.set({ panelOpen: true });
      await tailorAndFill();
      return lastMessage('Done.');
    case 'content:fill':
      store.set({ panelOpen: true });
      await fillPage();
      return lastMessage('Done.');
    case 'content:match':
      store.set({ panelOpen: true });
      await runMatch();
      return lastMessage('Match updated.');
    case 'content:setForced':
      await setForced(message.payload.forced);
      return snapshot();
    case 'content:openOverlay': {
      const tool = message.payload.tool;
      store.set({ panelOpen: true, tool: tool === 'pick' ? 'guide' : (tool ?? null) });
      if (tool === 'pick' && !store.get().forced && !shouldShowButton(store.get())) await setForced(true);
      return { ok: true };
    }
    case 'content:useJob':
      applyRecentJob(message.payload.job);
      store.set({ panelOpen: true });
      return snapshot();
    case 'content:pasteDescription': {
      const ok = pasteDescription(message.payload.text, message.payload.source);
      store.set({ panelOpen: true });
      return { ok, message: store.get().message?.text ?? '' };
    }
    case 'content:scanLinkedIn': {
      if (!isLinkedInProfilePage(location.href)) {
        return { profile: null, message: 'Open a LinkedIn profile page (linkedin.com/in/…) to scan it.' };
      }
      const profile = scanLinkedInProfile(document);
      if (!profile) say('warning', 'This LinkedIn profile could not be read. Scroll through it once so it loads, then try again.');
      return {
        profile,
        message: profile ? 'Profile read. Review it in the management page before merging.' : 'This LinkedIn profile could not be read.',
      };
    }
  }
}

/** Requests from the popup, side panel and context menu (top frame only). */
export function registerContentMessages(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.channel !== 'content') return false;
    toEnvelope(() => handle(message as ContentMessage)).then(sendResponse);
    return true;
  });
}

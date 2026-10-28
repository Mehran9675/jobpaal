import { TERMS_VERSION } from '@/shared/defaults/settings';
import { sendToBackground, type TopFrameEvent } from '@/shared/messaging';
import {
  STORAGE_KEYS,
  getProfile,
  getSettings,
  isProfileUsable,
  listSavedAnswers,
  watchKeys,
} from '@/shared/storage';
import { runDetection } from './detection';
import { handleTopEvent } from './pickActions';
import { refreshApplication } from './recompute';
import { store } from './store';

async function loadStatus(): Promise<void> {
  const [settings, profile, savedAnswers] = await Promise.all([getSettings(), getProfile(), listSavedAnswers()]);
  let aiReady = false;
  let providerName = '';
  try {
    const status = await sendToBackground('ai:status', {});
    aiReady = status.connected;
    providerName = status.providerName;
  } catch {
    /* background asleep or reloading */
  }
  store.set({
    settings,
    savedAnswers,
    aiReady,
    providerName,
    termsAccepted: settings.terms?.version === TERMS_VERSION,
    profileReady: isProfileUsable(profile),
  });
}

function watchStorage(): void {
  watchKeys(
    [
      STORAGE_KEYS.settings,
      STORAGE_KEYS.profile,
      STORAGE_KEYS.ai,
      STORAGE_KEYS.savedAnswers,
      STORAGE_KEYS.applications,
      STORAGE_KEYS.documents,
      STORAGE_KEYS.siteMappings,
      STORAGE_KEYS.forcedPages,
      STORAGE_KEYS.jobs,
    ],
    (keys) => {
      if (keys.some((k) => [STORAGE_KEYS.settings, STORAGE_KEYS.profile, STORAGE_KEYS.ai, STORAGE_KEYS.savedAnswers].includes(k as never))) {
        void loadStatus();
      }
      if (keys.some((k) => [STORAGE_KEYS.applications, STORAGE_KEYS.documents, STORAGE_KEYS.jobs].includes(k as never))) {
        void refreshApplication();
      }
      if (keys.some((k) => [STORAGE_KEYS.siteMappings, STORAGE_KEYS.forcedPages].includes(k as never))) {
        void runDetection();
      }
    },
  );
}

function listenForFrameEvents(): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.channel === 'topEvent') void handleTopEvent(message.event as TopFrameEvent);
    if (message?.channel === 'progress' && store.get().busy) store.set({ busy: String(message.text) });
    return false;
  });
}

/** Re-reads the page when a single-page app navigates or loads content late. */
function watchPage(): void {
  let lastUrl = location.href;
  let lastRun = Date.now();
  let timer: number | undefined;

  const schedule = (delay: number) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      lastRun = Date.now();
      void runDetection();
    }, delay);
  };

  window.setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      schedule(600);
    }
  }, 700);

  const observer = new MutationObserver((mutations) => {
    const host = document.getElementById('jobpaal-root');
    if (mutations.every((m) => host && host.contains(m.target))) return;
    if (store.get().busy || store.get().picking) return;
    const since = Date.now() - lastRun;
    schedule(since > 4000 ? 1200 : 4000 - since);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export async function initController(): Promise<void> {
  listenForFrameEvents();
  await loadStatus();
  await runDetection();
  watchStorage();
  watchPage();
}

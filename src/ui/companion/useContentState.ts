import { useCallback, useEffect, useState } from 'react';
import { sendToContent, type ContentState } from '@/shared/messaging';
import { STORAGE_KEYS, watchKeys } from '@/shared/storage';
import { ensureContentScript, isRestrictedUrl } from './ensureContentScript';

export interface ContentConnection {
  state: ContentState | null;
  /** Why the page cannot be used, when it cannot. */
  unavailable: string | null;
  refresh: () => Promise<void>;
}

async function fetchState(tabId: number): Promise<ContentState> {
  return sendToContent(tabId, 'content:getState', {});
}

/** Talks to the content script of a tab, injecting it once if the tab predates the extension. */
export function useContentState(tab: chrome.tabs.Tab | null): ContentConnection {
  const [state, setState] = useState<ContentState | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tab?.id) return;
    if (isRestrictedUrl(tab.url)) {
      setState(null);
      setUnavailable('JobPaal cannot run on this page (browser pages and extension stores are protected).');
      return;
    }
    try {
      setState(await fetchState(tab.id));
      setUnavailable(null);
    } catch {
      if (await ensureContentScript(tab.id)) {
        await new Promise((r) => setTimeout(r, 400));
        try {
          setState(await fetchState(tab.id));
          setUnavailable(null);
          return;
        } catch {
          /* fall through */
        }
      }
      setState(null);
      setUnavailable('JobPaal is not running on this page yet. Reload the page and try again.');
    }
  }, [tab?.id, tab?.url]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(refresh, 2500);
    const unwatch = watchKeys([STORAGE_KEYS.applications, STORAGE_KEYS.settings, STORAGE_KEYS.forcedPages], () => void refresh());
    return () => {
      clearInterval(timer);
      unwatch();
    };
  }, [refresh]);

  return { state, unavailable, refresh };
}

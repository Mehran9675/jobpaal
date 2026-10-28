import { useEffect, useState } from 'react';

/** The active tab of the current window; follows tab switches and navigations (side panel). */
export function useActiveTab(): chrome.tabs.Tab | null {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (alive) setTab(active ?? null);
    };
    void refresh();
    const onActivated = () => void refresh();
    const onUpdated = (_id: number, info: chrome.tabs.TabChangeInfo, updated: chrome.tabs.Tab) => {
      if (updated.active && (info.status === 'complete' || info.url)) void refresh();
    };
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      alive = false;
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);
  return tab;
}

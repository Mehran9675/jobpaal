/** Opens the side panel (Chromium) or sidebar (Firefox). Must run inside a user gesture. */
export async function openSidePanel(): Promise<boolean> {
  const api = chrome as unknown as {
    sidePanel?: { open(options: { windowId: number }): Promise<void> };
  };
  const firefox = (globalThis as unknown as { browser?: { sidebarAction?: { open(): Promise<void> } } }).browser;
  try {
    if (firefox?.sidebarAction) {
      await firefox.sidebarAction.open();
      return true;
    }
    if (api.sidePanel) {
      const win = await chrome.windows.getCurrent();
      if (win.id !== undefined) await api.sidePanel.open({ windowId: win.id });
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/** Opens (or focuses) the management page, optionally at a section hash. */
export async function openManagementPage(section?: string): Promise<void> {
  const base = chrome.runtime.getURL('options/index.html');
  const url = section ? `${base}#${section}` : base;
  const tabs = await chrome.tabs.query({ url: `${base}*` });
  const existing = tabs[0];
  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, { active: true, url });
    if (existing.windowId !== undefined) await chrome.windows.update(existing.windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url });
}

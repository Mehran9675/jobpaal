/**
 * Tabs opened before JobPaal was installed (or updated) have no content script yet.
 * Injects it on demand so the popup and side panel work without reloading the page.
 */
export async function ensureContentScript(tabId: number): Promise<boolean> {
  try {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['content.js'] });
    return true;
  } catch {
    return false;
  }
}

export function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return true;
  return !/^(https?|file):/i.test(url) || /^https:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com|addons\.mozilla\.org)/i.test(url);
}

export const isTopFrame = (() => {
  try {
    return window.top === window;
  } catch {
    return false;
  }
})();

/** Frame identity used in locators: '' for the top frame, the frame URL otherwise. */
export function currentFrameUrl(): string {
  return isTopFrame ? '' : location.href;
}

/** Locators saved in one frame must only be resolved in that same frame. */
export function locatorBelongsHere(frameUrl: string): boolean {
  if (isTopFrame) return frameUrl === '';
  if (!frameUrl) return false;
  try {
    const a = new URL(frameUrl);
    return a.origin === location.origin && a.pathname === location.pathname;
  } catch {
    return false;
  }
}

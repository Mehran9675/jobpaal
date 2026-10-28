/** Chromium: clicking the toolbar icon opens the popup, not the side panel. */
export function configureSidePanel(): void {
  const sidePanel = (chrome as unknown as {
    sidePanel?: { setPanelBehavior(o: { openPanelOnActionClick: boolean }): Promise<void> };
  }).sidePanel;
  sidePanel?.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => undefined);
}

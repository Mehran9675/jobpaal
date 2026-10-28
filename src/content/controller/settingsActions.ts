import { updateSettings } from '@/shared/storage';
import type { Point } from '@/shared/types';
import { store } from './store';

export async function setOverlayEnabled(enabled: boolean): Promise<void> {
  await updateSettings((s) => {
    s.overlay.enabled = enabled;
  });
  if (!enabled) store.set({ panelOpen: false });
}

export async function setScale(scale: number): Promise<void> {
  const clamped = Math.min(1.6, Math.max(0.85, Math.round(scale * 100) / 100));
  await updateSettings((s) => {
    s.overlay.scale = clamped;
  });
}

export async function saveButtonPosition(position: Point): Promise<void> {
  await updateSettings((s) => {
    s.overlay.buttonPosition = position;
  });
}

export async function savePanelPosition(position: Point): Promise<void> {
  await updateSettings((s) => {
    s.overlay.panelPosition = position;
  });
}

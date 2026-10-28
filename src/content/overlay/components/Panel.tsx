import { useEffect, useState } from 'react';
import { savePanelPosition } from '@/content/controller/settingsActions';
import { store } from '@/content/controller/store';
import type { OverlayState } from '@/content/controller/state';
import type { Point } from '@/shared/types';
import { clampToViewport, EDGE } from '../hooks/clamp';
import { useDrag } from '../hooks/useDrag';
import { useViewport } from '../hooks/useViewport';
import { HideSwitch } from './HideSwitch';
import { PanelBody } from './PanelBody';
import { PanelHeader } from './PanelHeader';
import { ScaleControls } from './ScaleControls';
import { UsageFooter } from './UsageFooter';

const WIDTH = 384;
const MAX_HEIGHT = 660;

/**
 * The overlay panel: draggable, fixed height with internal scrolling, scalable 85–160%,
 * and always clamped back inside the viewport.
 */
export function Panel({ state, light }: { state: OverlayState; light: 'green' | 'red' }) {
  const viewport = useViewport();
  const scale = state.settings.overlay.scale;
  const height = Math.max(240, Math.min(MAX_HEIGHT, (viewport.height - EDGE * 2) / scale));
  const visualWidth = Math.min(WIDTH * scale, viewport.width - EDGE * 2);
  const visualHeight = height * scale;
  const fallback = { x: viewport.width - visualWidth - 16, y: 16 };
  const saved = state.settings.overlay.panelPosition;
  const [position, setPosition] = useState<Point>(() => clampToViewport(saved ?? fallback, visualWidth, visualHeight, viewport));

  useEffect(() => {
    setPosition((p) => clampToViewport(p, visualWidth, visualHeight, viewport));
  }, [viewport, visualWidth, visualHeight]);

  const drag = useDrag({
    position,
    onMove: (p) => setPosition(clampToViewport(p, visualWidth, visualHeight, viewport)),
    onEnd: (p, moved) => {
      if (moved) void savePanelPosition(clampToViewport(p, visualWidth, visualHeight, viewport));
    },
  });

  return (
    <div
      className="jp-ov-panel"
      role="dialog"
      aria-label="JobPaal"
      style={{
        left: position.x,
        top: position.y,
        width: visualWidth / scale,
        height,
        transform: `scale(${scale})`,
      }}
    >
      <div className="jp-ov-panel__top">
        <HideSwitch />
        <ScaleControls scale={scale} />
      </div>
      <PanelHeader dragHandlers={drag} onClose={() => store.set({ panelOpen: false })} />
      <div className="jp-ov-panel__body">
        <PanelBody state={state} light={light} />
      </div>
      <UsageFooter providerName={state.providerName} />
    </div>
  );
}

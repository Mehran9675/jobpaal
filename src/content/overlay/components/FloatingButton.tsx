import { useEffect, useState } from 'react';
import { saveButtonPosition } from '@/content/controller/settingsActions';
import type { Point } from '@/shared/types';
import { clampToViewport } from '../hooks/clamp';
import { useDrag } from '../hooks/useDrag';
import { useViewport } from '../hooks/useViewport';

const SIZE = 48;

export interface FloatingButtonProps {
  saved: Point | null;
  light: 'green' | 'red';
  busy: boolean;
  title: string;
  onClick: () => void;
}

/** Draggable corner button that doubles as a status light. */
export function FloatingButton({ saved, light, busy, title, onClick }: FloatingButtonProps) {
  const viewport = useViewport();
  const fallback = { x: viewport.width - SIZE - 20, y: viewport.height - SIZE - 96 };
  const [position, setPosition] = useState<Point>(() => clampToViewport(saved ?? fallback, SIZE, SIZE, viewport));

  useEffect(() => {
    setPosition((p) => clampToViewport(saved ?? p, SIZE, SIZE, viewport));
  }, [viewport.width, viewport.height, saved?.x, saved?.y]);

  const drag = useDrag({
    position,
    onMove: (p) => setPosition(clampToViewport(p, SIZE, SIZE, viewport)),
    onEnd: (p, moved) => {
      if (!moved) onClick();
      else void saveButtonPosition(clampToViewport(p, SIZE, SIZE, viewport));
    },
  });

  return (
    <button
      type="button"
      className="jp-ov-fab"
      style={{ left: position.x, top: position.y }}
      title={title}
      aria-label={title}
      {...drag}
    >
      <img src={chrome.runtime.getURL('icons/icon-48.png')} alt="" />
      <span className={`jp-ov-fab__light jp-ov-fab__light--${light}`} />
      {busy && <span className="jp-ov-fab__busy" />}
    </button>
  );
}

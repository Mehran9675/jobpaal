import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Point } from '@/shared/types';

export interface DragOptions {
  position: Point;
  onMove: (position: Point) => void;
  onEnd: (position: Point, moved: boolean) => void;
}

/** Pointer-based dragging. Reports whether the pointer actually moved, so a drag is not mistaken for a click. */
export function useDrag({ position, onMove, onEnd }: DragOptions) {
  const state = useRef<{ startX: number; startY: number; origin: Point; moved: boolean; last: Point } | null>(null);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest('[data-no-drag]')) return;
      state.current = { startX: event.clientX, startY: event.clientY, origin: position, moved: false, last: position };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [position],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = state.current;
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      drag.last = { x: drag.origin.x + dx, y: drag.origin.y + dy };
      onMove(drag.last);
    },
    [onMove],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = state.current;
      state.current = null;
      if (!drag) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      onEnd(drag.last, drag.moved);
    },
    [onEnd],
  );

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}

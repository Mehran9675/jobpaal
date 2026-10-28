import type { Point } from '@/shared/types';

export const EDGE = 8;

/** Keeps a box of the given (visual) size fully inside the viewport. */
export function clampToViewport(point: Point, width: number, height: number, viewport: { width: number; height: number }): Point {
  const maxX = Math.max(EDGE, viewport.width - width - EDGE);
  const maxY = Math.max(EDGE, viewport.height - height - EDGE);
  return {
    x: Math.round(Math.min(maxX, Math.max(EDGE, point.x))),
    y: Math.round(Math.min(maxY, Math.max(EDGE, point.y))),
  };
}

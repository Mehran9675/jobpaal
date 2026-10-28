import { describe, expect, it } from 'vitest';
import { clampToViewport } from '@/content/overlay/hooks/clamp';

describe('clampToViewport', () => {
  const viewport = { width: 1000, height: 800 };
  it('keeps a box inside the viewport', () => {
    expect(clampToViewport({ x: 990, y: -20 }, 300, 400, viewport)).toEqual({ x: 692, y: 8 });
  });
  it('pins to the edge when the box is larger than the viewport', () => {
    expect(clampToViewport({ x: 50, y: 50 }, 1200, 900, viewport)).toEqual({ x: 8, y: 8 });
  });
});

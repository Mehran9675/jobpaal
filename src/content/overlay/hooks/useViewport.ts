import { useEffect, useState } from 'react';

export interface Viewport {
  width: number;
  height: number;
}

const read = (): Viewport => ({ width: document.documentElement.clientWidth || innerWidth, height: innerHeight });

/** Viewport size, updated on resize so floating elements can clamp themselves back into view. */
export function useViewport(): Viewport {
  const [viewport, setViewport] = useState(read);
  useEffect(() => {
    const update = () => setViewport(read());
    addEventListener('resize', update);
    return () => removeEventListener('resize', update);
  }, []);
  return viewport;
}

import { setScale } from '@/content/controller/settingsActions';

const STEP = 0.05;

/** Size controls from 85% to 160%. */
export function ScaleControls({ scale }: { scale: number }) {
  return (
    <span className="jp-ov-scale" data-no-drag>
      <button type="button" onClick={() => setScale(scale - STEP)} disabled={scale <= 0.85} aria-label="Smaller">
        −
      </button>
      <span>{Math.round(scale * 100)}%</span>
      <button type="button" onClick={() => setScale(scale + STEP)} disabled={scale >= 1.6} aria-label="Larger">
        +
      </button>
      <button type="button" onClick={() => setScale(1)} title="Reset size" aria-label="Reset size">
        ↺
      </button>
    </span>
  );
}

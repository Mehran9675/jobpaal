import { useId } from 'react';
import { updateSettings } from '@/shared/storage';
import type { OverlaySettings } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Toggle } from '@/ui/components/Toggle';

const MIN_SCALE = 0.85;
const MAX_SCALE = 1.6;

export function OverlaySettingsCard({ overlay }: { overlay: OverlaySettings }) {
  const sliderId = useId();
  const set = (patch: Partial<OverlaySettings>) =>
    void updateSettings((s) => {
      s.overlay = { ...s.overlay, ...patch };
      return s;
    });
  const percent = Math.round(overlay.scale * 100);
  return (
    <Card title="On-page overlay">
      <div className="jp-stack jp-stack--lg">
        <Toggle checked={overlay.enabled} onChange={(enabled) => set({ enabled })} label="Show the JobPaal button and panel on job pages" />
        <p className="jp-small jp-faint">The same switch is at the top of the overlay panel and in the popup.</p>
        <div className="jp-field" style={{ maxWidth: 420 }}>
          <label className="jp-field__label" htmlFor={sliderId}>
            Panel size: {percent}%
          </label>
          <input
            id={sliderId}
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.05}
            value={overlay.scale}
            onChange={(e) => set({ scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(e.target.value))) })}
            aria-valuetext={`${percent}%`}
          />
          <span className="jp-field__hint">85% to 160%. The panel always stays inside the window.</span>
        </div>
        <div className="jp-row jp-row--wrap">
          <Button size="sm" onClick={() => set({ scale: 1 })} disabled={overlay.scale === 1}>
            Reset size
          </Button>
          <Button size="sm" onClick={() => set({ buttonPosition: null, panelPosition: null })} disabled={!overlay.buttonPosition && !overlay.panelPosition}>
            Reset button and panel position
          </Button>
        </div>
      </div>
    </Card>
  );
}

import { setOverlayEnabled } from '@/content/controller/settingsActions';
import { Toggle } from '@/ui/components/Toggle';

/** The switch at the very top: hides the overlay everywhere (same switch as in the popup). */
export function HideSwitch() {
  return (
    <span data-no-drag>
      <Toggle checked onChange={(on) => setOverlayEnabled(on)} label="Overlay" title="Turn off to hide the JobPaal overlay on all pages" />
    </span>
  );
}

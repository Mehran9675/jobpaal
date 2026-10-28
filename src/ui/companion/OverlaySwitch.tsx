import { updateSettings } from '@/shared/storage';
import { Toggle } from '@/ui/components/Toggle';

/** Same switch as the one at the top of the overlay: hides the overlay everywhere. */
export function OverlaySwitch({ enabled }: { enabled: boolean }) {
  return (
    <Toggle
      checked={enabled}
      onChange={(on) =>
        updateSettings((s) => {
          s.overlay.enabled = on;
        })
      }
      label="Overlay"
      title="Show or hide the JobPaal overlay on job pages"
    />
  );
}

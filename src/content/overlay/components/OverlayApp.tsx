import { useEffect } from 'react';
import { cancelPick } from '@/content/controller/pickActions';
import { store } from '@/content/controller/store';
import { shouldShowButton, statusLight } from '@/content/controller/visibility';
import { useTheme } from '@/ui/hooks/useTheme';
import { useOverlayState } from '../hooks/useOverlayState';
import { FloatingButton } from './FloatingButton';
import { Panel } from './Panel';
import { PickingBar } from './PickingBar';

export function OverlayApp() {
  const state = useOverlayState();
  const theme = useTheme(state.settings.theme);
  const visible = shouldShowButton(state);
  const light = statusLight(state);

  useEffect(() => {
    if (!state.picking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelPick();
    };
    addEventListener('keydown', onKey, true);
    return () => removeEventListener('keydown', onKey, true);
  }, [state.picking]);

  if (!visible && !state.panelOpen) return null;
  if (!state.settings.overlay.enabled) return null;

  return (
    <div className="jp-root jp-ov-layer" data-theme={theme}>
      {!state.picking && (
        <FloatingButton
          saved={state.settings.overlay.buttonPosition}
          light={light}
          busy={Boolean(state.busy)}
          title={light === 'green' ? 'JobPaal: ready' : 'JobPaal: manual work needed'}
          onClick={() => store.set({ panelOpen: !state.panelOpen })}
        />
      )}
      {state.panelOpen && !state.picking && <Panel state={state} light={light} />}
      {state.picking && <PickingBar purpose={state.picking} />}
    </div>
  );
}

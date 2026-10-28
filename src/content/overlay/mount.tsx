import { createRoot } from 'react-dom/client';
import baseCss from '@/ui/styles/base.css?inline';
import overlayCss from './styles/overlay.css?inline';
import { OverlayApp } from './components/OverlayApp';

/** Mounts the overlay in a shadow root so page styles cannot break it (and it cannot break the page). */
export function mountOverlay(): void {
  if (document.getElementById('jobpaal-root')) return;
  const host = document.createElement('div');
  host.id = 'jobpaal-root';
  host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483646;';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `${baseCss}\n${overlayCss}\n.jp-root.jp-ov-layer{background:transparent;}`;
  shadow.appendChild(style);
  const container = document.createElement('div');
  shadow.appendChild(container);
  document.documentElement.appendChild(host);
  createRoot(container).render(<OverlayApp />);
}

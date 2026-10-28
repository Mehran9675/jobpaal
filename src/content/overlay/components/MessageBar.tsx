import { clearMessage } from '@/content/controller/feedback';
import type { OverlayMessage } from '@/content/controller/state';

export function MessageBar({ message }: { message: OverlayMessage }) {
  return (
    <div className={`jp-notice jp-notice--${message.tone}`} role={message.tone === 'danger' ? 'alert' : 'status'}>
      <div style={{ flex: 1 }}>{message.text}</div>
      <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" onClick={clearMessage} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Element role; 'alertdialog' for confirmations. */
  role?: 'dialog' | 'alertdialog';
}

/** Accessible modal dialog: Escape closes, focus moves inside and returns afterwards. */
export function Modal({ title, onClose, children, footer, size = 'md', role = 'dialog' }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>('[data-autofocus], input, textarea, select, button');
    (focusable ?? panel)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
          (el) => !el.hasAttribute('disabled'),
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className="jp-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div ref={panelRef} className={`jp-modal__panel jp-modal__panel--${size}`} role={role} aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className="jp-modal__header">
          <h2 id={titleId} className="jp-modal__title">
            {title}
          </h2>
          <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="jp-modal__body">{children}</div>
        {footer && <footer className="jp-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}

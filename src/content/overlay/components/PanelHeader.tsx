import type { PointerEventHandler } from 'react';

export interface PanelHeaderProps {
  dragHandlers: {
    onPointerDown: PointerEventHandler<HTMLElement>;
    onPointerMove: PointerEventHandler<HTMLElement>;
    onPointerUp: PointerEventHandler<HTMLElement>;
    onPointerCancel: PointerEventHandler<HTMLElement>;
  };
  onClose: () => void;
}

export function PanelHeader({ dragHandlers, onClose }: PanelHeaderProps) {
  return (
    <div className="jp-ov-panel__header" {...dragHandlers}>
      <img src={chrome.runtime.getURL('icons/icon-48.png')} alt="" />
      <span className="jp-ov-panel__title">JobPaal</span>
      <span className="jp-small jp-faint">drag to move</span>
      <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" data-no-drag onClick={onClose} aria-label="Close panel">
        ✕
      </button>
    </div>
  );
}

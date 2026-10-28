import type { ReactNode } from 'react';

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

export function StatTile({ label, value, hint, tone = 'neutral', onClick }: StatTileProps) {
  const className = ['jp-stat', tone !== 'neutral' && `jp-stat--${tone}`, onClick && 'jp-stat--clickable'].filter(Boolean).join(' ');
  const content = (
    <>
      <span className="jp-stat__value">{value}</span>
      <span className="jp-stat__label">{label}</span>
      {hint && <span className="jp-stat__hint">{hint}</span>}
    </>
  );
  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

import type { ReactNode } from 'react';

export interface BadgeProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
  title?: string;
}

export function Badge({ tone = 'neutral', children, title }: BadgeProps) {
  return (
    <span className={['jp-badge', tone !== 'neutral' && `jp-badge--${tone}`].filter(Boolean).join(' ')} title={title}>
      {children}
    </span>
  );
}

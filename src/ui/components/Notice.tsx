import type { ReactNode } from 'react';

export interface NoticeProps {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}

export function Notice({ tone = 'neutral', children }: NoticeProps) {
  return (
    <div className={['jp-notice', tone !== 'neutral' && `jp-notice--${tone}`].filter(Boolean).join(' ')} role={tone === 'danger' ? 'alert' : 'status'}>
      <div>{children}</div>
    </div>
  );
}

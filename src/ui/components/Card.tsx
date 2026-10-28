import type { ReactNode } from 'react';

export interface CardProps {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, actions, children, className }: CardProps) {
  return (
    <section className={['jp-card', className].filter(Boolean).join(' ')}>
      {(title || actions) && (
        <header className="jp-card__header">
          {title && <h3 className="jp-card__title">{title}</h3>}
          {actions && <div className="jp-row">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

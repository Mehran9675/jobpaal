import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Optional back link, e.g. to the applications list. */
  back?: { href: string; label: string };
}

export function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <header className="jp-opt-header">
      {back && (
        <a className="jp-opt-header__back" href={back.href}>
          ← {back.label}
        </a>
      )}
      <div className="jp-opt-header__row">
        <div className="jp-stack" style={{ gap: 4, minWidth: 0 }}>
          <h1 className="jp-opt-header__title">{title}</h1>
          {description && <p className="jp-opt-header__desc">{description}</p>}
        </div>
        {actions && <div className="jp-row jp-row--wrap jp-opt-header__actions">{actions}</div>}
      </div>
    </header>
  );
}

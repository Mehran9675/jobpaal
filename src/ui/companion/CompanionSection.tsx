import type { ReactNode } from 'react';

export function CompanionSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="jp-companion-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="jp-companion-section__body">{children}</div>
    </details>
  );
}

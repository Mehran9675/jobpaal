import type { ReactNode } from 'react';

export interface SectionProps {
  title: ReactNode;
  aside?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Collapsible panel section. */
export function Section({ title, aside, defaultOpen = true, children }: SectionProps) {
  return (
    <details className="jp-ov-section" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {aside && <span className="jp-small jp-muted" style={{ marginLeft: 'auto' }}>{aside}</span>}
      </summary>
      <div className="jp-ov-section__body">{children}</div>
    </details>
  );
}

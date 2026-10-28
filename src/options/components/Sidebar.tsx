import { SECTIONS, type SectionId } from '../lib/routes';
import { Logo } from './Logo';

export interface SidebarProps {
  current: SectionId;
  /** True while the terms are not accepted: other sections show the gate. */
  locked: boolean;
}

export function Sidebar({ current, locked }: SidebarProps) {
  return (
    <aside className="jp-opt-sidebar">
      <a className="jp-opt-skip" href="#main" onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        Skip to content
      </a>
      <div className="jp-opt-brand">
        <Logo />
        <span className="jp-opt-brand__name">JobPaal</span>
      </div>
      <nav aria-label="Sections">
        <ul className="jp-opt-nav">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`jp-opt-nav__link${current === section.id ? ' is-active' : ''}${locked && section.id !== 'terms' ? ' is-locked' : ''}`}
                aria-current={current === section.id ? 'page' : undefined}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="jp-opt-sidebar__foot">Everything is stored locally in your browser.</p>
    </aside>
  );
}

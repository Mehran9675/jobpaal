import { useRef } from 'react';

export type EditTab = 'resume' | 'cover-letter' | 'answers';

const TABS: { id: EditTab; label: string }[] = [
  { id: 'resume', label: 'Resume' },
  { id: 'cover-letter', label: 'Cover letter' },
  { id: 'answers', label: 'Answers' },
];

export interface EditTabsProps {
  value: EditTab;
  onChange: (tab: EditTab) => void;
  counts?: Partial<Record<EditTab, number>>;
}

/** Accessible tab list (arrow keys move between tabs). */
export function EditTabs({ value, onChange, counts = {} }: EditTabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const focusTab = (index: number) => {
    const tab = TABS[(index + TABS.length) % TABS.length];
    onChange(tab.id);
    refs.current[tab.id]?.focus();
  };
  return (
    <div className="jp-opt-tabs" role="tablist" aria-label="Content to edit">
      {TABS.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => {
            refs.current[tab.id] = el;
          }}
          type="button"
          role="tab"
          id={`jp-edit-tab-${tab.id}`}
          aria-selected={value === tab.id}
          aria-controls={`jp-edit-panel-${tab.id}`}
          tabIndex={value === tab.id ? 0 : -1}
          className={`jp-opt-tabs__tab${value === tab.id ? ' is-active' : ''}`}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') focusTab(index + 1);
            if (e.key === 'ArrowLeft') focusTab(index - 1);
          }}
        >
          {tab.label}
          {counts[tab.id] !== undefined && <span className="jp-opt-tabs__count">{counts[tab.id]}</span>}
        </button>
      ))}
    </div>
  );
}

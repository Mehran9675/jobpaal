import { ALL_RESUME_SECTIONS, type ResumeSectionKey } from '@/shared/types';
import { Toggle } from '@/ui/components/Toggle';

export interface SectionOrderEditorProps {
  order: ResumeSectionKey[];
  hidden: ResumeSectionKey[];
  onChange: (order: ResumeSectionKey[], hidden: ResumeSectionKey[]) => void;
}

const LABELS: Record<ResumeSectionKey, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  languages: 'Languages',
  projects: 'Projects',
  awards: 'Awards',
};

/** Complete order: stored order first, then any section missing from it. */
function fullOrder(order: ResumeSectionKey[]): ResumeSectionKey[] {
  const known = order.filter((key) => ALL_RESUME_SECTIONS.includes(key));
  return [...new Set([...known, ...ALL_RESUME_SECTIONS])];
}

export function SectionOrderEditor({ order, hidden, onChange }: SectionOrderEditorProps) {
  const sections = fullOrder(order);
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next, hidden);
  };
  return (
    <div className="jp-stack">
      <p className="jp-small jp-muted">Order of sections on the resume. Hidden sections are left out of every file. The header is always first.</p>
      <ol className="jp-opt-order">
        {sections.map((key, index) => {
          const visible = !hidden.includes(key);
          return (
            <li key={key} className={visible ? undefined : 'is-hidden'}>
              <span className="jp-opt-order__pos" aria-hidden="true">
                {index + 1}
              </span>
              <span className="jp-strong" style={{ flex: 1 }}>
                {LABELS[key]}
              </span>
              <Toggle
                checked={visible}
                onChange={(on) => onChange(sections, on ? hidden.filter((h) => h !== key) : [...hidden, key])}
                label={<span className="jp-small">{visible ? 'Shown' : 'Hidden'}</span>}
                title={`Show ${LABELS[key]}`}
              />
              <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${LABELS[key]} up`}>
                ↑
              </button>
              <button
                type="button"
                className="jp-btn jp-btn--ghost jp-btn--sm"
                onClick={() => move(index, 1)}
                disabled={index === sections.length - 1}
                aria-label={`Move ${LABELS[key]} down`}
              >
                ↓
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

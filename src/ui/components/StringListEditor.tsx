import { useId, type ReactNode } from 'react';

export interface StringListEditorProps {
  label: ReactNode;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  /** Use multi-line text areas (for bullets). */
  multiline?: boolean;
  /** Show move up / down buttons. */
  reorder?: boolean;
  hint?: ReactNode;
}

/** Editable list of strings (highlights, bullets): add, remove and reorder. */
export function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
  addLabel = 'Add',
  multiline,
  reorder = true,
  hint,
}: StringListEditorProps) {
  const labelId = useId();
  const update = (index: number, value: string) => onChange(items.map((item, i) => (i === index ? value : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div className="jp-list-editor" role="group" aria-labelledby={labelId}>
      <span id={labelId} className="jp-field__label">
        {label}
      </span>
      {items.length > 0 && (
        <ol className="jp-list-editor__items">
          {items.map((item, index) => (
            <li key={index} className="jp-list-editor__item">
              {multiline ? (
                <textarea
                  className="jp-textarea jp-list-editor__input"
                  rows={2}
                  value={item}
                  placeholder={placeholder}
                  aria-label={`Item ${index + 1}`}
                  onChange={(e) => update(index, e.target.value)}
                />
              ) : (
                <input
                  className="jp-input jp-list-editor__input"
                  value={item}
                  placeholder={placeholder}
                  aria-label={`Item ${index + 1}`}
                  onChange={(e) => update(index, e.target.value)}
                />
              )}
              <div className="jp-list-editor__actions">
                {reorder && (
                  <>
                    <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move item ${index + 1} up`}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="jp-btn jp-btn--ghost jp-btn--sm"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label={`Move item ${index + 1} down`}
                    >
                      ↓
                    </button>
                  </>
                )}
                <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" onClick={() => remove(index)} aria-label={`Remove item ${index + 1}`}>
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {hint && <span className="jp-field__hint">{hint}</span>}
      <div>
        <button type="button" className="jp-btn jp-btn--sm" onClick={() => onChange([...items, ''])}>
          + {addLabel}
        </button>
      </div>
    </div>
  );
}

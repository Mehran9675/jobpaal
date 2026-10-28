import { useState, type ReactNode } from 'react';

export interface RepeatableListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  /** Creates a new, empty item. */
  create: () => T;
  /** Stable key for an item. */
  getKey: (item: T, index: number) => string;
  /** One-line title shown in the collapsed header. */
  getTitle: (item: T, index: number) => ReactNode;
  renderItem: (item: T, update: (next: T) => void, index: number) => ReactNode;
  addLabel: string;
  emptyText?: ReactNode;
  /** Name of one item, for accessible button labels (e.g. "role"). */
  itemNoun?: string;
}

/** A list of structured entries (experience, education…) with expand/collapse, reorder and remove. */
export function RepeatableList<T>({
  items,
  onChange,
  create,
  getKey,
  getTitle,
  renderItem,
  addLabel,
  emptyText,
  itemNoun = 'entry',
}: RepeatableListProps<T>) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const toggle = (key: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    const item = create();
    const next = [...items, item];
    onChange(next);
    setOpen((current) => new Set(current).add(getKey(item, next.length - 1)));
  };

  return (
    <div className="jp-repeatable">
      {items.length === 0 && emptyText && <p className="jp-small jp-faint">{emptyText}</p>}
      {items.map((item, index) => {
        const key = getKey(item, index);
        const expanded = open.has(key);
        return (
          <div key={key} className={`jp-repeatable__item${expanded ? ' is-open' : ''}`}>
            <div className="jp-repeatable__head">
              <button type="button" className="jp-repeatable__toggle" aria-expanded={expanded} onClick={() => toggle(key)}>
                <span className="jp-repeatable__chevron" aria-hidden="true">
                  {expanded ? '▾' : '▸'}
                </span>
                <span className="jp-ellipsis">{getTitle(item, index)}</span>
              </button>
              <div className="jp-row" style={{ gap: 2 }}>
                <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${itemNoun} up`}>
                  ↑
                </button>
                <button
                  type="button"
                  className="jp-btn jp-btn--ghost jp-btn--sm"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${itemNoun} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="jp-btn jp-btn--ghost jp-btn--sm jp-repeatable__remove"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                  aria-label={`Remove ${itemNoun}`}
                >
                  Remove
                </button>
              </div>
            </div>
            {expanded && (
              <div className="jp-repeatable__body">
                {renderItem(item, (next) => onChange(items.map((it, i) => (i === index ? next : it))), index)}
              </div>
            )}
          </div>
        );
      })}
      <div>
        <button type="button" className="jp-btn jp-btn--sm" onClick={add}>
          + {addLabel}
        </button>
      </div>
    </div>
  );
}

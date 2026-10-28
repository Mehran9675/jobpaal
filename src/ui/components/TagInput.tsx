import { useId, useState, type ReactNode } from 'react';

export interface TagInputProps {
  label: ReactNode;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hint?: ReactNode;
}

/** Chip list with a text input: Enter or comma adds, ✕ or Backspace on empty input removes. */
export function TagInput({ label, values, onChange, placeholder = 'Type and press Enter', hint }: TagInputProps) {
  const [draft, setDraft] = useState('');
  const inputId = useId();

  const commit = (raw: string) => {
    const parts = raw
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const existing = new Set(values.map((v) => v.toLowerCase()));
    const added = parts.filter((p) => {
      const key = p.toLowerCase();
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    if (added.length) onChange([...values, ...added]);
    setDraft('');
  };

  return (
    <div className="jp-field">
      <label className="jp-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="jp-tag-input">
        {values.map((value) => (
          <span key={value} className="jp-chip jp-tag-input__tag">
            {value}
            <button type="button" className="jp-tag-input__remove" onClick={() => onChange(values.filter((v) => v !== value))} aria-label={`Remove ${value}`}>
              ✕
            </button>
          </span>
        ))}
        <input
          id={inputId}
          className="jp-tag-input__input"
          value={draft}
          placeholder={values.length ? '' : placeholder}
          onChange={(e) => {
            const next = e.target.value;
            if (next.includes(',')) commit(next);
            else setDraft(next);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit(draft);
            } else if (e.key === 'Backspace' && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (/[,\n]/.test(text)) {
              e.preventDefault();
              commit(draft + text);
            }
          }}
        />
      </div>
      {hint && <span className="jp-field__hint">{hint}</span>}
    </div>
  );
}

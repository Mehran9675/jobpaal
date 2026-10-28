import type { ReactNode } from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T extends string> {
  label?: ReactNode;
  hint?: ReactNode;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SelectField<T extends string>({ label, hint, value, options, onChange, disabled, className }: SelectFieldProps<T>) {
  return (
    <label className={['jp-field', className].filter(Boolean).join(' ')}>
      {label && <span className="jp-field__label">{label}</span>}
      <select className="jp-select" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <span className="jp-field__hint">{hint}</span>}
    </label>
  );
}

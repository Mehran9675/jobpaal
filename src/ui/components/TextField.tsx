import type { InputHTMLAttributes, ReactNode } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: ReactNode;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
}

export function TextField({ label, hint, value, onChange, className, ...rest }: TextFieldProps) {
  return (
    <label className={['jp-field', className].filter(Boolean).join(' ')}>
      {label && <span className="jp-field__label">{label}</span>}
      <input className="jp-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint && <span className="jp-field__hint">{hint}</span>}
    </label>
  );
}

import type { ReactNode, TextareaHTMLAttributes } from 'react';

export interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label?: ReactNode;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
}

export function TextAreaField({ label, hint, value, onChange, className, rows = 4, ...rest }: TextAreaFieldProps) {
  return (
    <label className={['jp-field', className].filter(Boolean).join(' ')}>
      {label && <span className="jp-field__label">{label}</span>}
      <textarea className="jp-textarea" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint && <span className="jp-field__hint">{hint}</span>}
    </label>
  );
}

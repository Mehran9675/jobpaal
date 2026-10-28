import type { ReactNode } from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  title?: string;
}

export function Toggle({ checked, onChange, label, disabled, title }: ToggleProps) {
  return (
    <label className="jp-toggle" title={title}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="jp-toggle__track" aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
}

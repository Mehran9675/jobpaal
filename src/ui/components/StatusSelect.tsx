import { APPLICATION_STATUSES, type ApplicationStatus } from '@/shared/types';

export interface StatusSelectProps {
  value: ApplicationStatus;
  onChange: (status: ApplicationStatus, label: string) => void;
  disabled?: boolean;
  /** Visible label; when omitted an accessible label is still provided. */
  label?: string;
}

export function StatusSelect({ value, onChange, disabled, label }: StatusSelectProps) {
  return (
    <label className="jp-field jp-status-select">
      {label ? <span className="jp-field__label">{label}</span> : <span className="jp-sr-only">Application status</span>}
      <select
        className="jp-select"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const status = e.target.value as ApplicationStatus;
          const entry = APPLICATION_STATUSES.find((s) => s.id === status);
          onChange(status, entry?.label ?? status);
        }}
      >
        {APPLICATION_STATUSES.map((status) => (
          <option key={status.id} value={status.id}>
            {status.label}
          </option>
        ))}
      </select>
    </label>
  );
}

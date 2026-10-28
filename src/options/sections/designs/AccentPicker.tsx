import { useId } from 'react';
import { ACCENT_PRESETS } from '@/shared/documents';

export interface AccentPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  const customId = useId();
  const presets = ACCENT_PRESETS ?? [];
  const isPreset = presets.some((c) => c.toLowerCase() === value.toLowerCase());
  return (
    <div className="jp-field">
      <span className="jp-field__label">Accent colour</span>
      <div className="jp-row jp-row--wrap" role="radiogroup" aria-label="Accent colour presets">
        {presets.map((color) => {
          const selected = color.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Accent ${color}`}
              className={`jp-opt-swatch${selected ? ' is-selected' : ''}`}
              style={{ background: color }}
              onClick={() => onChange(color)}
            />
          );
        })}
        <label htmlFor={customId} className={`jp-opt-swatch-custom${!isPreset ? ' is-selected' : ''}`}>
          <input id={customId} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#2563eb'} onChange={(e) => onChange(e.target.value)} />
          <span className="jp-small">Custom</span>
        </label>
        <code className="jp-small jp-muted">{value}</code>
      </div>
    </div>
  );
}

import { TEMPLATES } from '@/shared/documents';
import type { TemplateId } from '@/shared/types';

export interface TemplatePickerProps {
  value: TemplateId;
  onChange: (value: TemplateId) => void;
}

export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  return (
    <div className="jp-opt-choices" role="radiogroup" aria-label="Resume template">
      {(TEMPLATES ?? []).map((template) => (
        <label key={template.id} className={`jp-opt-choice${value === template.id ? ' is-selected' : ''}`}>
          <input type="radio" name="jp-template" value={template.id} checked={value === template.id} onChange={() => onChange(template.id)} />
          <span className="jp-strong">{template.name}</span>
          <span className="jp-small jp-muted">{template.description}</span>
        </label>
      ))}
    </div>
  );
}
